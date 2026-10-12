import { chromium } from "playwright-core";
import { mkdirSync } from "node:fs";
// Панель оператора в Chromium (телефон и ПК, ru и en): вкладки открываются,
// подсказка на графике, RTP из панели меняет множитель Dice в приложении,
// новый промокод работает в приложении, блокировка закрывает ставки,
// начисление из панели меняет баланс в приложении. node check-admin.mjs <каталог>
const S = process.argv[2] || "/tmp/gx-adm", B = `http://localhost:4796/proto/${"A".repeat(43)}`;
mkdirSync(S, { recursive: true });
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
let bad = 0;
const fail = (...m) => { bad++; console.log("FAIL", ...m); };
const ok = (...m) => console.log("ok  ", ...m);
for (const [name, vp] of [["d", { width: 1440, height: 900 }], ["m", { width: 390, height: 844 }]]) {
  for (const lang of ["", "en"]) {
    const tag = `${name}${lang ? "-en" : ""}`, pre = lang ? `${B}/en` : B;
    const ctx = await b.newContext({ viewport: vp, deviceScaleFactor: name === "m" ? 2 : 1, isMobile: name === "m", hasTouch: name === "m" });
    const p = await ctx.newPage(); const errs = [];
    p.on("pageerror", (e) => errs.push(String(e)));
    p.on("console", (m) => { if (m.type() === "error") errs.push(m.text()); });
    // Сначала приложение: депозит, чтобы он попал в сегодняшний столбец.
    await p.goto(`${pre}/`, { waitUntil: "load" }); await p.waitForTimeout(1200);
    await p.evaluate(() => window.__gx.deposit()); await p.waitForTimeout(400);
    await p.click('#dp-t [data-t="ton"]'); await p.click("#dp-go"); await p.waitForTimeout(500);
    await p.goto(`${pre}/admin`, { waitUntil: "load" }); await p.waitForTimeout(700);
    await p.screenshot({ path: `${S}/${tag}-overview.png` });
    const box = await p.$("#chart"); await box.scrollIntoViewIfNeeded(); await p.waitForTimeout(200); const bb = await box.boundingBox();
    await p.mouse.move(bb.x + bb.width - 20, bb.y + bb.height / 2); await p.waitForTimeout(250);
    const tip = await p.textContent("#tip");
    if (!/Сегодня|Today/.test(tip)) fail(tag, "подсказка графика", tip); else ok(tag, "подсказка на графике:", tip.replace(/\s+/g, " ").slice(0, 70));
    await p.screenshot({ path: `${S}/${tag}-overview-tip.png` });
    const mine = await p.$(".note"); if (!mine) fail(tag, "нет строки про демо-депозиты");
    for (const per of ["7", "90"]) { await p.click(`#per [data-p="${per}"]`); await p.waitForTimeout(300); }
    await p.screenshot({ path: `${S}/${tag}-overview-90.png` });
    // RTP: Dice 90%.
    await p.click('[data-tab="rtp"]'); await p.waitForTimeout(300);
    await p.evaluate(() => { const r = document.querySelector('[data-g="dice"] .rng'); r.value = "90"; r.dispatchEvent(new Event("input")); });
    await p.click("#rt-save"); await p.waitForTimeout(300);
    await p.screenshot({ path: `${S}/${tag}-rtp.png` });
    // Промокод на 5 TON.
    await p.click('[data-tab="promo"]'); await p.waitForTimeout(300);
    await p.fill('#p-new [name="code"]', "TEST5"); await p.selectOption('#p-new [name="type"]', "ton"); await p.fill('#p-new [name="ton"]', "5");
    await p.click("#p-new .btn"); await p.waitForTimeout(400);
    await p.screenshot({ path: `${S}/${tag}-promo.png` });
    // Рефералы: новая ссылка.
    await p.click('[data-tab="refs"]'); await p.waitForTimeout(300);
    await p.fill('#r-new [name="name"]', "Test Partner"); await p.click("#r-new .btn"); await p.waitForTimeout(400);
    if (!(await p.textContent(".tb")).includes("Test Partner")) fail(tag, "ссылка не создана"); else ok(tag, "реферальная ссылка создана");
    await p.screenshot({ path: `${S}/${tag}-refs.png` });
    // Пользователи: поиск, карточка, начислить себе 7 TON.
    await p.click('[data-tab="users"]'); await p.waitForTimeout(300);
    await p.screenshot({ path: `${S}/${tag}-users.png` });
    await p.click('#u-f [data-f="risk"]'); await p.waitForTimeout(200);
    const risk = await p.$$eval("#u-b tr[data-u]", (x) => x.length);
    ok(tag, `фильтр «Риск»: ${risk}`);
    await p.click('#u-f [data-f="all"]');
    await p.click('#u-b tr[data-u="me"]'); await p.waitForTimeout(450);
    const before = await p.evaluate(() => JSON.parse(localStorage.getItem("gx-demo-1")).bal);
    await p.fill("#uc-amt", "7"); await p.click('[data-a="add"]'); await p.waitForTimeout(200);
    const after = await p.evaluate(() => JSON.parse(localStorage.getItem("gx-demo-1")).bal);
    if (Math.abs(after - before - 7) > 0.01) fail(tag, "начисление себе", before, after); else ok(tag, "начисление из панели попало в приложение");
    await p.screenshot({ path: `${S}/${tag}-user.png` });
    await p.click('label.sw:has([data-a="ban"])'); await p.waitForTimeout(200);
    await p.keyboard.press("Escape");
    // Приложение: Dice 90% и промокод и блок.
    await p.goto(`${pre}/`, { waitUntil: "load" }); await p.waitForTimeout(1100);
    await p.evaluate(() => window.__gx.go("dice")); await p.waitForTimeout(400);
    await p.evaluate(() => { const r = document.getElementById("dc-r"); r.value = "20"; r.dispatchEvent(new Event("input")); });
    const x = await p.textContent("#dc-x");
    if (x !== "4.50×") fail(tag, "RTP Dice из панели не применился", x); else ok(tag, "Dice: RTP 90% из панели, 20% даёт 4.50×");
    const b0 = await p.evaluate(() => window.__gx.state().bal);
    await p.click("#dc-go"); await p.waitForTimeout(300);
    const b1 = await p.evaluate(() => window.__gx.state().bal);
    if (b1 !== b0) fail(tag, "блок не закрыл ставки"); else ok(tag, "блокировка из панели закрыла ставки");
    await p.evaluate(() => window.__gx.go("home")); await p.waitForTimeout(400);
    await p.fill("#promo-i", "TEST5"); await p.click("#promo .btn"); await p.waitForTimeout(600);
    const b2 = await p.evaluate(() => window.__gx.state().bal);
    if (Math.abs(b2 - b1 - 5) > 0.01) fail(tag, "промокод из панели", b1, b2); else ok(tag, "промокод TEST5 из панели дал 5 TON");
    const used = await p.evaluate(() => JSON.parse(localStorage.getItem("gx-admin-1")).promos.find((x) => x.code === "TEST5").used);
    if (used !== 1) fail(tag, "счётчик промокода", used);
    await p.evaluate(() => window.__gx.go("profile")); await p.waitForTimeout(400);
    if (!(await p.$('a.adm-link'))) fail(tag, "в профиле нет входа в панель");
    const ov = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    await p.goto(`${pre}/admin`, { waitUntil: "load" }); await p.waitForTimeout(500);
    const ov2 = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    if (ov > 0 || ov2 > 0) fail(tag, "горизонтальная прокрутка", ov, ov2);
    if (errs.length) fail(tag, "ошибки", errs.join(" | ")); else ok(tag, "ошибок нет");
    await ctx.close();
  }
}
await b.close();
console.log(bad ? `\nПровалов: ${bad}` : "\nВсё в порядке");
process.exit(bad ? 1 : 0);
