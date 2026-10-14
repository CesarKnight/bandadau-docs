# Decisiones técnicas clave (resumen normativo)

Resumen de las decisiones que **todos** los documentos de detalle, contratos y casos
de uso deben respetar. Complementa a `catalogo-servicios.md`. Cada bloque tiene su
documento de detalle y ADR.

---

## D1. Superficie REST por servicio (operaciones canónicas)

Todos los `operationId` en `camelCase`. Rutas bajo `/api/v1`. `🔑` = requiere JWT.
`♻️` = acepta/exige `Idempotency-Key`.

### identity-service
| Método | Ruta | operationId | Notas |
|---|---|---|---|
| POST | `/auth/register` ♻️ | `registerUser` | correo institucional → `PENDING_VERIFICATION`, envía código |
| POST | `/auth/verify-email` | `verifyEmail` | `{ email, code }` → activa, devuelve tokens |
| POST | `/auth/resend-code` | `resendVerificationCode` | rate-limit |
| POST | `/auth/login` | `login` | `{ email, password }` → `{ accessToken, refreshToken, expiresIn, user }` |
| POST | `/auth/refresh` | `refreshToken` | rotación; reutilizar un refresh revocado revoca toda la familia |
| POST | `/auth/logout` 🔑 | `logout` | revoca refresh |
| POST | `/auth/handoff` 🔑 | `createHandoffCode` | `{ targetApp: ADMIN\|APP }` → `{ code, redirectUrl, expiresIn: 60 }` |
| POST | `/auth/handoff/exchange` | `exchangeHandoffCode` | `{ code, codeVerifier }` → tokens del app destino |
| POST | `/auth/service-token` | `issueServiceToken` | client credentials para servicios (solo red interna) |
| GET | `/users/me` 🔑 | `getMe` | |
| GET | `/universities` | `listUniversities` | público (registro) |
| GET | `/.well-known/jwks.json` | `getJwks` | público |
| — | `/internal/v1/users` (GET, PATCH roles/status) | `searchUsers`, `updateUserRoles`, `updateUserStatus` | admin-gateway |
| — | `/internal/v1/universities` (POST/PATCH) | `createUniversity`, `updateUniversity` | admin-gateway |

### social-service
`GET/PATCH /profiles/me` (`getMyProfile`, `updateMyProfile`), `GET /profiles/{userId}`,
`POST /posts` ♻️ (`createPost`, body incluye `clientId` UUIDv7 y `mediaIds[]`),
`GET /posts/{postId}`, `DELETE /posts/{postId}`, `GET /feed?cursor&limit` (`getFeed`),
`POST /posts/{postId}/comments` ♻️ (`createComment`), `GET /posts/{postId}/comments`,
`PUT /posts/{postId}/reactions/me` (`setReaction`, idempotente por naturaleza),
`DELETE /posts/{postId}/reactions/me`, `PUT /follows/{userId}` / `DELETE /follows/{userId}`,
`GET /follows/suggestions` (`getFollowSuggestions`, ML),
`POST /groups` ♻️, `GET /groups?query`, `GET /groups/{groupId}`, `POST /groups/{groupId}/join`,
`POST /groups/{groupId}/members/{userId}/approve`, `GET /groups/{groupId}/posts`,
`POST /reports` ♻️ (`reportContent`).
Internos: `GET /internal/v1/posts?status=HIDDEN`, `PATCH /internal/v1/posts/{id}/status`,
`GET /internal/v1/reports?status=OPEN`, `GET /internal/v1/stats/daily`.

### media-service
`POST /media/uploads` ♻️ (`createUpload` → `{ mediaId, uploadUrl (S3 presigned PUT), expiresIn }`),
`POST /media/{mediaId}/complete` (`completeUpload` → dispara pipeline ML),
`GET /media/{mediaId}` (`getMedia`, devuelve `status`, `url` prefirmada, `thumbnailUrl`, `tags`).
Internos: `GET /internal/v1/media?status=FLAGGED` (`listFlaggedMedia`), `POST /internal/v1/media/{id}/decision` (`decideMedia`: `APPROVE|REJECT`).

