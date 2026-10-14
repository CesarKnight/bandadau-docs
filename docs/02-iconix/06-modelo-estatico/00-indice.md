# Modelo estático (diseño) — índice

Artefacto de la fase de **Diseño detallado** de ICONIX: diagramas de clases de diseño (con
atributos tipados y métodos principales) y modelo persistente por bounded context. Parte del
modelo de dominio (`../02-modelo-dominio.md`) y se refina con cada diagrama de secuencia: si una
secuencia necesita una clase o método que no está aquí, se agrega aquí **y** en el UC.

| Archivo | Contexto | Servicio | Arquitectura | Persistencia |
|---|---|---|---|---|
| `identidad.md` | Identidad y acceso | identity-service (Java/Spring) | Hexagonal | PostgreSQL `identity_db` |
| `social.md` | Red social | social-service (NestJS) | Clean | MongoDB `social` |
| `media.md` | Multimedia + ML/DL | media-service (NestJS) | Clean | MongoDB `media` + S3 |
| `eventos.md` | Eventos + SAGA | events-service (Java/Spring) | DDD táctico | PostgreSQL `events_db` |
| `billetera.md` | Billetera | wallet-service (Laravel) | Hexagonal | PostgreSQL `wallet_db` |
| `entradas.md` | Entradas | ticketing-service (NestJS) | Clean | DynamoDB `bandada-ticketing` |
| `notificaciones.md` | Notificaciones | notification-service (Laravel) | Clean | DynamoDB `bandada-notifications` |
| `insights.md` | Agentes, reportes, MCP | insights-service (NestJS) | Clean | DynamoDB `bandada-insights` + S3 |

`admin-gateway` no tiene modelo persistente (BFF sin estado); su esquema es
`bandadau-docs/contracts/graphql/admin.graphql`.

## 1. Convenciones de los diagramas

- Tipos: Java (`UUID`, `Instant`, `long`), TypeScript (`string`, `Date`, `number`), PHP (`string`,
  `int`, `DateTimeImmutable`). Créditos siempre enteros (`long` / `number` entero / `int`).
- Estereotipos: `<<AggregateRoot>>`, `<<Entity>>`, `<<ValueObject>>`, `<<UseCase>>`,
  `<<Port>>` (interfaz de salida), `<<Adapter>>`, `<<DomainEvent>>`, `<<Gateway>>` (Clean).
- Solo se dibujan los métodos públicos principales; getters/setters se omiten.
- Paquetes según la guía de cada arquitectura (`bandadau-docs/docs/04-patrones-y-reglas/`): el dominio **no**
  depende de frameworks; las flechas de dependencia apuntan hacia el dominio.
- Referencias a otros contextos: **solo por ID** (`userId: UUID`), nunca por objeto.

## 2. Piezas transversales (presentes en todos los servicios)

| Pieza | PostgreSQL | MongoDB | DynamoDB |
|---|---|---|---|
| Outbox | Tabla `outbox` (DDL en `saga-inscripcion-evento.md` §5, idéntica en los 3 servicios) | Colección `outbox` (`eventos-y-mensajeria.md` §5.2) | Ítem `pk = OUTBOX#<id>`, `sk = META`, `gsi1pk = OUTBOX#PENDING` (`eventos-y-mensajeria.md` §5.3) |
| Inbox | Tabla `processed_messages(message_id PK, consumer, processed_at)` | Colección `processedMessages` (`_id = messageId`) | Ítem `pk = INBOX#<messageId>`, `sk = META` (`idempotencia.md` §3.3) |
| Idempotency-Key HTTP | Tabla DynamoDB compartida `bandada-idempotency` (`pk = <service>#<key>`, TTL 24 h) | ídem | ídem |

Diseño de `bandada-idempotency` (D3): `pk` (S) = `<service>#<idempotencyKey>`; atributos
`requestHash` (S), `status` (`IN_PROGRESS` \| `COMPLETED`), `responseStatus` (N),
`responseBody` (S, JSON), `createdAt` (S ISO), `expiresAt` (N epoch, TTL). Escritura con
`attribute_not_exists(pk)`.

## 3. Propuestas pendientes (a resolver por ADR / dueños)

| # | Propuesta | Archivos afectados |
|---|---|---|
| P-1 | Catálogo §6: agregar **GSI1** (`gsi1pk`/`gsi1sk`, sobrecargado) a `bandada-insights` y `bandada-notifications` (outbox pendiente y listados) | `catalogo-servicios.md`, `insights.md`, `notificaciones.md` |
| P-2 | Catálogo §6: documentar los ítems técnicos `INBOX#…`, `OUTBOX#…` y el centinela `REG#<registrationId>`/`LOCK` en las tablas DynamoDB | `catalogo-servicios.md` |
| P-3 | Unificar el nombre del ítem de inbox DynamoDB: `idempotencia.md` usa `INBOX#<id>`/`META`, `bandadau-backend/services/ticketing-service/AGENTS.md` y `notification-service/AGENTS.md` usan `MSG#<id>`, UC-24 usa `sk = INBOX`. Este modelo adopta **`INBOX#<id>` / `META`** | AGENTS de ticketing y notification, UC-24 |
| P-4 | TTL para ítems `INBOX#` (14 días) en `bandada-ticketing` (hoy "—" en el catálogo) para que la tabla no crezca sin límite | `catalogo-servicios.md` |
