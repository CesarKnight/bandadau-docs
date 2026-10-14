# Guía de API REST

Aplica a todas las APIs REST públicas (`/api/v1/**`) e internas (`/internal/v1/**`)
de S1–S8. La superficie canónica de cada servicio está en
`bandadau-docs/docs/03-arquitectura/decisiones-clave.md` D1; los contratos en `bandadau-docs/contracts/openapi/`.
GraphQL del panel: `graphql-admin.md`. Eventos: `eventos-y-mensajeria.md`.

## 1. Contract-first con OpenAPI 3.1

1. Un archivo por servicio: `bandadau-docs/contracts/openapi/<servicio>.yaml` (`info.version` SemVer + changelog).
2. Todo `operationId` en `camelCase` y **exactamente** el de D1.
3. Esquemas reutilizables compartidos en `bandadau-docs/contracts/openapi/shared/components.yaml`
   (`Problem`, `CursorPage`, cabeceras `IdempotencyKey`, `CorrelationId`, `AcceptLanguage`,
   respuestas `401`, `403`, `404`, `409`, `422`, `429`).
4. Lint con **Spectral** (`make contracts-lint`) usando el ruleset del repo
   (`bandadau-docs/contracts/.spectral.yaml`): `operationId` obligatorio, ejemplos en cada respuesta 2xx,
   `application/problem+json` en todo 4xx/5xx, sin `additionalProperties: true` en requests.
5. Tipos generados: TS → `bandadau-shared/packages/contracts-ts`; Java → `openapi-generator` (solo DTOs/interfaces
   de `interfaces/rest` o `adapter/in/web`); PHP → DTOs manuales validados por prueba de contrato.
6. El servicio valida su implementación contra el contrato en CI (Schemathesis, ver `testing-strategy.md`).

## 2. Recursos y rutas

- Sustantivos en **plural**, `kebab-case`, máximo dos niveles de anidación:
  `/api/v1/events/{eventId}/registrations`.
- IDs en la ruta: UUIDv7 con nombre explícito (`{postId}`, nunca `{id}`).
- Alias del usuario autenticado: `/me` (`/users/me`, `/wallet/me`, `/tickets/me`).
- **Acciones que no son CRUD** como sub-recurso verbo, solo cuando representan una
  transición de estado: `POST /events/{eventId}/publish`, `POST /registrations/{id}/cancel`,
  `POST /media/{mediaId}/complete`, `POST /insights/alerts/{id}/ack`.
- Relaciones "del usuario actual" idempotentes con `PUT`/`DELETE`:
  `PUT /follows/{userId}`, `PUT /posts/{postId}/reactions/me`.
- JSON `camelCase`; enums `UPPER_SNAKE_CASE`; fechas ISO-8601 UTC con `Z`; créditos enteros
  (`amountCredits`, `priceCredits`); claves de almacenamiento nunca expuestas: se exponen URLs
  prefirmadas (`url`, `thumbnailUrl`) con su `expiresAt` si aplica.
- **Sin envoltorio**: la respuesta es el recurso. Listas: `{ "items": [...], "nextCursor": "…" | null }`.

## 3. Verbos y códigos de estado

| Operación | Verbo | Éxito | Notas |
|---|---|---|---|
| Leer recurso | GET | 200 | `ETag` opcional (§9) |
| Listar | GET | 200 | Paginación por cursor (§6) |
| Crear (síncrono) | POST ♻️ | **201** + `Location` | Cuerpo = recurso creado |
| Crear/acción **asíncrona** | POST ♻️ | **202** + `Location` del recurso de estado | `registerToEvent`, `cancelRegistration`, `requestReport` |
| Reemplazar / relación idempotente | PUT | 200 (o 204) | `setReaction`, `registerDevice`, `follow` |
| Modificar parcial | PATCH | 200 | JSON Merge Patch (`application/merge-patch+json`) |
| Eliminar | DELETE | **204** | Repetir sobre recurso ya eliminado → 204 (idempotente) |
| Transición de estado | POST ♻️ | 200 con el recurso | `publish`, `ack`, `read` |

