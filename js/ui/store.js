/* Общее состояние интерфейса. Единственное место, где живут изменяемые
   переменные: остальные модули читают их отсюда и не заводят копий.

   `state` переприсваивается только здесь (загрузка, импорт, демо), поэтому
   импортёр всегда видит актуальную ссылку: ES-модули отдают живую привязку. */

import { t } from "../core/i18n.js";
import { load } from "../core/state.js";

export let state = load(t);

export function replaceState(next) {
  state = next;
}

export function reloadState() {
  state = load(t);
}

/* Какая панель открыта и что в ней выбрано. */
export const ui = { panel: null, editFrom: null, editId: null, histDays: 7 };

/* Таймеры и флаги одного сеанса. Сохранять их некуда и незачем. */
export const runtime = {
  lastSig: "",
  lastMinute: -1,
  lastDay: "",
  lastRefresh: Date.now(),
  toastTimer: 0,
  undoFn: null,
  pressTimer: 0,
  suppressClick: false,
  suppressClose: false,
  flashing: false,
  wakeLock: null,
  updatePending: false,
  updateReloading: false,
  lastUpdateCheck: 0
};
