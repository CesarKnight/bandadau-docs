# ADR-0014 — Tokens de diseño en formato W3C DTCG con temas claro/oscuro

- **Estado:** Aceptada
- **Fecha:** 2026-10-14
- **Decisores:** Equipo Grupo 24 (Ing. Software II)

## Contexto

Cinco frontends en 4 tecnologías (Next.js, Angular, React/Vite, Expo) más gráficos Vega-Lite y emails
deben verse coherentes y soportar modo claro y oscuro con contraste WCAG 2.2 AA (RNF-17).

## Decisión

Fuente única `bandadau-shared/packages/ui-tokens` en **W3C Design Tokens (DTCG JSON)**, compilada con **Style
Dictionary v4** a CSS custom properties, tema Tailwind v4, `tokens.ts` y SCSS. Tres niveles
(primitivos → semánticos → componente); modos `light`/`dark` solo en la capa semántica; preferencia
`theme: SYSTEM | LIGHT | DARK`. D13.

## Alternativas consideradas

| Alternativa | Motivo de descarte |
|---|---|
| Tema por app (Tailwind config, Angular Material theme) | Deriva visual y duplicación. |
| Formato propio de tokens | Sin herramientas ni estándar. |
| Librería de componentes única | Imposible entre Angular, React web y React Native. |

## Consecuencias

- (+) Un cambio de color se propaga a todas las apps, MFEs y gráficos.
- (+) Contraste verificado automáticamente en ambos modos.
- (−) Paso de build adicional y disciplina: prohibidos hex y utilidades de paleta cruda en UI.

## Referencias

D13, `04-patrones-y-reglas/design-tokens-y-temas.md`