### events-service
`POST /events` ♻️ (`createEvent`, rol ORGANIZER), `POST /events/{eventId}/publish`,
`GET /events?from&to&cursor&public` (`listEvents`), `GET /events/{eventId}`,
`POST /events/{eventId}/registrations` ♻️ (`registerToEvent` → **202** `{ registrationId, status: PENDING }`),
`GET /registrations/{registrationId}` (`getRegistration`, polling),
`GET /registrations/me` (`listMyRegistrations`),
`POST /registrations/{registrationId}/cancel` ♻️ (`cancelRegistration` → 202).
Internos: `GET /internal/v1/sagas?status=FAILED|COMPENSATED&since` (`listSagas`), `GET /internal/v1/stats/registrations?from&to&groupBy=day` (`getRegistrationStats`).

### wallet-service
`GET /wallet/me` (`getMyWallet`), `GET /wallet/me/entries?cursor` (`listMyLedgerEntries`),
`POST /wallet/topups` ♻️ (`createTopUp` → `{ topUpId, checkoutUrl }`),
`POST /wallet/topups/{topUpId}/simulate-payment` (solo dev/demo: simula pasarela),
`POST /wallet/webhooks/payment` (`paymentWebhook`, sin JWT, firma HMAC, idempotente por `gatewayRef`).
Internos: `GET /internal/v1/stats/credits?from&to` (`getCreditStats`).

### ticketing-service
`GET /tickets/me` (`listMyTickets`), `GET /tickets/{ticketId}` (`getTicket`, incluye `qrPayload` firmado),
`POST /tickets/validate` ♻️ (`validateTicket`, rol ORGANIZER del evento; `{ qrPayload }` → `USED`).

### notification-service
`GET /notifications?cursor` (`listNotifications`), `POST /notifications/{id}/read`,
`POST /notifications/read-all`, `PUT /devices/{token}` (`registerDevice`), `DELETE /devices/{token}`,
`GET/PUT /notifications/preferences`.

### insights-service
`POST /insights/reports` ♻️ (`requestReport`, `{ question }` → 202 `{ reportId }`),
`GET /insights/reports/{reportId}` (`getReport`: `markdown`, `dataset`, `chart`, `audioUrl`, `status`),
`GET /insights/alerts?status`, `POST /insights/alerts/{id}/ack`,
`GET /insights/agent-runs/{id}`. Más el endpoint MCP `/mcp`.

---

## D2. SAGA de inscripción (C1)

**Orquestada** por `events-service` (clase `RegistrationSagaOrchestrator`, estado en
tabla `saga_instances`). Mensajes por RabbitMQ con outbox/inbox.

| Paso | Acción | Comando → | Respuesta OK | Respuesta fallo | Compensación |
|---|---|---|---|---|---|
| 1 | Reservar cupo (local, transacción con `Registration PENDING` + `SagaInstance STARTED`) | — | — | `409 EVENT_FULL` / `409 ALREADY_REGISTERED` (síncrono) | Liberar cupo (`seatsTaken--`) |
| 2 | Debitar créditos (si `priceCredits > 0`; si es 0 se salta) | `bandada.wallet.cmd.debit-credits.v1` | `bandada.wallet.credits-debited.v1` | `bandada.wallet.credits-debit-failed.v1` (`INSUFFICIENT_FUNDS`, `WALLET_NOT_FOUND`) | `bandada.wallet.cmd.refund-credits.v1` → `bandada.wallet.credits-refunded.v1` |
| 3 | Emitir ticket | `bandada.ticketing.cmd.issue-ticket.v1` | `bandada.ticketing.ticket-issued.v1` | `bandada.ticketing.ticket-issue-failed.v1` | `bandada.ticketing.cmd.void-ticket.v1` → `bandada.ticketing.ticket-voided.v1` |
| ✔ | Confirmar | publica `bandada.events.registration.confirmed.v1` | | | |
| ✘ | Fallar | publica `bandada.events.registration.failed.v1` (`reason`) | | | |

