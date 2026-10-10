import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { test } from "node:test";

import { judge, MAX_DAYS, winnerDraft } from "@/lib/ads/abtest";
import { applyPayload, rollback } from "@/lib/ads/apply";
import { budgetDrafts, eligible } from "@/lib/ads/budget";
import { googleConnector } from "@/lib/ads/connectors/google";
import { seedStubState, simulateDays, stubConnector } from "@/lib/ads/connectors/stub";
import { parseTsv, yandexConnector } from "@/lib/ads/connectors/yandex";
import { copyProblems } from "@/lib/ads/copy";
import { open, seal } from "@/lib/ads/crypto";
import { allowed, type LiveState } from "@/lib/ads/guard";
import { acceptModelNegative, classifyQueries, groupLang, writeVariant } from "@/lib/ads/model";
import { negativeDrafts, safeNegative, wasteGrams } from "@/lib/ads/negatives";
import { signState, verifyState } from "@/lib/ads/oauth";
import { reportDue, reportText } from "@/lib/ads/report";
import { DEFAULT_THRESHOLDS, type AccountLimits, type Ad, type BudgetPayload } from "@/lib/ads/types";
import { blocks, existingConflicts, stem } from "@/lib/ads/words";

/**
 * Автопилот рекламы тратит чужие деньги. Тесты ниже — прежде всего про то,
 * чего он сделать НЕ может: повысить общий бюджет, сдвинуть больше
 * разрешённого, тронуть учащуюся кампанию, отрезать рабочий ключ,
 * применить без человека в режиме «предлагаю», работать при стоп-кране.
 */

const PERIOD = { from: "2026-09-10", to: "2026-10-09" };
const SUGGEST: AccountLimits = { mode: "suggest", stopped: false, maxShiftPct: 20, maxActionsDay: 20 };
const AUTO: AccountLimits = { ...SUGGEST, mode: "auto" };

function stub() {
  const saved: unknown[] = [];
  const conn = stubConnector(seedStubState(), async (s) => {
    saved.push(s);
  });
  return { conn, saved };
}

async function live(conn: ReturnType<typeof stub>["conn"], ids: string[] = []): Promise<LiveState> {
  const negatives: Record<string, string[]> = {};
  for (const id of ids) negatives[id] = await conn.negatives(id);
  return { campaigns: await conn.campaigns(PERIOD), keywords: await conn.keywords(), negatives };
}

/* ── Слова ─────────────────────────────────────────────────────────────── */

test("минус-слово режет ключ со всеми словоформами", () => {
  assert.equal(stem("курсы"), stem("курс"));
  assert.equal(stem("бесплатно"), stem("бесплатный"));
  assert.ok(blocks("курс", "курсы английского ташкент"));
  assert.ok(!blocks("бесплатно", "курсы английского ташкент"));
  assert.ok(blocks("английский ташкент", "курсы английского в ташкенте"));
  assert.deepEqual(existingConflicts(["английского"], ["курсы английского", "python курсы"]), [
    { negative: "английского", keyword: "курсы английского" },
  ]);
});

/* ── Минус-слова ───────────────────────────────────────────────────────── */

test("минус-слова: находят мусор и не трогают рабочие ключи", async () => {
  const { conn } = stub();
  const terms = await conn.searchTerms(PERIOD);
  const keywords = await conn.keywords();
  const drafts = negativeDrafts({
    terms,
    keywords,
    existing: { "101": await conn.negatives("101"), "102": [], "103": [] },
    campaignNames: { "101": "Английский", "102": "IT", "103": "IELTS" },
    thresholds: DEFAULT_THRESHOLDS,
    days: 30,
    currency: "UZS",
  });
  const all = drafts.flatMap((d) => (d.payload.kind === "negatives" ? d.payload.phrases : []));
  assert.ok(all.includes("бесплатно"), `нет «бесплатно» в ${all.join(", ")}`);
  assert.ok(all.some((p) => p.startsWith("скачать")));
  assert.ok(all.some((p) => p.startsWith("вакансии")));
  for (const draft of drafts) {
    const payload = draft.payload;
    if (payload.kind !== "negatives") continue;
    const campaignId = payload.campaignId;
    const own = keywords.filter((k) => k.campaignId === campaignId).map((k) => k.text);
    for (const phrase of payload.phrases) {
      assert.ok(own.every((k) => !blocks(phrase, k)), `«${phrase}» режет ключ кампании ${campaignId}`);
    }
    assert.match(draft.why, /не принесли ни одной заявки/);
  }
  // Слова с заявками — никогда.
  assert.ok(!all.includes("ташкент"));
  assert.ok(!all.includes("цены"));
});

