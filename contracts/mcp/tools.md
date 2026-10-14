# Servidor MCP — Bandada U (`insights-service`)

> Contrato de las herramientas, recursos y prompts MCP (D8, D9, RF-26, UC-22).
> Versión **1.1.0** (2026-10-14). Los mismos esquemas en formato máquina están en
> [`tools.schema.json`](tools.schema.json) — ambos archivos deben mantenerse idénticos
> (CI compara nombres y esquemas). Endpoint HTTP documentado en
> [`../openapi/insights-service.yaml`](../openapi/insights-service.yaml) (`/mcp`).

## 1. Servidor

| Aspecto | Valor |
|---|---|
| Implementación | `insights-service` (NestJS 11) con el SDK oficial `@modelcontextprotocol/sdk` (`McpServer` + `StreamableHTTPServerTransport`) |
| Transporte | **Streamable HTTP** en `/mcp` (`POST` JSON-RPC, `GET` stream SSE opcional, `DELETE` fin de sesión). Sesiones con cabecera `Mcp-Session-Id`. |
| URL | dev `http://api.bandada.localhost/mcp` · prod `https://api.bandadau.com/mcp` (Traefik → `insights-service:7008`) |
| `serverInfo` | `{ "name": "bandada-insights", "version": "1.0.0" }` |
| Versión de protocolo | La negociada en `initialize` (la más reciente soportada por el SDK instalado; se verifica en la documentación oficial al implementar). |
| Capabilities | `tools: { listChanged: false }`, `resources: { subscribe: true, listChanged: false }`, `prompts: { listChanged: false }`, `logging: {}` |
| Idioma | Descripciones de herramientas en español; los datos devueltos usan identificadores en inglés. |

### Autenticación y autorización

- Cabecera `Authorization: Bearer <JWT>` emitido por `identity-service` (verificado contra
  `/.well-known/jwks.json`). Se aceptan dos tipos de token: el **token MCP** (`typ=mcp`,
  `aud=mcp`, scope `mcp:tools`, rol `ADMIN`) y el **token de servicio** (`typ=service`). Si falta, es
  inválido, expiró o fue revocado → HTTP `401` (con `WWW-Authenticate: Bearer`); si no tiene el rol
  o el scope → `403`. Un access token de usuario de 15 min (`aud` de la app o del panel) **no** se
  acepta en `/mcp`.
- Los agentes internos (`MonitoringAgent`, `ReportAgent`) usan un **token de servicio**
  (`typ=service`, `sub=insights-service`, obtenido con `POST /api/v1/auth/service-token`).
- `raise_alert` solo se lista y se acepta con token de servicio.
- Las herramientas llaman a los servicios fuente (`/internal/v1/**`) con el token de servicio
  propio de insights; propagan `X-Correlation-Id` y `traceparent`.
- **Clientes externos** (Claude Desktop / Claude Code, UC-22; D9/D15, ADR-0016): el administrador
  emite un **token MCP de 8 h** desde el panel (*Configuración → Acceso MCP*, mutación GraphQL
  `createMcpToken` → identity `POST /api/v1/auth/mcp-tokens`, `createMcpToken`). Es un JWT RS256 con
  `aud=mcp`, scope `mcp:tools` y `jti` registrado; se muestra **una sola vez**, no tiene refresh y se
  revoca con `revokeMcpToken` (`DELETE /api/v1/auth/mcp-tokens/{tokenId}`). Las ejecuciones de estos
  clientes quedan como `AgentRun` con `agent = EXTERNAL_MCP`. Ver §5.
  *(La descubierta OAuth `/.well-known/oauth-protected-resource` queda fuera de alcance v1.)*

### Guardarraíles (D8)

- Herramientas de **solo lectura por defecto**; las de escritura (`generate_report`, `raise_alert`)
  llevan `readOnlyHint: false`.
- Los agentes internos tienen límite de **8 pasos** y de tokens por ejecución; cada llamada queda
  en `AgentRun.steps`.
- Datos **agregados**: ninguna herramienta devuelve correos, nombres ni texto de posts; los usuarios
  aparecen solo por UUID.
- Rangos de fechas máximos de 366 días; listas con `limit` acotado.
- Rate-limit: 60 llamadas/min por token.

### Resultado de las herramientas

Cada `tools/call` devuelve `structuredContent` (conforme a `outputSchema`) y, por compatibilidad,
un bloque `content` de tipo `text` con el mismo JSON serializado. Los errores de negocio o de los
servicios fuente se devuelven como resultado con `isError: true` y un texto explicativo en español
(no como error JSON-RPC), para que el modelo pueda corregir la llamada. Los argumentos inválidos
contra `inputSchema` producen error JSON-RPC `-32602`.

## 2. Herramientas

| Herramienta | Tipo | Fuente |
|---|---|---|
| `get_platform_kpis` | lectura | insights-service (proyección de métricas `METRIC#<name>` en DynamoDB) — `GET /internal/v1/kpis` |
| `get_registration_stats` | lectura | events-service — `GET /internal/v1/stats/registrations?from&to&groupBy` (`getRegistrationStats`) |
| `list_events` | lectura | events-service — `GET /internal/v1/events?startsFrom&startsTo&status` (`listEventsInternal`, D15) |
| `get_credit_stats` | lectura | wallet-service — `GET /internal/v1/stats/credits?from&to&groupBy` (`getCreditStats`) |
| `get_content_stats` | lectura | social-service — `GET /internal/v1/stats/daily?from&to` |
| `list_flagged_content` | lectura | media-service — `GET /internal/v1/media?status=FLAGGED` (`listFlaggedMedia`) + social-service — `GET /internal/v1/posts?status=HIDDEN` y `GET /internal/v1/reports?status=OPEN` |
| `list_failed_sagas` | lectura | events-service — `GET /internal/v1/sagas?status&since` (`listSagas`) |
| `get_service_health` | lectura | insights-service — `GET /internal/v1/service-health`, que agrega `/health/ready` de cada servicio y la API de management de RabbitMQ (`/api/queues`) |
| `query_metrics` | lectura | Prometheus (stack LGTM) — `GET /api/v1/query` / `query_range` con PromQL acotado a una allowlist de métricas técnicas (D15); solo token de servicio o `ADMIN` |
| `detect_anomalies` | lectura | insights-service — modelo `anomaly-detector` (Isolation Forest ONNX) sobre `METRIC#<name>`; sin llamada externa |
| `generate_report` | escritura | insights-service — caso de uso interno `GenerateReport` (DynamoDB `REPORT#<id>`, TTS vía `TtsPort`, audio en S3); publica `bandada.insights.report.ready.v1` |
| `raise_alert` | escritura (solo agentes internos) | insights-service — caso de uso interno `RaiseAlert` (DynamoDB `ALERT#<id>`); publica `bandada.insights.alert.raised.v1` |

### `get_platform_kpis` — KPIs de la plataforma

**Descripción (la que ve el LLM):**

> Devuelve los indicadores agregados de Bandada U en un rango de fechas: usuarios activos y nuevos, posts, comentarios, reacciones, inscripciones (confirmadas/fallidas/canceladas), créditos recargados y gastados, contenido marcado y alertas abiertas, más una serie diaria. Úsala como primer paso para cualquier pregunta general sobre actividad o crecimiento. Los datos son agregados, sin información personal.

- **Servicio fuente / endpoint:** insights-service (proyección de métricas `METRIC#<name>` en DynamoDB) — `GET /internal/v1/kpis`
- **Permisos:** Rol `ADMIN` o token de servicio.
- **Solo lectura:** sí · **Annotations:** `readOnlyHint: true`, `destructiveHint: false`, `idempotentHint: true`, `openWorldHint: false`

**inputSchema**

```json
{
  "type": "object",
  "properties": {
    "from": {
      "type": "string",
      "format": "date",
      "description": "Fecha inicial inclusiva (UTC), formato YYYY-MM-DD."
    },
    "to": {
      "type": "string",
      "format": "date",
      "description": "Fecha final inclusiva (UTC), formato YYYY-MM-DD. Máximo 366 días después de `from`."
    }
  },
  "required": [
    "from",
    "to"
  ],
  "additionalProperties": false
}
```

**outputSchema**

