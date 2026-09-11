/* Jones service worker — enables fully-offline reloads (PWA).
 *
 * Strategy:
 *  - On install, precache the ENTIRE app shell (HTML + all hashed JS/CSS/font
 *    chunks) from the build-time manifest, so a cold reload works offline
 *    without depending on what happened to be fetched on the first visit.
 *  - Navigations: network-first, falling back to the cached shell offline.
 *  - Same-origin static assets (/_next/static, media): cache-first (immutable),
 *    falling back to network + runtime caching.
 *  - Cross-origin requests are never intercepted.
 */
const CACHE = "jones-shell-v2";

// Build-time list of every asset to precache (self.__PRECACHE_MANIFEST).
try {
  importScripts("./sw-precache-manifest.js");
} catch (e) {
  /* manifest optional in dev */
}
const PRECACHE = (self.__PRECACHE_MANIFEST || ["./", "./index.html"]);

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      // Cache each entry independently so one failure doesn't abort the rest.
      .then((cache) =>
        Promise.all(
          PRECACHE.map((url) =>
            cache.add(new Request(url, { cache: "reload" })).catch(() => undefined)
          )
        )
      )
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // let cross-origin pass

  // Connectivity probe: always go to the network, never serve from cache, so
  // callers can reliably detect offline even when the SW controls the page.
  if (url.searchParams.has("__net_probe")) {
    event.respondWith(fetch(req));
    return;
  }

  // Navigations: network-first with cached-shell fallback.
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => undefined);
          return res;
        })
        .catch(() =>
          caches
            .match(req)
            .then((hit) => hit || caches.match("./") || caches.match("./index.html"))
        )
    );
    return;
  }

  // Static assets: cache-first (they are content-hashed / immutable).
  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => undefined);
          return res;
        })
        .catch(() => cached);
    })
  );
});
