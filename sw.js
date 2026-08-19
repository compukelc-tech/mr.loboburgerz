const CACHE_NAME = 'lobo-erp-v2';
const ASSETS = [
  './index.html',
  './styles.css',
  './app.js',
  './icono.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((res) => res || fetch(e.request))
  );
});
