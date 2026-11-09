/* Расписание — чистые функции. Никакого DOM и localStorage: именно поэтому
   их можно прогнать тестами (tests/schedule.test.js). */

export const DAY_START = 0;

export function pad2(n) {
  return String(n).padStart(2, "0");
}

export function clamp(n, lo, hi) {
  return Math.min(hi, Math.max(lo, n));
}

export function dayKey(date) {
  return date.getFullYear() + "-" + pad2(date.getMonth() + 1) + "-" + pad2(date.getDate());
}

export function logicalNow(now) {
  const d = new Date(now ? now.getTime() : Date.now());
  if (d.getHours() < DAY_START) d.setDate(d.getDate() - 1);
  return d;
}

export function todayKey(now) {
  return dayKey(logicalNow(now));
}

export function minutesOf(hmValue) {
  const parts = String(hmValue || "00:00").split(":");
  return Number(parts[0]) * 60 + Number(parts[1]);
}

export function validTime(value) {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(String(value || ""));
}

export function validDayKey(value) {
  const text = String(value || "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return false;
  const parts = text.split("-").map(Number);
  const date = new Date(parts[0], parts[1] - 1, parts[2], 12);
  return date.getFullYear() === parts[0] &&
    date.getMonth() === parts[1] - 1 &&
    date.getDate() === parts[2];
}

export function hm(date) {
  return pad2(date.getHours()) + ":" + pad2(date.getMinutes());
}

/* Окно привычки внутри календарного дня; переход через полночь учитывается. */
export function windowFor(item, key) {
  const base = new Date(key + "T00:00:00");
  const start = new Date(base.getTime());
  start.setMinutes(minutesOf(item.start));
  const end = new Date(base.getTime());
  end.setMinutes(minutesOf(item.end));
  if (minutesOf(item.end) <= minutesOf(item.start)) end.setDate(end.getDate() + 1);
  return { start: start, end: end };
}

/* Одно место решает, попадает ли привычка в конкретный день. */
export function isScheduled(item, key) {
  const date = new Date(key + "T12:00:00");
  if (item.repeat === "once") return key === item.date;
  if (item.repeat === "monthly") {
    const last = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    return date.getDate() === Math.min(Number(item.monthDay) || 1, last);
  }
  if (item.repeat === "weekly") {
    if (!item.days || item.days.length === 0 || item.days.length === 7) return true;
    return item.days.indexOf(date.getDay()) !== -1;
  }
  return true;
}

export function activeItems(state) {
  return state.items.filter(function (item) { return !item.archived && !item.deleted; });
}

export function entryOf(state, key, id) {
  return state.log[key] && state.log[key][id] ? state.log[key][id] : null;
}

export function computeEntries(state, now) {
  const today = todayKey(now);
  const entries = [];
  const hideMs = (Number(state.settings.hideDoneMin) || 0) * 60000;

  activeItems(state).forEach(function (item) {
    if (!isScheduled(item, today)) return;
    if (item.createdAt && dayKey(new Date(item.createdAt)) > today) return;
    const entry = entryOf(state, today, item.id);
    const bounds = windowFor(item, today);
    if (entry && entry.s === "skip") return;
    if (entry && entry.s === "done") {
      const at = new Date(entry.t);
      if (now.getTime() - at.getTime() < hideMs) {
        entries.push({ item: item, state: "done", day: today, at: entry.t });
      }
      return;
    }
    if (now.getTime() >= bounds.end.getTime()) {
      /* Просроченная плитка остаётся, пока её не отметят: keepOverdue = false
         это осознанный выбор «убирать по окончании окна». */
      if (item.keepOverdue === false) return;
      entries.push({ item: item, state: "missed", day: today });
    } else if (now.getTime() >= bounds.start.getTime()) {
      entries.push({ item: item, state: "pending", day: today });
    }
  });

  return entries.concat(computeDebts(state, today)).sort(compareEntries);
}

export function compareEntries(a, b) {
  const ad = a.state === "debt";
  const bd = b.state === "debt";
  if (ad !== bd) return ad ? 1 : -1;
  if (ad) return a.daysAgo - b.daysAgo;
  const as = minutesOf(a.item.start);
  const bs = minutesOf(b.item.start);
  if (as !== bs) return as - bs;
  return a.item.order - b.item.order;
}

/* Один долг на привычку — самый свежий пропущенный день. */
export function computeDebts(state, today) {
  const out = [];
  const todayDate = new Date(today + "T12:00:00");
  const debtDays = clamp(Number(state.settings.debtDays) || 0, 0, 14);
  if (!debtDays) return out;

  activeItems(state).forEach(function (item) {
    const todayEntry = entryOf(state, today, item.id);
    if (todayEntry && (todayEntry.s === "done" || todayEntry.s === "skip")) return;
    for (let back = 1; back <= debtDays; back += 1) {
      const past = new Date(todayDate.getTime());
      past.setDate(past.getDate() - back);
      const key = dayKey(past);
      if (!isScheduled(item, key)) continue;
      if (item.createdAt && dayKey(new Date(item.createdAt)) > key) continue;
      if (entryOf(state, key, item.id)) continue;
      out.push({ item: item, state: "debt", day: key, daysAgo: back });
      break;
    }
  });
  return out;
}

export function nextUpcoming(state, now) {
  const today = todayKey(now);
  let best = null;

  activeItems(state).forEach(function (item) {
    if (!isScheduled(item, today)) return;
    if (item.createdAt && dayKey(new Date(item.createdAt)) > today) return;
    const entry = entryOf(state, today, item.id);
    if (entry && (entry.s === "done" || entry.s === "skip")) return;
    const bounds = windowFor(item, today);
    if (bounds.start.getTime() > now.getTime()) {
      if (!best || bounds.start < best.at) best = { item: item, at: bounds.start, tomorrow: false };
    }
  });
  if (best) return best;

  const probe = new Date(today + "T12:00:00");
  for (let step = 1; step <= 31; step += 1) {
    probe.setDate(probe.getDate() + 1);
    const key = dayKey(probe);
    let found = null;
    activeItems(state).forEach(function (item) {
      if (!isScheduled(item, key)) return;
      const bounds = windowFor(item, key);
      if (!found || bounds.start < found.at) found = { item: item, at: bounds.start, tomorrow: step === 1 };
    });
    if (found) return found;
  }
  return null;
}

/* Строки истории за конкретный день. */
export function historyRowsFor(state, key, today, now) {
  const out = [];
  state.items.forEach(function (item) {
    if (item.deleted) return;
    if (!isScheduled(item, key)) return;
    if (item.createdAt && dayKey(new Date(item.createdAt)) > key) return;
    const entry = entryOf(state, key, item.id);
    if (!entry && item.archived) return;
    if (!entry && key === today) {
      const bounds = windowFor(item, key);
      if (now.getTime() < bounds.start.getTime()) return;
    }
    out.push({ item: item, entry: entry || null });
  });
  return out.sort(function (a, b) {
    const as = minutesOf(a.item.start);
    const bs = minutesOf(b.item.start);
    if (as !== bs) return as - bs;
    return a.item.order - b.item.order;
  });
}
