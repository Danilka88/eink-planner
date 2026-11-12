/* Редактор привычки: новая, правка, копия. Форма живёт в шаблоне
   #tpl-editor, здесь — заполнение, проверки и сохранение. */
import { dayShortNames, t } from "../core/i18n.js";
import { iconSvg } from "../core/icons.js";
import { clamp, todayKey, validDayKey, validTime } from "../core/schedule.js";
import { ALL_DAYS, HABIT_ICONS, findItem, uid } from "../core/state.js";
import { $, $$, panel, panelBody, panelTitle, toastEl, tplEditor } from "./dom.js";
import { persist, toast } from "./feedback.js";
import { closePanel, renderPanel } from "./panel.js";
import { localize, rerender } from "./shell.js";
import { runtime, state, ui } from "./store.js";

export function openEditor(id, from, template) {
  toastEl.hidden = true;
  runtime.undoFn = null;
  ui.editId = id || null;
  ui.editFrom = from || "day";

  const item = id ? findItem(state, id) : null;
  const base = item || template || null;

  panelTitle.textContent = item ? t("ed.edit") : t("ed.new");
  panelBody.innerHTML = "";
  panelBody.appendChild(tplEditor.content.cloneNode(true));
  localize(panelBody);

  const form = $("#habitForm", panelBody);
  const titleInput = $("#fTitle", form);
  const startInput = $("#fStart", form);
  const endInput = $("#fEnd", form);
  const iconWrap = $("#fIcons", form);
  const daysWrap = $("#fDays", form);
  const daysField = $("#fDaysField", form);
  const monthField = $("#fMonthField", form);
  const monthInput = $("#fMonthDay", form);
  const dateField = $("#fDateField", form);
  const dateInput = $("#fDate", form);
  const repeatWrap = $("#fRepeat", form);
  const keepInput = $("#fKeep", form);
  const deleteBtn = $("#fDelete", form);
  const cloneBtn = $("#fClone", form);
  const errorEl = $("#fErr", form);
  const titleErr = $("#fTitleErr", form);

  let selectedIcon = base ? base.icon : "teeth";
  let selectedDays = base ? base.days.slice() : ALL_DAYS.slice();
  let selectedRepeat = base ? base.repeat : "daily";
  if (selectedRepeat === "weekly" && !selectedDays.length) selectedDays = ALL_DAYS.slice();

  titleInput.value = base ? base.title : "";
  startInput.value = base ? base.start : "07:00";
  endInput.value = base ? base.end : "10:00";
  monthInput.value = base ? base.monthDay : 1;
  dateInput.value = base && base.date ? base.date : todayKey();
  keepInput.checked = base ? base.keepOverdue !== false : true;

  HABIT_ICONS.forEach(function (name) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "iconopt";
    button.dataset.icon = name;
    button.setAttribute("aria-pressed", name === selectedIcon ? "true" : "false");
    button.setAttribute("aria-label", t("ed.iconAria", { name: t("icon." + name) }));
    button.innerHTML = iconSvg(name);
    button.addEventListener("click", function () {
      selectedIcon = name;
      $$(".iconopt", iconWrap).forEach(function (option) {
        option.setAttribute("aria-pressed", option.dataset.icon === name ? "true" : "false");
      });
    });
    iconWrap.appendChild(button);
  });

  dayShortNames().forEach(function (entry) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "day";
    button.dataset.day = String(entry.day);
    button.setAttribute("aria-pressed", selectedDays.indexOf(entry.day) !== -1 ? "true" : "false");
    button.setAttribute("aria-label", t("ed.dayAria", { day: entry.short }));
    button.textContent = entry.short;
    button.addEventListener("click", function () {
      const index = selectedDays.indexOf(entry.day);
      if (index === -1) selectedDays.push(entry.day);
      else selectedDays.splice(index, 1);
      button.setAttribute("aria-pressed", index === -1 ? "true" : "false");
    });
    daysWrap.appendChild(button);
  });

  function syncRepeat() {
    $$("[data-repeat]", repeatWrap).forEach(function (button) {
      button.setAttribute("aria-pressed", button.dataset.repeat === selectedRepeat ? "true" : "false");
    });
    daysField.hidden = selectedRepeat !== "weekly";
    monthField.hidden = selectedRepeat !== "monthly";
    dateField.hidden = selectedRepeat !== "once";
  }

  $$("[data-repeat]", repeatWrap).forEach(function (button) {
    button.addEventListener("click", function () {
      selectedRepeat = button.dataset.repeat;
      syncRepeat();
    });
  });
  syncRepeat();

  if (item) {
    deleteBtn.hidden = false;
    cloneBtn.hidden = false;
    deleteBtn.addEventListener("click", function () {
      if (deleteBtn.dataset.confirm !== "1") {
        deleteBtn.dataset.confirm = "1";
        deleteBtn.textContent = t("ed.confirmArchive");
        window.setTimeout(function () {
          deleteBtn.dataset.confirm = "";
          deleteBtn.textContent = t("ed.toArchive");
        }, 4000);
        return;
      }
      item.archived = true;
      item.deleted = false;
      persist();
      ui.panel = "habits";
      renderPanel();
      rerender();
      toast(t("toast.archived"), function () {
        item.archived = false;
        persist();
        rerender();
        toast(t("toast.restored"));
      });
    });
    cloneBtn.addEventListener("click", function () {
      openEditor(null, ui.editFrom, item);
      window.setTimeout(function () {
        const input = $("#fTitle", panelBody);
        if (input) { input.focus({ preventScroll: true }); input.select(); }
      }, 80);
    });
  }

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    const title = titleInput.value.trim();
    const start = startInput.value;
    const end = endInput.value;
    titleErr.hidden = title.length > 0;
    if (!title) { titleInput.focus(); return; }
    if (!validTime(start) || !validTime(end)) {
      errorEl.hidden = false;
      errorEl.textContent = t("ed.errTime");
      return;
    }
    if (start === end) {
      errorEl.hidden = false;
      errorEl.textContent = t("ed.errSame");
      return;
    }
    if (selectedRepeat === "weekly" && !selectedDays.length) {
      errorEl.hidden = false;
      errorEl.textContent = t("ed.errDays");
      return;
    }
    if (selectedRepeat === "once" && !validDayKey(dateInput.value)) {
      errorEl.hidden = false;
      errorEl.textContent = t("ed.errDate");
      return;
    }
    errorEl.hidden = true;

    const monthDay = clamp(Number(monthInput.value) || 1, 1, 31);
    const days = selectedRepeat === "weekly" ? selectedDays.slice() : ALL_DAYS.slice();

    if (item) {
      item.title = title;
      item.icon = selectedIcon;
      item.start = start;
      item.end = end;
      item.repeat = selectedRepeat;
      item.days = days;
      item.monthDay = monthDay;
      item.date = dateInput.value;
      item.keepOverdue = keepInput.checked;
    } else {
      state.items.push({
        id: uid(),
        title: title,
        icon: selectedIcon,
        start: start,
        end: end,
        repeat: selectedRepeat,
        days: days,
        monthDay: monthDay,
        date: dateInput.value,
        keepOverdue: keepInput.checked,
        archived: false,
        deleted: false,
        order: state.items.length,
        createdAt: new Date().toISOString()
      });
    }
    persist();
    if (ui.editFrom === "all") {
      ui.panel = "habits";
      renderPanel();
    } else {
      closePanel();
    }
    rerender();
    toast(item ? t("toast.saved") : t("toast.added"));
  });

  form.addEventListener("click", function (event) {
    const closer = event.target.closest("[data-close]");
    if (!closer) return;
    event.stopPropagation();
    if (ui.editFrom === "all") {
      ui.panel = "habits";
      renderPanel();
    } else {
      closePanel();
    }
  });

  panel.appendChild(toastEl);
  if (!panel.open) panel.showModal();
  panelBody.scrollTop = 0;
  window.setTimeout(function () {
    titleInput.focus({ preventScroll: true });
    if (!item) titleInput.select();
  }, 60);
}
