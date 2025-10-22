// ===============================
// 🧩 SERVICE WORKER LITE – SRM-QK v1.0
// ===============================

// Nombre del caché
const CACHE_NAME = "srm-qk-lite-v1";

// Archivos esenciales para la PWA (solo los livianos)
const CORE_ASSETS = [
  "/QK/",
  "/QK/index.html",
  "/QK/site.webmanifest",
  "/QK/favicon.ico",
  "/QK/favicon-16x16.png",
  "/QK/favicon-32x32.png",
  "/QK/android-chrome-192x192.png",
  "/QK/android-chrome-512x512.png",
  "/QK/apple-touch-icon.png"
];

// ===============================
// 📦 INSTALACIÓN
// ===============================
self.addEventListener("install", (event) => {
  console.log("📦 Instalando SRM-QK Lite Service Worker...");
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(CORE_ASSETS))
      .then(() => self.skipWaiting())
      .catch(err => console.error("❌ Error al cachear activos iniciales:", err))
  );
});

// ===============================
// ⚙️ ACTIVACIÓN
// ===============================
self.addEventListener("activate", (event) => {
  console.log("⚙️ Activando nuevo SW...");
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => {
          console.log("🗑️ Eliminando caché viejo:", k);
          return caches.delete(k);
        })
      )
    )
  );
  self.clients.claim();
});

// ===============================
// 🌐 ESTRATEGIA: CACHE FIRST
// ===============================
self.addEventListener("fetch", (event) => {
  const req = event.request;

  // 🔒 Ignorar peticiones POST (ej. /api/responder)
  if (req.method === "POST") return;

  // 🔹 Estrategia cache-first para documentos e imágenes
  event.respondWith(
    caches.match(req).then(cacheRes => {
      if (cacheRes) return cacheRes;
      return fetch(req)
        .then(networkRes => {
          // Cache dinámico solo para recursos estáticos pequeños
          if (req.url.startsWith("https://somosrepuestosmotos-coder.github.io/QK/")) {
            caches.open(CACHE_NAME).then(cache => cache.put(req, networkRes.clone()));
          }
          return networkRes;
        })
        .catch(() => {
          // 🧭 Fallback offline
          if (req.destination === "document") {
            return caches.match("/QK/index.html");
          }
        });
    })
  );
});

// ===============================
// 🧹 EVENTUAL ACTUALIZACIÓN AUTOMÁTICA
// ===============================
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
