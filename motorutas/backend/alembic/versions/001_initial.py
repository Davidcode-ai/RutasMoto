"""initial schema

Revision ID: 001
Revises:
Create Date: 2026-05-29

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("username", sa.String(50), nullable=False, unique=True),
        sa.Column("email", sa.String(255), nullable=False, unique=True),
        sa.Column("password_hash", sa.String(255), nullable=False),
        sa.Column("avatar_url", sa.String(500), nullable=True),
        sa.Column("pace_base", sa.Enum("tranquilo", "intermedio", "alegre", "rapido", name="pacebase"), nullable=False),
        sa.Column("push_subscription", sa.String(2000), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_table(
        "motos",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE")),
        sa.Column("brand", sa.String(100), nullable=False),
        sa.Column("model", sa.String(100), nullable=False),
        sa.Column("year", sa.Integer(), nullable=True),
        sa.Column("photo_url", sa.String(500), nullable=True),
        sa.Column("is_primary", sa.Boolean(), default=False),
        sa.Column("photo_ai_generated", sa.Boolean(), default=False),
    )
    op.create_table(
        "rutas",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("organizer_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id")),
        sa.Column("title", sa.String(200), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("visibility", sa.Enum("publica", "privada", name="visibility"), nullable=False),
        sa.Column("status", sa.Enum("borrador", "programada", "en_curso", "finalizada", "cancelada", name="rutastatus"), nullable=False),
        sa.Column("start_time", sa.DateTime(timezone=True), nullable=True),
        sa.Column("maps_link", sa.String(1000), nullable=True),
        sa.Column("live_tracking", sa.Boolean(), default=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_table(
        "waypoints",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("ruta_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("rutas.id", ondelete="CASCADE")),
        sa.Column("name", sa.String(200), nullable=False),
        sa.Column("lat", sa.Float(), nullable=True),
        sa.Column("lng", sa.Float(), nullable=True),
        sa.Column("order", sa.Integer(), default=0),
        sa.Column("type", sa.Enum("inicio", "parada", "encuentro", "fin", "ia_sugerido", name="waypointtype"), nullable=False),
    )
    op.create_table(
        "inscripciones",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE")),
        sa.Column("ruta_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("rutas.id", ondelete="CASCADE")),
        sa.Column("moto_override_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("motos.id", ondelete="SET NULL"), nullable=True),
        sa.Column("pace_override", sa.Enum("tranquilo", "intermedio", "alegre", "rapido", name="pacebase", create_type=False), nullable=True),
        sa.Column("origin", sa.String(200), nullable=True),
        sa.Column("status", sa.Enum("pendiente", "aceptada", "rechazada", "expulsada", name="inscripcionstatus"), nullable=False),
        sa.Column("joined_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_table(
        "mensajes",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("ruta_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("rutas.id", ondelete="CASCADE")),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE")),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("type", sa.Enum("texto", "sistema", "sos", "parada", "gasolinera", name="mensajetype"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_table(
        "ubicaciones",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE")),
        sa.Column("ruta_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("rutas.id", ondelete="CASCADE")),
        sa.Column("lat", sa.Float(), nullable=False),
        sa.Column("lng", sa.Float(), nullable=False),
        sa.Column("ts", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )


def downgrade() -> None:
    op.drop_table("ubicaciones")
    op.drop_table("mensajes")
    op.drop_table("inscripciones")
    op.drop_table("waypoints")
    op.drop_table("rutas")
    op.drop_table("motos")
    op.drop_table("users")
