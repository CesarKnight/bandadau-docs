# ADR-0006 — Microfrontends con Web Components en runtime

- **Estado:** Aceptada
- **Fecha:** 2026-10-14
- **Decisores:** Equipo Grupo 24 (Ing. Software II)

## Contexto

La cátedra exige microfrontends (T2) y frontends en Angular y React (C3). El panel debe integrar
módulos de distinto framework desplegables por separado.

## Decisión

Shell **Next.js 16 static export** que carga en runtime, desde `mfe-manifest.json`, **Custom
Elements** con Shadow DOM: `<bandada-mfe-moderation>` (Angular 21 + Angular Elements) y
`<bandada-mfe-insights>` (React 19 + Vite). Contrato por atributos/propiedades y `CustomEvent`
(`bandada:navigate`, `bandada:toast`, `bandada:auth-expired`); sin estado global compartido. D5.

## Alternativas consideradas

| Alternativa | Motivo de descarte |
|---|---|
| Module Federation | Acopla versiones de bundler y es frágil entre Angular y React/Next. |
| iframes | Aislamiento total pero mala UX (scroll, tema, auth) y accesibilidad. |
| Composición en build | No hay despliegue independiente. |

## Consecuencias

- (+) Agnóstico de framework y estándar del navegador; despliegue independiente versionado.
- (+) Variables CSS de tokens atraviesan el Shadow DOM (ADR-0014).
- (−) Cada MFE trae su runtime (más KB).
- (−) Comunicación limitada a atributos/eventos (deliberado).

## Referencias

D5, `microfrontends.md`
