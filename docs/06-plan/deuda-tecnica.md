# Deuda técnica pendiente de código (fase 1 → fase 2)

Generado en la consolidación de contratos del **2026-10-15** (ver `registro-de-sesiones.md`). Lista lo que
**el código debe cambiar** para cumplir contratos y diseño; lo que el código hacía bien (y el contrato decía distinto) ya se corrigió
en `bandadau-docs`. Prioridad: **A** = antes de la entrega (10-nov), **B** = si hay tiempo, **F2** = fase 2.

## 1. Acciones de sincronización tras los cambios de contrato

| # | Repo | Acción | Prio |
|---|---|---|---|
| ~~S-1~~ ✅ | `bandadau-backend/services/admin-gateway` | Ejecutar `pnpm schema:sync` (la copia `schema/admin.graphql` debe ser idéntica a `bandadau-docs/contracts/graphql/admin.graphql` 1.2.0: agrega `updateUniversity`, `UpdateUniversityInput/Payload` y comentarios) y su prueba de igualdad | A — **Hecho** (`cb7dace`) |
| ~~S-2~~ ✅ | `bandadau-shared` | Ejecutar `pnpm contracts:gen` (regenera `@bandada/contracts-ts` desde OpenAPI/AsyncAPI nuevos) y `pnpm i18n:check` | A — **Hecho** (`01c21ef`) |
| ~~S-3~~ ✅ | `bandadau-shared/packages/i18n` | Agregar (es/en) los códigos que ahora figuran en los OpenAPI y faltan en `locales/*/errors.json`: `IDEMPOTENCY_KEY_REQUIRED`, `MALFORMED_REQUEST`, `INVALID_CURSOR`, `CONCURRENT_MODIFICATION`, `DEPENDENCY_UNAVAILABLE`, `MEDIA_UNAVAILABLE`, `NOTIFICATION_NOT_FOUND`, `INVALID_DEVICE_TOKEN`, `TYPE_NOT_MUTABLE`, `TICKET_NOT_FOUND`, `VALIDATION_WINDOW_CLOSED`, `INVALID_TOPUP_PACKAGE`, `TOPUP_NOT_PENDING`, `TOPUP_EXPIRED`, `TOPUP_NOT_FOUND`, `WEBHOOK_EXPIRED`, `AMOUNT_MISMATCH`, `GATEWAY_REF_CONFLICT`, `INVALID_RANGE`. Reemplazar `IDEMPOTENCY_KEY_MISSING` por `IDEMPOTENCY_KEY_REQUIRED` en `PROTOCOL_CODES` (`scripts/extract-error-codes.mjs`) y en los catálogos | A — **Hecho** (`01c21ef`) |
| ~~S-4~~ ✅ | `bandadau-admin/shell`, `bandadau-admin/mfe-moderation` | Regenerar tipos GraphQL; el panel ya espera `ALREADY_MODERATED`, `CANNOT_DEMOTE_SELF`, `CANNOT_SUSPEND_SELF`, `ROLES_REQUIRED` (ver D-3) | B — **Hecho (`7a890a3`, `5133ef3`)** |

## 2. Cumplimiento de contrato (el código debe cambiar)