```json
{
  "type": "object",
  "properties": {
    "from": {
      "type": "string",
      "format": "date"
    },
    "to": {
      "type": "string",
      "format": "date"
    },
    "activeUsers": {
      "type": "integer"
    },
    "newUsers": {
      "type": "integer"
    },
    "posts": {
      "type": "integer"
    },
    "comments": {
      "type": "integer"
    },
    "reactions": {
      "type": "integer"
    },
    "registrationsConfirmed": {
      "type": "integer"
    },
    "registrationsFailed": {
      "type": "integer"
    },
    "registrationsCancelled": {
      "type": "integer"
    },
    "creditsToppedUp": {
      "type": "integer"
    },
    "creditsSpent": {
      "type": "integer"
    },
    "flaggedContent": {
      "type": "integer"
    },
    "openAlerts": {
      "type": "integer"
    },
    "series": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "date": {
            "type": "string",
            "format": "date"
          },
          "activeUsers": {
            "type": "integer"
          },
          "posts": {
            "type": "integer"
          },
          "registrationsConfirmed": {
            "type": "integer"
          },
          "creditsSpent": {
            "type": "integer"
          }
        },
        "required": [
          "date"
        ],
        "additionalProperties": false
      }
    }
  },
  "required": [
    "from",
    "to",
    "activeUsers",
    "newUsers",
    "posts",
    "registrationsConfirmed",
    "creditsSpent",
    "series"
  ],
  "additionalProperties": false
}
```

**Ejemplo — llamada**

```json
{
  "jsonrpc": "2.0",
  "id": 7,
  "method": "tools/call",
  "params": {
    "name": "get_platform_kpis",
    "arguments": {
      "from": "2026-10-07",
      "to": "2026-10-13"
    }
  }
}
```

**Ejemplo — respuesta**

```json
{
  "jsonrpc": "2.0",
  "id": 7,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\"from\": \"2026-10-07\", \"to\": \"2026-10-13\", \"activeUsers\": 1840, \"newUsers\": 212, \"posts\": 965, \"comments\": 3120, \"reactions\": 10450, \"registrationsConfirmed\": 318, \"registrationsFailed\": 14, \"registrationsCancelled\": 9, \"creditsToppedUp\": 2650, \"creditsSpent\": 1770, \"flaggedContent\": 23, \"openAlerts\": 1, \"series\": [{\"date\": \"2026-10-07\", \"activeUsers\": 1210, \"posts\": 140, \"registrationsConfirmed\": 41, \"creditsSpent\": 210}]}"
      }
    ],
    "structuredContent": {
      "from": "2026-10-07",
      "to": "2026-10-13",
      "activeUsers": 1840,
      "newUsers": 212,
      "posts": 965,
      "comments": 3120,
      "reactions": 10450,
      "registrationsConfirmed": 318,
      "registrationsFailed": 14,
      "registrationsCancelled": 9,
      "creditsToppedUp": 2650,
      "creditsSpent": 1770,
      "flaggedContent": 23,
      "openAlerts": 1,
      "series": [
        {
          "date": "2026-10-07",
          "activeUsers": 1210,
          "posts": 140,
          "registrationsConfirmed": 41,
          "creditsSpent": 210
        }
      ]
    },
    "isError": false
  }
}
```

### `get_registration_stats` — Estadísticas de inscripciones

**Descripción (la que ve el LLM):**

> Devuelve estadísticas de inscripciones a eventos en un rango, agrupadas por día, por evento o por estado (PENDING, CONFIRMED, FAILED, CANCELLATION_PENDING, CANCELLED). Úsala para preguntas sobre demanda de eventos, tasas de fallo de inscripción o comparación entre eventos.

- **Servicio fuente / endpoint:** events-service — `GET /internal/v1/stats/registrations?from&to&groupBy` (`getRegistrationStats`)
- **Permisos:** Rol `ADMIN` o token de servicio.
- **Solo lectura:** sí · **Annotations:** `readOnlyHint: true`, `destructiveHint: false`, `idempotentHint: true`, `openWorldHint: false`

**inputSchema**

```json
{
  "type": "object",
  "properties": {
    "from": {
      "type": "string",
      "format": "date",
      "description": "Fecha inicial inclusiva (UTC), formato YYYY-MM-DD."
    },
    "to": {
      "type": "string",
      "format": "date",
      "description": "Fecha final inclusiva (UTC), formato YYYY-MM-DD. Máximo 366 días después de `from`."
    },
    "groupBy": {
      "type": "string",
      "enum": [
        "day",
        "event",
        "status"
      ],
      "default": "day",
      "description": "Dimensión de agrupación."
    },
    "eventId": {
      "type": "string",
      "format": "uuid",
      "description": "Opcional: limitar a un evento."
    }
  },
  "required": [
    "from",
    "to"
  ],
  "additionalProperties": false
}
```

**outputSchema**

```json
{
  "type": "object",
  "properties": {
    "from": {
      "type": "string",
      "format": "date"
    },
    "to": {
      "type": "string",
      "format": "date"
    },
    "groupBy": {
      "type": "string",
      "enum": [
        "day",
        "event",
        "status"
      ]
    },
    "rows": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "key": {
            "type": "string",
            "description": "Fecha, eventId o estado según groupBy."
          },
          "label": {
            "type": "string",
            "description": "Título del evento cuando groupBy=event."
          },
          "confirmed": {
            "type": "integer"
          },
          "failed": {
            "type": "integer"
          },
          "cancelled": {
            "type": "integer"
          },
          "pending": {
            "type": "integer"
          }
        },
        "required": [
          "key",
          "confirmed",
          "failed",
          "cancelled"
        ],
        "additionalProperties": false
      }
    },
    "totals": {
      "type": "object",
      "properties": {
        "confirmed": {
          "type": "integer"
        },
        "failed": {
          "type": "integer"
        },
        "cancelled": {
          "type": "integer"
        },
        "pending": {
          "type": "integer"
        }
      },
      "required": [
        "confirmed",
        "failed",
        "cancelled",
        "pending"
      ],
      "additionalProperties": false
    }
  },
  "required": [
    "from",
    "to",
    "groupBy",
    "rows",
    "totals"
  ],
  "additionalProperties": false
}
```

**Ejemplo — llamada**

```json
{
  "jsonrpc": "2.0",
  "id": 7,
  "method": "tools/call",
  "params": {
    "name": "get_registration_stats",
    "arguments": {
      "from": "2026-09-01",
      "to": "2026-09-30",
      "groupBy": "event"
    }
  }
}
```

**Ejemplo — respuesta**

```json
{
  "jsonrpc": "2.0",
  "id": 7,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\"from\": \"2026-09-01\", \"to\": \"2026-09-30\", \"groupBy\": \"event\", \"rows\": [{\"key\": \"0192a3be-1234-7abc-8def-000000000042\", \"label\": \"Taller de Docker para principiantes\", \"confirmed\": 78, \"failed\": 3, \"cancelled\": 4, \"pending\": 0}], \"totals\": {\"confirmed\": 1284, \"failed\": 41, \"cancelled\": 37, \"pending\": 2}}"
      }
    ],
    "structuredContent": {
      "from": "2026-09-01",
      "to": "2026-09-30",
      "groupBy": "event",
      "rows": [
        {
          "key": "0192a3be-1234-7abc-8def-000000000042",
          "label": "Taller de Docker para principiantes",
          "confirmed": 78,
          "failed": 3,
          "cancelled": 4,
          "pending": 0
        }
      ],
      "totals": {
        "confirmed": 1284,
        "failed": 41,
        "cancelled": 37,
        "pending": 2
      }
    },
    "isError": false
  }
}
```

### `list_events` — Listar eventos

**Descripción (la que ve el LLM):**

> Lista eventos y talleres de la plataforma en un rango de fechas de inicio, opcionalmente filtrados por estado (DRAFT, PUBLISHED, CANCELLED, FINISHED). Devuelve título, fecha, lugar, cupo, plazas ocupadas y precio en créditos. Úsala para contextualizar estadísticas de inscripciones o responder qué eventos hubo o habrá.