test("минус-слова: запретные слова владельца и длинные фразы не предлагаются", async () => {
  const { conn } = stub();
  const terms = (await conn.searchTerms(PERIOD)).filter((t) => t.campaignId === "102");
  const grams = wasteGrams(terms, ["курсы программирования ташкент"], [], { ...DEFAULT_THRESHOLDS, protectedWords: ["бесплатно"] });
  assert.ok(!grams.some((g) => g.text.includes("бесплатно")));
  assert.ok(!safeNegative("один два три четыре пять шесть семь восемь", []));
  assert.ok(!safeNegative("курсы", ["курсы программирования"]));
});

/* ── Бюджет ────────────────────────────────────────────────────────────── */

test("бюджет: деньги идут в дешёвую заявку, общий бюджет не растёт, учащиеся не трогаются", async () => {
  const { conn } = stub();
  const campaigns = await conn.campaigns(PERIOD);
  assert.ok(!eligible(campaigns.find((c) => c.id === "103")!), "учащаяся кампания участвует");
  const drafts = budgetDrafts({ campaigns, maxShiftPct: 20, currency: "UZS", days: 30 });
  assert.equal(drafts.length, 1);
  const payload = drafts[0].payload as BudgetPayload;
  const donor = payload.moves.find((m) => m.to < m.from)!;
  const taker = payload.moves.find((m) => m.to > m.from)!;
  assert.equal(donor.campaignId, "102");
  assert.equal(taker.campaignId, "101");
  assert.equal(payload.moves.reduce((s, m) => s + m.to - m.from, 0), 0, "общий бюджет изменился");
  for (const m of payload.moves) assert.ok(Math.abs(m.to - m.from) <= m.from * 0.2);
  assert.ok(!payload.moves.some((m) => m.campaignId === "103"));
});

test("бюджет: при малых данных уверенности нет — предложения нет", () => {
  const base = { active: true, learning: false, activeDays: 30, impressions: 1000, revenue: 0 };
  const drafts = budgetDrafts({
    campaigns: [
      { ...base, id: "1", name: "A", dailyBudget: 100_000, cost: 2_950_000, clicks: 40, conversions: 2 },
      { ...base, id: "2", name: "B", dailyBudget: 100_000, cost: 1_000_000, clicks: 40, conversions: 1 },
    ],
    maxShiftPct: 20,
    currency: "UZS",
    days: 30,
  });
  assert.equal(drafts.length, 0);
});

/* ── Ограничители ──────────────────────────────────────────────────────── */

test("ограничители: стоп-кран, режим «предлагаю» и потолок действий", async () => {
  const { conn } = stub();
  const state = await live(conn, ["102"]);
  const payload = { kind: "negatives" as const, campaignId: "102", campaignName: "IT", phrases: ["бесплатно"] };
  const base = { actionsToday: 0, payload, live: state, platform: "stub" as const };
  assert.equal(allowed({ ...base, limits: { ...AUTO, stopped: true }, actor: "human" }).ok, false);
  assert.equal(allowed({ ...base, limits: SUGGEST, actor: "auto" }).ok, false);
  assert.equal(allowed({ ...base, limits: SUGGEST, actor: "human" }).ok, true);
  assert.equal(allowed({ ...base, limits: AUTO, actor: "auto", actionsToday: 20 }).ok, false);
  assert.equal(allowed({ ...base, limits: AUTO, actor: "auto", actionsToday: 3 }).ok, true);
});