| # | Servicio | Qué falta | Contrato / doc | Prio |
|---|---|---|---|---|
| ~~D-1~~ ✅ | events-service | Aceptar `endsAt` opcional en `createEvent` y exponer `endsAt` en `Event` (hoy solo se calcula `startsAt + EVENT_DEFAULT_DURATION`) | OpenAPI events 1.2.0 | B — **Hecho (`8d359fc`)** |
| ~~D-2~~ ✅ | events-service | Enviar `organizerId` (requerido), `staffUserIds` y `eventEndsAt` en `issue-ticket` (otro agente lo implementa; verificar con un test de contrato) y quitar la rama `STRICT_ORGANIZER_CHECK=false` de ticketing cuando todos los tickets nuevos lo traigan | AsyncAPI 1.2.0 | A — **Hecho** (`6e23da9`) |
| ~~D-3~~ ✅ | admin-gateway / identity | Emitir `CANNOT_DEMOTE_SELF`, `CANNOT_SUSPEND_SELF` y `ROLES_REQUIRED` (el panel los espera; hoy solo existe `LAST_ADMIN` en identity); mapear `MEDIA_NOT_FLAGGED` de media a `ALREADY_MODERATED` en `moderateMedia` o hacer que el panel acepte ambos | GraphQL 1.2.0 | B — **Hecho (`da279bc`)** |
| ~~D-4~~ ✅ | admin-gateway | Implementar el resolver `updateUniversity` (identity `PATCH /internal/v1/universities/{id}` ya existe) | GraphQL 1.2.0 | A — **Hecho** (`cb7dace`) |
| ~~D-5~~ ✅ | admin-gateway | `suspendUser.until` se ignora (`UpdateUserStatusRequest` no tiene el campo); `User.suspendedAt/suspensionReason` solo se rellenan tras suspender en la misma petición; `ContentReport.post` devuelve `null`; `Registration.saga` busca entre las 100 SAGAs más recientes; el `item` de `moderationQueueChanged` es mínimo | graphql-admin.md | B — **Hecho salvo comentarios denunciados: `until` retirado (GraphQL 1.3.0), `suspendedAt/suspensionReason` (`514e5a7`, `a1741b6`)** |
| ~~D-6~~ ✅ | admin-gateway | Falta endpoint interno de evento y de post (se usa la API pública con el token del usuario): agregar `GET /internal/v1/events/{id}` y `GET /internal/v1/posts/{id}` a los contratos y al gateway | OpenAPI events/social | B — **Hecho (`8d359fc`, `cf3dd59`)** |
| ~~D-7~~ ✅ | identity-service + todos los servicios | **No se exigen scopes** en `/internal/**` (solo `typ=service` y `aud=bandada-internal`). Exigir `internal:read`/`internal:write` según método | seguridad-y-sso.md §2.1 | B — **Hecho: identity, events, social, media y servicios PHP exigen `internal:read/write`** |
| ~~D-8~~ ✅ | ticketing-service | `VALIDATION_FAILED` responde 422; el contrato (y media/social) usa 400. Unificar a 400 con `errors[]` | components.yaml `BadRequest` | B — **Hecho (`9617678`; contrato `ab126ea`)** |
| ~~D-9~~ ✅ | social-service | Exponer `avatarStatus` (`PENDING|APPROVED|REJECTED`) en `Profile` para que la app muestre «en revisión» (hoy `pendingAvatarMediaId` es interno) | OpenAPI social 1.3.0 | B — **Hecho (`cf3dd59`)** |
| ~~D-10~~ ✅ | identity-service | `registerUser` no recibe `displayName` (se deriva del correo): decidir si se agrega al contrato; `REGISTER_HIDE_EXISTING_ACCOUNTS` está en `false` por defecto (UC-01 pedía anti-enumeración) | UC-01, OpenAPI identity 1.2.0 | B — **Hecho (`82c1fd5`)** |
| ~~D-11~~ ✅ | notification-service | `ALERT` solo notifica si el evento trae `recipientUserIds` (no está en AsyncAPI: agregarlo en fase 2 junto a UC-20); los textos de comentarios/reacciones no incluyen el nombre del actor (el evento no lo trae) | UC-24 | F2 — **Hecho: `recipientUserIds` y `actorDisplayName` (`1c19ed1`, `7d91f59`)** |
| ~~D-12~~ ✅ | media-service | No se verifican *magic bytes* del objeto (solo `Content-Type` y tamaño); modelos ONNX y ffmpeg no integrados (`MODERATION_MODE` `allow-all`/`manual`) | UC-05, ml-dl.md | F2 — **Hecho: *magic bytes* (`c614a87`)** |
| ~~D-13~~ ✅ | media-service / infra | `UPLOAD_URL_TTL_SECONDS` es 900 por defecto en el servicio y 300 en el Compose: elegir un valor único en `.env.example` e infra | OpenAPI media 1.2.0 | B — **Hecho: TTL 900 en servicio, compose y `.env`** |
| ~~D-14~~ ✅ | wallet-service | `PAYMENT_GATEWAY_UNAVAILABLE` (UC-15) no existe: la pasarela es simulada; revisar si se necesita | UC-15 | F2 — **Hecho: `PAYMENT_GATEWAY_MODE` (`920f029`)** |
| ~~D-15~~ ✅ | notification-service | Web Push: se acepta la suscripción pero no se envía; exportador OTLP diferido; `PUSH_ENABLED=false` | UC-24 | F2 — **Hecho salvo OTLP en PHP (`1c19ed1`); Web Push probado solo con push service simulado** |
| ~~D-16~~ ✅ | todos | Rate limit de identity en memoria por instancia (no distribuido); el de Traefik es por instancia | seguridad-y-sso.md §8 | F2 — **Hecho: Postgres, ADR-0019 (`82c1fd5`)** |
| ~~D-17~~ ✅ | social-service | Los 404 usan `NOT_FOUND` (el contrato no define `POST_NOT_FOUND`); en `/internal` el motivo `AUTHOR_SUSPENDED` se presenta como `MODERATOR` | OpenAPI social 1.3.0 | B — **Hecho (`cf3dd59`)** |

## 3. Pendientes de infraestructura y operación

