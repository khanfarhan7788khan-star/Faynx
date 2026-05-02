/* ═══════════════════════════════════════════════
   FAYNX Service Worker v4 — Redesigned
   Strategy:
   - App shell: Cache-first
   - Images (saved): On-demand cache via postMessage
   - API (/api/*): Network-first with stale fallback
   - Unsplash CDN: Network-first with cache fallback
═══════════════════════════════════════════════ */

const APP_CACHE   = "faynx-app-v4";
const IMAGE_CACHE = "faynx-images-v1";
const API_CACHE   = "faynx-api-v2";
const MAX_IMAGES  = 60;

/* ── App shell files ── */
const APP_FILES = [
  "./",
  "./index.html",
  "./style.css",
  "./app.js",
  "./manifest.json",
  "./offline.html",
];

/* ══════════════════════════════════
   INSTALL
══════════════════════════════════ */
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(APP_CACHE).then(cache => cache.addAll(APP_FILES))
  );
  self.skipWaiting();
});

/* ══════════════════════════════════
   ACTIVATE — purge old caches
══════════════════════════════════ */
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.map(key => {
          if (![APP_CACHE, IMAGE_CACHE, API_CACHE].includes(key)) {
            return caches.delete(key);
          }
        })
      )
    )
  );
  self.clients.claim();
});

/* ══════════════════════════════════
   MESSAGE — cache saved images
══════════════════════════════════ */
self.addEventListener("message", async event => {
  if (event.data?.type !== "CACHE_IMAGE") return;
  try {
    const cache = await caches.open(IMAGE_CACHE);
    const keys  = await cache.keys();
    /* LRU eviction: remove oldest when over limit */
    if (keys.length >= MAX_IMAGES) {
      await cache.delete(keys[0]);
    }
    await cache.add(event.data.url);
  } catch(_) {}
});

/* ══════════════════════════════════
   FETCH
══════════════════════════════════ */
self.addEventListener("fetch", event => {
  const { request: req } = event;
  if (req.method !== "GET") return;

  const url = new URL(req.url);

  /* 1. Internal API proxy — network first */
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(networkFirst(req, API_CACHE, 300));
    return;
  }

  /* 2. Unsplash CDN images — network first, cache fallback */
  if (url.hostname === "images.unsplash.com" || url.hostname === "source.unsplash.com") {
    event.respondWith(networkFirst(req, IMAGE_CACHE, 3600));
    return;
  }

  /* 3. HTML pages — cache first, network fallback, offline page */
  if (req.headers.get("accept")?.includes("text/html")) {
    event.respondWith(
      caches.match(req).then(cached =>
        cached || fetch(req).then(res => {
          /* Cache wallpaper & category pages */
          if (url.pathname.startsWith("/wallpaper/") || url.pathname.startsWith("/category/")) {
            const clone = res.clone();
            caches.open(APP_CACHE).then(c => c.put(req, clone));
          }
          return res;
        }).catch(() => caches.match("./offline.html"))
      )
    );
    return;
  }

  /* 4. App shell assets — cache first */
  event.respondWith(
    caches.match(req).then(cached => cached || fetch(req))
  );
});

/* ── Network-first helper with TTL ── */
async function networkFirst(req, cacheName, ttlSeconds) {
  try {
    const res   = await fetch(req);
    const cache = await caches.open(cacheName);
    const clone = res.clone();
    /* Add timestamp header for TTL checking */
    const headers = new Headers(clone.headers);
    headers.set("sw-cached-at", Date.now().toString());
    const stamped = new Response(await clone.blob(), { status:clone.status, headers });
    cache.put(req, stamped);
    return res;
  } catch(_) {
    const cached = await caches.match(req);
    if (cached) {
      const cachedAt = Number(cached.headers.get("sw-cached-at") || 0);
      if (Date.now() - cachedAt < ttlSeconds * 1000) return cached;
    }
    return cached || new Response("Offline", { status:503 });
  }
}
