# Guía de despliegue — Bandada U (AWS + GCP + Azure)

> **Estado: procedimiento de diseño, NO verificado.** Describe cómo desplegar según [ADR-0024](../03-arquitectura/adr/ADR-0024-saga-multinube-aws-gcp-azure.md).
> No existen todavía `bandadau-infra/aws/` ni los *override* de producción: esta guía los hace **a mano** para que el equipo entienda cada pieza.
> Los comandos de `aws`, `az` y `gcloud` son los habituales, pero **confirma cada uno con `--help`** antes de ejecutarlo (las CLIs cambian).
> Los puntos marcados **⚠ Verificar** son supuestos que hay que comprobar en la primera prueba. Al terminar, anota lo que difiera en `06-plan/registro-de-sesiones.md`.

Para el entorno local, ver [guia-levantamiento-local.md](guia-levantamiento-local.md).

## 0. Mapa de lo que vas a construir

| Dónde | Qué | Por qué ahí |
|---|---|---|
| AWS | EC2 con Compose (Traefik, ticketing, identity, social, media, notification, admin-gateway, RabbitMQ, Mongo, n8n) | Es el nodo central y el de ADR-0012 |
| AWS | RDS PostgreSQL (3 bases), DynamoDB, S3, CloudFront, Route 53 | Todos los datos |
| Azure | VM con `events-service` + proxy TLS | Regla de la cátedra (C6) |
| GCP | VM con `wallet-service` + worker + relay + proxy TLS | Regla de la cátedra (C6) |

Orden recomendado (cada paso depende del anterior): **1** AWS base → **2** datos → **3** IAM → **4** VMs remotas → **5** RabbitMQ y Traefik → **6** servicios remotos → **7** verificación → **8** demo.

Dominio de ejemplo: `bandadau.com` (variable `BASE_DOMAIN`). Región AWS: `us-east-1`; Azure: `eastus`; GCP: `us-east4` (cerca de AWS para bajar la latencia).

## 1. Requisitos previos

- Cuentas con créditos: AWS, Google Cloud, Azure. Un dominio propio (o subdominio) con DNS editable.
- CLIs: `aws`, `az`, `gcloud`, `docker`, `gh` y `ssh`. Ejecuta `aws configure`, `az login`, `gcloud auth login`.
- Los 8 repos como carpetas hermanas y las imágenes construibles (`make build S=<svc>` en `bandadau-infra`).
- Un token de GitHub con `write:packages` (para publicar en GHCR) y otro con `read:packages` (para las VMs).
- Anota en un archivo **fuera de git** (gestor de contraseñas) todas las contraseñas y llaves que generes.

### 1.1 Comprobaciones antes de empezar (⚠ Verificar, evitan días de trabajo)

1. **RabbitMQ con TLS desde cada cliente.** `events-service` (Spring AMQP) y `wallet-service` (Laravel, php-amqplib) leen `RABBITMQ_URL`. Comprueba que aceptan `amqps://…:5671`
   y que el cliente PHP abre una conexión SSL. Si el de PHP no lo soporta sin cambios, usa un túnel TLS (p. ej. `stunnel` en la VM de GCP apuntando a `mq.<BASE_DOMAIN>:5671`)
   y deja `RABBITMQ_URL` en `amqp://127.0.0.1:5672`.
2. **DynamoDB real.** Comprueba cómo cada servicio decide usar AWS en lugar de DynamoDB Local (variable `DYNAMODB_ENDPOINT` vacía o ausente) y **qué prefijo** escribe en `bandada-idempotency`
   (`grep -rn "idempotency" bandadau-backend/services/events-service bandadau-backend/services/wallet-service`). Ese prefijo va en la política IAM del paso 3.
3. **`sslmode`.** JDBC: `?sslmode=require` en `DATABASE_URL`; Laravel: `DB_SSLMODE=require` (variable documentada en `entornos-y-variables.md` §4.6).

## 2. AWS base

### 2.1 Red y EC2

