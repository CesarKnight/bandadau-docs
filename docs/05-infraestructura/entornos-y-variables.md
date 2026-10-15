# Entornos y variables — Bandada U

Variables de entorno por componente, puertos, URLs por entorno y dónde vive cada secreto.
Puertos y nombres salen de `bandadau-docs/docs/03-arquitectura/catalogo-servicios.md` (normativo).
Cada componente mantiene su `.env.example` **completo** y **valida al arrancar** (fail fast); este documento es el índice y
describe lo **implementado en la fase 1** (verificado contra `bandadau-infra/docker-compose.yaml`, `bandadau-infra/.env.example` y los
`.env.example` de cada servicio/app). Lo que sigue siendo diseño está marcado como "Pendiente fase 2" o "pendiente".

Convenciones: `UPPER_SNAKE_CASE`; públicas de build con prefijo `NEXT_PUBLIC_*`, `EXPO_PUBLIC_*`,
`NG_APP_*`, `VITE_*` (se hornean en el bundle: **nunca** secretos); 🔒 = secreto.

---

## 1. Entornos

| Entorno | Para qué | Dónde corre | `BASE_DOMAIN` | Rama | Datos |
|---|---|---|---|---|---|
| `local` | Desarrollo diario de cada persona/agente | Docker Compose en la laptop | `bandada.localhost` | cualquiera | Seed de demo, volúmenes locales |
| `ci` | Pruebas automáticas | Runner de GitHub Actions (Testcontainers / `make up`) | `bandada.localhost` | PR | Efímeros |
| `dev` | Integración en nube (opcional, efímero; **pendiente**: aún no hay IaC) | Pila AWS `bandada-dev` | `dev.bandadau.com` | `develop` | Seed de demo |
| `prod` | Demo / defensa (**pendiente**: aún no hay IaC) | Pila AWS `bandada-prod` | `bandadau.com` | `main` | Seed de demo + datos de la defensa |

## 2. URLs por entorno

> Estado: **local = implementado y verificado** (`make smoke` 26/26). `ci`, `dev` y `prod` (AWS) siguen siendo **diseño**: `bandadau-infra/aws/`
> no existe todavía (ver `infraestructura.md` §4). Las filas `dev`/`prod` son la referencia de diseño.

| Componente | local | dev | prod |
|---|---|---|---|
| Landing (F1) | `http://bandada.localhost` (dev server `:3000`) | `https://dev.bandadau.com` | `https://bandadau.com` (`www` redirige) |
| App web PWA (F5) | `http://app.bandada.localhost` (dev server `:8081`) | `https://app.dev.bandadau.com` | `https://app.bandadau.com` |
| Panel shell (F2) | `http://admin.bandada.localhost` (dev server `:3001`) | `https://admin.dev.bandadau.com` | `https://admin.bandadau.com` |
| MFEs (F3, F4) | `http://mfe.bandada.localhost/{moderation,insights}/` (dev servers `:4201` / `:4301`) | `https://mfe.dev.bandadau.com/…` | `https://mfe.bandadau.com/…` |
| API REST | `http://api.bandada.localhost/api/v1` | `https://api.dev.bandadau.com/api/v1` | `https://api.bandadau.com/api/v1` |
| GraphQL (HTTP / WS) | `http://api.bandada.localhost/graphql` · `ws://…/graphql` | `https://…/graphql` · `wss://…` | `https://api.bandadau.com/graphql` · `wss://api.bandadau.com/graphql` |
| MCP | `http://api.bandada.localhost/mcp` (la ruta existe en Traefik; responde 502 hasta la fase 2) | `https://api.dev.bandadau.com/mcp` | `https://api.bandadau.com/mcp` |
| JWKS | `http://api.bandada.localhost/.well-known/jwks.json` | … | `https://api.bandadau.com/.well-known/jwks.json` |
| Objetos (URLs prefirmadas) | `http://localhost:9000` (MinIO; `S3_PUBLIC_ENDPOINT`; también `http://s3.bandada.localhost` vía Traefik) | `https://bandada-dev-media.s3.us-east-1.amazonaws.com` | `https://bandada-prod-media.s3.us-east-1.amazonaws.com` |
| n8n | `http://n8n.bandada.localhost` / `http://localhost:5678` | `https://n8n.dev.bandadau.com` (protegido) | `https://n8n.bandadau.com` (protegido) |
| Grafana | `http://grafana.bandada.localhost` / `http://localhost:3300` (solo con `make up-obs`) | `https://grafana.dev.bandadau.com` (protegido) | `https://grafana.bandadau.com` (protegido) |
| RabbitMQ UI | `http://rabbit.bandada.localhost` / `http://localhost:15672` | Session Manager *port forwarding* | ídem |
| Mailpit | `http://mail.bandada.localhost` / `http://localhost:8025` | — (SES) | — (SES) |
| MinIO consola | `http://minio.bandada.localhost` / `http://localhost:9001` | — | — |
| Traefik dashboard | `http://localhost:8080` | deshabilitado | deshabilitado |

`make urls` imprime estas URLs con el `BASE_DOMAIN` activo. Deep links móviles: scheme `bandadau://`; universal links `https://app.<BASE_DOMAIN>/…`.

## 3. Puertos

Fuente: `bandadau-infra/docker-compose.yaml` y `.env.example` (cada puerto publicado tiene una variable para cambiarlo).

| Puerto | Componente | Variable | Publicado en el host (local) |
|---|---|---|---|
| 80 / 8080 | Traefik / dashboard | `HTTP_PORT` / `TRAEFIK_DASHBOARD_PORT` | sí |
| 7001 | identity-service | `IDENTITY_HOST_PORT` | sí (además de Traefik, para depurar) |
| 7002 | social-service | `SOCIAL_HOST_PORT` | ídem |
| 7003 | media-service | `MEDIA_HOST_PORT` | ídem |
| 7004 | events-service | `EVENTS_HOST_PORT` | ídem |
| 7005 | wallet-service | `WALLET_HOST_PORT` | ídem |
| 7006 | ticketing-service | `TICKETING_HOST_PORT` | ídem |
| 7007 | notification-service | `NOTIFICATION_HOST_PORT` | ídem |
| 7008 | insights-service | — | **Pendiente fase 2**: no hay contenedor; Traefik ya enruta `/api/v1/insights` y `/mcp` hacia `insights-service:7008` (502 mientras no exista) |
| 7010 | admin-gateway | `ADMIN_GATEWAY_HOST_PORT` | sí |
| 3000 | landing (dev server en el host) | — | Traefik → `host.docker.internal:3000` |
| 3001 | admin-shell (dev server en el host) | — | ídem |
| 4201 | mfe-moderation (dev server en el host) | — | ídem |
| 4301 | mfe-insights (dev server en el host) | — | ídem |
| 8081 | mobile (Metro / web, en el host) | — | ídem |
| 4010 | gateway mock (`make mock`, Node sin Docker) | `MOCK_PORT` (variable de `make`) | sí |
| 5432 | PostgreSQL | `POSTGRES_PORT` | `127.0.0.1` |
| 27017 | MongoDB | `MONGO_PORT` | `127.0.0.1` |
| 8000 | DynamoDB Local | `DYNAMODB_PORT` | `127.0.0.1` |
| 5672 / 15672 | RabbitMQ AMQP / UI | `RABBITMQ_AMQP_PORT` / `RABBITMQ_UI_PORT` | `127.0.0.1` (ambos) |
| 9000 / 9001 | MinIO API / consola | `MINIO_API_PORT` / `MINIO_CONSOLE_PORT` | sí |
| 5678 | n8n | `N8N_PORT` | sí |
| 3300 / 4317 / 4318 | Grafana / OTLP gRPC / OTLP HTTP (perfil `observability`) | `GRAFANA_PORT` / `OTLP_GRPC_PORT` / `OTLP_HTTP_PORT` | sí, solo con `make up-obs` |
| 8025 / 1025 | Mailpit UI / SMTP | `MAILPIT_UI_PORT` / `MAILPIT_SMTP_PORT` | sí |
| 11434 | Ollama | — | **Pendiente fase 2** (perfil `llm`: hoy es un placeholder vacío en el Compose) |

