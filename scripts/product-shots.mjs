#!/usr/bin/env node
/**
 * Снимки продукта для каталога.
 *
 *   node --import ./tests/alias-hook.mjs scripts/product-shots.mjs \
 *     <slug> <адрес> [<адрес> …] [--phone] [--names главная,каталог]
 *
 * Google требует у товара изображение, «ясно показывающее товар». Для
 * исходного кода это снимок работающего экземпляра, а не обложка с
 * названием: обложку читатель отличает от продукта с первого взгляда, и
 * она не отвечает на единственный вопрос, ради которого её открыли, —
 * как это выглядит.
 *
 * Файлы ложатся в `public/products/<slug>/` и попадают в репозиторий: их
 * пять на продукт и они не меняются каждую ночь, в отличие от снимков
 * разборов. Скрипт печатает готовый блок `shots` — его и вставляют в
 * `content/products.ts`, чтобы размеры не расходились с файлами.
 */
import { existsSync } from "node:fs";
import { mkdir, readdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { execFileSync } from "node:child_process";

import { chromium } from "playwright-core";

const SCALE = 2;
const LOAD_TIMEOUT_MS = 25_000;
const SETTLE_MS = 2_000;

const DESKTOP = { width: 1440, height: 900, mobile: false };
const PHONE = { width: 390, height: 844, mobile: true };

/* ── Аргументы ──────────────────────────────────────────────────────────── */

const argv = process.argv.slice(2);
const phone = argv.includes("--phone");

const valued = (flag) => {
  const at = argv.indexOf(flag);
  return at >= 0 ? (argv[at + 1] ?? "").split(",").map((v) => v.trim()).filter(Boolean) : [];
};

const names = valued("--names");
/** Что убрать перед съёмкой: демонстрационная обвязка — не часть продукта. */
const hideCss = valued("--hide");
const hideText = valued("--hide-text");

const VALUED_FLAGS = new Set(["--names", "--hide", "--hide-text"]);
const positional = argv.filter((a, i) => !a.startsWith("--") && !VALUED_FLAGS.has(argv[i - 1]));

const [slug, ...urls] = positional;
if (!slug || !urls.length) {
  console.error(
    "Использование: node scripts/product-shots.mjs <slug> <адрес> […] [--phone] [--names a,b] [--hide css] [--hide-text «текст»]",
  );
  process.exit(2);
}

/* ── Браузер ────────────────────────────────────────────────────────────── */

async function chromiumPath() {
  if (process.env.CHROMIUM_PATH) return process.env.CHROMIUM_PATH;
  try {
    const known = chromium.executablePath();
    if (known && existsSync(known)) return known;
  } catch {
    // playwright не смог назвать путь — идём перебором.
  }

  const roots = [
    process.env.PLAYWRIGHT_BROWSERS_PATH,
    "/opt/pw-browsers",
    path.join(process.env.HOME || "/root", ".cache/ms-playwright"),
  ].filter(Boolean);
  const LAYOUTS = [
    ["chrome-linux64", "chrome"],
    ["chrome-linux", "chrome"],
    ["chrome-linux", "headless_shell"],
  ];

  for (const root of roots) {
    if (!existsSync(root)) continue;
    const dirs = (await readdir(root, { withFileTypes: true }))
      .filter((d) => d.isDirectory() && d.name.startsWith("chromium"))
      .map((d) => d.name)
      .sort((a, b) => {
        const full = (name) => (name.startsWith("chromium-") ? 0 : 1);
        return full(a) - full(b) || b.localeCompare(a);
      });
    for (const dir of dirs) {
      for (const tail of LAYOUTS) {
        const candidate = path.join(root, dir, ...tail);
        if (existsSync(candidate)) return candidate;
      }
    }
  }
  return null;
}

/**
 * Доверие к перехватывающему прокси среды разработки — то же, что у съёмки
 * разборов: закрепляем один открытый ключ вместо отключения проверки.
 */
function devProxy() {
  const server = process.env.HTTPS_PROXY || process.env.https_proxy;
  const ca = "/root/.ccr/agent-proxy-ca.crt";
  if (!server || !existsSync(ca)) return null;
  try {
    const spki = execFileSync("bash", [
      "-c",
      `openssl x509 -in ${ca} -pubkey -noout | openssl pkey -pubin -outform der | openssl dgst -sha256 -binary | base64`,
    ])
      .toString()
      .trim();
    return spki ? { server, spki } : null;
  } catch {
    return null;
  }
}

/* ── Съёмка ─────────────────────────────────────────────────────────────── */

const executablePath = await chromiumPath();
if (!executablePath) {
  console.error("Chromium не найден. Поставьте его (npx playwright install chromium).");
  process.exit(3);
}

const dir = path.join("public", "products", slug);
await mkdir(dir, { recursive: true });

/**
 * Снимок на диск: webp вместо png.
 *
 * Снимок экрана в png на удвоенной плотности весит два-три мегабайта, а
 * лежат эти файлы в репозитории. webp при качестве 82 даёт то же самое на
 * глаз и в десять раз легче; ширина режется до 1920 — больше Google не
 * просит, а разница видна только пиксельной лупой.
 *
 * sharp приходит вместе с Next (он им оптимизирует картинки). Нет его —
 * оставляем png и честно говорим об этом, а не молчим.
 */
async function save(target, png, screen) {
  const width = Math.min(1920, screen.width * SCALE);
  const height = Math.round((width / (screen.width * SCALE)) * screen.height * SCALE);

  try {
    const sharp = (await import("sharp")).default;
    const webp = target.replace(/\.png$/, ".webp");
    await sharp(png).resize({ width }).webp({ quality: 82 }).toFile(webp);
    return { path: webp, width, height };
  } catch (error) {
    await writeFile(target, png);
    console.error(`  webp не собрался (${String(error?.message ?? error).split("\n")[0]}) — оставляю png`);
    return { path: target, width: screen.width * SCALE, height: screen.height * SCALE };
  }
}

const dev = devProxy();
const browser = await chromium.launch({
  executablePath,
  ...(dev
    ? { proxy: { server: dev.server }, args: [`--ignore-certificate-errors-spki-list=${dev.spki}`] }
    : { args: ["--no-proxy-server"] }),
});

const shots = [];
try {
  for (const [i, url] of urls.entries()) {
    const screen = phone ? PHONE : DESKTOP;
    const name = names[i] || (urls.length > 1 ? `screen-${i + 1}` : "main");
    const file = path.join(dir, `${name}${phone ? "-phone" : ""}.png`);

    const context = await browser.newContext({
      viewport: { width: screen.width, height: screen.height },
      deviceScaleFactor: SCALE,
      isMobile: screen.mobile,
      hasTouch: screen.mobile,
      locale: "ru-RU",
    });
    const page = await context.newPage();

    let ok = true;
    try {
      const response = await page.goto(url, { waitUntil: "load", timeout: LOAD_TIMEOUT_MS });
      ok = Boolean(response?.ok());
    } catch (error) {
      console.error(`  ${url}: не открылся — ${String(error?.message ?? error).split("\n")[0]}`);
      ok = false;
    }
    await page.waitForTimeout(SETTLE_MS);

    // Появление блоков на прокрутке — наш же приём, и на снимке он даёт
    // пустой экран. Показываем всё, что ждало прокрутки.
    await page
      .evaluate(() => {
        for (const node of document.querySelectorAll(".reveal")) node.classList.add("reveal-visible");
      })
      .catch(() => {});
    await page.waitForTimeout(400);

    // Демонстрационная обвязка убирается, а не обрезается кадром: полоса
    // «выберите вариант» с ценами вариантов — это витрина демо, а не
    // продукт, и на снимке товара она читается как его часть.
    if (hideCss.length || hideText.length) {
      const hidden = await page
        .evaluate(
          ({ css, text }) => {
            const log = [];
            const gone = (el, why) => {
              if (!(el instanceof HTMLElement)) return;
              // Замер до скрытия: у спрятанного элемента размеры нулевые, и
              // журнал показывал «a 0x0» вместо того, что убрали на самом деле.
              const box = el.getBoundingClientRect();
              el.style.setProperty("display", "none", "important");
              log.push(`${why} → ${el.tagName.toLowerCase()} ${Math.round(box.width)}×${Math.round(box.height)}`);
            };

            for (const selector of css) {
              for (const el of document.querySelectorAll(selector)) gone(el, selector);
            }

            const whole = (document.body.innerText || "").trim().length || 1;
            for (const needle of text) {
              // Самый мелкий блок с этим текстом, и он же — сам элемент.
              // Подниматься к ближайшему div нельзя: у значка в углу
              // ближайшим div оказалась обёртка всей страницы, и снимок
              // выходил пустым.
              const hits = [...document.querySelectorAll("body *")]
                .filter((el) => (el.textContent || "").includes(needle))
                .map((el) => ({ el, box: el.getBoundingClientRect() }))
                .filter(({ box }) => box.width > 0 && box.height > 0 && box.height < 160)
                .sort((a, b) => a.box.width * a.box.height - b.box.width * b.box.height);

              // Предохранитель: блок, в котором лежит заметная часть текста
              // страницы, — это не обвязка, и прятать его нельзя.
              const safe = hits.find(
                ({ el }) => ((el.innerText || "").trim().length / whole) < 0.2,
              );
              if (safe) gone(safe.el, needle);
              else log.push(`${needle}: не нашёл ничего безопасного`);
            }
            return log;
          },
          { css: hideCss, text: hideText },
        )
        .catch(() => []);
      for (const line of hidden) console.error(`  убрано — ${line}`);
      await page.waitForTimeout(300);
    }

    const text = await page.evaluate(() => document.body?.innerText?.trim().length ?? 0).catch(() => 0);
    if (!ok || !text) {
      console.error(`  ${url}: пустая страница — снимок не берём`);
      await context.close();
      continue;
    }

    const png = await page.screenshot();
    const { path: written, width, height } = await save(file, png, screen);
    const { size } = await stat(written);
    shots.push({
      src: `/${written.split(path.sep).slice(1).join("/")}`,
      width,
      height,
      phone,
      kb: Math.round(size / 1024),
      url,
    });
    await context.close();
  }
} finally {
  await browser.close();
}

if (!shots.length) {
  console.error("Ни одного снимка — проверьте адреса.");
  process.exit(4);
}

// Готовый блок для content/products.ts: размеры берутся из файла, а не
// проставляются руками, иначе картинка на странице поедет.
console.log("\nshots: [");
for (const s of shots) {
  console.log(
    `  { src: "${s.src}", width: ${s.width}, height: ${s.height},${s.phone ? " phone: true," : ""} caption: { ru: "", en: "", uz: "", zh: "" } },` +
      `  // ${s.kb} КБ · ${s.url}`,
  );
}
console.log("],");
