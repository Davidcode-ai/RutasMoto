import { useEffect, useRef } from 'react';
import { wsUrl } from '@/lib/api';

type Props = { rutaId: string; enabled: boolean; onPosition?: (data: { user_id: string; username: string; lat: number; lng: number }) => void };

export default function LiveTracker({ rutaId, enabled, onPosition }: Props) {
  const wsRef = useRef<WebSocket | null>(null);
  const watchIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const ws = new WebSocket(wsUrl(`/ws/tracking/${rutaId}`));
    wsRef.current = ws;
    ws.onopen = () => {
      if (navigator.geolocation) {
        watchIdRef.current = navigator.geolocation.watchPosition(
          (pos) => {
            const payload = { lat: pos.coords.latitude, lng: pos.coords.longitude };
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify(payload));
            }
          },
          undefined,
          { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 },
        );
      }
    };
    ws.onmessage = (ev) => {
      const data = JSON.parse(ev.data);
      onPosition?.(data);
    };

    return () => {
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
      ws.close();
    };
  }, [rutaId, enabled, onPosition]);

  return null;
}
