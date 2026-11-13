// «Макет в боте» на английском, арабском и польском: снимки 390 и 1440.
//
//   node --import ./tests/alias-hook.mjs --import ./tests/tsx-hook.mjs \
//     scripts/protos/instant/lang-preview.mjs
//
// Клиники и ресторан выдуманы. Снимки — docs/screens/instant/lang/.
import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { createServer } from "node:http";
import { join, extname, resolve } from "node:path";
import { tmpdir } from "node:os";
import { createRequire } from "node:module";
import { execSync } from "node:child_process";

import { buildInstant } from "../../../lib/proto/instant/build.ts";
import { widgetHtml, widgetState } from "../../../lib/proto/instant/widget.ts";
import { EXAMPLE, EXAMPLE_MED, EXAMPLE_REST } from "./preview-data.mjs";

const root = resolve(new URL("../../..", import.meta.url).pathname);
const out = join(tmpdir(), "instant-lang");
mkdirSync(out, { recursive: true });

/** Данные клиента на его языке: так их отдал бы разбор его сайта. */
const DATA = {
  en: { name: "Smile Lab", city: "Dubai", tagline: null, about: "A family dental clinic.", address: "12 Marina Walk, Dubai", hours: "Mon-Sat 9:00-20:00", services: [{ name: "Cleaning", price: "250 AED" }, { name: "Fillings", price: null }, { name: "Implants", price: null }, { name: "Braces", price: null }], doctors: [{ name: "Dr. Sara Malik", role: "Orthodontist" }], perks: ["Open on Saturdays", "Parking next to the clinic"] },
  ar: { name: "عيادة الابتسامة", city: "دبي", tagline: null, about: "عيادة أسنان عائلية.", address: "دبي، مارينا ووك 12", hours: null, services: [{ name: "تنظيف الأسنان", price: "250 درهم" }, { name: "حشوات", price: null }, { name: "زراعة", price: null }], doctors: [{ name: "د. سارة مالك", role: "تقويم الأسنان" }], perks: ["نعمل يوم السبت", "موقف سيارات بجانب العيادة"] },
  pl: { name: "Uśmiech Dental", city: "Warszawa", tagline: null, about: "Rodzinna klinika stomatologiczna.", address: "ul. Marszałkowska 10, Warszawa", hours: "Pn-Sb 9:00-20:00", services: [{ name: "Higienizacja", price: "300 zł" }, { name: "Wypełnienia", price: null }, { name: "Implanty", price: null }], doctors: [{ name: "Anna Nowak", role: "Ortodonta" }], perks: ["Przyjmujemy w soboty", "Parking przy klinice"] },
};
const REST = {
  en: { name: "Olive Table", services: [{ name: "Grilled lamb", price: null }, { name: "Hummus", price: null }, { name: "Fresh salad", price: null }] },
  ar: { name: "مطعم الزيتون", services: [{ name: "لحم مشوي", price: null }, { name: "حمص", price: null }, { name: "سلطة", price: null }] },
  pl: { name: "Zielony Stół", services: [{ name: "Pierogi", price: null }, { name: "Żurek", price: null }, { name: "Sałatka", price: null }] },
};

const pages = {};
for (const l of ["en", "ar", "pl"]) {
  const d = DATA[l];
  const site = { ...EXAMPLE, ...d, locale: l, source: "example, invented clinic" };
  const dental = buildInstant(site, "0".repeat(32));
  const med = buildInstant({ ...EXAMPLE_MED, ...d, locale: l, source: "example" }, "0".repeat(32));
  const rest = buildInstant({ ...EXAMPLE_REST, ...REST[l], city: d.city, address: d.address, hours: null, locale: l, source: "example" }, "0".repeat(32));
  for (const [n, b] of [["dental", dental], ["med", med], ["rest", rest]]) {
    if (b.problems.length) console.error(`Проверка не прошла ${n} ${l}:`, b.problems);
    pages[`/${n}-${l}`] = b.html;
  }
  pages[`/kp-${l}`] = dental.pages.kp.replaceAll("__PROTO_BASE__", `/dental-${l}`);
  pages[`/widget-${l}`] = `<!doctype html><html><head><meta charset="utf-8"><style>:root{--tg-theme-text-color:#111;--tg-theme-hint-color:#888;--tg-theme-bg-color:#fff;--tg-theme-secondary-bg-color:#f1f1f4;--tg-theme-button-color:#2481cc;--tg-theme-section-separator-color:#ddd}body{margin:0;width:360px}</style></head><body><script>window.TelegramWidget={chatData:${JSON.stringify(widgetState("services", false, { host: "smile.example", name: d.name, services: d.services.map((s) => s.name), prices: d.services.map((s) => s.price) }))},onEvent(){},ready(){}}</script>${widgetHtml(l, "stomatologiya")}</body></html>`;
}

const TYPES = { ".html": "text/html; charset=utf-8", ".webp": "image/webp", ".mp4": "video/mp4" };
const server = createServer((req, res) => {
  const path = decodeURIComponent((req.url ?? "/").split("?")[0]);
  if (pages[path]) return res.writeHead(200, { "content-type": TYPES[".html"] }).end(pages[path]);
  const file = join(root, "public", path);
  if (!file.startsWith(root) || !existsSync(file)) return res.writeHead(404).end();
  res.writeHead(200, { "content-type": TYPES[extname(file)] ?? "application/octet-stream" });
  res.end(readFileSync(file));
}).listen(0);
const port = server.address().port;

const require = createRequire(execSync("npm root -g").toString().trim() + "/playwright/package.json");
const { chromium } = require("playwright");
const shots = join(root, "docs/screens/instant/lang");
mkdirSync(shots, { recursive: true });
const browser = await chromium.launch();
for (const path of Object.keys(pages)) {
  for (const [w, h] of path.startsWith("/widget") ? [[360, 420]] : [[390, 844], [1440, 900]]) {
    const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1, reducedMotion: "reduce" });
    page.on("pageerror", (e) => console.error(`Ошибка скрипта на ${path} (${w}):`, e.message));
    await page.goto(`http://127.0.0.1:${port}${path}`, { waitUntil: "networkidle" }).catch(() => {});
    await page.waitForTimeout(600);
    const scroll = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
    if (scroll) console.error(`Прокрутка вбок на ${path} ${w}!`);
    await page.screenshot({ path: join(shots, `${path.slice(1)}-${w}.png`), fullPage: false });
    await page.close();
  }
}
await browser.close();
server.close();
writeFileSync(join(out, "done"), "1");
console.log(`Снимки: ${shots}`);
