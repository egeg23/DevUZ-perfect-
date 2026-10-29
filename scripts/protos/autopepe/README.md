# Макет AutoPepe (autopepe.pl): исходники

Задание владельца DevUz, 29.10.2026: кузовной и малярный сервис в Варшаве
(Wawer), с 1990 года, удаление вмятин без покраски с 1997. Польский язык,
условия — `/pl/mockup-terms`. Без Higgsfield, без ProxyAPI: визуал — кодом.
Источники и цены рынка — `SOURCES.md`, блоки — `21ST.md`, снимки —
`docs/screens/autopepe/`.

Страницы:

- `""` — видео DevUz (`dzIntroSolo`) → **залёт в бренд** (`intro/`): камера
  низко летит вдоль лакированных букв AutoPepe (красное «Auto», белое
  «Pepe»), буквы садятся с отскоком, камера отъезжает, знак садится в шапку.
  Раз за визит (`?intro=1` — ещё раз, `&apt=2.5` — кадр на этой секунде).
  Дальше выбор «Strona warsztatu» / «Panel warsztatu», «Jak sprawdzić»,
  конструктор «Oferta DevUz Studio» (`plan.mjs`): сайт 1 000 $ вместо
  2 500 $ на 48 часов, 9 допов на 2 000 $, всё вместе 3 000 $.
- `site` — сайт:
  1. живой лак (`lak.js`, WebGL-шейдер без картинок): лампы мастерской
     бегут по кузову за курсором и прокруткой, жидкое стекло поверх;
  2. бегущие строки их выгод и услуг, ускоряются от прокрутки;
  3. **«Od wgniecenia do lustra»** — липкая сцена на 4 экрана: доска с
     полосами (так мастер PDR видит вмятину) → вмятина выдавливается →
     царапины → полировка до зеркала; прокрутку только читает;
  4. шесть их услуг, у каждой своё движение, цены «od» из их прайса;
  5. «Przed i po» — шторка на их двух снимках;
  6. **калькулятор**: класс машины, схема сверху (13 деталей, нажатие →
     wgniecenie / rysa / lakierowanie), пакеты, диски, заправки, «szkoda z
     OC» → 0 zł; вилка по середине Варшавы, SMS с составом на их номер;
  7. OC шаг за шагом; допы `data-addon`: wycena ze zdjęć, szkoda z OC
     (форма), status naprawy, rezerwacja terminu, SMS, wersja UA/EN, SEO,
     flota, panel; «Dlaczego AutoPepe», контакт и проезд.
- `panel` — панель мастерской по эталону Greenwell (`panel.js`, подписи
  `panel-ui.mjs`): pulpit (przychód к прошлым 30 дням, график с заявками с
  сайта, droga klienta, najczęstsze naprawy, kończy się), zlecenia (с сайта
  первой строкой, «Przyjmij auto», этап виден клиенту), kalendarz (запись
  с сайта занимает час), materiały, historia; «Patrz jako» właściciel /
  recepcja — recepcja не видит marży и цен закупки. Демо из одного зерна.

Связь — память браузера: сайт пишет `ap-req-1`, `ap-calc-1`, панель —
`ap-panel-1`, конструктор — `ap-cfg-1`; сайт ловит `storage`.

## Файлы и порядок

- `photos.py <папка с их jpg>` → `public/protos/autopepe/p/`;
- `data.mjs` — факты и вилки калькулятора; `plan.mjs` — наша цена (только здесь);
- `intro/face.mjs <Archivo 700 italic .ttf> <node_modules с opentype.js>` →
  `arc.json`; `intro/build.mjs <папка с three@0.170.0 и esbuild>` →
  `public/protos/autopepe/intro3d.js`;
- `gen.mjs` → `out/pages.json` и `content/proto-bundles/autopepe.json`;
  падает на длинном тире и подписи панели без словаря;
- `serve.mjs` — `http://localhost:4851/proto/<43 символа>/`;
- `check.mjs` — 390, 768, 1440 без ошибок и прокрутки вбок, полный цикл
  сайт → панель → сайт, тумблер, роли, «меньше движения»; `shots.mjs` — снимки (png; в `docs/screens/autopepe/` они пережаты в webp).

Перед сдачей: `node --import ./tests/alias-hook.mjs --import
./tests/tsx-hook.mjs scripts/proto-plain.mjs autopepe` — «Чисто».
После правки `plan.mjs` — `node scripts/mockup-plans.mjs`.

Модель макет не вызывает. В базе — запись `protos` с `facts.bundle = "autopepe"`.
