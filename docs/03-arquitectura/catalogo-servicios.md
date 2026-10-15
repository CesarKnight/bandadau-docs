# Catálogo de componentes — Bandada U (FUENTE DE VERDAD)

> Este documento es **normativo**. Si otro documento contradice una tabla de aquí,
> manda este. Para cambiar algo de aquí se escribe primero un ADR en
> `bandadau-docs/docs/03-arquitectura/adr/` y luego se actualiza esta página.

## 1. Backend — microservicios

| # | Servicio | Bounded context | Lenguaje / framework | Base de datos | Arquitectura de código | Puerto dev | Prefijo REST público |
|---|---|---|---|---|---|---|---|
| S1 | `identity-service` | Identidad y acceso | Java 25 + Spring Boot 4 | PostgreSQL (`identity_db`) | **Hexagonal** | 7001 | `/api/v1/auth`, `/api/v1/users`, `/api/v1/universities`, `/.well-known` |
| S2 | `social-service` | Red social (perfiles, posts, grupos, grafo) | TypeScript + NestJS 11 | MongoDB (`social`) | **Clean Architecture** | 7002 | `/api/v1/profiles`, `/api/v1/posts`, `/api/v1/feed`, `/api/v1/groups`, `/api/v1/follows`, `/api/v1/reports` |
| S3 | `media-service` | Multimedia + ML/DL | TypeScript + NestJS 11 (+ onnxruntime-node, ffmpeg) | MongoDB (`media`) + S3 | **Clean Architecture** | 7003 | `/api/v1/media` |
| S4 | `events-service` | Eventos y talleres (**orquestador SAGA**) | Java 25 + Spring Boot 4 | PostgreSQL (`events_db`) | **DDD** (táctico) | 7004 | `/api/v1/events`, `/api/v1/registrations` |
| S5 | `wallet-service` | Billetera de créditos | PHP 8.4 + Laravel 12 | PostgreSQL (`wallet_db`) | **Hexagonal** | 7005 | `/api/v1/wallet` |
| S6 | `ticketing-service` | Entradas y comprobantes | TypeScript + NestJS 11 | DynamoDB (`bandada-ticketing`) | **Clean Architecture** | 7006 | `/api/v1/tickets` |
| S7 | `notification-service` | Notificaciones (push, email, in-app) | PHP 8.4 + Laravel 12 | DynamoDB (`bandada-notifications`) | **Clean Architecture** | 7007 | `/api/v1/notifications`, `/api/v1/devices` |
| S8 | `insights-service` | Agentes IA, reportes generativos, **servidor MCP** | TypeScript + NestJS 11 | DynamoDB (`bandada-insights`) + S3 (audio) | **Clean Architecture** | 7008 | `/api/v1/insights` (REST), `/mcp` (MCP Streamable HTTP) |
| S9 | `admin-gateway` | BFF **GraphQL** del panel | TypeScript + NestJS 11 + Apollo Server | — (sin estado; caché opcional) | Capas (resolvers → data sources) | 7010 | `/graphql` (HTTP + WebSocket `graphql-ws`) |

**Cobertura de la cátedra (condiciones 2, 4 y 5):**

- Lenguajes: Spring Boot (S1, S4) · NestJS (S2, S3, S6, S8, S9) · PHP (S5, S7).
- Bases de datos: PostgreSQL (S1, S4, S5) · MongoDB (S2, S3) · DynamoDB (S6, S7, S8 + tabla compartida de idempotencia).
- Arquitecturas: Hexagonal (S1, S5) · Clean (S2, S3, S6, S7, S8) · DDD (S4).
- SAGA de 3 servicios en **3 lenguajes y 2 motores**: `events-service` (Java/Postgres) → `wallet-service` (PHP/Postgres) → `ticketing-service` (TS/DynamoDB). Ver `saga-inscripcion-evento.md`.

### Endpoints internos

Cada servicio puede exponer `/internal/v1/**` (no publicado por el gateway, solo red
interna de Docker/VPC). Requieren **token de servicio** (JWT `typ=service`, ver
`seguridad-y-sso.md`). Los usan `admin-gateway` e `insights-service` (herramientas MCP).

### Health

Todos: `GET /health/live` (sin dependencias) y `GET /health/ready` (verifica DB y broker).
Spring usa Actuator mapeado a esas rutas.

## 2. Frontends

