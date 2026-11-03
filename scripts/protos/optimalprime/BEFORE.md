# Сайт клиента до макета: optimal-prime.uz

Снято: 2026-11-03T16:45:36.642Z (3 ноября 2026 г. в 21:45 по Ташкенту), `node scripts/protos/site-before.mjs optimalprime https://optimal-prime.uz/`.
Правило — CLAUDE.md, «Сайт клиента — снимок до макета».

## Код

Их код открытым в репозиторий не кладём: он архивом под шифром — `docs/screens/optimalprime/before/code-2026-11-03.enc` (AES-256-GCM, SHA-256
архива `919aedb0efe81e586e77034966dee0cadf15b080cf6b40d81fb7f443bca4080b`). Ключ — в хранилище секретов: `app.SITE_BEFORE_OPTIMALPRIME_20261103`. Открыть:

```sh
KEY=<ключ из хранилища> node -e 'const c=require("crypto"),f=require("fs"),b=f.readFileSync("docs/screens/optimalprime/before/code-2026-11-03.enc");
const d=c.createDecipheriv("aes-256-gcm",Buffer.from(process.env.KEY,"hex"),b.subarray(0,12));d.setAuthTag(b.subarray(12,28));
f.writeFileSync("code.tar.xz",Buffer.concat([d.update(b.subarray(28)),d.final()]))' && tar -xJf code.tar.xz
```

## Снимки

- `docs/screens/optimalprime/before/ru-1440.webp`
- `docs/screens/optimalprime/before/ru-390-1.webp`
- `docs/screens/optimalprime/before/ru-390-2.webp`
- `docs/screens/optimalprime/before/uz-1440.webp`
- `docs/screens/optimalprime/before/en-1440.webp`

## Страницы и файлы

| Что | Адрес | Ответ | Размер | SHA-256 |
|---|---|---|---|---|
| страница | https://optimal-prime.uz/ | 200 | 84829 | `02de7d7aa1af3fec963503096f1c334f51742735d0e99ba8ab0023eb84485718` |
| картинка | https://optimal-prime.uz/assets/favicon.svg | 200 | 815 | `d99563664a4d11a993f8c48c370e6feade144259070ac8bd8cc8c5c66f196926` |
| стили | https://optimal-prime.uz/style.css | 200 | 2391 | `9dfac0ea66c666fb50d659ef46dd8d627122906ab61a80f44694d9315d6f9d07` |
| скрипт | https://optimal-prime.uz/script.js | 200 | 16126 | `590bda43d60cb2c975060a3950ef41f2d3ae794e3e2ad982cb9cafed035c83f3` |
| картинка | https://optimal-prime.uz/assets/logo-mark.svg | 200 | 804 | `56a9d3af2690d3bd1c6b61b66379ca794157965e023e2ab4064dd868389b4250` |
| страница | https://optimal-prime.uz/uz/ | 200 | 73668 | `e1547f2d8f06a4fa26c52292a52ab6df329d0755c5ffd87a742a5331a9e76d18` |
| страница | https://optimal-prime.uz/en/ | 200 | 73031 | `7be21292e40b18078d41414aad2d6f9b16d3b307c2796744501b1496e891b872` |

Заголовки ответа главной:

- date: Tue, 03 Nov 2026 16:45:05 GMT
- etag: "e26e139948d5e3dbf56ed0991c8b343f-ssl-df"
- server: Netlify
- content-type: text/html; charset=UTF-8

## Подключено со стороны

- https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap
- https://cdn.tailwindcss.com/
- https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js
- https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js

## Цвета (по частоте) и шрифты

`#c8963e` ×62, `#0f1f3d` ×45, `#eee8df` ×29, `#ffffff` ×17, `#1b3a5c` ×15, `#f4f1ec` ×15, `#229ed9` ×12, `#b8862e` ×3, `#1a8bc2` ×3

- Inter
