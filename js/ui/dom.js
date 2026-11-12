/* Ссылки на элементы разметки. Ищутся один раз при загрузке модуля:
   шаблоны <template> в index.html не пересоздаются, поэтому ссылки живут
   до перезагрузки страницы. */

export const $ = function (sel, root) { return (root || document).querySelector(sel); };
export const $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

export const board = $("#board");
export const empty = $("#empty");
export const emptyKicker = $("#emptyKicker");
export const emptyTitle = $("#emptyTitle");
export const emptyNext = $("#emptyNext");
export const emptyAction = $("[data-action='all']", empty);
export const panel = $("#panel");
export const panelTitle = $("#panelTitle");
export const panelBody = $("#panelBody");
export const toastEl = $("#toast");
export const toastText = $("#toastText");
export const toastUndo = $("#toastUndo");
export const flash = $("#flash");
export const netChip = $("#netChip");
export const clockEl = $("#clock");
export const dateEl = $("#date");
export const weekdayEl = $("#weekday");
export const progressWrap = $("#progressWrap");
export const progressText = $("#progressText");
export const segments = $("#segments");
export const tplTile = $("#tpl-tile");
export const tplEditor = $("#tpl-editor");
export const appShell = $(".app");
export const dock = $(".dock");

export const MAX_TILES = 9;
