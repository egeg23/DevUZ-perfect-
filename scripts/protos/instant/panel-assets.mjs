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
import { PANEL_UI as GREENWELL_UI } from "../greenwell/ui.mjs";
import { PANEL_UI as SOFFICE_UI } from "../soffice/panel-ui.mjs";
import { UNITS as SOFFICE_UNITS, inventory as sofficeInventory, TEAM as SOFFICE_TEAM, TENANT_ROOTS, TENANT_KINDS, MARKET as SOFFICE_MARKET, TARIFF as SOFFICE_TARIFF } from "../soffice/panel-data.mjs";

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

/** Greenwell — панель магазина: заказы с историей, отзывы, товары и прибыль, доставка, рассрочка, посещаемость. */
const GREENWELL_JS = [
  ["'gw-", "'mb-"],
  ["'GW-'", "'Z-'"],
  ["IMG=G.img,P={};", "IMG=G.img,P={};function PHO(id){return(G.ph&&G.ph[id])||''}"],
  ["IMG+'/p-'+", "PHO("],
  ["+'-s.webp\"", ")+'\""],
  ["<b>Greenwell</b>", "<b>'+h(G.name)+'</b>"],
  // Заказов в день — множителем из данных: мебель покупают реже, чем биодобавки.
  ["cnt=Math.round((11+rnd()*6)*", "cnt=Math.round((11+rnd()*6)*(G.k||1)*"],
];

/** Значки панели Greenwell — те же пути, что в их gen.mjs (I). */
function greenwellIcons() {
  const gen = read("greenwell", "gen.mjs");
  const sMatch = gen.match(/^const S = [^\n]*$/m);
  const from = gen.indexOf("const I = {");
  const to = gen.indexOf("const sprite = ");
  if (!sMatch || from < 0 || to < from) throw new Error("greenwell/gen.mjs изменился: не нашлось значков");
  return new Function(`${sMatch[0]}\n${gen.slice(from, to)}; return I;`)();
}

/** Подписи Greenwell: имя магазина — местом «{name}». */
const greenwellUi = () => Object.fromEntries(Object.entries(GREENWELL_UI).map(([k, v]) => [k, v.map((x) => x.split("Greenwell").join("{name}"))]));

/** Soffice — панель управляющей компании: заявки и сделки, просмотры, объекты с этажами, договоры, счета, эксплуатация, отчёт собственнику. */
const SOFFICE_JS = [
  ["'so-", "'nv-"],
  ["G=JSON.parse(d.getElementById('sp-data').textContent),U=G.ui,L=G.lang,EN=L==='en';", "G=JSON.parse(d.getElementById('sp-data').textContent),U=G.ui,L=G.lang,EN=L==='en';function BPH(id){return(G.ph&&G.ph[id])||''}"],
  ["/protos/soffice/b-'+b.id+'-560.webp", "'+BPH(b.id)+'"],
  ['<img src="/protos/soffice/logo.webp" alt="Soffice" width="574" height="127">', "'+G.logo+'"],
  ["link='https://soffice.uz/kp/'+l.id.toLowerCase()", "link=G.kp+l.id.toLowerCase()"],
  ["'https://soffice.uz/pay/'+b.id.toLowerCase()", "G.kp+b.id.toLowerCase()"],
  ["<small>Soffice · Global Property Group</small>", "<small>'+h(G.name)+'</small>"],
  ["<code>soffice.uz/kp/'+id.toLowerCase()", "<code>'+h(G.kp)+id.toLowerCase()"],
  ["' · soffice.uz/kp/'+id.toLowerCase()", "' · '+G.kp+id.toLowerCase()"],
];

