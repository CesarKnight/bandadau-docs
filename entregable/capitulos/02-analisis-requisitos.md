# CAPÍTULO II. ANÁLISIS DE REQUISITOS

## 2.1. Descripción del sistema propuesto

Bandada U se compone de cinco aplicaciones de cara al usuario, nueve microservicios y una plataforma de infraestructura. Los usuarios interactúan con la **aplicación móvil y web** (iOS, Android y PWA), con la **landing** pública y, si son moderadores o administradores, con el **panel de administración**. Todas las peticiones entran por un **API Gateway** (Traefik) que las enruta al microservicio responsable. Los servicios se comunican de forma síncrona por REST y de forma asíncrona por eventos y comandos a través de **RabbitMQ**.

| Parte | Descripción |
|---|---|
| **App (Expo)** | Aplicación para estudiantes y organizadores en iOS, Android y web instalable. Feed, publicaciones, grupos, eventos, billetera, entradas con QR, notificaciones y asistente de estudio sin conexión |
| **Landing** | Sitio público (Next.js, exportación estática) con eventos destacados y acceso a la app y al panel |
| **Panel de administración** | Shell Next.js que compone en tiempo de ejecución dos microfrontends independientes: Moderación (Angular) e Insights (React), sobre una API GraphQL |
| **Microservicios** | Identidad, social, multimedia con ML/DL, eventos, billetera, entradas, notificaciones, agentes de IA con servidor MCP y un BFF GraphQL para el panel |
| **Plataforma** | API Gateway, broker de mensajes, tres motores de bases de datos, almacenamiento de objetos, automatización n8n, observabilidad y correo de desarrollo |

El siguiente diagrama muestra el contexto del sistema y sus contenedores principales.

@@include 03-arquitectura/arquitectura-general.md section="^1\. Contexto" demote=2

La funcionalidad más importante desde el punto de vista técnico es la **inscripción pagada a un evento**. El estudiante solicita inscribirse; `events-service` reserva el cupo, `wallet-service` debita los créditos y `ticketing-service` emite el ticket con un código QR firmado. Si cualquiera de los pasos falla, el orquestador ejecuta las compensaciones en orden inverso (anular ticket, reembolsar créditos, liberar cupo), de modo que el sistema nunca queda en un estado intermedio (RNF-04).

## 2.2. Identificación de actores

@@include 02-iconix/03-casos-de-uso/00-catalogo.md section="^Actores" demote=2

La jerarquía de roles de usuario es la siguiente: el **Organizador** hereda las capacidades del **Estudiante**, y el **Administrador** hereda las del **Moderador**. Un usuario puede tener uno o más roles al mismo tiempo (`roles` en el token de acceso).

| Rol | Descripción | Acceso |
|---|---|---|
| `STUDENT` | Estudiante verificado por correo institucional | App (móvil y web) |
| `ORGANIZER` | Estudiante o centro de estudiantes que publica eventos | App, con la sección de organizador |
| `MODERATOR` | Modera contenido | App y panel (módulo de Moderación) |
| `ADMIN` | Administra la plataforma | App, panel completo y herramientas MCP |

## 2.3. Requisitos funcionales y no funcionales

### Requisitos funcionales

@@include 02-iconix/01-requisitos/requisitos-funcionales.md demote=2

### Requisitos no funcionales

@@include 02-iconix/01-requisitos/requisitos-no-funcionales.md demote=2

## 2.4. Reglas de negocio

Las reglas de negocio son las restricciones del dominio que el sistema debe hacer cumplir siempre, independientemente de la interfaz desde la que se use. Se presentan primero las invariantes globales del modelo de dominio y luego las reglas específicas de cada caso de uso.

### Invariantes globales del dominio

@@include 02-iconix/02-modelo-dominio.md section="^Invariantes de negocio clave" demote=2

### Reglas por caso de uso

@@uc section=1 numprefix=2.4 sub="^Reglas de negocio"

## 2.5. Diagrama UML de casos de uso

El sistema tiene 24 casos de uso agrupados en siete paquetes (Identidad, Social, Eventos, Billetera, IA local, Administración y Automatización). Los actores humanos son el Visitante, el Estudiante, el Organizador, el Moderador, el Administrador y el Portero; los actores de sistema son el Cliente MCP externo, el Reloj, la Pasarela de recarga y el Modelo de IA. Las relaciones «include» y «extend» entre casos de uso se documentan en la cabecera de cada especificación.

@@include 02-iconix/03-casos-de-uso/00-catalogo.md section="^Diagrama general" demote=2

## 2.6. Especificación de casos de uso

Cada especificación sigue la plantilla ICONIX del proyecto: cabecera con paquete, actores, prioridad, requisitos y servicios involucrados; precondiciones; disparador; curso básico; cursos alternos; postcondiciones y reglas de negocio.

@@uc section=1 numprefix=2.6 preamble=1
