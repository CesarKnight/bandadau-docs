# Modelo estático — Entradas (`ticketing-service`)

TypeScript + NestJS 11 · **Clean Architecture** · DynamoDB `bandada-ticketing` (tabla única).
UCs: UC-12 (emitir), UC-13 (anular), UC-14 (validar). Participante de la SAGA (D2).
QR: JWS compacto **ES256** verificable sin conexión (UC-14).

## 1. Clases de diseño

```mermaid
classDiagram
    direction LR
    namespace entities {
        class Ticket {
            <<Entity>>
            +id: string
            +registrationId: string
            +eventId: string
            +userId: string
            +status: TicketStatus
            +qrPayload: string
            +issuedAt: Date
            +usedAt: Date
            +usedBy: string
            +voidedAt: Date
            +issue(cmd: IssueTicketData, signer: QrSigner)$ Ticket
            +use(by: string, now: Date) void
            +void(now: Date) void
        }
        class QrClaims {
            <<ValueObject>>
            +tid: string
            +eid: string
            +kid: string
            +iat: number
        }
        class TicketStatus {
            <<enumeration>>
            ISSUED
            USED
            VOIDED
        }
    }
    namespace use_cases {
        class IssueTicketUseCase {
            <<UseCase>>
            +execute(cmd: CloudEvent~IssueTicketV1~) void
        }
        class VoidTicketUseCase {
            <<UseCase>>
            +execute(cmd: CloudEvent~VoidTicketV1~) void
        }
        class ValidateTicketUseCase {
            <<UseCase>>
            +execute(qrPayload: string, doorkeeperId: string) ValidationResult
        }
        class ListMyTicketsUseCase {
            <<UseCase>>
            +execute(userId, cursor) Page~TicketView~
        }
        class GetTicketUseCase {
            <<UseCase>>
            +execute(ticketId, userId) TicketView
        }
    }
    namespace ports {
        class TicketRepository {
            <<Port>>
            +issueAtomically(t: Ticket, inboxId: string, outbox: CloudEvent) IssueOutcome
            +findById(id) Ticket
            +findByRegistration(regId) Ticket
            +markUsed(id, by, now) void
            +voidAtomically(id, inboxId, outbox) void
            +listByUser(userId, cursor) Page
        }
        class QrSigner {
            <<Port>>
            +sign(c: QrClaims) string
            +verify(jws: string) QrClaims
        }
        class EventsDirectory {
            <<Port>>
            +isOrganizer(eventId, userId) boolean
        }
        class ChaosPolicy {
            <<Port>>
            +shouldFailIssue() boolean
        }
    }
    namespace interface_adapters {
        class TicketsController {
            <<Adapter>>
        }
        class TicketingCommandsConsumer {
            <<Adapter>>
        }
        class DynamoTicketRepository {
            <<Gateway>>
        }
        class JoseEs256QrSigner {
            <<Gateway>>
        }
        class HttpEventsDirectory {
            <<Gateway>>
        }
    }

    Ticket ..> QrClaims
    TicketingCommandsConsumer ..> IssueTicketUseCase
    TicketingCommandsConsumer ..> VoidTicketUseCase
    TicketsController ..> ValidateTicketUseCase
    IssueTicketUseCase ..> TicketRepository
    IssueTicketUseCase ..> QrSigner
    IssueTicketUseCase ..> ChaosPolicy
    ValidateTicketUseCase ..> EventsDirectory
    DynamoTicketRepository ..|> TicketRepository
    JoseEs256QrSigner ..|> QrSigner
    HttpEventsDirectory ..|> EventsDirectory
```

- `IssueTicketUseCase`: con `CHAOS_TICKETING_FAIL=true` responde `ticket-issue-failed` (demo C1).
  Si la transacción falla por el centinela `REG#…` (ya emitido) → re-publica `ticket-issued`
  con el ticket existente.
- `ValidateTicketUseCase`: verifica firma y `kid`, comprueba organizador (`EventsDirectory`, caché
  corta) y hace `UpdateItem … ConditionExpression status = ISSUED` → `USED`; si falla la condición
  → `409 TICKET_ALREADY_USED` / `TICKET_VOIDED`. Publica `bandada.ticketing.ticket.used.v1`.

## 2. Modelo persistente (`bandada-ticketing`)

Claves `pk`/`sk` (S); GSI1 (`gsi1pk`, `gsi1sk`) y GSI2 (`gsi2pk`, `gsi2sk`) con proyección `ALL`.
On-demand. Sin TTL (ver propuesta P-4 en `00-indice.md`).

| Ítem | `pk` | `sk` | `gsi1pk` / `gsi1sk` | `gsi2pk` / `gsi2sk` | Atributos |
|---|---|---|---|---|---|
| Ticket | `TICKET#<ticketId>` | `META` | `USER#<userId>` / `EVENT#<eventId>#<issuedAt>` | `REG#<registrationId>` / `TICKET` | `ticketId`, `registrationId`, `eventId`, `userId`, `status`, `qrPayload`, `kid`, `issuedAt`, `usedAt`, `usedBy`, `voidedAt`, `sagaId` |
| Centinela 1 ticket/inscripción | `REG#<registrationId>` | `LOCK` | — | — | `ticketId`, `createdAt` |
| Inbox | `INBOX#<messageId>` | `META` | — | — | `consumer`, `processedAt` |
| Outbox | `OUTBOX#<cloudEventId>` | `META` | `OUTBOX#PENDING` / `<createdAt>#<id>` | — | `exchange`, `routingKey`, `payload`, `headers`, `attempts`, `leaseUntil` |

Patrones de acceso:

| Acceso | Operación |
|---|---|
| `getTicket` | `GetItem pk=TICKET#id, sk=META` (+ comprobar `userId` = sub) |
| `listMyTickets` | `Query GSI1 gsi1pk=USER#<userId>` (orden por `gsi1sk`) |
| Tickets de un evento | No es un acceso de los UCs actuales; si se necesitara (lista de asistentes), agregar GSI3 `EVENT#<eventId>` vía ADR |
| Ticket de una inscripción (`void-ticket`) | `Query GSI2 gsi2pk=REG#<registrationId>` |
| Emitir | `TransactWriteItems`: Put `INBOX#` (cond. `attribute_not_exists`), Put `REG#…/LOCK` (cond.), Put `TICKET#…`, Put `OUTBOX#…` |
| Anular | `TransactWriteItems`: Put `INBOX#`, Update `TICKET#` `status=VOIDED` (cond. `status <> USED`), Put `OUTBOX#` |
| Validar | `UpdateItem TICKET#` cond. `status = ISSUED` + Put `OUTBOX#` (transacción) |
