// Стили и скрипт макета FinTax — для шаблона «Услуги для бизнеса» в «Макете в боте».
//
// Владелец, 12.11.2026: «Мы теряем лидов из-за того, что они нажимают
// "другая ниша"… выведем больше ниш которые у нас есть, также переодевать
// просто». Шаблон услуг (и универсальный, когда сферу не узнали) — главная
// нашего макета FinTax (scripts/protos/fintax): её site.css и site.js берутся
// отсюда как есть. Правится только то, что зашито под FinTax: ключи памяти
// браузера (тот же префикс, что у панели FinTax в админке, — заявка с макета
// приходит туда первой строкой) и метка числа скрипта. Каждая замена
// проверяется: поменялся макет FinTax и замена не нашлась — скрипт падает.
//
//   node scripts/protos/instant/fintax-assets.mjs
//
// Пишет content/proto-instant/fintax-assets.json; тест сверяет его с макетом.
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const FT = new URL("../fintax/", import.meta.url);
const read = (f) => readFileSync(new URL(f, FT), "utf8");

const CSS_SWAPS = [
  // Маркер FinTax — цвет клиента (lib/proto/instant/uslugi, palette).
  ["--hl:#efe63c;--hl2:#f7f08a;", "--hl:var(--im-hl,#efe63c);--hl2:var(--im-hl2,#f7f08a);"],
];

const JS_SWAPS = [
  // Тот же префикс, что у панели FinTax в админке (panel-assets.mjs, «'fe-»).
  ["var LK='ft-leads-1',PK='ft-panel-1',PICK='ft-pick-1';", "var LK='fe-leads-1',PK='fe-panel-1',PICK='fe-pick-1';"],
  // У FinTax есть и Telegram, и WhatsApp; у клиента может быть что-то одно:
  // нет Telegram — тот же текст в WhatsApp, нет и его — звонок или заявка.
  ["function tg(text){return 'https://t.me/'+K.tg+'?text='+encodeURIComponent(text)}", "function tg(text){return K.tg?'https://t.me/'+K.tg+'?text='+encodeURIComponent(text):K.wa?wa(text):(K.tel||'#zayavka')}"],
  // Метка числа скрипта: при показе число сдвигается, свой сдвиг у клиента (lib/proto/stamp).
  ["toastT=setTimeout(function(){el.hidden=true},6500)", "toastT=setTimeout(function(){el.hidden=true},/*~*/6500)"],
];

// Комментарии макета — про FinTax; клиенту они не нужны. Метку «/*~*/» не трогаем.
const noComments = (text) => text.replace(/\/\*(?!~\*\/)[\s\S]*?\*\//g, "");

function swap(text, swaps, file) {
  let out = text;
  for (const [from, to] of swaps) {
    if (!out.includes(from)) throw new Error(`${file} FinTax изменился: не нашлось «${from}»`);
    out = out.split(from).join(to);
  }
  return out;
}

export function fintaxAssets() {
  const css = swap(noComments(read("site.css")).replace(/\n\s*/g, ""), CSS_SWAPS, "site.css");
  const js = swap(noComments(read("site.js")).replace(/\n\s*\n/g, "\n"), JS_SWAPS, "site.js");
  return { css, js };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  writeFileSync(new URL("../../../content/proto-instant/fintax-assets.json", import.meta.url), `${JSON.stringify(fintaxAssets())}\n`);
  console.log("fintax-assets.json записан");
}
