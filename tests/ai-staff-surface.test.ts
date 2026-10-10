/**
 * ИИ-сотрудники: каналы, кабинет, панель и страница сервиса.
 * docs/ai-staff/design.md.
 */
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { test } from "node:test";

import { firstTime, isMedia, person } from "@/lib/ai-staff/bot";
import { channelsLeft, TOKEN_SHAPE } from "@/lib/ai-staff/channels";
import { leadButtons, leadCard } from "@/lib/ai-staff/notify";
import { overview } from "@/lib/ai-staff/stats";
import type { Conversation, Lead } from "@/lib/ai-staff/store";
import { pickPages, pageText } from "@/lib/ai-staff/import";
import { WIDGET_SCRIPT } from "@/lib/ai-staff/widget-script";
import { LANDING_LOCALES, landing } from "@/content/ai-staff/landing";
import { cab } from "@/content/ai-staff/cabinet";
import { plainTextProblems } from "@/lib/proto/plain-text";

const read = (file: string) => readFileSync(new URL(`../${file}`, import.meta.url), "utf8");

const lead = {
  id: "11111111-1111-1111-1111-111111111111",
  request_no: "AI-1010-ABCD",
  name: "Олим <script>",
  contact: "+998901112233",
  need: "кухня 3 м",
  budget: "",
  urgency: "",
  summary: "Хочет кухню",
  test: false,
  status: "new",
} as unknown as Lead;

test("карточка заявки: экранирует HTML и говорит на языке клиента", () => {
  const conv = { kind: "widget" as const, customer_name: "", customer_handle: null, off_hours: true };
  const ru = leadCard(lead, conv, "ru");
  assert.match(ru, /AI-1010-ABCD/);
  assert.match(ru, /&lt;script&gt;/);
  assert.match(ru, /нерабочее время/);
  assert.match(leadCard(lead, conv, "uz"), /Yangi ariza/);
  assert.equal(leadButtons(lead, "ru")[0][0].callback_data, `ail:take:${lead.id}`);
  assert.match(leadCard(lead, { ...conv, kind: "tg_business" }, "ru"), /замолчит на 12 часов/);
});

test("бот: медиа не отдаём модели, повтор обновления отсекаем", () => {
  assert.equal(isMedia({ message_id: 1, chat: { id: 1, type: "private" }, voice: {} }), true);
  assert.equal(isMedia({ message_id: 1, chat: { id: 1, type: "private" }, text: "Привет" }), false);
  assert.equal(person({ id: 5, first_name: "Ann", last_name: "Lee" }).name, "Ann Lee");
  assert.equal(firstTime("t", 100), true);
  assert.equal(firstTime("t", 100), false);
  assert.equal(firstTime("other", 100), true);
});

test("каналы: форма токена и лимит каналов тарифа «Старт»", () => {
  assert.ok(TOKEN_SHAPE.test("1234567890:AAH" + "x".repeat(32)));
  assert.ok(!TOKEN_SHAPE.test("не токен"));
  const widget = { status: "active", kind: "widget" } as never;
  assert.equal(channelsLeft("start", [widget], "tg_bot") < 0, true, "на «Старте» второй канал не подключить");
  assert.equal(channelsLeft("start", [widget], "widget") >= 0, true, "тот же вид канала — не второй канал");
  assert.equal(channelsLeft("business", [widget], "tg_bot") >= 0, true);
});

test("обзор: диалоги месяца, медиана первого ответа, заявки ночью, без проверок", () => {
  const conv = (id: string, ms: number, off: boolean) =>
    ({ id, counted_month: "2026-10", first_reply_ms: ms, off_hours: off, unanswered: 1 }) as Conversation;
  const convs = [conv("a", 2000, true), conv("b", 4000, false), conv("c", 9000, false)];
  const leads = [
    { conversation_id: "a", test: false, status: "won" },
    { conversation_id: "b", test: false, status: "lost" },
    { conversation_id: "c", test: true, status: "new" },
  ] as Lead[];
  const o = overview(convs, leads, "2026-10");
  assert.equal(o.dialogs, 3);
  assert.equal(o.leads, 2);
  assert.equal(o.firstReplySec, 4);
  assert.equal(o.offHoursLeads, 1);
  assert.equal(o.unanswered, 3);
  assert.equal(o.wonShare, 0.5);
});

test("разбор сайта: берём страницы с ценами и контактами, текст без разметки", () => {
  const picked = pickPages(["https://a.uz/", "https://a.uz/price", "https://a.uz/blog/1", "https://a.uz/kontakty", "https://a.uz/narxlar"]);
  assert.ok(picked.includes("https://a.uz/price") && picked.includes("https://a.uz/narxlar") && !picked.includes("https://a.uz/blog/1"));
  assert.equal(pageText("<p>Кухня&nbsp;от 4 500 000</p><script>x()</script>"), "Кухня от 4 500 000");
});

