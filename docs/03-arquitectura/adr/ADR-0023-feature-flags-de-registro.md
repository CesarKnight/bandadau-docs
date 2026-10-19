# ADR-0023 — Feature flags de registro: correo institucional y verificación por código

- **Estado:** Propuesta (sin implementar; pendiente de decisión)
- **Fecha:** 2026-10-19
- **Decisores:** equipo Bandada U (pendiente)
- **Decisiones relacionadas:** UC-01, UC-21, `seguridad-y-sso.md`, ADR-0018

## Contexto

Hoy el registro (UC-01) exige un correo cuyo dominio pertenezca a una `University` habilitada
(`InstitutionalEmailPolicy`) y un código de 6 dígitos enviado por correo (`VerifyEmailService`) antes de pasar el
usuario de `PENDING_VERIFICATION` a `ACTIVE`. Eso es correcto en producción, pero estorba en demos, pruebas y
entornos donde no hay SMTP real ni correos institucionales. No existe un sistema de feature flags en el backend;
el panel solo tiene una variable de build (`NEXT_PUBLIC_FEATURE_INSIGHTS`).

## Decisión (propuesta)

Dos flags independientes, ambas **encendidas por defecto**, administrables en caliente por un ADMIN:

| Flag | Si está apagada |
|---|---|
| `registration.requireInstitutionalEmail` | Se acepta cualquier correo; `universityId` pasa a opcional. |
| `registration.requireEmailVerification` | El usuario nace `ACTIVE` y `register` devuelve la sesión; no se envía código. |

- **Almacenamiento:** tabla `feature_flags` (`key`, `enabled`, `updated_by`, `updated_at`) en `identity_db` (migración Flyway),
  porque `identity-service` es quien decide (database per service). Lectura con caché corta (~30 s) tras un `FeatureFlagsPort`.
- **API:** `GET /api/v1/auth/config` público (la app oculta el selector de universidad y la pantalla de verificación);
  `/internal/v1/feature-flags` (GET/PUT, scopes D-7) y GraphQL `featureFlags` / `setFeatureFlag` (`@auth(ADMIN)`) vía `admin-gateway`.
- **Panel:** pestaña «Configuración» (ADMIN) en `bandadau-admin/shell`, con un switch por flag, aviso visible cuando alguna esté apagada
  y registro de quién y cuándo cambió.
- **Orden (contract-first):** contratos (OpenAPI identity, `admin.graphql`) → UC-01/UC-21 → identity → gateway → panel → app.

## Decisiones abiertas

1. **Sin correo institucional:** `universityId` opcional afecta al claim `uni` del JWT, al perfil en `social` y a los reportes.
   Se sugiere universidad opcional con `uni` nulo y revisar los consumidores.
2. **Sin verificación:** el correo queda sin comprobar (`emailVerifiedAt = null`). Se sugiere publicar `user.registered` al registrarse
   para que `social`, `notification` y n8n sigan funcionando; la alternativa (no publicarlo) deja al usuario sin perfil.

## Alternativas consideradas

| Alternativa | Motivo de descarte |
|---|---|
| Variables de entorno (`REGISTER_REQUIRE_*`) | Exigen redeploy y no son administrables desde el panel. |
| Una sola flag «modo demo» | Mezcla dos comportamientos que se quieren combinar por separado. |
| Flags en el `admin-gateway` | Rompe database per service; identity es quien aplica la regla. |

## Consecuencias

- (+) Demos y entornos sin SMTP ni dominios institucionales; cambio en caliente y auditable.
- (−) Con las flags apagadas se pueden registrar correos ajenos; por eso nacen encendidas, con aviso en el panel.
- (−) Toca 5 repos (docs, backend, shared por contratos generados, admin, frontend): un commit por repo.
