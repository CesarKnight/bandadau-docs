# Backlog — Bandada U

Épicas E1–E18 de `bandadau-docs/docs/01-vision/vision-y-alcance.md` §5 descompuestas en historias de usuario
(HU) y una épica técnica **E0 Plataforma** con historias técnicas (HT). Cada HU se traza a un
caso de uso (`bandadau-docs/docs/02-iconix/03-casos-de-uso/00-catalogo.md`) y a los RF
(`bandadau-docs/docs/02-iconix/07-trazabilidad.md`).

- **Estimación**: puntos de historia (Fibonacci 1, 2, 3, 5, 8, 13). Referencia: 3 pts ≈ un
  endpoint con caso de uso, pruebas y contrato ya definido.
- **Release / sprint**: según `roadmap-y-sprints.md`.
- **Prioridad**: la del UC (Must salvo indicación).
- Una HU no se toma si su UC no está en estado **Secuencia** (regla ICONIX).
- **App Expo (fase 1, a cargo del equipo):** el plan A-1…A-16 / B-1…B-14 / C-1…C-9 está en
  [`auditoria-app-expo.md`](auditoria-app-expo.md).
- Criterios de aceptación breves; el detalle Given/When/Then vive en la sección 5 del UC.

## Resumen por épica

| Épica | HU | Pts | Release |
|---|---|---|---|
| E0 Plataforma | HT-01…HT-12 | 63 | R0–R4 |
| E1 Identidad | HU-01…HU-07 | 34 | R0 |
| E2 Perfil | HU-08…HU-09 | 8 | R1 |
| E3 Publicaciones | HU-10…HU-15 | 34 | R1 |
| E4 Feed | HU-16…HU-18b | 20 | R1 / R4 |
| E5 Grupos | HU-19…HU-21 | 13 | R1 |
| E6 Moderación IA | HU-22…HU-25 | 26 | R1 / R3 |
| E7 Eventos | HU-26…HU-32 | 42 | R2 |
| E8 Billetera | HU-33…HU-35 | 16 | R2 |
| E9 Entradas | HU-36…HU-37 | 10 | R2 |
| E10 Notificaciones | HU-38…HU-41 | 18 | R2 |
| E11 IA local | HU-42…HU-44 | 21 | R4 |
| E12 PWA / offline | HU-45…HU-47 | 21 | R4 |
| E13 Panel admin | HU-48…HU-52 | 31 | R3 |
| E14 Agentes | HU-53…HU-56 | 29 | R3 |
| E15 MCP | HU-57…HU-58 | 13 | R3 |
| E16 Automatización | HU-59…HU-62 | 15 | R3 |
| E17 Landing | HU-63…HU-64 | 8 | R4 |
| E18 Experiencia (temas e i18n) — RF-29, RF-30 | HU-65…HU-70 | 26 | R0–R4 |
| **Total** | | **448** | |

Con ~6 personas apoyadas por agentes y **4 sprints** hasta la entrega (10-nov-2026), la velocidad
necesaria es ~110 pts/sprint (S1 es corto y se dedica a revisiones e infraestructura). Solo es viable
con trabajo en paralelo por repositorio y aplicando el orden de recorte de `roadmap-y-sprints.md` §2
(lo Should primero).

---

## Avance al 2026-10-15 (fase 1)

| Épica | Estado | Nota |
|---|---|---|
| E0 Plataforma | Parcial | Hecho: HT de infra local (Compose, Traefik, RabbitMQ, init, seed, smoke), paquetes `@bandada/*`, scaffolding de repos. Pendiente: AWS/Terraform, observabilidad LGTM completa, CI de todos los repos |
| E1 Identidad, E2 Perfil, E3 Publicaciones, E4 Feed, E5 Grupos | Backend hecho | Sin ranker ML ni moderación ML; app Expo a cargo del equipo |
| E6 Moderación IA | Solo manual | La moderación DL/ML y OCR son fase 2 |
| E7 Eventos, E8 Billetera, E9 Entradas, E10 Notificaciones | Backend hecho | SAGA verificada con compensación (`CHAOS_TICKETING_FAIL`); Web Push diferido |
| E11 IA local, E12 PWA/offline | Pendiente | App y fase 2 |
| E13 Panel admin | Hecho (moderación y usuarios) | `mfe-insights` es fase 2; falta `updateUniversity` en el gateway |
| E14 Agentes, E15 MCP, E16 Automatización | Pendiente fase 2 | |
| E17 Landing | Hecho | |
| E18 Temas e i18n | Hecho en panel y landing; app pendiente | |

