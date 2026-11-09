import test from "node:test";
import assert from "node:assert/strict";

import { detectLocale, dictionaryKeys, setLocale, t } from "../js/core/i18n.js";

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

test("оба словаря содержат одинаковый набор ключей", function () {
  const ruKeys = dictionaryKeys("ru");
  const enKeys = dictionaryKeys("en");
  const missingInEn = ruKeys.filter(function (key) { return enKeys.indexOf(key) === -1; });
  const missingInRu = enKeys.filter(function (key) { return ruKeys.indexOf(key) === -1; });
  assert.deepEqual(missingInEn, [], "ключи без английского перевода");
  assert.deepEqual(missingInRu, [], "ключи без русского перевода");
  assert.ok(ruKeys.length > 100, "словарь подозрительно маленький");
});

test("detectLocale не падает без navigator", function () {
  assert.equal(typeof detectLocale(), "string");
});
