# CAPÍTULO V. PRUEBAS Y RESULTADOS

## 5.1. Plan de pruebas

El plan de pruebas sigue una pirámide: muchas pruebas unitarias rápidas en el dominio y la aplicación, menos pruebas de integración con bases de datos y broker reales, pruebas de contrato entre servicios y un número reducido de recorridos de extremo a extremo. Las pruebas de arquitectura verifican que cada servicio respete su estilo (Hexagonal, Clean o DDD).

@@include 04-patrones-y-reglas/testing-strategy.md section="^1\. Pirámide" demote=2

@@include 04-patrones-y-reglas/testing-strategy.md section="^2\. Herramientas" demote=2

@@include 04-patrones-y-reglas/testing-strategy.md section="^3\. Pruebas de arquitectura" demote=2

@@include 04-patrones-y-reglas/testing-strategy.md section="^10\. Qué corre en CI" demote=2

## 5.2. Pruebas funcionales

Las pruebas funcionales se derivan directamente de los casos de uso: cada caso de uso tiene su tabla de **pruebas de aceptación** en formato *Given / When / Then*, que cubre el curso básico, los cursos alternos y las reglas de negocio. A continuación se presentan las de los nueve casos de uso clave; la sección 5.6.2 resume los casos de aceptación de los 24.

@@uc section=5 numprefix=5.2

## 5.3. Pruebas de integración

Las pruebas de integración verifican la colaboración entre servicios reales. Se organizan en cuatro grupos: contratos, idempotencia, SAGA con fallos inyectados y recorrido de extremo a extremo.

@@include 04-patrones-y-reglas/testing-strategy.md section="^4\. Pruebas de contrato" demote=2

@@include 04-patrones-y-reglas/testing-strategy.md section="^5\. Idempotencia" demote=2

@@include 04-patrones-y-reglas/testing-strategy.md section="^6\. SAGA con fallos" demote=2

@@include 04-patrones-y-reglas/testing-strategy.md section="^7\. E2E" demote=2

### 5.3.1. Prueba de humo de extremo a extremo (`make smoke`)

La prueba de humo recorre el sistema levantado con Docker Compose usando solo sus APIs públicas: registro con verificación por correo, publicación, recarga idempotente, inscripción pagada con ticket firmado, inscripción repetida, cupo lleno, validación de entrada, fallo inyectado en `ticketing-service` con compensación, GraphQL con control de roles, servidor MCP, reportes generativos en español e inglés, agente de monitoreo y alertas. Termina con código distinto de cero si alguna comprobación falla.

## 5.4. Corrección de errores

La deuda técnica y los defectos detectados al contrastar el código con los contratos se registraron con un identificador, una prioridad y el commit que los cerró. Se reproducen aquí las secciones de sincronización de contratos y de cumplimiento de contrato.

@@include 06-plan/deuda-tecnica.md section="^1\. Acciones de sincronización" demote=2

@@include 06-plan/deuda-tecnica.md section="^2\. Cumplimiento de contrato" demote=2

### 5.4.1. Defectos hallados en la verificación final (2026-11-06)

Al reconstruir el sistema desde cero para esta entrega se encontraron cuatro problemas; tres se corrigieron en el repositorio y uno es de entorno:

| ID | Hallazgo | Causa | Corrección |
|---|---|---|---|
| V-1 | `make up` fallaba al compilar: *Timeout waiting to lock journal cache* en `identity-service` | Las imágenes de `identity-service` y `events-service` se construyen en paralelo y comparten la misma caché de Gradle (`--mount=type=cache`); dos procesos de Gradle de contenedores distintos no pueden coordinarse sobre un mismo directorio | Montar la caché con `sharing=locked` en ambos `Dockerfile`, de modo que las compilaciones se serialicen. Tras el cambio, `make up` terminó con los 21 contenedores sanos |
| V-2 | La prueba de humo fallaba en «Reporte generativo (es)» de forma intermitente | La comprobación exigía un encabezado fijo («Limitaciones» / «Limitations») en un texto que redacta un modelo de lenguaje; el reporte era correcto y estaba en el idioma pedido | Comprobar el idioma y el contenido con palabras del idioma en lugar de un encabezado literal |
| V-4 | La prueba de humo fallaba en la verificación del correo (los correos sí llegaban a Mailpit) | Tras suspender el equipo, el reloj de la máquina virtual de Docker quedó desfasado respecto del anfitrión y la prueba descarta correos «anteriores» a su inicio | Problema de entorno: reiniciar Docker Desktop o sincronizar el reloj antes de la prueba. Con el reloj sincronizado la corrida final pasó 41 de 41 |
| V-3 | La siembra de datos fallaba en las publicaciones con foto | `S3_PUBLIC_ENDPOINT` del archivo `.env` local apuntaba a una dirección de la red local antigua, y las URLs prefirmadas se firman con ese host | Problema de entorno, no de código: ajustar `S3_PUBLIC_ENDPOINT` a `http://localhost:9000` (o a la IP actual cuando se prueba con un teléfono físico) |

## 5.5. Resultados de las pruebas

### 5.5.1. Reconstrucción y prueba de humo (2026-11-06)

Se levantó el sistema completo desde cero con `make up` (compilación de las nueve imágenes de servicio y arranque de la infraestructura) y se ejecutó `make smoke`. Resultado de la corrida final: 41 de 41 comprobaciones aprobadas (detalle en la sección 5.6.1).

| Medida | Resultado |
|---|---|
| Contenedores en ejecución y con estado *healthy* tras `make up` | 21 de 21 (más los de infraestructura de un solo uso) |
| Inscripción pagada de extremo a extremo (reserva de cupo, débito, ticket QR) | ≈ 3.1 s en una máquina de desarrollo con la pila fría (objetivo RNF-02: p95 < 3 s) |
| Rollback de la SAGA con `CHAOS_TICKETING_FAIL=true` | Inscripción en `FAILED`, asientos `DEBIT` y `REFUND` en la billetera y saldo restaurado |
| Idempotencia: doble pago simultáneo | El saldo aumenta una sola vez; un solo asiento `TOPUP` |
| Control de acceso | `/internal/**` y la emisión de tokens de servicio responden 403 en el gateway; un estudiante no accede a GraphQL de moderación; el servidor MCP exige rol ADMIN |

### 5.5.2. Cumplimiento de los requisitos no funcionales

@@include 02-iconix/07-trazabilidad.md section="^2\. Requisitos no funcionales" demote=2

### 5.5.3. Estado del despliegue en la nube

El despliegue en tres proveedores (sección 4.6) está especificado con archivos de despliegue, scripts y una guía paso a paso (anexo F). La siguiente tabla debe completarse con la evidencia de la ejecución real.

| Elemento | Nube | Estado | Evidencia |
|---|---|---|---|
| `events-service` | Azure | A completar tras el despliegue | |
| `wallet-service` (web, consumidor, relé) | Google Cloud | A completar tras el despliegue | |
| `ticketing-service` y resto de servicios | AWS | A completar tras el despliegue | |
| Red privada entre las tres máquinas | Tailscale | A completar tras el despliegue | |
| Inscripción pagada y rollback con servicios en tres nubes | — | A completar tras el despliegue | |

## 5.6. Casos de prueba

### 5.6.1. Comprobaciones de la prueba de humo

Corrida final del 6 de noviembre de 2026 sobre el sistema reconstruido con `make up` (21 contenedores sanos). Resultado: **41 de 41 comprobaciones aprobadas**.