- **Servicio fuente / endpoint:** events-service — `GET /internal/v1/events?startsFrom&startsTo&status` (`listEventsInternal`, D15)
- **Permisos:** Rol `ADMIN` o token de servicio.
- **Solo lectura:** sí · **Annotations:** `readOnlyHint: true`, `destructiveHint: false`, `idempotentHint: true`, `openWorldHint: false`

**inputSchema**

```json
{
  "type": "object",
  "properties": {
    "from": {
      "type": "string",
      "format": "date-time",
      "description": "Inicio del rango (startsAt ≥ from)."
    },
    "to": {
      "type": "string",
      "format": "date-time",
      "description": "Fin del rango (startsAt ≤ to)."
    },
    "status": {
      "type": "string",
      "enum": [
        "DRAFT",
        "PUBLISHED",
        "CANCELLED",
        "FINISHED"
      ]
    },
    "limit": {
      "type": "integer",
      "minimum": 1,
      "maximum": 50,
      "default": 50
    }
  },
  "required": [
    "from",
    "to"
  ],
  "additionalProperties": false
}
```

**outputSchema**

```json
{
  "type": "object",
  "properties": {
    "items": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "eventId": {
            "type": "string",
            "format": "uuid"
          },
          "title": {
            "type": "string"
          },
          "startsAt": {
            "type": "string",
            "format": "date-time"
          },
          "venue": {
            "type": "string"
          },
          "capacity": {
            "type": "integer"
          },
          "seatsTaken": {
            "type": "integer"
          },
          "priceCredits": {
            "type": "integer"
          },
          "status": {
            "type": "string",
            "enum": [
              "DRAFT",
              "PUBLISHED",
              "CANCELLED",
              "FINISHED"
            ]
          }
        },
        "required": [
          "eventId",
          "title",
          "startsAt",
          "venue",
          "capacity",
          "seatsTaken",
          "priceCredits",
          "status"
        ],
        "additionalProperties": false
      }
    },
    "truncated": {
      "type": "boolean",
      "description": "true si había más eventos que `limit`."
    }
  },
  "required": [
    "items",
    "truncated"
  ],
  "additionalProperties": false
}
```

**Ejemplo — llamada**

```json
{
  "jsonrpc": "2.0",
  "id": 7,
  "method": "tools/call",
  "params": {
    "name": "list_events",
    "arguments": {
      "from": "2026-10-01T00:00:00Z",
      "to": "2026-10-31T23:59:59Z",
      "status": "PUBLISHED"
    }
  }
}
```

**Ejemplo — respuesta**

```json
{
  "jsonrpc": "2.0",
  "id": 7,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\"items\": [{\"eventId\": \"0192a3be-1234-7abc-8def-000000000042\", \"title\": \"Taller de Docker para principiantes\", \"startsAt\": \"2026-10-20T22:00:00Z\", \"venue\": \"Auditorio de la Facultad de Tecnología, UMSA\", \"capacity\": 80, \"seatsTaken\": 54, \"priceCredits\": 15, \"status\": \"PUBLISHED\"}], \"truncated\": false}"
      }
    ],
    "structuredContent": {
      "items": [
        {
          "eventId": "0192a3be-1234-7abc-8def-000000000042",
          "title": "Taller de Docker para principiantes",
          "startsAt": "2026-10-20T22:00:00Z",
          "venue": "Auditorio de la Facultad de Tecnología, UMSA",
          "capacity": 80,
          "seatsTaken": 54,
          "priceCredits": 15,
          "status": "PUBLISHED"
        }
      ],
      "truncated": false
    },
    "isError": false
  }
}
```

### `get_credit_stats` — Estadísticas de créditos

**Descripción (la que ve el LLM):**

> Devuelve totales y series de la economía de créditos en un rango: recargas, débitos por inscripciones y reembolsos (cantidad y créditos), saldo neto y créditos en circulación. Los créditos son enteros. Úsala para preguntas de ingresos, consumo o reembolsos.

- **Servicio fuente / endpoint:** wallet-service — `GET /internal/v1/stats/credits?from&to&groupBy` (`getCreditStats`)
- **Permisos:** Rol `ADMIN` o token de servicio.
- **Solo lectura:** sí · **Annotations:** `readOnlyHint: true`, `destructiveHint: false`, `idempotentHint: true`, `openWorldHint: false`

**inputSchema**

```json
{
  "type": "object",
  "properties": {
    "from": {
      "type": "string",
      "format": "date",
      "description": "Fecha inicial inclusiva (UTC), formato YYYY-MM-DD."
    },
    "to": {
      "type": "string",
      "format": "date",
      "description": "Fecha final inclusiva (UTC), formato YYYY-MM-DD. Máximo 366 días después de `from`."
    },
    "groupBy": {
      "type": "string",
      "enum": [
        "day",
        "week",
        "month"
      ],
      "default": "day"
    }
  },
  "required": [
    "from",
    "to"
  ],
  "additionalProperties": false
}
```

**outputSchema**

```json
{
  "type": "object",
  "properties": {
    "from": {
      "type": "string",
      "format": "date"
    },
    "to": {
      "type": "string",
      "format": "date"
    },
    "groupBy": {
      "type": "string",
      "enum": [
        "day",
        "week",
        "month"
      ]
    },
    "totals": {
      "type": "object",
      "properties": {
        "topUpCount": {
          "type": "integer"
        },
        "topUpCredits": {
          "type": "integer"
        },
        "debitCount": {
          "type": "integer"
        },
        "debitCredits": {
          "type": "integer"
        },
        "refundCount": {
          "type": "integer"
        },
        "refundCredits": {
          "type": "integer"
        },
        "netCredits": {
          "type": "integer"
        },
        "circulatingCredits": {
          "type": "integer"
        }
      },
      "required": [
        "topUpCount",
        "topUpCredits",
        "debitCount",
        "debitCredits",
        "refundCount",
        "refundCredits",
        "netCredits"
      ],
      "additionalProperties": false
    },
    "series": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "date": {
            "type": "string",
            "format": "date"
          },
          "topUpCredits": {
            "type": "integer"
          },
          "debitCredits": {
            "type": "integer"
          },
          "refundCredits": {
            "type": "integer"
          }
        },
        "required": [
          "date",
          "topUpCredits",
          "debitCredits",
          "refundCredits"
        ],
        "additionalProperties": false
      }
    }
  },
  "required": [
    "from",
    "to",
    "groupBy",
    "totals",
    "series"
  ],
  "additionalProperties": false
}
```

**Ejemplo — llamada**

```json
{
  "jsonrpc": "2.0",
  "id": 7,
  "method": "tools/call",
  "params": {
    "name": "get_credit_stats",
    "arguments": {
      "from": "2026-10-07",
      "to": "2026-10-13"
    }
  }
}
```

**Ejemplo — respuesta**

```json
{
  "jsonrpc": "2.0",
  "id": 7,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\"from\": \"2026-10-07\", \"to\": \"2026-10-13\", \"groupBy\": \"day\", \"totals\": {\"topUpCount\": 42, \"topUpCredits\": 2650, \"debitCount\": 118, \"debitCredits\": 1770, \"refundCount\": 9, \"refundCredits\": 135, \"netCredits\": 1015, \"circulatingCredits\": 12480}, \"series\": [{\"date\": \"2026-10-07\", \"topUpCredits\": 300, \"debitCredits\": 210, \"refundCredits\": 15}]}"
      }
    ],
    "structuredContent": {
      "from": "2026-10-07",
      "to": "2026-10-13",
      "groupBy": "day",
      "totals": {
        "topUpCount": 42,
        "topUpCredits": 2650,
        "debitCount": 118,
        "debitCredits": 1770,
        "refundCount": 9,
        "refundCredits": 135,
        "netCredits": 1015,
        "circulatingCredits": 12480
      },
      "series": [
        {
          "date": "2026-10-07",
          "topUpCredits": 300,
          "debitCredits": 210,
          "refundCredits": 15
        }
      ]
    },
    "isError": false
  }
}
```

### `get_content_stats` — Estadísticas de contenido

**Descripción (la que ve el LLM):**

> Devuelve la actividad de contenido social en un rango: posts, comentarios y reacciones por día, reparto de reacciones por tipo y los hashtags más usados. Úsala para preguntas sobre engagement o temas populares. No devuelve el texto de los posts.

