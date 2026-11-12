// Стили, скрипт и значки макета MedAcademy B для шаблона «Учебный центр» в
// «Макете в боте».
//
// Владелец, 12.11.2026: «Для обучающего центра мы делали для медиков 2
// варианта, вот там был фиолетовый с зеленым, круто выглядели - Прицепить
// туда их логотип и погнали». Макет собран в витрине (Next и Tailwind), а не
// в scripts/protos, поэтому его стили лежат здесь собранными
// (medacademy/style.css, пишет medacademy/purge.mjs из стилей страницы
// витрины), значки: medacademy/icons.json, скрипт: medacademy/client.js
// (в макете был React, поведение то же). Правится только то, что зашито под
// MedAcademy: их фиолетовый в правилах уходит в переменные, шаблон красит
// фон в оттенок клиента. Замена не нашлась: скрипт падает, а не тихо
// собирает чужое.
//
//   node scripts/protos/instant/medacademy-assets.mjs
//
// Пишет content/proto-instant/medacademy-assets.json; тест сверяет его.
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const MA = new URL("./medacademy/", import.meta.url);
const read = (f) => readFileSync(new URL(f, MA), "utf8");

// Цвет в значениях правил, но не в самих переменных темы и не в именах классов.
const COLORS = [
  ["#191337", "var(--ma-night)"],
  ["#8d66ff", "var(--ma-pop)"],
  ["#5d2fcc", "var(--ma-pop-deep)"],
];

function tint(css) {
  let out = css;
  for (const [hex, name] of COLORS) {
    let hits = 0;
    out = out.replace(/([;{]\s*)([\w-]+)(\s*:)([^;{}]*)/g, (all, lead, prop, colon, value) => {
      if (prop.startsWith("--ma-") || !value.includes(hex)) return all;
      const next = value.replace(new RegExp(`${hex}(?![0-9a-f])`, "gi"), () => { hits += 1; return name; });
      return `${lead}${prop}${colon}${next}`;
    });
    if (!hits) throw new Error(`style.css MedAcademy изменился: не нашлось «${hex}»`);
  }
  return out;
}

// Тот же фиолетовый с прозрачностью Tailwind пишет через lab(): его тоже в переменную.
const ALPHA = [
  ["background-color:lab(8.25986% 11.9817 -22.9616/.1)", "background-color:color-mix(in srgb,var(--ma-night) 10%,transparent)"],
  ["background-color:lab(8.25986% 11.9817 -22.9616/.9)", "background-color:color-mix(in srgb,var(--ma-night) 90%,transparent)"],
];
function alpha(css) {
  let out = css;
  for (const [from, to] of ALPHA) {
    if (!out.includes(from)) throw new Error(`style.css MedAcademy изменился: не нашлось «${from}»`);
    out = out.split(from).join(to);
  }
  return out;
}

const noComments = (text) => text.replace(/\/\*(?!~\*\/)[\s\S]*?\*\//g, "");

export function medacademyAssets() {
  const css = alpha(tint(noComments(read("style.css")).replace(/\n\s*/g, "")));
  const js = noComments(read("client.js")).replace(/\n\s*\n/g, "\n").trim();
  if (!js.includes("/*~*/")) throw new Error("client.js: нет числа с меткой");
  const icons = JSON.parse(read("icons.json"));
  return { css, js, icons };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  writeFileSync(new URL("../../../content/proto-instant/medacademy-assets.json", import.meta.url), `${JSON.stringify(medacademyAssets())}\n`);
  console.log("medacademy-assets.json записан");
}
