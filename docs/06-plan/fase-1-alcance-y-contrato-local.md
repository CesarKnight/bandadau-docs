# Fase 1 — Núcleo "clásico" funcionando en local

> Decisión (2026-10-14): se implementa primero todo lo **no inteligente**, de punta a punta y
> levantable con Docker; ML, deep learning e IA quedan para la **fase 2**. Este documento es
> **normativo para la fase 1**: define el alcance y el contrato de integración local que todos los
> repos deben respetar para que `make up` funcione sin sorpresas.

## 1. Alcance

| Dentro (fase 1) | Fuera (fase 2) |
|---|---|
| UC-01, 02, 03 (SSO app ↔ panel), 04 (perfil + tema + idioma; avatar sin moderación DL) | UC-17 asistente offline / IA local |
| UC-05 (online; subida a MinIO; moderación **manual**), UC-06 (feed cronológico: seguidos + grupos + populares de la carrera, **sin ranker ML**), UC-07, UC-08 (seguir/dejar de seguir; **sin sugerencias ML**), UC-09, UC-10 | UC-19 reportes generativos, UC-20 agente de monitoreo, UC-22 MCP |
| UC-11, 12, 13, 14, 15, 16, 24 (eventos, **SAGA**, wallet, tickets QR ES256, notificaciones in-app + email) | UC-23 workflows n8n (el contenedor n8n sí se levanta, sin workflows) |
| UC-18 moderación manual en el panel, UC-21 usuarios y roles | Deep learning de imágenes/video, CLIP, OCR, ranker, anomalías |
| Landing, app Expo (iOS/Android/Web), panel (shell + `mfe-moderation`), modo claro/oscuro, i18n es/en | Cola offline avanzada, Background Sync, WebLLM/ExecuTorch, `mfe-insights`, `insights-service` |

Servicios fase 1: **identity, social, media, events, wallet, ticketing, notification, admin-gateway** (8).
`insights-service` y `mfe-insights` quedan como carpetas con su `AGENTS.md`, sin código.

### Sustituciones de la fase 1
- **Moderación**: `media-service` con `MODERATION_MODE` = `allow-all` (por defecto en local: el medio pasa a
  `APPROVED` al completar la subida) o `manual` (pasa a `FLAGGED` y entra a la cola del panel). Sin modelos ONNX.
  Las denuncias (UC-10) siguen ocultando contenido y alimentando la cola. El contrato de eventos
  (`asset.approved/flagged/rejected`) **no cambia**: en fase 2 solo se reemplaza el clasificador.
- **Feed**: orden cronológico inverso con candidatos como en UC-06 pero puntaje = recencia. El campo `reasons`
  puede quedar vacío.
- **GraphQL**: `admin-gateway` implementa los campos de fase 1; los de insights/agentes responden con el error
  `extensions.code = FEATURE_DISABLED` (el SDL no cambia).
- **Pasarela de pago**: simulada dentro de wallet (`simulate-payment`, habilitada con `PAYMENT_SIMULATOR_ENABLED=true`).
- **Correo**: Mailpit. El código de verificación llega por email y además se escribe en el log de identity en `dev`.
- **Push**: Expo Push desactivado con `PUSH_ENABLED=false` (solo in-app + email).

## 2. Cómo se levanta (objetivo de la fase)

```bash
# una sola vez
cd bandadau-infra && cp .env.example .env && make setup     # corepack/pnpm, build de bandadau-shared, hosts
# backend + infraestructura (Docker)
make up                                                    # perfiles infra + services
make seed                                                  # universidades, usuarios demo, eventos
# frontends (comandos locales, hot reload)
cd ../bandadau-landing  && pnpm install && pnpm dev        # http://localhost:3000
cd ../bandadau-admin    && pnpm install && pnpm dev        # shell 3001 + mfe-moderation 4201
cd ../bandadau-frontend && pnpm install && pnpm web        # http://localhost:8081  (pnpm start → Expo)
```

Entorno del equipo: Docker Desktop (se recomienda **≥ 12 GB** de RAM asignada), Node 24; **no** hay Java, PHP,
Composer ni Gradle instalados localmente → todo Java/PHP se **compila dentro de Docker**. pnpm se obtiene con
`corepack enable`.

## 3. Contrato de integración local (todos los repos lo respetan)

### 3.1 Red, puertos y nombres
Los de `catalogo-servicios.md` (puertos 7001–7010, 5432, 27017, 8000, 5672/15672, 9000/9001, 5678, 8025, 80).
Un servicio Docker se llama como su carpeta (`identity-service`, …). Red Compose: `bandada`. Variables en
`bandadau-docs/docs/05-infraestructura/entornos-y-variables.md`. Traefik enruta `api.bandada.localhost`
(REST `/api/v1`, GraphQL `/graphql`) y bloquea `/internal`. Además **cada servicio publica su puerto en el host**
(7001…) para depurar y para que los frontends puedan usar `http://localhost:700x` si `*.localhost` no resuelve.