- **Servicio fuente / endpoint:** social-service — `GET /internal/v1/stats/daily?from&to`
- **Permisos:** Rol `ADMIN` o token de servicio.
- **Solo lectura:** sí · **Annotations:** `readOnlyHint: true`, `destructiveHint: false`, `idempotentHint: true`, `openWorldHint: false`

**inputSchema**

```json
{
  "type": "object",
  "properties": {
    "from": {
      "type": "string",
      "format": "date",
      "description": "Fecha inicial inclusiva (UTC), formato YYYY-MM-DD."
    },
    "to": {
      "type": "string",
      "format": "date",
      "description": "Fecha final inclusiva (UTC), formato YYYY-MM-DD. Máximo 366 días después de `from`."
    },
    "topHashtags": {
      "type": "integer",
      "minimum": 1,
      "maximum": 50,
      "default": 10
    }
  },
  "required": [
    "from",
    "to"
  ],
  "additionalProperties": false
}
```

**outputSchema**

```json
{
  "type": "object",
  "properties": {
    "from": {
      "type": "string",
      "format": "date"
    },
    "to": {
      "type": "string",
      "format": "date"
    },
    "totals": {
      "type": "object",
      "properties": {
        "posts": {
          "type": "integer"
        },
        "comments": {
          "type": "integer"
        },
        "reactions": {
          "type": "integer"
        }
      },
      "required": [
        "posts",
        "comments",
        "reactions"
      ],
      "additionalProperties": false
    },
    "reactionsByType": {
      "type": "object",
      "properties": {
        "LIKE": {
          "type": "integer"
        },
        "HELPFUL": {
          "type": "integer"
        },
        "FUNNY": {
          "type": "integer"
        },
        "SUPPORT": {
          "type": "integer"
        }
      },
      "required": [
        "LIKE",
        "HELPFUL",
        "FUNNY",
        "SUPPORT"
      ],
      "additionalProperties": false
    },
    "daily": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "date": {
            "type": "string",
            "format": "date"
          },
          "posts": {
            "type": "integer"
          },
          "comments": {
            "type": "integer"
          },
          "reactions": {
            "type": "integer"
          }
        },
        "required": [
          "date",
          "posts",
          "comments",
          "reactions"
        ],
        "additionalProperties": false
      }
    },
    "topHashtags": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "hashtag": {
            "type": "string"
          },
          "count": {
            "type": "integer"
          }
        },
        "required": [
          "hashtag",
          "count"
        ],
        "additionalProperties": false
      }
    }
  },
  "required": [
    "from",
    "to",
    "totals",
    "reactionsByType",
    "daily",
    "topHashtags"
  ],
  "additionalProperties": false
}
```

**Ejemplo — llamada**

```json
{
  "jsonrpc": "2.0",
  "id": 7,
  "method": "tools/call",
  "params": {
    "name": "get_content_stats",
    "arguments": {
      "from": "2026-10-07",
      "to": "2026-10-13",
      "topHashtags": 3
    }
  }
}
```

**Ejemplo — respuesta**

```json
{
  "jsonrpc": "2.0",
  "id": 7,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\"from\": \"2026-10-07\", \"to\": \"2026-10-13\", \"totals\": {\"posts\": 965, \"comments\": 3120, \"reactions\": 10450}, \"reactionsByType\": {\"LIKE\": 6200, \"HELPFUL\": 2900, \"FUNNY\": 900, \"SUPPORT\": 450}, \"daily\": [{\"date\": \"2026-10-07\", \"posts\": 140, \"comments\": 480, \"reactions\": 1500}], \"topHashtags\": [{\"hashtag\": \"parciales\", \"count\": 212}, {\"hashtag\": \"fcpn\", \"count\": 140}, {\"hashtag\": \"docker\", \"count\": 77}]}"
      }
    ],
    "structuredContent": {
      "from": "2026-10-07",
      "to": "2026-10-13",
      "totals": {
        "posts": 965,
        "comments": 3120,
        "reactions": 10450
      },
      "reactionsByType": {
        "LIKE": 6200,
        "HELPFUL": 2900,
        "FUNNY": 900,
        "SUPPORT": 450
      },
      "daily": [
        {
          "date": "2026-10-07",
          "posts": 140,
          "comments": 480,
          "reactions": 1500
        }
      ],
      "topHashtags": [
        {
          "hashtag": "parciales",
          "count": 212
        },
        {
          "hashtag": "fcpn",
          "count": 140
        },
        {
          "hashtag": "docker",
          "count": 77
        }
      ]
    },
    "isError": false
  }
}
```

### `list_flagged_content` — Cola de moderación

**Descripción (la que ve el LLM):**

> Lista el contenido pendiente de moderación: medios marcados por el modelo de IA (FLAGGED) y posts ocultos por denuncias, con puntajes y antigüedad. Úsala para medir el backlog de moderación o detectar autores reincidentes. Los autores se identifican solo por id.

- **Servicio fuente / endpoint:** media-service — `GET /internal/v1/media?status=FLAGGED` (`listFlaggedMedia`) + social-service — `GET /internal/v1/posts?status=HIDDEN` y `GET /internal/v1/reports?status=OPEN`
- **Permisos:** Rol `ADMIN` o token de servicio.
- **Solo lectura:** sí · **Annotations:** `readOnlyHint: true`, `destructiveHint: false`, `idempotentHint: true`, `openWorldHint: false`

**inputSchema**

```json
{
  "type": "object",
  "properties": {
    "source": {
      "type": "string",
      "enum": [
        "AI",
        "REPORTS",
        "ALL"
      ],
      "default": "ALL"
    },
    "limit": {
      "type": "integer",
      "minimum": 1,
      "maximum": 100,
      "default": 50
    }
  },
  "required": [],
  "additionalProperties": false
}
```

**outputSchema**

```json
{
  "type": "object",
  "properties": {
    "totalPending": {
      "type": "integer"
    },
    "oldestEnqueuedAt": {
      "type": [
        "string",
        "null"
      ],
      "format": "date-time"
    },
    "items": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "id": {
            "type": "string",
            "format": "uuid"
          },
          "source": {
            "type": "string",
            "enum": [
              "AI",
              "REPORTS"
            ]
          },
          "kind": {
            "type": "string",
            "enum": [
              "IMAGE",
              "VIDEO",
              "POST"
            ]
          },
          "authorId": {
            "type": "string",
            "format": "uuid"
          },
          "maxScore": {
            "type": [
              "number",
              "null"
            ]
          },
          "labels": {
            "type": "array",
            "items": {
              "type": "string"
            }
          },
          "openReports": {
            "type": "integer"
          },
          "enqueuedAt": {
            "type": "string",
            "format": "date-time"
          }
        },
        "required": [
          "id",
          "source",
          "kind",
          "authorId",
          "enqueuedAt"
        ],
        "additionalProperties": false
      }
    }
  },
  "required": [
    "totalPending",
    "oldestEnqueuedAt",
    "items"
  ],
  "additionalProperties": false
}
```

**Ejemplo — llamada**

```json
{
  "jsonrpc": "2.0",
  "id": 7,
  "method": "tools/call",
  "params": {
    "name": "list_flagged_content",
    "arguments": {
      "source": "ALL",
      "limit": 2
    }
  }
}
```

**Ejemplo — respuesta**

```json
{
  "jsonrpc": "2.0",
  "id": 7,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\"totalPending\": 23, \"oldestEnqueuedAt\": \"2026-10-13T09:12:00Z\", \"items\": [{\"id\": \"0192a3a2-0000-7000-8000-000000000654\", \"source\": \"AI\", \"kind\": \"IMAGE\", \"authorId\": \"0192a3b4-5c6d-7e8f-9a0b-1c2d3e4f5a6b\", \"maxScore\": 0.71, \"labels\": [\"nsfw\"], \"openReports\": 0, \"enqueuedAt\": \"2026-10-14T13:58:00Z\"}]}"
      }
    ],
    "structuredContent": {
      "totalPending": 23,
      "oldestEnqueuedAt": "2026-10-13T09:12:00Z",
      "items": [
        {
          "id": "0192a3a2-0000-7000-8000-000000000654",
          "source": "AI",
          "kind": "IMAGE",
          "authorId": "0192a3b4-5c6d-7e8f-9a0b-1c2d3e4f5a6b",
          "maxScore": 0.71,
          "labels": [
            "nsfw"
          ],
          "openReports": 0,
          "enqueuedAt": "2026-10-14T13:58:00Z"
        }
      ]
    },
    "isError": false
  }
}
```

