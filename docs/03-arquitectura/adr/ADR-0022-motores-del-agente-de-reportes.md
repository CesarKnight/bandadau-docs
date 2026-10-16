# ADR-0022 — Motores seleccionables del agente de reportes (OpenCode Go, Ollama, determinista)

- **Estado:** Aceptada
- **Fecha:** 2026-10-16
- **Decisiones relacionadas:** D8 (agentes sobre MCP), ADR-0016; `agentes-y-reportes-generativos.md` §3.4

## Contexto

El agente de reportes funcionaba con tres proveedores fijos por despliegue (`LLM_PROVIDER`: stub, claude, ollama). El modelo local
(`qwen2.5:3b`, CPU) no planifica bien preguntas abiertas y por eso se implementó el modo híbrido (código planifica, el modelo redacta).
El usuario dispone de una suscripción **OpenCode Go** (API OpenAI-compatible con tool-calling nativo) y quiere elegir el motor desde el panel.

## Decisión

1. `enum ReportEngine { AUTO OPENCODE OLLAMA STUB }`; `requestReport(question, locale, engine = AUTO)`, query `reportEngines` y
   `GeneratedReport.engine/model`, `AgentRun.engine/engineMode` (contratos GraphQL 1.5.0 y OpenAPI insights 1.2.0).
2. Registro de motores (Strategy/Factory) con **cadena de respaldo**: `LLM_PROVIDERS=opencode,ollama,stub` fija el orden de AUTO. Salud barata en caché
   (30 s) y *circuit breaker* (3 fallos o un 429/401 → motor fuera 60 s–5 min). Un motor explícito se usa tal cual y, si falla, responde STUB dejando
   constancia (`<modelo>+stub-fallback`).
3. OpenCode Go se integra con un adaptador OpenAI-compatible con dos modos: `agent` (tool-calling nativo con validación de argumentos
   contra el esquema de las herramientas MCP, por defecto) y `hybrid` (planificador determinista; el modelo solo redacta y el código verifica).
4. **Privacidad hacia terceros**: antes de salir se seudonimizan los `displayName` («Persona A/B…», mapa en memoria por petición, restituidos en la
   respuesta) y se enmascaran correos, teléfonos y tokens. Los datos agregados sí salen.
5. Se rechazan siempre los modelos `*-contributor` (su tráfico se usa para entrenar).

## Consecuencias

- Los reportes con motor externo dependen de la cuota en dólares de la suscripción (ventanas de 5 h, semana y mes): un 429 cae al siguiente motor.
- La pregunta escrita por el administrador sale tal cual; si contiene un nombre propio no se puede seudonimizar (limitación documentada).
- Sin cambios en el catálogo de servicios (no hay servicios nuevos).
