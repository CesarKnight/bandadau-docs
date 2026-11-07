# CAPÍTULO IV. DESARROLLO E IMPLEMENTACIÓN

## 4.1. Herramientas y tecnologías utilizadas

### 4.1.1. Tecnologías por capa

| Capa | Tecnología | Versión | Uso en Bandada U |
|---|---|---|---|
| Microservicios Java | Java + Spring Boot | Java 25, Spring Boot 4 | `identity-service` (Hexagonal) y `events-service` (DDD, orquestador de la SAGA); migraciones con Flyway; pruebas de arquitectura con ArchUnit |
| Microservicios TypeScript | NestJS | 11 (Node 24) | `social`, `media`, `ticketing`, `insights` y `admin-gateway`; pruebas de arquitectura con dependency-cruiser |
| Microservicios PHP | Laravel | 12 (PHP 8.4) | `wallet-service` (Hexagonal) y `notification-service` (Clean); pruebas de arquitectura con Deptrac |
| API del panel | Apollo Server + `graphql-ws` | — | BFF GraphQL con consultas, mutaciones y subscripciones |
| Aplicación móvil y web | Expo (React Native) | SDK 57 | iOS, Android y PWA con `expo-router`; cola sin conexión; IA local |
| Landing | Next.js | 16 (exportación estática), Tailwind v4 | Sitio público |
| Panel | Next.js 16 + Angular 21 + React 19 (Vite) | — | Shell y microfrontends como Web Components |
| Paquetes compartidos | `@bandada/*` | — | Tokens de diseño, i18n, tipos de contratos, mensajería, idempotencia y autenticación |
| Bases de datos | PostgreSQL, MongoDB, DynamoDB | 18, 8.0, servicio de AWS | Una base por servicio (sección 3.5) |
| Mensajería | RabbitMQ | 4 | Eventos, comandos y respuestas de la SAGA; cuatro colas de reintento y *dead letter* por cola |
| API Gateway | Traefik | v3 | Enrutamiento por prefijo, CORS, límite de tasa, bloqueo de `/internal` |
| Almacenamiento de objetos | MinIO (compatible con S3) | — | Medios de usuario, audios y modelos ONNX; en nube pública se puede sustituir por S3 |
| Automatización | n8n | 2 | Siete flujos versionados en git, disparados por RabbitMQ y por cron |
| IA y ML | ONNX Runtime, Python, ExecuTorch, WebLLM, modelos de lenguaje intercambiables | — | Moderación de imágenes y video (NSFW), asistente sin conexión, agentes y reportes |
| Protocolo de agentes | Model Context Protocol (MCP) | Streamable HTTP | 20 herramientas para agentes internos y clientes externos |
| Observabilidad | OpenTelemetry + Grafana LGTM | — | Trazas, métricas y logs; tableros y alertas aprovisionados en archivos |
| Contenedores | Docker y Docker Compose | — | Un artefacto por servicio, el mismo en local y en nube (sección 4.1.2) |
| Red entre nubes | Tailscale (WireGuard) | — | Red privada cifrada entre AWS, Google Cloud y Azure |
| Nubes | AWS, Google Cloud, Azure | — | Una VM por proveedor y DynamoDB en AWS |
| Integración continua | GitHub Actions | — | Un flujo por repositorio: lint, pruebas, arquitectura y contratos |
| Contratos | OpenAPI 3.1, AsyncAPI 3.0, GraphQL SDL, esquemas MCP | — | Se escriben antes que el código (*contract-first*); se validan con Spectral, AsyncAPI CLI y graphql-inspector |
| Documentación | Markdown + Mermaid, ADRs | — | Fuente de verdad en `bandadau-docs` |

### 4.1.2. Por qué Docker y cuál es el papel de cada imagen

@@include 05-infraestructura/docker-y-justificacion-de-imagenes.md demote=2

## 4.2. Diseño de la arquitectura del sistema

### 4.2.1. Vista de contenedores

@@include 03-arquitectura/arquitectura-general.md section="^2\. Contenedores" demote=2

### 4.2.2. Catálogo de microservicios

@@include 03-arquitectura/catalogo-servicios.md section="^1\. Backend" demote=2

