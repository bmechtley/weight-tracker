const CACHE = 'weight-tracker-v4';
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
];

// Install and cache local assets
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(ASSETS).catch(() => {}))
  );
  self.skipWaiting();
});

// Activate and clean old caches
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Network-first, fallback to cache for offline.
// Page loads revalidate with the server (ETag) instead of trusting the
// HTTP cache, so deployed updates show up on next launch.
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  const req = e.request.mode === 'navigate'
    ? fetch(e.request.url, { cache: 'no-cache' })
    : fetch(e.request);
  e.respondWith(
    req
      .then((res) => {
        if (res.ok) {
          const clone = res.clone();
          caches.open(CACHE).then((cache) => cache.put(e.request, clone));
        }
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});
