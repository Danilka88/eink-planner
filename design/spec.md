# Design Contract

Машинный контракт для сборки интерфейса. Если чего-то нет в этом файле —
это не «на усмотрение», а отсутствующее решение: сначала расширь контракт.

Компонентов: **73** · экранов: **16** · иконок в карте: **70**

## Компоненты

| ID | Название | Уровень | Переиспользование | Роль | Платформы | Лимит |
|---|---|---|---|---|---|---|
| `CMP-BTN-01` | Primary button | component | system | accent | mobile, tablet, desktop | 1 |
| `CMP-BTN-02` | Secondary button | component | system | neutral | mobile, tablet, desktop | — |
| `CMP-BTN-03` | Ghost button | component | system | neutral | mobile, tablet, desktop | — |
| `CMP-INPUT-01` | Text input | component | system | neutral | mobile, tablet, desktop | — |
| `CMP-SELECT-01` | Select | component | system | neutral | mobile, tablet, desktop | — |
| `CMP-CHECK-01` | Checkbox | component | system | neutral | mobile, tablet, desktop | — |
| `CMP-RADIO-01` | Radio group | component | system | neutral | mobile, tablet, desktop | — |
| `CMP-SWITCH-01` | Switch | component | system | neutral | mobile, tablet, desktop | — |
| `CMP-TABLE-01` | Data table | component | shared | neutral | mobile, tablet, desktop | — |
| `CMP-TABS-01` | Tabs | component | system | neutral | mobile, tablet, desktop | — |
| `CMP-NAV-01` | Primary navigation | component | system | neutral | mobile, tablet, desktop | — |
| `CMP-CRUMB-01` | Breadcrumbs | component | system | neutral | mobile, tablet, desktop | — |
| `CMP-PAGER-01` | Pagination | component | system | neutral | mobile, tablet, desktop | — |
| `CMP-MODAL-01` | Modal dialog | component | system | neutral | mobile, tablet, desktop | — |
| `CMP-POPOVER-01` | Popover | component | system | neutral | mobile, tablet, desktop | — |
| `CMP-TOAST-01` | Toast | component | system | utility | mobile, tablet, desktop | — |
| `CMP-TOOLTIP-01` | Tooltip | component | system | utility | mobile, tablet, desktop | — |
| `CMP-EMPTY-01` | Empty state | component | system | neutral | mobile, tablet, desktop | — |
| `CMP-LOADING-01` | Skeleton | component | system | neutral | mobile, tablet, desktop | — |
| `CMP-ERROR-01` | Inline error | component | system | utility | mobile, tablet, desktop | — |
| `PATTERN-THEME-01` | Theme switch (system / light / dark) | pattern | system | neutral | mobile, tablet, desktop | — |
| `PATTERN-HERO-01` | Hero | pattern | system | neutral | mobile, tablet, desktop | 1 |
| `PATTERN-CARD-01` | Card | pattern | system | neutral | mobile, tablet, desktop | — |
| `PATTERN-GALLERY-01` | Gallery (scroll-snap) | pattern | local | neutral | mobile, tablet, desktop | — |
| `PATTERN-PRICING-01` | Pricing | pattern | local | neutral | mobile, tablet, desktop | — |
| `PATTERN-FORM-01` | Form | pattern | system | neutral | mobile, tablet, desktop | — |
| `PATTERN-DASH-01` | Dashboard KPI row | pattern | system | neutral | tablet, desktop | — |
| `CMP-ALERT-01` | Alert / banner | component | system | utility | mobile, tablet, desktop | — |
| `CMP-ACCORDION-01` | Accordion | component | system | neutral | mobile, tablet, desktop | — |
| `CMP-MENU-01` | Dropdown menu | component | system | neutral | mobile, tablet, desktop | 1 |
| `CMP-SEGMENTED-01` | Segmented control | component | system | neutral | mobile, tablet, desktop | — |
| `CMP-INPUTGROUP-01` | Input group | component | system | neutral | mobile, tablet, desktop | — |
| `CMP-SEARCH-01` | Search field | component | system | neutral | mobile, tablet, desktop | — |
| `CMP-ICONBTN-01` | Icon-only button | component | system | neutral | mobile, tablet, desktop | — |
| `CMP-FLOATING-01` | Floating label | component | system | neutral | mobile, tablet, desktop | — |
| `CMP-RANGE-01` | Range | component | system | neutral | mobile, tablet, desktop | — |
| `CMP-PROGRESS-01` | Progress | component | system | neutral | mobile, tablet, desktop | — |
| `CMP-SPINNER-01` | Spinner | component | system | neutral | mobile, tablet, desktop | — |
| `CMP-PLACEHOLDER-01` | Placeholder lines | component | system | neutral | mobile, tablet, desktop | — |
| `CMP-LIST-01` | List group | component | system | neutral | mobile, tablet, desktop | — |
| `CMP-CHIPS-01` | Filter chips | component | shared | neutral | mobile, tablet, desktop | — |
| `CMP-AVATAR-01` | Avatar | component | system | neutral | mobile, tablet, desktop | — |
| `CMP-STEPPER-01` | Stepper | component | system | neutral | mobile, tablet, desktop | — |
| `CMP-UPLOAD-01` | File upload | component | system | neutral | mobile, tablet, desktop | — |
| `CMP-TOOLBAR-01` | Table toolbar | component | shared | neutral | mobile, tablet, desktop | — |
| `CMP-BOTTOMNAV-01` | Bottom navigation (mobile) | component | system | neutral | mobile, tablet | 1 |
| `CMP-FAB-01` | Floating action button | component | system | accent | mobile, tablet | 1 |
| `CMP-SHEET-01` | Bottom sheet | component | system | neutral | mobile, tablet | 1 |
| `CMP-RAIL-01` | Navigation rail (tablet) | component | system | neutral | tablet, desktop | — |
| `PATTERN-STATES-01` | Data states (loading / empty / error / offline) | pattern | system | neutral | mobile, tablet, desktop | — |
| `PATTERN-SETTINGS-01` | Settings screen | pattern | system | neutral | mobile, tablet, desktop | — |
| `PATTERN-AUTH-01` | Sign-in screen | pattern | local | neutral | mobile, tablet, desktop | — |
| `PATTERN-ONBOARDING-01` | Onboarding step | pattern | local | neutral | mobile, tablet | — |
| `CMP-ORDER-SUMMARY-01` | Order summary | component | shared | neutral | tablet, desktop | — |
| `CMP-PAYMENT-01` | Payment methods | component | shared | neutral | mobile, tablet, desktop | — |
| `CMP-COMPARE-TABLE-01` | Comparison table | component | shared | neutral | tablet, desktop | — |
| `CMP-STATUS-01` | Status badges | component | system | neutral | mobile, tablet, desktop | — |
| `CMP-DATE-RANGE-01` | Date range | component | system | neutral | mobile, tablet, desktop | — |
| `CMP-SEARCH-SUGGEST-01` | Search suggestions | component | system | neutral | mobile, tablet, desktop | — |
| `CMP-NOTIFICATION-01` | Notifications | component | shared | neutral | mobile, tablet, desktop | — |
| `CMP-CHART-01` | Line / area chart | component | system | neutral | mobile, tablet, desktop | — |
| `CMP-CHART-02` | Bar / column chart | component | system | neutral | mobile, tablet, desktop | — |
| `CMP-CHART-03` | Scatter / bubble chart | component | system | neutral | mobile, tablet, desktop | — |
| `CMP-CHART-04` | Part-to-whole chart | component | system | neutral | mobile, tablet, desktop | — |
| `CMP-CHART-05` | Heatmap | component | system | neutral | mobile, tablet, desktop | — |
| `CMP-CHART-LEGEND-01` | Chart legend | component | system | neutral | mobile, tablet, desktop | — |
| `CMP-CHART-TOOLTIP-01` | Chart tooltip | component | system | neutral | mobile, tablet, desktop | — |
| `CMP-SPARKLINE-01` | Sparkline | component | system | neutral | mobile, tablet, desktop | — |
| `CMP-KPI-01` | KPI tile | component | system | neutral | mobile, tablet, desktop | 4 |
| `CMP-HABIT-TILE-01` | Habit tile | component | system | neutral | mobile, tablet, desktop | — |
| `CMP-DAY-BAR-01` | Day progress bar | component | system | neutral | mobile, tablet, desktop | — |
| `CMP-TIMEBLOCK-01` | Time block header | component | system | neutral | mobile, tablet, desktop | — |
| `CMP-HABIT-EDITOR-01` | Habit editor | component | system | neutral | mobile, tablet, desktop | — |

