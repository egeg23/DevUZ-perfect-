/**
 * Проверка прототипа машиной, а не совестью.
 *
 * На разборах ровно такая проверка поймала две модели, которые уложились во
 * все правила из инструкции и всё равно сдали брак: одна перезамерила время
 * ответа, другая собрала весь текст дословными строками отчёта. Человек,
 * читая их статьи, ничего бы не заметил.
 *
 * Здесь то же самое, только ставки выше: разбор анонимен, а прототип уходит
 * с именем живой компании. Выдуманная цифра в нём — это утверждение о
 * конкретном бизнесе, сделанное от его лица.
 *
 * Проверка идёт по готовому HTML, а не по данным до сборки. Так она ловит и
 * то, что просочилось через шаблон, и то, что кто-нибудь однажды впишет в
 * шаблон руками.
 */
import type { ProtoNiche } from "@/content/proto/models";
import type { ProtoFacts } from "@/lib/proto/facts";
import { factPool, mainAction, wheelProblems } from "@/lib/proto/facts";
import { TYPE } from "@/lib/proto/design";
import { MOTIONS } from "@/lib/proto/motion";
import { unsupportedNumbers } from "@/lib/razbor/shift";

export type ProtoProblem = { code: string; text: string };

/**
 * Видимый текст страницы.
 *
 * Из него выброшены стили, скрипты и рисунки: в `<svg>` числа — это
 * координаты, и проверять их на «выдуманность» бессмысленно. Выброшены и
 * порядковые номера карточек — «01», «02». Это нумерация списка, а не
 * утверждение о компании, и вырезаются они по узкому образцу
 * `<span class="n">NN</span>`, чтобы через эту щель не пролезло ничего
 * длиннее двух цифр.
 */
export function visibleText(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<svg[\s\S]*?<\/svg>/gi, " ")
    .replace(/<span class="n">\d{1,2}<\/span>/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-z#0-9]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function styles(html: string): string {
  return [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)].map((m) => m[1]).join("\n");
}

function scripts(html: string): string {
  return [...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/gi)].map((m) => m[1]).join("\n");
}

/**
 * Свойства внутри `@keyframes`.
 *
 * Анимировать `top`, `width`, `height` — значит заставлять браузер
 * пересчитывать вёрстку на каждом кадре. На флагмане это незаметно, на
 * среднем Android за три тысячи получается пятнадцать кадров в секунду, а
 * именно он у большинства в этом рынке.
 */