---

## 4. Variables por componente

> **Fuente de los valores**: cada servicio documenta sus variables en su propio `.env.example` (el servicio **valida al arrancar**, fail fast).
> `bandadau-infra/.env.example` + `docker-compose.yaml` inyectan los valores **dentro de Docker Compose** (nombres de contenedor, p. ej.
> `postgres`, `mongo`, `rabbitmq`); los `.env.example` de cada servicio usan `localhost` o los nombres de contenedor para correr el servicio en el IDE
> (`make host S=<servicio>` redirige el tráfico de Docker al proceso del host). Cuando el default del servicio y el valor del Compose difieren, la
> tabla lo indica ("servicio" vs "Compose").

### 4.0 `bandadau-infra/.env` (Compose)

`cp .env.example .env` (o `make env` / `make setup`). Todos los valores son de **desarrollo**; el `.env` está en `.gitignore`.

| Variable | Descripción | Ejemplo dev |
|---|---|---|
| `BASE_DOMAIN` | Dominio raíz (Traefik lo lee con `{{ env "BASE_DOMAIN" }}`) | `bandada.localhost` |
| `COMPOSE_PROJECT_NAME` | Nombre del proyecto Compose (`make … PROJECT=<otro>` lo sobreescribe) | `bandada` |
| `COMPOSE_PROFILES` | Perfiles por defecto de `docker compose` (`observability` y `llm` quedan OFF) | `infra,services` |
| `TZ` | Zona horaria de los contenedores | `America/La_Paz` |
| `APP_ENV` / `IMAGE_TAG` | Entorno y tag de las imágenes `bandada/<svc>:<tag>` | `local` / `local` |
| `*_PORT`, `*_HOST_PORT` | Puertos publicados en el host (§3) | ver §3 |
| `POSTGRES_USER` / `POSTGRES_PASSWORD` 🔒 | Superusuario de Postgres (local) / maestro RDS (prod, Secrets Manager) | `postgres` / `postgres` |
| `IDENTITY_DB_PASSWORD` 🔒 / `EVENTS_DB_PASSWORD` 🔒 / `WALLET_DB_PASSWORD` 🔒 | Usuarios `identity` / `events` / `wallet` | `identity_dev` / `events_dev` / `wallet_dev` |
| `MONGO_ROOT_USER` / `MONGO_ROOT_PASSWORD` 🔒 | Raíz de Mongo | `root` / `mongo_dev` |
| `SOCIAL_MONGO_PASSWORD` 🔒 / `MEDIA_MONGO_PASSWORD` 🔒 | Usuarios de Mongo `social` / `media` | `social_dev` / `media_dev` |
| `AWS_REGION` / `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` | DynamoDB Local (credenciales ficticias) | `us-east-1` / `local` / `local` |
| `RABBITMQ_DEFAULT_USER` / `RABBITMQ_DEFAULT_PASS` 🔒 | Usuario compartido de desarrollo (servicios) | `bandada` / `bandada` |
| `RABBITMQ_ADMIN_PASSWORD` 🔒 | Usuario `admin` (UI) | `admin` |
| `RABBITMQ_N8N_PASSWORD` 🔒 / `RABBITMQ_MONITOR_PASSWORD` 🔒 | Usuarios `n8n` y `monitor` (solo lectura) | `n8n_dev` / `monitor_dev` |
| `RABBITMQ_URL` 🔒 | AMQP que reciben los servicios | `amqp://bandada:bandada@rabbitmq:5672` |
| `MINIO_ROOT_USER` / `MINIO_ROOT_PASSWORD` 🔒 | Raíz de MinIO | `minio` / `minio_dev_pw` |
| `MEDIA_S3_ACCESS_KEY` / `MEDIA_S3_SECRET_KEY` 🔒 | Usuario MinIO de media-service (política por bucket) | `media-svc` / `media_svc_dev_pw` |
| `INSIGHTS_S3_ACCESS_KEY` / `INSIGHTS_S3_SECRET_KEY` 🔒 | Usuario MinIO de insights-service (fase 2; ya se crea) | `insights-svc` / `insights_svc_dev_pw` |
| `S3_PUBLIC_ENDPOINT` | Host con el que se **firman** las URLs prefirmadas | `http://localhost:9000` |
| `JWT_ISSUER` / `JWT_KEY_ID` / `JWT_PRIVATE_KEY_PATH` | Emisor, `kid` y PEM RS256 de identity (`make keys` pre-genera `secrets/jwt-private.pem`) | `http://api.${BASE_DOMAIN}` / `dev-2026-10` / `/run/secrets/jwt-private.pem` |
| `ACCESS_TOKEN_TTL` / `REFRESH_TOKEN_TTL` / `HANDOFF_CODE_TTL` | RF-03 / RF-04 | `PT15M` / `P30D` / `PT60S` |
| `SPRING_PROFILES_ACTIVE` | Perfil de identity y events (`dev` imprime el código de verificación en el log) | `dev` |
| `<SVC>_SERVICE_CLIENT_SECRET` 🔒 | Secreto de client credentials de cada servicio (`ADMIN_GATEWAY`, `SOCIAL`, `MEDIA`, `EVENTS`, `WALLET`, `TICKETING`, `NOTIFICATION`, `INSIGHTS`, `N8N`, `SEED`) | `dev-secret-<svc>` |
| `SERVICE_CLIENTS` 🔒 | Lista `id:secret,…` que registra identity (incluye `bandada-seed` y `n8n`) | ver `.env.example` |
| `QR_SIGNING_KEY_PATH` / `QR_SIGNING_KID` / `QR_KEY_ID` | Llave ES256 del QR (`make keys` → `secrets/qr-es256.pem`), `kid` y alias heredado | `/run/secrets/qr-es256.pem` / `tk-2026-10` / `dev-1` |
| `WALLET_APP_KEY` 🔒 / `NOTIFICATION_APP_KEY` 🔒 | `APP_KEY` de Laravel (valores de desarrollo ya generados) | `base64:…` |
| `PAYMENT_WEBHOOK_SECRET` 🔒 | HMAC del webhook de pagos | `dev-webhook-secret` |
| `CORS_ORIGINS` | Orígenes permitidos (los usan los servicios y MinIO; Traefik tiene su propia lista, ver `infraestructura.md` §2.7) | `http://localhost:3000,…,http://app.${BASE_DOMAIN},…` |
| `DEFAULT_LOCALE` / `SUPPORTED_LOCALES` | D14 | `es` / `es,en` |
| `IDEMPOTENCY_TABLE` / `TICKETING_TABLE` / `NOTIFICATIONS_TABLE` / `INSIGHTS_TABLE` | Nombres de tablas DynamoDB | `bandada-idempotency` / `bandada-ticketing` / `bandada-notifications` / `bandada-insights` |
| `OTEL_SDK_DISABLED` / `OTEL_EXPORTER_OTLP_ENDPOINT` / `OTEL_RESOURCE_ATTRIBUTES` | Sin el perfil `observability` no hay colector: `true` | `true` / `http://lgtm:4318` / `deployment.environment=local` |
| `GRAFANA_ADMIN_USER` / `GRAFANA_ADMIN_PASSWORD` 🔒 | Grafana (perfil `observability`) | `admin` / `admin` |
| `WALLET_WORKER_CMD` / `WALLET_RELAY_CMD` | Comandos de los contenedores auxiliares de wallet | `php artisan wallet:consume-commands` / `php artisan wallet:relay-outbox` |
| `NOTIFICATION_WORKER_CMD` / `NOTIFICATION_RELAY_CMD` | Ídem para notification | `php artisan notifications:consume` / `php artisan notifications:relay-outbox` |
| `CHAOS_TICKETING_FAIL` | Demo de rollback de la SAGA (D2); **pertenece a ticketing-service** (§4.7) | `false` |
| `CHAOS_WALLET_DELAY_MS` | Demo de timeout de la SAGA (D2); **pertenece a wallet-service** (§4.6) | `0` |
| `N8N_ENCRYPTION_KEY` 🔒 y demás `N8N_*` | Ver §4.12 | — |
| `OPS_BASIC_AUTH` 🔒 / `ORIGIN_VERIFY_SECRET` 🔒 | Solo prod (vacíos en local; diseño AWS, **pendiente**) | — |
| `SEED_*` | Variables de `make seed` / `make smoke` (se ejecutan en el host): `SEED_API_URL`, `SEED_GRAPHQL_URL`, `SEED_IDENTITY_INTERNAL_URL`, `SEED_MAILPIT_URL`, `SEED_DEMO_PASSWORD` 🔒 | `Bandada#2026` |

