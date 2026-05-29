import { useCallback, useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Navigation } from 'lucide-react';
import { haversineMeters } from '@/lib/geo';
import { toast } from '@/hooks/use-toast';

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
const NAV_ZOOM = 15;
const RADAR_ALERT_METERS = 500;
const RADAR_CLEAR_METERS = 650;

type RadarFeature = GeoJSON.Feature<GeoJSON.Point, { id?: string; name?: string; maxspeed?: string }>;

function routeLatLngs(route: MapPoint[]): L.LatLngExpression[] {
  const pts =
    route.filter((p) => p.lat != null && p.lng != null).length >= 2
      ? route.filter((p) => p.lat != null && p.lng != null)
      : FALLBACK_ROUTE;
  return pts.map((p) => [p.lat, p.lng]);
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
  const routeLineRef = useRef<L.Polyline | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const leaderMarkerRef = useRef<L.Marker | null>(null);
  const radarLayerRef = useRef<L.GeoJSON | null>(null);
  const radarsRef = useRef<RadarFeature[]>([]);
  const alertedRadarsRef = useRef<Set<string>>(new Set());
  const followRef = useRef(true);

  const [followUser, setFollowUser] = useState(true);
  const [mapReady, setMapReady] = useState(false);

  const disableFollow = useCallback(() => {
    followRef.current = false;
    setFollowUser(false);
  }, []);

  const checkRadarProximity = useCallback((lat: number, lng: number) => {
    for (const feature of radarsRef.current) {
      const [radarLng, radarLat] = feature.geometry.coordinates;
      const id = feature.properties?.id ?? `${radarLng},${radarLat}`;
      const name = feature.properties?.name ?? 'Radar';
      const dist = haversineMeters(lat, lng, radarLat, radarLng);

      if (dist <= RADAR_ALERT_METERS) {
        if (!alertedRadarsRef.current.has(id)) {
          alertedRadarsRef.current.add(id);
          toast({
            title: '⚠️ Radar próximo',
            description: `${name} — ~${Math.round(dist)} m`,
            variant: 'destructive',
          });
        }
      } else if (dist > RADAR_CLEAR_METERS && alertedRadarsRef.current.has(id)) {
        alertedRadarsRef.current.delete(id);
      }
    }
  }, []);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const latlngs = routeLatLngs(route);
    const center = latlngs[0] ?? DEFAULT_CENTER;

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

    map.on('dragstart', disableFollow);

    if (latlngs.length >= 2) {
      routeLineRef.current = L.polyline(latlngs, {
        color: '#ea580c',
        weight: 5,
        opacity: 0.9,
      }).addTo(map);
      map.fitBounds(routeLineRef.current.getBounds(), { padding: [48, 48], maxZoom: 12 });
    }

    fetch('/radares.geojson')
      .then((res) => (res.ok ? res.json() : null))
      .then((geojson: GeoJSON.FeatureCollection | null) => {
        if (!geojson?.features?.length || !mapRef.current) return;
        radarsRef.current = geojson.features.filter(
          (f): f is RadarFeature => f.geometry?.type === 'Point',
        );
        radarLayerRef.current = L.geoJSON(geojson, {
          pointToLayer: (_feature, latlng) =>
            L.marker(latlng, { icon: radarIcon }),
        }).addTo(map);
      })
      .catch(() => {});

    mapRef.current = map;
    setMapReady(true);

    return () => {
      map.remove();
      mapRef.current = null;
      routeLineRef.current = null;
      userMarkerRef.current = null;
      leaderMarkerRef.current = null;
      radarLayerRef.current = null;
      radarsRef.current = [];
      alertedRadarsRef.current.clear();
      setMapReady(false);
    };
  }, [disableFollow, route]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;

    const latlngs = routeLatLngs(route);
    if (routeLineRef.current) {
      routeLineRef.current.setLatLngs(latlngs);
    } else if (latlngs.length >= 2) {
      routeLineRef.current = L.polyline(latlngs, {
        color: '#ea580c',
        weight: 5,
        opacity: 0.9,
      }).addTo(map);
    }
  }, [route, mapReady]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;

    if (user) {
      const icon = userArrowIcon(user.heading);
      if (!userMarkerRef.current) {
        userMarkerRef.current = L.marker([user.lat, user.lng], { icon }).addTo(map);
      } else {
        userMarkerRef.current.setLatLng([user.lat, user.lng]);
        userMarkerRef.current.setIcon(icon);
      }
      checkRadarProximity(user.lat, user.lng);
    } else {
      userMarkerRef.current?.remove();
      userMarkerRef.current = null;
    }

    if (leader) {
      if (!leaderMarkerRef.current) {
        leaderMarkerRef.current = L.marker([leader.lat, leader.lng], { icon: leaderIcon }).addTo(
          map,
        );
      } else {
        leaderMarkerRef.current.setLatLng([leader.lat, leader.lng]);
      }
    } else {
      leaderMarkerRef.current?.remove();
      leaderMarkerRef.current = null;
    }
  }, [user, leader, mapReady, checkRadarProximity]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady || !user || !followRef.current) return;

    map.setView([user.lat, user.lng], Math.max(map.getZoom(), NAV_ZOOM), { animate: true });
  }, [user, mapReady]);

  const handleRecenter = () => {
    const map = mapRef.current;
    if (!map || !user) return;
    followRef.current = true;
    setFollowUser(true);
    map.setView([user.lat, user.lng], Math.max(map.getZoom(), NAV_ZOOM), { animate: true });
  };

  return (
    <div className="relative h-full w-full">
      <div ref={containerRef} className="motorutas-leaflet-map gloves-map h-full w-full" aria-label="Mapa GPS en ruta" />

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
