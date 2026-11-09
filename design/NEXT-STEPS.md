# Следующие шаги

Сгенерировано 2026-11-10T02:24:45. Открыто пунктов: 4 (блокирующих: 4).

## Нужно от вас (4)

- [ ] **GA4 measurement ID** — без него нет analytics_storage, web_vitals и канала AI Assistant
      Куда: `inputs.local.json → ga4`
      Пример: `G-XXXXXXX`

- [ ] **Номер счётчика Яндекс Метрики** — автоцели на tel:/mailto:, Вебвизор, ecommerce
      Куда: `inputs.local.json → metrica`
      Пример: `12345678`

- [ ] **Подтверждение Google Search Console** — без него не видно индексацию и AI-отчёт
      Куда: `inputs.local.json → google_site_verification`
      Пример: `DNS TXT или meta-код`

- [ ] **Подтверждение Яндекс Вебмастера** — переобход, видимость в Алисе AI, IndexNow-лимиты
      Куда: `inputs.local.json → yandex_verification`
      Пример: `код из Вебмастера`

## Сделает агент (0)

_нет открытых пунктов_

## Закрыто (3)

- [x] Домен сайта
- [x] Название организации
- [x] Ключ IndexNow

## Проверка

```bash
python3 scripts/design_inputs.py --check
python3 scripts/design_audit.py . --live "file://$PWD/index.html"
```
