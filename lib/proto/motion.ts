/**
 * Анимации появления блоков — по одной на блок, а не одна на всю страницу.
 *
 * Владелец: «для каждого блока сделать свою анимацию появления». Одинаковое
 * всплытие у восьми карточек подряд читается как шаблон, и первое, что
 * думает человек, — «такой сайт я видел». Разные движения читаются как
 * сделанная вручную страница, хотя собирает её машина.
 *
 * Правила, из-за которых здесь всё выглядит именно так.
 *
 * Внутри `@keyframes` только `transform` и `opacity`. Анимировать `top`,
 * `width`, `height` — значит пересчитывать вёрстку на каждом кадре: на
 * флагмане незаметно, на среднем Android за три тысячи пятнадцать кадров в
 * секунду, а именно он у большинства в этом рынке. Это стережёт проверка в
 * `lib/proto/check.ts`, а не только договорённость.
 *
 * Привязка — к прокрутке блока (`animation-timeline: view()`), а не к
 * таймеру. Блок появляется тогда, когда до него долистали, а не через две
 * секунды после загрузки, когда человек смотрит совсем в другое место.
 *
 * База — всё видно. Анимация добавляется только там, где браузер её умеет,
 * и полностью снимается при `prefers-reduced-motion`. Страница без анимации
 * остаётся целой страницей.
 *
 * ── Как добавить свою ──────────────────────────────────────────────────
 *
 * Добавить запись в `MOTIONS`: ключ, зачем она нужна словами, и css с
 * `@keyframes m-<ключ>` внутри. Имя ключевых кадров обязано совпадать с
 * ключом — по нему движение и подключается. Дальше её можно ставить блоку
 * по имени, и она сама попадёт в стили той страницы, где использована.
 *
 * Что проверяется само: только `transform` и `opacity` в кадрах, и что
 * названное блоку движение вообще существует. Что не проверяется и остаётся
 * на совести — смысл: «детали собираются» на прайс-листе выглядит нелепо.
 */

export type Motion = {
  key: string;
  /** Зачем она. Чтобы следующий не поставил «сборку деталей» на прайс-лист. */
  note: string;
  css: string;
};

/**
 * Общая часть: когда блок появляется.
 *
 * Диапазон один на все движения намеренно. Разная скорость появления у
 * соседних карточек читается как подтормаживание страницы, а не как
 * задумка.
 */
const TIMELINE = "animation-duration:1s;animation-timing-function:linear;animation-fill-mode:both";
const RANGE = "animation-timeline:view();animation-range:entry 8% cover 42%";

const LIST: readonly Motion[] = [
  {
    key: "rise",
    note: "Спокойный подъём. Для секций целиком и для всего, что не просит характера.",
    css: `@keyframes rise{from{opacity:0;transform:translate3d(0,28px,0)}to{opacity:1;transform:none}}`,
  },
  {
    key: "sweep",
    note: "Выезжает слева, как деталь по конвейеру. Мойка, полировка, химчистка.",
    css: `@keyframes sweep{from{opacity:0;transform:translate3d(-56px,0,0)}to{opacity:1;transform:none}}`,
  },
  {
    key: "slide",
    note: "Входит справа, как вставка на место. Фильтры, расходники, замена детали.",
    css: `@keyframes slide{from{opacity:0;transform:translate3d(56px,0,0)}to{opacity:1;transform:none}}`,
  },
  {
    key: "zoom",
    note: "Приближается. Колесо, диск, балансировка — всё круглое и крупное.",
    css: `@keyframes zoom{from{opacity:0;transform:scale(.88)}to{opacity:1;transform:none}}`,
  },
  {
    key: "snap",
    note: "Встаёт на место с лёгким перелётом. ТО, диагностика — то, что «щёлкает».",
    css: `@keyframes snap{0%{opacity:0;transform:scale(1.09)}62%{opacity:1;transform:scale(.988)}100%{opacity:1;transform:none}}`,
  },
  {
    key: "unfold",
    note: "Раскрывается сверху вниз. Масло, жидкости — всё, что льётся.",
    css: `.m-unfold{transform-origin:top center}
@keyframes unfold{from{opacity:0;transform:scaleY(.66)}to{opacity:1;transform:none}}`,
  },
  {
    key: "tilt",
    note: "Поворачивается в плоскость экрана. Стрижка, маникюр — работа руками.",
    css: `.m-tilt{transform-origin:center bottom}
@keyframes tilt{from{opacity:0;transform:perspective(900px) rotateX(14deg) translate3d(0,22px,0)}to{opacity:1;transform:none}}`,
  },
  {
    key: "panel",
    note: "Панель приезжает, номер догоняет её отдельно. Кузовные работы: деталь встала, потом клеймо.",
    css: `@keyframes panel{from{opacity:0;transform:translate3d(-30px,18px,0) scale(.96)}to{opacity:1;transform:none}}
@supports (animation-timeline:view()){
  .m-panel .n{${TIMELINE};animation-name:panel-mark;animation-timeline:view();animation-range:entry 16% cover 54%}
}
@keyframes panel-mark{0%,42%{opacity:0;transform:translate3d(-14px,0,0)}100%{opacity:1;transform:none}}`,
  },
];

