# Deuda técnica pendiente de código (fase 1 → fase 2)

Generado en la consolidación de contratos del **2026-10-15** (ver `registro-de-sesiones.md`). Lista lo que
**el código debe cambiar** para cumplir contratos y diseño; lo que el código hacía bien (y el contrato decía distinto) ya se corrigió
en `bandadau-docs`. Prioridad: **A** = antes de la entrega (10-nov), **B** = si hay tiempo, **F2** = fase 2.

## 1. Acciones de sincronización tras los cambios de contrato

| # | Repo | Acción | Prio |
|---|---|---|---|
| S-1 | `bandadau-backend/services/admin-gateway` | Ejecutar `pnpm schema:sync` (la copia `schema/admin.graphql` debe ser idéntica a `bandadau-docs/contracts/graphql/admin.graphql` 1.2.0: agrega `updateUniversity`, `UpdateUniversityInput/Payload` y comentarios) y su prueba de igualdad | A |
| S-2 | `bandadau-shared` | Ejecutar `pnpm contracts:gen` (regenera `@bandada/contracts-ts` desde OpenAPI/AsyncAPI nuevos) y `pnpm i18n:check` | A |
| S-3 | `bandadau-shared/packages/i18n` | Agregar (es/en) los códigos que ahora figuran en los OpenAPI y faltan en `locales/*/errors.json`: `IDEMPOTENCY_KEY_REQUIRED`, `MALFORMED_REQUEST`, `INVALID_CURSOR`, `CONCURRENT_MODIFICATION`, `DEPENDENCY_UNAVAILABLE`, `MEDIA_UNAVAILABLE`, `NOTIFICATION_NOT_FOUND`, `INVALID_DEVICE_TOKEN`, `TYPE_NOT_MUTABLE`, `TICKET_NOT_FOUND`, `VALIDATION_WINDOW_CLOSED`, `INVALID_TOPUP_PACKAGE`, `TOPUP_NOT_PENDING`, `TOPUP_EXPIRED`, `TOPUP_NOT_FOUND`, `WEBHOOK_EXPIRED`, `AMOUNT_MISMATCH`, `GATEWAY_REF_CONFLICT`, `INVALID_RANGE`. Reemplazar `IDEMPOTENCY_KEY_MISSING` por `IDEMPOTENCY_KEY_REQUIRED` en `PROTOCOL_CODES` (`scripts/extract-error-codes.mjs`) y en los catálogos | A |
| S-4 | `bandadau-admin/shell`, `bandadau-admin/mfe-moderation` | Regenerar tipos GraphQL; el panel ya espera `ALREADY_MODERATED`, `CANNOT_DEMOTE_SELF`, `CANNOT_SUSPEND_SELF`, `ROLES_REQUIRED` (ver D-3) | B |

## 2. Cumplimiento de contrato (el código debe cambiar)