test("ограничители: общий бюджет не растёт, сдвиг не больше лимита, учащиеся и устаревшие — нет", async () => {
  const { conn } = stub();
  const state = await live(conn);
  const check = (moves: BudgetPayload["moves"], limits = SUGGEST) =>
    allowed({ limits, actor: "human", actionsToday: 0, payload: { kind: "budget", moves }, live: state, platform: "stub" });
  const m = (campaignId: string, from: number, to: number) => ({ campaignId, campaignName: campaignId, from, to });

  assert.equal(check([m("102", 400_000, 340_000), m("101", 300_000, 360_000)]).ok, true);
  const grow = check([m("102", 400_000, 400_000), m("101", 300_000, 330_000)]);
  assert.equal(grow.ok, false);
  assert.match((grow as { reason: string }).reason, /никогда/);
  assert.equal(check([m("102", 400_000, 300_000), m("101", 300_000, 400_000)]).ok, false, "сдвиг больше 20%");
  assert.equal(check([m("102", 400_000, 300_000), m("101", 300_000, 400_000)], { ...SUGGEST, maxShiftPct: 90 }).ok, false, "больше 30% — никогда");
  assert.equal(check([m("103", 200_000, 180_000), m("101", 300_000, 320_000)]).ok, false, "учащаяся кампания");
  assert.equal(check([m("102", 500_000, 450_000), m("101", 300_000, 350_000)]).ok, false, "бюджет поменяли руками");
});

test("ограничители: минус-слово, задевшее ключ, не применяется", async () => {
  const { conn } = stub();
  const state = await live(conn, ["101"]);
  const verdict = allowed({
    limits: SUGGEST,
    actor: "human",
    actionsToday: 0,
    payload: { kind: "negatives", campaignId: "101", campaignName: "Англ", phrases: ["бесплатно", "взрослых"] },
    live: state,
    platform: "stub",
  });
  assert.equal(verdict.ok, false);
  assert.match((verdict as { reason: string }).reason, /взрослых/);
});

test("в интерфейсе площадки нет удаления", () => {
  const { conn } = stub();
  for (const name of Object.keys(conn)) assert.doesNotMatch(name, /delete|remove/i);
});

/* ── Применение и откат ────────────────────────────────────────────────── */

test("минус-слова: применили, откатили — ручные минусы на месте", async () => {
  const { conn } = stub();
  const done = await applyPayload({
    connector: conn,
    platform: "stub",
    limits: SUGGEST,
    actor: "human",
    actionsToday: 0,
    payload: { kind: "negatives", campaignId: "101", campaignName: "Англ", phrases: ["бесплатно", "скачать"] },
    period: PERIOD,
  });
  assert.ok(done.ok);
  assert.deepEqual(await conn.negatives("101"), ["онлайн бесплатно", "бесплатно", "скачать"]);
  // Запросы с минус-словом пропали из отчёта.
  assert.ok(!(await conn.searchTerms(PERIOD)).some((t) => t.campaignId === "101" && t.query.includes("бесплатно")));

  await conn.setNegatives("101", [...(await conn.negatives("101")), "ручное"]);
  const back = await rollback({ connector: conn, kind: "negatives", before: done.before, after: done.after, period: PERIOD });
  assert.ok(back.ok);
  assert.deepEqual(await conn.negatives("101"), ["онлайн бесплатно", "ручное"]);
});

