# Entornos y variables — Bandada U

Variables de entorno por componente, puertos, URLs por entorno y dónde vive cada secreto.
Puertos y nombres salen de `bandadau-docs/docs/03-arquitectura/catalogo-servicios.md` (normativo).
Cada componente mantiene su `.env.example` **completo** con los valores de la columna
"Ejemplo dev" y **valida al arrancar** (fail fast); este documento es el índice.

Convenciones: `UPPER_SNAKE_CASE`; públicas de build con prefijo `NEXT_PUBLIC_*`, `EXPO_PUBLIC_*`,
`NG_APP_*`, `VITE_*` (se hornean en el bundle: **nunca** secretos); 🔒 = secreto.

---

## 1. Entornos

| Entorno | Para qué | Dónde corre | `BASE_DOMAIN` | Rama | Datos |
|---|---|---|---|---|---|
| `local` | Desarrollo diario de cada persona/agente | Docker Compose en la laptop | `bandada.localhost` | cualquiera | Seed de demo, volúmenes locales |
| `ci` | Pruebas automáticas | Runner de GitHub Actions (Testcontainers / `make up`) | `bandada.localhost` | PR | Efímeros |
| `dev` | Integración en nube (opcional, efímero) | Pila AWS `bandada-dev` | `dev.bandadau.com` | `develop` | Seed de demo |
| `prod` | Demo / defensa | Pila AWS `bandada-prod` | `bandadau.com` | `main` | Seed de demo + datos de la defensa |

## 2. URLs por entorno

| Componente | local | dev | prod |
|---|---|---|---|
| Landing (F1) | `http://bandada.localhost` | `https://dev.bandadau.com` | `https://bandadau.com` (`www` redirige) |
| App web PWA (F5) | `http://app.bandada.localhost` | `https://app.dev.bandadau.com` | `https://app.bandadau.com` |
| Panel shell (F2) | `http://admin.bandada.localhost` | `https://admin.dev.bandadau.com` | `https://admin.bandadau.com` |
| MFEs (F3, F4) | `http://mfe.bandada.localhost/{moderation,insights}/` | `https://mfe.dev.bandadau.com/…` | `https://mfe.bandadau.com/…` |
| API REST | `http://api.bandada.localhost/api/v1` | `https://api.dev.bandadau.com/api/v1` | `https://api.bandadau.com/api/v1` |
| GraphQL (HTTP / WS) | `http://api.bandada.localhost/graphql` · `ws://…/graphql` | `https://…/graphql` · `wss://…` | `https://api.bandadau.com/graphql` · `wss://api.bandadau.com/graphql` |
| MCP | `http://api.bandada.localhost/mcp` | `https://api.dev.bandadau.com/mcp` | `https://api.bandadau.com/mcp` |
| JWKS | `http://api.bandada.localhost/.well-known/jwks.json` | … | `https://api.bandadau.com/.well-known/jwks.json` |
| Objetos (URLs prefirmadas) | `http://s3.bandada.localhost` (MinIO) | `https://bandada-dev-media.s3.us-east-1.amazonaws.com` | `https://bandada-prod-media.s3.us-east-1.amazonaws.com` |
| n8n | `http://n8n.bandada.localhost` / `:5678` | `https://n8n.dev.bandadau.com` (protegido) | `https://n8n.bandadau.com` (protegido) |
| Grafana | `http://grafana.bandada.localhost` / `:3300` | `https://grafana.dev.bandadau.com` (protegido) | `https://grafana.bandadau.com` (protegido) |
| RabbitMQ UI | `http://localhost:15672` | Session Manager *port forwarding* | ídem |
| Mailpit | `http://localhost:8025` | — (SES) | — (SES) |
| MinIO consola | `http://localhost:9001` | — | — |
| Traefik dashboard | `http://localhost:8080` | deshabilitado | deshabilitado |

Deep links móviles: scheme `bandadau://`; universal links `https://app.<BASE_DOMAIN>/…`.

## 3. Puertos