- **Timeout** por paso: 30 s (`deadlineAt`); un scheduler (`@Scheduled` cada 5 s)
  compensa SAGAs vencidas. Reintento de comandos: 3 veces con backoff antes de compensar.
- **Cancelación (UC-13)**: SAGA inversa `CANCELLATION`: `void-ticket` → `refund-credits` → liberar cupo → `bandada.events.registration.cancelled.v1`.
- Todos los comandos llevan `sagaId`, `registrationId` y `idempotencyKey = <sagaId>:<step>`.
- **Chaos flags** para la demo: `CHAOS_TICKETING_FAIL=true`, `CHAOS_WALLET_DELAY_MS`.

## D3. Idempotencia (T8) — cinco mecanismos

1. **HTTP `Idempotency-Key`** (UUID) en endpoints ♻️. Tabla DynamoDB
   `bandada-idempotency`: `PutItem` con `attribute_not_exists(pk)`; guarda
   `requestHash`, `status (IN_PROGRESS|COMPLETED)`, `responseStatus`, `responseBody`, TTL 24 h.
   Misma clave + mismo hash → se devuelve la respuesta guardada (`Idempotent-Replayed: true`);
   misma clave + distinto hash → `422 IDEMPOTENCY_KEY_REUSED`; en curso → `409 IDEMPOTENCY_IN_PROGRESS`.
2. **Inbox del consumidor**: tabla/colección `processed_messages(message_id PK, processed_at)` en
   la misma transacción que el efecto (Postgres/Mongo) o `ConditionExpression` (DynamoDB).
3. **Restricciones únicas de negocio**: índice parcial único `registrations(event_id, user_id) WHERE status IN ('PENDING','CONFIRMED')`; `ledger_entries.operation_ref` único; `tickets` por `registrationId` (GSI + condición); `posts(authorId, clientId)` único.
4. **IDs generados en el cliente** (UUIDv7 `clientId`) para la cola offline.
5. **Webhooks**: dedupe por `gatewayRef` / `eventId`; responder 200 aunque sea repetido.

## D4. Acceso por una sola entrada (T13)

- Un único proveedor de identidad (`identity-service`) para app, panel y MCP.
- **Handoff code** (inspirado en OAuth 2.0 + PKCE): la app genera `codeVerifier`,
  llama `POST /auth/handoff { targetApp: ADMIN, codeChallenge }` → recibe
  `redirectUrl = https://admin.<dominio>/sso/callback?code=…`; la abre con
  `expo-web-browser` (nativo) o `window.location` (web). El panel llama
  `POST /auth/handoff/exchange { code, codeVerifier }`. Código: 32 bytes aleatorios,
  guardado hasheado, 60 s, un solo uso, ligado al usuario y al `targetApp`.
  *Nota:* en el salto nativo→navegador el `codeVerifier` viaja en el fragmento `#cv=` de la URL
  (no se envía al servidor ni queda en logs) — documentado en `seguridad-y-sso.md`.
- Inverso panel → app: botón "Abrir en la app" usa universal link
  `https://app.<dominio>/sso/callback?code=…` (abre la app nativa si está instalada; si no, la PWA).
- Landing: "Entrar" → app web; "Panel" → admin (cada uno inicia sesión normalmente si no hay sesión).

## D5. Microfrontends (T2)

- Composición **en runtime en el cliente** mediante **Web Components** (Custom Elements).
- El shell lee `mfe-manifest.json` (servido por el shell, generado en el deploy):
  `{ "moderation": { "url": ".../moderation/main.js", "element": "bandada-mfe-moderation", "version": "1.2.0" }, … }`.
- Contrato shell ↔ MFE: atributos/propiedades `graphql-url`, `access-token` (propiedad, no atributo),
  `base-path`, `theme`; eventos `CustomEvent` hacia el shell: `bandada:navigate`, `bandada:toast`,
  `bandada:auth-expired`. Nada de estado global compartido. Estilos aislados con Shadow DOM.
