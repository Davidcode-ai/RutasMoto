import { useEffect, useMemo, useState } from 'react';
import {
  X,
  MapPin,
  Bike,
  Pencil,
  Check,
  Leaf,
  Gauge,
  Flame,
  CheckCircle2,
} from 'lucide-react';
import { api, isLoggedIn } from '@/lib/api';
import { toast } from '@/hooks/use-toast';

type PaceOption = {
  id: string;
  label: string;
  sub: string;
  icon: typeof Leaf;
  ring: string;
  activeBg: string;
  activeText: string;
  iconColor: string;
};

const paceOptions: PaceOption[] = [
  {
    id: 'tranquilo',
    label: 'Tranquilo',
    sub: 'Paseo · disfrutar',
    icon: Leaf,
    ring: 'ring-emerald-500/30',
    activeBg: 'bg-emerald-500/15 ring-emerald-500/60',
    activeText: 'text-emerald-400',
    iconColor: 'text-emerald-400',
  },
  {
    id: 'intermedio',
    label: 'Intermedio',
    sub: 'Ritmo fluido',
    icon: Gauge,
    ring: 'ring-accent/30',
    activeBg: 'bg-accent/15 ring-accent/60',
    activeText: 'text-accent',
    iconColor: 'text-accent',
  },
  {
    id: 'alegre',
    label: 'Alegre',
    sub: 'Sport · curvas',
    icon: Flame,
    ring: 'ring-primary/30',
    activeBg: 'bg-primary/15 ring-primary/60',
    activeText: 'text-primary',
    iconColor: 'text-primary',
  },
];

type Moto = {
  brand: string;
  model: string;
  photo_url: string | null;
  is_primary: boolean;
  photo_ai_generated?: boolean;
};

type Props = {
  open: boolean;
  onClose: () => void;
  rutaId: string;
  routeTitle?: string;
  routeDate?: string;
  waypoints: string[];
  /** Puntos de salida adicionales (opcional), además de los waypoints de la ruta */
  extraOrigins?: string[];
  onJoined: () => void;
};

