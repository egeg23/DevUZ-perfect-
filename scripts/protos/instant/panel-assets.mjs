// Админки наших макетов — для страницы «Админка» в «Макете в боте».
//
// Владелец, 11.11.2026: «Ты добавляй админки тоже чтобы посмотреть. Также
// берем готовые админки которые у нас есть а не отрисовываем их заново.
// Фаршируем мощно (прям чтобы были вау админки под каждую категорию)».
// Поэтому админка сферы — панель того же нашего макета, из которого собран
// шаблон сферы: её panel.css и panel.js как есть, данные — JSON, который
// пишет шаблон из данных клиента. Ключи памяти браузера у панели те же,
// что у сайта шаблона: заявка, бронь или заказ с макета клиента приходят в
// его админку первой строкой.
//
// Правится только то, что зашито под прошлого клиента: имя и знак — из
// данных (P.name, P.mark), имена файлов выгрузок, код страны в телефонах,
// валюта. Каждая замена проверяется: поменялся макет и замена не нашлась —
// скрипт падает, а не тихо собирает чужое.
//
//   node scripts/protos/instant/panel-assets.mjs
//
// Пишет content/proto-instant/panel-assets.json; тест сверяет его с макетами.
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { PANEL_UI as AGORA_UI } from "../agora/ui.mjs";
import { PANEL_UI as SUNDAY_UI } from "../sunday/ui.mjs";
import { PANEL_UI as FINTAX_UI } from "../fintax/panel-ui.mjs";

const read = (m, f) => readFileSync(new URL(`../${m}/${f}`, import.meta.url), "utf8");