## Экраны

### SCR-LIST-01 — Список

Найти объект и открыть его

- Платформы: mobile, tablet, desktop
- Обязательные компоненты: `CMP-SEARCH-01`, `CMP-CHIPS-01`, `CMP-LIST-01`, `CMP-PAGER-01`, `CMP-EMPTY-01`
- Состояния: empty, loading, error
- Главное действие: открыть объект

### SCR-DETAIL-01 — Деталка

Понять объект и совершить действие

- Платформы: mobile, tablet, desktop
- Обязательные компоненты: `CMP-BTN-01`, `CMP-BTN-02`, `CMP-TABS-01`, `CMP-TOAST-01`, `CMP-ERROR-01`
- Состояния: loading, error
- Главное действие: основное действие

### SCR-FORM-01 — Форма

Собрать данные без ошибок

- Платформы: mobile, tablet, desktop
- Обязательные компоненты: `CMP-INPUT-01`, `CMP-SELECT-01`, `CMP-CHECK-01`, `CMP-BTN-01`, `CMP-ERROR-01`
- Состояния: error
- Главное действие: сохранить

### SCR-DASHBOARD-01 — Дашборд

Увидеть картину и отклонения

- Платформы: tablet, desktop
- Обязательные компоненты: `CMP-TABLE-01`, `CMP-TOOLBAR-01`, `CMP-PROGRESS-01`, `CMP-EMPTY-01`, `CMP-KPI-01`, `CMP-CHART-01`, `CMP-CHART-LEGEND-01`
- Состояния: loading, empty, error, partial
- Главное действие: экспорт

