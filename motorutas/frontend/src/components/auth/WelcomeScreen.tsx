import { Route } from 'lucide-react';
import { setGuestMode } from '@/stores/auth';

type Props = {
  onGuest?: () => void;
};

export default function WelcomeScreen({ onGuest }: Props) {
  function handleGuest() {
    setGuestMode();
    onGuest?.();
  }

  return (
    <div className="fixed inset-0 z-[9999] flex min-h-[100dvh] flex-col overflow-x-hidden bg-background">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(234,88,12,0.35),transparent)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[#0a0a0c] via-background/80 to-transparent"
        aria-hidden
      />

      <div className="relative flex flex-1 flex-col items-center justify-between px-6 pb-[max(2rem,env(safe-area-inset-bottom))] pt-[max(3rem,env(safe-area-inset-top))]">
        <div className="flex flex-col items-center pt-8 text-center">
          <div className="mb-6 flex size-24 items-center justify-center rounded-3xl bg-primary shadow-[0_0_40px_rgba(234,88,12,0.45)] ring-4 ring-primary/30">
            <Route className="size-12 text-primary-foreground" strokeWidth={2.5} />
          </div>
          <h1 className="text-4xl font-black tracking-tight text-foreground">MotoRutas</h1>
          <p className="mt-3 max-w-xs text-base leading-relaxed text-muted-foreground">
            Organiza rutas en moto sin el caos de WhatsApp. Mapas, grupo y modo guantes en un solo sitio.
          </p>
        </div>

        <div className="w-full max-w-sm space-y-3">
          <a
            href="/auth/login"
            className="btn-press flex w-full items-center justify-center rounded-2xl bg-primary px-6 py-4 text-base font-bold text-primary-foreground shadow-lg shadow-primary/25"
          >
            Iniciar sesión
          </a>
          <a
            href="/auth/registro"
            className="btn-press flex w-full items-center justify-center rounded-2xl border-2 border-border bg-card px-6 py-4 text-base font-bold text-foreground ring-1 ring-border"
          >
            Crear cuenta
          </a>
          <button
            type="button"
            onClick={handleGuest}
            className="btn-press mt-2 w-full py-3 text-center text-sm font-semibold text-muted-foreground underline-offset-4 hover:text-primary hover:underline"
          >
            Explorar como invitado
          </button>
        </div>
      </div>
    </div>
  );
}
