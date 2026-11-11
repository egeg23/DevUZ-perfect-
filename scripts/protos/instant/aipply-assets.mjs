// Стили и скрипт макета Aipply Academy — для шаблона «Учебный центр» в «Макете в боте».
//
// Владелец, 11.11.2026: «Остальные категории тоже делаем по принципу как
// сделали со стоматологией». Шаблон учебного центра — главная нашего
// макета Aipply Academy (scripts/protos/aipply): её style.css и client.js
// берутся отсюда как есть. Правится только то, что зашито под Aipply: их
// синие градиенты — в переменные (шаблон красит в цвет клиента), ключи
// памяти браузера и метка числа скрипта. Каждая замена проверяется:
// поменялся макет и замена не нашлась — скрипт падает, а не тихо собирает
// чужое.
//
//   node scripts/protos/instant/aipply-assets.mjs
//
// Пишет content/proto-instant/aipply-assets.json; тест сверяет его с макетом.
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const AP = new URL("../aipply/", import.meta.url);
const read = (f) => readFileSync(new URL(f, AP), "utf8");

const CSS_SWAPS = [
  ["linear-gradient(135deg,#7c3aed,#00a0e0)", "linear-gradient(135deg,var(--royal2),var(--sky))"],
  ["linear-gradient(120deg,#0000b0,#0070d0 50%,#00a0e0)", "linear-gradient(120deg,var(--royal),var(--azure) 50%,var(--sky))"],
  ["linear-gradient(135deg,#0000b0 0%,#0070d0 55%,#00a0e0 100%)", "linear-gradient(135deg,var(--royal) 0%,var(--azure) 55%,var(--sky) 100%)"],
  ["linear-gradient(140deg,#0000b0,#0070d0)", "linear-gradient(140deg,var(--royal),var(--azure))"],
];

const JS_SWAPS = [
  // Память браузера — своя у шаблона.
  ["'ap-level'", "'iu-level'"],
  ["KEY='ap-kit-v1'", "KEY='iu-kit-v1'"],
  // Метка числа скрипта: при показе число сдвигается, свой сдвиг у клиента (lib/proto/stamp).
  ["setTimeout(function(){a.classList.remove('out')},650)},2200);", "setTimeout(function(){a.classList.remove('out')},650)},/*~*/2200);"],
];

// Комментарии макета — про Aipply; клиенту они не нужны. Метку «/*~*/» не трогаем.
const noComments = (text) => text.replace(/\/\*(?!~\*\/)[\s\S]*?\*\//g, "");

function swap(text, swaps, file) {
  let out = text;
  for (const [from, to] of swaps) {
    if (!out.includes(from)) throw new Error(`${file} Aipply изменился: не нашлось «${from}»`);
    out = out.split(from).join(to);
  }
  return out;
}

export function aipplyAssets() {
  const css = swap(noComments(read("style.css")).replace(/\n/g, "").replace(/__IMG__/g, "/protos/_niche/uchebnyy-centr"), CSS_SWAPS, "style.css");
  const js = swap(noComments(read("client.js")).replace(/\n\s*\n/g, "\n"), JS_SWAPS, "client.js");
  return { css, js };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  writeFileSync(new URL("../../../content/proto-instant/aipply-assets.json", import.meta.url), `${JSON.stringify(aipplyAssets())}\n`);
  console.log("aipply-assets.json записан");
}
