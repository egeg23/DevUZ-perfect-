// Слайды презентации в PDF: node kp/cargo-deck/pdf.mjs
// Каждый слайд 1600×900. Слайд, у которого что-то вылезло за край, — ошибка,
// а не «вроде влезло»: такой лист в PDF обрезается молча.
import path from "node:path";
import { createRequire } from "node:module";
import { execSync } from "node:child_process";
const require = createRequire(execSync("npm root -g").toString().trim() + "/playwright/package.json");
const { chromium } = require("playwright");

const DIR = path.dirname(new URL(import.meta.url).pathname);
const browser = await chromium.launch();
let bad = 0;
for (const L of ["ru", "uz"]) {
  const tab = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  await tab.goto(`file://${DIR}/cargo-${L}.html`, { waitUntil: "load" });
  await tab.evaluate(() => document.fonts.ready);
  const over = await tab.evaluate(() =>
    [...document.querySelectorAll(".slide")].flatMap((s, i) => {
      const box = s.getBoundingClientRect();
      const out = [...s.querySelectorAll("h1,h2,h3,p,li,td,table,ul,ol,.card,.badge")].filter((e) => {
        const r = e.getBoundingClientRect();
        return r.height > 0 && (r.bottom > box.bottom - 70 && !e.closest("footer") && !e.closest(".pic") && !e.closest(".cv-r"));
      });
      return out.length ? [`слайд ${i + 1}: ${out.slice(0, 3).map((e) => e.tagName + "." + e.className + " «" + e.textContent.trim().slice(0, 40) + "»").join("; ")}`] : [];
    }),
  );
  for (const o of over) console.error(`${L}: ${o}`);
  bad += over.length;
  const out = path.join(DIR, "..", `cargo-${L}.pdf`);
  await tab.pdf({ path: out, width: "1600px", height: "900px", printBackground: true, preferCSSPageSize: true });
  const n = await tab.evaluate(() => document.querySelectorAll(".slide").length);
  console.log(`${out}: слайдов ${n}`);
  await tab.close();
}
await browser.close();
if (bad) process.exit(1);
