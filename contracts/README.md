# bandadau-docs/contracts/ — contratos de Bandada U

Fuente única de verdad de **todas** las interfaces entre componentes. Ningún endpoint, evento,
campo GraphQL ni herramienta MCP se implementa si antes no está aquí (regla 1 de `AGENTS.md`).
Las decisiones normativas que estos contratos materializan están en
`bandadau-docs/docs/03-arquitectura/catalogo-servicios.md` y `bandadau-docs/docs/03-arquitectura/decisiones-clave.md` (D1–D15; D15 = ampliaciones aceptadas por ADR-0016).

## Estructura

```
bandadau-docs/contracts/
├── .spectral.yaml                 # ruleset de lint para OpenAPI
├── openapi/                       # REST (OpenAPI 3.1.0), un archivo por servicio
│   ├── shared/components.yaml     # componentes comunes (Problem, paginación, headers, seguridad…)
│   ├── identity-service.yaml      # S1  /auth, /users, /universities, /.well-known
│   ├── social-service.yaml        # S2  /profiles, /posts, /feed, /follows, /groups, /reports
│   ├── media-service.yaml         # S3  /media
│   ├── events-service.yaml        # S4  /events, /registrations (orquestador SAGA)
│   ├── wallet-service.yaml        # S5  /wallet
│   ├── ticketing-service.yaml     # S6  /tickets
│   ├── notification-service.yaml  # S7  /notifications, /devices
│   └── insights-service.yaml      # S8  /insights
├── asyncapi/bandada-events.yaml   # eventos de dominio y comandos SAGA (AsyncAPI 3.0, CloudEvents 1.0)
├── graphql/admin.graphql          # BFF del panel (admin-gateway, schema-first)
└── mcp/                           # herramientas del servidor MCP (insights-service)
    ├── tools.md
    └── tools.schema.json
```

## Convenciones de los contratos OpenAPI

| Tema | Regla |
|---|---|
| Versión | `openapi: 3.1.0`; cada archivo tiene `info.version` (SemVer) y un `## Changelog` en `info.description`. |
| Servidores públicos | `http://api.bandada.localhost/api/v1` (dev) y `https://api.bandadau.com/api/v1` (prod). Las claves de `paths` son relativas a `/api/v1`. |
| Endpoints internos | Clave de path completa `/internal/v1/...`, tag `internal`, `security: [serviceAuth]` y `servers` a nivel de operación `http://<servicio>:<puerto>` (red interna; el gateway responde 403 a `/internal/**`). Esto evita colisiones de paths con rutas públicas homónimas (`/universities`, `/posts`, `/reports`). |
| Fuera de `/api/v1` | `GET /.well-known/jwks.json` declara `servers` propios (raíz del host). |
| JSON | `camelCase`; sin envoltorio `{success,data}`: la respuesta es el recurso. |
| IDs | `type: string, format: uuid` (UUIDv7 generados por la aplicación o el cliente). |
| Fechas | `format: date-time` en UTC (`2026-10-14T15:04:05Z`); `format: date` en agregados por día. |
| Créditos | `integer` + `int64` (`shared#/components/schemas/Credits`). Nunca decimales. |
| Listas | `allOf: [CursorPageMeta, { items: [...] }]` → `{ items, nextCursor }`; query `cursor` y `limit` (1–50, por defecto 20). |
| Enums | `UPPER_SNAKE_CASE`, idénticos al modelo de dominio (`bandadau-docs/docs/02-iconix/02-modelo-dominio.md`). Excepción: `groupBy` de estadísticas (`day`, `event`…), tal como lo fija D1. |
| Nulos | Campos opcionales de respuesta se declaran `required` con tipo `[T, 'null']`, para que los tipos generados sean exactos. |
| Errores | RFC 9457, `application/problem+json`, esquema `Problem` (`type`, `title`, `status`, `detail`, `instance`, `code`, `traceId`, `errors[]`). `type = https://api.bandadau.com/problems/<code-en-kebab-case>`. `code` en `UPPER_SNAKE_CASE` es **estable** y es lo que traducen los clientes (`@bandada/i18n`). |
| Idioma (D14) | Toda operación acepta `Accept-Language` (`es`/`en`, por defecto `es`) y las respuestas con texto llevan `Content-Language`. `title`/`detail` se localizan; el contenido de usuarios no se traduce. |
| Trazabilidad | `X-Correlation-Id` opcional en la petición (path-level) y siempre devuelto; `traceparent` (W3C) lo maneja OpenTelemetry. |
| Seguridad | `bearerAuth` (JWT RS256 de usuario) por defecto; `security: []` en operaciones públicas; `serviceAuth` (JWT `typ=service`) en `/internal`. Para auditoría, las mutaciones internas exigen `X-Actor-Id` (id del humano que actúa). |
| Ejemplos | `examples` con datos realistas en español en cada request/response; Spectral los valida contra el esquema. |

