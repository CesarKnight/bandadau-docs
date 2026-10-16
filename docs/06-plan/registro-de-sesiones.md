# Registro de sesiones

Bitácora de *handoff* entre sesiones de trabajo (personas y agentes de IA). **Toda sesión
termina agregando una entrada** (regla 11 del `AGENTS.md` del workspace). La siguiente sesión lee las últimas
entradas antes de empezar (paso 8 del orden de lectura).

Reglas:

- Entradas en orden cronológico **descendente** (la más reciente arriba, debajo de la plantilla).
- Una entrada por sesión y por agente; si varios agentes trabajan en paralelo, cada uno agrega
  la suya (sin editar las ajenas).
- Ser concreto: rutas de archivo, IDs de UC/RF/HU, `operationId`, tipos de evento.
- Las decisiones menores tomadas sin consultar se anotan aquí; las de arquitectura van a un ADR
  y aquí solo se enlazan.
- Lo que quede en **Pendientes** o **Bloqueos** debe poder tomarlo otra persona/agente sin
  contexto adicional.

---

## Plantilla

```markdown
### AAAA-MM-DD — <título corto de la sesión>

| Campo | Valor |
|---|---|
| Agente / persona | p. ej. Claude Code (Opus) · supervisado por <nombre> |
| Rama | `feat/<area>-<slug>` |
| Objetivo | Una frase |
| UCs / HU | UC-xx (estado antes → después), HU-xx |
| Componentes | `bandadau-backend/services/<x>`, `bandadau-docs/contracts/...` |

**Archivos tocados**
- `ruta/archivo` — qué cambió

**Decisiones**
- Decisión — motivo (ADR-xxxx si aplica)

**Pendientes**
- [ ] Tarea concreta (dueño sugerido)

**Bloqueos / preguntas abiertas**
- Pregunta — a quién

**Verificación**
- Comandos ejecutados y resultado (`make test S=...`, `make contracts-lint`, ...)
```

---

## Entradas

### 2026-10-15 — Consolidación de contratos y documentación tras la fase 1 (ADR-0018)

**Agente:** Claude Code (consolidador de `bandadau-docs`) · **Objetivo:** que contratos y documentos describan lo implementado en la fase 1 (`make smoke` 26/26); el código que funciona es la referencia de hecho.

**Archivos tocados (solo `bandadau-docs`)**
- Contratos (versión y changelog subidos): AsyncAPI 1.2.0 (`issue-ticket` con `organizerId`/`staffUserIds`/`eventEndsAt`, `idempotencyKey` en respuestas SAGA, `x-delivery-limit` 10, reintentos 5 s/30 s/5 min, `AUTHOR_SUSPENDED` confirmado); OpenAPI identity 1.2.0, events 1.2.0, social 1.3.0, media 1.2.0, wallet 1.1.0, ticketing 1.2.0, notification 1.2.0 y `shared/components.yaml` 1.2.0; GraphQL 1.2.0 (`updateUniversity`, códigos de negocio, filtros reales de la cola, auth del WebSocket).
- Documentos: `seguridad-y-sso.md`, `idempotencia.md`, `api-rest-guidelines.md`, `graphql-admin.md`, catálogo (mongo 8.0.19, pgsty/minio), UC-01/02/03/14/15/21/24, modelo de dominio, `entornos-y-variables.md` e `infraestructura.md` (reflejan `bandadau-infra` real), ADR-0018 (+ índice), `07-trazabilidad.md` (§1.1 con evidencia del smoke), roadmap, backlog y estados de los 24 UC (UC-01…16, 18, 21, 24 «Implementado (fase 1)»; UC-17, 19, 20, 22, 23 «Pendiente fase 2»).
- Nuevo: `docs/06-plan/deuda-tecnica.md` (todo lo que queda pendiente de código).

**Decisiones**
- Contrato = código donde el código es correcto: claims JWT (`typ=user|service`, `aud=bandada-*`, `uni`), cookies de refresh `bandada_rt`/`bandada_admin_rt` con `X-Bandada-Client`, `IDEMPOTENCY_KEY_REQUIRED`, `registerUser` 201, `HANDOFF_CODE_INVALID` 401, `INVALID_REFRESH_TOKEN`, `UNIVERSITY_DOMAIN_TAKEN` (no `DOMAIN_ALREADY_ASSIGNED`), webhook de wallet con `occurredAt` y `WEBHOOK_EXPIRED`, `TOPUP_NOT_FOUND` 404, `PAYMENT_SIMULATOR_ENABLED`, `deepLink` con base http.
- Contrato por delante del código (pendiente de código, ver `deuda-tecnica.md`): `endsAt` en `createEvent`, `updateUniversity` en el gateway, scopes en `/internal`.
- El WebSocket del gateway solo usa `connectionParams.Authorization`; `{accessToken, locale}` se tolera pero no se usa.

**Verificación**
- Spectral 6 sobre `contracts/openapi/*.yaml`: 0 errores; `@asyncapi/cli validate`: válido; SDL GraphQL válido (`graphql` 16 `buildSchema`); `tools.schema.json` JSON válido; enlaces relativos: ver resultado en el commit final.

**Pendientes:** ver `deuda-tecnica.md` (sincronizaciones S-1…S-4 en gateway/shared/admin, D-1…D-17, I-1…I-5, E-1…E-3).

---

### 2026-10-15 — App: feed del usuario, menú de perfil, header con atrás y eventos

| Campo | Valor |
|---|---|
| Agente / persona | opencode (Deepseek v4.1 flash) |
| Rama | `main` (`bandadau-frontend`) |
| Objetivo | Mejorar perfil/feed del usuario, menú de opciones, headers y eventos (web) |
| UCs / HU | UC-04, UC-06, UC-11 |
| Componentes | `bandadau-frontend` |

**Cambios**
- `app/profile/[userId].tsx`: layout **responsive igual al feed** (header full-width con atrás, columna centrada `maxWidth 480`, right rail) y **scroll al post tocado** (`postId` → `scrollToIndex`, `viewPosition 0.3`; `onScrollToIndexFailed` → `scrollToOffset`).
- `app/(tabs)/profile.tsx`: la **grilla usa los posts reales** del usuario (`useUserPosts`); al tocar uno navega al feed con `postId`. Botón **⋯** que abre el menú.
- `src/features/profile/components/profile-menu*.tsx`: menú de opciones (**Editar perfil, Configuración, Abrir panel** si MODERATOR/ADMIN, **Cerrar sesión**) — bottom sheet nativo/web-móvil, **popover anclado al botón ⋯** en web desktop.
- `app/(tabs)/profile.tsx`: se quitaron los botones inline (Editar/Ajustes) — ahora viven en el menú; el botón **⋯** queda en la **esquina superior derecha de la portada** (`top: 8`, `right: 12`; se corregía el doble inset).
- `src/components/screens/app-header.tsx` (nuevo) y `Screen` con **`showBack`**: norma de que las pantallas secundarias (perfil/editar, ajustes, tickets, grupos, notificaciones, evento, escáner) tengan botón atrás.
- `src/components/ui/feed-list.tsx`: `numColumns`/`columnWrapperStyle`, `listRef` y `onScrollToIndexFailed`.
- `app/(tabs)/events.tsx`: header + columna centrada y **grilla de 2 columnas en web** (aprovecha el ancho).
- i18n `app.back`, `profile.menu.*`.

**Verificación**
- `pnpm typecheck` ✅ · `pnpm lint` ✅ · `expo export -p web` ✅ · `expo export -p ios` ✅.

---

### 2026-10-14 — Publicación de los repos en GitHub (ThonkasM)

| Campo | Valor |
|---|---|
| Agente / persona | opencode (Deepseek v4.1 flash) |
| Rama | `main` (frontend: `feat/mobile-bootstrap`) |
| Objetivo | Crear los repositorios en GitHub y subir el historial inicial |
| UCs / HU | — (plataforma) |
| Componentes | los 9 repos del workspace |

**Hecho**
- Commits pendientes cerrados antes de subir: `bandadau-backend` (servicios), `bandadau-admin` (shell + mfe-moderation), `bandadau-landing`, `bandadau-infra` (mock/). `bandadau-brand` se **inicializó como repo git** (no lo era).
- `.gitignore` de `bandadau-backend`: se excluyó `services/*/bin/` (clases `.class` compiladas) y `services/*/.deptrac.cache`.
- Creados y subidos (públicos, owner `ThonkasM`): `bandadau-{docs,shared,backend,frontend,admin,landing,infra,ml,brand}`. `bandadau-frontend` sube la rama **`feat/mobile-bootstrap`** (main queda en el commit inicial).

**Pendientes**
- [ ] Decidir si `feat/mobile-bootstrap` se fusiona a `main` en `bandadau-frontend`.
- [ ] Añadir CI por repo (`bandadau-infra/ci/templates` → `<repo>/.github/workflows/ci.yml`).
- [ ] Revisar si `bandadau-brand` entra en el catálogo/ADR del workspace (hoy es carpeta + repo nuevo).

**Verificación**
- `gh repo list ThonkasM` → los 9 repos `PUBLIC`; `git push -u` de cada rama OK.

---

### 2026-10-14 — Grilla del perfil y feed del usuario

| Campo | Valor |
|---|---|
| Agente / persona | opencode (Deepseek v4.1 flash) |
| Rama | `feat/mobile-bootstrap` (`bandadau-frontend`) |
| Objetivo | Arreglar la grilla del perfil y abrir el feed de un usuario al tocar un post |
| UCs / HU | UC-04, UC-06 |
| Componentes | `bandadau-frontend` |

**Causa (grilla no visible)**
- Los ítems eran `Image` **sin fondo**: si la imagen no cargaba, los cuadros quedaban invisibles. Se añadió `backgroundColor` (`bg.muted`) + `borderRadius`/`overflow`.

**Feed del usuario**
- `src/mocks/user-posts.ts` (nuevo) + `buildFeedItem` exportado de `mocks/feed.ts`: posts por autor.
- `src/features/profile/api.ts`: `useUserPosts(userId)` (cursor) contra `GET /api/v1/profiles/{userId}/posts` (**mock de Fase 1**; el endpoint real se agregará al contrato de `social-service`).
- `app/profile/[userId].tsx` (nuevo): feed del usuario (header con volver + nombre, `FeedList` + `PostCard` + panel de comentarios).
- `app/(tabs)/profile.tsx`: cada ítem de la grilla es `Pressable` → abre el feed del usuario (pasa `userId` y `name`).
- i18n `profile.{postsEmpty,back}`.

