# Registro de sesiones

Bitácora de *handoff* entre sesiones de trabajo (personas y agentes de IA). **Toda sesión
termina agregando una entrada** (regla 11 del `AGENTS.md` del workspace). La siguiente sesión lee las últimas
entradas antes de empezar (paso 8 del orden de lectura).

Reglas:

- Entradas en orden cronológico **descendente** (la más reciente arriba, debajo de la plantilla).
- Una entrada por sesión y por agente; si varios agentes trabajan en paralelo, cada uno agrega
  la suya (sin editar las ajenas).
- Ser concreto: rutas de archivo, IDs de UC/RF/HU, `operationId`, tipos de evento.
- Las decisiones menores tomadas sin consultar se anotan aquí; las de arquitectura van a un ADR
  y aquí solo se enlazan.
- Lo que quede en **Pendientes** o **Bloqueos** debe poder tomarlo otra persona/agente sin
  contexto adicional.

---

## Plantilla

```markdown
### AAAA-MM-DD — <título corto de la sesión>

| Campo | Valor |
|---|---|
| Agente / persona | p. ej. Claude Code (Opus) · supervisado por <nombre> |
| Rama | `feat/<area>-<slug>` |
| Objetivo | Una frase |
| UCs / HU | UC-xx (estado antes → después), HU-xx |
| Componentes | `bandadau-backend/services/<x>`, `bandadau-docs/contracts/...` |

**Archivos tocados**
- `ruta/archivo` — qué cambió

**Decisiones**
- Decisión — motivo (ADR-xxxx si aplica)

**Pendientes**
- [ ] Tarea concreta (dueño sugerido)

**Bloqueos / preguntas abiertas**
- Pregunta — a quién

**Verificación**
- Comandos ejecutados y resultado (`make test S=...`, `make contracts-lint`, ...)
```

---

## Entradas

### 2026-10-14 — Fase B: identidad mobile (UC-01/02/03) + stack de datos

| Campo | Valor |
|---|---|
| Agente / persona | opencode (Deepseek v4.1 flash) |
| Rama | `feat/mobile-bootstrap` (`bandadau-frontend`) |
| Objetivo | Implementar UC-01/02/03 en la app y fijar el stack de datos/rendimiento |
| UCs / HU | UC-01, UC-02, UC-03 (implementación en curso); HU-01…HU-07 |
| Componentes | `bandadau-frontend` |

**Archivos tocados**
- `bandadau-frontend/`: config (`app.config.ts` React Compiler; dependencias `expo-dev-client`, `@shopify/flash-list`, `react-native-css-interop`, `babel-plugin-react-compiler`; `app/index.tsx` gate de sesión).
- Identidad: `src/features/auth/{types,schemas,api}.ts`, `src/auth/{pkce,handoff,session,open-url*,refresh-token*}.ts`, `src/lib/{api-client,api-error,http,ids,idempotency,query-keys,query-client}.ts`, `src/stores/{session,preferences}.store.ts`, `src/components/ui/virtual-list.tsx`.
- Pantallas: `app/(auth)/{welcome,login,register,verify-email}.tsx`, `app/sso/callback.tsx`, `app/settings/index.tsx`.
- Feed (UC-06): `src/features/feed/{types,api}.ts`, `src/features/feed/components/post-card.tsx`, `app/(tabs)/feed.tsx`, `src/mocks/{index,feed}.ts`, `locales/{es,en}/feed.json`.
- `bandadau-frontend/AGENTS.md`: sección "Datos, rendimiento y compilador".

**Decisiones**
- **TanStack Query** como única vía a datos del servidor; **React Compiler** activado; **FlashList** (nativo) + **FlatList** (web) tras `VirtualList`.
- Tipos de identidad aliaseados desde `@bandada/contracts-ts` (`identity.components['schemas'][…]`).
- `react-native-css-interop` como dependencia directa (resolución pnpm de NativeWind v4).
- pnpm 10.34.7 vía Corepack; **pnpm 12 no funciona con Corepack 0.34** (su bin es `pnpm`, no `bin/pnpm.cjs`) — no es un problema de Apple Silicon.

