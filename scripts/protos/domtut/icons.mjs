// Значки вкладки и экрана «Домой» — их знак на белом поле: node icons.mjs
import { chromium } from "playwright-core";
import { readFileSync } from "node:fs";
const L = JSON.parse(readFileSync(new URL("logo.json", import.meta.url)));
const OUT = new URL("../../../public/protos/domtut/", import.meta.url).pathname;
const svg = (n) => `<svg xmlns="http://www.w3.org/2000/svg" width="${n}" height="${n}" viewBox="-6 -6 60 60"><rect x="-6" y="-6" width="60" height="60" fill="#fff"/><path d="${L.back}" fill="#4D97FF"/><path d="${L.front}" fill="#006AFF"/><path fill-rule="evenodd" d="${L.house}" fill="#fff"/></svg>`;
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
for (const [n, f] of [[192, "icon-192.png"], [180, "apple-180.png"]]) {
  const p = await b.newPage({ viewport: { width: n, height: n } });
  await p.setContent(`<body style="margin:0">${svg(n)}</body>`);
  await p.screenshot({ path: OUT + f });
}
await b.close();
