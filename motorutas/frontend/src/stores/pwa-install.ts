import { atom } from 'nanostores';

const BANNER_DISMISSED_KEY = 'motorutas_install_banner_dismissed';

let deferredPrompt: BeforeInstallPromptEvent | null = null;

export const $canInstall = atom(false);
export const $isInstalled = atom(false);
export const $bannerDismissed = atom(false);

export function hydrateInstallState(): void {
  if (typeof window === 'undefined') return;
  $isInstalled.set(checkIsInstalled());
  $bannerDismissed.set(localStorage.getItem(BANNER_DISMISSED_KEY) === 'true');
}

export function checkIsInstalled(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export function captureInstallPrompt(event: BeforeInstallPromptEvent): void {
  event.preventDefault();
  deferredPrompt = event;
  $canInstall.set(true);
}

export function dismissInstallBanner(): void {
  $bannerDismissed.set(true);
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(BANNER_DISMISSED_KEY, 'true');
  }
}

/** Indica si el banner automático debe mostrarse. */
export function shouldShowInstallBanner(): boolean {
  return $canInstall.get() && !$isInstalled.get() && !$bannerDismissed.get();
}

/** Botón permanente en perfil: instalación disponible y app no instalada. */
export function shouldShowInstallButton(): boolean {
  return $canInstall.get() && !$isInstalled.get();
}

export async function promptInstall(): Promise<'accepted' | 'dismissed' | 'unavailable'> {
  if (!deferredPrompt) return 'unavailable';
  try {
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    deferredPrompt = null;
    $canInstall.set(false);
    if (outcome === 'accepted') {
      $isInstalled.set(true);
      return 'accepted';
    }
    return 'dismissed';
  } catch {
    return 'unavailable';
  }
}

export function markAppInstalled(): void {
  deferredPrompt = null;
  $canInstall.set(false);
  $isInstalled.set(true);
}
