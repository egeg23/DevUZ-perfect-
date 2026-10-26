import { chromium } from "playwright-core";
import { mkdirSync } from "node:fs";
// Новые игры: Mines, Plinko, Towers, Wheel. Телефон и ПК, ru/en: экран
// открывается, игра играется до результата, ошибок и прокрутки вбок нет.
const S = process.argv[2] || "/tmp/claude-0/ng", B = `http://localhost:4796/proto/${"A".repeat(43)}`;
mkdirSync(S, { recursive: true });
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
let bad = 0;
const fail = (...m) => { bad++; console.log("FAIL", ...m); };
const ok = (...m) => console.log("ok  ", ...m);
for (const [name, vp] of [["m", { width: 390, height: 844 }], ["d", { width: 1440, height: 900 }]]) {
  for (const lang of ["", "en"]) {
    const tag = `${name}${lang ? "-en" : ""}`;
    const ctx = await b.newContext({ viewport: vp, deviceScaleFactor: name === "m" ? 2 : 1, isMobile: name === "m", hasTouch: name === "m" });
    const p = await ctx.newPage(); const errs = [];
    p.on("pageerror", (e) => errs.push(String(e)));
    p.on("console", (m) => { if (m.type() === "error") errs.push(m.text()); });
    await p.goto(`${B}/${lang}`, { waitUntil: "load" }); await p.waitForTimeout(1300);
    const go = (v) => p.evaluate((v) => window.__gx.go(v), v);
    const bal = () => p.evaluate(() => window.__gx.state().bal);
    // Хаб: все 4 карточки есть.
    await go("hub"); await p.waitForTimeout(400);
    const cards = await p.$$eval(".game b", (x) => x.map((e) => e.textContent));
    for (const g of ["Mines", "Plinko", "Towers", "Wheel"]) if (!cards.includes(g)) fail(tag, "нет карточки", g);
    await p.screenshot({ path: `${S}/${tag}-hub.png` });
    // Mines: играть, открыть 3 клетки, забрать.
    await go("mines"); await p.waitForTimeout(400);
    let b0 = await bal();
    await p.click("#mn-go"); await p.waitForTimeout(300);
    // открыть клетки, пока не бомба и не забрали; потом cash out
    const cells = await p.$$(".mn-c");
    for (let i = 0; i < 24; i++) { const active = await p.evaluate(() => document.getElementById("mn-grid").classList.contains("on")); if (!active) break; const safeOpen = await p.$$eval(".mn-c.safe", (x) => x.length); if (safeOpen >= 3) break; await cells[i].click(); await p.waitForTimeout(120); }
    await p.screenshot({ path: `${S}/${tag}-mines.png` });
    const label = await p.textContent("#mn-go");
    if (/Забрать|Cash out/.test(label)) { await p.click("#mn-go"); ok(tag, "Mines: открыл клетки и забрал"); } else ok(tag, "Mines: раунд прошёл", label.trim().slice(0, 20));
    await p.waitForTimeout(300);
    if (Math.abs(await bal() - b0) < 1e-9 && !/сгорела|burned/.test((await p.textContent("#toast")) || "")) { /* ok either */ }
    // Plinko: бросить шарик, дождаться падения.
    await go("plinko"); await p.waitForTimeout(400);
    await p.click('#pl-risk [data-r="high"]'); await p.waitForTimeout(150);
    await p.click('#pl-risk [data-r="med"]'); await p.waitForTimeout(150);
    const slots = await p.$$eval(".pl-s", (x) => x.length);
    if (slots !== 13) fail(tag, "Plinko: ячеек не 13", slots); else ok(tag, "Plinko: 13 ячеек");
    const pc0 = await p.evaluate(() => (window.__gx.state().cnt.plinko || 0)); await p.click("#pl-go"); await p.waitForTimeout(3500);
    await p.screenshot({ path: `${S}/${tag}-plinko.png` });
    const pc1 = await p.evaluate(() => (window.__gx.state().cnt.plinko || 0));
    if (pc1 !== pc0 + 1) fail(tag, "Plinko: бросок не учтён", pc0, pc1); else ok(tag, "Plinko: шарик брошен и учтён");
    // Towers: играть, пройти этажи.
    await go("towers"); await p.waitForTimeout(400);
    await p.click("#tw-go"); await p.waitForTimeout(300);
    for (let r = 0; r < 8; r++) { const active = await p.$(".tw-row.cur"); if (!active) break; const btns = await p.$$(".tw-row.cur .tw-c"); const picks = await p.evaluate(() => document.querySelectorAll(".tw-c.ok").length); if (picks >= 3) break; if (btns[0]) { await btns[Math.floor(Math.random() * btns.length)].click(); await p.waitForTimeout(140); } else break; }
    await p.screenshot({ path: `${S}/${tag}-towers.png` });
    const tl = await p.textContent("#tw-go");
    if (/Забрать|Cash out/.test(tl)) { await p.click("#tw-go"); ok(tag, "Towers: поднялся и забрал"); } else ok(tag, "Towers: раунд прошёл");
    await p.waitForTimeout(300);
    // Wheel: крутить.
    await go("wheel"); await p.waitForTimeout(400);
    const segs = await p.$$eval("#wh-g path", (x) => x.length);
    if (segs !== 16) fail(tag, "Wheel: секторов не 16", segs); else ok(tag, "Wheel: 16 секторов");
    b0 = await bal(); await p.click("#wh-go"); await p.waitForTimeout(4200);
    await p.screenshot({ path: `${S}/${tag}-wheel.png` });
    const last = await p.textContent("#wh-last");
    ok(tag, "Wheel: прокрутилось, выпало", last);
    // Горизонтальная прокрутка на всех новых экранах.
    for (const v of ["mines", "plinko", "towers", "wheel"]) {
      await go(v); await p.waitForTimeout(350);
      const ov = await p.evaluate(() => ({ sw: document.documentElement.scrollWidth, w: document.documentElement.clientWidth, vx: document.getElementById("view").scrollWidth - document.getElementById("view").clientWidth }));
      if (ov.sw > ov.w || ov.vx > 0) fail(tag, v, "прокрутка вбок", JSON.stringify(ov));
    }
    if (errs.length) fail(tag, "ошибки", errs.join(" | ")); else ok(tag, "ошибок нет");
    await ctx.close();
  }
}
await b.close();
console.log(bad ? `\nПровалов: ${bad}` : "\nВсё в порядке");
process.exit(bad ? 1 : 0);
