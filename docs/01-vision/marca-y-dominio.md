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

## Identidad visual

El kit de marca vive en `bandadau-brand/` (SVG, PNG de app-icons y `react-native/BandadaLogo.tsx`;
ver su `README.md`). Concepto: **nueve aves en vuelo forman una U**; la última (arriba a la derecha)
es la que guía y lleva el amarillo de la paraba.

| Color | Hex | Uso |
|---|---|---|
| Azul río | `#1238A8` | Primario (marca, acciones) |
| Azul noche | `#0A1F66` | Fondos oscuros, splash |
| Azul cielo | `#1A52D6` | Variante clara del primario |
| Amarillo paraba | `#FFC21A` | Acento sobre fondos oscuros |
| Ámbar | `#F5A100` | Acento sobre fondos claros |
| Rojo | `#D7263D` | Alertas / énfasis (`highlight`) |

Tipografía del wordmark: **Nunito ExtraBold** vectorizada (no requiere instalar fuentes).

- Estos hex son **primitivos**: los tokens de `bandadau-shared/packages/ui-tokens` los consumen en la
  capa semántica (`color.brand.*`, `color.action.*`); en código la UI usa **solo tokens semánticos**
  (`bandadau-docs/docs/04-patrones-y-reglas/design-tokens-y-temas.md`), nunca los hex directamente.
- Aplicación del kit (iconos iOS/Android, splash, notificaciones, favicon) en el `app.config` de la app
  móvil; ver `bandadau-brand/README.md`.