| # | App | Tecnología | Puerto dev | Dominio local (Traefik) | Consume |
|---|---|---|---|---|---|
| F1 | `bandadau-landing` | Next.js 16, **static export**, Tailwind v4 | 3000 | `bandada.localhost` | REST público (`/api/v1/events?public=true`, stats públicas) |
| F2 | `bandadau-admin/shell` | Next.js 16 static export — **shell de microfrontends** | 3001 | `admin.bandada.localhost` | **GraphQL** (`admin-gateway`) |
| F3 | `bandadau-admin/mfe-moderation` | **Angular 21** + Angular Elements → Web Component `<bandada-mfe-moderation>` | 4201 | `mfe.bandada.localhost/moderation/` | GraphQL |
| F4 | `bandadau-admin/mfe-insights` | React 19 + Vite → Web Component `<bandada-mfe-insights>` | 4301 | `mfe.bandada.localhost/insights/` | GraphQL + REST `insights` (audio) |
| F5 | `bandadau-frontend` | **Expo SDK 57** (React Native, expo-router) — iOS, Android y **web PWA** | 8081 (Metro) | `app.bandada.localhost` | REST |

## 3. Plataforma / infraestructura

| Componente | Imagen / servicio | Puerto dev | Uso |
|---|---|---|---|
| API Gateway (edge) | Traefik v3 | 80 (dashboard 8080) | Enrutamiento por prefijo, CORS, rate-limit, TLS en prod |
| Broker | RabbitMQ 4 (management) | 5672 / 15672 | Eventos de dominio, comandos y respuestas de la SAGA |
| PostgreSQL | postgres:18 | 5432 | `identity_db`, `events_db`, `wallet_db` (una instancia, 3 bases, 3 usuarios) |
| MongoDB | mongo:8.0.19 fijado (replica set de 1 nodo `rs0`; ADR-0018) | 27017 | `social`, `media` (replica set necesario para transacciones/outbox) |
| DynamoDB | DynamoDB Local (dev) / AWS DynamoDB (prod) | 8000 | `bandada-ticketing`, `bandada-notifications`, `bandada-insights`, `bandada-idempotency` |
| Object storage | MinIO `pgsty/minio` (dev; ADR-0018) / S3 (prod) | 9000 / 9001 | Media de usuarios, audios de reportes, modelos ONNX |
| Automatización | n8n | 5678 | Workflows (ver `automatizacion-n8n.md`) |
| Observabilidad | grafana/otel-lgtm | 3300 (Grafana), 4317/4318 (OTLP) | Trazas, métricas y logs (OpenTelemetry) |
| Correo dev | Mailpit | 8025 (UI) / 1025 (SMTP) | Correos de verificación y reportes |
| LLM dev (opcional) | Ollama | 11434 | Alternativa local/gratis para los agentes en desarrollo |
| TTS local (opcional) | Piper (perfil `llm`) | 5000 | Voz local para reportes en desarrollo (`TtsPort`) |

**Nombres fijos (ADR-0016):** buckets `bandada-media`, `bandada-reports`, `bandada-models`,
`bandada-public`; usuarios Postgres `identity`, `events`, `wallet`; usuarios Mongo `social`, `media`;
n8n usa SQLite propia en volumen.

## 4. Enrutamiento del gateway (Traefik)

| Host / prefijo | Destino |
|---|---|
| `api.bandada.localhost/api/v1/auth`, `/api/v1/users`, `/api/v1/universities`, `/.well-known` | identity-service:7001 |
| `api.bandada.localhost/api/v1/profiles`, `/posts`, `/feed`, `/groups`, `/follows`, `/reports` | social-service:7002 |
| `api.bandada.localhost/api/v1/media` | media-service:7003 |
| `api.bandada.localhost/api/v1/events`, `/registrations` | events-service:7004 |
| `api.bandada.localhost/api/v1/wallet` | wallet-service:7005 |
| `api.bandada.localhost/api/v1/tickets` | ticketing-service:7006 |
| `api.bandada.localhost/api/v1/notifications`, `/devices` | notification-service:7007 |
| `api.bandada.localhost/api/v1/insights`, `/mcp` | insights-service:7008 |
| `api.bandada.localhost/graphql` | admin-gateway:7010 |
| `/internal/**` | **bloqueado** en el gateway (403) |

Producción: mismo esquema con `api.bandadau.com`, `admin.bandadau.com`, `app.bandadau.com`,
`mfe.bandadau.com` y `bandadau.com` (landing). El dominio se parametriza con `BASE_DOMAIN` en `bandadau-infra/.env`.

## 5. Mensajería (RabbitMQ)

| Exchange | Tipo | Uso |
|---|---|---|
| `bandada.events` | topic | Eventos de dominio y respuestas de la SAGA (`bandada.<contexto>.<entidad>.<verbo-pasado>.v<n>`) |
| `bandada.commands` | topic | Comandos dirigidos (`bandada.<contexto>.cmd.<verbo>.v<n>`) |
| `bandada.dlx` | topic | Dead letters (cada cola tiene `x-dead-letter-exchange`) |

