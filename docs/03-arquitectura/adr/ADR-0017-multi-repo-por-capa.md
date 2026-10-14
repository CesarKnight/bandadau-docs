# ADR-0017 — Repositorios por capa (estilo Homy)

- **Estado:** Aceptada (reemplaza a [ADR-0001](ADR-0001-monorepo.md))
- **Fecha:** 2026-10-14
- **Decisiones relacionadas:** `arquitectura-general.md` §6, `convenciones-generales.md` §3, `infraestructura.md` §5

## Contexto

El equipo pidió un repositorio por elemento (`bandadau-frontend`, `bandadau-backend`, …), igual que
en Homy, para repartir permisos, historial y CI por área. La entrega es el **martes 10 de noviembre
de 2026**, así que se necesitan pocos repos y un toolchain simple.

## Decisión

Un **workspace** `parcial-II/` (carpeta local, **no** es repositorio) con 8 repositorios git
hermanos:

| Repositorio | Contenido | Toolchain |
|---|---|---|
| `bandadau-docs` | `docs/` (ICONIX, arquitectura, reglas, plan) + `contracts/` (OpenAPI, AsyncAPI, GraphQL, MCP) | Spectral, AsyncAPI CLI |
| `bandadau-shared` | `packages/` → `@bandada/ui-tokens`, `@bandada/i18n`, `@bandada/contracts-ts`, `@bandada/messaging-ts`, `@bandada/idempotency-ts`, `@bandada/auth-ts`, `@bandada/eslint-config`, `@bandada/tsconfig` | pnpm workspace |
| `bandadau-backend` | `services/<servicio>/` × 9 (cada uno con su build, Dockerfile y AGENTS.md) | Gradle (Java) · Composer (PHP) · pnpm workspace (NestJS) |
| `bandadau-frontend` | App Expo SDK 57 (iOS, Android, Web PWA) | npm/pnpm + EAS |
| `bandadau-admin` | `shell/` (Next.js) + `mfe-moderation/` (Angular) + `mfe-insights/` (React) | pnpm workspace |
| `bandadau-landing` | Landing Next.js static export | pnpm |
| `bandadau-infra` | Compose, Traefik, init de bases, RabbitMQ, n8n (`n8n/`), observabilidad, AWS, plantillas de CI, `Makefile` del stack | Docker, make |
| `bandadau-ml` | Notebooks de entrenamiento y export ONNX | Python |

Reglas:

1. **Rutas en la documentación** se escriben relativas al workspace (`bandadau-backend/services/wallet-service/`).
2. **Contratos**: viven solo en `bandadau-docs/contracts/`. Los demás repos los leen desde la carpeta
   hermana (`../bandadau-docs/contracts`) para generar tipos y para las pruebas de contrato.
3. **Paquetes compartidos**: en desarrollo se consumen como dependencia local hermana
   (`"@bandada/ui-tokens": "file:../bandadau-shared/packages/ui-tokens"`, ajustando la profundidad).
   En CI se hace checkout de `bandadau-shared` y `bandadau-docs` como hermanos. Publicar en GitHub
   Packages queda como opción posterior, sin cambiar los nombres `@bandada/*`.
4. **Imágenes Docker**: `bandadau-infra` construye con *build context* en el repo hermano
   (`../bandadau-backend/services/<servicio>`), como hacía `homy-infra`.
5. **Commits por repositorio**: nunca mezclar repos en un cambio. Un cambio de contrato se hace
   primero en `bandadau-docs` y después en los repos consumidores, cada uno con su commit y su
   referencia (`Refs bandadau-docs@<sha>`).
6. **CI**: cada repo tiene su propio workflow. `bandadau-backend` y `bandadau-admin` usan *path
   filters* por servicio o app dentro del repo.
7. El `AGENTS.md` del workspace (raíz de `parcial-II/`) es la guía común; cada repo tiene su propio
   `AGENTS.md` y `CLAUDE.md`.

## Alternativas consideradas

| Alternativa | Por qué no |
|---|---|
| Monorepo único (ADR-0001) | El equipo prefiere repos por área, como en Homy |
| Un repo por microservicio (~20) | Demasiada coordinación para 4 semanas |
| Backend partido por lenguaje | Agrega 2 repos más sin beneficio claro para la entrega |

## Consecuencias

- Los cambios que cruzan repos (contrato + implementación) requieren varios commits coordinados.
- Para levantar todo localmente hay que tener los 8 repos clonados como hermanos
  (`bandadau-infra/scripts/clone-all.sh`).
- La publicación en GitHub se hace con `bandadau-infra/scripts/create-github-repos.sh`.
