import enum
import uuid
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class MensajeType(str, enum.Enum):
    texto = "texto"
    sistema = "sistema"
    sos = "sos"
    parada = "parada"
    gasolinera = "gasolinera"


class Mensaje(Base):
    __tablename__ = "mensajes"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    ruta_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("rutas.id", ondelete="CASCADE"))
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"))
    content: Mapped[str] = mapped_column(Text)
    type: Mapped[MensajeType] = mapped_column(Enum(MensajeType), default=MensajeType.texto)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    user: Mapped["User"] = relationship(back_populates="mensajes")
    ruta: Mapped["Ruta"] = relationship(back_populates="mensajes")
