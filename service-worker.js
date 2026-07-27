/* ==========================================================
   FAYNX Service Worker v5
   Fixes:
   ✔ No hard refresh required
   ✔ Network-first for HTML
   ✔ Cache-first for assets
   ✔ Network-first for API
   ✔ Network-first for Unsplash
   ========================================================== */

const APP_CACHE = "faynx-app-v5";
const IMAGE_CACHE = "faynx-images-v2";
const API_CACHE = "faynx-api-v3";

const APP_FILES = [
  "/",
  "/index.html",
  "/style.css",
  "/app.js",
  "/manifest.json",
  "/offline.html"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(APP_CACHE).then(cache => cache.addAll(APP_FILES))
  );

  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    (async () => {

      const keys = await caches.keys();

      await Promise.all(
        keys
          .filter(key => ![APP_CACHE, IMAGE_CACHE, API_CACHE].includes(key))
          .map(key => caches.delete(key))
      );

      await self.clients.claim();

    })()
  );
});

/* =======================================================
   Cache downloaded wallpapers
======================================================= */

self.addEventListener("message", async event => {

  if (event.data?.type !== "CACHE_IMAGE") return;

  try {

    const cache = await caches.open(IMAGE_CACHE);

    await cache.add(event.data.url);

  } catch (e) {}

});

/* =======================================================
   Fetch
======================================================= */

self.addEventListener("fetch", event => {

  const request = event.request;

  if (request.method !== "GET") return;

  const url = new URL(request.url);

  /* ---------- API ---------- */

  if (url.pathname.startsWith("/api/")) {

    event.respondWith(networkFirst(request, API_CACHE));

    return;

  }

  /* ---------- Unsplash ---------- */

  if (
    url.hostname.includes("unsplash.com") ||
    url.hostname.includes("images.unsplash.com")
  ) {

    event.respondWith(networkFirst(request, IMAGE_CACHE));

    return;

  }

  /* ---------- HTML ---------- */

  if (request.mode === "navigate") {

    event.respondWith(

      fetch(request, {
        cache: "no-store"
      })
        .then(response => {

          const copy = response.clone();

          caches.open(APP_CACHE).then(cache => {
            cache.put(request, copy);
          });

          return response;

        })
        .catch(async () => {

          const cached = await caches.match(request);

          return cached || caches.match("/offline.html");

        })

    );

    return;

  }

  /* ---------- CSS / JS / Fonts ---------- */

  event.respondWith(

    caches.match(request).then(cached => {

      if (cached) {

        return cached;

      }

      return fetch(request).then(response => {

        if (response.ok) {

          const copy = response.clone();

          caches.open(APP_CACHE).then(cache => {

            cache.put(request, copy);

          });

        }

        return response;

      });

    })

  );

});

/* =======================================================
   Network First
======================================================= */

async function networkFirst(request, cacheName) {

  const cache = await caches.open(cacheName);

  try {

    const response = await fetch(request, {
      cache: "no-store"
    });

    cache.put(request, response.clone());

    return response;

  } catch {

    const cached = await cache.match(request);

    if (cached) return cached;

    return new Response("Offline", {
      status: 503
    });

  }

}