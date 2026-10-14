# Índice de documentación — Bandada U

Mapa de toda la documentación de Bandada U (repo `bandadau-docs`; workspace multi-repo, ADR-0017). **Normativo** = manda sobre los demás documentos; si
algo lo contradice, se corrige el otro documento o se escribe un ADR.

## Orden de lectura recomendado

| Perfil | Leer en este orden |
|---|---|
| Agente de IA (cualquier tarea) | `AGENTS.md` del workspace → `03-arquitectura/catalogo-servicios.md` → `03-arquitectura/decisiones-clave.md` → AGENTS.md del componente → UC asignado → contrato → `06-plan/registro-de-sesiones.md` |
| Integrante nuevo del equipo | `01-vision/vision-y-alcance.md` → `01-vision/cumplimiento-catedra.md` → `03-arquitectura/arquitectura-general.md` → `02-iconix/00-metodologia-iconix.md` → `06-plan/roadmap-y-sprints.md` |
| Docente / revisión | `01-vision/cumplimiento-catedra.md` (incluye guion de demo) → `02-iconix/03-casos-de-uso/00-catalogo.md` → `02-iconix/07-trazabilidad.md` |

## 01 · Visión

| Documento | Contenido |
|---|---|
| [vision-y-alcance.md](01-vision/vision-y-alcance.md) | Problema, visión, personas, objetivos, alcance MoSCoW (E1–E18), releases R0–R4 |
| [cumplimiento-catedra.md](01-vision/cumplimiento-catedra.md) | Matriz T1–T13 y C1–C5 → componente, UC y documento; extras del equipo; guion de la defensa |
| [marca-y-dominio.md](01-vision/marca-y-dominio.md) | Nombre "Bandada U", slug `bandada`, subdominios, identidad visual |
| [glosario.md](01-vision/glosario.md) | Lenguaje ubicuo español → identificador en código |

## 02 · ICONIX

| Documento | Fase | Contenido |
|---|---|---|
| [00-metodologia-iconix.md](02-iconix/00-metodologia-iconix.md) | — | Fases, hitos, reglas de robustez, **plantilla de UC**, cómo trabaja un agente |
| [requisitos-funcionales.md](02-iconix/01-requisitos/requisitos-funcionales.md) | 1 | RF-01…RF-30 |
| [requisitos-no-funcionales.md](02-iconix/01-requisitos/requisitos-no-funcionales.md) | 1 | RNF-01…RNF-21 |
| [02-modelo-dominio.md](02-iconix/02-modelo-dominio.md) **(normativo)** | 1–2 | Entidades por contexto, enums, invariantes, ampliaciones ADR-0016 |
| [03-casos-de-uso/00-catalogo.md](02-iconix/03-casos-de-uso/00-catalogo.md) | 1 | Actores, diagrama general, tabla maestra de los 24 UC |
| [UC-01 … UC-24](02-iconix/03-casos-de-uso/) | 1–3 | Narrativa, robustez, secuencia, clases, pruebas de aceptación, trazabilidad |
| [05-prototipos-gui.md](02-iconix/05-prototipos-gui.md) | 1 | Wireframes de app, panel y landing → UC y boundaries |
| [06-modelo-estatico/](02-iconix/06-modelo-estatico/00-indice.md) | 3 | Diagramas de clases y modelo persistente por bounded context |
| [07-trazabilidad.md](02-iconix/07-trazabilidad.md) | 1–4 | RF → UC → operaciones/eventos → componentes → pruebas |
| [08-revisiones.md](02-iconix/08-revisiones.md) | hitos | Checklists RR / PDR / CDR / DR y su estado |

### Casos de uso