**Nota**
- `.expo/types` (typed routes) lo regenera el dev server; se eliminó el generado desactualizado.

**Verificación**
- `pnpm typecheck` ✅ · `pnpm lint` ✅ · `expo export -p web` ✅ · `expo export -p ios` ✅.

---

### 2026-10-14 — Formularios de auth: PasswordField, accesorio y auto-submit

| Campo | Valor |
|---|---|
| Agente / persona | opencode (Deepseek v4.1 flash) |
| Rama | `feat/mobile-bootstrap` (`bandadau-frontend`) |
| Objetivo | Mejorar los formularios de identidad |
| UCs / HU | UC-01, UC-02 |
| Componentes | `bandadau-frontend` |

**Archivos tocados**
- `src/components/ui/text-field.tsx`: prop `rightAccessory` (accesorio a la derecha del input).
- `src/components/ui/password-field.tsx` (nuevo): contraseña con **mostrar/ocultar**; usado en login y registro.
- `app/(auth)/verify-email.tsx`: **auto-submit** al completar los 6 dígitos (solo dígitos); botón sigue disponible.
- `locales/{es,en}/auth.json` (`showPassword`/`hidePassword`).

**Verificación**
- `pnpm typecheck` ✅ · `pnpm lint` ✅ · `expo export -p web` ✅ · `expo export -p ios` ✅.

---

### 2026-10-14 — react-native-keyboard-controller y ajustes de auth/Button

| Campo | Valor |
|---|---|
| Agente / persona | opencode (Deepseek v4.1 flash) |
| Rama | `feat/mobile-bootstrap` (`bandadau-frontend`) |
| Objetivo | Buen manejo del teclado (formularios y sheet) + cerrar ajustes de la sesión anterior |
| UCs / HU | UC-01, UC-02 |
| Componentes | `bandadau-frontend` |

**Cambios de la otra sesión (revisados y commiteados)**
- `app/(auth)/welcome.tsx`: "Iniciar sesión" `ghost` → `secondary`.
- `src/components/brand/brand-hero.tsx`: `height` excluye el inset (`minHeight: height + paddingTop`) y el mark escala.
- `src/components/ui/button.tsx`: `style` deja de ser función (`({pressed}) => …`) → `useState` + `onPressIn/Out`; borde para `variant !== 'primary'`; `alignSelf: stretch` + `minHeight` en `lg`.

**Teclado (`react-native-keyboard-controller@1.21.9`)**
- `app/_layout.tsx`: `KeyboardProvider` (dentro de `GestureHandlerRootView`).
- `src/components/screens/auth-layout.tsx`: `KeyboardAvoidingView` de la librería (behavior `padding`).
- `src/hooks/use-tab-bar-keyboard.{ts,native.ts}`: la tab bar se **oculta** con el teclado (UI thread vía `useReanimatedKeyboardAnimation`); aplicado en `floating-tab-bar.tsx`.
- `bandadau-frontend/AGENTS.md`: nota de teclado.

**Nota (revisión de NativeWind)**
- La app usa **`StyleSheet` + `useTokens()`** en todo (0 usos de `className`); NativeWind v4 está configurado pero no se usa. El `style` en forma de **función** en `Pressable` no se aplicaba bajo el `jsxImportSource: 'nativewind'` (runtime `react-native-css-interop`), de ahí el cambio a `useState`. Pendiente decidir: documentar la desviación (StyleSheet+tokens) o arreglar/migrar NativeWind.

**Verificación**
- `pnpm typecheck` ✅ · `pnpm lint` ✅ · `expo export -p web` ✅ · `expo export -p ios` ✅.
- **Requiere rebuild del dev client** (módulo nativo nuevo).

---

### 2026-10-14 — Auth con safe-area/insets y logo en registro

| Campo | Valor |
|---|---|
| Agente / persona | opencode (Deepseek v4.1 flash) |
| Rama | `feat/mobile-bootstrap` (`bandadau-frontend`) |
| Objetivo | Welcome/Login/Registro correctos en native (insets, Dynamic Island) y logo en registro |
| UCs / HU | UC-01, UC-02 |
| Componentes | `bandadau-frontend` |

**Archivos tocados**
- `src/components/brand/brand-hero.tsx`: prop `paddingTop` (inset superior) para que el logo no quede bajo la Dynamic Island.
- `src/components/screens/auth-layout.tsx` (nuevo): hero + formulario centrado, scrollable y keyboard-aware, respetando insets superior e inferior.
- `app/(auth)/welcome.tsx`: hero + contenido **scrollable** con insets (evita que los botones se recorten en pantallas chicas).
- `app/(auth)/login.tsx`, `register.tsx` (ahora con **logo** vía hero), `verify-email.tsx`: usan `AuthLayout`.

**Verificación**
- `pnpm typecheck` ✅ · `pnpm lint` ✅ · `expo export -p web` ✅ · `expo export -p ios` ✅.

---

### 2026-10-14 — Polyfill Intl.PluralRules (Hermes) para i18n

| Campo | Valor |
|---|---|
| Agente / persona | opencode (Deepseek v4.1 flash) |
| Rama | `feat/mobile-bootstrap` (`bandadau-frontend`) |
| Objetivo | Que las traducciones/plurals funcionen en native (Hermes) |
| UCs / HU | Transversal (i18n D14) |
| Componentes | `bandadau-frontend` |

**Causa**
- Hermes **no implementa `Intl.PluralRules`** (ni `Intl.RelativeTimeFormat`). i18next (v24+) e `intl-messageformat` (ICU) lo requieren → en native los plurales ICU fallaban.

**Archivos tocados**
- `package.json`: `intl-pluralrules` (incluye datos CLDR de todos los locales; solo parchea si falta).
- `app/_layout.tsx`: `import 'intl-pluralrules'` antes de inicializar i18n (junto con los guards de `@bandada/i18n` para `Intl.RelativeTimeFormat`).

**Verificación**
- `pnpm typecheck` ✅ · `pnpm lint` ✅ · `expo export -p web` ✅ · `expo export -p ios` ✅.

---

### 2026-10-14 — Compat Hermes (Intl) y versiones del SDK

| Campo | Valor |
|---|---|
| Agente / persona | opencode (Deepseek v4.1 flash) |
| Rama | `feat/mobile-bootstrap` (`bandadau-frontend`); `main` (`bandadau-shared`) |
| Objetivo | Arreglar crash en nativo (`Intl.RelativeTimeFormat`) y alinear dependencias del SDK |
| UCs / HU | UC-06, UC-07, UC-24 |
| Componentes | `bandadau-shared/packages/i18n`, `bandadau-frontend` |

**Causa**
- Hermes no implementa `Intl.RelativeTimeFormat`; `new Intl.RelativeTimeFormat()` lanzaba *"undefined cannot be used as a constructor"* al renderizar `PostCard` (`formatRelative`).

**Archivos tocados**
- `bandadau-shared/packages/i18n/src/format.ts`: guardas `hasIntl(...)` y **fallbacks** para `formatNumber`, `formatCredits`, `formatDate`, `formatDateTime` y `formatRelative` (funciona aunque el runtime no traiga `Intl`).
- `bandadau-frontend/package.json`: `react-native-svg@15.15.4` y `typescript@~6.0.3` (esperados por Expo SDK 57); `jest.setup.ts` sin `extend-expect` (RNTL v14 incluye los matchers).
- Requiere `pnpm install` en el frontend tras reconstruir `@bandada/i18n` (hard-link).

**Verificación**
- `pnpm --filter @bandada/i18n build` ✅ · frontend `typecheck` ✅ · `lint` ✅ · `expo export -p web` ✅ · `expo export -p ios` ✅ · `expo install --check` → *Dependencies are up to date*.

---

### 2026-10-14 — Welcome full-screen (sin sidebar) y acceso como invitado

| Campo | Valor |
|---|---|
| Agente / persona | opencode (Deepseek v4.1 flash) |
| Rama | `feat/mobile-bootstrap` (`bandadau-frontend`) |
| Objetivo | Welcome ocupa toda la pantalla en web sin la global sidebar; login/registro igual; botón invitado |
| UCs / HU | UC-01, UC-02, UC-03 |
| Componentes | `bandadau-frontend` |

**Archivos tocados**
- `app/_layout.tsx`: la global sidebar se oculta en rutas de auth (`/welcome`, `/login`, `/register`, `/verify-email`); el contenido pasa a full-width.
- `app/(auth)/welcome.tsx`: botón **"Ingresar como invitado"**.
- `src/stores/session.store.ts`: `guest` + `loginAsGuest()` (usuario placeholder, sin restricciones de momento).
- `locales/{es,en}/auth.json` (`welcome.guest`).
- `app/index.tsx`: el arranque en frío **siempre** va a Welcome (redirección directa, sin bloquear con `restoreSession` — en web ese `fetch` a `/auth/refresh` se colgaba sin backend); el feed se alcanza tras ingresar (login/registro/invitado).
- `app/_layout.tsx`: la sidebar también se oculta en `/`.

**Decisión**
- El invitado abre sesión local sin cuenta (`accessToken: null`, `guest: true`) y va al feed; se restringirá cuando existan los guards reales.

**Verificación**
- `pnpm typecheck` ✅ · `pnpm lint` ✅ · `expo export -p web` ✅ · `expo export -p ios` ✅.

---

### 2026-10-14 — Welcome y Login con hero de marca

| Campo | Valor |
|---|---|
| Agente / persona | opencode (Deepseek v4.1 flash) |
| Rama | `feat/mobile-bootstrap` (`bandadau-frontend`) |
| Objetivo | Branding en Welcome y Login con el logo y la paleta |
| UCs / HU | UC-01, UC-02, E18 |
| Componentes | `bandadau-frontend` |

**Archivos tocados**
- `src/components/brand/brand-hero.tsx` (nuevo): bloque de marca (azul río en claro / azul noche en oscuro) con el logo **invertido a blanco** + acento paraba; reutilizable.
- `app/(auth)/welcome.tsx`: hero + título/pitch/CTAs/términos.
- `app/(auth)/login.tsx`: hero (con subtítulo) + formulario.

**Verificación**
- `pnpm typecheck` ✅ · `pnpm lint` ✅ · `expo export -p web` ✅ · `expo export -p ios` ✅.

---

### 2026-10-14 — Notificaciones por tipo, perfil, crear y escáner

| Campo | Valor |
|---|---|
| Agente / persona | opencode (Deepseek v4.1 flash) |
| Rama | `feat/mobile-bootstrap` (`bandadau-frontend`) |
| Objetivo | Endurecer mockups: notificaciones, perfil, crear y escáner de tickets |
| UCs / HU | UC-04, UC-05, UC-14, UC-24 |
| Componentes | `bandadau-frontend` |