test("бюджет: применили и откатили; поменяли руками — вслепую не откатываем", async () => {
  const { conn } = stub();
  const payload: BudgetPayload = {
    kind: "budget",
    moves: [
      { campaignId: "102", campaignName: "IT", from: 400_000, to: 340_000 },
      { campaignId: "101", campaignName: "Англ", from: 300_000, to: 360_000 },
    ],
  };
  const done = await applyPayload({ connector: conn, platform: "stub", limits: SUGGEST, actor: "human", actionsToday: 0, payload, period: PERIOD });
  assert.ok(done.ok);
  const budgets = async () => Object.fromEntries((await conn.campaigns(PERIOD)).map((c) => [c.id, c.dailyBudget]));
  assert.deepEqual(await budgets(), { "101": 360_000, "102": 340_000, "103": 200_000 });

  const back = await rollback({ connector: conn, kind: "budget", before: done.before, after: done.after, period: PERIOD });
  assert.ok(back.ok);
  assert.deepEqual(await budgets(), { "101": 300_000, "102": 400_000, "103": 200_000 });

  const again = await applyPayload({ connector: conn, platform: "stub", limits: SUGGEST, actor: "human", actionsToday: 0, payload, period: PERIOD });
  assert.ok(again.ok);
  await conn.setDailyBudget("101", 500_000);
  const refused = await rollback({ connector: conn, kind: "budget", before: again.before, after: again.after, period: PERIOD });
  assert.equal(refused.ok, false);
});

test("бюджет: площадка не приняла второй шаг — первый возвращён", async () => {
  const { conn } = stub();
  const failing = { ...conn, setDailyBudget: async (id: string, amount: number) => {
    if (id === "101" && amount === 360_000) throw new Error("лимит площадки");
    return conn.setDailyBudget(id, amount);
  } };
  const out = await applyPayload({
    connector: failing,
    platform: "stub",
    limits: SUGGEST,
    actor: "human",
    actionsToday: 0,
    payload: { kind: "budget", moves: [
      { campaignId: "102", campaignName: "IT", from: 400_000, to: 340_000 },
      { campaignId: "101", campaignName: "Англ", from: 300_000, to: 360_000 },
    ] },
    period: PERIOD,
  });
  assert.equal(out.ok, false);
  assert.equal((await conn.campaigns(PERIOD)).find((c) => c.id === "102")!.dailyBudget, 400_000);
});

/* ── Тесты объявлений ──────────────────────────────────────────────────── */

const ad = (id: string, impressions: number, clicks: number, conversions = 0): Ad => ({
  id,
  campaignId: "1",
  adGroupId: "g",
  active: true,
  copy: { headlines: [`Заголовок ${id}`, "Второй"], descriptions: ["Текст"], url: "https://example.uz" },
  impressions,
  clicks,
  conversions,
  cost: 0,
});

test("тест объявлений: без данных итога нет, с явной разницей — победитель, долго без разницы — ничья", () => {
  assert.equal(judge(ad("a", 300, 15), ad("b", 300, 30), 20).state, "running");
  assert.equal(judge(ad("a", 5000, 250), ad("b", 5000, 400), 3).state, "running", "меньше 10 дней");
  const win = judge(ad("a", 5000, 250), ad("b", 5000, 400), 14);
  assert.equal(win.state, "winner");
  assert.equal((win as { winner: string }).winner, "variant");
  assert.equal(judge(ad("a", 5000, 250), ad("b", 5000, 252), MAX_DAYS).state, "draw");

  const draft = winnerDraft({ testId: 1, control: ad("a", 5000, 250), variant: ad("b", 5000, 400), verdict: win as never });
  assert.equal(draft.payload.kind, "ad_winner");
  assert.equal((draft.payload as { loserAdId: string }).loserAdId, "a");
});

test("заглушка прокручивает дни, и тест доходит до итога", async () => {
  let state = seedStubState();
  const conn = stubConnector(state, async (s) => {
    state = s;
  });
  const variant = await conn.createAd("1011", {
    headlines: ["Английский у метро Чиланзар", "Первый урок завтра"],
    descriptions: ["Группы по 8 человек, утро и вечер. Запишитесь на пробный урок."],
    url: "https://example.uz/english",
  });
  state = simulateDays(conn.state(), 20);
  const ads = await stubConnector(state, async () => undefined).ads(PERIOD);
  const v = ads.find((a) => a.id === variant)!;
  assert.ok(v.impressions >= 1000);
});

