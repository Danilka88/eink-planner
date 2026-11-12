/* Доска дня: плитки, прогресс, пустое состояние и часы. Только чтение
   состояния и запись в DOM — никаких сохранений и панелей. */
import { formatClock, formatDay, formatTime, formatWeekday, formatWindow, getLocale, t } from "../core/i18n.js";
import { iconSvg } from "../core/icons.js";
import { activeItems, computeEntries, entryOf, isScheduled, nextUpcoming, todayKey } from "../core/schedule.js";
import { $, $$, MAX_TILES, board, clockEl, dateEl, empty, emptyAction, emptyKicker, emptyNext, emptyTitle, progressText, progressWrap, segments, tplTile, weekdayEl } from "./dom.js";
import { runtime, state } from "./store.js";

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

export function renderBoard() {
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

  if (sig !== runtime.lastSig) {
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
    runtime.lastSig = sig;
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

export function updateClock(now) {
  clockEl.textContent = formatTime(now);
  dateEl.textContent = formatDay(now);
  weekdayEl.textContent = formatWeekday(now);
  const dark = document.documentElement.dataset.theme === "dark";
  const color = dark ? "#121212" : "#ffffff";
  $$("meta[name='theme-color']").forEach(function (meta) {
    meta.setAttribute("content", color);
  });
}
