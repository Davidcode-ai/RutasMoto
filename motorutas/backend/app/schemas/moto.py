from uuid import UUID

from pydantic import BaseModel, Field


class MotoCreate(BaseModel):
    brand: str = Field(min_length=1, max_length=100)
    model: str = Field(min_length=1, max_length=100)
    year: int | None = None
    photo_url: str | None = None
    is_primary: bool = False


class MotoUpdate(BaseModel):
    brand: str | None = None
    model: str | None = None
    year: int | None = None
    photo_url: str | None = None
    is_primary: bool | None = None


class MotoResponse(BaseModel):
    id: UUID
    brand: str
    model: str
    year: int | None
    photo_url: str | None
    is_primary: bool
    photo_ai_generated: bool

    model_config = {"from_attributes": True}
