/* Единая точка обработки событий. Разметка помечает кнопки data-action
   (оболочка) и data-act (панель), а здесь решается, что с ними делать.
   Так обработчики не пересоздаются при каждой перерисовке. */
import { t } from "../core/i18n.js";
import { clamp, entryOf } from "../core/schedule.js";
import { findItem, setEntry } from "../core/state.js";
import { renderBoard, updateClock } from "./board.js";
import { exportData, importData, purgeItem, resetData, shareData, toggleDemo } from "./data.js";
import { appShell, board, dock, panel, panelBody, toastEl, toastUndo } from "./dom.js";
import { openEditor } from "./editor.js";
import { handleLong, skipEntry, toggleEntry } from "./marks.js";
import { persist, toast } from "./feedback.js";
import { closePanel, openPanel, renderHistory, renderPanel } from "./panel.js";
import { fullRefresh, reopenPanelSafely, setFullscreen, syncWakeLock, updateNet } from "./screen.js";
import { renderSettings } from "./settings.js";
import { applyLanguage, applyTheme, rerender } from "./shell.js";
import { runtime, state, ui } from "./store.js";
import { whenSafeToReload } from "./update.js";

export function bind() {
  document.addEventListener("click", function (event) {
    const action = event.target.closest("[data-action]");
    if (!action) return;
    const value = action.dataset.action;
    if (value === "add") openEditor(null, "day");
    else if (value === "all") openPanel("habits");
    else if (value === "refresh") fullRefresh();
    else if (value === "settings") openPanel("settings");
  });

  board.addEventListener("pointerdown", function (event) {
    const tile = event.target.closest(".tile");
    if (!tile) return;
    runtime.suppressClick = false;
    window.clearTimeout(runtime.pressTimer);
    runtime.pressTimer = window.setTimeout(function () {
      runtime.suppressClick = true;
      handleLong(tile.dataset.id, tile.dataset.day, tile.dataset.state);
    }, 650);
  });

  ["pointerup", "pointercancel", "pointerleave"].forEach(function (name) {
    board.addEventListener(name, function () { window.clearTimeout(runtime.pressTimer); });
  });

  board.addEventListener("click", function (event) {
    const tile = event.target.closest(".tile");
    if (!tile) return;
    if (runtime.suppressClick) { runtime.suppressClick = false; return; }
    toggleEntry(tile.dataset.id, tile.dataset.day);
  });

  board.addEventListener("contextmenu", function (event) {
    if (event.target.closest(".tile")) event.preventDefault();
  });

  panel.addEventListener("click", function (event) {
    if (event.target.closest("[data-close]")) closePanel();
  });

  panel.addEventListener("close", function () {
    if (runtime.suppressClose) return;
    ui.panel = null;
    ui.editId = null;
    if (appShell && dock) appShell.insertBefore(toastEl, dock);
    else document.body.appendChild(toastEl);
    if (runtime.updatePending) window.setTimeout(whenSafeToReload, 0);
  });

  panelBody.addEventListener("click", function (event) {
    const action = event.target.closest("[data-act]");
    if (!action) return;
    const act = action.dataset.act;
    const row = action.closest(".row");

    if (act === "tab") {
      ui.panel = action.dataset.value;
      renderPanel();
      panelBody.scrollTop = 0;
      return;
    }
    if (act === "add") { openEditor(null, "all"); return; }
    if (act === "edit") { openEditor(row.dataset.id, "all"); return; }
    if (act === "clone") {
      const source = findItem(state, row.dataset.id);
      if (source) openEditor(null, "all", source);
      return;
    }
    if (act === "toggle") {
      const item = findItem(state, row.dataset.id);
      if (!item) return;
      item.archived = !item.archived;
      persist();
      renderPanel();
      rerender();
      toast(item.archived ? t("toast.archived") : t("toast.restored"));
      return;
    }
    if (act === "restore") {
      const back = findItem(state, row.dataset.id);
      if (!back) return;
      back.archived = false;
      back.deleted = false;
      persist();
      renderPanel();
      rerender();
      toast(t("toast.restored"));
      return;
    }
    if (act === "purge") {
      if (action.dataset.confirm !== "1") {
        action.dataset.confirm = "1";
        action.classList.add("danger");
        window.setTimeout(function () {
          action.dataset.confirm = "";
          action.classList.remove("danger");
        }, 4000);
        toast(t("toast.confirmPurge"), null, 4000);
        return;
      }
      purgeItem(row.dataset.id);
      return;
    }
    if (act === "theme") {
      state.settings.theme = action.dataset.value;
      persist();
      applyTheme();
      renderSettings();
      rerender();
      return;
    }
    if (act === "timeformat") {
      state.settings.timeFormat = action.dataset.value;
      persist();
      applyLanguage();
      renderSettings();
      rerender();
      return;
    }
    if (act === "wake") {
      state.settings.keepAwake = !state.settings.keepAwake;
      persist();
      syncWakeLock();
      renderSettings();
      toast(t(state.settings.keepAwake ? "toast.wakeOn" : "toast.wakeOff"));
      return;
    }
    if (act === "debt-done") { toggleEntry(row.dataset.id, row.dataset.day); return; }
    if (act === "debt-skip") { skipEntry(row.dataset.id, row.dataset.day); return; }
    if (act === "hist-toggle") {
      const entry = entryOf(state, row.dataset.day, row.dataset.id);
      if (entry && entry.s === "done") {
        setEntry(state, row.dataset.day, row.dataset.id, null);
        persist();
        rerender();
        toast(t("toast.undone"), function () {
          setEntry(state, row.dataset.day, row.dataset.id, entry);
          persist();
          rerender();
        });
      } else {
        toggleEntry(row.dataset.id, row.dataset.day);
      }
      return;
    }
    if (act === "hist-skip") {
      const current = entryOf(state, row.dataset.day, row.dataset.id);
      if (current && current.s === "skip") {
        setEntry(state, row.dataset.day, row.dataset.id, null);
        persist();
        rerender();
        toast(t("toast.skipCleared"));
      } else {
        skipEntry(row.dataset.id, row.dataset.day);
      }
      return;
    }
    if (act === "hist-more") {
      ui.histDays = clamp((Number(ui.histDays) || 7) + 7, 7, 30);
      renderHistory();
      return;
    }
    if (act === "demo") { toggleDemo(); return; }
    if (act === "share") { shareData(); return; }
    if (act === "export") { exportData(); return; }
    if (act === "fullrefresh") { fullRefresh(); return; }
    if (act === "fullscreen") { setFullscreen(!document.fullscreenElement); return; }
    if (act === "reset") { resetData(action); }
  });

  panelBody.addEventListener("change", function (event) {
    if (event.target.id === "importFile") { importData(event); return; }
    const act = event.target.dataset ? event.target.dataset.act : null;
    if (act === "lang") {
      state.settings.lang = event.target.value;
      persist();
      applyLanguage();
      renderSettings();
      rerender();
      return;
    }
    if (act === "refresh") state.settings.refreshMin = Number(event.target.value);
    else if (act === "hide") state.settings.hideDoneMin = Number(event.target.value);
    else if (act === "debt") state.settings.debtDays = Number(event.target.value);
    else return;
    persist();
    rerender();
    toast(t("toast.settingsSaved"));
  });

  window.addEventListener("online", updateNet);
  window.addEventListener("offline", updateNet);
  window.addEventListener("resize", function () {
    runtime.lastSig = "";
    renderBoard();
  });

  function relayout() {
    runtime.lastSig = "";
    updateClock(new Date());
    renderBoard();
    if (panel.open && ui.panel === "settings") {
      const scrollTop = panelBody.scrollTop;
      renderSettings();
      panelBody.scrollTop = scrollTop;
    }
  }

  document.addEventListener("fullscreenchange", function () {
    relayout();
    window.setTimeout(relayout, 120);
    window.setTimeout(relayout, 450);
    window.setTimeout(relayout, 900);

    /* Диалог в top layer браузер снимает при входе в fullscreen.
       Возвращаем его после того, как вьюпорт устаканится. */
    if (ui.panel && !panel.open) {
      window.setTimeout(function () {
        if (ui.panel && !panel.open) {
          renderPanel();
          panel.showModal();
        }
      }, 120);
    } else if (panel.open) {
      window.setTimeout(reopenPanelSafely, 120);
    }
  });

  if (window.visualViewport) {
    window.visualViewport.addEventListener("resize", function () {
      runtime.lastSig = "";
      renderBoard();
    });
  }

  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "visible") {
      updateClock(new Date());
      runtime.lastSig = "";
      renderBoard();
      syncWakeLock();
    }
  });

  const darkQuery = window.matchMedia("(prefers-color-scheme: dark)");
  if (darkQuery.addEventListener) {
    darkQuery.addEventListener("change", function () {
      if (state.settings.theme === "auto") {
        applyTheme();
        runtime.lastSig = "";
        renderBoard();
      }
    });
  }

  toastUndo.addEventListener("click", function () {
    if (!runtime.undoFn) return;
    const fn = runtime.undoFn;
    runtime.undoFn = null;
    toastEl.hidden = true;
    fn();
  });
}
