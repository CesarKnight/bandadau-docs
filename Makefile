# bandadau-docs — lint de contratos y verificación de enlaces (backlog HT-03).
# Herramientas con versión fija vía npx (no hay package.json en este repo). Requiere Node >= 20.
SPECTRAL    ?= @stoplight/spectral-cli@6.17.0
ASYNCAPI    ?= @asyncapi/cli@6.2.1
GQL_INSPECT ?= @graphql-inspector/cli@7.0.1
GRAPHQL     ?= graphql@17.0.2
AJV_CLI     ?= ajv-cli@5.0.0
NPX := npx --yes

.PHONY: help contracts-lint lint-openapi lint-asyncapi lint-graphql lint-mcp links

help: ## Lista los objetivos
	@grep -E '^[a-z-]+:.*## ' $(MAKEFILE_LIST) | awk -F':.*## ' '{printf "  %-16s %s\n", $$1, $$2}'

contracts-lint: lint-openapi lint-asyncapi lint-graphql lint-mcp ## Spectral (OpenAPI) + AsyncAPI + GraphQL + esquema MCP
	@echo "contracts-lint OK"

lint-openapi: ## Spectral sobre contracts/openapi/*.yaml con contracts/.spectral.yaml
	$(NPX) $(SPECTRAL) lint "contracts/openapi/*.yaml" --ruleset contracts/.spectral.yaml --fail-severity=error

lint-asyncapi: ## Valida contracts/asyncapi/bandada-events.yaml
	SUPPRESS_NO_CONFIG_WARNING=1 $(NPX) $(ASYNCAPI) validate contracts/asyncapi/bandada-events.yaml

lint-graphql: ## Valida el SDL de contracts/graphql/admin.graphql (construye el esquema)
	@d=$$(mktemp -d) && $(NPX) -p $(GQL_INSPECT) -p $(GRAPHQL) graphql-inspector introspect contracts/graphql/admin.graphql --write $$d/schema.graphql; r=$$?; rm -rf $$d; exit $$r

lint-mcp: ## Compila contracts/mcp/tools.schema.json con ajv
	$(NPX) $(AJV_CLI) compile -s contracts/mcp/tools.schema.json --spec=draft2020 --strict=false

links: ## Verifica enlaces relativos de los .md (archivos; ignora URLs, anclas puras y bloques de código)
	@node scripts/check-links.mjs
