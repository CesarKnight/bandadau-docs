# Auditoría de la app Expo (`bandadau-frontend`) — 2026-10-15

Auditoría **solo lectura** de `bandadau-frontend` (rama `main`, HEAD `eea8878`, con cambios sin commitear del equipo: 25 archivos
modificados/nuevos y `app/settings/index.tsx` borrado) contra los criterios del proyecto: `AGENTS.md` del workspace y del repo,
`frontend-guidelines.md` §1 y §5, `design-tokens-y-temas.md`, `i18n.md`, `definition-of-done.md` §0 y §4,
`ia-local-y-offline.md`, `seguridad-y-sso.md`, `idempotencia.md`, `deuda-tecnica.md` (E-1…E-3), UC-01…UC-17 y UC-24 y los OpenAPI
consumidos. No se modificó nada en `bandadau-frontend`. Las rutas `archivo:línea` son relativas a ese repo.

**Verificaciones ejecutadas (en el árbol de trabajo actual):**

| Comando | Resultado |
|---|---|
| `corepack pnpm typecheck` | OK (0 errores) |
| `corepack pnpm lint` | OK (0 errores; solo aviso de watchman) |
| `corepack pnpm test` | "No tests found" → sale en 0 por `--passWithNoTests` (**no hay ninguna prueba**) |
| `corepack pnpm i18n:check` | **FALLA**: 198 errores, todos `missing message for error code …` en `en/errors.json`/`es/errors.json` (la app no tiene `locales/{es,en}/errors.json`; ya estaba como pendiente en el registro de sesiones). Sin `--contracts` la paridad es/en de los 13 namespaces propios pasa (`i18n-check ok`) |

---

## 1. Resumen ejecutivo

La app es hoy un **prototipo visual de alta calidad conectado a mocks**: UI, tokens, i18n, tema claro/oscuro, sheets, listas y
reveal del ticket están bien resueltos, pero **la integración con el backend real no funciona** y falta toda la capa offline, el
escáner, el asistente, las pruebas y la PWA. No debe declararse ningún RF como **V** (verificado) desde la app (E-1 sigue abierta).

| Área | Semáforo | Resumen |
|---|---|---|
| Reglas duras (tokens, i18n, idioma) | **Amarillo** | Sin hex en pantallas ni colores crudos; excepciones menores (logo, sombra, `'Cargando'`). `i18n:check` roto por falta de `errors.json`. |
| Arquitectura (Query, compilador, listas, sheets) | **Amarillo** | Query keys, `useInfiniteList`, gorhom + `usePresentableSheet`, keyboard-controller y media ratio bien. Faltan `VirtualList`, persister, `ErrorBoundary`; `useMemo/useCallback` reflejo. |
| Contract-first e idempotencia | **Rojo** | `Authorization` nunca se envía (bug), `Accept-Language` intermitente, sin cola offline/outbox, sin `Retry-After`, mocks activos por defecto, endpoint fuera de contrato. |
| Cobertura de UC | **Rojo** | 0 UC verificados con API real; UC-05, 08, 10, 13, 14, 17 ausentes o simulados; UC-07 parcial; solo 5 de los 16 UC tienen pantalla relevante conectada a la API en código. |
| Definition of done (a11y, estados, pruebas, PWA) | **Rojo** | 0 pruebas (Jest/Maestro/Playwright), sin PWA/service worker, a11y y objetivos táctiles parciales. |
| Documentación vs código | **Amarillo** | `AGENTS.md` del repo describe ~12 rutas/carpetas inexistentes y no menciona `src/auth/`, `src/mocks/`. |

**Cinco hallazgos principales**
1. **Bug bloqueante de autenticación:** `buildHeaders` exige `options.auth` truthy y `apiRequest` nunca lo propaga (`src/lib/http.ts:37`,
   `src/lib/api-client.ts:85-97`); solo `logout` pasa `auth: true`. Con backend real todo endpoint autenticado responderá 401.
2. **Mocks por defecto:** `env.useMocks` es `true` en `__DEV__` si no se define la variable (`src/lib/env.ts:9`) y `.env` local la fija en
   `true`; `apiRequest` consulta los mocks antes de la red (`src/lib/api-client.ts:73`). Ninguna pantalla se ha probado contra la API real.
3. **Sin capa offline ni IA local:** no existen `src/offline/`, `src/ai/`, `app/assistant/`, persister de Query, NetInfo, expo-sqlite en uso, cola
   outbox con backoff/5 intentos (T7, T8, T6 de la cátedra sin cubrir en la app).
4. **UC sin implementar o simulados:** publicar (`app/(tabs)/create.tsx:75` botón `onPress={() => undefined}`), escáner (`app/scan.tsx:19-22`
   resultado simulado, sin `expo-camera`), reacciones/seguir/denunciar/cancelar inscripción ausentes; `/profiles/{id}/posts` **no está en el contrato**.
5. **Cero pruebas y sin PWA:** no hay `*.test.*`, `.maestro/`, Playwright, `manifest.webmanifest` ni service worker; el DoD §4 y el CI
   (`pnpm test`) pasan en vacío.

---

## 2. Criterios (tabla)

Leyenda: **Cumple** / **Parcial** / **No cumple**.

### 2.1 Reglas duras

