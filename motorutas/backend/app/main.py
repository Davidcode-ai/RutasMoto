from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

from app.api import auth, inscripciones, mensajes, push, rutas, tracking, users, weather
from app.core.config import settings
from app.core.database import Base, engine
from app.websockets import chat, tracking as ws_tracking

limiter = Limiter(key_func=get_remote_address)


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    try:
        from app.scripts.seed import seed

        inserted = await seed()
        if not inserted:
            print("[motorutas] Seed omitido: datos demo ya presentes")
    except Exception as exc:
        print(f"[motorutas] seed: {exc}")
    yield


app = FastAPI(
    title="MotoRutas API",
    description="API para organización de rutas en moto",
    version="1.0.0",
    lifespan=lifespan,
)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api")
app.include_router(users.router, prefix="/api")
app.include_router(rutas.router, prefix="/api")
app.include_router(inscripciones.router, prefix="/api")
app.include_router(mensajes.router, prefix="/api")
app.include_router(tracking.router, prefix="/api")
app.include_router(weather.router, prefix="/api")
app.include_router(push.router, prefix="/api")
app.include_router(chat.router)
app.include_router(ws_tracking.router)


@app.get("/api/health")
@limiter.limit("60/minute")
async def health(request: Request):
    return {"status": "ok", "app": "MotoRutas"}
