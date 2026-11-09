# Design Sheet — РИТУАЛ

**Направление:** swiss editorial / e-ink utility
**Дата:** 2026-11-10

## Foundations

| ID | Токен | Значение | Контраст к surface |
|---|---|---|---|
| DS-FOUND-COLOR-01 | `chart.alert.danger` | `#b3261e` | 6.54 |
| DS-FOUND-COLOR-02 | `chart.alert.success` | `#1f6f43` | 6.15 |
| DS-FOUND-COLOR-03 | `chart.alert.warning` | `#8a5300` | 6.33 |
| DS-FOUND-COLOR-04 | `chart.div.neg.1` | `#cf7a7a` | 3.13 |
| DS-FOUND-COLOR-05 | `chart.div.neg.2` | `#a33b3b` | 6.47 |
| DS-FOUND-COLOR-06 | `chart.div.neg.3` | `#7a1f1f` | 10.28 |
| DS-FOUND-COLOR-07 | `chart.div.pos.1` | `#4f9a82` | 3.35 |
| DS-FOUND-COLOR-08 | `chart.div.pos.2` | `#3f8f79` | 3.88 |
| DS-FOUND-COLOR-09 | `chart.div.pos.3` | `#0f6b5c` | 6.41 |
| DS-FOUND-COLOR-10 | `chart.div.zero` | `#b8bfc7` | 1.86 |
| DS-FOUND-COLOR-11 | `chart.seq.1` | `#e6f2ee` | 1.15 |
| DS-FOUND-COLOR-12 | `chart.seq.2` | `#c2e0d6` | 1.41 |
| DS-FOUND-COLOR-13 | `chart.seq.3` | `#9ccdbe` | 1.77 |
| DS-FOUND-COLOR-14 | `chart.seq.4` | `#6fb8a4` | 2.32 |
| DS-FOUND-COLOR-15 | `chart.seq.5` | `#46a189` | 3.13 |
| DS-FOUND-COLOR-16 | `chart.seq.6` | `#238b71` | 4.2 |
| DS-FOUND-COLOR-17 | `chart.seq.7` | `#0f6b5c` | 6.41 |
| DS-FOUND-COLOR-18 | `chart.series.1` | `#0f6b5c` | 6.41 |
| DS-FOUND-COLOR-19 | `chart.series.2` | `#2f6f9f` | 5.39 |
| DS-FOUND-COLOR-20 | `chart.series.3` | `#8a5300` | 6.33 |
| DS-FOUND-COLOR-21 | `chart.series.4` | `#6b4c9a` | 6.72 |
| DS-FOUND-COLOR-22 | `chart.series.5` | `#a33b3b` | 6.47 |
| DS-FOUND-COLOR-23 | `chart.series.6` | `#4c8c2b` | 4.12 |
| DS-FOUND-COLOR-24 | `chart.series.7` | `#b3541e` | 5.0 |
| DS-FOUND-COLOR-25 | `chart.series.8` | `#4a5568` | 7.53 |
| DS-FOUND-COLOR-26 | `color.accent` | `#000000` | 21.0 |
| DS-FOUND-COLOR-27 | `color.border` | `#000000` | 21.0 |
| DS-FOUND-COLOR-28 | `color.border.muted` | `#8a8a8a` | 3.45 |
| DS-FOUND-COLOR-29 | `color.danger` | `#8a1010` | 9.71 |
| DS-FOUND-COLOR-30 | `color.debt.fill` | `#bcbcbc` | 1.9 |
| DS-FOUND-COLOR-31 | `color.missed.fill` | `#d4d4d4` | 1.48 |
| DS-FOUND-COLOR-32 | `color.missed.text` | `#000000` | 21.0 |
| DS-FOUND-COLOR-33 | `color.onAccent` | `#ffffff` | 1.0 |
| DS-FOUND-COLOR-34 | `color.success` | `#0b5c2e` | 8.13 |
| DS-FOUND-COLOR-35 | `color.surface` | `#ffffff` | 1.0 |
| DS-FOUND-COLOR-36 | `color.surface.muted` | `#ededed` | 1.17 |
| DS-FOUND-COLOR-37 | `color.text` | `#000000` | 21.0 |
| DS-FOUND-COLOR-38 | `color.text.muted` | `#4a4a4a` | 8.86 |
| DS-FOUND-COLOR-39 | `color.warn` | `#6b3d00` | 9.16 |

## Темы

