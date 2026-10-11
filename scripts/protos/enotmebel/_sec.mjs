import { chromium } from "playwright-core";
const S = process.argv[2], B = `http://localhost:4795/proto/${"A".repeat(43)}`, path = process.argv[3] || "";
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
for (const [name, vp] of [["m", { width: 390, height: 844 }], ["d", { width: 1440, height: 900 }]]) {
  const ctx = await b.newContext({ viewport: vp, deviceScaleFactor: 1, isMobile: name === "m", hasTouch: name === "m" });
  await ctx.addInitScript(() => { try { sessionStorage.setItem("en-intro", "1") } catch {} });
  const p = await ctx.newPage(); const errs = [];
  p.on("pageerror", (e) => errs.push(String(e)));
  await p.goto(`${B}/${path}`, { waitUntil: "load" }); await p.waitForTimeout(500);
  const ids = path ? ["konstruktor", "konkurenty"] : ["katalog", "razmer", "tkani", "ofis", "garantiya", "shourum"];
  if (path) { await p.screenshot({ path: `${S}/${name}-${path}-top.jpg`, quality: 60 }) }
  for (const id of ids) {
    await p.evaluate((id) => document.getElementById(id).scrollIntoView(), id); await p.waitForTimeout(1100);
    const h = await p.evaluate((id) => document.getElementById(id).offsetHeight, id);
    await p.screenshot({ path: `${S}/${name}-${id}.jpg`, quality: 60, fullPage: false, clip: undefined });
    if (h > vp.height) { await p.evaluate(() => scrollBy(0, innerHeight * .9)); await p.waitForTimeout(900); await p.screenshot({ path: `${S}/${name}-${id}-2.jpg`, quality: 60 }) }
  }
  const ov = await p.evaluate(() => ({ sw: document.documentElement.scrollWidth, w: document.documentElement.clientWidth }));
  console.log(name, JSON.stringify(ov), errs.join(" | "));
  await ctx.close();
}
await b.close();
