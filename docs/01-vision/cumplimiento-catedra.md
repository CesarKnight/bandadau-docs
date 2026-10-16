# Matriz de cumplimiento de la cátedra

Cada requisito tecnológico y cada condición del enunciado se mapea a **dónde** se
cumple, **qué caso de uso** lo demuestra en la defensa y **qué documento** lo detalla.
Esta matriz se revisa en cada hito ICONIX; ningún ítem puede quedar sin caso de uso.

## Tecnologías y criterios obligatorios

| # | Requisito | Cómo se cumple en Bandada U | Componentes | Caso(s) de uso | Documento |
|---|---|---|---|---|---|
| T1 | Microservicios (apps transversales) | 8 servicios de dominio + 1 BFF, cada uno con su base, desplegable y repo-carpeta independiente; comunicación por REST + RabbitMQ | S1–S9 | Todos | `03-arquitectura/arquitectura-general.md`, `catalogo-servicios.md` |
| T2 | Microfrontends | Panel = shell Next.js + 2 MFEs de distinto framework (Angular, React) compuestos en runtime como **Web Components** desde un manifiesto | F2, F3, F4 | UC-18, UC-19, UC-20 | `03-arquitectura/microfrontends.md` |
| T3 | GraphQL (sistema empresarial / panel) | `admin-gateway` (Apollo) agrega los servicios; queries, mutations y subscriptions (`graphql-ws`) | S9, F2–F4 | UC-18, UC-21 | `03-arquitectura/graphql-admin.md`, `bandadau-docs/contracts/graphql/admin.graphql` |
| T4 | API REST | Todos los servicios exponen REST versionado `/api/v1` documentado en **OpenAPI 3.1** (contract-first) | S1–S8 | UC-01…UC-17 | `04-patrones-y-reglas/api-rest-guidelines.md`, `bandadau-docs/contracts/openapi/` |
| T5 | Agentes inteligentes (panel) | `insights-service`: **agente de monitoreo** (salud, SAGAs fallidas, DLQ, backlog de moderación → alertas) y **agente de reportes** (consulta vía herramientas MCP) | S8, F4 | UC-19, UC-20 | `03-arquitectura/agentes-y-reportes-generativos.md` |
| T6 | IA local (móvil y frontend, offline) | Asistente de estudio con LLM pequeño **on-device** (react-native-executorch en nativo, WebLLM/transformers.js en web) + clasificador de imágenes on-device antes de subir | F5 | UC-17, UC-05 | `03-arquitectura/ia-local-y-offline.md` |
| T7 | PWA | Export web de Expo con `manifest.webmanifest`, service worker (Workbox), instalación, caché offline, cola de sincronización | F5 (web) | UC-05, UC-06, UC-17 | `03-arquitectura/ia-local-y-offline.md` |
| T8 | Idempotencia | `Idempotency-Key` HTTP + tabla DynamoDB con escritura condicional, inbox de consumidores, restricciones únicas, IDs generados en cliente, ledger con `operationRef` único | Todos | UC-05, UC-12, UC-15 | `03-arquitectura/idempotencia.md` |
| T9 | ML y Deep Learning (imágenes/video) | **DL**: clasificador NSFW/violencia (CNN/ViT ONNX) sobre imágenes y frames de video, auto-etiquetado zero-shot (CLIP), OCR de apuntes. **ML clásico**: recomendación del feed/sugerencias (filtrado colaborativo + regresión logística) y detección de anomalías (Isolation Forest) para el agente de monitoreo | S3, S2, S8, `bandadau-ml/` | UC-05, UC-06, UC-08, UC-18, UC-20 | `03-arquitectura/ml-dl.md` |
| T10 | Automatización (n8n) | 6 workflows + un router (`wf-00`) versionados en `bandadau-infra/n8n/workflows/*.json`, disparados por RabbitMQ y cron | n8n | UC-23, UC-18, UC-20 | `03-arquitectura/automatizacion-n8n.md` |
| T11 | Reportes generativos (audio, texto) | LLM redacta el reporte a partir de datos reales (herramientas MCP) → Markdown + gráfico + **audio TTS** (Amazon Polly / Piper local) | S8, F4 | UC-19 | `03-arquitectura/agentes-y-reportes-generativos.md` |
| T12 | Protocolo MCP | `insights-service` expone **servidor MCP** (Streamable HTTP, `/mcp`) con herramientas tipadas; lo consumen los agentes internos (cliente MCP) y clientes externos (Claude Desktop / Claude Code) autenticados | S8 | UC-19, UC-22 | `03-arquitectura/mcp.md`, `bandadau-docs/contracts/mcp/tools.md` |
| T13 | Acceso por una sola entrada | Identidad única (SSO) + **handoff code** de un solo uso (60 s) para saltar app → panel sin re-login; deep/universal links panel/landing → app | S1, F2, F5, F1 | UC-03 | `03-arquitectura/seguridad-y-sso.md` |

