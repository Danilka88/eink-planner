import test from "node:test";
import assert from "node:assert/strict";

import {
  detectLocale, dictionaryKeys, formatClock, formatWindow, LOCALES, RTL_LOCALES, setLocale, t
} from "../js/core/i18n.js";

test("русские склонения: 1 день, 2 дня, 5 дней", function () {
  setLocale("ru");
  assert.equal(t("tile.daysAgo", { n: 1 }), "1 день назад");
  assert.equal(t("tile.daysAgo", { n: 2 }), "2 дня назад");
  assert.equal(t("tile.daysAgo", { n: 5 }), "5 дней назад");
  assert.equal(t("tile.daysAgo", { n: 11 }), "11 дней назад");
  assert.equal(t("tile.daysAgo", { n: 21 }), "21 день назад");
});

test("английские склонения: 1 day, 2 days", function () {
  setLocale("en");
  assert.equal(t("tile.daysAgo", { n: 1 }), "1 day ago");
  assert.equal(t("tile.daysAgo", { n: 2 }), "2 days ago");
});

test("подстановка переменных", function () {
  setLocale("ru");
  assert.equal(t("tile.done", { time: "08:20" }), "отмечено 08:20");
  assert.equal(t("tile.overdue", { end: "09:30" }), "просрочено · до 09:30");
});

test("неизвестный ключ возвращается как есть", function () {
  assert.equal(t("no.such.key"), "no.such.key");
});

test("все языки содержат одинаковый набор ключей", function () {
  const base = dictionaryKeys("ru");
  assert.ok(base.length > 100, "словарь подозрительно маленький");
  LOCALES.forEach(function (code) {
    const keys = dictionaryKeys(code);
    const missing = base.filter(function (key) { return keys.indexOf(key) === -1; });
    const extra = keys.filter(function (key) { return base.indexOf(key) === -1; });
    assert.deepEqual(missing, [], code + ": ключи без перевода");
    assert.deepEqual(extra, [], code + ": лишние ключи");
  });
});

test("ни один язык не отдаёт сырой ключ вместо текста", function () {
  LOCALES.forEach(function (code) {
    setLocale(code);
    dictionaryKeys(code).forEach(function (key) {
      const value = t(key, { n: 2, time: "1", end: "2", date: "3", title: "4", origin: "5", version: "6", name: "7", day: "8", done: 1, total: 2, missed: 3 });
      assert.notEqual(value, key, code + ": пустой перевод " + key);
      assert.ok(String(value).trim().length > 0, code + ": пустая строка " + key);
      assert.ok(String(value).indexOf("{") === -1, code + ": незаполненная подстановка в " + key + " → " + value);
    });
  });
  setLocale("ru");
});

test("арабский переключает направление на RTL", function () {
  setLocale("ar");
  assert.ok(RTL_LOCALES.indexOf("ar") !== -1);
  setLocale("ru");
});

test("формат времени 24 и 12 часов", function () {
  setLocale("ru", "24");
  assert.equal(formatClock("06:30"), "06:30");
  setLocale("en", "12");
  assert.match(formatClock("06:30"), /6:30\s?AM/i);
  setLocale("en", "24");
  assert.equal(formatClock("06:30"), "06:30");
  setLocale("ru");
});

test("detectLocale не падает без navigator", function () {
  assert.equal(typeof detectLocale(), "string");
});

test("в арабском время изолировано от bidi-разворота", function () {
  setLocale("ar", "24");
  const window = formatWindow("07:00", "10:30");
  assert.equal(window, "\u206607:00\u201310:30\u2069");
  assert.ok(window.startsWith("\u2066"), "нет LRI");
  assert.ok(window.endsWith("\u2069"), "нет PDI");
  setLocale("ru", "24");
  assert.equal(formatWindow("07:00", "10:30"), "07:00–10:30");
});
