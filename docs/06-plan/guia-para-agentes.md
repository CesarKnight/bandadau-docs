# Guía para abrir sesiones con agentes de IA

Cómo pedirle trabajo a un agente (Claude Code, Codex, OpenCode, Cursor…) en Bandada U sin
romper ICONIX, los contratos ni el trabajo de otros agentes en paralelo. Complementa
`AGENTS.md` del workspace y los `AGENTS.md` de cada repo y componente.

## 1. Antes de abrir la sesión (la persona)

1. Elige **una** unidad de trabajo: un UC en una fase, o un UC en **un** componente, o una HU/HT.
2. Revisa en `bandadau-docs/docs/02-iconix/03-casos-de-uso/00-catalogo.md` y en el propio UC su **estado
   ICONIX**. Si vas a implementar y el UC no está en "Secuencia" (o posterior), primero pide la
   fase faltante.
3. Lee las últimas 3–5 entradas de `registro-de-sesiones.md`: ¿alguien está tocando el mismo
   componente? ¿hay bloqueos?
4. Crea la rama **en el repo que vas a tocar** (ADR-0017): `feat/<componente>-uc-xx-<slug>`,
   `docs/iconix-uc-xx-<fase>` (en `bandadau-docs`), `fix/<componente>-<slug>`.
5. Abre la sesión **en la carpeta del workspace** `parcial-II/` (para que el agente vea el `AGENTS.md`
   común, `bandadau-docs/docs/` y los repos hermanos) e indica el repo y la carpeta del componente en el prompt.
   Recuerda: commit y push **por repo**; un commit nunca cruza repositorios.

## 2. Reglas de handoff

- **Entrada**: todo prompt nombra (a) el UC/HU, (b) el componente, (c) la fase o tarea,
  (d) los archivos que puede modificar, (e) el criterio de "terminado".
- **Salida**: el agente termina con (1) estado del UC actualizado, (2)
  `bandadau-docs/docs/02-iconix/07-trazabilidad.md` actualizado si tocó endpoints/eventos/pruebas, (3) una
  entrada en `registro-de-sesiones.md` con la plantilla, (4) un resumen con lo que **no** hizo.
- Si el agente descubre que falta algo en el contrato o en el UC, **se detiene y lo agrega
  primero** (contract-first / ICONIX), o lo deja como pendiente si no está en su asignación.
- Decisiones de arquitectura (cambiar el catálogo, una base, un patrón): el agente **pregunta**;
  no decide. Las menores se registran en la entrada de la sesión.
- Una sesión nueva nunca asume memoria de la anterior: el contexto está en los documentos.

## 3. Trabajo en paralelo sin conflictos

| Regla | Detalle |
|---|---|
| **Un agente = un componente = una rama** | Dos agentes no editan el mismo `bandadau-backend/services/<x>`, `bandadau-admin/<app>`, `bandadau-frontend` o `bandadau-landing` a la vez |
| Archivos compartidos con dueño | `bandadau-docs/contracts/**` (líder técnico), `bandadau-docs/docs/03-arquitectura/catalogo-servicios.md` y `decisiones-clave.md` (solo vía ADR), `bandadau-shared/packages/**` (dueño del paquete) |
| Archivos de "solo agregar" | `registro-de-sesiones.md` (cada agente agrega su entrada, no edita otras), `07-trazabilidad.md` (cada agente edita **solo las filas** de sus UCs) |
| Cambios de contrato | En su **propia** rama/PR de `bandadau-docs` (`feat/contracts-…`), revisada por una persona y mergeada **antes** de los PRs que la implementan |
| Integración frecuente | Rebase sobre `develop` al empezar y antes de abrir el PR; PRs pequeños (< 400 líneas de código no generado) |
| Asignación visible | Al empezar, el agente agrega una línea "en curso" en la entrada de su sesión; la persona anota el componente en el tablero del sprint |
| Worktrees | Para varios agentes en la misma máquina: `git -C <repo> worktree add ../<repo>-<componente> feat/<componente>-…` — cada agente en su carpeta |
| Puertos | Si dos agentes levantan servicios en la misma máquina, comparten `make infra-up` (en `bandadau-infra`) y cada uno corre **solo** su servicio en el IDE |