## E0 — Plataforma (historias técnicas)

| ID | Historia | Criterios de aceptación | UC | Componente | Pts | Rel. |
|---|---|---|---|---|---|---|
| HT-01 | Como equipo quiero levantar toda la infraestructura con un comando | `make infra-up` levanta los 12 contenedores del perfil `infra` sanos; Postgres con 3 bases/3 usuarios; Mongo `rs0` PRIMARY; 4 tablas DynamoDB; colas y DLQ del catálogo; buckets MinIO | — | infra | 8 | R0 |
| HT-02 | Como equipo quiero un gateway con rutas por prefijo y `/internal` bloqueado | Rutas del catálogo §4 responden; `/internal/**` → 403; CORS y rate-limit en auth | — | infra (Traefik) | 3 | R0 |
| HT-03 | Como desarrollador quiero contratos validados y tipos generados | `make contracts-lint` (bandadau-docs) y `pnpm contracts:gen` (bandadau-shared) en CI; falla si hay diff | todos | bandadau-docs, bandadau-shared | 5 | R0 |
| HT-04 | Como desarrollador TS quiero librerías de outbox/inbox, CloudEvents e idempotencia | `@bandada/messaging-ts`, `@bandada/idempotency-ts`, `@bandada/auth-ts` con pruebas Testcontainers | UC-05, UC-12 | packages | 8 | R0 |
| HT-05 | Como desarrollador Java/PHP quiero los equivalentes de outbox/inbox/idempotencia | Módulo interno en identity/events (Java) y wallet/notification (PHP) con las mismas semánticas (D3) | UC-12, UC-15 | services Java/PHP | 8 | R0–R2 |
| HT-06 | Como equipo quiero CI por componente con path filters | Workflows por servicio/app; lint, tests, arquitectura (ArchUnit/dependency-cruiser/Deptrac), contrato, imagen | — | bandadau-infra/ci | 5 | R0 |
| HT-07 | Como equipo quiero observabilidad de punta a punta | Traza de la SAGA visible en Grafana con `traceparent` entre los 3 lenguajes (RNF-13) | UC-12 | infra, todos | 5 | R2 |
| HT-08 | Como equipo quiero desplegar la demo en AWS | Pilas `network/data/compute/edge/ci` aplicadas; `api.`/`app.`/`admin.`/`mfe.`/landing con TLS | — | bandadau-infra/aws | 8 | R1 |
| HT-09 | Como equipo quiero despliegue continuo por SSM | Merge a `main` → imagen en ECR → `host-deploy.sh` con healthcheck y rollback | — | bandadau-infra/ci | 3 | R1 |
| HT-10 | Como equipo quiero datos de demo reproducibles | `make seed` crea universidades, usuarios por rol, grupos, eventos, créditos vía APIs | todos | bandadau-infra/seed | 3 | R1–R3 |
| HT-11 | Como equipo quiero pruebas de carga | k6 cumple umbrales RNF-01/RNF-02 en el host de demo | UC-06, UC-12 | bandadau-infra/load | 3 | R4 |
| HT-12 | Como equipo quiero backups y restauración probados | `mongodump` diario, PITR ticketing, ensayo de restauración documentado | — | infra | 4 | R4 |

## E1 — Identidad

| ID | Historia | Criterios de aceptación | UC | Componente | Pts | Rel. |
|---|---|---|---|---|---|---|
| HU-01 | Como visitante quiero registrarme con mi correo institucional para unirme a Bandada U | Dominio no permitido → 422 con código de error; cuenta `PENDING_VERIFICATION`; código enviado (Mailpit); `Idempotency-Key` respetado | UC-01 | identity, mobile | 5 | R0 |
| HU-02 | Como visitante quiero verificar mi correo con un código de 6 dígitos | Código válido 15 min, 5 intentos; al verificar → `ACTIVE`, tokens emitidos, `user.registered` publicado; reenvío con rate-limit | UC-01 | identity, notification, mobile | 5 | R0 |
| HU-03 | Como estudiante quiero iniciar sesión y mantenerla sin re-loguearme a cada rato | Access 15 min, refresh 30 días rotativo; reuso de refresh revocado revoca la familia; logout revoca | UC-02 | identity, mobile | 5 | R0 |
| HU-04 | Como administrador quiero abrir el panel desde la app sin volver a iniciar sesión | Botón "Abrir panel" solo con rol MODERATOR/ADMIN; código 60 s, un uso, PKCE; panel entra con sesión | UC-03 | identity, mobile, admin-shell | 8 | R0 |
| HU-05 | Como administrador quiero volver del panel a la app sin login | "Abrir en la app" con universal link; abre app nativa o PWA con sesión | UC-03 | identity, admin-shell, mobile | 3 | R0 |
| HU-06 | Como servicio quiero obtener un token de servicio | `issueServiceToken` solo desde red interna; JWT `typ=service` aceptado en `/internal` | — (soporte UC-18…22) | identity | 3 | R0 |
| HU-07 | Como visitante quiero ver la lista de universidades habilitadas al registrarme | `listUniversities` público, ordenado, con dominios permitidos | UC-01 | identity, mobile | 5 | R0 |

