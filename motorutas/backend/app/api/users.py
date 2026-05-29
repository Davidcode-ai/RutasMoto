from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.moto import Moto
from app.models.user import PaceBase, User
from app.schemas.auth import UserResponse
from app.schemas.moto import MotoCreate, MotoResponse, MotoUpdate
from app.services.moto_image import fetch_moto_image

router = APIRouter(prefix="/users", tags=["users"])


class ProfileUpdate(BaseModel):
    username: str | None = None
    avatar_url: str | None = None
    pace_base: PaceBase | None = None
    push_subscription: str | None = None


@router.get("/me/profile", response_model=UserResponse)
async def get_profile(user: User = Depends(get_current_user)):
    return user


@router.patch("/me/profile", response_model=UserResponse)
async def update_profile(
    body: ProfileUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if body.username is not None:
        user.username = body.username
    if body.avatar_url is not None:
        user.avatar_url = body.avatar_url
    if body.pace_base is not None:
        user.pace_base = body.pace_base
    if body.push_subscription is not None:
        user.push_subscription = body.push_subscription
    await db.flush()
    return user


@router.get("/me/motos", response_model=list[MotoResponse])
async def list_motos(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Moto).where(Moto.user_id == user.id))
    return result.scalars().all()


@router.post("/me/motos", response_model=MotoResponse, status_code=201)
async def create_moto(
    body: MotoCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    photo_url = body.photo_url
    photo_ai_generated = False
    if not photo_url:
        photo_url, photo_ai_generated = await fetch_moto_image(body.brand, body.model, body.year)
    if body.is_primary:
        existing = await db.execute(select(Moto).where(Moto.user_id == user.id, Moto.is_primary.is_(True)))
        for m in existing.scalars().all():
            m.is_primary = False
    moto = Moto(
        user_id=user.id,
        brand=body.brand,
        model=body.model,
        year=body.year,
        photo_url=photo_url,
        is_primary=body.is_primary,
        photo_ai_generated=photo_ai_generated,
    )
    db.add(moto)
    await db.flush()
    return moto


@router.patch("/me/motos/{moto_id}", response_model=MotoResponse)
async def update_moto(
    moto_id: UUID,
    body: MotoUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Moto).where(Moto.id == moto_id, Moto.user_id == user.id))
    moto = result.scalar_one_or_none()
    if not moto:
        raise HTTPException(status_code=404, detail="Moto no encontrada")
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(moto, field, value)
    await db.flush()
    return moto