## 4. Prompts plantilla

Copia, reemplaza `<…>` y pega. Todos asumen que el agente ya leyó `AGENTS.md`; igual se lo
recordamos.

### 4.1 Completar la narrativa de un UC (fase Requisitos)

```text
Rol: analista ICONIX del proyecto Bandada U (workspace multi-repo en la carpeta actual; repo bandadau-docs).
Lee: AGENTS.md, bandadau-docs/docs/02-iconix/00-metodologia-iconix.md, bandadau-docs/docs/02-iconix/02-modelo-dominio.md,
bandadau-docs/docs/01-vision/glosario.md, bandadau-docs/docs/02-iconix/01-requisitos/*.md, bandadau-docs/docs/02-iconix/05-prototipos-gui.md
y bandadau-docs/docs/02-iconix/03-casos-de-uso/UC-<xx>-<slug>.md.
Tarea: completar la sección 1 (narrativa) de UC-<xx>: precondiciones, disparador, curso básico
numerado en voz activa con nombres del dominio y de las pantallas (boundaries) del prototipo,
cursos alternos por paso (4a, 4b…), postcondiciones y reglas de negocio. Cubrir los RF <RF-xx>.
Solo puedes modificar ese archivo (y agregar términos nuevos al glosario si son imprescindibles,
avisándolo). No cambies el catálogo de servicios.
Terminado cuando: el UC cumple la checklist RR de bandadau-docs/docs/02-iconix/08-revisiones.md; estado =
"Requisitos"; entrada en bandadau-docs/docs/06-plan/registro-de-sesiones.md.
```

### 4.2 Completar la robustez de UC-xx (fase Análisis)

```text
Rol: analista ICONIX de Bandada U.
Lee: AGENTS.md, bandadau-docs/docs/03-arquitectura/catalogo-servicios.md, bandadau-docs/docs/02-iconix/00-metodologia-iconix.md
(§2 reglas de robustez), bandadau-docs/docs/02-iconix/02-modelo-dominio.md y UC-<xx>.
Tarea: escribir la sección 2 de UC-<xx>: diagrama de robustez en Mermaid con la notación del
documento de metodología (actor, boundary, control, entity) cubriendo curso básico y alternos,
y la tabla "objeto → tipo → componente real" (pantalla de bandadau-frontend / bandadau-admin / bandadau-landing, endpoint del gateway, cola de
RabbitMQ, servicio). Cada paso del texto debe aparecer en el diagrama; si no encaja, corrige el
TEXTO del UC (no inventes pasos). Si aparecen entidades nuevas, agrégalas a
bandadau-docs/docs/02-iconix/02-modelo-dominio.md y dilo en el resumen.
Archivos permitidos: UC-<xx>, 02-modelo-dominio.md.
Terminado cuando: cumple la checklist PDR; estado del UC = "Robustez"; entrada en el registro.
```

### 4.3 Completar la secuencia y las clases de UC-xx (fase Diseño)

```text
Rol: diseñador ICONIX de Bandada U.
Lee: AGENTS.md, catálogo, decisiones-clave.md, la guía de arquitectura del servicio
(bandadau-docs/docs/04-patrones-y-reglas/<arquitectura-hexagonal|clean-architecture|ddd>.md),
bandadau-docs/docs/02-iconix/06-modelo-estatico/<contexto>.md, los contratos en bandadau-docs/contracts/ y UC-<xx>
(secciones 1 y 2 ya revisadas).
Tarea: secciones 3 y 4 de UC-<xx>: sequenceDiagram con participantes reales (pantalla, Traefik,
controller/adapter, caso de uso, repositorio, outbox, RabbitMQ, otro servicio) para el curso
básico y el alterno más importante; cada control de la robustez debe ser ≥1 mensaje. Lista de
clases por servicio respetando su arquitectura y operaciones de contrato (operationId, tipos de
evento, campos GraphQL). Si un mensaje que cruza servicios no está en bandadau-docs/contracts/, agrégalo al
contrato (y valida con `cd bandadau-docs && make contracts-lint`). Actualiza 06-modelo-estatico/<contexto>.md si
aparecen clases o campos nuevos.
Archivos permitidos: UC-<xx>, 06-modelo-estatico/<contexto>.md, bandadau-docs/contracts/<archivo del servicio>.
Terminado cuando: checklist CDR del UC en verde; estado = "Secuencia"; trazabilidad y registro.
```