export function keyframeProperties(css: string): string[] {
  const out = new Set<string>();
  const heads = /@keyframes\s+[\w-]+\s*\{/g;
  let head: RegExpExecArray | null;
  /*
   * Скобки считаются, а не ищется закрывающая по образцу.
   *
   * Первая версия искала «перевод строки и скобку» и молча захватывала всё
   * до конца следующего правила, если кадры записаны в одну строку. Проверка
   * при этом не падала — она находила лишние свойства и заворачивала
   * страницу, которая была в порядке. Ошибка нашлась ровно так: честная
   * страница перестала проходить собственную проверку.
   */
  while ((head = heads.exec(css))) {
    let depth = 1;
    let at = heads.lastIndex;
    while (at < css.length && depth > 0) {
      if (css[at] === "{") depth += 1;
      else if (css[at] === "}") depth -= 1;
      at += 1;
    }
    const body = css.slice(heads.lastIndex, at - 1);
    for (const declaration of body.matchAll(/([a-z-]+)\s*:/gi)) out.add(declaration[1].toLowerCase());
    heads.lastIndex = at;
  }
  return [...out];
}


const ALLOWED_IN_KEYFRAMES = new Set(["transform", "opacity"]);

/** Слова, которых компания о себе не говорила, но которые тянет дописать. */
const BRAGS = [
  "гарант",
  "kafolat",
  "лучш",
  "eng yaxshi",
  "дешевле",
  "официальный дилер",
  "сертифицированн",
  "№1",
  "N1",
];

export function protoProblems(input: {
  html: string;
  facts: ProtoFacts;
  niche: ProtoNiche;
}): ProtoProblem[] {
  const { html, facts, niche } = input;
  const out: ProtoProblem[] = [];
  const text = visibleText(html);
  const css = styles(html);
  const js = scripts(html);
  const pool = factPool(facts);
  const lower = text.toLowerCase();
  const poolLower = pool.toLowerCase();

  // 1. Числа только те, что мы знаем.
  const invented = unsupportedNumbers(text, pool);
  if (invented.length) {
    out.push({ code: "invented", text: `Числа, которых нет в фактах: ${invented.join(", ")}.` });
  }

  // Процент прироста — это ссылка на замер, которого мы не делали.
  if (/\d+\s*%/.test(text)) {
    out.push({ code: "percent", text: "В тексте есть процент. Прототип процентов не называет." });
  }

  // 2. Похвалы, которых компания о себе не говорила.
  const brags = BRAGS.filter((word) => lower.includes(word.toLowerCase()) && !poolLower.includes(word.toLowerCase()));
  if (brags.length) {
    out.push({ code: "brag", text: `Обещания, которых компания не давала: ${brags.join(", ")}.` });
  }

  // 3. Выключатель анимации.
  if (!/prefers-reduced-motion/.test(css)) {
    out.push({ code: "motion", text: "Нет правила prefers-reduced-motion: анимацию нечем выключить." });
  }

  // 4. Скролл не перехватывается.
  if (/scroll-behavior\s*:\s*smooth/.test(css)) {
    out.push({ code: "hijack", text: "scroll-behavior: smooth — страница листается не так, как двинули палец." });
  }
  if (/scroll-snap-type/.test(css)) {
    out.push({ code: "hijack", text: "scroll-snap-type притягивает страницу сам. На длинной странице это перехват." });
  }
  if (/addEventListener\s*\(\s*["'](?:scroll|wheel|touchmove)/.test(js) || /scrollTo\s*\(|scrollIntoView\s*\(/.test(js)) {
    out.push({ code: "hijack", text: "Скрипт слушает прокрутку или двигает её сам." });
  }

  /*
   * 5. Своя гарнитура, а не системная.
   *
   * Самый громкий признак самодельной страницы из всех, что назвала
   * разведка: девять из десяти чужих сайтов поставили собственный шрифт, у
   * нас стоял системный. Системный шрифт в заголовке читается как «страницу
   * не делали, её собрали»: он стоит по умолчанию везде, от настроек
   * телефона до панели управления хостингом.
   */
  // Именно таблица стилей, а не preconnect: preconnect только открывает
  // соединение и ни одного шрифта не приносит.
  const webFont = /<link[^>]+rel="stylesheet"[^>]+fonts\.googleapis\.com/.test(html) || /@font-face/.test(css);
  if (!webFont) {
    out.push({ code: "font", text: "Страница набрана системным шрифтом: своей гарнитуры нет." });
  }

  /*
   * 6. Размеры шрифта — из шкалы.
   *
   * Главная причина самодельного вида, названная разведкой: значения
   * выбирались на глаз. 74, 44, 33, 23, 19, 17, 15, 13 — восемь чисел, ни
   * одно из которых ни из чего не следует. Шкала решает это один раз, а
   * проверка стережёт, чтобы в неё не дописали «ну тут на два больше».
   *
   * У clamp() проверяются края: середина — это наклон, посчитанный из тех же
   * краёв, и в шкале ей взяться неоткуда.
   */
  const sizes: number[] = [];
  for (const declaration of css.matchAll(/font-size\s*:\s*([^;}]+)/g)) {
    const value = declaration[1];
    const clamped = value.match(/clamp\(\s*([\d.]+)px[^,]*,[^,]+,\s*([\d.]+)px/);
    if (clamped) sizes.push(Number(clamped[1]), Number(clamped[2]));
    else for (const plain of value.matchAll(/(?:^|[\s(])([\d.]+)px/g)) sizes.push(Number(plain[1]));
  }
  const offScale = [...new Set(sizes)].filter((size) => !(TYPE as readonly number[]).includes(size));
  if (offScale.length) {
    out.push({ code: "scale", text: `Размеры шрифта не из шкалы: ${offScale.join(", ")}.` });
  }

  // 7. Движения, названные блокам, существуют.
  //
  // Опечатка в имени не ломает страницу заметно: блок просто остаётся без
  // анимации, и заметить это можно, только пролистав до него на том
  // браузере, где анимация вообще работает.
  const named = new Set<string>();
  for (const attribute of html.matchAll(/\bclass="([^"]*)"/g)) {
    for (const token of attribute[1].split(/\s+/)) if (token.startsWith("m-")) named.add(token.slice(2));
  }
  const unknown = [...named].filter((key) => !MOTIONS[key]);
  if (unknown.length) {
    out.push({ code: "motion", text: `Блокам назначены несуществующие анимации: ${unknown.join(", ")}.` });
  }

  // Слои параллакса не перехватывают нажатия. Слой поверх кнопки — это не
  // украшение, а поломка, и на телефоне она выглядит как «сайт не работает».
  if (/class="par"/.test(html) && !/\.par\{[^}]*pointer-events:none/.test(css)) {
    out.push({ code: "motion", text: "Слой параллакса ловит нажатия: кнопка под ним перестанет работать." });
  }

  // 8. Анимация не трогает вёрстку.
  const heavy = keyframeProperties(css).filter((property) => !ALLOWED_IN_KEYFRAMES.has(property));
  if (heavy.length) {
    out.push({ code: "repaint", text: `В @keyframes не только transform и opacity: ${heavy.join(", ")}.` });
  }

  // 9. Вбок ничего не уезжает. Проверка дешёвая и не заменяет телефон:
  // окончательно это видно только на снимке в 360 px, который снимает
  // scripts/proto-shot.mjs.
  if (/\b100vw\b/.test(css)) {
    out.push({ code: "overflow", text: "Ширина 100vw шире страницы на величину полосы прокрутки." });
  }
  if (!/overflow-x\s*:\s*clip/.test(css)) {
    out.push({ code: "overflow", text: "Нет overflow-x: clip — уехавший вбок блок даст горизонтальную прокрутку." });
  }

  // 10. Главная кнопка работает.
  const action = mainAction(facts);
  if (action.kind === "none") {
    out.push({ code: "action", text: "Нечего поставить на кнопку: нет ни телеграма, ни ватсапа, ни телефона." });
  } else if (!html.includes(action.href)) {
    out.push({ code: "action", text: "Кнопка на странице ведёт не туда, куда должна." });
  }
  if (/href="#"/.test(html)) {
    out.push({ code: "action", text: "На странице есть ссылка в никуда." });
  }

  // 11. Страница не индексируется.
  if (!/<meta\s+name="robots"[^>]*noindex/i.test(html)) {
    out.push({ code: "index", text: "Нет noindex. Чужой бизнес в выдаче Google — чужой бизнес, продвигаемый без спроса." });
  }

  // 12. Имя клиента на месте: без него он не узнает свой бизнес.
  if (!text.includes(facts.name)) {
    out.push({ code: "nameless", text: "На странице нет названия компании." });
  }

  // 13. Снимок для трюка годится к вращению.
  for (const problem of wheelProblems(facts.wheel)) {
    out.push({ code: "wheel", text: `Снимок для трюка: ${problem}.` });
  }

  // 14. Подсказки для первички в текст не просачиваются.
  const known = facts.services.map((service) => service.name.toLowerCase());
  const leaked = niche.ask.filter(
    (hint) => lower.includes(hint.toLowerCase()) && !known.some((name) => name.includes(hint.toLowerCase())),
  );
  if (leaked.length) {
    out.push({
      code: "guessed",
      text: `Услуги, о которых компания не говорила: ${leaked.join(", ")}. Это вопросы для первички, а не текст страницы.`,
    });
  }

  return out;
}
