# 8. ANEXOS

## Anexo A. Matriz de trazabilidad

Cada requisito funcional se traza a un caso de uso, a las operaciones y eventos de los contratos, a los componentes que lo implementan y a las pruebas de aceptación. Estados: **P** pendiente, **C** contratado, **I** implementado, **V** verificado.

@@include 02-iconix/07-trazabilidad.md section="^Leyenda" demote=2

@@include 02-iconix/07-trazabilidad.md section="^1\. Requisitos funcionales" demote=2

@@include 02-iconix/07-trazabilidad.md section="^2\. Requisitos no funcionales" demote=2

## Anexo B. Contratos de interfaz

Los contratos viven en el repositorio de documentación y se escriben antes que el código.

| Tipo | Archivo | Descripción |
|---|---|---|
| OpenAPI 3.1 | `contracts/openapi/identity-service.yaml` | Registro, sesión, usuarios, universidades, JWKS |
| OpenAPI 3.1 | `contracts/openapi/social-service.yaml` | Perfiles, publicaciones, feed, grupos, seguimiento, denuncias |
| OpenAPI 3.1 | `contracts/openapi/media-service.yaml` | Subida y descarga de medios, moderación |
| OpenAPI 3.1 | `contracts/openapi/events-service.yaml` | Eventos e inscripciones (orquestador de la SAGA) |
| OpenAPI 3.1 | `contracts/openapi/wallet-service.yaml` | Billetera, recargas y movimientos |
| OpenAPI 3.1 | `contracts/openapi/ticketing-service.yaml` y `ticketing-service-stats.yaml` | Entradas, validación y estadísticas internas |
| OpenAPI 3.1 | `contracts/openapi/notification-service.yaml` | Notificaciones y dispositivos |
| OpenAPI 3.1 | `contracts/openapi/insights-service.yaml` | Reportes, alertas, ejecuciones de agentes |
| OpenAPI 3.1 | `contracts/openapi/shared/` | Componentes comunes (errores Problem Details, paginación, cabeceras) |
| AsyncAPI 3.0 | `contracts/asyncapi/bandada-events.yaml` | Catálogo de eventos, comandos y respuestas de la SAGA (CloudEvents sobre RabbitMQ) |
| GraphQL SDL | `contracts/graphql/admin.graphql` | API del panel: consultas, mutaciones y subscripciones |
| MCP | `contracts/mcp/tools.md` y `tools.schema.json` | Herramientas del servidor MCP |

## Anexo C. Catálogo de componentes de plataforma, mensajería y roles

@@include 03-arquitectura/catalogo-servicios.md section="^2\. Frontends" demote=2

@@include 03-arquitectura/catalogo-servicios.md section="^3\. Plataforma" demote=2

@@include 03-arquitectura/catalogo-servicios.md section="^5\. Mensajería" demote=2

@@include 03-arquitectura/catalogo-servicios.md section="^7\. Roles" demote=2

## Anexo D. Registro de decisiones de arquitectura (ADR)

@@include 03-arquitectura/adr/README.md demote=2

### ADR-0003 — SAGA orquestada

@@include 03-arquitectura/adr/ADR-0003-saga-orquestada.md demote=2

### ADR-0025 — Despliegue simplificado con red privada

@@include 03-arquitectura/adr/ADR-0025-despliegue-simplificado-tailscale.md demote=2

## Anexo E. Guía de levantamiento local

@@include 05-infraestructura/guia-levantamiento-local.md demote=1

## Anexo F. Guía de despliegue en AWS, Google Cloud y Azure

@@include 05-infraestructura/guia-despliegue.md demote=1

## Anexo G. Plan de trabajo y riesgos

@@include 06-plan/roadmap-y-sprints.md demote=1

## Anexo H. Revisiones ICONIX

@@include 02-iconix/08-revisiones.md demote=1

## Anexo I. Glosario

@@include 01-vision/glosario.md demote=1
