// Стили, скрипт сайта и панель макета SAMIST AUTO — для шаблона «Автосалон»
// в «Макете в боте».
//
// Владелец, 12.11.2026: «Мы теряем лидов из-за того, что они нажимают
// "другая ниша"… выведем больше ниш которые у нас есть, также переодевать».
// Шаблон автосалона — страница сайта нашего макета SAMIST AUTO
// (scripts/protos/samist): её site.css и site.js, панель panel.css и panel.js
// берутся отсюда как есть. Правится только то, что зашито под SAMIST: их
// красный — в переменные (шаблон красит в цвет клиента), ключи данных и
// памяти браузера, путь к фото, цена словами клиента, SMS без телефона,
// ссылка на их объявления, знак и имя в панели, имена выгрузок. Каждая замена
// проверяется: поменялся макет SAMIST и замена не нашлась — скрипт падает, а
// не тихо собирает чужое.
//
// Сцена D-MAX по прокрутке (кадры SamAuto) и залёт в их знак не берутся: это
// их машина и их знак.
//
//   node scripts/protos/instant/samist-assets.mjs
//
// Пишет content/proto-instant/samist-assets.json; тест сверяет его с макетом.
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { PANEL_UI } from "../samist/ui.mjs";

const SM = new URL("../samist/", import.meta.url);
const read = (f) => readFileSync(new URL(f, SM), "utf8");

const CSS_SWAPS = [
  // Цвет клиента: переменные остаются, шаблон переопределяет их после стилей.
  [".btn-a:hover{background:#d4262b}", ".btn-a:hover{background:var(--ah)}"],
  ["--a:#ec3237;--a2:#ff4d52;", "--a:#ec3237;--a2:#ff4d52;--ah:#d4262b;--a-rgb:236 50 55;"],
  ["rgb(236 50 55", "rgb(var(--a-rgb)"],
  ["#ff6a6e", "var(--a2)"],
];

const PANEL_CSS_SWAPS = [["rgb(236 50 55", "rgb(var(--a-rgb)"]];

const JS_SWAPS = [
  ["$('#sm-data')", "$('#as-data')"],
  // Память браузера — своя у шаблона, не пересекается с макетом SAMIST.
  ["'sm-", "'as-"],
  // Фото — полным адресом (нейтральные фото ниши или фото клиента), а не из папки их каталога.
  ["D.img+'/cat/'+", "D.img+"],
  // Цена — числом в сумах, если клиент её так написал, иначе его словами; нет — «уточняйте».
  ["sum(m.price)", "prc(m)"],
  ["function sum(n){return fmt(n)+' '+T.sum}", "function sum(n){return fmt(n)+' '+T.sum}function prc(m){return m.price>0?sum(m.price):(m.pt||T.ask)}"],
  // Порядок клиента по умолчанию; сортировка по цене — только среди машин с ценой.
  ["F={cat:'all',sort:'cheap',isNew:false}", "F={cat:'all',sort:'own',isNew:false}"],
  ["l.sort(function(a,b){return F.sort==='cheap'?a.price-b.price:", "if(F.sort!=='own')l.sort(function(a,b){a=a.price>0?a.price:1e15;b=b.price>0?b.price:1e15;return F.sort==='cheap'?a-b:"],
  ["F.sort==='rich'?b.price-a.price:(b.hp||0)-(a.hp||0)});", "F.sort==='rich'?(b<1e15?b:0)-(a<1e15?a:0):0});"],
  // SMS — только если у салона есть телефон.
  ["if(TOUCH){location.href='sms:'", "if(TOUCH&&D.tel){location.href='sms:'"],
  // Источник цен — сайт клиента, а не их объявления на площадке.
  ["'<p class=\"mdl-src\">'+T.src+' <a href=\"'+m.url+'\" target=\"_blank\" rel=\"noopener\">autoline</a></p></div></div>'", "(T.src?'<p class=\"mdl-src\">'+esc(T.src)+'</p>':'')+'</div></div>'"],
  // Кнопки окна машины — только к блокам, которые есть на странице.
  ["(on('credit')?", "(on('credit')&&crm?"],
  ["(on('drive')?", "(on('drive')&&drf?"],
  ["(on('compare')?", "(on('compare')&&$('#cmp-t')?"],
  ["(on('fleet')?", "(on('fleet')&&fl?"],
  ["a.download='samist-kp.html'", "a.download='kp.html'"],
];

