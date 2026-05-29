import { useCallback, useEffect, useRef, useState } from 'react';
import { Navigation } from 'lucide-react';
import type mapboxgl from 'mapbox-gl';

export type MapPoint = { lat: number; lng: number; label?: string };

export type UserMapLocation = MapPoint & {
  heading?: number | null;
};

type Props = {
  route: MapPoint[];
  user?: UserMapLocation | null;
  leader?: MapPoint | null;
};

const MAPBOX_TOKEN = import.meta.env.PUBLIC_MAPBOX_TOKEN || '';
const FALLBACK_ROUTE: MapPoint[] = [
  { lat: 36.466, lng: -6.199, label: 'Inicio' },
  { lat: 36.461, lng: -5.927 },
  { lat: 36.758, lng: -5.366, label: 'Fin' },
];
const DEFAULT_CENTER: [number, number] = [-5.6, 36.5];
const NAV_ZOOM = 15.5;

function routeCoords(route: MapPoint[]): [number, number][] {
  const pts =
    route.filter((p) => p.lat != null && p.lng != null).length >= 2
      ? route.filter((p) => p.lat != null && p.lng != null)
      : FALLBACK_ROUTE;
  return pts.map((p) => [p.lng, p.lat]);
}

function createUserMarkerEl(): HTMLDivElement {
  const el = document.createElement('div');
  el.className = 'gloves-user-marker';
  el.innerHTML = `
    <div style="
      width:0;height:0;
      border-left:10px solid transparent;
      border-right:10px solid transparent;
      border-bottom:22px solid #38bdf8;
      filter:drop-shadow(0 0 4px rgba(0,0,0,0.8));
    "></div>
  `;
  return el;
}

function createLeaderMarkerEl(): HTMLDivElement {
  const el = document.createElement('div');
  el.style.cssText =
    'width:18px;height:18px;border-radius:50%;background:#a3e635;border:3px solid #fff;box-shadow:0 0 8px rgba(0,0,0,0.6);';
  return el;
}

/** Mapa canvas cuando no hay token Mapbox (sin GPS avanzado). */
function CanvasFallbackMap({ route, user, leader }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const routePts =
      route.filter((p) => p.lat != null && p.lng != null).length >= 2
        ? route.filter((p) => p.lat != null && p.lng != null)
        : FALLBACK_ROUTE;

    const all: MapPoint[] = [...routePts];
    if (user) all.push(user);
    if (leader) all.push(leader);

    const boundsOf = (points: MapPoint[]) => {
      const lats = points.map((p) => p.lat);
      const lngs = points.map((p) => p.lng);
      const pad = 0.08;
      return {
        minLat: Math.min(...lats) - pad,
        maxLat: Math.max(...lats) + pad,
        minLng: Math.min(...lngs) - pad,
        maxLng: Math.max(...lngs) + pad,
      };
    };

    const project = (
      lat: number,
      lng: number,
      b: ReturnType<typeof boundsOf>,
      w: number,
      h: number,
    ) => {
      const x = ((lng - b.minLng) / (b.maxLng - b.minLng || 1)) * w;
      const y = h - ((lat - b.minLat) / (b.maxLat - b.minLat || 1)) * h;
      return { x, y };
    };

    const draw = () => {
      const dpr = window.devicePixelRatio || 1;
      const w = container.clientWidth;
      const h = container.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.scale(dpr, dpr);
      ctx.fillStyle = '#0a0a0c';
      ctx.fillRect(0, 0, w, h);

      const b = boundsOf(all);
      const routeXY = routePts.map((p) => project(p.lat, p.lng, b, w, h));

      ctx.strokeStyle = '#ea580c';
      ctx.lineWidth = 5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      routeXY.forEach((pt, i) => {
        if (i === 0) ctx.moveTo(pt.x, pt.y);
        else ctx.lineTo(pt.x, pt.y);
      });
      ctx.stroke();

      const drawMarker = (pt: MapPoint, fill: string, size: number) => {
        const { x, y } = project(pt.lat, pt.lng, b, w, h);
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fillStyle = fill;
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 3;
        ctx.stroke();
      };

      if (leader) drawMarker(leader, '#a3e635', 10);
      if (user) drawMarker(user, '#38bdf8', 12);
    };

    draw();
    const ro = new ResizeObserver(draw);
    ro.observe(container);
    return () => ro.disconnect();
  }, [route, user, leader]);

  return (
    <div ref={containerRef} className="relative h-full w-full bg-[#0a0a0c]">
      <canvas ref={canvasRef} className="block h-full w-full" aria-label="Mapa simplificado de la ruta" />
      <p className="pointer-events-none absolute bottom-2 left-2 rounded bg-black/80 px-2 py-1 text-[10px] text-white/70">
        Añade PUBLIC_MAPBOX_TOKEN para GPS en vivo
      </p>
    </div>
  );
}

