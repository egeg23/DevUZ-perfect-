import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { cabinetCopy } from "@/content/partner-cabinet";
import { deckCopy } from "@/content/partner-decks";
import { getDictionary } from "@/content/dictionaries";
import { locales } from "@/lib/i18n";
import { REF_COOKIE_OPTIONS, REF_TTL_DAYS, formatRef, parseRef } from "@/lib/partners/ref-cookie";
import {
  PARTNER_TIERS,
  SLUG_ALPHABET,
  SLUG_RE,
  TARGETS,
  generateSlug,
  isPayoutModel,
  isBotAgent,
  refFromCookieHeader,
  shortUrl,
  targetUrl,
  visitorSeed,
} from "@/lib/partners/rules";

/**
 * Кабинет партнёра, короткие ссылки и то, что ведёт клиента до договора.
 *
 * Владелец, 28.09: «Сделай новым пунктом меню — зарабатывай с нами… отдельный
 * вход для партнёров, партнёрский кабинет. Авторизация через телеграм…
 * генерация уникальных ссылок через сокращение, чтобы не попасть под спам.
 * Обязательно трекинг ссылок реферальных, чтобы в случае подписания договора
 * он учитывался в расчётах и телеграм-бот ему тоже мог эту инфу выдать».
 */

const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

/* ── Короткие ссылки ────────────────────────────────────────────────────── */

test("slug — семь знаков из алфавита без похожих символов", () => {
  let seed = 0;
  const random = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
  const slugs = new Set(Array.from({ length: 200 }, () => generateSlug(random)));
  for (const slug of slugs) {
    assert.match(slug, SLUG_RE);
    assert.equal(slug.length, 7);
    for (const ch of slug) assert.ok(SLUG_ALPHABET.includes(ch), `символ ${ch} не из алфавита`);
  }
  assert.ok(!/[01ilo]/.test(SLUG_ALPHABET), "в алфавите остались похожие символы");
  assert.ok(slugs.size > 190, "slug повторяются");
});

test("короткая ссылка — на нашем домене и без ?ref=", () => {
  const url = shortUrl("https://devuz.studio/", "k7mf3qp");
  assert.equal(url, "https://devuz.studio/r/k7mf3qp");
  assert.ok(!url.includes("ref="), "в короткой ссылке остался ?ref= — ровно то, что режет антиспам");
});

test("куда ведёт ссылка: страница сайта или бот, чужое — на главную", () => {
  assert.equal(targetUrl("/cases", "ABC123", "Devuz_studio_bot"), "/cases");
  assert.equal(targetUrl("bot", "ABC123", "Devuz_studio_bot"), "https://t.me/Devuz_studio_bot?start=ref_ABC123");
  assert.equal(targetUrl("https://evil.example", "ABC123", "x"), "/", "открытый редирект на чужой сайт");
  assert.equal(targetUrl("//evil.example", "ABC123", "x"), "/");
  assert.ok(!TARGETS.includes("/razbor" as never), "разборы есть не на всех языках — ссылка дала бы 404");
});

test("роботы превью мессенджеров — не переходы", () => {
  for (const ua of [
    "TelegramBot (like TwitterBot)",
    "WhatsApp/2.23.20.0",
    "facebookexternalhit/1.1",
    "Mozilla/5.0 (compatible; Googlebot/2.1)",
    "",
    "curl/8.0",
  ]) {
    assert.equal(isBotAgent(ua), true, ua || "пустой UA");
  }
  assert.equal(
    isBotAgent("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1"),
    false,
  );
});

test("один человек в один день — один переход, завтра — новый", () => {
  const a = visitorSeed("1.2.3.4", "Safari", "2026-09-28");
  assert.equal(a, visitorSeed("1.2.3.4", "Safari", "2026-09-28"));
  assert.notEqual(a, visitorSeed("1.2.3.4", "Safari", "2026-09-29"));
  assert.notEqual(a, visitorSeed("5.6.7.8", "Safari", "2026-09-28"));
});