| Puerto | Componente | Expuesto en host (local) |
|---|---|---|
| 80 / 8080 | Traefik / dashboard | sí |
| 7001 | identity-service | vía Traefik (y directo para depurar) |
| 7002 | social-service | ídem |
| 7003 | media-service | ídem |
| 7004 | events-service | ídem |
| 7005 | wallet-service | ídem |
| 7006 | ticketing-service | ídem |
| 7007 | notification-service | ídem |
| 7008 | insights-service | ídem |
| 7010 | admin-gateway | ídem |
| 3000 | landing (dev server) | sí |
| 3001 | admin-shell (dev server) | sí |
| 4201 | mfe-moderation | sí |
| 4301 | mfe-insights | sí |
| 8081 | mobile (Metro / web) | sí |
| 5432 | PostgreSQL | `127.0.0.1` |
| 27017 | MongoDB | `127.0.0.1` |
| 8000 | DynamoDB Local | `127.0.0.1` |
| 5672 / 15672 | RabbitMQ AMQP / UI | `127.0.0.1` / sí |
| 9000 / 9001 | MinIO API / consola | sí |
| 5678 | n8n | sí |
| 3300 / 4317 / 4318 | Grafana / OTLP gRPC / OTLP HTTP | sí |
| 8025 / 1025 | Mailpit UI / SMTP | sí |
| 11434 | Ollama | sí (perfil `llm`) |

---

## 4. Variables por componente

### 4.0 `bandadau-infra/.env` (Compose)

| Variable | Descripción | Ejemplo dev |
|---|---|---|
| `BASE_DOMAIN` | Dominio raíz | `bandada.localhost` |
| `COMPOSE_PROFILES` | Perfiles activos | `infra,services` |
| `TZ` | Zona horaria de contenedores de operación | `America/La_Paz` |
| `POSTGRES_PASSWORD` 🔒 | Superusuario de Postgres (local) / maestro RDS (prod, Secrets Manager) | `postgres` |
| `IDENTITY_DB_PASSWORD` 🔒 | usuario `identity` | `identity_dev` |
| `EVENTS_DB_PASSWORD` 🔒 | usuario `events` | `events_dev` |
| `WALLET_DB_PASSWORD` 🔒 | usuario `wallet` | `wallet_dev` |
| `MONGO_ROOT_PASSWORD` 🔒 | Raíz de Mongo | `mongo_dev` |
| `SOCIAL_MONGO_PASSWORD` 🔒 / `MEDIA_MONGO_PASSWORD` 🔒 | Usuarios de Mongo `social` / `media` | `social_dev` / `media_dev` |
| `RABBITMQ_ADMIN_PASSWORD` 🔒 | Usuario `admin` (UI) | `admin` |
| `RABBITMQ_DEFAULT_USER` / `RABBITMQ_DEFAULT_PASS` 🔒 | Usuario compartido de desarrollo | `bandada` / `bandada` |
| `RABBITMQ_<SVC>_PASSWORD` 🔒 | Prod: un usuario por servicio (`IDENTITY`, `SOCIAL`, …, `N8N`, `MONITOR`) | — |
| `MINIO_ROOT_USER` / `MINIO_ROOT_PASSWORD` 🔒 | Raíz de MinIO | `minio` / `minio_dev_pw` |
| `N8N_ENCRYPTION_KEY` 🔒 | Cifra credenciales en n8n (no cambiar) | `dev-n8n-key-32-chars-xxxxxxxxxxxx` |
| `GRAFANA_ADMIN_PASSWORD` 🔒 | Grafana | `admin` |
| `OPS_BASIC_AUTH` 🔒 | `htpasswd` para n8n/Grafana en prod | — (vacío en local) |
| `ORIGIN_VERIFY_SECRET` 🔒 | Cabecera `X-Origin-Verify` CloudFront → Traefik (prod) | — |
| `CHAOS_TICKETING_FAIL` | Demo de rollback (D2) | `false` |
| `CHAOS_WALLET_DELAY_MS` | Demo de timeout (D2) | `0` |
| `IMAGE_TAG` | Tag de imágenes (prod) | `local` |

> **Fuente**: los nombres siguen los bloques `.env` de cada `bandadau-backend/services/<x>/AGENTS.md` (dueños de su
> configuración). Esos archivos usan `localhost` (servicio corriendo en el IDE); la columna
> "Ejemplo dev (Compose)" muestra el valor **dentro de Docker Compose** (nombres de contenedor).
> Las divergencias detectadas con requisitos/arquitectura están en §6.

### 4.1 Comunes a todos los servicios backend

