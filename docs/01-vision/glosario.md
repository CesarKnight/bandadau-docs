# Glosario

Términos del dominio (lenguaje ubicuo) con su identificador en código. Las clases,
tablas, colecciones y enums **deben** usar la columna "Código".

| Término (es) | Código (en) | Contexto | Definición |
|---|---|---|---|
| Estudiante | `User` (rol `STUDENT`) | Identidad | Persona con correo institucional verificado |
| Universidad | `University` | Identidad | Institución con dominios de correo permitidos (`allowedDomains`) |
| Credencial | `Credential` | Identidad | Hash de contraseña (Argon2id) asociado a un usuario |
| Token de refresco | `RefreshToken` | Identidad | Token opaco rotativo, se guarda hasheado |
| Código de traspaso | `HandoffCode` | Identidad | Código de un solo uso (60 s) para saltar de una app a otra sin re-login |
| Perfil | `Profile` | Social | Datos académicos y públicos: carrera, semestre, bio, intereses, avatar |
| Publicación | `Post` | Social | Contenido con texto y medios; puede pertenecer a un grupo |
| Comentario | `Comment` | Social | Respuesta a una publicación |
| Reacción | `Reaction` | Social | `LIKE`, `HELPFUL`, `FUNNY`, `SUPPORT` |
| Seguimiento | `Follow` | Social | Relación dirigida seguidor → seguido |
| Grupo de estudio | `Group` | Social | Comunidad por materia/tema; `PUBLIC` o `PRIVATE` |
| Membresía | `GroupMembership` | Social | Rol en el grupo: `OWNER`, `ADMIN`, `MEMBER` |
| Denuncia | `ContentReport` | Social | Reporte de un usuario sobre un post/comentario |
| Feed | `FeedItem` | Social | Ítem ordenado y puntuado para la línea de tiempo |
| Recurso multimedia | `MediaAsset` | Media | Imagen o video subido; ciclo `PENDING_UPLOAD → PROCESSING → APPROVED / FLAGGED / REJECTED` |
| Resultado de moderación | `ModerationResult` | Media | Etiquetas y puntajes del modelo, `modelVersion` |
| Evento | `Event` | Eventos | Actividad con fecha, lugar, cupo (`capacity`) y precio en créditos |
| Inscripción | `Registration` | Eventos | Solicitud de un estudiante a un evento; `PENDING → CONFIRMED / FAILED / CANCELLED` |
| Instancia de SAGA | `SagaInstance` | Eventos | Estado persistido de la orquestación de una inscripción |
| Billetera | `Wallet` | Billetera | Saldo de créditos de un usuario |
| Movimiento | `LedgerEntry` | Billetera | Asiento inmutable (`TOPUP`, `DEBIT`, `REFUND`) con `operationRef` único |
| Recarga | `TopUp` | Billetera | Compra de créditos vía pasarela simulada |
| Crédito | `credits` (entero) | Billetera | Unidad de valor interna. 1 crédito = 1 Bs (referencial) |
| Entrada / ticket | `Ticket` | Entradas | Comprobante con QR firmado; `ISSUED → USED / VOIDED` |
| Notificación | `Notification` | Notificaciones | Mensaje in-app/push/email a un usuario |
| Dispositivo | `DeviceToken` | Notificaciones | Token Expo Push de un dispositivo |
| Reporte generativo | `GeneratedReport` | Insights | Texto + datos + audio generados por el agente de reportes |
| Ejecución de agente | `AgentRun` | Insights | Traza de una corrida de un agente (pasos, herramientas, costo) |
| Alerta | `Alert` | Insights | Hallazgo del agente de monitoreo con severidad |
| Herramienta MCP | `McpTool` | Insights | Función expuesta por el servidor MCP |
| Clave de idempotencia | `Idempotency-Key` | Transversal | UUID que el cliente envía para que reintentos no dupliquen efectos |
| Bandeja de salida | `outbox` | Transversal | Tabla/colección donde se guardan eventos en la misma transacción que el cambio |
| Bandeja de entrada | `inbox` / `processed_messages` | Transversal | Registro de mensajes ya procesados por un consumidor |
| Cola offline | `OfflineMutation` | App | Mutación guardada en el dispositivo hasta tener red |
| Microfrontend | MFE | Panel | Módulo de UI desplegable por separado, cargado por el shell |
| Idioma | `Locale` (`es`, `en`) | Transversal | Idioma de la interfaz y del contenido generado por el sistema |
| Preferencia de tema | `ThemePreference` (`SYSTEM`, `LIGHT`, `DARK`) | Transversal | Modo visual elegido por el usuario |
| Token de diseño | design token | UI | Decisión de diseño con nombre (color, espacio, tipografía, radio, sombra) consumida por todas las UIs |
| Clave de traducción | i18n key | UI | Identificador estable de un texto (`events.registration.confirmed`) con su mensaje ICU por idioma |
