const CACHE = 'app-cache-v1';
const toCache = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
];
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(toCache)));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.map((k) => (k !== CACHE ? caches.delete(k) : null))))
  );
});
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (url.pathname.startsWith('/api/')) {
    return; // don't cache API
  }
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then((cached) => {
      const fetchPromise = fetch(e.request).then((networkResponse) => {
        const clone = networkResponse.clone();
        caches.open(CACHE).then((c) => c.put(e.request, clone));
        return networkResponse;
      }).catch(() => cached);
      return cached || fetchPromise;
    })
  );
});
