from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field

from app.models.mensaje import MensajeType
from app.schemas.auth import UserResponse


class MensajeCreate(BaseModel):
    content: str = Field(min_length=1, max_length=2000)
    type: MensajeType = MensajeType.texto


class MensajeResponse(BaseModel):
    id: UUID
    ruta_id: UUID
    content: str
    type: MensajeType
    created_at: datetime
    user: UserResponse

    model_config = {"from_attributes": True}


class TrackingUpdate(BaseModel):
    lat: float
    lng: float


class TrackingResponse(BaseModel):
    user_id: UUID
    username: str
    lat: float
    lng: float
    ts: datetime

    model_config = {"from_attributes": True}
