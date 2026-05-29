# Pase QA — MotoRutas (frontend)

Revisión general de hidratación, feedback táctil, responsive y estado React.

## 1. Hidratación Astro / React

| Cambio | Motivo |
|--------|--------|
| `HomeApp.tsx` sustituye doble isla en `index.astro` | Evita montar `RouteListApp` bajo el welcome y dobles `loadUser()` |
| `WelcomeScreen` sin `useStore` / sin `loadUser` | Solo UI; la sesión la resuelve `HomeApp` |
| `useUrlSearchParam` en `RouteDetailApp` | Lee `?id=` en el primer render cliente sin flash vacío → cargando |
| Todas las islas siguen en `client:only="react"` | Sin SSR de stores (`localStorage`, nanostores) |

Hooks auxiliares: `hooks/use-client-ready.ts`, `hooks/use-url-search-param.ts`.

## 2. Feedback visual en botones

| Cambio | Motivo |
|--------|--------|
| Clase global `.btn-press` en `global.css` | `active:scale-[0.98]` coherente en CTAs |
| Aplicada en listado, detalle, perfil, chat, mapas, guantes, auth, PWA, crear/unirse | Botones que no tenían respuesta al pulsar |

## 3. Responsive / scroll horizontal

| Cambio | Motivo |
|--------|--------|
| `overflow-x: hidden` en `.app-shell` | Contenedor raíz sin desbordes |
| Utilidad `.no-scrollbar-x` + `min-w-0` en `main` | Flex hijos no fuerzan ancho > viewport |
| Eliminado `-mx-4` en `ChatPanel` | Causaba scroll horizontal en móvil |
| `flex-wrap` + `break-words` / `truncate` en detalle de ruta | Chips y títulos largos en pantallas estrechas |

## 4. Parpadeos al cambiar pestañas (detalle)

| Cambio | Motivo |
|--------|--------|
| Paneles Asistentes / Chat montados siempre (`hidden` en inactivo) | No desmonta `ChatPanel` ni recarga WS/historial |
| Prop `wsActive` en `ChatPanel` | Cierra WS en pestaña Asistentes (ahorro) y reconecta al volver a Chat |
| `loadRuta` con `useCallback` estable | Menos efectos redundantes |

## Archivos tocados (principal)

- `components/home/HomeApp.tsx` (nuevo)
- `pages/index.astro`
- `components/auth/WelcomeScreen.tsx`
- `components/route/RouteDetailApp.tsx`
- `components/chat/ChatPanel.tsx`
- `styles/global.css`
- Varios componentes con `.btn-press` y `no-scrollbar-x`

## Backend

Sin cambios en este pase: las islas React ya evitaban hidratación en API; la lógica de chat/inscripciones no afectaba a estos síntomas de UI.