### SCR-SETTINGS-01 — Настройки

Изменить поведение продукта

- Платформы: mobile, tablet, desktop
- Обязательные компоненты: `CMP-SWITCH-01`, `CMP-SEGMENTED-01`, `CMP-SELECT-01`, `CMP-BTN-01`
- Состояния: success
- Главное действие: сохранить

### SCR-AUTH-01 — Вход

Попасть в продукт

- Платформы: mobile, tablet, desktop
- Обязательные компоненты: `CMP-INPUT-01`, `CMP-BTN-01`, `CMP-ERROR-01`
- Состояния: error
- Главное действие: войти

### SCR-ONBOARDING-01 — Онбординг

Довести до первого результата

- Платформы: mobile, tablet
- Обязательные компоненты: `CMP-STEPPER-01`, `CMP-BTN-01`
- Состояния: —
- Главное действие: продолжить

### SCR-STATES-01 — Состояния данных

Не оставлять пользователя без объяснения

- Платформы: mobile, tablet, desktop
- Обязательные компоненты: `CMP-EMPTY-01`, `CMP-LOADING-01`, `CMP-ERROR-01`
- Состояния: empty, loading, error, offline
- Главное действие: повторить

### SCR-LANDING-01 — Лендинг

За 5 секунд понять продукт и сделать первый шаг

- Платформы: mobile, tablet, desktop
- Обязательные компоненты: `CMP-BTN-01`, `CMP-INPUT-01`
- Состояния: —
- Главное действие: главный CTA в первом экране

### SCR-CHECKOUT-01 — Оплата

Завершить покупку без сюрпризов

- Платформы: mobile, tablet, desktop
- Обязательные компоненты: `CMP-ORDER-SUMMARY-01`, `CMP-PAYMENT-01`, `CMP-INPUT-01`, `CMP-BTN-01`, `CMP-ERROR-01`
- Состояния: loading, error, success
- Главное действие: оплатить

### SCR-COMPARE-01 — Сравнение

Выбрать из двух–четырёх вариантов

- Платформы: tablet, desktop
- Обязательные компоненты: `CMP-COMPARE-TABLE-01`, `CMP-CHIPS-01`, `CMP-EMPTY-01`
- Состояния: empty, error
- Главное действие: выбрать вариант

### SCR-ACCOUNT-01 — Аккаунт

Управлять профилем и доступом

- Платформы: mobile, tablet, desktop
- Обязательные компоненты: `CMP-AVATAR-01`, `CMP-INPUT-01`, `CMP-SWITCH-01`, `CMP-BTN-01`, `CMP-ALERT-01`
- Состояния: error, success
- Главное действие: сохранить