- `mfe-moderation`: Angular 21 + `@angular/elements`, zoneless. `mfe-insights`: React 19 + Vite
  (`library mode`) con `r2wc` o envoltorio propio.
- Cada MFE se despliega independiente (su carpeta en S3 + invalidación) y es versionado.

## D6. IA local + offline + PWA (T6, T7)

- **Asistente de estudio offline** (UC-17): nativo con `react-native-executorch`
  (modelo Llama 3.2 1B / Qwen 3 0.6B cuantizado, descarga bajo demanda); web con
  **WebLLM** (WebGPU) y fallback a `transformers.js` con un modelo de resumen más pequeño.
  Interfaz común `LocalLlm` (`bandadau-frontend/src/ai/local-llm.ts` + `.native.ts` / `.web.ts`).
- **Pre-chequeo de imagen on-device** (UC-05): clasificador NSFW pequeño (MobileNetV2 ONNX/TFLite,
  ~5 MB) antes de subir; si el puntaje supera el umbral avisa al usuario (la decisión final
  la toma el servidor).
- **Persistencia offline**: TanStack Query + persister (MMKV/AsyncStorage nativo, IndexedDB web);
  **cola offline** `OfflineMutation` en `expo-sqlite` (nativo) / IndexedDB (web) con
  `idempotencyKey` y `clientId` por mutación; se drena al recuperar red (NetInfo) con backoff.
- **PWA**: `expo export -p web` + `public/manifest.webmanifest` + service worker generado con
  Workbox (`injectManifest`): precache del shell, `StaleWhileRevalidate` para medios, `NetworkFirst`
  para `GET /feed`, Background Sync para la cola en navegadores que lo soporten.

## D7. ML / DL (T9)

| Modelo | Tipo | Dónde corre | Entrenamiento/origen | Uso |
|---|---|---|---|---|
| `nsfw-classifier` | DL (ViT/MobileNet fine-tuned) | media-service (onnxruntime-node) | `bandadau-ml/notebooks/01-nsfw-finetune.ipynb` → ONNX | Moderar imágenes y frames |
| `violence-classifier` | DL (CNN) | media-service | `bandadau-ml/notebooks/02-violence.ipynb` | Moderar |
| `clip-zero-shot` | DL (CLIP ViT-B/32 ONNX) | media-service | preentrenado | Auto-etiquetado (`apuntes`, `evento`, `deporte`, `meme`…) |
| `ocr` | DL (PaddleOCR ONNX / Tesseract) | media-service | preentrenado | Texto de fotos de apuntes |
| Video | pipeline | media-service (ffmpeg) | — | 1 frame cada 2 s (máx. 30) → clasificadores; miniatura = frame de mayor calidad |
| `feed-ranker` | ML clásico (regresión logística sobre features) | social-service (JS puro, coeficientes en JSON) | `bandadau-ml/notebooks/03-feed-ranker.ipynb` | Puntuar ítems del feed |
| `follow-suggester` | ML clásico (filtrado colaborativo / Jaccard + carrera) | social-service | `bandadau-ml/notebooks/04-suggestions.ipynb` | Sugerencias |
| `anomaly-detector` | ML clásico (Isolation Forest → ONNX vía skl2onnx) | insights-service | `bandadau-ml/notebooks/05-anomalies.ipynb` | Picos anómalos de métricas |
| `nsfw-mobile` | DL pequeño | dispositivo | derivado de `nsfw-classifier` | Pre-chequeo local |

Umbrales: `score ≥ 0.85` → `BLOCK` (REJECTED automático), `0.5–0.85` → `REVIEW` (FLAGGED),
`< 0.5` → `ALLOW`. Modelos versionados en MinIO/S3 `models/<nombre>/<versión>/model.onnx`.

## D8. Agentes y reportes generativos (T5, T11)

- `insights-service` contiene: `MonitoringAgent` (cron 5 min) y `ReportAgent` (bajo demanda).
- Ambos son **clientes MCP** del propio servidor MCP (mismas herramientas que ve un cliente externo).
- LLM detrás de `LlmPort`: adaptadores `ClaudeAdapter` (modelo por defecto `claude-sonnet-5-5`;
  `claude-haiku-5-5` para tareas baratas) y `OllamaAdapter` (dev).
