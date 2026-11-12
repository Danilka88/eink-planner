/* Обратная связь: тост с отменой и запись состояния на диск.
   Тост — строка сетки, а не всплывашка: так он не сдвигает плитки. */
import { t } from "../core/i18n.js";
import { save } from "../core/state.js";
import { toastEl, toastText, toastUndo } from "./dom.js";
import { runtime, state } from "./store.js";
import { whenSafeToReload } from "./update.js";

export function toast(message, undo, ms) {
  window.clearTimeout(runtime.toastTimer);
  toastText.textContent = message;
  runtime.undoFn = typeof undo === "function" ? undo : null;
  toastUndo.hidden = !runtime.undoFn;
  toastUndo.textContent = t("ui.undo");
  toastEl.hidden = false;
  runtime.toastTimer = window.setTimeout(function () {
    toastEl.hidden = true;
    runtime.undoFn = null;
    if (runtime.updatePending) window.setTimeout(whenSafeToReload, 0);
  }, ms || 4500);
}

export function persist() {
  return save(state, function () { toast(t("toast.storageFull"), null, 6000); });
}