Códigos de error permitidos: `400` (JSON mal formado), `401`, `403`, `404`, `409`
(conflicto de estado/negocio), `412` (precondición `If-Match` falló), `415`, `422`
(validación semántica y `IDEMPOTENCY_KEY_REUSED`), `428` (falta `If-Match` donde es
obligatorio), `429`, `500`, `502`/`503`/`504` (dependencia caída o timeout).

### 3.1 Operaciones asíncronas (202)

```http
POST /api/v1/events/0192.../registrations
Idempotency-Key: 6f1c...
→ 202 Accepted
Location: /api/v1/registrations/0193...
Retry-After: 1
{ "registrationId": "0193...", "status": "PENDING" }
```

El cliente hace *polling* a `GET /registrations/{id}` respetando `Retry-After`
(1–2 s, máximo 30 s) o espera el push. Estados finales: `CONFIRMED`, `FAILED` (con
`failureReason` = código estable, p. ej. `INSUFFICIENT_FUNDS`).

## 4. Errores: RFC 9457 Problem Details

`Content-Type: application/problem+json`. Campos:

```json
{
  "type": "https://bandadau.com/problems/insufficient-funds",
  "title": "Saldo insuficiente",
  "status": 409,
  "detail": "Necesitas 50 créditos y tienes 20.",
  "instance": "/api/v1/events/0192.../registrations",
  "code": "INSUFFICIENT_FUNDS",
  "correlationId": "c0ffee...",
  "errors": [ { "field": "text", "code": "TOO_LONG", "params": { "max": 2000 } } ]
}
```

- `code` (extensión) es **estable**, `UPPER_SNAKE_CASE`, en inglés y documentado en el
  contrato. Los clientes **traducen por `code`** (`@bandada/i18n`, D14); nunca parsean `title`.
- `title`/`detail` se **localizan** según `Accept-Language` (`es` por defecto, `en`
  soportado) y la respuesta lleva `Content-Language`. Los catálogos de mensajes viven en
  cada servicio (`messages/{es,en}` en Spring, `lang/{es,en}` en Laravel, `locales/{es,en}`
  en Nest).
- `errors[]` solo en validación (422/400), con `field` en notación JSON pointer simple.
- Nunca stack traces, SQL ni nombres de clases. 5xx → `code: INTERNAL_ERROR` + `correlationId`.

Catálogo mínimo de códigos transversales: `VALIDATION_FAILED`, `MALFORMED_REQUEST`,
`UNAUTHENTICATED`, `TOKEN_EXPIRED`, `FORBIDDEN`, `NOT_FOUND`, `CONFLICT`,
`CONCURRENT_MODIFICATION`, `PRECONDITION_FAILED`, `PRECONDITION_REQUIRED`,
`IDEMPOTENCY_KEY_REUSED` (422), `IDEMPOTENCY_IN_PROGRESS` (409),
`IDEMPOTENCY_KEY_REQUIRED` (400), `RATE_LIMITED` (429), `DEPENDENCY_UNAVAILABLE` (503),
`DEPENDENCY_TIMEOUT` (504), `INTERNAL_ERROR`. Códigos de negocio por servicio
(`EVENT_FULL`, `ALREADY_REGISTERED`, `INSUFFICIENT_FUNDS`, `EMAIL_DOMAIN_NOT_ALLOWED`,
`TICKET_ALREADY_USED`, `MEDIA_REJECTED`…) se declaran en su OpenAPI.

## 5. Autenticación y autorización

- `Authorization: Bearer <JWT>` emitido por identity (RS256), validado por JWKS
  (`/.well-known/jwks.json`) con caché; nunca se llama a identity por petición.
- Claims usados: `sub`, `roles[]`, `universityId`, `locale`, `typ` (`user|service`).
- Roles por operación declarados en OpenAPI (`x-roles: [ORGANIZER]`) y aplicados en el borde
  (guard / filtro), y las reglas de propiedad (dueño del post, organizador del evento) en el caso de uso.
- `/internal/v1/**` exige `typ=service` y el gateway Traefik lo bloquea (403).