/** Слова Soffice про бизнес-центры и офисы — словами жилой недвижимости; длинные формы раньше коротких. */
const NEDV_WORDS = [
  ["бизнес-центрам", "домам"], ["бизнес-центров", "домов"], ["бизнес-центрах", "домах"], ["бизнес-центре", "доме"], ["бизнес-центра", "дома"], ["бизнес-центр", "дом"], ["Бизнес-центр", "Дом"],
  ["офисов", "квартир"], ["офисы", "квартиры"], ["офисе", "квартире"], ["офиса", "квартиры"], ["офису", "квартире"], ["офис", "квартира"], ["Офис", "Квартира"],
  ["Biznes-markazlar", "Uylar"], ["biznes-markazlar", "uylar"], ["Biznes-markaz", "Uy"], ["biznes-markaz", "uy"], ["ofislar", "kvartiralar"], ["Ofislar", "Kvartiralar"], ["ofis", "kvartira"], ["Ofis", "Kvartira"],
  ["soffice.uz", "{site}"], ["Soffice", "{name}"], ["БЦ", "дом"],
];
const nedvWord = (x) => NEDV_WORDS.reduce((acc, [a, b]) => acc.split(a).join(b), x);
const sofficeUi = () => Object.fromEntries(Object.entries(SOFFICE_UI).map(([k, v]) => [k, v.slice(0, 2).map((x) => (Array.isArray(x) ? x.map(nedvWord) : nedvWord(x)))]));

/** Значки панели Soffice — те же пути, что в их gen.mjs (SPRITE). */
function sofficeSprite() {
  const gen = read("soffice", "gen.mjs");
  const from = gen.indexOf("const SPRITE = {");
  const to = gen.indexOf("const sprite = ");
  if (from < 0 || to < from) throw new Error("soffice/gen.mjs изменился: не нашлось значков");
  const pre = gen.slice(0, from).match(/^const (SP|P|S) = [^\n]*$/gm) ?? [];
  return new Function(`${pre.join("\n")}\n${gen.slice(from, to)}; return SPRITE;`)();
}

/** Подписи Agora: имя ресторана — местом «{name}», шаблон ставит имя клиента. */
const agoraUi = () => Object.fromEntries(Object.entries(AGORA_UI).map(([k, v]) => [k, v.map((x) => x.split("Agora").join("{name}"))]));

/** Подписи Sunday: имя агентства — местом «{name}». */
const sundayUi = () => Object.fromEntries(Object.entries(SUNDAY_UI).map(([k, v]) => [k, v.map((x) => x.split("Sunday").join("{name}"))]));

/**
 * «Сияние Севера» — админка клиники косметологии: заявки, «Сообщения» всех
 * каналов одним окном, раздел «Сайт», подключения, команда, история. У неё
 * настоящий сервер; в макете вместо него демо в памяти браузера (PD.demo
 * ставит шаблон салона), поэтому запросы уходят туда, а не в сеть.
 */
const SYANIE_JS = [
  ["var d=document,app=d.getElementById('app');", "var d=document,app=d.getElementById('app');var PD=JSON.parse(d.getElementById('pn-data').textContent),DEMO=window.__sd(PD);"],
  ['<div class="brand"><i>С</i>Сияние Севера</div>', "<div class=\"brand\">'+PD.sign+'<span>'+h(PD.name)+'</span></div>"],
  ["Код установки лежит на сервере клиники в файле /opt/syanie/.env, строка SETUP_CODE. Его даст тот, кто ставил сайт.", "Код установки даст тот, кто ставил сайт."],
  ["Евгений Реутов", "Ваше имя"],
  [", заявки — по кнопке", ", заявки по кнопке"],
  ["Заявки с сайта, переписка из всех мессенджеров и подключения.", "Заявки с сайта, переписка из всех мессенджеров, статьи и управление сайтом. В макете подойдут любой логин и пароль."],
  ["Статус видит и пациент: на сайте у него стоит отметка о заявке.", "Статус видит вся команда."],
  ["главного врача", "владельца"],
  ["Главный врач", "Владелец"],
  ["главный врач", "владелец"],
  ["Пациент", "Клиент"],
  ["пациент", "клиент"],
  ["'Клиника'", "PD.name"],
  ["Пришли на приём", "Пришли в салон"],
  ["боту клиники", "боту салона"],
  [", например «Сияние Севера»", ""],
  ["siyanie или siyanie.amocrm.ru", "salon или salon.amocrm.ru"],
  ["'/protos/syanie/'+h(val)+'.webp'", "h(val)"],
  ["Цены, услуги, акции, врачи, вопросы, отзывы и тексты. Сохранили: сайт обновился сразу.", "Услуги и цены, акции, мастера, контакты и тексты. На рабочем сайте правка видна сразу, в макете она остаётся в админке."],
  ['href="/" target="_blank" rel="noopener">Открыть сайт', "href=\"'+PD.site+'\" target=\"_blank\" rel=\"noopener\">Открыть сайт"],
  ["Сохранено, сайт обновлён", "Сохранено"],
  ["instagram:'Instagram'", "instagram:'Instagram Direct'"],
  ["Сайт, Telegram, WhatsApp, Instagram, ВКонтакте и Авито в одном окне.", "Сайт, Telegram, WhatsApp, Instagram Direct и ВКонтакте в одном окне."],
  // Новые разделы макета салона: «Статьи» и значок к ним; сам раздел дописывает шаблон через __sx.
  ["['sayt','Сайт','globe'],", "['sayt','Сайт','globe'],['stati','Статьи','doc'],"],
  ["var ICONS={globe:", "var ICONS={doc:'<path d=\"M6 3.5h8l4 4v13H6zM14 3.5v4h4M9 12h6M9 16h6\" '+P+'/>',globe:"],
  ["'<div class=\"pg-h\"><div><h1>'+t+'</h1>'", "'<div class=\"pg-h\"><div><h1>'+t+' <span class=\"pn-demo\">демо-данные</span></h1>'"],
  ["boot();\n})();", "if(window.__sx)window.__sx({api:api,pg:pg,h:h,$:$,$$:$$,VIEWS:VIEWS,toast:toast,busy:busy,when:when,ic:ic});boot();\n})();"],
];