export const MOTIONS: Record<string, Motion> = Object.fromEntries(LIST.map((motion) => [motion.key, motion]));

export const MOTION_KEYS: readonly string[] = LIST.map((motion) => motion.key);

/**
 * Какое движение подходит услуге по смыслу.
 *
 * Названия услуг приходят от клиента, поэтому совпадение по корню, а не по
 * точной строке: «кузовной ремонт», «кузовные работы» и «ремонт кузова» —
 * одно и то же. Не совпало ничего — берём следующее по кругу, лишь бы у
 * соседних блоков движения были разные.
 */
const BY_MEANING: readonly (readonly [RegExp, string])[] = [
  [/кузов|kuzov/i, "panel"],
  [/фильтр|filtr/i, "slide"],
  // Граница слова здесь своя: \b в JS считает словом только латиницу, и
  // «\bто\b» не совпало бы с «Регулярное ТО» ни разу. Дефис исключён, чтобы
  // «что-то» не получило движение техобслуживания.
  [/(?<![\p{L}-])то(?![\p{L}])|техобслуж|диагност|diagnost/iu, "snap"],
  [/масл|moy\b|жидкост/i, "unfold"],
  [/шин|колес|балансир|диск|прокол|вулканиз/i, "zoom"],
  [/мойк|химчист|полир|детейлинг/i, "sweep"],
  [/стриж|бород|маникюр|педикюр|окрашив|брови/i, "tilt"],
];

/** Порядок для тех, кому смысл не подобрался. */
const CYCLE: readonly string[] = ["rise", "sweep", "snap", "slide", "tilt", "zoom", "panel", "unfold"];

/**
 * Движения для списка блоков: по одному на блок, у соседей — разные.
 *
 * «Разные» держится честно: если смысл подобрал одно и то же двум соседям
 * подряд, второй сдвигается на следующее свободное. Две одинаковые карточки
 * рядом — это и есть тот шаблон, от которого мы уходим.
 */
export function motionsFor(names: readonly string[]): string[] {
  const out: string[] = [];
  let next = 0;
  for (const name of names) {
    const meant = BY_MEANING.find(([pattern]) => pattern.test(name))?.[1];
    let key = meant && meant !== out[out.length - 1] ? meant : "";
    while (!key) {
      const candidate = CYCLE[next % CYCLE.length];
      next += 1;
      if (candidate !== out[out.length - 1]) key = candidate;
    }
    out.push(key);
  }
  return out;
}

/**
 * Стили только тех движений, что на странице есть.
 *
 * Класть все восемь в каждую страницу — значит носить в ней килобайт
 * ключевых кадров, которые не сработают ни разу.
 */
export function motionCss(keys: readonly string[]): string {
  const used = [...new Set(keys)].filter((key) => MOTIONS[key]);
  if (!used.length) return "";
  return [
    `@supports (animation-timeline:view()){.mo{${TIMELINE};${RANGE}}`,
    used.map((key) => `.m-${key}{animation-name:${key}}`).join(""),
    "}",
    used.map((key) => MOTIONS[key].css).join("\n"),
  ].join("\n");
}

/**
 * Откуда карточка вылетает из трюка.
 *
 * Сцена показывает по одной услуге за раз, и раньше все шесть прилетали
 * одинаково. Своё движение у блока — просьба владельца, и она не про список
 * внизу страницы: в сцене как раз те шесть услуг, ради которых человек и
 * листает. Поэтому направление вылета берётся из того же движения, что и у
 * блока: кузовная панель приезжает сбоку, масло льётся сверху, колесо
 * наезжает на зрителя.
 *
 * Значения задаются переменными на самой карточке, а кадры остаются одни на
 * всех: шесть почти одинаковых наборов ключевых кадров весят килобайт и
 * расходятся при первой же правке.
 */
const FLING: Record<string, string> = {
  rise: "--fx:0px;--fy:34px;--fs:.94;--fr:0deg",
  sweep: "--fx:-72px;--fy:0px;--fs:.95;--fr:0deg",
  slide: "--fx:72px;--fy:0px;--fs:.95;--fr:0deg",
  zoom: "--fx:0px;--fy:0px;--fs:.84;--fr:0deg",
  snap: "--fx:0px;--fy:0px;--fs:1.1;--fr:0deg",
  unfold: "--fx:0px;--fy:-38px;--fs:.9;--fr:0deg",
  tilt: "--fx:0px;--fy:26px;--fs:.95;--fr:-3.5deg",
  panel: "--fx:-64px;--fy:24px;--fs:.94;--fr:2deg",
};

export function flingVars(key: string): string {
  return FLING[key] ?? FLING.rise;
}