| Cola | Dueño | Bindings (routing keys) |
|---|---|---|
| `events-service.saga-replies` | events-service | `bandada.wallet.credits-debited.v1`, `bandada.wallet.credits-debit-failed.v1`, `bandada.wallet.credits-refunded.v1`, `bandada.ticketing.ticket-issued.v1`, `bandada.ticketing.ticket-issue-failed.v1`, `bandada.ticketing.ticket-voided.v1`, `bandada.ticketing.ticket-void-failed.v1` |
| `wallet-service.commands` | wallet-service | `bandada.wallet.cmd.#` |
| `ticketing-service.commands` | ticketing-service | `bandada.ticketing.cmd.#` |
| `social-service.events` | social-service | `bandada.media.asset.#`, `bandada.identity.user.#` |
| `media-service.events` | media-service | `bandada.social.post.deleted.v1` |
| `notification-service.events` | notification-service | `bandada.events.registration.#`, `bandada.events.event.cancelled.v1`, `bandada.social.#`, `bandada.wallet.topup.#`, `bandada.insights.alert.#`, `bandada.identity.user.registered.v1`, `bandada.identity.user.preferences-changed.v1` |
| `insights-service.analytics` | insights-service | `bandada.#` (proyección de métricas) |
| `admin-gateway.subscriptions.<instanceId>` | admin-gateway (exclusiva, auto-delete; ADR-0016) | `bandada.media.asset.#`, `bandada.social.content.reported.v1`, `bandada.social.post.hidden.v1`, `bandada.insights.alert.raised.v1`, `bandada.insights.report.ready.v1` |
| `n8n.automation` | n8n (`wf-00-router`) | `bandada.identity.user.registered.v1`, `bandada.events.registration.confirmed.v1`, `bandada.media.asset.flagged.v1`, `bandada.insights.alert.raised.v1`, `bandada.events.event.published.v1` |

Sobre: **CloudEvents 1.0** (JSON). Catálogo completo de mensajes en
`bandadau-docs/contracts/asyncapi/bandada-events.yaml`.

## 6. Tablas DynamoDB

| Tabla | PK / SK | TTL | Dueño |
|---|---|---|---|
| `bandada-idempotency` | `pk = <service>#<idempotencyKey>` | `expiresAt` (24 h) | compartida (cada servicio solo usa su prefijo) |
| `bandada-ticketing` | `pk = TICKET#<ticketId>` / `sk = META`; GSI1 `USER#<userId>` / `EVENT#<eventId>`; GSI2 `REG#<registrationId>`; centinela `REG#<registrationId>` / `LOCK` | `expiresAt` en ítems técnicos | ticketing-service |
| `bandada-notifications` | `pk = USER#<userId>` / `sk = NOTIF#<uuidv7>`; `DEVICE#<token>`; `PREF` | 90 días en notificaciones | notification-service |
| `bandada-insights` | `pk = REPORT#<id>` · `AGENTRUN#<id>` · `METRIC#<name>` / `sk = <yyyy-mm-dd>` · `ALERT#<id>` | runs 30 días | insights-service |

> El código de handoff SSO vive en `identity_db` (tabla `handoff_codes`), no en DynamoDB.

## 7. Roles

| Rol | Descripción | Acceso |
|---|---|---|
| `STUDENT` | Estudiante verificado por correo institucional | App (móvil/web) |
| `ORGANIZER` | Estudiante o centro de estudiantes que publica eventos | App + sección organizador de la app |
| `MODERATOR` | Modera contenido | App + panel (módulo Moderación) |
| `ADMIN` | Administra la plataforma | App + panel completo + MCP |

Un usuario tiene **uno o más** roles (`roles: string[]` en el JWT).

## 8. Convenciones transversales (resumen; detalle en `bandadau-docs/docs/04-patrones-y-reglas/`)

- IDs: **UUIDv7** (ordenables, generables en el cliente para modo offline).
- Fechas: ISO-8601 UTC (`2026-10-14T15:04:05Z`).
- Dinero: créditos **enteros** (`amountCredits: integer`), nunca float.
- Errores REST: **RFC 9457 Problem Details** (`application/problem+json`).
- Sin envoltorio `{success,data}`: la respuesta es el recurso; listas = `{ items, nextCursor }`.
- Cabeceras: `Authorization`, `Idempotency-Key`, `X-Correlation-Id`, `traceparent`, `Accept-Language`.
- Identificadores de código/rutas/enums en **inglés**; documentación en **español**; UI bilingüe **es (principal) / en** vía i18n (D14).
- UI: **tokens de diseño** de `@bandada/ui-tokens` con modos claro/oscuro (D13); textos por **i18n** con `@bandada/i18n` (D14).

> **Ítems técnicos en todas las tablas DynamoDB de servicio (ADR-0016):** inbox `pk = INBOX#<messageId>`,
> `sk = META` (TTL 14 días) y outbox `pk = OUTBOX#<messageId>` (pendientes indexados en GSI1
> `gsi1pk = OUTBOX#PENDING`). `bandada-insights` usa GSI1 sobrecargado (`gsi1pk`/`gsi1sk`) para
> listados y el lock `LOCK#monitoring`.
