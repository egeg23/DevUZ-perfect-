import { chromium } from "playwright-core";
// Телефон как мини-приложение: на ширине 320, 360, 390 и 430 px ни один экран
// не шире окна; двойной тап, щипок и свайп вбок не приближают и не сдвигают
// страницу. node check-touch.mjs  (сначала node serve.mjs)
const B = `http://localhost:4796/proto/${"A".repeat(43)}`;
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
let bad = 0;
const fail = (...m) => { bad++; console.log("FAIL", ...m); };
const ok = (...m) => console.log("ok  ", ...m);
const VIEWS = ["home", "box:legend", "hub", "rocket", "dice", "upgrade", "pvp", "inv", "top", "tasks", "profile"];
for (const w of [320, 360, 390, 430]) {
  for (const lang of ["", "en"]) {
    const ctx = await b.newContext({ viewport: { width: w, height: 760 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
    const p = await ctx.newPage(); const errs = [];
    p.on("pageerror", (e) => errs.push(String(e)));
    await p.goto(`${B}/${lang}`, { waitUntil: "load" }); await p.waitForTimeout(1300);
    const wide = [];
    for (const v of VIEWS) {
      const [name, arg] = v.split(":");
      await p.evaluate(([n, a]) => window.__gx.go(n, a), [name, arg]); await p.waitForTimeout(450);
      const out = await p.evaluate((W) => {
        const r = [];
        for (const el of document.querySelectorAll("#app *")) {
          const box = el.getBoundingClientRect();
          if (!box.width || getComputedStyle(el).position === "fixed") continue;
          // Внутри ленты и рулетки всё шире экрана нарочно: они обрезаны своим контейнером.
          if (el.closest(".feed-row,.rl-s,.rk-h,.dc-h,.fx,.toast,.sh-wrap")) continue;
          if (box.right > W + 1 || box.left < -1) r.push((el.id ? "#" + el.id : el.className && typeof el.className === "string" ? "." + el.className.split(" ")[0] : el.tagName) + " " + Math.round(box.left) + ".." + Math.round(box.right));
        }
        const v = document.getElementById("view");
        return { r: r.slice(0, 4), sw: document.documentElement.scrollWidth, vs: v.scrollWidth - v.clientWidth };
      }, w);
      if (out.r.length || out.sw > w || out.vs > 0) wide.push(`${v}: ${out.r.join(", ")} sw=${out.sw} view+${out.vs}`);
    }
    if (wide.length) fail(`${w}${lang}`, "шире экрана:", wide.join(" | ")); else ok(`${w}${lang}`, "ни один экран не шире окна");
    // Двойной тап по пустому месту и по карточке, щипок, свайп вбок.
    await p.evaluate(() => window.__gx.go("home")); await p.waitForTimeout(400);
    const cdp = await ctx.newCDPSession(p);
    const tp = async (x, y) => { await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x, y }] }); await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] }); };
    await tp(w / 2, 300); await p.waitForTimeout(60); await tp(w / 2, 300); await p.waitForTimeout(600);
    await cdp.send("Input.synthesizePinchGesture", { x: w / 2, y: 400, scaleFactor: 2.5, relativeSpeed: 600, gestureSourceType: "touch" }).catch(() => {});
    await p.waitForTimeout(500);
    const swipe = async (x0, y0, dx, dy) => { await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: x0, y: y0 }] }); for (let i = 1; i <= 12; i++) { await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: x0 + dx * i / 12, y: y0 + dy * i / 12 }] }); await p.waitForTimeout(16); } await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] }); await p.waitForTimeout(400); };
    await swipe(w - 20, 420, -(w - 60), 0);
    // Щипок двумя пальцами.
    await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: w / 2 - 20, y: 400, id: 1 }, { x: w / 2 + 20, y: 400, id: 2 }] });
    for (let i = 1; i <= 10; i++) await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: w / 2 - 20 - i * 9, y: 400, id: 1 }, { x: w / 2 + 20 + i * 9, y: 400, id: 2 }] });
    await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] }); await p.waitForTimeout(400);
    const st = await p.evaluate(() => ({ scale: visualViewport.scale, ox: visualViewport.offsetLeft, sx: scrollX, vx: document.getElementById("view").scrollLeft, ax: document.getElementById("app").scrollLeft }));
    if (st.scale > 1.01 || st.ox || st.sx || st.vx || st.ax) fail(`${w}${lang}`, "приблизилось или сдвинулось вбок", JSON.stringify(st)); else ok(`${w}${lang}`, "двойной тап, щипок и свайп вбок ничего не сдвигают");
    // Вертикальная прокрутка жива: настоящий свайп пальцем.
    await p.evaluate(() => window.__gx.go("home")); await p.waitForTimeout(400);
    await swipe(w / 2, 560, 0, -320);
    const sy = await p.evaluate(() => document.getElementById("view").scrollTop);
    if (sy < 50) fail(`${w}${lang}`, "вверх-вниз не листается", sy); else ok(`${w}${lang}`, `листается вниз (${Math.round(sy)} px)`);
    // Ползунок Dice по-прежнему тянется пальцем.
    await p.evaluate(() => window.__gx.go("dice")); await p.waitForTimeout(400);
    const r = await (await p.$("#dc-r")).boundingBox();
    await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: r.x + r.width / 2, y: r.y + r.height / 2 }] });
    for (let i = 1; i <= 6; i++) await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: r.x + r.width / 2 + i * 12, y: r.y + r.height / 2 }] });
    await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    await p.waitForTimeout(200);
    const ch = await p.textContent("#dc-c");
    if (ch === "50%") fail(`${w}${lang}`, "ползунок шанса не тянется"); else ok(`${w}${lang}`, `ползунок тянется (${ch})`);
    if (errs.length) fail(`${w}${lang}`, "ошибки", errs.join(" | "));
    await ctx.close();
  }
}
// Панель на телефоне: страница не шире окна, не приближается.
for (const w of [360, 390]) {
  const ctx = await b.newContext({ viewport: { width: w, height: 760 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
  const p = await ctx.newPage();
  await p.goto(`${B}/admin`, { waitUntil: "load" }); await p.waitForTimeout(700);
  const wide = [];
  for (const t of ["overview", "rtp", "users", "promo", "refs"]) {
    await p.evaluate((t) => window.__gxa.show(t), t); await p.waitForTimeout(350);
    const sw = await p.evaluate(() => ({ d: document.documentElement.scrollWidth, m: document.querySelector(".adm-main").scrollWidth - document.querySelector(".adm-main").clientWidth }));
    if (sw.d > w || sw.m > 0) wide.push(`${t} ${JSON.stringify(sw)}`);
  }
  if (wide.length) fail(`admin ${w}`, "шире экрана", wide.join(" | ")); else ok(`admin ${w}`, "страница панели листается только вверх и вниз");
  await ctx.close();
}
await b.close();
console.log(bad ? `\nПровалов: ${bad}` : "\nВсё в порядке");
process.exit(bad ? 1 : 0);
