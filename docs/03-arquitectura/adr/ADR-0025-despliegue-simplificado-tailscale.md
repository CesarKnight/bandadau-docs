# ADR-0025 — Despliegue simplificado: red privada Tailscale entre AWS, Azure y GCP

- **Estado:** Aceptada (diseño; **no desplegado**: los archivos están en `bandadau-infra/deploy/`, validados con `docker compose config`, sin ejecutar contenedores)
- **Fecha:** 2026-11-06
- **Decisores:** Equipo Grupo 24 (Ing. Software II)
- **Reemplaza parcialmente a:** [ADR-0024](ADR-0024-saga-multinube-aws-gcp-azure.md) (conectividad, acceso a datos, borde público, registro de imágenes y despliegue) y [ADR-0012](ADR-0012-infra-aws-ec2-compose.md) (RDS, CloudFront, S3 de estáticos, ECR/SSM/CloudWatch/CloudFormation)
- **Se mantiene de ADR-0024:** el reparto de servicios: `events-service` en Azure, `wallet-service` (+ worker y relay) en GCP, `ticketing-service` y el resto en AWS, y la condición C6.

## Contexto

ADR-0024 resolvió la regla multi-nube con **RDS accesible por internet**, **RabbitMQ por AMQPS 5671**, listas de IP, un proxy TLS (Caddy) en cada VM remota, un usuario IAM por nube, imágenes
repartidas entre ECR y GHCR y despliegue mixto (SSM y SSH). Al revisarlo en detalle (2026-11-06, a cuatro días de la entrega) quedó claro que era **más complejo de lo necesario**:

- exponía a internet dos servicios de datos (RDS y RabbitMQ) y exigía mantener listas de IP y certificados;
- necesitaba DNS y certificados para dos orígenes adicionales y un proxy por VM;
- partía de un supuesto que **no se cumple** (verificado en el código): `events-service` **no usa DynamoDB** (solo el Compose local le añade `depends_on: dynamodb-init`) y por tanto no necesita IAM. Además, los
  clientes de RabbitMQ de events (Spring) y wallet (php-amqplib) soportan `amqps://`, así que AMQPS era posible, pero con una red privada no hace falta.

Restricciones vigentes: entrega 2026-11-10, equipo pequeño que debe poder **explicar y repetir** el despliegue a mano, presupuesto ≤ USD 60/mes (RNF-18), *database per service* y SAGA por RabbitMQ.

## Decisión

1. **Red privada Tailscale** (WireGuard) con tres nodos: `bandada-aws`, `bandada-azure`, `bandada-gcp`. Tailscale se instala en el **host** de cada VM (`tailscale up --ssh`) y cada VM usa su IP `100.x`
   (`TS_IP_AWS`, `TS_IP_AZURE`, `TS_IP_GCP`). Las VMs de Azure y GCP **no abren ningún puerto público de entrada** (el acceso es Tailscale SSH).
2. **Todos los datos siguen en AWS**, ahora **como contenedores en el EC2** (igual que en local): PostgreSQL (3 bases), MongoDB (`rs0`), RabbitMQ, MinIO y Mailpit. Sin RDS. Los únicos puertos del EC2 que
   necesitan las nubes remotas se publican **enlazados solo a la IP Tailscale** del EC2: Postgres 5432, RabbitMQ 5672 (AMQP plano), identity 7001 (JWKS y token de servicio) y media 7003 (validación de portadas).
   El protocolo y las contraseñas por servicio (un usuario por servicio en RabbitMQ y Postgres) no cambian.
3. **events (Azure) y wallet (GCP)** publican su puerto (7004 / 7005) **solo en su IP Tailscale**. Traefik (EC2) los usa como *upstream* por `http://<TS_IP>:<puerto>`. `COVER_CHECK` queda en `on`: la llamada
   `events → media` y el token de servicio (`events → identity:7001`) viajan por la red privada, sin pasar por el borde público que bloquea `/internal/**` y `/api/v1/auth/service-token`.
4. **DynamoDB real** es la única pieza gestionada de AWS (requisito C4): 4 tablas creadas con `deploy/dynamodb-create.sh` desde `dynamodb/tables/*.json`, con TTL. Los servicios del EC2 usan el **rol de la
   instancia** (IMDS; requiere `HttpPutResponseHopLimit=2` para que lo alcancen los contenedores). **Solo wallet** necesita llaves: un **usuario IAM mínimo** con `dynamodb:LeadingKeys = wallet-service#*` sobre `bandada-idempotency`.
   events no usa DynamoDB y no recibe credenciales de AWS.
5. **Borde público único en el EC2:** Traefik termina TLS con **Let's Encrypt** (desafío HTTP-01, resolver `le`, configuración por *flags* en el Compose) y sirve las rutas de `deploy/traefik/routers.prod.yml`.
   Funciona con cualquier proveedor de DNS (registros A hacia la IP elástica; si no hay dominio, un DNS comodín gratuito como DuckDNS: *no verificado*). Se eliminan CloudFront, ACM, Route 53 obligatorios y OAC.