### SCR-ORDERS-01 — Заказы

Найти заказ и понять его статус

- Платформы: mobile, tablet, desktop
- Обязательные компоненты: `CMP-LIST-01`, `CMP-STATUS-01`, `CMP-CHIPS-01`, `CMP-PAGER-01`, `CMP-EMPTY-01`
- Состояния: empty, loading, error
- Главное действие: открыть заказ

### SCR-CALC-01 — Калькулятор

Ввести число и выполнить действие

- Платформы: mobile, tablet, desktop
- Обязательные компоненты: `CMP-BTN-01`, `CMP-BTN-02`, `CMP-MENU-01`, `CMP-MODAL-01`
- Состояния: —
- Главное действие: вычислить

### SCR-ANALYTICS-01 — Аналитика

Увидеть динамику, отклонение и причину

- Платформы: tablet, desktop
- Обязательные компоненты: `CMP-KPI-01`, `CMP-CHART-01`, `CMP-CHART-02`, `CMP-CHART-04`, `CMP-CHART-LEGEND-01`, `CMP-CHART-TOOLTIP-01`, `CMP-TABLE-01`, `CMP-TOOLBAR-01`, `CMP-EMPTY-01`, `CMP-ERROR-01`
- Состояния: empty, loading, error, partial
- Главное действие: разобраться в отклонении

### SCR-HABIT-01 — Планер привычек (e-ink)

Отметить привычки дня одним касанием и увидеть пропуски

- Платформы: mobile, tablet
- Обязательные компоненты: `CMP-HABIT-TILE-01`, `CMP-DAY-BAR-01`, `CMP-HABIT-EDITOR-01`, `CMP-BTN-01`, `CMP-EMPTY-01`, `CMP-ALERT-01`, `CMP-TOAST-01`
- Состояния: empty, offline
- Главное действие: отметить привычку


## Сценарии

Core: **16**, покрыто **11**, частично **3**, без экрана **2** (ratio 0.781).

| ID | Сценарий | Приоритет | Покрытие |
|---|---|---|---|
| `SCN-DISCOVER` | Понять, что это и подходит ли | core | covered |
| `SCN-SEARCH` | Найти нужное | core | covered |
| `SCN-FILTER` | Сузить выбор | core | covered |
| `SCN-COMPARE` | Сравнить варианты | core | covered |
| `SCN-EVALUATE` | Изучить детали | core | covered |
| `SCN-SAVE` | Сохранить на потом | core | partial |
| `SCN-BOOK` | Забронировать с датами | core | partial |
| `SCN-CHECKOUT` | Оплатить | core | covered |
| `SCN-CONFIRM` | Получить подтверждение | core | partial |
| `SCN-AUTH` | Войти и восстановить доступ | core | covered |
| `SCN-ACCOUNT` | Управлять профилем | core | covered |
| `SCN-ORDERS` | История и статус | core | covered |
| `SCN-SUPPORT` | Получить помощь | core | missing |
| `SCN-NOTIFY` | Узнать о событии | core | missing |
| `SCN-SETTINGS` | Настроить под себя | core | covered |
| `SCN-ONBOARD` | Первый запуск | secondary | covered |
| `SCN-CONTENT` | Прочитать материал | secondary | covered |
| `SCN-SHARE` | Поделиться | secondary | partial |
| `SCN-REVIEWS` | Оценки и отзывы | secondary | partial |
| `SCN-UPLOAD` | Загрузить файл | secondary | partial |
| `SCN-EXPORT` | Выгрузить отчёт | secondary | partial |
| `SCN-CONSENT` | Согласия и legal | secondary | missing |
| `SCN-ERRORS` | 404/500 | secondary | partial |
| `SCN-OFFLINE` | Нет сети | secondary | partial |
| `SCN-TEAM` | Команда и роли | secondary | missing |
| `SCN-BILLING` | Подписка и счета | secondary | missing |
| `SCN-LANGUAGE` | Сменить язык | secondary | covered |
| `SCN-ACCESSIBILITY` | Размер текста и motion | secondary | partial |
| `SCN-PRINT` | Печать/PDF | secondary | missing |
| `SCN-MAP` | Найти на карте | secondary | missing |
| `SCN-MEASURE` | Понять, что происходит с метрикой | core | covered |
| `SCN-ANOMALY` | Найти и объяснить отклонение | secondary | covered |

