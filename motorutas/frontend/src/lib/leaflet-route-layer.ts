import L from 'leaflet';

/** Estilo de ruta GPS (naranja MotoRutas + halo para contraste). */
export const ROUTE_LINE_STYLE: L.PathOptions = {
  color: '#ea580c',
  weight: 6,
  opacity: 0.95,
  lineCap: 'round',
  lineJoin: 'round',
};

export const ROUTE_LINE_HALO_STYLE: L.PathOptions = {
  color: '#1e3a5f',
  weight: 9,
  opacity: 0.55,
  lineCap: 'round',
  lineJoin: 'round',
};

export function removeRouteLayers(
  haloRef: { current: L.GeoJSON | null },
  routeRef: { current: L.GeoJSON | null },
): void {
  haloRef.current?.remove();
  haloRef.current = null;
  routeRef.current?.remove();
  routeRef.current = null;
}

/**
 * Pinta la ruta OSRM en el mapa (halo + línea). Devuelve bounds o null.
 */
export function drawOsrmRouteOnMap(
  map: L.Map,
  geometry: GeoJSON.LineString | GeoJSON.MultiLineString,
  haloRef: { current: L.GeoJSON | null },
  routeRef: { current: L.GeoJSON | null },
): L.LatLngBounds | null {
  removeRouteLayers(haloRef, routeRef);

  const feature: GeoJSON.Feature = {
    type: 'Feature',
    properties: {},
    geometry,
  };

  haloRef.current = L.geoJSON(feature, { style: ROUTE_LINE_HALO_STYLE }).addTo(map);
  routeRef.current = L.geoJSON(feature, { style: ROUTE_LINE_STYLE }).addTo(map);

  return routeRef.current.getBounds();
}

/** Fallback: línea recta entre waypoints si OSRM no responde. */
export function drawStraightRouteOnMap(
  map: L.Map,
  latlngs: L.LatLngExpression[],
  haloRef: { current: L.GeoJSON | null },
  routeRef: { current: L.GeoJSON | null },
): L.LatLngBounds | null {
  if (latlngs.length < 2) return null;

  const geometry: GeoJSON.LineString = {
    type: 'LineString',
    coordinates: latlngs.map((ll) => {
      const latlng = L.latLng(ll);
      return [latlng.lng, latlng.lat];
    }),
  };

  return drawOsrmRouteOnMap(map, geometry, haloRef, routeRef);
}