const PANEL_JS_SWAPS = [
  ["'sm-", "'as-"],
  ["var MARK='<svg viewBox=\"0 0 '+P.logo[0]+' '+P.logo[1]+'\" aria-hidden=\"true\" focusable=\"false\"><use href=\"#sm-g\"/></svg>';", "var MARK=P.mark;"],
  ["aria-label=\"SAMIST AUTO\">S</a>", "aria-label=\"'+esc(P.name)+'\">'+esc(P.name.slice(0,1))+'</a>"],
  ["<i>S</i><span><b>SAMIST AUTO</b>", "<i>'+esc(P.name.slice(0,1))+'</i><span><b>'+esc(P.name)+'</b>"],
  ["samist-zayavki", "zayavki"],
  ["samist-nalichie", "nalichie"],
  ["P.img+'/cat/'+", ""],
];

// Подписи панели, где названы чужие машины: словами без марок.
const UI_OVER = {
  ex_trade: ["Машина с пробегом, обмен с доплатой", "Yurgan mashina, qo‘shimcha to‘lov bilan almashtirish"],
  ex_part: ["Запрос детали по VIN", "VIN bo‘yicha qism so‘rovi"],
};

// Комментарии макета — про SAMIST; клиенту они не нужны. Метку «/*~*/» не трогаем.
const noComments = (text) => text.replace(/\/\*(?!~\*\/)[\s\S]*?\*\//g, "");

function swap(text, swaps, file) {
  let out = text;
  for (const [from, to] of swaps) {
    if (!out.includes(from)) throw new Error(`${file} SAMIST изменился: не нашлось «${from}»`);
    out = out.split(from).join(to);
  }
  return out;
}

export function samistAssets() {
  const all = noComments(read("site.css"));
  // Панели нужна основа стилей сайта без первой страницы (как в gen.mjs SAMIST).
  const cut = all.indexOf(".fl-mark{color:#fff");
  if (cut < 0) throw new Error("site.css SAMIST изменился: не нашлось начала первой страницы");
  const css = swap(all.replace(/\n\s*/g, ""), CSS_SWAPS, "site.css");
  const base = swap(all.slice(0, cut).replace(/\n\s*/g, ""), CSS_SWAPS.slice(0, 3), "site.css (основа)");
  const js = swap(noComments(read("site.js")).replace(/\n\s*\n/g, "\n"), JS_SWAPS, "site.js");
  const panelCss = swap(noComments(read("panel.css")).replace(/\n\s*/g, ""), PANEL_CSS_SWAPS, "panel.css");
  const panelJs = swap(noComments(read("panel.js")).replace(/\n\s*\n/g, "\n"), PANEL_JS_SWAPS, "panel.js");
  for (const k of Object.keys(UI_OVER)) if (!PANEL_UI[k]) throw new Error(`ui.mjs SAMIST: нет подписи «${k}»`);
  const ui = { ...PANEL_UI, ...UI_OVER };
  if (/SAMIST|SIA AUTO|autoline/i.test(panelJs + js)) throw new Error("в коде остались имя SAMIST или их площадка");
  return { css, base, js, panel: { css: panelCss, js: panelJs, ui } };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  writeFileSync(new URL("../../../content/proto-instant/samist-assets.json", import.meta.url), `${JSON.stringify(samistAssets())}\n`);
  console.log("samist-assets.json записан");
}