| # | Criterio | Estado | Evidencia |
|---|---|---|---|
| R1 | Sin hex/paleta cruda en componentes | Parcial | Búsqueda de `#rrggbb` en `app/` y `src/`: solo `src/components/brand/BandadaLogo.tsx:26-31` (paleta SVG de marca, excepción razonable pero fuera de tokens). `app.config.ts:41,72,73,80` usa hex (colores nativos de splash/adaptive icon: inevitable, documentar). Sin clases de paleta Tailwind (`bg-blue-500`…): 0 coincidencias |
| R2 | Sin colores crudos en `StyleSheet` | Parcial | 62 archivos usan `StyleSheet.create` pero para layout; el color se inyecta con `useTokens()`. Excepciones: `rgba(0,0,0,0.06)` en `src/features/feed/components/post-card.tsx:116` y `post-card-skeleton.tsx:55` (sombra web); `'transparent'` en `src/components/navigation/global-sidebar.tsx:136` (aceptable) |
| R3 | Claro y oscuro | Cumple | `userInterfaceStyle: 'automatic'` (`app.config.ts:11`), `ThemeProvider` con `vars()` y `resolveEffectiveTheme` (`src/theme/theme-provider.tsx:42-60`), `StatusBar` según tema (`app/_layout.tsx:48`). No verificado visualmente en esta auditoría |
| R4 | Sin texto literal (incl. a11y/alertas) | Parcial | Casi todo vía `t()`. Incumplimiento: `accessibilityLabel="Cargando"` (`src/components/brand/BandadaLogo.tsx:216`). 0 `Alert.alert`. `src/stores/session.store.ts:18` tiene un email literal de invitado (dato, no UI) |
| R5 | Paridad es/en | Parcial | 13 namespaces con paridad (`i18n-check` sin `--contracts` OK), pero `pnpm i18n:check` (con contratos) falla por 198 mensajes de error sin catálogo local y la app no incluye `errors.json` (pendiente ya registrado) |
| R6 | Errores por `code` | Parcial | `ApiError.localizedMessage(locale)` en login/verify (`app/(auth)/login.tsx:26-29`) y `errorMessage()` para `failureReason` (`app/events/[eventId].tsx:101`). Otras mutaciones (comentar, unirse a grupo, perfil, recarga) no muestran error |
| R7 | Identificadores en inglés | Cumple | Revisión de nombres de archivos, hooks y tipos: en inglés; textos en es/en vía i18n |

### 2.2 Arquitectura

| # | Criterio | Estado | Evidencia |
|---|---|---|---|
| A1 | TanStack Query única vía a datos; sin `useEffect + fetch` | Cumple | Todos los `api.ts` usan `useQuery/useInfiniteQuery/useMutation` (`src/features/*/api.ts`); los 34 `useEffect` son de UI/animación/sheet (p. ej. `src/hooks/use-presentable-sheet.ts:22`). Único `fetch` directo: chokepoint `src/lib/api-client.ts:23` |
| A2 | Query keys centralizadas | Parcial | `src/lib/query-keys.ts`. Excepción: `src/features/profile/api.ts:32` arma la clave con spread en línea (`[...queryKeys.profile.byId(), 'posts']`); faltan claves de reacciones/seguir/preferencias |
| A3 | Persister offline + `networkMode: 'offlineFirst'` | Parcial | `networkMode: 'offlineFirst'` en `src/lib/query-client.ts:19`; **no hay persister** (dependencias `@tanstack/query-sync-storage-persister` y `persist-client` instaladas sin uso; sin MMKV/IndexedDB). Sin `queryClient.clear()` en logout… sí existe (`src/auth/session.ts:34`) |
| A4 | React Compiler sin memo reflejo | Parcial | Compilador activo (`app.config.ts:16`). Reflejo: `useMemo`/`useCallback`/`memo` en `app/(auth)/login.tsx:26`, `register.tsx:34,38`, `verify-email.tsx:34`, `src/features/comments/comments-sheet.tsx:35-57`, `comments-panel.web.tsx:26`, `profile-menu.tsx:34-61`, `src/components/navigation/floating-tab-bar.tsx:41,73,80,85`, `custom-tabs.tsx:36`, `src/theme/theme-provider.tsx:55-59`. Algunos tienen justificación (callbacks de gorhom, estilos por token) pero no están documentados |
| A5 | `VirtualList` (FlashList nativo / FlatList web) en listas largas | Parcial | La abstracción existe como `src/components/ui/feed-list.tsx` (FlashList v2 nativo, FlatList web, `:1-5,149-156`) **pero el archivo documentado `virtual-list.tsx`/`VirtualList` no existe**. `ScrollView` en perfil (`app/(tabs)/profile.tsx:6`) y detalle de ticket |
| A6 | Bottom sheets con gorhom + `usePresentableSheet` | Cumple | `BottomSheetModalProvider` en `app/_layout.tsx:62`; `src/features/comments/comments-sheet.tsx:6,67,87` y `src/features/profile/components/profile-menu.tsx` usan `usePresentableSheet` (`src/hooks/use-presentable-sheet.ts`), `BottomSheetFlatList`; web desktop con modal (`comments-panel.web.tsx`) |
| A7 | Media ratio Instagram | Cumple | `src/lib/media-ratio.ts:14-17` (4:5, 1.91, 1:1); `post-carousel.tsx:18,47,84` toma el ratio de la primera imagen con `onLoad`; `media-preview.tsx:8,27` |
| A8 | Teclado con keyboard-controller | Cumple | `KeyboardProvider` (`app/_layout.tsx:59`), `KeyboardAvoidingView` en `app/(tabs)/create.tsx:6,33` y `src/components/screens/auth-layout.tsx`; tab bar oculta con teclado (`src/hooks/use-tab-bar-keyboard.native.ts`) |
| A9 | Archivos `.native/.web` correctos | Parcial | Pares correctos (storage, open-url, comments-panel, event-detail-view, tilt). Falta `refresh-token.native.ts` (existe `refresh-token.web.ts` y `refresh-token.ts`); `use-tab-bar-keyboard.ts` y `use-device-tilt.ts` base OK. Faltan `offline/*` y `ai/*` (no existen) |
| A10 | Providers del root según AGENTS.md | No cumple | `app/_layout.tsx` no monta `OfflineQueue`, no llama a `restoreSession()` (definida en `src/auth/session.ts:14`, **sin llamadores**) y no exporta `ErrorBoundary`; no hay guardas de ruta (`app/index.tsx:5` redirige siempre a `welcome`) |
| A11 | Zustand solo para cliente | Cumple | `src/stores/session.store.ts`, `preferences.store.ts`; sin copias de datos del servidor |

