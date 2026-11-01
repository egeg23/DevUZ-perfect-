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
| `d-137a7726` | Огурцы свежие | Unsplash, photo-1589621316382-008455b857cd (https://images.unsplash.com/photo-1589621316382-008455b857cd), лицензия Unsplash |
| `d-7d58155f` | Сырная тарелка | Unsplash, photo-1452195100486-9cc805987862 (https://images.unsplash.com/photo-1452195100486-9cc805987862), лицензия Unsplash |
| `d-669e76dc` | Киви | Unsplash, photo-1585059895524-72359e06133a (https://images.unsplash.com/photo-1585059895524-72359e06133a), лицензия Unsplash |
| `d-8409f8ec` | Помидор | Unsplash, photo-1546094096-0df4bcaaa337 (https://images.unsplash.com/photo-1546094096-0df4bcaaa337), лицензия Unsplash |
| `d-e2a117a8` | Овощная нарезка | их фото rezvo |
| `d-a9ca89b3` | Апельсин | Unsplash, photo-1547514701-42782101795e (https://images.unsplash.com/photo-1547514701-42782101795e), лицензия Unsplash |
| `d-98c83dec` | Груша | Unsplash, photo-1514756331096-242fdeb70d4a (https://images.unsplash.com/photo-1514756331096-242fdeb70d4a), лицензия Unsplash |
| `d-c2b3219f` | Маринованное ассорти | их фото rezvo |
| `d-2f1933f1` | Сельд по домашнему | их фото rezvo |
| `d-521e342a` | Вителло тоннато | их фото rezvo |
| `d-53e79df1` | Негазированная вода Bonaqua | Unsplash, photo-1523362628745-0c100150b504 (https://images.unsplash.com/photo-1523362628745-0c100150b504), лицензия Unsplash, похожее |
| `d-e535bd44` | Вода Истису 0,5 | Unsplash, photo-1523362628745-0c100150b504 (https://images.unsplash.com/photo-1523362628745-0c100150b504), лицензия Unsplash, похожее |
| `d-21570b6c` | Газированная вода Bonaqua 0.5 | Unsplash, photo-1548839140-29a749e1cf4d (https://images.unsplash.com/photo-1548839140-29a749e1cf4d), лицензия Unsplash, похожее |
| `d-e45515b7` | Вода б/г 1л | Unsplash, photo-1523362628745-0c100150b504 (https://images.unsplash.com/photo-1523362628745-0c100150b504), лицензия Unsplash, похожее |
| `d-a42bd275` | Сок в ассортименте | Unsplash, photo-1621506289937-a8e4df240d0b (https://images.unsplash.com/photo-1621506289937-a8e4df240d0b), лицензия Unsplash |
| `d-279083dc` | Sprite 0,250мл | Unsplash, photo-1625772299848-391b6a87d7b3 (https://images.unsplash.com/photo-1625772299848-391b6a87d7b3), лицензия Unsplash |
| `d-b0b227e8` | Coca-Cola 0,25 | Unsplash, photo-1514218953589-2d7d37efd2dc (https://images.unsplash.com/photo-1514218953589-2d7d37efd2dc), лицензия Unsplash |
| `d-53d7d02e` | Вода Истису 0,25 | Unsplash, photo-1523362628745-0c100150b504 (https://images.unsplash.com/photo-1523362628745-0c100150b504), лицензия Unsplash, похожее |
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
| `d-adf3c1d0` | Салат со шпинатом | Unsplash, photo-1607532941433-304659e8198a (https://images.unsplash.com/photo-1607532941433-304659e8198a), лицензия Unsplash, похожее |
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
| `d-8db02abb` | Фреш Яблочно-апельсиновый | Unsplash, photo-1587015990127-424b954e38b5 (https://images.unsplash.com/photo-1587015990127-424b954e38b5), лицензия Unsplash, похожее |
| `d-55441645` | Фреш апельсиновый | Unsplash, photo-1600271886742-f049cd451bba (https://images.unsplash.com/photo-1600271886742-f049cd451bba), лицензия Unsplash |
| `d-4146886f` | Бизнес ланч (Вторник) | Unsplash, photo-1504674900247-0877df9cc836 (https://images.unsplash.com/photo-1504674900247-0877df9cc836), лицензия Unsplash, похожее |
| `d-abdbabf1` | Суп Том Ям | Unsplash, photo-1548943487-a2e4e43b4853 (https://images.unsplash.com/photo-1548943487-a2e4e43b4853), лицензия Unsplash |
| `d-2d0cc71e` | Солянка | Unsplash, photo-1603105037880-880cd4edfb0d (https://images.unsplash.com/photo-1603105037880-880cd4edfb0d), лицензия Unsplash, похожее |
| `d-a9ae8b1e` | Томатный суп | их фото rezvo |
| `d-fbced469` | Бизнес ланч (Понедельник) | Unsplash, photo-1504674900247-0877df9cc836 (https://images.unsplash.com/photo-1504674900247-0877df9cc836), лицензия Unsplash, похожее |
| `d-8d922526` | Бизнес Ланч (четверг) | Unsplash, photo-1504674900247-0877df9cc836 (https://images.unsplash.com/photo-1504674900247-0877df9cc836), лицензия Unsplash, похожее |
| `d-9f6722e8` | Бизнес ланч (Среда) | Unsplash, photo-1504674900247-0877df9cc836 (https://images.unsplash.com/photo-1504674900247-0877df9cc836), лицензия Unsplash, похожее |
| `d-f715aefd` | Куриный суп с домашней лапшой | Unsplash, photo-1588566565463-180a5b2090d2 (https://images.unsplash.com/photo-1588566565463-180a5b2090d2), лицензия Unsplash, похожее |
| `d-0f21cddd` | Бизнес ланч (Пятница) | Unsplash, photo-1504674900247-0877df9cc836 (https://images.unsplash.com/photo-1504674900247-0877df9cc836), лицензия Unsplash, похожее |
| `d-8b615ca2` | Американо | Unsplash, photo-1497515114629-f71d768fd07c (https://images.unsplash.com/photo-1497515114629-f71d768fd07c), лицензия Unsplash |
| `d-78dcc719` | Латте | Unsplash, photo-1541167760496-1628856ab772 (https://images.unsplash.com/photo-1541167760496-1628856ab772), лицензия Unsplash |
| `d-f9cdd833` | Кофе Cappuccino | Unsplash, photo-1572442388796-11668a67e53d (https://images.unsplash.com/photo-1572442388796-11668a67e53d), лицензия Unsplash |
| `d-a7497eec` | Kakao | Unsplash, photo-1542990253-0d0f5be5f0ed (https://images.unsplash.com/photo-1542990253-0d0f5be5f0ed), лицензия Unsplash |
| `d-14a3bdd1` | Эспрессо | Unsplash, photo-1510707577719-ae7c14805e3a (https://images.unsplash.com/photo-1510707577719-ae7c14805e3a), лицензия Unsplash |
| `d-a943e5da` | Клюквенный чай с корицей | Unsplash, photo-1571934811356-5cc061b6821f (https://images.unsplash.com/photo-1571934811356-5cc061b6821f), лицензия Unsplash, похожее |
| `d-a7378ba9` | Чай Ягодный | Unsplash, photo-1597318181409-cf64d0b5d8a2 (https://images.unsplash.com/photo-1597318181409-cf64d0b5d8a2), лицензия Unsplash |
| `d-f77aeea0` | ЧАЙ ЗЕЛЕНЫЙ | Unsplash, photo-1627435601361-ec25f5b1d0e5 (https://images.unsplash.com/photo-1627435601361-ec25f5b1d0e5), лицензия Unsplash |
| `d-3cce4ec1` | Чай Карак | Unsplash, photo-1544787219-7f47ccb76574 (https://images.unsplash.com/photo-1544787219-7f47ccb76574), лицензия Unsplash |
| `d-22959f7d` | Чай (чёрный, зелёный) | Unsplash, photo-1564890369478-c89ca6d9cde9 (https://images.unsplash.com/photo-1564890369478-c89ca6d9cde9), лицензия Unsplash |
| `d-98e0b5cb` | Чай Травяной | Unsplash, photo-1576092768241-dec231879fc3 (https://images.unsplash.com/photo-1576092768241-dec231879fc3), лицензия Unsplash |
| `d-cda61239` | Чай жасминовый | Unsplash, photo-1627435601361-ec25f5b1d0e5 (https://images.unsplash.com/photo-1627435601361-ec25f5b1d0e5), лицензия Unsplash, похожее |
| `d-8ed94520` | Чай зеленый с лимоном и сахаром | Unsplash, photo-1627435601361-ec25f5b1d0e5 (https://images.unsplash.com/photo-1627435601361-ec25f5b1d0e5), лицензия Unsplash, похожее |
| `d-446dfc14` | Курица с грибами | их фото rezvo |
| `d-3cacbe2c` | Бургер Агора мясной | их фото rezvo |
| `d-69997f77` | Томлённое куриное филе в соусе Том Ям | их фото rezvo |
| `d-6b88725c` | Телячи язык в сливочном соусе | их фото rezvo |
| `d-a355dd54` | Телятина с грибами | их фото rezvo |
| `d-9e305a27` | Мясо по домашнему | их фото rezvo |
| `d-95d609bf` | Тушенка | их фото rezvo |
| `d-7167039f` | Щечки говяжьи с кремом сельдерей | их фото rezvo |
| `d-2b1a502b` | Пиво Corona 0.33l | Unsplash, photo-1600213903598-25be92abde40 (https://images.unsplash.com/photo-1600213903598-25be92abde40), лицензия Unsplash |
| `d-0ca04f07` | Пиво Bud безалкогольный 0.45л | Unsplash, photo-1612528443702-f6741f70a049 (https://images.unsplash.com/photo-1612528443702-f6741f70a049), лицензия Unsplash, похожее |
| `d-a7e22624` | Пиво Paulaner 0% 0.45 | Unsplash, photo-1612528443702-f6741f70a049 (https://images.unsplash.com/photo-1612528443702-f6741f70a049), лицензия Unsplash, похожее |
| `d-c95c87fb` | Сарбаст 500 мл разлив | Unsplash, photo-1535958636474-b021ee887b13 (https://images.unsplash.com/photo-1535958636474-b021ee887b13), лицензия Unsplash, похожее |
| `d-d253b82c` | Кружка пиво не фильтрованное | Unsplash, photo-1600788886242-5c96aabe3757 (https://images.unsplash.com/photo-1600788886242-5c96aabe3757), лицензия Unsplash, похожее |
| `d-eaf5d839` | Пиво Bud 0.45 | Unsplash, photo-1612528443702-f6741f70a049 (https://images.unsplash.com/photo-1612528443702-f6741f70a049), лицензия Unsplash, похожее |
| `d-f3c836b8` | Пиво Efes | Unsplash, photo-1612528443702-f6741f70a049 (https://images.unsplash.com/photo-1612528443702-f6741f70a049), лицензия Unsplash, похожее |
| `d-28a5490a` | Пиво Paulaner 0.5l | Unsplash, photo-1612528443702-f6741f70a049 (https://images.unsplash.com/photo-1612528443702-f6741f70a049), лицензия Unsplash, похожее |
| `d-1f2b97a1` | Hoegaarden | Unsplash, photo-1612528443702-f6741f70a049 (https://images.unsplash.com/photo-1612528443702-f6741f70a049), лицензия Unsplash, похожее |
| `d-aeb62548` | 1664 | Unsplash, photo-1612528443702-f6741f70a049 (https://images.unsplash.com/photo-1612528443702-f6741f70a049), лицензия Unsplash, похожее |
| `d-39617d8f` | Кружка пенного фильтрованное | Unsplash, photo-1608270586620-248524c67de9 (https://images.unsplash.com/photo-1608270586620-248524c67de9), лицензия Unsplash |
| `d-00d10836` | Пиво Stella Artois 0.45 | Unsplash, photo-1612528443702-f6741f70a049 (https://images.unsplash.com/photo-1612528443702-f6741f70a049), лицензия Unsplash, похожее |
| `d-c9be7a7b` | Жатейский гусь 300 мл разлив | Unsplash, photo-1567696911980-2eed69a46042 (https://images.unsplash.com/photo-1567696911980-2eed69a46042), лицензия Unsplash, похожее |
| `d-1192dfc6` | Говядина кусковая (200гр) | их фото rezvo |
| `d-b2d68149` | Веганский восторг | их фото rezvo |
| `d-ade49a08` | Куринное Магре | их фото rezvo |
| `d-072ee7d4` | Сочные крыля на мангале (300гр) | их фото rezvo |
| `d-c64f9fe5` | Корейка на мангале | их фото rezvo |
| `d-37bf195e` | Люля кебаб (200гр) | их фото rezvo |
| `d-c45621f8` | Шашлык кусковой баранина | Unsplash, photo-1599487488170-d11ec9c172f0 (https://images.unsplash.com/photo-1599487488170-d11ec9c172f0), лицензия Unsplash |
| `d-9b1e584e` | Филе миньон в перечном соусе | их фото rezvo |
| `d-37445d75` | Фетучини с креветками | их фото rezvo |
| `d-31221b1e` | Паста Болоньезе | их фото rezvo |
| `d-16bcf889` | Паста Альфредо | их фото rezvo |
| `d-de4a6097` | Мохито алкогольное | Unsplash, photo-1513558161293-cdaf765ed2fd (https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd), лицензия Unsplash |
| `d-6264ee0f` | Голубая лагуна | Unsplash, photo-1571950006418-f226dc106482 (https://images.unsplash.com/photo-1571950006418-f226dc106482), лицензия Unsplash |
| `d-fccbddf0` | Виски саур | Unsplash, photo-1541546006121-5c3bc5e8c7b9 (https://images.unsplash.com/photo-1541546006121-5c3bc5e8c7b9), лицензия Unsplash |
| `d-728290f6` | Old fashion | Unsplash, photo-1470337458703-46ad1756a187 (https://images.unsplash.com/photo-1470337458703-46ad1756a187), лицензия Unsplash |
| `d-41712440` | Лонг-Айленд | Unsplash, photo-1556679343-c7306c1976bc (https://images.unsplash.com/photo-1556679343-c7306c1976bc), лицензия Unsplash, похожее |
| `d-da3e0690` | Джин тоник | Unsplash, photo-1546171753-97d7676e4602 (https://images.unsplash.com/photo-1546171753-97d7676e4602), лицензия Unsplash |
| `d-10c194ce` | Негрони | Unsplash, photo-1551751299-1b51cab2694c (https://images.unsplash.com/photo-1551751299-1b51cab2694c), лицензия Unsplash |
| `d-16bb94f3` | Aperol Spritz | Unsplash, photo-1560512823-829485b8bf24 (https://images.unsplash.com/photo-1560512823-829485b8bf24), лицензия Unsplash |
| `d-24d78aa6` | Сlover club | Unsplash, photo-1563223771-5fe4038fbfc9 (https://images.unsplash.com/photo-1563223771-5fe4038fbfc9), лицензия Unsplash |
| `d-0e21fa6a` | Пивной сет | их фото rezvo |
| `d-ff9da924` | Миндаль | Unsplash, photo-1508061253366-f7da158b6d46 (https://images.unsplash.com/photo-1508061253366-f7da158b6d46), лицензия Unsplash |
| `d-4a6c4c47` | Лимон | Unsplash, photo-1590502593747-42a996133562 (https://images.unsplash.com/photo-1590502593747-42a996133562), лицензия Unsplash |
| `d-13bc54ec` | Шоколад | Unsplash, photo-1511381939415-e44015466834 (https://images.unsplash.com/photo-1511381939415-e44015466834), лицензия Unsplash |
| `d-08f57e3f` | Картофельные дольки | их фото rezvo |
| `d-fb7621e8` | Рис | их фото rezvo |
| `d-a6223d6b` | Картофель фри | их фото rezvo |
| `d-18c2291c` | Пюре | их фото rezvo |
| `d-587db71e` | Рис с овощами | их фото rezvo |
| `d-217d9717` | Роса Мягкая (Водка, Россия) | их фото rezvo |
| `d-65d4ec57` | Пиво Peroni | Unsplash, photo-1612528443702-f6741f70a049 (https://images.unsplash.com/photo-1612528443702-f6741f70a049), лицензия Unsplash, похожее |
| `d-ed714a31` | Jack Daniel’s Old No.7 50ml | их фото rezvo |
| `d-73803297` | Bushmills The Original 50 ml | их фото rezvo |
| `d-07574e60` | Gin & Tonic | Unsplash, photo-1546171753-97d7676e4602 (https://images.unsplash.com/photo-1546171753-97d7676e4602), лицензия Unsplash |
| `d-5801099c` | Вино Bagizagan 0.7 | Unsplash, photo-1553361371-9b22f78e8b1d (https://images.unsplash.com/photo-1553361371-9b22f78e8b1d), лицензия Unsplash, похожее |
| `d-16ff0c50` | Bacardi Carta Negra 50ml | Unsplash, photo-1614313511387-1436a4480ebb (https://images.unsplash.com/photo-1614313511387-1436a4480ebb), лицензия Unsplash, похожее |
| `d-b6034aa6` | Johnnie Walker Black Label50ml | Unsplash, photo-1569529465841-dfecdab7503b (https://images.unsplash.com/photo-1569529465841-dfecdab7503b), лицензия Unsplash |
| `d-9847d4ee` | Архангельская Северная Выдержка | их фото rezvo |
| `d-b74cde66` | Вино Kakabadze Shilda 0,125ml красное | Unsplash, photo-1474722883778-792e7990302f (https://images.unsplash.com/photo-1474722883778-792e7990302f), лицензия Unsplash, похожее |
| `d-e7a5a685` | Olmeca Gold | их фото rezvo |
| `d-974baff3` | Вино Kakabadze Shilda 0,75 красное сухое | Unsplash, photo-1584916201218-f4242ceb4809 (https://images.unsplash.com/photo-1584916201218-f4242ceb4809), лицензия Unsplash, похожее |
| `d-36eb5250` | Виски Black Label 50мл | Unsplash, photo-1569529465841-dfecdab7503b (https://images.unsplash.com/photo-1569529465841-dfecdab7503b), лицензия Unsplash |
| `d-cfc6564d` | Dewar's 12 Years Old 50ml | их фото rezvo |
| `d-d6971cdb` | Chivas Regal 12 Years Old 50ml | их фото rezvo |
| `d-9be34289` | Campari 40ml | Unsplash, photo-1592483648228-b35146a4330c (https://images.unsplash.com/photo-1592483648228-b35146a4330c), лицензия Unsplash |
| `d-60a8f0ab` | The Famous Grouse 50ml | их фото rezvo |
| `d-81125d63` | Tullamore D.E.W. 50ml | их фото rezvo |
| `d-9264b304` | Пиво Asahi Super Dry 0.33 | Unsplash, photo-1612528443702-f6741f70a049 (https://images.unsplash.com/photo-1612528443702-f6741f70a049), лицензия Unsplash, похожее |
| `d-721c27bd` | Вино Kakabadze Shilda Saperavi 0.75 | Unsplash, photo-1510812431401-41d2bd2722f3 (https://images.unsplash.com/photo-1510812431401-41d2bd2722f3), лицензия Unsplash, похожее |
| `d-74885518` | Olmeca Silver | их фото rezvo |
| `d-db59da7e` | Вино Laguna ассортимент 0,75 | Unsplash, photo-1578911373434-0cb395d2cbfb (https://images.unsplash.com/photo-1578911373434-0cb395d2cbfb), лицензия Unsplash, похожее |
| `d-90f985b0` | Патыр | их фото rezvo |
| `d-74811214` | Лепёшки | их фото rezvo |
| `d-87e29f90` | Булка с семенами | их фото rezvo |
| `d-8a7baebb` | Бородинский хлеб | Unsplash, photo-1509440159596-0249088772ff (https://images.unsplash.com/photo-1509440159596-0249088772ff), лицензия Unsplash |
| `d-d1cd92e0` | Тостерный хлеб | Unsplash, photo-1628088062854-d1870b4553da (https://images.unsplash.com/photo-1628088062854-d1870b4553da), лицензия Unsplash |
| `d-85e1a279` | Хлебная корзиночка | их фото rezvo |
| `d-3b577f5e` | Булка плетёнка | их фото rezvo |
| `d-48100b72` | Соус Пилати 40гр | Unsplash, photo-1472476443507-c7a5948772fc (https://images.unsplash.com/photo-1472476443507-c7a5948772fc), лицензия Unsplash, похожее |
| `d-5947b3c0` | Дыня | их фото rezvo |
| `d-704a3cf3` | Арбуз - Дыня | Unsplash, photo-1571575173700-afb9492e6a50 (https://images.unsplash.com/photo-1571575173700-afb9492e6a50), лицензия Unsplash, похожее |
| `d-cc167cd0` | Арбуз | Unsplash, photo-1587049352846-4a222e784d38 (https://images.unsplash.com/photo-1587049352846-4a222e784d38), лицензия Unsplash |
| `d-ec56702b` | Мед 40гр | Unsplash, photo-1558642452-9d2a7deb7f62 (https://images.unsplash.com/photo-1558642452-9d2a7deb7f62), лицензия Unsplash |

Позиции маленькой порции и того же напитка другого объёма (люля 120 г, крылышки 150 г, говядина 125 г, лимонады 450 мл, Bushmills 40 мл, Dewar`s 12, Famous Grouse) показывают фото той же позиции, с подписью.

«Похожее» — тот же вид блюда или напитка, но не их марка или подача (бутылочное пиво, вино, вода, бизнес-ланч): в карточке подпись «Похожее фото: Unsplash, ваше встанет сюда». Их собственные снимки бутылок 365-447 px показаны как есть, без растягивания.

Иконки, карта, знак DevUz, схема бота — нарисованы кодом.
