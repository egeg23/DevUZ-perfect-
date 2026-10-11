import { chromium } from "playwright-core";
import { mkdirSync } from "node:fs";
const S = process.argv[2] || "/tmp/claude-0/en-shots", B = `http://localhost:4795/proto/${"A".repeat(43)}`;
const only = process.argv[3] || "";
mkdirSync(S, { recursive: true });
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
for (const [name, vp] of [["m", { width: 390, height: 844 }], ["d", { width: 1440, height: 900 }]]) {
  if (only && only !== name) continue;
  const ctx = await b.newContext({ viewport: vp, deviceScaleFactor: name === "m" ? 2 : 1, isMobile: name === "m", hasTouch: name === "m" });
  const p = await ctx.newPage(); const errs = [];
  p.on("pageerror", (e) => errs.push(String(e))); p.on("console", (m) => { if (m.type() === "error") errs.push(m.text()) });
  await p.goto(`${B}/`, { waitUntil: "commit" });
  const t0 = Date.now();
  for (const at of [1500, 3300, 3900, 4500, 5300, 5900, 6400]) { await p.waitForTimeout(Math.max(0, at - (Date.now() - t0))); await p.screenshot({ path: `${S}/${name}-i${at}.jpg`, quality: 60 }); }
  await p.waitForTimeout(1500);
  for (const t of [0, 3.5, 5.6, 6.8, 7.8, 10, 12.5, 16.5, 19.5, 21, 23.6, 24.5, 25.8]) {
    await p.evaluate((t) => { const tr = document.querySelector(".st-track"); window.scrollTo(0, tr.getBoundingClientRect().top + scrollY + t * innerHeight) }, t);
    await p.waitForTimeout(450);
    await p.screenshot({ path: `${S}/${name}-t${String(t).padStart(4, "0")}.jpg`, quality: 60 });
  }
  console.log(name, errs.slice(0, 5).join(" | "));
  await ctx.close();
}
await b.close();
