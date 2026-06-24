/* Culinary OS service worker — network-first für same-origin Shell, Cache als Offline-Fallback.
   Supabase/CDN (andere Origin) wird NICHT angefasst → Live-Daten immer aus dem Netz. */
const C = 'cos-shell-v4';
self.addEventListener('install', function () { self.skipWaiting(); });
self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys()
      .then(function (ks) { return Promise.all(ks.map(function (k) { return k === C ? null : caches.delete(k); })); })
      .then(function () { return self.clients.claim(); })
  );
});
self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET') return;
  var u = new URL(e.request.url);
  if (u.origin !== location.origin) return; // Supabase & CDN: direkt ans Netz
  e.respondWith(
    fetch(e.request)
      .then(function (r) { var cp = r.clone(); caches.open(C).then(function (c) { c.put(e.request, cp); }); return r; })
      .catch(function () { return caches.match(e.request).then(function (m) { return m || caches.match('./'); }); })
  );
});
