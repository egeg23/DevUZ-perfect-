// Стили сайта и панель макета CARGO PRO GROUP — для шаблона «Логистика» в
// «Макете в боте».
//
// Владелец, 12.11.2026: «Мы теряем лидов из-за того, что они нажимают
// "другая ниша"… выведем больше ниш которые у нас есть, также переодевать
// просто». Шаблон логистики — сайт нашего макета Cargo Pro
// (scripts/protos/cargopro): его site.css как есть, те же блоки и классы;
// админка — его «Обычная админка» (panel.css и panel.js как есть).
//
// Владелец, 13.11.2026: «Для макета логистики используем "супер админку" как в
// оригинале, сделай такую же с теми же функциями». Поэтому рядом —
// «Супер-админка» Cargo Pro целиком: диспетчерская (dispatch.js), автопарк,
// брокер и интеграции (super.js), настройки (settings.js), dispatch.css и
// подписи DISPATCH_UI как есть. Замены те же по смыслу: знак и имя клиента,
// без их сайта, приложения водителя Lider Cargo, адреса офиса, 1С и Битрикс24
// по их адресам, номера «GR-», свои ключи памяти браузера.
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
import { DISPATCH_UI } from "../cargopro/dispatch-ui.mjs";
import { CAB_UI } from "../cargopro/cabinet-ui.mjs";
import { LANES, EXTRA, FX, DIM, CAT_DEF, BAND_DEF, WAIT_DEF, DEMO_WAIT, TPL_KEYS, CITY, DIST } from "../cargopro/tariffs.mjs";

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
  // Ссылки «К выбору» у шаблона нет; «Супер-админка» ведёт на страницу admin макета.
  ["<a class=\"btn btn-g btn-s\" href=\"'+D.home+'\">'+t('home')+'</a><a class=\"btn btn-g btn-s pn-disp\" href=\"'+D.disp+'\">'+t('disp')+'</a>", "<a class=\"btn btn-g btn-s pn-disp\" href=\"'+D.disp+'\">'+t('disp')+'</a>"],
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

const KEYS = [
  ["'cp-panel-1'", "'lg-panel-1'"],
  ["'cp-req-1'", "'lg-req-1'"],
  ["'cp-disp-1'", "'lg-disp-1'"],
  ["'cp-cfg-1'", "'lg-cfg-1'"],
  ["'cp-fleet-1'", "'lg-fleet-1'"],
  ["'cp-cab-1'", "'lg-cab-1'"],
  ["'cp-set-1'", "'lg-set-1'"],
];

const DISP_SWAPS = [
  // Знак и имя клиента вместо логотипа Cargo Pro.
  ["<img src=\"'+D.logo+'\" alt=\"CARGO PRO GROUP\" width=\"670\" height=\"249\">", "'+D.mark+'"],
  // «К выбору» у шаблона нет: «Админка» и «Сайт» остаются.
  ["<a class=\"btn btn-g btn-s\" href=\"'+D.home+'\">'+t('home')+'</a>", ""],
  // Плашка «Мы уже делали это для Lider Cargo» с их приложением водителя — про их клиента.
  ["'<div class=\"dp-go\"><b>'+t('go_t')+'</b><span>'+t('go_e')+'</span><a href=\"'+D.gp+'\" target=\"_blank\" rel=\"noopener\">Google Play</a><a href=\"'+D.as+'\" target=\"_blank\" rel=\"noopener\">App Store</a></div>", "'"],
  // Ссылка в сообщениях Telegram — сайт клиента, а не их.
  ["https://t.me/share/url?url=cargoprogroup.uz&amp;text=", "https://t.me/share/url?url='+encodeURIComponent(D.url)+'&amp;text="],
  // Адреса 1С и Битрикс24 в интеграциях — пример, не их сервер.
  ["https://1c.cargoprogroup.uz/hs/cargo", "https://1c.example.uz/hs/exchange"],
  ["https://cargopro.bitrix24.kz/rest/1/••••••••/", "https://company.bitrix24.kz/rest/1/••••••••/"],
  // Имя бота в предпросмотре уведомлений — имя клиента.
  ["<b>@cargoprogroup_bot</b>", "<b>'+esc(D.name)+'</b>"],
  ...KEYS,
  ["CPG-", "GR-"],
];

/** Подписи супер-админки: их имя — именем клиента ({name} подставляет шаблон). */
const DISP_UI_SWAPS = [["CARGO PRO GROUP", "{name}"]];

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
  // Супер-админка: dispatch.js с вставленными super.js и settings.js, как в gen.mjs Cargo Pro.
  const dispRaw = read("dispatch.js").replace("/*@@SUPER@@*/", () => read("super.js")).replace("/*@@SETTINGS@@*/", () => read("settings.js"));
  const dispJs = swap(noComments(dispRaw), DISP_SWAPS, "dispatch.js").replace(/\n\s*\n/g, "\n");
  for (const bad of ["cargoprogroup", "CARGO PRO", "Lider", "LBM", "'cp-", "CPG-", "D.logo", "D.gp", "D.as"]) if (dispJs.includes(bad)) throw new Error(`dispatch.js: осталось «${bad}»`);
  const dispCss = noComments(read("dispatch.css")).replace(/\n\s*/g, "");
  const dispUi = Object.fromEntries(Object.entries(DISPATCH_UI).filter(([k]) => k !== "go_t" && k !== "go_e").map(([k, v]) => [k, v.map((x) => DISP_UI_SWAPS.reduce((a, [f, to]) => a.split(f).join(to), x))]));
  // Данные диспетчерской из gen.mjs Cargo Pro: умолчания настроек, демо-рейсы, ожидание, шаблоны бота.
  const disp = {
    city: CITY,
    // Старт сборного рейса — «офис», без их адреса в Яккасарае.
    dist: { ...DIST, base: ["Старт: офис", "Start: ofis"] },
    trips: [["GR-24117", 4, 0, 4160], ["GR-24109", 3, 2, 4950], ["GR-24095", 5, 1, 3245]],
    tar: { dim: DIM, ex: EXTRA, fx: FX, cat: CAT_DEF, bands: BAND_DEF, rate: { air: LANES[0].air.kg, auto: LANES[0].auto.kg } },
    wt: WAIT_DEF,
    dw: Object.fromEntries(Object.entries(DEMO_WAIT).map(([k, v]) => [k.replace("CPG-", "GR-"), v])),
    tpl: Object.fromEntries(["ru", "uz"].map((x, j) => [x, Object.fromEntries(TPL_KEYS.map((k) => [k, CAB_UI["b_" + k][j].split("CARGO PRO GROUP").join("{name}")]))])),
  };
  return { css, panelCss, panelJs, ui, lanes, dispCss, dispJs, dispUi, disp };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  writeFileSync(new URL("../../../content/proto-instant/cargopro-assets.json", import.meta.url), `${JSON.stringify(cargoproAssets())}\n`);
  console.log("cargopro-assets.json записан");
}
