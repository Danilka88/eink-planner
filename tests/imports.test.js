import test from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

/* Браузер ловит опечатку в named-импорте только при загрузке страницы.
   Здесь та же проверка, но детерминированно: имя из `import { ... }`
   обязано быть объявлено в целевом модуле. */

const root = fileURLToPath(new URL("..", import.meta.url));

function walk(dir, out) {
  readdirSync(dir).forEach(function (name) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) walk(path, out);
    else if (name.endsWith(".js")) out.push(path);
  });
  return out;
}

function exportsOf(file) {
  const text = readFileSync(file, "utf8");
  const names = new Set();
  const patterns = [
    /^export\s+(?:async\s+)?function\s+([A-Za-z_$][\w$]*)/gm,
    /^export\s+(?:const|let|var|class)\s+([A-Za-z_$][\w$]*)/gm
  ];
  patterns.forEach(function (re) {
    for (const match of text.matchAll(re)) names.add(match[1]);
  });
  for (const match of text.matchAll(/^export\s*\{([^}]*)\}/gm)) {
    match[1].split(",").forEach(function (part) {
      const name = part.trim().split(/\s+as\s+/).pop();
      if (name) names.add(name);
    });
  }
  return names;
}

test("все named-импорты существуют в целевых модулях", function () {
  const files = walk(join(root, "js"), []);
  const problems = [];
  files.forEach(function (file) {
    const text = readFileSync(file, "utf8");
    for (const match of text.matchAll(/import\s*\{([^}]*)\}\s*from\s*"(\.[^"]+)"/g)) {
      const target = normalize(join(dirname(file), match[2]));
      const available = exportsOf(target);
      match[1].split(",").forEach(function (part) {
        const name = part.trim().split(/\s+as\s+/)[0];
        if (name && !available.has(name)) {
          problems.push(file.replace(root, "") + ": нет экспорта " + name + " в " + match[2]);
        }
      });
    }
  });
  assert.deepEqual(problems, [], "импорты, которых нет:\n" + problems.join("\n"));
});

test("у каждого модуля js/ui есть хотя бы один потребитель", function () {
  const files = walk(join(root, "js"), []);
  const imported = new Set();
  files.forEach(function (file) {
    const text = readFileSync(file, "utf8");
    for (const match of text.matchAll(/from\s*"(\.[^"]+)"/g)) {
      imported.add(normalize(join(dirname(file), match[1])));
    }
  });
  const orphans = files.filter(function (file) {
    return file.includes("/js/ui/") && !imported.has(file);
  });
  assert.deepEqual(orphans, [], "модули без потребителей: " + orphans.join(", "));
});