| Paquete | UC |
|---|---|
| Identidad | [UC-01 Registrarse](02-iconix/03-casos-de-uso/UC-01-registrarse.md) · [UC-02 Iniciar sesión](02-iconix/03-casos-de-uso/UC-02-iniciar-sesion.md) · [UC-03 Acceso único al panel](02-iconix/03-casos-de-uso/UC-03-acceso-unico-panel.md) |
| Social | [UC-04 Perfil y preferencias](02-iconix/03-casos-de-uso/UC-04-gestionar-perfil.md) · [UC-05 Publicar contenido](02-iconix/03-casos-de-uso/UC-05-publicar-contenido.md) · [UC-06 Ver feed](02-iconix/03-casos-de-uso/UC-06-ver-feed.md) · [UC-07 Comentar y reaccionar](02-iconix/03-casos-de-uso/UC-07-comentar-reaccionar.md) · [UC-08 Seguir estudiantes](02-iconix/03-casos-de-uso/UC-08-seguir-estudiantes.md) · [UC-09 Grupos de estudio](02-iconix/03-casos-de-uso/UC-09-grupos-estudio.md) · [UC-10 Denunciar contenido](02-iconix/03-casos-de-uso/UC-10-denunciar-contenido.md) |
| Eventos | [UC-11 Publicar evento](02-iconix/03-casos-de-uso/UC-11-publicar-evento.md) · [UC-12 Inscribirse (SAGA)](02-iconix/03-casos-de-uso/UC-12-inscribirse-evento.md) · [UC-13 Cancelar inscripción](02-iconix/03-casos-de-uso/UC-13-cancelar-inscripcion.md) · [UC-14 Validar entrada](02-iconix/03-casos-de-uso/UC-14-validar-entrada.md) |
| Billetera | [UC-15 Recargar créditos](02-iconix/03-casos-de-uso/UC-15-recargar-creditos.md) · [UC-16 Consultar movimientos](02-iconix/03-casos-de-uso/UC-16-consultar-movimientos.md) |
| IA local | [UC-17 Asistente offline](02-iconix/03-casos-de-uso/UC-17-asistente-offline.md) |
| Admin | [UC-18 Moderar contenido](02-iconix/03-casos-de-uso/UC-18-moderar-contenido.md) · [UC-19 Reporte generativo](02-iconix/03-casos-de-uso/UC-19-reporte-generativo.md) · [UC-20 Monitorear plataforma](02-iconix/03-casos-de-uso/UC-20-monitorear-plataforma.md) · [UC-21 Gestionar usuarios](02-iconix/03-casos-de-uso/UC-21-gestionar-usuarios.md) · [UC-22 Consulta MCP externa](02-iconix/03-casos-de-uso/UC-22-consulta-mcp-externa.md) |
| Automatización | [UC-23 Recordatorios n8n](02-iconix/03-casos-de-uso/UC-23-recordatorios-n8n.md) · [UC-24 Notificaciones](02-iconix/03-casos-de-uso/UC-24-recibir-notificaciones.md) |

## 03 · Arquitectura

| Documento | Contenido |
|---|---|
| [catalogo-servicios.md](03-arquitectura/catalogo-servicios.md) **(normativo, fuente de verdad)** | Servicios, lenguajes, bases, arquitecturas, puertos, rutas, colas, tablas, roles |
| [decisiones-clave.md](03-arquitectura/decisiones-clave.md) **(normativo)** | D1–D15: endpoints, SAGA, idempotencia, SSO, MFE, IA local, ML, agentes, MCP, n8n, GraphQL, eventos, tokens, i18n, consolidación |
| [arquitectura-general.md](03-arquitectura/arquitectura-general.md) | C4 contexto/contenedores, mapa de contextos DDD, estilos de comunicación, repositorios del workspace (ADR-0017) |
| [saga-inscripcion-evento.md](03-arquitectura/saga-inscripcion-evento.md) | SAGA orquestada, estados, DDL, compensaciones, timeouts |
| [idempotencia.md](03-arquitectura/idempotencia.md) | Los 5 mecanismos por lenguaje y motor |
| [eventos-y-mensajeria.md](03-arquitectura/eventos-y-mensajeria.md) | RabbitMQ, CloudEvents, outbox/inbox, reintentos, DLQ |
| [seguridad-y-sso.md](03-arquitectura/seguridad-y-sso.md) | JWT/JWKS, refresh, tokens de servicio, handoff SSO, OWASP |
| [graphql-admin.md](03-arquitectura/graphql-admin.md) | admin-gateway: schema-first, DataLoader, @auth, subscriptions |
| [microfrontends.md](03-arquitectura/microfrontends.md) | Web Components en runtime, manifiesto, contrato shell ↔ MFE |
| [ia-local-y-offline.md](03-arquitectura/ia-local-y-offline.md) | Offline-first, cola offline, LocalLlm, PWA |
| [ml-dl.md](03-arquitectura/ml-dl.md) | Modelos DL/ML, pipeline de media, MLOps |
| [agentes-y-reportes-generativos.md](03-arquitectura/agentes-y-reportes-generativos.md) | MonitoringAgent, ReportAgent, prompts, TTS |
| [mcp.md](03-arquitectura/mcp.md) | Servidor MCP, auth, herramientas, clientes |
| [automatizacion-n8n.md](03-arquitectura/automatizacion-n8n.md) | Router + workflows wf-01…wf-06 |
| [observabilidad.md](03-arquitectura/observabilidad.md) | OpenTelemetry, métricas, dashboards, alertas |
| [adr/](03-arquitectura/adr/README.md) | ADR-0001…ADR-0017 (ADR-0001 reemplazada por ADR-0017) |