### 2.3 Contract-first, idempotencia, seguridad

| # | Criterio | Estado | Evidencia |
|---|---|---|---|
| C1 | `Authorization: Bearer` en peticiones autenticadas | **No cumple** | `src/lib/http.ts:37` (`options.auth && options.accessToken`) y `src/lib/api-client.ts:85-97`: `auth` queda `undefined` en las llamadas; el interceptor 401 refresca y reintenta igualmente sin cabecera. Solo `src/auth/session.ts:25` pasa `auth: true` |
| C2 | `Accept-Language` en cada petición | Parcial | `src/lib/http.ts:36` depende de `options.locale`; en `apiRequest` solo se fija en la rama no idempotente (`api-client.ts:87-90`): las mutaciones con `idempotent: true` y sin clave previa (p. ej. `useCreateComment`, `src/features/comments/api.ts:27-31`) **salen sin `Accept-Language`** |
| C3 | `Idempotency-Key` estable por intención | Parcial | `useRef(newUuid())` en `app/(tabs)/wallet.tsx:32`, `register.tsx:32`, `events/[eventId].tsx:32`; la clave se **regenera en cada reintento** (`wallet.tsx:37`, `register.tsx:63`, `events/[eventId].tsx:58`), lo que contradice "reutilizar en reintentos" (`idempotencia.md`, AGENTS.md del repo). Es UUIDv4 (`expo-crypto randomUUID`, `src/lib/idempotency.ts:4`), no UUIDv7 |
| C4 | `clientId` UUIDv7 en mutaciones creadoras | No cumple | Sin `clientId` en ningún cuerpo de petición (solo en mocks, `src/mocks/feed.ts:53`); no hay generador UUIDv7 |
| C5 | Cola offline (outbox, backoff, máx. 5 intentos, "requiere atención") | **No cumple** | No existen `src/offline/`, `src/stores/offline-queue*`, NetInfo (dependencia instalada, 0 usos), expo-sqlite (0 usos). `QueryClient` mutations `retry: 0` (`query-client.ts:22`) |
| C6 | Errores mapeados por `code` | Parcial | Ver R6; `ApiError` parsea problem+json (`src/lib/api-error.ts`) |
| C7 | Tokens en `expo-secure-store` | Parcial | `src/lib/storage.native.ts:1-16` (SecureStore) usado para refresh y preferencias; access token solo en memoria (`session.store.ts:28`). Web: cookie HttpOnly con `credentials: 'include'` (`api-client.ts:28`) |
| C8 | Polling de `registrations` con `Retry-After` | No cumple | `src/features/events/api.ts:33-36`: intervalo fijo de 1000 ms, sin leer `Retry-After`, sin tope/timeout ni push; la pantalla no muestra estado de espera tras salir (no existe `app/registrations/[registrationId].tsx`) |
| C9 | `isAbortError` en cancelaciones | Parcial | Definido (`src/lib/is-abort-error.ts`) y usado en `query-client.ts:6,18`; ninguna query pasa `signal` desde `queryFn` a `apiRequest` (`options.signal` nunca se alimenta) |
| C10 | Contrato respetado (solo endpoints existentes) | Parcial | 27 de 28 rutas usadas existen en `contracts/openapi/*`. **No existe** `GET /profiles/{userId}/posts` (`src/features/profile/api.ts:32-35`; el OpenAPI social solo define `/profiles/{userId}`, `listGroupPosts` y `getFeed`). Tipos propios en `src/features/*/types.ts`, no `@bandada/contracts-ts` (la dependencia está declarada y no se importa) |
| C11 | Mocks fuera del camino de producción | No cumple | `src/lib/env.ts:8-9` activa mocks en `__DEV__` por defecto; `.env.example:7` dice `false` pero `.env` local usa `true`; `api-client.ts:73-83` evalúa mocks siempre; "Continuar como invitado" crea sesión falsa (`session.store.ts:44`, `app/(auth)/welcome.tsx:18-21`) |
| C12 | Refresh serializado ante 401 | Cumple | `refreshInFlight` (`src/lib/api-client.ts:33-39`) — pero ver C1 (sin `Authorization` el 401 es permanente) |
| C13 | SSO app → panel (UC-03, PKCE) | Parcial | `src/auth/handoff.ts:13-21,38-44` con PKCE y `#cv=` en fragmento; `app/sso/callback.tsx`. Sin probar (E-2); `auth` no se propaga (C1) rompe `/auth/handoff` |