| # | Tema | Detalle | Prio |
|---|---|---|---|
| ~~I-1~~ ✅ | Cola `events-service.saga-replies` | Contiene 2 mensajes de prueba (inocuos); purgar con la UI de RabbitMQ | B — **Hecho (cola vacía)** |
| I-2 | AWS | Despliegue EC2 + RDS + DynamoDB + S3/CloudFront (ADR-0012) sin implementar; CI de GitHub Actions de los repos por verificar | A |
| I-3 | Observabilidad | LGTM y dashboards completos, alertas `SagaCompensationRateHigh`, etc. | B |
| I-4 | RabbitMQ | Un usuario por servicio en prod (RNF-07); hoy un usuario compartido en local | B |
| ~~I-5~~ ✅ | Contratos | Cuando `bandadau-docs` tenga `Makefile`: `make contracts-lint` y `make links` (HT-03) | B — **Hecho: `Makefile` de docs (`contracts-lint`, `links`)** |

## 4. Aplicación Expo y verificaciones de integración

| # | Tema | Detalle | Prio |
|---|---|---|---|
| E-1 | `bandadau-frontend` | La app Expo (UC-01…16, 24 en cliente, escáner UC-14, cola offline, PWA) está a cargo del equipo; sin ella ningún RF pasa de **I** a **V** | A |
| E-2 | SSO app → panel (UC-03) | Verificar el flujo real desde la app con Universal/App Links y PKCE | A |
| E-3 | `app.bandada.localhost` | Probar con `make up` cuando la app exista (cookie `bandada_rt` con `X-Bandada-Client: web`, CORS con credenciales) | A |

> **Auditoría 2026-10-15:** el estado real de E-1…E-3 y el plan de ajustes (A-n hacer, B-n cambiar, C-n actualizar) están en [auditoria-app-expo.md](auditoria-app-expo.md).
> **Mapeo:** E-1 → A-1/A-2/A-4/A-5/A-8/A-9/A-10 y B-1…B-14; E-2/E-3 → C-9 y R-13 (fuera de esta ronda).
> Bloqueante: `Authorization` no se envía y los mocks están activos por defecto (B-1, B-3).

## 5. Fase 2 (sin código)

`insights-service` (MCP, agentes, reportes, anomalías), `mfe-insights`, `bandadau-ml` (NSFW, violencia, CLIP, ranker de feed, Isolation Forest),
IA local (ExecuTorch/WebLLM, UC-17), workflows n8n (UC-23), campos GraphQL de fase 2 (responden `FEATURE_DISABLED`), `createMcpToken`/`revokeMcpToken` (identity
responde 501 `FEATURE_DISABLED`).

## Hallazgos de la revisión de infraestructura (2026-10-15)

Pendientes menores de configuración en `bandadau-infra` y servicios (sin impacto en `make smoke`):

| ID | Hallazgo | Acción |
|---|---|---|
| ~~C-1~~ ✅ | `UPLOAD_URL_TTL_SECONDS=300` en compose frente a 900 en servicio y contrato | Unificar (el contrato manda: 900) — **Hecho** |
| ~~C-2~~ ✅ | `COVER_CHECK` no está en el compose de events (default `off`): la portada no se valida contra media en local | Definirlo `on` cuando el cliente de servicio `events-service` exista en `SERVICE_CLIENTS` — **Hecho** |
| ~~C-3~~ ✅ | admin-gateway no recibe `RABBITMQ_MANAGEMENT_*` ni `NOTIFICATION_SERVICE_URL` explícitos en el compose | Pasarlos — **Hecho** |
| ~~C-4~~ ✅ | `identity-service/.env.example`: `SERVICE_CLIENTS`, `MAIL_FROM` y `JWT_KEY_ID` difieren de los del compose; `bandadau-infra/.env.example` no define `JWT_KEK` | Alinear ejemplos — **Hecho** |
| ~~C-5~~ ✅ | Alias muertos `SIMULATE_PAYMENT_ENABLED` y `QR_KEY_ID` en compose y `.env.example` | Retirar — **Hecho** |
| ~~C-6~~ ✅ | `SAGA_COMMAND_MAX_RETRIES` está en el compose pero no en el `.env.example` de events | Añadir — **Hecho** |
| ~~C-7~~ ✅ | Plantillas de CI: texto "cuando los 8 servicios existan" ya no aplica | Actualizar — **Hecho** |
| ~~C-8~~ ✅ | `bandadau-infra/{README,AGENTS}.md`: faltan los targets `mock*` y el relay de notification figura como "suposición" | Corregir (tras terminar el agente de n8n) — **Hecho** |
| ~~C-9~~ ✅ | `eventos-y-mensajeria.md` §5.3 e `idempotencia.md` no verificados contra identity/events/wallet/social/media | Revisión cruzada — **Hecho; divergencias de código en la sección de cierre** |

## Moderación con deep learning (fase 2, 2026-10-15)