### `list_failed_sagas` — SAGAs fallidas o compensadas

**Descripción (la que ve el LLM):**

> Lista las SAGAs de inscripción/cancelación que terminaron en FAILED o COMPENSATED desde una fecha, con el paso donde fallaron y el motivo. Úsala para diagnosticar problemas en wallet-service o ticketing-service.

- **Servicio fuente / endpoint:** events-service — `GET /internal/v1/sagas?status&since` (`listSagas`)
- **Permisos:** Rol `ADMIN` o token de servicio.
- **Solo lectura:** sí · **Annotations:** `readOnlyHint: true`, `destructiveHint: false`, `idempotentHint: true`, `openWorldHint: false`

**inputSchema**

```json
{
  "type": "object",
  "properties": {
    "status": {
      "type": "string",
      "enum": [
        "FAILED",
        "COMPENSATED"
      ],
      "description": "Omitir para ambos."
    },
    "since": {
      "type": "string",
      "format": "date-time",
      "description": "Desde cuándo (por defecto, últimas 24 h)."
    },
    "limit": {
      "type": "integer",
      "minimum": 1,
      "maximum": 200,
      "default": 50
    }
  },
  "required": [],
  "additionalProperties": false
}
```

**outputSchema**

```json
{
  "type": "object",
  "properties": {
    "count": {
      "type": "integer"
    },
    "byFailureReason": {
      "type": "object",
      "additionalProperties": {
        "type": "integer"
      }
    },
    "items": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "sagaId": {
            "type": "string",
            "format": "uuid"
          },
          "registrationId": {
            "type": "string",
            "format": "uuid"
          },
          "eventId": {
            "type": "string",
            "format": "uuid"
          },
          "type": {
            "type": "string",
            "enum": [
              "REGISTRATION",
              "CANCELLATION"
            ]
          },
          "status": {
            "type": "string",
            "enum": [
              "FAILED",
              "COMPENSATED"
            ]
          },
          "failedStep": {
            "type": "string"
          },
          "failureReason": {
            "type": "string"
          },
          "updatedAt": {
            "type": "string",
            "format": "date-time"
          }
        },
        "required": [
          "sagaId",
          "registrationId",
          "eventId",
          "type",
          "status",
          "failedStep",
          "failureReason",
          "updatedAt"
        ],
        "additionalProperties": false
      }
    }
  },
  "required": [
    "count",
    "byFailureReason",
    "items"
  ],
  "additionalProperties": false
}
```

**Ejemplo — llamada**

```json
{
  "jsonrpc": "2.0",
  "id": 7,
  "method": "tools/call",
  "params": {
    "name": "list_failed_sagas",
    "arguments": {
      "status": "COMPENSATED",
      "since": "2026-10-14T14:00:00Z"
    }
  }
}
```

**Ejemplo — respuesta**

```json
{
  "jsonrpc": "2.0",
  "id": 7,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\"count\": 12, \"byFailureReason\": {\"TICKET_ISSUE_FAILED\": 12}, \"items\": [{\"sagaId\": \"0192a3bf-bbbb-7ccc-8ddd-000000000888\", \"registrationId\": \"0192a3bf-aaaa-7bbb-8ccc-000000000777\", \"eventId\": \"0192a3be-1234-7abc-8def-000000000042\", \"type\": \"REGISTRATION\", \"status\": \"COMPENSATED\", \"failedStep\": \"ISSUE_TICKET\", \"failureReason\": \"TICKET_ISSUE_FAILED\", \"updatedAt\": \"2026-10-14T14:00:31Z\"}]}"
      }
    ],
    "structuredContent": {
      "count": 12,
      "byFailureReason": {
        "TICKET_ISSUE_FAILED": 12
      },
      "items": [
        {
          "sagaId": "0192a3bf-bbbb-7ccc-8ddd-000000000888",
          "registrationId": "0192a3bf-aaaa-7bbb-8ccc-000000000777",
          "eventId": "0192a3be-1234-7abc-8def-000000000042",
          "type": "REGISTRATION",
          "status": "COMPENSATED",
          "failedStep": "ISSUE_TICKET",
          "failureReason": "TICKET_ISSUE_FAILED",
          "updatedAt": "2026-10-14T14:00:31Z"
        }
      ]
    },
    "isError": false
  }
}
```

### `get_service_health` — Salud de servicios y colas

**Descripción (la que ve el LLM):**

> Consulta el estado de los 9 servicios (GET /health/ready) y de las colas de RabbitMQ: mensajes listos y sin confirmar, consumidores y colas de dead letters (.dlq). Úsala para detectar servicios caídos, backlog o mensajes en DLQ.

- **Servicio fuente / endpoint:** insights-service — `GET /internal/v1/service-health`, que agrega `/health/ready` de cada servicio y la API de management de RabbitMQ (`/api/queues`)
- **Permisos:** Rol `ADMIN` o token de servicio.
- **Solo lectura:** sí · **Annotations:** `readOnlyHint: true`, `destructiveHint: false`, `idempotentHint: true`, `openWorldHint: false`

**inputSchema**

```json
{
  "type": "object",
  "properties": {
    "includeQueues": {
      "type": "boolean",
      "default": true
    }
  },
  "required": [],
  "additionalProperties": false
}
```

**outputSchema**

```json
{
  "type": "object",
  "properties": {
    "checkedAt": {
      "type": "string",
      "format": "date-time"
    },
    "overall": {
      "type": "string",
      "enum": [
        "UP",
        "DEGRADED",
        "DOWN"
      ]
    },
    "services": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "name": {
            "type": "string"
          },
          "status": {
            "type": "string",
            "enum": [
              "UP",
              "DEGRADED",
              "DOWN"
            ]
          },
          "latencyMs": {
            "type": [
              "integer",
              "null"
            ]
          },
          "error": {
            "type": [
              "string",
              "null"
            ]
          }
        },
        "required": [
          "name",
          "status"
        ],
        "additionalProperties": false
      }
    },
    "queues": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "name": {
            "type": "string"
          },
          "messagesReady": {
            "type": "integer"
          },
          "messagesUnacked": {
            "type": "integer"
          },
          "consumers": {
            "type": "integer"
          },
          "isDeadLetter": {
            "type": "boolean"
          }
        },
        "required": [
          "name",
          "messagesReady",
          "messagesUnacked",
          "consumers",
          "isDeadLetter"
        ],
        "additionalProperties": false
      }
    }
  },
  "required": [
    "checkedAt",
    "overall",
    "services"
  ],
  "additionalProperties": false
}
```

**Ejemplo — llamada**

```json
{
  "jsonrpc": "2.0",
  "id": 7,
  "method": "tools/call",
  "params": {
    "name": "get_service_health",
    "arguments": {
      "includeQueues": true
    }
  }
}
```

**Ejemplo — respuesta**

```json
{
  "jsonrpc": "2.0",
  "id": 7,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\"checkedAt\": \"2026-10-14T15:00:05Z\", \"overall\": \"DEGRADED\", \"services\": [{\"name\": \"ticketing-service\", \"status\": \"UP\", \"latencyMs\": 18, \"error\": null}, {\"name\": \"wallet-service\", \"status\": \"DEGRADED\", \"latencyMs\": 1450, \"error\": \"db: latencia alta\"}], \"queues\": [{\"name\": \"events-service.saga-replies.dlq\", \"messagesReady\": 3, \"messagesUnacked\": 0, \"consumers\": 0, \"isDeadLetter\": true}]}"
      }
    ],
    "structuredContent": {
      "checkedAt": "2026-10-14T15:00:05Z",
      "overall": "DEGRADED",
      "services": [
        {
          "name": "ticketing-service",
          "status": "UP",
          "latencyMs": 18,
          "error": null
        },
        {
          "name": "wallet-service",
          "status": "DEGRADED",
          "latencyMs": 1450,
          "error": "db: latencia alta"
        }
      ],
      "queues": [
        {
          "name": "events-service.saga-replies.dlq",
          "messagesReady": 3,
          "messagesUnacked": 0,
          "consumers": 0,
          "isDeadLetter": true
        }
      ]
    },
    "isError": false
  }
}
```