### 4.2.3. Mapa de contextos (DDD estratégico)

@@include 03-arquitectura/arquitectura-general.md section="^3\. Mapa de contextos" demote=2

### 4.2.4. Estilos de comunicación y patrones transversales

@@include 03-arquitectura/arquitectura-general.md section="^4\. Estilos" demote=2

@@include 03-arquitectura/arquitectura-general.md section="^5\. Patrones" demote=2

### 4.2.5. Enrutamiento del API Gateway

@@include 03-arquitectura/catalogo-servicios.md section="^4\. Enrutamiento" demote=2

### 4.2.6. Seguridad

@@include 03-arquitectura/seguridad-y-sso.md section="^1\. Panorama" demote=2

@@include 03-arquitectura/seguridad-y-sso.md section="^3\. Contraseñas" demote=2

@@include 03-arquitectura/seguridad-y-sso.md section="^4\. Refresh" demote=2

@@include 03-arquitectura/seguridad-y-sso.md section="^6\. Autorización" demote=2

@@include 03-arquitectura/seguridad-y-sso.md section="^9\. Checklist OWASP" demote=2

### 4.2.7. Repositorios del proyecto

@@include 03-arquitectura/arquitectura-general.md section="^6\. Repositorios" demote=2

## 4.3. Implementación de la base de datos

La inicialización de los datos está automatizada y es idempotente: se puede repetir sin efectos. Cada servicio crea sus propios esquemas con migraciones (Flyway en los servicios Java, migraciones de Laravel en billetera, índices de MongoDB al arrancar), mientras que la infraestructura solo crea las bases, los usuarios, los buckets, las tablas y la topología de mensajería.

@@include 05-infraestructura/infraestructura.md section="^2\.8 Inicialización" demote=-1

## 4.4. Desarrollo de los módulos del sistema

### 4.4.1. Resumen de módulos y su estado

| Módulo | Repositorio | Tecnología | Arquitectura | Casos de uso | Estado |
|---|---|---|---|---|---|
| Identidad | `bandadau-backend/services/identity-service` | Java 25, Spring Boot 4 | Hexagonal | UC-01, 02, 03, 21 | Implementado |
| Social | `…/social-service` | NestJS 11, MongoDB | Clean | UC-04 a UC-10 | Implementado |
| Multimedia | `…/media-service` | NestJS 11, MongoDB, MinIO/S3, ONNX | Clean | UC-05, 18 | Implementado (moderación manual o automática con el clasificador ONNX) |
| Eventos | `…/events-service` | Java 25, Spring Boot 4, PostgreSQL | DDD | UC-11, 12, 13 | Implementado |
| Billetera | `…/wallet-service` | PHP 8.4, Laravel 12, PostgreSQL | Hexagonal | UC-12, 13, 15, 16 | Implementado |
| Entradas | `…/ticketing-service` | NestJS 11, DynamoDB | Clean | UC-12, 13, 14 | Implementado |
| Notificaciones | `…/notification-service` | PHP 8.4, Laravel 12, DynamoDB | Clean | UC-24 | Implementado (Web Push probado con servicio simulado) |
| Insights | `…/insights-service` | NestJS 11, DynamoDB | Clean | UC-19, 20, 22 | Implementado (agentes, MCP, reportes) |
| Gateway del panel | `…/admin-gateway` | NestJS 11, Apollo | Capas | UC-18, 20, 21 | Implementado |
| App móvil y web | `bandadau-frontend` | Expo SDK 57 | Funcional por rutas | UC-01 al 17, 24 | Implementado |
| Landing | `bandadau-landing` | Next.js 16 | — | UC-01 (entrada), UC-11 (eventos públicos) | Implementado |
| Panel | `bandadau-admin` | Next.js 16, Angular 21, React 19 | Shell + microfrontends | UC-18 a UC-21 | Implementado |
| Paquetes compartidos | `bandadau-shared` | TypeScript | — | transversal | Implementado |
| Modelos de ML | `bandadau-ml` | Python, ONNX | — | UC-05, UC-18 | Pipeline reproducible y evaluación con umbral de *recall* |
| Infraestructura | `bandadau-infra` | Docker Compose, Traefik, scripts | — | transversal | Implementado en local; despliegue multi-nube documentado y con archivos de despliegue |

