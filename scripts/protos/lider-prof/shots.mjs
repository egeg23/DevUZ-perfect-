import { chromium } from "playwright-core";
// «Было / стало» для страницы «Что дальше»: первый экран lider-prof.uz и
// прототипа, компьютер 1440 × 900 и телефон 390 × 844. Сначала node serve.mjs.
// node shots.mjs <public/protos/lider-prof>
import sharp from "sharp";
const OUT = process.argv[2], ME = `http://localhost:4797/proto/${"A".repeat(43)}/`;
const px = process.env.HTTPS_PROXY ? { server: process.env.HTTPS_PROXY } : undefined;
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
for (const [k, vp] of [["d", { width: 1440, height: 900 }], ["m", { width: 390, height: 844 }]]) {
  for (const [who, url, proxy] of [["old", "https://lider-prof.uz/", px], ["new", ME, undefined]]) {
    const c = await b.newContext({ viewport: vp, deviceScaleFactor: 2, isMobile: k === "m", hasTouch: k === "m", proxy });
    if (who === "new") await c.addInitScript(() => { try { sessionStorage.setItem("lp-intro", "1"); } catch {} });
    const p = await c.newPage();
    await p.goto(url, { waitUntil: "load", timeout: 60000 }); await p.waitForTimeout(3500);
    const buf = await p.screenshot();
    await sharp(buf).resize(k === "d" ? 1440 : 780).webp({ quality: 74 }).toFile(`${OUT}/ba-${who}-${k}.webp`);
    await c.close();
  }
}
await b.close();
console.log("ok");
