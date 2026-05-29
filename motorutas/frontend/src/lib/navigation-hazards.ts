import { haversineMeters } from '@/lib/geo';
import { speakStr } from '@/lib/speech';
import { toast } from '@/hooks/use-toast';

export const HAZARD_ALERT_METERS = 300;
export const HAZARD_CLEAR_METERS = 450;

export type HazardKind = 'radar' | 'incident';

export type HazardPoint = {
  id: string;
  kind: HazardKind;
  name: string;
  lat: number;
  lng: number;
};

function parseHazardCollection(
  geojson: GeoJSON.FeatureCollection | null,
  kind: HazardKind,
): HazardPoint[] {
  if (!geojson?.features?.length) return [];

  return geojson.features
    .filter((f): f is GeoJSON.Feature<GeoJSON.Point> => f.geometry?.type === 'Point')
    .map((f) => {
      const [lng, lat] = f.geometry.coordinates;
      const props = f.properties as Record<string, string | undefined> | null;
      const id = props?.id ?? `${kind}-${lng},${lat}`;
      const name =
        props?.name ??
        (kind === 'radar' ? 'Radar' : 'Incidencia en la vía');
      return { id, kind, name, lat, lng };
    });
}

export async function loadNavigationHazards(): Promise<HazardPoint[]> {
  const [radaresRes, incidenciasRes] = await Promise.all([
    fetch('/radares.geojson'),
    fetch('/incidencias.geojson'),
  ]);

  const radares = radaresRes.ok
    ? ((await radaresRes.json()) as GeoJSON.FeatureCollection)
    : null;
  const incidencias = incidenciasRes.ok
    ? ((await incidenciasRes.json()) as GeoJSON.FeatureCollection)
    : null;

  return [...parseHazardCollection(radares, 'radar'), ...parseHazardCollection(incidencias, 'incident')];
}

/**
 * Comprueba radares e incidencias; toast + voz una sola vez por hazard (hasta salir del radio de reset).
 */
export function checkNavigationHazards(
  lat: number,
  lng: number,
  hazards: HazardPoint[],
  alerted: Set<string>,
): void {
  for (const hazard of hazards) {
    const dist = haversineMeters(lat, lng, hazard.lat, hazard.lng);

    if (dist <= HAZARD_ALERT_METERS) {
      if (alerted.has(hazard.id)) continue;

      alerted.add(hazard.id);

      if (hazard.kind === 'radar') {
        toast({
          title: '⚠️ Radar próximo',
          description: `${hazard.name} — ~${Math.round(dist)} m`,
          variant: 'destructive',
        });
        speakStr('Atención, radar a 300 metros');
      } else {
        toast({
          title: '🚧 Incidencia en la vía',
          description: `${hazard.name} — ~${Math.round(dist)} m`,
          variant: 'destructive',
        });
        speakStr('Atención, carretera cortada o incidencia a 300 metros');
      }
    } else if (dist > HAZARD_CLEAR_METERS && alerted.has(hazard.id)) {
      alerted.delete(hazard.id);
    }
  }
}
