/* Локализация. Словари — обычные модули: fetch запрещён политикой CSP,
   поэтому JSON-файлы тут не подходят. Даты и склонения — через Intl. */

const DICT = {
  ru: {
    "app.name": "Ритуал",
    "app.tagline": "план привычек на день",
    "app.description": "Локальный офлайн-планер привычек для e-ink планшета: крупная сетка, отметки одним касанием, просрочки видны, данные не покидают устройство.",

    "ui.habits": "Привычки",
    "ui.history": "История",
    "ui.archive": "Архив",
    "ui.settings": "Настройки",
    "ui.close": "Закрыть",
    "ui.cancel": "Отмена",
    "ui.save": "Сохранить",
    "ui.add": "Добавить",
    "ui.addHabit": "Добавить привычку",
    "ui.all": "Все",
    "ui.refresh": "Обновить",
    "ui.on": "вкл",
    "ui.off": "выкл",
    "ui.undo": "Отменить",
    "ui.restore": "вернуть",

    "board.now": "Сейчас",
    "board.done": "Готово",
    "board.empty": "Пока пусто",
    "board.free": "Свободно",
    "board.allDone": "Всё отмечено",
    "board.addFirst": "Добавьте первую привычку",
    "board.addFirstHint": "Одно касание — и день идёт по плану.",
    "board.nextToday": "Дальше: {title} — сегодня в {time}.",
    "board.nextTomorrow": "Дальше: {title} — завтра в {time}.",
    "board.nothingLeft": "На сегодня больше ничего.",
    "board.progress": "Выполнено {done} из {total}",
    "board.progressMissed": ", просрочено {missed}",
    "board.more": "ещё",

    "tile.done": "отмечено {time}",
    "tile.overdue": "просрочено · до {end}",
    "tile.debtYesterday": "вчера · пропущено",
    "tile.yesterday": "вчера",
    "tile.daysAgo": { one: "{n} день назад", few: "{n} дня назад", many: "{n} дней назад", other: "{n} дня назад" },
    "tile.ariaMark": "отметить",
    "tile.ariaOverdue": "просрочено, нажмите, чтобы отметить",
    "tile.ariaDebt": "долг за прошлый день, нажмите, чтобы отметить",
    "tile.ariaDone": "выполнено",

    "group.debts": "Долги",
    "group.morning": "Утро",
    "group.day": "День",
    "group.evening": "Вечер",

    "hist.done": "выполнено {time}",
    "hist.doneLate": "выполнено {time} · задним числом",
    "hist.skipped": "пропущено",
    "hist.none": "не отмечено",
    "hist.today": "Сегодня, {date}",
    "hist.yesterday": "Вчера, {date}",
    "hist.empty": "Записей пока нет. Отмечайте привычки — здесь появится история.",
    "hist.more": "Показать ещё 7 дней",
    "hist.remove": "снять",
    "hist.mark": "отметить",
    "hist.skip": "пропустить",
    "hist.return": "вернуть",

    "arch.heading": "Выключено",
    "arch.empty": "Архив пуст. Сюда попадают выключенные привычки: история и отметки сохраняются.",
    "arch.note": "«Вернуть» — привычка снова появляется на экране со всей историей. «Корзина» — удалить окончательно вместе с отметками.",
    "arch.purge": "Удалить навсегда",

    "habits.empty": "Активных привычек нет. Добавьте первую — она появится в нужное время.",
    "habits.hint": "Долгое нажатие на плитку открывает редактор. Долгое нажатие на просроченную — «пропустить».",
    "habits.debtDone": "готово",
    "habits.copy": "Копировать: {title}",
    "habits.edit": "Изменить: {title}",
    "habits.debtDoneAria": "Отметить задним числом: {title}",
    "habits.debtSkipAria": "Пропустить: {title}",

    "set.theme": "Тема",
    "set.light": "Светлая",
    "set.dark": "Тёмная",
    "set.auto": "Авто",
    "set.screen": "Экран",
    "set.language": "Язык",
    "set.langAuto": "Авто",
    "set.refresh": "Полное обновление",
    "set.refreshOff": "выключено",
    "set.min15": "каждые 15 мин",
    "set.min30": "каждые 30 мин",
    "set.hour": "каждый час",
    "set.hideDone": "Скрывать выполненные",
    "set.immediately": "сразу",
    "set.min5": "через 5 мин",
    "set.min10": "через 10 мин",
    "set.min20": "через 20 мин",
    "set.min60": "через час",
    "set.debts": "Долги за прошлые дни",
    "set.debtsOff": "не показывать",
    "set.day1": "1 день",
    "set.day2": "2 дня",
    "set.day3": "3 дня",
    "set.week": "неделю",
    "set.wake": "Не гасить экран",
    "set.data": "Данные",
    "set.demoOn": "Демо-сетка: 7 привычек",
    "set.demoOff": "Вернуть мои данные",
    "set.export": "Экспорт в файл",
    "set.import": "Импорт из файла",
    "set.reset": "Сбросить всё",
    "set.resetConfirm": "Точно сбросить всё?",
    "set.refreshScreen": "Обновить экран полностью",
    "set.fullscreen": "На весь экран",
    "set.exitFullscreen": "Выйти из полного экрана",
    "set.about": "О приложении",
    "set.aboutText": "Версия {version}. Всё работает локально: данные лежат в памяти браузера этого планшета. Интернет не нужен. Делайте экспорт перед очисткой браузера.",
    "set.origin": "Адрес данных: {origin}",
    "set.offlineOk": "Офлайн-режим: работает — страница открывается без сети.",
    "set.offlineBad": "Офлайн-режим: недоступен. Браузер включает офлайн-кэш только на https или localhost, а страница открыта по обычному http с адреса в сети.",
    "set.sync": "Синхронизации нет: у каждого браузера и каждого адреса своя копия. Перенос — только экспорт и импорт JSON.",
    "set.install": "Установка: меню браузера → «Добавить на главный экран».",
    "set.hint": "Долгое нажатие на плитку — редактор. Долгое нажатие на просроченную — «пропустить».",
    "set.support": "Поддержка и исходный код",
    "set.supportNote": "Напоминаний в фоне нет: привычка появляется на экране в своё окно времени. Так работает офлайн-приложение без сети и без уведомлений.",

    "ed.new": "Новая привычка",
    "ed.edit": "Изменить привычку",
    "ed.name": "Название",
    "ed.icon": "Иконка",
    "ed.appears": "Появляется",
    "ed.hides": "Скрывается",
    "ed.repeat": "Повтор",
    "ed.daily": "Каждый день",
    "ed.weekly": "По дням",
    "ed.monthly": "Каждое число",
    "ed.once": "Разово",
    "ed.days": "Дни недели",
    "ed.monthDay": "Число месяца",
    "ed.date": "Дата",
    "ed.keep": "Не убирать с экрана, пока не выполнено",
    "ed.duplicate": "Дублировать",
    "ed.toArchive": "В архив",
    "ed.confirmArchive": "Точно в архив?",
    "ed.errName": "Введите название",
    "ed.errTime": "Укажите время появления и скрытия.",
    "ed.errSame": "Время появления и скрытия совпадают.",
    "ed.errDays": "Выберите хотя бы один день недели.",
    "ed.errDate": "Укажите дату.",
    "ed.iconAria": "Иконка: {name}",
    "ed.dayAria": "День: {day}",

    "rep.daily": "каждый день",
    "rep.monthly": "каждое {n}-е число",
    "rep.once": "разово · {date}",

    "toast.done": "Отмечено",
    "toast.undone": "Отметка снята",
    "toast.late": "Записано за прошлый день",
    "toast.skipped": "Пропуск записан",
    "toast.skipCleared": "Пропуск снят",
    "toast.saved": "Сохранено",
    "toast.added": "Привычка добавлена",
    "toast.archived": "Привычка в архиве",
    "toast.restored": "Привычка возвращена",
    "toast.deleted": "Удалено навсегда",
    "toast.settingsSaved": "Настройка сохранена",
    "toast.exported": "Файл сохранён",
    "toast.imported": "Импортировано",
    "toast.importFailed": "Файл не подошёл",
    "toast.storageFull": "Не удалось сохранить: память переполнена",
    "toast.fullscreenDenied": "Браузер не разрешил полный экран",
    "toast.fullscreenUnavailable": "Полный экран недоступен",
    "toast.wakeOn": "Экран будет оставаться включённым",
    "toast.wakeOff": "Экономия энергии включена",
    "toast.confirmPurge": "Нажмите ещё раз, чтобы удалить навсегда",
    "toast.demoOn": "Демо включено: 7 привычек. Нажмите ещё раз, чтобы вернуть свои",
    "toast.demoOff": "Демо выключено, ваши привычки вернулись",
    "toast.demoNoSpace": "Нет места для резервной копии",
    "toast.demoRestoreFailed": "Не удалось вернуть данные",
    "toast.firstRun": "Нажмите на плитку, чтобы отметить",
    "toast.noUndo": "Отменить",

    "icon.teeth": "зубы",
    "icon.pill": "таблетка",
    "icon.water": "вода",
    "icon.sun": "солнце",
    "icon.moon": "луна",
    "icon.book": "книга",
    "icon.dumbbell": "спорт",
    "icon.shower": "душ",
    "icon.coffee": "кофе",
    "icon.walk": "прогулка",
    "icon.stretch": "разминка",
    "icon.journal": "дневник",
    "icon.phone": "телефон",
    "icon.bed": "сон",
    "icon.plant": "растение",
    "icon.dishes": "посуда",
    "icon.trash": "уборка",
    "icon.meditate": "медитация",
    "icon.work": "работа",
    "icon.heart": "здоровье",
    "icon.vitamin": "витамины",
    "icon.clock": "время",

    "seed.teethAm": "Зубы утром",
    "seed.vitamins": "Витамины",
    "seed.water": "Вода 500 мл",
    "seed.stretch": "Разминка",
    "seed.teethPm": "Зубы вечером",
    "seed.journal": "Дневник",

    "demo.teethAm": "Зубы утром",
    "demo.vitamins": "Витамины",
    "demo.water": "Вода 500 мл",
    "demo.stretch": "Разминка",
    "demo.shower": "Душ",
    "demo.journal": "Дневник",
    "demo.teethPm": "Зубы вечером"
  },

  en: {
    "app.name": "Ritual",
    "app.tagline": "a day planner for habits",
    "app.description": "Local-first offline habit planner for e-ink tablets: large tiles, one-tap check-ins, overdue stays visible, data never leaves the device.",

    "ui.habits": "Habits",
    "ui.history": "History",
    "ui.archive": "Archive",
    "ui.settings": "Settings",
    "ui.close": "Close",
    "ui.cancel": "Cancel",
    "ui.save": "Save",
    "ui.add": "Add",
    "ui.addHabit": "Add habit",
    "ui.all": "All",
    "ui.refresh": "Refresh",
    "ui.on": "on",
    "ui.off": "off",
    "ui.undo": "Undo",
    "ui.restore": "restore",

    "board.now": "Now",
    "board.done": "Done",
    "board.empty": "Nothing yet",
    "board.free": "Free",
    "board.allDone": "All done",
    "board.addFirst": "Add your first habit",
    "board.addFirstHint": "One tap and the day runs to plan.",
    "board.nextToday": "Next: {title} at {time}.",
    "board.nextTomorrow": "Next: {title} tomorrow at {time}.",
    "board.nothingLeft": "Nothing else today.",
    "board.progress": "Done {done} of {total}",
    "board.progressMissed": ", overdue {missed}",
    "board.more": "more",

    "tile.done": "done {time}",
    "tile.overdue": "overdue · until {end}",
    "tile.debtYesterday": "yesterday · missed",
    "tile.yesterday": "yesterday",
    "tile.daysAgo": { one: "{n} day ago", few: "{n} days ago", many: "{n} days ago", other: "{n} days ago" },
    "tile.ariaMark": "mark done",
    "tile.ariaOverdue": "overdue, tap to mark done",
    "tile.ariaDebt": "missed yesterday, tap to mark done",
    "tile.ariaDone": "done",

    "group.debts": "Overdue",
    "group.morning": "Morning",
    "group.day": "Day",
    "group.evening": "Evening",

    "hist.done": "done {time}",
    "hist.doneLate": "done {time} · backdated",
    "hist.skipped": "skipped",
    "hist.none": "not marked",
    "hist.today": "Today, {date}",
    "hist.yesterday": "Yesterday, {date}",
    "hist.empty": "No records yet. Check habits in and they will appear here.",
    "hist.more": "Show 7 more days",
    "hist.remove": "undo",
    "hist.mark": "mark",
    "hist.skip": "skip",
    "hist.return": "restore",

    "arch.heading": "Turned off",
    "arch.empty": "Archive is empty. Habits you turn off land here with their history.",
    "arch.note": "“Restore” puts the habit back with all its history. The bin deletes it for good, together with its marks.",
    "arch.purge": "Delete forever",

    "habits.empty": "No active habits. Add the first one — it will show up at the right time.",
    "habits.hint": "Long press a tile to edit. Long press an overdue tile to skip it.",
    "habits.debtDone": "done",
    "habits.copy": "Duplicate: {title}",
    "habits.edit": "Edit: {title}",
    "habits.debtDoneAria": "Mark done backdated: {title}",
    "habits.debtSkipAria": "Skip: {title}",

    "set.theme": "Theme",
    "set.light": "Light",
    "set.dark": "Dark",
    "set.auto": "Auto",
    "set.screen": "Screen",
    "set.language": "Language",
    "set.langAuto": "Auto",
    "set.refresh": "Full refresh",
    "set.refreshOff": "off",
    "set.min15": "every 15 min",
    "set.min30": "every 30 min",
    "set.hour": "every hour",
    "set.hideDone": "Hide completed",
    "set.immediately": "instantly",
    "set.min5": "after 5 min",
    "set.min10": "after 10 min",
    "set.min20": "after 20 min",
    "set.min60": "after an hour",
    "set.debts": "Overdue lookback",
    "set.debtsOff": "hide",
    "set.day1": "1 day",
    "set.day2": "2 days",
    "set.day3": "3 days",
    "set.week": "a week",
    "set.wake": "Keep screen awake",
    "set.data": "Data",
    "set.demoOn": "Demo grid: 7 habits",
    "set.demoOff": "Bring my data back",
    "set.export": "Export to file",
    "set.import": "Import from file",
    "set.reset": "Reset everything",
    "set.resetConfirm": "Really reset everything?",
    "set.refreshScreen": "Refresh the whole screen",
    "set.fullscreen": "Fullscreen",
    "set.exitFullscreen": "Exit fullscreen",
    "set.about": "About",
    "set.aboutText": "Version {version}. Everything runs locally: data lives in this tablet's browser storage. No internet needed. Export before clearing browser data.",
    "set.origin": "Data address: {origin}",
    "set.offlineOk": "Offline mode: on — the page opens without a network.",
    "set.offlineBad": "Offline mode: unavailable. Browsers allow the offline cache only on https or localhost; this page is served over plain http from a network address.",
    "set.sync": "No sync: every browser and every address keeps its own copy. Moving data means export and import of JSON.",
    "set.install": "Install: browser menu → “Add to home screen”.",
    "set.hint": "Long press a tile to edit. Long press an overdue tile to skip it.",
    "set.support": "Support and source code",
    "set.supportNote": "There are no background reminders: a habit simply appears on screen in its time window. That is how an offline app works without a network or push notifications.",

    "ed.new": "New habit",
    "ed.edit": "Edit habit",
    "ed.name": "Name",
    "ed.icon": "Icon",
    "ed.appears": "Appears",
    "ed.hides": "Hides",
    "ed.repeat": "Repeat",
    "ed.daily": "Every day",
    "ed.weekly": "Weekdays",
    "ed.monthly": "Day of month",
    "ed.once": "One-off",
    "ed.days": "Weekdays",
    "ed.monthDay": "Day of month",
    "ed.date": "Date",
    "ed.keep": "Keep on screen until it is done",
    "ed.duplicate": "Duplicate",
    "ed.toArchive": "To archive",
    "ed.confirmArchive": "Really archive?",
    "ed.errName": "Enter a name",
    "ed.errTime": "Set when it appears and hides.",
    "ed.errSame": "Appear and hide times are the same.",
    "ed.errDays": "Pick at least one weekday.",
    "ed.errDate": "Pick a date.",
    "ed.iconAria": "Icon: {name}",
    "ed.dayAria": "Day: {day}",

    "rep.daily": "every day",
    "rep.monthly": "day {n} of each month",
    "rep.once": "one-off · {date}",

    "toast.done": "Marked done",
    "toast.undone": "Mark removed",
    "toast.late": "Recorded for the previous day",
    "toast.skipped": "Skip recorded",
    "toast.skipCleared": "Skip removed",
    "toast.saved": "Saved",
    "toast.added": "Habit added",
    "toast.archived": "Habit archived",
    "toast.restored": "Habit restored",
    "toast.deleted": "Deleted forever",
    "toast.settingsSaved": "Setting saved",
    "toast.exported": "File saved",
    "toast.imported": "Imported",
    "toast.importFailed": "That file did not fit",
    "toast.storageFull": "Could not save: storage is full",
    "toast.fullscreenDenied": "The browser refused fullscreen",
    "toast.fullscreenUnavailable": "Fullscreen is unavailable",
    "toast.wakeOn": "The screen will stay awake",
    "toast.wakeOff": "Power saving is on",
    "toast.confirmPurge": "Tap again to delete forever",
    "toast.demoOn": "Demo on: 7 habits. Tap again to bring your data back",
    "toast.demoOff": "Demo off, your habits are back",
    "toast.demoNoSpace": "No room for the backup copy",
    "toast.demoRestoreFailed": "Could not restore your data",
    "toast.firstRun": "Tap a tile to mark it done",
    "toast.noUndo": "Undo",

    "icon.teeth": "teeth",
    "icon.pill": "pill",
    "icon.water": "water",
    "icon.sun": "sun",
    "icon.moon": "moon",
    "icon.book": "book",
    "icon.dumbbell": "workout",
    "icon.shower": "shower",
    "icon.coffee": "coffee",
    "icon.walk": "walk",
    "icon.stretch": "stretch",
    "icon.journal": "journal",
    "icon.phone": "phone",
    "icon.bed": "sleep",
    "icon.plant": "plant",
    "icon.dishes": "dishes",
    "icon.trash": "cleaning",
    "icon.meditate": "meditation",
    "icon.work": "work",
    "icon.heart": "health",
    "icon.vitamin": "vitamins",
    "icon.clock": "time",

    "seed.teethAm": "Brush teeth (morning)",
    "seed.vitamins": "Vitamins",
    "seed.water": "Water 500 ml",
    "seed.stretch": "Stretch",
    "seed.teethPm": "Brush teeth (evening)",
    "seed.journal": "Journal",

    "demo.teethAm": "Brush teeth (morning)",
    "demo.vitamins": "Vitamins",
    "demo.water": "Water 500 ml",
    "demo.stretch": "Stretch",
    "demo.shower": "Shower",
    "demo.journal": "Journal",
    "demo.teethPm": "Brush teeth (evening)"
  }
};

