"""Seed demo data. Run: python -m app.scripts.seed"""
import asyncio
from datetime import datetime, timezone

from sqlalchemy import select

from app.core.database import async_session, Base, engine
from app.core.security import hash_password
from app.models.inscripcion import Inscripcion, InscripcionStatus
from app.models.mensaje import Mensaje, MensajeType
from app.models.moto import Moto
from app.models.ruta import Ruta, RutaStatus, Visibility
from app.models.user import PaceBase, User
from app.models.waypoint import Waypoint, WaypointType

DEMO_EMAIL = "demo@motorutas.app"
DEMO_ROUTE_TITLE = "Ruta Sierra de Cádiz"


async def is_seed_data_present(db) -> bool:
    """Comprobación rápida: usuario demo y ruta base ya existen."""
    user_id = await db.scalar(select(User.id).where(User.email == DEMO_EMAIL).limit(1))
    if user_id is None:
        return False
    ruta_id = await db.scalar(
        select(Ruta.id).where(Ruta.title == DEMO_ROUTE_TITLE).limit(1)
    )
    return ruta_id is not None


async def seed() -> bool:
    """
    Inserta datos demo si la base está vacía.
    Returns True si se insertaron datos, False si ya existían (idempotente).
    """
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with async_session() as db:
        if await is_seed_data_present(db):
            return False

        organizer = User(
            username="carlos_vega",
            email=DEMO_EMAIL,
            password_hash=hash_password("demo12345"),
            pace_base=PaceBase.alegre,
        )
        luis = User(
            username="ramon_gil",
            email="luis@motorutas.app",
            password_hash=hash_password("demo12345"),
            pace_base=PaceBase.alegre,
        )
        db.add_all([organizer, luis])
        await db.flush()

        moto = Moto(
            user_id=organizer.id,
            brand="Kawasaki",
            model="Z900",
            year=2022,
            photo_url="https://placehold.co/800x500/1a1a1f/ea580c?text=Kawasaki+Z900",
            is_primary=True,
            photo_ai_generated=True,
        )
        db.add(moto)

        ruta = Ruta(
            organizer_id=organizer.id,
            title=DEMO_ROUTE_TITLE,
            description="Ruta de demo MotoRutas — curvas y paisaje",
            visibility=Visibility.publica,
            status=RutaStatus.programada,
            start_time=datetime.now(timezone.utc),
            live_tracking=True,
        )
        db.add(ruta)
        await db.flush()

        waypoints_data = [
            ("San Fernando", 36.466, -6.199, 0, WaypointType.inicio),
            ("Medina-Sidonia", 36.461, -5.927, 1, WaypointType.parada),
            ("Grazalema", 36.758, -5.366, 2, WaypointType.fin),
        ]
        for name, lat, lng, order, wtype in waypoints_data:
            db.add(
                Waypoint(
                    ruta_id=ruta.id,
                    name=name,
                    lat=lat,
                    lng=lng,
                    order=order,
                    type=wtype,
                )
            )

        db.add_all(
            [
                Inscripcion(
                    user_id=organizer.id,
                    ruta_id=ruta.id,
                    origin="San Fernando",
                    pace_override=PaceBase.alegre,
                    status=InscripcionStatus.aceptada,
                ),
                Inscripcion(
                    user_id=luis.id,
                    ruta_id=ruta.id,
                    origin="San Fernando",
                    pace_override=PaceBase.alegre,
                    status=InscripcionStatus.aceptada,
                ),
            ]
        )

        db.add_all(
            [
                Mensaje(
                    ruta_id=ruta.id,
                    user_id=organizer.id,
                    content="Buenas! Salimos puntuales a las 8:30 de la gasolinera.",
                    type=MensajeType.texto,
                ),
                Mensaje(
                    ruta_id=ruta.id,
                    user_id=luis.id,
                    content="Perfecto, llevo el depósito lleno",
                    type=MensajeType.texto,
                ),
                Mensaje(
                    ruta_id=ruta.id,
                    user_id=luis.id,
                    content="ramon",
                    type=MensajeType.gasolinera,
                ),
            ]
        )
        await db.commit()
        print(f"[motorutas] Seed OK — {DEMO_EMAIL} / demo12345 — ruta {ruta.id}")
        return True


if __name__ == "__main__":
    inserted = asyncio.run(seed())
    if not inserted:
        print("[motorutas] Seed omitido: datos demo ya presentes")