### 4.4.2. Descripción de los módulos

**Identidad (`identity-service`).** Registra usuarios con correo institucional (el dominio debe pertenecer a una universidad habilitada) y los verifica con un código de seis dígitos válido 15 minutos con un máximo de cinco intentos. Autentica con contraseña almacenada con Argon2id, emite un token de acceso RS256 de 15 minutos y un refresh token rotativo de 30 días con detección de reutilización, y publica las llaves públicas por JWKS para que los demás servicios validen los tokens sin llamar a identidad. Implementa el código de traspaso (*handoff*) de un solo uso para saltar de la app al panel, gestiona roles y universidades y aplica límite de tasa distribuido en PostgreSQL (ADR-0019).

**Social (`social-service`).** Perfiles académicos, publicaciones (texto, hasta cuatro imágenes o un video), feed paginado por cursor que combina seguidos, grupos y recomendados, comentarios con respuestas, reacciones, grafo de seguimiento, grupos de estudio públicos y privados y denuncias (tres denuncias distintas ocultan el contenido hasta su revisión). Toda creación acepta `Idempotency-Key` y publica sus eventos con el patrón *transactional outbox* sobre MongoDB.

**Multimedia (`media-service`).** Entrega URLs prefirmadas para subir y descargar medios sin pasar los bytes por el servicio, verifica el tipo real del archivo por sus primeros bytes y clasifica imágenes y fotogramas de video con un modelo ONNX (clasificador NSFW basado en un transformador de visión). Cada resultado guarda la versión del modelo. El contenido marcado queda oculto hasta la revisión de un moderador.

**Eventos (`events-service`).** Modelado con DDD táctico: el agregado `Event` controla el cupo y la `Registration` garantiza una sola inscripción activa por estudiante y evento mediante un índice parcial único. Es el **orquestador de la SAGA**: mantiene la `SagaInstance`, emite comandos mediante *outbox*, consume las respuestas con *inbox*, reintenta con retroceso, aplica timeouts de 30 segundos por paso y ejecuta las compensaciones en orden inverso.

**Billetera (`wallet-service`).** Arquitectura hexagonal en PHP. Mantiene un libro de movimientos (`LedgerEntry`) con referencia de operación única, de modo que un débito o un reembolso repetido no se aplica dos veces, y el saldo siempre es igual a la suma firmada de sus movimientos. Las recargas pasan por una pasarela simulada con *webhook* firmado con HMAC, ventana antiguo-repetición y acreditación única por pago. Corre como tres procesos de la misma imagen: servicio web, consumidor de comandos y relé del *outbox*.

**Entradas (`ticketing-service`).** Emite un ticket por inscripción con una escritura transaccional condicional en DynamoDB, firma el código QR con ES256 (las llaves públicas se publican para verificación externa) y valida cada entrada una sola vez en la puerta, solo por el organizador del evento o su personal.

**Notificaciones (`notification-service`).** Consume los eventos de dominio y entrega notificaciones dentro de la aplicación, por correo y por push (Expo y Web Push), respetando las preferencias del usuario y agrupando las repetidas.

**Insights (`insights-service`).** Aloja el agente de monitoreo (cada cinco minutos revisa salud de servicios, SAGAs fallidas, colas de mensajes fallidos y anomalías) y el agente de reportes, que responde preguntas en lenguaje natural con texto, datos y, opcionalmente, audio. Expone el servidor MCP con 20 herramientas de solo lectura. El motor de lenguaje es intercambiable con cadena de respaldo (proveedor externo, Ollama local o generador determinista) y los nombres de usuarios se seudonimizan antes de salir a un proveedor externo.

**Gateway del panel (`admin-gateway`).** BFF GraphQL con esquema primero, autorización por directiva `@auth` según el rol, *DataLoader* para evitar consultas repetidas y *subscriptions* por WebSocket alimentadas por RabbitMQ.