| Variable | Descripción | Ejemplo dev (Compose) |
|---|---|---|
| `PORT` (Laravel: `APP_PORT`) | Puerto HTTP | `7004` |
| `APP_ENV` / `SPRING_PROFILES_ACTIVE` / `NODE_ENV` | Entorno (`local`, `ci`, `dev`, `prod`) | `local` |
| `RABBITMQ_URL` 🔒 | AMQP | `amqp://bandada:bandada@rabbitmq:5672` (prod: usuario propio del servicio) |
| `JWKS_URL` | JWKS interno de identity (no pasa por Traefik) | `http://identity-service:7001/.well-known/jwks.json` |
| `JWT_ISSUER` | `iss` esperado | `http://api.bandada.localhost` |
| `SERVICE_CLIENT_ID` / `SERVICE_CLIENT_SECRET` 🔒 | Client credentials para `issueServiceToken` (quien llama `/internal`) | `events-service` / `change-me` |
| `IDENTITY_URL` | Para pedir el token de servicio | `http://identity-service:7001` |
| `IDEMPOTENCY_TABLE` | Tabla compartida (D3) | `bandada-idempotency` |
| `DYNAMODB_ENDPOINT` | Solo local/CI (vacío en AWS) | `http://dynamodb-local:8000` |
| `AWS_REGION` (Laravel: `AWS_DEFAULT_REGION`) | Región | `us-east-1` |
| `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` | Solo local (ficticias); en AWS, rol del EC2 | `local` / `local` |
| `DEFAULT_LOCALE` (Laravel: `APP_LOCALE` + `APP_FALLBACK_LOCALE`) | Idioma si falta `Accept-Language` (D14) | `es` |
| `SUPPORTED_LOCALES` | Idiomas soportados (D14) | `es,en` |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | Colector OTLP HTTP | `http://lgtm:4318` |
| `OTEL_SERVICE_NAME` | Nombre del servicio | `events-service` |
| `OTEL_RESOURCE_ATTRIBUTES` | Entorno y versión | `deployment.environment=local` |
| `<X>_SERVICE_URL` | URL interna de otro servicio (`SOCIAL_`, `MEDIA_`, `EVENTS_`, `WALLET_`, `TICKETING_`, `INSIGHTS_`) | `http://media-service:7003` |

### 4.2 identity-service (S1 · Spring Boot)

| Variable | Descripción | Ejemplo dev (Compose) |
|---|---|---|
| `DATABASE_URL` | JDBC | `jdbc:postgresql://postgres:5432/identity_db` |
| `DATABASE_USER` / `DATABASE_PASSWORD` 🔒 | Usuario propio | `identity` / `identity_dev` |
| `JWT_PRIVATE_KEY_PATH` 🔒 | Llave RS256 de desarrollo (en prod las llaves viven en `signing_keys` cifradas con `JWT_KEK`, `seguridad-y-sso.md` §2.2) | `/run/secrets/jwt-private.pem` |
| `JWT_KEY_ID` | `kid` de la llave de desarrollo | `dev-2026-10` |
| `JWT_KEK` 🔒 | Llave que cifra `signing_keys.private_key_enc` (prod) | — |
| `ACCESS_TOKEN_TTL` / `REFRESH_TOKEN_TTL` / `HANDOFF_CODE_TTL` | RF-03 / RF-04 | `PT15M` / `P30D` / `PT60S` |
| `APP_BASE_URL` / `ADMIN_BASE_URL` | `redirectUrl` del handoff (RN-03.6) | `http://app.bandada.localhost` / `http://admin.bandada.localhost` |
| `SMTP_HOST` / `SMTP_PORT` / `MAIL_FROM` | Envío del código de verificación | `mailpit` / `1025` / `no-reply@${BASE_DOMAIN}` |
| `SERVICE_CLIENTS` 🔒 | Client credentials registrados (`id:secret,…` en dev; hash en prod) | `admin-gateway:secret,insights-service:secret,…` |

### 4.3 social-service (S2 · NestJS)

| Variable | Descripción | Ejemplo dev (Compose) |
|---|---|---|
| `MONGODB_URI` 🔒 | rs0 | `mongodb://social:social_dev@mongo:27017/social?replicaSet=rs0&authSource=social` |
| `MEDIA_SERVICE_URL` | Consultas internas a media | `http://media-service:7003` |
| `FEED_MODEL_PATH` | Coeficientes del `feed-ranker` (D7) | `/app/models/feed-ranker/coefficients.json` |
| `REPORT_HIDE_THRESHOLD` | RF-13 (UC-10) | `3` |

### 4.4 media-service (S3 · NestJS + ONNX)