- TTS detrás de `TtsPort`: `PollyAdapter` (voz neural es-MX/es-US) y `PiperAdapter` (local).
- Reporte = `{ markdown, dataset (filas), chart (spec Vega-Lite), audioKey }`; audio = resumen
  de ≤ 90 s, no el reporte entero.
- Guardarraíles: herramientas MCP de solo lectura por defecto, límite de pasos (8) y de tokens,
  datos personales agregados, todo queda en `AgentRun`.

## D9. MCP (T12)

Servidor MCP en `insights-service`, transporte **Streamable HTTP** en `/mcp`, SDK oficial
`@modelcontextprotocol/sdk`. Autenticación: Bearer JWT de identity con rol `ADMIN` (o token de
servicio para los agentes internos). Herramientas (todas de lectura salvo indicación):

| Herramienta | Fuente | Descripción |
|---|---|---|
| `get_platform_kpis` | insights (métricas) | usuarios activos, posts, inscripciones, créditos, por rango |
| `get_registration_stats` | events `/internal` | inscripciones por día/evento/estado |
| `list_events` | events | eventos por rango/estado |
| `get_credit_stats` | wallet `/internal` | recargas, débitos, reembolsos |
| `get_content_stats` | social `/internal` | posts, comentarios, reacciones, top hashtags |
| `list_flagged_content` | media + social `/internal` | cola de moderación |
| `list_failed_sagas` | events `/internal` | SAGAs fallidas/compensadas |
| `get_service_health` | todos `/health/ready` + RabbitMQ API | salud, colas, DLQ |
| `detect_anomalies` | insights (Isolation Forest) | anomalías en series |
| `generate_report` *(escritura)* | insights | crea un `GeneratedReport` |
| `raise_alert` *(escritura, solo agentes internos)* | insights | crea `Alert` |

Recursos MCP: `bandada://kpis/today`, `bandada://alerts/open`. Prompts MCP: `monthly_report`, `weekly_summary`.

## D10. n8n (T10)

| Workflow | Disparador | Acciones |
|---|---|---|
| `wf-01-bienvenida` | RabbitMQ `bandada.identity.user.registered.v1` | espera 1 h → email de bienvenida con tips + sugerir grupos de su carrera (REST social) |
| `wf-02-recordatorio-evento` | Cron cada hora | `GET events` que empiezan en 24 h → por cada inscrito confirmado: notificación (REST notification interna) |
| `wf-03-escalamiento-moderacion` | RabbitMQ `bandada.media.asset.flagged.v1` | si `score ≥ 0.95` o 3+ flags del mismo autor en 24 h → email/Telegram a moderadores + crea alerta (REST insights) |
| `wf-04-resumen-semanal` | Cron lunes 08:00 (America/La_Paz) | `POST /insights/reports` "Resumen de la semana" → espera → email a admins con texto + enlace al audio |
| `wf-05-alerta-critica` | RabbitMQ `bandada.insights.alert.raised.v1` (severity CRITICAL) | Telegram/email al equipo |

Workflows exportados como JSON en `bandadau-infra/n8n/workflows/`, credenciales por variables de entorno.

## D11. GraphQL del panel (T3)

Schema-first en `bandadau-docs/contracts/graphql/admin.graphql`, servido por `admin-gateway` (Apollo Server 5
sobre NestJS). Tipos raíz:
- **Query**: `me`, `dashboard(range)`, `users(filter, after, first)`, `user(id)`, `universities`,
  `moderationQueue(filter, after, first)`, `contentReports`, `events(filter)`, `event(id)`,
  `registrations(eventId)`, `sagas(status)`, `walletStats(range)`, `reports(after)`, `report(id)`,
  `alerts(status)`, `agentRuns(after)`, `serviceHealth`.
