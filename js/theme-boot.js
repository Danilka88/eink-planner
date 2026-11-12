/* Тема до первой отрисовки: без этого на e-ink видна вспышка светлой палитры. */
(function () {
  "use strict";
  try {
    const raw = localStorage.getItem("ritual.v1");
    const saved = raw ? JSON.parse(raw) : null;
    const choice = saved && saved.settings && saved.settings.theme ? saved.settings.theme : "auto";
    const dark = choice === "dark" || (choice === "auto" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.dataset.theme = dark ? "dark" : "light";
  } catch (error) {
    /* первый запуск или заблокированное хранилище: светлая тема безопасна */
  }
}());
