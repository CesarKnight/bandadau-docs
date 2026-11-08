# Guía de despliegue — Bandada U (AWS + Azure + GCP con Tailscale)

> **Estado: procedimiento de diseño, NO ejecutado.** Describe cómo desplegar según [ADR-0025](../03-arquitectura/adr/ADR-0025-despliegue-simplificado-tailscale.md).
> Los archivos (`bandadau-infra/deploy/`) están validados con `docker compose config`, pero **no se ha levantado ningún contenedor ni creado ninguna VM**. Los comandos de `aws`, `az`, `gcloud` y
> `tailscale` son los habituales: **confirma cada uno con `--help`** antes de ejecutarlo. Lo marcado **⚠ No verificado** hay que comprobarlo en la primera prueba y anotarlo en `06-plan/registro-de-sesiones.md`.
> Entorno local: [guia-levantamiento-local.md](guia-levantamiento-local.md). Por qué Docker y cada imagen: [docker-y-justificacion-de-imagenes.md](docker-y-justificacion-de-imagenes.md).

## 0. Qué vas a construir

| Lugar | Qué corre | Se conecta a |
|---|---|---|
| **AWS** (1 EC2) | Traefik (HTTPS), nginx (estáticos), Postgres, Mongo, RabbitMQ, MinIO, Mailpit, n8n, identity, social, media, ticketing, notification, insights, admin-gateway | DynamoDB real |
| **Azure** (1 VM) | `events-service` | Postgres, RabbitMQ, identity y media del EC2, por Tailscale |
| **GCP** (1 VM) | `wallet-service`, `wallet-worker`, `wallet-relay` | Postgres y RabbitMQ del EC2 por Tailscale; DynamoDB (idempotencia) con un usuario IAM |

Las tres VMs forman una red privada **Tailscale** (`100.x.x.x`). Solo el EC2 tiene puertos públicos (80 y 443). Orden: **1** cuentas → **2** Tailscale → **3** AWS → **4** Azure y GCP → **5** configuración → **6** imágenes →
**7** desplegar → **8** frontends → **9** verificar → **10** demo.

## 1. Requisitos

- Cuentas con créditos: **AWS, Azure, Google Cloud, Tailscale** (gratuita) y **GitHub** (para GHCR). El **dominio `bandadau.lat`** (Namecheap) con los nameservers delegados a **Route 53** (lo hace `terraform/aws`, ver ADR-0026).
- En tu máquina: `aws`, `az`, `gcloud`, `docker` (con `buildx`), `node` ≥ 22, `openssl`, `rsync`, `ssh`, `tailscale` (con sesión iniciada en tu cuenta).
- Los 8 repos como carpetas hermanas (`bandadau-infra/scripts/clone-all.sh`). Docker Compose **≥ 2.24** en las VMs.
- Un **token de GitHub** con `write:packages` (publicar imágenes) y otro con `read:packages` (para las VMs).
- Guarda contraseñas y llaves en un gestor de contraseñas, **nunca en git**.

## 2. Tailscale (red privada)

1. En la consola de Tailscale: activa **MagicDNS** y **Tailscale SSH**; crea una *auth key* (reutilizable, con caducidad corta). Con la política por defecto todos los nodos se ven entre sí.
2. En **cada VM** (pasos 3 y 4): `curl -fsSL https://tailscale.com/install.sh | sh` y luego
   `sudo tailscale up --ssh --authkey <KEY> --hostname bandada-aws` (`bandada-azure`, `bandada-gcp` en las otras).
3. Anota la IP de cada una con `tailscale ip -4` (`TS_IP_AWS`, `TS_IP_AZURE`, `TS_IP_GCP`). Desde tu máquina: `ssh ubuntu@bandada-aws` debe entrar.
4. **Orden de arranque (⚠ No verificado):** Docker publica puertos en la IP Tailscale, que debe existir antes. En cada VM: `sudo systemctl edit docker` y añade `[Unit]` / `After=tailscaled.service`.

## 3. AWS (EC2 + DynamoDB)

