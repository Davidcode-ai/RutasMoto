import json
from uuid import UUID

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import async_session
from app.core.security import decode_token
from app.models.mensaje import Mensaje, MensajeType
from app.models.user import User
from app.services.ruta_access import can_access_ruta

router = APIRouter()

# Sala aislada por ruta: clave canónica chat:{uuid}
connections: dict[str, list[WebSocket]] = {}


def _room_key(ruta_id: UUID) -> str:
    return f"chat:{ruta_id}"


def _parse_ws_ruta_id(raw: str) -> UUID | None:
    try:
        return UUID(raw)
    except (ValueError, TypeError):
        return None


async def broadcast_chat_message(ruta_id: str, payload: dict) -> None:
    """Emite solo a clientes de la sala de esta ruta (nunca a otras salas)."""
    ruta_uuid = _parse_ws_ruta_id(ruta_id)
    if not ruta_uuid:
        return

    payload_ruta = payload.get("ruta_id")
    if payload_ruta is not None and str(payload_ruta) != str(ruta_uuid):
        return

    room = _room_key(ruta_uuid)
    payload = {**payload, "ruta_id": str(ruta_uuid)}

    peers = list(connections.get(room, []))
    dead: list[WebSocket] = []
    for ws in peers:
        try:
            await ws.send_json(payload)
        except Exception:
            dead.append(ws)
    for ws in dead:
        if ws in connections.get(room, []):
            connections[room].remove(ws)


async def _authenticate(token: str | None, db: AsyncSession) -> User | None:
    if not token:
        return None
    try:
        payload = decode_token(token)
        if payload.get("type") != "access":
            return None
        result = await db.execute(select(User).where(User.id == UUID(payload["sub"])))
        return result.scalar_one_or_none()
    except Exception:
        return None


@router.websocket("/ws/chat/{ruta_id}")
async def chat_ws(websocket: WebSocket, ruta_id: str):
    ruta_uuid = _parse_ws_ruta_id(ruta_id)
    if not ruta_uuid:
        await websocket.close(code=4000, reason="ruta_id inválido")
        return

    token = websocket.query_params.get("token")
    async with async_session() as db:
        user = await _authenticate(token, db)
        if not user:
            await websocket.close(code=4001, reason="no autorizado")
            return
        if not await can_access_ruta(db, user, ruta_uuid):
            await websocket.close(code=4003, reason="sin acceso a esta ruta")
            return

    room = _room_key(ruta_uuid)
    await websocket.accept()
    connections.setdefault(room, []).append(websocket)

    try:
        while True:
            data = await websocket.receive_text()
            payload = json.loads(data)
            content = payload.get("content", "").strip()
            if not content:
                continue

            client_ruta = payload.get("ruta_id")
            if client_ruta is not None and str(client_ruta) != str(ruta_uuid):
                continue

            msg_type = payload.get("type", "texto")
            try:
                msg_enum = MensajeType(msg_type)
            except ValueError:
                msg_enum = MensajeType.texto

            async with async_session() as db:
                mensaje = Mensaje(
                    ruta_id=ruta_uuid,
                    user_id=user.id,
                    content=content,
                    type=msg_enum,
                )
                db.add(mensaje)
                await db.commit()
                await db.refresh(mensaje)

            broadcast = {
                "id": str(mensaje.id),
                "ruta_id": str(ruta_uuid),
                "user_id": str(user.id),
                "username": user.username,
                "avatar_url": user.avatar_url,
                "content": content,
                "type": msg_enum.value,
                "created_at": mensaje.created_at.isoformat(),
            }
            await broadcast_chat_message(str(ruta_uuid), broadcast)
    except WebSocketDisconnect:
        pass
    finally:
        peers = connections.get(room, [])
        if websocket in peers:
            peers.remove(websocket)
        if room in connections and not connections[room]:
            del connections[room]