function syanieJs() {
  const src = noComments(read("syanie", "app/admin/app.js"));
  const net = /function api\(path,body\)\{[\s\S]*?\n(?=var tmr=0)/;
  if (!net.test(src)) throw new Error("syanie/app/admin/app.js изменился: не нашлась функция запросов");
  const js = swap(src.replace(net, "function api(path,body){return DEMO(path,body)}\n"), SYANIE_JS, "syanie/app/admin/app.js").replace(/\n\s*\n/g, "\n");
  if (/fetch\(|Сияние|syanie/i.test(js)) throw new Error("syanie/app/admin/app.js: остался запрос в сеть или имя клиники");
  return js;
}

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
    greenwell: {
      css: noComments(read("greenwell", "panel.css")).replace(/\n\s*/g, ""),
      js: swap(noComments(read("greenwell", "panel.js")), GREENWELL_JS, "greenwell/panel.js").replace(/\n\s*\n/g, "\n"),
      ui: greenwellUi(),
      icons: greenwellIcons(),
    },
    soffice: {
      css: noComments(read("soffice", "panel.css")).replace(/\n\s*/g, ""),
      js: swap(noComments(read("soffice", "panel.js")), SOFFICE_JS, "soffice/panel.js").replace(/\n\s*\n/g, "\n"),
      ui: sofficeUi(),
      sprite: sofficeSprite(),
      // Демо-данные панели, которые не про Soffice: планировка этажа, этажи и занятость, команда, названия арендаторов, ставки.
      units: SOFFICE_UNITS.map((u) => ({ n: u.n, r: u.r, a: u.a, w: u.w })),
      inv: Object.values(sofficeInventory()).slice(0, 8),
      team: SOFFICE_TEAM.map((p) => ({ id: p.id, role: p.role, n: [p.n.ru, p.n.uz] })),
      roots: TENANT_ROOTS, kinds: TENANT_KINDS, market: SOFFICE_MARKET, tariff: SOFFICE_TARIFF,
    },
    agora: { css: noComments(read("agora", "panel.css")).replace(/\n\s*/g, ""), js: agJs, ui: agoraUi() },
    syanie: { css: noComments(read("syanie", "app/admin/app.css")).replace(/\n\s*/g, ""), js: syanieJs() },
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  writeFileSync(new URL("../../../content/proto-instant/panel-assets.json", import.meta.url), `${JSON.stringify(panelAssets())}\n`);
  console.log("panel-assets.json записан");
}
