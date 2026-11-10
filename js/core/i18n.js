/* Локализация: 8 языков, RTL для арабского, формат времени 12/24.
   Словари — отдельные модули в ./dict/: fetch запрещён политикой CSP. */

import ru from "./dict/ru.js";
import en from "./dict/en.js";
import es from "./dict/es.js";
import pt from "./dict/pt.js";
import fr from "./dict/fr.js";
import zh from "./dict/zh.js";
import hi from "./dict/hi.js";
import ar from "./dict/ar.js";

const DICT = { ru, en, es, pt, fr, zh, hi, ar };

export const LOCALES = ["ru", "en", "es", "pt", "fr", "zh", "hi", "ar"];
export const RTL_LOCALES = ["ar"];
export const LOCALE_NAMES = {
  ru: "Русский",
  en: "English",
  es: "Español",
  pt: "Português",
  fr: "Français",
  zh: "中文",
  hi: "हिन्दी",
  ar: "العربية"
};

let current = "ru";
let pluralRules = null;
let hour12 = false;

export function dictionaryKeys(locale) {
  return Object.keys(DICT[locale] || DICT.ru).sort();
}

export function detectLocale() {
  if (typeof navigator === "undefined") return "ru";
  const list = (navigator.languages && navigator.languages.length)
    ? navigator.languages
    : [navigator.language || "ru"];
  for (let i = 0; i < list.length; i += 1) {
    const code = String(list[i] || "").slice(0, 2).toLowerCase();
    if (LOCALES.indexOf(code) !== -1) return code;
  }
  return "en";
}

/* "auto" — 12 часов для языков, где это принято, иначе 24. */
function defaultHour12(locale) {
  return locale === "en";
}

export function setLocale(code, timeFormat) {
  current = LOCALES.indexOf(code) !== -1 ? code : "ru";
  pluralRules = null;
  const mode = timeFormat || "auto";
  hour12 = mode === "12" ? true : mode === "24" ? false : defaultHour12(current);
  if (typeof document !== "undefined") {
    document.documentElement.lang = current;
    document.documentElement.dir = RTL_LOCALES.indexOf(current) !== -1 ? "rtl" : "ltr";
  }
  return current;
}

export function getLocale() {
  return current;
}

function rules() {
  if (!pluralRules) pluralRules = new Intl.PluralRules(current);
  return pluralRules;
}

export function t(key, vars) {
  const table = DICT[current] || DICT.ru;
  let value = table[key];
  if (value == null) value = DICT.ru[key];
  if (value == null) return key;
  if (typeof value === "object") {
    const form = vars && vars.n != null ? rules().select(Number(vars.n)) : "other";
    value = value[form] || value.other || value.many || Object.values(value)[0];
  }
  if (!vars) return value;
  return String(value).replace(/\{(\w+)\}/g, function (match, name) {
    return vars[name] != null ? String(vars[name]) : match;
  });
}

export function formatDate(date, options) {
  return new Intl.DateTimeFormat(current, options).format(date);
}

export function formatDay(date) {
  return formatDate(date, { day: "numeric", month: "long" });
}

export function formatWeekday(date) {
  return formatDate(date, { weekday: "short" });
}

export function formatDayFull(date) {
  return formatDate(date, { day: "numeric", month: "long", weekday: "short" });
}

export function formatTime(date) {
  return new Intl.DateTimeFormat(current, {
    hour: hour12 ? "numeric" : "2-digit",
    minute: "2-digit",
    hour12: hour12
  }).format(date);
}

/* "06:30" → "06:30" или "6:30 AM" в зависимости от языка и настройки. */
export function formatClock(value) {
  const parts = String(value || "00:00").split(":");
  const date = new Date(2000, 0, 1, Number(parts[0]) || 0, Number(parts[1]) || 0);
  return formatTime(date);
}

export function formatWindow(start, end) {
  return formatClock(start) + "–" + formatClock(end);
}

export function dayShortNames() {
  const out = [];
  const monday = new Date(2024, 0, 1);
  for (let i = 0; i < 7; i += 1) {
    const d = new Date(monday.getTime());
    d.setDate(monday.getDate() + i);
    out.push({ day: d.getDay(), short: formatWeekday(d) });
  }
  return out;
}
