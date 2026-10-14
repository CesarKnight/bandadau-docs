# Requisitos no funcionales

| ID | Categoría | Requisito | Verificación |
|---|---|---|---|
| RNF-01 | Rendimiento | p95 < 300 ms en lecturas REST y < 600 ms en escrituras (sin contar procesamiento asíncrono), con 100 usuarios concurrentes en el host de demo. | Prueba k6 en `bandadau-infra/load/` |
| RNF-02 | Rendimiento | La SAGA de inscripción completa en < 3 s p95 en condiciones normales. | Métrica `saga_duration_seconds` |
| RNF-03 | Disponibilidad | La caída de `notification-service` o `insights-service` no impide publicar ni inscribirse (degradación elegante). | Prueba de caos manual |
| RNF-04 | Consistencia | Consistencia eventual entre servicios; ningún estado intermedio de la SAGA puede quedar abierto más de 2 min (timeouts + compensación). | Prueba de integración con fallo inyectado |
| RNF-05 | Idempotencia | Todo endpoint que crea efectos acepta `Idempotency-Key`; todo consumidor es idempotente. Reenviar la misma petición/mensaje N veces produce el mismo efecto que 1. | Pruebas automatizadas de reintento |
| RNF-06 | Seguridad | Contraseñas con Argon2id; JWT RS256 con rotación de llaves (JWKS); HTTPS en prod; CORS restringido a orígenes conocidos; rate-limit en auth (10/min/IP). | Revisión + OWASP ZAP baseline |
| RNF-07 | Seguridad | Principio de mínimo privilegio: cada servicio tiene su propio usuario de DB y su política IAM; los endpoints `/internal` no salen del gateway. | Revisión de infra |
| RNF-08 | Privacidad | Los medios se guardan en buckets privados; se sirven con URLs prefirmadas (15 min). Los datos personales no se envían al LLM salvo agregados. | Revisión de prompts y herramientas MCP |
| RNF-09 | Offline | La app permite leer el feed cacheado, crear posts/comentarios y usar el asistente sin red; la cola sobrevive al cierre de la app. | Prueba manual en modo avión |
| RNF-10 | PWA | Lighthouse PWA "installable" y puntuación de rendimiento ≥ 80 en la app web. | Lighthouse CI |
| RNF-11 | IA local | El modelo on-device ocupa ≤ 1.5 GB, se descarga bajo demanda (Wi-Fi) y responde el primer token en < 3 s en un teléfono de gama media. | Prueba manual |
| RNF-12 | ML | El modelo de moderación tiene recall ≥ 0.90 para contenido no apto en el set de validación; cada resultado guarda `modelVersion`. | Notebook de evaluación en `bandadau-ml/` |
| RNF-13 | Observabilidad | Toda petición y mensaje lleva `traceparent`; logs JSON estructurados con `traceId`, `correlationId`, `service`. | Traza de punta a punta de la SAGA en Grafana |
| RNF-14 | Mantenibilidad | Cada servicio respeta su arquitectura (Hexagonal/Clean/DDD) verificada con pruebas de arquitectura (ArchUnit, dependency-cruiser, Deptrac). | CI |
| RNF-15 | Calidad | Cobertura ≥ 70 % en capa de dominio/aplicación; contratos validados en CI (Spectral, AsyncAPI CLI, graphql-inspector). | CI |
| RNF-16 | Portabilidad | Todo el sistema levanta en local con `make up` en < 10 min en una máquina con 16 GB RAM. | README |
| RNF-17 | Usabilidad | UI bilingüe (es/en), accesibilidad WCAG 2.2 AA en landing y panel; objetivos táctiles ≥ 44 px. | axe + revisión |
| RNF-18 | Costo | Infra de demo ≤ USD 60/mes **con apagado programado** del EC2 fuera de horario y capas gratuitas cuando sea posible (ADR-0016). | Estimación en `05-infraestructura` |
| RNF-19 | IA responsable | Los agentes no ejecutan acciones destructivas sin confirmación humana; toda ejecución queda auditada en `AgentRun`. | Revisión |
| RNF-20 | Diseño | Ninguna UI usa colores/medidas literales: solo tokens de `@bandada/ui-tokens`. Todo par texto/fondo semántico cumple contraste AA en modo claro **y** oscuro; sin parpadeo de tema al cargar. | Lint (stylelint/ESLint) + test de contraste de tokens |
| RNF-21 | i18n | 0 textos literales en UI; `es` y `en` con el mismo conjunto de claves y sintaxis ICU válida; fechas/números/créditos con `Intl` según locale. | `i18n:check` + ESLint en CI |
