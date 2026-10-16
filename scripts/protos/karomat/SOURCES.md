# Karomat: откуда фото и данные

Все снимки — собственные материалы ресторана Karomat. Стоков и сгенерированных
картинок нет.

| Файлы в `public/protos/karomat` | Откуда |
|---|---|
| `d-<id>.webp` (127) | фото блюд из меню сайта: `https://karomat.felixits.uz/resources/media/products/…`, API, которое читает `karomat-restaurant.uz/menu` |
| `p-<id>.webp` (9) | те же фото: вырезан овал вокруг тарелки для стола первого экрана |
| `yt-<id>.webp` (5) | обложки их Shorts на `youtube.com/@Karomat_restaurant` |
| `logo.webp`, `icon-192.png`, `apple-180.png` | `karomat-restaurant.uz/images/karomat-logo.png` |
| `gsap.min.js`, `ScrollTrigger.min.js` | GSAP 3.13 (GreenSock, бесплатная лицензия), как в Amani |

Данные: меню и цены — `menu-src.json` (API их сайта, 16.10.2026); адрес, телефон,
часы — karomat-restaurant.uz; отзывы и оценка — Яндекс Карты
(`yandex.uz/maps/org/223173940753/reviews`); названия Shorts — их канал.
