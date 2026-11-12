/* Отметки на доске: выполнено, пропущено, долгое нажатие.
   Каждое действие можно отменить из тоста — состояние вернётся как было. */

import { t } from "../core/i18n.js";
import { entryOf, todayKey } from "../core/schedule.js";
import { pruneLog, setEntry } from "../core/state.js";
import { openEditor } from "./editor.js";
import { persist, toast } from "./feedback.js";
import { rerender } from "./shell.js";
import { state, ui } from "./store.js";

export function toggleEntry(id, key) {
  const entry = entryOf(state, key, id);
  const previous = entry ? Object.assign({}, entry) : null;
  const late = key !== todayKey();
  if (entry && entry.s === "done") {
    setEntry(state, key, id, null);
    toast(t("toast.undone"), function () {
      setEntry(state, key, id, previous);
      persist();
      rerender();
    });
  } else {
    setEntry(state, key, id, { s: "done", t: new Date().toISOString(), late: late });
    toast(late ? t("toast.late") : t("toast.done"), function () {
      setEntry(state, key, id, previous);
      persist();
      rerender();
    });
  }
  pruneLog(state);
  persist();
  rerender();
}

export function skipEntry(id, key) {
  const previous = entryOf(state, key, id);
  const snapshot = previous ? Object.assign({}, previous) : null;
  setEntry(state, key, id, { s: "skip", t: new Date().toISOString() });
  persist();
  rerender();
  toast(t("toast.skipped"), function () {
    setEntry(state, key, id, snapshot);
    persist();
    rerender();
  });
}

export function handleLong(id, key, stateName) {
  if (stateName === "missed" || stateName === "debt") skipEntry(id, key);
  else openEditor(id, ui.panel || "day");
}
