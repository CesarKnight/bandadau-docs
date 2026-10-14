# ADR-0005 — Respuestas sin envoltorio y errores RFC 9457

- **Estado:** Aceptada
- **Fecha:** 2026-10-14
- **Decisores:** Equipo Grupo 24 (Ing. Software II)

## Contexto

En Homy todas las respuestas iban envueltas en `{ success, data, timestamp }` con excepciones, lo que
complicó tipos generados y clientes. Con 9 servicios en 3 lenguajes se necesita un formato de error
uniforme y estándar.

## Decisión

La respuesta exitosa **es el recurso**; listas `{ items, nextCursor }`. Errores en **Problem Details
(RFC 9457)** `application/problem+json` con `type`, `title`, `status`, `detail`, `instance` y extensión
`code` estable (base para i18n, ADR-0015).

## Alternativas consideradas

| Alternativa | Motivo de descarte |
|---|---|
| Envoltorio `{success,data}` (Homy) | Duplica el código HTTP y ensucia OpenAPI. |
| Formato de error propio por servicio | Clientes con N parsers. |

## Consecuencias

- (+) OpenAPI y tipos generados limpios; los códigos HTTP significan algo.
- (+) Librerías existentes en Spring, Laravel y NestJS.
- (−) Hay que migrar hábitos/código copiado de Homy.

## Referencias

`catalogo-servicios.md` §8, `api-rest-guidelines.md`
