# Dónde va cada diagrama en el documento

Guía para quien arme el documento con los diagramas de Enterprise Architect. Para cada diagrama
indica **la figura y la sección del Word** (`Bandada-U-Documento-Entregable.docx`) donde aparece, o
dónde ponerlo si el documento no lo incluye. Se genera con `node entregable/ea/generar-ubicacion.mjs`
a partir del documento construido y del manifiesto de los scripts, así que sigue la numeración real.

Cómo usarla: ejecuta el script de EA, abre el diagrama con el **nombre exacto** de la columna «Diagrama en EA»,
expórtalo como imagen (clic derecho > *Save as Image* o `Ctrl+Shift+...` según versión) y sustituye o agrega la
figura en la sección indicada. Los nombres de paquete son los que crea el script en el *Project Browser*.

**Resumen:** 146 diagramas en EA; **65** aparecen en el documento (con figura y sección) y **81** no
están en el Word (columna «Sugerencia»). La numeración de figuras puede moverse si se agregan o quitan
figuras: vuelve a generar este archivo después de reconstruir el documento.

## 01 · Casos de uso y dominio

Script: `scripts/01-casos-de-uso-y-dominio.js` · paquete EA: «Bandada U - 01 Casos de uso y dominio» · 2 de 2 diagramas están en el documento.

| Diagrama en EA | Paquete | Figura | Sección del documento / Sugerencia |
|---|---|---|---|
| Diagrama general de casos de uso | Casos de uso | Figura 4 | 2.5. Diagrama UML de casos de uso |
| Modelo de dominio (vista global) | Modelo de dominio | Figura 5 | 3.1. Modelo de dominio (subsección: Vista global) |

## 02 · Modelo estático (clases de diseño)

Script: `scripts/02-modelo-estatico.js` · paquete EA: «Bandada U - 02 Modelo estatico» · 8 de 8 diagramas están en el documento.

| Diagrama en EA | Paquete | Figura | Sección del documento / Sugerencia |
|---|---|---|---|
| Clases de diseno - billetera | billetera | Figura 47 | 3.4.6. Billetera — `wallet-service` (Hexagonal) |
| Clases de diseno - entradas | entradas | Figura 48 | 3.4.7. Entradas — `ticketing-service` (Clean Architecture) |
| Clases de diseno - eventos | eventos | Figura 46 | 3.4.5. Eventos — `events-service` (DDD) |
| Clases de diseno - identidad | identidad | Figura 43 | 3.4.2. Identidad — `identity-service` (Hexagonal) |
| Clases de diseno - insights | insights | Figura 50 | 3.4.9. Insights — `insights-service` (Clean Architecture) |
| Clases de diseno - media | media | Figura 45 | 3.4.4. Multimedia — `media-service` (Clean Architecture) |
| Clases de diseno - notificaciones | notificaciones | Figura 49 | 3.4.8. Notificaciones — `notification-service` (Clean Architecture) |
| Clases de diseno - social | social | Figura 44 | 3.4.3. Social — `social-service` (Clean Architecture) |

## 03 · Diagramas de robustez

Script: `scripts/03-robustez.js` · paquete EA: «Bandada U - 03 Robustez» · 12 de 27 diagramas están en el documento.

