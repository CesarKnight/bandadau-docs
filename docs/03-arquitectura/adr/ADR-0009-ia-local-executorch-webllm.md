# ADR-0009 — IA local con ExecuTorch (nativo) y WebLLM (web)

- **Estado:** Aceptada
- **Fecha:** 2026-10-14
- **Decisores:** Equipo Grupo 24 (Ing. Software II)

## Contexto

T6 exige IA local offline en móvil y frontend. La app es Expo SDK 57 para iOS, Android y web PWA.

## Decisión

Interfaz `LocalLlm` con implementación **react-native-executorch** (`.native.ts`, modelo pequeño
cuantizado descargado bajo demanda) y **WebLLM/WebGPU** (`.web.ts`) con fallback **transformers.js**.
Pre-chequeo NSFW on-device con ONNX. Requiere **development build** de Expo. D6.

## Alternativas consideradas

| Alternativa | Motivo de descarte |
|---|---|
| llama.rn (llama.cpp) | Maduro, pero el equipo prefiere la integración Expo/New Architecture de ExecuTorch; se mantiene como plan B. |
| APIs de IA del sistema operativo | Cobertura desigual entre plataformas y versiones. |
| LLM en servidor | No cumple 'offline'. |

## Consecuencias

- (+) Privacidad: el texto no sale del dispositivo.
- (+) Misma interfaz para nativo y web; fácil de simular en pruebas.
- (−) Descargas de cientos de MB; calidad limitada de modelos < 1B.
- (−) Sin Expo Go; WebGPU no está en todos los navegadores.

## Referencias

D6, `ia-local-y-offline.md`
