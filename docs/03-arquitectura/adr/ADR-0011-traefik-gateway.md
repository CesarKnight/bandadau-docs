# ADR-0011 — Traefik como API gateway

- **Estado:** Aceptada
- **Fecha:** 2026-10-14
- **Decisores:** Equipo Grupo 24 (Ing. Software II)

## Contexto

Se necesita un punto de entrada único con enrutamiento por host y prefijo, CORS, rate limit, TLS en
producción y bloqueo de `/internal/**`, funcionando igual en local (Docker Compose) y en el EC2.

## Decisión

**Traefik v3** con proveedor Docker (labels) y archivo de rutas dinámico; dominios
`*.bandada.localhost` en local y `*.<BASE_DOMAIN>` con Let's Encrypt en producción.

## Alternativas consideradas

| Alternativa | Motivo de descarte |
|---|---|
| Nginx (usado en Homy) | Conocido, pero configuración manual por servicio y sin descubrimiento Docker. |
| Kong / API Gateway de AWS | Más funciones pero más pesado o con costo y sin paridad local. |
| Spring Cloud Gateway | Otro servicio Java que mantener. |

## Consecuencias

- (+) Descubrimiento automático, middlewares declarativos, dashboard.
- (+) Misma configuración en local y demo.
- (−) Reglas en labels dispersas: se centralizan en `bandadau-infra/traefik/dynamic/`.

## Referencias

`catalogo-servicios.md` §4, `seguridad-y-sso.md`