test("виджет: текст вставляется как текст, без подстановок шаблона", () => {
  assert.ok(!WIDGET_SCRIPT.includes("${"));
  assert.ok(!/innerHTML/.test(WIDGET_SCRIPT), "ответ модели не исполняется как разметка");
  assert.match(WIDGET_SCRIPT, /textContent/);
  assert.doesNotThrow(() => new Function(WIDGET_SCRIPT));
});

test("страница сервиса: без длинных тире и штампов, запрос в заголовке и описании", () => {
  for (const locale of LANDING_LOCALES) {
    const copy = landing[locale];
    const text = JSON.stringify(copy);
    const problems = plainTextProblems({ text: Object.values(copy).flat().map((v) => (typeof v === "string" ? v : JSON.stringify(v))).join("\n") });
    assert.deepEqual(problems, [], `${locale}: ${JSON.stringify(problems)}`);
    assert.ok(!/[—–]/.test(text), `${locale}: длинное тире`);
  }
  assert.match(landing.ru.title, /ИИ-менеджер продаж/);
  assert.match(landing.ru.seoDescription, /ИИ-менеджер продаж/);
  assert.match(landing.ru.lead, /ИИ-менеджер продаж/);
  assert.match(landing.uz.title, /Sun'iy intellekt sotuv menejeri/);
  assert.match(landing.uz.seoDescription, /Sun'iy intellekt sotuv menejeri/);
  assert.equal(landing.ru.plans.length, landing.uz.plans.length);
  assert.equal(landing.ru.faq.length, landing.uz.faq.length);
});

test("кабинет: у каждой строки оба языка, в узбекском нет кириллицы", () => {
  for (const [key, entry] of Object.entries(cab)) {
    assert.ok(entry.ru.trim() && entry.uz.trim(), key);
    assert.ok(!/[а-яё]/i.test(entry.uz), `${key}: кириллица в узбекском`);
  }
});

test("фразы покупателю без длинных тире", () => {
  for (const file of ["lib/ai-staff/copy.ts"]) {
    for (const [, str] of read(file).matchAll(/"([^"\n]{12,})"/g)) assert.ok(!/[—–]/.test(str), `${file}: ${str}`);
  }
});

test("каждая страница кабинета проверяет вход, каждое действие — права", () => {
  const pages: string[] = [];
  const walk = (dir: string) => {
    for (const e of readdirSync(new URL(`../${dir}`, import.meta.url), { withFileTypes: true })) {
      if (e.isDirectory()) walk(`${dir}/${e.name}`);
      else if (e.name === "page.tsx") pages.push(`${dir}/${e.name}`);
    }
  };
  walk("app/cabinet");
  assert.ok(pages.length >= 10);
  for (const page of pages) {
    const src = read(page);
    if (page.endsWith("login/page.tsx")) {
      assert.match(src, /serviceEnabled\(\)/, page);
      continue;
    }
    assert.match(src, /cabinetPage\(|requireCabinet\(\)/, `${page}: без проверки входа`);
  }
  const actions = read("app/cabinet/actions.ts");
  for (const m of actions.matchAll(/export async function (\w+)\([^)]*\)[^{]*\{\n([^\n]*)/g)) {
    assert.match(m[2], /await (requireTenant|requireCabinet|owner)\(\)/, `${m[1]}: первой строкой — проверка входа`);
  }
  const admin = read("app/admin/ai-staff/actions.ts");
  for (const m of admin.matchAll(/export async function (\w+)\([^)]*\)[^{]*\{\n([^\n]*)/g)) {
    assert.match(m[2], /requireAdmin\(\)/, `${m[1]}: только владелец`);
  }
});

test("вебхуки сервиса без своего секрета отвечают 404", async () => {
  process.env.AI_STAFF_WEBHOOK_SECRET = "s".repeat(24);
  const { POST } = await import("@/app/api/ai-staff/tg/[secret]/route");
  const wrong = await POST(new Request("http://x/api/ai-staff/tg/nope", { method: "POST", body: "{}" }), {
    params: Promise.resolve({ secret: "nope" }),
  });
  assert.equal(wrong.status, 404);
  const noHeader = await POST(new Request("http://x", { method: "POST", body: "{}" }), {
    params: Promise.resolve({ secret: "s".repeat(24) }),
  });
  assert.equal(noHeader.status, 404, "секрет в адресе без заголовка Telegram не пускает");
});

test("кабинет и вебхуки живут вне языковых префиксов", () => {
  const mw = read("middleware.ts");
  assert.match(mw, /pathname === "\/cabinet" \|\| pathname\.startsWith\("\/cabinet\/"\)/);
});