## Агентская поверхность

WebMCP: **origin-trial**, review_by 2027-01-26. Инструментов: 15.

| Инструмент | Экран | read-only | подтверждение |
|---|---|---|---|
| `search_catalog` | SCR-LIST-01 | да | none |
| `filter_catalog` | SCR-LIST-01 | да | none |
| `get_item` | SCR-DETAIL-01 | да | none |
| `compare_items` | SCR-COMPARE-01 | да | none |
| `get_order_summary` | SCR-CHECKOUT-01 | да | none |
| `apply_promo` | SCR-CHECKOUT-01 | нет | inline |
| `place_order` | SCR-CHECKOUT-01 | нет | dialog |
| `get_order_status` | SCR-ORDERS-01 | да | none |
| `get_profile` | SCR-ACCOUNT-01 | да | none |
| `update_profile` | SCR-ACCOUNT-01 | нет | inline |
| `set_theme` | SCR-SETTINGS-01 | нет | none |
| `get_sales_summary` | SCR-DASHBOARD-01 | да | none |
| `search_orders` | SCR-ORDERS-01 | да | none |
| `filter_orders` | SCR-ORDERS-01 | да | none |
| `create_order` | SCR-ORDERS-01 | нет | dialog |

## Иконки

Семейство: **Material Symbols**. Размеры: 16, 20, 24, 32.

| Действие | Иконка |
|---|---|
| add | `add` |
| apps | `apps` |
| attach | `attach_file` |
| back | `arrow_back` |
| bookmark | `bookmark` |
| calendar | `calendar_today` |
| call | `call` |
| camera | `photo_camera` |
| card | `credit_card` |
| cart | `shopping_cart` |
| chart | `bar_chart` |
| chat | `chat` |
| check | `check` |
| close | `close` |
| dashboard | `dashboard` |
| delete | `delete` |
| download | `download` |
| edit | `edit` |
| error | `error` |
| favorite | `favorite` |
| file | `description` |
| filter | `filter_list` |
| flight | `flight` |
| folder | `folder` |
| forward | `arrow_forward` |
| grid | `grid_view` |
| help | `help` |
| hiking | `hiking` |
| home | `home` |
| hotel | `hotel` |
| image | `image` |
| info | `info` |
| language | `language` |
| link | `link` |
| list | `list` |
| location | `location_on` |
| lock | `lock` |
| logout | `logout` |
| mail | `mail` |
| map | `map` |
| menu | `menu` |
| more | `more_vert` |
| notifications | `notifications` |
| orders | `receipt_long` |
| palette | `palette` |
| pause | `pause` |
| play | `play_arrow` |
| profile | `person` |
| refresh | `refresh` |
| remove | `remove` |
| restaurant | `restaurant` |
| search | `search` |
| send | `send` |
| settings | `settings` |
| share | `share` |
| shipping | `local_shipping` |
| sort | `sort` |
| support | `support_agent` |
| sync | `sync` |
| table | `table_chart` |
| team | `group` |
| terrain | `terrain` |
| theme | `dark_mode` |
| time | `schedule` |
| tune | `tune` |
| upload | `upload` |
| verified | `verified` |
| visibility | `visibility` |
| wallet | `account_balance_wallet` |
| warning | `warning` |

## Эмодзи

Эмодзи — только растровые/векторные картинки из набора Fluent (MIT), не системный шрифт: Apple, Windows и Android рисуют по-разному и ломают вёрстку. 3D — иллюстрации и онбординг, Flat — рядом с текстом. Внутри кнопок и полей эмодзи не используются; декоративные — alt="".

Набор: Fluent Emoji. Разрешено: 3d, flat.

## Приёмка

- Каждый компонент в коде объявлен в контракте через data-dg-component
- Экран объявлен через data-dg-screen и содержит обязательные компоненты
- Состояния empty / loading / error / offline реализованы там, где заявлены
- Один accent-компонент на экран; accent-бюджет описан в usage.maxPerScreen
- Все иконки — из карты icons.map, одно семейство, размеры 20/24/32
- Эмодзи только картинками Fluent (3D/Flat), не системным шрифтом и не в контролах
- Обе темы проходят design_audit без ошибок
