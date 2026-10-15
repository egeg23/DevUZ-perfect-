// Снимки блоков для PR и проверки: node shots.mjs <папка> [ru|en]
// ПК 1440×900 и телефон 390×844: первый экран, пролёт (4 кадра), проекты,
// карта, услуги, ТЗ, меню, форма, страница проекта и переход в неё.
import { chromium } from "playwright-core";
const [, , dir = "/tmp/shots", lang = "ru"] = process.argv;
const base = `http://localhost:4812/proto/${"a".repeat(43)}/` + (lang === "en" ? "en/" : "");
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
const bad = [];
for (const [w, h] of [[1440, 900], [390, 844]]) {
  const mob = w < 800;
  const p = await b.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: mob ? 2 : 1, isMobile: mob, hasTouch: mob });
  p.on("pageerror", (e) => bad.push(`${w}: ${e.message}`));
  p.on("console", (m) => m.type() === "error" && !/404/.test(m.text()) && bad.push(`${w}: ${m.text()}`));
  await p.addInitScript(() => { try { sessionStorage.setItem("arh-intro", "1"); } catch (e) {} });
  const snap = async (name) => { await p.screenshot({ path: `${dir}/${lang}-${w}-${name}.png` }); };
  await p.goto(base, { waitUntil: "networkidle" });
  await p.waitForTimeout(1800);
  await snap("hero");
  // Первый экран: кадры сменяют друг друга прокруткой.
  for (const k of [0.4, 0.9]) {
    await p.evaluate((k) => { const f = document.querySelector(".hero"); window.scrollTo(0, f.offsetTop + (f.offsetHeight - innerHeight) * k); }, k);
    await p.waitForTimeout(1600);
    await snap(`hero-${Math.round(k * 100)}`);
  }
  // Заявление: слова проявляются прокруткой.
  await p.evaluate(() => { const f = document.querySelector(".stmt"); window.scrollTo(0, f.offsetTop + (f.offsetHeight - innerHeight) * 0.5); });
  await p.waitForTimeout(1000);
  await snap("stmt");
  // Пролёт: прокрутка в долю секции, ждём, пока кадр догонит.
  for (const k of [0.05, 0.35, 0.62, 0.97]) {
    await p.evaluate((k) => { const f = document.querySelector(".fly"); window.scrollTo(0, f.offsetTop + (f.offsetHeight - innerHeight) * k); }, k);
    await p.waitForTimeout(2600);
    await snap(`fly-${Math.round(k * 100)}`);
  }
  for (const [sel, name, dy] of [[".pj", "projects", 0], [".pj-2", "projects-2", -160], [".velo", "velo", -200], ["#geo .geo-top", "geo-top", -40], ["#geo .geo-map", "geo", -120], ["#uslugi .sec-h", "services", 0], ["#sayt .sec-h", "spec", 0]]) {
    await p.evaluate(([s, dy]) => { const el = document.querySelector(s); window.scrollTo(0, el.getBoundingClientRect().top + scrollY + dy); }, [sel, dy]);
    await p.waitForTimeout(1600);
    await snap(name);
  }
  const ow = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  if (ow > 0) bad.push(`${w}: горизонтальная прокрутка ${ow}px`);
  await p.evaluate(() => window.scrollTo(0, 0));
  await p.waitForTimeout(600);
  await p.click("#burger");
  await p.waitForTimeout(1200);
  if (!mob) { await p.hover(".mn-i[data-i='2']"); await p.waitForTimeout(1000); }
  await snap("menu");
  await p.keyboard.press("Escape");
  await p.waitForTimeout(700);
  await p.click(mob ? ".dock .btn" : ".top-c");
  await p.waitForTimeout(900);
  await snap("form");
  await p.fill("input[name=name]", lang === "en" ? "Anna" : "Анна");
  await p.fill("input[name=contact]", "+998 90 123 45 67");
  await p.click(".pn-form button[type=submit]");
  await p.waitForTimeout(500);
  await snap("form-ok");
  await p.keyboard.press("Escape");
  await p.waitForTimeout(700);
  // Переход: карточка проекта раскрывается на весь экран.
  await p.evaluate(() => { const el = document.querySelector(".pj"); window.scrollTo(0, el.getBoundingClientRect().top + scrollY - 120); });
  await p.waitForTimeout(1400);
  await Promise.all([p.waitForNavigation({ waitUntil: "networkidle" }), p.click(".pj .pj-fig")]);
  await p.waitForTimeout(1500);
  await snap("project");
  await p.evaluate(() => window.scrollTo(0, innerHeight * 1.05));
  await p.waitForTimeout(1200);
  await snap("project-lead");
  await p.evaluate(() => { const el = document.querySelector(".pp-geo"); window.scrollTo(0, el.getBoundingClientRect().top + scrollY - 40); });
  await p.waitForTimeout(1000);
  await snap("project-geo");
  const ow2 = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  if (ow2 > 0) bad.push(`${w}: проект, горизонтальная прокрутка ${ow2}px`);
  await p.close();
}
await b.close();
console.log(bad.length ? bad : "без ошибок и без прокрутки вбок");
