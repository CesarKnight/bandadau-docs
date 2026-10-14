# ADR-0015 — i18n con ICU MessageFormat (es / en)

- **Estado:** Aceptada
- **Fecha:** 2026-10-14
- **Decisores:** Equipo Grupo 24 (Ing. Software II)

## Contexto

La UI era solo en español (visión, "Won't"), pero se decidió soportar inglés. Plurales y formatos
de fecha/números/créditos deben ser correctos en ambos idiomas y en 4 tecnologías de frontend y
backends que envían correos, push y reportes con audio.

## Decisión

Idiomas `es` (fuente y fallback) y `en`; **ICU MessageFormat** en `locales/{es,en}/<namespace>.json`;
`i18next` + `react-i18next` + `i18next-icu` en React/Next/Expo, **Transloco** en Angular; paquete
compartido `@bandada/i18n`; idioma resuelto por `User.locale` → dispositivo → navegador → `es`. Backend
traduce Problem Details por `code` y `Accept-Language`; notificaciones y reportes generativos en el
idioma del destinatario/solicitante. D14.

## Alternativas consideradas

| Alternativa | Motivo de descarte |
|---|---|
| Solo español | Contradice la nueva decisión de producto. |
| Formato i18next nativo (sin ICU) | Plurales/selección menos portables entre i18next y Transloco. |
| Traducción automática en runtime | Calidad y costo impredecibles. |

## Consecuencias

- (+) Mensajes portables entre librerías; plurales correctos.
- (+) `code` estable en errores desacopla backend y textos.
- (−) Toda cadena nueva requiere ambas traducciones (`i18n:check` en CI).
- (−) Prompts de agentes y del asistente local se mantienen en dos idiomas.

## Referencias

D14, `04-patrones-y-reglas/i18n.md`
