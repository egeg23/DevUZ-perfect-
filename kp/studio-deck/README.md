# Презентация студии «Мы можем всё»

Владелец, 05.11.2026: «Сделай кп с топовыми компаниями, которым мы делали
сайты (макеты). Там и Озон аптека, и samauto и Baldinini. Короче сделай в
красивой стиле нашего дашборда (такие же цвета). Где в 3д, было / стало,
короче все что может наша студия. А можем мы все, вон, свою операционную
систему делаем».

19 слайдов 1600×900, по-русски, в виде панели «DevUz Офис»: ночной фон со
свечением, стекло карточек, зелёный акцент, полоса значков слева по главам
(Старт, Бренды, Кейсы, 3D, ИИ, Своя ОС, Цены, Связь). Токены — из
`app/globals.css` (`@theme`, `.admin-os`, `.os-*`), гарнитуры — Unbounded и
Inter из `kp/fonts/` (`fonts.css`), сеть не нужна.

## Собрать

```
node --import ./tests/alias-hook.mjs --import ./tests/tsx-hook.mjs kp/studio-deck/img.mjs    # картинки → img/
node --import ./tests/alias-hook.mjs --import ./tests/tsx-hook.mjs kp/studio-deck/build.mjs  # → studio-ru.html
node kp/studio-deck/pdf.mjs                    # → kp/studio-ru.pdf; падает, если текст залез на подвал
node kp/studio-deck/pdf.mjs --png <папка>      # ещё и каждый слайд картинкой 1600×900
```

`img.mjs` и `build.mjs` читают TypeScript сайта, поэтому идут с хуками тестов.

## Откуда что

- Числа не пишутся руками: бренды — `content/clients.ts` (`clientRows`),
  работы в кейсах и их цифры — `content/cases.ts` (без `demo`), макеты
  вручную — число сборок в `content/proto-bundles/`, языки сайта —
  `lib/i18n.ts`, цены «от» и сроки — `content/services.ts`, «начать с
  малого» — `LADDER` (`lib/admin/mockup-offer.ts`), DevUz Box —
  `content/box.ts` и `content/box-copy.ts`, контакты — `content/company.ts`.
  Поменялось там — пересобрать.
- Описания макетов — из README макетов (`scripts/protos/<имя>/README.md`),
  `.claude/skills/proto-master/premium.md` (SamAuto) и CLAUDE.md. Почти все
  работы — макеты, и подписаны «макет для …»; результатов бизнеса клиентов в
  презентации нет.
- «Было / стало»: снимки до макета из `docs/screens/<имя>/before/` с датой из
  `scripts/protos/<имя>/BEFORE.md` (Optimal Prime, SAMIST AUTO) и шторки
  кейсов `public/cases/<slug>/hero-*` с `compare.taken` (Golden House, Namuna,
  FOODMAXX, Global Export). Живые чужие сайты для презентации не снимали.
- Логистика — обезличенный кадр «YOUR CARGO» из `kp/cargo-deck/img/ru`, как
  решено для продающих материалов карго.
- На снимке «Входящих» нашей панели имена и адреса клиентов размыты
  (`img.mjs`), подпись на слайде об этом говорит.
- DevUz Box — план на октябрь 2027, «План, не обещание», без цен и без
  названий чипов, моделей ИИ и систем внутри (правила промо-страницы /box).

Текст без длинных тире и штампов ИИ: проверено `plainTextProblems` из
`lib/proto/plain-text.ts` по тексту страницы.
