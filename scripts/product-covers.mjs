#!/usr/bin/env node
/**
 * Обложки продуктов без живого экземпляра.
 *
 *   node --import ./tests/alias-hook.mjs --import ./tests/tsx-hook.mjs scripts/product-covers.mjs
 *
 * Search Console, 13.11.2026: «Отсутствует поле "image"» у
 * /zh/products/legal-ai. Google считает картинку обязательной для карточки
 * товара, а у четырёх продуктов (доставка, ИИ-продавец, ИИ-юрист,
 * маркетплейс) нет работающего сайта, с которого снять экран.
 *
 * Поэтому у них — обложка-«коробка»: название, что входит (блоки состава),
 * стек и цена, ровно то, что продаётся. Экраны интерфейса не рисуем: их нет,
 * и нарисованный экран был бы обещанием, которого продукт не держит.
 * Обложка стоит и на странице продукта (картинка в разметке, которой нет на
 * странице, — разметка, разошедшаяся со страницей), и в `productSchema`.
 *
 * Одна обложка на все языки (английский текст, картинка — не перевод
 * страницы), три пропорции, как просит Google: 16:9, 4:3, 1:1 —
 * `public/products/<slug>/cover-<пропорция>.webp`. Продукт со снимками
 * (`shots`) обложки не получает: у него есть настоящие экраны.
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import sharp from "sharp";
import { chromium } from "playwright-core";

import { products } from "../content/products.ts";

export const COVER_SIZES = [
  { key: "16x9", width: 1200, height: 675 },
  { key: "4x3", width: 1200, height: 900 },
  { key: "1x1", width: 1200, height: 1200 },
];

// Шрифты — внутрь страницы: setContent открывает about:blank, и file:// оттуда не грузится.
const FONTS = {};
for (const f of ["prata", "onest", "jetbrains-mono"]) {
  FONTS[f] = `data:font/woff2;base64,${(await readFile(path.resolve("app/fonts", `${f}.woff2`))).toString("base64")}`;
}
const font = (file) => FONTS[file.replace(".woff2", "")];
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const money = (n) => `$${n.toLocaleString("en-US")}`;

function html(product, size) {
  const square = size.height / size.width > 0.8;
  const blocks = product.blocks.slice(0, square ? 6 : 4);
  const price = product.priceToUsd ? `${money(product.priceUsd)} – ${money(product.priceToUsd)}` : money(product.priceUsd);
  return `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{font-family:Prata;src:url(${font("prata.woff2")})}
@font-face{font-family:Onest;src:url(${font("onest.woff2")})}
@font-face{font-family:Mono;src:url(${font("jetbrains-mono.woff2")})}
*{box-sizing:border-box;margin:0}
html,body{width:${size.width}px;height:${size.height}px}
body{font-family:Onest,sans-serif;color:#effaf6;background:
radial-gradient(70% 60% at 85% 0%,rgb(63 214 200/.22),transparent 70%),
radial-gradient(60% 50% at 0% 100%,rgb(233 199 127/.12),transparent 70%),
linear-gradient(160deg,#06272a,#03100f 70%);padding:64px;display:flex;flex-direction:column;gap:${square ? 36 : 26}px}
.top{display:flex;justify-content:space-between;align-items:center;font-family:Mono;font-size:20px;letter-spacing:.18em;text-transform:uppercase;color:#3fd6c8}
.top b{color:#e9c77f;font-weight:400}
h1{font-family:Prata,serif;font-weight:400;font-size:${square ? 68 : 58}px;line-height:1.08;max-width:95%}
.tag{font-size:26px;line-height:1.35;color:#bcd8d2;max-width:90%}
.grid{display:grid;grid-template-columns:repeat(2,1fr);gap:16px;flex:1;align-content:start}
.b{border:1px solid rgb(222 250 244/.16);background:rgb(6 34 35/.6);border-radius:18px;padding:${square ? "24px 26px" : "18px 22px"}}
.b h3{font-size:21px;font-weight:600}
.b p{margin-top:${square ? 10 : 6}px;font-size:${square ? 18 : 16}px;line-height:1.35;color:#8db3ac;display:-webkit-box;-webkit-line-clamp:${square ? 5 : 2};-webkit-box-orient:vertical;overflow:hidden}
.foot{display:flex;justify-content:space-between;align-items:flex-end;gap:24px}
.tech{display:flex;flex-wrap:wrap;gap:10px;max-width:70%}
.tech span{font-family:Mono;font-size:16px;border:1px solid rgb(222 250 244/.2);border-radius:10px;padding:6px 12px;color:#bcd8d2}
.price{font-family:Mono;font-size:40px;color:#e9c77f;white-space:nowrap}
.price small{display:block;font-size:16px;color:#8db3ac;text-align:right;letter-spacing:.1em}
</style></head><body>
<div class="top"><span>DevUz · source code</span><b>${esc(product.slug)}</b></div>
<h1>${esc(product.title.en)}</h1>
<p class="tag">${esc(product.tagline.en)}</p>
<div class="grid">${blocks
    .map((b) => `<div class="b"><h3>${esc(b.title.en)}</h3><p>${esc((b.items.en ?? []).slice(0, square ? 4 : 2).join(" · "))}</p></div>`)
    .join("")}</div>
<div class="foot"><div class="tech">${product.tech.slice(0, 7).map((t) => `<span>${esc(t)}</span>`).join("")}</div>
<div class="price">${price}<small>ONE-TIME</small></div></div>
</body></html>`;
}

const browser = await chromium.launch({ executablePath: process.env.CHROME || undefined });
try {
  for (const product of products) {
    if (product.shots?.length) continue;
    const dir = path.resolve("public/products", product.slug);
    await mkdir(dir, { recursive: true });
    for (const size of COVER_SIZES) {
      const page = await browser.newPage({ viewport: { width: size.width, height: size.height } });
      await page.setContent(html(product, size), { waitUntil: "load" });
      await page.evaluate(() => document.fonts.ready);
      const png = await page.screenshot({ type: "png" });
      await page.close();
      const out = path.join(dir, `cover-${size.key}.webp`);
      await writeFile(out, await sharp(png).webp({ quality: 82 }).toBuffer());
      console.log(out);
    }
  }
} finally {
  await browser.close();
}
