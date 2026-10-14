# Guía de frontends

Aplica a los 5 frontends de `catalogo-servicios.md` §2: `bandadau-landing` (Next.js 16),
`bandadau-admin/shell` (Next.js 16), `bandadau-admin/mfe-moderation` (Angular 21), `bandadau-admin/mfe-insights`
(React 19 + Vite) y `bandadau-frontend` (Expo SDK 57). Complementan esta guía:

- `design-tokens-y-temas.md` — tokens DTCG, Style Dictionary, modos claro/oscuro (D13).
- `i18n.md` — `es`/`en`, ICU MessageFormat, librerías por framework (D14).
- `bandadau-docs/docs/03-arquitectura/microfrontends.md` — contrato shell ↔ MFE (D5).
- `bandadau-docs/docs/03-arquitectura/ia-local-y-offline.md` — IA on-device, cola offline, PWA (D6).

> Versiones nuevas con cambios grandes (Next.js 16, Angular 21, Expo SDK 57, React 19).
> Antes de usar una API, **verifica la documentación de la versión instalada**
> (`node_modules/next/dist/docs/`, changelog de Expo, guías de Angular). No inventes APIs.

## 1. Reglas comunes (todas las apps)

### 1.1 Datos y estado

| Tipo de estado | Herramienta | Regla |
|---|---|---|
| Estado del servidor (REST) | **TanStack Query** | Todo fetch pasa por `useQuery`/`useMutation`/`useInfiniteQuery`; prohibido `useEffect + fetch + useState` |
| Estado del servidor (GraphQL, panel) | Cliente GraphQL ligero (`graphql-request` o `urql`) **dentro de TanStack Query** en React; Apollo Angular o `HttpClient` + señales en Angular | Una sola caché por app |
| Estado de cliente global | **Zustand** (React/Expo) · señales (`signal`, `computed`) en Angular | Solo UI/sesión (tema, idioma, borradores, sesión); nunca copias de datos del servidor |
| Estado local | `useState` / signals | — |
| Formularios | `react-hook-form` + `zod` (React/Expo) · Reactive Forms tipados (Angular) | Esquemas derivados de `@bandada/contracts-ts` cuando sea posible |

- **Query keys** centralizadas en `src/lib/query-keys.ts` (fábrica; sin params devuelve la raíz para invalidar en bloque).
- Listas paginadas: `useInfiniteQuery` con `nextCursor`; `placeholderData: keepPreviousData` en filtros.
- Mutaciones: `invalidateQueries` en `onSuccess`; actualización optimista con rollback en
  `onError` solo para toggles (reacciones, seguir, marcar leído).
- `QueryClient` singleton (`src/lib/query-client.ts`); errores globales reportados vía
  `QueryCache`/`MutationCache` `onError` → `reportError()`.
- Logout: `queryClient.clear()` + reset de stores Zustand.

### 1.2 Capa HTTP (un solo chokepoint)

`src/lib/api-client.ts` por app (o `@bandada/*` cuando se comparta). Responsabilidades:

1. Base URL desde variables públicas de build (`NEXT_PUBLIC_API_URL`, `EXPO_PUBLIC_API_URL`,
   `NG_APP_GRAPHQL_URL`, `VITE_*`); nunca URLs escritas a mano.
2. Cabeceras: `Authorization`, **`Accept-Language`** (idioma activo de i18n), `X-Correlation-Id`
   (UUID por petición), `Idempotency-Key` en mutaciones ♻️ (generada **una vez por intención**).
3. Refresh de token único y serializado ante `401 TOKEN_EXPIRED`; si falla → logout
   (en MFEs: emitir `bandada:auth-expired`).
4. Parseo de `application/problem+json` a `ApiError { status, code, title, detail, errors }`.
5. Tipos de request/response desde `@bandada/contracts-ts` (generados del OpenAPI/GraphQL).

### 1.3 Errores y feedback

- La UI muestra el mensaje traducido por **`code`** (`t('errors:INSUFFICIENT_FUNDS')` desde
  `@bandada/i18n`); fallback al `title` del servidor (ya localizado) y luego a un genérico.
- **Error boundaries**: raíz + por sección (Next `error.tsx`/`global-error.tsx`; Expo
  `ErrorBoundary` exportado por ruta en expo-router; Angular `ErrorHandler` global; MFE React
  con boundary propio para no tumbar el shell).
- Toasts accesibles (`aria-live="polite"`) para resultado de acciones; en MFEs se pide al shell
  con `bandada:toast`.