export default function GlovesMiniMap({ route, user, leader }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const userMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const leaderMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const followRef = useRef(true);

  const [followUser, setFollowUser] = useState(true);
  const [mapReady, setMapReady] = useState(false);

  const disableFollow = useCallback(() => {
    followRef.current = false;
    setFollowUser(false);
  }, []);

  const centerOnUser = useCallback(
    (map: mapboxgl.Map, lng: number, lat: number, heading: number | null | undefined, animate: boolean) => {
      const bearing =
        heading != null && Number.isFinite(heading) ? heading : map.getBearing();
      const opts: mapboxgl.EaseToOptions = {
        center: [lng, lat],
        bearing,
        zoom: Math.max(map.getZoom(), NAV_ZOOM),
        pitch: 0,
        duration: animate ? 700 : 0,
        essential: true,
      };
      if (animate) map.easeTo(opts);
      else map.jumpTo(opts);
    },
    [],
  );

  useEffect(() => {
    if (!MAPBOX_TOKEN || !containerRef.current) return;

    let cancelled = false;

    import('mapbox-gl').then((mb) => {
      if (cancelled || !containerRef.current) return;

      const mapboxgl = mb.default;
      mapboxgl.accessToken = MAPBOX_TOKEN;

      const coords = routeCoords(route);
      const center: [number, number] = coords[0] ?? DEFAULT_CENTER;

      const map = new mapboxgl.Map({
        container: containerRef.current!,
        style: 'mapbox://styles/mapbox/navigation-night-v1',
        center,
        zoom: 11,
        bearing: 0,
        pitch: 0,
        attributionControl: false,
      });

      mapRef.current = map;

      const onUserGesture = () => disableFollow();
      map.on('dragstart', onUserGesture);
      map.on('rotatestart', onUserGesture);
      map.on('pitchstart', onUserGesture);
      map.on('zoomstart', (e) => {
        if (e.originalEvent) onUserGesture();
      });

      map.on('load', () => {
        if (cancelled) return;
        setMapReady(true);

        if (coords.length >= 2) {
          map.addSource('gloves-route', {
            type: 'geojson',
            data: {
              type: 'Feature',
              properties: {},
              geometry: { type: 'LineString', coordinates: coords },
            },
          });
          map.addLayer({
            id: 'gloves-route-line',
            type: 'line',
            source: 'gloves-route',
            layout: { 'line-cap': 'round', 'line-join': 'round' },
            paint: {
              'line-color': '#ea580c',
              'line-width': 5,
              'line-opacity': 0.9,
            },
          });
          const lngs = coords.map((c) => c[0]);
          const lats = coords.map((c) => c[1]);
          map.fitBounds(
            [
              [Math.min(...lngs), Math.min(...lats)],
              [Math.max(...lngs), Math.max(...lats)],
            ],
            { padding: 48, maxZoom: 12, duration: 0 },
          );
        }
      });
    });

    return () => {
      cancelled = true;
      setMapReady(false);
      userMarkerRef.current?.remove();
      userMarkerRef.current = null;
      leaderMarkerRef.current?.remove();
      leaderMarkerRef.current = null;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [disableFollow, route]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;

    const source = map.getSource('gloves-route') as mapboxgl.GeoJSONSource | undefined;
    const coords = routeCoords(route);
    if (source && coords.length >= 2) {
      source.setData({
        type: 'Feature',
        properties: {},
        geometry: { type: 'LineString', coordinates: coords },
      });
    }
  }, [route, mapReady]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;

    import('mapbox-gl').then((mb) => {
      const mapboxgl = mb.default;

      if (user) {
        if (!userMarkerRef.current) {
          userMarkerRef.current = new mapboxgl.Marker({
            element: createUserMarkerEl(),
            anchor: 'center',
          }).addTo(map);
        }
        userMarkerRef.current.setLngLat([user.lng, user.lat]);
      } else {
        userMarkerRef.current?.remove();
        userMarkerRef.current = null;
      }

      if (leader) {
        if (!leaderMarkerRef.current) {
          leaderMarkerRef.current = new mapboxgl.Marker({
            element: createLeaderMarkerEl(),
            anchor: 'center',
          }).addTo(map);
        }
        leaderMarkerRef.current.setLngLat([leader.lng, leader.lat]);
      } else {
        leaderMarkerRef.current?.remove();
        leaderMarkerRef.current = null;
      }
    });
  }, [user, leader, mapReady]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady || !user || !followRef.current) return;

    centerOnUser(map, user.lng, user.lat, user.heading, true);
  }, [user, mapReady, centerOnUser]);

  const handleRecenter = () => {
    const map = mapRef.current;
    if (!map || !user) return;
    followRef.current = true;
    setFollowUser(true);
    centerOnUser(map, user.lng, user.lat, user.heading, true);
  };

  if (!MAPBOX_TOKEN) {
    return <CanvasFallbackMap route={route} user={user} leader={leader} />;
  }

  return (
    <div className="relative h-full w-full">
      <div ref={containerRef} className="h-full w-full" aria-label="Mapa GPS en ruta" />

      <button
        type="button"
        onClick={handleRecenter}
        disabled={!user}
        aria-label={followUser ? 'Centrado en ti' : 'Volver a seguirme'}
        title={followUser ? 'Siguiendo tu posición' : 'Re-centrar y seguir'}
        className={`absolute bottom-3 right-3 z-10 flex size-11 items-center justify-center rounded-full border-2 border-white shadow-lg transition active:scale-95 disabled:opacity-40 ${
          followUser ? 'bg-[#38bdf8] text-black' : 'bg-black/90 text-[#38bdf8]'
        }`}
      >
        <Navigation className={`size-5 ${followUser ? '' : 'opacity-90'}`} strokeWidth={2.5} />
      </button>

      {!followUser && user && (
        <span className="pointer-events-none absolute bottom-3 right-16 z-10 rounded-full bg-black/80 px-2 py-1 text-[10px] font-bold text-white">
          Arrastraste el mapa
        </span>
      )}
    </div>
  );
}