### 2.4 Definition of done (§0 y §4)

| # | Criterio | Estado | Evidencia |
|---|---|---|---|
| D1 | Lint, typecheck en verde | Cumple | Ver tabla de verificaciones |
| D2 | `i18n:check` en verde | No cumple | 198 errores (falta `errors.json`) |
| D3 | Estados cargando/vacío/error/sin conexión | Parcial | Skeletons nuevos (sin commitear) `src/components/ui/skeleton.tsx`, `feed-skeleton.tsx`, `profile-skeleton.tsx`, `wallet-skeleton.tsx`; reintento en feed/eventos/grupos/notificaciones (`list.refetch`). Detalle de evento y ticket muestran solo texto/`ActivityIndicator` y el error sin botón (`app/events/[eventId].tsx:36-46`); no hay banner "sin conexión" |
| D4 | Accesibilidad (roles, labels) | Parcial | 29 archivos con `accessibilityLabel/Role`, pero 56 `<Pressable` frente a 32 `accessibilityRole`; inputs de `app/profile/edit.tsx:36-76` son `TextInput` crudos sin label |
| D5 | Objetivos táctiles ≥ 44 pt | Parcial | `hitSlop` 8-10 en iconos (`app-header.tsx:32`, `menu-header.tsx:27,40`), `minHeight: 44` solo en `media-picker.tsx:127`; no hay constante ni prueba |
| D6 | Pruebas Jest/RNTL | **No cumple** | 0 archivos de prueba; `jest.setup.ts` existe; `msw` instalado sin usar |
| D7 | Maestro (UC-02, 05, 12, 14, 17) | **No cumple** | `.maestro/` no existe |
| D8 | Playwright PWA | **No cumple** | Sin configuración ni pruebas |
| D9 | PWA/offline (manifest, SW, instalable) | **No cumple** | Sin `public/manifest.webmanifest` ni `sw/`; `app.config.ts:36-40` no declara PWA; `package.json` sin `workbox` |
| D10 | Pantallas sin mockups visibles | No cumple | `locales/es/create.json:30` ("Mockup: publicar se conecta…") se muestra al usuario (`app/(tabs)/create.tsx:81`) |
| D11 | CI | Parcial | `.github/workflows/ci.yml` ejecuta lint/typecheck/test/i18n/build:web, pero `test` pasa vacío e `i18n:check` fallaría |

---

## 3. Cobertura de casos de uso

Estado real en la app: **API real** = hook + pantalla + endpoint de contrato, probado contra backend (ninguno lo está hoy, ver C1/C11);
**Cableado** = hook al endpoint real pero sin verificar; **Solo mock** = existe en `src/mocks`; **Ausente**.