| ID | Токен | Light | Dark | к базе L | к базе D | Colors |
|---|---|---|---|---|---|---|
| DS-THEME-PAIR-01 | `chart.alert.danger` | `#b3261e` | `#ff8a80` | 6.54 | 8.21 | 2 |
| DS-THEME-PAIR-02 | `chart.alert.success` | `#1f6f43` | `#7fd8a6` | 6.15 | 10.95 | 2 |
| DS-THEME-PAIR-03 | `chart.alert.warning` | `#8a5300` | `#e8b45c` | 6.33 | 9.91 | 2 |
| DS-THEME-PAIR-04 | `chart.div.neg.1` | `#cf7a7a` | `#b25f5f` | 3.13 | 4.19 | 2 |
| DS-THEME-PAIR-05 | `chart.div.neg.2` | `#a33b3b` | `#c25f5f` | 6.47 | 4.55 | 2 |
| DS-THEME-PAIR-06 | `chart.div.neg.3` | `#7a1f1f` | `#e88989` | 10.28 | 7.47 | 2 |
| DS-THEME-PAIR-07 | `chart.div.pos.1` | `#4f9a82` | `#2d7a65` | 3.35 | 3.64 | 2 |
| DS-THEME-PAIR-08 | `chart.div.pos.2` | `#3f8f79` | `#45a084` | 3.88 | 5.9 | 2 |
| DS-THEME-PAIR-09 | `chart.div.pos.3` | `#0f6b5c` | `#6fc3a5` | 6.41 | 8.94 | 2 |
| DS-THEME-PAIR-10 | `chart.div.zero` | `#b8bfc7` | `#4a5568` | — | — | 2 |
| DS-THEME-PAIR-11 | `chart.seq.1` | `#e6f2ee` | `#0e2a24` | — | — | 2 |
| DS-THEME-PAIR-12 | `chart.seq.2` | `#c2e0d6` | `#123a31` | — | — | 2 |
| DS-THEME-PAIR-13 | `chart.seq.3` | `#9ccdbe` | `#174c3f` | — | — | 2 |
| DS-THEME-PAIR-14 | `chart.seq.4` | `#6fb8a4` | `#1f604f` | — | — | 2 |
| DS-THEME-PAIR-15 | `chart.seq.5` | `#46a189` | `#2d7a65` | — | — | 2 |
| DS-THEME-PAIR-16 | `chart.seq.6` | `#238b71` | `#45a084` | — | — | 2 |
| DS-THEME-PAIR-17 | `chart.seq.7` | `#0f6b5c` | `#6fc3a5` | — | — | 2 |
| DS-THEME-PAIR-18 | `chart.series.1` | `#0f6b5c` | `#6fc3a5` | 6.41 | 8.94 | 2 |
| DS-THEME-PAIR-19 | `chart.series.2` | `#2f6f9f` | `#7fb3e0` | 5.39 | 8.41 | 2 |
| DS-THEME-PAIR-20 | `chart.series.3` | `#8a5300` | `#e0b168` | 6.33 | 9.51 | 2 |
| DS-THEME-PAIR-21 | `chart.series.4` | `#6b4c9a` | `#b9a0e0` | 6.72 | 8.18 | 2 |
| DS-THEME-PAIR-22 | `chart.series.5` | `#a33b3b` | `#e88989` | 6.47 | 7.47 | 2 |
| DS-THEME-PAIR-23 | `chart.series.6` | `#4c8c2b` | `#9fd07a` | 4.12 | 10.51 | 2 |
| DS-THEME-PAIR-24 | `chart.series.7` | `#b3541e` | `#f0a06a` | 5.0 | 8.87 | 2 |
| DS-THEME-PAIR-25 | `chart.series.8` | `#4a5568` | `#a9b2ac` | 7.53 | 8.61 | 2 |
| DS-THEME-PAIR-26 | `color.accent` | `#000000` | `#ffffff` | 21.0 | 18.73 | 2 |
| DS-THEME-PAIR-27 | `color.border` | `#000000` | `#e6e6e6` | — | — | 2 |
| DS-THEME-PAIR-28 | `color.border.muted` | `#8a8a8a` | `#6a6a6a` | — | — | 2 |
| DS-THEME-PAIR-29 | `color.danger` | `#8a1010` | `#ff9a9a` | 9.71 | 9.22 | 2 |
| DS-THEME-PAIR-30 | `color.debt.fill` | `#bcbcbc` | `#3a3a3a` | — | — | 2 |
| DS-THEME-PAIR-31 | `color.missed.fill` | `#d4d4d4` | `#2e2e2e` | — | — | 2 |
| DS-THEME-PAIR-32 | `color.missed.text` | `#000000` | `#f5f5f5` | 21.0 | 17.18 | 2 |
| DS-THEME-PAIR-33 | `color.onAccent` | `#ffffff` | `#121212` | 21.0 | 18.73 | 2 |
| DS-THEME-PAIR-34 | `color.success` | `#0b5c2e` | `#7fe0a8` | 8.13 | 11.71 | 2 |
| DS-THEME-PAIR-35 | `color.surface` | `#ffffff` | `#121212` | — | — | 2 |
| DS-THEME-PAIR-36 | `color.surface.muted` | `#ededed` | `#1f1f1f` | — | — | 2 |
| DS-THEME-PAIR-37 | `color.text` | `#000000` | `#f5f5f5` | 21.0 | 17.18 | 2 |
| DS-THEME-PAIR-38 | `color.text.muted` | `#4a4a4a` | `#b8b8b8` | 8.86 | 9.44 | 2 |
| DS-THEME-PAIR-39 | `color.warn` | `#6b3d00` | `#ffc46b` | 9.16 | 11.92 | 2 |

## Components and patterns

