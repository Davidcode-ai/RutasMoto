import { useCallback, useEffect, useState } from 'react';
import { useStore } from '@nanostores/react';
import { Plus, Globe, Lock, RefreshCw, AlertCircle, LogIn } from 'lucide-react';
import { $authLoading, $user, loadUser } from '@/stores/auth';
import { isLoggedIn } from '@/lib/api';

type RutaListItem = {
  id: string;
  title: string;
  visibility: string;
  status: string;
  organizer: { username: string };
  participant_count: number;
};

async function fetchRutas(): Promise<RutaListItem[]> {
  const res = await fetch('/api/rutas', {
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Error ${res.status}`);
  }
  return res.json();
}

export default function RouteListApp() {
  const user = useStore($user);
  const authLoading = useStore($authLoading);
  const [rutas, setRutas] = useState<RutaListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadRutas = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchRutas();
      setRutas(data);
    } catch (e) {
      setRutas([]);
      setError(e instanceof Error ? e.message : 'No se pudo conectar con el servidor');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRutas();
    loadUser().catch(() => {});
  }, [loadRutas]);

  return (
    <main className="flex min-h-dvh w-full flex-1 flex-col bg-background pb-10">
      <header className="flex items-center justify-between px-4 pt-6">
        <div>
          <h1 className="text-2xl font-bold text-primary">MotoRutas</h1>
          <p className="text-sm text-muted-foreground">Rutas disponibles</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => loadRutas()}
            aria-label="Actualizar"
            className="flex size-10 items-center justify-center rounded-full bg-card ring-1 ring-border"
          >
            <RefreshCw className={`size-4 ${loading ? 'animate-spin' : ''}`} />
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
        {loading && (
          <p className="py-8 text-center text-muted-foreground">Cargando rutas…</p>
        )}

        {error && !loading && (
          <div className="rounded-2xl border border-destructive/40 bg-destructive/10 p-4 text-center">
            <AlertCircle className="mx-auto mb-2 size-8 text-destructive" />
            <p className="text-sm font-semibold text-destructive">Sin conexión al servidor</p>
            <p className="mt-1 text-xs text-muted-foreground">{error}</p>
            <button
              type="button"
              onClick={() => loadRutas()}
              className="mt-3 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground"
            >
              Reintentar
            </button>
          </div>
        )}

        {!loading && !error && rutas.length === 0 && (
          <div className="rounded-2xl border border-border bg-card p-6 text-center">
            <p className="text-muted-foreground">No hay rutas públicas aún.</p>
          </div>
        )}

        {!loading &&
          rutas.map((r) => (
            <a
              key={r.id}
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
          ))}
      </div>

      <p className="mt-8 px-4 text-center text-xs text-muted-foreground">
        Demo: <span className="text-primary">demo@motorutas.app</span> / demo12345
      </p>
    </main>
  );
}