> **Desde ADR-0026 los pasos 1 a 4 y 6 de esta sección los hace Terraform** (`bandadau-infra/terraform/aws/`, ver su `README.md`): EC2 con IP elástica y rol, grupo de seguridad, usuario IAM de wallet, las 4 tablas, el DNS en Route 53, el certificado y CloudFront. Solo queda el paso 5 (`docker login ghcr.io`). Lo que sigue describe lo que Terraform automatiza, por si se quiere hacer a mano. **El borde público ya no es Let's Encrypt:** CloudFront termina HTTPS y Traefik escucha en el 80.

1. **EC2**: Ubuntu 22.04 (x86-64), **`t3.large`** (8 GB; `t3.xlarge` si quieres holgura), 30 GB gp3. **Elastic IP** asociada. Grupo de seguridad: **entrada solo 80 y 443** (no abras 22: se entra por Tailscale SSH).
   Los contenedores leen el rol de la instancia, así que pide **IMDSv2 con salto 2**: `--metadata-options HttpTokens=required,HttpPutResponseHopLimit=2`.
2. **Rol de la instancia** con una política mínima sobre las tablas `bandada-*` (acciones `dynamodb:GetItem, PutItem, UpdateItem, DeleteItem, Query, ConditionCheckItem, BatchWriteItem` y sus índices `.../index/*`).
3. **Tablas** (una vez, desde tu máquina):
   ```bash
   cd bandadau-infra && AWS_REGION=us-east-1 deploy/dynamodb-create.sh
   ```
4. **Usuario IAM para wallet** (la única llave de AWS fuera del EC2): permisos `GetItem, PutItem, UpdateItem, DeleteItem, ConditionCheckItem, Query` sobre `bandada-idempotency` con la condición
   `ForAllValues:StringLike` en `dynamodb:LeadingKeys = ["wallet-service#*"]`. Crea su llave de acceso y guárdala para el paso 5.
5. En el EC2: instala Docker (`curl -fsSL https://get.docker.com | sudo sh`), Tailscale (paso 2), `sudo usermod -aG docker $USER`, y `docker login ghcr.io -u <usuario>` con el token `read:packages`.
6. **DNS** (registros A hacia la IP elástica): `@`, `www`, `api`, `app`, `admin`, `mfe`, `s3`, `n8n`, `mail`, `rabbit`, `minio` (`.<tu dominio>`). Let's Encrypt los necesita para emitir cada certificado.

## 4. Azure y GCP (una VM pequeña cada una)

**Azure** (`events-service`, JVM de hasta 512 MB: 2 GB de RAM bastan):
```bash
az group create -n bandada-rg -l eastus
az vm create -g bandada-rg -n bandada-azure --image Ubuntu2204 --size Standard_B2s \
  --admin-username azureuser --generate-ssh-keys --nsg-rule NONE
```
`--nsg-rule NONE` evita abrir el 22 público. Para el primer acceso, entra por la consola serie o `az vm run-command invoke` e instala Tailscale (paso 2).

**GCP** (`wallet-service` + worker + relay: 3 × 256 MB, 2 GB bastan):
```bash
gcloud compute instances create bandada-gcp --zone us-east4-a --machine-type e2-small \
  --image-family ubuntu-2204-lts --image-project ubuntu-os-cloud --boot-disk-size 20GB
```
La red `default` de GCP trae la regla `default-allow-ssh` (22 público): bórrala o restríngela cuando Tailscale SSH funcione (**⚠ No verificado**; afecta a todas las VMs de la red).

En ambas: instala Docker, Tailscale y haz `docker login ghcr.io` (token `read:packages`). **No abras puertos de entrada**: todo el tráfico llega por Tailscale.

**Copia del repositorio de infraestructura** en las tres VMs, en `/opt/bandada/bandadau-infra` (`sudo mkdir -p /opt/bandada && sudo chown $USER /opt/bandada`):
`git clone <url de bandadau-infra> /opt/bandada/bandadau-infra` (repositorio privado: clave de despliegue o token), **o** desde tu máquina
`rsync -az --exclude .git bandadau-infra/ ubuntu@bandada-aws:/opt/bandada/bandadau-infra/` (y entonces usa `DEPLOY_GIT_PULL=0`). En el EC2 crea además `mkdir -p /opt/bandada/sites`.

## 5. Configuración (secretos y variables)