test("текст объявления: тире, штампы, обещания и длина не проходят", () => {
  const good = { headlines: ["Курсы английского в Ташкенте", "Группы по 8 человек"], descriptions: ["Пробный урок за 1 день."], url: "https://example.uz" };
  assert.deepEqual(copyProblems(good, "yandex"), []);
  const fields = (c: typeof good) => copyProblems(c, "yandex").map((p) => p.field);
  assert.ok(fields({ ...good, descriptions: ["Курсы — это просто"] }).includes("dash"));
  assert.ok(fields({ ...good, descriptions: ["Уникальный подход к обучению"] }).includes("ai"));
  assert.ok(fields({ ...good, descriptions: ["Гарантия результата"] }).includes("promise"));
  assert.ok(fields({ ...good, descriptions: ["Лучшие преподаватели"] }).includes("promise"));
  assert.ok(fields({ ...good, headlines: ["Курсы английского", "Очень длинный второй заголовок объявления"] }).includes("headline2"));
  assert.ok(copyProblems({ ...good, headlines: ["a", "b"] }, "google").some((p) => p.field === "headlines"));
});

/* ── Модель ────────────────────────────────────────────────────────────── */

function fakeClient(inputs: unknown[]) {
  const calls: { model: string }[] = [];
  return {
    calls,
    messages: {
      create: async (req: { model: string }) => {
        calls.push(req);
        return { content: [{ type: "tool_use", input: inputs.shift() }], stop_reason: "tool_use" };
      },
    },
  } as never as { calls: { model: string }[]; messages: never };
}

test("модель: дешёвая, и её минус-слово проверяется кодом", async () => {
  assert.equal(acceptModelNegative("стоматология для собак", "собак", ["стоматология ташкент"], []), "собак");
  assert.equal(acceptModelNegative("стоматология для собак", "кошек", [], []), null, "слова нет в запросе");
  assert.equal(acceptModelNegative("стоматология для собак", "стоматология", ["стоматология ташкент"], []), null, "режет ключ");
  assert.equal(acceptModelNegative("клиника юнусабад отзывы", "юнусабад", [], ["Юнусабад"]), null, "под запретом");

  const client = fakeClient([{ items: [{ n: 1, negative: "собак", reason: "ветеринария" }, { n: 2, negative: "стоматология", reason: "плохо" }] }]);
  const out = await classifyQueries(
    {
      business: "стоматология для людей",
      keywords: ["стоматология ташкент"],
      protectedWords: [],
      terms: [
        { campaignId: "1", adGroupId: "g", query: "стоматология для собак", clicks: 2, impressions: 20, cost: 50_000, conversions: 0 },
        { campaignId: "1", adGroupId: "g", query: "стоматология юнусабад", clicks: 3, impressions: 20, cost: 40_000, conversions: 0 },
      ],
    },
    client as never,
  );
  assert.deepEqual(out.map((c) => c.text), ["собак"]);
  assert.match((client as { calls: { model: string }[] }).calls[0].model, /haiku/);
});

test("модель: вариант объявления со штампом переписывается, а не уходит", async () => {
  const client = fakeClient([
    { headlines: ["Уникальные курсы английского", "Мы лучшие"], descriptions: ["Инновационный подход"] },
    { headlines: ["Английский у метро Чиланзар", "Первый урок завтра"], descriptions: ["Группы по 8 человек, утро и вечер."] },
  ]);
  const copy = await writeVariant(
    { platform: "yandex", lang: "ru", current: { headlines: ["Курсы английского", "Группы по 8"], descriptions: ["Пробный урок"], url: "https://example.uz" }, keywords: [] },
    client as never,
  );
  assert.equal(copy?.headlines[0], "Английский у метро Чиланзар");
  assert.equal(groupLang(["ingliz tili kurslari"]), "uz");
  assert.equal(groupLang(["курсы английского"]), "ru");
});

