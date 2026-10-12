import { chromium } from "playwright-core";
import { mkdirSync } from "node:fs";
// Проверка в Chromium на телефоне (390×844) и ПК (1440×900), ru и uz: каждый
// экран открывается кликом, тест по теме и экзамен проходят до разбора,
// «Угадай знак» доигрывается, запись на вождение появляется в расписании,
// тёмная тема включается; нет ошибок скрипта и горизонтальной прокрутки.
// node check.mjs <каталог для снимков>  (сначала node serve.mjs)
const OUT = process.argv[2] || "/tmp/it-check", B = `http://localhost:4797/proto/${"A".repeat(43)}`;
mkdirSync(OUT, { recursive: true });
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
let bad = 0;
const fail = (...m) => { bad++; console.log("FAIL", ...m); };
const ok = (...m) => console.log("ok  ", ...m);
for (const [name, vp] of [["m", { width: 390, height: 844 }], ["d", { width: 1440, height: 900 }]]) {
  for (const lang of ["", "uz"]) {
    const ctx = await b.newContext({ viewport: vp, deviceScaleFactor: 2, isMobile: name === "m", hasTouch: name === "m" });
    const p = await ctx.newPage(); const errs = [];
    p.on("pageerror", (e) => errs.push(String(e)));
    p.on("console", (m) => { if (m.type() === "error") errs.push(m.text()); });
    const tag = `${name}${lang ? "-uz" : ""}`;
    await p.goto(`${B}/${lang}`, { waitUntil: "load" });
    await p.waitForTimeout(1800);
    const shot = (n) => p.screenshot({ path: `${OUT}/${tag}-${n}.png` });
    const top = () => p.locator(".v").last();
    const click = async (sel, wait = 450) => { await top().locator(sel).first().click(); await p.waitForTimeout(wait); };
    const wide = async (where) => { const w = await p.evaluate(() => [document.documentElement.scrollWidth, innerWidth, ...[...document.querySelectorAll(".v")].map((v) => v.scrollWidth - v.clientWidth)]); if (w[0] > w[1] || w.slice(2).some((x) => x > 1)) fail(tag, where, "горизонтальная прокрутка", w.join(",")); };
    await shot("home"); await wide("home");
    // Главная → прогноз, знаки, штрафы, помощник.
    for (const v of ["forecast", "fines", "group", "exercises", "attendance", "saved"]) { await click(`[data-go="${v}"]`); await shot(v); await wide(v); await top().locator("[data-back]").first().click(); await p.waitForTimeout(400); }
    await click('[data-go="helper"]'); await click('[data-act="ask"]', 300); await click('[data-act="ask"] >> nth=3', 3500); await shot("helper"); await p.locator(".v").last().locator("[data-back]").click(); await p.waitForTimeout(400);
    // Знаки: группа, карточка, игра.
    await click('[data-go="signs"]'); await click('[data-act="sgroup"][data-a="ban"]'); await shot("signs"); await click('[data-go="sign"]'); await shot("sign"); await top().locator("[data-back]").first().click(); await p.waitForTimeout(400);
    await click('[data-go="guess"]');
    for (let i = 0; i < 10; i++) { await click('[data-act="gpick"]', 250); if (i === 0) await shot("guess"); await click('[data-act="gnext"]', 300); }
    const guessDone = await top().locator('[data-act="greplay"]').count(); guessDone ? ok(tag, "угадай знак доигран") : fail(tag, "угадай знак не закончился");
    await shot("guess-end");
    // Уроки: предмет → тема → тест по теме.
    await p.click('#tabs [data-tab="lessons"]'); await p.waitForTimeout(400); await shot("lessons");
    await top().locator('input[data-input="lsearch"]').fill(lang ? "chorraha" : "перекр"); await p.waitForTimeout(200);
    (await top().locator("#lres .li").count()) ? ok(tag, "поиск по темам") : fail(tag, "поиск ничего не нашёл");
    await top().locator('input[data-input="lsearch"]').fill(""); await p.waitForTimeout(200);
    await click('[data-go="subject"]'); await shot("subject"); await click('[data-go="topic"] >> nth=2'); await shot("topic"); await wide("topic");
    await click('[data-act="topicTest"]');
    for (let i = 0; i < 5; i++) {
      if (!(await top().locator('[data-act="pick"]').count())) break;
      await click('[data-act="pick"]', 150); await click('[data-act="check"]', 300);
      if (i === 0) { await click('[data-act="simple"]', 2500); await shot("quiz-expl"); }
      await click('[data-act="next"]', 300);
    }
    (await top().locator(".res-head").count()) ? ok(tag, "тест по теме → результат") : fail(tag, "тест по теме не дошёл до результата");
    await shot("topic-result");
    // Экзамен: 20 вопросов, таймер, разбор.
    await p.click('#tabs [data-tab="tests"]'); await p.waitForTimeout(400); await shot("tests");
    await click('[data-act="exam"]'); await shot("exam");
    const timer = await top().locator("#qtimer").count(); timer ? ok(tag, "таймер экзамена") : fail(tag, "нет таймера");
    for (let i = 0; i < 20; i++) { await click('[data-act="pick"] >> nth=1', 80); await click('[data-act="next"]', 120); }
    await p.waitForTimeout(500);
    const res = await top().locator(".rev").count(); res === 20 ? ok(tag, "экзамен: разбор 20 ответов") : fail(tag, "экзамен: в разборе", res);
    await shot("exam-result"); await click('.rev'); await shot("exam-rev"); await top().locator("[data-back]").first().click(); await p.waitForTimeout(400);
    // Расписание и запись.
    await p.click('#tabs [data-tab="schedule"]'); await p.waitForTimeout(400); await shot("schedule"); await wide("schedule");
    await click('[data-go="book"]'); await click('[data-act="bday"] >> nth=2'); await click('.slot:not([disabled])'); await shot("book"); await click('[data-act="bconfirm"]', 1400);
    const booked = await p.evaluate(() => JSON.parse(localStorage.getItem("it-demo-1")).booked.length); booked ? ok(tag, "запись на вождение сохранена") : fail(tag, "запись не сохранилась");
    await shot("booked");
    // Профиль и тёмная тема.
    await p.click('#tabs [data-tab="profile"]'); await p.waitForTimeout(400); await click('[data-act="theme"]'); await shot("profile-dark");
    const dark = await p.evaluate(() => document.getElementById("screen").getAttribute("data-theme")); dark === "dark" ? ok(tag, "тёмная тема") : fail(tag, "тема не переключилась");
    await p.click('#tabs [data-tab="home"]'); await p.waitForTimeout(600); await shot("home-dark"); await click('[data-act="theme"]').catch(() => {});
    if (name === "d") { const box = await p.locator(".iphone").boundingBox(); box && box.height > 780 ? ok(tag, "айфон крупно", Math.round(box.height)) : fail(tag, "айфон мелкий", box && box.height); }
    // Кадры в секунду при прокрутке главной.
    const fps = await p.evaluate(() => new Promise((r) => { const v = [...document.querySelectorAll(".v")].pop(); let n = 0; const t0 = performance.now(); (function f() { n++; v.scrollTop += 6; if (performance.now() - t0 < 1000) requestAnimationFrame(f); else r(n); })(); }));
    fps > 40 ? ok(tag, "кадров в секунду", fps) : fail(tag, "кадров мало", fps);
    errs.length ? fail(tag, "ошибки:", errs.join(" | ")) : ok(tag, "без ошибок скрипта");
    await ctx.close();
  }
}
await b.close();
console.log(bad ? `\nПровалов: ${bad}` : "\nВсё прошло");
process.exit(bad ? 1 : 0);