```bash
cd bandadau-infra
deploy/render-env.sh aws && deploy/render-env.sh azure && deploy/render-env.sh gcp
```
Genera `deploy/.env.aws|azure|gcp` y `deploy/.secrets` (contraseñas aleatorias, **las mismas** en las tres nubes: RabbitMQ y Postgres de events y wallet, secretos de cliente, llaves de Laravel).
Luego edita en los tres archivos lo que el script marca como "por rellenar": `BASE_DOMAIN`, `ORIGIN_VERIFY` (`terraform output -raw origin_verify_secret`), `GHCR_OWNER` y las tres `TS_IP_*`; en `.env.gcp`, `WALLET_AWS_ACCESS_KEY_ID` y `WALLET_AWS_SECRET_ACCESS_KEY` (paso 3.4).
Crea la clave de las UIs de operación (Mailpit, RabbitMQ y MinIO quedan detrás de ella):
```bash
printf 'admin:%s\n' "$(openssl passwd -apr1 'CLAVE-LARGA')" > deploy/traefik/ops.htpasswd
```

## 6. Imágenes

```bash
docker login ghcr.io -u <usuario>              # token write:packages
GHCR_OWNER=<tu-org> IMAGE_TAG=v1 deploy/build-push.sh     # las 9 imágenes, linux/amd64 + linux/arm64 (el EC2 t4g es ARM; Azure y GCP, x86)
```
Construir para x86-64 desde un Mac con Apple Silicon es **emulado y lento** (la parte arm64 es nativa) (varios minutos por servicio; **⚠ No medido**). Alternativa: construirlas en GitHub Actions (no implementado). Pon el mismo `IMAGE_TAG` en los tres `.env`.

## 7. Desplegar

AWS **primero** (guarda los datos que Azure y GCP necesitan), luego las otras dos:
```bash
PUSH_ENV=1 deploy/deploy.sh aws       # copia .env y ops.htpasswd, genera llaves y definiciones de RabbitMQ, levanta todo y espera 'healthy'
PUSH_ENV=1 deploy/deploy.sh azure     # events-service
PUSH_ENV=1 deploy/deploy.sh gcp       # wallet-service, wallet-worker, wallet-relay
```
Si algo falla: `ssh ubuntu@bandada-aws` y `cd /opt/bandada/bandadau-infra && docker compose --env-file deploy/.env.aws -f docker-compose.yaml -f deploy/docker-compose.aws.yaml --profile infra --profile services logs <servicio>`.
El HTTPS lo pone CloudFront (certificado de ACM): no hay que esperar certificados en el EC2.

## 8. Frontends

> **Atajo (ADR-0026):** `deploy/frontend.sh all` compila con las URLs de producción y publica todo (landing, app, panel y microfrontends con su manifiesto); ver `guia-despliegue-rapida.md`. Lo de abajo es el procedimiento manual.

Las variables `NEXT_PUBLIC_*` y `EXPO_PUBLIC_*` se fijan al **compilar**: apúntalas a `https://api.<dominio>` (tabla en `entornos-y-variables.md` §4.11) y publica cada carpeta compilada:
```bash
deploy/publish-static.sh landing ../bandadau-landing/out
deploy/publish-static.sh app     ../bandadau-frontend/dist
deploy/publish-static.sh admin   ../bandadau-admin/shell/out
deploy/publish-static.sh mfe     <dist de mfe-moderation> moderation
deploy/publish-static.sh mfe     <dist de mfe-insights> insights
```
Carpetas de salida y manifiesto de microfrontends (`mfe-manifest.json`): **⚠ No verificado**; revisa el `AGENTS.md` de cada app.

## 9. Verificación (en este orden)

1. **Red**: `tailscale status` en las tres VMs muestra a las otras dos; desde Azure/GCP, `nc -zv <TS_IP_AWS> 5432` y `nc -zv <TS_IP_AWS> 5672`.
2. **Salud**: `docker compose ... ps` en cada VM: todo `healthy`. `https://api.<dominio>/.well-known/jwks.json` responde (identity, AWS) y `https://api.<dominio>/api/v1/events` responde (events, Azure, vía Traefik).
3. **RabbitMQ** (`https://rabbit.<dominio>`, con la clave de `ops.htpasswd`): consumidores en `events-service.saga-replies`, `wallet-service.commands` y `ticketing-service.commands`.
4. **Datos de demo** (desde tu máquina, dentro de la tailnet; **⚠ No verificado** contra producción):
   ```bash
   SEED_API_URL=https://api.<dominio>/api/v1 SEED_GRAPHQL_URL=https://api.<dominio>/graphql \
   SEED_IDENTITY_INTERNAL_URL=http://<TS_IP_AWS>:7001 SEED_MAILPIT_URL=http://<TS_IP_AWS>:8025 \
   SEED_SERVICE_CLIENT_SECRET=<sc_seed de deploy/.secrets> BASE_DOMAIN=<dominio> node seed/seed.mjs --basic
   ```