| Diagrama en EA | Paquete | Figura | Sección del documento / Sugerencia |
|---|---|---|---|
| UC-01 Robustez - Registrarse con correo institucional | UC-01 registrarse | Figura 6 | 3.2.1 UC-01 — Registrarse con correo institucional |
| UC-02 Robustez - Iniciar sesión y renovar sesión | UC-02 iniciar sesion | — (no está en el Word) | Anexo opcional «Diagramas de los casos de uso de apoyo», o 3.2/3.3 si el docente pide los 24 UC |
| UC-03 Robustez - Acceder al panel desde la app sin re-login (y volver) | UC-03 acceso unico panel | — (no está en el Word) | Anexo opcional «Diagramas de los casos de uso de apoyo», o 3.2/3.3 si el docente pide los 24 UC |
| UC-04 Robustez - Gestionar perfil académico y preferencias | UC-04 gestionar perfil | — (no está en el Word) | Anexo opcional «Diagramas de los casos de uso de apoyo», o 3.2/3.3 si el docente pide los 24 UC |
| UC-05 Robustez - Publicar contenido (texto, imagen, video) | UC-05 publicar contenido | Figura 7 | 3.2.2 UC-05 — Publicar contenido (texto, imagen, video) |
| UC-06 Robustez - Ver feed personalizado | UC-06 ver feed | — (no está en el Word) | Anexo opcional «Diagramas de los casos de uso de apoyo», o 3.2/3.3 si el docente pide los 24 UC |
| UC-07 Robustez - Comentar y reaccionar a una publicación | UC-07 comentar reaccionar | — (no está en el Word) | Anexo opcional «Diagramas de los casos de uso de apoyo», o 3.2/3.3 si el docente pide los 24 UC |
| UC-08 Robustez - Seguir estudiantes y ver sugerencias | UC-08 seguir estudiantes | — (no está en el Word) | Anexo opcional «Diagramas de los casos de uso de apoyo», o 3.2/3.3 si el docente pide los 24 UC |
| UC-09 Robustez - Crear y participar en un grupo de estudio | UC-09 grupos estudio | — (no está en el Word) | Anexo opcional «Diagramas de los casos de uso de apoyo», o 3.2/3.3 si el docente pide los 24 UC |
| UC-10 Robustez - Denunciar contenido | UC-10 denunciar contenido | — (no está en el Word) | Anexo opcional «Diagramas de los casos de uso de apoyo», o 3.2/3.3 si el docente pide los 24 UC |
| UC-11 Robustez - Publicar evento | UC-11 publicar evento | — (no está en el Word) | Anexo opcional «Diagramas de los casos de uso de apoyo», o 3.2/3.3 si el docente pide los 24 UC |
| UC-12 Robustez - Inscribirse a un evento pagado - Curso básico | UC-12 inscribirse evento | Figura 8 | 3.2.3 UC-12 — Inscribirse a un evento pagado (subsección: 2.1 Curso básico) |
| UC-12 Robustez - Inscribirse a un evento pagado - Alterno 13a — saldo insuficiente y extensión *Recargar y continuar* | UC-12 inscribirse evento | Figura 9 | 3.2.3 UC-12 — Inscribirse a un evento pagado (subsección: 2.2 Alterno 13a — saldo insuficiente y extensión *Recargar y continuar*) |
| UC-12 Robustez - Inscribirse a un evento pagado - Alterno 16a — fallo en ticketing con compensación | UC-12 inscribirse evento | Figura 10 | 3.2.3 UC-12 — Inscribirse a un evento pagado (subsección: 2.3 Alterno 16a — fallo en ticketing con compensación) |
| UC-12 Robustez - Inscribirse a un evento pagado - Alterno T1/T2 — timeout | UC-12 inscribirse evento | Figura 11 | 3.2.3 UC-12 — Inscribirse a un evento pagado (subsección: 2.4 Alterno T1/T2 — timeout) |
| UC-13 Robustez - Cancelar inscripción | UC-13 cancelar inscripcion | Figura 12 | 3.2.4 UC-13 — Cancelar inscripción |
| UC-14 Robustez - Validar entrada en la puerta | UC-14 validar entrada | Figura 13 | 3.2.5 UC-14 — Validar entrada en la puerta |
| UC-15 Robustez - Recargar créditos | UC-15 recargar creditos | Figura 14 | 3.2.6 UC-15 — Recargar créditos |
| UC-16 Robustez - Consultar saldo y movimientos | UC-16 consultar movimientos | — (no está en el Word) | Anexo opcional «Diagramas de los casos de uso de apoyo», o 3.2/3.3 si el docente pide los 24 UC |
| UC-17 Robustez - Usar asistente de estudio offline | UC-17 asistente offline | — (no está en el Word) | Anexo opcional «Diagramas de los casos de uso de apoyo», o 3.2/3.3 si el docente pide los 24 UC |
| UC-18 Robustez - Moderar contenido marcado por IA | UC-18 moderar contenido | — (no está en el Word) | Anexo opcional «Diagramas de los casos de uso de apoyo», o 3.2/3.3 si el docente pide los 24 UC |
| UC-19 Robustez - Solicitar reporte generativo (texto + audio) | UC-19 reporte generativo | Figura 15 | 3.2.7 UC-19 — Solicitar reporte generativo (texto + audio) |
| UC-20 Robustez - Monitorear la plataforma con el agente | UC-20 monitorear plataforma | Figura 16 | 3.2.8 UC-20 — Monitorear la plataforma con el agente |
| UC-21 Robustez - Gestionar usuarios y roles | UC-21 gestionar usuarios | — (no está en el Word) | Anexo opcional «Diagramas de los casos de uso de apoyo», o 3.2/3.3 si el docente pide los 24 UC |
| UC-22 Robustez - Consultar la plataforma desde un cliente MCP externo | UC-22 consulta mcp externa | Figura 17 | 3.2.9 UC-22 — Consultar la plataforma desde un cliente MCP externo |
| UC-23 Robustez - Recibir recordatorios de evento y resumen semanal | UC-23 recordatorios n8n | — (no está en el Word) | Anexo opcional «Diagramas de los casos de uso de apoyo», o 3.2/3.3 si el docente pide los 24 UC |
| UC-24 Robustez - Recibir notificaciones push e in-app | UC-24 recibir notificaciones | — (no está en el Word) | Anexo opcional «Diagramas de los casos de uso de apoyo», o 3.2/3.3 si el docente pide los 24 UC |

