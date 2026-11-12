/* Такт — offline app shell. Bump CACHE when any shell file changes. */
const CACHE = "ritual-shell-1.5.0";
const SHELL = [
  "./",
  "./index.html",
  "./styles.css",
  "./js/theme-boot.js",
  "./js/app.js",
  "./js/ui/board.js",
  "./js/ui/data.js",
  "./js/ui/dom.js",
  "./js/ui/editor.js",
  "./js/ui/events.js",
  "./js/ui/feedback.js",
  "./js/ui/marks.js",
  "./js/ui/panel.js",
  "./js/ui/screen.js",
  "./js/ui/settings.js",
  "./js/ui/shell.js",
  "./js/ui/store.js",
  "./js/ui/update.js",
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
  "./js/core/version.js",
  "./js/core/schedule.js",
  "./js/core/state.js",
  "./manifest.webmanifest",
  "./icons/icon.svg",
  "./icons/icon-192.png",
  "./icons/icon-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE)
      /* cache: "reload" — иначе браузер может отдать старый файл из своего
         HTTP-кэша, и в новый кэш попадёт устаревший код. */
      .then((cache) => cache.addAll(SHELL.map((url) => new Request(url, { cache: "reload" }))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

/* Страница спрашивает, какой кэш активен: если он новее её собственной
   версии, приложение перезагрузится. Это ловит обновление, приехавшее
   прямо во время загрузки страницы. */
self.addEventListener("message", (event) => {
  const data = event.data || {};
  if (data.type !== "version" || !event.source) return;
  event.source.postMessage({ type: "version", cache: CACHE });
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
