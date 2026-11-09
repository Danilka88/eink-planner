/* РИТУАЛ — offline app shell. Bump CACHE when any shell file changes. */
const CACHE = "ritual-shell-v2.4";
const SHELL = [
  "./",
  "./index.html",
  "./styles.css",
  "./js/theme-boot.js",
  "./js/app.js",
  "./js/core/i18n.js",
  "./js/core/dict/ru.js",
  "./js/core/dict/en.js",
  "./js/core/dict/es.js",
  "./js/core/dict/pt.js",
  "./js/core/dict/fr.js",
  "./js/core/dict/zh.js",
  "./js/core/dict/hi.js",
  "./js/core/dict/ar.js",
  "./js/core/icons.js",
  "./js/core/schedule.js",
  "./js/core/state.js",
  "./manifest.webmanifest",
  "./icons/icon.svg",
  "./icons/icon-192.png",
  "./icons/icon-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(
      caches.match("./index.html").then((cached) => cached || fetch(request))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        if (response && response.ok) {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(request, copy));
        }
        return response;
      }).catch(() => cached);
    })
  );
});