### 4.4 Implementar UC-xx en el servicio X

```text
Rol: desarrollador de bandadau-backend/services/<servicio> (Bandada U).
Lee: AGENTS.md (workspace), bandadau-backend/AGENTS.md, bandadau-backend/services/<servicio>/AGENTS.md, la guía de su arquitectura, UC-<xx>
(estado debe ser "Secuencia"; si no, DETENTE y avísame), bandadau-docs/contracts/openapi/<servicio>.yaml y
bandadau-docs/contracts/asyncapi/bandada-events.yaml, bandadau-docs/docs/03-arquitectura/idempotencia.md y
eventos-y-mensajeria.md, últimas entradas de bandadau-docs/docs/06-plan/registro-de-sesiones.md.
Tarea: implementar SOLO la parte de UC-<xx> que corresponde a <servicio>, siguiendo la secuencia
del UC: dominio → caso de uso → adaptadores. Idempotency-Key en endpoints ♻️, outbox para
publicar, inbox para consumir. Pruebas: unitarias de dominio/aplicación, integración con
Testcontainers, prueba de arquitectura, y las pruebas de aceptación de la sección 5 del UC que
dependan de este servicio.
No toques otros servicios, ni bandadau-docs/contracts/ (si falta algo en el contrato, detente y repórtalo).
Verifica versiones/APIs de librerías en la documentación oficial (regla 9).
Terminado cuando: las pruebas del servicio (ver su AGENTS.md) en verde, lint y arquitectura verdes, UC-<xx> sección 6 y
bandadau-docs/docs/02-iconix/07-trazabilidad.md actualizados (solo filas de UC-<xx>), entrada en el registro.
Rama: feat/<servicio>-uc-<xx>-<slug>.
```

### 4.5 Agregar un endpoint (contract-first)

```text
Rol: desarrollador de Bandada U.
Contexto: UC-<xx> necesita <MÉTODO> /api/v1/<ruta> (operationId <camelCase>) en <servicio>.
Paso 1 (repo bandadau-docs, rama feat/contracts-<slug>): agrégalo a bandadau-docs/contracts/openapi/<servicio>.yaml siguiendo
bandadau-docs/docs/04-patrones-y-reglas/api-rest-guidelines.md (Problem Details con code, Idempotency-Key si
crea efectos, paginación {items,nextCursor}, Accept-Language). cd bandadau-docs && make contracts-lint.
Luego, en bandadau-shared: pnpm contracts:gen (commit aparte, Refs bandadau-docs@<sha>). Actualiza la sección 4 de UC-<xx> y la fila del RF en 07-trazabilidad.md.
Abre PR y DETENTE hasta que una persona lo apruebe.
Paso 2 (repo bandadau-backend, rama feat/<servicio>-<slug>): implementa el endpoint con su prueba de contrato.
Si la ruta usa un prefijo nuevo, NO toques Traefik: repórtalo (el catálogo §4 requiere ADR).
```

### 4.6 Agregar o cambiar un evento de dominio

```text
Tarea: agregar el evento bandada.<contexto>.<entidad>.<verbo-pasado>.v<n> publicado por
<servicio> y consumido por <consumidores>. Edita bandadau-docs/contracts/asyncapi/bandada-events.yaml
(sobre CloudEvents, data con campos en camelCase), verifica que la cola del consumidor en
catalogo-servicios.md §5 tenga el binding (si no, propón el cambio: requiere ADR), actualiza
bandadau-infra/rabbitmq/definitions.template.json solo si el binding ya está aprobado en el catálogo.
Cambios incompatibles → .v<n+1> conviviendo (convenciones-generales.md §4).
```

