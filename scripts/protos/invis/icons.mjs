// Значки вкладки и экрана «Домой»: временный знак Invis. node icons.mjs
import { chromium } from "playwright-core";
import { MARK_PATHS as M } from "./mark.mjs";
const OUT = new URL("../../../public/protos/invis/", import.meta.url).pathname;
const svg = (n) => `<svg xmlns="http://www.w3.org/2000/svg" width="${n}" height="${n}" viewBox="0 0 96 96"><rect width="96" height="96" fill="#090616"/><g transform="translate(6 26) scale(.875)"><path d="${M.body}" fill="#ff064d"/><path d="${M.ticks}" stroke="#090616" stroke-width="2.2" stroke-linecap="round" fill="none"/><circle cx="48" cy="28" r="17" fill="#090616"/><path d="${M.ring}" fill="#ff064d" fill-rule="evenodd"/><path d="${M.gaps}" stroke="#090616" stroke-width="3.2" stroke-linecap="round"/><path d="${M.dot}" fill="#ff064d"/></g></svg>`;
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
for (const [n, f] of [[192, "icon-192.png"], [180, "apple-180.png"]]) {
  const p = await b.newPage({ viewport: { width: n, height: n } });
  await p.setContent(`<body style="margin:0">${svg(n)}</body>`);
  await p.screenshot({ path: OUT + f });
}
await b.close();
