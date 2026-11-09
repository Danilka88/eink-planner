/* Модель и хранилище. localStorage — единственное место, где живут данные. */

import { clamp, dayKey, todayKey, validDayKey, validTime } from "./schedule.js";

export const KEY = "ritual.v1";
export const BACKUP_KEY = "ritual.backup";
export const VERSION = 2;
export const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];
export const REPEATS = ["daily", "weekly", "monthly", "once"];
export const HABIT_ICONS = ["teeth", "pill", "water", "sun", "moon", "book", "dumbbell",
  "shower", "coffee", "walk", "stretch", "journal", "phone", "bed",
  "plant", "dishes", "trash", "meditate", "work", "heart", "vitamin", "clock"];

export const DEFAULT_SETTINGS = {
  theme: "auto",
  eink: true,
  hideDoneMin: 20,
  debtDays: 3,
  refreshMin: 30,
  keepAwake: false,
  lang: "auto"
};

export function uid() {
  return "itm_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function baseItem(raw) {
  return {
    id: typeof raw.id === "string" && raw.id ? raw.id : uid(),
    title: String(raw.title || "").trim().slice(0, 40),
    icon: HABIT_ICONS.indexOf(raw.icon) !== -1 ? raw.icon : "teeth",
    start: validTime(raw.start) ? raw.start : "07:00",
    end: validTime(raw.end) ? raw.end : "10:00",
    keepOverdue: raw.keepOverdue !== false,
    archived: Boolean(raw.archived),
    deleted: Boolean(raw.deleted),
    order: Number.isFinite(raw.order) ? raw.order : 0,
    createdAt: typeof raw.createdAt === "string" ? raw.createdAt : new Date().toISOString()
  };
}

export function normalizeItem(raw) {
  if (!raw || typeof raw !== "object") return null;
  const item = baseItem(raw);
  if (!item.title) return null;

  let days = Array.isArray(raw.days)
    ? raw.days.map(Number).filter(function (d) { return d >= 0 && d <= 6; })
    : [];
  days = Array.from(new Set(days));

  let repeat = REPEATS.indexOf(raw.repeat) !== -1 ? raw.repeat : null;
  if (!repeat) repeat = days.length === 0 || days.length === 7 ? "daily" : "weekly";
  if (repeat === "weekly" && !days.length) days = ALL_DAYS.slice();

  item.repeat = repeat;
  item.days = days;
  item.monthDay = clamp(Number(raw.monthDay) || 1, 1, 31);
  item.date = validDayKey(raw.date) ? raw.date : dayKey(new Date());
  return item;
}

export function normalize(data) {
  const items = Array.isArray(data && data.items)
    ? data.items.map(normalizeItem).filter(Boolean)
    : [];

  const log = {};
  if (data && data.log && typeof data.log === "object") {
    Object.keys(data.log).forEach(function (key) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) return;
      const day = data.log[key];
      if (!day || typeof day !== "object") return;
      const clean = {};
      Object.keys(day).forEach(function (id) {
        const entry = day[id];
        if (!entry || (entry.s !== "done" && entry.s !== "skip")) return;
        clean[id] = {
          s: entry.s,
          t: typeof entry.t === "string" ? entry.t : new Date().toISOString()
        };
        if (entry.late) clean[id].late = true;
      });
      if (Object.keys(clean).length) log[key] = clean;
    });
  }

  const settings = Object.assign({}, DEFAULT_SETTINGS, data && data.settings ? data.settings : {});
  settings.theme = ["auto", "light", "dark"].indexOf(settings.theme) !== -1 ? settings.theme : "auto";
  settings.lang = ["auto", "ru", "en"].indexOf(settings.lang) !== -1 ? settings.lang : "auto";
  settings.hideDoneMin = clamp(Number.isFinite(Number(settings.hideDoneMin)) ? Number(settings.hideDoneMin) : 20, 0, 240);
  settings.debtDays = clamp(Number.isFinite(Number(settings.debtDays)) ? Number(settings.debtDays) : 3, 0, 14);
  settings.refreshMin = clamp(Number.isFinite(Number(settings.refreshMin)) ? Number(settings.refreshMin) : 30, 0, 240);
  settings.eink = settings.eink !== false;
  settings.keepAwake = Boolean(settings.keepAwake);

  return {
    version: VERSION,
    items: items,
    log: log,
    settings: settings,
    meta: Object.assign({ createdAt: new Date().toISOString() }, data && data.meta ? data.meta : {})
  };
}

