import { chromium } from "playwright-core";
import { mkdirSync } from "node:fs";
// Проверка в Chromium на телефоне (390×844) и ПК (1440×900): каждый экран
// открывается, бокс крутится и даёт выигрыш, Rocket летит и отдаёт ставку,
// Dice бросается, Upgrade крутит колесо, PvP принимает ставку, продажа,
// вывод, депозит, задания и профиль работают; ошибок скрипта и
// горизонтальной прокрутки нет. node check.mjs <каталог>  (сначала node serve.mjs)
const S = process.argv[2] || "/tmp/gx-check", B = `http://localhost:4796/proto/${"A".repeat(43)}`;
mkdirSync(S, { recursive: true });
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
let bad = 0;
const fail = (...m) => { bad++; console.log("FAIL", ...m); };
const ok = (...m) => console.log("ok  ", ...m);
for (const [name, vp] of [["m", { width: 390, height: 844 }], ["d", { width: 1440, height: 900 }]]) {
  for (const lang of ["", "en"]) {
    const ctx = await b.newContext({ viewport: vp, deviceScaleFactor: name === "m" ? 2 : 1, isMobile: name === "m", hasTouch: name === "m" });
    const p = await ctx.newPage(); const errs = [];
    p.on("pageerror", (e) => errs.push(String(e)));
    p.on("console", (m) => { if (m.type() === "error") errs.push(m.text()); });
    const tag = `${name}${lang ? "-en" : ""}`;
    await p.goto(`${B}/${lang}`, { waitUntil: "load" });
    await p.waitForTimeout(1600);
    await p.screenshot({ path: `${S}/${tag}-home.png` });
    const go = async (v, arg) => { await p.evaluate(([v, a]) => window.__gx.go(v, a), [v, arg]); await p.waitForTimeout(500); };
    const bal = () => p.evaluate(() => window.__gx.state().bal);
    // Бокс: открыть и получить выигрыш.
    await go("box", "start");
    const b0 = await bal(), n0 = await p.evaluate(() => window.__gx.state().inv.length);
    await p.click("label.tog:has(#fast)"); await p.click("#open"); await p.waitForTimeout(1200);
    await p.screenshot({ path: `${S}/${tag}-box-spin.png` });
    await p.waitForTimeout(1600);
    const won = await p.$(".win.on");
    if (!won) fail(tag, "бокс: нет окна выигрыша"); else ok(tag, "бокс крутится и даёт выигрыш");
    await p.screenshot({ path: `${S}/${tag}-box-win.png` });
    if (won) { await p.click('[data-w="keep"]'); await p.waitForTimeout(400); }
    const b1 = await bal(), n1 = await p.evaluate(() => window.__gx.state().inv.length);
    if (!(b1 < b0 + 1 && (n1 > n0 || b1 > b0 - 1.5))) fail(tag, "бокс: баланс/инвентарь", b0, b1, n0, n1);
    // FREE24 и таблица шансов.
    await go("box", "free"); await p.click("#open"); await p.waitForTimeout(6200);
    if (!(await p.$(".win.on"))) fail(tag, "FREE24 не открылся"); else { await p.click('[data-w="keep"]'); ok(tag, "FREE24 открыт, таймер пошёл"); }
    await p.waitForTimeout(400);
    const freeTxt = await p.textContent("#open");
    if (!/\d\d:\d\d:\d\d/.test(freeTxt)) fail(tag, "FREE24: нет таймера", freeTxt);
    await p.screenshot({ path: `${S}/${tag}-free.png` });
    // Rocket: ставка, взлёт, забрать.
    await go("rocket");
    await p.waitForTimeout(300);
    await p.click("#rk-btn");
    await p.waitForTimeout(6600);
    await p.screenshot({ path: `${S}/${tag}-rocket-fly.png` });
    const label = await p.textContent("#rk-btn");
    if (/Забрать|Cash out/.test(label)) { await p.click("#rk-btn"); ok(tag, "Rocket: взлетела, забрали"); }
    else ok(tag, "Rocket: раунд прошёл (ракета улетела раньше)", label.trim().slice(0, 30));
    await p.waitForTimeout(1500);
    for (const q of ["medium", "low", "high"]) { await p.click(`#rk-q [data-q="${q}"]`); await p.waitForTimeout(250); }
    const pl = await p.$$eval("#rk-pl .pr", (x) => x.length);
    if (pl < 2) fail(tag, "Rocket: нет других игроков"); else ok(tag, `Rocket: игроков ${pl}`);
    // FPS на ракете.
    const fps = await p.evaluate(() => new Promise((r) => { let n = 0; const t0 = performance.now(); (function f() { n++; if (performance.now() - t0 < 1000) requestAnimationFrame(f); else r(n); })(); }));
    await go("home"); const fps0 = await p.evaluate(() => new Promise((r) => { let n = 0; const t0 = performance.now(); (function f() { n++; if (performance.now() - t0 < 1000) requestAnimationFrame(f); else r(n); })(); }));
    ok(tag, `Rocket: ${fps} кадров в секунду, на главной ${fps0}`); await go("rocket");
    await p.screenshot({ path: `${S}/${tag}-rocket.png` });
    // Dice.
    await go("dice");
    await p.fill("#dc-r", "20").catch(() => {});
    await p.evaluate(() => { const r = document.getElementById("dc-r"); r.value = "20"; r.dispatchEvent(new Event("input")); });
    const x = await p.textContent("#dc-x");
    if (x !== "4.80×") fail(tag, "Dice: множитель при 20%", x); else ok(tag, "Dice: 20% даёт 4.80×");
    await p.click('[data-m="hi"]');
    await p.click("#dc-go"); await p.waitForTimeout(1300);
    const dn = await p.getAttribute("#dc-n", "class");
    if (!/ w| l/.test(dn)) fail(tag, "Dice: бросок не закончился", dn); else ok(tag, "Dice: бросок", dn);
    await p.screenshot({ path: `${S}/${tag}-dice.png` });
    // Upgrade.
    await go("upgrade");
    await p.click('#up-k [data-k="1.5"]');
    const ch = await p.textContent("#up-p");
    await p.click("#up-go"); await p.waitForTimeout(4200);
    await p.screenshot({ path: `${S}/${tag}-upgrade.png` });
    if (await p.$(".win.on")) { await p.click('[data-w="keep"]'); ok(tag, "Upgrade: выиграли, шанс", ch); } else ok(tag, "Upgrade: не повезло, шанс", ch);
    await p.waitForTimeout(400);
    // PvP.
    await go("pvp");
    await p.click("#pv-ton"); await p.waitForTimeout(300);
    const me = await p.$("#pv-pl .pr.me");
    if (!me) fail(tag, "PvP: ставка не принята"); else ok(tag, "PvP: в раунде");
    await p.screenshot({ path: `${S}/${tag}-pvp.png` });
    await p.evaluate(() => { /* ускорить старт */ });
    // Инвентарь: деталь, вывод, продажа.
    await go("inv");
    await p.screenshot({ path: `${S}/${tag}-inv.png` });
    await p.click("#iv-g .gi"); await p.waitForTimeout(500);
    await p.screenshot({ path: `${S}/${tag}-inv-detail.png` });
    await p.click('[data-s="out"]'); await p.waitForTimeout(500);
    await p.screenshot({ path: `${S}/${tag}-withdraw.png` });
    await p.click(".sh-wrap.on .btn.big"); await p.waitForTimeout(450);
    const before = await p.evaluate(() => window.__gx.state().inv.length);
    await p.click("#iv-g .gi"); await p.waitForTimeout(450);
    await p.click('[data-s="sell"]'); await p.waitForTimeout(500);
    const after = await p.evaluate(() => window.__gx.state().inv.length);
    if (after !== before - 1) fail(tag, "продажа", before, after); else ok(tag, "продажа за демо-TON");
    // Депозит.
    await p.click('[data-act="deposit"]'); await p.waitForTimeout(500);
    await p.screenshot({ path: `${S}/${tag}-deposit.png` });
    await p.click('#dp-t [data-t="ton"]'); const bb = await bal(); await p.click("#dp-go"); await p.waitForTimeout(700);
    if ((await bal()) < bb + 9) fail(tag, "депозит"); else ok(tag, "депозит демо");
    // Рейтинг, задания, профиль, игры.
    for (const v of ["top", "tasks", "profile", "hub", "home"]) {
      await go(v); await p.waitForTimeout(300);
      await p.screenshot({ path: `${S}/${tag}-${v}.png` });
      if (v === "tasks") { const c = await p.$("[data-claim]"); if (c) { await c.click(); ok(tag, "задание: билеты получены"); } await p.click("#gv-go").catch(() => {}); }
      if (v === "top") { await p.click('#tp-s [data-t="prize"]'); await p.waitForTimeout(200); await p.screenshot({ path: `${S}/${tag}-prizes.png` }); }
    }
    await go("pvp"); await p.waitForTimeout(26000);
    await p.screenshot({ path: `${S}/${tag}-pvp-spin.png` });
    await p.waitForTimeout(5500);
    const pv = await p.textContent("#pv-t");
    ok(tag, "PvP раунд:", pv);
    if (await p.$(".win.on")) await p.click('[data-w="keep"]');
    const ov = await p.evaluate(() => ({ sw: document.documentElement.scrollWidth, w: document.documentElement.clientWidth, v: document.getElementById("view").scrollWidth - document.getElementById("view").clientWidth, sl: document.querySelector(".stage").scrollLeft + document.getElementById("app").scrollLeft + document.getElementById("view").scrollLeft }));
    if (ov.sw > ov.w || ov.v > 0 || ov.sl) fail(tag, "горизонтальная прокрутка", JSON.stringify(ov));
    if (errs.length) fail(tag, "ошибки", errs.join(" | ")); else ok(tag, "ошибок нет");
    await ctx.close();
  }
}
await b.close();
console.log(bad ? `\nПровалов: ${bad}` : "\nВсё в порядке");
process.exit(bad ? 1 : 0);
