import { atom } from 'nanostores';
import { api, clearTokens, setTokens, type TokenPair } from '@/lib/api';

export type User = {
  id: string;
  username: string;
  email: string;
  avatar_url: string | null;
  pace_base: string;
};

export const $user = atom<User | null>(null);
export const $authLoading = atom(true);

export const GUEST_MODE_KEY = 'guest_mode';

export function isGuestMode(): boolean {
  if (typeof sessionStorage === 'undefined') return false;
  return sessionStorage.getItem(GUEST_MODE_KEY) === 'true';
}

export function setGuestMode(): void {
  if (typeof sessionStorage !== 'undefined') {
    sessionStorage.setItem(GUEST_MODE_KEY, 'true');
  }
}

export function clearGuestMode(): void {
  if (typeof sessionStorage !== 'undefined') {
    sessionStorage.removeItem(GUEST_MODE_KEY);
  }
}

export async function loadUser() {
  $authLoading.set(true);
  try {
    const user = await api<User>('/auth/me');
    $user.set(user);
  } catch {
    $user.set(null);
  } finally {
    $authLoading.set(false);
  }
}

export async function login(email: string, password: string) {
  const tokens = await api<TokenPair>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  setTokens(tokens);
  clearGuestMode();
  await loadUser();
}

export async function register(data: {
  username: string;
  email: string;
  password: string;
  pace_base?: string;
}) {
  const tokens = await api<TokenPair>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  setTokens(tokens);
  clearGuestMode();
  await loadUser();
}

export function logout() {
  clearTokens();
  clearGuestMode();
  $user.set(null);
}

export async function updateProfile(data: {
  username?: string;
  avatar_url?: string | null;
  pace_base?: string;
}) {
  const updated = await api<User>('/users/me/profile', {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
  $user.set(updated);
  return updated;
}

/** Nivel visual según actividad (placeholder hasta gamificación real) */
export function riderLevel(stats?: { created: number; completed: number }): string {
  const score = (stats?.created ?? 0) * 2 + (stats?.completed ?? 0);
  if (score >= 50) return 'Road Leader';
  if (score >= 20) return 'Rider Experto';
  return 'Rider Habitual';
}
