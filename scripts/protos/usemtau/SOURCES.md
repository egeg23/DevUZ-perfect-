# Юсем Тау: откуда что в макете

Снято 20.10.2026 с usemtau.kz (curl с user agent `DevUzBot/1.0`).

| Что | Откуда |
|---|---|
| 268 позиций и цены за тонну | `/shop/`, страницы 1-11 → `items-src.json` |
| Адрес, почта, часы | `/contact/`: Алматы, Бурундайское шоссе 1 км, дом 1В; usemtau@mail.ru; пн-пт 08:00-19:00 |
| Телефон | шапка сайта: +7 (705) 504 00 23 |
| WhatsApp | виджет Chaty на сайте: `whatsapp.com/send?phone=77014015624` |
| Доставка и оплата | `/sample-page/` (пункт меню «Доставка и оплата»): по Казахстану транспортной компанией, при больших объёмах бесплатно, оплата на расчётный счёт |
| Обещания | главная: «Бесплатная доставка на все заказы», «гарантия от 1 до 3 лет», «без посредников» |
| Гофробалки, сэндвич-панели, ангары | `/services/proizvodstvo-gofrobalok/`, `/services/montazh-sendvich-panelej/`, `/services/stroitelstvo-angarov/` |
| Типы объектов | пункты меню «Проектирование и строительство …» |

Фото (`photos.py` → `public/protos/usemtau`), все с `wp-content/uploads`:

| Файл | Исходник |
|---|---|
| `mark.webp`, `icon-192.png`, `apple-180.png` | `2023/07/cropped-icon.png` (их знак) |
| `word.webp` | `2020/04/1-1-600x567.png` (надпись «ЮСЕМ ТАУ») |
| `angar.webp` | `2023/07/stroitelstvo-angarov.jpg` |
| `sklad.webp` | `2023/07/stroitelstvo-skladov.jpg` |
| `prom.webp` | `2023/07/stroitelstvo-promyshlennyh-zdanij.jpg` |
| `sport.webp` | `2023/07/stroitelstvo-sportivnyh-sooruzhenij.jpg` |
| `gofro.webp` | `2023/07/proizvodstvo-gofrobalok.jpg` |
| `sendvich.webp` | `2023/07/montazh-sendvich-panelej.jpg` |
| `karkas.webp` | `2020/03/fgbgbfgbf.jpg` |

Самое крупное фото на сайте — 1088 px, поэтому первый экран и сцена нарисованы кодом.
Карточки компании в 2ГИС поиском не нашли; ссылка «Открыть в 2ГИС» ведёт на поиск адреса.

Вес метра — ГОСТ 8240 (швеллер), 8239 и 26020 (балки), остальное по геометрии
сечения и плотности 7 850 кг/м³. Демо: тарифы доставки, порог 10 т, пример здания.
