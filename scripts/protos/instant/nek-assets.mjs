// Стили и скрипт сайта Nek Dental Studio — для шаблона «Макета в боте».
//
// Владелец, 10.11.2026: «бери наши макеты и лепи логотипы, цены и
// контактные данные клиента… А то ты заново будто делаешь». Шаблон
// стоматологии — страница сайта нашего макета Nek (scripts/protos/nek):
// её site.css и site.js берутся отсюда как есть. Правится только то, что
// зашито под Nek: код страны в поле телефона, часы записи 11:00-19:00,
// воскресенье выходной и WhatsApp как единственный путь записи. Каждая
// замена проверяется: поменялся макет Nek и замена не нашлась — скрипт
// падает, а не тихо собирает чужое.
//
//   node scripts/protos/instant/nek-assets.mjs
//
// Пишет content/proto-instant/nek-assets.json; тест сверяет его с макетом.
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const NEK = new URL("../nek/", import.meta.url);
const read = (f) => readFileSync(new URL(f, NEK), "utf8");
// Так же, как gen.mjs Nek: комментарии уходят, метка числа `/*~*/` остаётся.
const strip = (s) => s.replace(/\/\*(?!~\*\/)[\s\S]*?\*\//g, "");

const JS_SWAPS = [
  // Ключи браузера свои: состояние макета Nek и макета клиента не смешиваются.
  ["var KEY='nk-demo-1';", "var KEY='im-demo-1';"],
  ["put('nk-mine-1',l.id)", "put('im-mine-1',l.id)"],
  ["get('nk-mine-1','')", "get('im-mine-1','')"],
  ["get('nk-cfg-1',{})", "get('im-cfg-1',{})"],
  ["$('#nk-data')", "$('#im-data')"],
  // Запись: туда, куда клиент принимает (Telegram, WhatsApp или звонок), а не только wa.me.
  ["function wa(text){return'https://wa.me/'+D.wa+'?text='+encodeURIComponent(text)}", "function wa(text){return D.go?D.go+encodeURIComponent(text):D.tel?'tel:'+D.tel:'#'}"],
  // Дни и часы — из данных шаблона, не из часов Nek.
  ["if(x.getDay()===0)continue;", "if(D.off&&D.off.indexOf(x.getDay())>=0)continue;"],
  ["var SLOTS=['11:00','12:30','14:00','15:30','17:00','18:00'];", "var SLOTS=D.slots;"],
  ["placeholder=\"+995\"", "placeholder=\"'+esc(D.ph)+'\""],
];

// Цвета Nek, вписанные в стили числами (блики, тени), — через переменные:
// шаблон красит их в цвет клиента (lib/proto/instant/dental, palette).
const CSS_SWAPS = [
  ["141 74 139", "var(--orchid-rgb)"],
  ["43 29 51", "var(--ink-rgb)"],
  ["30 18 36", "var(--ink-rgb)"],
];

/*
 * Пролёт по прокрутке — та же сцена, что у первой страницы Nek (land.js):
 * кадры под шифром, мягкий догон, смесь соседних кадров, видео телефону.
 * Берётся только сам пролёт, без конструктора цены; данные — из #im-land.
 */
const SCENE_FROM = "var hs=$('.hs');";
const SCENE_TO = "var cfg=get('nk-cfg-1',{}),boxes";
function sceneJs() {
  const land = strip(read("land.js")).replace(/\n\s*\n/g, "\n");
  const a = land.indexOf(SCENE_FROM);
  const b = land.indexOf(SCENE_TO);
  if (a < 0 || b < 0 || b < a) throw new Error("land.js Nek изменился: не нашлась сцена пролёта");
  const helpers = "var d=document,w=window,$=function(s,r){return(r||d).querySelector(s)},$$=function(s,r){return[].slice.call((r||d).querySelectorAll(s))};var D=JSON.parse($('#im-land').textContent);var RM=w.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;function cl(x){return x<0?0:x>1?1:x}function pad(n,k){n=String(n);while(n.length<(k||2))n='0'+n;return n}";
  return `(function(){'use strict';${helpers}\n${land.slice(a, b).trim()}\n})();`;
}

export function nekAssets() {
  let css = strip(read("site.css")).replace(/\n\s*/g, "");
  for (const [from, to] of CSS_SWAPS) {
    if (!css.includes(from)) throw new Error(`site.css Nek изменился: не нашлось «${from}»`);
    css = css.split(from).join(to);
  }
  let js = strip(read("site.js")).replace(/\n\s*\n/g, "\n");
  for (const [from, to] of JS_SWAPS) {
    if (!js.includes(from)) throw new Error(`site.js Nek изменился: не нашлось «${from}»`);
    js = js.split(from).join(to);
  }
  return { css, js, scene: sceneJs() };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  writeFileSync(new URL("../../../content/proto-instant/nek-assets.json", import.meta.url), `${JSON.stringify(nekAssets())}\n`);
  console.log("nek-assets.json записан");
}
