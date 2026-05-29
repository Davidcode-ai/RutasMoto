import asyncio
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.security import get_current_user, get_optional_user
from app.models.inscripcion import Inscripcion, InscripcionStatus
from app.models.ruta import Ruta, RutaStatus, Visibility
from app.models.user import User
from app.models.waypoint import Waypoint, WaypointType
from app.schemas.auth import UserResponse
from app.schemas.ruta import (
    AiReturnRequest,
    AiReturnResponse,
    InscripcionCreate,
    InscripcionResponse,
    RutaCreate,
    RutaDetail,
    RutaListItem,
    RutaListPage,
    RutaUpdate,
    WaypointCreate,
    WaypointResponse,
)
from app.services.ai_route import suggest_return_route
from app.services.geocode import geocode_place

router = APIRouter(prefix="/rutas", tags=["rutas"])

MAX_LIST_LIMIT = 100


def _list_filters(visibility: Visibility | None):
    if visibility:
        return Ruta.visibility == visibility
    return Ruta.visibility == Visibility.publica


def _to_list_item(r: Ruta) -> RutaListItem:
    return RutaListItem(
        id=r.id,
        title=r.title,
        visibility=r.visibility,
        status=r.status,
        start_time=r.start_time,
        organizer=UserResponse.model_validate(r.organizer),
        waypoint_count=len(r.waypoints),
        participant_count=len(
            [i for i in r.inscripciones if i.status == InscripcionStatus.aceptada]
        ),
    )


async def _resolve_waypoint_coords(
    wp: WaypointCreate,
) -> tuple[float | None, float | None]:
    if wp.lat is not None and wp.lng is not None:
        return wp.lat, wp.lng
    coords = await geocode_place(wp.name)
    if coords:
        return coords
    return None, None


@router.get("", response_model=RutaListPage)
async def list_rutas(
    visibility: Visibility | None = None,
    skip: int = Query(0, ge=0, description="Registros a omitir"),
    limit: int = Query(20, ge=1, le=MAX_LIST_LIMIT, description="Máximo de registros por página"),
    db: AsyncSession = Depends(get_db),
    _user: User | None = Depends(get_optional_user),
):
    visibility_filter = _list_filters(visibility)

    total_result = await db.execute(
        select(func.count()).select_from(Ruta).where(visibility_filter)
    )
    total = total_result.scalar_one()

    q = (
        select(Ruta)
        .where(visibility_filter)
        .options(
            selectinload(Ruta.organizer),
            selectinload(Ruta.waypoints),
            selectinload(Ruta.inscripciones),
        )
        .order_by(Ruta.start_time.desc().nullslast())
        .offset(skip)
        .limit(limit)
    )
    result = await db.execute(q)
    rutas = result.scalars().unique().all()

    return RutaListPage(
        items=[_to_list_item(r) for r in rutas],
        total=total,
        skip=skip,
        limit=limit,
    )


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

    coords_list = await asyncio.gather(
        *[_resolve_waypoint_coords(wp) for wp in body.waypoints]
    )

    for wp, (lat, lng) in zip(body.waypoints, coords_list, strict=True):
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
    await db.commit()
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
        waypoints=[
            WaypointResponse.model_validate(w)
            for w in sorted(ruta.waypoints, key=lambda x: x.order)
        ],
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
    await db.commit()
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
    await db.commit()


@router.post("/ai/suggest-return", response_model=AiReturnResponse)
async def ai_suggest_return(
    body: AiReturnRequest,
    user: User = Depends(get_current_user),
):
    return await suggest_return_route(body.waypoints, body.prefer_curves)
