from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.inscripcion import Inscripcion, InscripcionStatus
from app.models.ruta import Ruta, Visibility
from app.models.user import User


async def can_access_ruta(db: AsyncSession, user: User | None, ruta_id: UUID) -> bool:
    """Rutas públicas: cualquier usuario autenticado. Privadas: organizador o inscrito aceptado."""
    result = await db.execute(select(Ruta).where(Ruta.id == ruta_id))
    ruta = result.scalar_one_or_none()
    if not ruta:
        return False

    if ruta.visibility == Visibility.publica:
        return user is not None

    if not user:
        return False

    if ruta.organizer_id == user.id:
        return True

    ins = await db.execute(
        select(Inscripcion.id).where(
            Inscripcion.ruta_id == ruta_id,
            Inscripcion.user_id == user.id,
            Inscripcion.status == InscripcionStatus.aceptada,
        )
    )
    return ins.scalar_one_or_none() is not None
