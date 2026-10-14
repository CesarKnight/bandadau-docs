# Bandada U

> La red social de tu universidad: estudiantes verificados, publicaciones y apuntes, grupos de
> estudio, eventos con inscripción pagada y un asistente de estudio con IA que funciona sin conexión.

**Ingeniería de Software II · Grupo 24** · Metodología **ICONIX**

| | |
|---|---|
| Backend | 9 microservicios — Spring Boot · NestJS · Laravel (PHP) |
| Datos | PostgreSQL · MongoDB · DynamoDB · S3 |
| Frontend | Expo SDK 57 (iOS / Android / Web PWA) · Next.js 16 (landing y panel) · Angular 21 y React (microfrontends) |
| Integración | REST (OpenAPI) · GraphQL · RabbitMQ (CloudEvents) · SAGA · MCP |
| IA | Deep learning de imágenes/video (ONNX) · ML de recomendación y anomalías · agentes con LLM · IA local on-device |
| Automatización | n8n |
| UI | Tokens de diseño con modo claro/oscuro · i18n español / inglés |

## Empezar

- **Personas**: lee [`bandadau-docs/docs/00-indice.md`](bandadau-docs/docs/00-indice.md) y la [visión y alcance](bandadau-docs/docs/01-vision/vision-y-alcance.md).
- **Agentes de IA**: lee [`AGENTS.md`](AGENTS.md) antes de cualquier tarea.
- **Fuente de verdad técnica**: [`bandadau-docs/docs/03-arquitectura/catalogo-servicios.md`](bandadau-docs/docs/03-arquitectura/catalogo-servicios.md).
- **Cumplimiento de la cátedra**: [`bandadau-docs/docs/01-vision/cumplimiento-catedra.md`](bandadau-docs/docs/01-vision/cumplimiento-catedra.md).

## Levantar en local (cuando exista el código)

```bash
cd bandadau-infra
make env     # copia .env.example → .env
make up
```

App `http://app.bandada.localhost` · Panel `http://admin.bandada.localhost` ·
Landing `http://bandada.localhost` · API `http://api.bandada.localhost`.

## Estado

Fase ICONIX: **diseño detallado** (casos de uso con robustez y secuencia, contratos definidos).
Siguiente hito: *Critical Design Review* y arranque de R0. Ver
[`bandadau-docs/docs/06-plan/roadmap-y-sprints.md`](bandadau-docs/docs/06-plan/roadmap-y-sprints.md).
