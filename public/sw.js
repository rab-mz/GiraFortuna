const CACHE_NAME = 'gf-cache-v1';

// Install: skip waiting to activate immediately
self.addEventListener('install', () => {
  self.skipWaiting();
});

// Activate: claim clients and delete old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key.startsWith('gf-cache-') && key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// Fetch: strategy depends on request type
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // API calls (Supabase): network-only, never cache
  if (url.hostname.includes('supabase.co')) {
    return;
  }

  // Navigation requests (HTML): network-first, fall back to cache
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // Static assets (JS, CSS, images, fonts): cache-first, fall back to network
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) {
        return cached;
      }
      return fetch(request).then((response) => {
        // Only cache successful same-origin or CORS responses
        if (response.ok || response.type === 'opaque') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      });
    })
  );
});
