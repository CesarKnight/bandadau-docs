# Definición de Hecho (DoD)

Checklists que un agente o persona debe cumplir **antes** de dar por terminada una
pieza de trabajo. Se copian en la descripción del PR (solo las secciones que
apliquen) y el revisor las verifica. "Hecho" significa: funciona, está probado,
está documentado y es trazable a su caso de uso ICONIX.

> Regla general: si un ítem no aplica, se marca `N/A` con una frase de por qué. Un ítem
> sin marcar bloquea el merge.

## Cómo usar este documento

1. Identifica el tipo de entrega (UC, endpoint, evento, pantalla, MFE, modelo, workflow, herramienta MCP).
2. Copia en el PR la sección §0 y las secciones aplicables.
3. Marca cada ítem con evidencia (enlace a prueba, captura o archivo); no basta con "hecho".

## 0. Comunes a todo cambio

- [ ] Lenguaje correcto: identificadores en inglés; documentación y textos de UI vía i18n (`es` + `en`).
- [ ] Sin secretos ni `.env` en el diff; `.env.example` actualizado si se añadió una variable.
- [ ] Lint, formato y typecheck en verde.
- [ ] No contradice `catalogo-servicios.md` ni `decisiones-clave.md` (si lo hace: ADR primero).
- [ ] Nada de APIs de librerías "de memoria": versión verificada en la documentación oficial.
- [ ] Entrada en `bandadau-docs/docs/06-plan/registro-de-sesiones.md`.

## 1. Caso de uso ICONIX (UC-xx)

**Requisitos (RR)**
- [ ] Narrativa con curso básico y cursos alternos numerados por paso (`4a`, `4b`).
- [ ] Todo sustantivo existe en `02-modelo-dominio.md` o en el glosario; enums con valores del dominio.
- [ ] Requisitos RF/RNF enlazados; cátedra (T/C) indicada si aplica.

**Robustez (PDR)**
- [ ] Cada paso del texto aparece en el diagrama de robustez y viceversa.
- [ ] Reglas de robustez cumplidas (actor↔boundary, entity↔control).
- [ ] Tabla objeto → tipo → componente real completa; entidades nuevas añadidas al dominio.

**Secuencia (CDR)**
- [ ] Participantes = componentes reales (pantalla, gateway, controller, caso de uso, repositorio, broker).
- [ ] Curso básico + alterno principal.
- [ ] Cada mensaje que cruza servicios existe en `bandadau-docs/contracts/` (operationId / tipo de evento / campo GraphQL / herramienta MCP).
- [ ] Clases nombradas según la arquitectura del servicio (hexagonal / clean / ddd).

**Implementado (DR)**
- [ ] Pruebas de aceptación Given/When/Then automatizadas (curso básico y alternos).
- [ ] Estado del UC actualizado a "Implementado".
- [ ] `07-trazabilidad.md`: RF → UC → endpoints/eventos → clases → pruebas.

## 2. Endpoint REST

- [ ] Definido primero en `bandadau-docs/contracts/openapi/<servicio>.yaml` con `operationId` de D1, ejemplos y errores; `make contracts-lint` en verde.
- [ ] Ruta, verbo y código de éxito según `api-rest-guidelines.md` (201/202/204 correctos, `Location`).
- [ ] Errores en Problem Details con `code` estable documentado; `title`/`detail` localizados por `Accept-Language` (es por defecto) con `Content-Language`.
- [ ] Autenticación y roles (`x-roles`) aplicados; reglas de propiedad en el caso de uso.
- [ ] Si es ♻️: `Idempotency-Key` obligatoria + batería de idempotencia (`testing-strategy.md` §5).
- [ ] Listas con cursor (`{ items, nextCursor }`), `limit` acotado.
- [ ] Validación de entrada (campos extra rechazados) y créditos enteros.
- [ ] Respeta la arquitectura: controller → puerto de entrada / caso de uso; prueba de arquitectura en verde.
- [ ] Prueba de integración (HTTP) + Schemathesis en verde.
- [ ] Log estructurado con `event` estable y sin datos sensibles; span OTel con atributos útiles.
- [ ] Ruta enrutable en Traefik (si es pública) y `/internal` no expuesta.
- [ ] Tipos regenerados en `bandadau-shared/packages/contracts-ts` y consumidores actualizados.

