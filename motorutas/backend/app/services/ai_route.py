from app.core.config import settings
from app.models.waypoint import WaypointType
from app.schemas.ruta import AiReturnResponse, WaypointCreate


async def suggest_return_route(waypoints: list[str], prefer_curves: bool = True) -> AiReturnResponse:
    """Suggest return route waypoints using LLM or fallback heuristics."""
    if settings.OPENAI_API_KEY:
        try:
            import openai

            client = openai.AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
            prompt = (
                f"Dada una ruta de moto con waypoints: {', '.join(waypoints)}. "
                f"{'Prioriza carreteras con curvas y paisaje.' if prefer_curves else ''} "
                "Sugiere 2-4 waypoints de vuelta hasta el punto de inicio. "
                "Responde solo con nombres de lugares separados por comas, sin explicación."
            )
            response = await client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[{"role": "user", "content": prompt}],
                max_tokens=200,
            )
            text = response.choices[0].message.content or ""
            names = [n.strip() for n in text.split(",") if n.strip()]
            if names:
                suggested = [
                    WaypointCreate(name=n, order=len(waypoints) + i, type=WaypointType.ia_sugerido)
                    for i, n in enumerate(names)
                ]
                return AiReturnResponse(
                    suggested_waypoints=suggested,
                    description="Ruta de vuelta sugerida por IA (carreteras con curvas)",
                )
        except Exception:
            pass

    start = waypoints[0] if waypoints else "Inicio"
    end = waypoints[-1] if waypoints else "Destino"
    fallback_names = [
        f"Puerto de las Palomas (desde {end})",
        "El Bosque",
        f"Vuelta · {start}",
    ]
    suggested = [
        WaypointCreate(name=n, order=len(waypoints) + i, type=WaypointType.ia_sugerido)
        for i, n in enumerate(fallback_names)
    ]
    return AiReturnResponse(
        suggested_waypoints=suggested,
        description="Ruta de vuelta sugerida (modo offline — configura OPENAI_API_KEY para IA real)",
    )
