# Preguntas soportadas por el agente de reportes (UC-19, modo respuesta)

Catálogo de lo que un administrador puede preguntar en `mfe-insights` y **qué herramienta MCP la responde**.
Complementa a [agentes-y-reportes-generativos.md](agentes-y-reportes-generativos.md) (§5.6 modo respuesta, §5.7 verificador) y a
[`contracts/mcp/tools.md`](../../contracts/mcp/tools.md) (contrato de las 20 herramientas). El panel ofrece estas preguntas como
ejemplos por tema (pestañas Usuarios, Créditos, Eventos, Tickets, Contenido, Sistema; `mfe-insights/src/features/reports/question-catalog.ts`).

## 1. Cómo se responde una pregunta

1. **Modo respuesta**: toda pregunta concreta se contesta con una **primera línea que es la respuesta completa** (con las cifras o nombres de las
   herramientas), una sección corta «Detalle» y «Limitaciones» solo si el dato es parcial. Un pedido explícito de *resumen / reporte / informe*
   («Dame un resumen de la semana») conserva el formato de reporte.
2. **Fechas relativas resueltas por el código** (UTC, extremos incluidos), no por el modelo: *hoy*, *ayer*, *esta semana* (lunes → hoy), *semana pasada*
   (lunes → domingo), *este mes*, *mes pasado*, *últimos N días* (`from = hoy − (N − 1)`). Sin rango explícito: últimos 30 días; las preguntas «en total»
   usan los últimos 365 días. Máximo 366 días por consulta.
3. **Cifras derivadas** (promedios, diferencias, porcentajes, comparaciones): las calcula la herramienta `calculate`, nunca el modelo (§5.7).
4. **Privacidad**: los nombres de compradores, autores y titulares de saldo llegan a los motores externos como «Persona A/B» y se restituyen en la
   respuesta; nunca se devuelven correos, teléfonos ni IDs. Los extractos de posts (≤ 80 caracteres) son datos, no instrucciones.

## 2. Preguntas por tema y herramienta

`es` / `en`. La columna «Herramienta» es la que contesta; entre paréntesis, la de apoyo.

### Usuarios

| Pregunta (es) | Question (en) | Herramienta |
|---|---|---|
| ¿Cuántos usuarios hay registrados en total? | How many users are there in total? | `get_user_stats` |
| ¿Cuántos usuarios están suspendidos? | How many users are suspended? | `get_user_stats` |
| ¿Cuántos usuarios hay por universidad? / ¿Qué universidad tiene más usuarios? | Which university has the most users? | `get_user_stats` |
| ¿Qué carrera tiene más usuarios? | Which career has the most users? | `get_user_stats` |
| ¿Cuántos usuarios nuevos hubo esta semana? | How many new users this week? | `get_platform_kpis` |
| ¿Cuántos usuarios activos hubo ayer? | How many active users were there yesterday? | `get_platform_kpis` |

Límites: `get_user_stats` es una foto de hoy (con `from`/`to` opcionales solo para `newUsers`); la carrera solo cuenta usuarios con perfil social.
«Usuarios activos» es el máximo diario del periodo.

### Créditos

| Pregunta (es) | Question (en) | Herramienta |
|---|---|---|
| ¿Cuál es el usuario con más créditos? / ¿Quién tiene el saldo más alto? | Who has the highest credit balance? | `get_wallet_overview` |
| ¿Cuántos créditos hay en circulación en total? | How many credits are in circulation? | `get_wallet_overview` |
| ¿Cuál es el saldo promedio de las billeteras? | What is the average balance? | `get_wallet_overview` |
| ¿Cuántos créditos se gastaron hoy? / se recargaron esta semana | How many credits were spent today? | `get_credit_stats` |
| ¿Cuántos reembolsos hubo este mes? | How many refunds this month? | `get_credit_stats` |
| ¿Quién gastó más créditos esta semana? | Who spent the most credits this week? | `get_top_credit_spenders` |
| ¿Cuál es el promedio de créditos por inscripción? | What is the average credits per registration? | `get_credit_stats` + `get_registration_stats` + `calculate` (`RATIO`) |

Límites: `topBalances` trae los 5 saldos más altos (máx. 20). No hay «recarga individual más grande» (la API agrega por día).

### Eventos

