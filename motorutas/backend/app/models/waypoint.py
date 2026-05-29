import enum
import uuid

from sqlalchemy import Enum, Float, ForeignKey, Integer, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class WaypointType(str, enum.Enum):
    inicio = "inicio"
    parada = "parada"
    encuentro = "encuentro"
    fin = "fin"
    ia_sugerido = "ia_sugerido"


class Waypoint(Base):
    __tablename__ = "waypoints"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    ruta_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("rutas.id", ondelete="CASCADE"))
    name: Mapped[str] = mapped_column(String(200))
    lat: Mapped[float | None] = mapped_column(Float, nullable=True)
    lng: Mapped[float | None] = mapped_column(Float, nullable=True)
    order: Mapped[int] = mapped_column(Integer, default=0)
    type: Mapped[WaypointType] = mapped_column(Enum(WaypointType), default=WaypointType.parada)

    ruta: Mapped["Ruta"] = relationship(back_populates="waypoints")
