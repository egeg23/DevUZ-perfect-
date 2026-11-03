// Снимок сайта клиента до макета: node scripts/protos/site-before.mjs <имя> <адрес>
//
// Владелец, 03.11.2026, после «Украли визуал и цвета с прототипа» про
// Optimal Prime: «Да, сохрани и сделай правило». Их сайт оказался своим,
// старым, но показать, как он выглядел 31.10, было нечем — только текстом в
// SOURCES.md. Теперь перед сборкой макета руками сайт клиента снимается:
//
// - docs/screens/<имя>/before/ — главная целиком на 1440 и 390, другие языки
//   (hreflang того же сайта) — первый экран на 1440; WebP;
// - scripts/protos/<имя>/BEFORE.md — когда снято, адреса, заголовки ответа,
//   SHA-256 и размер страниц, стилей и скриптов, цвета и шрифты. Коммит с
//   ним — дата, которую задним числом не подделать;
// - docs/screens/<имя>/before/code-<день>.enc — их код (страницы, стили,
//   скрипты, знак) архивом под шифром: репозиторий открытый, а код их. Ключ —
//   в хранилище секретов; хеши в BEFORE.md доказывают, каким код был.
// - scripts/protos/<имя>/.before/ — тот же код открытым и key.sql с ключом;
//   в git не идёт.
//
// Сайта нет (только Instagram или карточка на картах) — снимать нечего:
// BEFORE.md руками, строка «Сайта нет: …». Проверяет tests/proto-before.test.ts.
import { createCipheriv, createHash, randomBytes } from "node:crypto";
import { execSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import sharp from "sharp";

const require = createRequire(execSync("npm root -g").toString().trim() + "/playwright/package.json");
const { chromium } = require("playwright");

const [name, raw] = process.argv.slice(2);
if (!name || !/^[a-z0-9-]+$/.test(name) || !raw) {
  console.error("node scripts/protos/site-before.mjs <имя> <адрес>   (имя — папка в scripts/protos)");
  process.exit(2);
}
const start = new URL(/^https?:\/\//.test(raw) ? raw : `https://${raw}`);
const SHOTS = `docs/screens/${name}/before`;
const RAW = `scripts/protos/${name}/.before`;
mkdirSync(SHOTS, { recursive: true });
mkdirSync(RAW, { recursive: true });

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36";
const sha = (buf) => createHash("sha256").update(buf).digest("hex");
const KEEP = ["date", "last-modified", "etag", "server", "content-type"];
/** Чужие скрипты, в которых их оформления нет: счётчики, чаты, карты. */
const FOREIGN = /googletagmanager|google-analytics|mc\.yandex|yandex\.ru\/(?:metrika|map)|api-maps|facebook\.net|jivo|bitrix24|tawk|recaptcha/i;

async function get(url) {
  const res = await fetch(url, { headers: { "user-agent": UA }, redirect: "follow", signal: AbortSignal.timeout(30_000) });
  const buf = Buffer.from(await res.arrayBuffer());
  const headers = Object.fromEntries(KEEP.map((k) => [k, res.headers.get(k)]).filter(([, v]) => v));
  return { url: res.url, status: res.status, buf, headers };
}

const fileName = (url) => {
  const u = new URL(url);
  const base = (u.host + u.pathname).replace(/\/$/, "/index").replace(/[^a-z0-9._-]+/gi, "_");
  return /\.(html?|css|js|svg)$/i.test(base) ? base : `${base}.html`;
};

// Страницы: главная и её языки (hreflang того же сайта), не больше четырёх.
const home = await get(start.href);
if (home.status >= 400) {
  console.error(`${home.url} — ${home.status}`);
  process.exit(1);
}
const homeHtml = home.buf.toString("utf8");
const host = new URL(home.url).host;
const pages = [{ url: home.url, lang: "", res: home }];
for (const m of homeHtml.matchAll(/<link\b[^>]*hreflang\s*=\s*["']([^"']+)["'][^>]*>/gi)) {
  const href = m[0].match(/href\s*=\s*["']([^"']+)["']/i)?.[1];
  if (!href || m[1] === "x-default") continue;
  const url = new URL(href, home.url).href;
  if (url === home.url) {
    pages[0].lang ||= m[1];
    continue;
  }
  if (new URL(url).host !== host || pages.some((p) => p.url === url) || pages.length >= 4) continue;
  pages.push({ url, lang: m[1], res: null });
}
const uniq = pages;

// Код: страницы, свои стили и скрипты; чужие библиотеки — только адресом.
const files = [];
const libs = new Set();
const seen = new Set();
const texts = [];
for (const p of uniq) {
  p.res ??= await get(p.url);
  const html = p.res.buf.toString("utf8");
  files.push({ kind: "страница", url: p.res.url, status: p.res.status, buf: p.res.buf, headers: p.res.headers });
  texts.push(html);
  const refs = [
    ...[...html.matchAll(/<link\b[^>]*>/gi)]
      .map((m) => m[0])
      .filter((tag) => /rel\s*=\s*["']?[^"'>]*(stylesheet|icon)/i.test(tag))
      .map((tag) => tag.match(/href\s*=\s*["']([^"']+)["']/i)?.[1]),
    ...[...html.matchAll(/<script\b[^>]*\bsrc\s*=\s*["']([^"']+)["']/gi)].map((m) => m[1]),
    // Знак и логотип векторами: из них обычно и берутся цвета бренда.
    ...[...html.matchAll(/<img\b[^>]*\bsrc\s*=\s*["']([^"']+\.svg)(?:\?[^"']*)?["']/gi)].map((m) => m[1]),
  ].filter(Boolean);
  for (const ref of refs) {
    let url;
    try {
      url = new URL(ref, p.res.url).href;
    } catch {
      continue;
    }
    if (new URL(url).host !== host) {
      if (!FOREIGN.test(url)) libs.add(url);
      continue;
    }
    if (seen.has(url)) continue;
    seen.add(url);
    const r = await get(url);
    if (r.status >= 400) continue;
    const kind = /\.css(\?|$)/i.test(url) ? "стили" : /\.svg(\?|$)/i.test(url) ? "картинка" : /\.js(\?|$)/i.test(url) ? "скрипт" : "файл";
    files.push({ kind, url: r.url, status: r.status, buf: r.buf, headers: r.headers });
    texts.push(r.buf.toString("utf8"));
  }
}
for (const f of files) writeFileSync(`${RAW}/${fileName(f.url)}`, f.buf);

// Копия кода — шифром рядом со снимками: tar.xz, AES-256-GCM (12 байт iv,
// 16 байт тега, дальше шифр), ключ свой на каждый снимок. Ключ — только в
// хранилище секретов (app.SITE_BEFORE_<ИМЯ>_<ДЕНЬ>): запрос лежит в
// .before/key.sql, сессия выполняет его через Supabase. В git, в журнал и в
// чат ключ не идёт. Расшифровка — строкой в BEFORE.md.
const day = new Date().toISOString().slice(0, 10);
const names = [...new Set(files.map((f) => fileName(f.url)))];
const archive = execSync(`tar -C ${JSON.stringify(RAW)} -cf - ${names.map((n) => JSON.stringify(n)).join(" ")} | xz -9e`, {
  maxBuffer: 64 * 1024 * 1024,
});
const key = randomBytes(32);
const iv = randomBytes(12);
const cipher = createCipheriv("aes-256-gcm", key, iv);
const sealed = Buffer.concat([cipher.update(archive), cipher.final()]);
const CODE = `${SHOTS}/code-${day}.enc`;
writeFileSync(CODE, Buffer.concat([iv, cipher.getAuthTag(), sealed]));
const SECRET = `app.SITE_BEFORE_${name.toUpperCase().replace(/-/g, "_")}_${day.replace(/-/g, "")}`;
writeFileSync(`${RAW}/key.sql`, `select public.app_secret_put('${SECRET}', '${key.toString("hex")}');\n`);

// Цвета и шрифты — то, о чём спорят, когда говорят «украли визуал».
const all = texts.join("\n");
const counts = new Map();
for (const m of all.matchAll(/#([0-9a-f]{6}|[0-9a-f]{3})\b(?![0-9a-f-])/gi)) {
  let h = m[1].toLowerCase();
  if (h.length === 3) h = [...h].map((c) => c + c).join("");
  counts.set(`#${h}`, (counts.get(`#${h}`) ?? 0) + 1);
}
const colors = [...counts].sort((a, b) => b[1] - a[1]).slice(0, 16);
const fonts = new Set();
for (const m of all.matchAll(/fonts\.googleapis\.com\/css2?\?([^"'\s>]+)/g)) {
  for (const f of m[1].matchAll(/family=([^:&]+)/g)) fonts.add(decodeURIComponent(f[1]).replace(/\+/g, " "));
}
for (const m of all.matchAll(/font-family\s*:\s*([^;}"]+)/gi)) fonts.add(m[1].trim().replace(/\s+/g, " "));

// Снимки: прокрутить до конца (появления по прокрутке), вернуться наверх.
const browser = await chromium.launch();
const shots = [];
async function shoot(url, width, full, tag) {
  const ctx = await browser.newContext({ viewport: { width, height: width < 700 ? 844 : 900 }, userAgent: UA });
  const page = await ctx.newPage();
  await page.goto(url, { waitUntil: "networkidle", timeout: 60_000 }).catch(() => page.waitForTimeout(3000));
  await page.waitForTimeout(1500);
  if (full) {
    const h = await page.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y < h; y += 500) {
      await page.evaluate((y) => scrollTo(0, y), y);
      await page.waitForTimeout(120);
    }
    await page.waitForTimeout(800);
    await page.evaluate(() => scrollTo(0, 0));
    await page.waitForTimeout(800);
  }
  const png = await page.screenshot({ fullPage: full, animations: "disabled" });
  await ctx.close();
  const img = sharp(png);
  const { height } = await img.metadata();
  // WebP не больше 16383 точек по стороне: длинную страницу — частями.
  const part = 12_000;
  const n = Math.ceil(height / part);
  for (let i = 0; i < n; i++) {
    const file = `${SHOTS}/${tag}-${width}${n > 1 ? `-${i + 1}` : ""}.webp`;
    const top = i * part;
    await sharp(png)
      .extract({ left: 0, top, width, height: Math.min(part, height - top) })
      .webp({ quality: 72 })
      .toFile(file);
    shots.push(file);
  }
}
for (const [i, p] of uniq.entries()) {
  const tag = p.lang || "home";
  if (i === 0) {
    await shoot(p.url, 1440, true, tag);
    await shoot(p.url, 390, true, tag);
  } else {
    await shoot(p.url, 1440, false, tag);
  }
}
await browser.close();

const now = new Date();
const tashkent = now.toLocaleString("ru-RU", { timeZone: "Asia/Tashkent", dateStyle: "long", timeStyle: "short" });
const md = [
  `# Сайт клиента до макета: ${host}`,
  "",
  `Снято: ${now.toISOString()} (${tashkent} по Ташкенту), \`node scripts/protos/site-before.mjs ${name} ${start.href}\`.`,
  "Правило — CLAUDE.md, «Сайт клиента — снимок до макета».",
  "",
  "## Код",
  "",
  `Их код открытым в репозиторий не кладём: он архивом под шифром — \`${CODE}\` (AES-256-GCM, SHA-256`,
  `архива \`${sha(archive)}\`). Ключ — в хранилище секретов: \`${SECRET}\`. Открыть:`,
  "",
  "```sh",
  `KEY=<ключ из хранилища> node -e 'const c=require("crypto"),f=require("fs"),b=f.readFileSync("${CODE}");`,
  `const d=c.createDecipheriv("aes-256-gcm",Buffer.from(process.env.KEY,"hex"),b.subarray(0,12));d.setAuthTag(b.subarray(12,28));`,
  `f.writeFileSync("code.tar.xz",Buffer.concat([d.update(b.subarray(28)),d.final()]))' && tar -xJf code.tar.xz`,
  "```",
  "",
  "## Снимки",
  "",
  ...shots.map((f) => `- \`${f}\``),
  "",
  "## Страницы и файлы",
  "",
  "| Что | Адрес | Ответ | Размер | SHA-256 |",
  "|---|---|---|---|---|",
  ...files.map((f) => `| ${f.kind} | ${f.url} | ${f.status} | ${f.buf.length} | \`${sha(f.buf)}\` |`),
  "",
  "Заголовки ответа главной:",
  "",
  ...Object.entries(files[0].headers).map(([k, v]) => `- ${k}: ${v}`),
  "",
  "## Подключено со стороны",
  "",
  ...(libs.size ? [...libs].map((u) => `- ${u}`) : ["- ничего"]),
  "",
  "## Цвета (по частоте) и шрифты",
  "",
  colors.map(([c, n]) => `\`${c}\` ×${n}`).join(", ") || "цветов в коде нет",
  "",
  ...(fonts.size ? [...fonts].slice(0, 12).map((f) => `- ${f}`) : ["- шрифтов в коде нет"]),
  "",
].join("\n");
writeFileSync(`scripts/protos/${name}/BEFORE.md`, md);
console.log(`снято: ${uniq.length} стр., ${files.length} файлов, ${shots.length} снимков → scripts/protos/${name}/BEFORE.md`);
