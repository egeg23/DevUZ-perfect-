# Прототип AUTOMECHANIC (automechanic.uz) — исходники

Автосервис в Ташкенте, Чиланзар. Пять страниц на двух языках (ru, uz):
главная, `uslugi`, `zapis`, `kontakty`, `plan` («Что дальше»), плюс
`offline`, `manifest` и `sw` — «сайт как приложение». Исследование —
`docs/research/autoservice-tashkent.md`, фото — `SOURCES.md`.

- `gen.mjs` собирает страницы в `out/pages.json` и сборку для сервера
  `content/proto-bundles/automechanic.json` (lib/proto/bundles). Ссылки — через
  `__PROTO_BASE__`, токен подставляется при показе, отпечаток ставится зерном
  из `protos.stamp`.
- `plan.mjs` — конструктор: сайт 1 000 $, допы с ценами и расчётом.
- `client.js` — сцены по прокрутке (requestAnimationFrame, без перехвата
  прокрутки, только transform и opacity), запись, «было / стало», установка,
  конструктор. `sw.js` — офлайн-страница и память для открытых страниц.
- `photos.py` — слои фото в `public/protos/automechanic/`.
- `serve.mjs` — локальный показ: `node serve.mjs`, затем
  `http://localhost:4790/proto/<43 символа>/`.
- `check.mjs` — Chromium, 390×844 и 1440×900: горизонтальная прокрутка,
  ошибки скрипта, снимки сцен. `node check.mjs <папка для снимков>`.

Манифест и service worker отдаются по адресам прототипа со своим типом и не
пишутся в журнал показа (`protoContentType`, `isQuietProtoPath` в
`lib/proto/pages.ts`). Модель прототип не вызывает: ни ProxyAPI, ни
`/api/proto-ai`.

В базе — обычная запись `protos` с `facts.bundle = "automechanic"`.
