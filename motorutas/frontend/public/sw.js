const CACHE_APP = 'motorutas-app-v2';
const CACHE_OSM = 'motorutas-osm-tiles-v1';
const PRECACHE = ['/manifest.json', '/icon.svg', '/radares.geojson'];

/** Máximo de tiles OSM en caché (LRU). */
const OSM_MAX_ENTRIES = 100;
const OSM_INDEX_URL = 'https://motorutas.internal/__osm_lru_index__';

const ALLOWED_CACHES = new Set([CACHE_APP, CACHE_OSM]);

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

function isOsmTileRequest(url) {
  return url.hostname === 'tile.openstreetmap.org' || url.hostname.endsWith('.tile.openstreetmap.org');
}

async function readOsmIndex(cache) {
  const res = await cache.match(OSM_INDEX_URL);
  if (!res) return [];
  try {
    const list = await res.json();
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

async function writeOsmIndex(cache, urls) {
  await cache.put(OSM_INDEX_URL, new Response(JSON.stringify(urls)));
}

async function trackOsmEntry(cache, requestUrl) {
  let urls = await readOsmIndex(cache);
  urls = urls.filter((u) => u !== requestUrl);
  urls.push(requestUrl);

  while (urls.length > OSM_MAX_ENTRIES) {
    const oldest = urls.shift();
    if (oldest) await cache.delete(oldest);
  }

  await writeOsmIndex(cache, urls);
}

async function osmStaleWhileRevalidate(request, waitUntil) {
  const cache = await caches.open(CACHE_OSM);
  const cached = await cache.match(request);

  const networkFetch = fetch(request)
    .then(async (response) => {
      if (response.ok) {
        await cache.put(request, response.clone());
        await trackOsmEntry(cache, request.url);
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

  if (url.pathname.startsWith('/api') || url.pathname.startsWith('/ws')) {
    return;
  }

  if (isOsmTileRequest(url)) {
    event.respondWith(
      osmStaleWhileRevalidate(event.request, (promise) => event.waitUntil(promise)),
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
