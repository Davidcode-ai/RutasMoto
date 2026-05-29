import { useCallback, useEffect, useState } from 'react';
import {
  ChevronLeft,
  Plus,
  Users,
  MessageCircle,
  Globe,
  Lock,
  Clock,
  Route as RouteIcon,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useUrlSearchParam } from '@/hooks/use-url-search-param';
import OpenMap from '@/components/map/OpenMap';
import ChatPanel from '@/components/chat/ChatPanel';
import LiveTracker from '@/components/tracking/LiveTracker';
import GlovesMode from '@/components/guantes/GlovesMode';
import { RiderCard } from '@/components/route/RiderCard';
import { JoinRouteSheet } from '@/components/route/JoinRouteSheet';

type RutaDetail = {
  id: string;
  title: string;
  description: string | null;
  visibility: string;
  status: string;
  live_tracking: boolean;
  start_time?: string | null;
  organizer: { id: string; username: string; avatar_url: string | null };
  waypoints: { name: string; lat: number | null; lng: number | null; order: number }[];
  inscripciones: { id: string; user?: { id: string; username: string; avatar_url: string | null }; pace_override?: string; origin?: string }[];
};

type TrackingPos = { user_id: string; username: string; lat: number; lng: number };

export default function RouteDetailApp({ rutaId: rutaIdProp }: { rutaId?: string }) {
  const rutaIdFromUrl = useUrlSearchParam('id');
  const rutaId = rutaIdProp || rutaIdFromUrl;

  const [ruta, setRuta] = useState<RutaDetail | null>(null);
  const [tab, setTab] = useState<'asistentes' | 'chat'>('asistentes');
  const [joinOpen, setJoinOpen] = useState(false);
  const [glovesOpen, setGlovesOpen] = useState(false);
  const [positions, setPositions] = useState<TrackingPos[]>([]);
  const [weatherAlerts, setWeatherAlerts] = useState<{ message: string }[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadRuta = useCallback(() => {
    if (!rutaId) return;
    setLoadError(null);
    api<RutaDetail>(`/rutas/${rutaId}`)
      .then(setRuta)
      .catch((e) => {
        setRuta(null);
        setLoadError(e instanceof Error ? e.message : 'No se pudo cargar la ruta');
      });
  }, [rutaId]);

  useEffect(() => {
    if (rutaId) loadRuta();
  }, [rutaId, loadRuta]);

  useEffect(() => {
    const wp = ruta?.waypoints.find((w) => w.lat && w.lng);
    if (!wp) return;
    api<{ alerts: { message: string }[] }>(`/weather/waypoint?lat=${wp.lat}&lng=${wp.lng}`)
      .then((d) => setWeatherAlerts(d.alerts || []))
      .catch(() => {});
  }, [ruta]);

  if (!rutaId) {
    return (
      <main className="no-scrollbar-x flex min-h-app w-full items-center justify-center">
        <p className="text-muted-foreground">Ruta no especificada</p>
      </main>
    );
  }

  if (!ruta) {
    return (
      <main className="no-scrollbar-x flex min-h-app w-full flex-col items-center justify-center gap-4 px-4">
        {loadError ? (
          <>
            <p className="text-center text-destructive">{loadError}</p>
            <button
              type="button"
              onClick={loadRuta}
              className="btn-press rounded-2xl bg-primary px-6 py-3 font-bold text-primary-foreground"
            >
              Reintentar
            </button>
            <a href="/" className="text-sm text-primary">
              Volver al inicio
            </a>
          </>
        ) : (
          <p className="text-muted-foreground">Cargando ruta…</p>
        )}
      </main>
    );
  }

  const isPublic = ruta.visibility === 'publica';
  const waypointNames = ruta.waypoints.map((w) => w.name);
  const clusterRiders = ruta.inscripciones
    .filter((i) => i.origin === waypointNames[0])
    .map((i) => ({ username: i.user?.username || 'Motero', avatar_url: i.user?.avatar_url }));

  return (
    <main className="no-scrollbar-x flex min-h-app w-full min-w-0 flex-col bg-background">
      {ruta.live_tracking && (
        <LiveTracker
          rutaId={rutaId}
          enabled={ruta.status === 'en_curso' || glovesOpen}
          onPosition={(p) =>
            setPositions((prev) => {
              const filtered = prev.filter((x) => x.user_id !== p.user_id);
              return [...filtered, p];
            })
          }
        />
      )}
      <GlovesMode
        rutaId={rutaId}
        open={glovesOpen}
        onClose={() => setGlovesOpen(false)}
        waypoints={ruta.waypoints}
        organizerId={ruta.organizer.id}
        organizerName={ruta.organizer.username}
      />

      <div className="relative map-pane-route-detail w-full min-h-0 min-w-0 shrink-0">
        <OpenMap
          waypoints={ruta.waypoints}
          riders={positions}
          clusterRiders={clusterRiders}
          weatherAlerts={weatherAlerts}
        />
        <header className="absolute inset-x-0 top-0 flex items-center justify-between px-4 pt-safe">
          <a
            href="/"
            className="btn-press flex size-11 items-center justify-center rounded-full bg-card/80 ring-1 ring-border backdrop-blur"
          >
            <ChevronLeft className="size-6" />
          </a>
          <div className="flex gap-2">
            <a
              href="/rutas/crear"
              className="btn-press flex size-11 items-center justify-center rounded-full bg-card/80 ring-1 ring-border backdrop-blur"
            >
              <Plus className="size-5" />
            </a>
            <a
              href="/perfil"
              className="btn-press flex size-11 items-center justify-center rounded-full bg-card/80 ring-1 ring-border backdrop-blur"
            >
              <Users className="size-5" />
            </a>
          </div>
        </header>
      </div>

      <section className="relative z-10 -mt-6 flex min-w-0 flex-1 flex-col rounded-t-3xl border-t border-border bg-background pt-2">
        <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-border" />
        <div className="min-w-0 px-4 pb-4">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <span
              className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${
                isPublic ? 'bg-accent/15 text-accent ring-accent/30' : 'bg-secondary ring-border'
              }`}
            >
              {isPublic ? <Globe className="size-3.5" /> : <Lock className="size-3.5" />}
              {isPublic ? 'Pública' : 'Privada'}
            </span>
            <span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
              <RouteIcon className="size-4 text-primary" />
              {ruta.waypoints.length} paradas
            </span>
            <span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
              <Clock className="size-4 text-primary" />
              {ruta.status}
            </span>
          </div>
          <h1 className="mt-2 break-words text-2xl font-bold leading-tight">{ruta.title}</h1>
          <div className="mt-3 flex min-w-0 items-center gap-2 rounded-2xl border border-border bg-card p-2">
            <img
              src={ruta.organizer.avatar_url || '/placeholder.svg'}
              alt=""
              className="size-9 shrink-0 rounded-full object-cover ring-2 ring-primary/40"
            />
            <div className="min-w-0">
              <p className="text-[11px] text-muted-foreground">Road Leader</p>
              <p className="truncate text-sm font-semibold">{ruta.organizer.username}</p>
            </div>
          </div>
        </div>

        <div className="px-4" role="tablist" aria-label="Secciones de la ruta">
          <div className="grid grid-cols-2 gap-1 rounded-full bg-secondary p-1">
            <button
              type="button"
              role="tab"
              aria-selected={tab === 'asistentes'}
              onClick={() => setTab('asistentes')}
              className={`btn-press flex items-center justify-center gap-2 rounded-full py-2 text-sm font-semibold transition-colors ${
                tab === 'asistentes' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
              }`}
            >
              <Users className="size-4 shrink-0" />
              <span className="truncate">Asistentes ({ruta.inscripciones.length})</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === 'chat'}
              onClick={() => setTab('chat')}
              className={`btn-press flex items-center justify-center gap-2 rounded-full py-2 text-sm font-semibold transition-colors ${
                tab === 'chat' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
              }`}
            >
              <MessageCircle className="size-4 shrink-0" />
              Chat
            </button>
          </div>
        </div>

        {/* Paneles montados siempre: evita desmontar ChatPanel y parpadeos al cambiar pestaña */}
        <div
          role="tabpanel"
          aria-hidden={tab !== 'asistentes'}
          className={`flex-1 overflow-y-auto px-4 pb-scroll-above-dock pt-4 ${
            tab !== 'asistentes' ? 'hidden' : ''
          }`}
        >
          <div className="space-y-3">
            {ruta.inscripciones.map((ins) => (
              <RiderCard key={ins.id} rider={ins} />
            ))}
            {ruta.inscripciones.length === 0 && (
              <p className="text-sm text-muted-foreground">Aún no hay inscritos.</p>
            )}
          </div>
        </div>

        <div
          role="tabpanel"
          aria-hidden={tab !== 'chat'}
          className={`min-h-[55dvh] min-w-0 flex-1 flex-col overflow-hidden ${
            tab !== 'chat' ? 'hidden' : 'flex'
          }`}
        >
          <ChatPanel
            rutaId={rutaId}
            routeTitle={ruta.title}
            participantCount={ruta.inscripciones.length}
            activeCount={Math.max(ruta.inscripciones.length, positions.length)}
            embedded
            wsActive={tab === 'chat'}
          />
        </div>
      </section>

      {tab === 'asistentes' && (
        <div className="app-dock-bottom pointer-events-none">
          <div className="app-dock-bottom-inner pointer-events-auto bg-gradient-to-t from-background via-background to-transparent px-4 pt-8">
            <button
              type="button"
              onClick={() => setJoinOpen(true)}
              className="btn-press flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-4 text-base font-bold text-primary-foreground shadow-lg shadow-primary/30"
            >
              <Plus className="size-5" />
              Unirse a la Ruta
            </button>
            <button
              type="button"
              onClick={() => setGlovesOpen(true)}
              className="btn-press mt-2 flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-[#22c55e] bg-[#16a34a] py-4 text-lg font-black text-white shadow-[0_0_28px_rgba(34,197,94,0.45)]"
            >
              ▶ Iniciar
            </button>
          </div>
        </div>
      )}

      <JoinRouteSheet
        open={joinOpen}
        onClose={() => setJoinOpen(false)}
        rutaId={rutaId}
        routeTitle={ruta.title}
        routeDate={
          ruta.start_time
            ? new Intl.DateTimeFormat('es-ES', {
                weekday: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              }).format(new Date(ruta.start_time))
            : undefined
        }
        waypoints={waypointNames}
        onJoined={loadRuta}
      />
    </main>
  );
}
