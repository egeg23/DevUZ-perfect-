// Снимки макета Qiyos: node shots.mjs [папка] (сервер serve.mjs запущен).
import { createRequire } from "node:module";
import { execSync } from "node:child_process";
import { mkdirSync } from "node:fs";
const require = createRequire(execSync("npm root -g").toString().trim() + "/playwright/package.json");
const { chromium } = require("playwright");
const OUT = process.argv[2] || new URL("../../../docs/screens/qiyos/", import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });
const B = "http://localhost:4861/proto/" + "A".repeat(43);
const b = await chromium.launch();
const skip = (p) => p.evaluate(() => { document.getElementById("dzi")?.remove(); document.documentElement.classList.remove("dzi"); });
for (const [w, h, tag] of [[390, 844, "390"], [1440, 900, "1440"]]) {
  const c = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 2 });
  const p = await c.newPage();
  for (const [path, name] of [["site", "site"], ["uz/site", "uz-site"], ["panel", "panel"], ["", "land"]]) {
    await p.goto(`${B}/${path}`, { waitUntil: "networkidle" }); await skip(p);
    await p.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 600) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 40)); } scrollTo(0, 0); });
    await p.waitForTimeout(3500);
    await p.screenshot({ path: `${OUT}${name}-${tag}.png`, fullPage: path !== "" });
  }
  await p.goto(`${B}/site#offers`, { waitUntil: "networkidle" }); await p.waitForTimeout(3500);
  await p.screenshot({ path: `${OUT}offers-${tag}.png` });
  await c.close();
}
await b.close();
console.log("ok");
