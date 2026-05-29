import json
from uuid import UUID

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import async_session
from app.core.security import decode_token
from app.models.mensaje import Mensaje, MensajeType
from app.models.user import User

router = APIRouter()

connections: dict[str, list[WebSocket]] = {}


def _room(ruta_id: str) -> str:
    return f"chat:{ruta_id}"


async def broadcast_chat_message(ruta_id: str, payload: dict) -> None:
    room = _room(ruta_id)
    dead: list[WebSocket] = []
    for ws in connections.get(room, []):
        try:
            await ws.send_json(payload)
        except Exception:
            dead.append(ws)
    for ws in dead:
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
    token = websocket.query_params.get("token")
    async with async_session() as db:
        user = await _authenticate(token, db)
        if not user:
            await websocket.close(code=4001)
            return

    await websocket.accept()
    room = _room(ruta_id)
    connections.setdefault(room, []).append(websocket)

    try:
        while True:
            data = await websocket.receive_text()
            payload = json.loads(data)
            content = payload.get("content", "").strip()
            if not content:
                continue
            msg_type = payload.get("type", "texto")
            try:
                msg_enum = MensajeType(msg_type)
            except ValueError:
                msg_enum = MensajeType.texto

            async with async_session() as db:
                mensaje = Mensaje(
                    ruta_id=UUID(ruta_id),
                    user_id=user.id,
                    content=content,
                    type=msg_enum,
                )
                db.add(mensaje)
                await db.commit()
                await db.refresh(mensaje)

            broadcast = {
                "id": str(mensaje.id),
                "ruta_id": ruta_id,
                "user_id": str(user.id),
                "username": user.username,
                "avatar_url": user.avatar_url,
                "content": content,
                "type": msg_enum.value,
                "created_at": mensaje.created_at.isoformat(),
            }
            dead = []
            for ws in connections.get(room, []):
                try:
                    await ws.send_json(broadcast)
                except Exception:
                    dead.append(ws)
            for ws in dead:
                connections[room].remove(ws)
    except WebSocketDisconnect:
        pass
    finally:
        if room in connections and websocket in connections[room]:
            connections[room].remove(websocket)
