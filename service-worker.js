const CACHE_NAME = "srm-qk-cache-v1";
const urlsToCache = [
  "dashboard.html",
  "manifest.json",
  "icons/icon-192.png",
  "icons/icon-512.png"
];

// 🟢 Instalación y caché inicial
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log("📦 Archivos cacheados");
      return cache.addAll(urlsToCache);
    })
  );
});

// 🟡 Activación y limpieza de versiones antiguas
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(keys.map(key => {
        if (key !== CACHE_NAME) {
          console.log("🧹 Eliminando caché antiguo:", key);
          return caches.delete(key);
        }
      }));
    })
  );
});

// 🔵 Intercepción de requests (offline support)
self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
      .catch(() => caches.match("dashboard.html"))
  );
});