### Códigos de error comunes

`VALIDATION_FAILED` (400) · `UNAUTHORIZED` (401) · `FORBIDDEN` (403) · `NOT_FOUND` (404) ·
`IDEMPOTENCY_IN_PROGRESS` (409) · `IDEMPOTENCY_KEY_REUSED` (422) · `RATE_LIMITED` (429) ·
`INTERNAL_ERROR` (500) · `SERVICE_UNAVAILABLE` (503). Los códigos de negocio se documentan en
cada operación (p. ej. `EVENT_FULL`, `ALREADY_REGISTERED`, `INSUFFICIENT_FUNDS`,
`CANCELLATION_WINDOW_CLOSED`, `EMAIL_DOMAIN_NOT_ALLOWED`).

### Idempotencia (D3)

- Operaciones ♻️ de D1: parámetro requerido `Idempotency-Key` (`shared#/components/parameters/IdempotencyKey`)
  y header de respuesta `Idempotent-Replayed` en la respuesta 2xx.
- Spectral exige `Idempotency-Key` en **todo `POST` que responda 201 o 202**. Si la operación es
  idempotente por naturaleza o está protegida por otra restricción, se declara
  `x-idempotency-exempt: "<motivo>"` en la operación (p. ej. `completeUpload`, `createHandoffCode`).
- `PUT`/`DELETE`/`PATCH` son idempotentes por diseño y no llevan la clave.

### Extensiones propias

| Extensión | Significado |
|---|---|
| `x-proposal: true` | Elemento que **no** está en D1/D15/modelo de dominio y se propone por ser imprescindible. Debe aprobarse (actualizar `decisiones-clave.md`) antes de implementarse; al aprobarse se quita la marca. |
| `x-idempotency-exempt: "<motivo>"` | Exime un `POST` 201/202 de la regla de `Idempotency-Key`. |

### Componentes compartidos (nombres estables)

`openapi/shared/components.yaml` expone, entre otros: `Problem`, `ValidationProblem`, `FieldError`,
`CursorPageMeta`, `Uuid`, `Credits`, `Locale`, `ThemePreference`, `Role`; parámetros `Cursor`,
`Limit`, `IdempotencyKey`, `CorrelationId`, `AcceptLanguage`, `ActorId`; headers
`IdempotentReplayed`, `ContentLanguage`, `CorrelationId`, `RetryAfter`, `Location`; respuestas
`BadRequest`, `Unauthorized`, `Forbidden`, `NotFound`, `Conflict`, `UnprocessableEntity`,
`TooManyRequests`, `InternalServerError`, `ServiceUnavailable`; seguridad `bearerAuth`, `serviceAuth`.
Se referencian como `$ref: './shared/components.yaml#/components/<sección>/<Nombre>'`.
Cada archivo de servicio re-declara `components.securitySchemes.{bearerAuth,serviceAuth}` con `$ref`
al compartido (los requisitos de seguridad solo pueden nombrar esquemas locales).

## Cómo validar (`make contracts-lint`)

Desde la raíz del repo `bandadau-docs` (rutas relativas al repo):

```bash
# OpenAPI — Spectral con el ruleset del repo (spectral:oas + reglas bandada-*)
npx @stoplight/spectral-cli@6.15.0 lint "contracts/openapi/**/*.yaml" --ruleset contracts/.spectral.yaml --fail-severity error

# AsyncAPI 3.0
npx @asyncapi/cli validate contracts/asyncapi/bandada-events.yaml

# GraphQL — validez del SDL y detección de cambios incompatibles contra main
npx @graphql-inspector/cli validate "contracts/graphql/admin.graphql" "contracts/graphql/admin.graphql"
npx @graphql-inspector/cli diff "git:origin/main:contracts/graphql/admin.graphql" contracts/graphql/admin.graphql

# MCP — esquema JSON de las herramientas
npx ajv-cli compile -s contracts/mcp/tools.schema.json --spec=draft2020
```

Reglas propias de `.spectral.yaml`:

| Regla | Severidad | Qué exige |
|---|---|---|
| `bandada-operation-id-camel-case` | error | `operationId` en camelCase. |
| `bandada-operation-summary` | error | `summary` en toda operación. |
| `bandada-error-responses-problem-json` | error | Toda respuesta 4xx/5xx declara `application/problem+json`. |
| `bandada-idempotency-key-on-create` | error | `POST` con 201/202 exige header `Idempotency-Key` requerido (o `x-idempotency-exempt`). |
| `bandada-idempotent-replayed-header` | warn | Esas operaciones documentan `Idempotent-Replayed`. |
| `bandada-property-camel-case` | warn | Propiedades de esquemas en camelCase. |
| `bandada-internal-uses-service-auth` | error | `/internal/v1/**` con `serviceAuth` y tag `internal`. |

