# ADR-0019 — Rate limit distribuido de identity en PostgreSQL (Redis/ElastiCache diferido)

- **Estado:** Aceptada
- **Fecha:** 2026-10-15
- **Decisiones relacionadas:** [ADR-0011](ADR-0011-traefik-gateway.md), [ADR-0012](ADR-0012-infra-aws-ec2-compose.md); `seguridad-y-sso.md` §8; deuda D-16

## Contexto

`identity-service` limita por IP los endpoints sensibles (`login`, `register`, `verify-email`, `resend-code`, `refresh`,
`handoff/exchange`, `service-token`) y por correo/usuario `resend-code` y `handoff`. La implementación inicial era un mapa en
memoria **por instancia**: con N réplicas el límite efectivo es N veces mayor y se reinicia con cada despliegue. Traefik también
limita por instancia. El stack no tiene Redis; añadirlo (o ElastiCache en AWS) implica un componente más que operar, pagar y
monitorear para un servicio que, en el despliegue de ADR-0012 (un EC2 con Compose), corre en una o dos réplicas.

## Decisión

1. El limitador es un **puerto** (`RateLimitPort.check(key, max, window)`, hexagonal) con dos adaptadores seleccionados por `RATE_LIMIT_STORE`:
   - `postgres` (**por defecto**): ventana fija en la tabla `rate_limit_windows` (`limit_key` PK, `window_start`, `hits`, `expires_at`)
     de `identity_db`, actualizada con un único `INSERT … ON CONFLICT DO UPDATE … RETURNING` atómico que usa `clock_timestamp()` de la
     base (las réplicas nunca discrepan por desfase de reloj). Un job purga filas vencidas cada 5 min. Si la base no responde, **falla abierto**
     (registra un aviso): la disponibilidad del login pesa más que el límite y Traefik sigue limitando en el borde.
   - `memory`: el limitador original por instancia; se usa en pruebas unitarias y con `RATE_LIMIT_ENABLED=false`.
2. No se introduce infraestructura nueva: respeta «una base por servicio» (la tabla vive en `identity_db`).
3. Coste: una escritura por petición limitada (solo rutas de autenticación, ≤ 60/min por IP). Aceptable con el pool actual de 10 conexiones.

## Alternativas

| Opción | Pros | Contras |
|---|---|---|
| Redis / ElastiCache (`INCR` + `EXPIRE`, o `redis-cell`) | Más rápido, ventana deslizante, sin carga en la BD | Nuevo componente (Compose + AWS), nuevo secreto y punto de fallo; no justificado a 1–2 réplicas |
| Solo Traefik (`ratelimit` middleware) | Ya existe | También por instancia; sin clave por correo/usuario |
| Mantener memoria | Sin cambios | No cumple D-16 |

## Consecuencias

- Con varias réplicas el límite es global; sin cambiar el contrato (`429 RATE_LIMITED` + `Retry-After`).
- Ventana **fija** (permite ráfagas de hasta 2× en el cambio de ventana); suficiente para anti fuerza bruta junto con el bloqueo por cuenta del login.
- Si el tráfico crece, basta un nuevo adaptador `RedisRateLimiter` detrás del mismo puerto (ElastiCache en AWS) y `RATE_LIMIT_STORE=redis`; no cambia el dominio ni los casos de uso.
- Otros servicios con rate limit propio (p. ej. `/mcp` en insights) no se cubren aquí.
