# Источники AutoPepe

Снято 29.10.2026, без Higgsfield, без ProxyAPI и без Firecrawl.

## Клиент — autopepe.pl

- Услуги и их тексты — `uslugi.htm`, `blacharstwo-lakiernictwo.htm`, `usuwanie-wgniecen.htm`, `usuwanie-rys.htm`, `renowacja-lakieru.htm`, `renowacja-felg-aluminiowych.htm`, `naprawy-blacharskie.htm`. Переписаны короче, без длинных тире и без их «innowacyjna, rewolucyjna metoda».
- Цены «od» — `cennik.htm`: wgniecenie od 50 zł, rysy od 50, polerowanie od 500, felgi (4 szt.) od 400, przygotowanie do sprzedaży od 200, lakierowanie elementu od 500, zaprawka od 200; «Dokładna wycena jest możliwa po obejrzeniu auta».
- Факты — `onas.htm` (с 1990 года, с 1997 — бесконтактное удаление вмятин и рис), `kontakt.htm` (Paweł Palanowski, ul. Lebiodowa 19, 04-674 Warszawa, 501-729-924, biuro@autopepe.pl, pn-pt 8-16), `dojazd.htm` (Wawer, проезд от Kadetów / Lucerny через Węglarską и мостик), `uslugi.htm` (рабаты, отгон машины после ремонта, быстрые сроки; частным и фирмам), `naprawy-blacharskie.htm` (безналично по OC, техосмотр после каждого послеаварийного ремонта), `blacharstwo-lakiernictwo.htm` (своя смесительная лаков).
- Фото «przed / po» — `usuwanie-wgniecen.jpg` (капот после града) и `renowacja-felg-aluminiowych.jpg` (диск), `photos.py` → `public/protos/autopepe/p/`. Два других снимка с их сайта (красная Corolla, Passat) не взяли: «после» снято в другом месте, на их работу не похоже.
- Знак — `logo1.jpg`: «Auto» красным, «Pepe» белым, жирный курсив на графите. Повторён шрифтом Archivo 700 italic (Google Fonts, OFL); буквы заставки — тот же шрифт (`intro/face.mjs` → `intro/arc.json`).

## Цены рынка (середина Варшавы) — для калькулятора их клиентов

- PDR: cenauslug.pl, Warszawa — 410 zł / szt. (Польша — 326 zł) — https://cenauslug.pl/motoryzacja/usuwanie-wgniecen-pdr/warszawa → вилка 250-450 zł за деталь.
- Лакировка детали: kb.pl — бампер 400-700 zł (01.2026); cenauslug.pl, Warszawa — передний бампер 1 100 zł, задний 1 150 zł; cuk.pl (06.2026) — дверь 400-800 zł в обычном сервисе — https://kb.pl/cenniki/uslugi/cennik-lakierowania-i-malowania-zderzaka-w-samochodzie-_mot/, https://cenauslug.pl/motoryzacja/lakierowanie-zderzaka-przedniego/warszawa, https://cuk.pl/porady/ile-kosztuje-lakierowanie-auta-cennik-dla-poszczegolnych-elementow-i-calego-samochodu → 700-1 000 zł.
- Полировка: otomoto.pl — одноэтапная 300-700 zł, двухэтапная 600-1 200, коррекция 1 200-2 000; Booksy Warszawa — 800-1 500 zł — https://www.otomoto.pl/news/ile-kosztuje-polerowanie-samochodu-cena-polerki-auta → пакеты 600-900, 900-1 400, 1 400-2 200 zł.
- Диски: cenauslug.pl, Warszawa — 420 zł; комплект 4 шт. до 16″ — 1 200-1 500 zł; kb.pl — 480-840 zł за 4 шт. 17″ — https://cenauslug.pl/przewodnik/renowacja-prostowanie-i-malowanie-felg → 800-1 300 zł.
- Заправка: cenauslug.pl, Warszawa — https://cenauslug.pl/motoryzacja/zaprawka-lakiernicza/warszawa; у AutoPepe от 200 zł → 200-300 zł.
- Множитель класса машины (SUV ×1,25, dostawcze ×1,35) — только для лака и пакетов: больше площадь.

## Цены студий (для «Стоимость»)

- Сайт услуг с калькулятором и записью у варшавских студий — 8-15 тыс. zł; наш обычный — 2 500 $, по акции 1 000 $, допы вместе 2 000 $ (`plan.mjs`).

## Конкуренты: что берут у сильных кузовных в Варшаве

Wycena ze zdjęć (WhatsApp, форма), bezgotówkowo z OC, odbiór i dostarczenie auta, status naprawy, rezerwacja online, opinie Google. Из этого в макет — то, что у AutoPepe правда есть (OC, отгон машины), остальное — допами.