## 04 · Diagramas de secuencia

Script: `scripts/04-secuencia.js` · paquete EA: «Bandada U - 04 Secuencia» · 23 de 54 diagramas están en el documento.

| Diagrama en EA | Paquete | Figura | Sección del documento / Sugerencia |
|---|---|---|---|
| UC-01 Secuencia - Registro (curso básico, pasos 1–10) | UC-01 registrarse | Figura 18 | 3.3.1 UC-01 — Registrarse con correo institucional (subsección: 3.1 Registro (curso básico, pasos 1–10)) |
| UC-01 Secuencia - Verificación y propagación (pasos 11–19) | UC-01 registrarse | Figura 19 | 3.3.1 UC-01 — Registrarse con correo institucional (subsección: 3.2 Verificación y propagación (pasos 11–19)) |
| UC-02 Secuencia - Login | UC-02 iniciar sesion | — (no está en el Word) | Anexo opcional «Diagramas de los casos de uso de apoyo», o 3.2/3.3 si el docente pide los 24 UC |
| UC-02 Secuencia - Renovación rotativa y detección de reutilización | UC-02 iniciar sesion | — (no está en el Word) | Anexo opcional «Diagramas de los casos de uso de apoyo», o 3.2/3.3 si el docente pide los 24 UC |
| UC-02 Secuencia - Logout | UC-02 iniciar sesion | — (no está en el Word) | Anexo opcional «Diagramas de los casos de uso de apoyo», o 3.2/3.3 si el docente pide los 24 UC |
| UC-03 Secuencia - App nativa → panel (curso básico) con alterno de código vencido | UC-03 acceso unico panel | — (no está en el Word) | Anexo opcional «Diagramas de los casos de uso de apoyo», o 3.2/3.3 si el docente pide los 24 UC |
| UC-03 Secuencia - Panel → app (curso inverso) con universal link | UC-03 acceso unico panel | — (no está en el Word) | Anexo opcional «Diagramas de los casos de uso de apoyo», o 3.2/3.3 si el docente pide los 24 UC |
| UC-04 Secuencia - Editar datos académicos (curso A) con alterno offline | UC-04 gestionar perfil | — (no está en el Word) | Anexo opcional «Diagramas de los casos de uso de apoyo», o 3.2/3.3 si el docente pide los 24 UC |
| UC-04 Secuencia - Cambiar avatar (curso B) con moderación asíncrona | UC-04 gestionar perfil | — (no está en el Word) | Anexo opcional «Diagramas de los casos de uso de apoyo», o 3.2/3.3 si el docente pide los 24 UC |
| UC-04 Secuencia - Cambiar tema e idioma (curso C) | UC-04 gestionar perfil | — (no está en el Word) | Anexo opcional «Diagramas de los casos de uso de apoyo», o 3.2/3.3 si el docente pide los 24 UC |
| UC-05 Secuencia - Cliente: encolar y drenar (con y sin red) | UC-05 publicar contenido | Figura 20 | 3.3.2 UC-05 — Publicar contenido (texto, imagen, video) (subsección: 3.1 Cliente: encolar y drenar (con y sin red)) |
| UC-05 Secuencia - media-service: subida y pipeline DL (imágenes y video) | UC-05 publicar contenido | Figura 21 | 3.3.2 UC-05 — Publicar contenido (texto, imagen, video) (subsección: 3.2 media-service: subida y pipeline DL (imágenes y video)) |
| UC-05 Secuencia - social-service: crear post, duplicado por reintento y transición por eventos | UC-05 publicar contenido | Figura 22 | 3.3.2 UC-05 — Publicar contenido (texto, imagen, video) (subsección: 3.3 social-service: crear post, duplicado por reintento y transición por eventos) |
| UC-06 Secuencia - Primera página y páginas siguientes (curso básico) | UC-06 ver feed | — (no está en el Word) | Anexo opcional «Diagramas de los casos de uso de apoyo», o 3.2/3.3 si el docente pide los 24 UC |
| UC-06 Secuencia - Alternos: sin conexión, ranker caído y media caído | UC-06 ver feed | — (no está en el Word) | Anexo opcional «Diagramas de los casos de uso de apoyo», o 3.2/3.3 si el docente pide los 24 UC |
| UC-07 Secuencia - Comentar (curso básico A + reintento offline) | UC-07 comentar reaccionar | — (no está en el Word) | Anexo opcional «Diagramas de los casos de uso de apoyo», o 3.2/3.3 si el docente pide los 24 UC |
| UC-07 Secuencia - Reaccionar y cambiar reacción (curso básico B, alterno B4b) | UC-07 comentar reaccionar | — (no está en el Word) | Anexo opcional «Diagramas de los casos de uso de apoyo», o 3.2/3.3 si el docente pide los 24 UC |
| UC-08 Secuencia - Obtener sugerencias (curso básico A) | UC-08 seguir estudiantes | — (no está en el Word) | Anexo opcional «Diagramas de los casos de uso de apoyo», o 3.2/3.3 si el docente pide los 24 UC |
| UC-08 Secuencia - Seguir (curso básico B y alterno B4a) | UC-08 seguir estudiantes | — (no está en el Word) | Anexo opcional «Diagramas de los casos de uso de apoyo», o 3.2/3.3 si el docente pide los 24 UC |
| UC-09 Secuencia - Crear grupo (curso básico A) | UC-09 grupos estudio | — (no está en el Word) | Anexo opcional «Diagramas de los casos de uso de apoyo», o 3.2/3.3 si el docente pide los 24 UC |
| UC-09 Secuencia - Unirse a grupo privado y aprobación (alterno B5a) | UC-09 grupos estudio | — (no está en el Word) | Anexo opcional «Diagramas de los casos de uso de apoyo», o 3.2/3.3 si el docente pide los 24 UC |
| UC-10 Secuencia - Tercera denuncia que oculta el post (curso básico con paso 8) | UC-10 denunciar contenido | — (no está en el Word) | Anexo opcional «Diagramas de los casos de uso de apoyo», o 3.2/3.3 si el docente pide los 24 UC |
| UC-10 Secuencia - Consulta de la cola por el panel (enlace con UC-18) | UC-10 denunciar contenido | — (no está en el Word) | Anexo opcional «Diagramas de los casos de uso de apoyo», o 3.2/3.3 si el docente pide los 24 UC |
| UC-11 Secuencia - Crear y publicar (curso básico) | UC-11 publicar evento | — (no está en el Word) | Anexo opcional «Diagramas de los casos de uso de apoyo», o 3.2/3.3 si el docente pide los 24 UC |
| UC-11 Secuencia - Alterno 11b/10a — portada no aprobada o media-service no disponible | UC-11 publicar evento | — (no está en el Word) | Anexo opcional «Diagramas de los casos de uso de apoyo», o 3.2/3.3 si el docente pide los 24 UC |
| UC-12 Secuencia - Curso básico — Fase A: admisión síncrona (202) | UC-12 inscribirse evento | Figura 23 | 3.3.3 UC-12 — Inscribirse a un evento pagado (subsección: 3.1 Curso básico — Fase A: admisión síncrona (202)) |
| UC-12 Secuencia - Curso básico — Fases B, C y D: débito, ticket, confirmación y polling | UC-12 inscribirse evento | Figura 24 | 3.3.3 UC-12 — Inscribirse a un evento pagado (subsección: 3.2 Curso básico — Fases B, C y D: débito, ticket, confirmación y polling) |
| UC-12 Secuencia - Alterno 13a — saldo insuficiente + extensión *Recargar y continuar* (UC-15) | UC-12 inscribirse evento | Figura 25 | 3.3.3 UC-12 — Inscribirse a un evento pagado (subsección: 3.3 Alterno 13a — saldo insuficiente + extensión *Recargar y continuar* (UC-15)) |
| UC-12 Secuencia - Alterno 16a — fallo en ticketing con compensación (refund + liberar cupo) | UC-12 inscribirse evento | Figura 26 | 3.3.3 UC-12 — Inscribirse a un evento pagado (subsección: 3.4 Alterno 16a — fallo en ticketing con compensación (refund + liberar cupo)) |
| UC-12 Secuencia - Alterno T2 — timeout esperando el ticket | UC-12 inscribirse evento | Figura 27 | 3.3.3 UC-12 — Inscribirse a un evento pagado (subsección: 3.5 Alterno T2 — timeout esperando el ticket) |
| UC-12 Secuencia - Idempotencia ante duplicados (doble clic y *redelivery*) | UC-12 inscribirse evento | Figura 28 | 3.3.3 UC-12 — Inscribirse a un evento pagado (subsección: 3.6 Idempotencia ante duplicados (doble clic y *redelivery*)) |
| UC-13 Secuencia - Curso básico (evento pagado) | UC-13 cancelar inscripcion | Figura 31 | 3.3.4 UC-13 — Cancelar inscripción (subsección: 3.1 Curso básico (evento pagado)) |
| UC-13 Secuencia - Cursos alternos: timeout de ticketing (8d) y fallo de wallet (10b) | UC-13 cancelar inscripcion | Figura 32 | 3.3.4 UC-13 — Cancelar inscripción (subsección: 3.2 Cursos alternos: timeout de ticketing (8d) y fallo de wallet (10b)) |
| UC-14 Secuencia - Curso básico (en línea) y alterno 6a/6d | UC-14 validar entrada | Figura 33 | 3.3.5 UC-14 — Validar entrada en la puerta (subsección: 3.1 Curso básico (en línea) y alterno 6a/6d) |
| UC-14 Secuencia - Curso alterno 3b (offline) y sincronización | UC-14 validar entrada | Figura 34 | 3.3.5 UC-14 — Validar entrada en la puerta (subsección: 3.2 Curso alterno 3b (offline) y sincronización) |
| UC-15 Secuencia - Curso básico con doble clic (3a) | UC-15 recargar creditos | Figura 35 | 3.3.6 UC-15 — Recargar créditos (subsección: 3.1 Curso básico con doble clic (3a)) |
| UC-15 Secuencia - Pago y webhook repetido (10a) | UC-15 recargar creditos | Figura 36 | 3.3.6 UC-15 — Recargar créditos (subsección: 3.2 Pago y webhook repetido (10a)) |
| UC-16 Secuencia - . Diagrama de secuencia (fase de diseño) | UC-16 consultar movimientos | — (no está en el Word) | Anexo opcional «Diagramas de los casos de uso de apoyo», o 3.2/3.3 si el docente pide los 24 UC |
| UC-17 Secuencia - Curso básico (modelo ya descargado, sin red) | UC-17 asistente offline | — (no está en el Word) | Anexo opcional «Diagramas de los casos de uso de apoyo», o 3.2/3.3 si el docente pide los 24 UC |
| UC-17 Secuencia - Curso alterno 2a (descarga bajo demanda) y 1a (fallback web) | UC-17 asistente offline | — (no está en el Word) | Anexo opcional «Diagramas de los casos de uso de apoyo», o 3.2/3.3 si el docente pide los 24 UC |
| UC-18 Secuencia - Carga del MFE, consulta y decisión (curso básico) | UC-18 moderar contenido | — (no está en el Word) | Anexo opcional «Diagramas de los casos de uso de apoyo», o 3.2/3.3 si el docente pide los 24 UC |
| UC-18 Secuencia - Alternos: conflicto entre moderadores (10a), token vencido (4a) y escalamiento n8n (E1) | UC-18 moderar contenido | — (no está en el Word) | Anexo opcional «Diagramas de los casos de uso de apoyo», o 3.2/3.3 si el docente pide los 24 UC |
| UC-19 Secuencia - . Diagrama de secuencia | UC-19 reporte generativo | Figura 37 | 3.3.7 UC-19 — Solicitar reporte generativo (texto + audio) |
| UC-19 Secuencia - . Diagrama de secuencia | UC-19 reporte generativo | Figura 38 | 3.3.7 UC-19 — Solicitar reporte generativo (texto + audio) |
| UC-20 Secuencia - . Diagrama de secuencia | UC-20 monitorear plataforma | Figura 39 | 3.3.8 UC-20 — Monitorear la plataforma con el agente |
| UC-20 Secuencia - . Diagrama de secuencia | UC-20 monitorear plataforma | Figura 40 | 3.3.8 UC-20 — Monitorear la plataforma con el agente |
| UC-21 Secuencia - . Diagrama de secuencia | UC-21 gestionar usuarios | — (no está en el Word) | Anexo opcional «Diagramas de los casos de uso de apoyo», o 3.2/3.3 si el docente pide los 24 UC |
| UC-21 Secuencia - . Diagrama de secuencia | UC-21 gestionar usuarios | — (no está en el Word) | Anexo opcional «Diagramas de los casos de uso de apoyo», o 3.2/3.3 si el docente pide los 24 UC |
| UC-22 Secuencia - . Diagrama de secuencia | UC-22 consulta mcp externa | Figura 41 | 3.3.9 UC-22 — Consultar la plataforma desde un cliente MCP externo |
| UC-22 Secuencia - . Diagrama de secuencia | UC-22 consulta mcp externa | Figura 42 | 3.3.9 UC-22 — Consultar la plataforma desde un cliente MCP externo |
| UC-23 Secuencia - . Diagrama de secuencia | UC-23 recordatorios n8n | — (no está en el Word) | Anexo opcional «Diagramas de los casos de uso de apoyo», o 3.2/3.3 si el docente pide los 24 UC |
| UC-23 Secuencia - . Diagrama de secuencia | UC-23 recordatorios n8n | — (no está en el Word) | Anexo opcional «Diagramas de los casos de uso de apoyo», o 3.2/3.3 si el docente pide los 24 UC |
| UC-24 Secuencia - . Diagrama de secuencia | UC-24 recibir notificaciones | — (no está en el Word) | Anexo opcional «Diagramas de los casos de uso de apoyo», o 3.2/3.3 si el docente pide los 24 UC |
| UC-24 Secuencia - . Diagrama de secuencia | UC-24 recibir notificaciones | — (no está en el Word) | Anexo opcional «Diagramas de los casos de uso de apoyo», o 3.2/3.3 si el docente pide los 24 UC |

