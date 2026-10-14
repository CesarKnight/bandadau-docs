# Matriz de trazabilidad

Requisito → caso de uso → contrato (operationId REST, tipo de evento, campo GraphQL, herramienta
MCP) → componentes → pruebas. Se actualiza al cerrar cada sesión (regla 11 del `AGENTS.md` del workspace); cada
agente edita **solo las filas** de los UCs que tocó. La DR exige que no quede ninguna fila Must
en estado distinto de **V**.

## Leyenda

| Estado | Significado |
|---|---|
| **P** | Pendiente: hay UC pero el contrato no está completo |
| **C** | Contratado: operaciones/eventos presentes en `bandadau-docs/contracts/` y UC en "Secuencia" |
| **I** | Implementado en todos los componentes listados (pruebas unitarias e integración verdes) |
| **V** | Verificado: pruebas de aceptación del UC verdes en CI y demostrado en la DR |

- Todos los operationId, tipos de evento, campos GraphQL y herramientas MCP citados existen en
  `bandadau-docs/contracts/` (verificado el 2026-10-14 contra `openapi/*.yaml`, `asyncapi/bandada-events.yaml`,
  `graphql/admin.graphql` y `mcp/tools.md`).
- IDs de prueba (por definir en la sección 5 de cada UC): `AT-UCxx-nn` aceptación (Given/When/Then),
  `CT-<servicio>-<operationId>` contrato, `IT-<servicio>-nn` integración, `E2E-nn` sistema,
  `ARCH-<servicio>` arquitectura, `NFR-xx` verificación no funcional.

## 1. Requisitos funcionales

