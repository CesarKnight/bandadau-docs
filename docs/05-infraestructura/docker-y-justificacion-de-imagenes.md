# Docker, Compose e imágenes — justificación

> **Estado (2026-11-06).** Las versiones, los límites de memoria y los *healthchecks* salen de `bandadau-infra/docker-compose.yaml` y de los `Dockerfile` de
> `bandadau-backend/services/*` (leídos, no medidos: **no se midieron tamaños de imagen ni consumo real de RAM**; los "MB" son el límite `mem_limit` del Compose).
> La columna "AWS / Azure / GCP" describe el diseño de ADR-0025 (aún sin desplegar). Este documento está escrito para pegarse en los apartados 4.1 (herramientas) y 4.2 (arquitectura)
> del entregable.

## 1. Por qué Docker

| Problema del proyecto | Cómo lo resuelve Docker |
|---|---|
| **Tres stacks en 9 servicios** (Java 25 + Spring Boot, TypeScript + NestJS, PHP 8.4 + Laravel) con tres runtimes, tres gestores de paquetes y tres formas de arrancar | Cada servicio se entrega como **una imagen** con su runtime dentro. Quien despliega no instala Java, Node ni PHP: solo necesita `docker`. Todos los servicios se arrancan igual (`docker compose up`) |
| **Cinco motores de datos y mensajería** (PostgreSQL, MongoDB con réplica, DynamoDB, RabbitMQ, MinIO) más n8n | Cada motor es una imagen oficial con versión fijada. Levantar el entorno completo en una laptop son 4 comandos, no una guía de instalación de media docena de productos |
| **"En mi máquina funciona"** | El mismo artefacto (la imagen) corre en la laptop, en AWS, en Azure y en GCP. Lo único que cambia entre entornos son **variables de entorno** (URLs, contraseñas), nunca el código ni la imagen |
| **Despliegue independiente** (la razón de tener microservicios) | Cambiar `events-service` es publicar una imagen nueva y reiniciar **solo** ese contenedor. Los demás siguen sirviendo; los mensajes pendientes esperan en RabbitMQ (colas *quorum* durables) |
| **Aislamiento** | Un contenedor por proceso, con límite de memoria, usuario sin privilegios y *healthcheck*: si un servicio se cuelga, se reinicia solo (`restart: unless-stopped`) sin afectar al resto del host |
| **Reproducir errores** | Los tests de integración usan los mismos motores (Testcontainers) y la SAGA se prueba inyectando fallos en un contenedor (`CHAOS_TICKETING_FAIL=true`) |

## 2. Por qué Docker Compose y no otra cosa

| Alternativa | Por qué no |
|---|---|
| **Kubernetes** (EKS, AKS, GKE) | Orquesta cientos de réplicas con autoescalado; aquí hay **una réplica por servicio** y 3 VMs. Su costo operativo (control plane, redes, manifiestos, Ingress) supera al del propio producto, y EKS/AKS/GKE cobran por el clúster antes de correr nada. El presupuesto objetivo es ≤ USD 60/mes (RNF-18) |
| **ECS Fargate / Cloud Run / Container Apps** | Más cómodos, pero cada nube tiene el suyo: tres formas distintas de definir lo mismo. Con Compose, **un solo formato** vale para las tres nubes y para local. Además, el *worker* y el *relay* de wallet deben estar siempre encendidos (no escalan a cero) |
| **PaaS (Render, Fly, Heroku)** | No cumplen la regla de la cátedra de repartir los servicios entre AWS, Azure y GCP, ni dan DynamoDB nativo |
| **Instalar todo a mano en la VM** | No es repetible ni reversible; imposible hacer *rollback* de un servicio sin tocar el resto |
| **Docker Compose** ✅ | Un archivo declarativo por entorno, `up -d --no-deps <servicio>` para despliegues independientes, `depends_on` con condiciones de salud, perfiles (`infra`, `services`, `observability`, `llm`) y el mismo archivo en local y producción |

