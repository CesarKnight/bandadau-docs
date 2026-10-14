# ADR-0003 — SAGA orquestada para la inscripción

- **Estado:** Aceptada
- **Fecha:** 2026-10-14
- **Decisores:** Equipo Grupo 24 (Ing. Software II)

## Contexto

La inscripción pagada (C1) atraviesa `events-service` (cupo), `wallet-service` (débito) y
`ticketing-service` (ticket) en 3 lenguajes y 2 motores; no existe transacción distribuida y se exige
rollback visible.

## Decisión

**SAGA orquestada** por `events-service` (`RegistrationSagaOrchestrator`, estado en `saga_instances`),
con comandos y respuestas por RabbitMQ, outbox/inbox, timeout de 30 s por paso, 3 reintentos y
compensaciones (`void-ticket`, `refund-credits`, liberar cupo). Detalle en D2.

## Alternativas consideradas

| Alternativa | Motivo de descarte |
|---|---|
| Coreografía (cada servicio reacciona a eventos) | Menos acoplamiento central, pero flujo difícil de seguir, depurar y demostrar. |
| 2PC / XA | No soportado entre Postgres, DynamoDB y 3 runtimes; bloqueante. |

## Consecuencias

- (+) Estado explícito y consultable (`listSagas`), fácil de demostrar y de monitorear.
- (+) Compensaciones centralizadas y probadas.
- (−) `events-service` conoce los comandos de wallet y ticketing (Customer/Supplier).
- (−) Consistencia eventual: el cliente hace *polling* (`202` + `getRegistration`).

## Referencias

D2, `saga-inscripcion-evento.md`
