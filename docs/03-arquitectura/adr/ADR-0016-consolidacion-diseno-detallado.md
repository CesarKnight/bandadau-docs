# ADR-0016 — Consolidación del diseño detallado (propuestas de la fase 3)

- **Estado:** Aceptada
- **Fecha:** 2026-10-14
- **Decisiones relacionadas:** catálogo §3, §5 y §6; D1, D2, D9, D10; modelo de dominio; D15 en `decisiones-clave.md`

## Contexto

Al escribir en paralelo los 24 casos de uso, los contratos y los documentos de arquitectura, los
autores detectaron huecos y divergencias: endpoints que los casos de uso necesitan y no están en D1,
colas faltantes para las subscriptions GraphQL, nombres distintos para lo mismo (firma del QR,
paquetes de recarga, cabecera del webhook, clave de inbox) y enums sin definir. Este ADR fija una
sola versión para que el diseño pueda pasar la *Critical Design Review*.

## Decisión

### 1. Divergencias resueltas

| Tema | Decisión | Descartado |
|---|---|---|
| Firma del QR del ticket | **JWS compacto ES256** con `kid`, verificable offline con la clave pública | HMAC (obliga a repartir el secreto a los porteros) y token propio Ed25519 `BU1.` |
| Paquetes de recarga | `CREDITS_20`, `CREDITS_50`, `CREDITS_100` (RF-19) | `P20…`, `50/100/200/500` |
| Firma del webhook de pago | Cabecera `X-Signature: sha256=<hex>` + anti-replay de 5 min | `X-Bandada-Signature` |
| Tamaño máximo de video | 50 MB (RF-06); imágenes 10 MB | 100 MB |
| Ítem de inbox en DynamoDB | `pk = INBOX#<messageId>`, `sk = META`, TTL 14 días | `MSG#…`, `sk = INBOX` |
| Refresh token en web (PWA y panel) | Cookie `HttpOnly; Secure; SameSite=Strict; Path=/api/v1/auth`; access token en memoria. Nativo: SecureStore. Cabecera `X-Bandada-Client: native\|web\|admin` en login/refresh/exchange | IndexedDB / localStorage |
| `/auth/service-token` | Bloqueado en Traefik (solo red interna) | Exponerlo |
| URI de `type` de Problem | `https://api.bandadau.com/problems/<code-kebab>` | — |
| Runtime PHP | PHP-FPM + nginx por servicio (consumidor y relay como procesos `artisan` aparte) | Octane / FrankenPHP (se puede evaluar luego) |
| Runner de pruebas NestJS | Jest (por defecto de Nest, igual que Homy) | Vitest |
| Base de datos de n8n | SQLite en volumen (Postgres sigue con 3 bases) | `n8n_db` en Postgres |
| Cliente GraphQL (shell + MFEs) | urql | Apollo Client |
| Billetera | Creación perezosa en la primera operación (saldo 0 virtual en `getMyWallet`) | Consumir `user.registered` |
| Token para clientes MCP externos | Token MCP dedicado de 8 h (`aud=mcp`, scope `mcp:tools`, solo ADMIN), emitido desde el panel | Access token de 15 min |
| Costo de la demo (RNF-18) | ≤ USD 60/mes **con apagado programado** del EC2 fuera de horario | 24/7 |

### 2. Catálogo de componentes

- Cola nueva `admin-gateway.subscriptions.<instanceId>` (exclusiva, auto-delete) para las
  subscriptions GraphQL.
- `notification-service.events` agrega `bandada.events.event.cancelled.v1` y
  `bandada.identity.user.preferences-changed.v1`.
- n8n: router único `wf-00-router` consume `n8n.automation` (varios triggers sobre una misma cola se
  repartirían los mensajes); nuevo `wf-06-difusion-evento` para `event.published.v1`.
- Buckets: `bandada-media`, `bandada-reports`, `bandada-models`, `bandada-public`. Usuarios de base:
  Postgres `identity`/`events`/`wallet`; Mongo `social`/`media`.
- DynamoDB: ítems técnicos `INBOX#`, `OUTBOX#` y centinelas (`REG#<id>`/`LOCK` en ticketing,
  `LOCK#monitoring` en insights); GSI1 sobrecargado en `bandada-insights`.
- Piper (TTS local) como contenedor opcional del perfil `llm`.

### 3. Superficie de API y eventos agregada

Se listan en **D15** de `decisiones-clave.md` con su estado de contrato.

### 4. Modelo de dominio

Enums y campos nuevos agregados a `02-modelo-dominio.md` (§ "Ampliaciones ADR-0016"). Cardinalidad
`Registration "1" --> "1..2" SagaInstance` (inscripción y, como máximo, una cancelación).

## Alternativas consideradas

Dejar cada propuesta en su documento de origen y resolverla al implementar. Se descartó porque varios
agentes podrían implementar versiones distintas de lo mismo.

## Consecuencias

- Los contratos marcados `x-proposal: true` que este ADR acepta dejan de ser propuestas; los que
  faltan se agregan antes de implementar (lista en D15).
- La *Critical Design Review* (`bandadau-docs/docs/02-iconix/08-revisiones.md`) se hace contra esta versión.