Opciones del smoke (variables del proceso, no del `.env`): `SMOKE_CHAOS=0` (omite el caos), `SMOKE_CHAOS_MODE=docker|http`.

### 4.1 Comunes a los servicios backend

El Compose inyecta estas variables a todos los servicios (ancla `x-service-env`); cada servicio lee solo las que necesita.
Las variables de caos **no** son comunes: son de wallet y ticketing.

| Variable | Descripción | Valor en Compose |
|---|---|---|
| `PORT` (Laravel: `APP_PORT`) | Puerto HTTP | `7001`…`7010` según el servicio |
| `APP_ENV` / `SPRING_PROFILES_ACTIVE` / `NODE_ENV` | Entorno (Java: `APP_ENV` + `SPRING_PROFILES_ACTIVE`; Node: `NODE_ENV` + `APP_ENV`; Laravel: `APP_ENV`) | `local` / `dev` / `development` |
| `TZ` | Zona horaria | `America/La_Paz` |
| `RABBITMQ_URL` 🔒 | AMQP | `amqp://bandada:bandada@rabbitmq:5672` (prod: usuario propio del servicio) |
| `JWKS_URL` | JWKS interno de identity (no pasa por Traefik) | `http://identity-service:7001/.well-known/jwks.json` |
| `JWT_ISSUER` | `iss` esperado | `http://api.bandada.localhost` |
| `IDENTITY_URL` | Para pedir el token de servicio | `http://identity-service:7001` |
| `SERVICE_CLIENT_ID` / `SERVICE_CLIENT_SECRET` 🔒 | Client credentials (por servicio; ver cada sección) | `<svc>` / `dev-secret-<svc>` |
| `IDEMPOTENCY_TABLE` | Tabla compartida (D3) | `bandada-idempotency` |
| `DYNAMODB_ENDPOINT` | Solo local/CI (vacío en AWS) | `http://dynamodb-local:8000` |
| `AWS_REGION` y `AWS_DEFAULT_REGION` | Región (el Compose define ambas: Laravel lee `AWS_DEFAULT_REGION`) | `us-east-1` |
| `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` | Solo local (ficticias); en AWS, rol del EC2 | `local` / `local` |
| `DEFAULT_LOCALE` (Laravel: `APP_LOCALE` + `APP_FALLBACK_LOCALE`) | Idioma si falta `Accept-Language` (D14) | `es` |
| `SUPPORTED_LOCALES` | Idiomas soportados (D14) | `es,en` |
| `CORS_ORIGINS` | CORS propio del servicio (para el acceso directo `localhost:700x`; en `api.*` Traefik sobrescribe `Access-Control-Allow-Origin`) | ver §4.0 |
| `OTEL_SDK_DISABLED` | `true` salvo `make up-obs` | `true` |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | Colector OTLP HTTP | `http://lgtm:4318` |
| `OTEL_SERVICE_NAME` | Nombre del servicio | `events-service` |
| `OTEL_RESOURCE_ATTRIBUTES` | Entorno y versión | `deployment.environment=local` |
| `<X>_SERVICE_URL` | URL interna de otro servicio (`SOCIAL_`, `MEDIA_`, `EVENTS_`, `WALLET_`, `TICKETING_`, `NOTIFICATION_`, `INSIGHTS_`) | `http://media-service:7003` |

Específicas por stack (Compose): Java → `JAVA_TOOL_OPTIONS=-XX:MaxRAMPercentage=60 -XX:+ExitOnOutOfMemoryError`; Node → `NODE_OPTIONS=--max-old-space-size=192`;
Laravel → `APP_DEBUG=false`, `LOG_CHANNEL=stderr`.

### 4.2 identity-service (S1 · Spring Boot)

