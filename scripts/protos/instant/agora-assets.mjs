// Стили и скрипт макета Agora — для шаблона «Ресторан» в «Макете в боте».
//
// Владелец, 11.11.2026: «Остальные категории тоже делаем по принципу как
// сделали со стоматологией». Шаблон ресторана — страница сайта нашего макета
// Agora Lounge & bar (scripts/protos/agora): её site.css и site.js берутся
// отсюда как есть. Правится только то, что зашито под Agora: их красный —
// в переменные (шаблон красит в цвет клиента), ключ данных и памяти
// браузера, цена без числа, кнопка в их панель и SMS без телефона. Каждая
// замена проверяется: поменялся макет Agora и замена не нашлась — скрипт
// падает, а не тихо собирает чужое.
//
//   node scripts/protos/instant/agora-assets.mjs
//
// Пишет content/proto-instant/agora-assets.json; тест сверяет его с макетом.
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const AG = new URL("../agora/", import.meta.url);
const read = (f) => readFileSync(new URL(f, AG), "utf8");

const CSS_SWAPS = [
  // Цвет клиента: переменные остаются, шаблон переопределяет их после стилей.
  ["--a:#d93a33;--a2:#ff5a4f;", "--a:#d93a33;--a2:#ff5a4f;--ah:#c22f29;--a-rgb:217 58 51;"],
  ["background:#c22f29", "background:var(--ah)"],
  ["rgb(217 58 51", "rgb(var(--a-rgb)"],
];

const JS_SWAPS = [
  ["$('#ag-data')", "$('#ir-data')"],
  // Память браузера — своя у шаблона, не пересекается с макетом Agora.
  ["'ag-", "'ir-"],
  // Метка числа скрипта: при показе число сдвигается, свой сдвиг у клиента (lib/proto/stamp).
  ["/*~*/.42", "/*~*/0.42"],
  // Десятый столбец меню — цена словами клиента.
  ["ex:!!(a[7]&8),g:a[8]}", "ex:!!(a[7]&8),g:a[8],ps:a[9]}"],
  // Цена — словами клиента («45 000 сум», «от 30 тыс»); нет цены — «уточняйте». В заказ — только с числом.
  [
    "'<span class=\"mi-f\"><span>'+sum(m.p)+'</span>'+(addonOn('order')&&!off?",
    "'<span class=\"mi-f\"><span>'+esc(m.ps||T.ask)+'</span>'+(addonOn('order')&&!off&&m.p?",
  ],
  [
    "'<div class=\"dish-p\"><b>'+sum(m.p)+'</b>'+(off?'<span class=\"tag stop\" style=\"position:static\">'+T.stop+'</span>':addonOn('order')?",
    "'<div class=\"dish-p\"><b>'+esc(m.ps||T.ask)+'</b>'+(off?'<span class=\"tag stop\" style=\"position:static\">'+T.stop+'</span>':addonOn('order')&&m.p?",
  ],
  ["(off?'':addonOn('order')?'<button type=\"button\" class=\"btn btn-a\" id=\"dadd\"", "(off?'':addonOn('order')&&m.p?'<button type=\"button\" class=\"btn btn-a\" id=\"dadd\""],
  // Панели у шаблона нет: вместо «Открыть панель» — чат ресторана.
  [
    "h+='<a class=\"btn btn-a\" style=\"width:100%;margin-top:16px\" href=\"'+D.panel+'\">'+T.openPanel+'</a>';",
    "if(D.chat)h+='<a class=\"btn btn-a\" style=\"width:100%;margin-top:16px\" href=\"'+esc(D.chat)+'\" target=\"_blank\" rel=\"noopener\">'+T.openPanel+'</a>';",
  ],
  // SMS — только если у ресторана есть телефон.
  [
    "</p><a class=\"btn btn-g\" style=\"width:100%\" href=\"'+D.smsHref(x.b)+'\">'+T.sms+'</a>'}",
    "</p>'+(D.tel?'<a class=\"btn btn-g\" style=\"width:100%\" href=\"'+D.smsHref(x.b)+'\">'+T.sms+'</a>':'')}",
  ],
];

// Комментарии макета — про Agora; клиенту они не нужны. Метку «/*~*/» не трогаем.
const noComments = (text) => text.replace(/\/\*(?!~\*\/)[\s\S]*?\*\//g, "");

function swap(text, swaps, file) {
  let out = text;
  for (const [from, to] of swaps) {
    if (!out.includes(from)) throw new Error(`${file} Agora изменился: не нашлось «${from}»`);
    out = out.split(from).join(to);
  }
  return out;
}

export function agoraAssets() {
  const css = swap(noComments(read("site.css")).replace(/\n\s*/g, ""), CSS_SWAPS, "site.css");
  const js = swap(noComments(read("site.js")).replace(/\n\s*\n/g, "\n"), JS_SWAPS, "site.js");
  return { css, js };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  writeFileSync(new URL("../../../content/proto-instant/agora-assets.json", import.meta.url), `${JSON.stringify(agoraAssets())}\n`);
  console.log("agora-assets.json записан");
}