6. **Frontends estáticos** (landing, app web/PWA, panel y microfrontends) los sirve un contenedor **nginx** (`nginx:1.28-alpine`) desde una carpeta del EC2 (`SITES_DIR`), con un `server` por host.
   Desplegar un microfrontend = copiar su carpeta (`deploy/publish-static.sh mfe <dist> <nombre>`), sin tocar el *shell* ni el resto.
7. **Imágenes solo en GHCR** (un registro para las tres nubes) con etiqueta por servicio (`TAG_<SERVICIO>`, por defecto `IMAGE_TAG`). Se construyen para `linux/amd64` (`deploy/build-push.sh`; desde un Mac con
   Apple Silicon es emulado y lento). Alternativa: construir en GitHub Actions (no implementada).
8. **Un solo script de despliegue**: `deploy/deploy.sh <aws|azure|gcp> [servicio] [tag]` (SSH por Tailscale → `git pull` → `docker compose pull` → `up -d --no-deps` → espera de `healthy` → **rollback**
   automático al tag anterior si falla). Cada nube usa el `docker-compose.yaml` de la raíz más un override (`deploy/docker-compose.<nube>.yaml`); los secretos se generan una vez (`deploy/render-env.sh`) y se comparten
   entre nubes. Se eliminan SSM, ECR, CloudWatch, SES, Polly, EventBridge y CloudFormation de la demo.
9. **Local no cambia** (`make up`). **Producción no incluye** DynamoDB Local, `lgtm` ni `ollama`; el correo de la demo lo atrapa Mailpit detrás de usuario y clave.

## Alternativas consideradas

| Alternativa | Motivo de descarte |
|---|---|
| Mantener ADR-0024 (RDS público + AMQPS + listas de IP + Caddy) | Más piezas y más superficie expuesta para el mismo resultado |
| WireGuard "a mano" entre las 3 VMs | Sin cuenta de terceros, pero hay que gestionar claves y rutas a mano; Tailscale lo automatiza (se puede cambiar después sin tocar los Compose: solo cambian las IP) |
| VPN gestionada de cada nube (sitio a sitio) | Costo y días de configuración |
| Mantener RDS con Tailscale como *subnet router* | Añade una VM de salto y mantiene un servicio más a configurar |
| Postgres en cada nube (datos junto a su servicio) | Más motores, backups y costo; plan B si la cátedra exige datos en la nube del servicio |
| Kubernetes / Cloud Run / Container Apps | Ver `05-infraestructura/docker-y-justificacion-de-imagenes.md` §2 |

## Consecuencias

- (+) Cada VM remota usa **la misma imagen y casi las mismas variables que en local**; la diferencia es la IP de los datos.
- (+) **Ningún servicio de datos queda expuesto a internet**: Postgres, RabbitMQ y los puertos internos solo escuchan en la IP Tailscale; los únicos puertos públicos de la solución son 80 y 443 del EC2.
- (+) Menos servicios de AWS que aprender y pagar: EC2, IP elástica y DynamoDB.
- (+) Un único mecanismo (Compose + `deploy.sh`) en las tres nubes.
- (−) **Dependencia de Tailscale** (cuenta gratuita; si cae su plano de control, las conexiones existentes siguen, pero no se pueden añadir nodos). Mitigación: WireGuard directo.
- (−) **Punto único de falla** del EC2: Postgres, Mongo y RabbitMQ comparten host; sin backups gestionados (manuales con `pg_dump`/`mongodump`). Aceptado para la demo.
- (−) **Latencia entre nubes** en cada consulta de events y wallet; los *timeouts* de la SAGA (`SAGA_STEP_TIMEOUT=PT30S`) no se reducen. Medir en la primera prueba.
- (−) El tráfico de **contenedor a contenedor sobre Tailscale** (Docker → host → `tailscale0`) y la publicación de puertos en la IP Tailscale **no están verificados**; Tailscale debe estar activo antes que Docker
  (en `systemd`: `After=tailscaled.service`).
- (−) Rotar secretos exige regenerar `.env`/`definitions.json` y redesplegar.

## Correcciones a ADR-0024 y a la guía anterior

- events-service **no usa DynamoDB** y por tanto no necesita usuario IAM (solo wallet).
- AMQPS **no hace falta** con red privada (los clientes sí lo soportan: Spring `addresses=amqps://…`; php-amqplib `setIsSecure`).
- RDS accesible por internet y las listas de IP quedan **descartados**.
- `COVER_CHECK=off` ya **no** es necesario.

## Referencias

`bandadau-infra/deploy/README.md`, `05-infraestructura/guia-despliegue.md`, `05-infraestructura/docker-y-justificacion-de-imagenes.md`, `05-infraestructura/infraestructura.md` §4.6, ADR-0002, ADR-0003, ADR-0024.
