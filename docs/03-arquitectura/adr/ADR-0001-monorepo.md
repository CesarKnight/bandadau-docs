# ADR-0001 — Monorepo único

- **Estado:** Reemplazada por [ADR-0017](ADR-0017-multi-repo-por-capa.md) (2026-10-14)
- **Fecha:** 2026-10-14
- **Decisores:** Equipo Grupo 24 (Ing. Software II)

## Contexto

El sistema tiene 9 servicios en 3 lenguajes, 5 frontends, contratos compartidos, ML, n8n e
infraestructura. En el proyecto previo (Homy) cada componente era un repo git independiente, lo que
obligaba a coordinar cambios de contrato entre repos a mano. Los agentes de IA que implementan
necesitan ver contratos y consumidores en un mismo árbol.

## Decisión

Un **monorepo** (`parcial-II/`, slug `bandada`) con `apps/`, `services/`, `packages/`, `contracts/`,
`ml/`, `automation/`, `infra/` y `docs/` (`arquitectura-general.md` §6). Workspace **pnpm** para TS;
Gradle y Composer independientes por servicio Java/PHP. Se comparten **contratos**, no código entre
lenguajes. CI con filtros por ruta (solo se construye lo que cambió).

## Alternativas consideradas

| Alternativa | Motivo de descarte |
|---|---|
| Polyrepo (un repo por componente, como Homy) | Independencia total, pero cambios de contrato en N PRs y deriva de versiones. |
| Monorepo con Nx/Turborepo para todo | Buen caché, pero no gestiona bien Java/PHP y suma curva de aprendizaje. |

## Consecuencias

- (+) Un PR puede cambiar contrato + cliente generado + implementación de forma atómica.
- (+) `AGENTS.md` raíz y docs únicos para todos los agentes.
- (−) CI más complejo (matrices por lenguaje y filtros por ruta).
- (−) Commits deben respetar scope por componente (`convenciones-generales.md` §3).

## Referencias

`arquitectura-general.md` §6, `convenciones-generales.md`
