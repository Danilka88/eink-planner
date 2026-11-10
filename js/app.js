/* РИТУАЛ — UI. Логика расписания и хранения вынесена в js/core/*,
   здесь только DOM, события и состояние интерфейса. */

import {
  detectLocale, formatClock, formatDate, formatDay, formatDayFull,
  formatTime, formatWeekday, formatWindow, getLocale, setLocale, t,
  dayShortNames, LOCALE_NAMES, LOCALES
} from "./core/i18n.js";
import { iconSvg, mountSprite } from "./core/icons.js";
import { APP_VERSION, BUILD_DATE } from "./core/version.js";
import {
  ALL_DAYS, BACKUP_KEY, KEY,
  demoState, exportName, exportPayload, findItem, hasDemoBackup,
  load, normalize, pruneLog, save, setEntry, uid
} from "./core/state.js";
import {
  activeItems, clamp, computeDebts, computeEntries, dayKey, entryOf,
  historyRowsFor, isScheduled, minutesOf, nextUpcoming, todayKey,
  validDayKey, validTime
} from "./core/schedule.js";

const $ = function (sel, root) { return (root || document).querySelector(sel); };
const $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

const board = $("#board");
const empty = $("#empty");
const emptyKicker = $("#emptyKicker");
const emptyTitle = $("#emptyTitle");
const emptyNext = $("#emptyNext");
const emptyAction = $("[data-action='all']", empty);
const panel = $("#panel");
const panelTitle = $("#panelTitle");
const panelBody = $("#panelBody");
const toastEl = $("#toast");
const toastText = $("#toastText");
const toastUndo = $("#toastUndo");
const flash = $("#flash");
const netChip = $("#netChip");
const clockEl = $("#clock");
const dateEl = $("#date");
const weekdayEl = $("#weekday");
const progressWrap = $("#progressWrap");
const progressText = $("#progressText");
const segments = $("#segments");
const tplTile = $("#tpl-tile");
const tplEditor = $("#tpl-editor");
const appShell = $(".app");
const dock = $(".dock");

const MAX_TILES = 9;

let state = load(t);
let ui = { panel: null, editFrom: null, editId: null, histDays: 7 };
let lastSig = "";
let lastMinute = -1;
let lastDay = "";
let lastRefresh = Date.now();
let toastTimer = 0;
let undoFn = null;
let pressTimer = 0;
let suppressClick = false;
let suppressClose = false;
let flashing = false;
let wakeLock = null;

/* ------------------------------------------------------------ общее */

function toast(message, undo, ms) {
  window.clearTimeout(toastTimer);
  toastText.textContent = message;
  undoFn = typeof undo === "function" ? undo : null;
  toastUndo.hidden = !undoFn;
  toastUndo.textContent = t("ui.undo");
  toastEl.hidden = false;
  toastTimer = window.setTimeout(function () {
    toastEl.hidden = true;
    undoFn = null;
    if (updatePending) window.setTimeout(whenSafeToReload, 0);
  }, ms || 4500);
}

function persist() {
  return save(state, function () { toast(t("toast.storageFull"), null, 6000); });
}

function applyLanguage() {
  const lang = state.settings.lang === "auto" ? detectLocale() : state.settings.lang;
  setLocale(lang, state.settings.timeFormat);
  document.title = t("app.name") + " — " + t("app.tagline");
  const desc = document.querySelector('meta[name="description"]');
  if (desc) desc.setAttribute("content", t("app.description"));
  const heading = document.querySelector("h1.sr-only");
  if (heading) heading.textContent = t("app.name") + " — " + t("app.tagline");
  localize(document);
}

function localize(root) {
  $$("[data-i18n]", root).forEach(function (node) {
    node.textContent = t(node.dataset.i18n);
  });
  $$("[data-i18n-aria]", root).forEach(function (node) {
    node.setAttribute("aria-label", t(node.dataset.i18nAria));
  });
}

