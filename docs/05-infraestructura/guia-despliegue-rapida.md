# Guía rápida de despliegue: «cambié esto, corro esto»

Para el día a día, cuando la infraestructura ya está levantada. Todo se ejecuta desde la carpeta `bandadau-infra/`.
Si la nube todavía no existe, primero: `terraform/aws/README.md` y `guia-despliegue.md`.

## Una sola vez en tu máquina

```bash
cd bandadau-infra
export GHCR_OWNER=<tu-usuario-de-github-en-minusculas>
docker login ghcr.io -u <tu-usuario>        # token con write:packages
tailscale up                                 # Tailscale activo: así se entra a las VMs
```

## 1. Cambié un microservicio

Dos comandos: publicar la imagen y desplegarla en **su** nube.

```bash
IMAGE_TAG=v2 deploy/build-push.sh <servicio>
deploy/deploy.sh <nube> <servicio> v2
```

| Servicio | Nube |
|---|---|
| `identity-service`, `social-service`, `media-service`, `ticketing-service`, `notification-service`, `insights-service`, `admin-gateway` | `aws` |
| `events-service` | `azure` |
| `wallet-service` (también redespliega su worker y su relay) | `gcp` |

Ejemplo: `IMAGE_TAG=v7 deploy/build-push.sh events-service && deploy/deploy.sh azure events-service v7`.
Cada vez usa un `IMAGE_TAG` nuevo (`v2`, `v3`…). El despliegue espera a que el contenedor quede sano y, **si no queda sano, vuelve solo a la versión anterior**.
Volver a mano a una versión: `deploy/deploy.sh <nube> <servicio> <tag-anterior>`.

## 2. Cambié un frontend

Un solo comando: compila con las URLs de producción y publica.

| Cambié… | Comando |
|---|---|
| La landing (`bandadau-landing`) | `deploy/frontend.sh landing` |
| La app web (`bandadau-frontend`) | `deploy/frontend.sh app` |
| El shell del panel (`bandadau-admin/shell`) | `deploy/frontend.sh admin` |
| El microfrontend de moderación | `deploy/frontend.sh moderation` |
| El microfrontend de insights | `deploy/frontend.sh insights` |
| Varios o no sé | `deploy/frontend.sh all` |

Los microfrontends se publican **solos** (carpeta `mfe/<nombre>/<versión>/`) y actualizan el `mfe-manifest.json` del panel; el shell no se recompila.
**Sube la `version` del `package.json` del microfrontend** si cambiaste código, para que el navegador no use la copia vieja en caché.
La primera vez (o si no estás seguro) usa `deploy/frontend.sh all`.
`DRY_RUN=1 deploy/frontend.sh <cosa>` muestra qué haría sin compilar ni publicar.

## 3. Cambié otra cosa

| Cambié… | Comando |
|---|---|
| `bandadau-shared` (paquetes `@bandada/*`) | `corepack pnpm install --force` en cada app que lo usa, y después `deploy/build-push.sh` (todos los servicios Node) y `deploy/deploy.sh aws` |
| Compose, Traefik o nginx (`bandadau-infra/deploy/`) | `git push` de `bandadau-infra` y `deploy/deploy.sh <nube>` (la VM hace `git pull`) |
| Variables o secretos (`deploy/.env.<nube>`) | `PUSH_ENV=1 deploy/deploy.sh <nube>` |
| Infraestructura de AWS (`terraform/aws`) | `make aws-plan` y, si se ve bien, `make aws-apply` |
| Un contrato (`bandadau-docs/contracts`) o la documentación | Nada: no se despliega. El servicio que lo implementa sí (caso 1) |
| Una migración de base de datos | Nada extra: se aplica sola al arrancar el servicio (caso 1) |

## 4. Comprobar que quedó bien

- `deploy.sh` imprime `OK: despliegue de <servicio> terminado` cuando el contenedor está sano.
- `frontend.sh` imprime las URLs al terminar; ábrelas: `https://bandadau.lat`, `https://app.bandadau.lat`, `https://admin.bandadau.lat`.
- Estado de una nube: `ssh ubuntu@bandada-aws docker ps` (en Azure `azureuser@bandada-azure`, en GCP `ubuntu@bandada-gcp`); cada contenedor muestra `healthy` cuando está bien.
- Logs de un servicio: `ssh ubuntu@bandada-aws docker logs --tail 100 <nombre-del-contenedor>` (el nombre sale de `docker ps`).

## 5. Después de la presentación

`make aws-destroy` borra todo lo de AWS; `make aws-check` confirma que no quedó nada. Los pasos que no son de AWS (Azure, GCP, Tailscale, Namecheap) los recuerda el script.

## Qué NO está verificado

Nada de esto se ha ejecutado todavía contra las nubes reales: `build-push.sh`, `deploy.sh` y `frontend.sh` están escritos y revisados, pero la primera ejecución completa está pendiente.
`frontend.sh` se probó solo con `DRY_RUN=1`.
