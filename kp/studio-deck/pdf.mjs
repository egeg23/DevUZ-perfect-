// Слайды презентации студии в PDF: node kp/studio-deck/pdf.mjs
// Каждый слайд 1600×900. Слайд, у которого текст залез на подвал или за
// край, — ошибка, а не «вроде влезло»: такой лист в PDF обрезается молча.
//
//   node kp/studio-deck/pdf.mjs            → kp/studio-ru.pdf
//   node kp/studio-deck/pdf.mjs --png DIR  → ещё и каждый слайд картинкой 1600×900 в DIR
import path from "node:path";
import { mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import { execSync } from "node:child_process";
const require = createRequire(execSync("npm root -g").toString().trim() + "/playwright/package.json");
const { chromium } = require("playwright");

const DIR = path.dirname(new URL(import.meta.url).pathname);
const at = process.argv.indexOf("--png");
const PNG = at > 0 ? path.resolve(process.argv[at + 1]) : null;

const browser = await chromium.launch();
const tab = await browser.newPage({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 1 });
await tab.goto(`file://${DIR}/studio-ru.html`, { waitUntil: "load" });
await tab.evaluate(() => document.fonts.ready);
const broken = await tab.evaluate(() => [...document.images].filter((i) => !i.complete || !i.naturalWidth).map((i) => i.getAttribute("src")));
const over = await tab.evaluate(() =>
  [...document.querySelectorAll(".slide")].flatMap((s, i) => {
    const box = s.getBoundingClientRect();
    const out = [...s.querySelectorAll("h1,h2,h3,p,li,td,ul,ol,.card,.st,.s,.pill,.kick,.tag")].filter((e) => {
      const r = e.getBoundingClientRect();
      if (!r.height || e.closest("footer") || e.closest(".rail")) return false;
      // Подписи поверх картинок внутри .pic могут заходить за край кадра, но не на подвал.
      return r.bottom > box.bottom - 70 || r.right > box.right + 1 || r.top < box.top - 1;
    });
    return out.length ? [`слайд ${i + 1}: ${out.slice(0, 3).map((e) => e.tagName + "." + e.className + " «" + e.textContent.trim().slice(0, 40) + "»").join("; ")}`] : [];
  }),
);
for (const b of broken) console.error(`нет картинки: ${b}`);
for (const o of over) console.error(o);

const out = path.join(DIR, "..", "studio-ru.pdf");
await tab.pdf({ path: out, width: "1600px", height: "900px", printBackground: true, preferCSSPageSize: true });
const n = await tab.evaluate(() => document.querySelectorAll(".slide").length);
console.log(`${out}: слайдов ${n}`);

if (PNG) {
  mkdirSync(PNG, { recursive: true });
  const slides = await tab.$$(".slide");
  for (const [i, s] of slides.entries()) await s.screenshot({ path: path.join(PNG, `slide-${String(i + 1).padStart(2, "0")}.png`) });
  console.log(`${PNG}: ${slides.length} картинок`);
}
await browser.close();
if (over.length || broken.length) process.exit(1);