export function seedState(t) {
  const created = new Date().toISOString();
  const today = dayKey(new Date());
  const seeds = [
    { id: "itm_teeth_am", key: "seed.teethAm", icon: "teeth", start: "06:30", end: "09:30" },
    { id: "itm_vit", key: "seed.vitamins", icon: "pill", start: "07:00", end: "10:30" },
    { id: "itm_water", key: "seed.water", icon: "water", start: "07:00", end: "11:00" },
    { id: "itm_stretch", key: "seed.stretch", icon: "stretch", start: "08:00", end: "12:00" },
    { id: "itm_teeth_pm", key: "seed.teethPm", icon: "teeth", start: "21:00", end: "23:59" },
    { id: "itm_journal", key: "seed.journal", icon: "journal", start: "21:30", end: "23:59" }
  ];

  const items = seeds.map(function (seed, index) {
    return {
      id: seed.id,
      title: t(seed.key),
      icon: seed.icon,
      start: seed.start,
      end: seed.end,
      repeat: "daily",
      days: ALL_DAYS.slice(),
      monthDay: 1,
      date: today,
      keepOverdue: true,
      archived: false,
      deleted: false,
      order: index,
      createdAt: created
    };
  });

  return {
    version: VERSION,
    items: items,
    log: {},
    settings: Object.assign({}, DEFAULT_SETTINGS),
    meta: { createdAt: created, firstRun: true, seeded: true }
  };
}

/* Демо: семь привычек с окнами относительно текущего времени,
   чтобы сетка была видна в любой час. */
export function demoState(settings, t) {
  const now = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const today = dayKey(now);
  const created = now.toISOString();
  const seeds = [
    { key: "demo.teethAm", icon: "teeth" },
    { key: "demo.vitamins", icon: "pill" },
    { key: "demo.water", icon: "water" },
    { key: "demo.stretch", icon: "stretch" },
    { key: "demo.shower", icon: "shower" },
    { key: "demo.journal", icon: "journal" },
    { key: "demo.teethPm", icon: "teeth" }
  ];

  const items = seeds.map(function (seed, index) {
    const startMin = clamp(nowMin - 90 + index * 12, 0, 23 * 60 + 45);
    return {
      id: "demo_" + index,
      title: t(seed.key),
      icon: seed.icon,
      start: String(Math.floor(startMin / 60)).padStart(2, "0") + ":" + String(startMin % 60).padStart(2, "0"),
      end: "23:59",
      repeat: "daily",
      days: ALL_DAYS.slice(),
      monthDay: 1,
      date: today,
      keepOverdue: true,
      archived: false,
      deleted: false,
      order: index,
      createdAt: created
    };
  });

  const log = {};
  log[today] = {
    demo_0: { s: "done", t: new Date(now.getTime() - 6 * 60000).toISOString() },
    demo_1: { s: "done", t: new Date(now.getTime() - 2 * 60000).toISOString() }
  };

  return {
    version: VERSION,
    items: items,
    log: log,
    settings: Object.assign({}, settings),
    meta: { createdAt: created, demo: true }
  };
}

export function load(t) {
  let raw = null;
  try { raw = localStorage.getItem(KEY); } catch (error) { raw = null; }

  if (!raw) {
    const fresh = seedState(t);
    try { localStorage.setItem(KEY, JSON.stringify(fresh)); } catch (error) { /* storage blocked */ }
    return fresh;
  }

  try {
    const parsed = JSON.parse(raw);
    const normalized = normalize(parsed);
    if (!parsed || parsed.version !== VERSION) {
      try { localStorage.setItem(KEY, JSON.stringify(normalized)); } catch (error) { /* blocked */ }
    }
    return normalized;
  } catch (error) {
    return seedState(t);
  }
}

export function save(state, onError) {
  state.meta.updatedAt = new Date().toISOString();
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
    return true;
  } catch (error) {
    if (typeof onError === "function") onError();
    return false;
  }
}

export function pruneLog(state) {
  const keys = Object.keys(state.log);
  if (keys.length < 420) return;
  keys.sort();
  keys.slice(0, keys.length - 400).forEach(function (key) { delete state.log[key]; });
}

export function setEntry(state, key, id, value) {
  if (!state.log[key]) state.log[key] = {};
  if (value) state.log[key][id] = value;
  else delete state.log[key][id];
  if (Object.keys(state.log[key]).length === 0) delete state.log[key];
}

export function findItem(state, id) {
  return state.items.filter(function (item) { return item.id === id; })[0] || null;
}

export function hasDemoBackup() {
  try { return Boolean(localStorage.getItem(BACKUP_KEY)); } catch (error) { return false; }
}

export function exportPayload(state) {
  return JSON.stringify(state, null, 2);
}

export function exportName(now) {
  return "ritual-" + (now ? dayKey(now) : todayKey()) + ".json";
}
