from datetime import datetime
from uuid import UUID

from pydantic import BaseModel

from app.models.ruta import RutaStatus, Visibility
from app.schemas.auth import UserResponse


class ParticipatingRutaItem(BaseModel):
    inscripcion_id: UUID
    ruta_id: UUID
    title: str
    status: RutaStatus
    visibility: Visibility
    start_time: datetime | None
    organizer: UserResponse
    inscripcion_status: str
    origin: str | None = None
    is_organizer: bool = False

    model_config = {"from_attributes": True}
