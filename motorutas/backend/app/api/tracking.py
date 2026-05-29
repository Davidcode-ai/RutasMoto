from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import get_current_user, get_optional_user
from app.models.ubicacion import Ubicacion
from app.models.user import User
from app.schemas.mensaje import TrackingResponse

router = APIRouter(prefix="/rutas/{ruta_id}/tracking", tags=["tracking"])


@router.get("", response_model=list[TrackingResponse])
async def get_latest_positions(
    ruta_id: UUID,
    db: AsyncSession = Depends(get_db),
    _user: User | None = Depends(get_optional_user),
):
    subq = (
        select(Ubicacion.user_id, func.max(Ubicacion.ts).label("max_ts"))
        .where(Ubicacion.ruta_id == ruta_id)
        .group_by(Ubicacion.user_id)
        .subquery()
    )

    result = await db.execute(
        select(Ubicacion)
        .join(subq, (Ubicacion.user_id == subq.c.user_id) & (Ubicacion.ts == subq.c.max_ts))
        .where(Ubicacion.ruta_id == ruta_id)
    )
    locations = result.scalars().all()
    responses = []
    for loc in locations:
        user_result = await db.execute(select(User).where(User.id == loc.user_id))
        u = user_result.scalar_one()
        responses.append(
            TrackingResponse(
                user_id=loc.user_id,
                username=u.username,
                lat=loc.lat,
                lng=loc.lng,
                ts=loc.ts,
            )
        )
    return responses
