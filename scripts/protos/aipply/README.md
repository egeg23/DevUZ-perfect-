# Прототип Aipply Academy (aipply.uz) — исходники

Курсы «Kompyuter savodxonligi + AI» в Ташкенте, Шайхантахурский район.
Восемь страниц: главная, `kurs`, `ochiq-dars`, `plan` («Keyingi qadam») на
узбекском и те же в `ru/`. Каркас — ПК Веста (`scripts/protos/pkvesta`):
шапка, промо DevUz, конструктор, «было / стало». Сцена при прокрутке — по
движку Engelberg v2. Исследование — `docs/research/aipply.md`, снимки —
`SOURCES.md`, заходы 21st.dev — `21ST.md`.

- `gen.mjs` собирает `out/pages.json` и `content/proto-bundles/aipply.json`.
- `intro.js` — промо DevUz Studio, знак Aipply из трёх полос, влёт в просвет
  между полосами: просвет — дыра в заставке, сквозь неё виден первый экран.
- `story.js` — «Kompyuter noldan»: липкая сцена, ноутбук кодом, камера
  вписывает в экран нужное окно (документ, таблица, браузер, ИИ, файлы,
  сертификат), подписи — семь пунктов «o‘rganasiz» с их сайта.
- `client.js` — параллакс и стекло первого экрана, появление блоков, тест
  уровня, запись на открытый урок в Telegram академии, конструктор.
- `plan.mjs` — сайт 1 300 $, все допы 1 700 $, итог 3 000 $.
- `photos.py` — снимок преподавателя и значки вкладки.
- `serve.mjs` — локальный показ: `node serve.mjs`, затем
  http://localhost:4793/proto/<43 символа>/

Перед сдачей: `node --import ./tests/alias-hook.mjs --import
./tests/tsx-hook.mjs scripts/proto-plain.mjs aipply` — должно быть «Чисто».