| Variable | Descripción | Servicio (`.env.example`) / Compose |
|---|---|---|
| `DATABASE_URL` | JDBC (Flyway migra al arrancar) | `jdbc:postgresql://localhost:5432/identity_db` / `jdbc:postgresql://postgres:5432/identity_db` |
| `DATABASE_USER` / `DATABASE_PASSWORD` 🔒 / `DB_POOL_SIZE` | Usuario propio | `identity` / `change-me` → `identity_dev` / `10` |
| `RABBIT_DECLARE_TOPOLOGY` | `false`: la topología viene de `definitions.json`; `true` solo para desarrollo suelto | `false` |
| `OUTBOX_RELAY_INTERVAL` | Relay del outbox | `PT1S` |
| `JWT_KEK` 🔒 | Llave que cifra `signing_keys` (el par RS256 se genera al primer arranque y se guarda cifrado). El perfil `dev` relaja este requisito; el Compose local no la define | dev: `dev-only-kek-change-me-…` |
| `JWT_PRIVATE_KEY_PATH` 🔒 | Importa opcionalmente un PKCS#8 existente como primera llave (`make keys` lo pre-genera en `./secrets`, montado en lectura/escritura) | `/run/secrets/jwt-private.pem` |
| `JWT_KEY_ID` / `JWT_ROTATION_INTERVAL` | `kid` de la llave importada / rotación | `dev-2026-10` (Compose) · `P90D` |
| `ACCESS_TOKEN_TTL` / `REFRESH_TOKEN_TTL` / `ADMIN_REFRESH_TOKEN_TTL` / `HANDOFF_CODE_TTL` / `VERIFICATION_CODE_TTL` / `SERVICE_TOKEN_TTL` | RF-03 / RF-04 | `PT15M` / `P30D` / `PT12H` / `PT60S` / `PT15M` / `PT5M` |
| `APP_BASE_URL` / `ADMIN_BASE_URL` | `redirectUrl` del handoff (RN-03.6; nunca viene del cliente) | `http://app.bandada.localhost` / `http://admin.bandada.localhost` |
| `SMTP_HOST` / `SMTP_PORT` / `MAIL_FROM` / `MAIL_LOG_CODE` | Código de verificación (Mailpit; `MAIL_LOG_CODE` lo escribe también en el log, solo dev) | `localhost`→`mailpit` / `1025` / `no-reply@bandada.localhost` / `true` |
| `SERVICE_CLIENTS` 🔒 | Clientes registrados `id:secret[:scope\|scope]` (en el Compose, `SERVICE_CLIENTS` del `.env`: incluye `bandada-seed` y `n8n`) | ver `.env.example` |
| `COOKIE_SECURE` / `CORS_ORIGINS` | Endurecimiento web (refresh token en cookie `SameSite=Strict`) | `false` (dev) |
| `RATE_LIMIT_ENABLED` / `AUTH_RATE_LIMIT_PER_MINUTE` / `HANDOFF_RATE_LIMIT_PER_MINUTE` / `RESEND_MIN_INTERVAL` / `RESEND_PER_HOUR` / `REGISTER_HIDE_EXISTING_ACCOUNTS` | Límites y anti-enumeración | `true` / `60` / `10` / `PT60S` / `5` / `true` |

### 4.3 social-service (S2 · NestJS)

| Variable | Descripción | Servicio / Compose |
|---|---|---|
| `MONGODB_URI` 🔒 | rs0 (desde el host: `directConnection=true`) | `mongodb://social:social_dev@localhost:27017/social?replicaSet=rs0&authSource=social&directConnection=true` / `…@mongo:27017/social?replicaSet=rs0&authSource=social` |
| `MEDIA_SERVICE_URL` / `MEDIA_HTTP_TIMEOUT_MS` | Consultas internas a media (timeout + circuit breaker) | `http://media-service:7003` / `1500` |
| `SERVICE_CLIENT_ID` / `SERVICE_CLIENT_SECRET` 🔒 | Token de servicio | `social-service` / `dev-secret-social` |
| `REPORT_HIDE_THRESHOLD` | RF-13 (UC-10) | `3` |
| `RATE_LIMIT_PER_MINUTE` / `OUTBOX_POLL_MS` / `PENDING_MEDIA_SWEEP_MS` / `MESSAGING_ENABLED` | Límite, relay del outbox, barrido de media pendiente | `300` / `500` / `60000` / `true` |
| `FEED_MODEL_PATH` | Se acepta por compatibilidad; **sin uso en la fase 1** (`feed-ranker` es fase 2, D7) | `./models/feed-ranker/coefficients.json` |

### 4.4 media-service (S3 · NestJS; ONNX en fase 2)

| Variable | Descripción | Servicio / Compose |
|---|---|---|
| `MONGODB_URI` 🔒 | rs0 | `mongodb://media:media_dev@…/media?replicaSet=rs0&authSource=media` |
| `S3_ENDPOINT` | Plano de datos (MinIO) | `http://localhost:9000` / `http://minio:9000` |
| `S3_PUBLIC_ENDPOINT` | Host con el que se **firman** las URLs que abre el cliente | `http://localhost:9000` |
| `S3_FORCE_PATH_STYLE` | MinIO | `true` |
| `S3_ACCESS_KEY_ID` / `S3_SECRET_ACCESS_KEY` 🔒 | Usuario MinIO del servicio | `media-svc` / `media_svc_dev_pw` (Compose: `MEDIA_S3_ACCESS_KEY` / `MEDIA_S3_SECRET_KEY`) |
| `S3_BUCKET_MEDIA` / `S3_BUCKET_MODELS` | Buckets | `bandada-media` / `bandada-models` |
| `UPLOAD_URL_TTL_SECONDS` | Vida del PUT prefirmado (contrato `expiresIn`). **Servicio: `900`** (rango 30–3600); **Compose: `300`** | `900` / `300` |
| `MAX_IMAGE_BYTES` / `MAX_VIDEO_BYTES` | Límites (RF-06: video ≤ 50 MB, ADR-0016) | `10485760` / `52428800` |
| `MODERATION_MODE` | Fase 1: `allow-all` (`APPROVED` al completar) \| `manual` (`FLAGGED` → cola de moderadores) | `allow-all` |
| `RATE_LIMIT_PER_MINUTE` / `OUTBOX_POLL_MS` / `STALE_PROCESSING_MS` / `MESSAGING_ENABLED` | Operación | `300` / `500` / `30000` / `true` |
| `MODEL_NSFW_VERSION` / `MODEL_VIOLENCE_VERSION` / `MODEL_CLIP_VERSION` · `MODERATION_BLOCK_THRESHOLD` / `MODERATION_REVIEW_THRESHOLD` · `VIDEO_FRAME_INTERVAL_SECONDS` / `VIDEO_MAX_FRAMES` | Se aceptan por compatibilidad; **sin uso en la fase 1** (ONNX/ffmpeg: fase 2, D7) | `1.0.0` · `0.85` / `0.5` · `2` / `30` |

### 4.5 events-service (S4 · Spring Boot, DDD)

