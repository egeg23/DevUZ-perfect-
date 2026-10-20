import { chromium } from "playwright-core";
import { mkdirSync } from "node:fs";
// Проверка в Chromium на телефоне (390×844) и ПК (1440×900), ru и uz: весь путь
// заявки 1-5 в схемах А, Б, В (клиент пишет с рекламы → «Взять» → готовый
// ответ, фото, голос → ответ клиента и ответ из приложения Instagram → лид в
// CRM и закрытие), вид руководителя, демо-время (+10 мин, +22 ч), поиск,
// подключение, конструктор цены; шапка прячется при прокрутке и возвращается
// через 3 с; нет ошибок скрипта и прокрутки вбок.
// node check.mjs [каталог для снимков]  (сначала node serve.mjs)
const OUT = process.argv[2] || "/tmp/ighub-check", B = `http://localhost:4833/proto/${"A".repeat(43)}`;
mkdirSync(OUT, { recursive: true });
const b = await chromium.launch({
  executablePath: "/opt/pw-browsers/chromium",
  args: ["--ignore-certificate-errors-spki-list=PS48cX347wDVcRynzq+DFqswl2PLNE1sG6uQvxMCOS0="],
  proxy: process.env.HTTPS_PROXY ? { server: process.env.HTTPS_PROXY, bypass: "localhost,127.0.0.1" } : undefined,
});
let bad = 0;
const fail = (...m) => { bad++; console.log("FAIL", ...m); };
const ok = (...m) => console.log("ok  ", ...m);

