const CACHE_NAME = "que-comemos-v1";

const ARCHIVOS = [
  "./",
  "./index.html",
  "./style.css",
  "./app.js",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png"
];

self.addEventListener("install", (evento) => {
  evento.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ARCHIVOS);
    })
  );

  self.skipWaiting();
});

self.addEventListener("activate", (evento) => {
  evento.waitUntil(
    caches.keys().then((claves) => {
      return Promise.all(
        claves
          .filter((clave) => clave !== CACHE_NAME)
          .map((clave) => caches.delete(clave))
      );
    })
  );

  self.clients.claim();
});

self.addEventListener("fetch", (evento) => {
  if (evento.request.method !== "GET") {
    return;
  }

  evento.respondWith(
    caches.match(evento.request).then((respuestaCache) => {
      if (respuestaCache) {
        return respuestaCache;
      }

      return fetch(evento.request)
        .then((respuestaRed) => {
          const copia = respuestaRed.clone();

          caches.open(CACHE_NAME).then((cache) => {
            cache.put(evento.request, copia);
          });

          return respuestaRed;
        })
        .catch(() => caches.match("./index.html"));
    })
  );
});
