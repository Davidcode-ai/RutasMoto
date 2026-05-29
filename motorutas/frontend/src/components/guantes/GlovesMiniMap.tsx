import { useEffect, useRef } from 'react';

export type MapPoint = { lat: number; lng: number; label?: string };

type Props = {
  route: MapPoint[];
  user?: MapPoint | null;
  leader?: MapPoint | null;
};

const FALLBACK_ROUTE: MapPoint[] = [
  { lat: 36.466, lng: -6.199, label: 'Inicio' },
  { lat: 36.461, lng: -5.927 },
  { lat: 36.758, lng: -5.366, label: 'Fin' },
];

function boundsOf(points: MapPoint[]) {
  const lats = points.map((p) => p.lat);
  const lngs = points.map((p) => p.lng);
  const pad = 0.08;
  return {
    minLat: Math.min(...lats) - pad,
    maxLat: Math.max(...lats) + pad,
    minLng: Math.min(...lngs) - pad,
    maxLng: Math.max(...lngs) + pad,
  };
}

function project(
  lat: number,
  lng: number,
  b: ReturnType<typeof boundsOf>,
  w: number,
  h: number,
) {
  const x = ((lng - b.minLng) / (b.maxLng - b.minLng || 1)) * w;
  const y = h - ((lat - b.minLat) / (b.maxLat - b.minLat || 1)) * h;
  return { x, y };
}

export default function GlovesMiniMap({ route, user, leader }: Props) {
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
      ctx.lineJoin = 'round';
      ctx.beginPath();
      routeXY.forEach((pt, i) => {
        if (i === 0) ctx.moveTo(pt.x, pt.y);
        else ctx.lineTo(pt.x, pt.y);
      });
      ctx.stroke();

      ctx.strokeStyle = 'rgba(234, 88, 12, 0.35)';
      ctx.lineWidth = 12;
      ctx.stroke();

      const drawMarker = (pt: MapPoint, fill: string, ring: string, size: number) => {
        const { x, y } = project(pt.lat, pt.lng, b, w, h);
        ctx.beginPath();
        ctx.arc(x, y, size + 4, 0, Math.PI * 2);
        ctx.fillStyle = ring;
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fillStyle = fill;
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.stroke();
      };

      if (leader) drawMarker(leader, '#a3e635', 'rgba(163, 230, 53, 0.35)', 10);
      if (user) drawMarker(user, '#38bdf8', 'rgba(56, 189, 248, 0.35)', 12);

      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.font = 'bold 11px system-ui, sans-serif';
      ctx.fillText('Tú', 12, h - 36);
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(28, h - 40, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.fillText('Road Leader', 12, h - 16);
      ctx.fillStyle = '#a3e635';
      ctx.beginPath();
      ctx.arc(52, h - 20, 5, 0, Math.PI * 2);
      ctx.fill();
    };

    draw();
    const ro = new ResizeObserver(draw);
    ro.observe(container);
    return () => ro.disconnect();
  }, [route, user, leader]);

  return (
    <div ref={containerRef} className="h-full w-full bg-[#0a0a0c]">
      <canvas ref={canvasRef} className="block h-full w-full" aria-label="Mapa simplificado de la ruta" />
    </div>
  );
}
