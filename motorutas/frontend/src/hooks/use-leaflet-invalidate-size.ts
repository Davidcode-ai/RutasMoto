import { useEffect, type RefObject } from 'react';
import type L from 'leaflet';

/**
 * Repinta el mapa cuando el contenedor cambia de tamaño (móvil, PWA, teclado virtual).
 */
export function useLeafletInvalidateSize(
  mapRef: RefObject<L.Map | null>,
  containerRef: RefObject<HTMLElement | null>,
  mapReady: boolean,
): void {
  useEffect(() => {
    const map = mapRef.current;
    const container = containerRef.current;
    if (!mapReady || !map || !container) return;

    const invalidate = () => {
      requestAnimationFrame(() => {
        window.setTimeout(() => {
          if (mapRef.current) {
            mapRef.current.invalidateSize({ animate: false, pan: false });
          }
        }, 50);
      });
    };

    invalidate();

    const ro = new ResizeObserver(invalidate);
    ro.observe(container);

    const onOrientation = () => invalidate();
    window.addEventListener('orientationchange', onOrientation);

    return () => {
      ro.disconnect();
      window.removeEventListener('orientationchange', onOrientation);
    };
  }, [mapReady, mapRef, containerRef]);
}