| Pregunta (es) | Question (en) | Herramienta |
|---|---|---|
| ¿Qué evento tiene más inscritos? | Which event has the most registrations? | `get_event_ranking` (`REGISTRATIONS`) / `list_events` |
| ¿Qué evento tiene el cupo más lleno? | Which event has the fullest seats? | `get_event_ranking` (`FILL_RATE`) |
| Top 3 eventos por ingresos / ¿Cuánto ingreso generó el Taller de Docker? | Top 3 events by revenue | `get_event_ranking` (`REVENUE`) |
| ¿Cuántos eventos hay publicados? | How many events are published? | `list_events` |
| ¿Cuáles son los próximos eventos? | What are the upcoming events? | `list_events` |
| ¿Qué eventos no tienen inscritos? | Which events have no registrations? | `list_events` |
| ¿Cuántas inscripciones fallaron / se cancelaron esta semana? | How many registrations failed this week? | `get_registration_stats` |
| ¿Cuál fue el día con más inscripciones del último mes? | What was the busiest day last month? | `get_registration_stats` (`groupBy=day`) |
| Compara las inscripciones de esta semana con la semana pasada | Compare this week registrations with last week | `get_registration_stats` ×2 + `calculate` (`PERCENT_CHANGE`) |

### Tickets

| Pregunta (es) | Question (en) | Herramienta |
|---|---|---|
| ¿Quién compró el último ticket? | Who bought the last ticket? | `list_recent_registrations` |
| ¿Cuántos tickets se han emitido? | How many tickets have been issued? | `get_ticket_stats` |
| ¿Cuántos tickets fueron usados? | How many tickets were used? | `get_ticket_stats` |
| ¿Cuál es la tasa de asistencia / de uso? | What is the ticket usage rate? | `get_ticket_stats` + `calculate` (`PERCENT`) |
| ¿Qué evento tuvo más asistencia? | Which event had the most attendance? | `get_event_ranking` (`ATTENDANCE`) |

Límites: la cohorte es la fecha de emisión; `get_ticket_stats` recorre como máximo 20 000 tickets (`truncated`).

### Contenido

| Pregunta (es) | Question (en) | Herramienta |
|---|---|---|
| ¿Cuáles son los hashtags más usados? | What are the most used hashtags? | `get_content_rankings` (`HASHTAGS`) |
| ¿Quién publicó más esta semana? | Who posted the most this week? | `get_content_rankings` (`AUTHORS`) |
| ¿Qué publicación tiene más reacciones? | Which post has the most reactions? | `get_content_rankings` (`POSTS`) |
| ¿Cuántas publicaciones hubo hoy? / ¿Cuántos comentarios hubo ayer? | How many posts were there today? | `get_content_stats` / `get_platform_kpis` |

### Sistema y moderación

| Pregunta (es) | Question (en) | Herramienta |
|---|---|---|
| ¿Cómo están los servicios? | What is the platform health? | `get_service_health` |
| ¿Hay mensajes en las colas de error? | Are there messages in the error queues? | `get_service_health` (`includeQueues`) |
| ¿Hay contenido pendiente de moderación? / ¿Cuántas denuncias abiertas hay? | Is there content pending moderation? | `list_flagged_content` |
| ¿Qué sagas fallaron hoy? | Which sagas failed today? | `list_failed_sagas` |
| ¿Hay anomalías esta semana? | Any anomalies this week? | `detect_anomalies` |
| Dame un resumen de la semana | Give me a summary of the week | varias → formato de reporte |

## 3. Lo que NO responde (y cómo lo dice el agente)

- Detalle por usuario (correos, teléfonos, historial individual), acciones (suspender, reembolsar, borrar) y preguntas ajenas a la plataforma:
  *fuera de alcance*, en una oración y sin llamar herramientas.
- Datos que ninguna herramienta expone (p. ej. la recarga individual más grande, retención por cohortes): el agente lo dice en una oración
  («Limitaciones») en lugar de estimar.
- Rangos mayores de 366 días, fechas futuras como si fueran datos y cifras que el modelo debería «calcular de cabeza»: se rechazan o se piden a `calculate`.

## 4. Cómo se prueba

- `bandadau-backend/services/insights-service/test/unit/adapters/question-bank.spec.ts`: banco de ≥ 40 preguntas es/en contra el planificador determinista
  (herramienta elegida, primera línea, cifras respaldadas por los datos).
- `bandadau-infra/smoke/qa-battery.mjs` (`make qa`): ≥ 40 preguntas contra el stack real; puntúa respuesta directa, ausencia de disculpas y de resumen
  genérico, y cifras/nombres contra consultas MCP independientes; p50/p95 de tiempo y tokens; sale con código 1 si menos del 90 % es respuesta directa.