## E2 — Perfil

| ID | Historia | Criterios de aceptación | UC | Componente | Pts | Rel. |
|---|---|---|---|---|---|---|
| HU-08 | Como estudiante quiero editar mi perfil académico | Nombre visible, carrera, semestre, bio ≤ 280, intereses ≤ 10; universidad solo lectura; validaciones con errores i18n | UC-04 | social, mobile | 5 | R1 |
| HU-09 | Como estudiante quiero subir un avatar | Subida prefirmada; pasa moderación; avatar visible solo si `APPROVED` | UC-04 | social, media, mobile | 3 | R1 |

## E3 — Publicaciones

| ID | Historia | Criterios de aceptación | UC | Componente | Pts | Rel. |
|---|---|---|---|---|---|---|
| HU-10 | Como estudiante quiero publicar un post de texto con hashtags y visibilidad | Texto ≤ 2000; hashtags extraídos; `PUBLIC/FOLLOWERS/GROUP`; `clientId` único por autor | UC-05 | social, mobile | 5 | R1 |
| HU-11 | Como estudiante quiero adjuntar hasta 4 imágenes | `createUpload` → PUT prefirmado → `completeUpload`; post `PENDING_MEDIA` hasta `APPROVED` | UC-05 | media, social, mobile | 8 | R1 |
| HU-12 | Como estudiante quiero adjuntar un video corto | 1 video ≤ 60 s y ≤ 50 MB; miniatura generada; frames moderados | UC-05 | media, mobile | 8 | R1 |
| HU-13 | Como estudiante quiero comentar un post | Comentario ≤ 500; `Idempotency-Key`; autor notificado | UC-07 | social, notification | 5 | R1 |
| HU-14 | Como estudiante quiero reaccionar a un post | Una reacción por usuario/post, cambiable; `PUT` idempotente | UC-07 | social, mobile | 3 | R1 |
| HU-15 | Como autor quiero borrar mi post | `DELETE` → `REMOVED`; `post.deleted` → media borra objetos | UC-05 | social, media | 5 | R1 |

## E4 — Feed

| ID | Historia | Criterios de aceptación | UC | Componente | Pts | Rel. |
|---|---|---|---|---|---|---|
| HU-16 | Como estudiante quiero un feed de seguidos y grupos paginado por cursor | `{ items, nextCursor }`; sin duplicados entre páginas; solo `PUBLISHED` | UC-06 | social, mobile | 5 | R1 |
| HU-17 | Como estudiante quiero que el feed priorice lo relevante | `feed-ranker` puntúa ítems; recomendados mezclados; features documentadas | UC-06 | social, ml | 5 | R1 |
| HU-18 | Como estudiante quiero ver el feed sin conexión | Última versión cacheada (persister); banner "Sin conexión"; RNF-09 | UC-06 | mobile | 5 | R4 |
| HU-18b | Como estudiante quiero sugerencias de a quién seguir *(Should)* | `getFollowSuggestions` por carrera, grupos y grafo; seguir/dejar de seguir | UC-08 | social, mobile | 5 | R1 |

## E5 — Grupos

| ID | Historia | Criterios de aceptación | UC | Componente | Pts | Rel. |
|---|---|---|---|---|---|---|
| HU-19 | Como estudiante quiero crear un grupo de estudio público o privado | Creador `OWNER`; nombre, materia, privacidad | UC-09 | social, mobile | 5 | R1 |
| HU-20 | Como estudiante quiero unirme a un grupo | Público → `ACTIVE`; privado → `PENDING` y aprobación por OWNER/ADMIN (notificado) | UC-09 | social, notification | 5 | R1 |
| HU-21 | Como miembro quiero publicar dentro del grupo | Visibilidad `GROUP`; solo miembros `ACTIVE` ven y publican | UC-09 | social | 3 | R1 |