| Variable | Descripción | Ejemplo dev (Compose) |
|---|---|---|
| `MONGODB_URI` 🔒 | rs0 | `mongodb://media:media_dev@mongo:27017/media?replicaSet=rs0&authSource=media` |
| `S3_ENDPOINT` | Solo local (MinIO) | `http://minio:9000` |
| `S3_PUBLIC_ENDPOINT` | Host con el que se **firman** las URLs que abre el cliente | `http://s3.bandada.localhost` (IDE: `http://localhost:9000`) |
| `S3_FORCE_PATH_STYLE` | MinIO | `true` |
| `S3_ACCESS_KEY_ID` / `S3_SECRET_ACCESS_KEY` 🔒 | Solo local (usuario MinIO del servicio) | `media-svc` / `change-me` |
| `S3_BUCKET_MEDIA` / `S3_BUCKET_MODELS` | Buckets | `bandada-media` / `bandada-models` |
| `UPLOAD_URL_TTL_SECONDS` | Vida del PUT prefirmado | `300` |
| `MAX_IMAGE_BYTES` / `MAX_VIDEO_BYTES` | Límites (RF-06: video ≤ 50 MB, ver §6) | `10485760` / `52428800` |
| `MODEL_NSFW_VERSION` / `MODEL_VIOLENCE_VERSION` / `MODEL_CLIP_VERSION` | Versiones (D7) | `1.0.0` |
| `MODERATION_BLOCK_THRESHOLD` / `MODERATION_REVIEW_THRESHOLD` | D7 | `0.85` / `0.5` |
| `VIDEO_FRAME_INTERVAL_SECONDS` / `VIDEO_MAX_FRAMES` | D7 | `2` / `30` |

### 4.5 events-service (S4 · Spring Boot, DDD)

| Variable | Descripción | Ejemplo dev (Compose) |
|---|---|---|
| `DATABASE_URL` | JDBC | `jdbc:postgresql://postgres:5432/events_db` |
| `DATABASE_USER` / `DATABASE_PASSWORD` 🔒 | | `events` / `events_dev` |
| `MEDIA_SERVICE_URL` | Validar portada | `http://media-service:7003` |
| `SAGA_STEP_TIMEOUT` / `SAGA_SCHEDULER_INTERVAL` / `SAGA_COMMAND_MAX_RETRIES` | D2 | `PT30S` / `PT5S` / `3` |
| `OUTBOX_RELAY_INTERVAL` | Relay del outbox | `PT1S` |

### 4.6 wallet-service (S5 · Laravel)

| Variable | Descripción | Ejemplo dev (Compose) |
|---|---|---|
| `APP_KEY` 🔒 | Llave de Laravel | `base64:…` (`php artisan key:generate`) |
| `DB_CONNECTION` / `DB_HOST` / `DB_PORT` / `DB_DATABASE` | | `pgsql` / `postgres` / `5432` / `wallet_db` |
| `DB_USERNAME` / `DB_PASSWORD` 🔒 | | `wallet` / `wallet_dev` |
| `PAYMENT_WEBHOOK_SECRET` 🔒 | HMAC del webhook | `change-me` |
| `PAYMENT_CHECKOUT_BASE_URL` | Página de la pasarela simulada | `http://app.bandada.localhost/wallet/checkout` |
| `SIMULATE_PAYMENT_ENABLED` | `simulateTopUpPayment` (solo dev/demo) | `true` |
| `TOPUP_PACKAGES` | RF-19: `20,50,100` (ver §6) | `20,50,100` |
| `CHAOS_WALLET_DELAY_MS` | D2 | `0` |

Contenedores extra con la misma imagen y variables: `wallet-service-consumer`, `wallet-service-outbox-relay`.

### 4.7 ticketing-service (S6 · NestJS)

| Variable | Descripción | Ejemplo dev (Compose) |
|---|---|---|
| `TICKETING_TABLE` | Tabla | `bandada-ticketing` |
| `EVENTS_SERVICE_URL` | Verificar organizador del evento | `http://events-service:7004` |
| `QR_SIGNING_KEY` 🔒 | Llave privada **ES256** (PEM P-256) del JWS del QR (UC-14; ver §6) | `/run/secrets/qr-es256.pem` |
| `QR_KEY_ID` | `kid` | `dev-1` |
| `CHAOS_TICKETING_FAIL` | D2 | `false` |

### 4.8 notification-service (S7 · Laravel)

