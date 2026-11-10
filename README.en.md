# Takt — a habit planner for e-ink

A single-page, local-first habit planner for 6" e-ink tablets. Large tiles, no
scrolling, one-tap check-in, overdue stays visible until it is closed. No
network, no accounts, no analytics: data lives in the device's browser.

**Live:** https://danilka88.github.io/eink-planner/

![Board](design/screens/eink-536-day.png)

## What it does

- **Day board.** 1–4 columns, tiles fill the screen, readable from 1–2 m.
- **Habit in its window.** Appears at `06:30`, after `09:30` becomes
  “overdue · until 09:30” and stays until checked (can be turned off).
- **One tap** — done: the tile inverts, disappears after 5–60 minutes.
- **Repeat:** every day, weekdays, day of month, one-off date.
- **History and archive.** Every check by day, undo and restore; disabled
  habits keep their history.
- **Duplicate** a habit in one tap.
- **Overdue** from previous days, closed retroactively.
- **8 languages**, light/dark/auto theme, JSON export and import.
- **Offline:** service worker, PWA manifest, zero network requests.

## Quick start

```bash
git clone https://github.com/Danilka88/eink-planner.git
cd eink-planner
python3 -m http.server 8080
```

Open `http://127.0.0.1:8080`.

> Opening `index.html` by double click does not work: the app uses ES modules
> and the browser blocks them on `file://`.

### Install on the tablet

1. Open the site over **https** (or `localhost`) — the offline cache only works
   there.
2. Browser menu → “Add to home screen”.
3. Turn on airplane mode and open the shortcut: it works without network.

Plain `http://192.168.x.x` has no offline mode — a browser restriction, not an
app bug. Settings → About shows the current state.

## Controls

| Action | What it does |
|---|---|
| Tap a tile | check / uncheck |
| Long press | habit editor |
| Long press an overdue tile | record a skip |
| “All” → “Habits” | on/off, duplicate, edit, add |
| “All” → “History” | checks by day: undo, mark, skip, restore |
| “All” → “Archive” | restore a habit or delete it forever |
| “Refresh” | full screen flash (ghost cleanup) |
| “Settings” | theme, language, time format, timers, demo, export/import |

## Structure

```
index.html            markup, SEO, templates, CSP
styles.css            1-bit theme, grid, e-ink rules
js/app.js             DOM, events, render, editor, settings
js/core/schedule.js   windows, repeat, overdue, history (pure)
js/core/state.js      model, migrations, localStorage
js/core/i18n.js       8 locales, Intl plurals, dates, 12/24 h
js/core/dict/*.js     interface dictionaries
js/core/icons.js      Phosphor Bold sprite
js/theme-boot.js      theme before first paint
sw.js                 offline shell cache
tests/                unit tests (node --test)
docs/                 architecture, data model, i18n, icons, deploy
design/               design docs, tokens, screenshots
```

## Tests

```bash
npm test
```

25 tests: schedule, migrations, plurals in all 8 languages, time format.
See `docs/TESTING.md`.

## Privacy

No network requests: `connect-src 'self'` in CSP blocks them at the browser
level, and the app makes none. Data lives in `localStorage` and never leaves
the device. See `PRIVACY.md`.

## Data

- Everything lives in the device browser's `localStorage`. There is no sync.
- **Share** opens the Android share sheet: the file goes straight to Telegram, mail or Files.
- **Export to file** downloads `takt-YYYY-MM-DD.json`.
- **Import from file** replaces everything after confirmation.
- Clearing site data deletes habits: export is the only safety net.
- Address = storage. After changing the address, move data with export and import.

## License

Code — MIT (`LICENSE`). Icons — Phosphor Icons, MIT (`THIRD-PARTY.md`).

## Other languages

[Русский](README.md) · [Español](README.es.md) · [Português](README.pt.md) ·
[Français](README.fr.md) · [中文](README.zh.md) · [हिन्दी](README.hi.md) ·
[العربية](README.ar.md)
