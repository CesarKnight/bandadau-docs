# Modelo estático — Insights (`insights-service`)

TypeScript + NestJS 11 · **Clean Architecture** · DynamoDB `bandada-insights` + S3 (audio).
UCs: UC-19, UC-20, UC-22, UC-23 (resumen semanal). Agentes, LLM, TTS y MCP: D8, D9,
`bandadau-docs/docs/03-arquitectura/agentes-y-reportes-generativos.md` (§7 persistencia, normativa para este
contexto) y `bandadau-docs/docs/03-arquitectura/mcp.md`.

## 1. Clases de diseño

```mermaid
classDiagram
    direction LR
    namespace entities {
        class GeneratedReport {
            <<Entity>>
            +id: string
            +question: string
            +locale: Locale
            +status: ReportStatus
            +markdown: string
            +dataset: DatasetRow[]
            +chart: VegaLiteSpec
            +audioKey: string
            +fidelityWarning: boolean
            +requestedBy: string
            +agentRunId: string
            +createdAt: Date
            +complete(out: ReportOutput) void
            +fail(code: string) void
        }
        class AgentRun {
            <<Entity>>
            +id: string
            +agent: AgentKind
            +trigger: RunTrigger
            +requestedBy: string
            +locale: Locale
            +status: RunStatus
            +steps: number
            +toolsUsed: string[]
            +tokens: TokenUsage
            +costUsdMicros: number
            +startedAt: Date
            +finishedAt: Date
            +recordStep(s: AgentStep) void
            +guard(limits: AgentLimits) void
        }
        class AgentStep {
            <<ValueObject>>
            +index: number
            +kind: StepKind
            +toolName: string
            +argsRedacted: object
            +resultSize: number
            +durationMs: number
        }
        class Alert {
            <<Entity>>
            +id: string
            +kind: AlertKind
            +severity: AlertSeverity
            +status: AlertStatus
            +fingerprint: string
            +message: string
            +explanation: string
            +occurrences: number
            +firstSeenAt: Date
            +lastSeenAt: Date
            +raiseOrBump(now: Date) void
            +acknowledge(by: string) void
        }
        class MetricPoint {
            <<ValueObject>>
            +name: string
            +date: string
            +value: number
        }
        class AgentLimits {
            <<Policy>>
            +maxSteps: number
            +maxTokens: number
        }
    }
    namespace use_cases {
        class RequestReportUseCase {
            <<UseCase>>
            +execute(question, locale, user) ReportAccepted
        }
        class RunReportAgentUseCase {
            <<UseCase>>
            +execute(reportId) void
        }
        class RunMonitoringUseCase {
            <<UseCase>>
            +execute(trigger: RunTrigger) MonitoringOutcome
        }
        class AcknowledgeAlertUseCase {
            <<UseCase>>
            +execute(alertId, user) void
        }
        class ProjectMetricUseCase {
            <<UseCase>>
            +execute(evt: CloudEvent) void
        }
        class McpToolHandlers {
            <<UseCase>>
            +get_platform_kpis()
            +get_registration_stats()
            +list_events()
            +get_credit_stats()
            +get_content_stats()
            +list_flagged_content()
            +list_failed_sagas()
            +get_service_health()
            +detect_anomalies()
            +generate_report()
            +raise_alert()
        }
    }
    namespace ports {
        class LlmPort {
            <<Port>>
            +chat(messages, tools, model) LlmResponse
        }
        class TtsPort {
            <<Port>>
            +synthesize(text, locale) AudioStream
        }
        class McpClientPort {
            <<Port>>
            +callTool(name, args) ToolResult
        }
        class InternalApisPort {
            <<Port>>
            +registrationStats(range)
            +creditStats(range)
            +contentStats(range)
            +flagged()
            +failedSagas(since)
            +health()
        }
        class AnomalyDetector {
            <<Port>>
            +detect(series: MetricPoint[]) Anomaly[]
        }
        class InsightsRepository {
            <<Port>>
        }
        class AudioStorage {
            <<Port>>
            +put(key, stream) void
            +presignGet(key, ttl) string
        }
        class EventPublisher {
            <<Port>>
        }
    }
    namespace interface_adapters {
        class InsightsController {
            <<Adapter>>
        }
        class McpServerAdapter {
            <<Adapter>>
        }
        class MonitoringCron {
            <<Adapter>>
        }
        class AnalyticsConsumer {
            <<Adapter>>
        }
        class ClaudeAdapter {
            <<Gateway>>
        }
        class OllamaAdapter {
            <<Gateway>>
        }
        class PollyAdapter {
            <<Gateway>>
        }
        class PiperAdapter {
            <<Gateway>>
        }
        class OnnxIsolationForest {
            <<Gateway>>
        }
        class DynamoInsightsRepository {
            <<Gateway>>
        }
    }

    AgentRun *-- AgentStep
    AgentRun "1" --> "0..1" GeneratedReport
    AgentRun "1" --> "*" Alert
    RunReportAgentUseCase ..> LlmPort
    RunReportAgentUseCase ..> McpClientPort
    RunReportAgentUseCase ..> TtsPort
    RunMonitoringUseCase ..> McpClientPort
    RunMonitoringUseCase ..> AnomalyDetector
    McpServerAdapter ..> McpToolHandlers
    McpToolHandlers ..> InternalApisPort
    MonitoringCron ..> RunMonitoringUseCase
    AnalyticsConsumer ..> ProjectMetricUseCase
    ClaudeAdapter ..|> LlmPort
    OllamaAdapter ..|> LlmPort
    PollyAdapter ..|> TtsPort
    PiperAdapter ..|> TtsPort
    OnnxIsolationForest ..|> AnomalyDetector
    DynamoInsightsRepository ..|> InsightsRepository
```

