/* Тема до первой отрисовки: без этого на e-ink видна вспышка светлой палитры. */
(function () {
  "use strict";
  try {
    var raw = localStorage.getItem("ritual.v1");
    var saved = raw ? JSON.parse(raw) : null;
    var choice = saved && saved.settings && saved.settings.theme ? saved.settings.theme : "auto";
    var dark = choice === "dark" || (choice === "auto" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.dataset.theme = dark ? "dark" : "light";
  } catch (error) {
    /* первый запуск или заблокированное хранилище: светлая тема безопасна */
  }
}());
