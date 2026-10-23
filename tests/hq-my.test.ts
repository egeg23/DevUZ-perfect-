import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { MyHqView } from "@/components/admin/hq-my";
import { PanelLocaleProvider } from "@/components/admin/panel-locale";
import {
  contactsOf,
  hotOf,
  mineReply,
  mockupLines,
  mockupOwnerId,
  overdueOf,
  targetUrl,
  workOf,
  type MyInput,
  type MyLead,
  type MyMockup,
  type MyProspect,
} from "@/lib/admin/hq-my";
import type { MyHq } from "@/lib/admin/hq-my-store";
import { PANEL_LOCALES } from "@/lib/admin/i18n";

/**
 * «Главная» менеджера — пульс его дня. Владелец, 16.10.2026: «Менеджерам
 * тоже теперь админку как у нас, страница „главная“ с пульсом их работы.
 * Добавь туда с кем связаться, кому отправили макет и когда с возможностью
 * быстро поменять статус (выиграл / проиграл / ждем)… подсвечивай анимацией
 * горящие задачи и просрочки».
 */

const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");

// 16.10.2026 15:00 по Ташкенту (четверг).
const NOW = new Date("2026-10-16T10:00:00Z");
const ago = (h: number) => new Date(NOW.getTime() - h * 3600_000).toISOString();
const ahead = (h: number) => new Date(NOW.getTime() + h * 3600_000).toISOString();
const ME = "me";
const id = () => crypto.randomUUID();

const lead = (over: Partial<MyLead> = {}): MyLead => ({
  id: id(),
  label: "Ромашка",
  ownerId: ME,
  movedAt: ago(24),
  snoozedUntil: null,
  askedAt: null,
  firstAskedAt: null,
  waitStreak: 0,
  contactKind: "telegram",
  ...over,
});

const mockup = (over: Partial<MyMockup> = {}): MyMockup => ({
  id: id(),
  ref: `p:${id()}`,
  client: "Кафе",
  name: "Макет кафе",
  sentAt: ago(30),
  expiresAt: ahead(18),
  status: "active",
  leadId: null,
  prospectId: null,
  lastOpenedAt: null,
  opens: 0,
  openUntil: null,
  closedAt: ago(6),
  ...over,
});

const input = (over: Partial<MyInput> = {}): MyInput => ({
  me: ME,
  now: NOW,
  leads: [],
  offers: [],
  replies: [],
  tasks: [],
  mockups: [],
  ...over,
});