Además se elevan a error `oas3-valid-media-example` / `oas3-valid-schema-example` (los ejemplos
deben validar contra su esquema), `operation-description` y `operation-tag-defined`.

Para detectar cambios incompatibles en OpenAPI entre ramas:

```bash
npx oasdiff breaking <(git show origin/main:contracts/openapi/events-service.yaml) contracts/openapi/events-service.yaml
```

(`oasdiff` resuelve `$ref` externos si se ejecuta sobre archivos en disco; en CI se hace checkout de
`main` en un directorio aparte y se compara archivo a archivo.)

## Cómo generar tipos (`pnpm contracts:gen` en `bandadau-shared`)

Los tipos TypeScript van a `bandadau-shared/packages/contracts-ts` (`@bandada/contracts-ts`) con
[openapi-typescript](https://openapi-ts.dev/) 7.x, uno por servicio. El script `contracts:gen` de
`bandadau-shared` lee los contratos del repo hermano (`../bandadau-docs/contracts`); equivale a:

```bash
cd bandadau-shared
for f in ../bandadau-docs/contracts/openapi/*-service.yaml; do
  name=$(basename "$f" .yaml)
  npx openapi-typescript@7.4.4 "$f" -o "packages/contracts-ts/src/openapi/${name}.d.ts"
done
```

Uso típico con `openapi-fetch`: `createClient<paths>({ baseUrl })` importando
`paths`/`components` de `@bandada/contracts-ts/openapi/events-service`. Los archivos generados
**no se editan a mano**; se regeneran y se commitean junto con el cambio de contrato.
Java (Spring) usa `openapi-generator` (solo modelos/interfaces) y PHP usa DTOs verificados por
pruebas de contrato (ver `bandadau-docs/docs/04-patrones-y-reglas/convenciones-generales.md` §5).

## Política contract-first

1. **Primero el contrato**: se edita el archivo en `bandadau-docs/contracts/` en un PR (puede ser el mismo PR que
   los clientes generados, nunca uno con implementación sin contrato).
2. `make contracts-lint` debe pasar sin errores.
3. `cd bandadau-shared && pnpm contracts:gen` y commit de `packages/contracts-ts` en ese repo (`Refs bandadau-docs@<sha>`).
4. Recién entonces se implementa. En CI, pruebas de contrato (Schemathesis contra el servicio
   levantado) fallan si la implementación diverge.
5. Si un servicio necesita algo que no está en D1, se agrega al contrato con `x-proposal: true`
   y se registra en `bandadau-docs/docs/06-plan/registro-de-sesiones.md` para aprobación.

## Versionado y cambios incompatibles

- **`info.version` (SemVer) por archivo** + entrada en el `## Changelog` de `info.description`.
  - *patch*: descripciones, ejemplos, correcciones sin efecto en el wire.
  - *minor*: cambios compatibles — endpoint nuevo, campo de respuesta nuevo, parámetro o campo
    de request **opcional** nuevo, nuevo valor de `code` de error.
  - *major*: cambio incompatible (ver abajo) → nueva versión de ruta `/api/v2` conviviendo con
    `/api/v1` durante la transición.
- **Son breaking**: quitar/renombrar un endpoint, campo, parámetro o componente compartido;
  cambiar un tipo o formato; volver requerido algo opcional en el request; quitar un valor de
  enum de respuesta o agregar uno a un enum de request que el servidor ya no acepte; cambiar
  el significado de un `code`; endurecer validaciones (longitudes, rangos).
- **Agregar valores a enums de respuesta** es compatible solo si los clientes son tolerantes:
  todos los clientes deben tratar valores desconocidos (mostrar un genérico) — es obligatorio.
- **Eventos (AsyncAPI)**: versión en el tipo (`.v1`); quitar o cambiar campos exige `.v2` y
  publicar ambas versiones durante la transición. Los consumidores toleran campos nuevos.
- **GraphQL**: sin versión; se evoluciona agregando campos y marcando con `@deprecated(reason:)`
  antes de eliminar. `graphql-inspector diff` en CI bloquea cambios breaking no anunciados.
- **Componentes compartidos**: un cambio en `openapi/shared/components.yaml` afecta a los 8
  servicios; requiere revisión de un responsable de cada servicio afectado.
