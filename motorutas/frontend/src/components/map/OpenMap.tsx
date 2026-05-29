import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Plus, Minus, Navigation, Layers, X } from 'lucide-react';
import { useLeafletInvalidateSize } from '@/hooks/use-leaflet-invalidate-size';
import { drawOsrmRouteOnMap, drawStraightRouteOnMap, removeRouteLayers } from '@/lib/leaflet-route-layer';
import { fetchOsrmRouteGeometry } from '@/lib/osrm-route';

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

const DEFAULT_CENTER: L.LatLngExpression = [36.5, -5.6];

function waypointLabelIcon(index: number, name: string): L.DivIcon {
  return L.divIcon({
    className: 'motorutas-waypoint-icon',
    html: `<div class="rounded-full bg-[#1a1a1f]/95 px-2 py-0.5 text-[10px] font-semibold text-white ring-1 ring-white/20"><span class="text-[#ea580c]">${index + 1}</span> ${name}</div>`,
    iconAnchor: [0, 20],
  });
}

export default function OpenMap({
  waypoints,
  riders = [],
  clusterRiders = [],
  weatherAlerts = [],
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const routeHaloRef = useRef<L.GeoJSON | null>(null);
  const routeLineRef = useRef<L.GeoJSON | null>(null);
  const waypointLayerRef = useRef<L.LayerGroup | null>(null);
  const riderLayerRef = useRef<L.LayerGroup | null>(null);
  const routeAbortRef = useRef<AbortController | null>(null);
  const [showCluster, setShowCluster] = useState(false);
  const [mapReady, setMapReady] = useState(false);

  useLeafletInvalidateSize(mapRef, containerRef, mapReady);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const sorted = [...waypoints]
      .filter((w) => w.lat != null && w.lng != null)
      .sort((a, b) => a.order - b.order);
    const center: L.LatLngExpression =
      sorted.length > 0 ? [sorted[0].lat!, sorted[0].lng!] : DEFAULT_CENTER;

    const map = L.map(containerRef.current, {
      center,
      zoom: 9,
      zoomControl: false,
      attributionControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap',
    }).addTo(map);

    waypointLayerRef.current = L.layerGroup().addTo(map);
    riderLayerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;
    setMapReady(true);

    return () => {
      routeAbortRef.current?.abort();
      map.remove();
      mapRef.current = null;
      routeHaloRef.current = null;
      routeLineRef.current = null;
      waypointLayerRef.current = null;
      riderLayerRef.current = null;
      setMapReady(false);
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;

    const sorted = [...waypoints]
      .filter((w) => w.lat != null && w.lng != null)
      .sort((a, b) => a.order - b.order);

    const wpLayer = waypointLayerRef.current;
    wpLayer?.clearLayers();
    sorted.forEach((wp, i) => {
      L.marker([wp.lat!, wp.lng!], {
        icon: waypointLabelIcon(i, wp.name),
        zIndexOffset: 1000,
      }).addTo(wpLayer!);
    });

    routeAbortRef.current?.abort();
    const ac = new AbortController();
    routeAbortRef.current = ac;

    removeRouteLayers(routeHaloRef, routeLineRef);

    if (sorted.length < 2) return;

    const points = sorted.map((w) => ({ lat: w.lat!, lng: w.lng! }));
    const latlngs: L.LatLngExpression[] = points.map((p) => [p.lat, p.lng]);

    void (async () => {
      const geometry = await fetchOsrmRouteGeometry(points, ac.signal);
      if (ac.signal.aborted || mapRef.current !== map) return;

      let bounds: L.LatLngBounds | null = null;
      if (geometry) {
        bounds = drawOsrmRouteOnMap(map, geometry, routeHaloRef, routeLineRef);
      } else {
        bounds = drawStraightRouteOnMap(map, latlngs, routeHaloRef, routeLineRef);
      }

      if (bounds?.isValid()) {
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 12 });
        window.setTimeout(() => map.invalidateSize({ animate: false }), 100);
      }
    })();

    return () => ac.abort();
  }, [waypoints, mapReady]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;

    const riderLayer = riderLayerRef.current;
    riderLayer?.clearLayers();

    riders.forEach((r) => {
      L.marker([r.lat, r.lng], { zIndexOffset: 800 })
        .bindPopup(`<strong>${r.username}</strong>`)
        .addTo(riderLayer!);
    });
  }, [riders, mapReady]);

  return (
    <div className="relative h-full w-full min-h-0">
      <div ref={containerRef} className="motorutas-leaflet-map absolute inset-0 h-full w-full" />

      {weatherAlerts.length > 0 && (
        <div className="absolute left-3 top-20 z-[1000] max-w-[200px] rounded-xl bg-destructive/90 px-3 py-2 text-xs font-semibold text-destructive-foreground">
          {weatherAlerts[0].message}
        </div>
      )}

      <div className="absolute map-controls-right-safe top-1/2 z-[1000] flex -translate-y-1/2 flex-col gap-2">
        <div className="flex flex-col overflow-hidden rounded-full bg-card/90 ring-1 ring-border backdrop-blur">
          <button
            type="button"
            onClick={() => mapRef.current?.zoomIn()}
            className="btn-press flex size-10 items-center justify-center"
            aria-label="Acercar"
          >
            <Plus className="size-5" />
          </button>
          <div className="h-px bg-border" />
          <button
            type="button"
            onClick={() => mapRef.current?.zoomOut()}
            className="btn-press flex size-10 items-center justify-center"
            aria-label="Alejar"
          >
            <Minus className="size-5" />
          </button>
        </div>
        <button
          type="button"
          onClick={() => {
            if (!navigator.geolocation || !mapRef.current) return;
            navigator.geolocation.getCurrentPosition((pos) => {
              mapRef.current?.setView(
                [pos.coords.latitude, pos.coords.longitude],
                14,
                { animate: true },
              );
            });
          }}
          className="btn-press flex size-10 items-center justify-center rounded-full bg-card/90 text-primary ring-1 ring-border backdrop-blur"
          aria-label="Mi ubicación"
        >
          <Navigation className="size-5" />
        </button>
        <button
          type="button"
          className="btn-press flex size-10 items-center justify-center rounded-full bg-card/90 ring-1 ring-border backdrop-blur"
          aria-label="Capas"
        >
          <Layers className="size-5" />
        </button>
      </div>

      {clusterRiders.length > 0 && (
        <div className="absolute left-[34%] top-[46%] z-[1000] -translate-x-1/2 -translate-y-1/2">
          <button
            type="button"
            onClick={() => setShowCluster((v) => !v)}
            className="btn-press flex size-12 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground shadow-lg ring-4 ring-primary/25"
          >
            {clusterRiders.length}
          </button>
          {showCluster && (
            <div className="absolute top-full mt-2 left-1/2 w-52 -translate-x-1/2 rounded-2xl border border-border bg-popover p-2 shadow-2xl">
              <button
                type="button"
                onClick={() => setShowCluster(false)}
                className="absolute right-2 top-2"
                aria-label="Cerrar"
              >
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
