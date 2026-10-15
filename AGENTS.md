# AGENTS.md — bandadau-docs

Repositorio de **documentación ICONIX** y **contratos** de Bandada U. Es la **fuente de verdad**:
los demás repos implementan lo que está aquí, no lo redefinen. Lee primero `../AGENTS.md` (workspace).

## Contenido

| Ruta | Qué es |
|---|---|
| `docs/00-indice.md` | Mapa de toda la documentación y orden de lectura |
| `docs/01-vision/` | Visión, alcance, cumplimiento de la cátedra, marca, glosario |
| `docs/02-iconix/` | Requisitos, modelo de dominio, 24 casos de uso, prototipos, modelo estático, trazabilidad, revisiones |
| `docs/03-arquitectura/` | **Catálogo (normativo)**, decisiones clave D1–D15, documentos de detalle, ADRs |
| `docs/04-patrones-y-reglas/` | Convenciones, hexagonal/clean/DDD, REST, frontend, tokens, i18n, pruebas, DoD |
| `docs/05-infraestructura/` | Infraestructura y variables de entorno |
| `docs/06-plan/` | Roadmap (entrega 10-nov-2026), backlog, guía para agentes, registro de sesiones |
| `contracts/` | OpenAPI 3.1 (8 servicios + `shared/`), AsyncAPI 3.0, GraphQL SDL, herramientas MCP |

## Reglas

- Documentación en **español**; identificadores en **inglés**, idénticos a los del catálogo y el modelo de dominio.
- Rutas en los textos: **relativas al workspace** (`bandadau-backend/services/...`). Enlaces Markdown: relativos al archivo.
- Cambiar `docs/03-arquitectura/catalogo-servicios.md` exige un ADR nuevo en `docs/03-arquitectura/adr/`.
- Un cambio de contrato sube `info.version`, agrega entrada al changelog del archivo y se commitea
  **antes** que su implementación en otros repos.
- Mermaid válido (sin `;` ni `#` sueltos en etiquetas; etiquetas con símbolos entre comillas).
- Al cerrar una sesión de trabajo en cualquier repo: actualizar el UC, `docs/02-iconix/07-trazabilidad.md`
  y `docs/06-plan/registro-de-sesiones.md`.

## Comandos

```bash
make contracts-lint   # spectral (OpenAPI) + asyncapi validate + graphql-inspector introspect (SDL) + ajv compile (MCP)
make links            # verifica enlaces relativos de docs/
```

(`Makefile` y `scripts/check-links.mjs` implementan HT-03; las herramientas van fijadas por versión vía `npx`.)