### 4.7 Implementar una pantalla en una app

```text
Rol: desarrollador frontend de <bandadau-frontend | bandadau-landing | bandadau-admin/<app>>.
Lee: AGENTS.md (workspace), el AGENTS.md del repo/app, bandadau-docs/docs/04-patrones-y-reglas/frontend-guidelines.md,
design-tokens-y-temas.md, i18n.md, bandadau-docs/docs/02-iconix/05-prototipos-gui.md (pantalla <P-XXX-nn>)
y UC-<xx>.
Tarea: implementar la pantalla <P-XXX-nn> consumiendo <operationIds> con los tipos de
@bandada/contracts-ts. Solo tokens semánticos (sin colores literales), todos los textos en
locales/{es,en}/<namespace>.json (ICU), estados de carga/vacío/error/offline del prototipo,
accesibilidad (objetivos ≥ 44 px, roles, contraste en ambos temas).
Terminado cuando: lint, tests, i18n:check y prueba de contraste verdes; captura en claro y
oscuro, es y en; trazabilidad + registro.
```

### 4.8 Revisión CDR (o PDR/RR) de un lote de UCs

```text
Rol: revisor ICONIX (no implementas nada).
Lee: bandadau-docs/docs/02-iconix/08-revisiones.md, catálogo, decisiones-clave.md, contratos y los UCs
<UC-xx, UC-yy…>.
Tarea: aplicar la checklist <RR|PDR|CDR> a cada UC. Para cada ítem: OK / FALLA con evidencia
(archivo y línea) y la corrección sugerida. No edites los UCs: produce el informe en la tabla de
estado de 08-revisiones.md (solo filas de estos UCs) y lista los hallazgos en tu entrada del
registro. Marca "Aprobada con observaciones" solo si ninguna falla es bloqueante.
```

### 4.9 Corregir un bug

```text
Bug: <descripción, pasos, esperado vs. obtenido, logs/traceId>.
Componente: <servicio/app>. UC relacionado: UC-<xx>.
Tarea: reproducir con una prueba que falle, corregir en la capa correcta de la arquitectura,
verificar que la prueba pase. Si el bug revela un hueco en el UC o el contrato, actualízalo
primero. Rama fix/<componente>-<slug>; trazabilidad (prueba nueva) y registro.
```

### 4.10 Infraestructura

```text
Rol: ingeniero de plataforma (repo bandadau-infra).
Lee: AGENTS.md, bandadau-infra/AGENTS.md, bandadau-docs/docs/05-infraestructura/*.md, catálogo §3–§6.
Tarea: <HT-xx>. Solo modificas bandadau-infra/ (y bandadau-docs/docs/05-infraestructura si cambian variables/puertos).
No toques Dockerfiles de servicios (repórtalo al dueño). Sin secretos en git. Valida con
make validate y make cfn-lint (desde bandadau-infra). Nunca ejecutes despliegues a prod ni uses credenciales de AWS: deja
el comando listo para que lo corra una persona.
```

## 5. Checklist rápida de la persona al recibir el PR del agente

- [ ] El PR toca un solo repo y un solo componente (en `bandadau-shared`, solo tipos generados de un contrato junto a su `Refs bandadau-docs@<sha>`).
- [ ] El UC estaba en "Secuencia" antes de implementar.
- [ ] Endpoints/eventos coinciden con `bandadau-docs/contracts/` (prueba de contrato verde).
- [ ] Pruebas de arquitectura y `i18n:check` verdes; sin colores ni textos literales en UI.
- [ ] Idempotencia: `Idempotency-Key`, outbox/inbox, restricciones únicas donde aplica.
- [ ] Trazabilidad y registro de sesiones actualizados.
- [ ] No hay secretos, dominios ni puertos escritos a mano.
