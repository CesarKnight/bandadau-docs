# CAPÍTULO III. ANÁLISIS Y DISEÑO CON ICONIX

Este capítulo reúne los artefactos de las fases de análisis y diseño de ICONIX: el modelo de dominio, los diagramas de robustez (análisis preliminar) y los diagramas de secuencia (diseño detallado) de los 24 casos de uso, y a partir de ellos las clases de diseño, el modelo de persistencia de cada servicio y los prototipos de la interfaz. Los nombres de las clases que aparecen en los diagramas de robustez y de secuencia salen del modelo de dominio de la sección 3.1.

## 3.1. Modelo de dominio

El modelo de dominio está dividido en contextos delimitados (identidad, social, multimedia, eventos, billetera, entradas, notificaciones e insights). Cada contexto es propiedad de un único microservicio, que es el único que lee y escribe sus datos (principio *database per service*). Las referencias entre contextos se hacen únicamente por identificador (UUID versión 7), nunca por claves foráneas entre bases de datos.

@@include 02-iconix/02-modelo-dominio.md demote=2

## 3.2. Diagramas de robustez

Para cada caso de uso se construyó un diagrama de robustez que clasifica los objetos que participan en tres tipos: **boundary** (pantallas, endpoints, colas), **control** (la lógica, un verbo del texto del caso de uso) y **entity** (objetos del dominio). Las reglas de conexión entre tipos se enunciaron en la sección 1.6. Cada diagrama va acompañado de una tabla que asocia cada objeto con el componente real que lo implementa.

@@uc section=2 numprefix=3.2

## 3.3. Diagramas de secuencia UML

Los diagramas de secuencia convierten cada *control* de la robustez en mensajes entre componentes reales (pantalla, gateway, controlador, caso de uso, repositorio, broker). Se documenta el curso básico y los cursos alternos más relevantes de cada caso de uso. Los diagramas del UC-12 (inscripción pagada) y del UC-13 (cancelación) muestran la SAGA completa, incluidos el rollback y los timeouts.

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

@@include 02-iconix/05-prototipos-gui.md demote=2