test("кука партнёра: код и время перехода, 30 дней, потом — как не было", () => {
  // Владелец: «если клиент сделает заказ по ссылке партнёра в течение 30
  // дней — мы учтём этого лида к нему».
  assert.equal(REF_TTL_DAYS, 30);
  const clicked = new Date("2026-09-01T10:00:00Z");
  const value = formatRef("K7PQ2XZ", clicked);
  assert.match(value, /^K7PQ2XZ\.\d+$/);

  const day29 = new Date("2026-09-30T09:00:00Z");
  const day31 = new Date("2026-10-02T10:00:00Z");
  assert.deepEqual(parseRef(value, day29), { code: "K7PQ2XZ", at: Math.floor(clicked.getTime() / 1000) });
  assert.equal(parseRef(value, day31), null, "кука старше 30 дней всё ещё засчитывает партнёра");

  assert.equal(refFromCookieHeader(`a=1; devuz_ref=${value}; b=2`, day29), "K7PQ2XZ");
  assert.equal(refFromCookieHeader(`devuz_ref=${value}`, day31), null);
  assert.equal(refFromCookieHeader("devuz_refx=K7PQ2XZ"), null);
  assert.equal(refFromCookieHeader("devuz_ref=%3Cscript%3E"), null);
  assert.equal(refFromCookieHeader(null), null);
  // Код без времени — принимаем, но без даты.
  assert.deepEqual(parseRef("k7pq2xz"), { code: "K7PQ2XZ", at: null });
  assert.equal(REF_COOKIE_OPTIONS.maxAge, 30 * 24 * 60 * 60);
});