**Límite asumido:** Compose no autoescala ni reparte carga entre hosts. Para la demo de la cátedra (una instancia por servicio) no hace falta; si un servicio necesitara escalar, la imagen ya está
lista para llevarse a un orquestador sin cambios.

## 3. Las imágenes de los servicios (las escribimos nosotros)

Cada servicio tiene su `Dockerfile` en su propio repositorio (`bandadau-backend/services/<x>/Dockerfile`). Patrón común, que explica por qué las imágenes son pequeñas y seguras:

1. **Multi-etapa**: una etapa de *build* (con compiladores y dependencias de desarrollo) y una de *runtime* que solo copia el resultado. Las herramientas de compilación no viajan a producción.
2. **Usuario sin privilegios** (`bandada` en Java, `node` en Node, `app` en PHP): si el proceso es comprometido, no es `root` dentro del contenedor.
3. **`HEALTHCHECK` obligatorio** a `GET /health/ready` (verifica base de datos y broker): Compose y los scripts de despliegue esperan a que el servicio esté `healthy` antes de darlo por bueno y hacen *rollback* si no lo está.
4. **Versión de runtime fija por etapa** (`node:24-slim`, `eclipse-temurin:25-jre`, `php:8.4-fpm-alpine`), y para PHP un `tini` como PID 1 para reenviar señales y evitar procesos zombi.

| Servicio | Stack · arquitectura de código | Base del runtime (build → runtime) | Usuario | Límite RAM | Dónde corre |
|---|---|---|---|---|---|
| `identity-service` | Java 25 · Spring Boot 4 · Hexagonal | `gradle:9-jdk25` → `eclipse-temurin:25-jre` | `bandada` | 512 MB | local · **AWS** |
| `events-service` | Java 25 · Spring Boot 4 · DDD | `gradle:9-jdk25` → `eclipse-temurin:25-jre` | `bandada` | 512 MB | local · **Azure** |
| `wallet-service` (+ `wallet-worker`, `wallet-relay`: misma imagen, otro `command`) | PHP 8.4 · Laravel 12 · Hexagonal | `php:8.4-fpm-alpine` (etapas `base`/`vendor`/`runtime`; nginx + php-fpm + supervisord) | `app` | 256 MB × 3 | local · **GCP** |
| `notification-service` (+ worker y relay) | PHP 8.4 · Laravel 12 · Clean | `php:8.4-fpm-alpine` (igual que wallet) | `app` | 256 MB × 3 | local · **AWS** |
| `social-service` | TypeScript · NestJS 11 · Clean | `node:24-slim` | `node` | 256 MB | local · **AWS** |
| `media-service` | TypeScript · NestJS 11 · Clean (+ onnxruntime, ffmpeg) | `node:24-slim` | `node` | 1 GB (256 MB sin moderación ONNX) | local · **AWS** |
| `ticketing-service` | TypeScript · NestJS 11 · Clean | `node:24-slim` (etapas `shared-build`/`build`/`prod-deps`/`runtime`) | `node` | 256 MB | local · **AWS** |
| `insights-service` | TypeScript · NestJS 11 · Clean (agentes + servidor MCP) | `node:24-slim` (igual que ticketing) | `node` | 384 MB | local · **AWS** |
| `admin-gateway` | TypeScript · NestJS 11 + Apollo (GraphQL) | `node:24-slim` (igual que ticketing) | `node` | 256 MB | local · **AWS** |

**Por qué una imagen con tres roles en PHP** (wallet y notification): Laravel necesita, además del servidor web, un *consumidor* de RabbitMQ y un *relay* del outbox que corren como
procesos de larga vida. En vez de construir tres imágenes, se construye una y se arranca con tres comandos distintos: se garantiza que los tres ejecutan **exactamente el mismo código**.

**Por qué las imágenes de servicios Node comparten `bandadau-shared`**: los paquetes `@bandada/*` (tokens, i18n, contratos) se inyectan como contexto adicional de construcción (`--build-context shared=…`), no se publican en un registro de paquetes.

**Dónde se guardan:** en **GHCR** (GitHub Container Registry) para las tres nubes — un solo registro (con cuota gratuita de GitHub), sin atar el despliegue a ECR/ACR/Artifact Registry.
Se construyen para `linux/amd64` (las VMs son x86-64).

