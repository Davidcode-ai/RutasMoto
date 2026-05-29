from uuid import UUID

from pydantic import BaseModel, EmailStr, Field

from app.models.user import PaceBase


class RegisterRequest(BaseModel):
    username: str = Field(min_length=3, max_length=50)
    email: EmailStr
    password: str = Field(min_length=8)
    pace_base: PaceBase = PaceBase.intermedio


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RefreshRequest(BaseModel):
    refresh_token: str


class UserResponse(BaseModel):
    id: UUID
    username: str
    email: str
    avatar_url: str | None
    pace_base: PaceBase

    model_config = {"from_attributes": True}