Implementada: `bandadau-ml` (pipeline en Docker, modelo `Falconsai/nsfw_image_detection` → ONNX, publicado en MinIO
`bandada-models/models/nsfw-classifier/1.0.0/`) y `OnnxModerationAdapter` en `media-service` (`MODERATION_MODE=onnx`, imágenes y
video con ffmpeg). p95 282 ms por imagen. Pendiente / diferencias con `ml-dl.md`:

| ID | Tema | Detalle |
|---|---|---|
| M-1 | Recall ≥ 0.90 (RNF-12) **no medido** | `recall@0.5: null`; falta un set de evaluación curado fuera del repo y evaluación por subgrupos |
| M-2 | Preprocesado | El checkpoint usa resize directo 224×224 y mean=std=0.5, no crop central + ImageNet como dice `ml-dl.md` §2/§4; corregir el doc |
| M-3 | Contrato `metadata.json` | Añade `resizeMode`, `colorOrder`, `scale`, `artifacts{fp32,int8}`, `source`; documentar |
| M-4 | API | `frameScores` y `frameIndex` se persisten pero el OpenAPI/GraphQL no los expone |
| M-5 | Alcance | Solo `scores:{nsfw}`; `violence-classifier`, CLIP, OCR y `nsfw-mobile` sin implementar (opcionales) |
| M-6 | Procedencia | El modelo base fue afinado por su autor con un dataset propietario de licencia desconocida; no hay fine-tune propio |
| M-7 | Formato | HEIC no se decodifica (va a revisión humana); int8 solo MatMul (Δprob ≤ 0.023) |
| M-8 | Salud | `/health/ready` añade `moderation.state` (READY/DEGRADED) |


## Cierre de la ronda de backend y admin (2026-10-16)

Verificado con todo integrado: `make seed` 63/0 (dos veces seguidas) y `make smoke` 41/41 (dos veces seguidas), todos los servicios `healthy` y conectados a RabbitMQ con su usuario propio.

| ID | Tema | Estado |
|---|---|---|
| ~~R-1~~ ✅ | `ContentReport.comment`/`post` en denuncias de comentario | **Hecho** (`3a37f82`, `2372677`, `56215e6`): `GET /internal/v1/comments/{id}`, resolvers del gateway y sección en `mfe-moderation` |
| ~~R-2~~ ✅ | Observabilidad (I-3) | **Hecho**: dashboards y alertas validados con el stack real; events (`d92b6b9`) y notification (`ff03e7f`) exportan OTLP (activar con `OTEL_SDK_DISABLED=false`, `make up-obs`) |
| ~~R-3~~ ✅ | Usuarios de RabbitMQ por servicio (I-4) | **Hecho** en el stack real (`87328f8`); un servicio no puede usar colas ajenas |
| ~~R-4~~ ✅ | OTLP en notification (PHP) | **Hecho** con `open-telemetry/sdk` + exportador OTLP (trazas; sin métricas). Web Push solo probado con push service simulado |
| R-5 | C-9 divergencias de código | Idempotencia HTTP de identity/events en su Postgres (no DynamoDB); prefijos `ticketing#`/`insights#` en la tabla de idempotencia. Los docs ya lo reflejan; alinear el código es opcional (B) |
| R-6 | M-1 recall ≥ 0.90 (RNF-12) | Arnés listo (`bandadau-ml` `5bee4e6`); falta un set curado fuera del repo. RNF-12 sigue **no verificado** (A) |
| R-7 | M-5, M-6 | Clasificadores extra (violencia, CLIP, OCR) y fine-tune propio: exigen descargar modelos/entrenar; opcionales (F2). **M-4 hecho** (`51d47fa`, `6515e29`): `frameScores` y `worstFrameIndex` |
| ~~R-8~~ ✅ | `/mcp` | **Hecho**: router `insights-mcp` en Traefik con CORS y límite de 20/s (`87328f8`); revocación efectiva en ≤ 5 s (caché de insights) |
| ~~R-9~~ ✅ | `bandadau-frontend` | **Hecho**: `Authorization` corregido (`68fe972`), mocks y locales sincronizados con los contratos (`97b0967`), trabajo pendiente commiteado (`8f722e7`) |
| ~~R-10~~ ✅ | `bandadau-admin` | **Hecho**: cambios del shell commiteados (`bdf7442`) |
| R-11 | `test:int` de admin-gateway | Falla con ECONNREFUSED al RabbitMQ de pruebas (puerto 15706) también sin los cambios de esta ronda: levantar el broker auxiliar del servicio (ver su AGENTS.md) |
| R-12 | Seed pasados 15 min | `createUpload` con la misma `Idempotency-Key` devuelve la URL prefirmada vencida (PUT 403). El seed ya reintenta con otra clave (`fix(infra)`); la solución de fondo sería que media renueve la URL en el replay idempotente (B) |
| R-13 | I-2, E-2, E-3 | Despliegue en AWS y pruebas app↔panel (SSO, cookie de refresco): fuera de esta ronda (A) |