function applyTheme() {
  const choice = state.settings.theme;
  const dark = choice === "dark" || (choice === "auto" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.dataset.theme = dark ? "dark" : "light";
  document.body.dataset.eink = state.settings.eink ? "1" : "0";
  updateClock(new Date());
}

function rerender() {
  lastSig = "";
  applyTheme();
  renderBoard();
  if (panel.open && ui.panel) renderPanel();
}

/* ------------------------------------------------------------ доска */

function layoutGrid(count) {
  const portrait = window.innerHeight >= window.innerWidth;
  const narrow = window.innerWidth < 430;
  let cols;
  if (portrait) cols = count <= 1 ? 1 : (narrow || count <= 6) ? 2 : count <= 9 ? 3 : 4;
  else cols = count <= 1 ? 1 : count <= 9 ? 3 : 4;
  const rows = Math.max(1, Math.ceil(count / cols));
  board.style.setProperty("--cols", String(cols));
  board.style.setProperty("--rows", String(rows));
  board.classList.toggle("dense", count > 6);
  board.classList.toggle("solo", count > 0 && count <= 2);
  return cols;
}

function metaFor(entry) {
  if (entry.state === "done") return t("tile.done", { time: formatTime(new Date(entry.at)) });
  if (entry.state === "missed") return t("tile.overdue", { end: formatClock(entry.item.end) });
  if (entry.state === "debt") {
    return entry.daysAgo === 1
      ? t("tile.debtYesterday")
      : t("tile.daysAgo", { n: entry.daysAgo });
  }
  return formatWindow(entry.item.start, entry.item.end);
}

function ariaFor(entry) {
  const tail = entry.state === "done" ? t("tile.ariaDone")
    : entry.state === "missed" ? t("tile.ariaOverdue")
      : entry.state === "debt" ? t("tile.ariaDebt")
        : t("tile.ariaMark");
  return entry.item.title + ", " + metaFor(entry) + ", " + tail;
}

function makeTile(entry) {
  const node = tplTile.content.firstElementChild.cloneNode(true);
  node.dataset.id = entry.item.id;
  node.dataset.day = entry.day;
  node.dataset.state = entry.state;
  node.setAttribute("aria-pressed", entry.state === "done" ? "true" : "false");
  node.setAttribute("aria-label", ariaFor(entry));
  $(".tile-icon", node).innerHTML = iconSvg(entry.item.icon);
  $(".tile-title", node).textContent = entry.item.title;
  $(".tile-meta", node).textContent = metaFor(entry);
  return node;
}

function renderBoard() {
  const now = new Date();
  const entries = computeEntries(state, now);
  const portrait = window.innerHeight >= window.innerWidth;
  const narrow = window.innerWidth < 430;
  const maxTiles = narrow ? 6 : portrait ? MAX_TILES : MAX_TILES + 3;
  const extra = Math.max(0, entries.length - maxTiles);
  const shown = entries.slice(0, extra ? maxTiles - 1 : maxTiles);
  const sig = shown.map(function (entry) {
    return entry.item.id + ":" + entry.state + ":" + entry.day + ":" + getLocale();
  }).join("|") + "#" + shown.length + "+" + extra;

  if (sig !== lastSig) {
    const count = shown.length + (extra ? 1 : 0);
    const cols = layoutGrid(count);
    board.innerHTML = "";
    const frag = document.createDocumentFragment();
    shown.forEach(function (entry) { frag.appendChild(makeTile(entry)); });
    if (extra) frag.appendChild(makeMoreTile(extra));
    board.appendChild(frag);
    if (count > 1 && cols > 1) {
      const rem = count % cols;
      const last = board.lastElementChild;
      if (last && rem !== 0) last.style.gridColumn = "span " + (cols - rem + 1);
    }
    lastSig = sig;
  }

  board.hidden = shown.length === 0 && !extra;
  updateProgress(entries);
  renderEmpty(entries, now);
}

function makeMoreTile(extra) {
  const node = document.createElement("button");
  node.type = "button";
  node.className = "tile tile-more";
  node.dataset.action = "all";
  node.setAttribute("aria-label", t("board.more") + ": " + extra);
  node.innerHTML = '<span class="tile-more-count">+' + extra + "</span>" +
    '<span class="tile-more-label">' + t("board.more") + "</span>";
  return node;
}

function updateProgress(entries) {
  const today = todayKey();
  const todays = activeItems(state).filter(function (item) { return isScheduled(item, today); });
  const done = todays.filter(function (item) {
    const entry = entryOf(state, today, item.id);
    return entry && entry.s === "done";
  }).length;
  const missed = entries.filter(function (entry) {
    return entry.state === "missed" || entry.state === "debt";
  }).length;
  const total = todays.length;

  progressText.textContent = done + "/" + total;
  progressWrap.setAttribute("aria-valuemax", String(total));
  progressWrap.setAttribute("aria-valuenow", String(done));
  progressWrap.setAttribute("aria-valuetext", t("board.progress", { done: done, total: total }) +
    (missed ? t("board.progressMissed", { missed: missed }) : ""));

  const segCount = Math.min(total, 12);
  if (segments.dataset.count !== String(segCount)) {
    segments.innerHTML = "";
    for (let i = 0; i < segCount; i += 1) {
      const seg = document.createElement("span");
      seg.className = "segment";
      segments.appendChild(seg);
    }
    segments.dataset.count = String(segCount);
  }
  const filled = total ? Math.round((done / total) * segCount) : 0;
  Array.prototype.forEach.call(segments.children, function (seg, index) {
    seg.classList.toggle("on", index < filled);
  });
}

function renderEmpty(entries, now) {
  const show = entries.length === 0;
  empty.hidden = !show;
  if (!show) return;

  const active = activeItems(state);
  const today = todayKey();
  const todays = active.filter(function (item) { return isScheduled(item, today); });
  const done = todays.filter(function (item) {
    const entry = entryOf(state, today, item.id);
    return entry && entry.s === "done";
  }).length;

  if (!active.length) {
    emptyKicker.textContent = t("board.empty");
    emptyTitle.textContent = t("board.addFirst");
    emptyNext.textContent = t("board.addFirstHint");
    emptyAction.textContent = t("ui.addHabit");
    emptyAction.dataset.action = "add";
    return;
  }

  emptyAction.dataset.action = "all";
  emptyAction.textContent = t("ui.all");

  if (todays.length && done >= todays.length) {
    emptyKicker.textContent = t("board.done");
    emptyTitle.textContent = t("board.allDone");
  } else {
    emptyKicker.textContent = t("board.now");
    emptyTitle.textContent = t("board.free");
  }

  const next = nextUpcoming(state, now);
  if (next) {
    emptyNext.textContent = t(next.tomorrow ? "board.nextTomorrow" : "board.nextToday", {
      title: next.item.title,
      time: formatClock(next.item.start)
    });
  } else {
    emptyNext.textContent = t("board.nothingLeft");
  }
}

function updateClock(now) {
  clockEl.textContent = formatTime(now);
  dateEl.textContent = formatDay(now);
  weekdayEl.textContent = formatWeekday(now);
  const dark = document.documentElement.dataset.theme === "dark";
  const color = dark ? "#121212" : "#ffffff";
  $$("meta[name='theme-color']").forEach(function (meta) {
    meta.setAttribute("content", color);
  });
}

/* ------------------------------------------------------------ отметки */

function toggleEntry(id, key) {
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

function skipEntry(id, key) {
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

function handleLong(id, key, stateName) {
  if (stateName === "missed" || stateName === "debt") skipEntry(id, key);
  else openEditor(id, ui.panel || "day");
}

/* ------------------------------------------------------------ панели */

function openPanel(kind) {
  toastEl.hidden = true;
  undoFn = null;
  ui.panel = kind === "all" ? "habits" : kind;
  panel.appendChild(toastEl);
  renderPanel();
  if (!panel.open) panel.showModal();
  panelBody.scrollTop = 0;
}

function closePanel() {
  if (panel.open) panel.close();
}

function renderPanel() {
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

/* --------------------------------------------------- вкладка привычек */

function renderHabits() {
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

/* --------------------------------------------------- вкладка истории */

function historyStatus(entry) {
  if (!entry) return t("hist.none");
  if (entry.s === "skip") return t("hist.skipped");
  const time = entry.t ? formatTime(new Date(entry.t)) : "";
  return entry.late
    ? t("hist.doneLate", { time: time })
    : t("hist.done", { time: time });
}

function renderHistory() {
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

/* --------------------------------------------------- вкладка архива */

function renderArchive() {
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
    $(".row-meta", li).textContent = item.start + "–" + item.end + " · " + repeatLabel(item);
    list.appendChild(li);
  });

  section.appendChild(list);
  panelBody.appendChild(section);
  panelBody.appendChild(noteNode(t("arch.note")));
}

/* --------------------------------------------------- настройки */

function settingSelect(act, label, value, options) {
  let html = '<label class="setting"><span>' + label + "</span><select data-act=\"" + act + "\">";
  options.forEach(function (pair) {
    html += '<option value="' + pair[0] + '"' + (String(value) === pair[0] ? " selected" : "") +
      ">" + pair[1] + "</option>";
  });
  return html + "</select></label>";
}

function renderSettings() {
  panelTitle.textContent = t("ui.settings");
  const badge = document.createElement("span");
  badge.className = "ver-badge";
  badge.textContent = APP_VERSION;
  badge.title = BUILD_DATE;
  badge.setAttribute("aria-hidden", "true");
  panelTitle.appendChild(badge);
  panelBody.innerHTML = "";

  const theme = document.createElement("section");
  theme.className = "group";
  theme.innerHTML = "<h3>" + t("set.theme") + '</h3><div class="segmented">' +
    '<button type="button" data-act="theme" data-value="light">' + t("set.light") + "</button>" +
    '<button type="button" data-act="theme" data-value="dark">' + t("set.dark") + "</button>" +
    '<button type="button" data-act="theme" data-value="auto">' + t("set.auto") + "</button></div>";
  panelBody.appendChild(theme);

  const lang = document.createElement("section");
  lang.className = "group";
  lang.innerHTML = "<h3>" + t("set.language") + "</h3>" +
    '<select class="selectblock" data-act="lang" aria-label="' + t("set.language") + '">' +
    '<option value="auto">' + t("set.langAuto") + "</option>" +
    LOCALES.map(function (code) {
      return '<option value="' + code + '"' +
        (state.settings.lang === code ? " selected" : "") + ">" + LOCALE_NAMES[code] + "</option>";
    }).join("") + "</select>";
  panelBody.appendChild(lang);

  const time = document.createElement("section");
  time.className = "group";
  time.innerHTML = "<h3>" + t("set.timeFormat") + "</h3>" +
    '<div class="segmented">' +
    '<button type="button" data-act="timeformat" data-value="auto">' + t("set.auto") + "</button>" +
    '<button type="button" data-act="timeformat" data-value="24">24h</button>' +
    '<button type="button" data-act="timeformat" data-value="12">12h</button></div>';
  panelBody.appendChild(time);

  const screen = document.createElement("section");
  screen.className = "group";
  screen.innerHTML = "<h3>" + t("set.screen") + "</h3>" +
    settingSelect("refresh", t("set.refresh"), state.settings.refreshMin,
      [["0", t("set.refreshOff")], ["15", t("set.min15")], ["30", t("set.min30")], ["60", t("set.hour")]]) +
    settingSelect("hide", t("set.hideDone"), state.settings.hideDoneMin,
      [["0", t("set.immediately")], ["5", t("set.min5")], ["10", t("set.min10")],
       ["20", t("set.min20")], ["30", t("set.min30")], ["60", t("set.min60")]]) +
    settingSelect("debt", t("set.debts"), state.settings.debtDays,
      [["0", t("set.debtsOff")], ["1", t("set.day1")], ["2", t("set.day2")],
       ["3", t("set.day3")], ["7", t("set.week")]]) +
    '<div class="setting"><span>' + t("set.wake") + "</span>" +
    '<button class="switch" type="button" data-act="wake" aria-pressed="' +
    (state.settings.keepAwake ? "true" : "false") + '">' +
    (state.settings.keepAwake ? t("ui.on") : t("ui.off")) + "</button></div>" +
    '<div class="row2">' +
    '<button class="btn btn-ghost" type="button" data-act="fullrefresh">' + t("set.refreshScreen") + "</button>" +
    '<button class="btn btn-ghost" type="button" data-act="fullscreen">' +
    (document.fullscreenElement ? t("set.exitFullscreen") : t("set.fullscreen")) + "</button>" +
    "</div>";
  panelBody.appendChild(screen);

  const data = document.createElement("section");
  data.className = "group";
  const shareable = canShareFiles();
  data.innerHTML = "<h3>" + t("set.data") + "</h3>" +
    (shareable ? '<button class="btn" type="button" data-act="share">' + t("set.share") + "</button>" : "") +
    '<button class="btn" type="button" data-act="export">' + t("set.export") + "</button>" +
    '<label class="btn filebtn">' + t("set.import") + '<input type="file" id="importFile" accept="application/json,.json"></label>' +
    '<button class="btn btn-ghost" type="button" data-act="demo">' +
    (hasDemoBackup() ? t("set.demoOff") : t("set.demoOn")) + "</button>" +
    '<button class="btn btn-danger" type="button" data-act="reset">' + t("set.reset") + "</button>";
  panelBody.appendChild(data);


  const offlineOk = "serviceWorker" in navigator && window.isSecureContext;
  const about = document.createElement("section");
  about.className = "group";
  about.innerHTML = "<h3>" + t("set.about") + "</h3>" +
    '<p class="note">' + t("set.aboutText", { version: APP_VERSION }) + "</p>" +
    '<p class="note"><b>' + t("set.origin", { origin: location.origin }) + "</b></p>" +
    '<p class="note">' + t(offlineOk ? "set.offlineOk" : "set.offlineBad") + "</p>" +
    '<p class="note">' + t("set.sync") + "</p>" +
    '<p class="note">' + t("set.supportNote") + "</p>" +
    '<p class="note"><a class="link" href="https://github.com/Danilka88/eink-planner" rel="noopener">' +
    t("set.support") + "</a></p>" +
    '<p class="note">' + t("set.install") + "</p>";
  panelBody.appendChild(about);

  const importFile = $("#importFile", panelBody);
  if (importFile) importFile.addEventListener("change", importData);

  $$("[data-act='theme']", panelBody).forEach(function (button) {
    button.setAttribute("aria-pressed", state.settings.theme === button.dataset.value ? "true" : "false");
  });
  $$("[data-act='timeformat']", panelBody).forEach(function (button) {
    button.setAttribute("aria-pressed", state.settings.timeFormat === button.dataset.value ? "true" : "false");
  });
}

/* ------------------------------------------------------------ редактор */

function openEditor(id, from, template) {
  toastEl.hidden = true;
  undoFn = null;
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

  const iconNames = {
    teeth: "icon.teeth", pill: "icon.pill", water: "icon.water", sun: "icon.sun",
    moon: "icon.moon", book: "icon.book", dumbbell: "icon.dumbbell", shower: "icon.shower",
    coffee: "icon.coffee", walk: "icon.walk", stretch: "icon.stretch", journal: "icon.journal",
    phone: "icon.phone", bed: "icon.bed", plant: "icon.plant", dishes: "icon.dishes",
    trash: "icon.trash", meditate: "icon.meditate", work: "icon.work", heart: "icon.heart",
    vitamin: "icon.vitamin", clock: "icon.clock"
  };

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

  Object.keys(iconNames).forEach(function (name) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "iconopt";
    button.dataset.icon = name;
    button.setAttribute("aria-pressed", name === selectedIcon ? "true" : "false");
    button.setAttribute("aria-label", t("ed.iconAria", { name: t(iconNames[name]) }));
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

/* ------------------------------------------------------------ данные */

function importData(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;
  file.text().then(function (text) {
    const parsed = JSON.parse(text);
    if (!parsed || !Array.isArray(parsed.items)) throw new Error("bad file");
    if (!window.confirm(t("set.reset") + "?")) return;
    state = normalize(parsed);
    persist();
    rerender();
    renderSettings();
    toast(t("toast.imported"));
  }).catch(function () {
    toast(t("toast.importFailed"), null, 5000);
  });
}

function exportData(silent) {
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

function canShareFiles() {
  if (typeof navigator.share !== "function" || typeof navigator.canShare !== "function") return false;
  try {
    const probe = new File(["{}"], "probe.json", { type: "application/json" });
    return navigator.canShare({ files: [probe] });
  } catch (error) {
    return false;
  }
}

/* Системное меню «Поделиться»: файл уходит в выбранный чат, например в Telegram.
   Если система не умеет — молча падаем на обычное скачивание. */
function shareData() {
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

function resetData(button) {
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

function purgeItem(id) {
  state.items = state.items.filter(function (entry) { return entry.id !== id; });
  Object.keys(state.log).forEach(function (key) { delete state.log[key][id]; });
  persist();
  renderPanel();
  rerender();
  toast(t("toast.deleted"));
}

function toggleDemo() {
  const backup = hasDemoBackup();
  if (backup) {
    try {
      localStorage.setItem(KEY, localStorage.getItem(BACKUP_KEY));
      localStorage.removeItem(BACKUP_KEY);
    } catch (error) {
      toast(t("toast.demoRestoreFailed"), null, 5000);
      return;
    }
    state = load(t);
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
  state = normalize(demoState(state.settings, t));
  persist();
  rerender();
  renderSettings();
  toast(t("toast.demoOn"), null, 8000);
}

/* ------------------------------------------------------------ экран */

function fullRefresh() {
  if (flashing) return;
  flashing = true;
  flash.hidden = false;
  flash.classList.remove("dark");
  window.setTimeout(function () { flash.classList.add("dark"); }, 130);
  window.setTimeout(function () { flash.classList.remove("dark"); }, 260);
  window.setTimeout(function () { flash.classList.add("dark"); }, 390);
  window.setTimeout(function () {
    flash.classList.remove("dark");
    flash.hidden = true;
    flashing = false;
    lastRefresh = Date.now();
  }, 520);
}

function maybeAutoRefresh() {
  const minutes = Number(state.settings.refreshMin) || 0;
  if (!minutes) return;
  if (Date.now() - lastRefresh >= minutes * 60000) fullRefresh();
}

function syncWakeLock() {
  if (!("wakeLock" in navigator)) return;
  if (state.settings.keepAwake && document.visibilityState === "visible") {
    if (!wakeLock || wakeLock.released) {
      navigator.wakeLock.request("screen").then(function (lock) {
        wakeLock = lock;
        lock.addEventListener("release", function () { wakeLock = null; });
      }).catch(function () { /* not available */ });
    }
  } else if (wakeLock) {
    wakeLock.release().catch(function () { /* ignore */ });
    wakeLock = null;
  }
}

function updateNet() {
  netChip.hidden = navigator.onLine !== false;
}

function tick() {
  const now = new Date();
  const minute = now.getMinutes();
  const key = dayKey(now);
  if (minute !== lastMinute || key !== lastDay) {
    lastMinute = minute;
    lastDay = key;
    updateClock(now);
    renderBoard();
    maybeAutoRefresh();
  }
}

/* --------------------------------------------------- полноэкранный режим */

function reopenPanelSafely() {
  if (!panel.open) return;
  suppressClose = true;
  panel.close();
  window.setTimeout(function () {
    suppressClose = false;
    if (ui.panel && !panel.open) panel.showModal();
  }, 0);
}

function setFullscreen(on) {
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
      suppressClose = true;
      panel.close();
      window.setTimeout(function () { suppressClose = false; }, 0);
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

/* ------------------------------------------------------------ события */

function bind() {
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
    suppressClick = false;
    window.clearTimeout(pressTimer);
    pressTimer = window.setTimeout(function () {
      suppressClick = true;
      handleLong(tile.dataset.id, tile.dataset.day, tile.dataset.state);
    }, 650);
  });

  ["pointerup", "pointercancel", "pointerleave"].forEach(function (name) {
    board.addEventListener(name, function () { window.clearTimeout(pressTimer); });
  });

  board.addEventListener("click", function (event) {
    const tile = event.target.closest(".tile");
    if (!tile) return;
    if (suppressClick) { suppressClick = false; return; }
    toggleEntry(tile.dataset.id, tile.dataset.day);
  });

  board.addEventListener("contextmenu", function (event) {
    if (event.target.closest(".tile")) event.preventDefault();
  });

  panel.addEventListener("click", function (event) {
    if (event.target.closest("[data-close]")) closePanel();
  });

  panel.addEventListener("close", function () {
    if (suppressClose) return;
    ui.panel = null;
    ui.editId = null;
    if (appShell && dock) appShell.insertBefore(toastEl, dock);
    else document.body.appendChild(toastEl);
    if (updatePending) window.setTimeout(whenSafeToReload, 0);
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
    lastSig = "";
    renderBoard();
  });

  function relayout() {
    lastSig = "";
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
      lastSig = "";
      renderBoard();
    });
  }

  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "visible") {
      updateClock(new Date());
      lastSig = "";
      renderBoard();
      syncWakeLock();
    }
  });

  const darkQuery = window.matchMedia("(prefers-color-scheme: dark)");
  if (darkQuery.addEventListener) {
    darkQuery.addEventListener("change", function () {
      if (state.settings.theme === "auto") {
        applyTheme();
        lastSig = "";
        renderBoard();
      }
    });
  }

  toastUndo.addEventListener("click", function () {
    if (!undoFn) return;
    const fn = undoFn;
    undoFn = null;
    toastEl.hidden = true;
    fn();
  });
}

/* --------------------------------------------------- автообновление

   Новая версия приезжает сама: service worker ставит свежий кэш, страница
   перезагружается в безопасный момент. Данные в localStorage, поэтому
   перезагрузка ничего не теряет — кроме недописанной формы, её и бережём. */

let updatePending = false;
let updateReloading = false;
let lastUpdateCheck = 0;

function reloadForUpdate() {
  if (!updatePending || updateReloading) return;
  updateReloading = true;
  window.location.reload();
}

/* Безопасный момент: страница скрыта (пользователь ушёл) или на экране
   нет открытой панели и висящего уведомления. */
function whenSafeToReload() {
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

/* Спрашиваем у service worker его кэш и сравниваем со своей версией. */
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
        updatePending = true;
        whenSafeToReload();
      }
    });
  });

  /* Пока приложение открыто — спрашиваем сервер раз в 6 часов. */
  window.setInterval(function () {
    lastUpdateCheck = Date.now();
    registration.update().catch(function () { /* offline */ });
  }, 6 * 60 * 60 * 1000);

  /* Вернулись к приложению после паузы — проверяем, но не чаще раза в час. */
  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState !== "visible") return;
    if (Date.now() - lastUpdateCheck < 60 * 60 * 1000) return;
    lastUpdateCheck = Date.now();
    registration.update().catch(function () { /* offline */ });
  });
}

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  if (!/^https?:$/.test(window.location.protocol)) return;

  /* Если страница уже была под управлением service worker, а контроллер
     сменился — значит активировалась новая версия. Это ловит и тот случай,
     когда обновление приехало прямо во время загрузки страницы. */
  const controlledAtBoot = Boolean(navigator.serviceWorker.controller);
  navigator.serviceWorker.addEventListener("controllerchange", function () {
    if (!controlledAtBoot || updateReloading) return;
    updatePending = true;
    whenSafeToReload();
  });

  navigator.serviceWorker.addEventListener("message", function (event) {
    const data = event.data || {};
    if (data.type !== "version" || !data.cache) return;
    if (data.cache === "ritual-shell-" + APP_VERSION) return;
    updatePending = true;
    whenSafeToReload();
  });

  navigator.serviceWorker.register("sw.js").then(function (registration) {
    /* Обновление могло установиться до того, как мы повесили слушатели. */
    if (registration.waiting && navigator.serviceWorker.controller) {
      updatePending = true;
      whenSafeToReload();
    }
    watchForUpdate(registration);
    askWorkerVersion();
  }).catch(function () { /* file:// or blocked */ });
}

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
