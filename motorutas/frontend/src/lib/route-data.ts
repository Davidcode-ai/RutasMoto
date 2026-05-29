export type Pace = 'Tranquilo' | 'Intermedio' | 'Alegre' | 'Rápido';

export const paceStyles: Record<Pace, string> = {
  Tranquilo: 'bg-emerald-500/15 text-emerald-400 ring-emerald-500/30',
  Intermedio: 'bg-sky-500/15 text-sky-400 ring-sky-500/30',
  Alegre: 'bg-accent/15 text-accent ring-accent/30',
  Rápido: 'bg-primary/15 text-primary ring-primary/30',
};

import type { LucideIcon } from 'lucide-react';
import { Flame, Gauge, Leaf, Zap } from 'lucide-react';

export const paceMeta: Record<
  Pace,
  { icon: LucideIcon; label: string; apiValue: string }
> = {
  Tranquilo: { icon: Leaf, label: 'Tranquilo / Paseo', apiValue: 'tranquilo' },
  Intermedio: { icon: Gauge, label: 'Intermedio', apiValue: 'intermedio' },
  Alegre: { icon: Zap, label: 'Alegre / Sport', apiValue: 'alegre' },
  Rápido: { icon: Flame, label: 'Rápido', apiValue: 'rapido' },
};

export function paceFromApi(pace: string | null | undefined): Pace {
  const map: Record<string, Pace> = {
    tranquilo: 'Tranquilo',
    intermedio: 'Intermedio',
    alegre: 'Alegre',
    rapido: 'Rápido',
  };
  return map[pace || 'intermedio'] || 'Intermedio';
}

export function apiPaceFromPace(pace: Pace): string {
  const entry = Object.entries(paceMeta).find(([k]) => k === pace);
  return entry?.[1].apiValue ?? 'intermedio';
}
