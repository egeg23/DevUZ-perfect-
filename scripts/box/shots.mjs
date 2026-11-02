#!/usr/bin/env node
/**
 * Снимки и ролики DevUz Box для владельца: хиро на главной и промо-страница,
 * 1440 и 390, плюс запись прокрутки сборки и разреза.
 *
 *   npm run build && (npm start &) && node scripts/box/shots.mjs http://localhost:3000
 *
 * Кладёт в docs/screens/box/. Ролики пишет Playwright (webm), затем ffmpeg
 * переводит в mp4, если он есть.
 */
import { existsSync, mkdirSync, readdirSync, renameSync, rmSync } from "node:fs";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { chromium } from "playwright-core";

const base = process.argv[2] || "http://localhost:3000";
const out = path.resolve("docs/screens/box");
mkdirSync(out, { recursive: true });

async function chromiumPath() {
  if (process.env.CHROMIUM_PATH) return process.env.CHROMIUM_PATH;
  const root = process.env.PLAYWRIGHT_BROWSERS_PATH || "/opt/pw-browsers";
  if (existsSync(path.join(root, "chromium"))) return path.join(root, "chromium");
  if (!existsSync(root)) return undefined;
  for (const dir of readdirSync(root).filter((d) => d.startsWith("chromium-")).sort().reverse()) {
    const candidate = path.join(root, dir, "chrome-linux", "chrome");
    if (existsSync(candidate)) return candidate;
  }
  return undefined;
}

const SCREENS = {
  desktop: { width: 1440, height: 900, mobile: false },
  phone: { width: 390, height: 844, mobile: true, scale: 3 },
};

const browser = await chromium.launch({ executablePath: await chromiumPath(), args: ["--no-sandbox"] });

async function settle(page, ms = 900) {
  await page.waitForTimeout(ms);
}

/** Докрутить до секции так, чтобы её прогресс был `t` (0..1). */
async function scrollScene(page, selector, t) {
  await page.evaluate(
    ({ selector, t }) => {
      const el = document.querySelector(selector);
      if (!el) return;
      const top = el.getBoundingClientRect().top + window.scrollY;
      const travel = el.offsetHeight - window.innerHeight;
      window.scrollTo(0, top + travel * t);
    },
    { selector, t },
  );
  await settle(page, 700);
}

for (const [name, screen] of Object.entries(SCREENS)) {
  const context = await browser.newContext({
    viewport: { width: screen.width, height: screen.height },
    deviceScaleFactor: screen.scale ?? 2,
    isMobile: screen.mobile,
    hasTouch: screen.mobile,
    locale: "ru-RU",
  });
  const page = await context.newPage();

  // Главная: хиро коробки в трёх положениях прокрутки.
  await page.goto(`${base}/ru`, { waitUntil: "networkidle" });
  for (const [label, t] of [["start", 0.02], ["mid", 0.45], ["end", 1]]) {
    await scrollScene(page, "#box", t);
    await page.screenshot({ path: path.join(out, `home-hero-${label}-${screen.width}.jpg`, type: "jpeg", quality: 82) });
  }

  // Промо-страница: первый экран, разрез, модели, роадмап, лист ожидания, вся страница.
  await page.goto(`${base}/ru/box`, { waitUntil: "networkidle" });
  await settle(page);
  await page.screenshot({ path: path.join(out, `promo-top-${screen.width}.jpg`, type: "jpeg", quality: 82) });
  await scrollScene(page, "#cutaway", 1);
  await page.screenshot({ path: path.join(out, `promo-cutaway-${screen.width}.jpg`, type: "jpeg", quality: 82) });
  for (const id of ["how", "models", "roadmap", "waitlist"]) {
    await page.evaluate((id) => document.getElementById(id)?.scrollIntoView({ block: "start" }), id);
    await settle(page);
    await page.screenshot({ path: path.join(out, `promo-${id}-${screen.width}.jpg`, type: "jpeg", quality: 82) });
  }
  await page.evaluate(async () => {
    // Показать все блоки перед полным снимком: Reveal ждёт прокрутки.
    for (let y = 0; y < document.body.scrollHeight; y += 500) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 60));
    }
    window.scrollTo(0, 0);
  });
  await settle(page, 1200);
  // Вся страница: JPEG, PNG на 18 МБ в репозитории не нужен.
  await page.screenshot({ path: path.join(out, `promo-full-${screen.width}.jpg`), fullPage: true, type: "jpeg", quality: 80 });
  await context.close();
}

/** Ролик прокрутки: сцена идёт от 0 до 1 за `seconds`. */
async function film(url, selector, name, seconds = 6) {
  const dir = path.join(out, `.video-${name}`);
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    deviceScaleFactor: 1,
    locale: "ru-RU",
    recordVideo: { dir, size: { width: 1280, height: 800 } },
  });
  const page = await context.newPage();
  await page.goto(url, { waitUntil: "networkidle" });
  await scrollScene(page, selector, 0);
  await page.waitForTimeout(600);
  const steps = seconds * 30;
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    await page.evaluate(
      ({ selector, t }) => {
        const el = document.querySelector(selector);
        if (!el) return;
        const top = el.getBoundingClientRect().top + window.scrollY;
        window.scrollTo(0, top + (el.offsetHeight - window.innerHeight) * t);
      },
      { selector, t: eased },
    );
    await page.waitForTimeout(1000 / 30);
  }
  await page.waitForTimeout(2500);
  const video = page.video();
  await context.close();
  const webm = await video.path();
  const target = path.join(out, `${name}.webm`);
  renameSync(webm, target);
  rmSync(dir, { recursive: true, force: true });
  try {
    execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-i", target, "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "24", "-movflags", "+faststart", path.join(out, `${name}.mp4`)]);
    rmSync(target);
    console.log(`${name}.mp4`);
  } catch {
    console.log(`${name}.webm (ffmpeg не нашёлся)`);
  }
}

await film(`${base}/ru`, "#box", "home-hero-scroll", 7);
await film(`${base}/ru/box`, "#cutaway", "promo-cutaway-scroll", 7);

await browser.close();
console.log(`готово: ${out}`);