| UC | Estado en la app | Pantallas / hooks | Falta |
|---|---|---|---|
| UC-01 Registrarse | Cableado (no verificado) | `app/(auth)/register.tsx`, `verify-email.tsx`; `useUniversities`, `useRegister`, `useVerifyEmail`, `useResendCode` (`src/features/auth/api.ts`) | Sin mock (requiere backend); revalidar anti-enumeración; clave de idempotencia se regenera al reintentar; sin pruebas |
| UC-02 Iniciar sesión | Parcial | `app/(auth)/login.tsx`, `useLogin`, `src/auth/session.ts` (`logout`, `restoreSession`) | `restoreSession()` nunca se invoca (sin sesión persistente); sin guardas de ruta; "invitado" simulado; flujo offline C2a sin probar |
| UC-03 Acceso único al panel | Cableado (no verificado) | `src/auth/handoff.ts`, `app/sso/callback.tsx`, `profile-menu-content.tsx:73` | Sin Universal/App Links probados (E-2); falla por C1 |
| UC-04 Perfil y preferencias | Cableado + mock | `app/(tabs)/profile.tsx`, `app/profile/[userId].tsx`, `app/profile/edit.tsx`; `useMyProfile`, `useUpdateProfile`, `useUserPosts`, `useUpdatePreferences` (no usado en UI) | `/profiles/{id}/posts` fuera de contrato; ver perfil ajeno (`getProfile`) no usado; ajustes (idioma/tema) solo locales, no llaman a `updateMyPreferences`; `app/settings` borrado |
| UC-05 Publicar contenido | **Ausente (UI sin lógica)** | `app/(tabs)/create.tsx`, `features/create/*` (selector y preview) | `createUpload`→PUT→`completeUpload`→`createPost` con `clientId` UUIDv7, pre-chequeo on-device (NSFW), cola offline (UC-05 modo avión), manejo de `MEDIA_REJECTED` |
| UC-06 Ver feed | Cableado + mock | `app/(tabs)/feed.tsx`, `useFeed`, `FeedList`, `post-card.tsx`, `post-carousel.tsx` | Verificar con `getFeed` real; `app/posts/[postId].tsx` ausente |
| UC-07 Comentar y reaccionar | Parcial (comentar) | `comments-sheet.tsx`/`comments-panel.*`, `useComments`, `useCreateComment` | `setReaction`/`removeReaction` ausentes (sin botón de like funcional), sin `clientId`, sin optimismo |
| UC-08 Seguir estudiantes | **Ausente** | — | `followUser`/`unfollowUser`/`getFollowSuggestions`; botón en perfil ajeno |
| UC-09 Grupos | Cableado + mock (parcial) | `app/groups/index.tsx`, `useGroups`, `useJoinGroup`, `group-card.tsx` | Crear grupo (botón `onPress={() => undefined}`, `groups/index.tsx:26`), detalle, salir, miembros, posts del grupo |
| UC-10 Denunciar | **Ausente** | — | `reportContent` + sheet de motivo |
| UC-11 Publicar evento (organizador) | **Ausente** | Solo lectura de eventos (`useEvents`, `useEvent`) | `createEvent`/`publishEvent` y formulario por rol `ORGANIZER` (`src/lib/roles.ts`) |
| UC-12 Inscribirse (SAGA) | Cableado + mock (parcial) | `app/events/[eventId].tsx`, `PaymentModal`, `useRegisterToEvent`, `useRegistration`, `TicketRevealModal`, `app/tickets/*` | `Retry-After`, push, pantalla `registrations/[id]`, clave estable en reintento, errores por `failureReason` en espera prolongada, `registrations/me` |
| UC-13 Cancelar inscripción | **Ausente** | — | `cancelRegistration` + confirmación + estado `CANCELLATION_PENDING` (ya contemplado en el polling) |
| UC-14 Validar entrada (portero) | **Solo simulado** | `app/scan.tsx:19-22` (ciclo valid/used/invalid) | `expo-camera` (plugin no declarado en `app.config.ts`), `validateTicket`, firmas (`getTicketSigningKeys`), permiso de cámara i18n, guarda por rol |
| UC-15 Recargar créditos | Cableado + mock | `app/(tabs)/wallet.tsx`, `useCreateTopUp`, `useSimulatePayment`, `PaymentModal` | `getTopUp` (polling), expiración, manejo de `INVALID_TOPUP_PACKAGE` |
| UC-16 Consultar movimientos | Cableado + mock | `useMyWallet`, `useLedger`, `ledger-row.tsx`, `wallet-skeleton.tsx` | Verificar contra API real |
| UC-17 Asistente offline | **Ausente** | — (sin `app/assistant/`, `src/ai/`; sin `react-native-executorch` ni WebLLM en `package.json`) | Fase 2 en el UC; ver A-12 |
| UC-24 Notificaciones | Parcial | `app/notifications.tsx`, `useNotifications`, `useMarkNotificationRead`, `useMarkAllNotificationsRead` | `registerDevice` (token push con `expo-notifications`: plugin sí declarado, 0 usos), preferencias (`get/updateNotificationPreferences`), deep link desde push |

**Pantallas aún en mocks / endpoints que faltan conectar**

- Mocks vigentes (`src/mocks/index.ts:28-79`): profiles/me, profiles/{id}/posts, feed, notifications, events, registrations, wallet, topups,
  tickets, groups, comments. `EXPO_PUBLIC_USE_MOCKS=true` en `.env` local y por defecto en `__DEV__`.
- Endpoints de contrato **sin cliente**: `getProfile`, `createPost`, `getPost`, `deletePost`, `setReaction`, `removeReaction`, `followUser`,
  `unfollowUser`, `getFollowSuggestions`, `createGroup`, `getGroup`, `leaveGroup`, `listGroupMembers`, `listGroupPosts`, `reportContent`
  (social); `createUpload`, `completeUpload`, `getMedia` (media); `createEvent`, `publishEvent`, `cancelEvent`, `cancelRegistration`,
  `listMyRegistrations` (events); `getTopUp` (wallet); `validateTicket`, `getTicketSigningKeys` (ticketing); `registerDevice`,
  `unregisterDevice`, `get/updateNotificationPreferences` (notification); `getMe` (identity).

---

## 4. Divergencias docs ↔ código y app ↔ landing/panel

