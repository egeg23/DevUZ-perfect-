// Стили и скрипт макета MAVERA («Премиум», светлый зал) для шаблона «Недвижимость» в «Макете в боте».
//
// Владелец, 12.11.2026: «у нас осталось 2 макета: учебный центр и недвижка.
// Можно взять MAVERA целиком, просто заменим логотип компании». Макет MAVERA
// живёт на витрине (другой репозиторий, страницы React), поэтому здесь лежит
// его снимок: scripts/protos/instant/mavera/premium.css — стили варианта
// «Премиум» с витрины, оставлено только то, что есть на его странице (как
// снят — README рядом), и site.js — то же поведение простым скриптом: появление
// разделов, параллакс первого экрана, кинолента, генплан, шахматка, заявка.
// Разметку шаблон собирает теми же классами (lib/proto/instant/nedv.ts).
//
//   node scripts/protos/instant/mavera-assets.mjs
//
// Пишет content/proto-instant/mavera-assets.json; тест сверяет его со снимком.
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const MV = new URL("./mavera/", import.meta.url);
const read = (f) => readFileSync(new URL(f, MV), "utf8");

// Комментарии снимка клиенту не нужны. Метку «/*~*/» не трогаем.
const noComments = (text) => text.replace(/\/\*(?!~\*\/)[\s\S]*?\*\//g, "");

// Проверка снимка: поменяли стили и пропало то, на чём стоит шаблон — скрипт падает.
const MUST = ['[data-world="premium"]', ".w-rise-in", ".w-slab", ".w-rail", ".w-glow", ".w-word", "--mv-accent", "@keyframes w-kenburns"];

export function maveraAssets() {
  const css = noComments(read("premium.css")).replace(/\n/g, "").trim();
  for (const m of MUST) if (!css.includes(m)) throw new Error(`mavera/premium.css изменился: не нашлось «${m}»`);
  if (/mavera|url\(/i.test(css)) throw new Error("mavera/premium.css: в стилях имя прошлого клиента или файл со стороны");
  const js = noComments(read("site.js")).replace(/\n\s*\n/g, "\n").trim();
  if (!js.includes("/*~*/3000")) throw new Error("mavera/site.js: нет числа с меткой");
  return { css, js };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  writeFileSync(new URL("../../../content/proto-instant/mavera-assets.json", import.meta.url), `${JSON.stringify(maveraAssets())}\n`);
  console.log("mavera-assets.json записан");
}