| Variable | Descripción | Servicio / Compose |
|---|---|---|
| `DATABASE_URL` / `DATABASE_USER` / `DATABASE_PASSWORD` 🔒 / `DB_POOL_SIZE` | JDBC | `…/events_db` / `events` / `events_dev` / `10` |
| `RABBIT_DECLARE_TOPOLOGY` / `OUTBOX_RELAY_INTERVAL` | Topología externa / relay | `false` / `PT1S` |
| `IDENTITY_SERVICE_URL` | Token de servicio (si falta, se deriva del origen de `JWKS_URL`) | `http://localhost:7001` |
| `SERVICE_CLIENT_ID` / `SERVICE_CLIENT_SECRET` 🔒 | Token de servicio hacia media | `events-service` / `dev-secret-events` |
| `COVER_CHECK` / `MEDIA_SERVICE_URL` / `MEDIA_TIMEOUT` | Validar portada contra media (`off` = sin llamadas; el Compose no lo activa) | `off` / `http://media-service:7003` / `PT2S` |
| `SAGA_STEP_TIMEOUT` | D2: 30 s por paso | `PT30S` |
| `SAGA_RESEND_OFFSETS` | Reenvíos a los 5/10/20 s | `PT5S,PT10S,PT20S` |
| `SAGA_COMPENSATION_BACKOFF` / `SAGA_COMPENSATION_BACKOFF_CAP` / `SAGA_COMPENSATION_ALERT_AFTER` | Compensaciones sin límite de reintentos, con alerta | `PT5S` / `PT60S` / `PT2M` |
| `SAGA_SCHEDULER_INTERVAL` | Barrido de timeouts | `PT5S` |
| `SAGA_COMMAND_MAX_RETRIES` | Lo declara el Compose (`3`); no figura en el `.env.example` del servicio | `3` |
| `EVENT_DEFAULT_DURATION` / `REGISTRATION_CANCELLATION_CUTOFF` | Reglas de eventos | `PT2H` / `PT24H` |

### 4.6 wallet-service (S5 · Laravel 12, PHP 8.4)

Una sola imagen con varios roles; en el Compose son tres contenedores con las **mismas variables**:
`wallet-service` (web, nginx + php-fpm `:7005`; migra al arrancar), `wallet-worker` (`php artisan wallet:consume-commands`, alias `bandada:consume`)
y `wallet-relay` (`php artisan wallet:relay-outbox`, alias `bandada:relay`: outbox → RabbitMQ, expiración de recargas y purga).
Otros comandos: `wallet:expire-topups`, `bandada:check-env`, `bandada:declare-topology` (solo dev/tests).

| Variable | Descripción | Servicio / Compose |
|---|---|---|
| `APP_KEY` 🔒 | Llave de Laravel | Compose: `WALLET_APP_KEY` (`base64:…`) |
| `DB_CONNECTION` / `DB_HOST` / `DB_PORT` / `DB_DATABASE` / `DB_SSLMODE` | Postgres | `pgsql` / `postgres` / `5432` / `wallet_db` / `prefer` |
| `DB_USERNAME` / `DB_PASSWORD` 🔒 | | `wallet` / `change-me` → `wallet_dev` |
| `RABBITMQ_URL` / `RABBITMQ_PREFETCH` / `RABBITMQ_DECLARE_TOPOLOGY` / `OUTBOX_POLL_INTERVAL_MS` | Broker (topología externa) | `amqp://…@rabbitmq:5672` / `20` / `false` / `500` |
| `JWT_USER_AUDIENCES` / `JWT_INTERNAL_AUDIENCE` / `JWKS_CACHE_TTL` | Validación de JWT | `bandada-app,bandada-admin` / `bandada-internal` / `300` |
| `PAYMENT_SIMULATOR_ENABLED` | Variable **real** que habilita `simulateTopUpPayment` (404 si es `false`; solo dev/demo) | `true` |
| `SIMULATE_PAYMENT_ENABLED` | Alias heredado que sigue definiendo el `.env.example` de infra y el Compose; el servicio no lo lee | `true` |
| `PAYMENT_GATEWAY` | Compose: fija la pasarela simulada | `simulated` |
| `PAYMENT_WEBHOOK_SECRET` 🔒 / `PAYMENT_WEBHOOK_TOLERANCE_SECONDS` | HMAC `X-Signature: sha256=<hex>` (≥ 16 caracteres) y ventana anti-replay | `dev-webhook-secret` / `300` |
| `PAYMENT_CHECKOUT_BASE_URL` | Página de la pasarela simulada | `http://app.bandada.localhost/wallet/checkout` |
| `TOPUP_PACKAGES` / `TOPUP_TTL_MINUTES` | RF-19, ADR-0016: `CREDITS_20,CREDITS_50,CREDITS_100` | `CREDITS_20,CREDITS_50,CREDITS_100` / `30` |
| `CHAOS_WALLET_DELAY_MS` | Demo de timeout de la SAGA (D2): retrasa cada comando N ms. **Debe ser `0` en producción** | `0` |
| `CORS_ORIGINS` | Vacío = sin cabeceras CORS (cuando Traefik se encarga) | ver §4.0 |

### 4.7 ticketing-service (S6 · NestJS)

