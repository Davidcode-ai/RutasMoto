import { useCallback, useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Navigation } from 'lucide-react';
import { useLeafletInvalidateSize } from '@/hooks/use-leaflet-invalidate-size';
import { drawOsrmRouteOnMap, drawStraightRouteOnMap, removeRouteLayers } from '@/lib/leaflet-route-layer';
import { fetchOsrmRouteGeometry } from '@/lib/osrm-route';

export type MapPoint = { lat: number; lng: number; label?: string };

export type UserMapLocation = MapPoint & {
  heading?: number | null;
};

type Props = {
  route: MapPoint[];
  user?: UserMapLocation | null;
  leader?: MapPoint | null;
};

const FALLBACK_ROUTE: MapPoint[] = [
  { lat: 36.466, lng: -6.199, label: 'Inicio' },
  { lat: 36.461, lng: -5.927 },
  { lat: 36.758, lng: -5.366, label: 'Fin' },
];
const DEFAULT_CENTER: L.LatLngExpression = [36.5, -5.6];
const NAV_ZOOM = 16;

function resolveRoutePoints(route: MapPoint[]): MapPoint[] {
  const pts = route.filter((p) => p.lat != null && p.lng != null);
  return pts.length >= 2 ? pts : FALLBACK_ROUTE;
}

function waypointPinIcon(label: string, variant: 'start' | 'stop' | 'end'): L.DivIcon {
  const colors = {
    start: '#22c55e',
    stop: '#eab308',
    end: '#ef4444',
  };
  const bg = colors[variant];
  return L.divIcon({
    className: 'gloves-wp-icon',
    html: `<div style="display:flex;flex-direction:column;align-items:center">
      <div style="width:12px;height:12px;border-radius:50%;background:${bg};border:2px solid #fff;box-shadow:0 0 6px rgba(0,0,0,.6)"></div>
      <span style="margin-top:2px;font-size:9px;font-weight:700;color:#fff;text-shadow:0 1px 3px #000;white-space:nowrap">${label}</span>
    </div>`,
    iconAnchor: [6, 6],
  });
}

