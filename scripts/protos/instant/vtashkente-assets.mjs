// Стили и скрипты макета vTashkente — для шаблона «Мебель» в «Макете в боте».
//
// Владелец, 11.11.2026: «Так ты и бери макеты, которые мы уже делали, просто
// вешай их логотип пока и другую инфу». Шаблон мебели — главная нашего
// макета vTashkente (scripts/protos/vtashkente): её style.css, assembly.js
// (кухня собирается по прокрутке, нарисована кодом) и site.js берутся
// отсюда как есть. Правится только то, что зашито под vTashkente: их
// оранжевый, вписанный числами, ключ браузера и метка числа скрипта.
// Каждая замена проверяется: поменялся макет vTashkente и замена не
// нашлась — скрипт падает, а не тихо собирает чужое.
//
//   node scripts/protos/instant/vtashkente-assets.mjs
//
// Пишет content/proto-instant/vtashkente-assets.json; тест сверяет его с макетом.
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { ADDONS as ENOT_ADDONS } from "../enotmebel/plan.mjs";

const VT = new URL("../vtashkente/", import.meta.url);
const read = (f) => readFileSync(new URL(f, VT), "utf8");

// Их фирменный оранжевый — через переменные: шаблон красит его в цвет
// клиента (lib/proto/instant/mebel, palette).
const CSS_SWAPS = [
  ["#e34623", "var(--or)"],
  ["rgb(227 70 35", "rgb(var(--or-rgb)"],
];

const ASM_SWAPS = [
  // Оранжевый в сцене сборки — цвет клиента из стилей страницы.
  ["or:'#e34623'", "or:(getComputedStyle(d.documentElement).getPropertyValue('--or').trim()||'#e34623')"],
];

const JS_SWAPS = [
  ["JSON.parse(($('#i18n')||{}).textContent||'{}')", "JSON.parse(($('#im-i18n')||{}).textContent||'{}')"],
  // Метка числа скрипта: при показе число сдвигается, свой сдвиг у клиента (lib/proto/stamp).
  ["toastT=setTimeout(function(){toast.hidden=true},3200)", "toastT=setTimeout(function(){toast.hidden=true},/*~*/3200)"],
];

// Комментарии макета — про vTashkente и чужие макеты-образцы; клиенту они
// не нужны. Метку числа скрипта «/*~*/» не трогаем.
const noComments = (text) => text.replace(/\/\*(?!~\*\/)[\s\S]*?\*\//g, "");

function swap(text, swaps, file) {
  let out = text;
  for (const [from, to] of swaps) {
    if (!out.includes(from)) throw new Error(`${file} vTashkente изменился: не нашлось «${from}»`);
    out = out.split(from).join(to);
  }
  return out;
}

/** Допы — из плана нашего мебельного макета Enotmebel: цены и названия оттуда. */
const ADDONS = ["cart", "pay", "nasiya", "b2b", "uz"];

export function vtashkenteAssets() {
  // Картинок vTashkente в стилях нет (их фото — в разметке), но метку
  // убираем, как в gen.mjs, чтобы стиль не ссылался никуда.
  const css = swap(read("style.css").replace(/\n\s*/g, "").replace(/__IMG__/g, "/protos/_niche/mebel"), CSS_SWAPS, "style.css");
  const asm = swap(read("assembly.js"), ASM_SWAPS, "assembly.js");
  const js = swap(read("site.js"), JS_SWAPS, "site.js");
  const addons = ADDONS.map((id) => {
    const x = ENOT_ADDONS.find((e) => e.id === id);
    if (!x) throw new Error(`plan.mjs Enotmebel: нет допа «${id}»`);
    return { id, price: x.price, ru: x.ru.t, uz: x.uz.t };
  });
  return { css: noComments(css), asm: noComments(asm), js: noComments(js), addons };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  writeFileSync(new URL("../../../content/proto-instant/vtashkente-assets.json", import.meta.url), `${JSON.stringify(vtashkenteAssets())}\n`);
  console.log("vtashkente-assets.json записан");
}