- **Mutation**: `updateUserRoles`, `suspendUser`, `reactivateUser`, `createUniversity`,
  `moderateMedia(id, decision, note)`, `resolveContentReport`, `requestReport(question)`,
  `acknowledgeAlert(id)`, `runMonitoringNow`.
- **Subscription**: `alertRaised`, `moderationQueueChanged`, `reportReady(id)`.
- Paginación Relay (`Connection`/`Edge`/`PageInfo`), DataLoader por servicio, autorización por
  directiva `@auth(requires: [ADMIN])`, límite de profundidad (7) y de complejidad.

## D12. Eventos de dominio (catálogo mínimo)

`bandada.identity.user.registered.v1`, `bandada.identity.user.role-changed.v1`, `bandada.identity.user.suspended.v1`,
`bandada.social.post.created.v1`, `bandada.social.post.published.v1`, `bandada.social.post.hidden.v1`, `bandada.social.post.deleted.v1`,
`bandada.social.comment.created.v1`, `bandada.social.reaction.set.v1`, `bandada.social.follow.created.v1`,
`bandada.social.group.join-requested.v1`, `bandada.social.content.reported.v1`,
`bandada.media.asset.approved.v1`, `bandada.media.asset.flagged.v1`, `bandada.media.asset.rejected.v1`,
`bandada.events.event.published.v1`, `bandada.events.event.cancelled.v1`,
`bandada.events.registration.confirmed.v1`, `bandada.events.registration.failed.v1`, `bandada.events.registration.cancelled.v1`,
`bandada.wallet.topup.paid.v1`, + respuestas SAGA de D2,
`bandada.ticketing.ticket.used.v1`,
`bandada.insights.alert.raised.v1`, `bandada.insights.report.ready.v1`.
Comandos: los 4 de D2.

Sobre CloudEvents: `specversion`, `id` (UUIDv7), `source` (`/services/<servicio>`), `type`,
`time`, `subject`, `datacontenttype: application/json`, `data`, extensiones
`correlationid`, `causationid`, `sagaid` (opcional), `traceparent`.

---

## D13. Tokens de diseño y temas claro/oscuro (agregado 2026-10-14)

Detalle: `bandadau-docs/docs/04-patrones-y-reglas/design-tokens-y-temas.md`.

- **Fuente única**: `bandadau-shared/packages/ui-tokens` (`@bandada/ui-tokens`) en formato **W3C Design Tokens (DTCG JSON)**,
  compilado con **Style Dictionary v4** a: `tokens.css` (CSS custom properties), `tailwind-theme.css`
  (bloque `@theme inline` de Tailwind v4), `tokens.ts` (objeto tipado para React Native / Vega-Lite) y
  `tokens.scss` (Angular).
- **Tres niveles**: *primitivos* (`color.blue.600`, `space.4`, `radius.md`) → *semánticos*
  (`color.bg.canvas`, `color.bg.surface`, `color.text.primary`, `color.text.muted`, `color.border.default`,
  `color.action.primary.bg`, `color.feedback.danger.fg`…) → *de componente* (`button.primary.bg`).
  **Los componentes solo usan tokens semánticos o de componente**; prohibido hex/rgb literales y
  utilidades de paleta cruda (`bg-blue-600`, `text-gray-500`) en código de UI.
- **Modos**: `light` y `dark`, definidos **solo en la capa semántica** (los primitivos no cambian).
  Preferencia del usuario `theme: SYSTEM | LIGHT | DARK` (por defecto `SYSTEM`).
- **Aplicación**: web → atributo `data-theme="light|dark"` en `<html>` (resuelto antes del primer
  pintado con un script inline para evitar parpadeo) y `color-scheme`; los MFEs heredan las variables
  CSS (atraviesan el Shadow DOM) y además reciben el atributo `theme`. Expo → `useColorScheme()` +
  `vars()` de NativeWind sobre las mismas variables semánticas (sin utilidades `dark:` dispersas);
  `userInterfaceStyle: "automatic"`, status bar y splash por tema.
