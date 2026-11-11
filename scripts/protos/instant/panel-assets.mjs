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

/** Подписи Agora: имя ресторана — местом «{name}», шаблон ставит имя клиента. */
const agoraUi = () => Object.fromEntries(Object.entries(AGORA_UI).map(([k, v]) => [k, v.map((x) => x.split("Agora").join("{name}"))]));

export function panelAssets() {
  const nekJs = swap(noComments(read("nek", "panel.js")), NEK_JS, "nek/panel.js").replace(/\n\s*\n/g, "\n");
  const agJs = swap(noComments(read("agora", "panel.js")), AGORA_JS, "agora/panel.js").replace(/\n\s*\n/g, "\n");
  return {
    nek: { css: noComments(read("nek", "panel.css")).replace(/\n\s*/g, ""), js: nekJs },
    agora: { css: noComments(read("agora", "panel.css")).replace(/\n\s*/g, ""), js: agJs, ui: agoraUi() },
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  writeFileSync(new URL("../../../content/proto-instant/panel-assets.json", import.meta.url), `${JSON.stringify(panelAssets())}\n`);
  console.log("panel-assets.json записан");
}