| # | Divergencia | Evidencia |
|---|---|---|
| X1 | `AGENTS.md` del repo lista rutas que no existen: `app/settings/`(borrado en el working tree), `app/posts/[postId].tsx`, `app/registrations/[registrationId].tsx`, `app/assistant/`, `app/groups/…` (solo `index.tsx`) | `AGENTS.md` "Arquitectura y carpetas" vs `find app` |
| X2 | `AGENTS.md` menciona `src/offline/`, `src/ai/`, `src/sso/`, `src/stores/offline-queue`, `src/components/ui/virtual-list.tsx`, `public/manifest.webmanifest`, `sw/`, `.maestro/` y `QueryClient → I18n → Theme → Session → OfflineQueue; ErrorBoundary`: inexistentes. En su lugar existen `src/auth/` (handoff, pkce, refresh-token), `src/mocks/`, `src/features/*`, `feed-list.tsx`; el layout real es `SafeAreaProvider → GestureHandler → Keyboard → Query → Theme → BottomSheetModalProvider` (`app/_layout.tsx:56-72`) |
| X3 | `AGENTS.md` dice "`.env.example`: `EXPO_PUBLIC_USE_MOCKS` no existe" (no la lista) pero el código la usa y `deuda-tecnica.md`/`fase-1-alcance-y-contrato-local.md` no la citan; `EXPO_PUBLIC_BASE_DOMAIN` sí está en `.env.example` y falta en `AGENTS.md` | `.env.example:4,7` |
| X4 | `deuda-tecnica.md` E-1 afirma "UC-01…16, 24 en cliente, escáner UC-14, cola offline, PWA" a cargo del equipo; el estado real (este documento) es parcial. Los UC-03/14 dicen "pendiente de verificar / a cargo del equipo" sin fecha | `deuda-tecnica.md` §4 |
| X5 | `07-trazabilidad.md` marca RF como **I** (implementado) por backend; ninguno puede pasar a **V** desde la app | E-1 |
| X6 | `docs/tickets/` en el repo contiene copias `old/`, `ticket-reveal-modal (1).tsx`, `use-ticket-sounds (1).ts` (referencias del equipo, excluidas de lint/tsc) | `docs/tickets/` |
| X7 | `AGENTS.md` pide `.native/.web` por plataforma y `Maestro` UC-05/UC-12; ninguno de los flujos existe | — |
| X8 | `locales/ios/{es,en}.json` (permisos iOS, `app.config.ts:18-21`) están fuera de `locales/{es,en}` y del `i18n:check` | `locales/ios/` |
| X9 | **App vs landing/panel:** landing y shell usan `@bandada/i18n` con `i18n:check` propio con `--src` (detecta texto literal en fuente) y pruebas (`bandadau-landing/src/components/components.test.tsx`, vitest); la app llama el CLI sin `--src`, sin pruebas. La landing usa tokens vía CSS (`src/lib/theme.ts`), la app vía NativeWind `vars()` + `useTokens()`: ambos derivan de `@bandada/ui-tokens` (consistente). Ni landing ni panel tienen deep-link desde/hacia la app verificado (UC-03) |

---

## 5. Plan de ajustes

Prefijos: **A-n** = qué hacer (faltante), **B-n** = qué cambiar (incumplimiento/corrección), **C-n** = qué actualizar (docs, contratos,
AGENTS.md, tests). Prioridad: **P1** antes de la entrega (10-nov-2026), **P2** si hay tiempo, **P3** fase 2. Esfuerzo: **S** (<½ día),
**M** (½-2 días), **L** (>2 días). Repo afectado entre corchetes.

### 5.1 Qué hacer (faltante)