test("кука ставится на любой странице с ?ref= и не перебивает первого партнёра", () => {
  const middleware = read("middleware.ts");
  assert.match(middleware, /return rememberRef\(request, NextResponse\.next\(\{ request: \{ headers \} \}\)\);/);
  assert.match(middleware, /if \(parseRef\(request\.cookies\.get\(REF_COOKIE\)\?\.value\)\) return response;/);
  assert.match(middleware, /response\.cookies\.set\(REF_COOKIE, formatRef\(code\)/);
  // Бот — те же 30 дней и тот же «первый побеждает».
  const store = read("lib/partners/store.ts");
  assert.match(store, /return age <= REF_TTL_DAYS \* 86_400_000 \? String\(data\.code\) : null;/);
  assert.match(store, /if \(await touchFor\(chatId, now\)\) return;/);
  // Время перехода ложится в лид.
  assert.match(store, /partner_ref_at: ctx\.refAt\.toISOString\(\)/);
  assert.match(read("supabase/migrations/0064_partner_cabinet.sql"), /add column if not exists partner_ref_at timestamptz/);
});

/* ── Маршрут короткой ссылки ────────────────────────────────────────────── */

test("короткая ссылка: переход без роботов, кука — первому, мимо языкового редиректа", () => {
  const route = read("app/r/[slug]/route.ts");
  assert.match(route, /if \(!isBotAgent\(ua\)\) \{[\s\S]*recordClick\(/);
  // Первый код побеждает: живая кука уже есть — не перезаписываем.
  assert.match(route, /if \(!parseRef\(request\.cookies\.get\(REF_COOKIE\)\?\.value\)\) \{/);
  assert.match(route, /found\.partner\.status !== "active"/);

  const middleware = read("middleware.ts");
  const passR = middleware.indexOf('if (pathname.startsWith("/r/")) return NextResponse.next();');
  assert.ok(passR > 0, "middleware уводит /r/… на языковой адрес, где маршрута нет");
  assert.ok(passR < middleware.indexOf("const hasLocale"), "проверка /r/ стоит после языкового редиректа");

  const sql = read("supabase/migrations/0064_partner_cabinet.sql");
  assert.match(sql, /create unique index if not exists partner_clicks_visitor_idx\s+on public\.partner_clicks \(link_id, visitor\)/);
  // Во время выкатки старый код вставляет ссылку без slug — она не должна падать.
  assert.match(sql, /alter column slug set default/);
});

/* ── Путь клиента: сайт → бот → лид → договор ───────────────────────────── */

test("код партнёра доезжает до заявки любым путём", () => {
  // Форма и чат: сначала кука (сервер, 30 дней, со временем), потом память браузера.
  for (const file of ["app/api/lead/route.ts", "app/api/chat/route.ts"]) {
    const src = read(file);
    assert.match(src, /const mark = refFromHeader\(request\.headers\.get\("cookie"\)\);/, file);
    assert.match(src, /const ref = mark\?\.code \?\? codeFromQuery\(body\.ref\);/, file);
  }
  // Переход из чата сайта в бота — раньше терял партнёра.
  assert.match(read("app/api/handoff/route.ts"), /ref: refFromCookieHeader\(request\.headers\.get\("cookie"\)\) \?\? codeFromQuery\(body\.ref\)/);
  assert.match(read("lib/qualify/handoff.ts"), /ref: input\.ref,/);
  const webhook = read("app/api/telegram/webhook/route.ts");
  assert.match(webhook, /if \(session\.ref && !\(await touchFor\(chatId\)\)\) await touchChat\(chatId, session\.ref\);/);
  // Переход в бота по ссылке тоже переход — партнёр видит его в кабинете.
  assert.match(webhook, /await countClick\(refCode, "bot"/);
  // «Войти через Telegram» на сайте ведёт в бота с payload cabinet.
  assert.match(webhook, /payload === "cabinet" && identity/);
});

test("подписанный договор — партнёру сообщение, после записи, не вместо неё", () => {
  const store = read("lib/admin/contract-store.ts");
  const at = store.indexOf("export async function attachSignedScan(");
  const body = store.slice(at, store.indexOf("export async function", at + 10));
  const update = body.indexOf('status: "signed"');
  const tell = body.indexOf("tellPartnerContractSigned(current.project_id, current.amount_usd)");
  assert.ok(update > 0 && tell > update, "партнёру пишем до того, как договор записан подписанным");
  assert.match(body, /\.catch\(/, "сбой сообщения отменил бы загрузку скана");

  const attribute = read("lib/partners/attribute.ts");
  assert.match(attribute, /if \(!project\?\.partner_id \|\| project\.partner_void_reason\) return;/);
});

/* ── Вход в кабинет ─────────────────────────────────────────────────────── */

test("вход: одноразовая ссылка, хеши в базе, кука только для сервера", () => {
  const session = read("lib/partners/session.ts");
  assert.match(session, /\.is\("used_at", null\)\s*\.gt\("expires_at"/, "ссылка входа не одноразовая или без срока");
  assert.match(session, /token_hash: hash\(token\)/);
  assert.match(session, /partner && partner\.status === "active" \? partner : null/, "заблокированный партнёр входит");

  const enter = read("app/api/partners/enter/route.ts");
  assert.match(enter, /httpOnly: true/);

  const actions = read("app/[locale]/partners/cabinet/actions.ts");
  for (const name of [
    "createLinkAction",
    "saveRequisitesAction",
    "requestPayoutAction",
    "switchModelAction",
    "requestAgencyAction",
  ]) {
    const at = actions.indexOf(`export async function ${name}(`);
    assert.ok(at > 0, `${name} пропало`);
    assert.match(actions.slice(at, at + 300), /const partner = await currentPartner\(\);\s*if \(!partner\) redirect/, `${name} не проверяет вход`);
  }

  const bot = read("lib/partners/bot.ts");
  assert.match(bot, /if \(first === "\/cabinet" \|\| first === "\/kabinet"\) return "cabinet";/);
  assert.match(read("lib/qualify/menu.ts"), /command: "cabinet"/);
});

/* ── Тексты ─────────────────────────────────────────────────────────────── */

test("кабинет на четырёх языках: те же ключи, ссылка в каждом готовом тексте", () => {
  const ru = cabinetCopy("ru");
  for (const locale of locales) {
    const t = cabinetCopy(locale);
    assert.deepEqual(Object.keys(t).sort(), Object.keys(ru).sort(), `${locale}: ключи разошлись с русским`);
    for (const target of TARGETS) assert.ok(t.targets[target], `${locale}: нет названия для ${target}`);
    assert.equal(t.promo.length, ru.promo.length, `${locale}: готовых текстов меньше`);
    for (const item of t.promo) assert.ok(item.text("https://devuz.studio/r/abcdefg").includes("https://devuz.studio/r/abcdefg"));
    assert.equal(t.how.length, ru.how.length);
  }
});

test("пункт меню «Зарабатывай с нами» и страница — на всех языках", () => {
  for (const locale of locales) {
    const dict = getDictionary(locale);
    assert.ok(dict.nav.partners.length > 3, `${locale}: пункта меню нет`);
    assert.ok(dict.partners.cabinetPoints.length >= 4);
    assert.ok(dict.partners.faq.length >= 3);
    // Ставки на странице — из той же таблицы; в текстах не осталось старых
    // «20 % от чистой прибыли» и «90 дней».
    assert.ok(dict.partners.tierUpTo.includes("{amount}") && dict.partners.tierOver.includes("{amount}"));
    const text = JSON.stringify(dict.partners);
    assert.doesNotMatch(text, /90/, `${locale}: на странице остались 90 дней`);
  }
  assert.match(read("app/[locale]/partners/page.tsx"), /PARTNER_TIERS\.map\(/);
  assert.equal(PARTNER_TIERS.length, 5);
  assert.equal(getDictionary("ru").nav.partners, "Зарабатывай с нами");
  assert.match(read("components/layout/footer.tsx"), /localeHref\(locale, "partners"\)/);
  assert.match(read("app/[locale]/partners/page.tsx"), /\?start=cabinet/);
});

/* ── Две модели дохода ──────────────────────────────────────────────────── */

test("модель меняется раз в неделю — проверка в самом запросе, смена в журнале", () => {
  // Владелец: «выбор модели доступен к смене раз в неделю, мы должны это
  // учитывать». Проверка только в коде пропустила бы две смены подряд из
  // двух вкладок — условие стоит в самом UPDATE.
  const store = read("lib/partners/store.ts");
  const at = store.indexOf("export async function setPayoutModel(");
  const body = store.slice(at, store.indexOf("export async function", at + 10));
  assert.match(body, /if \(!canSwitchModel\(partner\.model_changed_at, now\)\) return \{ ok: false, reason: "too_soon" \};/);
  assert.match(body, /\.or\(`model_changed_at\.is\.null,model_changed_at\.lte\."\$\{cutoff\}"`\)/);
  assert.match(body, /if \(!data\) return \{ ok: false, reason: "too_soon" \};/);
  assert.match(body, /from\("partner_model_changes"\)\.insert\(/);
  assert.equal(isPayoutModel("profit") && isPayoutModel("turnover"), true);
  assert.equal(isPayoutModel("cash"), false);

  const sql = read("supabase/migrations/0065_partner_models_agencies.sql");
  assert.match(sql, /add column if not exists payout_model text not null default 'profit'/, "у старых партнёров сменилась бы модель");
  assert.match(sql, /create table if not exists public\.partner_model_changes/);
});

test("модель закрепляется за клиентом в день заявки и едет в проект", () => {
  // Смена модели не переписывает деньги по уже идущим проектам.
  const store = read("lib/partners/store.ts");
  const at = store.indexOf("export async function attributeLead(");
  assert.match(store.slice(at, store.indexOf("export async function", at + 10)), /partner_model: partner\.payout_model,/);
  const projects = read("lib/admin/projects.ts");
  assert.match(projects, /partnerModel = \(lead\.partner_model as string \| null\) \?\? null;/);
  assert.match(projects, /partner_model: partnerModel,/);
});

/* ── Агентства на субподряде ────────────────────────────────────────────── */

test("заказ агентства — партнёру 12 месяцев с подтверждения, раньше кода и без окна в 30 дней", () => {
  const attribute = read("lib/partners/attribute.ts");
  const agency = attribute.indexOf("await attributeAgencyLead(leadId");
  const noCode = attribute.indexOf("if (!attribution.code) return null;");
  assert.ok(agency > 0 && noCode > agency, "без кода в заявке заказ агентства не проверяется");
  // Заявка без кода тоже доходит до проверки агентства — во всех каналах.
  assert.match(read("lib/qualify/engine.ts"), /await attributeAndNotify\(leadId, options\.attribution \?\? \{ code: null \}, lead\);/);
  assert.doesNotMatch(read("app/api/lead/route.ts"), /if \(ref\)[^\n]*attributeAndNotify/);

  const store = read("lib/partners/store.ts");
  const at = store.indexOf("export async function attributeAgencyLead(");
  const body = store.slice(at, store.indexOf("export async function", at + 10));
  assert.match(body, /\.filter\(\(a\) => agencyCounts\(a, now\)\)/, "засчитывается агентство без подтверждения или после срока");
  assert.match(body, /partner_agency_id: agency\.id,/);
});

test("агентство подтверждает только владелец", () => {
  const actions = read("app/admin/partners/actions.ts");
  const at = actions.indexOf("export async function decideAgencyAction(");
  assert.ok(at > 0);
  assert.match(actions.slice(at, at + 120), /const admin = await requireAdmin\(\);/);
  const sql = read("supabase/migrations/0065_partner_models_agencies.sql");
  assert.match(sql, /status text not null default 'pending'/, "новое агентство сразу засчитывается");
  assert.match(sql, /alter table public\.partner_agencies enable row level security;/);
});

/* ── Презентации ────────────────────────────────────────────────────────── */

test("презентации: четыре языка, те же пункты, ссылка из кабинета с кодом", () => {
  const ru = deckCopy("ru");
  for (const locale of locales) {
    const d = deckCopy(locale);
    for (const part of ["studio", "program"] as const) {
      assert.deepEqual(Object.keys(d[part]).sort(), Object.keys(ru[part]).sort(), `${locale}/${part}: ключи разошлись`);
    }
    assert.equal(d.studio.languages.length, ru.studio.languages.length, `${locale}: языки`);
    assert.equal(d.studio.how.length, ru.studio.how.length, `${locale}: как работаем`);
    assert.equal(d.program.ways.length, ru.program.ways.length, `${locale}: способы`);
    assert.equal(d.program.exampleOrders.length, 3, `${locale}: пример агентства`);
    assert.equal(d.program.cabinet.length, ru.program.cabinet.length, `${locale}: кабинет`);
    assert.equal(d.program.rules.length, ru.program.rules.length, `${locale}: правила`);
    // Выплаты — как в правилах, а не «на глаз».
    assert.ok(d.program.cabinet.some((line) => line.includes("50")), `${locale}: минимум выплаты`);
  }

  for (const deck of ["studio", "program"]) {
    const page = read(`app/[locale]/partners/deck/${deck}/page.tsx`);
    assert.match(page, /noIndex: true/, `${deck}: презентация попадёт в поиск`);
  }
  // Пример в презентации считается по той же таблице, что и деньги.
  assert.match(read("app/[locale]/partners/deck/program/page.tsx"), /tierPercent\(amount, "turnover"\)/);
  assert.match(read("app/[locale]/partners/deck/program/page.tsx"), /PARTNER_TIERS\.map\(/);

  const view = read("components/partners/cabinet-view.tsx");
  assert.match(view, /partners\/deck\/\$\{deck\}\?ref=\$\{partner\.code\}/, "клиент по презентации не засчитается партнёру");
  // Печать: по листу на слайд, кнопка PDF в лист не попадает.
  assert.match(read("components/partners/deck.tsx"), /@page \{ size: A4 landscape; margin: 0; \}/);
  assert.doesNotMatch(read("app/globals.css"), /size: A4 landscape/, "альбомный лист достанется счёту");
  assert.match(read("app/globals.css"), /#deck \.deck-noprint/);
});

test("агентство — любая компания с регулярными заказами, и тендерный субподряд в программе", () => {
  // Владелец: «может быть не только маркетинговое агентство, а любое
  // (IT, маркетинг и т. д.)… укажи, что мы можем работать субподрядчиком
  // на тендерных заказах в сфере IT».
  const ru = deckCopy("ru").program;
  assert.match(ru.ways[2].text, /IT-компания/);
  assert.match(ru.agencyText, /IT-компаниям/);
  assert.match(cabinetCopy("ru").agenciesLead, /IT-компанию.*генподрядчика IT-тендеров/);
  for (const locale of locales) {
    const program = deckCopy(locale).program;
    assert.ok(program.tenderTitle && program.tenderText, `${locale}: нет слайда про тендеры`);
    assert.equal(program.tenderPoints.length, ru.tenderPoints.length, `${locale}: пунктов про тендеры меньше`);
    assert.ok(
      getDictionary(locale).partners.faq.some((item) => /тендер|tender|招标|przetarg/i.test(item.q)),
      `${locale}: в FAQ программы нет вопроса про тендеры`,
    );
  }
  assert.match(read("app/[locale]/partners/deck/program/page.tsx"), /t\.tenderPoints\.map\(/);
});

test("редиректы маршрутов — от адреса сайта, а не от request.url (за nginx это 0.0.0.0:3000)", async () => {
  // 28.09: ссылка входа из бота и короткие ссылки /r/… уводили на
  // https://0.0.0.0:3000/… — Safari: «использование запрещённого сетевого
  // порта». Next за nginx видит свой адрес, а не devuz.studio.
  const { readdirSync, statSync } = await import("node:fs");
  const routes: string[] = [];
  const walk = (dir: string) => {
    for (const name of readdirSync(new URL(`../${dir}`, import.meta.url))) {
      const path = `${dir}/${name}`;
      if (statSync(new URL(`../${path}`, import.meta.url)).isDirectory()) walk(path);
      else if (name === "route.ts") routes.push(path);
    }
  };
  walk("app");
  assert.ok(routes.length > 5, "маршруты не нашлись");
  for (const path of routes) {
    assert.doesNotMatch(read(path), /new URL\([^()]*,\s*request\.url\)/, `${path}: адрес собран от request.url`);
  }
  assert.match(read("app/api/partners/enter/route.ts"), /new URL\(absoluteUrl\(`\$\{locale\}\/partners\/cabinet`\)\)/);
  assert.match(read("app/r/[slug]/route.ts"), /const home = absoluteUrl\(\);/);
});