## 04 · Patrones y reglas

| Documento | Aplica a |
|---|---|
| [convenciones-generales.md](04-patrones-y-reglas/convenciones-generales.md) | Todo (idioma, nombres, git, versionado, contract-first) |
| [arquitectura-hexagonal.md](04-patrones-y-reglas/arquitectura-hexagonal.md) | identity-service, wallet-service |
| [clean-architecture.md](04-patrones-y-reglas/clean-architecture.md) | social, media, ticketing, insights, notification |
| [ddd.md](04-patrones-y-reglas/ddd.md) | events-service |
| [api-rest-guidelines.md](04-patrones-y-reglas/api-rest-guidelines.md) | Todos los servicios REST |
| [frontend-guidelines.md](04-patrones-y-reglas/frontend-guidelines.md) | landing, admin-shell, MFEs, mobile |
| [design-tokens-y-temas.md](04-patrones-y-reglas/design-tokens-y-temas.md) | Toda UI (modo claro/oscuro) |
| [i18n.md](04-patrones-y-reglas/i18n.md) | Toda UI y contenido generado (es/en) |
| [testing-strategy.md](04-patrones-y-reglas/testing-strategy.md) | Todo |
| [definition-of-done.md](04-patrones-y-reglas/definition-of-done.md) | Todo PR |

## 05 · Infraestructura

[infraestructura.md](05-infraestructura/infraestructura.md) (local con Compose + Traefik, AWS, CI/CD) ·
[entornos-y-variables.md](05-infraestructura/entornos-y-variables.md) (variables por componente, secretos).

## 06 · Plan

[roadmap-y-sprints.md](06-plan/roadmap-y-sprints.md) · [backlog.md](06-plan/backlog.md) ·
[guia-para-agentes.md](06-plan/guia-para-agentes.md) (prompts plantilla) ·
[registro-de-sesiones.md](06-plan/registro-de-sesiones.md) (handoff entre sesiones).

## Fuera de `bandadau-docs/docs/` (workspace de 8 repos, ADR-0017 + kit de marca)

| Ruta (relativa al workspace) | Contenido |
|---|---|
| [`AGENTS.md`](../../AGENTS.md) del workspace | Guía común para agentes |
| [`bandadau-brand/`](../../bandadau-brand/README.md) | Kit de marca: SVG, iconos de app (`app-icons/`), `react-native/BandadaLogo.tsx` y la paleta (`marca-y-dominio.md`) |
| [`bandadau-docs/contracts/`](../contracts/README.md) | OpenAPI (8 servicios + shared), AsyncAPI, GraphQL SDL, herramientas MCP |
| [`bandadau-shared/AGENTS.md`](../../bandadau-shared/AGENTS.md) | Librerías `@bandada/*` en `packages/` (incl. ui-tokens e i18n) |
| [`bandadau-backend/AGENTS.md`](../../bandadau-backend/AGENTS.md) · `bandadau-backend/services/<servicio>/AGENTS.md` | Reglas del repo y por servicio (9) |
| [`bandadau-frontend/AGENTS.md`](../../bandadau-frontend/AGENTS.md) | App Expo (iOS, Android, Web PWA) |
| [`bandadau-admin/AGENTS.md`](../../bandadau-admin/AGENTS.md) · `bandadau-admin/{shell,mfe-moderation,mfe-insights}/AGENTS.md` | Panel: shell + 2 microfrontends |
| [`bandadau-landing/AGENTS.md`](../../bandadau-landing/AGENTS.md) | Landing |
| [`bandadau-infra/AGENTS.md`](../../bandadau-infra/AGENTS.md) · [`bandadau-infra/n8n/AGENTS.md`](../../bandadau-infra/n8n/AGENTS.md) | Infraestructura y workflows n8n |
| [`bandadau-ml/AGENTS.md`](../../bandadau-ml/AGENTS.md) | Notebooks y export ONNX |
