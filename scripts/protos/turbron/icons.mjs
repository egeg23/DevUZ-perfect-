// Значки вкладки и экрана «Домой»: рабочий знак агентства. node icons.mjs
import { chromium } from "playwright-core";
const OUT = new URL("../../../public/protos/turbron/", import.meta.url).pathname;
const svg = (n) => `<svg xmlns="http://www.w3.org/2000/svg" width="${n}" height="${n}" viewBox="0 0 48 48"><rect width="48" height="48" fill="#0b6e78"/><circle cx="31" cy="19" r="7.5" fill="#ffb35c"/><path d="M8 31.5c5.3-4.2 10.7-4.2 16 0s10.7 4.2 16 0" fill="none" stroke="#fff" stroke-width="3.2" stroke-linecap="round"/><path d="M8 38.5c5.3-4.2 10.7-4.2 16 0s10.7 4.2 16 0" fill="none" stroke="#7fd6d2" stroke-width="3.2" stroke-linecap="round"/></svg>`;
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
for (const [n, f] of [[192, "icon-192.png"], [180, "apple-180.png"]]) {
  const p = await b.newPage({ viewport: { width: n, height: n } });
  await p.setContent(`<body style="margin:0">${svg(n)}</body>`);
  await p.screenshot({ path: OUT + f });
}
await b.close();
