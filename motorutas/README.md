# MotoRutas

PWA para organizar rutas en moto. Astro + FastAPI + SQLite (desarrollo local).

## Arranque rápido (Windows)

**Terminal 1 — API:**
```powershell
cd motorutas\backend
python -m pip install -r requirements.txt
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

**Terminal 2 — Frontend:**
```powershell
cd motorutas\frontend
npm install
npm run dev -- --host 127.0.0.1 --port 4321
```

Abre http://127.0.0.1:4321

### Cuenta demo (se crea al arrancar la API)
- **Email:** demo@motorutas.app
- **Contraseña:** demo12345

## Qué se arregló en local

- API con **SQLite** (sin Docker ni PostgreSQL)
- Frontend usa **proxy de Vite** (`/api` → puerto 8000)
- Contraseñas con **bcrypt** directo (compatible Windows; **reinicia la API** si el login da error 500)
- Seed automático con ruta de ejemplo (refresca la contraseña demo al arrancar)
- Login, chat, unirse a ruta, perfil y modo guantes operativos
- Clima del mapa sin obligar login
- Layout móvil centrado (`max-w-md`) y React con `client:only` (sin pantallas en blanco)

## Variables opcionales

`motorutas/frontend/.env`:
```
PUBLIC_MAPBOX_TOKEN=tu_token_mapbox
```

## Docker

Si tienes Docker Desktop: `docker compose up --build` desde `motorutas/`