export function JoinRouteSheet({
  open,
  onClose,
  rutaId,
  routeTitle = 'la ruta',
  routeDate,
  waypoints,
  extraOrigins = [],
  onJoined,
}: Props) {
  const originOptions = useMemo(() => {
    const seen = new Set<string>();
    const list: string[] = [];
    for (const o of [...waypoints, ...extraOrigins]) {
      const t = o.trim();
      if (t && !seen.has(t)) {
        seen.add(t);
        list.push(t);
      }
    }
    return list.length > 0 ? list : ['Punto de encuentro'];
  }, [waypoints, extraOrigins]);

  const [origin, setOrigin] = useState(originOptions[0]);
  const [pace, setPace] = useState('intermedio');
  const [overrideBike, setOverrideBike] = useState(false);
  const [customBike, setCustomBike] = useState('');
  const [profileMoto, setProfileMoto] = useState<Moto | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);

  const profileBikeLabel = profileMoto
    ? `${profileMoto.brand} ${profileMoto.model}`
  : 'Sin moto en tu perfil';

  useEffect(() => {
    if (!open) return;
    setOrigin(originOptions[0]);
    setPace('intermedio');
    setOverrideBike(false);
    setCustomBike('');
    setConfirmed(false);
    api<Moto[]>('/users/me/motos')
      .then((motos) => {
        const primary = motos.find((m) => m.is_primary) ?? motos[0] ?? null;
        setProfileMoto(primary);
      })
      .catch(() => setProfileMoto(null));
  }, [open, originOptions]);

  if (!open) return null;

  if (!isLoggedIn()) {
    return (
      <div className="fixed inset-0 z-50 flex items-end justify-center" role="dialog" aria-modal="true">
        <button type="button" aria-label="Cerrar" onClick={onClose} className="absolute inset-0 bg-background/70 backdrop-blur-sm" />
        <div className="relative z-10 w-full max-w-md rounded-t-3xl border-t border-border bg-card p-6 text-center">
          <p className="mb-4 text-muted-foreground">Inicia sesión para unirte a la ruta</p>
          <a href="/auth/login" className="btn-press block rounded-2xl bg-primary py-4 font-bold text-primary-foreground">
            Iniciar sesión
          </a>
        </div>
      </div>
    );
  }

  const displayDate = routeDate ?? 'Próxima salida';
  const canConfirm = !overrideBike || customBike.trim().length > 0;

  async function handleConfirm() {
    if (!canConfirm) {
      toast({
        variant: 'destructive',
        title: 'Moto incompleta',
        description: 'Indica el modelo de moto para esta ruta',
      });
      return;
    }
    setLoading(true);
    try {
      await api(`/rutas/${rutaId}/inscripciones`, {
        method: 'POST',
        body: JSON.stringify({
          origin,
          pace_override: pace,
          custom_bike: overrideBike ? customBike.trim() : null,
        }),
      });
      setConfirmed(true);
      toast({
        title: '¡Te uniste a la ruta!',
        description: `Salida desde ${origin}`,
      });
      setTimeout(() => {
        onJoined();
        onClose();
        setConfirmed(false);
      }, 1400);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Error al unirse';
      if (msg.includes('Ya estás inscrito')) {
        toast({ title: 'Ya estabas inscrito', description: 'Tu asistencia ya estaba confirmada' });
        onJoined();
        onClose();
        return;
      }
      toast({
        variant: 'destructive',
        title: 'No se pudo confirmar',
        description: msg,
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      role="dialog"
      aria-modal="true"
      aria-label="Unirse a la ruta"
    >
      <button
        type="button"
        aria-label="Cerrar"
        onClick={onClose}
        className="absolute inset-0 bg-background/70 backdrop-blur-sm"
      />

      <div className="relative z-10 flex max-h-[92dvh] w-full max-w-md flex-col rounded-t-3xl border-t border-border bg-card shadow-2xl">
        {confirmed ? (
          <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
            <div className="flex size-20 items-center justify-center rounded-full bg-primary/15 ring-1 ring-primary/40">
              <CheckCircle2 className="size-12 text-primary" />
            </div>
            <p className="text-xl font-bold">¡Asistencia confirmada!</p>
            <p className="text-sm text-muted-foreground">
              Nos vemos en {origin}. Prepara la moto.
            </p>
          </div>
        ) : (
          <>
            <div className="shrink-0 px-4 pt-3">
              <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-border" />
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-primary">{displayDate}</p>
                  <h2 className="text-balance text-xl font-bold leading-tight">
                    Unirse a {routeTitle}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Cerrar"
                  className="flex size-9 shrink-0 items-center justify-center rounded-full bg-secondary text-muted-foreground active:scale-95"
                >
                  <X className="size-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4">
              <section className="mb-6">
                <div className="mb-2 flex items-center gap-2">
                  <MapPin className="size-4 text-primary" />
                  <h3 className="text-sm font-bold">Punto de salida</h3>
                </div>
                <p className="mb-3 text-xs text-muted-foreground">
                  Elige si sales del inicio oficial o te unes en otro waypoint.
                </p>
                <div className="flex flex-wrap gap-2">
                  {originOptions.map((opt, i) => {
                    const active = origin === opt;
                    const isOfficial = i === 0 && waypoints[0] === opt;
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setOrigin(opt)}
                        className={`flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-semibold ring-1 transition-colors active:scale-[0.98] ${
                          active
                            ? 'bg-primary text-primary-foreground ring-primary'
                            : 'bg-secondary text-secondary-foreground ring-border'
                        }`}
                      >
                        {isOfficial && (
                          <span
                            className={`text-[10px] font-bold ${
                              active ? 'text-primary-foreground/80' : 'text-primary'
                            }`}
                          >
                            OFICIAL
                          </span>
                        )}
                        {opt}
                      </button>
                    );
                  })}
                </div>
              </section>

              <section className="mb-6">
                <div className="mb-2 flex items-center gap-2">
                  <Bike className="size-4 text-primary" />
                  <h3 className="text-sm font-bold">Tu moto para esta ruta</h3>
                </div>
                <div className="rounded-2xl border border-border bg-background p-3">
                  <div className="flex items-center gap-3">
                    <div className="relative h-10 w-16 shrink-0 overflow-hidden rounded-lg bg-secondary ring-1 ring-border">
                      {profileMoto?.photo_url ? (
                        <img
                          src={profileMoto.photo_url}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <Bike className="size-5 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] text-muted-foreground">
                        {overrideBike ? 'Moto para esta ruta' : 'Desde tu perfil'}
                      </p>
                      <p className="truncate text-sm font-semibold">
                        {overrideBike
                          ? customBike || 'Escribe el modelo…'
                          : profileBikeLabel}
                      </p>
                      {!overrideBike && profileMoto?.photo_ai_generated && (
                        <span className="text-[10px] text-muted-foreground">Imagen auto-generada</span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => setOverrideBike((v) => !v)}
                      className={`flex shrink-0 items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold ring-1 transition-colors active:scale-95 ${
                        overrideBike
                          ? 'bg-primary text-primary-foreground ring-primary'
                          : 'bg-secondary text-secondary-foreground ring-border'
                      }`}
                    >
                      {overrideBike ? <Check className="size-3.5" /> : <Pencil className="size-3.5" />}
                      {overrideBike ? 'Usando otra' : 'Cambiar moto'}
                    </button>
                  </div>

                  {overrideBike && (
                    <input
                      autoFocus
                      value={customBike}
                      onChange={(e) => setCustomBike(e.target.value)}
                      placeholder="Ej: Yamaha MT-07, Ducati Monster…"
                      aria-label="Modelo de moto para esta ruta"
                      className="mt-3 w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/40"
                    />
                  )}
                </div>
              </section>

              <section>
                <div className="mb-2 flex items-center gap-2">
                  <Gauge className="size-4 text-primary" />
                  <h3 className="text-sm font-bold">Ritmo de hoy</h3>
                </div>
                <p className="mb-3 text-xs text-muted-foreground">
                  Solo para esta ruta — no cambia tu ritmo base del perfil.
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {paceOptions.map((opt) => {
                    const Icon = opt.icon;
                    const active = pace === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setPace(opt.id)}
                        className={`btn-press flex flex-col items-center gap-1.5 rounded-2xl px-2 py-4 text-center ring-1 transition-colors ${
                          active ? opt.activeBg : 'bg-secondary ring-border'
                        }`}
                      >
                        <Icon
                          className={`size-7 ${active ? opt.iconColor : 'text-muted-foreground'}`}
                        />
                        <span
                          className={`text-sm font-bold ${active ? opt.activeText : 'text-foreground'}`}
                        >
                          {opt.label}
                        </span>
                        <span className="text-[10px] leading-tight text-muted-foreground">
                          {opt.sub}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </section>
            </div>

            <div className="shrink-0 border-t border-border bg-card px-4 pb-6 pt-3">
              <button
                type="button"
                onClick={handleConfirm}
                disabled={!canConfirm || loading}
                className="btn-press flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-4 text-base font-bold text-primary-foreground shadow-lg shadow-primary/30 disabled:opacity-40"
              >
                <Check className="size-5" />
                {loading ? 'Confirmando…' : 'Confirmar Asistencia'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