## 3. Evento o comando de mensajería

- [ ] Definido en `bandadau-docs/contracts/asyncapi/bandada-events.yaml` (nombre `bandada.<ctx>.<entidad>.<verbo-pasado>.v<n>` o `…cmd.<verbo>.v<n>`), con esquema de `data` y ejemplo.
- [ ] Sobre CloudEvents 1.0 completo (`id` UUIDv7, `source`, `type`, `time`, `subject`, `correlationid`, `causationid`, `traceparent`, `sagaid` si aplica).
- [ ] Productor: escrito en **outbox** en la misma transacción que el cambio de estado; relay probado.
- [ ] Consumidor: **inbox** (`processed_messages`) en la misma transacción que el efecto; prueba de mensaje duplicado.
- [ ] Cola, binding y DLX declarados según `catalogo-servicios.md` §5 (si cambian: ADR + catálogo).
- [ ] Reintentos con backoff y DLQ; mensaje venenoso no bloquea la cola.
- [ ] Compatibilidad: solo campos opcionales añadidos en la misma versión; cambio incompatible → `.v2`.
- [ ] Prueba de contrato (esquema) en productor y consumidor.

## 4. Pantalla (app móvil/web, landing o shell)

- [ ] Prototipo/UC de referencia enlazado; flujo cubre cursos alternos (errores, vacío, sin conexión).
- [ ] Solo tokens semánticos de `@bandada/ui-tokens` (sin hex ni paleta cruda); funciona y se revisó en **modo claro y oscuro**.
- [ ] Sin texto literal: claves en `locales/{es,en}/<namespace>.json` (ICU), `i18n:check` en verde; revisada en `es` y `en`.
- [ ] Datos vía TanStack Query (query keys centralizadas); mutaciones con `Idempotency-Key` estable por intención.
- [ ] Errores mapeados por `code`; estados de carga, vacío y error con reintento.
- [ ] Accesibilidad: etiquetas, roles, foco, objetivos ≥ 44 px, contraste (axe sin violaciones serias).
- [ ] Responsive (320–1440 px en web; teléfonos pequeños y tablet en nativo).
- [ ] Móvil: probado en iOS, Android y web PWA, o diferencias justificadas con `.native/.web`; offline según D6 si la pantalla muta datos.
- [ ] Pruebas de componente/hook y, si es flujo crítico, E2E (Playwright/Maestro).

## 5. Microfrontend (MFE)

- [ ] Se registra como `<bandada-mfe-<nombre>>` con Shadow DOM; sin estilos globales filtrados.
- [ ] Contrato D5 respetado: entradas `graphql-url`, `access-token` (propiedad), `base-path`, `theme`, `locale`; salidas `bandada:navigate`, `bandada:toast`, `bandada:auth-expired`. Sin estado global compartido.
- [ ] Reacciona en caliente a cambios de `theme` y `locale`.
- [ ] Build independiente y versionado (SemVer) + entrada en `mfe-manifest.json` del entorno.
- [ ] Carga y desmontaje limpios (sin fugas de suscripciones/listeners); un fallo no rompe el shell.
- [ ] Tamaño del bundle revisado (objetivo < 300 KB gzip por MFE, salvo justificación).
- [ ] E2E montado dentro del shell y aislado (página de prueba del MFE).

## 6. Modelo ML / DL

- [ ] Notebook en `bandadau-ml/notebooks/` reproducible (semilla, versión de dataset, `requirements` fijos).
- [ ] Export ONNX validado contra el modelo original (tolerancia documentada).
- [ ] `model-card.md`: datos, métricas (accuracy/F1/ROC), sesgos conocidos, umbrales, versión.
- [ ] Subido a MinIO/S3 `models/<nombre>/<versión>/model.onnx` (no en git si > 50 MB).
- [ ] Servicio consumidor actualizado (variable de versión del modelo) con prueba de integración sobre fixtures.
- [ ] `modelVersion` registrado en cada resultado (`ModerationResult`, etc.).
- [ ] Umbrales coherentes con D7 o ADR si cambian.

