import assert from "node:assert/strict";
import { test } from "node:test";

import { alertText, detectAlerts, type Alert } from "@/lib/ads/alerts";
import { seedStubState, stubConnector } from "@/lib/ads/connectors/stub";
import { alertPeriods, alertsNotice } from "@/lib/ads/run";
import type { Ad, Campaign } from "@/lib/ads/types";

/**
 * Тревоги будят человека — значит, должны срабатывать на настоящую беду и
 * молчать на обычный день. Здесь и то и другое.
 */

const c = (id: string, cost: number, conversions: number, extra: Partial<Campaign> = {}): Campaign => ({
  id,
  name: `Кампания ${id}`,
  active: true,
  dailyBudget: 100_000,
  learning: false,
  activeDays: 7,
  cost,
  clicks: 100,
  impressions: 2000,
  conversions,
  revenue: 0,
  ...extra,
});

const none = { ads: [] as Ad[], keywords: [], negatives: {} };
const kinds = (alerts: Alert[]) => alerts.map((a) => a.kind).sort();

test("обычный день — тишина", () => {
  const week = [c("1", 700_000, 21), c("2", 350_000, 7)];
  const yesterday = [c("1", 105_000, 3, { activeDays: 1 }), c("2", 45_000, 1, { activeDays: 1 })];
  assert.deepEqual(detectAlerts({ week, yesterday, ...none }), []);
});

test("кампания встала, расход вдвое без заявок, ноль заявок при обычных деньгах", () => {
  const week = [c("1", 700_000, 21), c("2", 350_000, 7), c("3", 700_000, 28)];
  const yesterday = [c("1", 0, 0), c("2", 120_000, 1), c("3", 100_000, 0)];
  const alerts = detectAlerts({ week, yesterday, ...none });
  assert.deepEqual(kinds(alerts), ["no_leads", "spike", "stall"]);
  assert.equal(alerts.find((a) => a.kind === "stall")!.key, "stall:1");
});

test("остановленную человеком кампанию и копеечную — не трогаем", () => {
  const week = [c("1", 700_000, 21), c("2", 700, 0)];
  const yesterday = [c("1", 0, 0, { active: false }), c("2", 0, 0)];
  assert.deepEqual(detectAlerts({ week, yesterday, ...none }), []);
});

test("отклонённое объявление и минус-слово, которое режет ключ", () => {
  const week = [c("1", 700_000, 21)];
  const yesterday = [c("1", 100_000, 3)];
  const ad: Ad = {
    id: "a1",
    campaignId: "1",
    adGroupId: "g",
    active: true,
    rejected: true,
    copy: { headlines: ["Курсы английского"], descriptions: ["x"], url: "https://x.uz" },
    clicks: 0,
    impressions: 0,
    cost: 0,
    conversions: 0,
  };
  const alerts = detectAlerts({
    week,
    yesterday,
    ads: [ad],
    keywords: [{ campaignId: "1", adGroupId: "g", id: "k", text: "курсы английского для взрослых" }],
    negatives: { "1": ["взрослых", "бесплатно"] },
  });
  assert.deepEqual(kinds(alerts), ["conflict", "rejected"]);
  assert.match(alertText(alerts.find((a) => a.kind === "conflict")!, "ru", "UZS"), /«взрослых» режет ваши ключи/);
});

test("на заглушке обычный день тревог не даёт", async () => {
  const conn = stubConnector(seedStubState(), async () => undefined);
  const p = alertPeriods(new Date("2026-10-10T08:00:00Z"));
  assert.deepEqual(p, { yesterday: { from: "2026-10-09", to: "2026-10-09" }, week: { from: "2026-10-02", to: "2026-10-08" } });
  const negatives: Record<string, string[]> = {};
  for (const id of ["101", "102", "103"]) negatives[id] = await conn.negatives(id);
  const alerts = detectAlerts({
    yesterday: await conn.campaigns(p.yesterday),
    week: await conn.campaigns(p.week),
    ads: await conn.ads(p.yesterday),
    keywords: await conn.keywords(),
    negatives,
  });
  assert.deepEqual(alerts, []);
});

test("текст тревоги на узбекском и польском — без русских слов вне кавычек; в боте — один раз списком", () => {
  const alerts: Alert[] = [
    { kind: "stall", key: "s", data: { campaign: "Английский", avg: 300_000, cost: 0 } },
    { kind: "spike", key: "p", data: { campaign: "IT", avg: 100_000, cost: 250_000, conversions: 1 } },
    { kind: "no_leads", key: "n", data: { campaign: "IT", avg: 100_000, cost: 90_000, avgConv: 3 } },
    { kind: "rejected", key: "r", data: { campaign: "IT", headline: "Курсы" } },
    { kind: "conflict", key: "c", data: { campaign: "IT", negative: "курсы", keywords: "курсы python" } },
  ];
  for (const a of alerts) {
    for (const locale of ["uz", "pl"] as const) {
      const bare = alertText(a, locale, "UZS").replace(/«[^»]*»/g, "").replace(/: [а-яё ,a-z]+\. /i, "");
      assert.doesNotMatch(bare.replace(/курсы python/g, ""), /[а-яё]/i, `${locale}/${a.kind}: ${bare}`);
    }
  }
  const text = alertsNotice({ name: "Учебный центр", external_id: "", currency: "UZS" }, alerts, "ru")!;
  assert.equal(text.split("\n").length, 1 + alerts.length);
  assert.equal(alertsNotice({ name: "x", external_id: "", currency: "UZS" }, [], "ru"), null);
});
