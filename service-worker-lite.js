// 🧩 SRM-QK v1.1.3 — Service Worker Lite
// Crea cache local para uso offline y carga más rápida en presentaciones

const CACHE_NAME = "srm-qk-cache-v1.1.3";

const ASSETS_TO_CACHE = [
  "/srm-frontend-qk/",
  "/srm-frontend-qk/index.html",
  "/QK/favicon.ico",
  "/QK/apple-touch-icon.png",
  "/QK/favicon-32x32.png",
  "/QK/favicon-16x16.png",
  "/QK/android-chrome-192x192.png",
  "/QK/android-chrome-512x512.png",
  "/QK/site.webmanifest"
];

// Instalación inicial del Service Worker
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS_TO_CACHE))
      .then(() => self.skipWaiting())
  );
});

// Activación: limpia versiones antiguas de cache
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((key) => {
        if (key !== CACHE_NAME) return caches.delete(key);
      }))
    ).then(() => self.clients.claim())
  );
});

// Estrategia de cache con fallback a red
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Ignora peticiones a la API o videos (se obtienen siempre online)
  if (url.origin.includes("onrender.com") || url.pathname.endsWith(".mp4")) return;

  event.respondWith(
    caches.match(event.request)
      .then((cached) => cached || fetch(event.request)
        .then((response) => {
          // Cachea nuevas peticiones de forma ligera
          if (response && response.status === 200 && response.type === "basic") {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return response;
        })
        .catch(() => caches.match("/srm-frontend-qk/index.html")))
  );
});
