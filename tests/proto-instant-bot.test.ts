import assert from "node:assert/strict";
import { test } from "node:test";
import { deflateSync } from "node:zlib";

import plans from "@/content/mockup-plans.json" with { type: "json" };
import { PROMO } from "@/lib/admin/mockup-offer";
import { INBOUND_SOURCES } from "@/lib/admin/sales-stages";
import { handleInstantButton, handleInstantText, priceText, startInstant, type Ctx, type Deps } from "@/lib/proto/instant/bot";
import { INSTANT_SOURCE, instantLeadInput } from "@/lib/proto/instant/bot-deps";
import { DAILY_CAP, limitVerdict, siteUrlOf, tashkentDayStart } from "@/lib/proto/instant/limits";
import type { Flow } from "@/lib/proto/instant/store";
import { emptySite } from "@/lib/proto/instant/types";
import { STEPS, stepCaption, widgetHtml, widgetState } from "@/lib/proto/instant/widget";

/**
 * «Макет в боте» (CLAUDE.md): 1 аккаунт — 1 макет, 30 в день на всех,
 * сотрудники без лимита; виджет — в пределах Telegram и без сети; шаги
 * виджета — после настоящих шагов сборки; в конце цена и лид.
 */

const ctx: Ctx = { chatId: 77, tgId: 77, username: "client_demo", locale: "ru", staffId: null };

function fake(over: Partial<Deps> = {}, counts = { mine: 0, today: 0, link: null as string | null }) {
  const log: string[] = [];
  const sent: { html: string; rows?: unknown }[] = [];
  const leads: string[] = [];
  let flow: Flow | null = null;
  const deps: Deps = {
    send: async (_c, html, rows) => {
      sent.push({ html, rows });
      return sent.length;
    },
    edit: async (_c, _id, html) => {
      log.push(`edit:${html.split("\n").find((l) => l.startsWith("⏳")) ?? "done"}`);
      return true;
    },
    sendWidget: async (_c, input) => {
      log.push(`widget:${JSON.parse(input.chatData).k}`);
      return 500;
    },
    editWidget: async (_c, _id, data) => {
      log.push(`state:${JSON.parse(data).k}${JSON.parse(data).f ? "x" : ""}`);
      return true;
    },
    editCaption: async () => true,
    flowOf: async () => flow,
    saveFlow: async (_c, f) => {
      flow = f;
    },
    dropFlow: async () => {
      flow = null;
    },
    claimBuild: async (_c, f) => {
      if (flow?.stage === "building") return false;
      flow = { ...f, stage: "building" };
      return true;
    },
    counts: async () => counts,
    read: async (_u, niche, locale, onStep) => {
      for (const s of ["read", "brand", "services"] as const) {
        log.push(`read:${s}`);
        await onStep(s);
      }
      return { ok: true, usedModel: true, site: { ...emptySite(niche, locale, "Дента Нур", "https://dentanur.example/"), phone: "+998 66 123 45 67", services: [{ name: "Чистка", price: null }] } };
    },
    save: async (build) => {
      log.push(`save:${build.problems.length}`);
      return { id: "p1", token: "tok" };
    },
    lead: async (input) => {
      leads.push(input.why);
      return "lead1";
    },
    setLead: async () => {
      log.push("setLead");
    },
    protoUrl: (t) => `https://devuz.studio/proto/${t}`,
    now: () => new Date("2026-11-10T10:00:00Z"),
    ...over,
  };
  return { deps, log, sent, leads, flow: () => flow };
}

const ask = (deps: Deps, text: string) => handleInstantText(ctx.chatId, async () => ctx, text, deps);

test("макет в боте: лимиты — один на аккаунт, 30 в день, сотрудник без лимита", () => {
  assert.equal(DAILY_CAP, 30);
  assert.equal(limitVerdict({ staff: false, mine: 0, today: 0 }), "ok");
  assert.equal(limitVerdict({ staff: false, mine: 1, today: 0 }), "has");
  assert.equal(limitVerdict({ staff: false, mine: 0, today: 30 }), "day");
  assert.equal(limitVerdict({ staff: true, mine: 5, today: 99 }), "ok");
  assert.equal(tashkentDayStart(new Date("2026-11-10T20:30:00Z")).toISOString(), "2026-11-10T19:00:00.000Z");
});

test("макет в боте: второй макет тому же аккаунту не собирается", async () => {
  const f = fake({}, { mine: 1, today: 3, link: "old" });
  await startInstant(ctx, f.deps);
  assert.match(f.sent[0].html, /уже собран/);
  assert.match(f.sent[0].html, /proto\/old/);
  assert.equal(f.flow(), null);
});

test("макет в боте: дневной лимит — честный ответ и лид менеджеру", async () => {
  const f = fake({}, { mine: 0, today: 30, link: null });
  await startInstant(ctx, f.deps);
  assert.match(f.sent[0].html, /очередь на завтра/);
  assert.deepEqual(f.leads, ["day"]);
});

test("макет в боте: адрес → ниша → виджет по настоящим шагам → ссылка, цена, лид", async () => {
  const f = fake();
  await startInstant(ctx, f.deps);
  assert.ok(await ask(f.deps, "не сайт"), "поток разбирает текст сам");
  assert.match(f.sent.at(-1)!.html, /Не похоже/);
  await ask(f.deps, "dentanur.example");
  assert.equal(f.flow()?.stage, "niche");
  await handleInstantButton(ctx, ["im", "n", "stomatologiya"], f.deps);
  assert.deepEqual(f.log, [
    "widget:0",
    "read:read",
    "state:0",
    "read:brand",
    "state:1",
    "read:services",
    "state:2",
    "state:3",
    "state:4",
    "save:0",
    "state:5",
    "setLead",
  ]);
  const ready = f.sent.find((m) => /Готово/.test(m.html));
  assert.ok(ready);
  assert.deepEqual(ready.rows, [[{ text: "Открыть макет", url: "https://devuz.studio/proto/tok" }]]);
  assert.ok(f.sent.some((m) => m.html.includes(`${PROMO.landing.price} $`)), "цена после макета");
  assert.deepEqual(f.leads, ["built"]);
  assert.equal(f.flow(), null, "поток закрыт");
});