1. VPC con una subred pública (o la VPC por defecto para la demo). **Reserva una Elastic IP** y asóciala al EC2.
2. Crea el EC2 (`t3.xlarge`; evalúa `t3.large` porque events y wallet salen del host). Amazon Linux 2023 o Ubuntu 22.04. Sin puerto 22 abierto: acceso por SSM Session Manager.
3. Instala Docker y el plugin Compose (`sudo dnf install -y docker` + plugin, o el script oficial `get.docker.com`). Crea `/opt/bandada/`.
4. Copia al host `bandadau-infra/` (sin `node_modules`) o un `tgz` versionado.

### 2.2 Security groups

| Grupo | Entrada | Origen |
|---|---|---|
| `sg-host` (EC2) | 80 | Prefix list de CloudFront (`com.amazonaws.global.cloudfront.origin-facing`) |
| `sg-host` | **5671** (AMQPS) | IP de la VM de Azure y de la VM de GCP (`/32`) |
| `sg-host` | 443 (si Traefik termina TLS para `*-origin`; si no, no hace falta) | — |
| `sg-db` (RDS) | **5432** | `/32` de la EIP del EC2, de la VM de Azure y de la VM de GCP |

Las IP de Azure y GCP las obtienes en el paso 4; vuelve aquí a completar las reglas.

### 2.3 DNS (Route 53)

| Registro | Apunta a |
|---|---|
| `api.`, `n8n.`, `grafana.` | CloudFront (como en §4.2 de `infraestructura.md`) |
| `mq.<BASE_DOMAIN>` | EIP del EC2 (A, **sin** CloudFront: AMQPS no pasa por CloudFront) |
| `events-origin.<BASE_DOMAIN>` | IP pública de la VM de Azure |
| `wallet-origin.<BASE_DOMAIN>` | IP pública de la VM de GCP |

## 3. Datos en AWS

### 3.1 RDS PostgreSQL

```bash
aws rds create-db-instance \
  --db-instance-identifier bandada \
  --engine postgres --db-instance-class db.t4g.micro \
  --allocated-storage 20 --storage-type gp3 \
  --master-username postgres --master-user-password '<MASTER_PW>' \
  --publicly-accessible \
  --vpc-security-group-ids <sg-db> \
  --backup-retention-period 7
```

- Elige la versión de PostgreSQL que ofrezca RDS (en local es 18: ⚠ Verificar compatibilidad con Flyway y las migraciones de Laravel).
- Espera a que esté `available` y toma el *endpoint* (`aws rds describe-db-instances`).
- **Crea las 3 bases y 3 usuarios** (RDS no ejecuta `docker-entrypoint-initdb.d`). Desde el EC2 (tiene acceso), con el cliente `psql`, adapta `bandadau-infra/postgres/init/01-create-databases.sh`:
  para cada par (`identity`, `events`, `wallet`) crea el rol con su contraseña, la base `<x>_db` con ese dueño, `REVOKE CONNECT … FROM PUBLIC` y `GRANT CONNECT` al rol.
  Usa contraseñas **distintas** a las de desarrollo.
- Los esquemas los crea cada servicio con sus migraciones al arrancar (Flyway en identity/events; `php artisan migrate` en wallet).

### 3.2 DynamoDB (4 tablas)

Los JSON de `bandadau-infra/dynamodb/tables/*.json` son entrada válida de `create-table`:

```bash
cd bandadau-infra
for t in idempotency ticketing notifications insights; do
  aws dynamodb create-table --cli-input-json file://dynamodb/tables/$t.json --region us-east-1
done
# TTL en las cuatro (atributo expiresAt):
for n in bandada-idempotency bandada-ticketing bandada-notifications bandada-insights; do
  aws dynamodb update-time-to-live --table-name $n \
    --time-to-live-specification "Enabled=true,AttributeName=expiresAt" --region us-east-1
done
```

Verifica con `aws dynamodb list-tables`. (No uses `dynamodb/create-tables.sh` tal cual: está pensado para el endpoint local.)

### 3.3 S3 y MongoDB

- Buckets `bandada-<env>-media`, `-reports`, `-models`, `-backups` (privados, *Block Public Access*): `aws s3api create-bucket …`.
- MongoDB sigue como contenedor en el EC2 (`rs0`, ver `infraestructura.md` §4.2). El `mongo-init` actual crea usuarios y réplica; reutiliza esos scripts.