5. **SAGA**: inscripción pagada → ticket (events en Azure → wallet en GCP → ticketing en AWS). Anota cuánto tarda. Rollback: en el EC2, recrea ticketing con `CHAOS_TICKETING_FAIL=true` (añádela al `.env.aws`)
   y comprueba reembolso y cupo liberado.

## 10. Despliegue independiente y rollback (lo que justifica la arquitectura)

```bash
PUSH_ENV=0 deploy/deploy.sh azure events-service v2     # SOLO events, con la etiqueta v2; si no queda sano, vuelve al tag anterior
deploy/deploy.sh aws ticketing-service v3               # SOLO ticketing
deploy/publish-static.sh mfe <dist> moderation          # SOLO un microfrontend (shell y demás intactos)
```
Mientras un servicio se reinicia, los demás siguen y los mensajes de la SAGA esperan en RabbitMQ (colas *quorum* durables). Las migraciones de base de datos **no** se revierten con el rollback: escríbelas compatibles hacia atrás.

## 11. Checklist de la demo

- [ ] Las tres VMs encendidas ≥ 30 min antes (la JVM tarda en arrancar) y `tailscale status` verde.
- [ ] `https://app.<dominio>` y `https://admin.<dominio>` cargan; login con usuario demo.
- [ ] Consolas de AWS, Azure y GCP abiertas mostrando cada VM y `docker ps` (evidencia de la regla multi-nube, C6).
- [ ] Inscripción pagada feliz; luego con `CHAOS_TICKETING_FAIL=true` el rollback.
- [ ] `CHAOS_WALLET_DELAY_MS=0` y `PAYMENT_SIMULATOR_ENABLED=true`.

## 12. Apagado y costos

- Detén las VMs fuera de horario (`aws ec2 stop-instances`, `az vm deallocate`, `gcloud compute instances stop`). La **IP elástica sin instancia asociada se cobra**.
- Tras la defensa: elimina los recursos de las tres nubes, **borra la llave IAM de wallet**, revoca los tokens de GHCR y la *auth key* de Tailscale, y rota o descarta `deploy/.secrets`.

## 13. Problemas típicos

| Síntoma | Causa probable |
|---|---|
| `invalid IP address: 100.x.x.x` al validar el Compose | Falta rellenar `TS_IP_*` en el `.env` |
| `docker compose` falla con `!override`/`!reset` | Docker Compose < 2.24 en la VM |
| Contenedor no arranca: `cannot assign requested address` | Tailscale no estaba activo cuando arrancó Docker (ver paso 2.4) |
| Azure/GCP no llegan al EC2 (`nc` falla) | Nodo fuera de la tailnet, IP equivocada en el `.env` o contenedor sin ruta a `tailscale0` (**⚠ No verificado**) |
| `401` en la API | `JWT_ISSUER` (`https://api.<dominio>`) distinto del `iss` de los tokens, o `JWKS_URL` inaccesible desde la VM |
| `403` en todo el sitio | Falta `ORIGIN_VERIFY` en `.env.aws` o no coincide con el secreto de CloudFront (`terraform output origin_verify_secret`) |
| `502`/`504` de CloudFront | Traefik caído o el EC2 sin puerto 80 para la lista de CloudFront; revisa `docker compose ps` y el grupo de seguridad |
| Certificado de ACM no se valida | Los nameservers de Namecheap aún no apuntan a Route 53 (`dig NS bandadau.lat`) |
| `AccessDeniedException` de DynamoDB (wallet) | Prefijo `wallet-service#` o condición `LeadingKeys` incorrectos en la política IAM |
| Servicios del EC2 sin credenciales de AWS | Falta `HttpPutResponseHopLimit=2` en la instancia |
| Imagen no se descarga | `docker login ghcr.io` sin token `read:packages` o `GHCR_OWNER` distinto |
