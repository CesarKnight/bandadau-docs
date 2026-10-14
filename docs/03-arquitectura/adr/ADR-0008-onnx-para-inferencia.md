# ADR-0008 — ONNX como formato de inferencia

- **Estado:** Aceptada
- **Fecha:** 2026-10-14
- **Decisores:** Equipo Grupo 24 (Ing. Software II)

## Contexto

Los modelos se entrenan en Python, pero los servicios que los usan son NestJS; no se quiere un servicio
Python en ejecución (costo y un cuarto runtime).

## Decisión

Exportar todo modelo DL y el Isolation Forest a **ONNX** y ejecutarlos con **onnxruntime-node** en
media-service e insights-service (y onnxruntime-web/react-native on-device). Modelos clásicos lineales
se exportan como **JSON de coeficientes** evaluados en JS. Artefactos en S3/MinIO
`models/<nombre>/<versión>/` con `metadata.json`. D7.

## Alternativas consideradas

| Alternativa | Motivo de descarte |
|---|---|
| Servicio de inferencia Python (FastAPI/TorchServe) | Otro runtime, más RAM en el EC2. |
| TensorFlow.js | Conversión más limitada y peor rendimiento en Node para ViT. |
| APIs gestionadas (Rekognition) | Costo por llamada y no demuestra DL propio. |

## Consecuencias

- (+) Un solo runtime en producción; mismo artefacto en servidor y cliente.
- (+) Versionado y `modelVersion` en cada resultado.
- (−) Preprocesamiento debe replicarse en Node con exactitud.
- (−) Algunos operadores/opsets pueden no estar soportados (validar en el export).

## Referencias

D7, `ml-dl.md`