- **Persistencia**: local (`bandada.theme` en localStorage / MMKV) y sincronizada en la cuenta vía
  `PATCH /api/v1/users/me/preferences` (`updateMyPreferences`) para usuarios con sesión.
- **Calidad**: prueba automática de contraste WCAG 2.2 AA de cada par texto/fondo semántico en ambos
  modos; gráficos (Vega-Lite) y mapas de color de alertas también derivan de tokens. Emails: solo claro.

## D14. Internacionalización (i18n) (agregado 2026-10-14)

Detalle: `bandadau-docs/docs/04-patrones-y-reglas/i18n.md`.

- **Idiomas**: `es` (principal, idioma fuente y *fallback*) y `en`. Formato regional: `es-BO` y `en-US`
  (fechas, números, créditos) con `Intl`. Zona horaria de presentación `America/La_Paz`.
- **Formato de mensajes**: **ICU MessageFormat** en archivos JSON por namespace:
  `locales/{es,en}/<namespace>.json`; claves en inglés `namespace.seccion.clave`. Nunca concatenar
  strings ni hardcodear textos de UI.
- **Librerías**: React/Next/Expo/MFE React → `i18next` + `react-i18next` + `i18next-icu`
  (landing con rutas `/es` y `/en` vía `generateStaticParams` para SEO); Angular → **Transloco** con
  plugin MessageFormat; Expo usa `expo-localization` para el idioma del dispositivo.
- **Compartido**: `bandadau-shared/packages/i18n` (`@bandada/i18n`): namespace `common`, etiquetas de enums
  (`RegistrationStatus`, `ReactionType`…), mensajes por **código de error** de Problem Details,
  helpers de formato (`formatCredits`, `formatDate`, `formatRelative`).
- **Resolución del idioma**: preferencia de la cuenta (`User.locale`) → elección guardada en el
  dispositivo → idioma del navegador/dispositivo → `es`.
- **Backend**: los clientes traducen por `code` (estable) del Problem Details; `title`/`detail` se
  localizan según `Accept-Language` (`es` por defecto) y la respuesta lleva `Content-Language`.
  `notification-service` renderiza push/email/in-app con plantillas por `locale` del destinatario;
  `insights-service` genera reportes y audio en el idioma del solicitante (voz TTS por idioma).
  El contenido de usuarios (posts, comentarios) **no** se traduce.
- **Calidad**: script `i18n:check` en CI (mismas claves en `es` y `en`, sin claves huérfanas,
  sintaxis ICU válida) y regla ESLint contra literales en JSX; `en` debe estar completo antes de cada release.

### Cambios derivados en D1
- identity-service: `GET /users/me` devuelve `locale` (`es|en`) y `theme` (`SYSTEM|LIGHT|DARK`);
  nuevo `PATCH /users/me/preferences` 🔑 (`updateMyPreferences`, body `{ locale?, theme? }`);
  `POST /auth/register` acepta `locale` opcional (por defecto el de `Accept-Language`).
- insights-service: `requestReport` acepta `locale` opcional (por defecto el del usuario).
- GraphQL: `User.locale`, `User.theme`; `requestReport(question, locale)`.
- Evento `bandada.identity.user.preferences-changed.v1` (`userId`, `locale`, `theme`) consumido por
  notification-service (copia local del idioma para plantillas).

---

## D15. Ampliaciones aceptadas en la consolidación (ADR-0016)

Decisiones de detalle y divergencias resueltas: ver `adr/ADR-0016-consolidacion-diseno-detallado.md`.
Superficie agregada a D1/D12. Estado: ✔ = ya en `bandadau-docs/contracts/` · ⏳ = **agregar al contrato antes de implementar**.

### Endpoints