**Pendientes**
- [x] Feed (UC-06): `useInfiniteQuery` + `VirtualList` + estados (cargando/vacío/error) con mocks locales (`EXPO_PUBLIC_USE_MOCKS`).
- [ ] Conectar `getFeed` real cuando exista `social-service`; prueba de contrato/mocks con MSW.
- [ ] Preferencias offline (cola) y persister de Query; notificaciones (UC-24); UC-04 avatar.
- [ ] Refrendo humano de las actas §5.4 (`08-revisiones.md`).

**Verificación**
- `pnpm typecheck` (tsc) y `pnpm lint` (ESLint) en verde; `expo config` OK.
- `pnpm build:web` (`expo export -p web`) construye y genera las rutas (static export).

---

### 2026-10-14 — Actas ICONIX retroactivas del lote mobile (UC-01/02/03) y arranque de la app

| Campo | Valor |
|---|---|
| Agente / persona | opencode (Deepseek v4.1 flash) · refrendo humano pendiente |
| Rama | `feat/mobile-bootstrap` (sugerida) |
| Objetivo | Habilitar el arranque de `bandadau-frontend` regularizando el gate ICONIX de UC-01/02/03 |
| UCs / HU | UC-01/02/03 (Secuencia (pendiente CDR) → **Secuencia (CDR aprobada)**); HU-01…HU-07 |
| Componentes | `bandadau-docs/docs/02-iconix/`, `bandadau-frontend` |

**Archivos tocados**
- `docs/02-iconix/08-revisiones.md` — actas RR/PDR/CDR retroactivas (`§5.4`), filas de UC-01/02/03 en `§5.2` a Aprobada, nota de excepción en `§5`.
- `docs/02-iconix/03-casos-de-uso/UC-01-registrarse.md`, `UC-02-iniciar-sesion.md`, `UC-03-acceso-unico-panel.md` — cabecera de estado.

**Decisiones**
- Las actas son retroactivas (el diseño ya estaba completo y identity-service parcialmente implementado); resultado **Aprobada con observaciones**, ninguna bloqueante. Refrendo humano pendiente.
- Arranque de `bandadau-frontend`: bootstrap Expo SDK 57 + navegación custom (native+web) adaptada de Homy a tokens de `@bandada/ui-tokens`.

**Pendientes**
- [ ] Refrendo humano de las actas §5.4 (equipo) — líder técnico.
- [ ] Procesar observaciones menores: `displayName` en `User` (UC-01); alinear D1 `createHandoffCode` (UC-03); verificar `I9a` (fragmento `#cv`) en dispositivo real.
- [ ] Implementar UC-01/02/03 en `bandadau-frontend` (pantallas, sesión/refresh, handoff).

**Verificación**
- Solo documentación en este tramo; sin comandos de build.

---

### 2026-10-14 — Revisión de consistencia tras ADR-0017 (multi-repo) y nueva fecha de entrega

| Campo | Valor |
|---|---|
| Agente / persona | Claude Code (subagente revisor) · supervisado por el equipo |
| Rama | `docs/consistencia-adr-0017` (sugerida; los repos aún no tienen git inicializado) |
| Objetivo | Eliminar restos del monorepo, alinear fechas con el roadmap de 4 sprints y cruzar nombres contra los contratos |
| UCs / HU | UC-09, UC-13, UC-14, UC-15, UC-16, UC-18, UC-19, UC-20 (solo referencias; estados sin cambio) |
| Componentes | `bandadau-docs/docs/`, `bandadau-docs/contracts/` (README y ejemplo de insights), `AGENTS.md`/`README.md` de los repos |

**Archivos tocados (resumen)**
- Rutas y comandos multi-repo: `00-indice.md`, `guia-para-agentes.md`, `infraestructura.md` (§2.6, §3, §5.2 por repo, §7),
  `contracts/README.md` (comandos relativos al repo, `pnpm contracts:gen`), DoD, convenciones, testing, `graphql-admin.md`,
  `microfrontends.md`, metodología; `AGENTS.md`/`README.md` de `bandadau-{infra,shared,frontend,landing,ml,admin}` y de los
  componentes de `bandadau-backend` y `bandadau-admin`; `.gitignore` de `bandadau-infra` y `bandadau-ml`.
- Plan: `backlog.md` (velocidad para 4 sprints), `roadmap-y-sprints.md` (S9 → S4, regla 9, ruta de identity).
- Nombres cruzados: archivos de contrato `*-service.yaml` en UC-13/14/15/16/18; `removeReaction`, `get_platform_kpis`,
  `INVALID_QR_SIGNATURE`; `AlertKind` (`DLQ_BACKLOG`, `SAGA_FAILURES`) en UC-20 y agentes; D15 con estado ✔ verificado
  contra `contracts/` y `amountCredits: 0`; propuestas resueltas por ADR-0016 marcadas en UC-09/18/19/20.