- Estados obligatorios en toda vista de datos: cargando (skeleton), vacío, error con
  "Reintentar", sin conexión.

### 1.4 Tokens y temas (D13 → `design-tokens-y-temas.md`)

- **Prohibido** hex/rgb/hsl literales y utilidades de paleta cruda (`bg-blue-600`,
  `text-gray-500`, `#1A73E8`) en código de UI. Solo tokens **semánticos** o de componente
  de `@bandada/ui-tokens` (`bg-surface`, `text-muted`, `border-default`, `bg-action-primary`).
- Soporte **obligatorio** de modo claro y oscuro en toda pantalla nueva; preferencia
  `SYSTEM | LIGHT | DARK` (defecto `SYSTEM`), persistida en `bandada.theme` y sincronizada con
  `PATCH /api/v1/users/me/preferences` si hay sesión.
- Web: `data-theme` en `<html>` resuelto por script inline antes del primer pintado + `color-scheme`.
- Gráficos (Vega-Lite) reciben colores desde `tokens.ts`; nunca paletas por defecto de la librería.

### 1.5 i18n (D14 → `i18n.md`)

- **Prohibido texto literal en la UI** (JSX, plantillas Angular, `alert`, `aria-label`,
  `placeholder`, títulos de página). Todo vía claves en `locales/{es,en}/<namespace>.json`
  con ICU MessageFormat; claves en inglés `namespace.section.key`.
- `es` es el idioma fuente y fallback; `en` debe estar completo antes de cada release
  (`pnpm i18n:check` en CI). ESLint bloquea literales en JSX.
- Formato con helpers de `@bandada/i18n` (`formatCredits`, `formatDate`, `formatRelative`),
  zona `America/La_Paz`, locales `es-BO`/`en-US`. Nunca concatenar strings.
- El contenido de usuarios (posts, comentarios) no se traduce.

### 1.6 Accesibilidad (WCAG 2.2 AA)

- Contraste AA garantizado por los tokens (prueba automática en `@bandada/ui-tokens`); no
  sobreescribir colores.
- Objetivos táctiles ≥ 44×44 px; foco visible; orden de tabulación lógico; *focus trap* en modales.
- Imágenes con texto alternativo (para medios de usuario: etiquetas de CLIP como sugerencia editable).
- Respetar `prefers-reduced-motion` (web) y `AccessibilityInfo.isReduceMotionEnabled` (nativo).
- React Native: `accessibilityRole`, `accessibilityLabel` (traducido), `accessibilityState`.
- Pruebas: `@axe-core/playwright` en E2E web; revisión manual con VoiceOver/TalkBack en flujos UC-05/UC-12.

### 1.7 Seguridad en cliente

- Nada de secretos en variables públicas (todo `NEXT_PUBLIC_*`/`EXPO_PUBLIC_*`/`VITE_*`/`NG_APP_*` es público).
- Tokens: nativo → `expo-secure-store`; web → access token **en memoria**, refresh token según
  `seguridad-y-sso.md` (sin `localStorage` para el refresh salvo que ese documento lo autorice).
- MFEs reciben el `access-token` como **propiedad** (no atributo) y nunca lo persisten.
- Sin `dangerouslySetInnerHTML`/`[innerHTML]` salvo Markdown de reportes sanitizado (DOMPurify).

### 1.8 Testing (detalle en `testing-strategy.md`)

| Nivel | React/Next/Vite | Angular | Expo |
|---|---|---|---|
| Unitario | Vitest + Testing Library | Vitest o Jest según el builder de Angular 21 (verificar) + Angular Testing Library | Jest (`jest-expo`) + `@testing-library/react-native` |
| Red simulada | MSW con fixtures del contrato | MSW / `HttpTestingController` | MSW |
| E2E | Playwright (+ axe) | Playwright (montado en el shell) | **Maestro** (nativo) + Playwright (PWA) |

### 1.9 Calidad

TypeScript `strict`; ESLint flat config de `@bandada/eslint-config`; Prettier
(`singleQuote`, `trailingComma: all`); alias `@/*`; sin `any` explícito; componentes ≤ ~200
líneas (extraer hooks/subcomponentes).

## 2. Next.js 16 static export (`landing`, `admin-shell`)

- `output: 'export'`, `trailingSlash: true`, `images.unoptimized: true`; build → `out/` → S3 + CloudFront.
  Sin SSR en runtime, sin API routes, sin middleware, sin Server Actions.