export const LOCALES = ["ru", "en"];

export function dictionaryKeys(locale) {
  return Object.keys(DICT[locale] || DICT.ru).sort();
}
let current = "ru";
let pluralRules = null;

export function detectLocale() {
  if (typeof navigator === "undefined") return "ru";
  const list = (navigator.languages && navigator.languages.length)
    ? navigator.languages
    : [navigator.language || "ru"];
  for (let i = 0; i < list.length; i += 1) {
    const code = String(list[i] || "").slice(0, 2).toLowerCase();
    if (LOCALES.indexOf(code) !== -1) return code;
  }
  return "ru";
}

export function setLocale(code) {
  current = LOCALES.indexOf(code) !== -1 ? code : "ru";
  pluralRules = null;
  if (typeof document !== "undefined") document.documentElement.lang = current;
  return current;
}

export function getLocale() {
  return current;
}

function rules() {
  if (!pluralRules) pluralRules = new Intl.PluralRules(current);
  return pluralRules;
}

export function t(key, vars) {
  const table = DICT[current] || DICT.ru;
  let value = table[key];
  if (value == null) value = DICT.ru[key];
  if (value == null) return key;
  if (typeof value === "object") {
    const form = vars && vars.n != null ? rules().select(Number(vars.n)) : "other";
    value = value[form] || value.other || value.many || Object.values(value)[0];
  }
  if (!vars) return value;
  return String(value).replace(/\{(\w+)\}/g, function (match, name) {
    return vars[name] != null ? String(vars[name]) : match;
  });
}

export function formatDate(date, options) {
  return new Intl.DateTimeFormat(current, options).format(date);
}

export function formatDay(date) {
  return formatDate(date, { day: "numeric", month: "long" });
}

export function formatWeekday(date) {
  return formatDate(date, { weekday: "short" });
}

export function formatDayFull(date) {
  return formatDate(date, { day: "numeric", month: "long", weekday: "short" });
}

export function dayShortNames() {
  const out = [];
  const monday = new Date(2024, 0, 1);
  for (let i = 0; i < 7; i += 1) {
    const d = new Date(monday.getTime());
    d.setDate(monday.getDate() + i);
    out.push({ day: d.getDay(), short: formatWeekday(d) });
  }
  return out;
}
