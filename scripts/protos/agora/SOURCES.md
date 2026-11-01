# Agora: откуда фото и данные

Higgsfield в этом макете не используется: ни картинок, ни видео. Фото —
их собственные из меню rezvo; где у блюда фото нет или стоит заглушка rezvo
(логотип на чёрном), взят снимок того же блюда с Unsplash (лицензия Unsplash:
https://unsplash.com/license, бесплатно для коммерческого использования, без
указания автора). Все файлы сжаты в WebP без увеличения: блюда до 1280 px,
зал до 1680 px; снимки уже 560 px не взяты (бутылки 222-571 px).

## Данные

| Что | Откуда |
|---|---|
| Меню: 382 позиции, 25 разделов, цены в сумах, граммовка, описания, стоп-лист | API их меню rezvo: `https://api2.rezvo.uz/api/menu/restaurants/95645b7d-8b76-4296-8a86-4ccc4578d160` (страница https://merchant.rezvo.uz/v/95645b7d-8b76-4296-8a86-4ccc4578d160/menu), 01.11.2026 → `menu-src.json` |
| Название, описание, адрес «ул. Амира Темура 15», координаты, телефон +998 97 422 88 88, Instagram agora.lounge, кухни | там же, `venue` |
| Касса iiko | там же: у каждой позиции `externalSource: iiko` |
| Часы 10:00-03:00 ежедневно, второй номер, ориентир | Golden Pages: https://www.goldenpages.uz/en/company/?Id=117521 (обновлено 07.04.2026). В rezvo стоит «круглосуточно» — подтвердить у клиента |
| Instagram agora.tashkent | из задачи; без входа Instagram показывает только страницу входа, оттуда ничего не взято |

Кальянные разделы меню («ЛЕГКИЙ», «СРЕДНИЙ», «КРЕПКИЙ», «КАЛЬЯН», 145 позиций)
на сайт не выносим: реклама табака. В панели и в iiko они остаются.

## Логотип

`logo.svg` (в разметке символом, файлом не лежит) — обводка их обложки rezvo
`venue.cover` (https://cdn.rezvo.uz/rezvo/venue.cover/af4b6bdb-00ce-4fdd-a974-abe3991b4957.png),
potracer, белые буквы и красная чаша отдельными контурами.

## Зал: `h-<n>.webp`, `h-<n>-s.webp`, `h-<n>-b.webp`

12 фото галереи их меню rezvo (`venue.gallery`, https://cdn.rezvo.uz/rezvo/venue.gallery/…):
- `h-0` — https://cdn.rezvo.uz/rezvo/venue.gallery/94538fad-b9e3-43a3-a44a-6851e8eaa44e.webp
- `h-1` — https://cdn.rezvo.uz/rezvo/venue.gallery/ac0b3f97-90c9-4dfc-b95a-b1e8619c3a3e.png
- `h-2` — https://cdn.rezvo.uz/rezvo/venue.gallery/54220163-8bb0-48c2-be09-6bfecb1f30d3.png
- `h-3` — https://cdn.rezvo.uz/rezvo/venue.gallery/fdcb8a0a-341f-4baa-984a-1d86e2b21e89.png
- `h-4` — https://cdn.rezvo.uz/rezvo/venue.gallery/6e25181b-090b-43b3-a7e1-a75ac33ac186.png
- `h-5` — https://cdn.rezvo.uz/rezvo/venue.gallery/3e8f5dd7-e958-4f83-9be8-06fe0f2e93e4.png
- `h-6` — https://cdn.rezvo.uz/rezvo/venue.gallery/d1601613-feb0-422d-a237-73a4717ae2b7.png
- `h-7` — https://cdn.rezvo.uz/rezvo/venue.gallery/12d82d92-a0a8-46b1-b9dd-19243c785954.png
- `h-8` — https://cdn.rezvo.uz/rezvo/venue.gallery/3527b944-f44f-4706-8525-0221732136ce.png
- `h-9` — https://cdn.rezvo.uz/rezvo/venue.gallery/58946f13-2d95-4a95-99f0-3c1c58b40041.png
- `h-10` — https://cdn.rezvo.uz/rezvo/venue.gallery/90313488-7c9a-487e-9457-6be9736d0f35.jpeg
- `h-11` — https://cdn.rezvo.uz/rezvo/venue.gallery/0403cdde-7ebe-4f64-a54d-bfe35caa38b7.png

## Блюда: `d-<id>.webp`, `d-<id>-s.webp`

| Файл | Позиция меню | Источник |
|---|---|---|
| `d-9074d65b` | Мясное ассорти | их фото rezvo |
| `d-7d58155f` | Сырная тарелка | Unsplash, photo-1452195100486-9cc805987862 (https://images.unsplash.com/photo-1452195100486-9cc805987862), лицензия Unsplash |
| `d-e2a117a8` | Овощная нарезка | их фото rezvo |
| `d-c2b3219f` | Маринованное ассорти | их фото rezvo |
| `d-2f1933f1` | Сельд по домашнему | их фото rezvo |
| `d-521e342a` | Вителло тоннато | их фото rezvo |
| `d-a6fab064` | Оливье | их фото rezvo |
| `d-bee9dfbd` | Цезарь | Unsplash, photo-1550304943-4f24f54ddde9 (https://images.unsplash.com/photo-1550304943-4f24f54ddde9), лицензия Unsplash |
| `d-2d8ef8c4` | Салат Хрустящий баклажан с говядиной | их фото rezvo |
| `d-b13f3b5e` | Греческий | их фото rezvo |
| `d-3b260f43` | Тёплый салат с куриной печенью | их фото rezvo |
| `d-534cf0b4` | Острый тёплый салат с баклажанами | их фото rezvo |
| `d-2a99f514` | Буррата с розовыми помидорами | их фото rezvo |
| `d-8ffbb062` | Капрезе | их фото rezvo |
| `d-0abed2ac` | Фирменный салат Агора | их фото rezvo |
| `d-8b5b6d6a` | Четыре сезона | их фото rezvo |
| `d-775c0b5e` | Лимонад Манго-Маракуя | Unsplash, photo-1546173159-315724a31696 (https://images.unsplash.com/photo-1546173159-315724a31696), лицензия Unsplash |
| `d-71d739ec` | Айс ти 1л | Unsplash, photo-1556679343-c7306c1976bc (https://images.unsplash.com/photo-1556679343-c7306c1976bc), лицензия Unsplash |
| `d-5519ea54` | Лимонад Ягодный | Unsplash, photo-1497534446932-c925b458314e (https://images.unsplash.com/photo-1497534446932-c925b458314e), лицензия Unsplash |
| `d-5b241d36` | Мохито | Unsplash, photo-1551538827-9c037cb4f32a (https://images.unsplash.com/photo-1551538827-9c037cb4f32a), лицензия Unsplash |
| `d-3946bc5b` | Лимонад классический | Unsplash, photo-1621263764928-df1444c5e859 (https://images.unsplash.com/photo-1621263764928-df1444c5e859), лицензия Unsplash |
| `d-a59c3e24` | Сулугуни жаренный | их фото rezvo |
| `d-616ff0ea` | Охотничьи колбаски | их фото rezvo |
| `d-fb719ce4` | Сендвич с куриный филе | их фото rezvo |
| `d-c46d906f` | Крылышки в соусе BBQ | их фото rezvo |
| `d-190e1b14` | Чесночные гренки | их фото rezvo |
| `d-55441645` | Фреш апельсиновый | Unsplash, photo-1600271886742-f049cd451bba (https://images.unsplash.com/photo-1600271886742-f049cd451bba), лицензия Unsplash |
| `d-abdbabf1` | Суп Том Ям | Unsplash, photo-1548943487-a2e4e43b4853 (https://images.unsplash.com/photo-1548943487-a2e4e43b4853), лицензия Unsplash |
| `d-a9ae8b1e` | Томатный суп | их фото rezvo |
| `d-78dcc719` | Латте | Unsplash, photo-1541167760496-1628856ab772 (https://images.unsplash.com/photo-1541167760496-1628856ab772), лицензия Unsplash |
| `d-f9cdd833` | Кофе Cappuccino | Unsplash, photo-1572442388796-11668a67e53d (https://images.unsplash.com/photo-1572442388796-11668a67e53d), лицензия Unsplash |
| `d-14a3bdd1` | Эспрессо | Unsplash, photo-1510707577719-ae7c14805e3a (https://images.unsplash.com/photo-1510707577719-ae7c14805e3a), лицензия Unsplash |
| `d-f77aeea0` | ЧАЙ ЗЕЛЕНЫЙ | Unsplash, photo-1627435601361-ec25f5b1d0e5 (https://images.unsplash.com/photo-1627435601361-ec25f5b1d0e5), лицензия Unsplash |
| `d-22959f7d` | Чай (чёрный, зелёный) | Unsplash, photo-1564890369478-c89ca6d9cde9 (https://images.unsplash.com/photo-1564890369478-c89ca6d9cde9), лицензия Unsplash |
| `d-446dfc14` | Курица с грибами | их фото rezvo |
| `d-3cacbe2c` | Бургер Агора мясной | их фото rezvo |
| `d-69997f77` | Томлённое куриное филе в соусе Том Ям | их фото rezvo |
| `d-6b88725c` | Телячи язык в сливочном соусе | их фото rezvo |
| `d-a355dd54` | Телятина с грибами | их фото rezvo |
| `d-9e305a27` | Мясо по домашнему | их фото rezvo |
| `d-95d609bf` | Тушенка | их фото rezvo |
| `d-7167039f` | Щечки говяжьи с кремом сельдерей | их фото rezvo |
| `d-39617d8f` | Кружка пенного фильтрованное | Unsplash, photo-1608270586620-248524c67de9 (https://images.unsplash.com/photo-1608270586620-248524c67de9), лицензия Unsplash |
| `d-1192dfc6` | Говядина кусковая (200гр) | их фото rezvo |
| `d-b2d68149` | Веганский восторг | их фото rezvo |
| `d-ade49a08` | Куринное Магре | их фото rezvo |
| `d-072ee7d4` | Сочные крыля на мангале (300гр) | их фото rezvo |
| `d-c64f9fe5` | Корейка на мангале | их фото rezvo |
| `d-37bf195e` | Люля кебаб (200гр) | их фото rezvo |
| `d-9b1e584e` | Филе миньон в перечном соусе | их фото rezvo |
| `d-37445d75` | Фетучини с креветками | их фото rezvo |
| `d-31221b1e` | Паста Болоньезе | их фото rezvo |
| `d-16bcf889` | Паста Альфредо | их фото rezvo |
| `d-0e21fa6a` | Пивной сет | их фото rezvo |
| `d-08f57e3f` | Картофельные дольки | их фото rezvo |
| `d-fb7621e8` | Рис | их фото rezvo |
| `d-a6223d6b` | Картофель фри | их фото rezvo |
| `d-18c2291c` | Пюре | их фото rezvo |
| `d-587db71e` | Рис с овощами | их фото rezvo |
| `d-73803297` | Bushmills The Original 50 ml | их фото rezvo |
| `d-e7a5a685` | Olmeca Gold | их фото rezvo |
| `d-d6971cdb` | Chivas Regal 12 Years Old 50ml | их фото rezvo |
| `d-90f985b0` | Патыр | их фото rezvo |
| `d-74811214` | Лепёшки | их фото rezvo |
| `d-87e29f90` | Булка с семенами | их фото rezvo |
| `d-85e1a279` | Хлебная корзиночка | их фото rezvo |
| `d-3b577f5e` | Булка плетёнка | их фото rezvo |
| `d-5947b3c0` | Дыня | их фото rezvo |

Позиции маленькой порции (люля 120 г, крылышки 150 г, говядина 125 г) в
карточке показывают фото той же позиции большой порции, с подписью.

Иконки, карта, знак DevUz, схема бота — нарисованы кодом.