## Condiciones

| # | Condición | Cumplimiento | Evidencia |
|---|---|---|---|
| C1 | 3 microservicios en una acción + SAGA con rollback | Inscripción pagada: `events-service` (reserva cupo) → `wallet-service` (débito) → `ticketing-service` (emite ticket). SAGA **orquestada** con compensaciones (anular ticket → reembolsar → liberar cupo) y timeouts | `saga-inscripcion-evento.md`, UC-12, UC-13 |
| C2 | 3 lenguajes (Spring Boot, NestJS, PHP) | Spring Boot: identity, events · NestJS: social, media, ticketing, insights, admin-gateway · PHP/Laravel: wallet, notification | `catalogo-servicios.md` §1 |
| C3 | Frontend web Angular y React (Next.js) | Next.js: landing + admin-shell · Angular: mfe-moderation · React (Vite): mfe-insights · React Native Web (Expo): app web | `catalogo-servicios.md` §2 |
| C4 | 3 bases: Postgres, MongoDB, DynamoDB (AWS) | Postgres: identity, events, wallet · Mongo: social, media · DynamoDB: ticketing, notification, insights, idempotencia | `catalogo-servicios.md` §1 y §6 |
| C5 | ≥3 arquitecturas de código (Hexagonal, Clean, DDD) | Hexagonal: identity, wallet · Clean: social, media, ticketing, notification, insights · DDD: events | `04-patrones-y-reglas/` |

## Guion de demostración (defensa)

1. Landing → "Entrar" → app web PWA; registro con correo institucional (Mailpit) — **T4, T7**.
2. En el celular (modo avión): crear post con foto → IA local valida la imagen → queda en cola → al volver la red se sincroniza **una sola vez** — **T6, T7, T8**.
3. La foto pasa por el modelo DL en `media-service`; una imagen de prueba "no apta" queda marcada — **T9**; n8n avisa a moderación — **T10**.
4. Recargar créditos (doble clic en "pagar": un solo cargo) — **T8**.
5. Inscribirse a un evento pagado → ticket QR — **C1**. Forzar fallo en ticketing (`CHAOS_TICKETING_FAIL=true`) → rollback visible: reembolso + cupo liberado.
6. Desde la app (rol ADMIN) → "Abrir panel" → entra sin login — **T13**.
7. Panel: MFE Moderación (Angular) aprueba/rechaza vía GraphQL — **T2, T3**.
8. MFE Insights: "Inscripciones del último mes" → reporte texto + audio — **T5, T11**.
9. Claude Desktop conectado al servidor MCP de Bandada U responde la misma pregunta — **T12**.
10. Agente de monitoreo detecta la SAGA fallida del paso 5 y levanta una alerta en vivo (subscription) — **T5, T3**.

## Requisitos adicionales del equipo (no exigidos por la cátedra)

| # | Requisito | Cumplimiento | Documento |
|---|---|---|---|
| X1 | React Native + Expo SDK 57 con versión web | `bandadau-frontend` (iOS, Android, Web PWA) | `catalogo-servicios.md` §2 |
| X2 | Tokens de diseño con modo claro y oscuro en toda la UI | `@bandada/ui-tokens` (DTCG + Style Dictionary), 3 niveles, contraste AA verificado | `04-patrones-y-reglas/design-tokens-y-temas.md` |
| X3 | i18n español (principal) + inglés | ICU MessageFormat, `@bandada/i18n`, i18next / Transloco, backend por `Accept-Language` | `04-patrones-y-reglas/i18n.md` |
| X4 | Dictado por voz en los reportes del panel | El administrador **habla** la pregunta: botón de micrófono en la caja de pregunta de `mfe-insights` (Web Speech API del navegador, sin servidor ni dependencias; texto provisional en vivo, cuenta regresiva de 2 s con «Cancelar»/«Editar» y envío automático por el mismo `requestReport`). Componentes: `mfe-insights` (`useSpeechDictation`, `DictationButton`). Caso de uso: UC-19 (flujo alterno 2c). Límites y alternativa futura en `agentes-y-reportes-generativos.md` §5.5 | `agentes-y-reportes-generativos.md` §5.5, `02-iconix/03-casos-de-uso/UC-19-reporte-generativo.md` |
