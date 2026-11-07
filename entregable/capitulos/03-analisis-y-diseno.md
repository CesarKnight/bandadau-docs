# CAPÍTULO III. ANÁLISIS Y DISEÑO CON ICONIX

Este capítulo reúne los artefactos de las fases de análisis y diseño de ICONIX: el modelo de dominio, los diagramas de robustez (análisis preliminar) y los diagramas de secuencia (diseño detallado) de los nueve casos de uso clave (los demás se resumen en la sección 2.6.1 y están completos en el repositorio de documentación), y a partir de ellos las clases de diseño, el modelo de persistencia de cada servicio y los prototipos de la interfaz. Los nombres de las clases que aparecen en los diagramas de robustez y de secuencia salen del modelo de dominio de la sección 3.1.

## 3.1. Modelo de dominio

El modelo de dominio está dividido en contextos delimitados (identidad, social, multimedia, eventos, billetera, entradas, notificaciones e insights). Cada contexto es propiedad de un único microservicio, que es el único que lee y escribe sus datos (principio *database per service*). Las referencias entre contextos se hacen únicamente por identificador (UUID versión 7), nunca por claves foráneas entre bases de datos.

@@include 02-iconix/02-modelo-dominio.md demote=2

## 3.2. Diagramas de robustez

Para cada uno de los 24 casos de uso se construyó un diagrama de robustez que clasifica los objetos que participan en tres tipos: **boundary** (pantallas, endpoints, colas), **control** (la lógica, un verbo del texto del caso de uso) y **entity** (objetos del dominio). Las reglas de conexión entre tipos se enunciaron en la sección 1.6. Cada diagrama va acompañado de una tabla que asocia cada objeto con el componente real que lo implementa. Aquí se muestran los de los casos de uso clave.

@@uc section=2 numprefix=3.2

## 3.3. Diagramas de secuencia UML

Los diagramas de secuencia convierten cada *control* de la robustez en mensajes entre componentes reales (pantalla, gateway, controlador, caso de uso, repositorio, broker). Se documenta el curso básico y los cursos alternos más relevantes de cada caso de uso clave. Los diagramas del UC-12 (inscripción pagada) y del UC-13 (cancelación) muestran la SAGA completa, incluidos el rollback y los timeouts.

@@uc section=3 numprefix=3.3

## 3.4. Diagrama de clases UML

Las clases de diseño se agruparon por servicio. Cada diagrama respeta la arquitectura asignada al servicio: Hexagonal en identidad y billetera, Clean Architecture en social, multimedia, entradas, notificaciones e insights, y DDD táctico en eventos.

### 3.4.1. Convenciones y piezas transversales

@@include 02-iconix/06-modelo-estatico/00-indice.md demote=2

### 3.4.2. Identidad — `identity-service` (Hexagonal)

@@include 02-iconix/06-modelo-estatico/identidad.md section="^1\. Clases" demote=2

### 3.4.3. Social — `social-service` (Clean Architecture)

@@include 02-iconix/06-modelo-estatico/social.md section="^1\. Clases" demote=2

### 3.4.4. Multimedia — `media-service` (Clean Architecture)

@@include 02-iconix/06-modelo-estatico/media.md section="^1\. Clases" demote=2

### 3.4.5. Eventos — `events-service` (DDD)

@@include 02-iconix/06-modelo-estatico/eventos.md section="^1\. Clases" demote=2

### 3.4.6. Billetera — `wallet-service` (Hexagonal)

@@include 02-iconix/06-modelo-estatico/billetera.md section="^1\. Clases" demote=2

### 3.4.7. Entradas — `ticketing-service` (Clean Architecture)

@@include 02-iconix/06-modelo-estatico/entradas.md section="^1\. Clases" demote=2

### 3.4.8. Notificaciones — `notification-service` (Clean Architecture)

@@include 02-iconix/06-modelo-estatico/notificaciones.md section="^1\. Clases" demote=2

### 3.4.9. Insights — `insights-service` (Clean Architecture)

@@include 02-iconix/06-modelo-estatico/insights.md section="^1\. Clases" demote=2

## 3.5. Diseño de la base de datos

El sistema es **políglota** por diseño: cada servicio elige el motor que mejor se ajusta a su dominio, y ningún servicio accede a la base de otro.

| Motor | Servicios | Bases / tablas | Razón de la elección |
|---|---|---|---|
| **PostgreSQL** | `identity-service`, `events-service`, `wallet-service` | `identity_db`, `events_db`, `wallet_db` (una instancia, tres bases y tres usuarios) | Transacciones ACID, restricciones únicas e índices parciales: necesarios para los saldos, el libro de movimientos y la unicidad de inscripciones |
| **MongoDB** (réplica `rs0`) | `social-service`, `media-service` | `social`, `media` | Documentos flexibles y anidados (posts, comentarios, grafo de seguimiento); la réplica permite transacciones y *outbox* |
| **DynamoDB** (AWS) | `ticketing-service`, `notification-service`, `insights-service` y la tabla compartida de idempotencia | `bandada-ticketing`, `bandada-notifications`, `bandada-insights`, `bandada-idempotency` | Acceso por clave a gran escala, TTL nativo para datos efímeros y escrituras transaccionales condicionales para el ticket único por inscripción |

### 3.5.1. Tablas de DynamoDB

@@include 03-arquitectura/catalogo-servicios.md section="^6\. Tablas DynamoDB" demote=2

### 3.5.2. Identidad (`identity_db`)

@@include 02-iconix/06-modelo-estatico/identidad.md section="^2\. Modelo persistente" demote=2

### 3.5.3. Social (MongoDB `social`)

