from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field

from app.models.ruta import RutaStatus, Visibility
from app.models.user import PaceBase
from app.models.waypoint import WaypointType
from app.schemas.auth import UserResponse


class WaypointCreate(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    lat: float | None = None
    lng: float | None = None
    order: int = 0
    type: WaypointType = WaypointType.parada


class WaypointResponse(BaseModel):
    id: UUID
    name: str
    lat: float | None
    lng: float | None
    order: int
    type: WaypointType

    model_config = {"from_attributes": True}


class RutaCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    description: str | None = None
    visibility: Visibility = Visibility.publica
    start_time: datetime | None = None
    maps_link: str | None = None
    live_tracking: bool = True
    waypoints: list[WaypointCreate] = Field(min_length=2)


class RutaUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    visibility: Visibility | None = None
    status: RutaStatus | None = None
    start_time: datetime | None = None
    maps_link: str | None = None
    live_tracking: bool | None = None


class InscripcionCreate(BaseModel):
    moto_override_id: UUID | None = None
    pace_override: PaceBase | None = None
    origin: str | None = None
    custom_bike: str | None = None


class InscripcionResponse(BaseModel):
    id: UUID
    user_id: UUID
    ruta_id: UUID
    pace_override: PaceBase | None
    origin: str | None
    status: str
    user: UserResponse | None = None

    model_config = {"from_attributes": True}


class RutaListItem(BaseModel):
    id: UUID
    title: str
    visibility: Visibility
    status: RutaStatus
    start_time: datetime | None
    organizer: UserResponse
    waypoint_count: int = 0
    participant_count: int = 0

    model_config = {"from_attributes": True}


class RutaDetail(BaseModel):
    id: UUID
    title: str
    description: str | None
    visibility: Visibility
    status: RutaStatus
    start_time: datetime | None
    maps_link: str | None
    live_tracking: bool
    organizer: UserResponse
    waypoints: list[WaypointResponse]
    inscripciones: list[InscripcionResponse] = []

    model_config = {"from_attributes": True}


class AiReturnRequest(BaseModel):
    waypoints: list[str]
    prefer_curves: bool = True


class AiReturnResponse(BaseModel):
    suggested_waypoints: list[WaypointCreate]
    description: str
