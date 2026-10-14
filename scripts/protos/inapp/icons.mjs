// Значки вкладки и экрана «Домой»: текстовый знак inapp.uz. node icons.mjs
import { chromium } from "playwright-core";
const OUT = new URL("../../../public/protos/inapp/", import.meta.url).pathname;
const svg = (n) => `<svg xmlns="http://www.w3.org/2000/svg" width="${n}" height="${n}" viewBox="0 0 48 48"><rect width="48" height="48" fill="#2898fe"/><circle cx="24" cy="12.5" r="3.4" fill="#fff"/><rect x="21.4" y="18" width="5.2" height="11" rx="2.6" fill="#fff"/><path d="M9 36c5-3.8 10-3.8 15 0s10 3.8 15 0" fill="none" stroke="#fff" stroke-width="3.2" stroke-linecap="round"/></svg>`;
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
for (const [n, f] of [[192, "icon-192.png"], [180, "apple-180.png"]]) {
  const p = await b.newPage({ viewport: { width: n, height: n } });
  await p.setContent(`<body style="margin:0">${svg(n)}</body>`);
  await p.screenshot({ path: OUT + f });
}
await b.close();
