# ADR-0004 — CloudEvents + Transactional Outbox + Inbox

- **Estado:** Aceptada
- **Fecha:** 2026-10-14
- **Decisores:** Equipo Grupo 24 (Ing. Software II)

## Contexto

Publicar un evento después de commitear puede perderse (doble escritura); RabbitMQ entrega
*at-least-once*; los servicios están en 3 lenguajes y necesitan un sobre común con trazabilidad.

## Decisión

Sobre **CloudEvents 1.0 JSON** con extensiones `correlationid`, `causationid`, `sagaid`, `traceparent`.
Todo publicador usa **outbox** en su propia base (Postgres, Mongo, DynamoDB) escrita en la misma
transacción que el cambio; todo consumidor usa **inbox** (`processed_messages`) en la misma transacción
que el efecto.

## Alternativas consideradas

| Alternativa | Motivo de descarte |
|---|---|
| Publicar directo tras commit | Pierde eventos ante caídas. |
| CDC (Debezium) | Robusto, pero infraestructura extra por motor (3 motores). |
| Sobre propio | Sin herramientas ni semántica estándar. |

## Consecuencias

- (+) Ningún evento se pierde ni se procesa dos veces con efecto.
- (+) Contratos AsyncAPI uniformes y trazas de punta a punta.
- (−) Poller de outbox por servicio y tablas extra.
- (−) Latencia adicional de publicación (≈ 0.5 s).

## Referencias

D3, D12, `eventos-y-mensajeria.md`, `idempotencia.md`
