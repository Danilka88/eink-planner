/* Вкладка настроек: тема, язык, формат времени, поведение экрана, данные
   и сведения о версии. */
import { LOCALES, LOCALE_NAMES, t } from "../core/i18n.js";
import { hasDemoBackup } from "../core/state.js";
import { APP_VERSION, BUILD_DATE } from "../core/version.js";
import { canShareFiles } from "./data.js";
import { $$, panelBody, panelTitle } from "./dom.js";
import { state } from "./store.js";

function settingSelect(act, label, value, options) {
  let html = '<label class="setting"><span>' + label + "</span><select data-act=\"" + act + "\">";
  options.forEach(function (pair) {
    html += '<option value="' + pair[0] + '"' + (String(value) === pair[0] ? " selected" : "") +
      ">" + pair[1] + "</option>";
  });
  return html + "</select></label>";
}

export function renderSettings() {
  panelTitle.textContent = t("ui.settings");
  const badge = document.createElement("span");
  badge.className = "ver-badge";
  badge.textContent = APP_VERSION;
  badge.title = BUILD_DATE;
  badge.setAttribute("aria-hidden", "true");
  panelTitle.appendChild(badge);
  panelBody.innerHTML = "";

  const theme = document.createElement("section");
  theme.className = "group";
  theme.innerHTML = "<h3>" + t("set.theme") + '</h3><div class="segmented">' +
    '<button type="button" data-act="theme" data-value="light">' + t("set.light") + "</button>" +
    '<button type="button" data-act="theme" data-value="dark">' + t("set.dark") + "</button>" +
    '<button type="button" data-act="theme" data-value="auto">' + t("set.auto") + "</button></div>";
  panelBody.appendChild(theme);

  const lang = document.createElement("section");
  lang.className = "group";
  lang.innerHTML = "<h3>" + t("set.language") + "</h3>" +
    '<select class="selectblock" data-act="lang" aria-label="' + t("set.language") + '">' +
    '<option value="auto">' + t("set.langAuto") + "</option>" +
    LOCALES.map(function (code) {
      return '<option value="' + code + '"' +
        (state.settings.lang === code ? " selected" : "") + ">" + LOCALE_NAMES[code] + "</option>";
    }).join("") + "</select>";
  panelBody.appendChild(lang);

  const time = document.createElement("section");
  time.className = "group";
  time.innerHTML = "<h3>" + t("set.timeFormat") + "</h3>" +
    '<div class="segmented">' +
    '<button type="button" data-act="timeformat" data-value="auto">' + t("set.auto") + "</button>" +
    '<button type="button" data-act="timeformat" data-value="24">24h</button>' +
    '<button type="button" data-act="timeformat" data-value="12">12h</button></div>';
  panelBody.appendChild(time);

  const screen = document.createElement("section");
  screen.className = "group";
  screen.innerHTML = "<h3>" + t("set.screen") + "</h3>" +
    settingSelect("refresh", t("set.refresh"), state.settings.refreshMin,
      [["0", t("set.refreshOff")], ["15", t("set.min15")], ["30", t("set.min30")], ["60", t("set.hour")]]) +
    settingSelect("hide", t("set.hideDone"), state.settings.hideDoneMin,
      [["0", t("set.immediately")], ["5", t("set.min5")], ["10", t("set.min10")],
       ["20", t("set.min20")], ["30", t("set.min30")], ["60", t("set.min60")]]) +
    settingSelect("debt", t("set.debts"), state.settings.debtDays,
      [["0", t("set.debtsOff")], ["1", t("set.day1")], ["2", t("set.day2")],
       ["3", t("set.day3")], ["7", t("set.week")]]) +
    '<div class="setting"><span>' + t("set.wake") + "</span>" +
    '<button class="switch" type="button" data-act="wake" aria-pressed="' +
    (state.settings.keepAwake ? "true" : "false") + '">' +
    (state.settings.keepAwake ? t("ui.on") : t("ui.off")) + "</button></div>" +
    '<div class="row2">' +
    '<button class="btn btn-ghost" type="button" data-act="fullrefresh">' + t("set.refreshScreen") + "</button>" +
    '<button class="btn btn-ghost" type="button" data-act="fullscreen">' +
    (document.fullscreenElement ? t("set.exitFullscreen") : t("set.fullscreen")) + "</button>" +
    "</div>";
  panelBody.appendChild(screen);

  const data = document.createElement("section");
  data.className = "group";
  const shareable = canShareFiles();
  data.innerHTML = "<h3>" + t("set.data") + "</h3>" +
    (shareable ? '<button class="btn" type="button" data-act="share">' + t("set.share") + "</button>" : "") +
    '<button class="btn" type="button" data-act="export">' + t("set.export") + "</button>" +
    '<label class="btn filebtn">' + t("set.import") + '<input type="file" id="importFile" accept="application/json,.json"></label>' +
    '<button class="btn btn-ghost" type="button" data-act="demo">' +
    (hasDemoBackup() ? t("set.demoOff") : t("set.demoOn")) + "</button>" +
    '<button class="btn btn-danger" type="button" data-act="reset">' + t("set.reset") + "</button>";
  panelBody.appendChild(data);


  const offlineOk = "serviceWorker" in navigator && window.isSecureContext;
  const about = document.createElement("section");
  about.className = "group";
  about.innerHTML = "<h3>" + t("set.about") + "</h3>" +
    '<p class="note">' + t("set.aboutText", { version: APP_VERSION }) + "</p>" +
    '<p class="note"><b>' + t("set.origin", { origin: location.origin }) + "</b></p>" +
    '<p class="note">' + t(offlineOk ? "set.offlineOk" : "set.offlineBad") + "</p>" +
    '<p class="note">' + t("set.sync") + "</p>" +
    '<p class="note">' + t("set.supportNote") + "</p>" +
    '<p class="note"><a class="link" href="https://github.com/Danilka88/eink-planner" rel="noopener">' +
    t("set.support") + "</a></p>" +
    '<p class="note">' + t("set.install") + "</p>";
  panelBody.appendChild(about);

  $$("[data-act='theme']", panelBody).forEach(function (button) {
    button.setAttribute("aria-pressed", state.settings.theme === button.dataset.value ? "true" : "false");
  });
  $$("[data-act='timeformat']", panelBody).forEach(function (button) {
    button.setAttribute("aria-pressed", state.settings.timeFormat === button.dataset.value ? "true" : "false");
  });
}
