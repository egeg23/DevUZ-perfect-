import { chromium } from "playwright-core";
import { execFileSync } from "node:child_process";
// Снимки «было / стало» для страницы «Что дальше»: первый экран enotmebel.uz
// сегодня и первый экран прототипа, компьютер и телефон. Сначала node serve.mjs.
// node shots.mjs  →  public/protos/enotmebel/ba-{old,new}-{d,m}.webp
const OUT = new URL("../../../public/protos/enotmebel/", import.meta.url).pathname, TMP = "/tmp/en-ba";
execFileSync("mkdir", ["-p", TMP]);
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
for (const [k, vp, dpr] of [["d", { width: 1440, height: 900 }, 1], ["m", { width: 390, height: 844 }, 2]]) {
  const ctx = await b.newContext({ viewport: vp, deviceScaleFactor: dpr, isMobile: k === "m", hasTouch: k === "m" });
  await ctx.addInitScript(() => { try { sessionStorage.setItem("en-intro", "1") } catch {} });
  const p = await ctx.newPage();
  await p.goto("https://enotmebel.uz/", { waitUntil: "networkidle", timeout: 60000 }).catch(() => {});
  await p.waitForTimeout(2500);
  await p.screenshot({ path: `${TMP}/old-${k}.png` });
  await p.goto(`http://localhost:4795/proto/${"A".repeat(43)}/`, { waitUntil: "load" });
  await p.waitForTimeout(1500);
  await p.screenshot({ path: `${TMP}/new-${k}.png` });
  await ctx.close();
}
await b.close();
execFileSync("python3", ["-I", "-c", `
from PIL import Image
for n in ['old-d','new-d','old-m','new-m']:
    Image.open('${TMP}/'+n+'.png').convert('RGB').save('${OUT}ba-'+n.split('-')[0]+'-'+n.split('-')[1]+'.webp','WEBP',quality=80,method=6)
`]);
console.log("ok");