### `query_metrics` — Consultar métricas técnicas (PromQL acotado)

**Descripción (la que ve el LLM):**

> Ejecuta una consulta PromQL de solo lectura contra Prometheus (stack LGTM) y devuelve series agregadas. Solo admite las métricas de la allowlist (latencia HTTP, duración y compensaciones de SAGA, outbox, fallos de consumo, profundidad de DLQ, backlog de moderación, inferencia ML, logins fallidos y uso de agentes) y funciones de agregación; el resultado se limita a 50 series y 500 puntos. Úsala para confirmar con datos técnicos un problema antes de levantar una alerta (p. ej. p95 de latencia o tasa de compensación en los últimos 15 min). No devuelve datos personales.

- **Servicio fuente / endpoint:** Prometheus del stack LGTM (`otel-lgtm`) — `GET /api/v1/query` y `/api/v1/query_range` desde insights-service; métricas de `bandadau-docs/docs/03-arquitectura/observabilidad.md` §6 (D15)
- **Permisos:** Solo token de servicio (MonitoringAgent) o rol `ADMIN`. No se lista para otros roles.
- **Solo lectura:** sí · **Annotations:** `readOnlyHint: true`, `destructiveHint: false`, `idempotentHint: true`, `openWorldHint: false`
- **Allowlist de métricas** (`x-metrics-allowlist`; ampliarla exige documentar la métrica en `observabilidad.md` §6 y actualizar este contrato): `http_server_request_duration_seconds`, `traefik_service_request_duration_seconds`, `saga_duration_seconds`, `saga_compensations_total`, `saga_active`, `idempotency_replays_total`, `inbox_duplicates_total`, `outbox_pending`, `outbox_publish_lag_seconds`, `messaging_consume_failures_total`, `dlq_depth`, `moderation_backlog`, `ml_inference_duration_seconds`, `ml_decisions_total`, `auth_login_failures_total`, `agent_runs_total`, `agent_tokens_total`.
- **Validación:** el servidor parsea la expresión (parser PromQL) antes de enviarla; un selector fuera de la allowlist, un rango > 7 días o > 24 h dentro de una subconsulta devuelve `isError: true` con la explicación. Timeout de 10 s por consulta.

**inputSchema**

```json
{
  "type": "object",
  "properties": {
    "query": {
      "type": "string",
      "minLength": 3,
      "maxLength": 500,
      "description": "Expresión PromQL. Todo selector de métrica debe estar en la allowlist; se rechazan selectores sin nombre de métrica, `{__name__=~...}` y subconsultas con rango > 24 h."
    },
    "start": {
      "type": "string",
      "format": "date-time",
      "description": "Inicio de una consulta de rango (UTC). Si se omiten `start` y `end` se ejecuta una consulta instantánea."
    },
    "end": {
      "type": "string",
      "format": "date-time",
      "description": "Fin de la consulta de rango (UTC). Máximo 7 días después de `start`."
    },
    "step": {
      "type": "string",
      "pattern": "^[0-9]+[smh]$",
      "default": "60s",
      "description": "Resolución de la consulta de rango (p. ej. `60s`, `5m`). Mínimo efectivo 15s."
    }
  },
  "required": [
    "query"
  ],
  "dependentRequired": {
    "start": [
      "end"
    ],
    "end": [
      "start"
    ]
  },
  "additionalProperties": false
}
```

**outputSchema**

```json
{
  "type": "object",
  "properties": {
    "resultType": {
      "type": "string",
      "enum": [
        "vector",
        "matrix",
        "scalar"
      ]
    },
    "series": {
      "type": "array",
      "maxItems": 50,
      "items": {
        "type": "object",
        "properties": {
          "labels": {
            "type": "object",
            "additionalProperties": {
              "type": "string"
            }
          },
          "points": {
            "type": "array",
            "maxItems": 500,
            "items": {
              "type": "object",
              "properties": {
                "t": {
                  "type": "string",
                  "format": "date-time"
                },
                "v": {
                  "type": [
                    "number",
                    "null"
                  ]
                }
              },
              "required": [
                "t",
                "v"
              ],
              "additionalProperties": false
            }
          }
        },
        "required": [
          "labels",
          "points"
        ],
        "additionalProperties": false
      }
    },
    "truncated": {
      "type": "boolean",
      "description": "`true` si se recortaron series o puntos."
    },
    "executedAt": {
      "type": "string",
      "format": "date-time"
    }
  },
  "required": [
    "resultType",
    "series",
    "truncated",
    "executedAt"
  ],
  "additionalProperties": false
}
```

**Ejemplo — llamada**

```json
{
  "jsonrpc": "2.0",
  "id": 8,
  "method": "tools/call",
  "params": {
    "name": "query_metrics",
    "arguments": {
      "query": "histogram_quantile(0.95, sum by (le) (rate(saga_duration_seconds_bucket{outcome=\"COMPLETED\"}[15m])))",
      "start": "2026-10-14T14:00:00Z",
      "end": "2026-10-14T15:00:00Z",
      "step": "15m"
    }
  }
}
```

**Ejemplo — respuesta**

```json
{
  "jsonrpc": "2.0",
  "id": 8,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\"resultType\": \"matrix\", \"series\": [{\"labels\": {}, \"points\": [{\"t\": \"2026-10-14T14:00:00Z\", \"v\": 1.2}, {\"t\": \"2026-10-14T14:15:00Z\", \"v\": 1.4}, {\"t\": \"2026-10-14T14:30:00Z\", \"v\": 2.9}, {\"t\": \"2026-10-14T14:45:00Z\", \"v\": 4.1}, {\"t\": \"2026-10-14T15:00:00Z\", \"v\": 4.6}]}], \"truncated\": false, \"executedAt\": \"2026-10-14T15:00:04Z\"}"
      }
    ],
    "structuredContent": {
      "resultType": "matrix",
      "series": [
        {
          "labels": {},
          "points": [
            {
              "t": "2026-10-14T14:00:00Z",
              "v": 1.2
            },
            {
              "t": "2026-10-14T14:15:00Z",
              "v": 1.4
            },
            {
              "t": "2026-10-14T14:30:00Z",
              "v": 2.9
            },
            {
              "t": "2026-10-14T14:45:00Z",
              "v": 4.1
            },
            {
              "t": "2026-10-14T15:00:00Z",
              "v": 4.6
            }
          ]
        }
      ],
      "truncated": false,
      "executedAt": "2026-10-14T15:00:04Z"
    },
    "isError": false
  }
}
```

### `detect_anomalies` — Detectar anomalías en métricas

**Descripción (la que ve el LLM):**

> Ejecuta el modelo Isolation Forest sobre una o más series de métricas diarias u horarias y devuelve los puntos anómalos con su puntaje. Métricas disponibles: activeUsers, posts, registrationsConfirmed, registrationsFailed, creditsSpent, flaggedContent, sagaCompensations. Úsala para explicar picos o caídas inusuales.

- **Servicio fuente / endpoint:** insights-service — modelo `anomaly-detector` (Isolation Forest ONNX) sobre `METRIC#<name>`; sin llamada externa
- **Permisos:** Rol `ADMIN` o token de servicio.
- **Solo lectura:** sí · **Annotations:** `readOnlyHint: true`, `destructiveHint: false`, `idempotentHint: true`, `openWorldHint: false`

**inputSchema**

