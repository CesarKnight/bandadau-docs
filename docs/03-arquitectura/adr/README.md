# Registro de decisiones de arquitectura (ADR)

Formato **MADR corto** (plantilla: `ADR-0000-plantilla.md`). Un ADR por decisión significativa;
**inmutable** una vez aceptado: para cambiar una decisión se crea un ADR nuevo que la reemplaza y se
marca el anterior como "Reemplazada por ADR-XXXX".

Reglas:
- Cambiar `catalogo-servicios.md` **exige** un ADR previo (`AGENTS.md` del workspace, regla 10).
- Numeración correlativa de 4 dígitos; archivo `ADR-NNNN-slug-en-kebab-case.md`; texto en español.
- Agregar la fila a este índice en el mismo PR.

| ADR | Título | Estado | Fecha | Decisión relacionada |
|---|---|---|---|---|
| [ADR-0001](ADR-0001-monorepo.md) | Monorepo único | Reemplazada por ADR-0017 | 2026-10-14 | — |
| [ADR-0002](ADR-0002-rabbitmq-como-broker.md) | RabbitMQ como broker de mensajes | Aceptada | 2026-10-14 | Catálogo §5 |
| [ADR-0003](ADR-0003-saga-orquestada.md) | SAGA orquestada para la inscripción | Aceptada | 2026-10-14 | D2 |
| [ADR-0004](ADR-0004-cloudevents-outbox-inbox.md) | CloudEvents + Transactional Outbox + Inbox | Aceptada | 2026-10-14 | D3, D12 |
| [ADR-0005](ADR-0005-sin-envoltorio-y-problem-details.md) | Respuestas sin envoltorio y errores RFC 9457 | Aceptada | 2026-10-14 | Catálogo §8 |
| [ADR-0006](ADR-0006-microfrontends-web-components.md) | Microfrontends con Web Components en runtime | Aceptada | 2026-10-14 | D5 |
| [ADR-0007](ADR-0007-jwt-rs256-y-handoff-sso.md) | JWT RS256 con JWKS y handoff SSO | Aceptada | 2026-10-14 | D4 |
| [ADR-0008](ADR-0008-onnx-para-inferencia.md) | ONNX como formato de inferencia | Aceptada | 2026-10-14 | D7 |
| [ADR-0009](ADR-0009-ia-local-executorch-webllm.md) | IA local con ExecuTorch (nativo) y WebLLM (web) | Aceptada | 2026-10-14 | D6 |
| [ADR-0010](ADR-0010-llm-intercambiable-claude-ollama.md) | LLM intercambiable: Claude (demo/prod) y Ollama (dev) | Aceptada | 2026-10-14 | D8 |
| [ADR-0011](ADR-0011-traefik-gateway.md) | Traefik como API gateway | Aceptada | 2026-10-14 | Catálogo §4 |
| [ADR-0012](ADR-0012-infra-aws-ec2-compose.md) | Infraestructura AWS: un EC2 con Docker Compose + servicios gestionados | Aceptada | 2026-10-14 | Arquitectura §7 |
| [ADR-0013](ADR-0013-nombre-bandada-u.md) | Nombre del producto: Bandada U | Aceptada | 2026-10-14 | Marca |
| [ADR-0014](ADR-0014-design-tokens-dtcg.md) | Tokens de diseño en formato W3C DTCG con temas claro/oscuro | Aceptada | 2026-10-14 | D13 |
| [ADR-0015](ADR-0015-i18n-icu-es-en.md) | i18n con ICU MessageFormat (es / en) | Aceptada | 2026-10-14 | D14 |
| [ADR-0016](ADR-0016-consolidacion-diseno-detallado.md) | Consolidación del diseño detallado | Aceptada | 2026-10-14 | D15, catálogo §3/§5/§6 |
| [ADR-0017](ADR-0017-multi-repo-por-capa.md) | Repositorios por capa (estilo Homy) | Aceptada | 2026-10-14 | Arquitectura §6, convenciones §3 |
| [ADR-0018](ADR-0018-decisiones-implementacion-fase-1.md) | Decisiones de implementación de la fase 1 | Aceptada | 2026-10-15 | ADR-0016, ADR-0017; catálogo §3 |
| [ADR-0019](ADR-0019-rate-limit-distribuido-en-postgres.md) | Rate limit distribuido de identity en PostgreSQL (Redis diferido) | Aceptada | 2026-10-15 | D-16, ADR-0012 |
| [ADR-0024](ADR-0024-saga-multinube-aws-gcp-azure.md) | Despliegue multi-nube de los servicios de la SAGA (events en Azure, wallet en GCP, ticketing y datos en AWS) | Aceptada (diseño) | 2026-10-29 | ADR-0012 (parcial), C1, infraestructura §4.6 |
| [ADR-0025](ADR-0025-despliegue-simplificado-tailscale.md) | Despliegue simplificado: red privada Tailscale entre AWS, Azure y GCP; datos en contenedores del EC2, DynamoDB real, nginx y Let's Encrypt | Aceptada (diseño) | 2026-11-06 | ADR-0024 y ADR-0012 (parcial), C6, infraestructura §4.6 |