## 6. Paginación por cursor

- Parámetros: `cursor` (opaco), `limit` (por defecto 20, máximo 100; fuera de rango → 422).
- Respuesta `{ items, nextCursor }`; `nextCursor: null` = fin. Sin `total` (caro) salvo
  endpoints internos de estadística.
- Cursor = base64url de `{"k": <valor de orden>, "id": "<uuidv7>"}`; el servidor lo valida
  (cursor inválido → 400 `INVALID_CURSOR`). Orden estable siempre con desempate por `id`.
- Feed (`getFeed`): el cursor además lleva la versión del ranking para no repetir ítems.

## 7. Filtros, orden y búsqueda

- Filtros como query params con nombre del campo: `?status=OPEN`, `?from=2026-10-01T00:00:00Z&to=…`,
  `?public=true`, `?query=calculo` (texto libre).
- Listas de valores separadas por coma: `?status=FAILED,COMPENSATED`.
- Orden: `?sort=startsAt` / `?sort=-createdAt` solo sobre campos declarados en el contrato.
- Parámetros desconocidos → se ignoran en GET públicos; en `/internal` → 400.

## 8. Idempotencia (`Idempotency-Key`)

Obligatoria en los endpoints ♻️ de D1 (sin ella → 400 `IDEMPOTENCY_KEY_REQUIRED`).
Implementación común (D3): `@bandada/idempotency-ts` (Nest), filtro equivalente en Spring
y middleware en Laravel, todos sobre la tabla `bandada-idempotency`
(`pk = <service>#<key>`, TTL 24 h).

| Situación | Respuesta |
|---|---|
| Clave nueva | Ejecuta, guarda status + body, responde normal |
| Misma clave + mismo hash del body | Respuesta guardada + `Idempotent-Replayed: true` |
| Misma clave + distinto hash | `422 IDEMPOTENCY_KEY_REUSED` |
| Misma clave en curso | `409 IDEMPOTENCY_IN_PROGRESS` + `Retry-After: 1` |
| Error 5xx | No se guarda como `COMPLETED` (se permite reintentar) |

El hash cubre método + ruta + body canónico + `sub` del usuario. Los clientes generan
la clave (UUIDv4/v7) **una vez por intención** del usuario y la reutilizan en reintentos
(la cola offline la persiste junto a la mutación).

## 9. Concurrencia optimista: `ETag` / `If-Match` (opcional)

- Recursos editables (`PATCH /profiles/me`, `PATCH /internal/v1/users/{id}`, `PUT /notifications/preferences`)
  devuelven `ETag: W/"<version>"`.
- Si el cliente envía `If-Match` y no coincide → `412 PRECONDITION_FAILED`.
- Obligatorio (`428` si falta) solo en `/internal` de administración de usuarios y universidades.
- GET con `If-None-Match` → `304` (útil en `GET /events/{id}` desde la landing y la PWA).

## 10. Rate limiting

- Borde: middleware `rateLimit` de Traefik por IP para `/api/v1/auth/**` y global por IP.
- Servicio: límites por usuario en operaciones sensibles (`resendVerificationCode`, `login`,
  `createTopUp`, `requestReport`).
- Exceso → `429 RATE_LIMITED` con `Retry-After` (segundos). Los servicios que limiten por
  usuario añaden `RateLimit-Policy` y `RateLimit` (draft IETF *RateLimit header fields*;
  verificar la versión del draft al implementar). Los clientes solo dependen de `Retry-After`.

## 11. Llamadas internas servicio → servicio

Para `admin-gateway`, `insights-service` (herramientas MCP), `social-service → media-service`, etc.:

| Regla | Valor |
|---|---|
| Autenticación | Token de servicio (`POST /auth/service-token`, cacheado hasta 60 s antes de expirar) |
| Timeout | conexión 1 s, respuesta 3 s (reportes/estadísticas: 10 s) |
| Reintentos | solo GET/PUT idempotentes: 2 reintentos, backoff exponencial con *jitter* (100 ms base) |
| Circuit breaker | abre con ≥ 50 % de fallos en ventana de 20 llamadas; semiabierto a los 30 s |
| Bulkhead | máximo 20 llamadas concurrentes por dependencia |
| Fallback | degradar (dato parcial + campo `degraded: true` en BFF) o `503 DEPENDENCY_UNAVAILABLE` |
| Propagación | `traceparent`, `X-Correlation-Id`, `Accept-Language` |

