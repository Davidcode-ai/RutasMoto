const CACHE_APP = 'motorutas-app-v1';
const CACHE_MAPBOX = 'motorutas-mapbox-v1';
const PRECACHE = ['/manifest.json', '/icon.svg'];

/** Máximo de tiles/recursos Mapbox en caché (LRU). */
const MAPBOX_MAX_ENTRIES = 80;
const MAPBOX_INDEX_URL = 'https://motorutas.internal/__mapbox_lru_index__';

const ALLOWED_CACHES = new Set([CACHE_APP, CACHE_MAPBOX]);

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_APP).then((cache) => cache.addAll(PRECACHE)).catch(() => undefined),
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => !ALLOWED_CACHES.has(key)).map((key) => caches.delete(key))),
    ),
  );
  self.clients.claim();
});

function isMapboxCacheable(url) {
  const host = url.hostname;
  if (!host.endsWith('.mapbox.com') && host !== 'mapbox.com') return false;
  if (host === 'events.mapbox.com') return false;

  const path = url.pathname;
  if (path.includes('/events/') || path.includes('/feedback') || path.includes('/map-sessions')) {
    return false;
  }

  if (host.startsWith('tiles.')) return true;

  if (host === 'api.mapbox.com') {
    return (
      path.includes('/styles/') ||
      path.includes('/v4/') ||
      path.includes('/fonts/') ||
      path.includes('/raster') ||
      path.includes('/tileset')
    );
  }

  return false;
}

async function readMapboxIndex(cache) {
  const res = await cache.match(MAPBOX_INDEX_URL);
  if (!res) return [];
  try {
    const list = await res.json();
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

async function writeMapboxIndex(cache, urls) {
  await cache.put(MAPBOX_INDEX_URL, new Response(JSON.stringify(urls)));
}

/** Registra URL en LRU y elimina entradas antiguas si supera el límite. */
async function trackMapboxEntry(cache, requestUrl) {
  let urls = await readMapboxIndex(cache);
  urls = urls.filter((u) => u !== requestUrl);
  urls.push(requestUrl);

  while (urls.length > MAPBOX_MAX_ENTRIES) {
    const oldest = urls.shift();
    if (oldest) await cache.delete(oldest);
  }

  await writeMapboxIndex(cache, urls);
}

/**
 * Stale-While-Revalidate para tiles Mapbox:
 * - Online: respuesta en caché al instante + actualización en segundo plano.
 * - Offline: sirve la última versión cacheada.
 */
async function mapboxStaleWhileRevalidate(request, waitUntil) {
  const cache = await caches.open(CACHE_MAPBOX);
  const cached = await cache.match(request);

  const networkFetch = fetch(request)
    .then(async (response) => {
      if (response.ok) {
        await cache.put(request, response.clone());
        await trackMapboxEntry(cache, request.url);
      }
      return response;
    })
    .catch(() => null);

  if (cached) {
    waitUntil(networkFetch);
    return cached;
  }

  const fromNetwork = await networkFetch;
  if (fromNetwork) return fromNetwork;

  return Response.error();
}

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // API propia y WebSockets: solo red (sin interceptar caché).
  if (url.pathname.startsWith('/api') || url.pathname.startsWith('/ws')) {
    return;
  }

  if (isMapboxCacheable(url)) {
    event.respondWith(
      mapboxStaleWhileRevalidate(event.request, (promise) => event.waitUntil(promise)),
    );
    return;
  }

  const isDocument =
    event.request.mode === 'navigate' ||
    (event.request.headers.get('accept') || '').includes('text/html');

  if (isDocument) {
    event.respondWith(
      fetch(event.request).catch(() => caches.open(CACHE_APP).then((c) => c.match(event.request))),
    );
    return;
  }

  // Assets de la app (mismo origen): network-first con fallback a caché.
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.ok && url.origin === self.location.origin) {
          const copy = response.clone();
          caches.open(CACHE_APP).then((cache) => cache.put(event.request, copy));
        }
        return response;
      })
      .catch(() => caches.open(CACHE_APP).then((cache) => cache.match(event.request))),
  );
});

self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? { title: 'MotoRutas', body: 'Nuevo mensaje en la ruta' };
  event.waitUntil(
    self.registration.showNotification(data.title || 'MotoRutas', {
      body: data.body,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
    }),
  );
});
