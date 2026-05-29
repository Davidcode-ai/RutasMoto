import { useEffect, useRef, useState } from 'react';
import type mapboxgl from 'mapbox-gl';
import { Plus, Minus, Navigation, Layers, X } from 'lucide-react';

const MAPBOX_TOKEN = import.meta.env.PUBLIC_MAPBOX_TOKEN || '';

type Waypoint = { name: string; lat?: number | null; lng?: number | null; order: number };
type Rider = { user_id: string; username: string; lat: number; lng: number };
type ClusterRider = { username: string; avatar_url?: string | null };

type Props = {
  waypoints: Waypoint[];
  riders?: Rider[];
  clusterRiders?: ClusterRider[];
  weatherAlerts?: { message: string }[];
  onRiderClick?: () => void;
};

const DEFAULT_CENTER: [number, number] = [-5.6, 36.5];

export default function MapboxMap({ waypoints, riders = [], clusterRiders = [], weatherAlerts = [] }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const [showCluster, setShowCluster] = useState(false);
  useEffect(() => {
    if (!containerRef.current || !MAPBOX_TOKEN) return;
    let map: mapboxgl.Map;
    import('mapbox-gl').then((mb) => {
      const mapboxgl = mb.default;
      mapboxgl.accessToken = MAPBOX_TOKEN;
    const coords = waypoints.filter((w) => w.lat && w.lng);
    const center: [number, number] =
      coords.length > 0 ? [coords[0].lng!, coords[0].lat!] : DEFAULT_CENTER;

      map = new mapboxgl.Map({
        container: containerRef.current!,
        style: 'mapbox://styles/mapbox/dark-v11',
        center,
        zoom: 9,
      });
      mapRef.current = map;

      coords.forEach((wp, i) => {
        const el = document.createElement('div');
        el.className = 'flex flex-col items-center';
        el.innerHTML = `<div class="rounded-full bg-card/90 px-2 py-0.5 text-[10px] font-semibold ring-1 ring-border"><span class="text-primary">${i + 1}</span> ${wp.name}</div>`;
        new mapboxgl.Marker({ element: el }).setLngLat([wp.lng!, wp.lat!]).addTo(map);
      });

      riders.forEach((r) => {
        new mapboxgl.Marker({ color: '#ea580c' })
          .setLngLat([r.lng, r.lat])
          .setPopup(new mapboxgl.Popup().setHTML(`<strong>${r.username}</strong>`))
          .addTo(map);
      });

      if (coords.length > 1) {
        map.on('load', () => {
          map.addSource('route', {
            type: 'geojson',
            data: {
              type: 'Feature',
              properties: {},
              geometry: {
                type: 'LineString',
                coordinates: coords.map((w) => [w.lng!, w.lat!]),
              },
            },
          });
          map.addLayer({
            id: 'route-line',
            type: 'line',
            source: 'route',
            paint: { 'line-color': '#ea580c', 'line-width': 3 },
          });
        });
      }
    });

    return () => {
      if (mapRef.current) mapRef.current.remove();
    };
  }, [waypoints, riders]);

  if (!MAPBOX_TOKEN) {
    return (
      <div className="relative h-full w-full overflow-hidden bg-card">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-60"
          style={{ backgroundImage: 'linear-gradient(135deg, #1a1a1f 0%, #2d2d35 50%, #1a1a1f 100%)' }}
        />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-background/90 to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-background to-transparent" />
        {waypoints.map((wp, i) => (
          <div
            key={wp.name}
            className="absolute -translate-x-1/2 -translate-y-full"
            style={{ top: `${20 + i * 20}%`, left: `${15 + i * 25}%` }}
          >
            <div className="flex flex-col items-center">
              <div className="rounded-full bg-card/90 px-2 py-0.5 text-[10px] font-semibold ring-1 ring-border">
                <span className="text-primary">{i + 1}</span> {wp.name}
              </div>
            </div>
          </div>
        ))}
        {clusterRiders.length > 0 && (
          <div className="absolute left-[34%] top-[46%] -translate-x-1/2 -translate-y-1/2">
            <button
              onClick={() => setShowCluster((v) => !v)}
              className="relative flex size-12 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground shadow-lg ring-4 ring-primary/25"
            >
              {clusterRiders.length}
            </button>
            {showCluster && (
              <div className="absolute top-[calc(100%+12px)] left-1/2 w-52 -translate-x-1/2 rounded-2xl border border-border bg-popover/95 p-2 shadow-2xl backdrop-blur">
                <ul className="space-y-1">
                  {clusterRiders.map((r) => (
                    <li key={r.username} className="flex items-center gap-2 text-xs">
                      <span className="font-medium">{r.username}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
        <p className="absolute bottom-4 left-4 rounded-lg bg-card/90 px-2 py-1 text-[10px] text-muted-foreground">
          Configura PUBLIC_MAPBOX_TOKEN para mapa interactivo
        </p>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full">
      <div ref={containerRef} className="h-full w-full" />
      {weatherAlerts.length > 0 && (
        <div className="absolute left-3 top-20 z-10 max-w-[200px] rounded-xl bg-destructive/90 px-3 py-2 text-xs font-semibold text-destructive-foreground">
          {weatherAlerts[0].message}
        </div>
      )}
      <div className="absolute right-3 top-1/2 flex -translate-y-1/2 flex-col gap-2">
        <div className="flex flex-col overflow-hidden rounded-full bg-card/90 ring-1 ring-border backdrop-blur">
          <button
            onClick={() => mapRef.current?.zoomIn()}
            className="flex size-10 items-center justify-center"
          >
            <Plus className="size-5" />
          </button>
          <div className="h-px bg-border" />
          <button
            onClick={() => mapRef.current?.zoomOut()}
            className="flex size-10 items-center justify-center"
          >
            <Minus className="size-5" />
          </button>
        </div>
        <button
          onClick={() => {
            if (navigator.geolocation && mapRef.current) {
              navigator.geolocation.getCurrentPosition((pos) => {
                mapRef.current?.flyTo({ center: [pos.coords.longitude, pos.coords.latitude], zoom: 12 });
              });
            }
          }}
          className="flex size-10 items-center justify-center rounded-full bg-card/90 text-primary ring-1 ring-border backdrop-blur"
        >
          <Navigation className="size-5" />
        </button>
        <button className="flex size-10 items-center justify-center rounded-full bg-card/90 ring-1 ring-border backdrop-blur">
          <Layers className="size-5" />
        </button>
      </div>
      {clusterRiders.length > 0 && (
        <div className="absolute left-[34%] top-[46%] z-10 -translate-x-1/2 -translate-y-1/2">
          <button
            onClick={() => setShowCluster((v) => !v)}
            className="flex size-12 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground shadow-lg ring-4 ring-primary/25"
          >
            {clusterRiders.length}
          </button>
          {showCluster && (
            <div className="absolute top-full mt-2 left-1/2 w-52 -translate-x-1/2 rounded-2xl border border-border bg-popover p-2 shadow-2xl">
              <button onClick={() => setShowCluster(false)} className="absolute right-2 top-2">
                <X className="size-3" />
              </button>
              <ul className="space-y-1 pt-4">
                {clusterRiders.map((r) => (
                  <li key={r.username} className="text-xs font-medium">
                    {r.username}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