| Variable | Descripción | Servicio / Compose |
|---|---|---|
| `TICKETING_TABLE` | Tabla | `bandada-ticketing` |
| `EVENTS_SERVICE_URL` | Verificar organizador del evento | `http://events-service:7004` |
| `SERVICE_CLIENT_ID` / `SERVICE_CLIENT_SECRET` 🔒 | Token de servicio | `ticketing-service` / `dev-secret-ticketing` |
| `QR_SIGNING_KEY_PATH` 🔒 | Ruta del par **ES256** (PKCS#8 PEM P-256) del JWS del QR (UC-14). Dev: `bandadau-infra/secrets/qr-es256.pem` (`make keys`); en Compose se monta de solo lectura en `/run/secrets/qr-es256.pem` | `/run/secrets/qr-es256.pem` |
| `QR_SIGNING_KID` | `kid` del JWS | `tk-2026-10` |
| `QR_PREVIOUS_JWKS_PATH` | Opcional: JWKS (solo claves públicas) de llaves rotadas aún aceptadas | vacío |
| `QR_KEY_ID` | Alias heredado que sigue definiendo infra; el servicio no lo lee | `dev-1` |
| `CHAOS_TICKETING_FAIL` | Demo del rollback de la SAGA (D2): `issue-ticket` responde `ticket-issue-failed`; se lee **al arrancar**. Nunca en producción | `false` |
| `STRICT_ORGANIZER_CHECK` | `true`: si el comando no trae `organizerId`/`staffUserIds`, solo ADMIN valida | `true` |
| `VALIDATION_OPENS_BEFORE_MINUTES` / `VALIDATION_DEFAULT_DURATION_MINUTES` | Ventana de validación del QR | `120` / `720` |
| `OUTBOX_RELAY_INTERVAL_MS` | Relay del outbox (ítems `OUTBOX#<id>` en DynamoDB) | `500` |
| `TICKETING_COMMANDS_QUEUE` | Solo pruebas de integración (la cola real la crea `bandadau-infra`) | — |

### 4.8 notification-service (S7 · Laravel 12)

Una imagen y tres contenedores con las mismas variables: `notification-service` (web `:7007`; espera las tablas DynamoDB),
`notification-worker` (`php artisan notifications:consume`, alias `bandada:consume`) y `notification-relay`
(`php artisan notifications:relay-outbox`, alias `bandada:relay`; **inactivo**: el servicio no publica eventos, existe para que el Compose
sea sano y puede omitirse). Otros: `bandada:check-env`, `bandada:wait-for-schema`, `bandada:declare-topology` (solo dev/tests).

| Variable | Descripción | Servicio / Compose |
|---|---|---|
| `APP_KEY` 🔒 | | Compose: `NOTIFICATION_APP_KEY` |
| `NOTIFICATIONS_TABLE` / `IDEMPOTENCY_TABLE` | Tablas DynamoDB | `bandada-notifications` / `bandada-idempotency` |
| `DYNAMODB_AUTO_CREATE_TABLES` | `false`: las tablas las crea `dynamodb-init` | `false` |
| `NOTIFICATION_TTL_DAYS` | Catálogo §6 | `90` |
| `RABBITMQ_URL` / `RABBITMQ_PREFETCH` / `RABBITMQ_DECLARE_TOPOLOGY` | Broker | `…@rabbitmq:5672` / `10` / `false` |
| `JWT_USER_AUDIENCES` / `JWT_INTERNAL_AUDIENCE` / `JWKS_CACHE_TTL` | Validación de JWT | `bandada-app,bandada-admin` / `bandada-internal` / `300` |
| `EMAIL_ENABLED` / `PUSH_ENABLED` | Canales | `true` / `false` |
| `MAIL_MAILER` | `smtp` (local) / `ses` (AWS) | `smtp` |
| `MAIL_HOST` / `MAIL_PORT` / `MAIL_FROM_ADDRESS` / `MAIL_FROM_NAME` | Mailpit | `mailpit` / `1025` / `no-reply@bandada.localhost` / `Bandada U` |
| `EXPO_PUSH_URL` / `EXPO_ACCESS_TOKEN` 🔒 | Expo Push | `https://exp.host/--/api/v2/push/send` / vacío |
| `APP_DEEP_LINK_BASE` | Enlaces en push/correo | `http://app.bandada.localhost` |

### 4.9 insights-service (S8 · NestJS, agentes + MCP) — Pendiente fase 2

No está en el Compose ni tiene `.env.example`: el repo `bandadau-backend/services/insights-service/` solo contiene el andamiaje. La tabla es el **diseño** (no verificado
contra código). Ya existen en la infraestructura de la fase 1: la tabla `bandada-insights`, el bucket `bandada-reports` y el usuario MinIO `insights-svc` (`INSIGHTS_S3_*`).

| Variable | Descripción | Ejemplo dev (Compose) |
|---|---|---|
| `INSIGHTS_TABLE` | Tabla | `bandada-insights` |
| `S3_ENDPOINT` / `S3_PUBLIC_ENDPOINT` | Solo local | `http://minio:9000` / `http://localhost:9000` |
| `S3_BUCKET_AUDIO` / `S3_BUCKET_MODELS` | Audios de reportes / modelos | `bandada-reports` / `bandada-models` |
| `EVENTS_SERVICE_URL`, `WALLET_SERVICE_URL`, `SOCIAL_SERVICE_URL`, `MEDIA_SERVICE_URL` | Herramientas MCP → `/internal` | `http://events-service:7004` … |
| `RABBITMQ_MANAGEMENT_URL` 🔒 | `get_service_health` (usuario `monitor`, solo lectura) | `http://rabbitmq:15672` |
| `LLM_PROVIDER` | `claude` / `ollama` (D8) | `ollama` |
| `ANTHROPIC_API_KEY` 🔒 | Claude API | — |
| `LLM_MODEL` / `LLM_MODEL_CHEAP` | D8 | `claude-sonnet-5-5` / `claude-haiku-5-5` |
| `OLLAMA_URL` / `OLLAMA_MODEL` | Dev | `http://ollama:11434` / `llama3.2` |
| `TTS_PROVIDER` | `polly` / `piper` | `piper` |
| `TTS_VOICE_ES` / `TTS_VOICE_EN` | Voz por idioma (D14; verificar ids reales) | `es-MX-neural` / `en-US-neural` |
| `PIPER_URL` | Servidor Piper local (contenedor opcional del perfil `llm`, ADR-0016) | `http://piper:5002` |
| `AGENT_MAX_STEPS` / `AGENT_MAX_TOKENS` | Guardarraíles D8 | `8` / `20000` |
| `MONITORING_CRON` | RF-24 | `*/5 * * * *` |
| `ANOMALY_MODEL_VERSION` | Isolation Forest ONNX | `1.0.0` |
| `MCP_ALLOWED_ORIGINS` | Validación de `Origin` en Streamable HTTP | `http://admin.bandada.localhost` |

### 4.10 admin-gateway (S9 · NestJS + Apollo)

| Variable | Descripción | Servicio / Compose |
|---|---|---|
| `JWT_AUDIENCE` | Audiencias aceptadas (los tokens del panel llevan `aud=bandada-admin`) | `bandada-admin` |
| `IDENTITY_URL`, `SOCIAL_SERVICE_URL`, `MEDIA_SERVICE_URL`, `EVENTS_SERVICE_URL`, `WALLET_SERVICE_URL`, `TICKETING_SERVICE_URL`, `NOTIFICATION_SERVICE_URL` | Data sources (si falta `NOTIFICATION_SERVICE_URL` usa `http://notification-service:7007`) | `http://identity-service:7001` … |
| `INSIGHTS_SERVICE_URL` | **Fase 2**: sin uso en la fase 1 | `http://insights-service:7008` |
| `SERVICE_CLIENT_ID` / `SERVICE_CLIENT_SECRET` 🔒 / `SERVICE_TOKEN_SCOPES` | Token de servicio | `admin-gateway` / `dev-secret-admin-gateway` / `internal:read,internal:write` |
| `RABBITMQ_URL` | Origen de las subscriptions: cola exclusiva *auto-delete* `admin-gateway.subscriptions.<instanceId>` que declara el propio gateway (ADR-0016) | `amqp://bandada:bandada@rabbitmq:5672` |
| `INSTANCE_ID` | Id de esa cola; aleatorio si se omite | — |
| `RABBITMQ_MANAGEMENT_URL` / `RABBITMQ_MANAGEMENT_USER` / `RABBITMQ_MANAGEMENT_PASSWORD` 🔒 | Opcional: `serviceHealth.queues` (usuario `monitor`, solo lectura) | `http://localhost:15672` / `monitor` / `monitor_dev` |
| `GRAPHQL_MAX_DEPTH` / `GRAPHQL_MAX_COMPLEXITY` | D11 | `7` / `1000` |
| `GRAPHQL_INTROSPECTION` | `false` en prod (por defecto sigue a `NODE_ENV`) | `true` |
| `GRAPHQL_LANDING_PAGE` | Apollo Sandbox, solo dev | `true` |
| `HTTP_TIMEOUT_MS` | Llamadas a servicios | `3000` |

### 4.11 Frontends (variables públicas de build)

Fuente: los `.env.example` de cada app. Los frontends usan el host sin sufijo (`http://api.bandada.localhost`); la ruta `/api/v1` la agrega el cliente.

| App | Variable | Ejemplo dev |
|---|---|---|
| landing | `NEXT_PUBLIC_API_URL` | `http://api.bandada.localhost` |
| landing | `NEXT_PUBLIC_APP_URL` / `NEXT_PUBLIC_ADMIN_URL` | `http://app.bandada.localhost` / `http://admin.bandada.localhost` |
| landing | `NEXT_PUBLIC_SITE_URL` | `http://bandada.localhost` (canonical, hreflang, Open Graph) |
| admin-shell | `NEXT_PUBLIC_API_URL` | `http://api.bandada.localhost` (login, handoff exchange) |
| admin-shell | `NEXT_PUBLIC_GRAPHQL_URL` / `NEXT_PUBLIC_GRAPHQL_WS_URL` | `http://api.bandada.localhost/graphql` / `ws://api.bandada.localhost/graphql` |
| admin-shell | `NEXT_PUBLIC_APP_URL` | `http://app.bandada.localhost` (botón "Abrir en la app") |
| admin-shell | `NEXT_PUBLIC_MFE_MANIFEST_URL` | `/mfe-manifest.json` |
| admin-shell | `NEXT_PUBLIC_DEFAULT_LOCALE` | `es` |
| admin-shell | `NEXT_PUBLIC_FEATURE_INSIGHTS` | `false` (fase 2: la tarjeta muestra "Disponible en fase 2") |
| mfe-moderation | *(sin variables)* | `.env.example` solo informativo; en modo standalone el host de prueba usa `?gql=<url>` (por defecto `http://localhost:4010/graphql`, el mock) |
| mfe-insights | `.env.example` | no existe (fase 2; `VITE_*` no verificado) |
| MFEs | *(sin URLs propias)* `graphql-url`, `access-token`, `base-path`, `theme`, `locale` llegan del shell por atributos/propiedades (D5) | — |
| mobile | `EXPO_PUBLIC_API_URL` | `http://api.bandada.localhost` (teléfono físico: `http://<IP-LAN>` con `Host` reescrito por Traefik o túnel) |
| mobile | `EXPO_PUBLIC_APP_URL` / `EXPO_PUBLIC_ADMIN_URL` | `http://app.bandada.localhost` / `http://admin.bandada.localhost` |
| mobile | `EXPO_PUBLIC_BASE_DOMAIN` / `EXPO_PUBLIC_DEFAULT_LOCALE` | `bandada.localhost` / `es` |
| mobile | `EXPO_PUBLIC_USE_MOCKS` | `false` (`true` sirve fixtures locales cuando falta un servicio) |
| mobile | `EXPO_PUBLIC_LOCAL_LLM_MODEL_URL` | `http://s3.bandada.localhost/bandada-public/mobile/llm/model-manifest.json` (fase 2) |
| mobile | `EXPO_PUBLIC_NSFW_MODEL_URL` | `http://s3.bandada.localhost/bandada-public/mobile/nsfw-mobile/1.0.0/model.onnx` (fase 2) |
| mobile | `EXPO_PUBLIC_EAS_PROJECT_ID` | (de EAS) |

### 4.12 n8n

n8n corre en el perfil `infra` (imagen `n8nio/n8n:2.43.5`, **SQLite** en el volumen `n8n-data`: `DB_TYPE=sqlite`, ADR-0016). Los workflows de `bandadau-infra/n8n/workflows/`
y las credenciales renderizadas desde variables se importan al arrancar (`n8n/scripts/entrypoint.sh`). Los workflows son de la fase 2 (el README de infra aún dice que la
fase 1 no los usa); su ejecución de punta a punta no está verificada.

| Variable | Descripción | Ejemplo dev |
|---|---|---|
| `N8N_ENCRYPTION_KEY` 🔒 | Cifra credenciales en n8n (no cambiar) | `dev-n8n-key-32-chars-xxxxxxxxxxxx` |
| `N8N_HOST` / `N8N_PROTOCOL` / `N8N_PORT` / `WEBHOOK_URL` | URL pública | `n8n.bandada.localhost` / `http` / `5678` / `http://n8n.bandada.localhost/` |
| `N8N_SECURE_COOKIE` | `false`: local sin TLS | `false` |
| `GENERIC_TIMEZONE` / `TZ` | Cron en hora local | `America/La_Paz` |
| `DB_TYPE` | SQLite propia (la instancia Postgres mantiene exactamente 3 bases) | `sqlite` |
| `EXECUTIONS_DATA_PRUNE` / `EXECUTIONS_DATA_MAX_AGE` | Purga de ejecuciones | `true` / `168` (horas) |
| `N8N_OWNER_EMAIL` / `N8N_OWNER_PASSWORD_HASH` 🔒 / `N8N_OWNER_FIRST_NAME` / `N8N_OWNER_LAST_NAME` | Propietario gestionado por variables (hash bcrypt entre comillas simples; vacío = crear el propietario desde la UI) | `admin@bandada.localhost` / hash de desarrollo |
| `RABBITMQ_HOST` / `RABBITMQ_PORT` / `RABBITMQ_N8N_USER` / `RABBITMQ_N8N_PASSWORD` 🔒 | Usuario `n8n` del broker (las credenciales de los workflows salen solo de variables) | `rabbitmq` / `5672` / `n8n` / `n8n_dev` |
| `N8N_SERVICE_CLIENT_ID` / `N8N_SERVICE_CLIENT_SECRET` 🔒 | Token de servicio para `/internal` | `n8n` / `dev-secret-n8n` |
| `BANDADA_API_URL` | REST público (`POST /insights/reports`) | `http://api.bandada.localhost/api/v1` |
| `BANDADA_{IDENTITY,SOCIAL,MEDIA,EVENTS,NOTIFICATION,INSIGHTS}_INTERNAL_URL` | URLs internas | `http://identity-service:7001` … `http://insights-service:7008` |
| `BANDADA_ADMIN_URL` / `BANDADA_APP_URL` / `N8N_PUBLIC_URL` | Enlaces en mensajes | `http://admin.${BASE_DOMAIN}` / `http://app.${BASE_DOMAIN}` / `http://localhost:5678` |
| `N8N_WELCOME_DELAY` / `N8N_REPORT_POLL_SECONDS` | Espera de wf-01 (0 en pruebas) / sondeo de reportes | `3600` / `60` |
| `N8N_STAFF_RECIPIENTS` / `N8N_ERROR_EMAIL` | JSON de destinatarios del equipo (vacío = `moderacion@` es, `admin@` en) / correo de errores | vacío / `devs@bandada.localhost` |
| `MAIL_FROM` / `SMTP_HOST` / `SMTP_PORT` | Mailpit / SES SMTP | `Bandada U <no-reply@bandada.localhost>` / `mailpit` / `1025` |
| `TELEGRAM_BOT_TOKEN` 🔒 / `TELEGRAM_STAFF_CHAT_ID` | Opcional (D10) | — |
| `N8N_BLOCK_ENV_ACCESS_IN_NODE` | Permitir leer variables con `$env` | `false` |

Nombres alineados con `bandadau-docs/docs/03-arquitectura/automatizacion-n8n.md`.

---

## 5. Secretos: dónde viven

| Secreto | local | CI (GitHub) | dev / prod (AWS) |
|---|---|---|---|
| Contraseñas de bases y broker por servicio | `bandadau-infra/.env` (git-ignored, generado por `make env` desde `.env.example`) | valores fijos de prueba en el workflow | SSM `SecureString` `/bandada/<env>/<servicio>/<VAR>` |
| Contraseña maestra RDS | — | — | Secrets Manager (gestionada por RDS) — solo la usa `db-bootstrap` |
| Llaves JWT RS256 (identity) | `JWT_PRIVATE_KEY_PATH` generado por `make keys` (git-ignored) o por identity en `./secrets` | generadas en el job | Tabla `signing_keys` (cifradas) + `JWT_KEK` en Secrets Manager; rotación cada 90 días (`seguridad-y-sso.md` §2.2) |
| Llave ES256 del QR (ticketing) | `make keys` (`secrets/qr-es256.pem`, montado de solo lectura) | generada en el job | SSM `SecureString` |
| `SERVICE_CLIENT_SECRET` por servicio | `.env` | fijos de prueba | SSM `SecureString` |
| `PAYMENT_WEBHOOK_SECRET`, `APP_KEY` (Laravel) | `.env` | fijos de prueba | SSM `SecureString` |
| `ANTHROPIC_API_KEY` | `.env` personal (opcional; si falta → Ollama) | no (los tests usan un `LlmPort` falso) | Secrets Manager `bandada/<env>/anthropic` |
| `EXPO_ACCESS_TOKEN` (push) | — | — | SSM `SecureString` |
| `EXPO_TOKEN` (EAS Build) | cuenta personal | GitHub Secret | — |
| Credenciales AWS de CI | — | **ninguna**: OIDC → rol `bandada-gha-<env>` (ARN en *GitHub Variables*) | — |
| `N8N_ENCRYPTION_KEY`, Telegram | `.env` | — | SSM `SecureString` |
| `ORIGIN_VERIFY_SECRET`, `OPS_BASIC_AUTH` | — | — | SSM `SecureString` (CloudFront lo recibe como parámetro de la pila) |

Reglas:

1. Nada con 🔒 en git, en `NEXT_PUBLIC_*`/`EXPO_PUBLIC_*`/`NG_APP_*`/`VITE_*`, en logs ni en
   mensajes de RabbitMQ.
2. En el EC2, `render-env.sh` materializa los parámetros en `/opt/bandada/env/<servicio>.env`
   (`chmod 600`, dueño `root`); los PEM se montan como archivos de solo lectura en `/run/secrets/`.
3. Rotar un secreto = actualizar el parámetro + `host-deploy.sh <servicio> <tag-actual>`.
4. Las credenciales de los usuarios de demo están solo en `bandadau-infra/seed/` y **no** sirven en prod
   (el seed de prod genera contraseñas aleatorias y las guarda en SSM).

---

## 6. Divergencias detectadas (a resolver por los dueños)

| # | Dónde | Divergencia | Propuesta | Estado |
|---|---|---|---|---|
| V-1 | `bandadau-backend/services/wallet-service/AGENTS.md` | `TOPUP_PACKAGES=50,100,200,500` vs RF-19 (paquetes 20/50/100) | Usar `20,50,100` o actualizar RF-19 | ✔ **Resuelta por ADR-0016 e implementada**: paquetes `CREDITS_20`, `CREDITS_50`, `CREDITS_100` (RF-19; `TopUpPackage` en `wallet-service.yaml`); `.env.example` del servicio y de infra ya los usan. |
| V-2 | `bandadau-backend/services/media-service/AGENTS.md` | `MAX_VIDEO_BYTES=104857600` (100 MB) vs RF-06 (≤ 50 MB) | `52428800` | ✔ **Resuelta por ADR-0016 e implementada**: video ≤ 50 MB (`52428800`), imagen ≤ 10 MB; ya en ambos `.env.example`. |
| V-3 | `bandadau-backend/services/ticketing-service/AGENTS.md` | `QR_SIGNING_KEY=change-me-32-bytes-min` sugería HMAC; UC-14 exige JWS **ES256** | Ruta a PEM P-256 + publicar la llave pública | ✔ **Resuelta e implementada**: `QR_SIGNING_KEY_PATH` (PEM P-256, `make keys`) + `QR_SIGNING_KID`; `qrPayload` = JWS compacto **ES256** y clave pública en `GET /tickets/signing-keys`. |
| V-4 | `bandadau-backend/services/identity-service/AGENTS.md` | `JWT_PRIVATE_KEY_PATH` (archivo) vs `seguridad-y-sso.md` §2.2 (`signing_keys` + `JWT_KEK`) | Archivo solo en `local`; prod con `signing_keys` | ✔ **Implementada en el servicio**: el par RS256 se genera al primer arranque y se guarda cifrado en `signing_keys` con `JWT_KEK`; `JWT_PRIVATE_KEY_PATH` solo importa una llave existente como la primera. El Compose local solo define la ruta (el perfil `dev` relaja `JWT_KEK`). |
| V-5 | `bandadau-backend/services/insights-service/AGENTS.md` | `PIPER_URL` implica un contenedor Piper que no está en el catálogo §3 | Agregar Piper al catálogo (ADR) o ejecutar Piper dentro de la imagen de insights | ✔ **Resuelta por ADR-0016** (contenedor opcional del perfil `llm`). **Pendiente fase 2** (el perfil `llm` está vacío en el Compose). |
| V-6 | `bandadau-backend/services/*/AGENTS.md` | `RABBITMQ_URL` con usuario compartido `bandada` | Aceptable en local; en prod un usuario por servicio (RNF-07) | Abierta (el `definitions.json` local crea solo `bandada`, `n8n`, `monitor` y `admin`; el modelo por servicio es de AWS, pendiente). |
| V-7 | `notification-service`, `wallet-service` | `AWS_DEFAULT_REGION` vs `AWS_REGION` | Aceptar ambos (documentado en §4.1) | ✔ **Resuelta en el Compose**: define `AWS_REGION` y `AWS_DEFAULT_REGION`. |
| V-8 | `bandadau-backend/services/admin-gateway/AGENTS.md` | `RABBITMQ_URL` en el gateway sin cola en el catálogo §5 | Definir el origen de las subscriptions | ✔ **Resuelta por ADR-0016 e implementada**: cola exclusiva *auto-delete* `admin-gateway.subscriptions.<instanceId>` (la declara el gateway; catálogo §5; canal `qAdminGatewaySubscriptionsQueue` en `bandada-events.yaml`). |
| V-9 | `media-service` vs Compose | `UPLOAD_URL_TTL_SECONDS`: el servicio y el contrato usan `900`; `docker-compose.yaml` y `bandadau-infra/.env.example` fijan `300` | Alinear el Compose con el contrato (`900`) | Abierta (el valor del Compose gana en `make up`). |
| V-10 | `wallet-service`, `ticketing-service` vs infra | Alias heredados que el código no lee: `SIMULATE_PAYMENT_ENABLED` (el servicio usa `PAYMENT_SIMULATOR_ENABLED`) y `QR_KEY_ID` (usa `QR_SIGNING_KID`) | Retirar los alias del Compose y del `.env.example` de infra | Abierta (inofensiva). |
