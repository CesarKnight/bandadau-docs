# ADR-0024 — Despliegue multi-nube de los servicios de la SAGA (AWS · GCP · Azure)

- **Estado:** Aceptada (diseño; **no implementado**: `bandadau-infra/aws/` y los *override* de producción aún no existen)
- **Fecha:** 2026-10-29
- **Decisores:** Equipo Grupo 24 (Ing. Software II)
- **Reemplaza parcialmente a:** [ADR-0012](ADR-0012-infra-aws-ec2-compose.md) (solo el "un EC2" para los servicios de la SAGA; RDS, DynamoDB, S3 y CloudFront se mantienen)

## Contexto

La cátedra añadió una regla: los microservicios deben estar desplegados en **instancias distintas de
proveedores distintos** (uno en AWS, uno en GCP, uno en Azure; si hay un cuarto, va en AWS). La
funcionalidad con la que se demuestra la arquitectura de microservicios es la **SAGA de inscripción**
(condición C1): `events-service` → `wallet-service` → `ticketing-service`, tres servicios en tres
lenguajes. Decisión del equipo: la regla se demuestra con esos tres servicios.

Hasta ahora todo corría en un solo EC2 con Docker Compose (ADR-0012). Restricciones que siguen vigentes:
presupuesto ≤ USD 60/mes (RNF-18), entrega el 2026-11-10, *database per service* (regla 3 del workspace),
RabbitMQ como único canal de la SAGA (ADR-0002, ADR-0003) y paridad local ↔ nube "solo cambiando variables".

## Decisión

Cada servicio de la SAGA corre en **una VM propia con Docker Compose** en una nube distinta. Todo lo demás
y **todos los datos** permanecen en AWS.

| Nube | Qué corre | Lenguaje |
|---|---|---|
| **Azure** | `events-service` (orquestador de la SAGA) | Java 25 / Spring Boot 4 |
| **GCP** | `wallet-service` + `wallet-worker` + `wallet-relay` | PHP 8.4 / Laravel 12 |
| **AWS** (EC2 existente) | `ticketing-service` y el resto: identity, social, media, notification, insights, admin-gateway, Traefik, RabbitMQ, n8n, LGTM | TypeScript, Java, PHP |
| **AWS** (gestionados) | RDS PostgreSQL (`identity_db`, `events_db`, `wallet_db`), MongoDB, DynamoDB, S3, CloudFront, Route 53 | — |

Reglas que se derivan:

1. **Bases de datos solo en AWS.** `events-service` y `wallet-service` siguen usando *su* base y *su* usuario
   (`events_db`/`events`, `wallet_db`/`wallet`); solo cambia el host. No se crean Postgres en Azure ni GCP.
2. **RabbitMQ sigue siendo uno solo, en AWS**, expuesto por **AMQPS (5671)** con TLS y con el *security group*
   limitado a las IP fijas de las VMs de Azure y GCP. Se conservan los usuarios por servicio (ACL ya definidas
   en `definitions.json`); las contraseñas de producción son distintas a las de desarrollo.
3. **RDS accesible desde fuera de la VPC** (subredes públicas, `PubliclyAccessible=true`), con `sslmode=require`,
   `sg-db` abierto en 5432 **solo** a las tres IP de las VMs y un usuario por base. Esto modifica ADR-0012
   (RDS en subred privada) y es el principal punto de endurecimiento.
4. **DynamoDB desde otras nubes.** Ambos servicios usan la tabla `bandada-idempotency` (el Compose los hace
   depender de `dynamodb-init`). Cada nube recibe un **usuario IAM propio** con política mínima
   (`dynamodb:GetItem/PutItem/UpdateItem/DeleteItem/ConditionCheckItem/Query` sobre la tabla y con
   `dynamodb:LeadingKeys` = prefijo del servicio, `events#*` o `wallet#*`). Las llaves viven en un archivo `.env`
   `chmod 600` en la VM. Federación de identidad (OIDC) queda como mejora, no se hace en el semestre.