| ID | Prio | Repo | Qué hacer | Esf. | Criterio de aceptación |
|---|---|---|---|---|---|
| A-1 | P1 | frontend | UC-05: flujo publicar real (`createUpload` → subida a URL prefirmada → `completeUpload` → `createPost` con `clientId` UUIDv7 e `Idempotency-Key` estable), pre-chequeo de imagen que solo avisa, error `MEDIA_REJECTED` | L | Maestro `uc05` publica con backend real; en modo avión queda en cola (A-4) y se envía al volver la red; sin `mockNote` |
| A-2 | P1 | frontend | UC-07: reacciones (`setReaction`/`removeReaction`) con actualización optimista y rollback; botón de like funcional; `clientId` en comentarios | M | Like/unlike persiste y se refleja en feed y detalle; prueba RNTL del rollback |
| A-3 | P1 | frontend | UC-08 y UC-10: seguir/dejar de seguir (+ sugerencias) y denunciar contenido (sheet con motivo vía `usePresentableSheet`) | M | Botones en perfil y post llaman a `followUser`/`reportContent`; textos es/en; estados de error |
| A-4 | P1 | frontend | Cola offline (T7/T8): `src/offline/outbox-queue.{native,web}.ts` (expo-sqlite / IndexedDB), `sync.ts` con NetInfo, backoff exponencial, máx. 5 intentos → "requiere atención", `clientId` + `idempotencyKey` generados al crear y reutilizados | L | Prueba unitaria: 5 fallos → estado `NEEDS_ATTENTION`; la misma clave se envía en cada reintento; Maestro modo avión (UC-05) verde |
| A-5 | P1 | frontend | UC-14: escáner real con `expo-camera` (plugin + permiso i18n), `validateTicket`, resultado por `code`, guarda por rol portero/organizador | L | Escanear un QR emitido por `make seed` devuelve válido y un segundo escaneo "ya usado"; flujo Maestro `uc14` |
| A-6 | P1 | frontend | UC-13: cancelar inscripción (`cancelRegistration`), estado `CANCELLATION_PENDING`, reembolso visible en billetera; `registrations/me` en "Mis inscripciones" | M | Cancelar libera el cupo y aparece el movimiento de reembolso |
| A-7 | P1 | frontend | UC-12: polling de `getRegistration` leyendo `Retry-After` (mín 1 s, máx 5 s, tope total), pantalla `app/registrations/[registrationId].tsx` y reanudación al reabrir la app; clave estable por intención | M | Prueba con `Retry-After` simulado; cerrar y reabrir mantiene el seguimiento |
| A-8 | P1 | frontend | UC-02: invocar `restoreSession()` al arrancar, guardas de ruta (anónimo → auth, autenticado → tabs), eliminar el modo invitado simulado o limitarlo a `__DEV__` | M | Cold start con refresh válido abre feed sin login; sin sesión redirige a `welcome` |
| A-9 | P1 | frontend | Pruebas: Jest/RNTL para `api-client`, `http`, `use-infinite-list`, `ApiError`, `media-ratio`, formularios de auth; flujos Maestro `uc02`, `uc05`, `uc12`, `uc14` | L | `pnpm test` ejecuta ≥ 25 pruebas verdes; `.maestro/` con 4 flujos documentados |
| A-10 | P1 | frontend | PWA (T5/D6): `public/manifest.webmanifest`, service worker Workbox, iconos, `display: standalone`, página offline; Playwright para instalación y modo sin red | L | Lighthouse PWA instalable; Playwright "carga offline del shell" verde |
| A-11 | P2 | frontend | UC-24: registrar token (`registerDevice`) con `expo-notifications`, preferencias de notificación, deep link desde push a la ruta destino | M | Un push de prueba abre el evento/ticket correspondiente |
| A-12 | P3 | frontend | UC-17 asistente offline: `app/assistant/`, `src/ai/local-llm.{native,web}.ts`, descarga bajo demanda con progreso y espacio libre | L | Responde sin red tras descargar el modelo; nunca en el bundle |
| A-13 | P2 | frontend | UC-09 completo (crear grupo, detalle, salir, miembros, posts) y UC-11 (crear/publicar evento para `ORGANIZER`) | L | Formularios con `react-hook-form` + `zod`, contrato verificado |
| A-14 | P2 | frontend | `ErrorBoundary` por ruta y raíz, banner "sin conexión", botón "Reintentar" en detalle de evento y ticket | S | Un error de render muestra la pantalla de recuperación traducida |
| A-15 | P2 | frontend | Persister de TanStack Query (MMKV nativo / IndexedDB web) y `gcTime` acorde | M | Abrir la app en modo avión muestra el último feed y la billetera |
| A-16 | P2 | frontend | UC-04: cablear idioma/tema a `updateMyPreferences`, ver perfil ajeno con `getProfile`, mostrar `avatarStatus` cuando exista (D-9) | M | Cambiar idioma/tema en un dispositivo se refleja tras iniciar sesión en otro |

### 5.2 Qué cambiar (incumplimientos / correcciones)

| ID | Prio | Repo | Qué cambiar | Esf. | Criterio de aceptación |
|---|---|---|---|---|---|
| B-1 | **P1** | frontend | **Enviar `Authorization`**: en `apiRequest` fijar `auth` (`options.auth !== false`) dentro de `frozen` o que `buildHeaders` use `options.auth !== false` (`src/lib/http.ts:37`, `src/lib/api-client.ts:85-97`); mantener el reintento tras refresh | S | Prueba unitaria: petición sin `auth` explícito lleva `Bearer`; `auth: false` no lo lleva; un 401 con token expirado se recupera |
| B-2 | **P1** | frontend | **`Accept-Language` siempre**: aplicar `locale` en ambas ramas de `frozen` (`api-client.ts:87-90`) | S | Prueba: toda petición (incluidas mutaciones idempotentes) incluye la cabecera |
| B-3 | **P1** | frontend | **Mocks opt-in**: `useMocks` solo con `EXPO_PUBLIC_USE_MOCKS === 'true'` (no por `__DEV__`, `src/lib/env.ts:9`); mocks fuera del bundle de producción; documentar en `.env.example` | S | Sin la variable, ninguna petición pasa por `resolveMock`; `build:web` no incluye `src/mocks` |
| B-4 | P1 | frontend | **Idempotencia estable**: no regenerar `idempotencyKey` en reintentos tras fallo (`app/(tabs)/wallet.tsx:37`, `register.tsx:63`, `events/[eventId].tsx:58`); regenerar solo ante una nueva intención (cambio de paquete/evento/datos); usar UUIDv7 | M | Dos reintentos del mismo intento envían la misma `Idempotency-Key` (prueba) |
| B-5 | P1 | frontend | **Endpoint fuera de contrato**: `GET /profiles/{userId}/posts` (`src/features/profile/api.ts:32`): o se añade primero al OpenAPI social (C-3) o se usa un endpoint existente | S | `contracts-lint` verde y la app solo consume operaciones del contrato |
| B-6 | P1 | frontend | **`i18n:check` verde**: generar `locales/{es,en}/errors.json` desde `@bandada/i18n` (o ajustar el script para que `--contracts` use el catálogo compartido) | S | `pnpm i18n:check` sale con 0 errores |
| B-7 | P1 | frontend | Texto literal: `accessibilityLabel="Cargando"` → `t()` (`BandadaLogo.tsx:216`); quitar `mockNote` y claves de mockup (`locales/*/create.json`) cuando A-1 exista | S | 0 literales con la búsqueda de `accessibilityLabel="` |
| B-8 | P2 | frontend | Colores: reemplazar `rgba(0,0,0,0.06)` (`post-card.tsx:116`, `post-card-skeleton.tsx:55`) por un token de sombra; tokenizar la paleta de `BandadaLogo`/`app.config.ts` o documentarlas como excepción de marca | S | Búsqueda de `rgba(`/`#` en `app/` y `src/` solo devuelve la excepción documentada |
| B-9 | P2 | frontend | React Compiler: eliminar `useMemo/useCallback/memo` reflejo listados en A4; conservar y comentar los justificados (gorhom, `usePresentableSheet`) | M | Auditoría de `useMemo|useCallback|memo(` sin usos sin justificar; sin regresión visual |
| B-10 | P2 | frontend | Crear/renombrar `src/components/ui/virtual-list.tsx` (`VirtualList`) y reutilizarlo en perfil/ticket en lugar de `ScrollView` donde haya colecciones | S | Todas las listas largas pasan por `VirtualList` |
| B-11 | P2 | frontend | Pasar `signal` de TanStack a `apiRequest` y tratar `isAbortError` en las mutaciones; añadir claves de query faltantes (`profile.posts`) | S | Cambiar de pantalla cancela la petición sin error visible |
| B-12 | P2 | frontend | Accesibilidad: `accessibilityRole` y `accessibilityLabel` en todos los `Pressable`/`TextInput` (`app/profile/edit.tsx`), constante de objetivo táctil ≥ 44 pt | M | Lint de a11y/RNTL `getByRole` pasan; auditoría VoiceOver/TalkBack documentada |
| B-13 | P2 | frontend | Mostrar errores por `code` en todas las mutaciones (comentarios, grupos, perfil, recarga) con el mismo helper | S | Provocar `VALIDATION_FAILED` muestra mensaje traducido |
| B-14 | P2 | frontend | Eliminar `docs/tickets/*(1)*` duplicados o moverlos a `bandadau-docs` | S | Sin copias duplicadas en el repo |

