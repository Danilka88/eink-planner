/* Панель: оболочка, вкладки и три списка — привычки, история, архив.
   Действия по кнопкам разбирает events.js: здесь только разметка. */
import { dayShortNames, formatDate, formatDayFull, formatTime, formatWindow, t } from "../core/i18n.js";
import { iconSvg } from "../core/icons.js";
import { activeItems, clamp, computeDebts, dayKey, historyRowsFor, minutesOf, todayKey } from "../core/schedule.js";
import { $, panel, panelBody, panelTitle, toastEl } from "./dom.js";
import { renderSettings } from "./settings.js";
import { runtime, state, ui } from "./store.js";

export function openPanel(kind) {
  toastEl.hidden = true;
  runtime.undoFn = null;
  ui.panel = kind === "all" ? "habits" : kind;
  panel.appendChild(toastEl);
  renderPanel();
  if (!panel.open) panel.showModal();
  panelBody.scrollTop = 0;
}

export function closePanel() {
  if (panel.open) panel.close();
}

export function renderPanel() {
  if (!ui.panel) return;
  if (ui.panel === "settings") renderSettings();
  else if (ui.panel === "history") renderHistory();
  else if (ui.panel === "archive") renderArchive();
  else renderHabits();
}

function tabsHtml(active) {
  const tabs = [["habits", "ui.habits"], ["history", "ui.history"], ["archive", "ui.archive"]];
  return '<div class="tabs" role="group" aria-label="' + t("ui.habits") + '">' +
    tabs.map(function (tab) {
      const on = active === tab[0];
      return '<button type="button" data-act="tab" data-value="' + tab[0] + '"' +
        (on ? ' aria-current="page"' : "") + ">" + t(tab[1]) + "</button>";
    }).join("") + "</div>";
}

function noteNode(text) {
  const note = document.createElement("p");
  note.className = "note";
  note.textContent = text;
  return note;
}

function rowIcon(item) {
  return '<span class="row-icon" aria-hidden="true">' + iconSvg(item.icon) + "</span>";
}

function repeatLabel(item) {
  if (item.repeat === "once") {
    return t("rep.once", { date: formatDate(new Date(item.date + "T12:00:00"), { day: "numeric", month: "long" }) });
  }
  if (item.repeat === "monthly") return t("rep.monthly", { n: item.monthDay });
  if (item.repeat === "weekly") {
    if (!item.days || item.days.length === 7) return t("rep.daily");
    const names = dayShortNames();
    const sorted = item.days.slice().sort(function (a, b) { return (a || 7) - (b || 7); });
    return sorted.map(function (day) {
      const found = names.filter(function (n) { return n.day === day; })[0];
      return found ? found.short : "";
    }).join(" ");
  }
  return t("rep.daily");
}

export function renderHabits() {
  panelTitle.textContent = t("ui.habits");
  panelBody.innerHTML = "";
  panelBody.insertAdjacentHTML("beforeend", tabsHtml("habits"));

  const items = activeItems(state).slice()
    .sort(function (a, b) { return minutesOf(a.start) - minutesOf(b.start); });

  const debts = computeDebts(state, todayKey());
  if (debts.length) {
    const section = document.createElement("section");
    section.className = "group";
    const heading = document.createElement("h3");
    heading.textContent = t("group.debts");
    section.appendChild(heading);
    const list = document.createElement("ul");
    list.className = "rows";
    debts.forEach(function (entry) {
      const li = document.createElement("li");
      li.className = "row row-debt";
      li.dataset.id = entry.item.id;
      li.dataset.day = entry.day;
      li.innerHTML = rowIcon(entry.item) +
        '<span class="row-main"><span class="row-title"></span><span class="row-meta"></span></span>' +
        '<button class="switch" type="button" data-act="debt-done">' + t("habits.debtDone") + "</button>" +
        '<button class="iconbtn" type="button" data-act="debt-skip" aria-label="' + t("habits.debtSkipAria", { title: entry.item.title }) + '">' +
        iconSvg("skip", "ic flip") + "</button>";
      $(".row-title", li).textContent = entry.item.title;
      $(".row-meta", li).textContent = (entry.daysAgo === 1 ? t("tile.yesterday") : t("tile.daysAgo", { n: entry.daysAgo })) +
        " · " + formatWindow(entry.item.start, entry.item.end);
      $("[data-act='debt-done']", li).setAttribute("aria-label", t("habits.debtDoneAria", { title: entry.item.title }));
      list.appendChild(li);
    });
    section.appendChild(list);
    panelBody.appendChild(section);
  }

  if (!items.length) panelBody.appendChild(noteNode(t("habits.empty")));

  const groups = [
    { label: "group.morning", test: function (h) { return h < 12; } },
    { label: "group.day", test: function (h) { return h >= 12 && h < 18; } },
    { label: "group.evening", test: function (h) { return h >= 18; } }
  ];

  groups.forEach(function (group) {
    const groupItems = items.filter(function (item) {
      return group.test(Math.floor(minutesOf(item.start) / 60));
    });
    if (!groupItems.length) return;

    const section = document.createElement("section");
    section.className = "group";
    const heading = document.createElement("h3");
    heading.textContent = t(group.label);
    section.appendChild(heading);

    const list = document.createElement("ul");
    list.className = "rows";

    groupItems.forEach(function (item) {
      const li = document.createElement("li");
      li.className = "row row-habit";
      li.dataset.id = item.id;
      li.innerHTML = rowIcon(item) +
        '<span class="row-main"><span class="row-title"></span><span class="row-meta"></span></span>' +
        '<button class="switch" type="button" data-act="toggle" aria-pressed="true">' + t("ui.on") + "</button>" +
        '<button class="iconbtn" type="button" data-act="clone" aria-label="' + t("habits.copy", { title: item.title }) + '">' +
        iconSvg("copy") + "</button>" +
        '<button class="iconbtn" type="button" data-act="edit" aria-label="' + t("habits.edit", { title: item.title }) + '">' +
        iconSvg("edit") + "</button>";
      $(".row-title", li).textContent = item.title;
      $(".row-meta", li).textContent = formatWindow(item.start, item.end) + " · " + repeatLabel(item);
      list.appendChild(li);
    });

    section.appendChild(list);
    panelBody.appendChild(section);
  });

  const add = document.createElement("button");
  add.type = "button";
  add.className = "btn btn-primary";
  add.dataset.act = "add";
  add.textContent = t("ui.addHabit");
  panelBody.appendChild(add);

  panelBody.appendChild(noteNode(t("habits.hint")));
}