| # | Servicio | Qué falta | Contrato / doc | Prio |
|---|---|---|---|---|
| D-1 | events-service | Aceptar `endsAt` opcional en `createEvent` y exponer `endsAt` en `Event` (hoy solo se calcula `startsAt + EVENT_DEFAULT_DURATION`) | OpenAPI events 1.2.0 | B |
| D-2 | events-service | Enviar `organizerId` (requerido), `staffUserIds` y `eventEndsAt` en `issue-ticket` (otro agente lo implementa; verificar con un test de contrato) y quitar la rama `STRICT_ORGANIZER_CHECK=false` de ticketing cuando todos los tickets nuevos lo traigan | AsyncAPI 1.2.0 | A |
| D-3 | admin-gateway / identity | Emitir `CANNOT_DEMOTE_SELF`, `CANNOT_SUSPEND_SELF` y `ROLES_REQUIRED` (el panel los espera; hoy solo existe `LAST_ADMIN` en identity); mapear `MEDIA_NOT_FLAGGED` de media a `ALREADY_MODERATED` en `moderateMedia` o hacer que el panel acepte ambos | GraphQL 1.2.0 | B |
| D-4 | admin-gateway | Implementar el resolver `updateUniversity` (identity `PATCH /internal/v1/universities/{id}` ya existe) | GraphQL 1.2.0 | A |
| D-5 | admin-gateway | `suspendUser.until` se ignora (`UpdateUserStatusRequest` no tiene el campo); `User.suspendedAt/suspensionReason` solo se rellenan tras suspender en la misma petición; `ContentReport.post` devuelve `null`; `Registration.saga` busca entre las 100 SAGAs más recientes; el `item` de `moderationQueueChanged` es mínimo | graphql-admin.md | B |
| D-6 | admin-gateway | Falta endpoint interno de evento y de post (se usa la API pública con el token del usuario): agregar `GET /internal/v1/events/{id}` y `GET /internal/v1/posts/{id}` a los contratos y al gateway | OpenAPI events/social | B |
| D-7 | identity-service + todos los servicios | **No se exigen scopes** en `/internal/**` (solo `typ=service` y `aud=bandada-internal`). Exigir `internal:read`/`internal:write` según método | seguridad-y-sso.md §2.1 | B |
| D-8 | ticketing-service | `VALIDATION_FAILED` responde 422; el contrato (y media/social) usa 400. Unificar a 400 con `errors[]` | components.yaml `BadRequest` | B |
| D-9 | social-service | Exponer `avatarStatus` (`PENDING|APPROVED|REJECTED`) en `Profile` para que la app muestre «en revisión» (hoy `pendingAvatarMediaId` es interno) | OpenAPI social 1.3.0 | B |
| D-10 | identity-service | `registerUser` no recibe `displayName` (se deriva del correo): decidir si se agrega al contrato; `REGISTER_HIDE_EXISTING_ACCOUNTS` está en `false` por defecto (UC-01 pedía anti-enumeración) | UC-01, OpenAPI identity 1.2.0 | B |
| D-11 | notification-service | `ALERT` solo notifica si el evento trae `recipientUserIds` (no está en AsyncAPI: agregarlo en fase 2 junto a UC-20); los textos de comentarios/reacciones no incluyen el nombre del actor (el evento no lo trae) | UC-24 | F2 |
| D-12 | media-service | No se verifican *magic bytes* del objeto (solo `Content-Type` y tamaño); modelos ONNX y ffmpeg no integrados (`MODERATION_MODE` `allow-all`/`manual`) | UC-05, ml-dl.md | F2 |
| D-13 | media-service / infra | `UPLOAD_URL_TTL_SECONDS` es 900 por defecto en el servicio y 300 en el Compose: elegir un valor único en `.env.example` e infra | OpenAPI media 1.2.0 | B |
| D-14 | wallet-service | `PAYMENT_GATEWAY_UNAVAILABLE` (UC-15) no existe: la pasarela es simulada; revisar si se necesita | UC-15 | F2 |
| D-15 | notification-service | Web Push: se acepta la suscripción pero no se envía; exportador OTLP diferido; `PUSH_ENABLED=false` | UC-24 | F2 |
| D-16 | todos | Rate limit de identity en memoria por instancia (no distribuido); el de Traefik es por instancia | seguridad-y-sso.md §8 | F2 |
| D-17 | social-service | Los 404 usan `NOT_FOUND` (el contrato no define `POST_NOT_FOUND`); en `/internal` el motivo `AUTHOR_SUSPENDED` se presenta como `MODERATOR` | OpenAPI social 1.3.0 | B |

## 3. Pendientes de infraestructura y operación

| # | Tema | Detalle | Prio |
|---|---|---|---|
| I-1 | Cola `events-service.saga-replies` | Contiene 2 mensajes de prueba (inocuos); purgar con la UI de RabbitMQ | B |
| I-2 | AWS | Despliegue EC2 + RDS + DynamoDB + S3/CloudFront (ADR-0012) sin implementar; CI de GitHub Actions de los repos por verificar | A |
| I-3 | Observabilidad | LGTM y dashboards completos, alertas `SagaCompensationRateHigh`, etc. | B |
| I-4 | RabbitMQ | Un usuario por servicio en prod (RNF-07); hoy un usuario compartido en local | B |
| I-5 | Contratos | Cuando `bandadau-docs` tenga `Makefile`: `make contracts-lint` y `make links` (HT-03) | B |

## 4. Aplicación Expo y verificaciones de integración

| # | Tema | Detalle | Prio |
|---|---|---|---|
| E-1 | `bandadau-frontend` | La app Expo (UC-01…16, 24 en cliente, escáner UC-14, cola offline, PWA) está a cargo del equipo; sin ella ningún RF pasa de **I** a **V** | A |
| E-2 | SSO app → panel (UC-03) | Verificar el flujo real desde la app con Universal/App Links y PKCE | A |
| E-3 | `app.bandada.localhost` | Probar con `make up` cuando la app exista (cookie `bandada_rt` con `X-Bandada-Client: web`, CORS con credenciales) | A |

## 5. Fase 2 (sin código)

`insights-service` (MCP, agentes, reportes, anomalías), `mfe-insights`, `bandadau-ml` (NSFW, violencia, CLIP, ranker de feed, Isolation Forest),
IA local (ExecuTorch/WebLLM, UC-17), workflows n8n (UC-23), campos GraphQL de fase 2 (responden `FEATURE_DISABLED`), `createMcpToken`/`revokeMcpToken` (identity
responde 501 `FEATURE_DISABLED`).