/* ── Ключи и вход ──────────────────────────────────────────────────────── */

test("ключи доступа шифруются, подмена не расшифровывается", () => {
  const key = randomBytes(32);
  const sealed = seal({ token: "y0_secret" }, key);
  assert.doesNotMatch(sealed, /y0_secret/);
  assert.deepEqual(open(sealed, key), { token: "y0_secret" });
  assert.equal(open(sealed, randomBytes(32)), null);
  const parts = sealed.split(".");
  parts[3] = parts[3].slice(0, -2) + (parts[3].endsWith("A") ? "BB" : "AA");
  assert.equal(open(parts.join("."), key), null);
});

test("OAuth state: подписан, привязан к кабинету и живёт полчаса", () => {
  const key = randomBytes(32);
  const now = Date.now();
  const state = signState("acc-1", now, key);
  assert.equal(verifyState(state, key, now + 60_000), "acc-1");
  assert.equal(verifyState(state, key, now + 31 * 60_000), null);
  assert.equal(verifyState(state.replace("acc-1", "acc-2"), key, now), null);
  assert.equal(verifyState(state, randomBytes(32), now), null);
});

/* ── Коннекторы ────────────────────────────────────────────────────────── */

test("Директ: отчёт ждёт офлайн-готовности, минус-фразы пишутся в кампанию, ошибки понятны", async () => {
  const sent: { url: string; body: unknown; headers: Record<string, string> }[] = [];
  let reportCalls = 0;
  const fetchImpl = async (url: string, init: RequestInit) => {
    const body = JSON.parse(String(init.body));
    sent.push({ url, body, headers: init.headers as Record<string, string> });
    if (url.endsWith("/reports")) {
      reportCalls++;
      if (reportCalls === 1) return new Response("", { status: 201, headers: { retryIn: "1" } });
      return new Response("CampaignId\tAdGroupId\tQuery\tImpressions\tClicks\tCost\tConversions\n1\t2\tкурсы бесплатно\t10\t3\t4500\t--\n", { status: 200 });
    }
    if (body.method === "update") return Response.json({ result: { UpdateResults: [{ Id: 1 }] } }, { headers: { Units: "10/9990/10000" } });
    return Response.json({ error: { error_code: 53, error_string: "Ошибка авторизации", error_detail: "токен" } });
  };
  const conn = yandexConnector({ token: "t", clientLogin: "client-1" }, { sandbox: true, fetchImpl, sleep: async () => undefined });
  const terms = await conn.searchTerms(PERIOD);
  assert.deepEqual(terms[0], { campaignId: "1", adGroupId: "2", query: "курсы бесплатно", impressions: 10, clicks: 3, cost: 4500, conversions: 0 });
  assert.equal(reportCalls, 2);
  assert.match(sent[0].url, /api-sandbox\.direct\.yandex\.com/);
  assert.equal(sent[0].headers["Client-Login"], "client-1");
  assert.equal(sent[0].headers.processingMode, "offline");

  await conn.setNegatives("1", ["бесплатно"]);
  const update = sent.find((s) => (s.body as { method?: string }).method === "update")!;
  assert.deepEqual(update.body, { method: "update", params: { Campaigns: [{ Id: 1, NegativeKeywords: { Items: ["бесплатно"] } }] } });
  await assert.rejects(conn.negatives("1"), /Ошибка авторизации/);
  assert.deepEqual(parseTsv("A\tB\n1\t2\n"), [{ A: "1", B: "2" }]);
});

