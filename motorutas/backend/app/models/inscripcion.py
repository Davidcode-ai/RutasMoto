import enum
import uuid
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.user import PaceBase


class InscripcionStatus(str, enum.Enum):
    pendiente = "pendiente"
    aceptada = "aceptada"
    rechazada = "rechazada"
    expulsada = "expulsada"


class Inscripcion(Base):
    __tablename__ = "inscripciones"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"))
    ruta_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("rutas.id", ondelete="CASCADE"))
    moto_override_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("motos.id", ondelete="SET NULL"), nullable=True
    )
    pace_override: Mapped[PaceBase | None] = mapped_column(Enum(PaceBase), nullable=True)
    origin: Mapped[str | None] = mapped_column(String(200), nullable=True)
    status: Mapped[InscripcionStatus] = mapped_column(Enum(InscripcionStatus), default=InscripcionStatus.aceptada)
    joined_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    user: Mapped["User"] = relationship(back_populates="inscripciones")
    ruta: Mapped["Ruta"] = relationship(back_populates="inscripciones")
    moto_override: Mapped["Moto | None"] = relationship(foreign_keys=[moto_override_id])
