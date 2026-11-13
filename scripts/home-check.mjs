// Проверка главной после смены вида: node scripts/home-check.mjs [адрес]
// На каждом языке и ширине: нет прокрутки вбок, заявка уходит в /api/lead
// (ответ API подменён — заявка в базу не пишется), чат открывается, ролики
// работ и фон первого экрана играют, полоса минуты стоит и закрывается крестиком; при «меньше
// движения» переписка не анимируется и ролики не запускаются сами.
import { chromium } from "playwright-core";

const base = process.argv[2] || "http://localhost:3100";
const LOCALES = ["ru", "en", "uz", "zh", "uk", "pl"];
const WIDTHS = [390, 768, 1440];
const browser = await chromium.launch({ executablePath: process.env.CHROME || "/opt/pw-browsers/chromium" });
const fails = [];
const ok = (cond, what) => {
  if (!cond) fails.push(what);
  return cond;
};

async function run(locale, width, reduced) {
  const tag = `${locale}/${width}${reduced ? "/reduce" : ""}`;
  const ctx = await browser.newContext({
    viewport: { width, height: width < 500 ? 844 : width < 1000 ? 1024 : 900 },
    reducedMotion: reduced ? "reduce" : "no-preference",
  });
  // Минута на скидку идёт: так её полоса видна сразу, без ответа сервера.
  await ctx.addInitScript(() => {
    if (!sessionStorage.getItem("seeded")) {
      const now = Date.now();
      localStorage.setItem("devuz_minute", JSON.stringify({ token: "check-token-0000", from: now, until: now + 600000 }));
      sessionStorage.setItem("seeded", "1");
    }
  });
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  let lead = null;
  await page.route("**/api/lead", async (route) => {
    lead = route.request().postDataJSON();
    await route.fulfill({ status: 200, contentType: "application/json", body: '{"ok":true}' });
  });
  await page.route("**/api/minute**", (route) => route.fulfill({ status: 200, contentType: "application/json", body: "{}" }));
  await page.goto(`${base}/${locale}`, { waitUntil: "networkidle", timeout: 120000 });
  await page.waitForTimeout(800);

  ok(errors.length === 0, `${tag}: ошибки страницы ${errors.join(" | ")}`);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  ok(overflow <= 0, `${tag}: прокрутка вбок на ${overflow}px`);

  // Полоса минуты и крестик.
  const bar = page.locator('.sk[role="status"]');
  if (ok(await bar.isVisible(), `${tag}: нет полосы минуты`)) {
    const shift = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue("--minute-bar"));
    ok(shift.trim() === "40px", `${tag}: шапка не опустилась под полосу (${shift})`);
    await bar.locator("button").last().click();
    await page.waitForTimeout(300);
    ok(!(await bar.isVisible()), `${tag}: крестик не убрал полосу`);
  }

  // Чат.
  const launcher = page.locator("div.sk.bottom-5 > button[aria-expanded]");
  await launcher.click();
  await page.waitForTimeout(400);
  ok((await launcher.getAttribute("aria-expanded")) === "true", `${tag}: чат не открылся`);
  ok(await page.locator("div.sk.bottom-5 textarea").isVisible().catch(() => false), `${tag}: в чате нет поля ввода`);
  await launcher.click();

  // Фон первого экрана — пролёт по офису: играет сам, при «меньше движения» стоит постер.
  const hero = await page.evaluate(() => { const v = document.querySelector("#home-title").closest("section").querySelector("video"); return v ? !v.paused : null; });
  ok(reduced ? hero === false : hero === true, `${tag}: фон первого экрана ${hero ? "играет" : "стоит"}`);

  // Ролики работ.
  await page.locator("#works").scrollIntoViewIfNeeded();
  await page.waitForTimeout(2500);
  const playing = await page.evaluate(() => [...document.querySelectorAll("#works video")].filter((v) => !v.paused && v.readyState > 1).length);
  if (reduced) ok(playing === 0, `${tag}: ролики играют при «меньше движения»`);
  else ok(playing > 0, `${tag}: ни один ролик работ не играет`);

  // Переписка первого экрана.
  const anim = await page.evaluate(() => getComputedStyle(document.querySelector("#home-title").closest("section").querySelector("figure p")).animationName);
  ok(reduced ? anim === "none" : anim !== "none", `${tag}: анимация переписки ${anim}`);

  // Заявка.
  await page.locator("#process").scrollIntoViewIfNeeded();
  const form = page.locator("form[aria-labelledby=proto-form-title]");
  await form.locator('input[name="contact"]').fill("@check_user");
  await form.locator('input[name="site"]').fill("example.uz");
  await form.locator('button[type="submit"]').click();
  await page.waitForTimeout(800);
  ok(lead && lead.contact === "@check_user" && /example\.uz/.test(lead.message) && lead.locale === locale, `${tag}: заявка не ушла в /api/lead`);
  ok(await form.locator('p[role="status"]').isVisible(), `${tag}: нет «заявка принята»`);

  await ctx.close();
  console.log(`${tag}: ok`);
}

for (const locale of LOCALES) for (const width of WIDTHS) await run(locale, width, false);
for (const width of WIDTHS) await run("ru", width, true);
await browser.close();
if (fails.length) {
  console.log(`\nНе прошло ${fails.length}:\n${fails.join("\n")}`);
  process.exit(1);
}
console.log("\nВсё работает.");
