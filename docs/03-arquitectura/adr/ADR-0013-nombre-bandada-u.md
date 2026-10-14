# ADR-0013 — Nombre del producto: Bandada U

- **Estado:** Aceptada
- **Fecha:** 2026-10-14
- **Decisores:** Equipo Grupo 24 (Ing. Software II)

## Contexto

El nombre de trabajo "Nexo" coincidía con una fintech conocida. El nombre aparece en dominios,
paquetes, exchanges, tablas y bundle ids, por lo que cambiarlo tarde es costoso.

## Decisión

Nombre comercial **Bandada U**; slug técnico `bandada` (exchanges `bandada.*`, tablas `bandada-*`,
paquetes `@bandada/*`, namespaces `com.bandadau.*`, `Bandada\*`); dominio `bandadau.com` vía
`BASE_DOMAIN`; bundle `com.bandadau.app`; scheme `bandadau://`.

## Alternativas consideradas

| Alternativa | Motivo de descarte |
|---|---|
| Nexo | Conflicto de marca. |
| Nombres genéricos (UniRed, CampusNet) | Poco distintivos y dominios ocupados. |

## Consecuencias

- (+) Identidad local (parabas) y comunidad.
- (+) Slug corto y consistente en todo el código.
- (−) Dos formas (`bandada` en código, `bandadau` en dominio/bundle) que hay que respetar.

## Referencias

`01-vision/marca-y-dominio.md`
