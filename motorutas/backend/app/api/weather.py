from fastapi import APIRouter, Depends, Query
import httpx

from app.core.config import settings
router = APIRouter(prefix="/weather", tags=["weather"])


@router.get("/waypoint")
async def waypoint_weather(
    lat: float = Query(...),
    lng: float = Query(...),
):
    if not settings.OPENWEATHER_API_KEY:
        return {"lat": lat, "lng": lng, "alerts": [], "mock": True, "description": "Sin API key configurada"}
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            "https://api.openweathermap.org/data/2.5/weather",
            params={"lat": lat, "lon": lng, "appid": settings.OPENWEATHER_API_KEY, "units": "metric", "lang": "es"},
        )
        data = resp.json()
    alerts = []
    weather = data.get("weather", [{}])[0]
    main = data.get("main", {})
    if weather.get("main") in ("Rain", "Thunderstorm", "Drizzle"):
        alerts.append({"type": "lluvia", "message": f"Lluvia prevista: {weather.get('description', '')}"})
    if main.get("temp", 20) < 5:
        alerts.append({"type": "frio", "message": f"Temperatura baja: {main.get('temp')}°C"})
    if main.get("wind_speed", 0) > 10:
        alerts.append({"type": "viento", "message": f"Viento fuerte: {main.get('wind_speed')} m/s"})
    return {
        "lat": lat,
        "lng": lng,
        "temp": main.get("temp"),
        "description": weather.get("description"),
        "icon": weather.get("icon"),
        "alerts": alerts,
    }
