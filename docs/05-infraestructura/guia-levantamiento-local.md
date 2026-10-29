# Guía de levantamiento local — Bandada U

> **Estado: basada en lo implementado (fase 1)**, tomada de `bandadau-infra/README.md`, `docker-compose.yaml` y `Makefile`.
> Los pasos de §2 se verificaron en su momento con `make up && make seed && make smoke`; si algo difiere en tu máquina, anótalo en `06-plan/registro-de-sesiones.md`.
> El entorno local **no** usa AWS, GCP ni Azure: la multi-nube (ADR-0024) es solo del despliegue (ver [guia-despliegue.md](guia-despliegue.md)).

## 1. Qué necesitas

| Requisito | Detalle |
|---|---|
| Los 8 repos | Como carpetas **hermanas** dentro de `parcial-II/` (`bandadau-infra/scripts/clone-all.sh`, o `make clone-all OWNER=<org>`) |
| Docker | Docker Desktop u OrbStack con **≥ 12 GB de RAM** asignados (la pila usa ~8 GB) |
| Node | ≥ 22 (recomendado 24) con `corepack` (para pnpm) |
| `make` y `openssl` | El `make` 3.81 de macOS sirve |
| Java, PHP, Composer, Gradle | **No hacen falta**: los servicios se compilan dentro de Docker |

## 2. Primera vez: la pila completa (backend + datos)

```bash
cd bandadau-infra
cp .env.example .env
make setup      # verifica herramientas, compila bandadau-shared, genera llaves y definiciones de RabbitMQ
make up         # construye imágenes y levanta infraestructura + 8 servicios; espera a que estén healthy
make seed       # datos de demo (idempotente)
make smoke      # humo de extremo a extremo: debe terminar sin ✗
```

**Qué hace cada paso**

- `make setup`: revisa que tengas Docker/Node/openssl, hace `corepack pnpm install` y compila `bandadau-shared` (los paquetes `@bandada/*`), crea las llaves de desarrollo en `secrets/`
  (JWT RS256 de identity y ES256 del QR de ticketing) y genera `rabbitmq/definitions.json` desde la plantilla.
- `make up`: levanta los perfiles `infra` (Traefik, Postgres, Mongo `rs0`, DynamoDB Local, RabbitMQ, MinIO, Mailpit, n8n) y `services` (los 8 servicios; wallet y notification traen su worker y su relay).
  La primera vez tarda (compila Java, PHP y Node); las siguientes usan caché.
- `make seed`: crea universidades (UMSA, UCB), usuarios demo, créditos, un grupo, posts y 3 eventos llamando a las **APIs**.
- `make smoke`: recorre registro → verificación (lee el código de Mailpit) → login → post → recarga idempotente → inscripción pagada con ticket → `EVENT_FULL` → **caos** (rompe ticketing y comprueba el rollback) → panel GraphQL.

Cuando termina: `make ps` muestra todo `healthy`, y `make urls` imprime URLs y credenciales.

> Si el `make up` falla en un servicio: `make logs S=<servicio>`. Si te quedas sin memoria, usa el nivel B de §4.

## 3. Frontends (corren en tu máquina, no en Docker)

Traefik los reenvía desde `host.docker.internal`. Cada uno en **su** terminal:

| App | Comando | URL |
|---|---|---|
| Landing | `cd bandadau-landing && corepack pnpm install && corepack pnpm dev` | http://bandada.localhost (puerto 3000) |
| App web / móvil | `cd bandadau-frontend && pnpm install && pnpm web` (o `pnpm start` para Metro en 8081) | http://app.bandada.localhost |
| Panel (shell) | `cd bandadau-admin/shell && corepack pnpm install && corepack pnpm dev` | http://admin.bandada.localhost (3001) |
| MFE moderación | `cd bandadau-admin/mfe-moderation && corepack pnpm install && corepack pnpm start` | puerto 4201 |
| MFE insights | `cd bandadau-admin/mfe-insights && corepack pnpm install && corepack pnpm dev` | puerto 4301 |

Para el panel necesitas el shell **y** los dos MFEs corriendo. Las `NEXT_PUBLIC_*` y `EXPO_PUBLIC_*` se fijan en el *build*: si las cambias, reinicia el servidor de desarrollo.

Si recompilas `bandadau-shared`, en cada app que lo consume hay que correr `corepack pnpm install --force` (usan copias por *hard link* de `file:`).

## 4. Niveles de uso (de menos a más recursos)

| Nivel | Cuándo | Comandos | RAM aprox. |
|---|---|---|---|
| **A. Sin backend** | Solo trabajas en pantallas | `make mock` → gateway mock en http://localhost:4010 (REST + GraphQL desde `contracts/`) | mínima, sin Docker |
| **B. Infra + un servicio en tu IDE** | Editas un servicio con recarga en caliente | `make up-infra`, luego `make host S=<servicio>` y corres ese servicio en tu IDE; `make unhost S=<servicio>` lo revierte | ~3 GB + tu IDE |
| **C. Pila completa** | Probar integración, la SAGA o la demo | `make up` (pasos de §2) | ~8 GB |
| **D. C + observabilidad** | Mirar trazas, dashboards y alertas | `make up-obs` → Grafana en http://localhost:3300 (`admin`/`admin`) | ~10 GB |

En el nivel B, usa los valores `localhost` del `AGENTS.md` del servicio (ver "Correr un servicio fuera de Docker" en `bandadau-infra/README.md`).