| Servicio | Operación | operationId | Usado por | Contrato |
|---|---|---|---|---|
| identity | `PATCH /internal/v1/users/{userId}/roles`, `/status` (reactivar = `status: ACTIVE`) | `updateUserRoles`, `updateUserStatus` | UC-21 | ✔ |
| identity | `POST /auth/mcp-tokens` 🔑 ADMIN, `DELETE /auth/mcp-tokens/{id}` | `createMcpToken`, `revokeMcpToken` | UC-22 | ✔ |
| social | `GET /groups/{groupId}/members?status` | `listGroupMembers` | UC-09 | ✔ |
| social | `POST /groups/{groupId}/members/{userId}/reject`, `POST /groups/{groupId}/leave` | `rejectGroupMember`, `leaveGroup` | UC-09 | ✔ |
| social | `PATCH /internal/v1/reports/{reportId}` | `resolveContentReport` | UC-18 | ✔ |
| social | `GET /internal/v1/profiles/{userId}`, `GET /internal/v1/groups?career&limit` | `getProfileInternal`, `listGroupsInternal` | n8n wf-01 | ✔ |
| media | `createUpload` acepta `purpose: POST\|AVATAR\|EVENT_COVER`; `completeUpload` → 202 | — | UC-04/05/11 | ✔ |
| media | `GET /internal/v1/media/{mediaId}`, `GET /internal/v1/media/urls?ids=` | `getMediaInternal`, `getMediaUrls` | UC-06, UC-11, UC-18 | ✔ |
| media | filtros `ownerId`, `since` en `listFlaggedMedia` | — | n8n wf-03 | ✔ |
| events | `POST /events/{eventId}/cancel` ♻️ (202) | `cancelEvent` | organizador | ✔ |
| events | `GET /internal/v1/events/{eventId}/registrations?status` | `listEventRegistrations` | UC-23, GraphQL | ✔ |
| events | `GET /internal/v1/events?startsFrom&startsTo&status` | `listEventsInternal` | MCP `list_events`, wf-02 | ✔ |
| events | `POST /internal/v1/sagas/{sagaId}/retry` | `retrySaga` | UC-13, panel | ✔ |
| wallet | `GET /wallet/topups/{topUpId}` | `getTopUp` | UC-15 | ✔ |
| ticketing | `GET /tickets/signing-keys` (JWKS del QR) | `getTicketSigningKeys` | UC-14 offline | ✔ |
| notification | `POST /internal/v1/notifications` ♻️ `{userId, type, channels, params, dedupeKey}` | `sendNotification` | UC-23 | ✔ |
| insights | `POST /internal/v1/alerts` ♻️, `GET/POST /internal/v1/reports`, `GET /internal/v1/agent-runs`, `POST /internal/v1/agents/monitoring/runs`, KPIs, health | `raiseAlert`, `listReports`, `listAgentRuns`, `runMonitoringNow`, `getPlatformKpis`, `getServiceHealth` | GraphQL, MCP, n8n | ✔ |

### Eventos nuevos

| Tipo | Productor | Contrato |
|---|---|---|
| `bandada.identity.user.preferences-changed.v1` | identity | ✔ |
| `bandada.identity.user.reactivated.v1` | identity | ✔ |
| `bandada.ticketing.ticket-void-failed.v1` (`reason: TICKET_ALREADY_USED`) | ticketing | ✔ |
| `bandada.social.comment.hidden.v1`, `bandada.social.post.removed.v1` | social | ✔ |

Motivos adicionales en respuestas SAGA: `SAGA_ABORTED` (débito tardío tras reembolso) en
`credits-debit-failed`, `ALREADY_VOIDED` en `ticket-issue-failed`; `credits-refunded` admite
`amountCredits: 0` (tombstone que bloquea débitos tardíos). Reintentos de comandos a 5/10/20 s dentro
de la ventana de 30 s; las compensaciones se reintentan sin límite y alertan a los 2 min.

### n8n (actualiza D10)

`wf-00-router` (único consumidor de `n8n.automation`, despacha a subflujos) + `wf-01`…`wf-05` +
`wf-06-difusion-evento` (`event.published.v1` → notificación a estudiantes de la carrera/grupo).

### MCP (actualiza D9)

Clientes externos usan el token MCP de 8 h (`createMcpToken`). Herramienta adicional de solo lectura
`query_metrics` (PromQL acotado) para el MonitoringAgent — ✔ en `bandadau-docs/contracts/mcp`.