Librerías (verificar versión al implementar): Java → Resilience4j; Node → `opossum` o
wrapper en `@bandada/*`; PHP → cliente HTTP de Laravel con `timeout()`/`retry()` + breaker
simple en caché.

**Prohibido** encadenar llamadas síncronas en el flujo crítico de una escritura de
usuario (usar eventos o la SAGA).

## 12. Cabeceras estándar

| Cabecera | Dirección | Uso |
|---|---|---|
| `Authorization` | req | Bearer JWT |
| `Idempotency-Key` | req | §8 |
| `X-Correlation-Id` | req/resp | Si no llega, el servicio lo genera y lo devuelve |
| `traceparent` / `tracestate` | req | W3C Trace Context (OpenTelemetry) |
| `Accept-Language` | req | `es` (defecto) o `en`; localiza Problem Details y contenidos generados |
| `Content-Language` | resp | Idioma de `title`/`detail` |
| `Location` | resp | 201/202 |
| `Retry-After` | resp | 202, 409 en curso, 429, 503 |
| `ETag` / `If-Match` / `If-None-Match` | ambos | §9 |
| `Idempotent-Replayed` | resp | `true` en respuesta repetida |

## 13. CORS

- Lo resuelve **Traefik** (middleware `headers`) para todas las rutas públicas; los servicios
  no configuran CORS propio (evita cabeceras duplicadas).
- Orígenes permitidos por entorno, sin `*`: `http://app.bandada.localhost`,
  `http://admin.bandada.localhost`, `http://mfe.bandada.localhost`, `http://bandada.localhost`
  (y sus equivalentes `*.bandadau.com` en producción, parametrizados con `BASE_DOMAIN`).
  En desarrollo con Metro/Vite directo también `http://localhost:8081`, `:3000`, `:3001`, `:4201`, `:4301`.
- Cabeceras permitidas: `Authorization, Content-Type, Idempotency-Key, X-Correlation-Id,
  traceparent, Accept-Language, If-Match, If-None-Match`. Expuestas: `Location, ETag,
  Retry-After, Idempotent-Replayed, X-Correlation-Id, Content-Language, RateLimit, RateLimit-Policy`.
- Webhooks (`/wallet/webhooks/payment`) no requieren CORS (servidor a servidor).

## 14. Versionado y evolución

- Versión mayor en la ruta (`/api/v1`). Cambios **compatibles** (campo opcional nuevo,
  nuevo endpoint, nuevo valor de enum *documentado como extensible*) en la misma versión.
- Incompatibles → `/api/v2` en paralelo, con `Deprecation` y `Sunset` en la v1.
- Los clientes ignoran campos desconocidos. Enums: los clientes tienen rama `default`.

## 15. Health y metadatos

`GET /health/live` (sin dependencias) y `GET /health/ready` (DB + broker), sin auth,
fuera de `/api/v1`, no publicados por el gateway salvo para el agente de monitoreo vía red interna.

## 16. Anti-patrones

- ❌ `{ success, data }` u otros envoltorios; ❌ `200` con `{ error: ... }`.
- ❌ Paginación por `offset/page` en listas que crecen (feed, entries, notificaciones).
- ❌ Verbos en la ruta para CRUD (`/createPost`); ❌ `{id}` genérico.
- ❌ Floats para créditos; fechas sin zona.
- ❌ Mensajes de error solo en español o concatenados; clientes que muestran `detail` sin
  mapear `code`.
- ❌ Endpoint implementado que no está en `bandadau-docs/contracts/openapi`.
- ❌ Llamadas internas sin timeout o con reintentos sobre POST no idempotentes.
- ❌ Exponer claves S3, IDs internos de base o `version` de JPA fuera de `ETag`.