```json
{
  "type": "object",
  "properties": {
    "metrics": {
      "type": "array",
      "minItems": 1,
      "maxItems": 7,
      "uniqueItems": true,
      "items": {
        "type": "string",
        "enum": [
          "activeUsers",
          "posts",
          "registrationsConfirmed",
          "registrationsFailed",
          "creditsSpent",
          "flaggedContent",
          "sagaCompensations"
        ]
      }
    },
    "from": {
      "type": "string",
      "format": "date",
      "description": "Fecha inicial inclusiva (UTC), formato YYYY-MM-DD."
    },
    "to": {
      "type": "string",
      "format": "date",
      "description": "Fecha final inclusiva (UTC), formato YYYY-MM-DD. Máximo 366 días después de `from`."
    },
    "granularity": {
      "type": "string",
      "enum": [
        "hour",
        "day"
      ],
      "default": "day"
    },
    "sensitivity": {
      "type": "number",
      "minimum": 0.5,
      "maximum": 0.99,
      "default": 0.8,
      "description": "Umbral del puntaje de anomalía (más alto = menos alertas)."
    }
  },
  "required": [
    "metrics",
    "from",
    "to"
  ],
  "additionalProperties": false
}
```

**outputSchema**

```json
{
  "type": "object",
  "properties": {
    "modelVersion": {
      "type": "string"
    },
    "anomalies": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "metric": {
            "type": "string"
          },
          "at": {
            "type": "string",
            "format": "date-time"
          },
          "value": {
            "type": "number"
          },
          "expected": {
            "type": "number"
          },
          "score": {
            "type": "number",
            "minimum": 0,
            "maximum": 1
          },
          "direction": {
            "type": "string",
            "enum": [
              "SPIKE",
              "DROP"
            ]
          }
        },
        "required": [
          "metric",
          "at",
          "value",
          "expected",
          "score",
          "direction"
        ],
        "additionalProperties": false
      }
    }
  },
  "required": [
    "modelVersion",
    "anomalies"
  ],
  "additionalProperties": false
}
```

**Ejemplo — llamada**

```json
{
  "jsonrpc": "2.0",
  "id": 7,
  "method": "tools/call",
  "params": {
    "name": "detect_anomalies",
    "arguments": {
      "metrics": [
        "registrationsFailed"
      ],
      "from": "2026-10-01",
      "to": "2026-10-14",
      "granularity": "day"
    }
  }
}
```

**Ejemplo — respuesta**

```json
{
  "jsonrpc": "2.0",
  "id": 7,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\"modelVersion\": \"anomaly-detector@1.0.0\", \"anomalies\": [{\"metric\": \"registrationsFailed\", \"at\": \"2026-10-14T00:00:00Z\", \"value\": 14, \"expected\": 2.1, \"score\": 0.93, \"direction\": \"SPIKE\"}]}"
      }
    ],
    "structuredContent": {
      "modelVersion": "anomaly-detector@1.0.0",
      "anomalies": [
        {
          "metric": "registrationsFailed",
          "at": "2026-10-14T00:00:00Z",
          "value": 14,
          "expected": 2.1,
          "score": 0.93,
          "direction": "SPIKE"
        }
      ]
    },
    "isError": false
  }
}
```

### `generate_report` — Generar reporte

**Descripción (la que ve el LLM):**

> Crea un reporte generativo persistente (GeneratedReport) con título, texto en Markdown, dataset tabular y gráfico Vega-Lite opcional, y encola la narración en audio (≤ 90 s). Llámala UNA sola vez, al final, cuando ya reuniste los datos con las herramientas de consulta. El reporte se escribe en el idioma indicado en `locale`.

- **Servicio fuente / endpoint:** insights-service — caso de uso interno `GenerateReport` (DynamoDB `REPORT#<id>`, TTS vía `TtsPort`, audio en S3); publica `bandada.insights.report.ready.v1`
- **Permisos:** Rol `ADMIN` o token de servicio. Escritura (confirmación del usuario recomendada en el cliente).
- **Solo lectura:** no · **Annotations:** `readOnlyHint: false`, `destructiveHint: false`, `idempotentHint: false`, `openWorldHint: false`

**inputSchema**

```json
{
  "type": "object",
  "properties": {
    "title": {
      "type": "string",
      "minLength": 5,
      "maxLength": 140
    },
    "question": {
      "type": "string",
      "maxLength": 1000,
      "description": "Pregunta original que responde el reporte."
    },
    "markdown": {
      "type": "string",
      "maxLength": 20000
    },
    "dataset": {
      "type": "object",
      "properties": {
        "columns": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "name": {
                "type": "string"
              },
              "label": {
                "type": "string"
              },
              "type": {
                "type": "string",
                "enum": [
                  "string",
                  "integer",
                  "number",
                  "date",
                  "datetime",
                  "boolean"
                ]
              }
            },
            "required": [
              "name",
              "type"
            ],
            "additionalProperties": false
          }
        },
        "rows": {
          "type": "array",
          "maxItems": 5000,
          "items": {
            "type": "array"
          }
        }
      },
      "required": [
        "columns",
        "rows"
      ],
      "additionalProperties": false
    },
    "chart": {
      "type": "object",
      "description": "Especificación Vega-Lite v5 (sin `data.url`; usa el dataset).",
      "additionalProperties": true
    },
    "audioSummary": {
      "type": "string",
      "maxLength": 1400,
      "description": "Guion del audio (≤ 90 s, ~200 palabras)."
    },
    "locale": {
      "type": "string",
      "enum": [
        "es",
        "en"
      ],
      "description": "Idioma del reporte y del audio (D14). Por defecto, el del solicitante."
    },
    "reportId": {
      "type": "string",
      "format": "uuid",
      "description": "Solo agentes internos: id del reporte ya creado por `requestReport` que se debe completar."
    }
  },
  "required": [
    "title",
    "question",
    "markdown"
  ],
  "additionalProperties": false
}
```

**outputSchema**

```json
{
  "type": "object",
  "properties": {
    "reportId": {
      "type": "string",
      "format": "uuid"
    },
    "status": {
      "type": "string",
      "enum": [
        "RUNNING",
        "READY"
      ]
    },
    "audioStatus": {
      "type": "string",
      "enum": [
        "PENDING",
        "NONE"
      ]
    },
    "url": {
      "type": "string",
      "format": "uri",
      "description": "Enlace al reporte en el panel."
    }
  },
  "required": [
    "reportId",
    "status",
    "audioStatus",
    "url"
  ],
  "additionalProperties": false
}
```

**Ejemplo — llamada**

```json
{
  "jsonrpc": "2.0",
  "id": 7,
  "method": "tools/call",
  "params": {
    "name": "generate_report",
    "arguments": {
      "title": "Inscripciones — semana 41",
      "question": "¿Cómo fueron las inscripciones esta semana?",
      "markdown": "## Resumen\nSe confirmaron **318** inscripciones (+12 %).",
      "dataset": {
        "columns": [
          {
            "name": "date",
            "label": "Fecha",
            "type": "date"
          },
          {
            "name": "confirmed",
            "label": "Confirmadas",
            "type": "integer"
          }
        ],
        "rows": [
          [
            "2026-10-07",
            41
          ],
          [
            "2026-10-08",
            52
          ]
        ]
      },
      "audioSummary": "Esta semana se confirmaron trescientas dieciocho inscripciones, doce por ciento más que la anterior.",
      "locale": "es"
    }
  }
}
```

**Ejemplo — respuesta**

```json
{
  "jsonrpc": "2.0",
  "id": 7,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\"reportId\": \"0192a3e0-0000-7000-8000-000000000901\", \"status\": \"READY\", \"audioStatus\": \"PENDING\", \"url\": \"http://admin.bandada.localhost/insights/reports/0192a3e0-0000-7000-8000-000000000901\"}"
      }
    ],
    "structuredContent": {
      "reportId": "0192a3e0-0000-7000-8000-000000000901",
      "status": "READY",
      "audioStatus": "PENDING",
      "url": "http://admin.bandada.localhost/insights/reports/0192a3e0-0000-7000-8000-000000000901"
    },
    "isError": false
  }
}
```

### `raise_alert` — Crear alerta

**Descripción (la que ve el LLM):**

> Crea una alerta operativa visible en vivo en el panel y notificada al equipo si es CRITICAL. Solo para el agente de monitoreo interno: úsala cuando una consulta muestre un problema real (servicio caído, SAGAs fallidas, mensajes en DLQ, backlog de moderación o anomalía). No crees alertas duplicadas: usa el mismo `dedupeKey` para el mismo problema.

