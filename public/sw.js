const CACHE_NAME = 'hda-v7';
const OFFLINE_URL = '/offline.html';
const STATIC_ASSETS = ['/manifest.webmanifest', OFFLINE_URL];

const offlineFallback = () => caches.match(OFFLINE_URL).then((cached) => cached || Response.error());

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))),
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET') return;

  if (url.origin === location.origin) {
    const ext = url.pathname.split('.').pop();
    const isDocument = request.mode === 'navigate' || ext === 'html' || url.pathname.endsWith('/');

    // Network-first for JS, CSS, and HTML (changes on every build)
    if (ext === 'js' || ext === 'css' || isDocument) {
      event.respondWith(
        fetch(request)
          .then((response) => {
            if (response.ok) {
              const clone = response.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
            }
            return response;
          })
          .catch(() =>
            caches.match(request).then((cached) => cached || (isDocument ? offlineFallback() : Response.error())),
          ),
      );
      return;
    }

    // Stale-while-revalidate for images and other static assets
    event.respondWith(
      caches.match(request).then((cached) => {
        const fetched = fetch(request)
          .then((response) => {
            if (response.ok) {
              const clone = response.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
            }
            return response;
          })
          .catch(() => undefined);
        if (cached) return cached;
        return fetched.then((response) => response || Response.error());
      }),
    );
    return;
  }

  event.respondWith(fetch(request).catch(() => Response.error()));
});