### 3.2 Builds
- **Java** (`identity-service`, `events-service`): Dockerfile multi-stage autocontenido (contexto = carpeta del
  servicio), JDK 25 (si la imagen no existe, 21), Gradle con wrapper (`./gradlew`), usuario no root, healthcheck
  en `/health/ready`. Memoria: `-XX:MaxRAMPercentage=60` y límite de contenedor 512 MB.
- **PHP** (`wallet-service`, `notification-service`): PHP 8.4-fpm + nginx (supervisor o contenedor `web` + `app`),
  Composer en multi-stage; `worker` para el consumidor RabbitMQ y `relay` del outbox como servicios Compose
  adicionales sobre la misma imagen.
- **Node** (social, media, ticketing, admin-gateway): contexto de build = `bandadau-backend` y
  `additional_contexts: { shared: ../bandadau-shared }`. En el Dockerfile se **replica el layout de hermanos**
  (`/work/bandadau-backend`, `/work/bandadau-shared`) para que `file:../../../bandadau-shared/packages/<pkg>`
  resuelva igual que en el host; la etapa de build corre `corepack enable && pnpm install && pnpm build` de shared.
- Cada servicio expone `GET /health/live` y `GET /health/ready`.

### 3.3 Datos y mensajería al arrancar (lo crea `bandadau-infra`)
- Postgres: bases `identity_db`, `events_db`, `wallet_db` con usuarios `identity`, `events`, `wallet`.
- Mongo `rs0` (1 nodo, keyfile) con usuarios `social`, `media`.
- DynamoDB Local: `bandada-ticketing`, `bandada-notifications`, `bandada-idempotency` (TTL) [+ `bandada-insights` vacía].
- MinIO: buckets `bandada-media`, `bandada-public` (+ `bandada-reports`, `bandada-models` vacíos). Los servicios
  firman URLs con el endpoint **público** `http://localhost:9000` (S3 compatible, `forcePathStyle`).
- RabbitMQ: exchanges `bandada.events`, `bandada.commands`, `bandada.dlx` y colas con bindings del catálogo §5, vía
  `definitions.json`. Los servicios **no** crean topología; verifican que exista y reintentan al arrancar.
- Migraciones: cada servicio las aplica al arrancar (Flyway/Liquibase, migraciones de Laravel, índices Mongo/Dynamo
  idempotentes). Orden de arranque con `depends_on: condition: service_healthy`.

### 3.4 Seguridad local
- identity genera un par RS256 al primer arranque si no hay `JWT_PRIVATE_KEY_PATH` (volumen persistente) y publica
  JWKS; el resto valida por `JWKS_URL=http://identity-service:7001/.well-known/jwks.json` con caché.
- Token de servicio (`/internal`) por client credentials con `SERVICE_CLIENTS` definidos en `.env.example`
  (`*_SERVICE_CLIENT_ID/SECRET` de desarrollo, **no secretos reales**).
- CORS: `CORS_ORIGINS` incluye `http://localhost:3000,3001,4201,8081` y `*.bandada.localhost`.

### 3.5 Datos de demo (`make seed` → `bandadau-infra/seed/`, usando solo APIs públicas/internas)
Universidad `UMSA` (dominio `umsa.edu.bo`) y `UCB` (`ucb.edu.bo`); usuarios verificados `admin@umsa.edu.bo`
(ADMIN), `mod@umsa.edu.bo` (MODERATOR), `org@umsa.edu.bo` (ORGANIZER), `lucia@umsa.edu.bo` y `marco@umsa.edu.bo`
(STUDENT) con contraseña de desarrollo `Bandada#2026` (solo `dev`); wallet de Lucía con 100 créditos; un grupo,
varios posts, 3 eventos (uno gratuito, uno de 20 créditos, uno de cupo 1 para probar `EVENT_FULL`).

### 3.6 Frontends
`NEXT_PUBLIC_API_URL`/`EXPO_PUBLIC_API_URL` = `http://localhost:80` vía Traefik (`http://api.bandada.localhost`).
Para probar en teléfono físico, `EXPO_PUBLIC_API_URL=http://<IP-LAN>` (documentado en el README del frontend).
Tokens de `@bandada/ui-tokens` y textos de `@bandada/i18n` obligatorios; modo claro/oscuro desde el día 1.

## 4. Definición de "fase 1 lista"
1. `make up && make seed` deja todo `healthy`; `make smoke` (script de `bandadau-infra`) recorre registro → login →
   post → recarga idempotente → inscripción pagada (ticket QR) → inscripción con fallo y compensación → login del
   moderador en el panel.
2. Los 3 frontends arrancan con su comando y funcionan contra el stack.
3. Cada servicio: tests de dominio/aplicación pasando, `Dockerfile` construye, contrato respetado (Spectral y
   pruebas de contrato donde existan), `AGENTS.md` y `README.md` al día.
4. Commits por repo con Conventional Commits.
