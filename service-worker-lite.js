// 🧩 SRM-QK v1.1.4 — Service Worker Media-Enhanced
// Cachea HTML, íconos y ahora también videos (modo offline optimizado)

const CACHE_NAME = "srm-qk-cache-v1.1.4";
const MEDIA_CACHE = "srm-qk-media-cache-v1.1.4";

const STATIC_ASSETS = [
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

// 🧱 Instalar: cachear archivos estáticos
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// ♻️ Activar: limpiar versiones viejas
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME && key !== MEDIA_CACHE) {
            return caches.delete(key);
          }
        })
      )
    ).then(() => self.clients.claim())
  );
});

// ⚡ Fetch: estrategia híbrida
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // 1️⃣ Ignorar llamadas a la API del backend (se hacen siempre online)
  if (url.pathname.startsWith("/api/")) return;

  // 2️⃣ Videos MP4 → cache temporal especial
  if (url.origin.includes("onrender.com") && url.pathname.endsWith(".mp4")) {
    event.respondWith(cacheVideo(event.request));
    return;
  }

  // 3️⃣ Otros recursos → cache first con fallback
  event.respondWith(
    caches.match(event.request)
      .then((cached) => cached || fetch(event.request)
        .then((response) => {
          if (response && response.status === 200 && response.type === "basic") {
            const cloned = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, cloned));
          }
          return response;
        })
        .catch(() => caches.match("/srm-frontend-qk/index.html"))
      )
  );
});

// 🎞️ Función: cachear videos de Render inteligentemente
async function cacheVideo(request) {
  const cache = await caches.open(MEDIA_CACHE);
  const cachedResponse = await cache.match(request);

  // Si ya está cacheado, úsalo
  if (cachedResponse) return cachedResponse;

  try {
    const fetchResponse = await fetch(request);
    // Guardar copia solo si la respuesta es correcta
    if (fetchResponse.ok) {
      cache.put(request, fetchResponse.clone());
      limitMediaCacheSize(MEDIA_CACHE, 8); // máximo 8 videos guardados
    }
    return fetchResponse;
  } catch (error) {
    console.warn("⚠️ Video no disponible offline:", request.url);
    return cachedResponse || new Response("Video no disponible offline", { status: 503 });
  }
}

// 🧹 Mantener cache de videos limitada
async function limitMediaCacheSize(name, maxItems) {
  const cache = await caches.open(name);
  const keys = await cache.keys();
  if (keys.length > maxItems) {
    await cache.delete(keys[0]);
    limitMediaCacheSize(name, maxItems);
  }
}
