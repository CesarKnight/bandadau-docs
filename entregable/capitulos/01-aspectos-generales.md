# CAPÍTULO I. ASPECTOS GENERALES

## 1.1. Introducción

La vida universitaria está repartida en herramientas que no se hablan entre sí: los avisos de cada carrera circulan por grupos de mensajería, los eventos se anuncian en las cuentas de los centros de estudiantes, los apuntes viven en carpetas personales y la inscripción a talleres se hace con formularios y pagos por código QR que alguien concilia a mano. Ninguna de estas herramientas garantiza que quien participa sea realmente un estudiante, y casi todas dejan de ser útiles cuando la conectividad del campus es mala.

**Bandada U** es la red social de la universidad. Permite a los estudiantes verificados conectarse con compañeros de su carrera, publicar contenido, formar grupos de estudio e inscribirse a eventos y talleres pagando con créditos, incluso sin conexión y con un asistente de estudio basado en un modelo de inteligencia artificial que corre en el propio teléfono. Para la administración ofrece un panel empresarial con moderación asistida por IA, agentes que vigilan la plataforma y reportes generativos en texto y audio.

El sistema está construido como un conjunto de **microservicios** en tres lenguajes (Java con Spring Boot, TypeScript con NestJS y PHP con Laravel), con una base de datos por servicio (PostgreSQL, MongoDB y DynamoDB), una aplicación móvil y web (React Native con Expo), un panel de administración compuesto por **microfrontends** (Next.js, Angular y React) sobre una API **GraphQL**, y una línea de automatización y agentes de IA expuestos mediante el protocolo MCP. La funcionalidad que concentra el valor técnico del proyecto es la **inscripción pagada a un evento**, que atraviesa tres microservicios en una **SAGA orquestada** con compensaciones automáticas, y cuyos tres servicios se despliegan en tres proveedores de nube distintos (AWS, Google Cloud y Azure).

Este documento recoge el análisis, el diseño, la implementación y las pruebas de Bandada U siguiendo la metodología **ICONIX**, y es el entregable de la asignatura Ingeniería de Software II (Grupo 24).

## 1.2. Planteamiento del problema

Los estudiantes y los organizadores de actividades universitarias enfrentan hoy cuatro problemas concretos:

1. **Fragmentación y falta de verificación.** La información académica y social está dispersa en canales sin control de identidad. No existe un espacio donde se pueda asegurar que todos los participantes pertenecen a la universidad, ni donde la información esté organizada por carrera, materia o grupo de estudio.
2. **Gestión manual de eventos y pagos.** Los centros de estudiantes publican eventos con cupo limitado y cobran la inscripción por transferencias que se concilian a mano. Esto genera errores: cupos sobrevendidos, pagos sin comprobante, inscripciones duplicadas y devoluciones lentas cuando el evento se cancela o la inscripción falla.
3. **Conectividad intermitente.** Gran parte de los estudiantes usa datos móviles limitados o redes inestables dentro del campus. Las aplicaciones que exigen conexión permanente no son confiables para leer apuntes, publicar o estudiar.
4. **Falta de visibilidad para la administración.** Quienes moderan y administran la plataforma no cuentan con herramientas para revisar contenido sensible con asistencia automática ni para saber, sin armar hojas de cálculo, cómo está funcionando el sistema.

La pregunta que guía el proyecto es: **¿cómo diseñar y construir una plataforma social universitaria verificada, tolerante a fallos y utilizable sin conexión, que gestione eventos pagados de forma consistente entre varios servicios independientes y que dé a la administración herramientas de moderación y análisis asistidas por IA?**

## 1.3. Objetivos del proyecto

### 1.3.1. Objetivo general

Diseñar, implementar y desplegar **Bandada U**, una plataforma social para estudiantes universitarios basada en microservicios y microfrontends, que permita publicar contenido, formar grupos, inscribirse a eventos pagados con créditos de forma consistente y utilizar un asistente de estudio sin conexión, además de ofrecer a la administración un panel con moderación y reportes asistidos por inteligencia artificial, aplicando la metodología ICONIX.

### 1.3.2. Objetivos específicos

1. Levantar y especificar los requisitos funcionales y no funcionales del sistema, identificar sus actores y documentar **24 casos de uso** con su curso básico, cursos alternos, postcondiciones y reglas de negocio.
2. Elaborar el **modelo de dominio**, los **diagramas de robustez** y los **diagramas de secuencia** de cada caso de uso, y derivar de ellos los diagramas de clases y el diseño de las bases de datos de cada servicio.
3. Implementar nueve microservicios en tres lenguajes (Spring Boot, NestJS y Laravel), cada uno con su propia base de datos (PostgreSQL, MongoDB o DynamoDB) y con una de las arquitecturas de código Hexagonal, Clean o DDD.
4. Garantizar la **consistencia de la inscripción pagada** entre `events-service`, `wallet-service` y `ticketing-service` mediante una SAGA orquestada con compensaciones, timeouts e idempotencia de extremo a extremo.
5. Construir una aplicación para iOS, Android y web instalable (PWA) con modo sin conexión, cola de publicaciones que sincroniza sin duplicar y un asistente de estudio que corre en el dispositivo.
6. Construir un panel de administración con microfrontends independientes (Angular y React) sobre una API GraphQL, con moderación de contenido mediante modelos de aprendizaje profundo, un agente de monitoreo, reportes generativos con voz y un servidor MCP.
7. Desplegar los servicios de la SAGA en **tres proveedores de nube distintos** (AWS, Google Cloud y Azure) con una infraestructura reproducible y simple, usando contenedores Docker.
8. Verificar el sistema con pruebas funcionales, de integración, de contrato y de fallos inyectados, y documentar sus resultados.