@@include 02-iconix/06-modelo-estatico/social.md section="^2\. Modelo persistente" demote=2

### 3.5.4. Multimedia (MongoDB `media`)

@@include 02-iconix/06-modelo-estatico/media.md section="^2\. Modelo persistente" demote=2

### 3.5.5. Eventos y SAGA (`events_db`)

@@include 03-arquitectura/saga-inscripcion-evento.md section="^5\. Esquema" demote=2

### 3.5.6. Billetera (`wallet_db`)

@@include 02-iconix/06-modelo-estatico/billetera.md section="^2\. Modelo persistente" demote=2

### 3.5.7. Entradas (`bandada-ticketing`)

@@include 02-iconix/06-modelo-estatico/entradas.md section="^2\. Modelo persistente" demote=2

### 3.5.8. Notificaciones (`bandada-notifications`)

@@include 02-iconix/06-modelo-estatico/notificaciones.md section="^2\. Modelo persistente" demote=2

### 3.5.9. Insights (`bandada-insights`)

@@include 02-iconix/06-modelo-estatico/insights.md section="^2\. Modelo persistente" demote=2

## 3.6. Diseño de interfaces de usuario

Los prototipos se diseñaron como *storyboards* de baja fidelidad antes de implementar las pantallas. Cada pantalla se asocia a un caso de uso y corresponde al *boundary* de su diagrama de robustez. Todas las interfaces usan tokens de diseño (modo claro y oscuro) y textos externalizados con i18n (español e inglés).

Se muestran los *storyboards* de las pantallas de los casos de uso clave; la matriz del final relaciona **todas** las pantallas con sus casos de uso, boundaries y operaciones.

@@include 02-iconix/05-prototipos-gui.md demote=2 filterkey=1


### 3.6.1. Interfaces implementadas (capturas de la aplicación)

Las siguientes capturas se tomaron el 7 de noviembre de 2026 sobre el sistema real levantado con `make up` y `make seed`: la app web en formato móvil (390 px de ancho) y el panel de administración en escritorio. Cada pantalla se abrió con el usuario de demostración del seed que le corresponde: `lucia@umsa.edu.bo` (estudiante), `org@umsa.edu.bo` (organizador) y `admin@umsa.edu.bo` (administrador); las pantallas de bienvenida, registro y verificación se muestran sin sesión. Las capturas se regeneran con `node capturas/capturar.mjs` (ver el README de esta carpeta).

**Visitante: registro y verificación de correo (UC-01).** Pantallas P-APP-01, P-APP-02 y P-APP-03.

| Bienvenida | Registro | Verificar correo |
|---|---|---|
| ![](capturas/img/app-01-bienvenida.png){width=1.9in} | ![](capturas/img/app-02-registro.png){width=1.9in} | ![](capturas/img/app-03-verificar-correo.png){width=1.9in} |

**Estudiante: publicar, descubrir eventos e inscribirse (UC-05, UC-12).** Pantallas P-APP-07, P-APP-09 y P-APP-10; el botón *Participar* inicia la SAGA de inscripción pagada.

| Nueva publicación | Lista de eventos | Detalle del evento |
|---|---|---|
| ![](capturas/img/app-07-nueva-publicacion.png){width=1.9in} | ![](capturas/img/app-09-eventos.png){width=1.9in} | ![](capturas/img/app-10-detalle-evento.png){width=1.9in} |

**Estudiante: billetera y entradas (UC-15, UC-12, UC-14).** Pantallas P-APP-12 y P-APP-13: saldo y movimientos (cargos, recargas y reembolsos de la compensación), entradas disponibles y entrada con código QR firmado.

| Billetera | Mis entradas | Entrada con QR |
|---|---|---|
| ![](capturas/img/app-12-billetera.png){width=1.9in} | ![](capturas/img/app-13a-mis-entradas.png){width=1.9in} | ![](capturas/img/app-13b-entrada-qr.png){width=1.9in} |

**Organizador: crear evento y validar entradas (UC-14).** Pantallas P-APP-18 y estado de las inscripciones. El formulario se muestra relleno sin enviarlo; la pantalla de validación pide permiso de cámara porque el navegador sin interfaz no tiene una.

| Crear evento | Validar entradas | Mis inscripciones |
|---|---|---|
| ![](capturas/img/app-18a-crear-evento.png){width=1.9in} | ![](capturas/img/app-18b-validar-entradas.png){width=1.9in} | ![](capturas/img/app-11-inscripciones.png){width=1.9in} |

**Administrador: panel (UC-19, UC-20).** El panel integra el micro-frontend de Insights, donde el reporte generativo, las alertas y las ejecuciones del agente de monitoreo (que consume las herramientas MCP) se ven en una sola pantalla, y una vista de SAGAs fallidas que permite reintentarlas.

![Panel: dashboard con indicadores de la plataforma y salud de los siete servicios.](capturas/img/adm-03-dashboard.png){width=100%}

![Panel (Insights): reporte generativo en lenguaje natural, con la respuesta redactada por el modelo.](capturas/img/adm-06b-reporte-generado.png){width=100%}

![Panel (Insights): ejecuciones programadas del agente de monitoreo.](capturas/img/adm-06d-ejecuciones-agentes.png){width=100%}

![Panel: SAGAs fallidas con la acción de reintento desde el paso en que quedaron.](capturas/img/adm-07-sagas.png){width=100%}

**Landing pública.** Primeras secciones de la página de presentación (exportación estática de Next.js).

![Landing: portada, funciones y cómo funciona.](capturas/img/lnd-01-landing-inicio.png){width=3.2in}
