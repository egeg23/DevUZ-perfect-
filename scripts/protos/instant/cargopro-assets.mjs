// Стили сайта и панель макета CARGO PRO GROUP — для шаблона «Логистика» в
// «Макете в боте».
//
// Владелец, 12.11.2026: «Мы теряем лидов из-за того, что они нажимают
// "другая ниша"… выведем больше ниш которые у нас есть, также переодевать
// просто». Шаблон логистики — сайт нашего макета Cargo Pro
// (scripts/protos/cargopro): его site.css как есть, те же блоки и классы;
// админка — его «Обычная админка» (panel.css и panel.js как есть).
//
// Правится только то, что зашито под Cargo Pro: их знак и имя в шапке
// панели, ссылки на выбор и супер-админку, номера грузов «CPG-», ключи
// памяти браузера (свои у шаблона, чтобы не путаться с макетом Cargo Pro на
// том же адресе), сумма заявки с сайта (у клиента цены нет — «по запросу»).
// Каждая замена проверяется: поменялся макет и замена не нашлась — скрипт
// падает, а не тихо собирает чужое.
//
// Скрипт сайта Cargo Pro (site.js) не берётся: он весь про их направления,
// ставки и сцену залёта. Поведение то же (шапка, появление блоков, стекло,
// бегущие строки, окно заявки, «Мои заявки»), написано в шаблоне.
//
//   node scripts/protos/instant/cargopro-assets.mjs
//
// Пишет content/proto-instant/cargopro-assets.json; тест сверяет его с макетом.
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { PANEL_UI } from "../cargopro/panel-ui.mjs";
import { LANES } from "../cargopro/tariffs.mjs";

const CP = new URL("../cargopro/", import.meta.url);
const read = (f) => readFileSync(new URL(f, CP), "utf8");

// Комментарии макета — про Cargo Pro. Метку «/*~*/» не трогаем.
const noComments = (text) => text.replace(/\/\*(?!~\*\/)[\s\S]*?\*\//g, "");

function swap(text, swaps, file) {
  let out = text;
  for (const [from, to] of swaps) {
    if (!out.includes(from)) throw new Error(`${file} Cargo Pro изменился: не нашлось «${from}»`);
    out = out.split(from).join(to);
  }
  return out;
}

const PANEL_SWAPS = [
  // Знак и имя клиента вместо логотипа Cargo Pro.
  ["<img src=\"'+D.logo+'\" alt=\"CARGO PRO GROUP\" width=\"670\" height=\"249\">", "'+D.mark+'"],
  // Ссылок «К выбору» и «Супер-админка» у шаблона нет.
  ["<a class=\"btn btn-g btn-s\" href=\"'+D.home+'\">'+t('home')+'</a><a class=\"btn btn-g btn-s pn-disp\" href=\"'+D.disp+'\">'+t('disp')+'</a>", ""],
  // Ключи памяти — свои у шаблона: заявка с сайта шаблона приходит сюда.
  ["'cp-panel-1'", "'lg-panel-1'"],
  ["'cp-req-1'", "'lg-req-1'"],
  // Номера грузов — без букв Cargo Pro Group.
  ["CPG-", "GR-"],
  // Заявка с сайта шаблона — без суммы: цену называет менеджер.
  ["function usd(n){return fmt(n)+' $'}", "function usd(n){return n?fmt(n)+' $':t('ask')}"],
  // Направление заявки с сайта — словами клиента.
  ["function route(o){return esc(L[o.dir].n)+' · '+t('m_'+o.m)}", "function route(o){return esc((L[o.dir]||{n:o.from||t('from_site')}).n)+(o.m?' · '+t('m_'+o.m):'')}"],
  ["return{id:r.id,at:r.at,co:r.co||r.n,who:r.n,ph:r.ph,dir:r.dir,m:r.m,kg:r.cw,ct:r.ct,tot:r.tot,txt:r.txt,s0:0}", "return{id:r.id,at:r.at,co:r.co||r.n,who:r.n,ph:r.ph,dir:'own',from:r.from,m:r.m,kg:r.cw,ct:r.ct,tot:0,txt:r.txt,s0:0}"],
  ["esc(L[k].n)", "esc((L[k]||{n:t('from_site')}).n)"],
  // Демо-сумма — от средней ставки, метка числа остаётся у отпечатка.
  ["var MG=.18;", "var MG=/*~*/0.18;"],
];

/** Подписи панели, которых у Cargo Pro нет. */
const UI_EXTRA = {
  ask: ["по запросу", "so‘rov bo‘yicha"],
  from_site: ["Заявка с сайта", "Saytdan ariza"],
};

export function cargoproAssets() {
  const css = noComments(read("site.css")).replace(/\n\s*/g, "");
  const panelCss = noComments(read("panel.css")).replace(/\n\s*/g, "");
  const panelJs = swap(noComments(read("panel.js")), PANEL_SWAPS, "panel.js").replace(/\n\s*\n/g, "\n");
  const ui = { ...PANEL_UI, ...UI_EXTRA };
  // Демо-направления панели: ставки — ориентир рынка из конструктора Cargo Pro, без их городов.
  const lanes = LANES.map((x) => ({ id: x.id, ru: x.ru, uz: x.uz, air: x.air, auto: x.auto, rail: x.rail, sea: x.sea }));
  return { css, panelCss, panelJs, ui, lanes };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  writeFileSync(new URL("../../../content/proto-instant/cargopro-assets.json", import.meta.url), `${JSON.stringify(cargoproAssets())}\n`);
  console.log("cargopro-assets.json записан");
}