## 5. Dónde mirar

| Qué | URL | Credenciales |
|---|---|---|
| API REST | http://api.bandada.localhost/api/v1 | — |
| GraphQL | http://api.bandada.localhost/graphql | Bearer del admin/mod |
| Correos (códigos de verificación) | http://localhost:8025 | — |
| RabbitMQ | http://localhost:15672 | `admin` / `admin` |
| MinIO (S3 local) | http://localhost:9001 | `minio` / `minio_dev_pw` |
| n8n | http://localhost:5678 | `admin@bandada.localhost` / `Bandada-n8n-dev1` |
| Traefik | http://localhost:8080 | — |
| Servicios directos | `localhost:7001`…`7007`, `7010` | — |

Usuarios demo (contraseña de desarrollo `Bandada#2026`): `admin@umsa.edu.bo` (ADMIN), `mod@umsa.edu.bo` (MODERATOR), `org@umsa.edu.bo` (ORGANIZER), `lucia@umsa.edu.bo` (STUDENT con 100 créditos), `marco@umsa.edu.bo` (STUDENT).

## 6. Probar la SAGA (la demo de la cátedra)

1. Entra como `lucia@umsa.edu.bo` en la app y **inscríbete a un evento de pago**: events reserva cupo → wallet debita → ticketing emite el ticket (QR).
2. **Rollback**: recrea ticketing con el fallo activado y repite la inscripción.

   ```bash
   cd bandadau-infra
   CHAOS_TICKETING_FAIL=true docker compose --profile '*' up -d --no-deps --force-recreate ticketing-service
   ```

   Resultado esperado: la inscripción queda `FAILED`, el crédito se **reembolsa** y el cupo se **libera**. (`make smoke` ya hace esto solo.)
3. Para volver a la normalidad, recrea ticketing sin la variable: `docker compose --profile '*' up -d --no-deps --force-recreate ticketing-service`.
4. **Timeout**: `CHAOS_WALLET_DELAY_MS=<ms>` en wallet retrasa cada comando (demo de timeout; vuelve a `0` después).
5. Mira los mensajes en RabbitMQ (`bandada.events`, colas `*.saga-replies` y `*.commands`).

## 7. Operación diaria

```bash
make ps                       # estado y healthchecks
make logs S=events-service    # logs de un servicio (sin S: todos)
make restart S=<svc>          # reinicia
make build S=<svc>            # reconstruye una imagen (sin S: todas)
make down                     # detiene todo, conserva datos
make reset                    # detiene todo y BORRA volúmenes (bases, buckets, colas) — sin confirmación
make check-infra              # verifica salud, colas, bases, tablas, buckets y rutas
make validate                 # docker compose config + sintaxis de scripts
```

Probar en paralelo sin tocar tu stack: `make up-infra PROJECT=prueba` y `make reset PROJECT=prueba` (cambia los puertos del host en `.env` si ambos corren a la vez).

Después de `make reset`, vuelve a ejecutar `make seed` (los datos se pierden).

## 8. Problemas frecuentes

| Síntoma | Qué hacer |
|---|---|
| Docker sin memoria / contenedores que se reinician | Sube la RAM de Docker a ≥ 12 GB o usa el nivel B |
| `bind: address already in use` | Cambia el puerto del host en `.env` (`POSTGRES_PORT`, `HTTP_PORT`…) y repite `make up`; `lsof -nP -iTCP:5432 -sTCP:LISTEN` te dice quién lo usa. El `8081` suele ser Metro |
| `*.localhost` no resuelve (Safari, Linux) | Agrega a `/etc/hosts`: `127.0.0.1 bandada.localhost api.bandada.localhost app.bandada.localhost admin.bandada.localhost mfe.bandada.localhost n8n.bandada.localhost mail.bandada.localhost rabbit.bandada.localhost s3.bandada.localhost` |
| Teléfono físico no llega a la API | `EXPO_PUBLIC_API_URL=http://<IP-LAN-de-tu-máquina>` y `S3_PUBLIC_ENDPOINT` con la misma IP |
| MongoDB aborta con "Linux kernel versions 6.19 and newer…" | La imagen está fijada a `mongo:8.0.19` por SERVER-121912; no la actualices |
| Mongo "not primary" | Espera a que termine `mongo-init` (`make ps`); desde el host usa `?directConnection=true` |
| `make up` falla compilando un servicio | `make logs S=<svc>`; verifica que exista su `Dockerfile` y que `make setup` compiló `bandadau-shared` |
| El seed no recibe el código de verificación | Abre http://localhost:8025; si no llega, identity no está en perfil `dev` o no usa `SMTP_HOST=mailpit` |
| Subida de imagen falla / CORS | Revisa `S3_PUBLIC_ENDPOINT` (`http://localhost:9000`) y `CORS_ORIGINS` |
| Una variable `NEXT_PUBLIC_*` no se refleja | Es de *build*: reinicia el servidor de desarrollo |
| Se perdieron las credenciales de n8n | Cambió `N8N_ENCRYPTION_KEY` |
| Quiero empezar de cero | `make reset && make up && make seed` |

## 9. Más detalle

- Variables por componente: [entornos-y-variables.md](entornos-y-variables.md).
- Diseño completo de la infraestructura local (redes, volúmenes, Traefik, RabbitMQ): [infraestructura.md](infraestructura.md) §2.
- README del repo de infraestructura: `bandadau-infra/README.md`.
