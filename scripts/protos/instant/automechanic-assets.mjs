// Стили и скрипт макета AUTOMECHANIC — для шаблона «Автосервис» в «Макете в боте».
//
// Владелец, 12.11.2026: «Мы теряем лидов из-за того, что они нажимают
// „другая ниша“… выведем больше ниш которые у нас есть, также переодевать
// просто?». Шаблон автосервиса — наш макет AUTOMECHANIC
// (scripts/protos/automechanic): его style.css и client.js берутся отсюда как
// есть. Правится только то, что зашито под их сайт: id строк страницы,
// часы записи (были в разметке их числами, теперь из данных клиента),
// заявка в админку макета и метка числа скрипта. Каждая замена
// проверяется: поменялся макет AUTOMECHANIC и замена не нашлась — скрипт
// падает, а не тихо собирает чужое.
//
//   node scripts/protos/instant/automechanic-assets.mjs
//
// Пишет content/proto-instant/automechanic-assets.json; тест сверяет его с макетом.
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const AM = new URL("../automechanic/", import.meta.url);
const read = (f) => readFileSync(new URL(f, AM), "utf8");

const CSS_SWAPS = [
  // Итоговый блок был в их красном оттенке числом — теперь в цвет клиента.
  ["linear-gradient(160deg,hsl(357 50% 16%),var(--s1) 60%)", "linear-gradient(160deg,hsl(var(--hue) 50% 16%),var(--s1) 60%)"],
];

const JS_SWAPS = [
  ["JSON.parse($('i18n').textContent)", "JSON.parse($('as-i18n').textContent)"],
  // Метка числа скрипта: при показе число сдвигается, свой сдвиг у клиента (lib/proto/stamp).
  ["if(Math.abs(p-last)>.0004)", "if(Math.abs(p-last)>/*~*/0.0004)"],
  // Часы записи — из данных клиента, а не числами в разметке.
  [
    "    return '<label class=\"opt\"><input type=\"radio\" name=\"d\" value=\"'+lab+'\" data-k=\"'+x.k+'\"><span>'+lab+'</span></label>';\n  }).join('');",
    "    return '<label class=\"opt\"><input type=\"radio\" name=\"d\" value=\"'+lab+'\" data-k=\"'+x.k+'\"><span>'+lab+'</span></label>';\n  }).join('');\n  var tms=$('times');if(tms)tms.innerHTML=(L.times||[]).map(function(h){return '<label class=\"opt\"><input type=\"radio\" name=\"h\" value=\"'+h+'\"><span>'+h+'</span></label>'}).join('');",
  ],
  // Заявка с макета приходит в админку макета первой строкой (lib/proto/instant/admin).
  [
    "    done.textContent=L.sent+L.phoneM;done.hidden=false;",
    "    try{var sx=JSON.parse(localStorage.getItem('as-demo-1')||'null');sx=sx&&sx.v===1?sx:{v:1,leads:[],log:[]};var ld={id:'z'+Date.now().toString(36).slice(-6),at:Date.now(),status:'new',name:fld('nm'),phone:fld('ph'),svc:(book.querySelector('input[name=\"s\"]:checked')||{dataset:{}}).dataset.id||'',when:[val('d'),val('h')].filter(Boolean).join(' '),src:'site',note:[fld('car'),fld('trouble')].filter(Boolean).join('. ')};ld.log=[{at:ld.at,who:'site'}];sx.leads.unshift(ld);localStorage.setItem('as-demo-1',JSON.stringify(sx))}catch(x){}\n    done.textContent=L.sent+L.phoneM;done.hidden=false;",
  ],
];

// Комментарии макета — про AUTOMECHANIC; клиенту они не нужны. Метку «/*~*/» не трогаем.
const noComments = (text) => text.replace(/\/\*(?!~\*\/)[\s\S]*?\*\//g, "");

function swap(text, swaps, file) {
  let out = text;
  for (const [from, to] of swaps) {
    if (!out.includes(from)) throw new Error(`${file} AUTOMECHANIC изменился: не нашлось «${from}»`);
    out = out.split(from).join(to);
  }
  return out;
}

export function automechanicAssets() {
  const css = swap(noComments(read("style.css")).replace(/\n\s*/g, ""), CSS_SWAPS, "style.css");
  const js = swap(read("client.js"), JS_SWAPS, "client.js");
  return { css, js: noComments(js) };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  writeFileSync(new URL("../../../content/proto-instant/automechanic-assets.json", import.meta.url), `${JSON.stringify(automechanicAssets())}\n`);
  console.log("automechanic-assets.json записан");
}