### 5.3 Qué actualizar (documentación, contratos, AGENTS.md, tests)

| ID | Prio | Repo | Qué actualizar | Esf. | Criterio de aceptación |
|---|---|---|---|---|---|
| C-1 | P1 | frontend | `AGENTS.md`: reflejar el árbol real (`src/auth/`, `src/mocks/`, `feed-list.tsx`, sin `settings/`, `.maestro`, `offline/`, `ai/` hasta que existan), marcar pendientes y la variable `EXPO_PUBLIC_USE_MOCKS`/`EXPO_PUBLIC_BASE_DOMAIN` | S | Cada ruta/carpeta citada existe o está marcada "pendiente" con enlace a este documento |
| C-2 | P1 | docs | `deuda-tecnica.md`: enlazar esta auditoría y desglosar E-1…E-3 en los IDs A/B/C | S | E-1…E-3 referencian A-n/B-n |
| C-3 | P1 | docs | Decidir y documentar `listUserPosts` (`GET /profiles/{userId}/posts` o `GET /posts?authorId=`) en `contracts/openapi/social-service.yaml`; actualizar UC-04 | S | `make contracts-lint` verde; UC-04 secuencia consistente |
| C-4 | P1 | docs | `07-trazabilidad.md`: añadir columna/nota "verificado en app" por RF; UC-03, UC-14 con estado de cliente real | S | Ningún RF en **V** sin prueba de la app |
| C-5 | P2 | docs | `definition-of-done.md` §4: añadir criterio "mocks desactivados en build de producción" y "idempotencia estable en reintentos" | S | Ítems presentes y verificables |
| C-6 | P2 | docs | `ia-local-y-offline.md`: aclarar el estado actual (sin cola/persister) y el orden de entrega A-4 → A-15 → A-12 | S | Documento enlaza al plan |
| C-7 | P2 | shared | `@bandada/contracts-ts`: usar los tipos generados en la app (B-5/A-1) y exponer `errors.json` listo para apps (B-6) | M | `src/features/*/types.ts` reemplazados por importaciones de `@bandada/contracts-ts` |
| C-8 | P2 | frontend | Añadir `i18n:check` con `--src` (detecta literales) igual que landing/panel | S | CI falla ante un literal nuevo |
| C-9 | P3 | docs | `roadmap-y-sprints.md`/`backlog.md`: reflejar el plan A/B/C con fechas hacia el 10-nov | S | Backlog contiene A-1…A-16 |

### 5.4 Orden sugerido

1. **Primero (≈ 1 día):** B-1, B-2, B-3, B-6, B-5/C-3 → la app puede hablar con el backend real y el CI pasa a verde real.
2. **Luego:** A-8, B-4, A-7 (sesión, idempotencia, polling), A-9 (pruebas mínimas) → UC-01/02/12/15/16 verificables.
3. **Después:** A-1, A-4, A-2, A-3, A-6, A-5 (escritura, offline, escáner).
4. **Cierre:** A-10 (PWA), A-14, A-15, C-1…C-4 y registro de sesión.
5. **Fase 2:** A-12 (UC-17), A-11.

> Nota: el árbol de trabajo del equipo tiene cambios sin commitear (menú de perfil/ajustes, skeletons, selector de media);
> las líneas citadas corresponden a ese estado a 2026-10-15 y pueden moverse al commitearlo.
