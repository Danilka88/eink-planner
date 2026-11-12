/* Оболочка документа: язык, тема и общий перерисов. Всё, что меняет
   страницу целиком, а не отдельный блок. */
import { detectLocale, setLocale, t } from "../core/i18n.js";
import { renderBoard, updateClock } from "./board.js";
import { $$, panel } from "./dom.js";
import { renderPanel } from "./panel.js";
import { runtime, state, ui } from "./store.js";

export function applyLanguage() {
  const lang = state.settings.lang === "auto" ? detectLocale() : state.settings.lang;
  setLocale(lang, state.settings.timeFormat);
  document.title = t("app.name") + " — " + t("app.tagline");
  const desc = document.querySelector('meta[name="description"]');
  if (desc) desc.setAttribute("content", t("app.description"));
  const heading = document.querySelector("h1.sr-only");
  if (heading) heading.textContent = t("app.name") + " — " + t("app.tagline");
  localize(document);
}

export function localize(root) {
  $$("[data-i18n]", root).forEach(function (node) {
    node.textContent = t(node.dataset.i18n);
  });
  $$("[data-i18n-aria]", root).forEach(function (node) {
    node.setAttribute("aria-label", t(node.dataset.i18nAria));
  });
}

export function applyTheme() {
  const choice = state.settings.theme;
  const dark = choice === "dark" || (choice === "auto" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.dataset.theme = dark ? "dark" : "light";
  document.body.dataset.eink = state.settings.eink ? "1" : "0";
  updateClock(new Date());
}

export function rerender() {
  runtime.lastSig = "";
  applyTheme();
  renderBoard();
  if (panel.open && ui.panel) renderPanel();
}
