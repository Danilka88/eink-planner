/* Точка входа. Вся логика — в js/core/* (модель, расписание, язык) и
   js/ui/* (доска, панели, события, автообновление). Здесь только сборка. */

import { t } from "./core/i18n.js";
import { mountSprite } from "./core/icons.js";
import { renderBoard, updateClock } from "./ui/board.js";
import { bind } from "./ui/events.js";
import { persist, toast } from "./ui/feedback.js";
import { syncWakeLock, tick, updateNet } from "./ui/screen.js";
import { applyLanguage, applyTheme, localize } from "./ui/shell.js";
import { state } from "./ui/store.js";
import { registerServiceWorker } from "./ui/update.js";

function init() {
  mountSprite();
  applyLanguage();
  localize(document);
  applyTheme();
  updateNet();
  bind();
  renderBoard();
  updateClock(new Date());
  syncWakeLock();
  registerServiceWorker();

  if (navigator.storage && navigator.storage.persist) {
    navigator.storage.persist().catch(function () { /* not critical */ });
  }

  /* Подсказка первого запуска живёт в пустом состоянии, а не в тосте:
     всплывающая полоса после загрузки сдвигала доску (CLS). */
  if (state.meta && state.meta.firstRun) {
    state.meta.firstRun = false;
    persist();
  }

  if (state.meta && state.meta.recovered) {
    state.meta.recovered = false;
    persist();
    toast(t("toast.recovered"), null, 9000);
  }

  tick();
  window.setInterval(tick, 15000);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