- `insights-service.yaml` 1.1.1: ejemplo de `audioUrl` con bucket `bandada-reports`.

**Pendientes**
- [ ] Decidir `AlertKind` para `QUEUE_BACKLOG` y `MONITORING_DEGRADED` (UC-20, `agentes-y-reportes-generativos.md` §6.2) y
      unificar umbrales de severidad entre ambos documentos — líder técnico.
- [ ] Diseñar `wf-06-difusion-evento` en `automatizacion-n8n.md` (D15 lo define, el detalle no) — plataforma.

**Verificación**
- Mermaid: 146 bloques renderizados con `mermaid@11.17.2` (puppeteer, vía `@mermaid-js/mermaid-cli@11`): 0 errores.
- Enlaces Markdown relativos: 0 rotos (sin contar la copia `bandadau-docs/workspace/`, cuyos enlaces son válidos en la raíz del workspace).
- Spectral 6 sobre `bandadau-docs/contracts/openapi/*.yaml`: 0 errores.

---

### 2026-10-14 — Fundación de la documentación (ICONIX, arquitectura, contratos, infra, plan)

| Campo | Valor |
|---|---|
| Agente / persona | Varios agentes Claude Code en paralelo, coordinados por un agente orquestador · supervisado por el equipo (Grupo 24) |
| Rama | `docs/foundation` (sugerida; el repositorio aún no tenía git inicializado) |
| Objetivo | Dejar la base documental completa para que personas y agentes puedan diseñar e implementar caso por caso |
| UCs / HU | UC-01…UC-24 con borradores de narrativa, robustez y secuencia → estado **Secuencia (pendiente CDR)**; ninguna revisión formal (RR/PDR/CDR) realizada todavía; backlog HU-01…HU-70 + HT-01…HT-12 |
| Componentes | `bandadau-docs/docs/`, `bandadau-docs/contracts/`, `bandadau-infra/` (solo documentación), `bandadau-backend/services/*/AGENTS.md` |

**Archivos existentes al cierre de la sesión**

- Raíz: `AGENTS.md`, `CLAUDE.md`, `README.md`.
- `bandadau-docs/docs/01-vision/`: visión y alcance (MoSCoW, releases R0–R4, épicas E1–E18), cumplimiento de
  la cátedra (T1–T13, C1–C5, guion de defensa), glosario, marca y dominio (`BASE_DOMAIN`).
- `bandadau-docs/docs/02-iconix/`: metodología, RF-01…RF-30, RNF-01…RNF-21, modelo de dominio, catálogo de
  UCs y archivos `UC-01`…`UC-24`,
  `05-prototipos-gui.md`, `06-modelo-estatico/` (8 contextos + índice), `07-trazabilidad.md`,
  `08-revisiones.md`.
- `bandadau-docs/docs/03-arquitectura/`: catálogo de servicios (normativo), decisiones clave D1–D14,
  arquitectura general (C4), SAGA de inscripción, idempotencia, eventos y mensajería, GraphQL
  del panel, MCP, agentes y reportes generativos, ML/DL, IA local y offline, seguridad y SSO, microfrontends, automatización n8n,
  observabilidad; ADR-0000…0007 en `adr/`.
- `bandadau-docs/docs/04-patrones-y-reglas/`: convenciones generales, hexagonal, clean, DDD, API REST,
  frontend, tokens de diseño y temas, i18n, estrategia de pruebas, definición de hecho.
- `bandadau-docs/docs/05-infraestructura/`: `infraestructura.md` (Compose con perfiles, Traefik, init de
  datos, AWS demo con costos, CI/CD, EAS, MFEs, backups), `entornos-y-variables.md`.
- `bandadau-docs/docs/06-plan/`: `roadmap-y-sprints.md` (10 sprints, hitos RR/PDR/CDR/DR, riesgos),
  `backlog.md`, `guia-para-agentes.md`, este registro.
- `bandadau-docs/contracts/`: `README.md`, `.spectral.yaml`; OpenAPI de los 8 servicios REST +
  `shared/components.yaml`; AsyncAPI `bandada-events.yaml`; GraphQL `admin.graphql`; MCP
  `tools.md` + `tools.schema.json`.
