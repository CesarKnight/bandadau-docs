# Revisiones ICONIX (RR · PDR · CDR · DR)

Listas de verificación de los cuatro hitos de `00-metodologia-iconix.md` y tabla de estado.
Cada revisión se hace **por UC** (mini-revisión antes de pasar de fase) y **global** en los hitos
del roadmap (`bandadau-docs/docs/06-plan/roadmap-y-sprints.md` §1). Un agente puede ejecutar la checklist
(prompt 4.8 de `bandadau-docs/docs/06-plan/guia-para-agentes.md`), pero la **aprobación es humana**.

Resultados posibles: **Aprobada**, **Aprobada con observaciones** (sin fallas bloqueantes; las
observaciones quedan como pendientes con dueño), **Rechazada** (vuelve a la fase anterior).

---

## 1. Requirements Review (RR)

Entrada: narrativas de UC (sección 1), modelo de dominio, RF/RNF, prototipos GUI.

- [ ] Todo RF (RF-01…RF-30) está asignado a ≥ 1 UC y aparece en `07-trazabilidad.md`.
- [ ] Todo RNF tiene un método de verificación.
- [ ] Cada UC usa la plantilla de `00-metodologia-iconix.md` (tabla de cabecera completa: paquete, actores, prioridad, RF, cátedra, servicios, estado).
- [ ] Curso básico en pasos numerados, voz activa ("El estudiante…", "El sistema…"), sin detalles de implementación (sin SQL, clases técnicas ni librerías).
- [ ] Cursos alternos numerados por paso (`4a`, `4b`) que cubren errores de validación, fallos de red/offline, permisos y concurrencia (doble clic, reintentos).
- [ ] Pre y postcondiciones explícitas; reglas de negocio enumeradas.
- [ ] Los sustantivos del texto existen en el modelo de dominio / glosario (mismos nombres en inglés para el código).
- [ ] Cada pantalla mencionada existe en `05-prototipos-gui.md` con su ID (`P-APP-nn`, `P-ADM-nn`, `P-LND-nn`) y estados vacío/error/offline.
- [ ] Textos de UI pensados para i18n (es/en) y pantallas con selector de tema/idioma donde aplica (RF-29, RF-30).
- [ ] Cada tecnología/condición de la cátedra (T1–T13, C1–C5) tiene ≥ 1 UC que la demuestra.
- [ ] Prioridad MoSCoW coherente con `vision-y-alcance.md`.
- [ ] Relaciones «include»/«extend» documentadas en el catálogo.

## 2. Preliminary Design Review (PDR)

Entrada: diagrama de robustez (sección 2) + tabla objeto → componente real.

- [ ] Cada paso del curso básico **y** de los alternos aparece en el diagrama (y no hay objetos sin paso en el texto).
- [ ] Reglas de robustez: actor ↔ boundary; boundary ↔ control; control ↔ entity; control ↔ control; **nunca** actor ↔ control ni boundary ↔ entity.
- [ ] Notación de formas correcta (actor `([ ])`, boundary `[/ /]`, control `(( ))`, entity `[( )]`).
- [ ] Controles nombrados con verbos del texto; boundaries/entidades con sustantivos del dominio.
- [ ] Nombres de boundaries de UI coinciden con `05-prototipos-gui.md` §4.
- [ ] Tabla objeto → componente asigna cada objeto a **un** servicio/app del catálogo (sin componentes inventados).
- [ ] Ningún control accede a una entidad de **otro** bounded context (database per service): la interacción entre contextos pasa por boundary de API/cola.
- [ ] Entidades nuevas agregadas a `02-modelo-dominio.md` (y glosario).
- [ ] Puntos de idempotencia identificados (Idempotency-Key, inbox, restricción única, `clientId`).
- [ ] Texto del UC corregido si el diagrama reveló ambigüedades.

## 3. Critical Design Review (CDR)

Entrada: secuencia (sección 3), clases/contratos (sección 4), `06-modelo-estatico/`, `bandadau-docs/contracts/`.

- [ ] Cada control de la robustez se convirtió en ≥ 1 mensaje de la secuencia.
- [ ] Participantes = componentes reales (pantalla, Traefik, controller/adapter, caso de uso, repositorio, outbox, RabbitMQ, otro servicio, proveedor externo).
- [ ] Curso básico + al menos el alterno más importante dibujados.
- [ ] Toda llamada que cruza servicios existe en `bandadau-docs/contracts/` (operationId OpenAPI, tipo AsyncAPI, campo GraphQL o herramienta MCP) y `make contracts-lint` pasa.
- [ ] Endpoints con efectos aceptan `Idempotency-Key`; consumidores usan inbox; publicaciones usan outbox (misma transacción).
- [ ] Errores con Problem Details y `code` estable; mensajes localizables (`Accept-Language`).
- [ ] Clases respetan la arquitectura del servicio (Hexagonal / Clean / DDD): dominio sin frameworks, puertos/adaptadores en su capa.
- [ ] `06-modelo-estatico/<contexto>.md` actualizado: atributos tipados, métodos usados en la secuencia, DDL/índices/ítems DynamoDB que soportan cada consulta.
- [ ] Seguridad: autenticación/rol por operación, `/internal` con token de servicio, datos personales mínimos.
- [ ] Observabilidad: `traceparent`/`correlationid` propagados en mensajes.
- [ ] Pruebas de aceptación (sección 5) escritas en Given/When/Then para básico y alternos.
- [ ] Para la SAGA: compensaciones, timeouts y reintentos coherentes con D2 y `saga-inscripcion-evento.md`.