**Archivos tocados**
- `src/features/notifications/components/notification-item.tsx`: icono por `NotificationType` (mapa parcial con fallback).
- `app/(tabs)/profile.tsx`: portada, avatar con anillo de marca, stats con divisores, tabs Publicaciones/Guardados y grid; `profile.savedEmpty`.
- `app/(tabs)/create.tsx`: contador `n/2000` y chips de hashtags extraídos del texto.
- `app/scan.tsx` (UC-14, nuevo): marco de cámara + resultado simulado (válida/usada/firma inválida); namespace `scan`; botón "Escanear entrada" en `app/tickets/index.tsx`.
- `eslint.config.mjs`: ignora `plugins/**` (config plugins CommonJS); nota: se incorporó `plugins/with-ios-signing.js` + su entrada en `app.config.ts` (ya presentes en el repo).

**Verificación**
- `pnpm typecheck` ✅ · `pnpm lint` ✅ · `expo export -p web` ✅ · `expo export -p ios` ✅.

---

### 2026-10-14 — Respuestas plegables (10/hide) y mockups más sólidos

| Campo | Valor |
|---|---|
| Agente / persona | opencode (Deepseek v4.1 flash) |
| Rama | `feat/mobile-bootstrap` (`bandadau-frontend`) |
| Objetivo | Respuestas con "ver más" (10) y ocultar; endurecer mockups de las demás pantallas |
| UCs / HU | UC-06, UC-07, UC-09, UC-11, UC-12, UC-15, UC-16 |
| Componentes | `bandadau-frontend` |

**Archivos tocados**
- `src/features/comments/components/comment-thread.tsx`: muestra 2 respuestas, **"Ver 10 respuestas"** por lotes y **"Ocultar respuestas"**; `locales/{es,en}/comments.json` (`viewReplies`/`hideReplies`).
- Eventos: `src/features/events/components/event-card.tsx` (cover real con `expo-image`, badge de fecha y de precio), `app/events/[eventId].tsx` (cover).
- Billetera: `app/(tabs)/wallet.tsx` (saldo con icono, **paquetes como tarjetas** con créditos y precio en BOB vía `formatNumber`, movimientos).
- Tickets: `src/features/tickets/components/ticket-card.tsx` (badge de estado con color), `app/tickets/[ticketId].tsx` (look de ticket con separador punteado).
- Grupos: `app/groups/index.tsx` (botón "Crear grupo"); i18n `wallet.packages`, `groups.create`.

**Verificación**
- `pnpm typecheck` ✅ · `pnpm lint` ✅ · `expo export -p web` ✅ · `expo export -p ios` ✅.

---

### 2026-10-14 — Comentarios (scroll + ver respuestas) y nav bar que se encoge

| Campo | Valor |
|---|---|
| Agente / persona | opencode (Deepseek v4.1 flash) |
| Rama | `feat/mobile-bootstrap` (`bandadau-frontend`) |
| Objetivo | Ver el scroll del sheet con muchos comentarios/respuestas y el colapso de la tab bar |
| UCs / HU | UC-06, UC-07 |
| Componentes | `bandadau-frontend` |

**Archivos tocados**
- `src/mocks/comments.ts`: 12 comentarios raíz + respuestas (para probar scroll y expandir) en todos los posts (incl. el de Lucía Pérez).
- `src/features/comments/components/comment-thread.tsx`: muestra 2 respuestas y **"Ver N respuestas"** para expandir; `locales/{es,en}/comments.json` (`viewReplies` ICU).
- Nav bar estilo Homy: `src/components/navigation/tab-bar-collapse.tsx` (provider + `useTabBarOnScroll`/`useTabBarCollapse`), `floating-tab-bar.tsx` (encoge con `withSpring`, respeta `useReducedMotion`), `custom-tabs.tsx` (envuelve con el provider y resetea al cambiar de ruta), `feed-list.tsx` (conecta `onScroll`).
- `eslint.config.mjs`: `react-hooks/immutability` off (la regla del React Compiler no entiende los shared values de Reanimated).

**Verificación**
- `pnpm typecheck` ✅ · `pnpm lint` ✅ · `expo export -p web` ✅ · `expo export -p ios` ✅.

---

### 2026-10-14 — Media a todo el ancho y reapertura del bottom sheet

| Campo | Valor |
|---|---|
| Agente / persona | opencode (Deepseek v4.1 flash) |
| Rama | `feat/mobile-bootstrap` (`bandadau-frontend`) |
| Objetivo | Card con imagen full-bleed y bottom sheet que reabre tras cerrarse |
| UCs / HU | UC-06, UC-07 |
| Componentes | `bandadau-frontend` |

**Archivos tocados**
- `src/features/feed/components/post-card.tsx`: el carrusel de media ocupa **todo el ancho** de la card (se quitó el `marginHorizontal`/borde del contenedor).
- `src/hooks/use-presentable-sheet.ts` (nuevo, patrón de Homy): `present()` en `requestAnimationFrame`, `isPresentedRef` + `justPresentedRef` para ignorar el `onChange` espurio de gorhom v5, cierre por `dismiss()`. **Resuelve el bug de que el sheet no volvía a abrirse tras quitarlo.**
- `src/features/comments/comments-sheet.tsx`: usa `usePresentableSheet` (`onChange`/`onDismiss`); el botón X solo llama `onClose()`; altura inicial del sheet a **90%** con **`enableDynamicSizing={false}`** (por defecto `true` ignoraba los `snapPoints` y abría pequeño); composer **fuera** de `BottomSheetFlatList` (fijo abajo).
- `bandadau-frontend/AGENTS.md`: nota de bottom sheets ampliada (usar `usePresentableSheet`).

**Verificación**
- `pnpm typecheck` ✅ · `pnpm lint` ✅ · `expo export -p web` ✅ · `expo export -p ios` ✅.

---

### 2026-10-14 — Ratios IG, swipe, bottom sheet con gorhom en web móvil y flechas solo desktop

| Campo | Valor |
|---|---|
| Agente / persona | opencode (Deepseek v4.1 flash) |
| Rama | `feat/mobile-bootstrap` (`bandadau-frontend`) |
| Objetivo | Convención de ratios de Instagram, arreglar el índice por swipe, y usar gorhom en web móvil |
| UCs / HU | UC-05, UC-06, UC-07 |
| Componentes | `bandadau-frontend` |

**Archivos tocados**
- `src/lib/media-ratio.ts` (nuevo): ratios IG — retrato **4:5**, paisaje **1.91:1**, cuadrado **1:1**; `src/features/feed/components/post-carousel.tsx` deriva el ratio de la primera imagen (`expo-image onLoad`) y actualiza el índice con `onScroll` (antes solo con `onMomentumScrollEnd`, por eso el swipe no movía los puntos).
- `src/hooks/use-device-type.ts` (nuevo): `isWebMobile`/`isWebDesktop`; **flechas del carrusel solo en web desktop**.
- `src/features/comments/comments-sheet.tsx` (nuevo): bottom sheet **`@gorhom/bottom-sheet`** compartido; `comments-panel.native.tsx` lo reexporta y `comments-panel.web.tsx` lo usa en **web móvil** (web desktop sigue con modal IG). **Corrección:** antes web móvil usaba un modal propio; Homy usa gorhom también en web móvil.
- `app/(tabs)/feed.tsx`: separación entre header y feed (`paddingTop: 12`) y columna web a 480 (menos alto); `locales/{es,en}/create.json` (orientaciones 4:5/1.91:1/1:1).
- `bandadau-frontend/AGENTS.md`: nota de bottom sheets (gorhom nativo + web móvil; modal en web desktop) y ratios IG.

**Convención anotada (futuras implementaciones)**
- Bottom sheets: **siempre `@gorhom/bottom-sheet`** en nativo y web móvil; web desktop → modal centrado (patrón Homy). Dividir por plataforma con `.native.tsx`/`.web.tsx` y, en web, por ancho con `useDeviceType()`.

**Verificación**
- `pnpm typecheck` ✅ · `pnpm lint` ✅ · `expo export -p web` ✅ · `expo export -p ios` ✅.

---

### 2026-10-14 — Ratio real de media y recuadro guía de recorte

| Campo | Valor |
|---|---|
| Agente / persona | opencode (Deepseek v4.1 flash) |
| Rama | `feat/mobile-bootstrap` (`bandadau-frontend`) |
| Objetivo | Que el media use su relación de aspecto real y mostrar la guía de recorte al subir |
| UCs / HU | UC-05, UC-06, UC-07 |
| Componentes | `bandadau-frontend` |

**Archivos tocados**
- `src/features/feed/components/post-carousel.tsx`: el contenedor toma el `aspectRatio` de la **primera imagen** (medido con `expo-image onLoad`), como Instagram; ya no fuerza 1:1 (evita recortes; la modal web de comentarios muestra el contenido completo).
- `src/features/create/components/media-preview.tsx` (nuevo): `targetRatio` (vertical 3:4 / horizontal 4:3 / cuadrada 1:1) y `MediaPreviewFrame` (marco + guía punteada + etiqueta de orientación).
- `app/(tabs)/create.tsx`: picker mock (alterna 3:4 y 4:3) y vista previa del resultado.
- `src/mocks/feed.ts`: imágenes con orientaciones variadas; `locales/{es,en}/create.json` (orientation/preview/remove).

**Convención de recorte**
- Retrato → **3:4**, paisaje → **4:3**, cuadrado → **1:1** (como se pidió). Nota: Instagram hoy usa 4:5 en retrato; se deja 3:4 por decisión del equipo.

**Verificación**
- `pnpm typecheck` ✅ · `pnpm lint` ✅ · `expo export -p web` ✅ · `expo export -p ios` ✅.

---

### 2026-10-14 — Fix nav web + scroll del feed y card de post moderna

| Campo | Valor |
|---|---|
| Agente / persona | opencode (Deepseek v4.1 flash) |
| Rama | `feat/mobile-bootstrap` (`bandadau-frontend`) |
| Objetivo | Arreglar la navegación en web, el scroll del feed en PC y dar estilo propio a la card |
| UCs / HU | UC-06, UC-07 |
| Componentes | `bandadau-frontend` |

