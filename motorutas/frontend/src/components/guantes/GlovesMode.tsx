import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Coffee, Fuel, Radio, X } from 'lucide-react';
import { useStore } from '@nanostores/react';
import { api, isLoggedIn, wsUrl } from '@/lib/api';
import { $user } from '@/stores/auth';
import GlovesMiniMap, { type MapPoint } from '@/components/guantes/GlovesMiniMap';

type TrackingPos = { user_id: string; username: string; lat: number; lng: number };

type Waypoint = { name: string; lat: number | null; lng: number | null };

type Props = {
  rutaId: string;
  open: boolean;
  onClose: () => void;
  waypoints?: Waypoint[];
  organizerId?: string;
  organizerName?: string;
};

export default function GlovesMode({
  rutaId,
  open,
  onClose,
  waypoints = [],
  organizerId,
  organizerName = 'Road Leader',
}: Props) {
  const user = useStore($user);
  const [userPos, setUserPos] = useState<MapPoint | null>(null);
  const [positions, setPositions] = useState<TrackingPos[]>([]);
  const [sent, setSent] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const routePoints: MapPoint[] = useMemo(
    () =>
      waypoints
        .filter((w) => w.lat != null && w.lng != null)
        .map((w) => ({ lat: w.lat!, lng: w.lng!, label: w.name })),
    [waypoints],
  );

  const leaderPos = useMemo((): MapPoint | null => {
    const leader = positions.find((p) =>
      organizerId ? p.user_id === organizerId : p.username === organizerName,
    );
    if (leader) return { lat: leader.lat, lng: leader.lng, label: organizerName };
    return positions[0]
      ? { lat: positions[0].lat, lng: positions[0].lng, label: positions[0].username }
      : null;
  }, [positions, organizerId, organizerName]);

  const connectedCount = useMemo(() => {
    const ids = new Set(positions.map((p) => p.user_id));
    if (userPos && user?.id) ids.add(user.id);
    return Math.max(ids.size, userPos ? 1 : 0);
  }, [positions, userPos, user?.id]);

  const mergePosition = useCallback((p: TrackingPos) => {
    setPositions((prev) => {
      const next = prev.filter((x) => x.user_id !== p.user_id);
      return [...next, p];
    });
  }, []);

  useEffect(() => {
    if (!open) return;

    api<TrackingPos[]>(`/rutas/${rutaId}/tracking`)
      .then((list) => setPositions(list))
      .catch(() => {});

    let watchId: number | null = null;

    const ws = new WebSocket(wsUrl(`/ws/tracking/${rutaId}`));

    const pushLocation = (lat: number, lng: number) => {
      setUserPos({ lat, lng });
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ lat, lng }));
      }
    };

    if (navigator.geolocation && watchId == null) {
      watchId = navigator.geolocation.watchPosition(
        (pos) => pushLocation(pos.coords.latitude, pos.coords.longitude),
        undefined,
        { enableHighAccuracy: true, maximumAge: 3000, timeout: 15000 },
      );
    }

    ws.onmessage = (ev) => {
      try {
        mergePosition(JSON.parse(ev.data));
      } catch {
        /* ignore */
      }
    };

    const poll = setInterval(() => {
      api<TrackingPos[]>(`/rutas/${rutaId}/tracking`)
        .then(setPositions)
        .catch(() => {});
    }, 15000);

    return () => {
      if (watchId != null) navigator.geolocation.clearWatch(watchId);
      ws.close();
      clearInterval(poll);
    };
  }, [open, rutaId, mergePosition]);

  if (!open) return null;

  async function notifyGroup(type: 'sos' | 'parada' | 'gasolinera', label: string) {
    if (!isLoggedIn()) {
      alert('Inicia sesión para avisar al grupo');
      return;
    }
    if (sending) return;
    setSending(true);
    setSent(label);
    const content = `🚨 ${label}`;
    try {
      await api(`/rutas/${rutaId}/mensajes`, {
        method: 'POST',
        body: JSON.stringify({ content, type }),
      });
    } catch {
      /* haptic feedback via visual only */
    } finally {
      setSending(false);
      setTimeout(() => setSent(null), 2200);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex w-full flex-col bg-black text-white"
      role="dialog"
      aria-modal="true"
      aria-label="Modo guantes en ruta"
    >
      {/* Mapa — mitad superior */}
      <div className="relative h-[50dvh] min-h-[200px] shrink-0 border-b-4 border-white">
        <GlovesMiniMap route={routePoints} user={userPos} leader={leaderPos} />

        <div className="pointer-events-none absolute inset-x-0 top-0 flex justify-between p-3">
          <div className="rounded-xl bg-black/80 px-3 py-2 ring-2 ring-white">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#a3e635]">Modo Guantes</p>
            <p className="text-sm font-black">EN RUTA</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Salir modo guantes"
            className="pointer-events-auto flex size-14 items-center justify-center rounded-2xl border-4 border-white bg-black active:scale-95"
          >
            <X className="size-8" strokeWidth={3} />
          </button>
        </div>

        <div
          className="pointer-events-none absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full border-2 border-white bg-black px-4 py-2 shadow-lg"
          aria-live="polite"
        >
          <Radio className="size-4 text-[#a3e635] animate-pulse" />
          <span className="text-sm font-black tabular-nums">
            {connectedCount} <span className="font-bold text-white/80">en tracking</span>
          </span>
        </div>
      </div>

      {sent && (
        <div className="shrink-0 bg-[#a3e635] px-4 py-4 text-center text-xl font-black text-black">
          ✓ {sent} — Grupo avisado
        </div>
      )}

      {/* Botonera — mitad inferior */}
      <div className="flex flex-1 flex-col gap-3 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <button
          type="button"
          disabled={sending}
          onClick={() => notifyGroup('sos', 'SOS / Parada de Emergencia')}
          className="flex min-h-[88px] w-full flex-col items-center justify-center gap-1 rounded-2xl border-4 border-white bg-red-600 px-4 py-4 text-center shadow-[0_0_24px_rgba(220,38,38,0.6)] active:scale-[0.98] disabled:opacity-60"
        >
          <AlertTriangle className="size-10 shrink-0" strokeWidth={2.5} />
          <span className="text-lg font-black leading-tight sm:text-xl">
            SOS / Parada de Emergencia
          </span>
        </button>

        <div className="grid flex-1 grid-cols-2 gap-3 min-h-[120px]">
          <button
            type="button"
            disabled={sending}
            onClick={() => notifyGroup('gasolinera', 'Necesito Gasolina')}
            className="flex flex-col items-center justify-center gap-2 rounded-2xl border-4 border-[#a3e635] bg-[#1a2e0a] px-2 py-4 active:scale-[0.98] disabled:opacity-60"
          >
            <Fuel className="size-12 text-[#a3e635]" strokeWidth={2.5} />
            <span className="text-center text-base font-black leading-tight text-[#a3e635] sm:text-lg">
              Necesito
              <br />
              Gasolina
            </span>
          </button>

          <button
            type="button"
            disabled={sending}
            onClick={() => notifyGroup('parada', 'Parada para Café / Descanso')}
            className="flex flex-col items-center justify-center gap-2 rounded-2xl border-4 border-white bg-[#1a1a1f] px-2 py-4 active:scale-[0.98] disabled:opacity-60"
          >
            <Coffee className="size-12 text-white" strokeWidth={2.5} />
            <span className="text-center text-base font-black leading-tight sm:text-lg">
              Parada Café
              <br />
              / Descanso
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
