/* Service worker del Cotizador Artesanal
 *
 * IMPORTANTE: cada vez que cambies index.html, manifest.json o los íconos,
 * subí el número de versión de CACHE_NAME (v1 -> v2 -> v3...).
 * Así los celulares descargan los archivos nuevos y borran la caché vieja.
 */
var CACHE_NAME = 'cotizador-artesanal-v2';

// Rutas relativas: funcionan en GitHub Pages aunque la app esté en /nombre-del-repo/
var FILES_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// Instalación: guarda los archivos en la caché
self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function (cache) { return cache.addAll(FILES_TO_CACHE); })
      .then(function () { return self.skipWaiting(); })
  );
});

// Activación: borra las cachés de versiones anteriores
self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys()
      .then(function (names) {
        return Promise.all(
          names
            .filter(function (name) {
              return name.indexOf('cotizador-artesanal-') === 0 && name !== CACHE_NAME;
            })
            .map(function (name) { return caches.delete(name); })
        );
      })
      .then(function () { return self.clients.claim(); })
  );
});

// Cache-first: responde desde la caché y solo va a internet si el archivo no está guardado
self.addEventListener('fetch', function (event) {
  var request = event.request;
  if (request.method !== 'GET') return;

  var url = new URL(request.url);
  if (url.origin !== self.location.origin) return; // WhatsApp y otros sitios externos no se tocan

  event.respondWith(
    caches.match(request, { ignoreSearch: true }).then(function (cached) {
      if (cached) return cached;
      return fetch(request).catch(function () {
        // Sin internet y sin el archivo en caché: si es una página, se abre la app
        if (request.mode === 'navigate') return caches.match('./index.html');
        return Response.error();
      });
    })
  );
});
