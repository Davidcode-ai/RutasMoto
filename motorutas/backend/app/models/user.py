import enum
import uuid
from datetime import datetime

from sqlalchemy import DateTime, Enum, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class PaceBase(str, enum.Enum):
    tranquilo = "tranquilo"
    intermedio = "intermedio"
    alegre = "alegre"
    rapido = "rapido"


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    username: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    avatar_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    pace_base: Mapped[PaceBase] = mapped_column(Enum(PaceBase), default=PaceBase.intermedio)
    push_subscription: Mapped[str | None] = mapped_column(String(2000), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    motos: Mapped[list["Moto"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    rutas_organizadas: Mapped[list["Ruta"]] = relationship(back_populates="organizer")
    inscripciones: Mapped[list["Inscripcion"]] = relationship(back_populates="user")
    mensajes: Mapped[list["Mensaje"]] = relationship(back_populates="user")
