import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

/* Офлайн держится на одном списке: SHELL в sw.js. Если файл забыли вписать,
   приложение работает онлайн и ломается в самолёте — а это худший момент
   для обнаружения. Тест сверяет список с реальными импортами и разметкой. */

const root = fileURLToPath(new URL("..", import.meta.url));
const sw = readFileSync(join(root, "sw.js"), "utf8");
const shell = new Set(
  Array.from(sw.matchAll(/"\.\/([^"]+)"/g), function (match) { return match[1]; })
);

function importsOf(file, seen) {
  if (seen.has(file)) return seen;
  seen.add(file);
  const text = readFileSync(join(root, file), "utf8");
  for (const match of text.matchAll(/from\s+"(\.[^"]+)"/g)) {
    importsOf(normalize(join(dirname(file), match[1])), seen);
  }
  return seen;
}

test("все модули приложения перечислены в SHELL", function () {
  const files = Array.from(importsOf("js/app.js", new Set()));
  assert.ok(files.length > 5, "ожидались модули js/ui/*");
  files.forEach(function (file) {
    assert.ok(existsSync(join(root, file)), "импорт ведёт в пустоту: " + file);
    assert.ok(shell.has(file), "файла нет в SHELL (офлайн сломается): " + file);
  });
});

test("файлы оболочки из index.html перечислены в SHELL", function () {
  const html = readFileSync(join(root, "index.html"), "utf8");
  const refs = Array.from(html.matchAll(/(?:src|href)="([^"#:]+)"/g), function (m) { return m[1]; });
  const local = refs.filter(function (ref) {
    return /\.(js|css|webmanifest)$/.test(ref) && !ref.startsWith("http");
  });
  assert.ok(local.length >= 2, "в index.html не нашлось локальных ресурсов");
  local.forEach(function (ref) {
    const file = normalize(ref.replace(/^\.?\//, ""));
    assert.ok(shell.has(file), "index.html грузит файл вне SHELL: " + file);
  });
});

test("SHELL не ссылается на удалённые файлы", function () {
  Array.from(shell).forEach(function (file) {
    assert.ok(existsSync(join(root, file)), "SHELL указывает на удалённый файл: " + file);
  });
});
