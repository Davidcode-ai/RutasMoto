/** Base URL: vacío en dev usa el proxy de Vite (mismo origen). */
function apiBase(): string {
  const env = import.meta.env.PUBLIC_API_URL;
  if (env !== undefined && env !== '') return env.replace(/\/$/, '');
  if (typeof window !== 'undefined') return '';
  return 'http://localhost:8000';
}

export type TokenPair = { access_token: string; refresh_token: string };

function getTokens(): TokenPair | null {
  if (typeof localStorage === 'undefined') return null;
  const access = localStorage.getItem('access_token');
  const refresh = localStorage.getItem('refresh_token');
  if (!access || !refresh) return null;
  return { access_token: access, refresh_token: refresh };
}

export function setTokens(tokens: TokenPair) {
  localStorage.setItem('access_token', tokens.access_token);
  localStorage.setItem('refresh_token', tokens.refresh_token);
}

export function clearTokens() {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
}

export function isLoggedIn(): boolean {
  return !!getTokens()?.access_token;
}

let isRefreshing = false;
type RefreshSubscriber = {
  resolve: (accessToken: string) => void;
  reject: (error: Error) => void;
};
let refreshSubscribers: RefreshSubscriber[] = [];

function subscribeTokenRefresh(): Promise<string> {
  return new Promise((resolve, reject) => {
    refreshSubscribers.push({ resolve, reject });
  });
}

function flushRefreshQueue(accessToken: string) {
  refreshSubscribers.forEach(({ resolve }) => resolve(accessToken));
  refreshSubscribers = [];
}

function rejectRefreshQueue(error: Error) {
  refreshSubscribers.forEach(({ reject }) => reject(error));
  refreshSubscribers = [];
}

async function refreshAccessToken(): Promise<string> {
  const tokens = getTokens();
  if (!tokens?.refresh_token) {
    const err = new Error('Sesión expirada');
    clearTokens();
    throw err;
  }

  if (isRefreshing) {
    return subscribeTokenRefresh();
  }

  isRefreshing = true;
  try {
    const refreshed = await fetch(`${apiBase()}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: tokens.refresh_token }),
      signal: AbortSignal.timeout(8000),
    });

    if (!refreshed.ok) {
      clearTokens();
      const err = new Error('Sesión expirada');
      rejectRefreshQueue(err);
      throw err;
    }

    const newTokens = (await refreshed.json()) as TokenPair;
    setTokens(newTokens);
    flushRefreshQueue(newTokens.access_token);
    return newTokens.access_token;
  } catch (e) {
    clearTokens();
    const err = e instanceof Error ? e : new Error('Sesión expirada');
    rejectRefreshQueue(err);
    throw err;
  } finally {
    isRefreshing = false;
  }
}

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const tokens = getTokens();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (tokens?.access_token) {
    headers['Authorization'] = `Bearer ${tokens.access_token}`;
  }

  const url = `${apiBase()}/api${path}`;

  const res = await fetch(url, { ...options, headers });

  if (res.status === 401 && tokens?.refresh_token) {
    const accessToken = await refreshAccessToken();
    headers['Authorization'] = `Bearer ${accessToken}`;
    const retry = await fetch(url, { ...options, headers });
    if (!retry.ok) {
      const t = await retry.text();
      throw new Error(parseError(t));
    }
    if (retry.status === 204) return undefined as T;
    return retry.json() as Promise<T>;
  }

  if (!res.ok) {
    const t = await res.text();
    throw new Error(parseError(t));
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

function parseError(text: string): string {
  try {
    const j = JSON.parse(text);
    if (typeof j.detail === 'string') return j.detail;
    if (Array.isArray(j.detail)) return j.detail.map((d: { msg?: string }) => d.msg).join(', ');
  } catch {
    /* raw text */
  }
  return text || 'Error de red';
}

export function wsUrl(path: string): string {
  const env = import.meta.env.PUBLIC_WS_URL;
  let base = env ?? '';
  if (!base && typeof window !== 'undefined') {
    const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    base = `${proto}//${window.location.host}`;
  }
  if (!base) base = 'ws://localhost:8000';
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('access_token') : '';
  const sep = path.includes('?') ? '&' : '?';
  return `${base}${path}${sep}token=${encodeURIComponent(token || '')}`;
}