## 4. Las imágenes de infraestructura (no las escribimos: usamos oficiales con versión fija)

Regla del proyecto: **nunca `latest`**; la versión exacta evita que un `docker pull` cambie el comportamiento sin avisar.

| Imagen (versión) | Para qué sirve | Por qué esta y no otra | Local | AWS | Azure | GCP | Límite RAM | Reemplazo / nota en producción |
|---|---|---|:-:|:-:|:-:|:-:|---|---|
| `traefik:v3.7.14` | Puerta de entrada: enruta `api.*` por prefijo hacia cada servicio, CORS, límite de tasa, bloquea `/internal/**`; en producción termina TLS (Let's Encrypt) | Configuración por archivos recargables, sin código; entiende rutas por `Host` y prefijo y WebSockets (GraphQL). Alternativas: Nginx (más manual para rutas dinámicas), Kong/Apigee (pesados), ALB (cuesta y ata a AWS) | ✔ | ✔ | — | — | 128 MB | Con ACME propio reemplaza a CloudFront + ACM + Route 53 obligatorios |
| `nginx:1.28-alpine` | Sirve los frontends estáticos (landing, app web/PWA, panel, microfrontends) por host | Un solo contenedor ligero y estándar; el despliegue de un microfrontend es copiar su carpeta | — | ✔ | — | — | 64 MB | Reemplaza a S3 + CloudFront de los estáticos. En local los frontends corren con `pnpm dev` |
| `postgres:18.6` | Base relacional de identity, events y wallet (una instancia, 3 bases, 3 usuarios) | Transacciones ACID e índices parciales únicos que la SAGA y la idempotencia necesitan; el motor exigido por la cátedra para 3 servicios | ✔ | ✔ | — | — | 384 MB | **Sin RDS**: contenedor en el EC2 (ADR-0025); Azure y GCP lo alcanzan por Tailscale. Backup manual con `pg_dump` |
| `mongo:8.0.19` (fijada) | Base documental de social y media, con réplica `rs0` de 1 nodo | Perfiles flexibles/posts; la réplica es necesaria para transacciones y outbox. Fijada a 8.0.19 porque 8.0.21+ aborta en kernels Linux ≥ 6.19 (SERVER-121912) | ✔ | ✔ | — | — | 512 MB | Alternativa descartada: Atlas (otra cuenta y proveedor) |
| `amazon/dynamodb-local:3.3.1` | DynamoDB simulado para desarrollo | Misma API que AWS: los mismos JSON de tablas valen en producción | ✔ | — | — | — | 384 MB | **Se reemplaza por DynamoDB real** (requisito de la cátedra; única pieza gestionada de AWS) |
| `amazon/aws-cli:2.38.0` | Contenedor de un solo uso que crea las tablas de DynamoDB Local | Reutiliza el CLI oficial en un script idempotente | ✔ | — | — | — | — | En producción: `deploy/dynamodb-create.sh` desde tu máquina |
| `rabbitmq:4.2.9-management` | Broker de eventos y comandos de la SAGA (colas *quorum*, reintentos con espera, DLQ) | Entrega garantizada, enrutamiento por *topic* y consola de administración; Kafka sería excesivo para este volumen | ✔ | ✔ | — | — | 640 MB | Un solo broker, en el EC2; los servicios de Azure y GCP se conectan por Tailscale |
| `pgsty/minio:RELEASE.2026-08-04T00-00-00Z` | Almacenamiento de objetos compatible con S3 (media, audios de reportes, modelos) | `minio/minio` oficial dejó de publicarse; esta bifurcación trae `mc` y `curl`. Misma API S3 que usan los servicios | ✔ | ✔ | — | — | 256 MB | Se mantiene en producción para no depender de más piezas de AWS; S3 real es una mejora futura |
| `axllent/mailpit:v1.31.5` | Servidor SMTP de pruebas con bandeja web (códigos de verificación, correos de notificación) | Atrapa todos los correos sin enviarlos: ideal para demo y desarrollo | ✔ | ✔ | — | — | 128 MB | En la demo hace de buzón (detrás de usuario y clave); un SMTP real (SES) es una mejora |
| `n8nio/n8n:2.43.5` | Automatización: recordatorios, difusión de eventos, alertas (workflows versionados en git) | Requisito de la cátedra (T10); editor visual y disparo por RabbitMQ/cron | ✔ | ✔ | — | — | 1 GB | SQLite propia en volumen |
| `grafana/otel-lgtm:0.36.0` | Observabilidad todo-en-uno (Grafana, Loki, Tempo, Prometheus, colector OpenTelemetry) | Una sola imagen para trazas, métricas y logs con dashboards precargados | opcional (`make up-obs`) | — | — | — | 1.5 GB | **No se despliega** en la demo (apagado por defecto) |
| `ollama/ollama:0.40.5` | LLM local para el agente de reportes (perfil `llm`) | Permite probar agentes sin API de pago | opcional | — | — | — | 4 GB | **No se despliega**: producción usa el motor `stub`/OpenCode/Claude por variable |
| `alpine/socat:1.8.1.3` | Proxy TCP temporal de `make host S=<svc>` (correr un servicio en el IDE) | Diminuto; solo desarrollo | bajo demanda | — | — | — | — | — |
| **Tailscale** (instalado en el *host*, no es contenedor) | Red privada cifrada (WireGuard) entre las 3 VMs | Evita exponer Postgres/RabbitMQ a internet, certificados TLS por servicio y listas de IP; gratis para este uso | — | ✔ | ✔ | ✔ | — | Instalado con el script oficial en cada VM |

## 5. Qué corre en cada lugar (ADR-0024 y ADR-0025)

| Lugar | Contenedores |
|---|---|
| **Local** (`make up`) | Todo: `infra` (traefik, postgres, mongo + init, dynamodb-local + init, rabbitmq, minio + init, mailpit, n8n) + `services` (los 9) |
| **AWS** (EC2) | traefik, nginx, postgres, mongo, rabbitmq, minio, mailpit, n8n · identity, social, media, ticketing, notification (+worker, +relay), insights, admin-gateway · *DynamoDB real* |
| **Azure** (VM) | `events-service` |
| **GCP** (VM) | `wallet-service`, `wallet-worker`, `wallet-relay` |

## 6. Qué se simplificó respecto del diseño inicial de AWS (ADR-0012)

| Pieza del diseño inicial | Decisión | Motivo |
|---|---|---|
| RDS PostgreSQL | Postgres en contenedor en el EC2 | Sin base pública ni TLS que configurar; Tailscale ya cifra |
| CloudFront + ACM + Route 53 + OAC (5 distribuciones) | Traefik con Let's Encrypt + nginx | Una pieza menos que aprender y pagar; funciona con cualquier DNS |
| S3 para estáticos | Carpeta servida por nginx | Desplegar un microfrontend = copiar su carpeta |
| ECR, SSM Parameter Store, Secrets Manager, CloudWatch, SES, Polly, EventBridge, CloudFormation | Fuera de la demo | Un script (`deploy.sh`) y archivos `.env` generados bastan para 3 VMs |
| Un EC2 con los 9 servicios | 3 VMs (regla multi-nube de la cátedra) | Cumple C6 con los servicios de la SAGA |
| Listas de IP, AMQPS, RDS público (ADR-0024) | Red privada Tailscale | Menos superficie expuesta y menos configuración |

**Lo que sigue siendo AWS:** una VM, la IP elástica y **DynamoDB** (4 tablas, más un usuario IAM mínimo para wallet).

## 7. Límites y deuda conocida

- Sin medir: tamaño de las imágenes, tiempo de construcción para `linux/amd64` desde un Mac con Apple Silicon (emulado), consumo real de RAM.
- Postgres, Mongo y RabbitMQ en un solo EC2 son un **punto único de falla** (aceptado para la demo); los backups son manuales.
- Las contraseñas viven en archivos `.env` de las VMs (permisos 600); no hay gestor de secretos.