- **Tailwind v4**: `@import "tailwindcss"` + `@import "@bandada/ui-tokens/tailwind-theme.css"`
  en `app/globals.css`; sin `tailwind.config.js`. PostCSS `@tailwindcss/postcss`.
- Primitivas propias en `src/components/ui/` (Button, Card, Input, Badge, Modal, DataTable,
  EmptyState…); no reimplementar en cada página.

### 2.1 Landing

- App Router con segmento de idioma `app/[locale]/` y `generateStaticParams` → `/es` y `/en`
  (SEO); `/` redirige en cliente según la resolución de idioma de `i18n.md` §2 (fallback `/es`). `hreflang` en metadata.
- Componentes de servidor solo en build (datos públicos de eventos: `GET /api/v1/events?public=true`
  se consulta **en el cliente** con TanStack Query para no congelar datos en el build, salvo
  contenido estático de marketing).
- Botones "Entrar" → `https://app.<dominio>`, "Panel" → `https://admin.<dominio>` (D4).
- Estructura: `app/[locale]/{page,privacy,terms}`, `src/components/{layout,sections,ui}`,
  `src/lib`, `locales/{es,en}`.

### 2.2 Admin shell

- Todas las páginas `'use client'` (static export). Rutas en `app/(panel)/…`; `app/sso/callback/page.tsx`
  intercambia el handoff (`exchangeHandoffCode`, D4); `app/login/`.
- Carga MFEs desde `mfe-manifest.json` (D5): inyecta `<script type="module">`, crea el custom
  element, le pasa `graphqlUrl`, `accessToken` (propiedad), `basePath`, `theme`, `locale` y escucha `bandada:navigate | bandada:toast | bandada:auth-expired`.
- Páginas propias del shell (dashboard, usuarios, universidades, SAGAs) usan GraphQL vía
  TanStack Query. Subscriptions con `graphql-ws`.
- Un MFE que falla al cargar muestra un fallback con reintento; nunca rompe el shell.

## 3. Angular 21 (`mfe-moderation`)

- **Standalone components**, **zoneless** (`provideZonelessChangeDetection`, verificar nombre en v21),
  **signals** para estado, `ChangeDetectionStrategy.OnPush` implícito; nuevo control flow
  (`@if`, `@for`).
- Empaquetado con `@angular/elements` → `customElements.define('bandada-mfe-moderation', …)`;
  `ViewEncapsulation.ShadowDom` en el componente raíz.
- Estructura: `src/app/{core (api, auth-bridge, i18n), features/moderation-queue, features/content-reports, shared/ui}`.
- i18n con **Transloco** + plugin MessageFormat; idioma inicial del atributo `locale` que pasa el shell (reacciona a cambios en caliente).
- Tokens vía `@bandada/ui-tokens/tokens.scss` + variables CSS heredadas; sin Angular Material
  con tema propio que contradiga los tokens.
- Datos por GraphQL (`moderationQueue`, `moderateMedia`, `resolveContentReport`,
  subscription `moderationQueueChanged`).

## 4. React 19 + Vite (`mfe-insights`)

- Vite *library mode* → un `main.js` ES module que registra `<bandada-mfe-insights>`
  (wrapper propio o `r2wc`, verificar compatibilidad con React 19); Shadow DOM con estilos
  inyectados (Tailwind v4 compilado + tokens).
- TanStack Query + cliente GraphQL; REST de `insights` solo para el audio (URL prefirmada).
- Gráficos con Vega-Lite (`vega-embed`) usando colores de `tokens.ts` y textos traducidos.
- Markdown de reportes renderizado con sanitización.
- Estructura: `src/{element.tsx (registro), app/, features/{reports,alerts,agent-runs}, lib/, locales/}`.

## 5. Expo SDK 57 (`mobile`) — iOS, Android y Web PWA

### 5.1 Decisiones (alineadas con Homy)

- **expo-router** con rutas en `app/` y código en `src/`.
- **Estilos: NativeWind v4** (como Homy) sobre los tokens semánticos de `@bandada/ui-tokens`
  aplicados con `vars()` en el `ThemeProvider` raíz según el tema efectivo (D13), con las mismas
  clases semánticas que la web (`bg-surface`, `text-primary`) y sin utilidades `dark:` dispersas.
  `StyleSheet.create` permitido para estilos dinámicos/animaciones (Reanimated) leyendo `tokens.ts`
  vía `useTokens()`. Detalle en `design-tokens-y-temas.md` §6.4; verificar compatibilidad de
  NativeWind con SDK 57 al implementar.