- `bandadau-backend/services/*/AGENTS.md` (9 servicios) y `apps/*/AGENTS.md` (5 apps), con su `CLAUDE.md`.
- `bandadau-infra/`: `AGENTS.md`, `CLAUDE.md`, `README.md` (sin archivos de configuración todavía).

**Decisiones**
- Nombre comercial Bandada U, slug `bandada`, dominio de referencia `bandadau.com` parametrizado con `BASE_DOMAIN`.
- Agregadas D13 (tokens de diseño + claro/oscuro) y D14 (i18n es/en) con RF-29, RF-30,
  RNF-20, RNF-21, épica E18 y UC-04 renombrado a "Gestionar perfil académico y preferencias".
- Infra AWS: un EC2 `t3.xlarge` con Compose + RDS micro + DynamoDB on-demand + S3/CloudFront;
  un solo entorno AWS con apagado programado para cumplir RNF-18.
- n8n usa SQLite propio (la instancia Postgres mantiene exactamente 3 bases).
- Buckets de objetos: `bandada-media`, `bandada-reports`, `bandada-models`, `bandada-public`
  (en AWS con prefijo de entorno).

**Pendientes**
- [ ] Validar todos los contratos con `make contracts-lint` cuando exista el tooling — líder técnico.
- [ ] Resolver divergencias de variables entre `bandadau-backend/services/*/AGENTS.md` y requisitos (`bandadau-docs/docs/05-infraestructura/entornos-y-variables.md` §6).
- [x] `bandadau-docs/docs/00-indice.md` (hecho en la sesión de consolidación).
- [ ] Revisar propuestas de cambio a normativos listadas en `06-modelo-estatico/00-indice.md` §3
      (GSIs de `bandada-insights`, ítems de inbox/outbox en tablas DynamoDB, origen de las
      subscriptions GraphQL).
- [ ] Realizar RR, PDR y CDR sobre los borradores (checklists en `bandadau-docs/docs/02-iconix/08-revisiones.md`); hasta aprobar la CDR de un UC, tratarlo como no implementable.
- [ ] Implementar `bandadau-infra/` (compose, init, Traefik) según `infraestructura.md` — HT-01, HT-02.

**Bloqueos / preguntas abiertas**
- Fecha exacta de la defensa (el roadmap asume 22-dic-2026) — equipo.
  > **Resuelto (2026-10-14):** entrega y defensa el **martes 10-nov-2026**; `roadmap-y-sprints.md` reescrito con 4 sprints (S1 14–18 oct, S2 19–25 oct, S3 26 oct–1 nov, S4 2–8 nov) y cierre el 9-nov.
- ¿Se compra `bandadau.com` o se usa un subdominio de un dominio existente? — equipo.

**Verificación**
- Solo documentación; sin código ni comandos de build en esta sesión.

---

### 2026-10-14 — Consolidación del diseño detallado (ADR-0016)

**Agente:** Claude Code (sesión coordinadora) · **Objetivo:** unificar lo producido en paralelo por
10 agentes y dejar el diseño listo para la *Critical Design Review*.

**Archivos tocados**
- Nuevos: `bandadau-docs/docs/00-indice.md`, `README.md`, `bandadau-docs/docs/03-arquitectura/adr/ADR-0016-consolidacion-diseno-detallado.md`.
- Normativos: `catalogo-servicios.md` (cola `admin-gateway.subscriptions.<instanceId>`, bindings
  `event.cancelled` y `ticket-void-failed`, nombres de buckets y usuarios, ítems técnicos DynamoDB,
  Piper), `decisiones-clave.md` (D15), `02-modelo-dominio.md` (ampliaciones), RNF-18, matriz de
  cumplimiento y visión (6 workflows n8n).
- Divergencias corregidas en UC-15, UC-24, `bandadau-backend/services/{ticketing,notification,wallet,media}-service/AGENTS.md`.
- `bandadau-docs/contracts/`: todas las operaciones ⏳ de D15 agregadas, enums alineados, lint corregido.

**Decisiones** (detalle en ADR-0016): QR = JWS ES256; paquetes `CREDITS_20/50/100`; webhook
`X-Signature`; video ≤ 50 MB; inbox DynamoDB `INBOX#<id>`/`META`; refresh token web en cookie
HttpOnly; PHP-FPM; Jest en NestJS; n8n con SQLite y router `wf-00`; billetera perezosa; token MCP de 8 h;
urql como cliente GraphQL.

