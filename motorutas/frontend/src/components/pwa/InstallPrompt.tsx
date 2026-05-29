import { useEffect, useState } from 'react';
import { useStore } from '@nanostores/react';
import { Download, Smartphone, X } from 'lucide-react';
import {
  $bannerDismissed,
  $canInstall,
  $isInstalled,
  captureInstallPrompt,
  dismissInstallBanner,
  hydrateInstallState,
  markAppInstalled,
  promptInstall,
  shouldShowInstallBanner,
} from '@/stores/pwa-install';

export default function InstallPrompt() {
  const canInstall = useStore($canInstall);
  const isInstalled = useStore($isInstalled);
  const bannerDismissed = useStore($bannerDismissed);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    hydrateInstallState();

    const onBeforeInstall = (e: Event) => {
      captureInstallPrompt(e as BeforeInstallPromptEvent);
      setVisible(shouldShowInstallBanner());
    };

    const onAppInstalled = () => {
      markAppInstalled();
      setVisible(false);
    };

    const standaloneMq = window.matchMedia('(display-mode: standalone)');
    const onDisplayModeChange = () => {
      hydrateInstallState();
      if (standaloneMq.matches) setVisible(false);
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    window.addEventListener('appinstalled', onAppInstalled);
    standaloneMq.addEventListener('change', onDisplayModeChange);

    setVisible(shouldShowInstallBanner());

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('appinstalled', onAppInstalled);
      standaloneMq.removeEventListener('change', onDisplayModeChange);
    };
  }, []);

  useEffect(() => {
    setVisible(canInstall && !isInstalled && !bannerDismissed);
  }, [canInstall, isInstalled, bannerDismissed]);

  async function handleInstall() {
    const outcome = await promptInstall();
    if (outcome === 'accepted') {
      setVisible(false);
      return;
    }
    if (outcome === 'dismissed') {
      dismissInstallBanner();
      setVisible(false);
    }
  }

  function handleDismiss() {
    dismissInstallBanner();
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-[9000] mx-auto w-full max-w-md px-3 pb-safe"
      role="dialog"
      aria-labelledby="install-prompt-title"
      aria-describedby="install-prompt-desc"
    >
      <div className="overflow-hidden rounded-2xl border border-primary/30 bg-card shadow-[0_-8px_40px_rgba(0,0,0,0.45)] ring-1 ring-primary/20">
        <div className="bg-gradient-to-br from-primary/20 via-card to-card px-4 pb-4 pt-3">
          <div className="mb-3 flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/30">
                <Smartphone className="size-6" strokeWidth={2.25} />
              </div>
              <div>
                <h2 id="install-prompt-title" className="text-base font-bold leading-tight">
                  Instala MotoRutas
                </h2>
                <p id="install-prompt-desc" className="mt-0.5 text-xs leading-snug text-muted-foreground">
                  En tu móvil para una experiencia perfecta en carretera
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleDismiss}
              aria-label="Cerrar"
              className="btn-press flex size-9 shrink-0 items-center justify-center rounded-full bg-background/80 text-muted-foreground ring-1 ring-border"
            >
              <X className="size-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={handleInstall}
            className="btn-press flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3.5 text-base font-bold text-primary-foreground shadow-lg shadow-primary/25"
          >
            <Download className="size-5" />
            Añadir a Inicio
          </button>

          <button
            type="button"
            onClick={handleDismiss}
            className="mt-2 w-full py-2 text-center text-sm font-medium text-muted-foreground"
          >
            Quizás más tarde
          </button>
        </div>
      </div>
    </div>
  );
}
