# ADR-0026 — Borde público con CloudFront, DNS en Route 53 e infraestructura de AWS con Terraform

- **Estado:** Aceptada (diseño; **no desplegado**: la pila de Terraform solo se validó con `terraform validate`, sin `plan` ni `apply`)
- **Fecha:** 2026-11-08
- **Decisores:** Equipo Grupo 24 (Ing. Software II)
- **Reemplaza parcialmente a:** [ADR-0025](ADR-0025-despliegue-simplificado-tailscale.md), solo los puntos 5 (borde público) y 6 (frontends) en lo que toca a TLS y DNS.
- **Se mantiene de ADR-0025:** Tailscale entre las tres nubes, datos en contenedores del EC2, DynamoDB real, nginx para los estáticos, imágenes en GHCR y `deploy.sh`.

## Contexto

ADR-0025 descartó CloudFront, ACM y Route 53 para simplificar: Traefik terminaba TLS con Let's Encrypt y cualquier proveedor de DNS bastaba. Entre ADR-0025 y hoy el equipo **compró el dominio `bandadau.lat` en Namecheap** y decidió usar **CloudFront** como puerta pública. Además se pidió un procedimiento para **eliminar toda la infraestructura de AWS** después de la presentación (2026-11-10), sin dejar recursos que sigan cobrando.

Restricciones vigentes: entrega 2026-11-10, equipo pequeño que debe poder explicar y repetir el despliegue, presupuesto orientativo ≤ USD 60/mes (RNF-18), los únicos puertos públicos deseados son los del borde.

## Decisión

1. **Un solo CloudFront delante de todo**, con los alias `bandadau.lat` y `*.bandadau.lat` y un certificado de **ACM** (raíz + comodín) validado por DNS. Viewer: HTTPS obligatorio (HTTP redirige). La distribución usa `PriceClass_100`.
2. **Origen = el EC2** (Traefik) por **HTTP:80**. Se reenvía la cabecera `Host` original (política de origen *AllViewer*), de modo que Traefik y nginx siguen enrutando por host exactamente como en local y en ADR-0025 (`api.`, `app.`, `admin.`, `mfe.`, `s3.`, `n8n.`, `mail.`, `rabbit.`, `minio.`).
3. **Solo CloudFront puede llegar al origen:** el grupo de seguridad del EC2 admite únicamente la lista de prefijos administrada `com.amazonaws.global.cloudfront.origin_facing` en el puerto 80 (sin 22, sin 443), y Traefik responde 403 a toda petición sin la cabecera secreta `X-Origin-Verify` (valor generado por Terraform, enviado por CloudFront como cabecera personalizada del origen). Traefik deja de terminar TLS: se eliminan el entrypoint `websecure`, el resolver ACME y su volumen.
4. **Caché:** por defecto **sin caché** (API, HTML, manifiestos, cookies y `Authorization`). Solo se cachean los assets versionados `/_next/static/*`, `/_expo/static/*` y `/assets/*`, con una función de CloudFront que copia `Host` a `x-viewer-host` y una política de caché cuya clave incluye esa cabecera (las apps `app.*`, `admin.*` y la raíz sirven archivos distintos con la misma ruta). Se puede apagar con `enable_static_cache = false`.
5. **DNS delegado a Route 53:** en Namecheap solo se cambian los nameservers; la zona contiene la validación de ACM y los alias A/AAAA de la raíz y el comodín hacia CloudFront. Terraform la crea con `force_destroy` para que el borrado final no falle.
6. **Terraform para AWS** (`bandadau-infra/terraform/aws/`): EC2 con IP elástica, grupo de seguridad, rol e instancia IAM, usuario IAM de wallet, las 4 tablas de DynamoDB (leídas de los mismos JSON de `dynamodb/`), zona, certificado, función y distribución. Todo etiquetado `Project=bandadau`. Una sola región, **us-east-1** (ACM de CloudFront lo exige). Estado local.
7. **Borrado total** con `terraform/aws/destroy.sh`: `--yes` ejecuta `terraform destroy` tras pedir escribir «bandadau» y luego comprueba por etiqueta (API de etiquetas) que no quede ningún recurso; `--check` solo comprueba. Azure, GCP, Namecheap y Tailscale se limpian aparte (el script lo recuerda).
8. **Despliegue en dos etapas:** primero solo la zona de Route 53, delegar en Namecheap y esperar a que propague; después el resto (el certificado no se valida antes).

## Alternativas consideradas

| Alternativa | Motivo de descarte |
|---|---|
| Mantener ADR-0025 (Traefik + Let's Encrypt, registros A) | Válida y más simple, pero el equipo quiere CloudFront; deja 80 y 443 abiertos al mundo y no ofrece TLS en el borde ni protección de origen |
| CloudFront + S3 con OAC para los estáticos | Es lo canónico, pero obliga a 5 distribuciones o reglas por host y a cambiar `publish-static.sh`; nginx en el EC2 ya resuelve el reparto por host |
| Origen HTTPS (certificado en Traefik) | Con `Host` reenviado el certificado del origen debe cubrir cada subdominio: exige DNS-01 o certificados por host. HTTP con grupo de seguridad restringido y secreto es suficiente para una demo |
| Dejar el DNS en Namecheap | Sin costo, pero el dominio raíz exige el registro ALIAS manual, la validación de ACM es manual y el borrado no es automático |
| Scripts de AWS CLI en lugar de Terraform | Coherentes con `deploy/`, pero el borrado exige recorrer cada tipo de recurso y es más fácil dejar uno vivo |
| WAF en CloudFront | Costo (USD 5/mes por ACL + reglas) sin necesidad en la demo |

## Consecuencias

- (+) HTTPS con certificado gratuito y renovación automática; Traefik sin ACME ni volumen de certificados; el EC2 deja de publicar el 443.
- (+) El origen no es alcanzable directamente: grupo de seguridad + cabecera secreta.
- (+) **Un comando levanta (`make aws-apply`) y otro borra (`make aws-destroy`)**, con comprobación posterior por etiqueta.
- (−) **Tráfico CloudFront → EC2 sin cifrar** (HTTP), aunque por la red de AWS y solo desde rangos de CloudFront. Aceptado para la demo; mitigación posible: origen HTTPS con certificados por host.
- (−) Los certificados y el borrado de CloudFront son lentos (validación DNS hasta ~75 min si la delegación no propagó; destruir la distribución ~15 min).
- (−) Timeout de origen de 60 s (límite sin pedir aumento de cuota): la SAGA responde 202 y se consulta por polling, y el agente de reportes es asíncrono; **verificar** MCP por SSE y subidas prefirmadas a `s3.*`.
- (−) El estado de Terraform es local y contiene secretos; si se pierde hay que borrar a mano (README de la pila).
- (−) **No verificado:** `terraform plan/apply`, validación del certificado, resolución del origen `ec2-x-x-x-x.compute-1.amazonaws.com`, función de CloudFront y clave de caché por `x-viewer-host`.

## Referencias

`bandadau-infra/terraform/aws/README.md`, `bandadau-infra/deploy/docker-compose.aws.yaml`, `bandadau-infra/deploy/traefik/routers.prod.yml`, `05-infraestructura/guia-despliegue.md`, `05-infraestructura/infraestructura.md` §4.6, ADR-0025.