| RF | UC | REST (operationId) | Eventos / GraphQL / MCP | Componentes | Pruebas | Estado |
|---|---|---|---|---|---|---|
| RF-01 | UC-01 | `listUniversities`, `registerUser` | `bandada.identity.user.registered.v1` | identity, mobile, landing | AT-UC01-01…, CT-identity-registerUser | C |
| RF-02 | UC-01 | `verifyEmail`, `resendVerificationCode` | — | identity, mobile | AT-UC01-0x | C |
| RF-03 | UC-02 | `login`, `refreshToken`, `logout`, `getMe` | — | identity, mobile, admin-shell | AT-UC02-01…, IT-identity-refresh-reuse | C |
| RF-04 | UC-03 | `createHandoffCode`, `exchangeHandoffCode` | — | identity, mobile, admin-shell | AT-UC03-01…, E2E-01 (app→panel) | C |
| RF-05 | UC-04 | `getMyProfile`, `updateMyProfile`, `createUpload`, `completeUpload` | `bandada.media.asset.approved.v1` (avatar) | social, media, mobile | AT-UC04-01… || C |
| RF-06 | UC-05 | `createPost`, `createUpload`, `completeUpload`, `getMedia` | `bandada.social.post.created.v1`, `bandada.social.post.published.v1` | social, media, mobile | AT-UC05-01… || C |
| RF-07 | UC-05, UC-18 | `listFlaggedMedia`, `decideMedia` | `bandada.media.asset.approved.v1` / `.flagged.v1` / `.rejected.v1`; GraphQL `moderationQueue`, `moderateMedia` | media, social, admin-gateway, mfe-moderation, `bandadau-ml/` | AT-UC05-0x, AT-UC18-01…, NFR-12 || C |
| RF-08 | UC-05 | `createPost` (`Idempotency-Key`, `clientId`) | — | mobile (cola offline), social | AT-UC05-0x (offline sin duplicados), E2E-02 | C |
| RF-09 | UC-06 | `getFeed` | — | social, mobile (cache + SW) | AT-UC06-01…, NFR-09 | C |
| RF-10 | UC-07 | `createComment`, `listComments`, `setReaction`, `removeReaction` | `bandada.social.comment.created.v1`, `bandada.social.reaction.set.v1` | social, notification, mobile | AT-UC07-01… | C |
| RF-11 | UC-08 | `followUser`, `unfollowUser`, `getFollowSuggestions` | `bandada.social.follow.created.v1` | social, mobile | AT-UC08-01… | C |
| RF-12 | UC-09 | `createGroup`, `listGroups`, `getGroup`, `joinGroup`, `listGroupMembers`, `approveGroupMember`, `listGroupPosts` | `bandada.social.group.join-requested.v1` | social, notification, mobile | AT-UC09-01… | C |
| RF-13 | UC-10 | `reportContent`; internos `listContentReports`, `resolveContentReport`, `updatePostStatus` | `bandada.social.content.reported.v1`, `bandada.social.post.hidden.v1`; GraphQL `contentReports`, `resolveContentReport` | social, mobile, admin-gateway | AT-UC10-01… | C |
| RF-14 | UC-11 | `createEvent`, `publishEvent`, `listEvents`, `getEvent` | `bandada.events.event.published.v1` | events, media, mobile, landing, n8n | AT-UC11-01… || C |
| RF-15 | UC-12 | `registerToEvent`, `getRegistration`, `listMyRegistrations` | comandos `bandada.wallet.cmd.debit-credits.v1`, `bandada.ticketing.cmd.issue-ticket.v1` (+ compensaciones); respuestas SAGA; `bandada.events.registration.confirmed.v1` / `.failed.v1` | events, wallet, ticketing, notification, mobile | AT-UC12-01…, E2E-03 (rollback con caos), NFR-02 || C |
| RF-16 | UC-12 | `registerToEvent` (`Idempotency-Key`; índice parcial único) | — | events, mobile | AT-UC12-0x (doble clic), IT-events-unique-active || C |
| RF-17 | UC-13 | `cancelRegistration` | `bandada.ticketing.cmd.void-ticket.v1`, `bandada.wallet.cmd.refund-credits.v1`, `bandada.events.registration.cancelled.v1` | events, wallet, ticketing, mobile | AT-UC13-01… || C |
| RF-18 | UC-14 | `validateTicket`, `getTicket`, `listMyTickets` | `bandada.ticketing.ticket.used.v1` | ticketing, events (organizador), mobile | AT-UC14-01… | C |
| RF-19 | UC-15 | `createTopUp`, `getTopUp`, `simulateTopUpPayment`, `paymentWebhook` | `bandada.wallet.topup.paid.v1` | wallet, mobile | AT-UC15-01… (doble pago = 1 cargo) | C |
| RF-20 | UC-16 | `getMyWallet`, `listMyLedgerEntries` | — | wallet, mobile | AT-UC16-01… | C |
| RF-21 | UC-17 | — (on-device) | — | mobile (`LocalLlm`) | AT-UC17-01…, NFR-11 | C |
| RF-22 | UC-18 | `listFlaggedMedia`, `decideMedia`, `listPostsByStatus`, `updatePostStatus`, `updateUserStatus` | GraphQL `moderationQueue`, `moderateMedia`, `resolveContentReport`, `suspendUser`, sub. `moderationQueueChanged`; n8n `wf-03` | admin-shell, mfe-moderation, admin-gateway, media, social, identity, n8n | AT-UC18-01… || C |
| RF-23 | UC-19 | `requestReport`, `getReport`, `listReports`, `getAgentRun` | `bandada.insights.report.ready.v1`; GraphQL `requestReport`, `report`, sub. `reportReady`; MCP `generate_report` + herramientas de lectura | insights, admin-gateway, mfe-insights | AT-UC19-01… || C |
| RF-24 | UC-20 | `runMonitoringNow`, `listAlerts`, `acknowledgeAlert`, `raiseAlert`, `getServiceHealth` | `bandada.insights.alert.raised.v1`; GraphQL `alerts`, `acknowledgeAlert`, `runMonitoringNow`, sub. `alertRaised`; MCP `detect_anomalies`, `get_service_health`, `list_failed_sagas`; n8n `wf-05` | insights, admin-gateway, mfe-insights, n8n | AT-UC20-01…, E2E-04 || C |
| RF-25 | UC-21 | internos `searchUsers`, `updateUserRoles`, `updateUserStatus`, `createUniversity`, `updateUniversity` | `bandada.identity.user.role-changed.v1`, `bandada.identity.user.suspended.v1`; GraphQL `users`, `user`, `updateUserRoles`, `suspendUser`, `reactivateUser`, `createUniversity` | identity, admin-gateway, admin-shell | AT-UC21-01… || C |
| RF-26 | UC-22 | `mcpPost`, `mcpOpenStream`, `mcpTerminateSession` | MCP: herramientas D9 (`bandadau-docs/contracts/mcp/tools.md`) | insights | AT-UC22-01… (Claude Desktop) || C |
| RF-27 | UC-23 | `sendNotification` (interno), `listEvents`, `requestReport` | n8n `wf-02`, `wf-04`; `bandada.events.registration.confirmed.v1` | n8n, events, notification, insights | AT-UC23-01… || C |
| RF-28 | UC-24 | `listNotifications`, `markNotificationRead`, `markAllNotificationsRead`, `getNotificationPreferences`, `updateNotificationPreferences`, `registerDevice`, `unregisterDevice` | consume `bandada.events.registration.#`, `bandada.social.#`, `bandada.wallet.topup.#`, `bandada.insights.alert.#` | notification, mobile | AT-UC24-01… | C |
| RF-29 | UC-04 | `getMe`, `updateMyPreferences` (`theme`) | `bandada.identity.user.preferences-changed.v1`; GraphQL `User.theme` | identity, mobile, admin-shell, MFEs, landing, `bandadau-shared/packages/ui-tokens` | AT-UC04-0x, NFR-20 (contraste AA claro/oscuro) | C |
| RF-30 | UC-04, UC-19, UC-24 | `getMe`, `updateMyPreferences` (`locale`), `registerUser` (`locale`), `requestReport` (`locale`) | `bandada.identity.user.preferences-changed.v1`; GraphQL `User.locale`, `requestReport(question, locale)` | identity, notification, insights, todas las apps, `bandadau-shared/packages/i18n` | AT-UC04-0x, AT-UC19-0x (audio en), AT-UC24-0x (plantilla en), NFR-21 | C |

