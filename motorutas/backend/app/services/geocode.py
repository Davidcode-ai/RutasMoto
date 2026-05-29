"""Geocodificación ligera para waypoints (España / Andalucía)."""
import httpx

# Lugares habituales en rutas demo (evita rate-limit de Nominatim)
_KNOWN: dict[str, tuple[float, float]] = {
    "san fernando": (36.466, -6.199),
    "medina-sidonia": (36.461, -5.927),
    "grazalema": (36.758, -5.366),
    "jerez": (36.686, -6.136),
    "cádiz": (36.529, -6.292),
    "cadiz": (36.529, -6.292),
    "sevilla": (37.389, -5.984),
    "málaga": (36.721, -4.421),
    "malaga": (36.721, -4.421),
    "ronda": (36.742, -5.167),
    "el bosque": (36.758, -5.517),
}


async def geocode_place(name: str) -> tuple[float, float] | None:
    key = name.strip().lower()
    if key in _KNOWN:
        return _KNOWN[key]
    for known, coords in _KNOWN.items():
        if known in key or key in known:
            return coords
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                "https://nominatim.openstreetmap.org/search",
                params={"q": f"{name.strip()}, Andalucía, España", "format": "json", "limit": 1},
                headers={"User-Agent": "MotoRutas/1.0 (local dev)"},
                timeout=8.0,
            )
            if resp.status_code == 200:
                data = resp.json()
                if data:
                    return float(data[0]["lat"]), float(data[0]["lon"])
    except Exception:
        pass
    return None