| ID | Что | Состояния |
|---|---|---|
| `CMP-BTN-01` | Primary button | default, hover, focus, active, disabled, loading |
| `CMP-BTN-02` | Secondary button | default, hover, focus, disabled |
| `CMP-BTN-03` | Ghost button | default, hover, focus |
| `CMP-INPUT-01` | Text input | default, focus, error, disabled |
| `CMP-SELECT-01` | Select | default, focus, disabled |
| `CMP-CHECK-01` | Checkbox | default, focus, disabled |
| `CMP-RADIO-01` | Radio group | default, focus, disabled |
| `CMP-SWITCH-01` | Switch | default, focus, disabled |
| `CMP-TABLE-01` | Data table | default |
| `CMP-TABS-01` | Tabs | default, focus |
| `CMP-NAV-01` | Primary navigation | default |
| `CMP-CRUMB-01` | Breadcrumbs | default |
| `CMP-PAGER-01` | Pagination | default |
| `CMP-MODAL-01` | Modal dialog | default |
| `CMP-POPOVER-01` | Popover | default |
| `CMP-TOAST-01` | Toast | success, error |
| `CMP-TOOLTIP-01` | Tooltip | default |
| `CMP-EMPTY-01` | Empty state | default |
| `CMP-LOADING-01` | Skeleton | default |
| `CMP-ERROR-01` | Inline error | default |
| `PATTERN-THEME-01` | Theme switch (system / light / dark) | default |
| `PATTERN-HERO-01` | Hero | default |
| `PATTERN-CARD-01` | Card | default |
| `PATTERN-GALLERY-01` | Gallery (scroll-snap) | default |
| `PATTERN-PRICING-01` | Pricing | default |
| `PATTERN-FORM-01` | Form | default, error |
| `PATTERN-DASH-01` | Dashboard KPI row | default |
| `CMP-ALERT-01` | Alert / banner | info, success, warning, error |
| `CMP-ACCORDION-01` | Accordion | default, open |
| `CMP-MENU-01` | Dropdown menu | default, open |
| `CMP-SEGMENTED-01` | Segmented control | default |
| `CMP-INPUTGROUP-01` | Input group | default, focus |
| `CMP-SEARCH-01` | Search field | default, focus |
| `CMP-ICONBTN-01` | Icon-only button | default, hover, focus, disabled |
| `CMP-FLOATING-01` | Floating label | default, focus |
| `CMP-RANGE-01` | Range | default, focus |
| `CMP-PROGRESS-01` | Progress | default |
| `CMP-SPINNER-01` | Spinner | default |
| `CMP-PLACEHOLDER-01` | Placeholder lines | default |
| `CMP-LIST-01` | List group | default |
| `CMP-CHIPS-01` | Filter chips | default, selected |
| `CMP-AVATAR-01` | Avatar | default |
| `CMP-STEPPER-01` | Stepper | default |
| `CMP-UPLOAD-01` | File upload | default |
| `CMP-TOOLBAR-01` | Table toolbar | default |
| `CMP-BOTTOMNAV-01` | Bottom navigation (mobile) | default |
| `CMP-FAB-01` | Floating action button | default, hover, focus |
| `CMP-SHEET-01` | Bottom sheet | default |
| `CMP-RAIL-01` | Navigation rail (tablet) | default |
| `CMP-ORDER-SUMMARY-01` | Order summary | default |
| `CMP-PAYMENT-01` | Payment methods | default |
| `CMP-COMPARE-TABLE-01` | Comparison table | default |
| `CMP-STATUS-01` | Status badges | default |
| `CMP-DATE-RANGE-01` | Date range | default, error |
| `CMP-SEARCH-SUGGEST-01` | Search suggestions | default |
| `CMP-NOTIFICATION-01` | Notifications | default |
| `PATTERN-STATES-01` | Data states (loading / empty / error / offline) | default |
| `PATTERN-SETTINGS-01` | Settings screen | default |
| `PATTERN-AUTH-01` | Sign-in screen | default, error |
| `PATTERN-ONBOARDING-01` | Onboarding step | default |
| `CMP-CHART-01` | Line / area chart | default, empty, error |
| `CMP-CHART-02` | Bar / column chart | default, sorted |
| `CMP-CHART-03` | Scatter chart | default, dense |
| `CMP-CHART-04` | Part-to-whole chart | default, other |
| `CMP-CHART-05` | Heatmap | default, legend |
| `CMP-SPARKLINE-01` | Sparkline | default, empty |
| `CMP-KPI-01` | KPI tile | default, stale |
| `CMP-CHART-LEGEND-01` | Chart legend + table toggle | default, table-toggle |
| `CMP-CHART-TOOLTIP-01` | Chart tooltip | default, focus |

## Правила

- ID неизменяемы; удалённый элемент помечается `DEPRECATED` и остаётся в документе.
- Любое замечание формулируется по ID (`DS-CMP-BTN-01-HOVER`).
- Sheet — фикстура аудита, perf-стенд и документация одновременно.
- Review log ведётся в `design-sheet.json`; changelog — здесь и в HTML.