## E6 — Moderación IA

| ID | Historia | Criterios de aceptación | UC | Componente | Pts | Rel. |
|---|---|---|---|---|---|---|
| HU-22 | Como plataforma quiero clasificar cada imagen con un modelo DL | ONNX NSFW/violencia; umbrales D7; `ModerationResult` con `modelVersion`; evento `approved/flagged/rejected` | UC-05 | media, ml | 8 | R1 |
| HU-23 | Como estudiante quiero que mis fotos se etiqueten y sus textos sean buscables *(Should)* | CLIP zero-shot → `tags`; OCR → `ocrText` | UC-05 | media, ml | 5 | R1 |
| HU-24 | Como estudiante quiero denunciar un post o comentario *(Should)* | Motivo obligatorio; 3 denuncias distintas → `HIDDEN` | UC-10 | social, mobile | 5 | R1 |
| HU-25 | Como moderador quiero una cola de contenido marcado con acciones | Vista previa, puntajes, aprobar/rechazar/suspender autor vía GraphQL; cola se actualiza en vivo | UC-18 | mfe-moderation, admin-gateway, media, social, identity | 8 | R3 |

## E7 — Eventos

| ID | Historia | Criterios de aceptación | UC | Componente | Pts | Rel. |
|---|---|---|---|---|---|---|
| HU-26 | Como organizador quiero crear un evento en borrador | Título, descripción, portada, fecha, lugar, cupo, precio (0 = gratis); `Idempotency-Key` | UC-11 | events, media, mobile | 5 | R2 |
| HU-27 | Como organizador quiero publicar el evento | `DRAFT → PUBLISHED`; `event.published` (n8n, landing) | UC-11 | events | 3 | R2 |
| HU-28 | Como estudiante quiero ver eventos próximos | `listEvents` por rango y cursor; público para landing | UC-11, UC-12 | events, mobile, landing | 3 | R2 |
| HU-29 | Como estudiante quiero inscribirme a un evento pagado | 202 `PENDING`; SAGA reserva → débito → ticket; `CONFIRMED` con ticket en < 3 s p95 | UC-12 | events, wallet, ticketing, mobile | 13 | R2 |
| HU-30 | Como estudiante quiero que un doble clic no me inscriba dos veces | Misma `Idempotency-Key` → misma respuesta; índice parcial único; un solo débito | UC-12 | events, mobile | 5 | R2 |
| HU-31 | Como estudiante quiero que si algo falla me devuelvan todo | Fallo de ticket → `void`/`refund`/liberar cupo → `FAILED` con motivo; timeout 30 s; demo con `CHAOS_TICKETING_FAIL` | UC-12 | events, wallet, ticketing | 8 | R2 |
| HU-32 | Como estudiante quiero cancelar mi inscripción hasta 24 h antes | SAGA inversa; ticket `VOIDED`, reembolso, cupo liberado; < 24 h → 409 | UC-13 | events, wallet, ticketing, mobile | 5 | R2 |

## E8 — Billetera

| ID | Historia | Criterios de aceptación | UC | Componente | Pts | Rel. |
|---|---|---|---|---|---|---|
| HU-33 | Como estudiante quiero recargar créditos con un paquete | Paquetes 20/50/100; `checkoutUrl`; pasarela simulada | UC-15 | wallet, mobile | 5 | R2 |
| HU-34 | Como estudiante quiero que un pago repetido no me acredite dos veces | Webhook firmado HMAC; dedupe por `gatewayRef`; `operationRef` único; doble clic = 1 cargo | UC-15 | wallet | 5 | R2 |
| HU-35 | Como estudiante quiero ver mi saldo y movimientos | Saldo = suma del ledger; historial paginado; créditos formateados por locale | UC-16 | wallet, mobile | 6 | R2 |

## E9 — Entradas

| ID | Historia | Criterios de aceptación | UC | Componente | Pts | Rel. |
|---|---|---|---|---|---|---|
| HU-36 | Como estudiante quiero ver mi ticket con QR | `listMyTickets`, `getTicket` con `qrPayload` firmado; disponible offline | UC-12 | ticketing, mobile | 5 | R2 |
| HU-37 | Como portero quiero validar entradas escaneando el QR | Firma válida + organizador del evento → `USED` una sola vez; segundo escaneo → "ya usado" | UC-14 | ticketing, mobile | 5 | R2 |