## 2. Requisitos no funcionales → verificación

| RNF | Verificación | Dónde / herramienta | Prueba | Release | Estado |
|---|---|---|---|---|---|
| RNF-01 Rendimiento REST | k6: p95 < 300 ms lectura / < 600 ms escritura, 100 VUs | `bandadau-infra/load/` | NFR-01 | R4 | P |
| RNF-02 SAGA < 3 s p95 | Métrica `saga_duration_seconds` en Grafana + k6 de inscripciones | events, LGTM | NFR-02 | R2 | P |
| RNF-03 Degradación elegante | Apagar notification/insights y publicar/inscribirse | `make` + guion manual | NFR-03 | R3 | P |
| RNF-04 Ningún estado SAGA abierto > 2 min | Prueba de integración con fallo inyectado y timeout | events (Testcontainers) | NFR-04 | R2 | P |
| RNF-05 Idempotencia | Reenvío N veces de peticiones y mensajes | todos los servicios | NFR-05 | R1–R2 | P |
| RNF-06 Seguridad | Revisión + OWASP ZAP baseline + pruebas Argon2/JWT | CI `e2e-nightly` | NFR-06 | R3 | P |
| RNF-07 Mínimo privilegio | Revisión de usuarios DB/broker, IAM, `/internal` → 403 | `bandadau-infra/` | NFR-07 | R1 | P |
| RNF-08 Privacidad | Buckets privados, URLs prefirmadas, revisión de prompts/herramientas MCP | media, insights | NFR-08 | R3 | P |
| RNF-09 Offline | Prueba manual en modo avión (feed, posts, comentarios, asistente, cola tras cierre) | mobile | NFR-09 | R4 | P |
| RNF-10 PWA | Lighthouse CI (installable, rendimiento ≥ 80) | `app-mobile.yml` | NFR-10 | R4 | P |
| RNF-11 IA local | Medición de tamaño y primer token en gama media | mobile | NFR-11 | R4 | P |
| RNF-12 ML recall ≥ 0.90 | Notebook de evaluación | `bandadau-ml/` | NFR-12 | R1 | P |
| RNF-13 Observabilidad | Traza de punta a punta de la SAGA en Grafana | LGTM | NFR-13 | R2 | P |
| RNF-14 Arquitectura | ArchUnit / dependency-cruiser / Deptrac en CI | cada servicio | ARCH-* | R0+ | P |
| RNF-15 Calidad | Cobertura ≥ 70 % dominio/aplicación; Spectral, AsyncAPI, graphql-inspector | CI | — | R0+ | P |
| RNF-16 Portabilidad | `make up` < 10 min en 16 GB | README / cronometrado | NFR-16 | R0 | P |
| RNF-17 Usabilidad | axe + revisión WCAG 2.2 AA; objetivos ≥ 44 px | landing, panel, app | NFR-17 | R4 | P |
| RNF-18 Costo | Estimación + AWS Budgets | `05-infraestructura/infraestructura.md` §4.4 | NFR-18 | R1 | P |
| RNF-19 IA responsable | Revisión de herramientas (solo lectura por defecto) y auditoría `AgentRun` | insights | NFR-19 | R3 | P |
| RNF-20 Tokens y contraste | Lint sin colores literales + test de contraste AA de pares semánticos en claro **y** oscuro; sin parpadeo | `bandadau-shared/packages/ui-tokens`, apps | NFR-20 | R0+ | P |
| RNF-21 i18n | `i18n:check` (mismas claves es/en, ICU válido) + ESLint sin literales | apps, `bandadau-shared/packages/i18n` | NFR-21 | R0+ | P |

## 3. Requisitos de la cátedra → UC (resumen)

Ver `bandadau-docs/docs/01-vision/cumplimiento-catedra.md`. Toda tecnología T1–T13 y condición C1–C5 debe
aparecer en al menos una fila de la tabla 1 en estado **V** antes de la defensa.
