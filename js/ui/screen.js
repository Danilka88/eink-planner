/* Экран: полное обновление e-ink, удержание бодрствования, часы и
   полноэкранный режим. Всё, что связано с самим дисплеем. */
import { t } from "../core/i18n.js";
import { dayKey } from "../core/schedule.js";
import { renderBoard, updateClock } from "./board.js";
import { flash, netChip, panel } from "./dom.js";
import { toast } from "./feedback.js";
import { renderPanel } from "./panel.js";
import { runtime, state, ui } from "./store.js";

export function fullRefresh() {
  if (runtime.flashing) return;
  runtime.flashing = true;
  flash.hidden = false;
  flash.classList.remove("dark");
  window.setTimeout(function () { flash.classList.add("dark"); }, 130);
  window.setTimeout(function () { flash.classList.remove("dark"); }, 260);
  window.setTimeout(function () { flash.classList.add("dark"); }, 390);
  window.setTimeout(function () {
    flash.classList.remove("dark");
    flash.hidden = true;
    runtime.flashing = false;
    runtime.lastRefresh = Date.now();
  }, 520);
}

function maybeAutoRefresh() {
  const minutes = Number(state.settings.refreshMin) || 0;
  if (!minutes) return;
  if (Date.now() - runtime.lastRefresh >= minutes * 60000) fullRefresh();
}

export function syncWakeLock() {
  if (!("wakeLock" in navigator)) return;
  if (state.settings.keepAwake && document.visibilityState === "visible") {
    if (!runtime.wakeLock || runtime.wakeLock.released) {
      navigator.wakeLock.request("screen").then(function (lock) {
        runtime.wakeLock = lock;
        lock.addEventListener("release", function () { runtime.wakeLock = null; });
      }).catch(function () { /* not available */ });
    }
  } else if (runtime.wakeLock) {
    runtime.wakeLock.release().catch(function () { /* ignore */ });
    runtime.wakeLock = null;
  }
}

export function updateNet() {
  netChip.hidden = navigator.onLine !== false;
}

export function tick() {
  const now = new Date();
  const minute = now.getMinutes();
  const key = dayKey(now);
  if (minute !== runtime.lastMinute || key !== runtime.lastDay) {
    runtime.lastMinute = minute;
    runtime.lastDay = key;
    updateClock(now);
    renderBoard();
    maybeAutoRefresh();
  }
}

export function reopenPanelSafely() {
  if (!panel.open) return;
  runtime.suppressClose = true;
  panel.close();
  window.setTimeout(function () {
    runtime.suppressClose = false;
    if (ui.panel && !panel.open) panel.showModal();
  }, 0);
}

export function setFullscreen(on) {
  if (on) {
    if (!document.documentElement.requestFullscreen) {
      toast(t("toast.fullscreenUnavailable"), null, 5000);
      return;
    }
    /* Диалог живёт в top layer; при входе в fullscreen браузер его оттуда
       вытесняет, и окно становится прозрачным. Поэтому выходим из модалки
       до запроса и возвращаемся после. */
    const wasPanel = ui.panel;
    if (panel.open) {
      runtime.suppressClose = true;
      panel.close();
      window.setTimeout(function () { runtime.suppressClose = false; }, 0);
    }
    document.documentElement.requestFullscreen().catch(function () {
      toast(t("toast.fullscreenDenied"), null, 5000);
      if (wasPanel && !panel.open) {
        ui.panel = wasPanel;
        renderPanel();
        panel.showModal();
      }
    });
  } else if (document.fullscreenElement) {
    document.exitFullscreen().catch(function () { /* ignore */ });
  }
}
