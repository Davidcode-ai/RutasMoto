import { useCallback, useEffect, useRef, useState } from 'react';
import { useStore } from '@nanostores/react';
import {
  Plus,
  Globe,
  Lock,
  RefreshCw,
  AlertCircle,
  LogIn,
  Loader2,
} from 'lucide-react';
import { $authLoading, $user, loadUser } from '@/stores/auth';
import { isLoggedIn } from '@/lib/api';

const PAGE_LIMIT = 10;

type RutaListItem = {
  id: string;
  title: string;
  visibility: string;
  status: string;
  organizer: { username: string };
  participant_count: number;
};

type RutaListPage = {
  items: RutaListItem[];
  total: number;
  skip: number;
  limit: number;
};

async function fetchRutaPage(skip: number, limit: number): Promise<RutaListPage> {
  const res = await fetch(`/api/rutas?skip=${skip}&limit=${limit}`, {
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Error ${res.status}`);
  }
  const data = (await res.json()) as RutaListPage | RutaListItem[];
  if (Array.isArray(data)) {
    return { items: data, total: data.length, skip, limit };
  }
  return data;
}

function RouteCardSkeleton() {
  return (
    <div
      className="animate-pulse rounded-2xl border border-border bg-card p-4"
      aria-hidden
    >
      <div className="flex gap-2">
        <div className="h-5 w-16 rounded-full bg-muted" />
        <div className="h-5 w-24 rounded-full bg-muted" />
      </div>
      <div className="mt-3 h-6 w-4/5 rounded-lg bg-muted" />
      <div className="mt-2 h-4 w-1/2 rounded bg-muted" />
    </div>
  );
}

function RouteCard({ r }: { r: RutaListItem }) {
  return (
    <a
      href={`/rutas/detalle?id=${r.id}`}
      className="block rounded-2xl border border-border bg-card p-4 transition active:scale-[0.99]"
    >
      <div className="flex items-center gap-2">
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ${
            r.visibility === 'publica'
              ? 'bg-accent/15 text-accent ring-accent/30'
              : 'bg-secondary text-muted-foreground ring-border'
          }`}
        >
          {r.visibility === 'publica' ? <Globe className="size-3" /> : <Lock className="size-3" />}
          {r.visibility === 'publica' ? 'Pública' : 'Privada'}
        </span>
        <span className="text-xs text-muted-foreground">
          {r.participant_count} {r.participant_count === 1 ? 'motero' : 'moteros'}
        </span>
      </div>
      <h2 className="mt-2 text-lg font-bold">{r.title}</h2>
      <p className="text-sm text-muted-foreground">por {r.organizer.username}</p>
    </a>
  );
}

export default function RouteListApp() {
  const user = useStore($user);
  const authLoading = useStore($authLoading);

  const [items, setItems] = useState<RutaListItem[]>([]);
  const [skip, setSkip] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sentinelRef = useRef<HTMLDivElement>(null);
  const loadMoreRef = useRef<() => void>(() => {});

  const loadInitial = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setSkip(0);
    setHasMore(true);
    try {
      const page = await fetchRutaPage(0, PAGE_LIMIT);
      setItems(page.items);
      setSkip(page.items.length);
      setHasMore(page.skip + page.items.length < page.total);
    } catch (e) {
      setItems([]);
      setSkip(0);
      setHasMore(false);
      setError(e instanceof Error ? e.message : 'No se pudo conectar con el servidor');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadMoreRoutes = useCallback(async () => {
    if (isLoading || isLoadingMore || !hasMore || error) return;

    setIsLoadingMore(true);
    try {
      const page = await fetchRutaPage(skip, PAGE_LIMIT);
      setItems((prev) => {
        const seen = new Set(prev.map((r) => r.id));
        const merged = page.items.filter((r) => !seen.has(r.id));
        return [...prev, ...merged];
      });
      const nextSkip = skip + page.items.length;
      setSkip(nextSkip);
      setHasMore(nextSkip < page.total);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudieron cargar más rutas');
    } finally {
      setIsLoadingMore(false);
    }
  }, [skip, hasMore, isLoading, isLoadingMore, error]);

  loadMoreRef.current = loadMoreRoutes;

  useEffect(() => {
    loadInitial();
    loadUser().catch(() => {});
  }, [loadInitial]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || isLoading || error) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          loadMoreRef.current();
        }
      },
      { root: null, rootMargin: '120px', threshold: 0 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [isLoading, error, items.length, hasMore]);

  return (
    <main className="flex min-h-app w-full flex-1 flex-col bg-background pb-safe-page">
      <header className="flex items-center justify-between px-4 pt-6">
        <div>
          <h1 className="text-2xl font-bold text-primary">MotoRutas</h1>
          <p className="text-sm text-muted-foreground">Rutas disponibles</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => loadInitial()}
            disabled={isLoading}
            aria-label="Actualizar"
            className="flex size-10 items-center justify-center rounded-full bg-card ring-1 ring-border disabled:opacity-60"
          >
            <RefreshCw className={`size-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          {!authLoading && !user && !isLoggedIn() && (
            <a
              href="/auth/login"
              className="flex items-center gap-1 rounded-full bg-card px-3 py-2 text-sm font-semibold ring-1 ring-border"
            >
              <LogIn className="size-4" />
              Entrar
            </a>
          )}
          <a
            href="/perfil"
            className="rounded-full bg-card px-4 py-2 text-sm font-semibold ring-1 ring-border"
          >
            Perfil
          </a>
          <a
            href="/rutas/crear"
            className="flex items-center gap-1 rounded-full bg-primary px-4 py-2 text-sm font-bold text-primary-foreground"
          >
            <Plus className="size-4" />
            Crear
          </a>
        </div>
      </header>

      <div className="space-y-3 px-4 pt-6">
        {isLoading && (
          <>
            <RouteCardSkeleton />
            <RouteCardSkeleton />
            <RouteCardSkeleton />
          </>
        )}

        {error && !isLoading && items.length === 0 && (
          <div className="rounded-2xl border border-destructive/40 bg-destructive/10 p-4 text-center">
            <AlertCircle className="mx-auto mb-2 size-8 text-destructive" />
            <p className="text-sm font-semibold text-destructive">Sin conexión al servidor</p>
            <p className="mt-1 text-xs text-muted-foreground">{error}</p>
            <button
              type="button"
              onClick={() => loadInitial()}
              className="mt-3 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground"
            >
              Reintentar
            </button>
          </div>
        )}

        {!isLoading && !error && items.length === 0 && (
          <div className="rounded-2xl border border-border bg-card p-6 text-center">
            <p className="text-muted-foreground">No hay rutas públicas aún.</p>
          </div>
        )}

        {!isLoading &&
          items.map((r) => (
            <RouteCard key={r.id} r={r} />
          ))}

        {error && !isLoading && items.length > 0 && (
          <p className="text-center text-xs text-destructive">{error}</p>
        )}

        <div ref={sentinelRef} className="h-1 w-full" aria-hidden />

        {isLoadingMore && (
          <div className="flex justify-center py-4" role="status" aria-live="polite">
            <Loader2 className="size-6 animate-spin text-primary" aria-label="Cargando más rutas" />
          </div>
        )}

        {!isLoading && !isLoadingMore && !hasMore && items.length > 0 && (
          <p className="pb-2 text-center text-xs text-muted-foreground">
            Has llegado al final de las rutas
          </p>
        )}
      </div>

      <p className="mt-8 px-4 text-center text-xs text-muted-foreground">
        Demo: <span className="text-primary">demo@motorutas.app</span> / demo12345
      </p>
    </main>
  );
}
