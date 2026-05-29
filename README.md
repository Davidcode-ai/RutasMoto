# RutasMoto / MotoRutas

PWA para organizar rutas en moto: chat en tiempo real, mapas, modo guantes y perfiles de motero.

## Estructura del repositorio

| Carpeta | Descripción |
|---------|-------------|
| **`motorutas/`** | App principal — Astro 5 + React + FastAPI + SQLite |
| `app/`, `components/` | Prototipo visual Next.js (referencia de diseño) |

## Inicio rápido

Ver la guía completa en **[motorutas/README.md](motorutas/README.md)**.

```powershell
# Opción fácil (Windows)
.\motorutas\scripts\start-dev.ps1
```

- Frontend: http://127.0.0.1:4321  
- API: http://127.0.0.1:8000  
- Demo: `demo@motorutas.app` / `demo12345`

## Variables de entorno

Copia los ejemplos (no subas secretos):

- `motorutas/backend/.env.example` → `motorutas/backend/.env`
- `motorutas/frontend/.env.example` → `motorutas/frontend/.env`

Opcional: `PUBLIC_MAPBOX_TOKEN` para mapa interactivo Mapbox.
