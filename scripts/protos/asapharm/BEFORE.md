# Сайт клиента до макета: asapharmacademy.uz

Снято: 2026-11-20T10:33:04.742Z (20 ноября 2026 г. в 15:33 по Ташкенту), `node scripts/protos/site-before.mjs asapharm https://asapharmacademy.uz/`.
Правило — CLAUDE.md, «Сайт клиента — снимок до макета».

## Код

Их код открытым в репозиторий не кладём: он архивом под шифром — `docs/screens/asapharm/before/code-2026-11-20.enc` (AES-256-GCM, SHA-256
архива `f2a9482562d4bda683a6a3879c4087dc63c91a75a5b38b68303a57b926289ab1`). Ключ — в хранилище секретов: `app.SITE_BEFORE_ASAPHARM_20261120`. Открыть:

```sh
KEY=<ключ из хранилища> node -e 'const c=require("crypto"),f=require("fs"),b=f.readFileSync("docs/screens/asapharm/before/code-2026-11-20.enc");
const d=c.createDecipheriv("aes-256-gcm",Buffer.from(process.env.KEY,"hex"),b.subarray(0,12));d.setAuthTag(b.subarray(12,28));
f.writeFileSync("code.tar.xz",Buffer.concat([d.update(b.subarray(28)),d.final()]))' && tar -xJf code.tar.xz
```

## Снимки

- `docs/screens/asapharm/before/home-1440.webp`
- `docs/screens/asapharm/before/home-390.webp`

## Страницы и файлы

| Что | Адрес | Ответ | Размер | SHA-256 |
|---|---|---|---|---|
| страница | https://asapharmacademy.uz/ | 200 | 198516 | `460cc361bbcbdfcbd6758b4a67f22e45b1030703d679761d08f32cbf4a3b2ff7` |

Заголовки ответа главной:

- date: Fri, 20 Nov 2026 10:32:41 GMT
- last-modified: Thu, 19 Nov 2026 10:14:56 GMT
- etag: "30774-6609e664184fb-gzip"
- server: ddos-guard
- content-type: text/html; charset=UTF-8

## Подключено со стороны

- https://static.tildacdn.net/tild3633-3436-4737-a533-393361373864/favicon.svg
- https://static.tildacdn.net/tild3836-6539-4638-a434-383537373831/Logo-4848-Photoroom.png
- https://static.tildacdn.net/tild6331-6239-4331-a666-353730303036/Logo-197197.png
- https://static.tildacdn.net/css/tilda-grid-3.0.min.css
- https://static.tildacdn.net/ws/project12049485/tilda-blocks-page62472965.min.css?t=1795083296
- https://static.tildacdn.net/css/tilda-animation-2.0.min.css
- https://static.tildacdn.net/css/tilda-cover-1.0.min.css
- https://static.tildacdn.net/css/tilda-cards-1.0.min.css
- https://static.tildacdn.net/css/tilda-slds-1.4.min.css
- https://static.tildacdn.net/css/tilda-forms-1.0.min.css
- https://static.tildacdn.net/css/fonts-tildasans.css
- https://neo.tildaapi.one/js/tilda-fallback-1.0.min.js
- https://static.tildacdn.net/js/tilda-polyfill-1.0.min.js
- https://static.tildacdn.net/js/tilda-scripts-3.0.min.js
- https://static.tildacdn.net/ws/project12049485/tilda-blocks-page62472965.min.js?t=1795083296
- https://static.tildacdn.net/js/tilda-lazyload-1.0.min.js
- https://static.tildacdn.net/js/tilda-animation-2.0.min.js
- https://static.tildacdn.net/js/tilda-menu-1.0.min.js
- https://static.tildacdn.net/js/tilda-cover-1.0.min.js
- https://static.tildacdn.net/js/tilda-cards-1.0.min.js
- https://static.tildacdn.net/js/hammer.min.js
- https://static.tildacdn.net/js/tilda-slds-1.4.min.js
- https://static.tildacdn.net/js/tilda-forms-1.0.min.js
- https://static.tildacdn.net/js/tilda-undercut-1.0.min.js
- https://static.tildacdn.net/js/tilda-skiplink-1.0.min.js
- https://static.tildacdn.net/js/tilda-events-1.0.min.js
- https://static.tildacdn.net/tild6165-3232-4638-a232-646533623065/vector.svg
- https://static.tildacdn.net/tild3636-6138-4530-a366-396537383836/vector.svg
- https://static.tildacdn.net/tild3062-3234-4130-b962-323961316438/vector.svg

## Цвета (по частоте) и шрифты

`#ffffff` ×72, `#2348c6` ×71, `#000000` ×13, `#ecf0ff` ×11, `#222222` ×8, `#ff8562` ×6

- TildaSans
- 'TildaSans'