## 4. Delivery Review (DR)

Entrada: código, pruebas, despliegue, trazabilidad.

- [ ] Pruebas de aceptación del UC automatizadas y verdes en CI (o manuales documentadas para IA on-device/offline).
- [ ] Pruebas unitarias, de integración (Testcontainers), de contrato y de arquitectura verdes; cobertura ≥ 70 % en dominio/aplicación.
- [ ] La implementación no diverge de la secuencia ni del contrato (si divergió, UC y contrato se actualizaron antes).
- [ ] `07-trazabilidad.md` con la fila en **V** y los IDs de prueba reales.
- [ ] RNF asociados verificados (rendimiento, offline, PWA, contraste AA en ambos temas, `i18n:check`, etc.).
- [ ] Desplegado en el entorno de demo (AWS) y probado con `BASE_DOMAIN` real.
- [ ] Documentación de componente (`AGENTS.md`, `.env.example`, `entornos-y-variables.md`) actualizada.
- [ ] Sin secretos en el repositorio; imágenes escaneadas (Trivy) sin CRITICAL.
- [ ] Ensayo de restauración de backups realizado (solo DR final).
- [ ] Guion de defensa (`cumplimiento-catedra.md`) ejecutado de punta a punta (solo DR final).

---

## 5. Estado de las revisiones

Estado al 2026-10-14: los 24 UCs tienen borradores hasta **Secuencia (pendiente CDR)**, pero
**ninguna revisión formal** se ha realizado; por regla, no se implementa ningún UC hasta aprobar
su CDR.

### 5.1 Hitos globales

| Hito | Fecha objetivo | Alcance | Revisores | Resultado | Acta |
|---|---|---|---|---|---|
| RR | 2026-10-15 (S1) | UC-01…UC-24, RF/RNF, dominio, prototipos | Equipo completo | Pendiente | — |
| PDR | 2026-10-16 (S1) | Robustez UC-01…UC-24 | Líder + dueños | Pendiente | — |
| CDR | 2026-10-17 (S1) | Secuencias, modelo estático, contratos v1 (congelados) | Líder + dueños | Pendiente | — |
| DR-S2 | 2026-10-25 | UC-01…UC-07, UC-09 | Equipo | Pendiente | — |
| DR-S3 | 2026-11-01 | UC-11…UC-16, UC-24 | Equipo | Pendiente | — |
| DR final | 2026-11-09 | Todo + guion de defensa (entrega 2026-11-10) | Equipo + docente | Pendiente | — |

### 5.2 Por caso de uso

| UC | RR | PDR | CDR | DR | Observaciones |
|---|---|---|---|---|---|
| UC-01 | Pendiente | Pendiente | Pendiente | Pendiente | — |
| UC-02 | Pendiente | Pendiente | Pendiente | Pendiente | — |
| UC-03 | Pendiente | Pendiente | Pendiente | Pendiente | — |
| UC-04 | Pendiente | Pendiente | Pendiente | Pendiente | Incluye RF-29/RF-30 (tema e idioma) |
| UC-05 | Pendiente | Pendiente | Pendiente | Pendiente | — |
| UC-06 | Pendiente | Pendiente | Pendiente | Pendiente | — |
| UC-07 | Pendiente | Pendiente | Pendiente | Pendiente | — |
| UC-08 | Pendiente | Pendiente | Pendiente | Pendiente | Should |
| UC-09 | Pendiente | Pendiente | Pendiente | Pendiente | — |
| UC-10 | Pendiente | Pendiente | Pendiente | Pendiente | Should |
| UC-11 | Pendiente | Pendiente | Pendiente | Pendiente | — |
| UC-12 | Pendiente | Pendiente | Pendiente | Pendiente | — |
| UC-13 | Pendiente | Pendiente | Pendiente | Pendiente | — |
| UC-14 | Pendiente | Pendiente | Pendiente | Pendiente | Firma QR unificada en JWS ES256 (ADR-0016) |
| UC-15 | Pendiente | Pendiente | Pendiente | Pendiente | Unificar paquetes de recarga (RF-19 vs AGENTS) |
| UC-16 | Pendiente | Pendiente | Pendiente | Pendiente | — |
| UC-17 | Pendiente | Pendiente | Pendiente | Pendiente | — |
| UC-18 | Pendiente | Pendiente | Pendiente | Pendiente | — |
| UC-19 | Pendiente | Pendiente | Pendiente | Pendiente | — |
| UC-20 | Pendiente | Pendiente | Pendiente | Pendiente | — |
| UC-21 | Pendiente | Pendiente | Pendiente | Pendiente | — |
| UC-22 | Pendiente | Pendiente | Pendiente | Pendiente | — |
| UC-23 | Pendiente | Pendiente | Pendiente | Pendiente | — |
| UC-24 | Pendiente | Pendiente | Pendiente | Pendiente | Unificar ítem de inbox DynamoDB (P-3) |

### 5.3 Plantilla de acta

```markdown
#### <Hito> — AAAA-MM-DD
- Revisores: …
- Alcance: UC-xx…UC-yy
- Resultado: Aprobada | Aprobada con observaciones | Rechazada
- Hallazgos:
  | # | UC | Ítem de checklist | Severidad (bloqueante/menor) | Corrección | Dueño | Estado |
  |---|---|---|---|---|---|---|
- Decisiones / ADRs derivados: …
```
