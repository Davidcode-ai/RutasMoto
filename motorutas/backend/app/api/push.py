from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User

router = APIRouter(prefix="/push", tags=["push"])


class PushSubscribe(BaseModel):
    subscription: str


@router.post("/subscribe")
async def subscribe_push(
    body: PushSubscribe,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    user.push_subscription = body.subscription
    await db.flush()
    return {"ok": True, "vapid_public_key": settings.VAPID_PUBLIC_KEY or None}