**Verificación**
- Spectral 6 sobre `bandadau-docs/contracts/openapi/*.yaml`: 0 errores, 0 warnings.
- `@asyncapi/cli validate`: válido; 463 `$ref` resueltos; ejemplos validados.
- GraphQL SDL: `graphql-core` sin errores. `tools.schema.json`: JSON válido.
- Enlaces Markdown relativos: 0 rotos.
- **No verificado:** render de los diagramas Mermaid (no hay `mmdc` instalado); revisarlos en GitHub/VS Code.

**Pendientes**
- [ ] Realizar RR → PDR → CDR (`bandadau-docs/docs/02-iconix/08-revisiones.md`). Los 24 UC están en "Secuencia
      (pendiente CDR)" sin revisión formal; hasta aprobar la CDR, no implementar.
- [ ] Decidir `x-proposal` restantes: filtros `organizerId`/`status` en `listEvents`, `X-Unread-Count`,
      `AlertSource`, `AUTHOR_SUSPENDED` en `HiddenReason`.
- [ ] Divergencias abiertas V-4, V-6, V-7 de `entornos-y-variables.md` §6.
- [ ] Campos del modelo ADR-0016 aún no reflejados en contratos: `Event.endsAt`, `Event.version`,
      `SagaInstance.attempts/version`, `Group.description`, `Profile.pendingAvatarMediaId`, `Alert.params`.
- [ ] Renderizar todos los Mermaid y corregir los que fallen.
- [ ] Sprint R0: scaffolding del monorepo e `bandadau-infra/` (HT-01, HT-02).
  > Nota (ADR-0017): el monorepo se reemplazó por 8 repos hermanos; el scaffolding es por repo (roadmap S1).

---

### 2026-10-14 — Reestructuración en 8 repositorios (ADR-0017) y entrega al 10-nov

**Agente:** Claude Code (sesión coordinadora) · **Objetivo:** pasar del monorepo a repositorios por
capa (estilo Homy), ajustar el plan a la entrega del **martes 10 de noviembre de 2026** y preparar
la presentación.

**Hecho**
- 167 archivos movidos a `bandadau-{docs,shared,backend,frontend,admin,landing,infra,ml}` con enlaces
  recalculados y rutas reescritas relativas al workspace; ADR-0017 (reemplaza ADR-0001).
- `AGENTS.md`/`README.md`/`CLAUDE.md`/`.gitignore` en los 8 repos; `bandadau.code-workspace`;
  `bandadau-infra/scripts/{create-github-repos.sh,clone-all.sh}`; copia de los archivos del workspace
  en `bandadau-docs/workspace/`.
- Roadmap comprimido a S1–S4 + cierre 9-nov; hitos RR/PDR/CDR el 15–17 oct; releases con fechas.
- Revisión de consistencia global (ver entrada anterior del revisor).
- `git init` + commit inicial en cada repo (rama `main`), sin remoto.
- Presentación "Bandada U — Proyecto y cumplimiento" (Claude Slides, 21 diapositivas, con UML 2.5 de
  despliegue, casos de uso y componentes).

**Pendientes (decisión del equipo)**
- [ ] `AlertKind`: `QUEUE_BACKLOG` y `MONITORING_DEGRADED` citados pero inexistentes; unificar umbrales de
      severidad entre UC-20 RN-20.2 y `agentes-y-reportes-generativos.md` §6.2.
- [ ] Diseñar `wf-06-difusion-evento` en `automatizacion-n8n.md`.
- [ ] Decidir `x-proposal` restantes (`listEvents` organizerId/status, `X-Unread-Count`, `AlertSource`,
      `AUTHOR_SUSPENDED`) y propuestas en UC (`listEventTickets`, `follow.deleted.v1`, `feed.impressions-recorded.v1`, `HATE`).
- [ ] Unificar host de URLs prefirmadas en ejemplos (`minio.` vs `s3.bandada.localhost`).
- [ ] Crear o quitar referencias a `contracts/mfe/mfe-manifest.schema.json` y `contracts/pacts/`.
- [ ] Publicar los repos: `bandadau-infra/scripts/create-github-repos.sh <owner>` (requiere `gh auth login`).