test("раздел и доступ: менеджеру — свой пульс, без денег и чужого", () => {
  const page = read("app/admin/hq/page.tsx");
  assert.match(page, /const staff = await requireSection\("\/admin\/hq"\)/, "страница начинается с requireSection");
  assert.match(page, /if \(!seesEveryone\(staff\.role\)\) \{\s*const \[my, plan\] = await Promise\.all\(\[loadMyHq\(staff, now\)/, "менеджеру — loadMyHq, а не командный центр");
  const store = read("lib/admin/hq-my-store.ts");
  // Каждый запрос по своему — фильтр по этому человеку прямо в запросе.
  assert.match(store, /from\("leads"\)\s*\.select\("id, status, contact_kind"\)\s*\.eq\("assigned_staff_id", me\)/);
  assert.match(store, /loadIdle\(\[me\]\)/);
  assert.match(store, /from\("lead_offers"\)\.select\("lead_id, expires_at"\)\.eq\("staff_id", me\)/);
  assert.match(store, /from\("staff_tasks"\)[^;]*\.eq\("assignee_id", me\)/);
  assert.match(store, /from\("prospects"\)[^;]*\.eq\("touched_by", me\)/);
  assert.match(store, /from\("touch_portions"\)[^;]*\.eq\("staff_id", me\)/);
  assert.match(store, /\.eq\("actor_staff_id", me\)/);
  assert.match(store, /if \(owner !== me\) continue;/, "макет — только свой");
  assert.doesNotMatch(store, /project_payments|pendingContracts|amount_usd/, "денег студии менеджер не видит");
  assert.match(store, /\.limit\(/, "с лимитами");
});

test("переписка: чья — по хозяину лида, без лида — кто ведёт касание", () => {
  assert.ok(mineReply({ hasLead: true, leadOwner: ME }, ME));
  assert.ok(!mineReply({ hasLead: true, leadOwner: "other", touched_by: ME }, ME), "лид у другого — разговор его, хоть касание и моё");
  assert.ok(!mineReply({ hasLead: true, leadOwner: null, touched_by: ME }, ME), "чужой лид, которого нет в моих, — не мой");
  assert.ok(mineReply({ hasLead: false, leadOwner: null, touched_by: ME }, ME));
  assert.ok(mineReply({ hasLead: false, leadOwner: null, handled_by: ME, touched_by: "other" }, ME), "забрал у модели — его");
  assert.ok(!mineReply({ hasLead: false, leadOwner: null, handled_by: "other", touched_by: ME }, ME));
});

test("макет: ответственный тем же порядком, что в «Макетах»; уволенный пропускается", () => {
  const active = new Set([ME, "head"]);
  assert.equal(mockupOwnerId({ set: "head", lead: ME, touch: ME, made: ME }, active), "head", "назначенный руками — главнее");
  assert.equal(mockupOwnerId({ set: null, lead: ME, touch: "head", made: null }, active), ME);
  assert.equal(mockupOwnerId({ set: "gone", lead: null, touch: ME, made: null }, active), ME, "ушедший — следующему");
  assert.equal(mockupOwnerId({ set: null, lead: null, touch: null, made: null }, active), null);
});

test("горит: порядок по срочности, только живое", () => {
  const taken = lead({ label: "Ответил" });
  const hot = hotOf(
    input({
      leads: [taken],
      offers: [
        { leadId: "o2", label: "Позже", expiresAt: new Date(NOW.getTime() + 20 * 60_000).toISOString() },
        { leadId: "o1", label: "Раньше", expiresAt: new Date(NOW.getTime() + 5 * 60_000).toISOString() },
        { leadId: "o0", label: "Сгорело", expiresAt: ago(0.1) },
      ],
      replies: [{ prospectId: "p1", leadId: taken.id, label: "Ответил", since: ago(2), target: null }],
      tasks: [
        { id: "t1", title: "Позвонить", body: "", status: "new", due_at: ahead(2) },
        { id: "t2", title: "Завтра", body: "", status: "new", due_at: ahead(24) },
        { id: "t3", title: "Сделано", body: "", status: "done", due_at: ahead(1) },
      ],
      mockups: [
        mockup({ client: "Смотрит", lastOpenedAt: ago(0.2) }),
        mockup({ client: "Давно смотрел", lastOpenedAt: ago(5) }),
        mockup({ client: "Акция сегодня", expiresAt: ahead(4) }),
        mockup({ client: "Акция завтра", expiresAt: ahead(20) }),
        mockup({ client: "Кончилась", expiresAt: ago(1), status: "expired" }),
      ],
    }),
  );
  assert.deepEqual(
    hot.map((h) => `${h.kind}:${h.label}`),
    ["offer:Раньше", "offer:Позже", "reply:Ответил", "opened:Смотрит", "promo:Акция сегодня", "taskToday:Позвонить"],
  );
  assert.equal(hot[0].red, true, "до конца предложения 5 минут — красное");
  assert.equal(hot[1].red, false);
  assert.equal(hot[2].red, true, "клиент ждёт два часа");
  const reply = hot.find((h) => h.kind === "reply");
  assert.deepEqual(reply && "status" in reply ? reply.status : null, { leadId: taken.id, canWait: true }, "у лида «в работе» — кнопки статуса");
  assert.equal(hot[0].href, "/admin/leads/o1");
});

test("просрочено: задачи, день следующего шага, без движения 7+; без повторов", () => {
  const step = lead({ label: "Шаг настал", snoozedUntil: ago(5), movedAt: ago(24 * 4) });
  const stepped = lead({ label: "Шаг сделан", snoozedUntil: ago(5), movedAt: ago(1) });
  const stale = lead({ label: "Висит", movedAt: ago(24 * 9), waitStreak: 3 });
  const snoozed = lead({ label: "Отложен", movedAt: ago(24 * 9), snoozedUntil: ahead(48) });
  const fresh = lead({ label: "Свежий", movedAt: ago(24 * 2) });
  const covered = lead({ label: "С задачей", movedAt: ago(24 * 10) });
  const late = overdueOf(
    input({
      leads: [step, stepped, stale, snoozed, fresh, covered],
      tasks: [
        { id: "t1", title: "Связаться: С задачей", body: `… https://devuz.studio/admin/leads/${covered.id}`, status: "new", due_at: ago(3) },
        { id: "t2", title: "Старая", body: "", status: "in_work", due_at: ago(30) },
        { id: "t3", title: "Будущая", body: "", status: "new", due_at: ahead(3) },
      ],
    }),
  );
  assert.deepEqual(
    late.map((x) => `${x.kind}:${x.label}`),
    ["task:Старая", "task:Связаться: С задачей", "nextStep:Шаг настал", "stale:Висит"],
  );
  const staleRow = late.find((x) => x.kind === "stale");
  assert.equal(staleRow?.status?.canWait, false, "откладывали трижды — без «⏳»");
  const taskRow = late.find((x) => x.kind === "task" && x.label.startsWith("Связаться"));
  assert.equal(taskRow?.status?.leadId, covered.id, "у задачи «Связаться» — статус её лида");
});

test("с кем связаться: задачи «Связаться», шаг сегодня, ответившие; один клиент — одна строка", () => {
  const today = lead({ label: "Шаг сегодня", snoozedUntil: ahead(3) });
  const withTask = lead({ label: "По задаче" });
  const prospects: MyProspect[] = [
    { id: "p2", status: "sent", touched_by: ME, touched_at: ago(30), sent_at: ago(30), autopilot_at: null, replied_at: ago(1), label: "shop.uz", target: "@shop_uz", lead_id: null },
    { id: "p3", status: "sent", touched_by: ME, touched_at: ago(50), sent_at: ago(50), autopilot_at: null, replied_at: ago(40), label: "old.uz", target: "@old_uz", lead_id: null },
    { id: "p1", status: "sent", touched_by: ME, touched_at: ago(30), sent_at: ago(30), autopilot_at: null, replied_at: ago(1), label: "dup", target: null, lead_id: null },
  ];
  const rows = contactsOf({
    ...input({
      leads: [today, withTask],
      tasks: [
        { id: "t1", title: "Связаться: По задаче", body: `https://devuz.studio/admin/leads/${withTask.id}`, status: "new", due_at: ahead(1) },
        { id: "t2", title: "Связаться: Завтра", body: "", status: "new", due_at: ahead(30) },
        { id: "t3", title: "Отчёт", body: "", status: "new", due_at: ahead(1) },
      ],
      replies: [{ prospectId: "p1", leadId: null, label: "Ждёт", since: ago(0.5), target: "+998 90 123-45-67" }],
    }),
    prospects,
  });
  assert.deepEqual(
    rows.map((r) => `${r.why}:${r.label}`),
    ["reply:Ждёт", "reply:shop.uz", "task:По задаче", "nextStep:Шаг сегодня"],
  );
  assert.equal(rows[0].directUrl, "tel:+998901234567", "без лида — по адресу касания, в одно нажатие");
  assert.equal(rows[1].directUrl, "https://t.me/shop_uz");
  assert.equal(rows[2].channel, "telegram", "у лида — канал без контакта: контакт откроется с журналом");
  assert.equal(rows[2].directUrl, null);
});

test("цель касания — в ссылку: @ник, t.me, телефон; прочее — нет", () => {
  assert.equal(targetUrl("@ivan_shop"), "https://t.me/ivan_shop");
  assert.equal(targetUrl("https://t.me/ivan_shop"), "https://t.me/ivan_shop");
  assert.equal(targetUrl("+998 (90) 123 45 67"), "tel:+998901234567");
  assert.equal(targetUrl("ivan@mail.uz"), null);
  assert.equal(targetUrl(""), null);
});

test("мои макеты: живые акции первыми, ближе к концу — выше; открыл за час — «смотрит»", () => {
  const lines = mockupLines({
    now: NOW,
    leads: [],
    mockups: [
      mockup({ client: "Старая", status: "expired", expiresAt: ago(10), sentAt: ago(58) }),
      mockup({ client: "Свежая", status: "expired", expiresAt: ago(2), sentAt: ago(50) }),
      mockup({ client: "Долго", expiresAt: ahead(40) }),
      mockup({ client: "Скоро", expiresAt: ahead(3), lastOpenedAt: ago(0.5) }),
    ],
  });
  assert.deepEqual(
    lines.map((m) => m.client),
    ["Скоро", "Долго", "Свежая", "Старая"],
  );
  assert.equal(lines[0].openedNow, true);
  assert.equal(lines[1].openedNow, false);
});

test("моя работа: порция, касания и ответы, тёплые взяты и сгорели, макеты, выиграли — 7 дней против 7", () => {
  const w = workOf({
    me: ME,
    now: NOW,
    portion: [
      { replaces: null, outcome: "sent", source: null },
      { replaces: null, outcome: null, source: null },
      { replaces: null, outcome: null, source: "stream" },
    ],
    prospects: [
      { id: "a", status: "sent", touched_by: ME, touched_at: ago(1), sent_at: ago(1), autopilot_at: null, replied_at: ago(0.5), label: "a", target: null, lead_id: null },
      { id: "b", status: "sent", touched_by: ME, touched_at: ago(24 * 9), sent_at: null, autopilot_at: null, replied_at: null, label: "b", target: null, lead_id: null },
      { id: "c", status: "failed", touched_by: ME, touched_at: ago(2), sent_at: null, autopilot_at: null, replied_at: null, label: "c", target: null, lead_id: null },
    ],
    offersClosed: [
      { outcome: "taken", closed_at: ago(5) },
      { outcome: "expired", closed_at: ago(1) },
      { outcome: "expired", closed_at: ago(24 * 8) },
    ],
    mockups: [{ sentAt: ago(10) }],
    wins: [{ created_at: ago(3) }],
    inWork: 7,
  });
  assert.equal(w.portionTarget, 2, "поток в порцию не идёт");
  assert.equal(w.portionDone, 1);
  assert.equal(w.touchesToday, 1, "неудавшееся касание — не касание");
  assert.deepEqual(w.touches7, { now: 1, prev: 1 });
  assert.equal(w.repliesToday, 1);
  assert.deepEqual(w.warmTaken7, { now: 1, prev: 0 });
  assert.deepEqual(w.warmBurned7, { now: 1, prev: 1 });
  assert.equal(w.burnedToday, 1);
  assert.deepEqual(w.mockups7, { now: 1, prev: 0 });
  assert.deepEqual(w.won7, { now: 1, prev: 0 });
  assert.equal(w.inWork, 7);
});

test("смена статуса — тот же путь, что у бота: decideTidy → setStatus и createTasks, только свой лид", () => {
  const tidy = read("lib/admin/lead-tidy-store.ts");
  assert.match(tidy, /export async function decideTidy\(/);
  assert.match(tidy, /if \(lead\.assigned_staff_id !== staff\.id\) return \{ result: "forbidden" \}/, "чужой лид — нельзя");
  assert.match(tidy, /const done = await setStatus\(leadId, answer, staff, ip, via\)/, "статус — тем же setStatus, что в карточке: журнал и сброс счётчиков");
  assert.match(tidy, /const decision = await decideTidy\(staff, answer, leadId, "telegram", now\)/, "бот ходит через тот же decideTidy");
  const actions = read("app/admin/hq/actions.ts");
  assert.match(actions, /await decideTidy\(staff, parsed\.answer, parsed\.leadId, "panel"/);
  assert.match(actions, /if \(decision\.answer === "won"\) redirect\(myHref\.project\(parsed\.leadId\)\)/, "«Выиграли» — в «Завести проект»");
  assert.match(actions, /revealContact\(String\(leadId\), staff/, "контакт — через revealContact, с журналом");
  // setStatus сбрасывает счётчики бота.
  assert.match(read("lib/admin/ownership.ts"), /tidy_first_asked_at: null, tidy_wait_streak: 0/);
});

test("анимация: только transform и opacity, при «уменьшить движение» — стоит", () => {
  const css = read("app/globals.css");
  const block = css.slice(css.indexOf("@keyframes hq-breathe"));
  for (const [, body] of block.matchAll(/@keyframes hq-[a-z]+ \{([\s\S]*?)\n\}/g)) {
    for (const [, prop] of body.matchAll(/^\s+([a-z-]+):/gm)) assert.ok(["opacity", "transform"].includes(prop), `в анимации двигается ${prop}`);
  }
  assert.match(block, /@media \(prefers-reduced-motion: reduce\) \{\s*\.hq-hot::before,\s*\.hq-late::before,\s*\.hq-late \.hq-late-icon \{\s*animation: none;/);
});

const sample: MyHq = {
  offline: false,
  hot: hotOf(
    input({
      leads: [lead({ id: "11111111-1111-1111-1111-111111111111", label: "Ромашка" })],
      offers: [{ leadId: "22222222-2222-2222-2222-222222222222", label: "Тёплый", expiresAt: new Date(NOW.getTime() + 12 * 60_000).toISOString() }],
      replies: [{ prospectId: "p1", leadId: "11111111-1111-1111-1111-111111111111", label: "Ромашка", since: ago(1.5), target: null }],
    }),
  ),
  overdue: overdueOf(input({ leads: [lead({ label: "Висит", movedAt: ago(24 * 9) })] })),
  contacts: [],
  mockups: mockupLines({ now: NOW, leads: [], mockups: [mockup({ lastOpenedAt: ago(0.3), opens: 3 })] }),
  work: workOf({ me: ME, now: NOW, portion: [], prospects: [], offersClosed: [], mockups: [], wins: [], inWork: 4 }),
};

test("вёрстка: горит — свечением, просрочено — красной полосой; кнопки статуса не мельче 44 px", () => {
  const html = renderToStaticMarkup(createElement(MyHqView, { my: sample, locale: "ru", name: "Камила", now: NOW }));
  assert.match(html, /class="hq-hot[^"]*"[^>]*data-red=""/);
  assert.match(html, /class="hq-late /);
  assert.match(html, /🏆 Выиграли/);
  assert.match(html, /❌ Проиграли/);
  assert.match(html, /⏳ Ждём/);
  assert.match(html, /Через неделю/);
  assert.match(html, /name="answer" value="w7"/);
  assert.match(html, /Взять/);
  // Порядок блоков на телефоне: горит → просрочено → с кем связаться.
  const order = ["data-block=\"hot\"", "data-block=\"late\"", "data-block=\"contacts\""].map((b) => html.indexOf(b));
  assert.deepEqual([...order].sort((a, b) => a - b), order);
  for (const [, cls] of html.matchAll(/<button[^>]*class="([^"]*)"/g)) assert.match(cls, /min-h-11/, `кнопка мельче 44 px: ${cls}`);
  for (const [, cls] of html.matchAll(/<summary[^>]*class="([^"]*)"/g)) assert.match(cls, /min-h-11/);
  assert.match(html, /\/admin\/help#hq-my-hot/, "«?» ведёт в инструкцию");
});

test("вёрстка рисуется на каждом языке панели", () => {
  for (const locale of PANEL_LOCALES) {
    // Клиентским кнопкам язык ставит каркас панели — здесь провайдер.
    const html = renderToStaticMarkup(
      createElement(PanelLocaleProvider, { locale, children: null }, createElement(MyHqView, { my: sample, locale, name: "Kamila", now: NOW })),
    );
    assert.ok(html.length > 1000, locale);
    if (locale !== "ru") {
      // Кириллица — только из данных (имена лидов и макетов), не из подписей.
      const text = html.replace(/<[^>]+>/g, " ").replace(/Ромашка|Тёплый|Висит|Кафе|Макет кафе/g, "");
      assert.doesNotMatch(text, /[а-яё]/i, `${locale}: русские подписи`);
    }
  }
});
