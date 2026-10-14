# Requisitos funcionales

Formato: "El sistema debe …". Cada RF se traza a ≥1 caso de uso (`../03-casos-de-uso/00-catalogo.md`).

| ID | Requisito | Prioridad | UC |
|---|---|---|---|
| RF-01 | El sistema debe permitir registrarse solo con un correo cuyo dominio pertenezca a una universidad habilitada (`University.allowedDomains`). | Must | UC-01 |
| RF-02 | El sistema debe verificar el correo con un código de 6 dígitos (válido 15 min, máx. 5 intentos) antes de activar la cuenta. | Must | UC-01 |
| RF-03 | El sistema debe autenticar con correo y contraseña, emitir un access token (15 min) y un refresh token rotativo (30 días), y permitir cerrar sesión revocando el refresh. | Must | UC-02 |
| RF-04 | El sistema debe permitir que un usuario con rol `MODERATOR` o `ADMIN` abra el panel desde la app (y viceversa) sin volver a ingresar credenciales, mediante un código de traspaso de un solo uso válido 60 s. | Must | UC-03 |
| RF-05 | El sistema debe permitir editar el perfil académico: nombre visible, avatar, universidad (solo lectura), carrera, semestre, bio (≤280), intereses (≤10). | Must | UC-04 |
| RF-06 | El sistema debe permitir publicar un post con texto (≤2 000 caracteres), hasta 4 imágenes **o** 1 video (≤60 s, ≤50 MB), hashtags y visibilidad (`PUBLIC`, `FOLLOWERS`, `GROUP`). | Must | UC-05 |
| RF-07 | El sistema debe analizar cada imagen y video con un modelo de deep learning de moderación y ocultar el contenido marcado hasta su revisión. | Must | UC-05, UC-18 |
| RF-08 | El sistema debe permitir crear publicaciones sin conexión, encolarlas en el dispositivo y sincronizarlas al recuperar la red **sin duplicarlas**. | Must | UC-05 |
| RF-09 | El sistema debe mostrar un feed paginado por cursor que combine seguidos, grupos y recomendados por un modelo de ML, disponible offline con la última versión cacheada. | Must | UC-06 |
| RF-10 | El sistema debe permitir comentar (≤500) y reaccionar (una reacción por usuario y post, cambiable) y notificar al autor. | Must | UC-07 |
| RF-11 | El sistema debe permitir seguir/dejar de seguir y sugerir personas por carrera, grupos y grafo en común. | Should | UC-08 |
| RF-12 | El sistema debe permitir crear grupos de estudio públicos o privados, solicitar/aceptar ingreso y publicar dentro del grupo. | Must | UC-09 |
| RF-13 | El sistema debe permitir denunciar un post o comentario con un motivo; 3 denuncias distintas lo ocultan automáticamente hasta revisión. | Should | UC-10 |
| RF-14 | El sistema debe permitir a un organizador publicar eventos con título, descripción, portada, fecha/hora, lugar, cupo y precio en créditos (0 = gratuito). | Must | UC-11 |
| RF-15 | El sistema debe inscribir a un estudiante en un evento reservando cupo, debitando créditos y emitiendo un ticket de forma atómica a nivel de negocio (todo o nada) mediante una SAGA. | Must | UC-12 |
| RF-16 | El sistema debe garantizar que un estudiante tenga como máximo una inscripción activa por evento, aun ante reintentos o doble clic. | Must | UC-12 |
| RF-17 | El sistema debe permitir cancelar una inscripción hasta 24 h antes del evento, anulando el ticket, reembolsando los créditos y liberando el cupo. | Must | UC-13 |
| RF-18 | El sistema debe validar un ticket escaneando su QR firmado y marcarlo como usado una sola vez. | Must | UC-14 |
| RF-19 | El sistema debe permitir recargar créditos (paquetes 20/50/100) mediante una pasarela simulada, acreditando una sola vez por pago aunque el callback llegue repetido. | Must | UC-15 |
| RF-20 | El sistema debe mostrar el saldo y el historial de movimientos paginado. | Must | UC-16 |
| RF-21 | El sistema debe ofrecer un asistente de estudio que resuma textos y genere flashcards usando un modelo que corre en el dispositivo, sin conexión. | Must | UC-17 |
| RF-22 | El sistema debe ofrecer a los moderadores una cola de contenido marcado (por IA o denuncias) con vista previa, puntajes y acciones aprobar/rechazar/suspender autor. | Must | UC-18 |
| RF-23 | El sistema debe generar reportes a partir de una pregunta en lenguaje natural, con texto, datos tabulares/gráfico y audio narrado. | Must | UC-19 |
| RF-24 | El sistema debe ejecutar un agente de monitoreo cada 5 min que detecte anomalías (servicios caídos, SAGAs fallidas, DLQ, backlog de moderación, picos anómalos) y genere alertas en vivo. | Must | UC-20 |
| RF-25 | El sistema debe permitir a un administrador buscar usuarios, cambiar roles, suspender/reactivar cuentas y gestionar universidades. | Must | UC-21 |
| RF-26 | El sistema debe exponer sus herramientas de consulta mediante el protocolo MCP a clientes externos autenticados con rol `ADMIN`. | Must | UC-22 |
| RF-27 | El sistema debe enviar recordatorios 24 h antes de cada evento inscrito y un resumen semanal generativo al equipo administrador. | Must | UC-23 |
| RF-28 | El sistema debe enviar notificaciones push e in-app, respetando las preferencias del usuario y marcándolas como leídas. | Must | UC-24 |
| RF-29 | El sistema debe ofrecer modo claro y oscuro en app, panel y landing, con preferencia `SYSTEM`/`LIGHT`/`DARK` que se sincroniza con la cuenta del usuario. | Must | UC-04 |
| RF-30 | El sistema debe mostrar toda la interfaz, notificaciones, correos y reportes en español (principal) o inglés según la preferencia del usuario o, en su defecto, el idioma del dispositivo. | Must | UC-04, UC-19, UC-24 |