test("макет в боте: без виджетов — тот же ход обычным сообщением", async () => {
  const f = fake({ sendWidget: async () => null });
  await startInstant(ctx, f.deps);
  await ask(f.deps, "https://dentanur.example");
  await handleInstantButton(ctx, ["im", "n", "stomatologiya"], f.deps);
  assert.ok(f.log.some((l) => l.startsWith("edit:⏳")), "статус переписывается");
  assert.ok(f.sent.some((m) => /Готово/.test(m.html)));
});

test("макет в боте: ниша без шаблона — «скоро» и лид, без сборки", async () => {
  const f = fake();
  await startInstant(ctx, f.deps);
  await ask(f.deps, "mebel.example");
  await handleInstantButton(ctx, ["im", "n", "mebel"], f.deps);
  assert.match(f.sent.at(-1)!.html, /ещё готовим/);
  assert.deepEqual(f.leads, ["soon"]);
  assert.ok(!f.log.some((l) => l.startsWith("widget")));
});

test("макет в боте: сайта нет — четыре вопроса и сборка из ответов", async () => {
  const f = fake();
  await startInstant(ctx, f.deps);
  await handleInstantButton(ctx, ["im", "nosite"], f.deps);
  await handleInstantButton(ctx, ["im", "n", "stomatologiya"], f.deps);
  assert.equal(f.flow()?.stage, "q_name");
  await ask(f.deps, "Улыбка");
  await ask(f.deps, "нет номера");
  assert.match(f.sent.at(-1)!.html, /Не вижу номера/);
  await ask(f.deps, "+998 90 111 22 33");
  await ask(f.deps, "нет");
  await ask(f.deps, "Чистка - 300 000 сум\nЛечение");
  assert.ok(f.log.includes("save:0"));
  assert.deepEqual(f.leads, ["built"]);
});

test("макет в боте: пока собирается, второй запуск не стартует", async () => {
  const f = fake();
  await startInstant(ctx, f.deps);
  await ask(f.deps, "dentanur.example");
  await f.deps.claimBuild(ctx.chatId, f.flow()!);
  await ask(f.deps, "ещё");
  assert.match(f.sent.at(-1)!.html, /Уже собираю/);
});

test("макет в боте: потока нет — текст идёт дальше, в первичку", async () => {
  const f = fake();
  assert.equal(await ask(f.deps, "здравствуйте"), false);
});

test("виджет: в пределах Telegram — 32 КБ, 4 КБ сжатым, без сети и внешних картинок", () => {
  for (const locale of ["ru", "uz"] as const) {
    const html = widgetHtml(locale);
    const bytes = Buffer.byteLength(html, "utf8");
    assert.ok(bytes <= 32768, `${bytes}`);
    assert.ok(deflateSync(Buffer.from(html), { level: 9 }).length <= 4096);
    assert.doesNotMatch(html, /fetch\(|XMLHttpRequest|WebSocket|<img|<link|src=|url\(|@font-face|<input|https?:/);
    assert.ok(html.includes("chatDataChanged"));
  }
  for (const s of STEPS) assert.ok(Buffer.byteLength(widgetState(s, true)) <= 1024);
  assert.match(stepCaption("ru", "services"), /✅ Логотип и цвета\n⏳ Услуги и цены/);
  assert.match(stepCaption("uz", "done"), /✅ Tayyor/);
});

test("цена: спецусловия 48 часов из PROMO и допы из плана нашего макета", () => {
  const text = priceText("ru", new Date("2026-11-10T10:00:00Z"));
  assert.ok(text.includes(`${PROMO.landing.price} $`));
  const nek = (plans as { id: string; addons: { id: string; price: number }[] }[]).find((p) => p.id === "nek")!;
  for (const id of ["admin", "chat"]) assert.ok(text.includes(`${nek.addons.find((a) => a.id === id)!.price} $`), id);
  assert.ok(!/Тбилиси|Пролёт/.test(text), "допы Nek для Тбилиси не идут");
  assert.ok(!/[ЀЁ-ӿ]{3}/.test(priceText("uz", new Date()).split("\n").slice(-7).join(" ")), "узбекские допы без кириллицы");
});

test("лид: свой источник «mockup», считается входящим в ступенях продажи", () => {
  assert.equal(INSTANT_SOURCE, "mockup");
  assert.ok(INBOUND_SOURCES.includes("mockup"));
  const input = instantLeadInput({ ctx, name: "Дента Нур", niche: "stomatologiya", site: "https://dentanur.example/", link: "https://devuz.studio/proto/tok", phone: null, why: "built" });
  assert.equal(input.contact_handle, "@client_demo");
  assert.match(input.summary.request, /proto\/tok/);
});

test("адрес сайта: домен да, Instagram и ник — нет", () => {
  assert.equal(siteUrlOf("clinic.uz"), "https://clinic.uz/");
  assert.equal(siteUrlOf("https://clinic.uz/ru"), "https://clinic.uz/ru");
  assert.equal(siteUrlOf("@clinic"), null);
  assert.equal(siteUrlOf("instagram.com/clinic"), null);
  assert.equal(siteUrlOf("привет"), null);
  assert.equal(siteUrlOf("https://user:pw@clinic.uz"), null);
});
