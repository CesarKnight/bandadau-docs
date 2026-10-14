# AGENTS.md — Bandada U (workspace)

Guía obligatoria para cualquier agente de IA (Claude Code, Codex, OpenCode, Cursor…)
que trabaje en cualquiera de los repositorios de Bandada U. Léela completa antes de tocar nada.

## Qué es esto

**Bandada U** es una red social para estudiantes universitarios (Ingeniería de
Software II, Grupo 24). **Entrega: martes 10 de noviembre de 2026.** Se documenta con la
metodología **ICONIX**.

`parcial-II/` es un **workspace de 8 repositorios git independientes** (ADR-0017), cada uno con su
rama, su remoto, su `AGENTS.md` y su CI. **No hay repositorio raíz**: commit y push **por repo**.

| Repo | Contenido | Puertos dev |
|---|---|---|
| `bandadau-docs/` | Documentación ICONIX y **contratos** (`contracts/`). **Fuente de verdad** | — |
| `bandadau-shared/` | Paquetes `@bandada/*` (ui-tokens, i18n, contracts-ts, messaging-ts, idempotency-ts, auth-ts, configs) | — |
| `bandadau-backend/` | 9 microservicios en `services/` (Spring Boot, Laravel, NestJS) | 7001–7010 |
| `bandadau-frontend/` | App Expo SDK 57 (iOS, Android, Web PWA) | 8081 |
| `bandadau-admin/` | Panel: `shell/` (Next.js) + `mfe-moderation/` (Angular) + `mfe-insights/` (React) | 3001, 4201, 4301 |
| `bandadau-landing/` | Landing Next.js static export | 3000 |
| `bandadau-infra/` | Compose, Traefik, init de bases, RabbitMQ, n8n, observabilidad, AWS, CI, `Makefile` | 80, 5432, 27017, 8000, 5672… |
| `bandadau-ml/` | Notebooks Python → modelos ONNX | — |

Todas las rutas de la documentación son **relativas a este workspace**.

## Orden de lectura (antes de cualquier tarea)

1. `bandadau-docs/docs/00-indice.md` — mapa de toda la documentación.
2. `bandadau-docs/docs/03-arquitectura/catalogo-servicios.md` — **fuente de verdad** (lenguajes,
   bases, puertos, rutas, colas, tablas, roles). Si algo lo contradice, manda el catálogo.
3. `bandadau-docs/docs/01-vision/cumplimiento-catedra.md` — qué requisito de la cátedra cubre cada pieza.
4. `bandadau-docs/docs/04-patrones-y-reglas/convenciones-generales.md` y la guía de la arquitectura
   del componente que vas a tocar (hexagonal / clean / ddd).
5. El `AGENTS.md` del repo y del componente (`bandadau-backend/services/<x>/AGENTS.md`, `bandadau-admin/<x>/AGENTS.md`, …).
6. El/los caso(s) de uso asignados en `bandadau-docs/docs/02-iconix/03-casos-de-uso/`.
7. El contrato en `bandadau-docs/contracts/` que vas a implementar o consumir.
8. Las últimas entradas de `bandadau-docs/docs/06-plan/registro-de-sesiones.md`.

## Reglas no negociables

1. **Contract-first.** Ningún endpoint, evento, campo GraphQL o herramienta MCP se
   implementa si no está en `bandadau-docs/contracts/`. Si falta, se agrega al contrato primero.
2. **ICONIX.** No implementes un caso de uso cuyo estado sea anterior a
   "Secuencia". Si el código necesita algo que no está en la secuencia, actualiza el
   UC primero.
3. **Database per service.** Un servicio jamás lee ni escribe la base de otro.
4. **Respetar la arquitectura asignada** (Hexagonal, Clean o DDD). El dominio no
   importa frameworks. Las pruebas de arquitectura deben pasar.
5. **Idempotencia siempre**: endpoints con efectos aceptan `Idempotency-Key`;
   consumidores usan inbox; publicaciones usan outbox. Ver `bandadau-docs/docs/03-arquitectura/idempotencia.md`.
6. **Identificadores en inglés, documentación en español, UI bilingüe (es principal / en) solo vía i18n**
   (`bandadau-docs/docs/04-patrones-y-reglas/i18n.md`) y **estilos solo con tokens de diseño**, con modo claro y
   oscuro obligatorios (`bandadau-docs/docs/04-patrones-y-reglas/design-tokens-y-temas.md`).
7. **Sin secretos en git.** Usa `.env.example`.
8. **Un commit nunca cruza repositorios.** Un cambio de contrato se hace primero en `bandadau-docs`
   y luego en cada repo consumidor (`Refs bandadau-docs@<sha>`).
9. **No inventes versiones ni APIs de librerías.** Verifica la documentación
   oficial de la versión instalada (Next.js 16, Expo SDK 57, Spring Boot 4,
   Laravel 12, Angular 21, NestJS 11 tienen cambios respecto a versiones anteriores).
10. **No cambies el catálogo de servicios** sin un ADR en `bandadau-docs/docs/03-arquitectura/adr/`.
11. **Cierra tu sesión documentando** (commit en `bandadau-docs`): estado del UC, `bandadau-docs/docs/02-iconix/07-trazabilidad.md`
    y una entrada en `bandadau-docs/docs/06-plan/registro-de-sesiones.md`.

## Comandos

```bash
# Stack completo (desde el repo de infraestructura; compila desde los repos hermanos)
cd bandadau-infra
make up              # infraestructura + servicios (Docker Compose + Traefik)
make down
make infra-up        # solo Postgres, Mongo, DynamoDB Local, RabbitMQ, MinIO, n8n, LGTM, Mailpit
make seed            # datos de demo
make logs S=<servicio>

# Contratos (desde bandadau-docs)
cd bandadau-docs && make contracts-lint     # Spectral + AsyncAPI + GraphQL
cd bandadau-shared && pnpm contracts:gen    # regenera @bandada/contracts-ts desde ../bandadau-docs/contracts
```

Cada repo y cada componente tiene sus propios comandos en su `AGENTS.md`. Requisito: los 8 repos
clonados como carpetas hermanas dentro de `parcial-II/` (`bandadau-infra/scripts/clone-all.sh`).

## URLs locales

App `http://app.bandada.localhost` · Panel `http://admin.bandada.localhost` ·
Landing `http://bandada.localhost` · API `http://api.bandada.localhost` ·
RabbitMQ `:15672` · n8n `:5678` · Grafana `:3300` · Mailpit `:8025` · MinIO `:9001`.

## Si no sabes algo

Pregunta al usuario antes de tomar una decisión de arquitectura. Para dudas de
implementación menores, elige la opción más simple coherente con estos documentos y
regístrala en el registro de sesiones.
