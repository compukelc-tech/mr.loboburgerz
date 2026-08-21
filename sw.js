const CACHE_NAME = 'lobo-erp-v11';
const ASSETS = [
  './index.html',
  './styles.css',
  './app.js',
  './icono.png',
  './icono.jpg'
];

self.addEventListener('install', (e) => {
  // Fuerza al service worker a instalarse de inmediato
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
});

self.addEventListener('activate', (e) => {
  // Limpia los cachés antiguos que no coincidan con la versión actual
  e.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(keyList.map((key) => {
        if (key !== CACHE_NAME) {
          return caches.delete(key);
        }
      }));
    })
  );
  // Reclama el control de los clientes de inmediato
  return self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((res) => res || fetch(e.request))
  );
});