| Variable | Descripción | Ejemplo dev (Compose) |
|---|---|---|
| `APP_KEY` 🔒 | | `base64:…` |
| `NOTIFICATIONS_TABLE` | Tabla | `bandada-notifications` |
| `NOTIFICATION_TTL_DAYS` | Catálogo §6 | `90` |
| `MAIL_MAILER` | `smtp` (local) / `ses` (AWS) | `smtp` |
| `MAIL_HOST` / `MAIL_PORT` / `MAIL_FROM_ADDRESS` | Mailpit | `mailpit` / `1025` / `no-reply@${BASE_DOMAIN}` |
| `EXPO_PUSH_URL` / `EXPO_ACCESS_TOKEN` 🔒 | Expo Push | `https://exp.host/--/api/v2/push/send` / — |
| `APP_DEEP_LINK_BASE` | Enlaces en push/correo | `http://app.bandada.localhost` |
| `SUPPORTED_LOCALES` | Plantillas por `locale` del destinatario (D14) | `es,en` |

Contenedor extra: `notification-service-consumer` (y relay si publica).

### 4.9 insights-service (S8 · NestJS, agentes + MCP)

| Variable | Descripción | Ejemplo dev (Compose) |
|---|---|---|
| `INSIGHTS_TABLE` | Tabla | `bandada-insights` |
| `S3_ENDPOINT` / `S3_PUBLIC_ENDPOINT` | Solo local | `http://minio:9000` / `http://s3.bandada.localhost` |
| `S3_BUCKET_AUDIO` / `S3_BUCKET_MODELS` | Audios de reportes / modelos | `bandada-reports` / `bandada-models` |
| `EVENTS_SERVICE_URL`, `WALLET_SERVICE_URL`, `SOCIAL_SERVICE_URL`, `MEDIA_SERVICE_URL` | Herramientas MCP → `/internal` | `http://events-service:7004` … |
| `RABBITMQ_MANAGEMENT_URL` 🔒 | `get_service_health` (usuario de solo lectura) | `http://rabbitmq:15672` |
| `LLM_PROVIDER` | `claude` / `ollama` (D8) | `ollama` |
| `ANTHROPIC_API_KEY` 🔒 | Claude API | — |
| `LLM_MODEL` / `LLM_MODEL_CHEAP` | D8 | `claude-sonnet-5-5` / `claude-haiku-5-5` |
| `OLLAMA_URL` / `OLLAMA_MODEL` | Dev | `http://ollama:11434` / `llama3.2` |
| `TTS_PROVIDER` | `polly` / `piper` | `piper` |
| `TTS_VOICE_ES` / `TTS_VOICE_EN` | Voz por idioma (D14; verificar ids reales) | `es-MX-neural` / `en-US-neural` |
| `PIPER_URL` | Servidor Piper local (ver §6: no está en el catálogo §3) | `http://piper:5002` |
| `AGENT_MAX_STEPS` / `AGENT_MAX_TOKENS` | Guardarraíles D8 | `8` / `20000` |
| `MONITORING_CRON` | RF-24 | `*/5 * * * *` |
| `ANOMALY_MODEL_VERSION` | Isolation Forest ONNX | `1.0.0` |
| `MCP_ALLOWED_ORIGINS` | Validación de `Origin` en Streamable HTTP | `http://admin.bandada.localhost` |

### 4.10 admin-gateway (S9 · NestJS + Apollo)

| Variable | Descripción | Ejemplo dev (Compose) |
|---|---|---|
| `IDENTITY_URL`, `SOCIAL_SERVICE_URL`, `MEDIA_SERVICE_URL`, `EVENTS_SERVICE_URL`, `WALLET_SERVICE_URL`, `TICKETING_SERVICE_URL`, `INSIGHTS_SERVICE_URL` | Data sources | `http://identity-service:7001` … |
| `RABBITMQ_URL` | Origen de las subscriptions (ver §6) | `amqp://bandada:bandada@rabbitmq:5672` |
| `GRAPHQL_MAX_DEPTH` / `GRAPHQL_MAX_COMPLEXITY` | D11 | `7` / `1000` |
| `GRAPHQL_INTROSPECTION` | `false` en prod | `true` |
| `HTTP_TIMEOUT_MS` | Llamadas a servicios | `3000` |
| `SUPPORTED_LOCALES` | Reenvía `Accept-Language` | `es,en` |

### 4.11 Frontends (variables públicas de build)

