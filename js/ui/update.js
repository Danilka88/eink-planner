/* Автообновление.

   Новая версия приезжает сама: service worker ставит свежий кэш, страница
   перезагружается в безопасный момент. Данные в localStorage, поэтому
   перезагрузка ничего не теряет — кроме недописанной формы, её и бережём. */
import { APP_VERSION } from "../core/version.js";
import { panel, toastEl } from "./dom.js";
import { runtime } from "./store.js";

function reloadForUpdate() {
  if (!runtime.updatePending || runtime.updateReloading) return;
  runtime.updateReloading = true;
  window.location.reload();
}

export function scheduleUpdateReload(reason) {
  const key = "ritual.reload." + reason;
  try {
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
  } catch (error) { /* приватный режим */ }
  runtime.updatePending = true;
  whenSafeToReload();
}

export function whenSafeToReload() {
  if (document.visibilityState === "hidden") {
    reloadForUpdate();
    return;
  }
  if (!panel.open && toastEl.hidden) {
    reloadForUpdate();
    return;
  }
  const waitHidden = function () {
    if (document.visibilityState === "hidden") {
      document.removeEventListener("visibilitychange", waitHidden);
      reloadForUpdate();
    }
  };
  document.addEventListener("visibilitychange", waitHidden);
}

function askWorkerVersion() {
  const controller = navigator.serviceWorker.controller;
  if (!controller) return;
  controller.postMessage({ type: "version" });
}

function watchForUpdate(registration) {
  registration.addEventListener("updatefound", function () {
    const worker = registration.installing;
    if (!worker) return;
    worker.addEventListener("statechange", function () {
      /* controller есть только у уже установленного приложения:
         первая установка перезагрузку не запускает. */
      if (worker.state === "installed" && navigator.serviceWorker.controller) {
        runtime.updatePending = true;
        whenSafeToReload();
      }
    });
  });

  /* Пока приложение открыто — спрашиваем сервер раз в 6 часов. */
  window.setInterval(function () {
    runtime.lastUpdateCheck = Date.now();
    registration.update().catch(function () { /* offline */ });
  }, 6 * 60 * 60 * 1000);

  /* Вернулись к приложению после паузы — проверяем, но не чаще раза в час. */
  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState !== "visible") return;
    if (Date.now() - runtime.lastUpdateCheck < 60 * 60 * 1000) return;
    runtime.lastUpdateCheck = Date.now();
    registration.update().catch(function () { /* offline */ });
  });
}

export function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  if (!/^https?:$/.test(window.location.protocol)) return;

  /* Если страница уже была под управлением service worker, а контроллер
     сменился — значит активировалась новая версия. Это ловит и тот случай,
     когда обновление приехало прямо во время загрузки страницы. */
  const controlledAtBoot = Boolean(navigator.serviceWorker.controller);
  navigator.serviceWorker.addEventListener("controllerchange", function () {
    if (!controlledAtBoot || runtime.updateReloading) return;
    scheduleUpdateReload("controller");
  });

  navigator.serviceWorker.addEventListener("message", function (event) {
    const data = event.data || {};
    if (data.type !== "version" || !data.cache) return;
    if (data.cache === "ritual-shell-" + APP_VERSION) return;
    scheduleUpdateReload(data.cache);
  });

  navigator.serviceWorker.register("sw.js").then(function (registration) {
    /* Обновление могло установиться до того, как мы повесили слушатели. */
    if (registration.waiting && navigator.serviceWorker.controller) {
      scheduleUpdateReload("waiting");
    }
    watchForUpdate(registration);
    askWorkerVersion();
  }).catch(function () { /* file:// or blocked */ });
}