## E10 — Notificaciones

| ID | Historia | Criterios de aceptación | UC | Componente | Pts | Rel. |
|---|---|---|---|---|---|---|
| HU-38 | Como estudiante quiero recibir push cuando mi inscripción se confirma o falla | Consumidor idempotente; push Expo + in-app; texto en mi idioma | UC-24 | notification, mobile | 5 | R2 |
| HU-39 | Como estudiante quiero ver y marcar como leídas mis notificaciones | Lista paginada; leer una / todas | UC-24 | notification, mobile | 5 | R2 |
| HU-40 | Como estudiante quiero elegir qué notificaciones recibo | Preferencias por canal/tipo respetadas | UC-24 | notification, mobile | 3 | R2 |
| HU-41 | Como estudiante quiero registrar mi dispositivo para push | `registerDevice` idempotente por token; baja al cerrar sesión | UC-24 | notification, mobile | 5 | R2 |

## E11 — IA local

| ID | Historia | Criterios de aceptación | UC | Componente | Pts | Rel. |
|---|---|---|---|---|---|---|
| HU-42 | Como estudiante quiero descargar el asistente de estudio | Descarga solo en Wi-Fi con progreso; ≤ 1.5 GB; reanudable | UC-17 | mobile | 5 | R4 |
| HU-43 | Como estudiante quiero resumir un texto y generar flashcards sin conexión | Modo avión; primer token < 3 s gama media; nativo executorch, web WebLLM/transformers.js | UC-17 | mobile | 8 | R4 |
| HU-44 | Como estudiante quiero que el teléfono me avise si una foto puede ser rechazada | Clasificador on-device antes de subir; aviso no bloqueante; servidor decide | UC-05 | mobile, ml | 8 | R4 |

## E12 — PWA / offline

| ID | Historia | Criterios de aceptación | UC | Componente | Pts | Rel. |
|---|---|---|---|---|---|---|
| HU-45 | Como estudiante quiero instalar la app web | Manifest + service worker Workbox; Lighthouse installable; rendimiento ≥ 80 | UC-06 | mobile (web) | 5 | R4 |
| HU-46 | Como estudiante quiero publicar sin conexión y que se sincronice sola | `OfflineMutation` en SQLite/IndexedDB con `idempotencyKey` y `clientId`; drenado con backoff; sin duplicados | UC-05 | mobile | 8 | R4 |
| HU-47 | Como estudiante quiero ver el estado de mis acciones pendientes | Indicador "pendiente/sincronizando/error" por post/comentario; reintentar o descartar | UC-05 | mobile | 8 | R4 |

## E13 — Panel admin

| ID | Historia | Criterios de aceptación | UC | Componente | Pts | Rel. |
|---|---|---|---|---|---|---|
| HU-48 | Como administrador quiero un panel que cargue módulos independientes | Shell lee `mfe-manifest.json`; carga Web Components; contrato de atributos/eventos D5 | UC-18, UC-19 | admin-shell | 8 | R3 |
| HU-49 | Como administrador quiero un dashboard con KPIs | `dashboard(range)` GraphQL; gráficos con tokens de tema | UC-20 | admin-shell, admin-gateway | 5 | R3 |
| HU-50 | Como administrador quiero buscar usuarios y cambiar roles | `users`, `updateUserRoles`; auditoría; evento `role-changed` | UC-21 | admin-shell, admin-gateway, identity | 5 | R3 |
| HU-51 | Como administrador quiero suspender/reactivar cuentas y gestionar universidades | `suspendUser`/`reactivateUser`, `createUniversity` con dominios | UC-21 | admin-shell, admin-gateway, identity | 5 | R3 |
| HU-52 | Como plataforma quiero un BFF GraphQL seguro | `@auth`, profundidad 7, complejidad, DataLoader, Relay | UC-18, UC-21 | admin-gateway | 8 | R3 |

## E14 — Agentes

| ID | Historia | Criterios de aceptación | UC | Componente | Pts | Rel. |
|---|---|---|---|---|---|---|
| HU-53 | Como administrador quiero pedir un reporte en lenguaje natural | `requestReport` → 202; agente usa herramientas MCP; ≤ 8 pasos; `AgentRun` auditado | UC-19 | insights, mfe-insights | 8 | R3 |
| HU-54 | Como administrador quiero el reporte en texto, tabla, gráfico y audio | Markdown + dataset + Vega-Lite + audio ≤ 90 s en mi idioma; `reportReady` | UC-19 | insights, mfe-insights | 8 | R3 |
| HU-55 | Como administrador quiero que un agente vigile la plataforma cada 5 min | Detecta servicios caídos, SAGAs fallidas, DLQ, backlog, anomalías (Isolation Forest) → `Alert` | UC-20 | insights, ml | 8 | R3 |
| HU-56 | Como administrador quiero ver alertas en vivo y reconocerlas | Subscription `alertRaised`; `acknowledgeAlert` | UC-20 | mfe-insights, admin-gateway | 5 | R3 |