## 4. VMs remotas (Azure y GCP)

Ambas necesitan **IP pública estática** y los puertos 22 (solo tu IP), 80 y 443 abiertos.

### 4.1 Azure (`events-service`)

```bash
az group create -n bandada-rg -l eastus
az vm create -g bandada-rg -n bandada-events \
  --image Ubuntu2204 --size Standard_B2s \
  --admin-username azureuser --generate-ssh-keys \
  --public-ip-sku Standard --public-ip-address-allocation static
az vm open-port -g bandada-rg -n bandada-events --port 80,443 --priority 900
az vm show -d -g bandada-rg -n bandada-events --query publicIps -o tsv   # IP para DNS y sg-db
```

Restringe el puerto 22 a tu IP en el NSG (`az network nsg rule …`). Tamaño: ≥ 2 GB de RAM (la JVM usa hasta 512 MB); `Standard_B2s` tiene 4 GB.

### 4.2 GCP (`wallet-service`)

```bash
gcloud config set project <PROJECT_ID>
gcloud compute addresses create bandada-wallet-ip --region us-east4
gcloud compute instances create bandada-wallet \
  --zone us-east4-a --machine-type e2-small \
  --image-family ubuntu-2204-lts --image-project ubuntu-os-cloud \
  --boot-disk-size 20GB --address bandada-wallet-ip --tags web
gcloud compute firewall-rules create bandada-web --allow tcp:80,tcp:443 --target-tags web
gcloud compute addresses describe bandada-wallet-ip --region us-east4 --format='value(address)'
```

`e2-small` tiene 2 GB: alcanza para web + worker + relay (3 × 256 MB) y el proxy.

### 4.3 En ambas VMs

```bash
ssh <usuario>@<ip>
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER && newgrp docker
echo "<TOKEN_READ_PACKAGES>" | docker login ghcr.io -u <usuario-github> --password-stdin
sudo mkdir -p /opt/bandada && sudo chown $USER /opt/bandada
```

Vuelve a **2.2** y agrega las IP de ambas VMs a `sg-db` y al puerto 5671 de `sg-host`. Crea los registros DNS `events-origin` y `wallet-origin` (2.3).

## 5. RabbitMQ y Traefik (AWS)

### 5.1 RabbitMQ con TLS (AMQPS)

