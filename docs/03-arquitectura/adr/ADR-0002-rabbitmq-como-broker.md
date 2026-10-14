# ADR-0002 — RabbitMQ como broker de mensajes

- **Estado:** Aceptada
- **Fecha:** 2026-10-14
- **Decisores:** Equipo Grupo 24 (Ing. Software II)

## Contexto

Necesitamos pub/sub de eventos de dominio, comandos dirigidos para la SAGA, DLQ y un disparador para
n8n. El presupuesto de demo es ≤ USD 60/mes (RNF-18) y todo debe levantar local con `make up`.

## Decisión

**RabbitMQ 4** con tres exchanges *topic*: `bandada.events`, `bandada.commands`, `bandada.dlx`;
una cola durable por servicio consumidor; sobre CloudEvents 1.0 (ADR-0004). Corre en el EC2 de la demo.

## Alternativas consideradas

| Alternativa | Motivo de descarte |
|---|---|
| Apache Kafka | Log reproducible, pero pesado para 1 host y sobredimensionado para el volumen. |
| Amazon SQS/SNS | Gestionado, pero sin equivalente local fiel y ata la arquitectura a AWS. |
| Redis Streams | Ligero, pero sin enrutamiento por topic ni DLX nativos; n8n tiene nodo RabbitMQ. |

## Consecuencias

- (+) Enrutamiento por routing key, DLX, consola de gestión, cliente en Java, PHP y TS.
- (+) n8n consume directamente con su RabbitMQ Trigger.
- (−) Sin replay de eventos: la reconstrucción de proyecciones requiere endpoints o reemisión.
- (−) Un solo nodo en la demo (punto único de falla aceptado).

## Referencias

`catalogo-servicios.md` §5, `eventos-y-mensajeria.md`
