from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.security import get_current_user, get_optional_user
from app.models.mensaje import Mensaje
from app.models.user import User
from app.schemas.auth import UserResponse
from app.schemas.mensaje import MensajeCreate, MensajeResponse
from app.services.ruta_access import can_access_ruta
from app.websockets.chat import broadcast_chat_message

router = APIRouter(prefix="/rutas/{ruta_id}/mensajes", tags=["mensajes"])


@router.get("", response_model=list[MensajeResponse])
async def list_mensajes(
    ruta_id: UUID,
    limit: int = Query(50, le=200),
    db: AsyncSession = Depends(get_db),
    user: User | None = Depends(get_optional_user),
):
    if not await can_access_ruta(db, user, ruta_id):
        raise HTTPException(status_code=403, detail="Sin acceso al chat de esta ruta")

    result = await db.execute(
        select(Mensaje)
        .where(Mensaje.ruta_id == ruta_id)
        .options(selectinload(Mensaje.user))
        .order_by(Mensaje.created_at.desc())
        .limit(limit)
    )
    msgs = list(reversed(result.scalars().all()))
    return [
        MensajeResponse(
            id=m.id,
            ruta_id=m.ruta_id,
            content=m.content,
            type=m.type,
            created_at=m.created_at,
            user=UserResponse.model_validate(m.user),
        )
        for m in msgs
    ]


@router.post("", response_model=MensajeResponse, status_code=201)
async def create_mensaje(
    ruta_id: UUID,
    body: MensajeCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not await can_access_ruta(db, user, ruta_id):
        raise HTTPException(status_code=403, detail="Sin acceso al chat de esta ruta")

    mensaje = Mensaje(ruta_id=ruta_id, user_id=user.id, content=body.content, type=body.type)
    db.add(mensaje)
    await db.commit()
    await db.refresh(mensaje)
    await broadcast_chat_message(
        str(ruta_id),
        {
            "id": str(mensaje.id),
            "ruta_id": str(ruta_id),
            "user_id": str(user.id),
            "username": user.username,
            "avatar_url": user.avatar_url,
            "content": mensaje.content,
            "type": mensaje.type.value if hasattr(mensaje.type, "value") else mensaje.type,
            "created_at": mensaje.created_at.isoformat(),
        },
    )
    return MensajeResponse(
        id=mensaje.id,
        ruta_id=mensaje.ruta_id,
        content=mensaje.content,
        type=mensaje.type,
        created_at=mensaje.created_at,
        user=UserResponse.model_validate(user),
    )
