import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { APP_VERSION, BUILD_DATE } from "../js/core/version.js";

test("версия в формате MAJOR.MINOR.PATCH", function () {
  assert.match(APP_VERSION, /^\d+\.\d+\.\d+$/, "ожидается три числа: " + APP_VERSION);
});

test("версия совпадает с package.json", function () {
  const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
  assert.equal(APP_VERSION, pkg.version, "version.js и package.json разошлись");
});

test("дата сборки в формате ISO", function () {
  assert.match(BUILD_DATE, /^\d{4}-\d{2}-\d{2}$/);
  assert.ok(!isNaN(new Date(BUILD_DATE + "T12:00:00").getTime()));
});