**Aplicación móvil y web (`bandadau-frontend`).** Una sola base de código para iOS, Android y web instalable. Incluye modo sin conexión con cola de publicaciones que se sincroniza sin duplicar (gracias a identificadores generados en el cliente y claves de idempotencia), asistente de estudio que corre en el dispositivo, escáner de entradas con cámara, modo claro y oscuro y textos en español e inglés.

**Panel (`bandadau-admin`).** El *shell* de Next.js carga en tiempo de ejecución, desde un manifiesto, los microfrontends **Moderación** (Angular 21) e **Insights** (React 19), cada uno empaquetado como Web Component con su propio ciclo de despliegue.

**Paquetes compartidos (`bandadau-shared`).** Tokens de diseño en formato DTCG con contraste AA verificado, i18n con ICU MessageFormat, tipos generados desde los contratos, y librerías de mensajería, idempotencia y autenticación que implementan los patrones una sola vez.

## 4.5. Integración de componentes

### 4.5.1. SAGA de inscripción a evento

@@include 03-arquitectura/saga-inscripcion-evento.md section="^1\. Resumen" demote=2

@@include 03-arquitectura/saga-inscripcion-evento.md section="^2\. Orquestación" demote=2

@@include 03-arquitectura/saga-inscripcion-evento.md section="^4\. Máquinas de estado" demote=2

@@include 03-arquitectura/saga-inscripcion-evento.md section="^8\. Tabla de compensaciones" demote=2

@@include 03-arquitectura/saga-inscripcion-evento.md section="^11\. Timeouts" demote=2

### 4.5.2. Mensajería con RabbitMQ y CloudEvents

@@include 03-arquitectura/eventos-y-mensajeria.md section="^1\. Principios" demote=2

@@include 03-arquitectura/eventos-y-mensajeria.md section="^2\. Topología" demote=2

@@include 03-arquitectura/eventos-y-mensajeria.md section="^3\. Sobre CloudEvents" demote=2

### 4.5.3. Idempotencia de extremo a extremo

@@include 03-arquitectura/idempotencia.md section="^1\. Los cinco mecanismos" demote=2

### 4.5.4. Panel de administración: GraphQL y microfrontends

@@include 03-arquitectura/graphql-admin.md section="^1\. Rol del gateway" demote=2

@@include 03-arquitectura/microfrontends.md section="^1\. Decisión" demote=2

@@include 03-arquitectura/microfrontends.md section="^2\. `mfe-manifest" demote=2

@@include 03-arquitectura/microfrontends.md section="^10\. Versionado" demote=2

### 4.5.5. Agentes, MCP y automatización

@@include 03-arquitectura/mcp.md section="^1\. Qué es MCP" demote=2

@@include 03-arquitectura/mcp.md section="^3\. Autenticación" demote=2

### 4.5.6. Observabilidad

@@include 03-arquitectura/observabilidad.md section="^1\. Arquitectura" demote=2

### 4.5.7. Integración continua

Cada repositorio tiene su propio flujo de GitHub Actions (`ci.yml`) copiado de las plantillas de `bandadau-infra/ci/templates`. El backend separa los trabajos de Node, Java y PHP; cada uno ejecuta formato, análisis estático, pruebas unitarias y de integración y las pruebas de arquitectura (ArchUnit, dependency-cruiser, Deptrac). El repositorio de documentación valida los contratos (Spectral para OpenAPI, AsyncAPI CLI, graphql-inspector y ajv para MCP) y los enlaces. El repositorio de infraestructura valida los archivos de Compose y levanta el perfil de infraestructura real con `make check-infra`; el recorrido completo (pila, datos de demostración y prueba de humo) se ejecuta de forma manual o programada.

## 4.6. Despliegue en la nube

Esta sección se añadió al índice mínimo porque la regla de la asignatura exige desplegar los microservicios en proveedores distintos. Los tres servicios de la SAGA se reparten entre **Azure** (`events-service`), **Google Cloud** (`wallet-service` con sus procesos auxiliares) y **AWS** (`ticketing-service`, el resto de los servicios y los datos). Una red privada Tailscale une las tres máquinas, de modo que ningún puerto interno se expone a internet.

@@include 05-infraestructura/infraestructura.md section="^4\.6" demote=-2
