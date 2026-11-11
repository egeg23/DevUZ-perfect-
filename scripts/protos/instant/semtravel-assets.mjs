// Стили, скрипт и иконки макета SEM Travel — для шаблона «Турагентство» в «Макете в боте».
//
// Владелец, 11.11.2026: «Остальные категории тоже делаем по принципу как
// сделали со стоматологией». Шаблон турагентства — страница нашего макета
// SEM Travel (scripts/protos/semtravel): её site.css, site.js и значки
// берутся отсюда как есть. Правится только то, что зашито под SEM Travel
// и что было бы неправдой о другом агентстве: их оранжевый — в переменные
// (цвет клиента), выдача с «примером расчёта» туров (их наценки за отель и
// сезон) — поиск сразу ведёт в заявку, календарь цен по дням (числа из
// хеша) не рисуется, без их Telegram заявка уходит в чат клиента. GSAP
// скрипт со стороны, в шаблон не идёт: дуги карты стоят сразу (в site.js
// он уже необязательный). Каждая замена проверяется: поменялся макет и
// замена не нашлась — скрипт падает, а не тихо собирает чужое.
//
//   node scripts/protos/instant/semtravel-assets.mjs
//
// Пишет content/proto-instant/semtravel-assets.json; тест сверяет его с макетом.
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const ST = new URL("../semtravel/", import.meta.url);
const read = (f) => readFileSync(new URL(f, ST), "utf8");

const CSS_SWAPS = [
  // Цвет клиента: переменные остаются, шаблон переопределяет их после стилей.
  ["--sun:#f08a2c;--sun2:#ffa552;", "--sun:#f08a2c;--sun2:#ffa552;--sun-rgb:240 138 44;"],
  ["rgb(240 138 44", "rgb(var(--sun-rgb)"],
];

const JS_SWAPS = [
  ["JSON.parse($('#st-site').textContent)", "JSON.parse($('#tr-data').textContent)"],
  ["'st-bron'", "'tr-bron'"],
  // Метка числа скрипта: при показе число сдвигается, свой сдвиг у клиента (lib/proto/stamp).
  ["var IDLE=3000,", "var IDLE=/*~*/3000,"],
  // Направлений может не быть: тогда нет ни маршрута, ни карты.
  ["var S={dest:K.dest[0].id,", "var S={dest:K.dest.length?K.dest[0].id:'',"],
  ["\nselDest(cur.id,false);", "\nif(cur)selDest(cur.id,false);"],
  // Календарь цен по дням у SEM Travel — числа из хеша. Цены клиента по дням мы не знаем.
  ["  calendar(x);\n", "\n"],
  // Выдача SEM Travel — пример расчёта по их наценкам. Поиск сразу открывает заявку с выбором.
  ["function runKnow(){", "function runKnow(){var x0=byId(S.dest);openBron({dest:x0?x0.t:'',when:monName(S.mk),who:whoStr()});return;"],
  ["$('#dc-go').onclick=function(){", "var dcg=$('#dc-go');if(dcg)dcg.onclick=function(){"],
  ["$('#tu-book').onclick=function(){openBron(tour)};", ""],
  ["function brSum(o){return o.dest+' · '+o.when+' · '+o.who+' · '+o.hotel+' · '+usd(o.sum)}", "function brSum(o){return[o.dest,o.when,o.who].filter(Boolean).join(' · ')}"],
  // Чата у агентства может не быть: тогда текст копируется и остаются SMS и звонок.
  [
    "var a=d.createElement('a');a.href=K.tg+'?text='+encodeURIComponent(msg);a.target='_blank';a.rel='noopener';d.body.appendChild(a);a.click();a.remove();",
    "if(K.tg){var a=d.createElement('a');a.href=K.tg+'?text='+encodeURIComponent(msg);a.target='_blank';a.rel='noopener';d.body.appendChild(a);a.click();a.remove()}",
  ],
];

// Комментарии макета — про SEM Travel; клиенту они не нужны. Метку «/*~*/» не трогаем.
const noComments = (text) => text.replace(/\/\*(?!~\*\/)[\s\S]*?\*\//g, "");

function swap(text, swaps, file) {
  let out = text;
  for (const [from, to] of swaps) {
    if (!out.includes(from)) throw new Error(`${file} SEM Travel изменился: не нашлось «${from}»`);
    out = out.split(from).join(to);
  }
  return out;
}

/** Значки SEM Travel — те же пути, что в их gen.mjs (const I). */
function icons() {
  const gen = read("gen.mjs");
  const from = gen.indexOf("const S = ");
  const to = gen.indexOf("const sprite");
  if (from < 0 || to < from) throw new Error("gen.mjs SEM Travel изменился: не нашлось значков");
  return new Function(`${gen.slice(from, to)}; return I;`)();
}

export function semtravelAssets() {
  const css = swap(noComments(read("site.css")).replace(/\n\s*/g, ""), CSS_SWAPS, "site.css");
  const js = swap(noComments(read("site.js")), JS_SWAPS, "site.js").replace(/\n\s*\n/g, "\n");
  return { css, js, icons: icons() };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  writeFileSync(new URL("../../../content/proto-instant/semtravel-assets.json", import.meta.url), `${JSON.stringify(semtravelAssets())}\n`);
  console.log("semtravel-assets.json записан");
}