Los agentes son **clientes MCP** del propio servidor (`McpClientPort` → `/mcp` con token de
servicio): ven exactamente las mismas herramientas que un cliente externo (UC-22).
Eventos publicados: `bandada.insights.alert.raised.v1`, `bandada.insights.report.ready.v1`.

## 2. Modelo persistente (`bandada-insights`)

Diseño normativo en `agentes-y-reportes-generativos.md` §7; resumen:

| Ítem | `pk` | `sk` | `gsi1pk` / `gsi1sk` (propuesta P-1) | TTL |
|---|---|---|---|---|
| Reporte | `REPORT#<id>` | `META` | `REPORT` / `<createdAt>#<id>` | — |
| Ejecución de agente | `AGENTRUN#<id>` | `META` | `AGENTRUN` / `<startedAt>#<id>` | 30 días |
| Paso de agente | `AGENTRUN#<id>` | `STEP#<0001>` | — | 30 días |
| Alerta | `ALERT#<id>` | `META` | `ALERT#<status>` / `<lastSeenAt>#<id>` | — |
| Huella de alerta (dedupe) | `ALERTFP#<fingerprint>` | `META` | — | ventana de dedupe |
| Métrica diaria | `METRIC#<name>` | `<yyyy-mm-dd>` | — | — |
| Inbox | `INBOX#<messageId>` | `META` | — | 14 días |
| Outbox | `OUTBOX#<id>` | `META` | `OUTBOX#PENDING` / `<createdAt>#<id>` | — |

Patrones de acceso:

| Acceso | Operación |
|---|---|
| `getReport` / `getAgentRun` | `GetItem` (+ `Query pk=AGENTRUN#id begins_with STEP#` para pasos) |
| `reports(after)`, `agentRuns(after)` | `Query GSI1 gsi1pk=REPORT` / `AGENTRUN`, descendente |
| `alerts(status)` | `Query GSI1 gsi1pk=ALERT#OPEN` |
| Proyección de métricas | `TransactWriteItems`: Put `INBOX#` (cond.) + `Update METRIC#<name>/<día> ADD value :n` |
| Serie para anomalías | `Query pk=METRIC#<name> AND sk BETWEEN :from AND :to` |

S3 `bandada-reports`: `reports/<reportId>.mp3` (resumen ≤ 90 s), servido por URL prefirmada.