## 7. Workflow n8n

- [ ] Exportado a `bandadau-infra/n8n/workflows/wf-XX-<slug>.json` (formato estable, sin IDs de credenciales reales).
- [ ] Disparador y acciones coinciden con D10; consume colas/eventos del catálogo.
- [ ] Credenciales y URLs por variables de entorno; `.env.example` de n8n actualizado.
- [ ] Idempotente ante reentrega (dedupe por `id` del CloudEvent o clave natural).
- [ ] Manejo de error (rama de error / *Error Workflow*) que registra y no se pierde en silencio.
- [ ] Mensajes a personas en su idioma (plantillas `es`/`en`) cuando aplique.
- [ ] Validado por `bandadau-infra/n8n/scripts/validate.mjs`; probado con un evento de ejemplo del contrato.
- [ ] Documentado en `automatizacion-n8n.md` y en el UC correspondiente.

## 8. Herramienta MCP (insights-service)

- [ ] Definida en `bandadau-docs/contracts/mcp/tools.md` (nombre `snake_case`, descripción para el modelo, `inputSchema` JSON Schema, ejemplo de salida).
- [ ] Coincide con D9 (fuente, lectura/escritura); las de escritura justificadas y limitadas a agentes internos o `ADMIN`.
- [ ] Implementada como controller → caso de uso; obtiene datos solo por `/internal/v1` de otros servicios (nunca su base).
- [ ] Datos personales agregados/anonimizados; resultados acotados (paginación o `limit`).
- [ ] Timeout + circuit breaker por dependencia; error del servidor MCP con código estable.
- [ ] Registrada en `AgentRun` cuando la usa un agente interno.
- [ ] Prueba con cliente MCP (SDK oficial) y prueba manual desde un cliente externo (Claude Desktop/Code) para UC-22.

## 9. Cambio de contrato (`bandadau-docs/contracts/`)

- [ ] `info.version` incrementada y changelog del archivo actualizado.
- [ ] `make contracts-lint` y `graphql-inspector` (si aplica) en verde; cambios incompatibles solo con nueva versión.
- [ ] `pnpm contracts:gen` ejecutado en `bandadau-shared` y `packages/contracts-ts` commiteado en ese repo (`Refs bandadau-docs@<sha>`).
- [ ] Consumidores identificados y actualizados (o issue enlazado si es compatible).
- [ ] UC y secuencia que lo motivan actualizados.

## 10. Nuevo componente o cambio de infraestructura

- [ ] Existe ADR en `bandadau-docs/docs/03-arquitectura/adr/` y el catálogo de servicios está actualizado.
- [ ] Carpeta con `AGENTS.md`, `README.md`, `CLAUDE.md` (`@AGENTS.md`) y `.env.example` completo.
- [ ] Servicio en `bandadau-infra/` (Compose, Traefik, init de base/cola/tabla) y `make up` lo levanta sano (`/health/ready`).
- [ ] Trazas, métricas y logs visibles en Grafana (OTel).
- [ ] Pipeline de CI con filtros por ruta y todas las etapas de `testing-strategy.md` §10.

## 11. Pull Request

- [ ] Rama `feat|fix|docs/<area>-<slug>` en el repo correspondiente; commits Conventional con scope del componente.
- [ ] Un PR = un componente (salvo contrato + clientes generados).
- [ ] Descripción con `Refs UC-xx`, resumen, capturas (claro/oscuro, es/en) si hay UI, y las checklists aplicables de este documento.
- [ ] CI en verde (`testing-strategy.md` §10); sin pruebas *skipped* sin issue.
- [ ] `AGENTS.md` del componente actualizado si cambió un comando, variable, puerto, cola o gotcha.
- [ ] Documentación ICONIX y trazabilidad actualizadas.
- [ ] Revisado por al menos una persona del equipo (o un segundo agente con el checklist) antes de fusionar a `develop`.
