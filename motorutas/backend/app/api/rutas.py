from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.security import get_current_user, get_optional_user
from app.models.inscripcion import Inscripcion, InscripcionStatus
from app.models.ruta import Ruta, RutaStatus, Visibility
from app.models.user import User
from app.models.waypoint import Waypoint
from app.schemas.auth import UserResponse
from app.schemas.ruta import (
    AiReturnRequest,
    AiReturnResponse,
    InscripcionCreate,
    InscripcionResponse,
    RutaCreate,
    RutaDetail,
    RutaListItem,
    RutaUpdate,
    WaypointResponse,
)
from app.services.ai_route import suggest_return_route
from app.services.geocode import geocode_place

router = APIRouter(prefix="/rutas", tags=["rutas"])


@router.get("", response_model=list[RutaListItem])
async def list_rutas(
    visibility: Visibility | None = None,
    db: AsyncSession = Depends(get_db),
    _user: User | None = Depends(get_optional_user),
):
    q = select(Ruta).options(selectinload(Ruta.organizer), selectinload(Ruta.waypoints), selectinload(Ruta.inscripciones))
    if visibility:
        q = q.where(Ruta.visibility == visibility)
    else:
        q = q.where(Ruta.visibility == Visibility.publica)
    result = await db.execute(q.order_by(Ruta.start_time.desc().nullslast()))
    rutas = result.scalars().unique().all()
    items = []
    for r in rutas:
        items.append(
            RutaListItem(
                id=r.id,
                title=r.title,
                visibility=r.visibility,
                status=r.status,
                start_time=r.start_time,
                organizer=UserResponse.model_validate(r.organizer),
                waypoint_count=len(r.waypoints),
                participant_count=len([i for i in r.inscripciones if i.status == InscripcionStatus.aceptada]),
            )
        )
    return items


@router.post("", response_model=RutaDetail, status_code=201)
async def create_ruta(
    body: RutaCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    ruta = Ruta(
        organizer_id=user.id,
        title=body.title,
        description=body.description,
        visibility=body.visibility,
        start_time=body.start_time,
        maps_link=body.maps_link,
        live_tracking=body.live_tracking,
    )
    db.add(ruta)
    await db.flush()
    for wp in body.waypoints:
        lat, lng = wp.lat, wp.lng
        if lat is None or lng is None:
            coords = await geocode_place(wp.name)
            if coords:
                lat, lng = coords
        db.add(
            Waypoint(
                ruta_id=ruta.id,
                name=wp.name,
                lat=lat,
                lng=lng,
                order=wp.order,
                type=wp.type,
            )
        )
    await db.flush()
    return await _fetch_ruta_detail(ruta.id, db)


async def _fetch_ruta_detail(ruta_id: UUID, db: AsyncSession) -> RutaDetail:
    result = await db.execute(
        select(Ruta)
        .where(Ruta.id == ruta_id)
        .options(
            selectinload(Ruta.organizer),
            selectinload(Ruta.waypoints),
            selectinload(Ruta.inscripciones).selectinload(Inscripcion.user),
        )
    )
    ruta = result.scalar_one_or_none()
    if not ruta:
        raise HTTPException(status_code=404, detail="Ruta no encontrada")
    return RutaDetail(
        id=ruta.id,
        title=ruta.title,
        description=ruta.description,
        visibility=ruta.visibility,
        status=ruta.status,
        start_time=ruta.start_time,
        maps_link=ruta.maps_link,
        live_tracking=ruta.live_tracking,
        organizer=UserResponse.model_validate(ruta.organizer),
        waypoints=[WaypointResponse.model_validate(w) for w in sorted(ruta.waypoints, key=lambda x: x.order)],
        inscripciones=[
            InscripcionResponse(
                id=i.id,
                user_id=i.user_id,
                ruta_id=i.ruta_id,
                pace_override=i.pace_override,
                origin=i.origin,
                status=i.status.value,
                user=UserResponse.model_validate(i.user) if i.user else None,
            )
            for i in ruta.inscripciones
            if i.status == InscripcionStatus.aceptada
        ],
    )


@router.get("/{ruta_id}", response_model=RutaDetail)
async def get_ruta(
    ruta_id: UUID,
    db: AsyncSession = Depends(get_db),
    _user: User | None = Depends(get_optional_user),
):
    return await _fetch_ruta_detail(ruta_id, db)


@router.patch("/{ruta_id}", response_model=RutaDetail)
async def update_ruta(
    ruta_id: UUID,
    body: RutaUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Ruta).where(Ruta.id == ruta_id))
    ruta = result.scalar_one_or_none()
    if not ruta:
        raise HTTPException(status_code=404, detail="Ruta no encontrada")
    if ruta.organizer_id != user.id:
        raise HTTPException(status_code=403, detail="Solo el organizador puede editar")
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(ruta, field, value)
    await db.flush()
    return await _fetch_ruta_detail(ruta_id, db)


@router.delete("/{ruta_id}", status_code=204)
async def delete_ruta(
    ruta_id: UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Ruta).where(Ruta.id == ruta_id))
    ruta = result.scalar_one_or_none()
    if not ruta:
        raise HTTPException(status_code=404, detail="Ruta no encontrada")
    if ruta.organizer_id != user.id:
        raise HTTPException(status_code=403, detail="Solo el organizador puede eliminar")
    await db.delete(ruta)


@router.post("/ai/suggest-return", response_model=AiReturnResponse)
async def ai_suggest_return(
    body: AiReturnRequest,
    user: User = Depends(get_current_user),
):
    return await suggest_return_route(body.waypoints, body.prefer_curves)
