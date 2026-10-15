# ADR-0018 — Decisiones de implementación de la fase 1

- **Estado:** Aceptada
- **Fecha:** 2026-10-15
- **Decisiones relacionadas:** [ADR-0016](ADR-0016-consolidacion-diseno-detallado.md), [ADR-0017](ADR-0017-multi-repo-por-capa.md); catálogo §3 (infraestructura de datos), `seguridad-y-sso.md` §8, `idempotencia.md`

## Contexto

La fase 1 (núcleo "clásico": identity, social, media, events, wallet, ticketing, notification, admin-gateway, panel y landing)
se implementó y verificó con `make smoke` (26/26). Al implementar se tomaron decisiones técnicas que el diseño dejaba abiertas
o que contradicen detalles de los documentos. Este ADR las registra para que la documentación describa lo que existe
(el código que funciona es la referencia de hecho) y para poder cambiar `catalogo-servicios.md` con ADR previo (regla 10 del workspace).

## Decisión

| # | Tema | Decisión | Documento afectado |
|---|---|---|---|
| 1 | Persistencia en Java | **`JdbcClient`** (Spring) con SQL explícito y Flyway, en lugar de JPA/Hibernate, en identity-service y events-service. El dominio sigue sin importar frameworks; los repositorios son adaptadores | `ddd.md`, `arquitectura-hexagonal.md` |
| 2 | MongoDB en Node | **Driver nativo** `mongodb` (sin Mongoose). La unidad de trabajo es una transacción Mongo cuya sesión viaja por `AsyncLocalStorage` | `clean-architecture.md` |
| 3 | Idempotencia HTTP en Java | Los servicios Java guardan las claves en **su propio PostgreSQL** (`idempotency_keys` en `identity_db` / `events_db`) en vez de la tabla DynamoDB `bandada-idempotency`; mismo protocolo (hash de la petición, `IDEMPOTENCY_KEY_REUSED`, `IDEMPOTENCY_IN_PROGRESS`, `Idempotent-Replayed`, 24 h). Node y PHP siguen usando DynamoDB | `idempotencia.md` §2 |
| 4 | Proyectos Node independientes | Cada servicio/app Node es un **proyecto pnpm independiente, sin workspace en la raíz**; `@bandada/*` se instala como dependencia local hermana (`file:../bandadau-shared/packages/…`) y se construye antes (`pnpm build` en `bandadau-shared`). El `Dockerfile` recibe `--build-context shared=../bandadau-shared` | ADR-0017 (reglas 3 y 4), `bandadau-backend/AGENTS.md` |
| 5 | Gestor de paquetes | **`pnpm@10.34.7` vía corepack** (`corepack pnpm …`), fijado en `packageManager` | `convenciones-generales.md` |
| 6 | MongoDB | Imagen fijada **`mongo:8.0.19`** (replica set `rs0` de 1 nodo): las versiones posteriores fallan con el kernel de Docker Desktop (SERVER-121912) | catálogo §3 |
| 7 | MinIO | Imagen **`pgsty/minio`** (fork comunitario mantenido de MinIO) en lugar de `minio/minio` | catálogo §3, `infraestructura.md` |
| 8 | CORS en Traefik | El middleware CORS usa **orígenes explícitos con credenciales** (`Access-Control-Allow-Credentials: true`, nunca `*`) y permite la cabecera `X-Bandada-Client`; los servicios no emiten CORS (los orígenes se parametrizan con `BASE_DOMAIN`) | `seguridad-y-sso.md` §8 |
| 9 | Cliente GraphQL del panel | **urql con método POST** (no GET): Apollo Server 5 rechaza GET sin cabecera de prevención de CSRF | `graphql-admin.md` |
| 10 | Refresh token web/admin | Cookie `HttpOnly` (`bandada_rt` / `bandada_admin_rt`, `Path=/api/v1/auth`) y cabecera `X-Bandada-Client`; el refresh no va en el cuerpo en `web`/`admin` | `seguridad-y-sso.md` §5, OpenAPI identity 1.2.0 |
| 11 | Claims JWT | `typ=user\|service`, `aud=bandada-app\|bandada-admin\|bandada-internal`; token de servicio con `sub`=`client_id`. En `/internal/**` se valida `typ` y `aud`; **los scopes no se exigen en la fase 1** (deuda) | `seguridad-y-sso.md` §2 |
| 12 | Límites de entrega RabbitMQ | `x-delivery-limit: 10` y reintentos 5 s / 30 s / 5 min con colas de espera; AsyncAPI 1.2.0 | `eventos-y-mensajeria.md` |
| 13 | Comando `issue-ticket` | Agrega `organizerId`, `staffUserIds`, `eventEndsAt` para que ticketing autorice la validación en puerta (UC-14) | AsyncAPI 1.2.0 |
| 14 | Fin del evento | `endsAt` opcional al crear; por defecto `startsAt + 2 h` (`EVENT_DEFAULT_DURATION`) | OpenAPI events 1.2.0 |
| 15 | Workers Laravel | PHP-FPM + procesos `artisan` dedicados (`wallet:consume-commands`, `wallet:relay-outbox`, `notifications:consume`, `notifications:relay-outbox`) como contenedores extra con la misma imagen | `infraestructura.md` |

## Consecuencias

- Los contratos y documentos se alinearon con lo implementado (ver `registro-de-sesiones.md`, sesión de consolidación del 2026-10-15).
- Lo que el código no cumple del diseño (scopes en `/internal`, `endsAt` en la API, `avatarStatus`, etc.) queda en `docs/06-plan/deuda-tecnica.md`.
- `catalogo-servicios.md` se actualizó solo en: versión fijada de MongoDB e imagen de MinIO (tabla de infraestructura de datos).
- Para la fase 2 se mantienen las mismas decisiones (Node sin workspace, pnpm por corepack, CORS con credenciales).