| App | Variable | Ejemplo dev |
|---|---|---|
| landing | `NEXT_PUBLIC_BASE_DOMAIN` | `bandada.localhost` |
| landing | `NEXT_PUBLIC_API_URL` | `http://api.bandada.localhost/api/v1` |
| landing | `NEXT_PUBLIC_APP_URL` / `NEXT_PUBLIC_ADMIN_URL` | `http://app.bandada.localhost` / `http://admin.bandada.localhost` |
| landing | `NEXT_PUBLIC_DEFAULT_LOCALE` / `NEXT_PUBLIC_SUPPORTED_LOCALES` | `es` / `es,en` |
| admin-shell | `NEXT_PUBLIC_API_URL` | `http://api.bandada.localhost/api/v1` (login, handoff exchange) |
| admin-shell | `NEXT_PUBLIC_GRAPHQL_URL` / `NEXT_PUBLIC_GRAPHQL_WS_URL` | `http://api.bandada.localhost/graphql` / `ws://api.bandada.localhost/graphql` |
| admin-shell | `NEXT_PUBLIC_APP_URL` | `http://app.bandada.localhost` (botón "Abrir en la app") |
| admin-shell | `NEXT_PUBLIC_MFE_MANIFEST_URL` | `/mfe-manifest.json` |
| admin-shell | `NEXT_PUBLIC_DEFAULT_LOCALE` / `NEXT_PUBLIC_SUPPORTED_LOCALES` | `es` / `es,en` |
| mfe-moderation | `NG_APP_VERSION` (vía `@ngx-env/builder` u opción equivalente; verificar con Angular 21) | `0.1.0` |
| mfe-insights | `VITE_APP_VERSION` | `0.1.0` |
| MFEs | *(sin URLs propias)* `graphql-url`, `access-token`, `base-path`, `theme`, `locale` llegan del shell por atributos/propiedades (D5) | — |
| mobile | `EXPO_PUBLIC_BASE_DOMAIN` | `bandada.localhost` |
| mobile | `EXPO_PUBLIC_API_URL` | `http://api.bandada.localhost/api/v1` (teléfono físico: `http://<IP-LAN>/api/v1` con `Host` reescrito por Traefik o túnel) |
| mobile | `EXPO_PUBLIC_APP_URL` / `EXPO_PUBLIC_ADMIN_URL` | `http://app.bandada.localhost` / `http://admin.bandada.localhost` |
| mobile | `EXPO_PUBLIC_LOCAL_LLM_MODEL_URL` | `http://s3.bandada.localhost/bandada-public/mobile/llm/…` |
| mobile | `EXPO_PUBLIC_NSFW_MODEL_URL` | `http://s3.bandada.localhost/bandada-public/mobile/nsfw-mobile/1.0.0/model.onnx` |
| mobile | `EXPO_PUBLIC_DEFAULT_LOCALE` / `EXPO_PUBLIC_SUPPORTED_LOCALES` | `es` / `es,en` |
| mobile | `EXPO_PUBLIC_EAS_PROJECT_ID` | (de EAS) |

### 4.12 n8n

| Variable | Descripción | Ejemplo dev |
|---|---|---|
| `N8N_ENCRYPTION_KEY` 🔒 | Ver §4.0 | — |
| `N8N_HOST` / `N8N_PROTOCOL` / `WEBHOOK_URL` | URL pública | `n8n.bandada.localhost` / `http` / `http://n8n.bandada.localhost/` |
| `GENERIC_TIMEZONE` | Cron en hora local | `America/La_Paz` |
| `RABBITMQ_N8N_URL` 🔒 | Usuario `n8n` | `amqp://n8n:n8n_dev@rabbitmq:5672` |
| `N8N_SERVICE_CLIENT_ID` / `N8N_SERVICE_CLIENT_SECRET` 🔒 | Token de servicio para `/internal` | `n8n` / `change-me` |
| `BANDADA_API_URL` | REST público (`POST /insights/reports`) | `http://api.bandada.localhost/api/v1` |
| `SMTP_HOST` / `SMTP_PORT` | Mailpit / SES SMTP | `mailpit` / `1025` |
| `TELEGRAM_BOT_TOKEN` 🔒 / `TELEGRAM_STAFF_CHAT_ID` | Opcional (D10) | — |
| `N8N_BLOCK_ENV_ACCESS_IN_NODE` | Permitir leer variables con `$env` | `false` |

