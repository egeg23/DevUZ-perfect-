# Источники Neoline

Всё снято 29.10.2026 с их открытого сайта, без MCP и без генераций.

- Товары, цены, наличие, описания uz и ru — `https://neoline.uz/wp-json/wc/store/v1/products?per_page=100` (uz) и `…&lang=ru` (ru), разбор — `catalog.py` → `catalog.json`.
- Фото товаров — их файлы из `wp-content/uploads` (до 2560 px, PNG с прозрачностью), только вырезанные кадры; баннеры-обложки с текстом и фото в машине не берём. `photos.py` → `public/protos/neoline/p/*.webp` (главный кадр 1600 и 800 px, ракурсы 1200 px, стенд X-COP 8900 — 1600 px).
- Знак — вектор из `wp-content/themes/neoline/images/logo.svg` (две половины «N», `#00ABEB`).
- Тексты о компании, доставке, гарантии, поддержке и обновлениях — их страницы `about-us`, `shipping`, `return-policy`, `support`, `update` (uz и `/ru/…-ru/`), переписаны без длинных тире.
- Радары, камеры ПДД, зона тишины — описания X-COP 8800s и 9700s с их сайта.
- Шрифты — Unbounded и Manrope (Google Fonts, OFL); буквы заставки — Unbounded 700 (`intro/face.mjs` → `intro/unb.json`).
- Отражения в заставке — RoomEnvironment из three.js (кодом), картинок окружения нет.
