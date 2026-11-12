// Пример шаблона «Интернет-магазин» на выдуманном магазине и снимки 390 и 1440 (ru, uz).
//
//   node --import ./tests/alias-hook.mjs --import ./tests/tsx-hook.mjs \
//     scripts/protos/instant/magazin-preview.mjs [выход]
//
// Проходит путь покупателя: главная, товар, корзина, оформление, заказ, и
// проверяет, что заказ первой строкой приходит в панель магазина.
// Снимки — docs/screens/instant/magazin-*.webp.
import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { createServer } from "node:http";
import { join, extname, resolve } from "node:path";
import { tmpdir } from "node:os";
import { createRequire } from "node:module";
import { execSync } from "node:child_process";

import { buildInstant } from "../../../lib/proto/instant/build.ts";
import { EXAMPLE_SHOP } from "./preview-data.mjs";

const root = resolve(new URL("../../..", import.meta.url).pathname);
const out = process.argv[2] ?? join(tmpdir(), "instant-magazin");
mkdirSync(out, { recursive: true });

const UZ = { locale: "uz", tagline: "Uy uchun mahsulotlar yetkazib berish bilan", about: "Uy uchun mahsulotlar internet-do‘koni: tekstil, idishlar, dekor.", perks: ["Toshkent bo‘ylab yetkazish", "Olishda to‘lov"], source: "namuna, o‘ylab topilgan do‘kon" };
for (const [l, extra] of [["ru", {}], ["uz", UZ]]) {
  const b = buildInstant({ ...EXAMPLE_SHOP, ...extra }, "0".repeat(32));
  if (b.problems.length) {
    console.error(l, "проверка не прошла:", b.problems);
    process.exit(1);
  }
  writeFileSync(join(out, `${l}.html`), b.html.replaceAll("__PROTO_BASE__", `/${l}`));
  writeFileSync(join(out, `adm-${l}.html`), b.pages.admin.replaceAll("__PROTO_BASE__", `/${l}`));
}

const TYPES = { ".html": "text/html; charset=utf-8", ".webp": "image/webp", ".mp4": "video/mp4" };
const server = createServer((req, res) => {
  const path = decodeURIComponent((req.url ?? "/").split("?")[0]);
  const m = path.match(/^\/(ru|uz)(\/admin)?$/);
  const file = m ? join(out, `${m[2] ? "adm-" : ""}${m[1]}.html`) : join(root, "public", path);
  if (!file.startsWith(root) && !file.startsWith(out)) return res.writeHead(403).end();
  if (!existsSync(file)) return res.writeHead(404).end();
  res.writeHead(200, { "content-type": TYPES[extname(file)] ?? "application/octet-stream" });
  res.end(readFileSync(file));
}).listen(0);
const port = server.address().port;

const require = createRequire(execSync("npm root -g").toString().trim() + "/playwright/package.json");
const { chromium } = require("playwright");
const shots = join(root, "docs/screens/instant");
mkdirSync(shots, { recursive: true });
const browser = await chromium.launch();
const bad = [];
for (const l of ["ru", "uz"]) {
  for (const [w, h] of [[390, 844], [1440, 900]]) {
    const page = await browser.newPage({ viewport: { width: w, height: h } });
    page.on("pageerror", (e) => bad.push(`${l} ${w}: ${e.message} ${(e.stack ?? "").split("\n").slice(1, 3).join(" ")} @${page.url()}`));
    await page.addInitScript(() => sessionStorage.setItem("dz-intro", "1"));
    await page.goto(`http://localhost:${port}/${l}`);
    await page.evaluate(() => document.getElementById("dzi")?.remove());
    await page.waitForTimeout(700);
    const wide = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    if (wide > 1) bad.push(`${l} ${w}: прокрутка вбок ${wide}px`);
    await page.screenshot({ path: join(out, "home.png"), fullPage: true });
    execSync(`python3 -c "from PIL import Image;im=Image.open('${join(out, "home.png")}');im=im.crop((0,0,im.width,min(im.height,${w < 600 ? 2400 : 1800})));im.save('${join(shots, `magazin-${w}-${l}.webp`)}','WEBP',quality=70)"`);
    if (w === 390 && l === "ru") {
      // Путь покупателя: товар → корзина → оформление → заказ → панель.
      await page.click('[data-add="g0"]');
      await page.goto(`http://localhost:${port}/${l}#/p/g0`);
      await page.waitForTimeout(500);
      await page.screenshot({ path: join(out, "pd.png") });
      execSync(`python3 -c "from PIL import Image;Image.open('${join(out, "pd.png")}').save('${join(shots, "magazin-390-product.webp")}','WEBP',quality=70)"`);
      await page.goto(`http://localhost:${port}/${l}#/checkout`);
      await page.waitForTimeout(500);
      await page.fill("#ph", "901234567");
      await page.click("#ph-go");
      const ins = await page.$$("#code input");
      for (const [k, d] of ["1", "2", "3", "4"].entries()) await ins[k].type(d);
      await page.waitForTimeout(400);
      await page.click('[data-recv="pickup"]');
      await page.click('input[name=pay][value="cash"]', { force: true });
      await page.click("#co-go");
      await page.waitForTimeout(600);
      const url = page.url();
      if (!/#\/order\/Z-/.test(url)) bad.push(`заказ не оформился: ${url}`);
      await page.goto(`http://localhost:${port}/${l}/admin#orders`);
      await page.waitForTimeout(800);
      const first = await page.evaluate(() => document.querySelector("#pv")?.innerText ?? "");
      if (!first.includes("Z-20481")) bad.push("заказ с сайта не пришёл в панель");
      await page.screenshot({ path: join(out, "adm.png") });
      execSync(`python3 -c "from PIL import Image;Image.open('${join(out, "adm.png")}').save('${join(shots, "magazin-390-admin.webp")}','WEBP',quality=70)"`);
    }
    await page.close();
  }
}
await browser.close();
server.close();
console.log(bad.length ? `Ошибки:\n${bad.join("\n")}` : "Чисто: ошибок скрипта и прокрутки вбок нет, заказ дошёл до панели.");
