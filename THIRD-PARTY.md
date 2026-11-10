# Сторонние материалы

Проект использует открытые ресурсы. Ниже — что именно, под какой лицензией и
где это лежит в коде.

## Phosphor Icons

- **Что:** 45 иконок (27 привычек + 18 интерфейсных).
- **Где:** `js/core/icons.js` — SVG-пути вшиты в модуль, внешних запросов нет.
- **Версия:** `@phosphor-icons/core` 2.1.1, начертание **Bold**.
- **Лицензия:** MIT.
- **Сайт:** https://phosphoricons.com

```
MIT License

Copyright (c) 2023 Phosphor Icons

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## Шрифты

Внешних шрифтов нет. Используется системный стек:

```
system-ui, -apple-system, "Segoe UI", Roboto, "Noto Sans", sans-serif
```

Это осознанное решение: на e-ink лишний сетевой запрос и подгрузка веб-шрифта
дают мигание и лишний расход батареи, а системный шрифт уже оптимизирован под
экран устройства.

## Что не используется

Ни аналитики, ни трекеров, ни CDN, ни внешних API. Проверить можно так:

```bash
grep -rn "https\?://" js/ index.html styles.css sw.js | grep -v "w3.org\|schema.org\|github.com\|phosphoricons"
```

Политика `Content-Security-Policy` в `index.html` дополнительно запрещает
сетевые запросы из приложения (`connect-src 'none'`).
