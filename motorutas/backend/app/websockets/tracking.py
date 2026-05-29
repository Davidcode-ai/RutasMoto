import json
from uuid import UUID

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.core.database import async_session
from app.core.security import decode_token
from app.models.ubicacion import Ubicacion
from app.models.user import User
from sqlalchemy import select

router = APIRouter()

tracking_connections: dict[str, list[WebSocket]] = {}


def _room(ruta_id: str) -> str:
    return f"track:{ruta_id}"


async def _authenticate(token: str | None) -> User | None:
    if not token:
        return None
    try:
        payload = decode_token(token)
        if payload.get("type") != "access":
            return None
        async with async_session() as db:
            result = await db.execute(select(User).where(User.id == UUID(payload["sub"])))
            return result.scalar_one_or_none()
    except Exception:
        return None


@router.websocket("/ws/tracking/{ruta_id}")
async def tracking_ws(websocket: WebSocket, ruta_id: str):
    token = websocket.query_params.get("token")
    user = await _authenticate(token)
    if not user:
        await websocket.close(code=4001)
        return

    await websocket.accept()
    room = _room(ruta_id)
    tracking_connections.setdefault(room, []).append(websocket)

    try:
        while True:
            data = await websocket.receive_text()
            payload = json.loads(data)
            lat = float(payload["lat"])
            lng = float(payload["lng"])

            async with async_session() as db:
                ubicacion = Ubicacion(
                    user_id=user.id,
                    ruta_id=UUID(ruta_id),
                    lat=lat,
                    lng=lng,
                )
                db.add(ubicacion)
                await db.commit()

            broadcast = {
                "user_id": str(user.id),
                "username": user.username,
                "lat": lat,
                "lng": lng,
            }
            dead = []
            for ws in tracking_connections.get(room, []):
                try:
                    await ws.send_json(broadcast)
                except Exception:
                    dead.append(ws)
            for ws in dead:
                tracking_connections[room].remove(ws)
    except WebSocketDisconnect:
        pass
    finally:
        if room in tracking_connections and websocket in tracking_connections[room]:
            tracking_connections[room].remove(websocket)
