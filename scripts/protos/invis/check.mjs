// Проверка в Chromium: node serve.mjs, затем node check.mjs
// Страница 390, 768, 1440 (ru, uz) и кабинеты: без ошибок и горизонтальной
// прокрутки; бронь места доходит до кабинета и пульта; колесо раз в сутки,
// останавливается на выпавшем секторе, шансы 65/25/10 на 200 000 розыгрышей.
import { chromium } from "playwright-core";
const B = `http://localhost:4811/proto/${"a".repeat(43)}`;
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
let bad = 0;
const fail = (m) => { bad++; console.log("✗", m); };
async function page(w, h) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, isMobile: w < 800, hasTouch: w < 800 });
  const p = await ctx.newPage();
  p.errs = [];
  p.on("pageerror", (e) => p.errs.push(e.message));
  p.on("console", (m) => m.type() === "error" && !/Failed to load resource/.test(m.text()) && p.errs.push(m.text()));
  await p.addInitScript(() => { try { sessionStorage.setItem("iv-intro", "1"); } catch (e) {} });
  return p;
}
for (const path of ["", "uz", "kabinet", "uz/kabinet", "admin", "uz/admin"]) {
  for (const [w, h] of [[390, 844], [768, 1024], [1440, 900]]) {
    const p = await page(w, h);
    await p.goto(`${B}/${path}`, { waitUntil: "networkidle" });
    for (let y = 0; y < 14000; y += 700) { await p.evaluate((y) => scrollTo(0, y), y); await p.waitForTimeout(40); }
    const ox = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    if (ox > 0) fail(`/${path} ${w}: горизонтальная прокрутка ${ox}px`);
    if (p.errs.length) fail(`/${path} ${w}: ${p.errs.join("; ")}`);
    await p.context().close();
  }
  console.log("✓", `/${path || "(ru)"}`);
}
// Шапка: при прокрутке прячется, возвращается через 3 с после полной остановки.
for (const [w, h] of [[390, 844], [1440, 900]]) {
  const p = await page(w, h);
  await p.goto(`${B}/`, { waitUntil: "networkidle" });
  const hidden = () => p.evaluate(() => document.getElementById("top").classList.contains("hide"));
  if (await hidden()) fail(`шапка ${w}: скрыта до прокрутки`);
  for (let i = 1; i <= 10; i++) { await p.evaluate((y) => scrollTo(0, y), i * 300); await p.waitForTimeout(250); if (!(await hidden())) fail(`шапка ${w}: видна во время прокрутки`); }
  await p.waitForTimeout(1500);
  if (!(await hidden())) fail(`шапка ${w}: вернулась раньше 3 секунд`);
  await p.waitForTimeout(1800);
  if (await hidden()) fail(`шапка ${w}: не вернулась через 3 секунды после остановки`);
  await p.evaluate(() => scrollTo(0, 0)); await p.waitForTimeout(100);
  if (!(await hidden())) fail(`шапка ${w}: видна при прокрутке вверх`);
  await p.context().close();
}
console.log("✓ шапка: прячется при прокрутке, возвращается через 3 с после остановки");
// Бронь со страницы видна в кабинете и пульте.
{
  const p = await page(1440, 900);
  await p.goto(`${B}/`, { waitUntil: "networkidle" });
  await p.click("#hall .seat.f");
  await p.click("#hall .hl-go");
  const ok = await p.textContent("#hall .hl-okh");
  if (!/Место ваше/.test(ok)) fail("бронь: нет подтверждения");
  await p.goto(`${B}/kabinet#book`, { waitUntil: "networkidle" });
  if (!(await p.$("#cb-mine li"))) fail("бронь не дошла до кабинета игрока");
  await p.goto(`${B}/admin#bookings`, { waitUntil: "networkidle" });
  if (!(await p.$("tr.fresh"))) fail("бронь не дошла до пульта");
  // Колесо: раз в сутки, стрелка на выпавшем секторе.
  for (let i = 0; i < 6; i++) {
    await p.goto(`${B}/#koleso`, { waitUntil: "networkidle" });
    await p.evaluate(() => { const s = IV.state(); s.spins = []; IV.save(); });
    await p.goto(`${B}/#koleso`, { waitUntil: "networkidle" });
    await p.click("#wheel .wh-go");
    await p.waitForTimeout(5600);
    const r = await p.evaluate(() => {
      const st = IV.state().spins[0];
      const m = getComputedStyle(document.querySelector("#wheel .wh-rot")).transform.match(/matrix\(([^,]+),\s*([^,]+)/);
      const deg = ((Math.atan2(+m[2], +m[1]) * 180) / Math.PI + 360) % 360;
      const at = (360 - deg) % 360; // какой угол колеса под стрелкой
      let acc = 0, id = null;
      for (const s of IV.data.wheel.sectors) { if (at >= acc && at < acc + s.deg) id = s.id; acc += s.deg; }
      return { got: st && st.id, under: id, again: document.querySelector("#wheel .wh-go").disabled };
    });
    if (r.got !== r.under) fail(`колесо: выпало ${r.got}, под стрелкой ${r.under}`);
    if (!r.again) fail("колесо: можно крутить второй раз за сутки");
  }
  const odds = await p.evaluate(() => { const n = 200000, c = { none: 0, h1: 0, h2: 0 }; for (let i = 0; i < n; i++) c[IV.pick().id]++; return Object.fromEntries(Object.entries(c).map(([k, v]) => [k, (v / n) * 100])); });
  for (const [k, want] of [["none", 65], ["h1", 25], ["h2", 10]]) if (Math.abs(odds[k] - want) > 0.6) fail(`шансы ${k}: ${odds[k].toFixed(2)}% вместо ${want}%`);
  console.log("✓ бронь → кабинет → пульт; колесо", Object.entries(odds).map(([k, v]) => `${k} ${v.toFixed(2)}%`).join(", "));
  await p.context().close();
}
await b.close();
console.log(bad ? `Ошибок: ${bad}` : "Всё в порядке");
process.exit(bad ? 1 : 0);
