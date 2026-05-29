from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.inscripcion import Inscripcion, InscripcionStatus
from app.models.ruta import Ruta, Visibility
from app.models.user import User
from app.schemas.auth import UserResponse
from app.schemas.ruta import InscripcionCreate, InscripcionResponse

router = APIRouter(prefix="/rutas/{ruta_id}/inscripciones", tags=["inscripciones"])


@router.post("", response_model=InscripcionResponse, status_code=201)
async def join_ruta(
    ruta_id: UUID,
    body: InscripcionCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Ruta).where(Ruta.id == ruta_id))
    ruta = result.scalar_one_or_none()
    if not ruta:
        raise HTTPException(status_code=404, detail="Ruta no encontrada")
    existing = await db.execute(
        select(Inscripcion).where(Inscripcion.ruta_id == ruta_id, Inscripcion.user_id == user.id)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Ya estás inscrito en esta ruta")
    status = InscripcionStatus.aceptada if ruta.visibility == Visibility.publica else InscripcionStatus.pendiente
    inscripcion = Inscripcion(
        user_id=user.id,
        ruta_id=ruta_id,
        moto_override_id=body.moto_override_id,
        pace_override=body.pace_override,
        origin=body.origin,
        status=status,
    )
    db.add(inscripcion)
    await db.flush()
    return InscripcionResponse(
        id=inscripcion.id,
        user_id=inscripcion.user_id,
        ruta_id=inscripcion.ruta_id,
        pace_override=inscripcion.pace_override,
        origin=inscripcion.origin,
        status=inscripcion.status.value,
        user=UserResponse.model_validate(user),
    )


@router.patch("/{inscripcion_id}/status", response_model=InscripcionResponse)
async def update_inscripcion_status(
    ruta_id: UUID,
    inscripcion_id: UUID,
    status: InscripcionStatus,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Ruta).where(Ruta.id == ruta_id))
    ruta = result.scalar_one_or_none()
    if not ruta or ruta.organizer_id != user.id:
        raise HTTPException(status_code=403, detail="Solo el organizador puede gestionar inscripciones")
    result = await db.execute(
        select(Inscripcion).where(Inscripcion.id == inscripcion_id, Inscripcion.ruta_id == ruta_id)
    )
    inscripcion = result.scalar_one_or_none()
    if not inscripcion:
        raise HTTPException(status_code=404, detail="Inscripción no encontrada")
    inscripcion.status = status
    await db.flush()
    return InscripcionResponse(
        id=inscripcion.id,
        user_id=inscripcion.user_id,
        ruta_id=inscripcion.ruta_id,
        pace_override=inscripcion.pace_override,
        origin=inscripcion.origin,
        status=inscripcion.status.value,
    )
