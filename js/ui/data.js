/* Данные пользователя: импорт, экспорт, «Поделиться», сброс, демо и
   окончательное удаление привычки. Всё локально, сети здесь нет. */
import { t } from "../core/i18n.js";
import { BACKUP_KEY, KEY, demoState, exportName, exportPayload, hasDemoBackup, normalize } from "../core/state.js";
import { persist, toast } from "./feedback.js";
import { renderPanel } from "./panel.js";
import { renderSettings } from "./settings.js";
import { rerender } from "./shell.js";
import { replaceState, reloadState, state } from "./store.js";

export function importData(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;
  file.text().then(function (text) {
    const parsed = JSON.parse(text);
    if (!parsed || !Array.isArray(parsed.items)) throw new Error("bad file");
    if (!window.confirm(t("set.reset") + "?")) return;
    replaceState(normalize(parsed));
    persist();
    rerender();
    renderSettings();
    toast(t("toast.imported"));
  }).catch(function () {
    toast(t("toast.importFailed"), null, 5000);
  });
}

export function exportData(silent) {
  const blob = new Blob([exportPayload(state)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = exportName(new Date());
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(function () { URL.revokeObjectURL(url); }, 1500);
  if (!silent) toast(t("toast.exported"));
}

export function canShareFiles() {
  if (typeof navigator.share !== "function" || typeof navigator.canShare !== "function") return false;
  try {
    const probe = new File(["{}"], "probe.json", { type: "application/json" });
    return navigator.canShare({ files: [probe] });
  } catch (error) {
    return false;
  }
}

export function shareData() {
  const name = exportName(new Date());
  const file = new File([exportPayload(state)], name, { type: "application/json" });
  if (!canShareFiles()) {
    exportData();
    return;
  }
  navigator.share({ files: [file], title: t("share.title") }).catch(function (error) {
    if (error && error.name === "AbortError") return;
    exportData(true);
    toast(t("toast.shareFailed"), null, 5000);
  });
}

export function resetData(button) {
  if (button.dataset.confirm !== "1") {
    button.dataset.confirm = "1";
    button.textContent = t("set.resetConfirm");
    window.setTimeout(function () {
      button.dataset.confirm = "";
      button.textContent = t("set.reset");
    }, 4000);
    return;
  }
  try { localStorage.removeItem(KEY); } catch (error) { /* ignore */ }
  window.location.reload();
}

export function purgeItem(id) {
  state.items = state.items.filter(function (entry) { return entry.id !== id; });
  Object.keys(state.log).forEach(function (key) { delete state.log[key][id]; });
  persist();
  renderPanel();
  rerender();
  toast(t("toast.deleted"));
}

export function toggleDemo() {
  const backup = hasDemoBackup();
  if (backup) {
    try {
      localStorage.setItem(KEY, localStorage.getItem(BACKUP_KEY));
      localStorage.removeItem(BACKUP_KEY);
    } catch (error) {
      toast(t("toast.demoRestoreFailed"), null, 5000);
      return;
    }
    reloadState();
    rerender();
    renderSettings();
    toast(t("toast.demoOff"));
    return;
  }
  try {
    localStorage.setItem(BACKUP_KEY, JSON.stringify(state));
  } catch (error) {
    toast(t("toast.demoNoSpace"), null, 5000);
    return;
  }
  replaceState(normalize(demoState(state.settings, t)));
  persist();
  rerender();
  renderSettings();
  toast(t("toast.demoOn"), null, 8000);
}