5. **Entrada pública sin cambios**: CloudFront → Traefik (AWS). Traefik gana *routers* hacia dos upstreams
   externos: `events-origin.<BASE_DOMAIN>` (`/api/v1/events`, `/registrations`) y `wallet-origin.<BASE_DOMAIN>`
   (`/api/v1/wallet`). Cada VM remota corre un proxy TLS (Traefik o Caddy con Let's Encrypt) que solo acepta la
   IP elástica de AWS y exige la cabecera secreta `X-Origin-Verify`, igual que el origen de CloudFront.
6. **Llamadas entre servicios (REST) cruzan nubes** y pasan a ser URLs públicas con token de servicio:
   - `events` y `wallet` → `identity` por **JWKS**, que es público (`https://api.<BASE_DOMAIN>/.well-known/jwks.json`).
   - `ticketing` → `events` (`EVENTS_SERVICE_URL`) y `admin-gateway`, `insights` y `n8n` → `events`/`wallet`
     (`/internal/v1/**`): salen de AWS hacia `*-origin`.
   - `events` → `media` (`COVER_CHECK`) necesitaría un token de servicio de identity, pero
     `/api/v1/auth/service-token` y `/internal/**` están bloqueados en el borde público. **En la demo se fija
     `COVER_CHECK=off` en events** (sin llamada a media ni token de servicio). Activarlo exigiría un *entrypoint*
     interno de Traefik abierto solo a las IP de Azure y GCP.
   `/internal/**` sigue bloqueado en el borde público, pero el proxy de cada VM remota lo deja pasar **solo**
   desde la IP de AWS y siempre con JWT `typ=service` (`INTERNAL_SCOPES_ENFORCED=true`).
7. **Imágenes** de `events-service` y `wallet-service` en **GHCR** (privado, token `read:packages` en la VM);
   el resto sigue en ECR. **Despliegue** a las VMs remotas por SSH desde GitHub Actions (clave dedicada);
   AWS sigue con SSM.
8. **Local no cambia**: `make up` levanta todo en un Compose. La multi-nube es solo del entorno de demo y se
   expresa únicamente con variables (`DATABASE_URL`, `RABBITMQ_URL`, `IDENTITY_URL`, `JWKS_URL`,
   `DYNAMODB_ENDPOINT` vacío, …). No se espera tocar código; **verificar** al implementar que ningún servicio
   asuma nombres de red de Docker fuera de esas variables.

## Alternativas consideradas

| Alternativa | Motivo de descarte |
|---|---|
| Repartir los **9** servicios en las 3 nubes | Triplica la superficie operativa sin demostrar nada más que la SAGA; riesgo alto a 12 días de la entrega. |
| Una base **por nube** (Postgres de `events` en Azure, de `wallet` en GCP) | Más fiel a "todo el servicio en su nube", pero exige 2 Postgres adicionales (costo o VMs a mantener, backups manuales) y sale del presupuesto. **Plan B** si la cátedra exige datos locales a cada nube. |
| Cloud Run / Azure Container Apps | Más ligeros de operar, pero la IP de salida cambia (no se puede poner en una lista de acceso de RDS/RabbitMQ sin NAT con IP fija) y el worker/relay de wallet debe estar siempre encendido. |
| Kubernetes multi-nube | Desproporcionado para el alcance. |
| VPN sitio a sitio entre nubes | Elimina la exposición pública de RDS/RabbitMQ, pero cuesta dinero y días de configuración. Mejora futura. |

## Consecuencias

- (+) Cumple la regla de la cátedra con la funcionalidad principal y tres lenguajes en tres nubes.
- (+) Mantiene datos, presupuesto y paridad local; cada servicio sigue desplegándose por separado
  (`docker compose pull && up -d --no-deps <svc>` en su VM).
- (+) El EC2 de AWS libera ≈ 1.3 GB de RAM (events 512 MB + wallet 3 × 256 MB): permite evaluar `t3.large`.
- (−) **Latencia entre nubes** (decenas de ms por consulta a RDS/RabbitMQ): la SAGA se alarga; los *timeouts*
  de la SAGA (`SAGA_STEP_TIMEOUT=PT30S`) deben seguir holgados. Medir en la primera prueba.
- (−) **Más puntos de falla y de seguridad**: RDS y RabbitMQ públicos con lista de IP, llaves IAM de larga
  duración fuera de AWS, tres sistemas de IP/firewall. Mitigación: TLS obligatorio, usuarios mínimos, rotación
  de claves tras la defensa.
- (−) **Salida de datos de AWS** se cobra; con tráfico de demo es marginal (verificar).
- (−) Hay que dar a las VMs remotas IP estática y DNS (`events-origin`, `wallet-origin`).
- (−) Tres consolas, tres cuentas, tres facturas: usar créditos gratuitos y apagar al terminar.

## Referencias

`05-infraestructura/infraestructura.md` §4.6, `05-infraestructura/guia-despliegue.md`,
`saga-inscripcion-evento.md`, `01-vision/cumplimiento-catedra.md` (C6), ADR-0002, ADR-0003, ADR-0012.
