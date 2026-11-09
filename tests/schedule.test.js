import test from "node:test";
import assert from "node:assert/strict";

import {
  computeDebts, computeEntries, dayKey, isScheduled, minutesOf,
  nextUpcoming, todayKey, validDayKey, validTime, windowFor
} from "../js/core/schedule.js";
import { normalize } from "../js/core/state.js";

function item(over) {
  return Object.assign({
    id: "a",
    title: "Тест",
    icon: "teeth",
    start: "07:00",
    end: "09:00",
    repeat: "daily",
    days: [0, 1, 2, 3, 4, 5, 6],
    monthDay: 1,
    date: "2026-11-10",
    keepOverdue: true,
    archived: false,
    deleted: false,
    order: 0,
    createdAt: "2026-01-01T00:00:00.000Z"
  }, over || {});
}

function state(items, settings, log) {
  return {
    version: 2,
    items: items,
    log: log || {},
    settings: Object.assign({ hideDoneMin: 20, debtDays: 0 }, settings || {}),
    meta: {}
  };
}

const at = function (iso) { return new Date(iso); };

test("валидация времени", function () {
  assert.equal(validTime("07:05"), true);
  assert.equal(validTime("7:05"), false);
  assert.equal(validTime("24:00"), false);
  assert.equal(validTime(""), false);
  assert.equal(validDayKey("2026-02-30"), false);
  assert.equal(validDayKey("2026-02-28"), true);
});

test("окно через полночь переезжает на следующий день", function () {
  const w = windowFor(item({ start: "22:00", end: "02:00" }), "2026-11-10");
  assert.equal(w.start.getDate(), 10);
  assert.equal(w.end.getDate(), 11);
  assert.equal(w.end.getHours(), 2);
});

test("повтор: каждый день, дни недели, разово", function () {
  assert.equal(isScheduled(item(), "2026-11-10"), true);

  const weekly = item({ repeat: "weekly", days: [1, 3] });
  assert.equal(isScheduled(weekly, "2026-11-09"), true, "понедельник");
  assert.equal(isScheduled(weekly, "2026-11-10"), false, "вторник");

  const once = item({ repeat: "once", date: "2026-11-12" });
  assert.equal(isScheduled(once, "2026-11-12"), true);
  assert.equal(isScheduled(once, "2026-11-13"), false);
});

test("каждое 31-е число срабатывает в коротком месяце в последний день", function () {
  const monthly = item({ repeat: "monthly", monthDay: 31 });
  assert.equal(isScheduled(monthly, "2026-02-28"), true, "февраль 2026 — 28 дней");
  assert.equal(isScheduled(monthly, "2026-02-27"), false);
  assert.equal(isScheduled(monthly, "2026-04-30"), true, "апрель — 30 дней");
  assert.equal(isScheduled(monthly, "2026-11-30"), true);
  assert.equal(isScheduled(monthly, "2026-11-29"), false);
});

test("просроченная привычка остаётся на доске, пока её не отметят", function () {
  const s = state([item()], { debtDays: 3 });
  const entries = computeEntries(s, at("2026-11-10T12:00:00"));
  const missed = entries.filter(function (e) { return e.state === "missed"; });
  assert.equal(missed.length, 1);
  assert.equal(missed[0].item.id, "a");
});

test("keepOverdue: false убирает плитку после окна", function () {
  const s = state([item({ keepOverdue: false })]);
  assert.equal(computeEntries(s, at("2026-11-10T12:00:00")).length, 0);
});

test("выполненное держится hideDoneMin и потом исчезает", function () {
  const s = state([item()], { hideDoneMin: 20 }, {
    "2026-11-10": { a: { s: "done", t: "2026-11-10T08:00:00" } }
  });
  assert.equal(computeEntries(s, at("2026-11-10T08:10:00")).length, 1);
  assert.equal(computeEntries(s, at("2026-11-10T08:30:00")).length, 0);
});

test("один долг на привычку — самый свежий пропуск", function () {
  const s = state([item()], { debtDays: 3 });
  const debts = computeDebts(s, "2026-11-10");
  assert.equal(debts.length, 1);
  assert.equal(debts[0].day, "2026-11-09");
  assert.equal(debts[0].daysAgo, 1);
});

test("долг не появляется, если сегодня уже отмечено", function () {
  const s = state([item()], { debtDays: 3 }, {
    "2026-11-10": { a: { s: "done", t: "2026-11-10T07:30:00.000Z" } }
  });
  assert.equal(computeDebts(s, "2026-11-10").length, 0);
});

test("долг ограничен настройкой debtDays", function () {
  const s = state([item()], { debtDays: 0 });
  assert.equal(computeDebts(s, "2026-11-10").length, 0);
});

test("следующая привычка находится на завтра", function () {
  const s = state([item({ start: "07:00", end: "09:00" })]);
  const next = nextUpcoming(s, at("2026-11-10T23:00:00"));
  assert.ok(next);
  assert.equal(next.tomorrow, true);
  assert.equal(dayKey(next.at), "2026-11-11");
});

test("миграция v1: повтор выводится из дней, keepOverdue включается", function () {
  const old = normalize({
    version: 1,
    items: [
      { id: "x", title: "Все дни", start: "07:00", end: "08:00", days: [0, 1, 2, 3, 4, 5, 6] },
      { id: "y", title: "Только пн", start: "07:00", end: "08:00", days: [1] }
    ],
    log: {},
    settings: {}
  });
  assert.equal(old.version, 2);
  assert.equal(old.items[0].repeat, "daily");
  assert.equal(old.items[1].repeat, "weekly");
  assert.deepEqual(old.items[1].days, [1]);
  assert.equal(old.items[0].keepOverdue, true);
  assert.equal(old.settings.lang, "auto");
});

test("минуты и сегодняшний ключ", function () {
  assert.equal(minutesOf("07:30"), 450);
  assert.match(todayKey(new Date("2026-11-10T12:00:00")), /^\d{4}-\d{2}-\d{2}$/);
});
