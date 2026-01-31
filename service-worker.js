const APP_CACHE = "faynx-app-v3";
const API_CACHE = "faynx-api-v2";

/*********************************
  APP SHELL (SAFE FILES ONLY)
*********************************/
const APP_FILES = [
  "./",
  "./index.html",
  "./style.css",
  "./manifest.json",
  "./offline.html"
];

/*********************************
  INSTALL
*********************************/
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(APP_CACHE).then(cache => cache.addAll(APP_FILES))
  );
  self.skipWaiting();
});

/*********************************
  ACTIVATE
*********************************/
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.map(key => {
          if (![APP_CACHE, API_CACHE].includes(key)) {
            return caches.delete(key);
          }
        })
      )
    )
  );
  self.clients.claim();
});

/*********************************
  FETCH
*********************************/
self.addEventListener("fetch", event => {
  const req = event.request;

  /* 🔁 UNSPLASH API → NETWORK FIRST */
  if (req.url.includes("api.unsplash.com")) {
    event.respondWith(
      fetch(req)
        .then(res => {
          const clone = res.clone();
          caches.open(API_CACHE).then(cache => cache.put(req, clone));
          return res;
        })
        .catch(() => caches.match(req))
    );
    return;
  }

  /* 📦 APP FILES → CACHE FIRST */
  if (req.method === "GET" && req.headers.get("accept")?.includes("text/html")) {
    event.respondWith(
      caches.match(req).then(cached => {
        return (
          cached ||
          fetch(req).catch(() => caches.match("./offline.html"))
        );
      })
    );
    return;
  }

  /* ⚙️ DEFAULT → NETWORK */
  event.respondWith(fetch(req));
});
