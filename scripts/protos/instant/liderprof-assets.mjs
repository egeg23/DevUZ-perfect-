// Стили и скрипт макета LIDER PROF PROEKT — для шаблона «Стройка и ремонт»
// в «Макете в боте».
//
// Владелец, 12.11.2026: «Мы теряем лидов из-за того, что они нажимают
// "другая ниша"… выведем больше ниш которые у нас есть, также переодевать
// просто». Шаблон стройки и ремонта — главная нашего макета Lider Prof
// (scripts/protos/lider-prof): её style.css и client.js берутся отсюда как
// есть. Правится только то, что зашито под Lider Prof: их красный, вписанный
// числами, имя в заголовке вкладки, ключ строк страницы, открытие чата
// студии (у клиента его может не быть) и метка числа скрипта. Каждая замена
// проверяется: поменялся макет Lider Prof и замена не нашлась — скрипт
// падает, а не тихо собирает чужое.
//
//   node scripts/protos/instant/liderprof-assets.mjs
//
// Пишет content/proto-instant/liderprof-assets.json; тест сверяет его с макетом.
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const LP = new URL("../lider-prof/", import.meta.url);
const read = (f) => readFileSync(new URL(f, LP), "utf8");

// Их фирменный красный — через переменные: шаблон красит его в цвет клиента
// (lib/proto/instant/stroitelstvo, palette). Сами --red и --red2 стоят в :root
// макета, поверх них шаблон пишет свои.
const CSS_SWAPS = [["rgb(215 38 43", "rgb(var(--red-rgb)"]];

const JS_SWAPS = [
  ["L=JSON.parse($('i18n').textContent)", "L=JSON.parse($('im-i18n').textContent)"],
  // Страница проекта макета: имени их студии в заголовке вкладки клиента нет.
  ["d.title=P.n+' | LIDER PROF PROEKT';", "d.title=P.n;"],
  // Чата у клиента может не быть: тогда текст только копируется.
  ["window.open(L.tg,'_blank','noopener');", "if(L.tg)window.open(L.tg,'_blank','noopener');"],
  // Метка числа скрипта: при показе число сдвигается, свой сдвиг у клиента (lib/proto/stamp).
  ["setTimeout(function(){im.src=src+'?r='+tries},900*tries)", "setTimeout(function(){im.src=src+'?r='+tries},/*~*/900*tries)"],
];

// Комментарии макета — про Lider Prof и чужие макеты-образцы; клиенту они
// не нужны. Метку числа скрипта «/*~*/» не трогаем.
const noComments = (text) => text.replace(/\/\*(?!~\*\/)[\s\S]*?\*\//g, "");

function swap(text, swaps, file) {
  let out = text;
  for (const [from, to] of swaps) {
    if (!out.includes(from)) throw new Error(`${file} Lider Prof изменился: не нашлось «${from}»`);
    out = out.split(from).join(to);
  }
  return out;
}

export function liderprofAssets() {
  const css = swap(noComments(read("style.css")).replace(/\n\s*/g, "").replace(/__IMG__/g, "/protos/_niche/stroitelstvo"), CSS_SWAPS, "style.css");
  const js = swap(read("client.js"), JS_SWAPS, "client.js");
  return { css, js: noComments(js) };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  writeFileSync(new URL("../../../content/proto-instant/liderprof-assets.json", import.meta.url), `${JSON.stringify(liderprofAssets())}\n`);
  console.log("liderprof-assets.json записан");
}
