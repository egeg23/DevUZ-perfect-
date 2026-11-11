// Стили и скрипт макета ShahaR.Uz — для шаблона «Недвижимость» в «Макете в боте».
//
// Владелец, 11.11.2026: «Остальные категории тоже делаем по принципу как
// сделали со стоматологией». Шаблон агентства недвижимости — главная нашего
// макета ShahaR.Uz (scripts/protos/shahar): её style.css и client.js берутся
// отсюда как есть. Правится только то, что зашито под ShahaR: их зелёный —
// в переменную оттенка (шаблон красит в цвет клиента), ключи памяти
// браузера, метка числа скрипта, поиск первого экрана (у ShahaR он ведёт в
// их каталог, у клиента каталога нет — поиск заполняет заявку на подбор), и
// без Telegram клиента заявка только копируется. Каждая замена проверяется:
// поменялся макет и замена не нашлась — скрипт падает, а не тихо собирает
// чужое.
//
//   node scripts/protos/instant/shahar-assets.mjs
//
// Пишет content/proto-instant/shahar-assets.json; тест сверяет его с макетом.
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const SH = new URL("../shahar/", import.meta.url);
const read = (f) => readFileSync(new URL(f, SH), "utf8");

const CSS_SWAPS = [
  // Цвет клиента: оттенок бренда — переменной, шаблон переопределяет её после стилей.
  ["--br:hsl(86 38% 29%)", "--bh:86;--br:hsl(86 38% 29%)"],
  ["hsl(86 ", "hsl(var(--bh) "],
];

const JS_SWAPS = [
  // Память браузера — своя у шаблона.
  ["'sh-cur'", "'re-cur'"],
  ["'sh-fav'", "'re-fav'"],
  ["KEY='sh-kit-v1'", "KEY='re-kit-v1'"],
  // Метка числа скрипта: при показе число сдвигается, свой сдвиг у клиента (lib/proto/stamp).
  ["setTimeout(function(){a.classList.remove('out')},700)},2400);", "setTimeout(function(){a.classList.remove('out')},700)},/*~*/2400);"],
  // Поиск первого экрана: каталога у клиента нет — заполняем заявку на подбор и едем к ней.
  [
    "location.href=sf.getAttribute('action')+(q.toString()?'?'+q:'');",
    "var bk=$('book');if(bk){var di={buy:0,rent:1,sell:2}[sf.elements.deal.value]||0,ds=bk.querySelectorAll('input[name=\"deal\"]'),tv=sf.elements.type?sf.elements.type.value:'';if(ds[di])ds[di].checked=true;qa('input[name=\"type\"]',bk).forEach(function(x){if(x.value===tv)x.checked=true});bk.dispatchEvent(new Event('change'));bk.scrollIntoView({behavior:reduce?'auto':'smooth',block:'start'})}",
  ],
  // Чата у агентства может не быть: тогда текст только копируется.
  ["window.open(L.adminUrl,'_blank','noopener')", "if(L.adminUrl)window.open(L.adminUrl,'_blank','noopener')"],
];

// Комментарии макета — про ShahaR; клиенту они не нужны. Метку «/*~*/» не трогаем.
const noComments = (text) => text.replace(/\/\*(?!~\*\/)[\s\S]*?\*\//g, "");

function swap(text, swaps, file) {
  let out = text;
  for (const [from, to] of swaps) {
    if (!out.includes(from)) throw new Error(`${file} ShahaR изменился: не нашлось «${from}»`);
    out = out.split(from).join(to);
  }
  return out;
}

export function shaharAssets() {
  const css = swap(noComments(read("style.css")).replace(/\n/g, "").replace(/__IMG__/g, "/protos/_niche/nedvizhimost"), CSS_SWAPS, "style.css");
  const js = swap(noComments(read("client.js")), JS_SWAPS, "client.js").replace(/\n\s*\n/g, "\n");
  return { css, js };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  writeFileSync(new URL("../../../content/proto-instant/shahar-assets.json", import.meta.url), `${JSON.stringify(shaharAssets())}\n`);
  console.log("shahar-assets.json записан");
}
