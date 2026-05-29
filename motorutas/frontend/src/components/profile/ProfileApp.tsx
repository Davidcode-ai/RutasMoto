import { useEffect, useState } from 'react';
import { useStore } from '@nanostores/react';
import {
  ChevronLeft,
  Settings,
  Pencil,
  Gauge,
  Trophy,
  Route as RouteIcon,
  Bike,
  BadgeCheck,
  ChevronRight,
  X,
  LogOut,
} from 'lucide-react';
import {
  $user,
  $authLoading,
  logout,
  updateProfile,
  riderLevel,
} from '@/stores/auth';
import {
  $motos,
  $profileStats,
  $profileLoading,
  DEMO_GARAGE,
  loadProfile,
  addMoto,
  updateMoto,
} from '@/stores/profile';
import { apiPaceFromPace, paceFromApi, paceMeta, paceStyles, type Pace } from '@/lib/route-data';

function EditProfileSheet({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const user = useStore($user);
  const [username, setUsername] = useState(user?.username ?? '');
  const [pace, setPace] = useState<Pace>(paceFromApi(user?.pace_base));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open && user) {
      setUsername(user.username);
      setPace(paceFromApi(user.pace_base));
    }
  }, [open, user]);

  if (!open || !user) return null;

  async function save() {
    setSaving(true);
    try {
      await updateProfile({
        username: username.trim(),
        pace_base: apiPaceFromPace(pace),
      });
      onClose();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Error al guardar');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" role="dialog" aria-modal="true">
      <button type="button" aria-label="Cerrar" onClick={onClose} className="absolute inset-0 bg-background/70 backdrop-blur-sm" />
      <div className="relative z-10 w-full max-w-md rounded-t-3xl border-t border-border bg-card px-4 pb-8 pt-3">
        <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-border" />
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">Editar perfil</h2>
          <button type="button" onClick={onClose} className="text-muted-foreground">
            <X className="size-5" />
          </button>
        </div>
        <label className="text-xs font-medium text-muted-foreground">Nombre de usuario</label>
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/40"
        />
        <p className="mb-2 mt-4 text-xs font-medium text-muted-foreground">Ritmo base</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {(Object.keys(paceMeta) as Pace[]).map((p) => {
            const Icon = paceMeta[p].icon;
            const active = pace === p;
            return (
              <button
                key={p}
                type="button"
                onClick={() => setPace(p)}
                className={`flex flex-col items-center gap-1 rounded-xl py-3 ring-1 ${
                  active ? paceStyles[p] : 'bg-secondary ring-border'
                }`}
              >
                <Icon className="size-5" />
                <span className="text-[10px] font-bold">{p}</span>
              </button>
            );
          })}
        </div>
        <button
          type="button"
          onClick={save}
          disabled={saving || !username.trim()}
          className="mt-6 w-full rounded-2xl bg-primary py-4 font-bold text-primary-foreground disabled:opacity-50"
        >
          {saving ? 'Guardando…' : 'Guardar cambios'}
        </button>
      </div>
    </div>
  );
}

function EditMotoSheet({
  open,
  onClose,
  motoId,
  initialBrand,
  initialModel,
}: {
  open: boolean;
  onClose: () => void;
  motoId: string | null;
  initialBrand: string;
  initialModel: string;
}) {
  const [brand, setBrand] = useState(initialBrand);
  const [model, setModel] = useState(initialModel);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setBrand(initialBrand);
      setModel(initialModel);
    }
  }, [open, initialBrand, initialModel]);

  if (!open) return null;

  async function save() {
    if (!brand.trim() || !model.trim()) return;
    setSaving(true);
    try {
      if (motoId) {
        await updateMoto(motoId, { brand: brand.trim(), model: model.trim() });
      } else {
        await addMoto(brand.trim(), model.trim());
      }
      onClose();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Error al guardar moto');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" role="dialog" aria-modal="true">
      <button type="button" aria-label="Cerrar" onClick={onClose} className="absolute inset-0 bg-background/70 backdrop-blur-sm" />
      <div className="relative z-10 w-full max-w-md rounded-t-3xl border-t border-border bg-card px-4 pb-8 pt-3">
        <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-border" />
        <h2 className="mb-4 text-lg font-bold">{motoId ? 'Editar moto' : 'Añadir al garaje'}</h2>
        <div className="space-y-3">
          <input
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            placeholder="Marca (Ej: Kawasaki)"
            className="w-full rounded-xl border border-border bg-background px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/40"
          />
          <input
            value={model}
            onChange={(e) => setModel(e.target.value)}
            placeholder="Modelo (Ej: Z900)"
            className="w-full rounded-xl border border-border bg-background px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="mt-6 w-full rounded-2xl bg-primary py-4 font-bold text-primary-foreground disabled:opacity-50"
        >
          {saving ? 'Guardando…' : 'Guardar moto'}
        </button>
      </div>
    </div>
  );
}

function SettingsSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" role="dialog" aria-modal="true">
      <button type="button" aria-label="Cerrar" onClick={onClose} className="absolute inset-0 bg-background/70 backdrop-blur-sm" />
      <div className="relative z-10 w-full max-w-md rounded-t-3xl border-t border-border bg-card px-4 pb-8 pt-3">
        <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-border" />
        <h2 className="mb-4 text-lg font-bold">Ajustes</h2>
        <ul className="space-y-2 text-sm">
          <li className="rounded-xl border border-border bg-background px-4 py-3 text-muted-foreground">
            Notificaciones push — próximamente
          </li>
          <li className="rounded-xl border border-border bg-background px-4 py-3 text-muted-foreground">
            Modo guantes por defecto — próximamente
          </li>
        </ul>
        <button
          type="button"
          onClick={() => {
            logout();
            window.location.href = '/auth/login';
          }}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl border border-destructive/40 py-3 font-semibold text-destructive"
        >
          <LogOut className="size-4" />
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}

export default function ProfileApp() {
  const user = useStore($user);
  const authLoading = useStore($authLoading);
  const motos = useStore($motos);
  const stats = useStore($profileStats);
  const profileLoading = useStore($profileLoading);

  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [editMotoOpen, setEditMotoOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  if (authLoading || profileLoading) {
    return (
      <main className="flex min-h-dvh w-full items-center justify-center">
        <p className="text-muted-foreground">Cargando garaje…</p>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="flex min-h-dvh w-full flex-col items-center justify-center px-4">
        <Bike className="mb-4 size-12 text-primary" />
        <p className="mb-2 text-center text-lg font-bold">Tu garaje te espera</p>
        <p className="mb-6 text-center text-sm text-muted-foreground">
          Inicia sesión para ver tu perfil y tu moto
        </p>
        <a href="/auth/login" className="rounded-2xl bg-primary px-8 py-3 font-bold text-primary-foreground shadow-lg shadow-primary/30">
          Entrar
        </a>
      </main>
    );
  }

  const primaryMoto = motos.find((m) => m.is_primary) ?? motos[0];
  const usingDemo = !primaryMoto;
  const garage = usingDemo
    ? DEMO_GARAGE
    : {
        brand: primaryMoto.brand,
        model: primaryMoto.model,
        power: '— cv' as const,
        displacement: '— cc' as const,
        year: primaryMoto.year ? String(primaryMoto.year) : '—',
        photo_url: primaryMoto.photo_url ?? DEMO_GARAGE.photo_url,
        photo_ai_generated: primaryMoto.photo_ai_generated,
        isReal: !primaryMoto.photo_ai_generated,
      };

  const pace = paceFromApi(user.pace_base);
  const PaceIcon = paceMeta[pace].icon;
  const level = riderLevel(stats);
  const displayName = user.username.replace(/_/g, ' ');
  const handle = `@${user.username}`;

  return (
    <main className="flex min-h-dvh w-full flex-col bg-background pb-10">
      <header className="flex items-center justify-between px-4 pt-4">
        <a
          href="/"
          aria-label="Volver"
          className="flex size-11 items-center justify-center rounded-full bg-card/80 ring-1 ring-border backdrop-blur"
        >
          <ChevronLeft className="size-6" />
        </a>
        <h1 className="text-sm font-semibold text-muted-foreground">Mi Perfil</h1>
        <button
          type="button"
          aria-label="Ajustes"
          onClick={() => setSettingsOpen(true)}
          className="flex size-11 items-center justify-center rounded-full bg-card/80 ring-1 ring-border backdrop-blur"
        >
          <Settings className="size-5" />
        </button>
      </header>

      <section className="flex flex-col items-center px-4 pt-6 text-center">
        <div className="relative">
          <img
            src={user.avatar_url || '/placeholder.svg'}
            alt={displayName}
            className="size-24 rounded-full object-cover ring-4 ring-primary/40"
          />
          <span className="absolute -bottom-1 -right-1 flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground ring-4 ring-background">
            <BadgeCheck className="size-5" />
          </span>
        </div>
        <h2 className="mt-4 text-2xl font-bold tracking-tight capitalize">{displayName}</h2>
        <p className="text-sm text-muted-foreground">{handle}</p>
        <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-accent/15 px-3 py-1 text-sm font-semibold text-accent ring-1 ring-accent/30">
          <Trophy className="size-4" />
          {level}
        </span>
      </section>

      <section className="px-4 pt-7">
        <div className="mb-2 flex items-center gap-2">
          <Bike className="size-4 text-primary" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Mi Garaje</h3>
          {usingDemo && (
            <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
              Ejemplo
            </span>
          )}
        </div>

        <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-lg shadow-black/20">
          <div className="relative aspect-[16/10] w-full bg-gradient-to-b from-secondary/50 via-card to-card">
            <img
              src={garage.photo_url}
              alt={`${garage.brand} ${garage.model}`}
              className="absolute inset-0 h-full w-full object-contain p-4"
            />
            {garage.isReal && !garage.photo_ai_generated && (
              <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-background/80 px-2.5 py-1 text-[11px] font-semibold text-emerald-400 ring-1 ring-emerald-500/30 backdrop-blur">
                <BadgeCheck className="size-3.5" />
                Foto real
              </span>
            )}
            {garage.photo_ai_generated && (
              <span className="absolute left-3 top-3 rounded-full bg-background/80 px-2.5 py-1 text-[11px] text-muted-foreground backdrop-blur">
                Imagen auto-generada
              </span>
            )}
            <button
              type="button"
              aria-label="Editar moto"
              onClick={() => setEditMotoOpen(true)}
              className="absolute right-3 top-3 flex size-9 items-center justify-center rounded-full bg-background/80 ring-1 ring-border backdrop-blur active:scale-95"
            >
              <Pencil className="size-4" />
            </button>
          </div>

          <div className="flex items-center justify-between gap-3 border-t border-border p-4">
            <div className="min-w-0">
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                Moto principal
              </p>
              <p className="truncate text-lg font-bold">
                {garage.brand} {garage.model}
              </p>
            </div>
            <div className="flex shrink-0 gap-2">
              <div className="rounded-xl bg-secondary px-3 py-1.5 text-center">
                <p className="text-sm font-bold text-primary">
                  {usingDemo ? DEMO_GARAGE.power : garage.power}
                </p>
                <p className="text-[10px] text-muted-foreground">Potencia</p>
              </div>
              <div className="rounded-xl bg-secondary px-3 py-1.5 text-center">
                <p className="text-sm font-bold">
                  {usingDemo ? DEMO_GARAGE.displacement : garage.displacement}
                </p>
                <p className="text-[10px] text-muted-foreground">Cilindrada</p>
              </div>
              <div className="rounded-xl bg-secondary px-3 py-1.5 text-center">
                <p className="text-sm font-bold">
                  {usingDemo ? DEMO_GARAGE.year : garage.year}
                </p>
                <p className="text-[10px] text-muted-foreground">Año</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 pt-5">
        <div className="flex items-center justify-between rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-xl bg-secondary text-primary">
              <Gauge className="size-5" />
            </span>
            <div className="text-left">
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                Ritmo base
              </p>
              <p className="text-base font-semibold">{paceMeta[pace].label}</p>
            </div>
          </div>
          <span className={`flex size-10 items-center justify-center rounded-full ring-1 ${paceStyles[pace]}`}>
            <PaceIcon className="size-5" />
          </span>
        </div>
      </section>

      <section className="px-4 pt-5">
        <div className="mb-2 flex items-center gap-2">
          <RouteIcon className="size-4 text-primary" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Historial</h3>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-border bg-card p-4 text-center">
            <p className="text-2xl font-bold text-primary">{stats.completed}</p>
            <p className="mt-1 text-[11px] leading-tight text-muted-foreground">Rutas completadas</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-4 text-center">
            <p className="text-2xl font-bold text-accent">{stats.created}</p>
            <p className="mt-1 text-[11px] leading-tight text-muted-foreground">Rutas creadas</p>
          </div>
        </div>
        <p className="mt-2 text-center text-[11px] text-muted-foreground">
          {stats.kilometers} km recorridos en total
        </p>
      </section>

      <section className="mt-auto flex flex-col gap-3 px-4 pt-8">
        <button
          type="button"
          onClick={() => setEditProfileOpen(true)}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-4 text-base font-bold text-primary-foreground shadow-lg shadow-primary/30 active:scale-[0.98]"
        >
          <Pencil className="size-5" />
          Editar Perfil
        </button>
        <button
          type="button"
          onClick={() => setSettingsOpen(true)}
          className="flex w-full items-center justify-between gap-2 rounded-2xl border border-border bg-card px-4 py-4 text-base font-semibold active:scale-[0.98]"
        >
          <span className="flex items-center gap-2">
            <Settings className="size-5 text-muted-foreground" />
            Ajustes
          </span>
          <ChevronRight className="size-5 text-muted-foreground" />
        </button>
      </section>

      <EditProfileSheet open={editProfileOpen} onClose={() => setEditProfileOpen(false)} />
      <EditMotoSheet
        open={editMotoOpen}
        onClose={() => setEditMotoOpen(false)}
        motoId={primaryMoto?.id ?? null}
        initialBrand={primaryMoto?.brand ?? DEMO_GARAGE.brand}
        initialModel={primaryMoto?.model ?? DEMO_GARAGE.model}
      />
      <SettingsSheet open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </main>
  );
}
