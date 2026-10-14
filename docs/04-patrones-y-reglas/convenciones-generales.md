# Convenciones generales

Reglas que aplican a **todos** los repositorios del workspace (ADR-0017). Las reglas por tecnología están en los
demás archivos de esta carpeta y en el `AGENTS.md` de cada componente.

## 1. Idioma

| Qué | Idioma |
|---|---|
| Identificadores, archivos, rutas, tablas, colecciones, enums, tipos de evento, ramas, commits | **Inglés** |
| Texto visible al usuario (UI, emails, push, mensajes de error `title`/`detail`) | **Español (principal) e inglés**, siempre vía i18n — nunca literal en código (ver `i18n.md`) |
| Documentación (`bandadau-docs/docs/`, `AGENTS.md`, ADRs) | **Español** |
| Comentarios de código | Inglés, y solo cuando el *por qué* no es obvio |

## 2. Nombres

| Elemento | Convención | Ejemplo |
|---|---|---|
| Carpeta de servicio | `kebab-case` + `-service` | `wallet-service` |
| Rutas REST | plural, `kebab-case`, versión en prefijo | `/api/v1/events/{eventId}/registrations` |
| JSON | `camelCase` | `priceCredits`, `startsAt` |
| Query params | `camelCase` | `?cursor=…&limit=20` |
| Enums | `UPPER_SNAKE_CASE` | `CANCELLATION_PENDING` |
| Tablas Postgres | `snake_case` plural | `ledger_entries` |
| Colecciones Mongo | `camelCase` plural | `posts`, `groupMemberships` |
| Tablas DynamoDB | `bandada-<contexto>` | `bandada-ticketing` |
| Tipos de evento | `bandada.<contexto>.<entidad>.<verbo-pasado>.v<n>` | `bandada.events.registration.confirmed.v1` |
| Comandos | `bandada.<contexto>.cmd.<verbo>.v<n>` | `bandada.wallet.cmd.debit-credits.v1` |
| Variables de entorno | `UPPER_SNAKE_CASE`, prefijo por servicio solo si es ambiguo | `DATABASE_URL`, `RABBITMQ_URL` |
| Públicas de build | `NEXT_PUBLIC_*`, `EXPO_PUBLIC_*`, `NG_APP_*`, `VITE_*` | `EXPO_PUBLIC_API_URL` |
| Web components | `bandada-mfe-<nombre>` | `<bandada-mfe-moderation>` |
| Paquetes TS | `@bandada/<nombre>` | `@bandada/messaging-ts` |
| Paquetes Java | `com.bandadau.<servicio>` | `com.bandadau.events.domain` |
| Namespaces PHP | `Bandada\<Servicio>\` | `Bandada\Wallet\Domain` |

## 2.1 UI: tokens e i18n

- Estilos solo con tokens de `@bandada/ui-tokens` (ver `design-tokens-y-temas.md`); toda pantalla funciona en modo claro y oscuro.
- Textos solo con claves de traducción (ver `i18n.md`); `es` es el idioma fuente.

## 3. Git

- **Un repositorio por capa** (ADR-0017): `bandadau-docs`, `bandadau-shared`, `bandadau-backend`,
  `bandadau-frontend`, `bandadau-admin`, `bandadau-landing`, `bandadau-infra`, `bandadau-ml`.
  **Commits y push por repositorio**; nunca mezclar repos en un mismo cambio.
- Ramas en cada repo: `main` (estable, demo), `develop` (integración), `feat/<area>-<slug>`,
  `fix/<area>-<slug>`, `docs/<slug>`. `<area>` = servicio o app dentro del repo
  (`wallet`, `shell`, `mfe-moderation`, `iconix`…).
- Cambio de contrato: primero commit en `bandadau-docs` (`contracts/`), luego en cada repo consumidor
  con `Refs bandadau-docs@<sha>`.
- **Conventional Commits** con scope = componente:
  `feat(wallet): add top-up idempotency`, `docs(iconix): robustness for UC-12`.
- Dentro de un repo, un commit no mezcla servicios/apps salvo cambios de tipos generados de un contrato.
- PR pequeño, con checklist de `definition-of-done.md` y referencia al UC (`Refs UC-12`).
- Nunca commitear `.env`, llaves, `*.pem`, modelos ONNX > 50 MB (van a S3/MinIO, ver `bandadau-ml/AGENTS.md`).

## 4. Versionado

- Servicios y apps: SemVer en su manifiesto (`package.json`, `build.gradle.kts`, `composer.json`).
- APIs: versión mayor en la ruta (`/api/v1`). Cambios incompatibles → `/api/v2` conviviendo.
- Eventos: versión en el tipo (`.v1`). Un consumidor debe tolerar campos nuevos; quitar
  o cambiar campos exige `.v2` y publicar ambas durante la transición.
- Contratos: cada archivo en `bandadau-docs/contracts/` tiene `info.version` y changelog.

## 5. Contract-first

1. Se edita el contrato (`bandadau-docs/contracts/openapi|asyncapi|graphql|mcp`).
2. Se valida (`cd bandadau-docs && make contracts-lint`).
3. Se regeneran tipos (`cd bandadau-shared && pnpm contracts:gen` → `bandadau-shared/packages/contracts-ts`, OpenAPI generator para Java, jane/openapi para PHP o DTOs manuales verificados por test).
4. Recién entonces se implementa. El CI falla si la implementación diverge
   (pruebas de contrato con Schemathesis/Dredd contra el servicio levantado).

## 6. Configuración y secretos

- 12-factor: toda configuración por variables de entorno; cada servicio tiene
  `.env.example` completo y **valida al arrancar** (fail fast).
- Secretos en prod: AWS Secrets Manager / SSM Parameter Store, inyectados en el host.
- Ningún dominio, puerto o URL escrita a mano en código: siempre de configuración.

## 7. Logs, errores y trazas

- Logs JSON a stdout: `timestamp`, `level`, `service`, `traceId`, `spanId`,
  `correlationId`, `userId` (si hay), `message`, `event` (nombre estable).
- Nunca loguear contraseñas, tokens, códigos de verificación ni contenido de posts.
- Errores REST en Problem Details (ver `api-rest-guidelines.md`).

## 8. Fechas, dinero, IDs

- Fechas en UTC en backend; la UI formatea en `America/La_Paz` con el locale del usuario (`es-BO` / `en-US`).
- Créditos como enteros (`BIGINT` / `int64` / `NumberLong`). Nada de floats.
- IDs UUIDv7 generados por la aplicación (no por la base), salvo tablas puramente
  técnicas.

## 9. Calidad mínima por lenguaje

| Lenguaje | Formato | Lint | Pruebas | Arquitectura |
|---|---|---|---|---|
| Java | Spotless (google-java-format) | Checkstyle/ErrorProne | JUnit 5 + Testcontainers | ArchUnit |
| TypeScript | Prettier (`singleQuote`, `trailingComma: all`) | ESLint flat config | Jest/Vitest + Testcontainers | dependency-cruiser |
| PHP | Laravel Pint (PSR-12) | PHPStan nivel 8 / Larastan | Pest + Testcontainers/Docker | Deptrac |
| Python (`bandadau-ml/`) | Ruff format | Ruff | pytest (sobre utilidades) | — |