## E15 — MCP

| ID | Historia | Criterios de aceptación | UC | Componente | Pts | Rel. |
|---|---|---|---|---|---|---|
| HU-57 | Como administrador quiero consultar Bandada U desde Claude Desktop | Servidor MCP Streamable HTTP `/mcp`; JWT ADMIN; herramientas D9 de solo lectura | UC-22 | insights | 8 | R3 |
| HU-58 | Como agente interno quiero usar las mismas herramientas MCP | Agentes como clientes MCP con token de servicio; recursos y prompts D9 | UC-19, UC-20 | insights | 5 | R3 |

## E16 — Automatización

| ID | Historia | Criterios de aceptación | UC | Componente | Pts | Rel. |
|---|---|---|---|---|---|---|
| HU-59 | Como estudiante nuevo quiero un correo de bienvenida con grupos sugeridos | `wf-01` 1 h después de `user.registered` | UC-01, UC-23 | n8n | 3 | R3 |
| HU-60 | Como estudiante quiero un recordatorio 24 h antes del evento | `wf-02` cron horario; sin duplicados | UC-23 | n8n, events, notification | 5 | R3 |
| HU-61 | Como moderador quiero que me avisen de casos graves | `wf-03`: score ≥ 0.95 o 3+ flags/24 h → email/Telegram + alerta | UC-18 | n8n, insights | 3 | R3 |
| HU-62 | Como administrador quiero un resumen semanal generativo y alertas críticas | `wf-04` lunes 08:00 La Paz; `wf-05` CRITICAL → Telegram/email | UC-23, UC-20 | n8n, insights | 4 | R3 |

## E17 — Landing

| ID | Historia | Criterios de aceptación | UC | Componente | Pts | Rel. |
|---|---|---|---|---|---|---|
| HU-63 | Como visitante quiero conocer Bandada U y ver eventos destacados | Static export; eventos públicos; WCAG AA; SEO por idioma | UC-01 | landing | 5 | R4 |
| HU-64 | Como visitante quiero entrar a la app o al panel desde la landing | "Entrar" → app; "Panel" → admin; enlaces de descarga | UC-01, UC-03 | landing | 3 | R4 |

## E18 — Experiencia: temas e i18n

| ID | Historia | Criterios de aceptación | UC | Componente | Pts | Rel. |
|---|---|---|---|---|---|---|
| HU-65 | Como equipo quiero tokens de diseño únicos con modo claro/oscuro | `@bandada/ui-tokens` DTCG + Style Dictionary → CSS/Tailwind/TS/SCSS; test de contraste AA en ambos modos (RNF-20) | UC-04 | bandadau-shared/packages/ui-tokens | 5 | R0 |
| HU-66 | Como equipo quiero i18n compartido es/en | `@bandada/i18n` con `common`, enums, errores por `code`, formatos `Intl`; `i18n:check` en CI (RNF-21) | UC-04 | bandadau-shared/packages/i18n | 5 | R0 |
| HU-67 | Como estudiante quiero elegir tema claro, oscuro o del sistema | Selector en Ajustes; aplica sin reiniciar y sin parpadeo; se guarda en el dispositivo y en la cuenta (`updateMyPreferences`) | UC-04 | mobile, identity | 5 | R1 |
| HU-68 | Como estudiante quiero usar la app en español o inglés | Selector de idioma; resolución cuenta → dispositivo → navegador → `es`; fechas/créditos por locale; `preferences-changed` publicado | UC-04 | mobile, identity | 5 | R1 |
| HU-69 | Como moderador/administrador quiero tema e idioma en el panel | Selector en el header del shell; MFEs reciben `theme` y `locale`; persistido en la cuenta | UC-04, UC-18 | admin-shell, MFEs | 3 | R3 |
| HU-70 | Como visitante quiero la landing en mi idioma y tema | Rutas `/es` y `/en`; selector es/en y tema en la navbar | UC-04 | landing | 3 | R4 |