test("Google Ads: минус-слова фразой, бюджет кратен 10 000 микро, MCC в заголовке", async () => {
  const sent: { url: string; body: { query?: string; operations?: unknown[] }; headers: Record<string, string> }[] = [];
  const fetchImpl = async (url: string, init: RequestInit) => {
    const body = JSON.parse(String(init.body));
    sent.push({ url, body, headers: init.headers as Record<string, string> });
    if (url.endsWith("googleAds:searchStream")) {
      if (String(body.query).includes("FROM campaign_criterion")) {
        return Response.json([{ results: [{ campaignCriterion: { resourceName: "customers/1/campaignCriteria/5~9", keyword: { text: "старое" } } }] }]);
      }
      return Response.json([
        {
          results: [
            {
              campaign: { id: "5", name: "Поиск", status: "ENABLED", primaryStatusReasons: [] },
              campaignBudget: { resourceName: "customers/1/campaignBudgets/77", amountMicros: "100000000000", explicitlyShared: false },
              segments: { date: "2026-10-01" },
              metrics: { costMicros: "50000000000", clicks: "100", impressions: "2000", conversions: 4 },
            },
          ],
        },
      ]);
    }
    return Response.json({ results: [{ resourceName: "customers/1/adGroupAds/3~44" }] });
  };
  const conn = googleConnector({ customerId: "123-456", loginCustomerId: "999", developerToken: "", accessToken: async () => "at" }, { fetchImpl });
  const [campaign] = await conn.campaigns(PERIOD);
  assert.equal(campaign.dailyBudget, 100_000);
  assert.equal(campaign.cost, 50_000);
  assert.equal(sent[0].headers["login-customer-id"], "999");
  assert.ok(!("developer-token" in sent[0].headers));

  await conn.setNegatives("5", ["бесплатно"]);
  const ops = sent.find((s) => s.url.endsWith("campaignCriteria:mutate"))!.body.operations!;
  assert.deepEqual(ops, [
    { create: { campaign: "customers/123456/campaigns/5", negative: true, keyword: { text: "бесплатно", matchType: "PHRASE" } } },
    { remove: "customers/1/campaignCriteria/5~9" },
  ]);

  await conn.setDailyBudget("5", 123_456.789);
  const budget = sent.find((s) => s.url.endsWith("campaignBudgets:mutate"))!.body.operations![0] as { update: { amountMicros: string } };
  assert.equal(Number(budget.update.amountMicros) % 10_000, 0);
  assert.equal(await conn.createAd("3", { headlines: ["a", "b", "c"], descriptions: ["d", "e"], url: "https://x.uz" }), "3~44");
  await assert.rejects(conn.negatives("5' OR 1=1"), /Неверный id/);
});

/* ── Отчёт ─────────────────────────────────────────────────────────────── */

test("недельный отчёт: понедельник утром, раз в неделю, простыми словами", () => {
  const monday9 = new Date("2026-10-12T04:30:00Z"); // 09:30 в Ташкенте
  assert.ok(reportDue(monday9, null));
  assert.ok(!reportDue(new Date("2026-10-12T03:00:00Z"), null), "08:00 — рано");
  assert.ok(!reportDue(monday9, "2026-10-12T04:05:00Z"), "уже отправлен");
  assert.ok(!reportDue(new Date("2026-10-13T05:00:00Z"), null), "вторник");

  const text = reportText({
    locale: "ru",
    account: { name: "Учебный центр", external_id: "", currency: "UZS" },
    week: { cost: 2_000_000, conversions: 20, prevCost: 2_100_000, prevConversions: 14 },
    applied: 3,
    saved: 1_500_000,
    waiting: 1,
  });
  assert.match(text, /Цена заявки: 100 000 сум/);
  assert.doesNotMatch(text, /CTR|ROAS|CPA|конверси/i);
  const uz = reportText({ locale: "uz", account: { name: "X", external_id: "", currency: "UZS" }, week: null, applied: 0, saved: 0, waiting: 0 });
  assert.doesNotMatch(uz.replace(/«[^»]*»/g, ""), /[а-яё]/i);
});