for (const [name, vp] of [["m", { width: 390, height: 844 }], ["d", { width: 1440, height: 900 }]]) {
  for (const lang of ["", "uz"]) {
    const cl = lang ? "uz" : "ru";
    for (const scheme of ["B", "A", "C"]) {
      const ctx = await b.newContext({ viewport: vp, deviceScaleFactor: 2, isMobile: name === "m", hasTouch: name === "m" });
      const p = await ctx.newPage(); const errs = [];
      p.on("pageerror", (e) => errs.push(String(e)));
      p.on("console", (m) => { if (m.type() === "error") errs.push(m.text()); });
      const tag = `${name}${lang ? "-uz" : ""}-${scheme}`;
      await p.goto(`${B}/${lang}`, { waitUntil: "load" });
      await p.waitForTimeout(600);
      if (await p.locator(".dzi-skip").isVisible().catch(() => false)) await p.locator(".dzi-skip").click();
      await p.waitForTimeout(900);
      const mob = name === "m";
      const shot = async (n) => { if (mob && !/^9-/.test(n)) await p.evaluate(() => scrollTo({ top: document.querySelector(".side-sw").getBoundingClientRect().top + scrollY - 8, behavior: "instant" })); await p.screenshot({ path: `${OUT}/${tag}-${n}.png` }); };
      const side = async (s) => { if (mob) { await p.click(`.side-sw [data-a="${s}"]`); await p.waitForTimeout(250); } };
      const tap = async (s, sel, wait = 500) => { await side(s); await p.locator(`#${s} ${sel}`).first().click(); await p.waitForTimeout(wait); };
      const wide = async (where) => { const w = await p.evaluate(() => [document.documentElement.scrollWidth, innerWidth]); if (w[0] > w[1]) fail(tag, where, "прокрутка вбок", w.join(",")); };
      if (scheme !== "B") { await p.click(`.ctrl [data-act="scheme"][data-a="${scheme}"]`); await p.waitForTimeout(300); }
      await p.locator("#stage").scrollIntoViewIfNeeded();
      if (scheme === "B") await shot("0-start");
      await wide("начало");
      // 1. Клиент пишет с рекламы.
      await tap("ig", '[data-act="cta"]'); await tap("ig", `[data-act="ask"][data-a="${cl}"]`, 1200);
      (await p.locator("#ig .b.me").count()) ? ok(tag, "1 клиент написал с рекламы") : fail(tag, "1 нет сообщения клиента");
      if (scheme === "B") await shot("1-ask");
      // 2. Заявка в Telegram и «Взять».
      await side("tg");
      if (scheme === "B") { await tap("tg", '[data-act="open"][data-a="group"]'); (await p.locator("#tg .adp").count()) ? ok(tag, "2 карточка с превью рекламы") : fail(tag, "2 нет превью рекламы"); await shot("2-card"); await tap("tg", '[data-act="take"]', 1400); }
      if (scheme === "A") { await tap("tg", '[data-act="open"][data-a="forum"]'); await tap("tg", '[data-act="opentopic"]'); await tap("tg", '[data-act="take"]'); }
      if (scheme === "C") { await tap("tg", '[data-act="open"][data-a="lenta"]'); await tap("tg", '[data-act="take"]'); await tap("tg", '[data-act="answer"]'); }
      const took = await p.locator("#tg").innerText();
      took.includes(lang ? "Dilnoza" : "Дилноза") ? ok(tag, "2 заявку взяли") : fail(tag, "2 не видно, кто взял");
      await shot("2-taken");
      // 3. Ответ: готовый, фото, голос.
      await tap("tg", '[data-act="qsheet"]'); if (scheme === "B") await shot("3-quick");
      await tap("tg", `[data-act="qr"][data-a="${cl}"]`, 1300);
      await side("ig");
      (await p.locator("#ig .b.co").count()) ? ok(tag, "3 ответ пришёл в Instagram от компании") : fail(tag, "3 ответ не дошёл до Instagram");
      if (scheme === "C") await tap("tg", '[data-act="answer"]');
      await tap("tg", '[data-act="photo"]', 1100); if (scheme === "C") await tap("tg", '[data-act="answer"]');
      await tap("tg", '[data-act="voice"]', 1100);
      await side("ig");
      (await p.locator("#ig .media").count()) && (await p.locator("#ig .voice").count()) ? ok(tag, "3 фото и голос дошли") : fail(tag, "3 фото или голос не дошли");
      if (scheme === "B") await shot("3-ig");
      // 4. Клиент отвечает, ответ из приложения Instagram.
      await tap("ig", '[data-act="creply"]', 900);
      await p.click('[data-act="igManual"]'); await p.waitForTimeout(1100);
      await side("tg");
      const tgText = await p.locator("#tg").innerText();
      (await p.locator("#tg .via").count()) ? ok(tag, "4 «отправлено из Instagram»") : fail(tag, "4 нет строки «отправлено из Instagram»");
      tgText.includes((await p.evaluate(() => window.HB.creply[window.HB.langs[0]][0]))) ? ok(tag, "4 ответ клиента в той же теме") : fail(tag, "4 ответ клиента не пришёл");
      if (scheme === "B") await shot("4-topic");
      // Демо-время: +10 мин и +22 ч.
      await p.click('[data-act="ff10"]'); await p.waitForTimeout(400);
      await p.click('[data-act="ff22"]'); await p.waitForTimeout(500);
      await side("tg");
      (await p.locator("#tg .win.warn").count()) ? ok(tag, "окно закрывается через 2 часа") : fail(tag, "нет предупреждения об окне");
      if (scheme === "B") await shot("5-warn");
      // 5. Лид в CRM и закрытие.
      await tap("tg", '[data-act="crm"]'); if (scheme === "B") await shot("5-crm");
      await tap("tg", '[data-act="crmpick"]'); await tap("tg", '[data-act="close"]');
      const done = await p.locator("#steps li.ok").count();
      done === 5 ? ok(tag, "путь 1-5 пройден") : fail(tag, "путь пройден не весь", done);
      await shot("6-done"); await wide("конец пути");
      if (scheme === "B") {
        // Руководитель.
        await p.click('.ctrl [data-act="role"][data-a="head"]'); await p.waitForTimeout(500); await side("tg");
        (await p.locator("#tg .hd-k").count()) ? ok(tag, "вид руководителя") : fail(tag, "нет вида руководителя");
        await shot("7-head");
        await tap("tg", '[data-act="open"][data-a="forum"]'); await shot("7-head-forum");
        await p.click('.ctrl [data-act="role"][data-a="mgr"]'); await p.waitForTimeout(300); await side("tg");
        // Поиск по клиентам.
        await p.locator('#tg [data-input="q"]').fill("madina"); await p.waitForTimeout(300);
        (await p.locator('#tg [data-act="opentopic"]').count()) ? ok(tag, "поиск находит клиента") : fail(tag, "поиск не нашёл");
        await shot("8-search");
        // Проигрывание пути целиком.
        await p.click('[data-act="play"]'); await p.waitForTimeout(26000);
        (await p.locator("#steps li.ok").count()) === 5 ? ok(tag, "«Проиграть» проходит путь") : fail(tag, "«Проиграть» не дошёл до конца", await p.locator("#steps li.ok").count());
        // Подключение и стоимость.
        for (let i = 0; i < 4; i++) await p.click(`[data-act="con"][data-a="${i}"]`);
        (await p.locator("#conok").isVisible()) ? ok(tag, "подключение по шагам") : fail(tag, "подключение не дошло до «Готово»");
        await p.locator("#connect").scrollIntoViewIfNeeded(); await p.waitForTimeout(300); await shot("9-connect");
        const t0 = await p.locator("#ptot").innerText();
        await p.locator(".add").first().click(); await p.waitForTimeout(200);
        const t1 = await p.locator("#ptot").innerText();
        t0 !== t1 ? ok(tag, "доп меняет сумму", t0, "→", t1) : fail(tag, "доп не меняет сумму");
        /\d+:\d\d:\d\d/.test(await p.locator("#offt").innerText()) ? ok(tag, "отсчёт акции") : fail(tag, "нет отсчёта акции");
        await p.locator("#price").scrollIntoViewIfNeeded(); await p.waitForTimeout(300); await shot("9-price");
        await p.locator("#schemes").scrollIntoViewIfNeeded(); await p.waitForTimeout(300); await shot("9-schemes");
        // «Показать на телефоне» в блоке схем: схема переключилась и телефоны снова на экране.
        await p.click('.sch [data-act="scheme"][data-a="C"]'); await p.waitForTimeout(1200);
        const seen = await p.evaluate(() => { const r = document.querySelector(innerWidth <= 860 ? ".side-sw" : "#stage").getBoundingClientRect(); return r.top >= -2 && r.top < innerHeight / 2; });
        const onC = await p.locator('.ctrl [data-act="scheme"][data-a="C"].on').count();
        seen && onC ? ok(tag, "«Показать на телефоне» ведёт к телефонам") : fail(tag, "«Показать на телефоне» не видно", seen, onC);
        await p.click('.ctrl [data-act="scheme"][data-a="B"]'); await p.waitForTimeout(300);
        await wide("секции");
        // Шапка: прячется при прокрутке, возвращается через 3 секунды.
        await p.mouse.wheel(0, 400); await p.waitForTimeout(300);
        const hid = await p.locator("#top.hide").count();
        await p.waitForTimeout(3300);
        const back = await p.locator("#top.hide").count();
        hid && !back ? ok(tag, "шапка по правилу трёх секунд") : fail(tag, "шапка не по правилу", hid, back);
      }
      errs.length ? fail(tag, "ошибки:", errs.join(" | ")) : ok(tag, "без ошибок скрипта");
      await ctx.close();
    }
  }
}
await b.close();
console.log(bad ? `\nПровалов: ${bad}` : "\nВсё прошло");
process.exit(bad ? 1 : 0);