## 1.4. Justificación

**Justificación social.** Una plataforma verificada y gratuita para el estudiante reduce la dependencia de canales dispersos, facilita que los estudiantes de menos recursos accedan a eventos y apuntes y da a los centros de estudiantes una forma ordenada y transparente de organizar actividades y cobrar sus inscripciones.

**Justificación técnica.** El dominio contiene una situación clásica de los sistemas distribuidos: una operación de negocio (inscribirse a un evento pagado) que debe modificar datos en tres sistemas independientes sin que ninguno quede en un estado inconsistente. Resolverlo con una SAGA orquestada, idempotencia y compensaciones es un caso de estudio real de las arquitecturas de microservicios. Además, el diseño políglota (tres lenguajes, tres motores de bases de datos y tres arquitecturas de código) permite aplicar y contrastar los enfoques vistos en la asignatura.

**Justificación metodológica.** ICONIX ofrece un camino ligero y dirigido por casos de uso que va del requisito al código con trazabilidad completa, evitando tanto la documentación excesiva como la improvisación. Cada caso de uso es una unidad de trabajo verificable, lo que encaja con un equipo pequeño y un calendario corto.

**Justificación económica.** El despliegue se diseñó para costar poco: pocas máquinas virtuales pequeñas, una sola pieza gestionada obligatoria (DynamoDB), una red privada entre nubes sin equipos de red dedicados y apagado programado fuera de horario.

## 1.5. Alcance y limitaciones

### Alcance

El alcance se priorizó con la técnica MoSCoW. Lo siguiente forma parte de la entrega:

| Épica | Funcionalidad incluida |
|---|---|
| Identidad | Registro con correo institucional y verificación por código, inicio de sesión, renovación de sesión, roles y acceso único (SSO) de la app al panel |
| Perfil y social | Perfil académico, publicaciones con texto, imágenes o video, comentarios, reacciones, seguimiento, grupos de estudio y denuncias |
| Feed | Feed paginado por cursor con seguidos, grupos y recomendados, disponible sin conexión |
| Moderación con IA | Clasificación de imágenes y video con modelos ONNX y cola de revisión para moderadores |
| Eventos y billetera | Publicación de eventos con cupo y precio en créditos, inscripción y cancelación mediante SAGA, recarga de créditos con pasarela simulada y movimientos |
| Entradas | Ticket con código QR firmado y validación en puerta |
| Notificaciones | Notificaciones push, dentro de la aplicación y por correo |
| IA local y PWA | Asistente de estudio sin conexión, pre-chequeo de imágenes en el dispositivo, aplicación web instalable y cola sin conexión |
| Panel de administración | Shell con microfrontends de Moderación (Angular) e Insights (React) sobre GraphQL |
| Agentes y MCP | Agente de monitoreo, agente de reportes (texto y audio) y servidor MCP |
| Automatización | Flujos de n8n (bienvenida, recordatorios, escalamiento, reporte semanal, alertas y difusión) |
| Experiencia | Modo claro y oscuro con tokens de diseño e interfaz bilingüe español–inglés |

### Limitaciones

- **Pagos simulados.** Las recargas usan una pasarela simulada; no se procesan pagos con dinero real.
- **Sin integración académica.** No se conecta con sistemas de notas ni de registro universitario.
- **Sin mensajería directa, marketplace ni videollamadas.** Quedan como evolución futura.
- **Idiomas.** Solo español e inglés.
- **Entorno de demostración.** El despliegue en la nube corresponde a una demostración de bajo costo con un único nodo por proveedor; no incluye alta disponibilidad ni escalado automático.
- **IA local.** El modelo que corre en el teléfono es pequeño; su calidad es limitada frente a los modelos en la nube y requiere una *development build* de Expo (no funciona en Expo Go).
- **Modelos de lenguaje de los agentes.** El motor es intercambiable (Claude, un proveedor compatible con OpenAI y Ollama local); si no hay ninguno disponible, el sistema responde con un generador determinista y lo indica.
- **Plazo.** La entrega y defensa están fijadas para el 10 de noviembre de 2026.

## 1.6. Metodología de desarrollo ICONIX

@@include 02-iconix/00-metodologia-iconix.md section="^1\. Fases" demote=2 dropheading=1

### Reglas del diagrama de robustez

@@include 02-iconix/00-metodologia-iconix.md section="^2\. Reglas" demote=2

### Cómo se organizó la documentación de cada caso de uso

Cada caso de uso se documentó en un único archivo que crece fase a fase: la narrativa (fase de requisitos), el diagrama de robustez (análisis), los diagramas de secuencia y las clases involucradas (diseño) y las pruebas de aceptación (implementación). En este documento esas piezas se presentan agrupadas por tipo de artefacto, respetando el orden de los capítulos II a V.

## 1.7. Cumplimiento de los requisitos de la cátedra

La siguiente matriz relaciona cada requisito tecnológico y cada condición de la asignatura con el componente del sistema que lo cumple y con el documento donde se detalla. Esta sección se añadió al índice mínimo porque es la base de la defensa.

@@include 01-vision/cumplimiento-catedra.md section="^Tecnologías y criterios obligatorios" demote=1 dropheading=0

@@include 01-vision/cumplimiento-catedra.md section="^Condiciones" demote=1 dropheading=0
