import { chromium } from "playwright-core";
import { mkdirSync } from "node:fs";
// Проверка в Chromium на 390×844, 1440×900 и 1920×1080: заставка играет и
// уходит сама, горизонтальной прокрутки нет, ошибок в консоли нет, сборка
// кухни, примерка, лента работ, расчёт и заявка работают, при
// prefers-reduced-motion заставки нет и всё стоит. Снимки секций.
//   node serve.mjs, затем node check.mjs <каталог для снимков> [ru|uz]
const S = process.argv[2] || "/tmp/vt-check", LANG = process.argv[3] || "ru";
const B = `http://localhost:4821/proto/${"A".repeat(43)}${LANG === "uz" ? "/uz" : ""}/`;
mkdirSync(S, { recursive: true });
const exe = "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";
const b = await chromium.launch({ executablePath: exe });
let bad = 0;
const fail = (...m) => { bad++; console.log("FAIL", ...m); };
const ok = (...m) => console.log("ok  ", ...m);
const VPS = [["390", { width: 390, height: 844 }, true], ["1440", { width: 1440, height: 900 }, false], ["1920", { width: 1920, height: 1080 }, false]];
const only = process.env.ONLY ? process.env.ONLY.split(",") : null;
for (const [name, vp, mobile] of VPS) {
  if (only && !only.includes(name)) continue;
  const ctx = await b.newContext({ viewport: vp, deviceScaleFactor: mobile ? 2 : 1, isMobile: mobile, hasTouch: mobile });
  const errs = [];
  const watch = (p) => { p.on("pageerror", (e) => errs.push(String(e))); p.on("console", (m) => { if (m.type() === "error") errs.push(m.text()); }); };
  // 1. Заставка целиком.
  if (!process.env.NOINTRO) {
    const p = await ctx.newPage(); watch(p);
    await p.goto(B, { waitUntil: "commit" });
    const t0 = Date.now();
    for (const at of [1200, 2600, 3900, 4600, 5600, 6400]) {
      await p.waitForTimeout(Math.max(0, at - (Date.now() - t0)));
      await p.screenshot({ path: `${S}/${LANG}-${name}-intro-${at}.png` });
    }
    await p.waitForTimeout(2500);
    const left = await p.evaluate(() => ({ intro: !!document.getElementById("intro"), hero: document.body.classList.contains("hero-on"), lock: document.documentElement.style.overflow }));
    if (left.intro || !left.hero || left.lock) fail(name, "заставка не ушла сама", JSON.stringify(left)); else ok(name, "заставка проигрывается и уходит сама");
    await p.close();
  }
  // 2. Секции: без заставки (как повторный визит).
  const p = await ctx.newPage(); watch(p);
  await p.addInitScript(() => { try { sessionStorage.setItem("vt-intro", "1"); } catch (e) {} });
  await p.goto(B, { waitUntil: "load" });
  await p.waitForTimeout(1600);
  await p.screenshot({ path: `${S}/${LANG}-${name}-hero.png` });
  const over = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  if (over > 0) fail(name, "горизонтальная прокрутка", over); else ok(name, "без горизонтальной прокрутки");
  const at = async (sel, frac = 0) => p.evaluate(([s, f]) => { const el = document.querySelector(s); const r = el.getBoundingClientRect(); const y = scrollY + r.top + Math.max(0, r.height - innerHeight) * f; window.scrollTo(0, y); return y; }, [sel, frac]);
  const snap = async (file, wait = 900) => { await p.waitForTimeout(wait); await p.screenshot({ path: `${S}/${LANG}-${name}-${file}.png` }); };
  for (const f of [0.05, 0.28, 0.45, 0.6, 0.75, 1]) { await at("#sborka", f); await snap(`sborka-${Math.round(f * 100)}`, 700); }
  await at("#primerka"); await snap("try-0");
  await p.click('.sw[data-g="facade"][data-c="#9fae8c"]'); await p.click('.sw[data-g="top"][data-c="#3b3b3e"]'); await snap("try-olive", 1200);
  await p.click('.sw[data-g="facade"][data-c="wood"]'); await snap("try-oak", 1200);
  const tg = await p.getAttribute(".try-go", "data-tg"); if (!/(дуб|eman)/i.test(tg)) fail(name, "примерка не попала в сообщение", tg); else ok(name, "примерка в сообщении:", tg);
  for (const f of [0, 0.5, 1]) { await at("#raboty", f); await snap(`works-${f * 100}`, 1000); }
  await at("#zakaz"); await snap("order-0");
  await at("#calc"); await p.evaluate(() => window.scrollBy(0, -80));
  await p.click('.lay-i:has(input[value="u"])'); await snap("calc-u", 500);
  const m = await p.textContent("#calc-m"); ok(name, "расчёт, П-образная:", m);
  await p.click('.lay-i:has(input[value="island"])'); await snap("calc-island", 500);
  await at("#doverie"); await snap("trust-0");
  await at(".tr-nums"); await p.evaluate(() => window.scrollBy(0, -200)); await snap("trust-nums", 1600);
  await at("#cena"); await snap("price");
  await at("#zamer"); await snap("zamer");
  // Заявка: без телефона ошибка, с телефоном итог и текст для Telegram.
  await p.click("#zamer .zf-go"); const err = await p.isVisible("#zamer [data-err]"); if (!err) fail(name, "форма приняла пустой телефон"); else ok(name, "без телефона форма просит телефон");
  await p.fill("#zamer input[name=phone]", "+998 90 123 45 67"); await p.fill("#zamer input[name=name]", "Азиз"); await p.click("#zamer .zf-go"); await snap("zamer-sent", 500);
  const sum = await p.textContent("#zamer [data-sum]"); if (!/123 45 67/.test(sum)) fail(name, "итог заявки пуст"); else ok(name, "заявка собрана");
  // Панель справа из шапки или нижней кнопки.
  await p.evaluate(() => window.scrollTo(0, 0)); await p.waitForTimeout(3400);
  await p.click(mobile ? "#dock [data-zamer]" : ".top-cta"); await snap("panel", 700);
  const pn = await p.evaluate(() => document.getElementById("panel").classList.contains("on")); if (!pn) fail(name, "панель заявки не открылась"); else ok(name, "панель заявки открывается");
  await p.keyboard.press("Escape"); await p.waitForTimeout(600);
  await p.click("#menu-btn"); await snap("menu", 700); await p.keyboard.press("Escape"); await p.waitForTimeout(500);
  // Шапка прячется при прокрутке и возвращается через 3 секунды.
  await p.evaluate(() => window.scrollBy(0, 400)); await p.waitForTimeout(400);
  const hid = await p.evaluate(() => document.getElementById("top").classList.contains("hide"));
  await p.waitForTimeout(3200);
  const back = await p.evaluate(() => !document.getElementById("top").classList.contains("hide"));
  if (hid && back) ok(name, "шапка прячется и возвращается через 3 с"); else fail(name, "шапка", hid, back);
  const over2 = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  if (over2 > 0) fail(name, "горизонтальная прокрутка после прокрутки", over2);
  if (errs.length) fail(name, "ошибки:", errs.join(" ; ")); else ok(name, "ошибок в консоли нет");
  await ctx.close();
  // 3. Без движения.
  const rc = await b.newContext({ viewport: vp, reducedMotion: "reduce", deviceScaleFactor: 1, isMobile: mobile, hasTouch: mobile });
  const rp = await rc.newPage(); const rerr = []; rp.on("pageerror", (e) => rerr.push(String(e)));
  await rp.goto(B, { waitUntil: "load" }); await rp.waitForTimeout(800);
  const r = await rp.evaluate(() => ({ intro: !!document.getElementById("intro"), over: document.documentElement.scrollWidth - innerWidth, asm: document.getElementById("sborka").offsetHeight / innerHeight }));
  if (r.intro || r.over > 0 || r.asm > 3) fail(name, "без движения", JSON.stringify(r)); else ok(name, "без движения: заставки нет, сцены стоят", JSON.stringify(r));
  await rp.screenshot({ path: `${S}/${LANG}-${name}-reduced.png` });
  await rp.evaluate(() => document.getElementById("sborka").scrollIntoView()); await rp.waitForTimeout(400);
  await rp.screenshot({ path: `${S}/${LANG}-${name}-reduced-sborka.png` });
  if (rerr.length) fail(name, "ошибки без движения:", rerr.join(" ; "));
  await rc.close();
}
await b.close();
console.log(bad ? `\nПроблем: ${bad}` : "\nВсё в порядке");
process.exit(bad ? 1 : 0);
