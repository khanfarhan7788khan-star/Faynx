const CACHE = "faynx-v2"; // increment when updating
const API_CACHE = "faynx-api-v1";

/*********************************
  FILES TO CACHE (APP SHELL)
*********************************/
const FILES = [
  "./",
  "./index.html",
  "./style.css",
  "./app.js",
  "./manifest.json",
  "./offline.html"
];

/*********************************
  INSTALL
*********************************/
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(FILES))
  );
  self.skipWaiting();
});

/*********************************
  ACTIVATE (CLEAN OLD CACHES)
*********************************/
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.map(key => {
          if (![CACHE, API_CACHE].includes(key)) {
            return caches.delete(key);
          }
        })
      )
    )
  );
  self.clients.claim();
});

/*********************************
  FETCH STRATEGY
*********************************/
self.addEventListener("fetch", event => {
  const { request } = event;

  // 🌐 Unsplash API → Network First
  if (request.url.includes("api.unsplash.com")) {
    event.respondWith(
      fetch(request)
        .then(res => {
          const clone = res.clone();
          caches.open(API_CACHE).then(c => c.put(request, clone));
          return res;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // 📦 App shell → Cache First
  event.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached;

      return fetch(request)
        .then(res => {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(request, clone));
          return res;
        })
        .catch(() => caches.match("./offline.html"));
    })
  );
});
