# ADR-0007 — JWT RS256 con JWKS y handoff SSO

- **Estado:** Aceptada
- **Fecha:** 2026-10-14
- **Decisores:** Equipo Grupo 24 (Ing. Software II)

## Contexto

Un único proveedor de identidad debe servir a app, panel, MCP y servicios en 3 lenguajes, y la
cátedra pide acceso por una sola entrada (T13) entre app y panel.

## Decisión

`identity-service` emite **JWT RS256** (15 min) validados localmente por cada servicio con **JWKS**;
refresh opaco rotativo (30 días) con detección de reutilización; tokens de servicio por *client
credentials* (`typ=service`). Salto app ↔ panel con **handoff code** de un solo uso (60 s) + PKCE S256. D4.

## Alternativas consideradas

| Alternativa | Motivo de descarte |
|---|---|
| HS256 con secreto compartido | Cualquier servicio podría emitir tokens; rotación difícil. |
| Keycloak/Cognito | Completo pero pesado o con costo y menos didáctico. |
| Sesión compartida por cookie de dominio | No sirve para app nativa ni entre subdominios con apps estáticas. |

## Consecuencias

- (+) Validación sin llamada a identity; rotación de llaves vía `kid`.
- (+) SSO sin re-login demostrable en la defensa.
- (−) Revocación de access tokens solo por expiración (15 min).
- (−) Debemos implementar con cuidado el handoff (un uso, hash, PKCE).

## Referencias

D4, `seguridad-y-sso.md`
