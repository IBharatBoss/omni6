// sw.js - Modern Offline Cache
const CACHE_NAME = 'omnitools-v3';

self.addEventListener('install', (e) => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(keys.map((k) => caches.delete(k)));
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  // Network first, fallback to cache for offline
  e.respondWith(
    fetch(e.request).catch(() => caches.match(e.request))
  );
});