- **TanStack Query** (+ persister: MMKV en nativo, IndexedDB en web) para servidor;
  **Zustand** para sesión, preferencias, borradores y estado de la cola offline.
- `expo-router 57` ya no depende de `@react-navigation/*` directamente: importar desde los
  subpaths de `expo-router` (verificar).

### 5.2 Estructura

```
bandadau-frontend/
├── app/                        ← rutas (expo-router)
│   ├── _layout.tsx             providers: QueryClient → I18n → Theme → Session → OfflineQueue
│   ├── (auth)/                 welcome, login, register, verify-email
│   ├── (tabs)/                 feed, events, create, wallet, profile
│   ├── posts/[postId].tsx  events/[eventId].tsx  registrations/[registrationId].tsx
│   ├── tickets/[ticketId].tsx  groups/…  assistant/ (UC-17)  scan/ (UC-14)
│   └── sso/callback.tsx        universal link panel → app (D4)
├── src/
│   ├── features/<feature>/     api.ts (hooks TanStack), components/, screens helpers, schemas.ts
│   ├── components/ui/          primitivas (Button, Text, Card, Sheet…) solo con tokens
│   ├── lib/                    api-client.ts, query-client.ts, query-keys.ts, idempotency.ts
│   ├── stores/                 session.store.ts, preferences.store.ts, offline-queue.store.ts (Zustand)
│   ├── offline/                outbox-queue.ts (+ .native.ts expo-sqlite / .web.ts IndexedDB), sync.ts (NetInfo)
│   ├── ai/                     local-llm.ts + .native.ts / .web.ts (D6), image-precheck.ts
│   ├── i18n/                   init (i18next + expo-localization)
│   └── theme/                  ThemeProvider (vars de NativeWind)
├── locales/{es,en}/*.json
├── public/manifest.webmanifest  workbox-config / sw.ts
└── app.config.ts
```

### 5.3 Reglas de plataforma

- Archivos específicos `.native.ts` / `.web.ts` (o `.ios`/`.android`) con una **interfaz común**
  en el archivo base; nunca `Platform.OS === 'web'` disperso para lógica grande.
- Módulos nativos solo en `.native.ts` (`react-native-executorch`, `expo-secure-store`,
  `expo-sqlite`); en web su sustituto (WebLLM, IndexedDB).
- CNG: no editar `ios/`/`android/` a mano; config en `app.config.ts` y plugins.
- `EXPO_PUBLIC_*` se hornean en build; cambiarlas exige rebuild.
- Desde SDK 57 `expo/fetch` es el `fetch` global y la cancelación no lanza `AbortError` clásico:
  usar un helper `isAbortError()` (lección de Homy).

### 5.4 Offline (D6)

- Mutaciones offline (crear post, comentar, reaccionar) se encolan como `OfflineMutation
  { id, type, payload, clientId, idempotencyKey, createdAt, attempts }`; el `clientId` UUIDv7 y la
  `idempotencyKey` se generan **al crear** y no cambian en reintentos.
- Drenado al recuperar red (NetInfo) en orden, backoff exponencial, máximo 5 intentos → estado
  "requiere atención" visible al usuario.
- UI optimista: el post aparece con estado "Pendiente de sincronizar" (texto traducido).
- PWA: `expo export -p web` + manifest + service worker Workbox (`injectManifest`):
  precache del shell, `NetworkFirst` para `GET /feed`, `StaleWhileRevalidate` para medios.

### 5.5 Testing móvil

Jest + RNTL para componentes y hooks; pruebas de `outbox-queue` con red simulada; Maestro
para UC-02, UC-05 (modo avión), UC-12 y UC-14; Playwright contra la PWA.

## 6. Anti-patrones (rechazar en revisión)

- ❌ Hex, `bg-blue-*`, `text-gray-*` o `StyleSheet` con colores literales.
- ❌ Pantalla que solo funciona en modo claro.
- ❌ Textos literales en componentes, plantillas o `aria-label`; concatenar traducciones.
- ❌ Mostrar `error.message` crudo o `detail` sin mapear el `code`.
- ❌ `useEffect` + `fetch`; duplicar datos del servidor en Zustand.
- ❌ Generar una `Idempotency-Key` nueva en cada reintento.
- ❌ Estado global compartido entre shell y MFE (solo atributos/propiedades/eventos).
- ❌ Lógica `Platform.OS` dispersa en vez de `.native/.web`.
- ❌ Llamar a `/internal/**` desde un frontend.
