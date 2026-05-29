import enum
import uuid
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Visibility(str, enum.Enum):
    publica = "publica"
    privada = "privada"


class RutaStatus(str, enum.Enum):
    borrador = "borrador"
    programada = "programada"
    en_curso = "en_curso"
    finalizada = "finalizada"
    cancelada = "cancelada"


class Ruta(Base):
    __tablename__ = "rutas"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organizer_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"))
    title: Mapped[str] = mapped_column(String(200))
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    visibility: Mapped[Visibility] = mapped_column(Enum(Visibility), default=Visibility.publica)
    status: Mapped[RutaStatus] = mapped_column(Enum(RutaStatus), default=RutaStatus.programada)
    start_time: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    maps_link: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    live_tracking: Mapped[bool] = mapped_column(default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    organizer: Mapped["User"] = relationship(back_populates="rutas_organizadas")
    waypoints: Mapped[list["Waypoint"]] = relationship(
        back_populates="ruta", cascade="all, delete-orphan", order_by="Waypoint.order"
    )
    inscripciones: Mapped[list["Inscripcion"]] = relationship(back_populates="ruta", cascade="all, delete-orphan")
    mensajes: Mapped[list["Mensaje"]] = relationship(back_populates="ruta", cascade="all, delete-orphan")