// Комментарии макета — про прошлого клиента. Метку «/*~*/» не трогаем.
const noComments = (text) => text.replace(/\/\*(?!~\*\/)[\s\S]*?\*\//g, "");

function swap(text, swaps, file) {
  let out = text;
  for (const [from, to] of swaps) {
    if (!out.includes(from)) throw new Error(`${file} изменился: не нашлось «${from}»`);
    out = out.split(from).join(to);
  }
  return out;
}

/** Nek Dental Studio — панель клиники: записи, расписание по врачам, сообщения всех каналов, подключения, роли. */
const NEK_JS = [
  ["<b>Nek Dental Studio</b>", "<b>'+esc(P.name)+'</b>"],
  ["'+995 5•• ••• '", "'+998 9• ••• •• '"],
  ["+' ₾'", "+' '+P.cur"],
  // Средний чек демо — в валюте клиента: множитель из данных, метка числа остаётся.
  ["var AVG=/*~*/180;", "var AVG=/*~*/180*(P.k||1);"],
  ["(came*AVG).toLocaleString('en')", "Math.round(came*AVG).toLocaleString('en')"],
];

/** Agora — панель ресторана: вход, брони, заказы, бот, меню и стоп-лист, доставка, история, выгрузки. */
const AGORA_JS = [
  // Ключи памяти — те же, что у сайта шаблона ресторана (agora-assets: 'ag- → 'ir-).
  ["'ag-", "'ir-"],
  ["var MARK='<svg viewBox=\"0 0 1176 380\" aria-hidden=\"true\" focusable=\"false\"><use href=\"#ag-g\"/></svg>';", "var MARK=P.mark;"],
  ["<i>A</i><span><b>Agora</b>", "<i>'+esc(P.name.slice(0,1))+'</i><span><b>'+esc(P.name)+'</b>"],
  ["agora-broni", "broni"],
  ["agora-zakazy", "zakazy"],
  ["agora-schet-", "schet-"],
  ["/^ag-(book|ord|bot)-1$/", "/^ir-(book|ord|bot)-1$/"],
  // Демо-заказы — из блюд клиента с ценой (фото блюд у Agora свои); блюд с ценой нет — заказов-примеров нет.
  ["return CAT[m.cat].g==='k'&&m.ph}),demoOrd=[];", "return CAT[m.cat].g==='k'&&m.p}),demoOrd=[];"],
  ["for(i=0;i<6;i++){var it=[[pick(kitchen).id", "for(i=0;kitchen.length&&i<6;i++){var it=[[pick(kitchen).id"],
  ['aria-label="AGORA">A</a>', 'aria-label="'+"'+esc(P.name)+'"+'">'+"'+esc(P.name.slice(0,1))+'"+'</a>'],
  ['<h1 style="font-weight:400">AGORA Lounge &amp; bar</h1>', '<h1 style="font-weight:400">'+"'+esc(P.name)+'"+'</h1>'],
];

/** Sunday Event Agency — панель агентства: вход кодом, заявки со статусами, календарь занятых дат, участники, история, выгрузки. */
const SUNDAY_JS = [
  // Ключи памяти — свои у шаблона.
  ["'sn-", "'tv-"],
  ["var MARK='<svg viewBox=\"0 0 400 400\" aria-hidden=\"true\" focusable=\"false\"><use href=\"#sn-g\"/></svg>';", "var MARK=P.mark;"],
  ['aria-label="Sunday">S</a>', 'aria-label="'+"'+esc(P.name)+'"+'">'+"'+esc(P.name.slice(0,1))+'"+'</a>'],
  ["<i>S</i><span><b>Sunday Event Agency</b>", "<i>'+esc(P.name.slice(0,1))+'</i><span><b>'+esc(P.name)+'</b>"],
  ["sunday-zayavki", "zayavki"],
  ["sunday-gosti", "uchastniki"],
  // Сколько людей в заявке — множителем из данных: у турагентства туристов единицы, а не сотни гостей свадьбы.
  [
    "g=k==='party'?20+Math.floor(rnd()*30):k==='call'||k==='date'?0:60+Math.floor(rnd()*240);",
    "g=k==='call'||k==='date'?0:Math.max(1,Math.round((k==='party'?20+Math.floor(rnd()*30):60+Math.floor(rnd()*240))*(P.gk||1)));",
  ],
];

/** FinTax — панель компании услуг: заявки, клиенты на обслуживании, тарифы, команда и роли, история. */
const FINTAX_JS = [["'ft-", "'fe-"]];

/** Значки панели FinTax — те же пути, что в их gen.mjs (SPRITE). */
function fintaxSprite() {
  const gen = read("fintax", "gen.mjs");
  const sp = gen.match(/^const SP = [^\n]*$/m);
  const from = gen.indexOf("const SPRITE = {");
  const to = gen.indexOf("const sprite = ");
  if (!sp || from < 0 || to < from) throw new Error("fintax/gen.mjs изменился: не нашлось значков");
  return new Function(`${sp[0]}\n${gen.slice(from, to)}; return SPRITE;`)();
}

/** Подписи FinTax: [ru, uz] (третий, английский, шаблону не нужен), имя — «{name}». */
const fintaxUi = () => Object.fromEntries(Object.entries(FINTAX_UI).map(([k, v]) => [k, v.slice(0, 2).map((x) => x.split("FinTax").join("{name}"))]));

/** Подписи Agora: имя ресторана — местом «{name}», шаблон ставит имя клиента. */
const agoraUi = () => Object.fromEntries(Object.entries(AGORA_UI).map(([k, v]) => [k, v.map((x) => x.split("Agora").join("{name}"))]));

/** Подписи Sunday: имя агентства — местом «{name}». */
const sundayUi = () => Object.fromEntries(Object.entries(SUNDAY_UI).map(([k, v]) => [k, v.map((x) => x.split("Sunday").join("{name}"))]));

export function panelAssets() {
  const nekJs = swap(noComments(read("nek", "panel.js")), NEK_JS, "nek/panel.js").replace(/\n\s*\n/g, "\n");
  const agJs = swap(noComments(read("agora", "panel.js")), AGORA_JS, "agora/panel.js").replace(/\n\s*\n/g, "\n");
  return {
    nek: { css: noComments(read("nek", "panel.css")).replace(/\n\s*/g, ""), js: nekJs },
    sunday: {
      css: noComments(read("sunday", "site.css")).replace(/\n\s*/g, "") + noComments(read("sunday", "panel.css")).replace(/\n\s*/g, ""),
      js: swap(noComments(read("sunday", "panel.js")), SUNDAY_JS, "sunday/panel.js").replace(/\n\s*\n/g, "\n"),
      ui: sundayUi(),
    },
    fintax: {
      css: noComments(read("fintax", "panel.css")).replace(/\n\s*/g, ""),
      js: swap(noComments(read("fintax", "panel.js")), FINTAX_JS, "fintax/panel.js").replace(/\n\s*\n/g, "\n"),
      ui: fintaxUi(),
      sprite: fintaxSprite(),
    },
    agora: { css: noComments(read("agora", "panel.css")).replace(/\n\s*/g, ""), js: agJs, ui: agoraUi() },
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  writeFileSync(new URL("../../../content/proto-instant/panel-assets.json", import.meta.url), `${JSON.stringify(panelAssets())}\n`);
  console.log("panel-assets.json записан");
}