## 05 · Arquitectura y despliegue

Script: `scripts/05-arquitectura-y-despliegue.js` · paquete EA: «Bandada U - 05 Arquitectura y despliegue» · 3 de 4 diagramas están en el documento.

| Diagrama en EA | Paquete | Figura | Sección del documento / Sugerencia |
|---|---|---|---|
| Vista de contenedores (arquitectura) | Arquitectura | Figura 51 | 4.2.1. Vista de contenedores |
| Mapa de contextos (DDD estrategico) | Arquitectura | Figura 52 | 4.2.3. Mapa de contextos (DDD estratégico) |
| Despliegue local (Docker Compose) | Despliegue | — (no está en el Word) | Anexo «Guía de levantamiento local» (o 4.6 junto al despliegue en la nube) |
| Despliegue en la nube (AWS + Azure + GCP con Tailscale) | Despliegue | Figura 63 | 4.6. Despliegue en la nube |

## 06 · SAGA

Script: `scripts/06-saga.js` · paquete EA: «Bandada U - 06 SAGA» · 5 de 7 diagramas están en el documento.

| Diagrama en EA | Paquete | Figura | Sección del documento / Sugerencia |
|---|---|---|---|
| SAGA Estados - SagaInstance (type = REGISTRATION) | Estados | Figura 54 | 4.5.1. SAGA de inscripción a evento (subsección: 4.1 `SagaInstance` (type = `REGISTRATION`)) |
| SAGA Estados - SagaInstance (type = CANCELLATION, UC-13) | Estados | Figura 55 | 4.5.1. SAGA de inscripción a evento (subsección: 4.2 `SagaInstance` (type = `CANCELLATION`, UC-13)) |
| SAGA Estados - Registration | Estados | Figura 56 | 4.5.1. SAGA de inscripción a evento (subsección: 4.3 `Registration`) |
| SAGA Secuencia - Secuencia — camino feliz (evento pagado) | Secuencias | — (no está en el Word) | Ya cubierto por las secuencias de UC-12 (sección 3.3); opcional en 4.5. Integración de componentes |
| SAGA Secuencia - Secuencia — fallo en ticketing con rollback (demo CHAOS_TICKETING_FAIL) | Secuencias | — (no está en el Word) | Ya cubierto por las secuencias de UC-12 (sección 3.3); opcional en 4.5. Integración de componentes |
| UC-12 Estados - SagaInstance (type = REGISTRATION) | Estados UC-12 | Figura 29 | 3.3.3 UC-12 — Inscribirse a un evento pagado (subsección: `SagaInstance` (`type = REGISTRATION`)) |
| UC-12 Estados - Registration | Estados UC-12 | Figura 30 | 3.3.3 UC-12 — Inscribirse a un evento pagado (subsección: `Registration`) |