1. Obtén un certificado para `mq.<BASE_DOMAIN>` (Let's Encrypt con `certbot` en el EC2, o ACM no sirve aquí porque exportar el certificado no es posible).
2. En `bandadau-infra/rabbitmq/rabbitmq.conf` (versión de producción) añade:

```ini
listeners.ssl.default = 5671
ssl_options.cacertfile = /etc/rabbitmq/certs/chain.pem
ssl_options.certfile   = /etc/rabbitmq/certs/cert.pem
ssl_options.keyfile    = /etc/rabbitmq/certs/key.pem
ssl_options.verify     = verify_none
ssl_options.fail_if_no_peer_cert = false
```

3. Publica `5671:5671` en el Compose de producción y móntale los certificados.
4. **Cambia las contraseñas** de los 9 usuarios por servicio y de `admin` (regenera `definitions.json` con `make rabbit-defs` usando un `.env` de producción). No dejes `admin/admin` ni `bandada/bandada`.
5. El 15672 (UI) **no** se abre fuera de la VPC.

### 5.2 Traefik: upstreams remotos

En producción, `routers.yml` de Traefik apunta a los hosts remotos en lugar de `events-service:7004` y `wallet-service:7005`. Crea una versión de producción con (ejemplo):

```yaml
http:
  services:
    events-remote:
      loadBalancer:
        passHostHeader: false
        servers: [{ url: "https://events-origin.bandadau.com" }]
    wallet-remote:
      loadBalancer:
        passHostHeader: false
        servers: [{ url: "https://wallet-origin.bandadau.com" }]
  middlewares:
    remote-origin-verify:
      headers:
        customRequestHeaders:
          X-Origin-Verify: "<SECRETO_ORIGEN_REMOTO>"
```

Los routers `events` y `wallet` conservan sus reglas y cadenas, y cambian el `service:` por `events-remote` / `wallet-remote` añadiendo `remote-origin-verify`. El resto (CORS, rate limit, bloqueo de `/internal`) no cambia. El secreto va en una variable de entorno, no en git.

## 6. Servicios remotos

Ambas VMs usan **la misma imagen** que en local; solo cambian las variables. Publica las imágenes en GHCR desde tu máquina:

```bash
cd bandadau-infra
make build S=events-service && make build S=wallet-service
docker tag bandada/events-service:local ghcr.io/<org>/bandada-events-service:<tag>
docker tag bandada/wallet-service:local ghcr.io/<org>/bandada-wallet-service:<tag>
docker push ghcr.io/<org>/bandada-events-service:<tag>
docker push ghcr.io/<org>/bandada-wallet-service:<tag>
```

### 6.1 Azure: `events-service`

`/opt/bandada/compose.yaml`:

```yaml
services:
  events-service:
    image: ghcr.io/<org>/bandada-events-service:<tag>
    restart: unless-stopped
    env_file: /opt/bandada/events.env
    mem_limit: 512m
    expose: ["7004"]
  proxy:
    image: caddy:2
    restart: unless-stopped
    ports: ["80:80", "443:443"]
    environment:
      ORIGIN_VERIFY: ${ORIGIN_VERIFY}
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile:ro
      - caddy-data:/data
volumes:
  caddy-data:
```

`/opt/bandada/Caddyfile` (⚠ Verificar la sintaxis con `caddy validate`):

```
events-origin.bandadau.com {
  @blocked {
    not remote_ip <EIP_AWS>
  }
  respond @blocked 403
  @noheader {
    not header X-Origin-Verify {env.ORIGIN_VERIFY}
  }
  respond @noheader 403
  reverse_proxy events-service:7004
}
```

`/opt/bandada/events.env` (`chmod 600`; **nunca** en git). Parte de las variables de `events-service` en `bandadau-infra/docker-compose.yaml` y cambia:

| Variable | Valor |
|---|---|
| `PORT` | `7004` |
| `SPRING_PROFILES_ACTIVE` | `prod` (⚠ Verificar que exista; si no, el perfil que use el servicio) |
| `DATABASE_URL` | `jdbc:postgresql://<RDS_ENDPOINT>:5432/events_db?sslmode=require` |
| `DATABASE_USER` / `DATABASE_PASSWORD` | `events` / contraseña de producción |
| `RABBITMQ_URL` | `amqps://events-service:<pw>@mq.bandadau.com:5671` |
| `JWKS_URL` | `https://api.bandadau.com/.well-known/jwks.json` |
| `JWT_ISSUER` | `https://api.bandadau.com` (**debe** ser idéntico al `iss` que firma identity) |
| `IDEMPOTENCY_TABLE` | `bandada-idempotency` |
| `DYNAMODB_ENDPOINT` | vacío (usa AWS real) |
| `AWS_REGION` | `us-east-1` |
| `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` | las del usuario IAM de events (paso 7.1) |
| `COVER_CHECK` | `off` (ADR-0024: sin llamada a media) |
| `INTERNAL_SCOPES_ENFORCED` | `true` |
| `SAGA_STEP_TIMEOUT` | `PT30S` (no reducir: hay latencia entre nubes) |
| `OTEL_SDK_DISABLED` | `true` |

Arranque:

```bash
cd /opt/bandada && ORIGIN_VERIFY='<SECRETO_ORIGEN_REMOTO>' docker compose up -d
docker compose logs -f events-service     # espera "Started" y migraciones Flyway
```

### 6.2 GCP: `wallet-service`

Mismo esquema (Caddy + servicios). Tres contenedores con la **misma imagen y las mismas variables**; solo cambia el `command`:

```yaml
x-wallet: &wallet
  image: ghcr.io/<org>/bandada-wallet-service:<tag>
  restart: unless-stopped
  env_file: /opt/bandada/wallet.env
  mem_limit: 256m
services:
  wallet-service: { <<: *wallet, expose: ["7005"] }
  wallet-worker:  { <<: *wallet, command: php artisan wallet:consume-commands }
  wallet-relay:   { <<: *wallet, command: php artisan wallet:relay-outbox }
  proxy:          # igual que en Azure, con host wallet-origin.bandadau.com y reverse_proxy wallet-service:7005
    image: caddy:2
    ports: ["80:80", "443:443"]
    environment: { ORIGIN_VERIFY: ${ORIGIN_VERIFY} }
    volumes: ["./Caddyfile:/etc/caddy/Caddyfile:ro", "caddy-data:/data"]
volumes: { caddy-data: {} }
```

`/opt/bandada/wallet.env` (`chmod 600`):

| Variable | Valor |
|---|---|
| `APP_ENV` / `APP_DEBUG` | `production` / `false` |
| `APP_KEY` | `base64:…` generada para producción (`php artisan key:generate --show`) |
| `APP_PORT` | `7005` |
| `DB_CONNECTION` / `DB_HOST` / `DB_PORT` / `DB_DATABASE` | `pgsql` / `<RDS_ENDPOINT>` / `5432` / `wallet_db` |
| `DB_SSLMODE` | `require` |
| `DB_USERNAME` / `DB_PASSWORD` | `wallet` / contraseña de producción |
| `RABBITMQ_URL` | `amqps://wallet-service:<pw>@mq.bandadau.com:5671` (ver 1.1) |
| `JWKS_URL` / `JWT_ISSUER` | como en events |
| `IDEMPOTENCY_TABLE`, `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` | como en events, con el usuario IAM de wallet; `DYNAMODB_ENDPOINT` vacío |
| `PAYMENT_GATEWAY` / `PAYMENT_SIMULATOR_ENABLED` | `simulated` / `true` (la demo usa el simulador) |
| `PAYMENT_WEBHOOK_SECRET` | secreto de producción (≥ 16 caracteres) |
| `PAYMENT_CHECKOUT_BASE_URL` | `https://app.bandadau.com/wallet/checkout` |
| `TOPUP_PACKAGES` | `CREDITS_20,CREDITS_50,CREDITS_100` |
| `CHAOS_WALLET_DELAY_MS` | `0` (solo se sube para la demo de timeout) |
| `OTEL_SDK_DISABLED` | `true` |

## 7. Accesos y verificación

### 7.1 Usuarios IAM para DynamoDB (uno por nube remota)

Crea `bandada-events-ddb` y `bandada-wallet-ddb` con una política como esta (ajusta cuenta y **prefijo real** del paso 1.1):

```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Action": ["dynamodb:GetItem","dynamodb:PutItem","dynamodb:UpdateItem","dynamodb:DeleteItem","dynamodb:ConditionCheckItem","dynamodb:Query"],
    "Resource": "arn:aws:dynamodb:us-east-1:<CUENTA>:table/bandada-idempotency",
    "Condition": { "ForAllValues:StringLike": { "dynamodb:LeadingKeys": ["<prefijo>#*"] } }
  }]
}
```

Genera la llave de acceso, cópiala al `.env` de la VM y **no la guardes en ningún otro sitio**. Rótala después de la defensa.

### 7.2 Lista de comprobación (en este orden)

1. **Red**: desde la VM de Azure y la de GCP: `nc -zv <RDS_ENDPOINT> 5432` y `nc -zv mq.bandadau.com 5671`. Si falla, es un security group o DNS.
2. **Salud**: `curl -fsS https://events-origin.bandadau.com/health/ready` **debe dar 403** desde tu portátil (el proxy exige IP de AWS y cabecera); desde el EC2, con la cabecera, `200`.
   Los servicios no publican nada más: no hay puertos 7004/7005 abiertos fuera del proxy.
3. **A través de la API**: `curl https://api.bandadau.com/api/v1/events` responde (lo sirve events desde Azure vía Traefik) y `…/api/v1/wallet` con un token válido responde desde GCP.
4. **RabbitMQ**: en la UI (por túnel SSM al 15672) comprueba consumidores en `events-service.saga-replies`, `wallet-service.commands` y `ticketing-service.commands`, y que cada conexión viene de la IP esperada.
5. **SAGA de punta a punta**: adapta `make seed` y `make smoke` apuntando a `https://api.bandadau.com` (⚠ el seed usa `localhost:7001` para el token de servicio: hay que correrlo en el EC2) y comprueba:
   - Inscripción pagada → ticket emitido.
   - Con `CHAOS_TICKETING_FAIL=true` en ticketing: compensación (reembolso y cupo liberado).
6. **Latencia**: anota cuánto tarda la inscripción completa. Si supera ~5 s, revisa regiones y el `SAGA_STEP_TIMEOUT`.

### 7.3 Problemas típicos

| Síntoma | Causa probable |
|---|---|
| `connection timed out` a RDS | `sg-db` sin la IP de la VM, o la VM cambió de IP (usa IP estática) |
| `SSL required` / `no pg_hba.conf entry` | Falta `sslmode=require` |
| Eventos no llegan / SAGA colgada en `PENDING` | Cliente AMQP no soporta `amqps://` (ver 1.1) o contraseña del usuario de RabbitMQ distinta |
| `401` en `/api/v1/events` | `JWT_ISSUER` distinto del `iss` de los tokens, o `JWKS_URL` inaccesible desde la VM |
| `403` desde Traefik hacia `*-origin` | El proxy remoto no ve la IP de AWS (revisa `remote_ip`) o falta `X-Origin-Verify` |
| `AccessDeniedException` de DynamoDB | Prefijo de `LeadingKeys` incorrecto en la política IAM |
| Let's Encrypt falla | DNS aún no apunta a la VM o el 80 está cerrado |

## 8. Despliegue independiente (lo que hace valer la arquitectura)

**Un microservicio** (ejemplo: nueva versión de events). No se detiene nada más:

```bash
# 1) en tu máquina: build y push con un tag nuevo
docker push ghcr.io/<org>/bandada-events-service:<tag-nuevo>
# 2) en la VM de Azure
cd /opt/bandada
sed -i 's#bandada-events-service:.*#bandada-events-service:<tag-nuevo>#' compose.yaml
docker compose pull events-service && docker compose up -d --no-deps events-service
curl -fsS http://127.0.0.1:7004/health/ready   # tras el arranque
```

**Rollback**: volver al tag anterior y repetir `up -d --no-deps`. Las migraciones no se revierten: escríbelas compatibles hacia atrás (expand/contract).
Mientras events se reinicia, los comandos de la SAGA quedan en cola en RabbitMQ (cola `quorum` durable) y se procesan al volver; las demás partes del sistema siguen funcionando.

**Un microfrontend** (ejemplo: `mfe-moderation`): se sube su carpeta versionada a S3 (`/moderation/<versión>/`), se reescribe `mfe-manifest.json` apuntando a ella y se invalida solo ese archivo en CloudFront
(diseño completo en `infraestructura.md` §5.3). El shell y el otro MFE no se tocan.

**Un servicio en AWS** (ticketing, identity…): en el EC2, `docker compose pull <svc> && docker compose up -d --no-deps <svc>`.

## 9. Checklist de la demo

- [ ] Las tres VMs y el EC2 encendidos al menos 30 min antes (la JVM tarda en arrancar).
- [ ] `https://api.bandadau.com/api/v1/events` responde; login con usuario demo.
- [ ] Consolas abiertas de Azure, GCP y AWS mostrando cada VM (para evidenciar C6).
- [ ] `docker ps` en la VM de Azure (events), la de GCP (wallet) y el EC2 (ticketing) visibles.
- [ ] Inscripción pagada feliz; luego con `CHAOS_TICKETING_FAIL=true` el rollback.
- [ ] `CHAOS_WALLET_DELAY_MS=0` y `PAYMENT_SIMULATOR_ENABLED=true` confirmados.

## 10. Apagado y costos

- Detén las VMs y RDS fuera de horario (`az vm deallocate`, `gcloud compute instances stop`, `aws rds stop-db-instance`; RDS se reinicia solo tras 7 días).
- **Las IP estáticas sin VM asociada se cobran**: libéralas o asócialas siempre.
- Tras la defensa: elimina los recursos de las tres nubes y **rota o borra** las claves IAM, el token de GHCR y las contraseñas.
