/* РИТУАЛ — local-first e-ink day planner.
   No network, no framework, no animation. State lives in localStorage. */
(function () {
  "use strict";

  var KEY = "ritual.v1";
  var BACKUP_KEY = "ritual.backup";
  var VERSION = 2;
  var DAY_START = 0; /* calendar day: a habit checked at 00:05 belongs to the new day */
  var MAX_TILES = 9;
  var MONTHS = ["января", "февраля", "марта", "апреля", "мая", "июня",
    "июля", "августа", "сентября", "октября", "ноября", "декабря"];
  var WEEKDAYS = ["вс", "пн", "вт", "ср", "чт", "пт", "сб"];
  var DAY_SHORT = ["вс", "пн", "вт", "ср", "чт", "пт", "сб"];
  var ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];
  var REPEATS = ["daily", "weekly", "monthly", "once"];
  var ICONS = ["teeth", "pill", "water", "sun", "moon", "book", "dumbbell",
    "shower", "coffee", "walk", "stretch", "journal", "phone", "bed",
    "plant", "dishes", "trash", "meditate", "work", "heart", "vitamin", "clock"];
  var ICON_NAMES = {
    teeth: "зубы", pill: "таблетка", water: "вода", sun: "солнце", moon: "луна",
    book: "книга", dumbbell: "спорт", shower: "душ", coffee: "кофе", walk: "прогулка",
    stretch: "разминка", journal: "дневник", phone: "телефон", bed: "сон",
    plant: "растение", dishes: "посуда", trash: "уборка", meditate: "медитация",
    work: "работа", heart: "здоровье", vitamin: "витамины", clock: "время"
  };
  var DEFAULT_SETTINGS = {
    theme: "auto",
    eink: true,
    hideDoneMin: 20,
    debtDays: 3,
    refreshMin: 30,
    keepAwake: false
  };

  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };
  var pad = function (n) { return String(n).padStart(2, "0"); };
  var uid = function () { return "itm_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); };
  var clamp = function (n, lo, hi) { return Math.min(hi, Math.max(lo, n)); };

  var board = $("#board");
  var empty = $("#empty");
  var emptyKicker = $("#emptyKicker");
  var emptyTitle = $("#emptyTitle");
  var emptyNext = $("#emptyNext");
  var emptyAction = $("[data-action='all']", empty);
  var panel = $("#panel");
  var panelTitle = $("#panelTitle");
  var panelBody = $("#panelBody");
  var toastEl = $("#toast");
  var toastText = $("#toastText");
  var toastUndo = $("#toastUndo");
  var flash = $("#flash");
  var netChip = $("#netChip");
  var clockEl = $("#clock");
  var dateEl = $("#date");
  var weekdayEl = $("#weekday");
  var progressWrap = $("#progressWrap");
  var progressText = $("#progressText");
  var segments = $("#segments");
  var tplTile = $("#tpl-tile");
  var tplEditor = $("#tpl-editor");

  var state = load();
  var ui = { panel: null, editFrom: null, editId: null, histDays: 7 };
  var lastSig = "";
  var lastMinute = -1;
  var lastDay = "";
  var lastRefresh = Date.now();
  var toastTimer = 0;
  var undoFn = null;
  var pressTimer = 0;
  var suppressClick = false;
  var flashing = false;
  var wakeLock = null;

  /* ------------------------------------------------------------ helpers */

  function pad2(n) { return pad(n); }

  function dayKey(date) {
    return date.getFullYear() + "-" + pad2(date.getMonth() + 1) + "-" + pad2(date.getDate());
  }

  function logicalNow(now) {
    var d = new Date(now ? now.getTime() : Date.now());
    if (d.getHours() < DAY_START) d.setDate(d.getDate() - 1);
    return d;
  }

  function todayKey() { return dayKey(logicalNow()); }

  function minutesOf(hm) {
    var parts = String(hm || "00:00").split(":");
    return Number(parts[0]) * 60 + Number(parts[1]);
  }

  function validTime(value) {
    return /^([01]\d|2[0-3]):[0-5]\d$/.test(String(value || ""));
  }

  function validDayKey(value) {
    return /^\d{4}-\d{2}-\d{2}$/.test(String(value || "")) &&
      !isNaN(new Date(value + "T12:00:00").getTime());
  }

  function windowFor(item, key) {
    var base = new Date(key + "T00:00:00");
    var start = new Date(base.getTime());
    start.setMinutes(minutesOf(item.start));
    var end = new Date(base.getTime());
    end.setMinutes(minutesOf(item.end));
    if (minutesOf(item.end) <= minutesOf(item.start)) end.setDate(end.getDate() + 1);
    return { start: start, end: end };
  }

  /* One place decides whether a habit belongs to a calendar day. */
  function isScheduled(item, key) {
    var date = new Date(key + "T12:00:00");
    if (item.repeat === "once") return key === item.date;
    if (item.repeat === "monthly") {
      var last = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
      return date.getDate() === Math.min(Number(item.monthDay) || 1, last);
    }
    if (item.repeat === "weekly") {
      if (!item.days || item.days.length === 0 || item.days.length === 7) return true;
      return item.days.indexOf(date.getDay()) !== -1;
    }
    return true;
  }

  function entryOf(key, id) {
    return state.log[key] && state.log[key][id] ? state.log[key][id] : null;
  }

  function setEntry(key, id, value) {
    if (!state.log[key]) state.log[key] = {};
    if (value) state.log[key][id] = value;
    else delete state.log[key][id];
    if (Object.keys(state.log[key]).length === 0) delete state.log[key];
  }

  function hm(date) { return pad2(date.getHours()) + ":" + pad2(date.getMinutes()); }

  function shortDate(key) {
    var d = new Date(key + "T12:00:00");
    return d.getDate() + " " + MONTHS[d.getMonth()];
  }

  function daysLabel(days) {
    if (!days || days.length === 7) return "каждый день";
    if (!days.length) return "нет дней";
    return days.slice().sort(function (a, b) { return (a || 7) - (b || 7); })
      .map(function (d) { return DAY_SHORT[d]; }).join(" ");
  }

  function repeatLabel(item) {
    if (item.repeat === "once") return "разово · " + shortDate(item.date);
    if (item.repeat === "monthly") return "каждое " + item.monthDay + "-е число";
    if (item.repeat === "weekly") return daysLabel(item.days);
    return "каждый день";
  }

  function iconSvg(name, cls) {
    return '<svg class="' + (cls || "ic") + '" viewBox="0 0 100 100" aria-hidden="true" focusable="false">' +
      '<use href="#i-' + name + '"></use></svg>';
  }

  function activeItems() {
    return state.items.filter(function (item) { return !item.archived && !item.deleted; });
  }

  function findItem(id) {
    return state.items.filter(function (item) { return item.id === id; })[0] || null;
  }

  /* ------------------------------------------------------------ storage */

  function seedState() {
    var created = new Date().toISOString();
    var items = [
      { id: "itm_teeth_am", title: "Зубы утром", icon: "teeth", start: "06:30", end: "09:30" },
      { id: "itm_vit", title: "Витамины", icon: "pill", start: "07:00", end: "10:30" },
      { id: "itm_water", title: "Вода 500 мл", icon: "water", start: "07:00", end: "11:00" },
      { id: "itm_stretch", title: "Разминка", icon: "stretch", start: "08:00", end: "12:00" },
      { id: "itm_teeth_pm", title: "Зубы вечером", icon: "teeth", start: "21:00", end: "23:59" },
      { id: "itm_journal", title: "Дневник", icon: "journal", start: "21:30", end: "23:59" }
    ].map(function (item, index) {
      item.repeat = "daily";
      item.days = ALL_DAYS.slice();
      item.monthDay = 1;
      item.date = dayKey(new Date());
      item.keepOverdue = true;
      item.archived = false;
      item.deleted = false;
      item.order = index;
      item.createdAt = created;
      return item;
    });
    return {
      version: VERSION,
      items: items,
      log: {},
      settings: Object.assign({}, DEFAULT_SETTINGS),
      meta: { createdAt: created, firstRun: true, seeded: true }
    };
  }

  /* Семь привычек на один экран: посмотреть сетку, не трогая свои данные. */
  function demoState() {
    var now = new Date();
    var nowMin = now.getHours() * 60 + now.getMinutes();
    var seed = [
      ["Зубы утром", "teeth"],
      ["Витамины", "pill"],
      ["Вода 500 мл", "water"],
      ["Разминка", "stretch"],
      ["Душ", "shower"],
      ["Дневник", "journal"],
      ["Зубы вечером", "teeth"]
    ];
    var today = dayKey(now);
    var created = now.toISOString();
    var items = seed.map(function (pair, index) {
      var startMin = clamp(nowMin - 90 + index * 12, 0, 23 * 60 + 45);
      return {
        id: "demo_" + index,
        title: pair[0],
        icon: pair[1],
        start: pad2(Math.floor(startMin / 60)) + ":" + pad2(startMin % 60),
        end: "23:59",
        repeat: "daily",
        days: ALL_DAYS.slice(),
        monthDay: 1,
        date: today,
        keepOverdue: true,
        archived: false,
        deleted: false,
        order: index,
        createdAt: created
      };
    });
    var log = {};
    log[today] = {
      demo_0: { s: "done", t: new Date(now.getTime() - 6 * 60000).toISOString() },
      demo_1: { s: "done", t: new Date(now.getTime() - 2 * 60000).toISOString() }
    };
    return {
      version: VERSION,
      items: items,
      log: log,
      settings: Object.assign({}, state.settings),
      meta: { createdAt: new Date().toISOString(), demo: true }
    };
  }

  function toggleDemo() {
    var backup = null;
    try { backup = localStorage.getItem(BACKUP_KEY); } catch (error) { backup = null; }

    if (backup) {
      try {
        localStorage.setItem(KEY, backup);
        localStorage.removeItem(BACKUP_KEY);
      } catch (error) {
        toast("Не удалось вернуть данные", null, 5000);
        return;
      }
      state = load();
      rerender();
      renderSettings();
      toast("Демо выключено, ваши привычки вернулись");
      return;
    }

    try {
      localStorage.setItem(BACKUP_KEY, JSON.stringify(state));
    } catch (error) {
      toast("Нет места для резервной копии", null, 5000);
      return;
    }
    state = normalize(demoState());
    save();
    rerender();
    renderSettings();
    toast("Демо включено: 7 привычек. Нажмите ещё раз, чтобы вернуть свои", null, 8000);
  }

  function normalizeItem(raw) {
    if (!raw || typeof raw !== "object") return null;
    var title = String(raw.title || "").trim().slice(0, 40);
    if (!title) return null;
    var days = Array.isArray(raw.days) ? raw.days.map(Number).filter(function (d) { return d >= 0 && d <= 6; }) : [];
    days = Array.from(new Set(days));
    var repeat = REPEATS.indexOf(raw.repeat) !== -1 ? raw.repeat : null;
    if (!repeat) repeat = days.length === 0 || days.length === 7 ? "daily" : "weekly";
    if (repeat === "weekly" && !days.length) days = ALL_DAYS.slice();
    return {
      id: typeof raw.id === "string" && raw.id ? raw.id : uid(),
      title: title,
      icon: ICONS.indexOf(raw.icon) !== -1 ? raw.icon : "teeth",
      start: validTime(raw.start) ? raw.start : "07:00",
      end: validTime(raw.end) ? raw.end : "10:00",
      repeat: repeat,
      days: days,
      monthDay: clamp(Number(raw.monthDay) || 1, 1, 31),
      date: validDayKey(raw.date) ? raw.date : dayKey(new Date()),
      keepOverdue: raw.keepOverdue !== false,
      archived: Boolean(raw.archived),
      deleted: Boolean(raw.deleted),
      order: Number.isFinite(raw.order) ? raw.order : 0,
      createdAt: typeof raw.createdAt === "string" ? raw.createdAt : new Date().toISOString()
    };
  }

  function normalize(data) {
    var items = Array.isArray(data && data.items) ? data.items.map(normalizeItem).filter(Boolean) : [];
    var log = {};
    if (data && data.log && typeof data.log === "object") {
      Object.keys(data.log).forEach(function (key) {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) return;
        var day = data.log[key];
        if (!day || typeof day !== "object") return;
        var clean = {};
        Object.keys(day).forEach(function (id) {
          var entry = day[id];
          if (!entry || (entry.s !== "done" && entry.s !== "skip")) return;
          clean[id] = {
            s: entry.s,
            t: typeof entry.t === "string" ? entry.t : new Date().toISOString()
          };
          if (entry.late) clean[id].late = true;
        });
        if (Object.keys(clean).length) log[key] = clean;
      });
    }
    var settings = Object.assign({}, DEFAULT_SETTINGS, data && data.settings ? data.settings : {});
    settings.theme = ["auto", "light", "dark"].indexOf(settings.theme) !== -1 ? settings.theme : "auto";
    settings.hideDoneMin = clamp(Number.isFinite(Number(settings.hideDoneMin)) ? Number(settings.hideDoneMin) : 20, 0, 240);
    settings.debtDays = clamp(Number.isFinite(Number(settings.debtDays)) ? Number(settings.debtDays) : 3, 0, 14);
    settings.refreshMin = clamp(Number.isFinite(Number(settings.refreshMin)) ? Number(settings.refreshMin) : 30, 0, 240);
    settings.eink = settings.eink !== false;
    settings.keepAwake = Boolean(settings.keepAwake);
    return {
      version: VERSION,
      items: items,
      log: log,
      settings: settings,
      meta: Object.assign({ createdAt: new Date().toISOString() }, data && data.meta ? data.meta : {})
    };
  }

  function load() {
    var raw = null;
    try { raw = localStorage.getItem(KEY); } catch (error) { raw = null; }
    if (!raw) {
      var fresh = seedState();
      try { localStorage.setItem(KEY, JSON.stringify(fresh)); } catch (error) { /* storage blocked */ }
      return fresh;
    }
    try {
      var parsed = JSON.parse(raw);
      var normalized = normalize(parsed);
      if (!parsed || parsed.version !== VERSION) {
        try { localStorage.setItem(KEY, JSON.stringify(normalized)); } catch (error) { /* storage blocked */ }
      }
      return normalized;
    } catch (error) {
      return seedState();
    }
  }

  function save() {
    state.meta.updatedAt = new Date().toISOString();
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
      return true;
    } catch (error) {
      toast("Не удалось сохранить: память переполнена", null, 6000);
      return false;
    }
  }

  function pruneLog() {
    var keys = Object.keys(state.log);
    if (keys.length < 420) return;
    keys.sort();
    keys.slice(0, keys.length - 400).forEach(function (key) { delete state.log[key]; });
  }

  /* ------------------------------------------------------------ schedule */

  function computeEntries(now) {
    var today = todayKey();
    var entries = [];
    var hideMs = (Number(state.settings.hideDoneMin) || 0) * 60000;

    activeItems().forEach(function (item) {
      if (!isScheduled(item, today)) return;
      if (item.createdAt && dayKey(new Date(item.createdAt)) > today) return;
      var entry = entryOf(today, item.id);
      var bounds = windowFor(item, today);
      if (entry && entry.s === "skip") return;
      if (entry && entry.s === "done") {
        var at = new Date(entry.t);
        if (now.getTime() - at.getTime() < hideMs) {
          entries.push({ item: item, state: "done", day: today, at: entry.t });
        }
        return;
      }
      if (now.getTime() >= bounds.end.getTime()) {
        /* Просроченная плитка остаётся на экране, пока её не отметят.
           Скрывать после окна — осознанный выбор в редакторе привычки. */
        if (item.keepOverdue === false) return;
        entries.push({ item: item, state: "missed", day: today });
      } else if (now.getTime() >= bounds.start.getTime()) {
        entries.push({ item: item, state: "pending", day: today });
      }
    });

    entries = entries.concat(computeDebts(today));

    /* Stable order: debts first, then the day by time. A tap never moves a tile. */
    entries.sort(function (a, b) {
      var ad = a.state === "debt";
      var bd = b.state === "debt";
      if (ad !== bd) return ad ? 1 : -1;
      if (ad) return a.daysAgo - b.daysAgo;
      var as = minutesOf(a.item.start);
      var bs = minutesOf(b.item.start);
      if (as !== bs) return as - bs;
      return a.item.order - b.item.order;
    });
    return entries;
  }

  function computeDebts(today) {
    var out = [];
    var todayDate = new Date(today + "T12:00:00");
    var debtDays = clamp(Number(state.settings.debtDays) || 0, 0, 14);
    if (!debtDays) return out;
    /* one debt per habit: the most recent missed day, not every missed day */
    activeItems().forEach(function (item) {
      var todayEntry = entryOf(today, item.id);
      if (todayEntry && (todayEntry.s === "done" || todayEntry.s === "skip")) return;
      for (var back = 1; back <= debtDays; back += 1) {
        var past = new Date(todayDate.getTime());
        past.setDate(past.getDate() - back);
        var key = dayKey(past);
        if (!isScheduled(item, key)) continue;
        if (item.createdAt && dayKey(new Date(item.createdAt)) > key) continue;
        if (entryOf(key, item.id)) continue;
        out.push({ item: item, state: "debt", day: key, daysAgo: back });
        break;
      }
    });
    return out;
  }

  function nextUpcoming(now) {
    var today = todayKey();
    var best = null;
    activeItems().forEach(function (item) {
      if (!isScheduled(item, today)) return;
      if (item.createdAt && dayKey(new Date(item.createdAt)) > today) return;
      var entry = entryOf(today, item.id);
      if (entry && (entry.s === "done" || entry.s === "skip")) return;
      var bounds = windowFor(item, today);
      if (bounds.start.getTime() > now.getTime()) {
        if (!best || bounds.start < best.at) best = { item: item, at: bounds.start, tomorrow: false };
      }
    });
    if (best) return best;
    var probe = new Date(today + "T12:00:00");
    for (var step = 1; step <= 31; step += 1) {
      probe.setDate(probe.getDate() + 1);
      var key = dayKey(probe);
      var found = null;
      activeItems().forEach(function (item) {
        if (!isScheduled(item, key)) return;
        var bounds = windowFor(item, key);
        if (!found || bounds.start < found.at) found = { item: item, at: bounds.start, tomorrow: step === 1 };
      });
      if (found) return found;
    }
    return null;
  }

  /* ------------------------------------------------------------ render */

  function layoutGrid(count) {
    var portrait = window.innerHeight >= window.innerWidth;
    var narrow = window.innerWidth < 430;
    var cols;
    if (portrait) cols = count <= 1 ? 1 : (narrow || count <= 6) ? 2 : count <= 9 ? 3 : 4;
    else cols = count <= 1 ? 1 : count <= 9 ? 3 : 4;
    var rows = Math.max(1, Math.ceil(count / cols));
    board.style.setProperty("--cols", String(cols));
    board.style.setProperty("--rows", String(rows));
    board.classList.toggle("dense", count > 6);
    board.classList.toggle("solo", count > 0 && count <= 2);
    return cols;
  }

  function metaFor(entry) {
    if (entry.state === "done") return "отмечено " + hm(new Date(entry.at));
    if (entry.state === "missed") return "просрочено · до " + entry.item.end;
    if (entry.state === "debt") {
      return entry.daysAgo === 1 ? "вчера · пропущено" : entry.daysAgo + " дн. назад";
    }
    return entry.item.start + "–" + entry.item.end;
  }

  function ariaFor(entry) {
    var tail = entry.state === "done" ? "выполнено" :
      entry.state === "missed" ? "просрочено, нажмите, чтобы отметить" :
        entry.state === "debt" ? "долг за прошлый день, нажмите, чтобы отметить" :
          "отметить";
    return entry.item.title + ", " + metaFor(entry) + ", " + tail;
  }

  function makeTile(entry) {
    var node = tplTile.content.firstElementChild.cloneNode(true);
    node.dataset.id = entry.item.id;
    node.dataset.day = entry.day;
    node.dataset.state = entry.state;
    node.setAttribute("aria-pressed", entry.state === "done" ? "true" : "false");
    node.setAttribute("aria-label", ariaFor(entry));
    $(".tile-icon", node).innerHTML = iconSvg(entry.item.icon);
    $(".tile-title", node).textContent = entry.item.title;
    $(".tile-meta", node).textContent = metaFor(entry);
    return node;
  }

  function renderBoard() {
    var now = new Date();
    var entries = computeEntries(now);
    var portrait = window.innerHeight >= window.innerWidth;
    var narrow = window.innerWidth < 430;
    var maxTiles = narrow ? 6 : portrait ? MAX_TILES : MAX_TILES + 3;
    var extra = Math.max(0, entries.length - maxTiles);
    var shown = entries.slice(0, extra ? maxTiles - 1 : maxTiles);
    var sig = shown.map(function (entry) {
      return entry.item.id + ":" + entry.state + ":" + entry.day;
    }).join("|") + "#" + shown.length + "+" + extra;

    if (sig !== lastSig) {
      var count = shown.length + (extra ? 1 : 0);
      var cols = layoutGrid(count);
      board.innerHTML = "";
      var frag = document.createDocumentFragment();
      shown.forEach(function (entry) { frag.appendChild(makeTile(entry)); });
      if (extra) frag.appendChild(makeMoreTile(extra));
      board.appendChild(frag);
      if (count > 1 && cols > 1) {
        var rem = count % cols;
        var last = board.lastElementChild;
        if (last && rem !== 0) last.style.gridColumn = "span " + (cols - rem + 1);
      }
      lastSig = sig;
    }

    board.hidden = shown.length === 0 && !extra;
    updateProgress(entries);
    renderEmpty(entries, now);
  }

  function makeMoreTile(extra) {
    var node = document.createElement("button");
    node.type = "button";
    node.className = "tile tile-more";
    node.dataset.action = "all";
    node.setAttribute("aria-label", "Открыть все привычки, ещё " + extra);
    node.innerHTML = '<span class="tile-more-count">+' + extra + "</span>" +
      '<span class="tile-more-label">ещё</span>';
    return node;
  }

  function updateProgress(entries) {
    var today = todayKey();
    var todays = activeItems().filter(function (item) { return isScheduled(item, today); });
    var done = todays.filter(function (item) {
      var entry = entryOf(today, item.id);
      return entry && entry.s === "done";
    }).length;
    var missed = entries.filter(function (entry) {
      return entry.state === "missed" || entry.state === "debt";
    }).length;
    var total = todays.length;

    progressText.textContent = done + "/" + total;
    progressWrap.setAttribute("aria-valuemax", String(total));
    progressWrap.setAttribute("aria-valuenow", String(done));
    progressWrap.setAttribute("aria-valuetext", "Выполнено " + done + " из " + total +
      (missed ? ", просрочено " + missed : ""));

    var segCount = Math.min(total, 12);
    if (segments.dataset.count !== String(segCount)) {
      segments.innerHTML = "";
      for (var i = 0; i < segCount; i += 1) {
        var seg = document.createElement("span");
        seg.className = "segment";
        segments.appendChild(seg);
      }
      segments.dataset.count = String(segCount);
    }
    var filled = total ? Math.round((done / total) * segCount) : 0;
    Array.prototype.forEach.call(segments.children, function (seg, index) {
      seg.classList.toggle("on", index < filled);
    });
  }

  function renderEmpty(entries, now) {
    var show = entries.length === 0;
    empty.hidden = !show;
    if (!show) return;

    var active = activeItems();
    var today = todayKey();
    var todays = active.filter(function (item) { return isScheduled(item, today); });
    var done = todays.filter(function (item) {
      var entry = entryOf(today, item.id);
      return entry && entry.s === "done";
    }).length;

    if (!active.length) {
      emptyKicker.textContent = "Пока пусто";
      emptyTitle.textContent = "Добавьте первую привычку";
      emptyNext.textContent = "Одно касание — и день идёт по плану.";
      emptyAction.textContent = "Добавить привычку";
      emptyAction.dataset.action = "add";
      return;
    }

    emptyAction.dataset.action = "all";
    emptyAction.textContent = "Все привычки";

    if (todays.length && done >= todays.length) {
      emptyKicker.textContent = "Готово";
      emptyTitle.textContent = "Всё отмечено";
    } else {
      emptyKicker.textContent = "Сейчас";
      emptyTitle.textContent = "Свободно";
    }

    var next = nextUpcoming(now);
    if (next) {
      var when = next.tomorrow ? "завтра" : "сегодня";
      emptyNext.textContent = "Дальше: " + next.item.title + " — " + when + " в " + next.item.start + ".";
    } else {
      emptyNext.textContent = "На сегодня больше ничего.";
    }
  }

  function updateClock(now) {
    clockEl.textContent = pad2(now.getHours()) + ":" + pad2(now.getMinutes());
    dateEl.textContent = now.getDate() + " " + MONTHS[now.getMonth()];
    weekdayEl.textContent = WEEKDAYS[now.getDay()];
    var dark = document.documentElement.dataset.theme === "dark";
    var color = dark ? "#121212" : "#ffffff";
    $$("meta[name='theme-color']").forEach(function (meta) {
      meta.setAttribute("content", color);
    });
  }

  function applyTheme() {
    var choice = state.settings.theme;
    var dark = choice === "dark" || (choice === "auto" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.dataset.theme = dark ? "dark" : "light";
    document.body.dataset.eink = state.settings.eink ? "1" : "0";
    updateClock(new Date());
  }

  /* ------------------------------------------------------------ actions */

  function toast(message, undo, ms) {
    window.clearTimeout(toastTimer);
    toastText.textContent = message;
    undoFn = typeof undo === "function" ? undo : null;
    toastUndo.hidden = !undoFn;
    toastEl.hidden = false;
    toastTimer = window.setTimeout(function () {
      toastEl.hidden = true;
      undoFn = null;
    }, ms || 4500);
  }

  function rerender() {
    lastSig = "";
    applyTheme();
    renderBoard();
    if (panel.open && ui.panel) renderPanel();
  }

  function toggleEntry(id, key) {
    var entry = entryOf(key, id);
    var previous = entry ? Object.assign({}, entry) : null;
    var late = key !== todayKey();
    if (entry && entry.s === "done") {
      setEntry(key, id, null);
      toast("Отметка снята", function () {
        setEntry(key, id, previous);
        save();
        rerender();
      });
    } else {
      setEntry(key, id, { s: "done", t: new Date().toISOString(), late: late });
      toast(late ? "Записано за прошлый день" : "Отмечено", function () {
        setEntry(key, id, previous);
        save();
        rerender();
      });
    }
    pruneLog();
    save();
    rerender();
  }

  function skipEntry(id, key) {
    var previous = entryOf(key, id);
    var snapshot = previous ? Object.assign({}, previous) : null;
    setEntry(key, id, { s: "skip", t: new Date().toISOString() });
    save();
    rerender();
    toast("Пропуск записан", function () {
      setEntry(key, id, snapshot);
      save();
      rerender();
    });
  }

  function handleLong(id, key, stateName) {
    if (stateName === "missed" || stateName === "debt") skipEntry(id, key);
    else openEditor(id, ui.panel || "day");
  }

  /* ------------------------------------------------------------ panels */

  function openPanel(kind) {
    toastEl.hidden = true;
    undoFn = null;
    ui.panel = kind === "all" ? "habits" : kind;
    panel.appendChild(toastEl);
    renderPanel();
    if (!panel.open) panel.showModal();
    panelBody.scrollTop = 0;
  }

  function closePanel() {
    if (panel.open) panel.close();
  }

  function setPanelTitle(text) {
    panelTitle.textContent = text;
  }

  function renderPanel() {
    if (!ui.panel) return;
    if (ui.panel === "settings") renderSettings();
    else if (ui.panel === "history") renderHistory();
    else if (ui.panel === "archive") renderArchive();
    else renderHabits();
  }

  function tabsHtml(active) {
    var tabs = [
      ["habits", "Привычки"],
      ["history", "История"],
      ["archive", "Архив"]
    ];
    return '<div class="tabs" role="group" aria-label="Разделы">' +
      tabs.map(function (tab) {
        var on = active === tab[0];
        return '<button type="button" data-act="tab" data-value="' + tab[0] + '"' +
          (on ? ' aria-current="page"' : "") + '>' + tab[1] + "</button>";
      }).join("") + "</div>";
  }

  function noteNode(text) {
    var note = document.createElement("p");
    note.className = "note";
    note.textContent = text;
    return note;
  }

  function rowIcon(item) {
    return '<span class="row-icon" aria-hidden="true">' + iconSvg(item.icon) + "</span>";
  }

  /* --------------------------------------------------- habits tab */

  function renderHabits() {
    setPanelTitle("Привычки");
    panelBody.innerHTML = "";
    panelBody.insertAdjacentHTML("beforeend", tabsHtml("habits"));

    var items = activeItems().slice()
      .sort(function (a, b) { return minutesOf(a.start) - minutesOf(b.start); });

    var debts = computeDebts(todayKey());
    if (debts.length) {
      var debtSection = document.createElement("section");
      debtSection.className = "group";
      var debtHeading = document.createElement("h3");
      debtHeading.textContent = "Долги";
      debtSection.appendChild(debtHeading);
      var debtList = document.createElement("ul");
      debtList.className = "rows";
      debts.forEach(function (entry) {
        var li = document.createElement("li");
        li.className = "row row-debt";
        li.dataset.id = entry.item.id;
        li.dataset.day = entry.day;
        li.innerHTML = rowIcon(entry.item) +
          '<span class="row-main"><span class="row-title"></span><span class="row-meta"></span></span>' +
          '<button class="switch" type="button" data-act="debt-done">готово</button>' +
          '<button class="iconbtn" type="button" data-act="debt-skip" aria-label="Пропустить долг">' +
          iconSvg("skip") + "</button>";
        $(".row-title", li).textContent = entry.item.title;
        $(".row-meta", li).textContent = (entry.daysAgo === 1 ? "вчера" : entry.daysAgo + " дн. назад") +
          " · " + entry.item.start + "–" + entry.item.end;
        $("[data-act='debt-done']", li).setAttribute("aria-label", "Отметить задним числом: " + entry.item.title);
        $("[data-act='debt-skip']", li).setAttribute("aria-label", "Пропустить: " + entry.item.title);
        debtList.appendChild(li);
      });
      debtSection.appendChild(debtList);
      panelBody.appendChild(debtSection);
    }

    if (!items.length) {
      panelBody.appendChild(noteNode("Активных привычек нет. Добавьте первую — она появится в нужное время."));
    }

    var groups = [
      { label: "Утро", test: function (h) { return h < 12; } },
      { label: "День", test: function (h) { return h >= 12 && h < 18; } },
      { label: "Вечер", test: function (h) { return h >= 18; } }
    ];

    groups.forEach(function (group) {
      var groupItems = items.filter(function (item) {
        return group.test(Math.floor(minutesOf(item.start) / 60));
      });
      if (!groupItems.length) return;
      var section = document.createElement("section");
      section.className = "group";
      var heading = document.createElement("h3");
      heading.textContent = group.label;
      section.appendChild(heading);
      var list = document.createElement("ul");
      list.className = "rows";

      groupItems.forEach(function (item) {
        var li = document.createElement("li");
        li.className = "row row-habit";
        li.dataset.id = item.id;
        li.innerHTML = rowIcon(item) +
          '<span class="row-main"><span class="row-title"></span><span class="row-meta"></span></span>' +
          '<button class="switch" type="button" data-act="toggle" aria-pressed="true">вкл</button>' +
          '<button class="iconbtn" type="button" data-act="clone" aria-label="Копировать">' +
          iconSvg("copy") + "</button>" +
          '<button class="iconbtn" type="button" data-act="edit" aria-label="Изменить">' +
          iconSvg("edit") + "</button>";
        $(".row-title", li).textContent = item.title;
        $(".row-meta", li).textContent = item.start + "–" + item.end + " · " + repeatLabel(item);
        $("[data-act='clone']", li).setAttribute("aria-label", "Копировать: " + item.title);
        $("[data-act='edit']", li).setAttribute("aria-label", "Изменить: " + item.title);
        list.appendChild(li);
      });

      section.appendChild(list);
      panelBody.appendChild(section);
    });

    var add = document.createElement("button");
    add.type = "button";
    add.className = "btn btn-primary";
    add.dataset.act = "add";
    add.textContent = "Добавить привычку";
    panelBody.appendChild(add);

    panelBody.appendChild(noteNode("Долгое нажатие на плитку открывает редактор. Долгое нажатие на просроченную — «пропустить»."));
  }

  /* --------------------------------------------------- history tab */

  function historyRowsFor(key, today) {
    var out = [];
    var now = new Date();
    state.items.forEach(function (item) {
      if (item.deleted) return;
      if (!isScheduled(item, key)) return;
      if (item.createdAt && dayKey(new Date(item.createdAt)) > key) return;
      var entry = entryOf(key, item.id);
      if (!entry && item.archived) return;
      if (!entry && key === today) {
        var bounds = windowFor(item, key);
        if (now.getTime() < bounds.start.getTime()) return;
      }
      out.push({ item: item, entry: entry || null });
    });
    out.sort(function (a, b) {
      var as = minutesOf(a.item.start);
      var bs = minutesOf(b.item.start);
      if (as !== bs) return as - bs;
      return a.item.order - b.item.order;
    });
    return out;
  }

  function historyDayTitle(date, back) {
    var tail = date.getDate() + " " + MONTHS[date.getMonth()] + ", " + DAY_SHORT[date.getDay()];
    if (back === 0) return "Сегодня, " + tail;
    if (back === 1) return "Вчера, " + tail;
    return tail;
  }

  function historyStatus(entry) {
    if (!entry) return "не отмечено";
    if (entry.s === "skip") return "пропущено";
    var when = entry.t ? hm(new Date(entry.t)) : "";
    return "выполнено" + (when ? " " + when : "") + (entry.late ? " · задним числом" : "");
  }

  function renderHistory() {
    setPanelTitle("История");
    panelBody.innerHTML = "";
    panelBody.insertAdjacentHTML("beforeend", tabsHtml("history"));

    var span = clamp(Number(ui.histDays) || 7, 1, 30);
    var today = todayKey();
    var base = new Date(today + "T12:00:00");
    var any = false;

    for (var back = 0; back < span; back += 1) {
      var date = new Date(base.getTime());
      date.setDate(date.getDate() - back);
      var key = dayKey(date);
      var rows = historyRowsFor(key, today);
      if (!rows.length) continue;
      any = true;

      var section = document.createElement("section");
      section.className = "group";
      var heading = document.createElement("h3");
      heading.textContent = historyDayTitle(date, back);
      section.appendChild(heading);

      var list = document.createElement("ul");
      list.className = "rows";
      rows.forEach(function (row) {
        var entry = row.entry;
        var li = document.createElement("li");
        li.className = "row row-hist";
        li.dataset.id = row.item.id;
        li.dataset.day = key;
        li.dataset.entry = entry ? entry.s : "none";
        li.innerHTML = rowIcon(row.item) +
          '<span class="row-main"><span class="row-title"></span><span class="row-meta"></span></span>' +
          '<button class="switch" type="button" data-act="hist-toggle"></button>' +
          '<button class="iconbtn" type="button" data-act="hist-skip"></button>';
        $(".row-title", li).textContent = row.item.title;
        $(".row-meta", li).textContent = historyStatus(entry);

        var toggle = $("[data-act='hist-toggle']", li);
        var skip = $("[data-act='hist-skip']", li);
        if (entry && entry.s === "done") {
          toggle.textContent = "снять";
          toggle.setAttribute("aria-label", "Снять отметку: " + row.item.title);
          skip.innerHTML = iconSvg("skip");
          skip.setAttribute("aria-label", "Пропустить вместо отметки: " + row.item.title);
        } else if (entry && entry.s === "skip") {
          toggle.textContent = "отметить";
          toggle.setAttribute("aria-label", "Отметить выполненным: " + row.item.title);
          skip.innerHTML = iconSvg("undo");
          skip.setAttribute("aria-label", "Вернуть в неотмеченные: " + row.item.title);
        } else {
          toggle.textContent = "отметить";
          toggle.setAttribute("aria-label", "Отметить выполненным: " + row.item.title);
          skip.innerHTML = iconSvg("skip");
          skip.setAttribute("aria-label", "Пропустить: " + row.item.title);
        }
        list.appendChild(li);
      });

      section.appendChild(list);
      panelBody.appendChild(section);
    }

    if (!any) {
      panelBody.appendChild(noteNode("Записей пока нет. Отмечайте привычки — здесь появится история."));
    }

    if (span < 30) {
      var more = document.createElement("button");
      more.type = "button";
      more.className = "btn btn-ghost";
      more.dataset.act = "hist-more";
      more.textContent = "Показать ещё 7 дней";
      panelBody.appendChild(more);
    }
  }

  /* --------------------------------------------------- archive tab */

  function renderArchive() {
    setPanelTitle("Архив");
    panelBody.innerHTML = "";
    panelBody.insertAdjacentHTML("beforeend", tabsHtml("archive"));

    var items = state.items.filter(function (item) { return item.archived && !item.deleted; })
      .slice().sort(function (a, b) {
        if (a.deleted !== b.deleted) return a.deleted ? 1 : -1;
        return minutesOf(a.start) - minutesOf(b.start);
      });

    if (!items.length) {
      panelBody.appendChild(noteNode("Архив пуст. Сюда попадают выключенные привычки: история и отметки сохраняются."));
      return;
    }

    var section = document.createElement("section");
    section.className = "group";
    var heading = document.createElement("h3");
    heading.textContent = "Выключено";
    section.appendChild(heading);

    var list = document.createElement("ul");
    list.className = "rows";
    items.forEach(function (item) {
      var li = document.createElement("li");
      li.className = "row row-arch";
      li.dataset.id = item.id;
      li.innerHTML = rowIcon(item) +
        '<span class="row-main"><span class="row-title"></span><span class="row-meta"></span></span>' +
        '<button class="switch" type="button" data-act="restore">вернуть</button>' +
        '<button class="iconbtn" type="button" data-act="purge" aria-label="Удалить навсегда">' +
        iconSvg("trash") + "</button>";
      $(".row-title", li).textContent = item.title;
      $(".row-meta", li).textContent = item.start + "–" + item.end + " · " + repeatLabel(item);
      $("[data-act='restore']", li).setAttribute("aria-label", "Вернуть привычку: " + item.title);
      $("[data-act='purge']", li).setAttribute("aria-label", "Удалить навсегда: " + item.title);
      list.appendChild(li);
    });
    section.appendChild(list);
    panelBody.appendChild(section);
    panelBody.appendChild(noteNode("«Вернуть» — привычка снова появляется на экране со всей историей. «Корзина» — удалить окончательно вместе с отметками."));
  }

  /* --------------------------------------------------- settings tab */

  function renderSettings() {
    setPanelTitle("Настройки");
    panelBody.innerHTML = "";

    var theme = document.createElement("section");
    theme.className = "group";
    theme.innerHTML = "<h3>Тема</h3><div class=\"segmented\">" +
      '<button type="button" data-act="theme" data-value="light">Светлая</button>' +
      '<button type="button" data-act="theme" data-value="dark">Тёмная</button>' +
      '<button type="button" data-act="theme" data-value="auto">Авто</button></div>';
    panelBody.appendChild(theme);

    var screen = document.createElement("section");
    screen.className = "group";
    screen.innerHTML = "<h3>Экран</h3>" +
      settingSelect("refresh", "Полное обновление", state.settings.refreshMin,
        [["0", "выключено"], ["15", "каждые 15 мин"], ["30", "каждые 30 мин"], ["60", "каждый час"]]) +
      settingSelect("hide", "Скрывать выполненные", state.settings.hideDoneMin,
        [["0", "сразу"], ["5", "через 5 мин"], ["10", "через 10 мин"], ["20", "через 20 мин"], ["30", "через 30 мин"], ["60", "через час"]]) +
      settingSelect("debt", "Долги за прошлые дни", state.settings.debtDays,
        [["0", "не показывать"], ["1", "1 день"], ["2", "2 дня"], ["3", "3 дня"], ["7", "неделю"]]) +
      '<div class="setting"><span>Не гасить экран</span>' +
      '<button class="switch" type="button" data-act="wake" aria-pressed="' +
      (state.settings.keepAwake ? "true" : "false") + '">' +
      (state.settings.keepAwake ? "вкл" : "выкл") + "</button></div>";
    panelBody.appendChild(screen);

    var data = document.createElement("section");
    data.className = "group";
    var demoOn = false;
    try { demoOn = Boolean(localStorage.getItem(BACKUP_KEY)); } catch (error) { demoOn = false; }
    data.innerHTML = "<h3>Данные</h3>" +
      '<button class="btn btn-ghost" type="button" data-act="demo">' +
      (demoOn ? "Вернуть мои данные" : "Демо-сетка: 7 привычек") + "</button>" +
      '<button class="btn" type="button" data-act="export">Экспорт в файл</button>' +
      '<label class="btn filebtn">Импорт из файла<input type="file" id="importFile" accept="application/json,.json"></label>' +
      '<button class="btn btn-danger" type="button" data-act="reset">Сбросить всё</button>';
    panelBody.appendChild(data);

    var refreshBtn = document.createElement("button");
    refreshBtn.type = "button";
    refreshBtn.className = "btn btn-ghost";
    refreshBtn.dataset.act = "fullrefresh";
    refreshBtn.textContent = "Обновить экран полностью";
    panelBody.appendChild(refreshBtn);

    var fullBtn = document.createElement("button");
    fullBtn.type = "button";
    fullBtn.className = "btn btn-ghost";
    fullBtn.dataset.act = "fullscreen";
    fullBtn.textContent = document.fullscreenElement ? "Выйти из полного экрана" : "На весь экран";
    panelBody.appendChild(fullBtn);

    var about = document.createElement("section");
    about.className = "group";
    var offlineOk = "serviceWorker" in navigator && window.isSecureContext;
    about.innerHTML = "<h3>О приложении</h3>" +
      '<p class="note">Версия 1.1. Всё работает локально: данные лежат в памяти браузера этого планшета. ' +
      "Интернет не нужен. Делайте экспорт перед очисткой браузера.</p>" +
      '<p class="note"><b>Адрес данных:</b> ' + location.origin + "</p>" +
      '<p class="note"><b>Офлайн-режим:</b> ' +
      (offlineOk ? "работает — страница открывается без сети."
        : "недоступен. Браузер включает офлайн-кэш только на https или localhost, " +
          "а страница открыта по обычному http с адреса в сети. Пока сервер на компьютере работает — всё сохраняется; " +
          "если он остановится, страницу не перезагрузить.") + "</p>" +
      '<p class="note"><b>Синхронизации нет:</b> у каждого браузера и каждого адреса своя копия. ' +
      "Перенос — только экспорт/импорт JSON.</p>" +
      '<p class="note">Установка: меню браузера → «Добавить на главный экран».</p>' +
      '<p class="note">Долгое нажатие на плитку — редактор. Долгое нажатие на просроченную — «пропустить».</p>';
    panelBody.appendChild(about);

    var importFile = $("#importFile", panelBody);
    if (importFile) importFile.addEventListener("change", importData);

    $$("[data-act='theme']", panelBody).forEach(function (button) {
      button.setAttribute("aria-pressed", state.settings.theme === button.dataset.value ? "true" : "false");
    });
  }

  function settingSelect(act, label, value, options) {
    var html = '<label class="setting"><span>' + label + "</span><select data-act=\"" + act + "\">";
    options.forEach(function (pair) {
      html += '<option value="' + pair[0] + '"' +
        (String(value) === pair[0] ? " selected" : "") + ">" + pair[1] + "</option>";
    });
    return html + "</select></label>";
  }

  /* ------------------------------------------------------------ editor */

  function openEditor(id, from, template) {
    toastEl.hidden = true;
    undoFn = null;
    ui.editId = id || null;
    ui.editFrom = from || "day";

    var item = id ? findItem(id) : null;
    var base = item || template || null;

    setPanelTitle(item ? "Изменить привычку" : "Новая привычка");
    panelBody.innerHTML = "";
    panelBody.appendChild(tplEditor.content.cloneNode(true));

    var form = $("#habitForm", panelBody);
    var titleInput = $("#fTitle", form);
    var startInput = $("#fStart", form);
    var endInput = $("#fEnd", form);
    var iconWrap = $("#fIcons", form);
    var daysWrap = $("#fDays", form);
    var daysField = $("#fDaysField", form);
    var monthField = $("#fMonthField", form);
    var monthInput = $("#fMonthDay", form);
    var dateField = $("#fDateField", form);
    var dateInput = $("#fDate", form);
    var repeatWrap = $("#fRepeat", form);
    var keepInput = $("#fKeep", form);
    var deleteBtn = $("#fDelete", form);
    var cloneBtn = $("#fClone", form);
    var errorEl = $("#fErr", form);
    var titleErr = $("#fTitleErr", form);

    var selectedIcon = base ? base.icon : "teeth";
    var selectedDays = base ? base.days.slice() : ALL_DAYS.slice();
    var selectedRepeat = base ? base.repeat : "daily";
    if (selectedRepeat === "weekly" && !selectedDays.length) selectedDays = ALL_DAYS.slice();

    titleInput.value = base ? base.title : "";
    startInput.value = base ? base.start : "07:00";
    endInput.value = base ? base.end : "10:00";
    monthInput.value = base ? base.monthDay : 1;
    dateInput.value = base && base.date ? base.date : todayKey();
    keepInput.checked = base ? base.keepOverdue !== false : true;

    ICONS.forEach(function (name) {
      var button = document.createElement("button");
      button.type = "button";
      button.className = "iconopt";
      button.dataset.icon = name;
      button.setAttribute("aria-pressed", name === selectedIcon ? "true" : "false");
      button.setAttribute("aria-label", "Иконка: " + ICON_NAMES[name]);
      button.innerHTML = iconSvg(name);
      button.addEventListener("click", function () {
        selectedIcon = name;
        $$(".iconopt", iconWrap).forEach(function (option) {
          option.setAttribute("aria-pressed", option.dataset.icon === name ? "true" : "false");
        });
      });
      iconWrap.appendChild(button);
    });

    ALL_DAYS.slice().sort(function (a, b) { return (a === 0 ? 7 : a) - (b === 0 ? 7 : b); })
      .forEach(function (day) {
        var button = document.createElement("button");
        button.type = "button";
        button.className = "day";
        button.dataset.day = String(day);
        button.setAttribute("aria-pressed", selectedDays.indexOf(day) !== -1 ? "true" : "false");
        button.setAttribute("aria-label", "День: " + DAY_SHORT[day]);
        button.textContent = DAY_SHORT[day];
        button.addEventListener("click", function () {
          var index = selectedDays.indexOf(day);
          if (index === -1) selectedDays.push(day);
          else selectedDays.splice(index, 1);
          button.setAttribute("aria-pressed", index === -1 ? "true" : "false");
        });
        daysWrap.appendChild(button);
      });

    function syncRepeat() {
      $$("[data-repeat]", repeatWrap).forEach(function (button) {
        button.setAttribute("aria-pressed", button.dataset.repeat === selectedRepeat ? "true" : "false");
      });
      daysField.hidden = selectedRepeat !== "weekly";
      monthField.hidden = selectedRepeat !== "monthly";
      dateField.hidden = selectedRepeat !== "once";
    }

    $$("[data-repeat]", repeatWrap).forEach(function (button) {
      button.addEventListener("click", function () {
        selectedRepeat = button.dataset.repeat;
        syncRepeat();
      });
    });
    syncRepeat();

    if (item) {
      deleteBtn.hidden = false;
      cloneBtn.hidden = false;
      deleteBtn.addEventListener("click", function () {
        if (deleteBtn.dataset.confirm !== "1") {
          deleteBtn.dataset.confirm = "1";
          deleteBtn.textContent = "Точно в архив?";
          window.setTimeout(function () {
            deleteBtn.dataset.confirm = "";
            deleteBtn.textContent = "Убрать в архив";
          }, 4000);
          return;
        }
        item.archived = true;
        item.deleted = false;
        save();
        ui.panel = "habits";
        renderPanel();
        rerender();
        toast("Привычка в архиве", function () {
          item.archived = false;
          save();
          rerender();
          toast("Возвращено");
        });
      });
      cloneBtn.addEventListener("click", function () {
        openEditor(null, ui.editFrom, item);
        window.setTimeout(function () {
          var input = $("#fTitle", panelBody);
          if (input) { input.focus({ preventScroll: true }); input.select(); }
        }, 80);
      });
    }

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var title = titleInput.value.trim();
      var start = startInput.value;
      var end = endInput.value;
      titleErr.hidden = title.length > 0;
      if (!title) { titleInput.focus(); return; }
      if (!validTime(start) || !validTime(end)) {
        errorEl.hidden = false;
        errorEl.textContent = "Укажите время появления и скрытия.";
        return;
      }
      if (start === end) {
        errorEl.hidden = false;
        errorEl.textContent = "Время появления и скрытия совпадают.";
        return;
      }
      if (selectedRepeat === "weekly" && !selectedDays.length) {
        errorEl.hidden = false;
        errorEl.textContent = "Выберите хотя бы один день недели.";
        return;
      }
      if (selectedRepeat === "once" && !validDayKey(dateInput.value)) {
        errorEl.hidden = false;
        errorEl.textContent = "Укажите дату.";
        return;
      }
      errorEl.hidden = true;

      var monthDay = clamp(Number(monthInput.value) || 1, 1, 31);
      var days = selectedRepeat === "weekly" ? selectedDays.slice() : ALL_DAYS.slice();

      if (item) {
        item.title = title;
        item.icon = selectedIcon;
        item.start = start;
        item.end = end;
        item.repeat = selectedRepeat;
        item.days = days;
        item.monthDay = monthDay;
        item.date = dateInput.value;
        item.keepOverdue = keepInput.checked;
      } else {
        state.items.push({
          id: uid(),
          title: title,
          icon: selectedIcon,
          start: start,
          end: end,
          repeat: selectedRepeat,
          days: days,
          monthDay: monthDay,
          date: dateInput.value,
          keepOverdue: keepInput.checked,
          archived: false,
          deleted: false,
          order: state.items.length,
          createdAt: new Date().toISOString()
        });
      }
      save();
      if (ui.editFrom === "all") {
        ui.panel = "habits";
        renderPanel();
      } else {
        closePanel();
      }
      rerender();
      toast(item ? "Сохранено" : "Привычка добавлена");
    });

    form.addEventListener("click", function (event) {
      var closer = event.target.closest("[data-close]");
      if (!closer) return;
      event.stopPropagation();
      if (ui.editFrom === "all") {
        ui.panel = "habits";
        renderPanel();
      } else {
        closePanel();
      }
    });

    panel.appendChild(toastEl);
    if (!panel.open) panel.showModal();
    panelBody.scrollTop = 0;
    window.setTimeout(function () {
      titleInput.focus({ preventScroll: true });
      if (!item) titleInput.select();
    }, 60);
  }

  /* ------------------------------------------------------------ data */

  function importData(event) {
    var file = event.target.files && event.target.files[0];
    if (!file) return;
    file.text().then(function (text) {
      var parsed = JSON.parse(text);
      if (!parsed || !Array.isArray(parsed.items)) throw new Error("bad file");
      if (!window.confirm("Заменить все данные на данные из файла?")) return;
      state = normalize(parsed);
      save();
      rerender();
      renderSettings();
      toast("Импортировано");
    }).catch(function () {
      toast("Файл не подошёл", null, 5000);
    });
  }

  function exportData() {
    var blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    var url = URL.createObjectURL(blob);
    var link = document.createElement("a");
    link.href = url;
    link.download = "ritual-" + dayKey(new Date()) + ".json";
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(function () { URL.revokeObjectURL(url); }, 1500);
    toast("Файл сохранён");
  }

  function resetData(button) {
    if (button.dataset.confirm !== "1") {
      button.dataset.confirm = "1";
      button.textContent = "Точно сбросить всё?";
      window.setTimeout(function () {
        button.dataset.confirm = "";
        button.textContent = "Сбросить всё";
      }, 4000);
      return;
    }
    try { localStorage.removeItem(KEY); } catch (error) { /* ignore */ }
    window.location.reload();
  }

  function purgeItem(id) {
    var item = findItem(id);
    if (!item) return;
    state.items = state.items.filter(function (entry) { return entry.id !== id; });
    Object.keys(state.log).forEach(function (key) { delete state.log[key][id]; });
    save();
    renderPanel();
    rerender();
    toast("Удалено навсегда");
  }

  /* ------------------------------------------------------------ misc */

  function fullRefresh() {
    if (flashing) return;
    flashing = true;
    flash.hidden = false;
    flash.classList.remove("dark");
    window.setTimeout(function () { flash.classList.add("dark"); }, 130);
    window.setTimeout(function () { flash.classList.remove("dark"); }, 260);
    window.setTimeout(function () { flash.classList.add("dark"); }, 390);
    window.setTimeout(function () {
      flash.classList.remove("dark");
      flash.hidden = true;
      flashing = false;
      lastRefresh = Date.now();
    }, 520);
  }

  function maybeAutoRefresh() {
    var minutes = Number(state.settings.refreshMin) || 0;
    if (!minutes) return;
    if (Date.now() - lastRefresh >= minutes * 60000) fullRefresh();
  }

  function syncWakeLock() {
    if (!("wakeLock" in navigator)) return;
    if (state.settings.keepAwake && document.visibilityState === "visible") {
      if (!wakeLock || wakeLock.released) {
        navigator.wakeLock.request("screen").then(function (lock) {
          wakeLock = lock;
          lock.addEventListener("release", function () { wakeLock = null; });
        }).catch(function () { /* not available on this device */ });
      }
    } else if (wakeLock) {
      wakeLock.release().catch(function () { /* ignore */ });
      wakeLock = null;
    }
  }

  function updateNet() {
    netChip.hidden = navigator.onLine !== false ? true : false;
  }

  function tick() {
    var now = new Date();
    var minute = now.getMinutes();
    var key = dayKey(now);
    if (minute !== lastMinute || key !== lastDay) {
      lastMinute = minute;
      lastDay = key;
      updateClock(now);
      renderBoard();
      maybeAutoRefresh();
    }
  }

  /* ------------------------------------------------------------ bind */

  function bind() {
    document.addEventListener("click", function (event) {
      var action = event.target.closest("[data-action]");
      if (!action) return;
      var value = action.dataset.action;
      if (value === "add") openEditor(null, "day");
      else if (value === "all") openPanel("habits");
      else if (value === "refresh") fullRefresh();
      else if (value === "settings") openPanel("settings");
    });

    board.addEventListener("pointerdown", function (event) {
      var tile = event.target.closest(".tile");
      if (!tile) return;
      suppressClick = false;
      window.clearTimeout(pressTimer);
      pressTimer = window.setTimeout(function () {
        suppressClick = true;
        handleLong(tile.dataset.id, tile.dataset.day, tile.dataset.state);
      }, 650);
    });

    ["pointerup", "pointercancel", "pointerleave"].forEach(function (name) {
      board.addEventListener(name, function () { window.clearTimeout(pressTimer); });
    });

    board.addEventListener("click", function (event) {
      var tile = event.target.closest(".tile");
      if (!tile) return;
      if (suppressClick) { suppressClick = false; return; }
      toggleEntry(tile.dataset.id, tile.dataset.day);
    });

    board.addEventListener("contextmenu", function (event) {
      if (event.target.closest(".tile")) event.preventDefault();
    });

    panel.addEventListener("click", function (event) {
      var closer = event.target.closest("[data-close]");
      if (closer) closePanel();
    });

    panel.addEventListener("close", function () {
      ui.panel = null;
      ui.editId = null;
      var shell = $(".app");
      var dock = $(".dock");
      if (shell && dock) shell.insertBefore(toastEl, dock);
      else document.body.appendChild(toastEl);
    });

    panelBody.addEventListener("click", function (event) {
      var action = event.target.closest("[data-act]");
      if (!action) return;
      var act = action.dataset.act;
      var row = action.closest(".row");

      if (act === "tab") {
        ui.panel = action.dataset.value;
        renderPanel();
        panelBody.scrollTop = 0;
        return;
      }
      if (act === "add") { openEditor(null, "all"); return; }
      if (act === "edit") { openEditor(row.dataset.id, "all"); return; }
      if (act === "clone") {
        var source = findItem(row.dataset.id);
        if (source) openEditor(null, "all", source);
        return;
      }
      if (act === "toggle") {
        var id = row.dataset.id;
        var item = findItem(id);
        if (!item) return;
        item.archived = !item.archived;
        save();
        renderPanel();
        rerender();
        toast(item.archived ? "Привычка в архиве" : "Привычка включена");
        return;
      }
      if (act === "restore") {
        var back = findItem(row.dataset.id);
        if (!back) return;
        back.archived = false;
        back.deleted = false;
        save();
        renderPanel();
        rerender();
        toast("Привычка возвращена");
        return;
      }
      if (act === "purge") {
        if (action.dataset.confirm !== "1") {
          action.dataset.confirm = "1";
          action.classList.add("danger");
          window.setTimeout(function () {
            action.dataset.confirm = "";
            action.classList.remove("danger");
          }, 4000);
          toast("Нажмите ещё раз, чтобы удалить навсегда", null, 4000);
          return;
        }
        purgeItem(row.dataset.id);
        return;
      }
      if (act === "theme") {
        state.settings.theme = action.dataset.value;
        save();
        applyTheme();
        renderSettings();
        rerender();
        return;
      }
      if (act === "wake") {
        state.settings.keepAwake = !state.settings.keepAwake;
        save();
        syncWakeLock();
        renderSettings();
        toast(state.settings.keepAwake ? "Экран будет оставаться включённым" : "Экономия энергии включена");
        return;
      }
      if (act === "debt-done") {
        toggleEntry(row.dataset.id, row.dataset.day);
        return;
      }
      if (act === "debt-skip") {
        skipEntry(row.dataset.id, row.dataset.day);
        return;
      }
      if (act === "hist-toggle") {
        var entry = entryOf(row.dataset.day, row.dataset.id);
        if (entry && entry.s === "done") {
          setEntry(row.dataset.day, row.dataset.id, null);
          save();
          rerender();
          toast("Отметка снята", function () {
            setEntry(row.dataset.day, row.dataset.id, entry);
            save();
            rerender();
          });
        } else {
          toggleEntry(row.dataset.id, row.dataset.day);
        }
        return;
      }
      if (act === "hist-skip") {
        var current = entryOf(row.dataset.day, row.dataset.id);
        if (current && current.s === "skip") {
          setEntry(row.dataset.day, row.dataset.id, null);
          save();
          rerender();
          toast("Пропуск снят");
        } else {
          skipEntry(row.dataset.id, row.dataset.day);
        }
        return;
      }
      if (act === "hist-more") {
        ui.histDays = clamp((Number(ui.histDays) || 7) + 7, 7, 30);
        renderHistory();
        return;
      }
      if (act === "export") { exportData(); return; }
      if (act === "demo") { toggleDemo(); return; }
      if (act === "fullrefresh") { fullRefresh(); return; }
      if (act === "fullscreen") {
        if (document.fullscreenElement) {
          document.exitFullscreen().catch(function () {});
        } else if (document.documentElement.requestFullscreen) {
          document.documentElement.requestFullscreen().catch(function () {
            toast("Браузер не разрешил полный экран", null, 5000);
          });
        } else {
          toast("Полный экран недоступен", null, 5000);
        }
        return;
      }
      if (act === "reset") { resetData(action); }
    });

    panelBody.addEventListener("change", function (event) {
      var act = event.target.dataset ? event.target.dataset.act : null;
      if (act === "refresh") state.settings.refreshMin = Number(event.target.value);
      else if (act === "hide") state.settings.hideDoneMin = Number(event.target.value);
      else if (act === "debt") state.settings.debtDays = Number(event.target.value);
      else return;
      save();
      rerender();
      toast("Настройка сохранена");
    });

    window.addEventListener("online", updateNet);
    window.addEventListener("offline", updateNet);
    window.addEventListener("resize", function () {
      lastSig = "";
      renderBoard();
    });

    /* Fullscreen changes the viewport on e-ink tablets: re-measure the grid
       a few times while the browser settles, or the dock overlaps the board. */
    function relayout() {
      lastSig = "";
      updateClock(new Date());
      renderBoard();
      if (panel.open && ui.panel === "settings") {
        var scrollTop = panelBody.scrollTop;
        renderSettings();
        panelBody.scrollTop = scrollTop;
      }
    }

    document.addEventListener("fullscreenchange", function () {
      relayout();
      window.setTimeout(relayout, 120);
      window.setTimeout(relayout, 450);
      window.setTimeout(relayout, 900);
    });

    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", function () {
        lastSig = "";
        renderBoard();
      });
    }

    document.addEventListener("visibilitychange", function () {
      if (document.visibilityState === "visible") {
        updateClock(new Date());
        lastSig = "";
        renderBoard();
        syncWakeLock();
      }
    });

    var darkQuery = window.matchMedia("(prefers-color-scheme: dark)");
    if (darkQuery.addEventListener) {
      darkQuery.addEventListener("change", function () {
        if (state.settings.theme === "auto") {
          applyTheme();
          lastSig = "";
          renderBoard();
        }
      });
    }

    toastUndo.addEventListener("click", function () {
      if (!undoFn) return;
      var fn = undoFn;
      undoFn = null;
      toastEl.hidden = true;
      fn();
    });
  }

  function registerServiceWorker() {
    if (!("serviceWorker" in navigator)) return;
    if (!/^https?:$/.test(window.location.protocol)) return;
    navigator.serviceWorker.register("sw.js").catch(function () { /* file:// or blocked */ });
  }

  function init() {
    applyTheme();
    updateNet();
    bind();
    renderBoard();
    updateClock(new Date());
    syncWakeLock();
    registerServiceWorker();

    if (navigator.storage && navigator.storage.persist) {
      navigator.storage.persist().catch(function () { /* not critical */ });
    }

    if (state.meta && state.meta.firstRun) {
      state.meta.firstRun = false;
      save();
      window.setTimeout(function () {
        toast("Нажмите на плитку, чтобы отметить", null, 7000);
      }, 700);
    }

    tick();
    window.setInterval(tick, 15000);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
}());
