export type RouteCoord = { lat: number; lng: number };

type OsrmRouteResponse = {
  code: string;
  routes?: { geometry: GeoJSON.LineString }[];
};

/**
 * Obtiene la geometría de ruta por carretera desde OSRM (servicio público).
 * Devuelve null si falla o hay menos de 2 puntos.
 */
export async function fetchOsrmRouteGeometry(
  points: RouteCoord[],
  signal?: AbortSignal,
): Promise<GeoJSON.LineString | null> {
  if (points.length < 2) return null;

  const path = points.map((p) => `${p.lng},${p.lat}`).join(';');
  const url = `https://router.project-osrm.org/route/v1/driving/${path}?overview=full&geometries=geojson`;

  try {
    const res = await fetch(url, { signal });
    if (!res.ok) return null;

    const data = (await res.json()) as OsrmRouteResponse;
    if (data.code !== 'Ok' || !data.routes?.[0]?.geometry) return null;

    return data.routes[0].geometry;
  } catch {
    return null;
  }
}
