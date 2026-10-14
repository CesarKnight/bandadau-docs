# ADR-0010 — LLM intercambiable: Claude (demo/prod) y Ollama (dev)

- **Estado:** Aceptada
- **Fecha:** 2026-10-14
- **Decisores:** Equipo Grupo 24 (Ing. Software II)

## Contexto

Los agentes (T5) y reportes (T11) necesitan un LLM con *tool use* de buena calidad en la demo, pero el
desarrollo diario no debe costar dinero ni depender de una API externa.

## Decisión

Puerto `LlmPort` en insights-service con `ClaudeAdapter` (Anthropic API: `claude-sonnet-5-5` para el
loop y la redacción, `claude-haiku-5-5` para tareas baratas) y `OllamaAdapter` (modelo local con
*tool calling*). Selección por `LLM_PROVIDER`. TTS análogo con `TtsPort` (Polly / Piper). D8.

## Alternativas consideradas

| Alternativa | Motivo de descarte |
|---|---|
| Solo Claude | Costo y dependencia de red en desarrollo y CI. |
| Solo Ollama | Calidad insuficiente de tool use y redacción para la demo; requiere GPU en el EC2. |
| Frameworks de agentes (LangChain…) | Abstracción extra sobre un loop sencillo; menos control de límites y auditoría. |

## Consecuencias

- (+) Dominio y casos de uso independientes del proveedor.
- (+) Costo predecible (presupuesto mensual, caché de prompts).
- (−) Diferencias de comportamiento entre proveedores: el set de evaluación se corre con Claude antes de la demo.
- (−) El adaptador debe normalizar `stop_reason`, bloques de herramientas y uso de tokens.

## Referencias

D8, `agentes-y-reportes-generativos.md`
