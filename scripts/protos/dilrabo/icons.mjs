// Значки вкладки и экрана «Домой»: их знак (восьмиконечная звезда из favicon.svg их сайта) на светлом фоне. node icons.mjs
import { readFileSync } from "node:fs";
import { chromium } from "playwright-core";
const OUT = new URL("../../../public/protos/dilrabo/", import.meta.url).pathname;
const MARK = readFileSync(new URL("logo.inc", import.meta.url), "utf8");
const svg = (n) => `<svg xmlns="http://www.w3.org/2000/svg" width="${n}" height="${n}" viewBox="-9 -9 109 109"><rect x="-9" y="-9" width="109" height="109" fill="#f6f4ef"/>${MARK}</svg>`;
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
for (const [n, f] of [[192, "icon-192.png"], [180, "apple-180.png"]]) {
  const p = await b.newPage({ viewport: { width: n, height: n } });
  await p.setContent(`<body style="margin:0">${svg(n)}</body>`);
  await p.screenshot({ path: OUT + f });
}
await b.close();