**Archivos tocados**
- `src/components/navigation/floating-tab-bar.tsx`: `href: null` en `PlatformPressable` (fix de Homy: evita el `preventDefault` del `<a>` que impedía navegar con `TabTrigger` en web).
- `src/components/ui/feed-list.tsx` + `src/components/screens/screen.tsx` + `app/(tabs)/feed.tsx`: `minHeight: 0` en la cadena flex (web) para que la lista scrollee internamente en vez de empujar la página.
- **Causa real del no-scroll (web y nativo):** `alignSelf: 'center'` en la columna del feed anulaba el `stretch` vertical → la lista quedaba sin altura acotada. Se quitó `alignSelf`/`width` de la columna.
- `src/features/feed/components/post-card.tsx`: card moderna con estilo propio (borde+radio+shadow, avatar con anillo de marca, media inset redondeada) manteniendo funcionalidades IG.

**Verificación**
- `pnpm typecheck` ✅ · `pnpm lint` ✅ · `expo export -p web` ✅ · `expo export -p ios` ✅.

---

### 2026-10-14 — Comentarios (UC-07): sheet nativo, modal IG en web y respuestas

| Campo | Valor |
|---|---|
| Agente / persona | opencode (Deepseek v4.1 flash) |
| Rama | `feat/mobile-bootstrap` (`bandadau-frontend`); `main` (`bandadau-docs`/`bandadau-shared`) |
| Objetivo | Mostrar comentarios (nativo: bottom sheet; web: modal IG) con respuestas y aprovechar el espacio en web |
| UCs / HU | UC-07 |
| Componentes | `bandadau-docs/contracts`, `bandadau-shared/contracts-ts`, `bandadau-frontend` |

**Contrato (contract-first)**
- `social-service.yaml` 1.1.0 → **1.2.0**: `Comment.parentId` + `Comment.replyCount`, `CreateCommentRequest.parentId` (respuestas, un nivel). Changelog actualizado.
- `contracts-ts` regenerado (`pnpm contracts:gen`) y compilado.

**Frontend**
- `src/features/comments/{types,api}.ts` (`useComments`, `useCreateComment`, `groupThreads`), `components/{comment-thread,comment-composer}.tsx`, `comments-panel.{tsx,native.tsx,web.tsx}` (split por plataforma como Homy).
- Nativo: `@gorhom/bottom-sheet` (`BottomSheetModal` + `BottomSheetFlatList` + `BottomSheetTextInput`, `keyboardBehavior="interactive"`, backdrop, snap 80%). Deps nuevas: `@gorhom/bottom-sheet@5.2.14`, `react-native-gesture-handler@~2.32.0`; `GestureHandlerRootView` + `BottomSheetModalProvider` en `app/_layout.tsx`.
- Web: modal centrado con panel izquierdo (carrusel de medios) y derecho (comentarios con scroll + composer).
- Feed: `PostCard` abre comentarios (icono + contador); `FeedRightRail` (perfil + sugerencias) en web ≥1200px para aprovechar el espacio.

**Verificación**
- `pnpm typecheck` ✅ · `pnpm lint` ✅ · `expo export -p web` ✅ · `expo export -p ios` ✅ (bundle nativo con gorhom/reanimated).

**Pendiente**
- [ ] Probar el sheet en dispositivo (gestos/teclado) — no validado en device todavía.

---

### 2026-10-14 — Feed responsive + carrusel Instagram y datos con imágenes

| Campo | Valor |
|---|---|
| Agente / persona | opencode (Deepseek v4.1 flash) |
| Rama | `feat/mobile-bootstrap` (`bandadau-frontend`) |
| Objetivo | Feed responsive (columna web), imágenes y carrusel estilo Instagram con flechas en web |
| UCs / HU | UC-05/UC-06 |
| Componentes | `bandadau-frontend` |

**Archivos tocados**
- `src/features/feed/components/post-carousel.tsx` (nuevo): pager `ScrollView` paging con puntos + flechas en web (patrón de `property-detail/image-carousel` de Homy, adaptado a tokens).
- `src/features/feed/components/post-card.tsx`: usa `PostCarousel`; `app/(tabs)/feed.tsx`: columna centrada `maxWidth 560` en web.
- `src/mocks/feed.ts`: imágenes aleatorias deterministas (picsum por seed), 1–4 por post; `src/features/feed/types.ts` (`PostMedia`); `locales/{es,en}/feed.json` (`previous`/`next`).

**Decisión**
- Placeholder de imágenes vía `picsum.photos` (seeded) para mockups; se sustituirá por `media-service`/`expo-image` con URLs reales.

**Verificación**
- `pnpm typecheck` ✅ · `pnpm lint` ✅ · `expo export -p web` ✅.

---

### 2026-10-14 — Tema oscuro navy de marca y logo invertido

| Campo | Valor |
|---|---|
| Agente / persona | opencode (Deepseek v4.1 flash) |
| Rama | `feat/mobile-bootstrap` (`bandadau-frontend`); `main` (`bandadau-shared`/`bandadau-docs`) |
| Objetivo | Dark mode con tonalidad azul oscura de marca + detalles amarillos; logo a blanco en oscuro |
| UCs / HU | E18 (tokens, D13); RF-29 |
| Componentes | `bandadau-shared/packages/ui-tokens`, `bandadau-frontend` |

**Archivos tocados**
- `tokens/semantic/color.dark.tokens.json`: fondos `blue.950/900/800` (azul noche), textos azul claro, `border.focus` y `brand.accent` en amarillo paraba, `feedback.info` y `secondary` azulados.
- `src/theme/use-brand.ts` (nuevo): color de logo azul en claro / **blanco** en oscuro, acento amarillo.
- `global-sidebar.tsx`, `app/(auth)/welcome.tsx`, `app/index.tsx`: usan `useBrand()`.
- `bandadau-frontend/AGENTS.md`: nota de pnpm (reinstalar tras rebuild de `@bandada/*`).

