import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { APP_VERSION } from "../js/core/version.js";

test("кэш service worker назван по версии приложения", function () {
  const sw = readFileSync(new URL("../sw.js", import.meta.url), "utf8");
  const found = sw.match(/const CACHE = "([^"]+)"/);
  assert.ok(found, "в sw.js нет строки const CACHE");
  assert.equal(
    found[1],
    "ritual-shell-" + APP_VERSION,
    "CACHE в sw.js должен быть ritual-shell-" + APP_VERSION +
      ", иначе страница не поймёт, что устарела"
  );
});

test("service worker отвечает на запрос версии", function () {
  const sw = readFileSync(new URL("../sw.js", import.meta.url), "utf8");
  assert.match(sw, /addEventListener\("message"/, "нет обработчика message");
  assert.match(sw, /type: "version"/, "нет ответа с версией кэша");
});
