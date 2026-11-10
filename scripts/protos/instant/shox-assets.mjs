// Стили, скрипт и допы макета Shox International Hospital — для шаблона
// «Медцентр» в «Макете в боте».
//
// Владелец, 10.11.2026: «бери наши макеты и лепи логотипы, цены и
// контактные данные клиента… А то ты заново будто делаешь». Шаблон
// медцентра — главная нашего макета Shox (scripts/protos/shox-hospital): её
// style.css и client.js берутся отсюда как есть. Правится только то, что
// зашито под Shox: ключи браузера, куда уходит запись (клиника клиента, а
// не бот Shox), врач без фото и их фирменные цвета, вписанные числами.
// Каждая замена проверяется: поменялся макет Shox и замена не нашлась —
// скрипт падает, а не тихо собирает чужое.
//
//   node scripts/protos/instant/shox-assets.mjs
//
// Пишет content/proto-instant/shox-assets.json; тест сверяет его с макетом.
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { EXTRAS } from "../shox-hospital/plan.mjs";
import { nekAssets } from "./nek-assets.mjs";

const SHOX = new URL("../shox-hospital/", import.meta.url);
const read = (f) => readFileSync(new URL(f, SHOX), "utf8");

const JS_SWAPS = [
  ["d.getElementById('i18n')", "d.getElementById('im-i18n')"],
  ["d.getElementById('docs')", "d.getElementById('im-docs')"],
  // Ключи браузера свои: состояние макета Shox и макета клиента не смешиваются.
  ["var DKEY='shox_discount'", "var DKEY='im_discount'"],
  ["var KKEY='shox_kit'", "var KKEY='im_kit'"],
  ["var code='SHOX10-'", "var code='WEB10-'"],
  // Метка числа скрипта: при показе число сдвигается, свой сдвиг у клиента (lib/proto/stamp).
  ["setTimeout(dzOff,1300)", "setTimeout(dzOff,/*~*/1300)"],
  // Врачей клиники клиента без фото: на месте фото — буквы имени.
  [
    `<img src="'+x.img+'" alt="" loading="lazy" width="48" height="60">`,
    `'+(x.img?'<img src="'+x.img+'" alt="" loading="lazy" width="48" height="60">':'<span class="av" aria-hidden="true">'+esc(x.i||'')+'</span>')+'`,
  ],
  // Запись: текст заявки уходит в Telegram или WhatsApp клиники, нет — звонок.
  [
    "copy(text).then(function(){},function(){});",
    "copy(text).then(function(){},function(){});if(T.go)send.setAttribute('href',T.go+encodeURIComponent(text));else if(T.tel)send.setAttribute('href','tel:'+T.tel);",
  ],
];

// Цвета Shox, вписанные в стили числами, — через переменные: шаблон красит
// их в цвет клиента (lib/proto/instant/medcentr, palette).
const CSS_SWAPS = [
  ["rgb(17 13 46", "rgb(var(--night-rgb)"],
  ["rgb(74 61 176", "rgb(var(--brand2-rgb)"],
  ["rgb(49 39 130", "rgb(var(--brand-rgb)"],
  ["rgb(211 5 18", "rgb(var(--red-rgb)"],
  ["#c9c2ff", "var(--lav2)"],
];

/*
 * Пролёт по прокрутке — та же сцена Nek, что у стоматологии: стили
 * пролёта берутся из стилей Nek от «.hs{» до подписи версии без движения.
 */
const FLY_FROM = ".hs{position:relative";
const FLY_TO = ".calm figcaption{";
function flyCss() {
  const css = nekAssets().css;
  const a = css.indexOf(FLY_FROM);
  const b = css.indexOf("}", css.indexOf(FLY_TO));
  if (a < 0 || b < a) throw new Error("site.css Nek изменился: не нашлись стили пролёта");
  return css.slice(a, b + 1);
}

/** Допы — из плана нашего макета Shox: цены и названия оттуда. */
const ADDONS = ["admin", "bot", "sms", "cabinet", "reviews"];

export function shoxAssets() {
  let css = read("style.css").replace(/\n\s*/g, "");
  for (const [from, to] of CSS_SWAPS) {
    if (!css.includes(from)) throw new Error(`style.css Shox изменился: не нашлось «${from}»`);
    css = css.split(from).join(to);
  }
  let js = read("client.js");
  for (const [from, to] of JS_SWAPS) {
    if (!js.includes(from)) throw new Error(`client.js Shox изменился: не нашлось «${from}»`);
    js = js.split(from).join(to);
  }
  const addons = ADDONS.map((id) => {
    const x = EXTRAS.find((e) => e.id === id);
    if (!x) throw new Error(`plan.mjs Shox: нет допа «${id}»`);
    return { id, price: x.price, ru: x.ru.t, uz: x.uz.t };
  });
  return { css, js, fly: flyCss(), addons };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  writeFileSync(new URL("../../../content/proto-instant/shox-assets.json", import.meta.url), `${JSON.stringify(shoxAssets())}\n`);
  console.log("shox-assets.json записан");
}
