# Visión y alcance — Bandada U

**Materia:** Ingeniería de Software II · **Grupo:** 24 · **Tema:** Red social para estudiantes
**Metodología:** ICONIX · **Estado:** Requisitos (v0.1, 2026-10-14)

## 1. Problema

La vida universitaria está fragmentada: los avisos de la carrera viven en grupos de
WhatsApp, los eventos en Instagram de cada centro de estudiantes, los apuntes en
Drives sueltos y la inscripción a talleres en formularios de Google con pagos por QR
que alguien concilia a mano. No hay un lugar **verificado** (solo estudiantes reales),
**académico** (organizado por carrera, materia y grupo de estudio) y que funcione con
la **mala conectividad** del campus.

## 2. Visión

> **Bandada U** es la red social de tu universidad: conectás con estudiantes verificados de
> tu carrera, compartís apuntes y publicaciones, armás grupos de estudio y te
> inscribís a eventos y talleres pagando con créditos — incluso sin conexión, con un
> asistente de estudio con IA que corre en tu propio teléfono.

Para la administración, Bandada U ofrece un **panel empresarial** con moderación asistida
por IA, agentes que monitorean la plataforma y reportes generativos en texto y audio
("¿cuántas inscripciones hubo el último mes?").

## 3. Personas

| Persona | Descripción | Objetivo principal |
|---|---|---|
| **Lucía — estudiante** | 2.º año de Sistemas, usa el celular todo el día, datos limitados | Enterarse de lo que pasa en su carrera, conseguir apuntes, ir a talleres |
| **Marco — organizador** | Presidente del centro de estudiantes | Publicar eventos con cupo y cobrar la inscripción sin conciliar a mano |
| **Sofía — moderadora** | Ayudante de bienestar estudiantil | Revisar rápido el contenido reportado o marcado por la IA |
| **Raúl — administrador** | Responsable de la plataforma | Saber cómo va la plataforma, recibir alertas y reportes sin armar Excel |

## 4. Objetivos del producto (medibles en la demo)

1. Registro solo con correo institucional verificado (dominios permitidos por universidad).
2. Publicar texto/imagen/video y ver el feed **sin conexión** (cola offline que sincroniza sin duplicar).
3. Inscripción pagada a un evento atravesando **3 microservicios** con rollback automático.
4. Toda imagen/video publicado pasa por un **modelo de deep learning** de moderación.
5. El administrador pide un reporte en lenguaje natural y recibe **texto + audio**.
6. Un administrador salta de la app móvil al panel **sin volver a iniciar sesión**.

## 5. Alcance — MoSCoW

### Must (MVP para la defensa)

| Épica | Funcionalidad |
|---|---|
| E1 Identidad | Registro con correo institucional + verificación, login, refresh, roles, SSO handoff app→panel |
| E2 Perfil | Perfil académico (universidad, carrera, semestre, intereses, avatar) |
| E3 Publicaciones | Post con texto + hasta 4 imágenes **o** 1 video (≤60 s), hashtags, comentarios, reacciones |
| E4 Feed | Feed de seguidos + grupos + recomendados (ML), paginado por cursor, cacheado offline |
| E5 Grupos | Grupos de estudio por materia (públicos/privados), unirse, publicar dentro |
| E6 Moderación IA | Clasificación NSFW/violencia en imágenes y frames de video (ONNX), cola de revisión |
| E7 Eventos | Organizador publica evento con cupo y precio en créditos; estudiantes se inscriben (**SAGA**) y cancelan (compensación) |
| E8 Billetera | Recarga de créditos (pasarela simulada, idempotente), saldo, movimientos |
| E9 Entradas | Ticket con QR, validación en puerta |
| E10 Notificaciones | Push (Expo), in-app, email (Mailpit en dev) |
| E11 IA local | Asistente de estudio offline (resumen + flashcards) y pre-chequeo de imagen en el dispositivo |
| E12 PWA / offline | App web instalable, service worker, cola offline con idempotencia |
| E13 Panel admin | Shell + 2 microfrontends (Moderación en Angular, Insights en React) sobre **GraphQL** |
| E14 Agentes | Agente de monitoreo (alertas) y agente de reportes (texto + audio) |
| E15 MCP | Servidor MCP con herramientas de consulta para agentes internos y clientes externos |
| E16 Automatización | 6 workflows n8n (bienvenida, recordatorio de evento, escalamiento de moderación, reporte semanal, alerta crítica, difusión de eventos) |
| E17 Landing | Landing pública con eventos destacados y acceso a app/panel |
| E18 Experiencia | **Tokens de diseño** con modo claro/oscuro en todas las UIs y **i18n** español (principal) + inglés |

### Should

- Reportar contenido por usuarios; sugerencias "personas que quizás conozcas".
- OCR de fotos de apuntes para que sean buscables.
- Suscripción GraphQL en tiempo real para alertas en el panel.

### Could (v2)

- Mensajería directa (chat 1:1) — servicio `messaging-service` (NestJS + DynamoDB).
- Marketplace estudiantil (venta de libros/apuntes) reutilizando la SAGA.
- Transcripción de videos (Whisper) para búsqueda.

### Won't (fuera de alcance)

- Pagos con dinero real (la pasarela de recarga es **simulada**).
- Integración con sistemas académicos reales (notas, SIS).
- Videollamadas / streaming en vivo.
- Idiomas adicionales al español e inglés.

## 6. Supuestos y restricciones

- Equipo de estudiantes con tiempo limitado → **infra barata** (un host EC2 con
  Docker Compose + servicios gestionados con capa gratuita), igual que Homy.
- La app móvil requiere **development build** de Expo (no Expo Go) por los módulos
  nativos de IA local.
- Los modelos de ML se entrenan/exportan en Python (notebooks en `bandadau-ml/`) y se ejecutan en
  producción como **ONNX** desde NestJS; Python no es un servicio en ejecución.
- El LLM de los agentes es intercambiable (puerto `LlmPort`): Claude por API en demo,
  Ollama en desarrollo.

## 7. Releases

**Entrega y defensa: martes 10 de noviembre de 2026.**

| Release | Fechas | Contenido | Hito ICONIX |
|---|---|---|---|
| R0 — Fundaciones | 14 – 21 oct | 8 repos, infra local, contratos v1, identity, gateway | RR + PDR + CDR (15–17 oct) |
| R1 — Social | 19 – 25 oct | Perfil, posts, feed, grupos, media + moderación DL | DR parcial S2 |
| R2 — Eventos | 26 oct – 1 nov | Eventos, billetera, tickets, SAGA, notificaciones, deploy AWS | DR parcial S3 |
| R3 — Inteligencia | 2 – 8 nov | Panel + MFEs + GraphQL, agentes, reportes, MCP, n8n | — |
| R4 — Offline | 2 – 9 nov | PWA, IA local, cola offline, landing, ensayo de demo | DR final (9 nov) |

Detalle de sprints en `bandadau-docs/docs/06-plan/roadmap-y-sprints.md`.