- **Servicio fuente / endpoint:** insights-service — caso de uso interno `RaiseAlert` (DynamoDB `ALERT#<id>`); publica `bandada.insights.alert.raised.v1`
- **Permisos:** Solo token de servicio (`typ=service`, `sub=insights-service`). Oculta en `tools/list` para clientes con JWT de usuario.
- **Solo lectura:** no · **Annotations:** `readOnlyHint: false`, `destructiveHint: false`, `idempotentHint: true`, `openWorldHint: false`

**inputSchema**

```json
{
  "type": "object",
  "properties": {
    "severity": {
      "type": "string",
      "enum": [
        "INFO",
        "WARNING",
        "CRITICAL"
      ]
    },
    "kind": {
      "type": "string",
      "enum": [
        "SERVICE_DOWN",
        "SAGA_FAILURES",
        "DLQ_BACKLOG",
        "MODERATION_BACKLOG",
        "METRIC_ANOMALY",
        "MODERATION_ESCALATION"
      ]
    },
    "message": {
      "type": "string",
      "maxLength": 1000,
      "description": "Mensaje en español, concreto y accionable."
    },
    "details": {
      "type": "object",
      "additionalProperties": true
    },
    "dedupeKey": {
      "type": "string",
      "maxLength": 200,
      "description": "Clave de deduplicación (p. ej. `SAGA_FAILURES:ticketing-service`); una alerta OPEN con la misma clave no se duplica."
    }
  },
  "required": [
    "severity",
    "kind",
    "message",
    "dedupeKey"
  ],
  "additionalProperties": false
}
```

**outputSchema**

```json
{
  "type": "object",
  "properties": {
    "alertId": {
      "type": "string",
      "format": "uuid"
    },
    "created": {
      "type": "boolean",
      "description": "false si ya existía una alerta OPEN con el mismo dedupeKey."
    },
    "status": {
      "type": "string",
      "enum": [
        "OPEN",
        "ACKNOWLEDGED",
        "RESOLVED"
      ]
    }
  },
  "required": [
    "alertId",
    "created",
    "status"
  ],
  "additionalProperties": false
}
```

**Ejemplo — llamada**

```json
{
  "jsonrpc": "2.0",
  "id": 7,
  "method": "tools/call",
  "params": {
    "name": "raise_alert",
    "arguments": {
      "severity": "CRITICAL",
      "kind": "SAGA_FAILURES",
      "message": "12 inscripciones compensadas en 15 min (umbral 5); falla en emisión de tickets.",
      "details": {
        "window": "15m",
        "count": 12,
        "suspectedService": "ticketing-service"
      },
      "dedupeKey": "SAGA_FAILURES:ticketing-service"
    }
  }
}
```

**Ejemplo — respuesta**

```json
{
  "jsonrpc": "2.0",
  "id": 7,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\"alertId\": \"0192a3e5-0000-7000-8000-000000000a01\", \"created\": true, \"status\": \"OPEN\"}"
      }
    ],
    "structuredContent": {
      "alertId": "0192a3e5-0000-7000-8000-000000000a01",
      "created": true,
      "status": "OPEN"
    },
    "isError": false
  }
}
```

## 3. Recursos MCP

| URI | Nombre | MIME | Contenido |
|---|---|---|---|
| `bandada://kpis/today` | KPIs de hoy | `application/json` | Misma forma que la salida de `get_platform_kpis` con `from = to = hoy` (UTC). Se recalcula en cada lectura (caché 60 s). |
| `bandada://alerts/open` | Alertas abiertas | `application/json` | `{ "items": Alert[] }` con alertas `OPEN` (máx. 100). Admite `resources/subscribe`: el servidor envía `notifications/resources/updated` al consumir `bandada.insights.alert.raised.v1` o al reconocer una alerta. |

Ejemplo `resources/read`:

```json
{ "jsonrpc": "2.0", "id": 3, "method": "resources/read", "params": { "uri": "bandada://alerts/open" } }
```

```json
{
  "jsonrpc": "2.0",
  "id": 3,
  "result": {
    "contents": [
      {
        "uri": "bandada://alerts/open",
        "mimeType": "application/json",
        "text": "{\"items\":[{\"id\":\"0192a3e5-0000-7000-8000-000000000a01\",\"severity\":\"CRITICAL\",\"kind\":\"SAGA_FAILURES\",\"message\":\"12 inscripciones compensadas en 15 min (umbral 5).\",\"status\":\"OPEN\",\"raisedAt\":\"2026-10-14T15:00:12Z\"}]}"
      }
    ]
  }
}
```

## 4. Prompts MCP

| Prompt | Argumentos | Mensajes generados |
|---|---|---|
| `monthly_report` | `month` (YYYY-MM, requerido), `locale` (`es`/`en`, opcional) | Instrucción de usuario: "Elabora el reporte mensual de Bandada U para {month}: usa `get_platform_kpis`, `get_registration_stats` (groupBy=event), `get_credit_stats` (groupBy=week), `get_content_stats`, `list_failed_sagas` y `detect_anomalies`; compara con el mes anterior; termina llamando a `generate_report` con dataset, gráfico Vega-Lite y guion de audio de ≤ 90 s en {locale}." |
| `weekly_summary` | `weekStart` (YYYY-MM-DD, opcional; por defecto la semana anterior), `locale` (opcional) | Instrucción: "Resume la semana que inicia el {weekStart} para el equipo administrador: KPIs, eventos destacados, incidentes (SAGAs, alertas, moderación) y recomendaciones; usa `generate_report`." Lo usa n8n `wf-04-resumen-semanal` vía `POST /insights/reports`. |

Ejemplo `prompts/get`:

```json
{ "jsonrpc": "2.0", "id": 4, "method": "prompts/get", "params": { "name": "monthly_report", "arguments": { "month": "2026-09", "locale": "es" } } }
```

## 5. Configuración de clientes

### Claude Code

```bash
claude mcp add --transport http bandada https://api.bandadau.com/mcp \
  --header "Authorization: Bearer ${BANDADA_MCP_TOKEN}"
# desarrollo
claude mcp add --transport http bandada-dev http://api.bandada.localhost/mcp \
  --header "Authorization: Bearer ${BANDADA_MCP_TOKEN}"
```

O en `.mcp.json` del proyecto (sin secretos: el token viene de una variable de entorno):

```json
{
  "mcpServers": {
    "bandada": {
      "type": "http",
      "url": "https://api.bandadau.com/mcp",
      "headers": { "Authorization": "Bearer ${BANDADA_MCP_TOKEN}" }
    }
  }
}
```

### Claude Desktop (`claude_desktop_config.json`)

Usando el puente `mcp-remote` para servidores HTTP remotos con cabeceras:

```json
{
  "mcpServers": {
    "bandada": {
      "command": "npx",
      "args": [
        "-y",
        "mcp-remote",
        "https://api.bandadau.com/mcp",
        "--header",
        "Authorization:${BANDADA_AUTH_HEADER}"
      ],
      "env": { "BANDADA_AUTH_HEADER": "Bearer <token-MCP-de-8h>" }
    }
  }
}
```

> `BANDADA_MCP_TOKEN` / `BANDADA_AUTH_HEADER` contienen el **token MCP de 8 h** emitido con
> `createMcpToken` desde el panel; al expirar se emite otro. Verificar la sintaxis exacta contra la
> documentación oficial de la versión instalada de Claude Code / Claude Desktop / `mcp-remote`
> (AGENTS.md regla 8). Nunca commitear tokens.

## 6. Changelog

- 1.1.0 (2026-10-14): ADR-0016/D15 — herramienta de solo lectura `query_metrics` (PromQL acotado a
  una allowlist; solo token de servicio o `ADMIN`); clientes externos con **token MCP de 8 h**
  (`createMcpToken`, `aud=mcp`, scope `mcp:tools`); `list_events` usa `listEventsInternal`;
  `get_platform_kpis` y `get_service_health` (y sus endpoints internos) dejan de ser propuesta;
  `generate_report.status` usa `READY` y `raise_alert.kind` usa `MODERATION_ESCALATION`.

- 1.0.0 (2026-10-14): versión inicial — 11 herramientas de D9, 2 recursos, 2 prompts;
  `locale` en `generate_report` (D14); `dedupeKey` en `raise_alert` y endpoints internos
  `GET /internal/v1/kpis` y `GET /internal/v1/service-health` de insights como **propuesta**.