**Decisión**
- El dark vira de neutro cálido a **navy de marca** (#04102E/#071747/#0A1F66) con acento amarillo; el logo se invierte a blanco. Contraste AA verificado.

**Verificación**
- `pnpm --filter @bandada/ui-tokens build` → contraste 128 pares OK.
- `bandadau-frontend`: `typecheck` ✅, `lint` ✅, `expo export -p web --clear` ✅.

---

### 2026-10-14 — Feed estilo Instagram y logo de marca en el sidebar

| Campo | Valor |
|---|---|
| Agente / persona | opencode (Deepseek v4.1 flash) |
| Rama | `feat/mobile-bootstrap` (`bandadau-frontend`) |
| Objetivo | Feed con estética Instagram y lockup de marca (aves + wordmark) en el sidebar |
| UCs / HU | UC-06 (feed), E18 (marca) |
| Componentes | `bandadau-frontend` |

**Archivos tocados**
- `src/features/feed/components/post-card.tsx` (post estilo Instagram: header, media cuadrada full-bleed, acciones, likes, caption), `app/(tabs)/feed.tsx` (header de marca + bell, edge-to-edge), `src/components/screens/screen.tsx` (`padded` opcional), `src/mocks/feed.ts` (media + comentarios), `locales/{es,en}/feed.json` (likes/comments/acciones), `src/components/navigation/global-sidebar.tsx` (`BandadaMark` + `BandadaWordmark`).

**Verificación**
- `pnpm typecheck` ✅ · `pnpm lint` ✅ · `expo export -p web` ✅.

---

### 2026-10-14 — Kit de marca aplicado (paleta, iconos, splash) y alineación de tokens

| Campo | Valor |
|---|---|
| Agente / persona | opencode (Deepseek v4.1 flash) |
| Rama | `feat/mobile-bootstrap` (`bandadau-frontend`); `main` en `bandadau-shared`/`bandadau-docs` |
| Objetivo | Integrar `bandadau-brand/` en la app y alinear la paleta de tokens con la marca |
| UCs / HU | Transversal (E18 tokens; RF-29/D13) |
| Componentes | `bandadau-brand`, `bandadau-shared/packages/ui-tokens`, `bandadau-frontend` |

**Archivos tocados**
- Paleta: `bandadau-shared/packages/ui-tokens/tokens/primitive/color.tokens.json` (azul `#1238A8`/`#0A1F66`/`#1A52D6`, amarillo `#FFC21A`/ámbar `#F5A100`).
- Docs: `01-vision/marca-y-dominio.md` (identidad visual + kit), `04-patrones-y-reglas/design-tokens-y-temas.md` (hex de ejemplo), `00-indice.md` (referencia a `bandadau-brand`).
- App: `bandadau-frontend/assets/brand/*` (iconos, splash, notificación, favicon), `src/components/brand/BandadaLogo.tsx`, `app.config.ts` (icon/ios.icon dark+tinted/android.adaptiveIcon/web.favicon/splash/notifications), `app/_layout.tsx` (+`BandadaSplash`), `app/index.tsx` (+`BandadaLoader`), `app/(auth)/welcome.tsx` y `src/components/navigation/global-sidebar.tsx` (marca).
- Dependencias: `react-native-reanimated@4.5.1` + `react-native-worklets@0.10.1` (el logo animado los usa; `babel-preset-expo` añade el plugin de worklets automáticamente).

**Decisiones**
- La paleta de la app se deriva del kit: primario azul río `#1238A8`, acentos paraba `#FFC21A` (oscuro) / ámbar `#F5A100` (claro). Contraste AA verificado (128 pares).
- Los hex del logo son propios de la marca (no tokens de UI): excepción documentada en `marca-y-dominio.md`.
- `bandadau-brand/` es una carpeta del workspace **sin repositorio git propio** (a diferencia de los 8 repos); a decidir si se versiona aparte.

**Pendientes**
- [ ] Probar en dispositivo: animaciones del logo, iconos `dark`/`tinted` de iOS 18 y el ícono temático de Android 13+ (declarado en el README del kit).
- [ ] Decidir si `bandadau-brand` pasa a repositorio propio y se añade al workspace.

**Verificación**
- `pnpm --filter @bandada/ui-tokens build` → contraste AA (light+dark) OK.
- `bandadau-frontend`: `pnpm typecheck` ✅, `pnpm lint` ✅, `expo export -p web` ✅.

---

### 2026-10-14 — Fase B: identidad mobile (UC-01/02/03) + stack de datos

| Campo | Valor |
|---|---|
| Agente / persona | opencode (Deepseek v4.1 flash) |
| Rama | `feat/mobile-bootstrap` (`bandadau-frontend`) |
| Objetivo | Implementar UC-01/02/03 en la app y fijar el stack de datos/rendimiento |
| UCs / HU | UC-01, UC-02, UC-03 (implementación en curso); HU-01…HU-07 |
| Componentes | `bandadau-frontend` |

**Archivos tocados**
- `bandadau-frontend/`: config (`app.config.ts` React Compiler; dependencias `expo-dev-client`, `@shopify/flash-list`, `react-native-css-interop`, `babel-plugin-react-compiler`; `app/index.tsx` gate de sesión).
- Identidad: `src/features/auth/{types,schemas,api}.ts`, `src/auth/{pkce,handoff,session,open-url*,refresh-token*}.ts`, `src/lib/{api-client,api-error,http,ids,idempotency,query-keys,query-client}.ts`, `src/stores/{session,preferences}.store.ts`, `src/components/ui/virtual-list.tsx`.
- Pantallas: `app/(auth)/{welcome,login,register,verify-email}.tsx`, `app/sso/callback.tsx`, `app/settings/index.tsx`.
- Feed (UC-06): `src/features/feed/{types,api}.ts`, `src/features/feed/components/post-card.tsx`, `app/(tabs)/feed.tsx`, `src/mocks/{index,feed}.ts`, `locales/{es,en}/feed.json`.
- Notificaciones (UC-24): `src/features/notifications/{types,api}.ts`, `.../components/notification-item.tsx`, `app/notifications.tsx`, `src/mocks/notifications.ts`, `locales/{es,en}/notifications.json`.
- Perfil (UC-04): `src/features/profile/{types,api}.ts`, `app/(tabs)/profile.tsx`, `app/profile/edit.tsx`, `src/mocks/profile.ts`, `locales/{es,en}/profile.json`.
- Primitivas UI + auth (mockups): `src/components/ui/{text,button,text-field,chip}.tsx`, `src/components/screens/auth-scaffold.tsx`, `app/(auth)/{welcome,login,register,verify-email}.tsx`.
- Listas (patrón Homy): `src/hooks/use-infinite-list.ts`, `src/components/ui/feed-list.tsx` (FlashList nativo / FlatList web + sentinel IntersectionObserver, footer spinner, refresh).
- Secciones (mockups): `src/features/{events,wallet,tickets,groups}/{types,api}.ts` + `components/*`; `app/(tabs)/{events,wallet,create}.tsx`, `app/events/[eventId].tsx`, `app/tickets/{index,[ticketId]}.tsx`, `app/groups/index.tsx`; mocks `src/mocks/{events,wallet,tickets,groups}.ts`.
- `bandadau-frontend/AGENTS.md`: sección "Datos, rendimiento y compilador".

**Decisiones**
- **TanStack Query** como única vía a datos del servidor; **React Compiler** activado; **FlashList** (nativo) + **FlatList** (web) tras `VirtualList`.
- Tipos de identidad aliaseados desde `@bandada/contracts-ts` (`identity.components['schemas'][…]`).
- `react-native-css-interop` como dependencia directa (resolución pnpm de NativeWind v4).
- pnpm 10.34.7 vía Corepack; **pnpm 12 no funciona con Corepack 0.34** (su bin es `pnpm`, no `bin/pnpm.cjs`) — no es un problema de Apple Silicon.

**Pendientes**
- [x] Feed (UC-06): `useInfiniteQuery` + `VirtualList` + estados (cargando/vacío/error) con mocks locales (`EXPO_PUBLIC_USE_MOCKS`).
- [x] Notificaciones (UC-24): lista paginada, marcar una/todas como leídas, con mocks.
- [x] Perfil (UC-04): vista + edición (displayName, carrera, semestre, bio, intereses) con mocks.
- [x] Primitivas UI (Text/Button/TextField/Chip/Scaffold) y mockups de auth (welcome/login/registro/verificación).
- [x] Motor de listas estilo Homy (`useInfiniteList` con dedupe/refresh/error y `FeedList` nativo+web) aplicado a todas las listas.
- [x] Mockups de secciones: eventos (+detalle), billetera (saldo/recarga/movimientos), tickets (+detalle QR), grupos, crear publicación.
- [ ] Conectar listas reales cuando existan `social`/`eventos`/`tickets`/`notification`; billetera `wallet-service` ya existe.
- [ ] Preferencias offline (cola) y persister de Query; avatar (subida prefirmada).
- [ ] Refrendo humano de las actas §5.4 (`08-revisiones.md`).

**Verificación**
- `pnpm typecheck` (tsc) y `pnpm lint` (ESLint) en verde; `expo config` OK.
- `pnpm build:web` (`expo export -p web`) construye y genera las rutas (static export).

---

### 2026-10-14 — Actas ICONIX retroactivas del lote mobile (UC-01/02/03) y arranque de la app

| Campo | Valor |
|---|---|
| Agente / persona | opencode (Deepseek v4.1 flash) · refrendo humano pendiente |
| Rama | `feat/mobile-bootstrap` (sugerida) |
| Objetivo | Habilitar el arranque de `bandadau-frontend` regularizando el gate ICONIX de UC-01/02/03 |
| UCs / HU | UC-01/02/03 (Secuencia (pendiente CDR) → **Secuencia (CDR aprobada)**); HU-01…HU-07 |
| Componentes | `bandadau-docs/docs/02-iconix/`, `bandadau-frontend` |

**Archivos tocados**
- `docs/02-iconix/08-revisiones.md` — actas RR/PDR/CDR retroactivas (`§5.4`), filas de UC-01/02/03 en `§5.2` a Aprobada, nota de excepción en `§5`.
- `docs/02-iconix/03-casos-de-uso/UC-01-registrarse.md`, `UC-02-iniciar-sesion.md`, `UC-03-acceso-unico-panel.md` — cabecera de estado.

**Decisiones**
- Las actas son retroactivas (el diseño ya estaba completo y identity-service parcialmente implementado); resultado **Aprobada con observaciones**, ninguna bloqueante. Refrendo humano pendiente.
- Arranque de `bandadau-frontend`: bootstrap Expo SDK 57 + navegación custom (native+web) adaptada de Homy a tokens de `@bandada/ui-tokens`.

**Pendientes**
- [ ] Refrendo humano de las actas §5.4 (equipo) — líder técnico.
- [ ] Procesar observaciones menores: `displayName` en `User` (UC-01); alinear D1 `createHandoffCode` (UC-03); verificar `I9a` (fragmento `#cv`) en dispositivo real.
- [ ] Implementar UC-01/02/03 en `bandadau-frontend` (pantallas, sesión/refresh, handoff).

**Verificación**
- Solo documentación en este tramo; sin comandos de build.

---

### 2026-10-14 — Revisión de consistencia tras ADR-0017 (multi-repo) y nueva fecha de entrega

| Campo | Valor |
|---|---|
| Agente / persona | Claude Code (subagente revisor) · supervisado por el equipo |
| Rama | `docs/consistencia-adr-0017` (sugerida; los repos aún no tienen git inicializado) |
| Objetivo | Eliminar restos del monorepo, alinear fechas con el roadmap de 4 sprints y cruzar nombres contra los contratos |
| UCs / HU | UC-09, UC-13, UC-14, UC-15, UC-16, UC-18, UC-19, UC-20 (solo referencias; estados sin cambio) |
| Componentes | `bandadau-docs/docs/`, `bandadau-docs/contracts/` (README y ejemplo de insights), `AGENTS.md`/`README.md` de los repos |

**Archivos tocados (resumen)**
- Rutas y comandos multi-repo: `00-indice.md`, `guia-para-agentes.md`, `infraestructura.md` (§2.6, §3, §5.2 por repo, §7),
  `contracts/README.md` (comandos relativos al repo, `pnpm contracts:gen`), DoD, convenciones, testing, `graphql-admin.md`,
  `microfrontends.md`, metodología; `AGENTS.md`/`README.md` de `bandadau-{infra,shared,frontend,landing,ml,admin}` y de los
  componentes de `bandadau-backend` y `bandadau-admin`; `.gitignore` de `bandadau-infra` y `bandadau-ml`.
- Plan: `backlog.md` (velocidad para 4 sprints), `roadmap-y-sprints.md` (S9 → S4, regla 9, ruta de identity).
- Nombres cruzados: archivos de contrato `*-service.yaml` en UC-13/14/15/16/18; `removeReaction`, `get_platform_kpis`,
  `INVALID_QR_SIGNATURE`; `AlertKind` (`DLQ_BACKLOG`, `SAGA_FAILURES`) en UC-20 y agentes; D15 con estado ✔ verificado
  contra `contracts/` y `amountCredits: 0`; propuestas resueltas por ADR-0016 marcadas en UC-09/18/19/20.
- `insights-service.yaml` 1.1.1: ejemplo de `audioUrl` con bucket `bandada-reports`.

**Pendientes**
- [ ] Decidir `AlertKind` para `QUEUE_BACKLOG` y `MONITORING_DEGRADED` (UC-20, `agentes-y-reportes-generativos.md` §6.2) y
      unificar umbrales de severidad entre ambos documentos — líder técnico.
- [ ] Diseñar `wf-06-difusion-evento` en `automatizacion-n8n.md` (D15 lo define, el detalle no) — plataforma.

**Verificación**
- Mermaid: 146 bloques renderizados con `mermaid@11.17.2` (puppeteer, vía `@mermaid-js/mermaid-cli@11`): 0 errores.
- Enlaces Markdown relativos: 0 rotos (sin contar la copia `bandadau-docs/workspace/`, cuyos enlaces son válidos en la raíz del workspace).
- Spectral 6 sobre `bandadau-docs/contracts/openapi/*.yaml`: 0 errores.

---

### 2026-10-14 — Fundación de la documentación (ICONIX, arquitectura, contratos, infra, plan)

| Campo | Valor |
|---|---|
| Agente / persona | Varios agentes Claude Code en paralelo, coordinados por un agente orquestador · supervisado por el equipo (Grupo 24) |
| Rama | `docs/foundation` (sugerida; el repositorio aún no tenía git inicializado) |
| Objetivo | Dejar la base documental completa para que personas y agentes puedan diseñar e implementar caso por caso |
| UCs / HU | UC-01…UC-24 con borradores de narrativa, robustez y secuencia → estado **Secuencia (pendiente CDR)**; ninguna revisión formal (RR/PDR/CDR) realizada todavía; backlog HU-01…HU-70 + HT-01…HT-12 |
| Componentes | `bandadau-docs/docs/`, `bandadau-docs/contracts/`, `bandadau-infra/` (solo documentación), `bandadau-backend/services/*/AGENTS.md` |

**Archivos existentes al cierre de la sesión**

- Raíz: `AGENTS.md`, `CLAUDE.md`, `README.md`.
- `bandadau-docs/docs/01-vision/`: visión y alcance (MoSCoW, releases R0–R4, épicas E1–E18), cumplimiento de
  la cátedra (T1–T13, C1–C5, guion de defensa), glosario, marca y dominio (`BASE_DOMAIN`).
- `bandadau-docs/docs/02-iconix/`: metodología, RF-01…RF-30, RNF-01…RNF-21, modelo de dominio, catálogo de
  UCs y archivos `UC-01`…`UC-24`,
  `05-prototipos-gui.md`, `06-modelo-estatico/` (8 contextos + índice), `07-trazabilidad.md`,
  `08-revisiones.md`.
- `bandadau-docs/docs/03-arquitectura/`: catálogo de servicios (normativo), decisiones clave D1–D14,
  arquitectura general (C4), SAGA de inscripción, idempotencia, eventos y mensajería, GraphQL
  del panel, MCP, agentes y reportes generativos, ML/DL, IA local y offline, seguridad y SSO, microfrontends, automatización n8n,
  observabilidad; ADR-0000…0007 en `adr/`.
- `bandadau-docs/docs/04-patrones-y-reglas/`: convenciones generales, hexagonal, clean, DDD, API REST,
  frontend, tokens de diseño y temas, i18n, estrategia de pruebas, definición de hecho.
- `bandadau-docs/docs/05-infraestructura/`: `infraestructura.md` (Compose con perfiles, Traefik, init de
  datos, AWS demo con costos, CI/CD, EAS, MFEs, backups), `entornos-y-variables.md`.
- `bandadau-docs/docs/06-plan/`: `roadmap-y-sprints.md` (10 sprints, hitos RR/PDR/CDR/DR, riesgos),
  `backlog.md`, `guia-para-agentes.md`, este registro.
- `bandadau-docs/contracts/`: `README.md`, `.spectral.yaml`; OpenAPI de los 8 servicios REST +
  `shared/components.yaml`; AsyncAPI `bandada-events.yaml`; GraphQL `admin.graphql`; MCP
  `tools.md` + `tools.schema.json`.
- `bandadau-backend/services/*/AGENTS.md` (9 servicios) y `apps/*/AGENTS.md` (5 apps), con su `CLAUDE.md`.
- `bandadau-infra/`: `AGENTS.md`, `CLAUDE.md`, `README.md` (sin archivos de configuración todavía).

**Decisiones**
- Nombre comercial Bandada U, slug `bandada`, dominio de referencia `bandadau.com` parametrizado con `BASE_DOMAIN`.
- Agregadas D13 (tokens de diseño + claro/oscuro) y D14 (i18n es/en) con RF-29, RF-30,
  RNF-20, RNF-21, épica E18 y UC-04 renombrado a "Gestionar perfil académico y preferencias".
- Infra AWS: un EC2 `t3.xlarge` con Compose + RDS micro + DynamoDB on-demand + S3/CloudFront;
  un solo entorno AWS con apagado programado para cumplir RNF-18.
- n8n usa SQLite propio (la instancia Postgres mantiene exactamente 3 bases).
- Buckets de objetos: `bandada-media`, `bandada-reports`, `bandada-models`, `bandada-public`
  (en AWS con prefijo de entorno).

**Pendientes**
- [ ] Validar todos los contratos con `make contracts-lint` cuando exista el tooling — líder técnico.
- [ ] Resolver divergencias de variables entre `bandadau-backend/services/*/AGENTS.md` y requisitos (`bandadau-docs/docs/05-infraestructura/entornos-y-variables.md` §6).
- [x] `bandadau-docs/docs/00-indice.md` (hecho en la sesión de consolidación).
- [ ] Revisar propuestas de cambio a normativos listadas en `06-modelo-estatico/00-indice.md` §3
      (GSIs de `bandada-insights`, ítems de inbox/outbox en tablas DynamoDB, origen de las
      subscriptions GraphQL).
- [ ] Realizar RR, PDR y CDR sobre los borradores (checklists en `bandadau-docs/docs/02-iconix/08-revisiones.md`); hasta aprobar la CDR de un UC, tratarlo como no implementable.
- [ ] Implementar `bandadau-infra/` (compose, init, Traefik) según `infraestructura.md` — HT-01, HT-02.

**Bloqueos / preguntas abiertas**
- Fecha exacta de la defensa (el roadmap asume 22-dic-2026) — equipo.
  > **Resuelto (2026-10-14):** entrega y defensa el **martes 10-nov-2026**; `roadmap-y-sprints.md` reescrito con 4 sprints (S1 14–18 oct, S2 19–25 oct, S3 26 oct–1 nov, S4 2–8 nov) y cierre el 9-nov.
- ¿Se compra `bandadau.com` o se usa un subdominio de un dominio existente? — equipo.

**Verificación**
- Solo documentación; sin código ni comandos de build en esta sesión.

---

### 2026-10-14 — Consolidación del diseño detallado (ADR-0016)

**Agente:** Claude Code (sesión coordinadora) · **Objetivo:** unificar lo producido en paralelo por
10 agentes y dejar el diseño listo para la *Critical Design Review*.

**Archivos tocados**
- Nuevos: `bandadau-docs/docs/00-indice.md`, `README.md`, `bandadau-docs/docs/03-arquitectura/adr/ADR-0016-consolidacion-diseno-detallado.md`.
- Normativos: `catalogo-servicios.md` (cola `admin-gateway.subscriptions.<instanceId>`, bindings
  `event.cancelled` y `ticket-void-failed`, nombres de buckets y usuarios, ítems técnicos DynamoDB,
  Piper), `decisiones-clave.md` (D15), `02-modelo-dominio.md` (ampliaciones), RNF-18, matriz de
  cumplimiento y visión (6 workflows n8n).
- Divergencias corregidas en UC-15, UC-24, `bandadau-backend/services/{ticketing,notification,wallet,media}-service/AGENTS.md`.
- `bandadau-docs/contracts/`: todas las operaciones ⏳ de D15 agregadas, enums alineados, lint corregido.

**Decisiones** (detalle en ADR-0016): QR = JWS ES256; paquetes `CREDITS_20/50/100`; webhook
`X-Signature`; video ≤ 50 MB; inbox DynamoDB `INBOX#<id>`/`META`; refresh token web en cookie
HttpOnly; PHP-FPM; Jest en NestJS; n8n con SQLite y router `wf-00`; billetera perezosa; token MCP de 8 h;
urql como cliente GraphQL.

**Verificación**
- Spectral 6 sobre `bandadau-docs/contracts/openapi/*.yaml`: 0 errores, 0 warnings.
- `@asyncapi/cli validate`: válido; 463 `$ref` resueltos; ejemplos validados.
- GraphQL SDL: `graphql-core` sin errores. `tools.schema.json`: JSON válido.
- Enlaces Markdown relativos: 0 rotos.
- **No verificado:** render de los diagramas Mermaid (no hay `mmdc` instalado); revisarlos en GitHub/VS Code.

**Pendientes**
- [ ] Realizar RR → PDR → CDR (`bandadau-docs/docs/02-iconix/08-revisiones.md`). Los 24 UC están en "Secuencia
      (pendiente CDR)" sin revisión formal; hasta aprobar la CDR, no implementar.
- [ ] Decidir `x-proposal` restantes: filtros `organizerId`/`status` en `listEvents`, `X-Unread-Count`,
      `AlertSource`, `AUTHOR_SUSPENDED` en `HiddenReason`.
- [ ] Divergencias abiertas V-4, V-6, V-7 de `entornos-y-variables.md` §6.
- [ ] Campos del modelo ADR-0016 aún no reflejados en contratos: `Event.endsAt`, `Event.version`,
      `SagaInstance.attempts/version`, `Group.description`, `Profile.pendingAvatarMediaId`, `Alert.params`.
- [ ] Renderizar todos los Mermaid y corregir los que fallen.
- [ ] Sprint R0: scaffolding del monorepo e `bandadau-infra/` (HT-01, HT-02).
  > Nota (ADR-0017): el monorepo se reemplazó por 8 repos hermanos; el scaffolding es por repo (roadmap S1).

---

### 2026-10-14 — Reestructuración en 8 repositorios (ADR-0017) y entrega al 10-nov

**Agente:** Claude Code (sesión coordinadora) · **Objetivo:** pasar del monorepo a repositorios por
capa (estilo Homy), ajustar el plan a la entrega del **martes 10 de noviembre de 2026** y preparar
la presentación.

**Hecho**
- 167 archivos movidos a `bandadau-{docs,shared,backend,frontend,admin,landing,infra,ml}` con enlaces
  recalculados y rutas reescritas relativas al workspace; ADR-0017 (reemplaza ADR-0001).
- `AGENTS.md`/`README.md`/`CLAUDE.md`/`.gitignore` en los 8 repos; `bandadau.code-workspace`;
  `bandadau-infra/scripts/{create-github-repos.sh,clone-all.sh}`; copia de los archivos del workspace
  en `bandadau-docs/workspace/`.
- Roadmap comprimido a S1–S4 + cierre 9-nov; hitos RR/PDR/CDR el 15–17 oct; releases con fechas.
- Revisión de consistencia global (ver entrada anterior del revisor).
- `git init` + commit inicial en cada repo (rama `main`), sin remoto.
- Presentación "Bandada U — Proyecto y cumplimiento" (Claude Slides, 21 diapositivas, con UML 2.5 de
  despliegue, casos de uso y componentes).

**Pendientes (decisión del equipo)**
- [ ] `AlertKind`: `QUEUE_BACKLOG` y `MONITORING_DEGRADED` citados pero inexistentes; unificar umbrales de
      severidad entre UC-20 RN-20.2 y `agentes-y-reportes-generativos.md` §6.2.
- [ ] Diseñar `wf-06-difusion-evento` en `automatizacion-n8n.md`.
- [ ] Decidir `x-proposal` restantes (`listEvents` organizerId/status, `X-Unread-Count`, `AlertSource`,
      `AUTHOR_SUSPENDED`) y propuestas en UC (`listEventTickets`, `follow.deleted.v1`, `feed.impressions-recorded.v1`, `HATE`).
- [ ] Unificar host de URLs prefirmadas en ejemplos (`minio.` vs `s3.bandada.localhost`).
- [ ] Crear o quitar referencias a `contracts/mfe/mfe-manifest.schema.json` y `contracts/pacts/`.
- [ ] Publicar los repos: `bandadau-infra/scripts/create-github-repos.sh <owner>` (requiere `gh auth login`).

---

### 2026-10-15 — Fase 1: implementación e integración local

**Agente:** Claude Code (coordinador) + 11 subagentes · **Objetivo:** núcleo "clásico" funcionando en local con Docker.

**Hecho (commits por repo):** `bandadau-shared` (8 paquetes @bandada/*), `bandadau-infra` (Compose con perfiles, Traefik,
RabbitMQ definitions, init de bases, seed, smoke, mock gateway), `bandadau-backend` (identity, events, wallet,
notification, social, media, ticketing, admin-gateway), `bandadau-admin` (shell Next.js + mfe-moderation Angular),
`bandadau-landing`. `bandadau-frontend` (Expo) queda **a cargo del equipo** (agente detenido).

**Verificación real:** `make up` 20 contenedores healthy · `make seed` 18/18 · `make smoke` **26/26** (registro, idempotencia,
SAGA feliz, EVENT_FULL, compensación con CHAOS, RBAC GraphQL) · panel en `admin.bandada.localhost`: login, dashboard con datos
reales de los 7 servicios, cola de moderación en vivo (WebSocket) con denuncias reales y acción «Retirar».

**Bugs de integración encontrados y corregidos:** smoke del moderador sin cliente `admin` (audiencia JWT); CORS de Traefik sin
credenciales ni `X-Bandada-Client`; admin-gateway serializaba `cursor=null` y pedía `limit` > 50; urql usaba GET (CSRF de Apollo);
toast del shell mostraba la clave en vez del mensaje del MFE.

**Pendientes**
- [ ] Divergencias contrato/doc reportadas por los agentes (≈40): claims JWT (`typ`/`aud`), `IDEMPOTENCY_KEY_REQUIRED` vs `_MISSING`,
      `x-delivery-limit` (4 vs 10), `updateUniversity` ausente en GraphQL, filtro `ids` de `searchUsers`, `ALREADY_MODERATED` y
      `ModerationQueueFilter`, `avatarStatus` en Profile, `organizerId/staffUserIds` en `issue-ticket`, códigos faltantes en `@bandada/i18n`.
- [ ] events-service debe enviar organizerId/staffUserIds a ticketing (hoy cualquier ORGANIZER valida; `STRICT_ORGANIZER_CHECK`).
- [ ] 2 mensajes de prueba en `events-service.saga-replies` (inocuos).
- [ ] Probar `app.bandada.localhost` (Expo) cuando el equipo termine la app; verificar SSO app → panel real (UC-03).
- [ ] Fase 2: ML/DL, IA local, agentes, MCP, n8n, `insights-service`, `mfe-insights`.

---

### 2026-10-15 — App móvil: inscripción a evento de pago, recarga de billetera y entradas estilo Eventbrite

**Agente:** OpenCode · **Repos:** `bandadau-frontend`, `bandadau-shared`, `bandadau-docs`.

**Hecho**
- **UC-12 (inscripción a evento, SAGA simulada):** modal de pago reutilizable con loader por pasos
  (reservar → debitar → emitir) y resultado (éxito con «Ver mi entrada» / fallo con el motivo del
  `failureReason`); polling de `getRegistration`.
- **UC-15/16 (billetera):** recarga con el mismo modal de pago (crear orden → confirmar pago →
  acreditar) y refresco de saldo/movimientos.
- **UC-12/UC-14 (entradas):** detalle estilo Eventbrite (portada, info con iconos, stub perforado con
  muescas, QR real con `react-native-qrcode-svg` sobre `color.qr.*`) y modal QR a pantalla completa con
  animación (Reanimated) e interacción «toca para ampliar»; lista de entradas con miniatura del evento.
- **Design system:** nuevo par semántico `color.qr.bg`/`color.qr.fg` en `@bandada/ui-tokens`
  (light+dark, par de contraste AA) para el QR siempre oscuro sobre claro (D13).
- Dependencia nueva en la app: `react-native-qrcode-svg@6.3.26` (sobre `react-native-svg` ya presente).
- **Flujo de compra (UC-12):** botón «Participar» en el detalle del evento → pago simulado → **revelación del
  ticket** (cae con spring) y **deslizar hacia abajo para guardarlo** en Mis entradas (Reanimated + gesture-handler).
- **Mis entradas (UC-12):** tabs **Disponible/Usado** con el mismo componente `TicketView` (portada, info,
  stub perforado, QR); el detalle usa `TicketView` + modal QR a pantalla completa; acceso desde el menú del perfil.
- **`TicketPass` (UC-12):** componente único del ticket estilo **Apple Wallet** (tarjeta con muesca y degradado,
  entrada escalonada FadeInDown/ZoomIn, inclinación 3D interactiva y QR), tokenizado (`color.pass.*`, claro+oscuro)
  e i18n; usado en lista, detalle y revelación. Sustituye al `TicketView` anterior.
- **`@bandada/i18n`:** nuevo helper `formatTime` (hora sola, `h23`/`h12`).
- **Tickets en modal (UC-12):** al tocar una entrada se abre el `TicketPass` en un **modal sobrepuesto** con **tilt
  por movimiento del celular** (`expo-sensors` `DeviceMotion`; arrastre en web) y la lista muestra **2 columnas en web**.
- **Branding y QR (UC-12):** el pase y el QR a pantalla completa usan el **logo de la app** (`BandadaMark`/`BandadaWordmark`);
  la lista muestra el **QR real** (obtiene el `qrPayload` de `GET /tickets/{id}` por ítem, caché compartida con el modal);
  el QR a pantalla completa es más grande y el tilt cae a **arrastre** si el sensor no está disponible.
- **Detalle de evento por plataforma (UC-11/12):** `EventDetailView.{web,native}.tsx` (Metro elige) — **web** con 2 columnas
  (hero + panel de info/CTA) y **native** con columna única y **CTA fijo abajo** (safe-area); piezas compartidas en
  `event-detail-parts.tsx`. Corregido el bug de parámetro de ruta (`[eventId]`/`[ticketId]` leían `id` → detalle vacío).
- **Tokens del pase:** `color.pass.*` ajustado para que el ticket se distinga del canvas (claro y oscuro) + contorno.
- **Reveal "impresora" (UC-12):** el ticket sale de una **boca de impresión** (`PrinterOutput`, capas + degradados SVG) con
  `TicketPass` aceptando `qrReveal` (el QR se imprime aparte con scan line); tokens `color.printer.*`. **Sonidos**
  (`expo-audio`) sincronizados con la línea de tiempo: `print-feed`/`print-qr`/`confirm` (assets en `src/assets/sounds/`,
  generados con `docs/tickets/generate-ticket-sounds.py`).

**Commits:** `bandadau-shared` (`196d706`, `0b35e5f`, `36ce3b6`, `cbad8d0`, `5b89846`); `bandadau-frontend` (`757043c`, `651b6c5`, `5f15518`, `48aaa37`, `87e47fd`, `3e7bcec`, `39ab056`, `5143077`, `2aa19cf`, `7783e2d`, `e85d3e6`, `2710cb5`, `4484a8a`, `f835df5`).

**Pendientes**
- [ ] `pnpm i18n:check` en la app falla por falta de `locales/{es,en}/errors.json` (preexistente): generarlo desde `@bandada/i18n`.
- [ ] El `qrPayload` de los mocks es fijo; cuando ticketing-service esté, usar el JWS firmado real.

---

### 2026-10-15 — Fase 2 (parcial) e integración final

**Hecho:** `insights-service` (agentes de reportes y monitoreo, servidor MCP con 11 herramientas, LlmPort stub/Anthropic/Ollama, TtsPort
null/Piper/Polly), `mfe-insights` (React, montado en el shell), 6 workflows n8n + router, moderación con deep learning
(`nsfw-classifier` ONNX en `media-service`, `MODERATION_MODE=onnx`), `updateUniversity`, `endsAt/organizerId` hacia ticketing,
ADR-0018, consolidación de contratos y 20 mensajes de error nuevos en `@bandada/i18n`.

**Verificación:** `make seed && make smoke` → **41 ✓ / 0 ✗** (27 base + 14 de insights/MCP); panel en `admin.bandada.localhost` con
dashboard, moderación en vivo e Insights (reportes, alertas) con datos reales.

**Cambios de esta pasada:** ticketing responde 400 en validación (contrato); `UPLOAD_URL_TTL_SECONDS=900` unificado;
`IDEMPOTENCY_KEY_REQUIRED` unificado entre Java, PHP y Node; `listGroupsInternal` sin `career` devuelve los grupos más grandes;
el smoke ya no imprime JWTs.

**Pendientes (ver `deuda-tecnica.md`):**
- [ ] UC-17 (asistente offline / IA local) y la app Expo: a cargo del equipo (E-1…E-3).
- [ ] Recall ≥ 0.90 del modelo de moderación **no medido** (M-1); modelo base de terceros, sin fine-tune propio.
- [ ] `createMcpToken/revokeMcpToken` en identity (hoy FEATURE_DISABLED) para clientes MCP externos con token de 8 h.
- [ ] Claude/Ollama/Piper/Polly sin probar contra servicios reales (solo dobles); audio en local desactivado (`TTS_PROVIDER=none`).
- [ ] D-3 (CANNOT_DEMOTE_SELF… en identity), D-9 (`avatarStatus`), D-10, D-1 (`endsAt` en events).
- [ ] I-2: despliegue AWS (EC2 + RDS + DynamoDB + S3/CloudFront) y CI/CD: solo diseño; requiere credenciales y decisiones del equipo.

---

### 2026-10-15 — Auditoría de la app Expo

**Hecho:** auditoría solo lectura de `bandadau-frontend` (HEAD `eea8878` + cambios sin commitear del equipo) contra reglas duras,
arquitectura, contract-first/idempotencia, cobertura de UC-01…17 y UC-24, DoD §0/§4 y divergencias docs↔código. Documento:
[`auditoria-app-expo.md`](auditoria-app-expo.md) (semáforo, tablas de criterios y de UC, plan A-1…A-16 / B-1…B-14 / C-1…C-9).

**Verificación:** `typecheck` OK, `lint` OK, `test` sin pruebas, `i18n:check` falla (198 errores: falta `errors.json`).

**Hallazgos clave:** `Authorization` nunca se envía (`src/lib/http.ts:37`); mocks activos por defecto (`src/lib/env.ts:9`); sin cola offline,
persister, PWA ni pruebas; UC-05/08/10/13/14/17 ausentes o simulados; `/profiles/{id}/posts` fuera de contrato.

**Pendientes:** ejecutar B-1, B-2, B-3, B-6 primero; luego ver sección 5.4 del documento. No se modificó `bandadau-frontend`.

---

### 2026-10-15 — Integración de la app Expo con el backend real (P1 de la auditoría)

**Agente:** OpenCode · **Repos:** `bandadau-frontend`, `bandadau-shared`, `bandadau-docs`.

**Hecho (commits de `bandadau-frontend`):**
- **B-1** `Authorization` en peticiones autenticadas (`http.ts`: `options.auth !== false`) — `68fe972`.
- **B-2** `Accept-Language` siempre · **B-3** mocks opt-in (`env.useMocks` solo con `EXPO_PUBLIC_USE_MOCKS=true`) ·
  **B-6** `locales/{es,en}/errors.json` (copiados de `@bandada/i18n`) → `pnpm i18n:check` **verde** — `15eb50f`.
- **A-8** `restoreSession()` al arrancar + guardas de ruta (`app/index.tsx`, `(auth)`, `(tabs)`); invitado solo en `__DEV__` — `ad53ec8`.
- **A-2 (UC-07)** reacciones: `useSetReaction`/`useRemoveReaction` con **optimista + rollback**; like funcional — `6ae0156`.
- **A-7/A-6 (UC-12/13)** `useRegistration` honra `Retry-After` (1–5 s, tope 120 s) vía `apiRequestMeta`; `useCancelRegistration`,
  `useMyRegistrations`; pantallas `app/registrations/{index,[registrationId]}.tsx`; acceso desde el menú del perfil — `0f87bd6`.
- **B-4** idempotencia estable (clave no se regenera en reintentos) · **A-14** `ErrorBoundary` + `AppError` traducido y «Reintentar»
  en el detalle de evento — `55b39ab`.
- `docs/` excluido de ESLint/tsc (referencias en `docs/tickets/`).

**Verificación:** `typecheck` ✅ · `lint` ✅ (global) · `i18n:check` ✅ (0 errores) · `export web`/`ios` ✅.

**Pendientes (P1 restante):** A-1 (UC-05 publicar real), A-3 (UC-08/10 seguir/denunciar), A-4 (cola offline T7/T8),
A-5 (UC-14 escáner con `expo-camera`), A-9 (pruebas Jest/RNTL + Maestro), A-10 (PWA/Workbox); C-3 (`/profiles/{id}/posts` en el contrato).

## 2026-10-16 — Cierre de deuda técnica de backend y admin, seed ampliado, landing

- **Landing** (`bandadau-landing`): mockups reales de la app Expo, logos del repo `bandadau-brand`, toggle de tema claro/oscuro con círculo animado y modal 3D del ticket (`fc37521`, revertido el rediseño experimental en `2b180a6`).
- **Seed ampliado** (`bandadau-infra` `b8d24c6` y siguientes): 9 usuarios con perfil, seguidores, grupos, 10 posts (7 con foto), comentarios, reacciones, 6 eventos con portada, recargas e inscripciones; limpia los eventos de smoke. Credenciales de demo: `Bandada#2026` para `lucia|marco|sofia|diego|camila|org|org2|mod|admin@umsa.edu.bo`.
- **Backend** (contratos primero en `bandadau-docs`): D-1, D-3, D-5, D-6, D-7, D-8, D-9, D-10, D-11, D-12, D-13, D-14, D-15, D-16, D-17, tokens MCP (identity, gateway e insights con revocación) y purga de outbox en identity y events.
- **Infra/docs**: C-1…C-9, I-1, I-3, I-4, I-5 (`Makefile` de docs), M-2/M-3 y arnés de recall M-1.
- **Pruebas**: `make seed` 63/0, `make smoke` 41/41, tests de integración de ticketing reparados (16/16), test intermitente de `mfe-moderation` corregido.
- **Auditoría Expo**: `docs/06-plan/auditoria-app-expo.md` (A-1…A-16, B-1…B-14, C-1…C-9). Bloqueante: la app no envía `Authorization` (B-1) y los mocks están activos por defecto (B-3).
- **Pendiente**: ver la sección «Cierre de la ronda de backend y admin» de `deuda-tecnica.md`.

---

### 2026-10-15 — App Expo: cierre de P1 de la auditoría (2ª parte)

**Agente:** OpenCode · **Repos:** `bandadau-frontend`, `bandadau-shared`, `bandadau-docs`.

**Hecho (commits):**
- **UC-12:** no permitir recompra si ya hay inscripción (`GET /registrations/me`) y navegar a `/tickets` refrescando la lista (`e974be0`).
- **Sesión web:** `X-Bandada-Client=web` en web → el backend fija la cookie `bandada_rt` y la sesión **persiste al recargar**; guarda de ruta en el detalle de evento (`a15fe3e`).
- **A-3:** UC-08 seguir/dejar de seguir (+ `getProfile` para el estado) y UC-10 denunciar contenido (API social + hoja de denuncia en el post + botón en el perfil ajeno) (`7f77baa`).
- **C-3:** `GET /profiles/{userId}/posts` (`listUserPosts`) agregado al OpenAPI social (**1.6.0**) + `contracts-ts` regenerado (`bandadau-docs@1db328b`, `bandadau-shared@c993bf6`).
- **B-7** a11y «Cargando» vía i18n · **C-1** `AGENTS.md` al día (`8b369f9`).

**Verificación:** `typecheck` ✅ · `lint` ✅ · `i18n:check` ✅ · `contracts-lint` ✅ · `export web`/`ios` ✅.

**Pendiente P1:** A-1 (UC-05 publicar real), A-4 (cola offline T7/T8), A-5 (UC-14 escáner), A-9 (pruebas Jest/RNTL + Maestro), A-10 (PWA/Workbox).
**Pendiente P2/P3:** B-5/B-8…B-14, A-11…A-16, C-7/C-8 (el CLI `i18n-check` solo acepta un `--src`; la app tiene `src/`+`app/`)/C-9.

---

### 2026-10-15 — App Expo: pruebas (A-9, parcial) y revisión del backend

**Agente:** OpenCode · **Repos:** `bandadau-frontend`, `bandadau-docs`.

**Hecho:**
- **A-9 (parcial):** pruebas Jest con `jest-expo` + RNTL: `http` (Authorization/Accept-Language/client/Idempotency-Key), `ApiError`, `media-ratio` (**17 pruebas**). Arreglado el `transformIgnorePatterns` para el layout de **pnpm** (`.pnpm`) y `types: [jest, react]` en `tsconfig` (`bandadau-frontend@54ca556`).
- **Revisión del backend** (`bandadau-backend`, `main`): ✅ existen `follows` (PUT/DELETE/suggestions), `reports`, reacciones, `registrations/me` y `cancelRegistration`; ❌ **no** existe `listUserPosts` (`GET /profiles/{userId}/posts`) → por eso la grilla del perfil da 404. Ya está en el contrato (C-3); **falta implementarlo en `social-service`**.

**Pendiente A-9:** pruebas de componentes (RNTL, requiere config del `QueryClient` en Jest), flujos **Maestro** (uc02/uc05/uc12/uc14) y **Playwright** (PWA).

---

### 2026-10-15 — Backend: `listUserPosts` (fix del 404 del perfil)

**Agente:** OpenCode · **Repo:** `bandadau-backend`.

**Hecho:** implementado `GET /profiles/{userId}/posts` (`listUserPosts`) en `social-service` (Clean): puerto `PostRepository.listAuthorPosts` + adaptador Mongo (keyset), `ListUserPostsUseCase` (visibilidad por viewer: propio → todas; siguiendo → PUBLIC+FOLLOWERS; si no → PUBLIC; respuesta `FeedItem[]`), `@Get(':userId/posts')` en `ProfilesController` y wiring del módulo. Alinea el contrato (C-3) y **arregla el 404** de la grilla del perfil.

**Verificación:** `pnpm build` (depcruise + tsc) ✅ · `pnpm test` (13) ✅ · `pnpm lint` ✅ · `pnpm typecheck` ✅. Commit `bandadau-backend@afc31ec`.

---

### 2026-10-15 — App Expo: publicar real (UC-05, A-1)

**Agente:** OpenCode · **Repo:** `bandadau-frontend`.

**Hecho:** flujo de publicación conectado al backend: `useCreateUpload` → `PUT` a la URL prefirmada (`uploadToPresignedUrl`) → `useCompleteUpload` → `usePublishPost`; `clientId` **UUIDv7** generado on-device (`newClientId`, `src/lib/ids.ts`); manejo de error por `code` (`ApiError`) y navegación al feed con invalidación. Se quitó el `mockNote`. Commit `bandadau-frontend@3670f1d`.

**Verificación:** `typecheck` ✅ · `lint` ✅ · `i18n:check` ✅ · `export web`/`ios` ✅.

**Pendiente de UC-05:** cola offline (A-4) y pre-chequeo NSFW on-device (solo avisa); selector de grupo para `visibility = GROUP`.

---

### 2026-10-15 — App Expo: escáner real (UC-14, A-5)

**Agente:** OpenCode · **Repo:** `bandadau-frontend`.

**Hecho:** `app/scan.tsx` reescrito con `expo-camera` (`CameraView` + `onBarcodeScanned` QR) → `useValidateTicket` (`POST /tickets/validate`, ♻️) y **resultado por `code`** (`TICKET_ALREADY_USED`, `TICKET_VOIDED`, `INVALID_QR_SIGNATURE`, `TICKET_EVENT_MISMATCH`, `NOT_EVENT_ORGANIZER`, `TICKET_NOT_FOUND`, `VALIDATION_WINDOW_CLOSED`); permiso de cámara con estado + reintento. Plugin `expo-camera` en `app.config.ts` (los textos de permiso ya están en `locales/ios/{es,en}.json`). Commit `bandadau-frontend@c352041`.

**Verificación:** `typecheck` ✅ · `lint` ✅ · `i18n:check` ✅ · `export web`/`ios` ✅.

**Nota:** requiere que el **dev client** incluya `expo-camera` (rebuild si no). En web el escaneo puede estar limitado.

### 2026-10-16 (segunda ronda) — pendientes técnicos y commits de frontend/admin

- R-1 (comentarios denunciados), R-2/R-4 (OTLP en events y notification), R-3 (usuarios de RabbitMQ por servicio aplicados al stack real), R-8 (`/mcp` por Traefik) y M-4 (`frameScores` en moderación de video) cerrados; frontend y admin commiteados y sincronizados con los contratos.
- Se purgaron las DLQ con restos de las pruebas de caos (notification 7, insights 1, wallet 1).
- Abiertos: R-5, R-6 (recall RNF-12), R-7 (M-5/M-6), R-11, R-12, R-13 (AWS y app↔panel).