Nombres alineados con `bandadau-docs/docs/03-arquitectura/automatizacion-n8n.md`.

---

## 5. Secretos: dónde viven

| Secreto | local | CI (GitHub) | dev / prod (AWS) |
|---|---|---|---|
| Contraseñas de bases y broker por servicio | `bandadau-infra/.env` (git-ignored, generado por `make env` desde `.env.example`) | valores fijos de prueba en el workflow | SSM `SecureString` `/bandada/<env>/<servicio>/<VAR>` |
| Contraseña maestra RDS | — | — | Secrets Manager (gestionada por RDS) — solo la usa `db-bootstrap` |
| Llaves JWT RS256 (identity) | `JWT_PRIVATE_KEY_PATH` generado por `make keys` (git-ignored) | generadas en el job | Tabla `signing_keys` (cifradas) + `JWT_KEK` en Secrets Manager; rotación cada 90 días (`seguridad-y-sso.md` §2.2) |
| Llave ES256 del QR (ticketing) | `make keys` | generada en el job | SSM `SecureString` |
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
| V-1 | `bandadau-backend/services/wallet-service/AGENTS.md` | `TOPUP_PACKAGES=50,100,200,500` vs RF-19 (paquetes 20/50/100) | Usar `20,50,100` o actualizar RF-19 | ✔ **Resuelta por ADR-0016**: paquetes `CREDITS_20`, `CREDITS_50`, `CREDITS_100` (RF-19; `TopUpPackage` en `wallet-service.yaml`). Falta ajustar el `AGENTS.md` del servicio. |
| V-2 | `bandadau-backend/services/media-service/AGENTS.md` | `MAX_VIDEO_BYTES=104857600` (100 MB) vs RF-06 (≤ 50 MB) | `52428800` | ✔ **Resuelta por ADR-0016**: video ≤ 50 MB (`52428800`), imagen ≤ 10 MB (`media-service.yaml` `createUpload`). Falta ajustar el `AGENTS.md` del servicio. |
| V-3 | `bandadau-backend/services/ticketing-service/AGENTS.md` | `QR_SIGNING_KEY=change-me-32-bytes-min` sugiere HMAC; UC-14 exige JWS **ES256** verificable offline | Ruta a PEM P-256 + publicar la llave pública para el escáner | ✔ **Resuelta por ADR-0016**: `qrPayload` = JWS compacto **ES256** con `kid`; clave pública publicada en `GET /tickets/signing-keys` (`getTicketSigningKeys`). Falta reemplazar `QR_SIGNING_KEY` por la ruta al PEM P-256 en el `AGENTS.md`. |
| V-4 | `bandadau-backend/services/identity-service/AGENTS.md` | `JWT_PRIVATE_KEY_PATH` (archivo) vs `seguridad-y-sso.md` §2.2 (`signing_keys` + `JWT_KEK`) | Archivo solo en `local`; prod con `signing_keys` | Abierta (fuera del alcance de ADR-0016). |
| V-5 | `bandadau-backend/services/insights-service/AGENTS.md` | `PIPER_URL` implica un contenedor Piper que no está en el catálogo §3 | Agregar Piper al catálogo (ADR) o ejecutar Piper como binario dentro de la imagen de insights | ✔ **Resuelta por ADR-0016**: Piper (TTS local) como contenedor opcional del perfil `llm` (ADR-0016 §2). |
| V-6 | `bandadau-backend/services/*/AGENTS.md` | `RABBITMQ_URL` con usuario compartido `bandada` | Aceptable en local; en prod un usuario por servicio (RNF-07) | Abierta (fuera del alcance de ADR-0016). |
| V-7 | `notification-service`, `wallet-service` | `AWS_DEFAULT_REGION` vs `AWS_REGION` | Aceptar ambos (documentado en §4.1) | Abierta (fuera del alcance de ADR-0016). |
| V-8 | `bandadau-backend/services/admin-gateway/AGENTS.md` | `RABBITMQ_URL` en el gateway, pero el catálogo §5 no define cola para `admin-gateway` | Definir en `graphql-admin.md` el origen de las subscriptions; si es RabbitMQ, agregar cola `admin-gateway.subscriptions` al catálogo (ADR) | ✔ **Resuelta por ADR-0016**: cola exclusiva *auto-delete* `admin-gateway.subscriptions.<instanceId>` (catálogo §5; canal `qAdminGatewaySubscriptionsQueue` en `bandada-events.yaml`). |