| N.º | Comprobación | Resultado | Tiempo (ms) |
|---|---|---|---|
| 1 | Borde: API responde (Traefik → identity) | Aprobada | 67 |
| 2 | Borde: /internal/** → 403 y service-token → 403 en Traefik | Aprobada | 8 |
| 3 | Universidades UMSA disponible | Aprobada | 8 |
| 4 | Registro (201 PENDING_VERIFICATION) | Aprobada | 62 |
| 5 | Registro repetido con la misma Idempotency-Key → misma respuesta | Aprobada | 5 |
| 6 | Verificación de email (código desde Mailpit) | Aprobada | 50 |
| 7 | Login y GET /users/me | Aprobada | 237 |
| 8 | Post publicado y legible (UC-05) | Aprobada | 124 |
| 9 | Feed responde (UC-06) | Aprobada | 20 |
| 10 | Recarga: createTopUp repetido con la misma clave → misma recarga | Aprobada | 60 |
| 11 | Recarga: doble "pagar" simultáneo → saldo +50 una sola vez | Aprobada | 43 |
| 12 | Login del organizador (org@umsa.edu.bo) | Aprobada | 40 |
| 13 | Organizador crea y publica un evento de 20 créditos | Aprobada | 24 |
| 14 | Inscripción pagada: 202 PENDING → CONFIRMED con ticket | Aprobada | 10323 |
| 15 | Débito de 20 créditos aplicado (saldo 30) | Aprobada | 86 |
| 16 | Ticket con QR firmado ES256 verificable con /tickets/signing-keys | Aprobada | 91 |
| 17 | Inscripción repetida al mismo evento → 409 ALREADY_REGISTERED | Aprobada | 41 |
| 18 | Notificación in-app de la inscripción (notification-service) | Aprobada | 33 |
| 19 | Validación de tickets: solo el organizador del evento (org2 → 403, org → 200) | Aprobada | 2213 |
| 20 | Cupo 1: segundo usuario recibe 409 EVENT_FULL | Aprobada | 1463 |
| 21 | Login del moderador (mod@umsa.edu.bo) | Aprobada | 60 |
| 22 | GraphQL moderationQueue (moderador) | Aprobada | 39 |
| 23 | GraphQL: un estudiante recibe FORBIDDEN (RBAC) | Aprobada | 5 |
| 24 | Preparar: usuario con 50 créditos y evento de 20 créditos | Aprobada | 721 |
| 25 | Activar CHAOS_TICKETING_FAIL en ticketing-service | Aprobada | 3475 |
| 26 | Inscripción con fallo en ticketing → FAILED y créditos reembolsados | Aprobada | 12378 |
| 27 | Restaurar ticketing-service (caos desactivado) | Aprobada | 3335 |
| 28 | Insights: /health/ready responde (insights-service) | Aprobada | 15 |
| 29 | Login del administrador (admin@umsa.edu.bo, audiencia del panel) | Aprobada | 88 |
| 30 | MCP: sin token → 401 con WWW-Authenticate (Traefik /mcp → insights) | Aprobada | 9 |
| 31 | MCP: un moderador recibe 403 (solo ADMIN) | Aprobada | 56 |
| 32 | MCP: initialize (Streamable HTTP, token ADMIN) | Aprobada | 6 |
| 33 | MCP: tools/list devuelve las herramientas del contrato (sin raise_alert) | Aprobada | 5 |
| 34 | MCP: tools/call get_platform_kpis → KPIs agregados | Aprobada | 27 |
| 35 | MCP: tools/call get_service_health → servicios y colas | Aprobada | 51 |
| 36 | Reporte generativo (es): requestReport → 202 PENDING → READY con markdown y dataset | Aprobada | 31580 |
| 37 | AgentRun del reporte: pasos, herramientas MCP y tokens auditados | Aprobada | 16 |
| 38 | Reporte (en): mismo flujo en inglés | Aprobada | 7150 |
| 39 | Monitoreo: runMonitoringNow (interno) → SUCCEEDED | Aprobada | 1095 |
| 40 | Alerta de prueba: raiseAlert → publicada (alert.raised) → visible en el panel (GraphQL alerts) | Aprobada | 53 |
| 41 | Alerta: acknowledge (REST) y GraphQL reports/agentRuns sin FEATURE_DISABLED | Aprobada | 32 |
| | **Total** | **41 de 41 aprobadas** | |

### 5.6.2. Casos de aceptación por caso de uso

La tabla resume cuántos casos de aceptación tiene cada caso de uso; el detalle completo está en la sección 5.2.

@@uc-test-summary
