const CACHE_NAME = 'ctce-portal-shell-v1';
const STATIC_SHELL_ASSETS = [
  '/',
  '/index.html',
  '/offline.html',
  '/manifest.webmanifest'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_SHELL_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // NEVER cache API requests, Supabase calls, Edge Functions, or requests containing sensitive data
  if (
    url.hostname.includes('supabase.co') ||
    url.pathname.startsWith('/api') ||
    url.pathname.startsWith('/rest/v1') ||
    url.pathname.startsWith('/functions/v1') ||
    url.pathname.startsWith('/auth/v1') ||
    event.request.method !== 'GET'
  ) {
    return; // Pass through to network directly without caching
  }

  // Network-first for HTML navigation, falling back to cache or offline.html
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(async () => {
        const cachedResponse = await caches.match(event.request);
        if (cachedResponse) return cachedResponse;
        const offlinePage = await caches.match('/offline.html');
        return offlinePage || new Response('Offline - please check your internet connection', {
          headers: { 'Content-Type': 'text/plain' }
        });
      })
    );
    return;
  }

  // Cache-first only for static assets (js, css, images, fonts)
  if (
    url.origin === self.location.origin &&
    (url.pathname.endsWith('.js') ||
     url.pathname.endsWith('.css') ||
     url.pathname.endsWith('.png') ||
     url.pathname.endsWith('.svg') ||
     url.pathname.endsWith('.woff2'))
  ) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        return cached || fetch(event.request).then((response) => {
          if (response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        });
      })
    );
  }
});