## 07 · Otros diagramas

Script: `scripts/07-otros-diagramas.js` · paquete EA: «Bandada U - 07 Otros diagramas» · 12 de 44 diagramas están en el documento.

| Diagrama en EA | Paquete | Figura | Sección del documento / Sugerencia |
|---|---|---|---|
| 00-metodologia-iconix - 1. Fases, artefactos e hitos | iconix / 00-metodologia-iconix | Figura 1 | 1.6. Metodología de desarrollo ICONIX |
| 00-metodologia-iconix - 2. Reglas del diagrama de robustez (las verificamos en la PDR) | iconix / 00-metodologia-iconix | Figura 2 | 1.6. Metodología de desarrollo ICONIX (subsección: Reglas del diagrama de robustez) |
| 05-prototipos-gui - 1.1 Mapa de navegación | iconix / 05-prototipos-gui | — (no está en el Word) | Anexo opcional «Diagramas complementarios» |
| agentes-y-reportes-generativos - 2. Arquitectura Clean de insights-service | arquitectura / agentes-y-reportes-generativos | — (no está en el Word) | 4.5. Integración de componentes |
| agentes-y-reportes-generativos - 5.1 Flujo | arquitectura / agentes-y-reportes-generativos | — (no está en el Word) | 4.5. Integración de componentes |
| arquitectura-general - 1. Contexto (C4 nivel 1) | arquitectura / arquitectura-general | Figura 3 | 2.1. Descripción del sistema propuesto |
| automatizacion-n8n - 4.1 Router (por qué uno solo) | arquitectura / automatizacion-n8n | — (no está en el Word) | 4.5. Integración de componentes |
| automatizacion-n8n - wf-01-bienvenida (UC-01) | arquitectura / automatizacion-n8n | — (no está en el Word) | 4.5. Integración de componentes |
| automatizacion-n8n - wf-02-recordatorio-evento (UC-23, RF-27) | arquitectura / automatizacion-n8n | — (no está en el Word) | 4.5. Integración de componentes |
| automatizacion-n8n - wf-03-escalamiento-moderacion (UC-18) | arquitectura / automatizacion-n8n | — (no está en el Word) | 4.5. Integración de componentes |
| automatizacion-n8n - wf-04-resumen-semanal (UC-23, RF-27) | arquitectura / automatizacion-n8n | — (no está en el Word) | 4.5. Integración de componentes |
| automatizacion-n8n - wf-05-alerta-critica (UC-20) | arquitectura / automatizacion-n8n | — (no está en el Word) | 4.5. Integración de componentes |
| eventos-y-mensajeria - 2. Topología | arquitectura / eventos-y-mensajeria | Figura 57 | 4.5.2. Mensajería con RabbitMQ y CloudEvents |
| eventos-y-mensajeria - 5. Transactional outbox por motor | arquitectura / eventos-y-mensajeria | — (no está en el Word) | 4.5. Integración de componentes |
| eventos-y-mensajeria - 9. Propagación de traceparent | arquitectura / eventos-y-mensajeria | — (no está en el Word) | 4.5. Integración de componentes |
| graphql-admin - 1. Rol del gateway | arquitectura / graphql-admin | Figura 59 | 4.5.4. Panel de administración: GraphQL y microfrontends |
| ia-local-y-offline - 2. Capas de la app | arquitectura / ia-local-y-offline | — (no está en el Word) | 4.5. Integración de componentes |
| ia-local-y-offline - 4.3 Estados | arquitectura / ia-local-y-offline | — (no está en el Word) | 4.5. Integración de componentes |
| ia-local-y-offline - 5.2 Implementación web (local-llm.web.ts) | arquitectura / ia-local-y-offline | — (no está en el Word) | 4.5. Integración de componentes |
| idempotencia - 1. Los cinco mecanismos y qué protege cada uno | arquitectura / idempotencia | Figura 58 | 4.5.3. Idempotencia de extremo a extremo |
| idempotencia - 2.4 Estados y carreras | arquitectura / idempotencia | — (no está en el Word) | 4.5. Integración de componentes |
| mcp - 1. Qué es MCP y para qué lo usamos | arquitectura / mcp | Figura 61 | 4.5.5. Agentes, MCP y automatización |
| microfrontends - 1. Decisión: Web Components en runtime | arquitectura / microfrontends | Figura 60 | 4.5.4. Panel de administración: GraphQL y microfrontends |
| ml-dl - 4.1 Estados de MediaAsset | arquitectura / ml-dl | — (no está en el Word) | 4.5. Integración de componentes |
| ml-dl - 4.3 Flujo | arquitectura / ml-dl | — (no está en el Word) | 4.5. Integración de componentes |
| ml-dl - 6. MLOps mínimo | arquitectura / ml-dl | — (no está en el Word) | 4.5. Integración de componentes |
| observabilidad - 1. Arquitectura | arquitectura / observabilidad | Figura 62 | 4.5.6. Observabilidad |
| seguridad-y-sso - 1. Panorama | arquitectura / seguridad-y-sso | Figura 53 | 4.2.6. Seguridad |
| seguridad-y-sso - 2.2 Llaves, JWKS y rotación | arquitectura / seguridad-y-sso | — (no está en el Word) | 4.5. Integración de componentes |
| seguridad-y-sso - 7.2 Flujo app → panel | arquitectura / seguridad-y-sso | — (no está en el Word) | 4.5. Integración de componentes |
| arquitectura-hexagonal - 1. Idea en una frase | patrones-y-reglas / arquitectura-hexagonal | — (no está en el Word) | 3.4. Diagrama de clases UML |
| arquitectura-hexagonal - 6. Ejemplo completo: DebitCredits (paso 2 de la SAGA, UC-12) | patrones-y-reglas / arquitectura-hexagonal | — (no está en el Word) | 4.5. Integración de componentes |
| clean-architecture - 1. Las cuatro capas | patrones-y-reglas / clean-architecture | — (no está en el Word) | 3.4. Diagrama de clases UML |
| clean-architecture - 4. Ejemplo completo: CreatePost (UC-05, social-service) | patrones-y-reglas / clean-architecture | — (no está en el Word) | 3.4. Diagrama de clases UML |
| ddd - 2. Diseño táctico: agregados | patrones-y-reglas / ddd | — (no está en el Word) | 3.4. Diagrama de clases UML |
| ddd - 2.7 La SAGA como proceso (process manager) | patrones-y-reglas / ddd | — (no está en el Word) | 4.5. Integración de componentes |
| design-tokens-y-temas - 2. Arquitectura de tokens (3 niveles) | patrones-y-reglas / design-tokens-y-temas | — (no está en el Word) | 3.6. Diseño de interfaces de usuario |
| design-tokens-y-temas - 5. Modelo de tema | patrones-y-reglas / design-tokens-y-temas | — (no está en el Word) | 3.6. Diseño de interfaces de usuario |
| i18n - 2. Resolución del idioma | patrones-y-reglas / i18n | — (no está en el Word) | 3.6. Diseño de interfaces de usuario |
| testing-strategy - 1. Pirámide | patrones-y-reglas / testing-strategy | Figura 64 | 5.1. Plan de pruebas |
| infraestructura - 4.1 Diagrama de despliegue | infraestructura / infraestructura | — (no está en el Word) | 4.2. Diseño de la arquitectura del sistema |
| infraestructura - 5.1 Flujo general | infraestructura / infraestructura | — (no está en el Word) | 4.2. Diseño de la arquitectura del sistema |
| infraestructura - 5.3 Despliegue independiente de microfrontends (D5) | infraestructura / infraestructura | — (no está en el Word) | 4.5. Integración de componentes |
| roadmap-y-sprints - 4. Dependencias críticas | plan / roadmap-y-sprints | Figura 66 | Anexo G. Plan de trabajo y riesgos (subsección: 4. Dependencias críticas) |

## No importado a EA

- Fragmentos combinados reales de secuencia (`alt`, `opt`, `loop`): quedan como prefijo del mensaje.
- Diagrama de Gantt de `docs/06-plan/roadmap-y-sprints.md`: EA no lo modela como diagrama.