function historyStatus(entry) {
  if (!entry) return t("hist.none");
  if (entry.s === "skip") return t("hist.skipped");
  const time = entry.t ? formatTime(new Date(entry.t)) : "";
  return entry.late
    ? t("hist.doneLate", { time: time })
    : t("hist.done", { time: time });
}

export function renderHistory() {
  panelTitle.textContent = t("ui.history");
  panelBody.innerHTML = "";
  panelBody.insertAdjacentHTML("beforeend", tabsHtml("history"));

  const span = clamp(Number(ui.histDays) || 7, 1, 30);
  const today = todayKey();
  const now = new Date();
  const base = new Date(today + "T12:00:00");
  let any = false;

  for (let back = 0; back < span; back += 1) {
    const date = new Date(base.getTime());
    date.setDate(date.getDate() - back);
    const key = dayKey(date);
    const rows = historyRowsFor(state, key, today, now);
    if (!rows.length) continue;
    any = true;

    const section = document.createElement("section");
    section.className = "group";
    const heading = document.createElement("h3");
    const stamp = formatDayFull(date);
    heading.textContent = back === 0 ? t("hist.today", { date: stamp })
      : back === 1 ? t("hist.yesterday", { date: stamp })
        : stamp;
    section.appendChild(heading);

    const list = document.createElement("ul");
    list.className = "rows";
    rows.forEach(function (row) {
      const entry = row.entry;
      const li = document.createElement("li");
      li.className = "row row-hist";
      li.dataset.id = row.item.id;
      li.dataset.day = key;
      li.dataset.entry = entry ? entry.s : "none";
      li.innerHTML = rowIcon(row.item) +
        '<span class="row-main"><span class="row-title"></span><span class="row-meta"></span></span>' +
        '<button class="switch" type="button" data-act="hist-toggle"></button>' +
        '<button class="iconbtn" type="button" data-act="hist-skip"></button>';
      $(".row-title", li).textContent = row.item.title;
      $(".row-meta", li).textContent = historyStatus(entry);

      const toggle = $("[data-act='hist-toggle']", li);
      const skip = $("[data-act='hist-skip']", li);
      if (entry && entry.s === "done") {
        toggle.textContent = t("hist.remove");
        skip.innerHTML = iconSvg("skip", "ic flip");
        skip.setAttribute("aria-label", t("hist.skip"));
      } else if (entry && entry.s === "skip") {
        toggle.textContent = t("hist.mark");
        skip.innerHTML = iconSvg("undo");
        skip.setAttribute("aria-label", t("hist.return"));
      } else {
        toggle.textContent = t("hist.mark");
        skip.innerHTML = iconSvg("skip", "ic flip");
        skip.setAttribute("aria-label", t("hist.skip"));
      }
      toggle.setAttribute("aria-label", row.item.title);
      list.appendChild(li);
    });

    section.appendChild(list);
    panelBody.appendChild(section);
  }

  if (!any) panelBody.appendChild(noteNode(t("hist.empty")));

  if (span < 30) {
    const more = document.createElement("button");
    more.type = "button";
    more.className = "btn btn-ghost";
    more.dataset.act = "hist-more";
    more.textContent = t("hist.more");
    panelBody.appendChild(more);
  }
}

export function renderArchive() {
  panelTitle.textContent = t("ui.archive");
  panelBody.innerHTML = "";
  panelBody.insertAdjacentHTML("beforeend", tabsHtml("archive"));

  const items = state.items.filter(function (item) { return item.archived && !item.deleted; })
    .slice().sort(function (a, b) { return minutesOf(a.start) - minutesOf(b.start); });

  if (!items.length) {
    panelBody.appendChild(noteNode(t("arch.empty")));
    return;
  }

  const section = document.createElement("section");
  section.className = "group";
  const heading = document.createElement("h3");
  heading.textContent = t("arch.heading");
  section.appendChild(heading);

  const list = document.createElement("ul");
  list.className = "rows";
  items.forEach(function (item) {
    const li = document.createElement("li");
    li.className = "row row-arch";
    li.dataset.id = item.id;
    li.innerHTML = rowIcon(item) +
      '<span class="row-main"><span class="row-title"></span><span class="row-meta"></span></span>' +
      '<button class="switch" type="button" data-act="restore">' + t("ui.restore") + "</button>" +
      '<button class="iconbtn" type="button" data-act="purge" aria-label="' + t("arch.purge") + '">' +
      iconSvg("delete") + "</button>";
    $(".row-title", li).textContent = item.title;
    $(".row-meta", li).textContent = formatWindow(item.start, item.end) + " · " + repeatLabel(item);
    list.appendChild(li);
  });

  section.appendChild(list);
  panelBody.appendChild(section);
  panelBody.appendChild(noteNode(t("arch.note")));
}