function userArrowIcon(heading: number | null | undefined): L.DivIcon {
  const rot = heading != null && Number.isFinite(heading) ? heading : 0;
  return L.divIcon({
    className: 'gloves-user-icon',
    html: `<div class="gloves-user-arrow" style="transform: rotate(${rot}deg)">
      <div class="gloves-user-arrow-shape"></div>
    </div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
}

const leaderIcon = L.divIcon({
  className: 'gloves-leader-icon',
  html: '<div class="gloves-leader-dot"></div>',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

const radarIcon = L.divIcon({
  className: 'gloves-radar-icon',
  html: '<div class="gloves-radar-dot"></div>',
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

export default function GlovesMiniMap({ route, user, leader }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const routeHaloRef = useRef<L.GeoJSON | null>(null);
  const routeLineRef = useRef<L.GeoJSON | null>(null);
  const waypointLayerRef = useRef<L.LayerGroup | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const leaderMarkerRef = useRef<L.Marker | null>(null);
  const hazardLayerRef = useRef<L.LayerGroup | null>(null);
  const routeAbortRef = useRef<AbortController | null>(null);
  const initialFitDoneRef = useRef(false);
  const followRef = useRef(true);
  const lastPanRef = useRef<L.LatLng | null>(null);

  const [followUser, setFollowUser] = useState(true);
  const [mapReady, setMapReady] = useState(false);

  useLeafletInvalidateSize(mapRef, containerRef, mapReady);

  const disableFollow = useCallback(() => {
    followRef.current = false;
    setFollowUser(false);
  }, []);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const points = resolveRoutePoints(route);
    const center: L.LatLngExpression = [points[0].lat, points[0].lng];

    const map = L.map(containerRef.current, {
      center,
      zoom: 11,
      zoomControl: false,
      attributionControl: false,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap',
    }).addTo(map);

    waypointLayerRef.current = L.layerGroup().addTo(map);
    map.on('dragstart', disableFollow);

    hazardLayerRef.current = L.layerGroup().addTo(map);

    const addHazardMarkers = (geojson: GeoJSON.FeatureCollection | null, icon: L.DivIcon) => {
      if (!geojson?.features?.length || !hazardLayerRef.current) return;
      L.geoJSON(geojson, {
        pointToLayer: (_feature, latlng) => L.marker(latlng, { icon }),
      }).addTo(hazardLayerRef.current);
    };

    Promise.all([fetch('/radares.geojson'), fetch('/incidencias.geojson')])
      .then(async ([rRes, iRes]) => {
        if (!mapRef.current || !hazardLayerRef.current) return;
        if (rRes.ok) addHazardMarkers((await rRes.json()) as GeoJSON.FeatureCollection, radarIcon);
        if (iRes.ok) addHazardMarkers((await iRes.json()) as GeoJSON.FeatureCollection, incidentIcon);
      })
      .catch(() => {});

    mapRef.current = map;
    setMapReady(true);

    return () => {
      routeAbortRef.current?.abort();
      initialFitDoneRef.current = false;
      map.remove();
      mapRef.current = null;
      routeHaloRef.current = null;
      routeLineRef.current = null;
      waypointLayerRef.current = null;
      userMarkerRef.current = null;
      leaderMarkerRef.current = null;
      hazardLayerRef.current = null;
      lastPanRef.current = null;
      setMapReady(false);
    };
  }, [disableFollow]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;

    const points = resolveRoutePoints(route);
    const wpLayer = waypointLayerRef.current;

    wpLayer?.clearLayers();
    points.forEach((wp, i) => {
      const variant = i === 0 ? 'start' : i === points.length - 1 ? 'end' : 'stop';
      const label = wp.label ?? (variant === 'start' ? 'Inicio' : variant === 'end' ? 'Fin' : `P${i}`);
      L.marker([wp.lat, wp.lng], {
        icon: waypointPinIcon(label, variant),
        zIndexOffset: 1200,
      }).addTo(wpLayer!);
    });

    routeAbortRef.current?.abort();
    const ac = new AbortController();
    routeAbortRef.current = ac;

    removeRouteLayers(routeHaloRef, routeLineRef);

    if (points.length < 2) return;

    const coords = points.map((p) => ({ lat: p.lat, lng: p.lng }));
    const latlngs: L.LatLngExpression[] = coords.map((p) => [p.lat, p.lng]);

    void (async () => {
      const geometry = await fetchOsrmRouteGeometry(coords, ac.signal);
      if (ac.signal.aborted || mapRef.current !== map) return;

      let bounds: L.LatLngBounds | null = null;
      if (geometry) {
        bounds = drawOsrmRouteOnMap(map, geometry, routeHaloRef, routeLineRef);
      } else {
        bounds = drawStraightRouteOnMap(map, latlngs, routeHaloRef, routeLineRef);
      }

      if (bounds?.isValid() && !initialFitDoneRef.current) {
        map.fitBounds(bounds, { padding: [48, 48], maxZoom: 12 });
        initialFitDoneRef.current = true;
        window.setTimeout(() => map.invalidateSize({ animate: false }), 100);
      }
    })();

    return () => ac.abort();
  }, [route, mapReady]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;

    if (user) {
      const icon = userArrowIcon(user.heading);
      if (!userMarkerRef.current) {
        userMarkerRef.current = L.marker([user.lat, user.lng], {
          icon,
          zIndexOffset: 1500,
        }).addTo(map);
      } else {
        userMarkerRef.current.setLatLng([user.lat, user.lng]);
        userMarkerRef.current.setIcon(icon);
      }
    } else {
      userMarkerRef.current?.remove();
      userMarkerRef.current = null;
    }

    if (leader) {
      if (!leaderMarkerRef.current) {
        leaderMarkerRef.current = L.marker([leader.lat, leader.lng], {
          icon: leaderIcon,
          zIndexOffset: 1400,
        }).addTo(map);
      } else {
        leaderMarkerRef.current.setLatLng([leader.lat, leader.lng]);
      }
    } else {
      leaderMarkerRef.current?.remove();
      leaderMarkerRef.current = null;
    }
  }, [user, leader, mapReady]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady || !user || !followRef.current) return;

    const target = L.latLng(user.lat, user.lng);
    const zoom = Math.max(map.getZoom(), NAV_ZOOM);
    const prev = lastPanRef.current;
    const movedM = prev ? prev.distanceTo(target) : 999;

    if (movedM > 1) {
      map.setView(target, zoom, { animate: movedM > 8 });
      lastPanRef.current = target;
    } else if (map.getZoom() < NAV_ZOOM) {
      map.setZoom(NAV_ZOOM);
    }
  }, [user, mapReady]);

  const handleRecenter = () => {
    const map = mapRef.current;
    if (!map || !user) return;
    followRef.current = true;
    setFollowUser(true);
    const target = L.latLng(user.lat, user.lng);
    lastPanRef.current = target;
    map.setView(target, Math.max(map.getZoom(), NAV_ZOOM), { animate: true });
  };

  return (
    <div className="relative h-full w-full min-h-0">
      <div
        ref={containerRef}
        className="motorutas-leaflet-map gloves-map absolute inset-0 h-full w-full"
        aria-label="Mapa GPS en ruta"
      />

      <button
        type="button"
        onClick={handleRecenter}
        disabled={!user}
        aria-label={followUser ? 'Centrado en ti' : 'Volver a seguirme'}
        title={followUser ? 'Siguiendo tu posición' : 'Re-centrar y seguir'}
        className={`absolute map-fab-bottom-safe map-fab-right-safe z-[1000] flex size-11 items-center justify-center rounded-full border-2 border-white shadow-lg transition active:scale-95 disabled:opacity-40 ${
          followUser ? 'bg-[#38bdf8] text-black' : 'bg-black/90 text-[#38bdf8]'
        }`}
      >
        <Navigation className={`size-5 ${followUser ? '' : 'opacity-90'}`} strokeWidth={2.5} />
      </button>

      {!followUser && user && (
        <span className="pointer-events-none absolute map-fab-bottom-safe right-16 z-[1000] rounded-full bg-black/80 px-2 py-1 text-[10px] font-bold text-white">
          Arrastraste el mapa
        </span>
      )}
    </div>
  );
}
