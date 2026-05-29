import { useEffect, useState } from 'react';
import {
  ChevronLeft,
  MapPin,
  Plus,
  X,
  Sparkles,
  Link2,
  Radio,
  Route as RouteIcon,
  GripVertical,
  Globe,
  Lock,
} from 'lucide-react';
import { api, isLoggedIn } from '@/lib/api';
import { loadUser } from '@/stores/auth';

function Switch({
  on,
  onChange,
  ariaLabel,
}: {
  on: boolean;
  onChange: () => void;
  ariaLabel: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={ariaLabel}
      onClick={onChange}
      className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${
        on ? 'bg-primary' : 'bg-secondary ring-1 ring-border'
      }`}
    >
      <span
        className={`absolute top-1 size-5 rounded-full bg-background shadow transition-transform ${
          on ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );
}

function StepBadge({ n }: { n: number }) {
  return (
    <span className="flex size-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
      {n}
    </span>
  );
}

const DEFAULT_WAYPOINTS = ['San Fernando', 'Medina-Sidonia', 'Grazalema'];

export default function CreateRouteApp() {
  const [authReady, setAuthReady] = useState(false);
  const [title, setTitle] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [waypoints, setWaypoints] = useState<string[]>(DEFAULT_WAYPOINTS);
  const [mapsLink, setMapsLink] = useState('');
  const [liveTracking, setLiveTracking] = useState(true);
  const [aiReturnAdded, setAiReturnAdded] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  function updateWaypoint(i: number, value: string) {
    setWaypoints((prev) => prev.map((w, idx) => (idx === i ? value : w)));
  }

  function addWaypoint() {
    setWaypoints((prev) => [...prev, '']);
  }

  function removeWaypoint(i: number) {
    if (waypoints.length <= 2) return;
    setWaypoints((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function handleAiReturn() {
    if (aiReturnAdded) return;
    const filled = waypoints.filter((w) => w.trim());
    if (filled.length < 2) return;

    setAiLoading(true);
    try {
      const res = await api<{ suggested_waypoints: { name: string }[] }>('/rutas/ai/suggest-return', {
        method: 'POST',
        body: JSON.stringify({ waypoints: filled, prefer_curves: true }),
      });
      setWaypoints((prev) => [...prev, ...res.suggested_waypoints.map((w) => w.name)]);
      setAiReturnAdded(true);
    } catch {
      setWaypoints((prev) => [
        ...prev,
        'Puerto de las Palomas (IA)',
        'El Bosque (IA)',
        'Vuelta · San Fernando (IA)',
      ]);
      setAiReturnAdded(true);
    } finally {
      setAiLoading(false);
    }
  }

  async function handleCreate() {
    if (!canCreate) return;
    setSaving(true);
    try {
      const filtered = waypoints.filter((w) => w.trim());
      const ruta = await api<{ id: string; title: string }>('/rutas', {
        method: 'POST',
        body: JSON.stringify({
          title: title.trim(),
          visibility: isPublic ? 'publica' : 'privada',
          maps_link: mapsLink.trim() || null,
          live_tracking: liveTracking,
          waypoints: filtered.map((name, order) => ({
            name: name.trim(),
            order,
            type:
              order === 0
                ? 'inicio'
                : name.includes('(IA)')
                  ? 'ia_sugerido'
                  : order === filtered.length - 1
                    ? 'fin'
                    : 'parada',
          })),
        }),
      });
      window.location.href = `/rutas/detalle?id=${ruta.id}`;
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Error al crear la ruta');
    } finally {
      setSaving(false);
    }
  }

  const canCreate = title.trim().length > 0 && waypoints.filter((w) => w.trim()).length >= 2;

  useEffect(() => {
    loadUser().finally(() => setAuthReady(true));
  }, []);

  if (!authReady) {
    return (
      <main className="flex min-h-app w-full items-center justify-center">
        <p className="text-muted-foreground">Cargando…</p>
      </main>
    );
  }

  if (!isLoggedIn()) {
    return (
      <main className="flex min-h-app w-full flex-col items-center justify-center gap-4 px-4">
        <p className="text-center text-muted-foreground">Inicia sesión para crear una ruta como Road Leader</p>
        <a href="/auth/login" className="rounded-2xl bg-primary px-8 py-3 font-bold text-primary-foreground">
          Iniciar sesión
        </a>
        <a href="/" className="text-sm text-primary">
          Volver
        </a>
      </main>
    );
  }

  return (
    <main className="flex min-h-app w-full flex-col bg-background">
      <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-border bg-background/90 px-4 pb-3 pt-safe backdrop-blur">
        <a
          href="/"
          aria-label="Volver"
          className="flex size-10 items-center justify-center rounded-full bg-card text-foreground ring-1 ring-border active:scale-95"
        >
          <ChevronLeft className="size-6" />
        </a>
        <div>
          <p className="text-[11px] font-semibold text-primary">Road Leader</p>
          <h1 className="text-lg font-bold leading-tight">Crear Nueva Ruta</h1>
        </div>
      </header>

      <div className="flex-1 space-y-5 overflow-y-auto px-4 py-5 pb-scroll-above-dock">
        {/* 1. Datos básicos */}
        <section className="rounded-2xl border border-border bg-card p-4">
          <div className="mb-3 flex items-center gap-2">
            <StepBadge n={1} />
            <h2 className="text-sm font-bold">Datos básicos</h2>
          </div>

          <label htmlFor="route-title" className="mb-1.5 block text-xs font-medium text-muted-foreground">
            Título de la ruta
          </label>
          <input
            id="route-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ej: Ruta Sierra de Cádiz"
            className="w-full rounded-xl border border-border bg-background px-3 py-3 text-base font-semibold outline-none ring-primary/40 placeholder:font-normal placeholder:text-muted-foreground focus:ring-2"
          />

          <div className="mt-4 flex items-center justify-between rounded-xl bg-background p-3 ring-1 ring-border">
            <div className="flex items-center gap-2.5">
              <span
                className={`flex size-9 items-center justify-center rounded-full ${
                  isPublic ? 'bg-accent/15 text-accent' : 'bg-secondary text-muted-foreground'
                }`}
              >
                {isPublic ? <Globe className="size-5" /> : <Lock className="size-5" />}
              </span>
              <div>
                <p className="text-sm font-semibold">{isPublic ? 'Pública' : 'Privada'}</p>
                <p className="text-[11px] text-muted-foreground">
                  {isPublic ? 'Cualquier motero puede unirse' : 'Tú aceptas o expulsas moteros'}
                </p>
              </div>
            </div>
            <Switch
              on={isPublic}
              onChange={() => setIsPublic((v) => !v)}
              ariaLabel="Ruta pública o privada"
            />
          </div>
        </section>

        {/* 2. Waypoints */}
        <section className="rounded-2xl border border-border bg-card p-4">
          <div className="mb-3 flex items-center gap-2">
            <StepBadge n={2} />
            <h2 className="text-sm font-bold">Itinerario · Waypoints</h2>
          </div>
          <p className="mb-3 text-xs text-muted-foreground">
            Define el recorrido. El primer punto es la salida oficial.
          </p>

          <ul className="space-y-2">
            {waypoints.map((wp, i) => {
              const isAi = wp.includes('(IA)');
              const isStart = i === 0;
              return (
                <li
                  key={`wp-${i}`}
                  className={`flex items-center gap-2 rounded-xl border px-2.5 py-2 ${
                    isAi ? 'border-accent/40 bg-accent/10' : 'border-border bg-background'
                  }`}
                >
                  <GripVertical className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                  <span
                    className={`flex size-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                      isAi ? 'bg-accent text-accent-foreground' : 'bg-secondary text-foreground'
                    }`}
                  >
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    {isStart && (
                      <span className="mb-0.5 block text-[10px] font-bold text-primary">SALIDA OFICIAL</span>
                    )}
                    <input
                      value={wp}
                      onChange={(e) => updateWaypoint(i, e.target.value)}
                      placeholder={`Punto ${i + 1}`}
                      aria-label={`Waypoint ${i + 1}`}
                      className="w-full bg-transparent text-sm font-medium outline-none placeholder:text-muted-foreground"
                    />
                  </div>
                  {waypoints.length > 2 && (
                    <button
                      type="button"
                      onClick={() => removeWaypoint(i)}
                      aria-label={`Eliminar waypoint ${i + 1}`}
                      className="flex size-7 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground"
                    >
                      <X className="size-4" />
                    </button>
                  )}
                </li>
              );
            })}
          </ul>

          <button
            type="button"
            onClick={addWaypoint}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border py-3 text-sm font-semibold text-muted-foreground transition active:scale-[0.98] hover:border-primary/40 hover:text-primary"
          >
            <Plus className="size-4" />
            Añadir waypoint
          </button>
        </section>

        {/* 3. IA vuelta */}
        <section className="overflow-hidden rounded-2xl border border-accent/40 bg-accent/5 p-4">
          <div className="mb-3 flex items-center gap-2">
            <span className="flex size-6 items-center justify-center rounded-full bg-accent text-xs font-bold text-accent-foreground">
              3
            </span>
            <h2 className="text-sm font-bold">Vuelta por decidir</h2>
          </div>

          <button
            type="button"
            onClick={handleAiReturn}
            disabled={aiLoading || aiReturnAdded}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent py-3.5 text-sm font-bold text-accent-foreground shadow-lg shadow-accent/20 transition active:scale-[0.98] disabled:opacity-70"
          >
            <Sparkles className={`size-5 ${aiLoading ? 'animate-pulse' : ''}`} />
            {aiLoading
              ? 'Buscando curvas…'
              : aiReturnAdded
                ? 'Vuelta añadida con IA'
                : 'Autocompletar ruta de vuelta con IA'}
          </button>
          <p className="mt-2 text-center text-xs text-muted-foreground">
            Buscaremos las mejores curvas para volver.
          </p>
        </section>

        {/* 4. Google Maps */}
        <section className="rounded-2xl border border-border bg-card p-4">
          <div className="mb-3 flex items-center gap-2">
            <StepBadge n={4} />
            <h2 className="text-sm font-bold">
              Enlace de Google Maps{' '}
              <span className="font-normal text-muted-foreground">· opcional</span>
            </h2>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2.5 focus-within:ring-2 focus-within:ring-primary/40">
            <Link2 className="size-4 shrink-0 text-muted-foreground" />
            <input
              value={mapsLink}
              onChange={(e) => setMapsLink(e.target.value)}
              placeholder="Pega tu enlace de Maps aquí"
              aria-label="Enlace de Google Maps"
              inputMode="url"
              className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>
        </section>

        {/* 5. Tracking en vivo */}
        <section className="rounded-2xl border border-border bg-card p-4">
          <div className="mb-2 flex items-center gap-2">
            <StepBadge n={5} />
            <h2 className="text-sm font-bold">Tracking en vivo</h2>
          </div>
          <div className="flex items-center justify-between gap-3 rounded-xl bg-background p-3 ring-1 ring-border">
            <div className="flex items-center gap-2.5">
              <span
                className={`flex size-9 items-center justify-center rounded-full ${
                  liveTracking ? 'bg-primary/15 text-primary' : 'bg-secondary text-muted-foreground'
                }`}
              >
                <Radio className="size-5" />
              </span>
              <div>
                <p className="text-sm font-semibold">Activar localización en vivo</p>
                <p className="text-[11px] text-muted-foreground">
                  Para que los rezagados se unan sobre la marcha
                </p>
              </div>
            </div>
            <Switch
              on={liveTracking}
              onChange={() => setLiveTracking((v) => !v)}
              ariaLabel="Activar tracking en vivo para rezagados"
            />
          </div>
        </section>
      </div>

      <div className="app-dock-bottom pointer-events-none">
        <div className="app-dock-bottom-inner pointer-events-auto bg-gradient-to-t from-background via-background to-transparent px-4 pt-8">
          <button
            type="button"
            onClick={handleCreate}
            disabled={!canCreate || saving}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-4 text-base font-bold text-primary-foreground shadow-lg shadow-primary/30 transition active:scale-[0.98] disabled:opacity-40"
          >
            <RouteIcon className="size-5" />
            {saving ? 'Creando ruta…' : 'Crear Ruta'}
          </button>
          {!canCreate && (
            <p className="mt-2 text-center text-[11px] text-muted-foreground">
              Añade un título y al menos 2 waypoints
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
