// Обложки Open Graph для украинской и польской версий (public/og-uk.png,
// og-pl.png) — в том же виде, что og-ru/en/uz/zh: шрифты сайта, логотип,
// заголовок героя. Запуск: node scripts/og-covers.mjs (нужен Chromium в
// /opt/pw-browsers/chromium).
import { chromium } from "playwright-core";
import { readFileSync, writeFileSync } from "node:fs";
const root = new URL("../", import.meta.url).pathname.replace(/\/$/, "");
const font = (f) => `data:font/woff2;base64,${readFileSync(`${root}/app/fonts/${f}`).toString("base64")}`;
const logo = `data:image/svg+xml;base64,${readFileSync(`${root}/public/brand/logo-square-alpha.svg`).toString("base64")}`;
const variants = {
  uk: { eyebrow: "Розробка повного циклу · Ташкент", lead: "Ми пишемо код,", accent: "який приносить гроші", sub: "Сайти · Застосунки · LLM і RAG · Маркетплейси" },
  pl: { eyebrow: "Software house · Taszkent", lead: "Piszemy kod,", accent: "który zarabia pieniądze", sub: "Strony · Aplikacje · LLM i RAG · Marketplace’y" },
};
const html = (v) => `<!doctype html><html><head><style>
@font-face{font-family:U;src:url(${font("unbounded.woff2")});font-weight:200 900}
@font-face{font-family:I;src:url(${font("inter.woff2")});font-weight:100 900}
@font-face{font-family:J;src:url(${font("jetbrains-mono.woff2")});font-weight:100 800}
*{margin:0;box-sizing:border-box}
body{width:1200px;height:630px;overflow:hidden;background:#05070a;position:relative;font-family:I;color:#e8eef7}
.bg{position:absolute;inset:0;background:
 radial-gradient(900px 620px at 8% 0%, rgba(28,56,112,.85), transparent 62%),
 radial-gradient(760px 520px at 88% 96%, rgba(10,70,45,.75), transparent 64%), #05070a}
.wrap{position:absolute;left:72px;top:66px;right:72px}
.brand{display:flex;align-items:center;gap:18px;height:52px}
.brand img{width:52px;height:52px}
.brand b{font-family:U;font-weight:700;font-size:31px;letter-spacing:-.5px;color:#eef3fb}
.brand b i{font-style:normal;color:#22e39a}
.brand s{text-decoration:none;font-family:U;font-weight:400;font-size:22px;letter-spacing:5px;color:#8a93a3;margin-left:-6px}
.eyebrow{margin-top:56px;display:flex;align-items:center;gap:14px;font-family:J;font-size:17px;letter-spacing:4.2px;text-transform:uppercase;color:#22e39a}
.eyebrow:before{content:"";width:44px;height:1.5px;background:#22e39a}
h1{margin-top:22px;font-family:U;font-weight:800;font-size:72px;line-height:1.02;letter-spacing:-2.5px}
h1 span{display:block}
h1 .a{background:linear-gradient(90deg,#22e39a 0%,#38c9c8 45%,#5aa2ff 100%);-webkit-background-clip:text;color:transparent}
.sub{margin-top:30px;font-size:24px;color:#9aa4b4}
.chips{margin-top:28px;display:flex;gap:10px}
.chips span{font-family:J;font-size:16px;color:#9aa4b4;border:1px solid #1d2531;background:rgba(15,20,28,.7);border-radius:8px;padding:10px 16px}
</style></head><body><div class="bg"></div><div class="wrap">
<div class="brand"><img src="${logo}"><b>Dev<i>Uz</i></b><s>STUDIO</s></div>
<div class="eyebrow">${v.eyebrow}</div>
<h1><span>${v.lead}</span><span class="a">${v.accent}</span></h1>
<div class="sub">${v.sub}</div>
<div class="chips"><span>Next.js</span><span>Flutter</span><span>LLM API</span><span>PostgreSQL</span><span>6 lang</span></div>
</div></body></html>`;
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
for (const [k, v] of Object.entries(variants)) {
  await page.setContent(html(v));
  await page.evaluate(() => document.fonts.ready);
  const out = `${root}/public/og-${k}.png`;
  await page.screenshot({ path: out });
}
await browser.close();
