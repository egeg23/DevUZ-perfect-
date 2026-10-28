/* Логотипы брендов для стеклянных папок: node logos.mjs <папка с логотипами>
   Исходники — плитки блока «Каталог» на cosmoworld.uz (svg и png, в
   неактивном виде у них прозрачность 0.2). Снимаем прозрачность, рисуем в
   браузере и берём только форму: public/protos/cosmoworld/logo/<бренд>.png —
   белый знак на прозрачном, цвет даёт CSS (mask-image). */
import { createRequire } from "node:module";
import { execSync } from "node:child_process";
import { readFileSync, existsSync, mkdirSync } from "node:fs";
import sharp from "sharp";
const require = createRequire(execSync("npm root -g").toString().trim() + "/playwright/package.json");
const { chromium } = require("playwright");
const SRC = process.argv[2];
const OUT = new URL("../../../public/protos/cosmoworld/logo/", import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });
const IDS = ["arnest", "vesna", "rashel", "peros", "forest", "bily", "parachute", "brandfree", "mixit", "nefis"];
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 492, height: 444 } });
for (const id of IDS) {
  const svg = `${SRC}/${id}.svg`;
  let src;
  if (existsSync(svg)) src = "data:image/svg+xml;base64," + Buffer.from(readFileSync(svg, "utf8").replace(/opacity="0?\.\d+"/g, "")).toString("base64");
  else src = "data:image/png;base64," + readFileSync(`${SRC}/${id}.png`).toString("base64");
  await p.setContent(`<body style="margin:0;background:transparent"><img src="${src}" style="width:492px;height:444px;display:block"></body>`);
  await p.waitForTimeout(150);
  const png = await p.screenshot({ omitBackground: true });
  const { data, info } = await sharp(png).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  /* У PNG светлая надпись внутри знака (Parachute) — не прозрачность, а цвет:
     форма = прозрачность × темнота. */
  if (!existsSync(svg)) {
    let lo = 255;
    for (let i = 0; i < data.length; i += 4) if (data[i + 3] > 128) lo = Math.min(lo, data[i]);
    for (let i = 0; i < data.length; i += 4) data[i + 3] = Math.round(data[i + 3] * Math.max(0, Math.min(1, (255 - data[i]) / Math.max(1, 255 - lo))));
  }
  let max = 1;
  for (let i = 3; i < data.length; i += 4) max = Math.max(max, data[i]);
  const k = 255 / max;
  for (let i = 0; i < data.length; i += 4) { const a = Math.min(255, Math.round(data[i + 3] * k)); data[i] = data[i + 1] = data[i + 2] = 255; data[i + 3] = a < 24 ? 0 : a; }
  await sharp(data, { raw: info }).trim({ threshold: 0 }).png().toFile(`${OUT}${id}.png`);
  console.log(id);
}
await b.close();
