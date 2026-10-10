import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { adLocale, isAdClick, matchLocale } from "@/lib/i18n";
import { GOALS, goalOf } from "@/lib/visit/goal";

/**
 * Цели сайта в Метрике. Владелец, 06.10.2026: «Людей приходит нормально на
 * сайт, но заявок нет почти… посмотреть… почему они уходят». Без целей
 * Метрика не знает, кто дошёл до чата и заявки, — и воронку не посчитать.
 */

const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");

test("клик по телефону, Telegram, WhatsApp и размеченной кнопке — цель", () => {
  assert.equal(goalOf("tel:+998909120578"), "contact_tel");
  assert.equal(goalOf("https://t.me/devuz_studio"), "contact_tg");
  assert.equal(goalOf("tg://resolve?domain=devuz"), "contact_tg");
  assert.equal(goalOf("https://wa.me/998909120578"), "contact_wa");
  assert.equal(goalOf("/ru/contact", "cta_contact"), "cta_contact", "data-goal главнее адреса");
  assert.equal(goalOf("/ru/contact", "что-то-чужое"), null, "незнакомая разметка — не цель");
  assert.equal(goalOf("/ru/cases"), null);
  assert.equal(goalOf(null), null);
});

test("цели стоят там, где человек делает шаг к заявке", () => {
  assert.match(read("components/chat/chat-widget.tsx"), /goal\("chat_open"\)/);
  const panel = read("components/chat/chat-panel.tsx");
  assert.match(panel, /if \(firstTurn\) goal\("chat_message"\)/, "первое сообщение, а не каждое");
  assert.match(panel, /goal\("chat_qualified"\)/);
  const form = read("components/chat/lead-form.tsx");
  assert.ok(form.indexOf('goal("lead_form")') > form.indexOf("if (!response.ok)"), "форма — только после успешной отправки");
  const hero = read("components/hero/compile-scene.tsx");
  assert.match(hero, /data-goal="cta_contact"/);
  assert.match(hero, /data-goal="cta_cases"/);
  // «Рассчитать проект» ведёт в калькулятор (снимок 07–08.10.2026: ни одного
  // нажатия, форма заявки на телефоне — 6 с на визит, калькулятор — 275 с).
  assert.match(hero, /href=\{localeHref\(locale, "calculator"\)\}\s+data-goal="cta_contact"/);
  // На телефоне текст героя стоит под шапкой, а не по центру экрана, и
  // плашка минуты без пояснения: иначе она закрывала кнопки первого экрана.
  assert.match(hero, /justify-start pt-\[6\.25rem\] md:justify-center/);
  assert.match(read("components/chat/minute-offer.tsx"), /hidden text-\[0\.78rem\] leading-snug text-muted sm:block">\{dict\.chat\.minuteText\}/);
  assert.match(read("components/layout/metrika-hits.tsx"), /document\.addEventListener\("click", onClick, true\)/);
  for (const name of Object.keys(GOALS)) assert.match(name, /^[a-z_]+$/, `${name}: идентификатор цели — латиницей`);
});

test("снимок Метрики — раз в сутки из свипа, токен остаётся на сервере", () => {
  const snap = read("lib/analytics/ux-snapshot.ts");
  assert.match(snap, /appSecret\("YANDEX_METRIKA_TOKEN"\)/);
  assert.match(snap, /ym:s:paramsLevel1=='goal'/, "воронка — по параметру goal из lib/visit/goal.ts");
  assert.match(snap, /FRESH_MS = 20 \* 3600_000/);
  assert.match(read("app/api/reminders/sweep/route.ts"), /refreshUxSnapshot\(new Date\(\)\)/);
});

test("снимок разбирает рекламу по кампаниям и страницам входа", () => {
  const snap = read("lib/analytics/ux-snapshot.ts");
  assert.match(snap, /ym:s:lastAdvEngine,ym:s:lastUTMSource,ym:s:lastUTMCampaign,ym:s:startURLPath/);
  assert.match(snap, /ym:s:lastTrafficSource=='ad'/);
  // Ошибка разбивки рекламы не роняет весь снимок.
  assert.match(snap, /limit: "40",\n  \}\)\.catch\(/);
});

test("снимок разбирает Директ по площадкам: поиск или сети, какой сайт", () => {
  const snap = read("lib/analytics/ux-snapshot.ts");
  assert.match(snap, /ym:s:lastDirectPlatformType,ym:s:lastDirectPlatform/);
  assert.match(snap, /directPlaces: rows\(directPlaces, 2\)/);
});

/**
 * 153 визита с Директа за 28 дней попали на английскую версию — телефон
 * стоял на английском, — и 92% ушли через 4 секунды.
 */
test("клик по рекламе ведёт на русский или узбекский, а не на язык телефона", () => {
  const ad = (q: string) => isAdClick(new URLSearchParams(q));
  assert.ok(ad("yclid=123"));
  assert.ok(ad("gclid=abc"));
  assert.ok(ad("wbraid=abc"));
  assert.ok(ad("utm_source=yandex&utm_medium=cpc"));
  assert.ok(!ad("ysclid=abc"), "ysclid ставит и обычный поиск Яндекса");
  assert.ok(!ad("utm_medium=organic"));
  assert.ok(!ad(""));

  assert.equal(adLocale("en-US,en;q=0.9"), "ru");
  assert.equal(adLocale("en-US,uz;q=0.8,ru;q=0.5"), "uz");
  assert.equal(adLocale("en-US,ru;q=0.8,uz;q=0.5"), "ru");
  assert.equal(adLocale("uz-Cyrl-UZ"), "ru");
  assert.equal(adLocale("zh-CN"), "ru");
  assert.equal(adLocale(null), "ru");
  // Без рекламы язык по-прежнему — по телефону.
  assert.equal(matchLocale("en-US,en;q=0.9"), "en");

  const mw = read("middleware.ts");
  assert.match(mw, /isAdClick\(request\.nextUrl\.searchParams\)\s*\?\s*adLocale\(accept\)/, "middleware не спрашивает про рекламу");
  // Выбор человека (кука) главнее рекламы.
  assert.ok(mw.indexOf("isLocale(saved)") < mw.indexOf("isAdClick("));
});
