# Marca y dominio — Bandada U

## Nombre

**Bandada U** — una *bandada* de parabas (aves que vuelan juntas y se comunican en
grupo) + la **U** de universidad. Comunica comunidad estudiantil al instante.

| Uso | Forma | Ejemplo |
|---|---|---|
| Nombre comercial / UI / docs | `Bandada U` | "Bienvenido a Bandada U" |
| Slug técnico (código, imágenes Docker, exchanges, tablas, paquetes) | `bandada` | `bandada.events`, `bandada-ticketing`, `@bandada/ui-tokens` |
| Dominio | `bandadau` | `bandadau.com` |
| Bundle / package id móvil | `com.bandadau.app` | iOS y Android |
| Scheme de deep links | `bandadau://` | `bandadau://events/0193…` |

Se descartó el nombre de trabajo "Nexo" porque coincide con una empresa fintech conocida.

## Dominio

La compra y gestión del dominio está a cargo del equipo. La documentación usa
`bandadau.com` como valor de referencia; en código y despliegue siempre se lee de
`BASE_DOMAIN`.

## Subdominios

| Subdominio | Componente |
|---|---|
| `bandadau.com` / `www` | Landing (F1) |
| `app.bandadau.com` | App web PWA (F5) |
| `admin.bandadau.com` | Panel admin shell (F2) |
| `mfe.bandadau.com` | Bundles de microfrontends (F3, F4) |
| `api.bandadau.com` | Gateway REST + GraphQL + MCP |
| `n8n.bandadau.com` | n8n (protegido, solo equipo) |
| `grafana.bandadau.com` | Observabilidad (protegido) |

Local: los mismos con `bandada.localhost` (`app.bandada.localhost`, …). El dominio se
parametriza con `BASE_DOMAIN`; ningún código debe tener el dominio escrito a mano.

## Identidad visual (punto de partida)

- Paleta inspirada en la paraba barba azul / paraba roja: azul `#1E5AA8` (primario),
  amarillo `#F5B700` (acento), rojo `#D7263D` (alertas/énfasis), neutros cálidos.
- Isotipo: tres siluetas de ave en formación de "U".
- Tokens en `bandadau-shared/packages/ui-tokens` (fuente única para landing, admin, MFEs y app), con modos claro y
  oscuro. Los hex de arriba son **primitivos**: en código nunca se usan directamente (ver
  `bandadau-docs/docs/04-patrones-y-reglas/design-tokens-y-temas.md`).
