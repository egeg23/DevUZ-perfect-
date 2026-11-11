import assert from "node:assert/strict";
import { test } from "node:test";
import { deflateSync } from "node:zlib";

import plans from "@/content/mockup-plans.json" with { type: "json" };
import { PROMO } from "@/lib/admin/mockup-offer";
import { INBOUND_SOURCES } from "@/lib/admin/sales-stages";
import { MANUAL_HOURS, caseLinks, greetInstant, handleInstantButton, handleInstantText, instagramOf, instantFromAddress, manualText, priceText, startInstant, type Ctx, type Deps } from "@/lib/proto/instant/bot";
import { badOurLinks } from "@/lib/admin/our-links";
import { PROTOTYPE_HOURS } from "@/lib/admin/outreach";
import { INSTANT_SOURCE, MANUAL_SOURCE, instantLeadInput, manualHeading, sourceOf } from "@/lib/proto/instant/bot-deps";
import { DAILY_CAP, MOCKUP_BOT_OPEN, limitVerdict, mayUseInstant, siteUrlOf, tashkentDayStart } from "@/lib/proto/instant/limits";
import type { Flow } from "@/lib/proto/instant/store";
import { emptySite } from "@/lib/proto/instant/types";
import { PILOT_NEWS, PILOT_TEXT } from "@/lib/proto/instant/announce-store";
import { STEPS, stepCaption, widgetHtml, widgetState } from "@/lib/proto/instant/widget";

/**
 * «Макет в боте» (CLAUDE.md): 1 аккаунт — 1 макет, 30 в день на всех,
 * сотрудники без лимита; виджет — в пределах Telegram и без сети; шаги
 * виджета — после настоящих шагов сборки; в конце цена и лид.
 */

const ctx: Ctx = { chatId: 77, tgId: 77, username: "client_demo", locale: "ru", staffId: null, role: null };
const owner: Ctx = { chatId: 5, tgId: 5, username: "owner_demo", locale: "ru", staffId: "s-admin", role: "admin" };

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
    open: true,
    pace: async () => undefined,
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
  assert.match(f.sent[0].html, /дизайнер вручную/);
  assert.match(f.sent[0].html, /devuz\.studio\/ru\/cases/);
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

test("макет в боте: ниша без шаблона — вручную за 12 часов, кейсы сферы и лид, без сборки", async () => {
  const f = fake();
  await startInstant(ctx, f.deps);
  await ask(f.deps, "mebel.example");
  await handleInstantButton(ctx, ["im", "n", "mebel"], f.deps);
  assert.match(f.sent.at(-1)!.html, /дизайнер вручную, пришлём сюда в течение 12 часов/);
  assert.match(f.sent.at(-1)!.html, /devuz\.studio\/ru\/cases\/[a-z-]+/, "кейсы мебели");
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

test("пилот: пока поток закрыт, клиенту и менеджеру — как раньше, ничего не уходит", async () => {
  assert.equal(MOCKUP_BOT_OPEN, false, "владелец, 10.11.2026: «Для всех пока не открываем»");
  assert.ok(mayUseInstant("admin") && mayUseInstant("head"));
  assert.ok(!mayUseInstant("manager") && !mayUseInstant(null));
  for (const who of [ctx, { ...ctx, staffId: "s-m", role: "manager" }]) {
    const f = fake({ open: false });
    await startInstant(who, f.deps);
    await handleInstantButton(who, ["im", "n", "stomatologiya"], f.deps);
    assert.equal(f.sent.length, 0);
    assert.equal(f.flow(), null);
  }
});

test("пилот: Егору и Александру — без лимита, макет тестовый, лида нет", async () => {
  const f = fake({ open: false }, { mine: 3, today: 99, link: "old" });
  await startInstant(owner, f.deps);
  assert.match(f.sent[0].html, /Пришлите адрес/);
  await handleInstantText(owner.chatId, async () => owner, "dentanur.example", f.deps);
  await handleInstantButton(owner, ["im", "n", "stomatologiya"], f.deps);
  assert.ok(f.log.includes("save:0"), "проверки те же, что в боевом");
  assert.ok(f.sent.some((m) => /Готово/.test(m.html)));
  assert.deepEqual(f.leads, [], "тестовая сборка лида не заводит");
  assert.ok(!f.log.includes("setLead"));
  const soon = fake({ open: false });
  await startInstant(owner, soon.deps);
  await handleInstantButton(owner, ["im", "nosite"], soon.deps);
  await handleInstantButton(owner, ["im", "n", "mebel"], soon.deps);
  assert.deepEqual(soon.leads, []);
});

test("пилот: уведомление Егору и Александру — один раз, как запустить", () => {
  assert.equal(PILOT_NEWS, "instant-pilot:v1");
  assert.match(PILOT_TEXT, /\/maket/);
  assert.match(PILOT_TEXT, /тестовый, из бота/);
});

test("виджет: имя, цвет и услуги клиента в состоянии, не больше 1024 байт, только textContent", () => {
  const long = Array.from({ length: 10 }, (_, i) => `Очень длинное название услуги номер ${i} для проверки`);
  const st = JSON.parse(widgetState("services", false, { name: "Дента Нур", color: "#1B7F6A", services: long }));
  assert.equal(st.n, "Дента Нур");
  assert.equal(st.c, "#1b7f6a");
  assert.ok(st.s.length <= 4);
  assert.ok(Buffer.byteLength(widgetState("done", false, { name: "я".repeat(500), services: long })) <= 1024);
  assert.equal(JSON.parse(widgetState("brand", false, { color: "red;}" })).c, undefined, "чужой цвет не проходит");
  const html = widgetHtml("ru");
  assert.ok(html.includes("textContent=s.n") && html.includes("e.textContent=list"), "данные клиента не разметкой");
});

test("медцентр: допы с ценами — из плана нашего макета Shox", () => {
  const ru = priceText("ru", new Date("2026-11-10T10:00:00Z"), "medcentr");
  assert.ok(ru.includes("Telegram-бот записи: 300 $"));
  assert.ok(ru.includes("Админ-панель для записи и работы с пациентами: 450 $"));
  assert.ok(!ru.includes("Улыбка"), "допы стоматологии не путаются");
  assert.ok(!/[ЀЁ-ӿ]{3}/.test(priceText("uz", new Date(), "medcentr").split("\n").slice(-7).join(" ")), "узбекские допы без кириллицы");
});

test("первое сообщение: «пришлите сайт или Instagram» с кнопками; пока закрыто — false", async () => {
  const f = fake();
  assert.equal(await greetInstant(ctx, f.deps), true);
  assert.match(f.sent[0].html, /адрес вашего сайта или Instagram — за 2 минуты соберём макет/);
  assert.deepEqual(JSON.stringify(f.sent[0].rows).match(/im:(go|other)/g), ["im:go", "im:other"]);
  assert.equal(f.flow()?.stage, "greet");
  const closed = fake({ open: false });
  assert.equal(await greetInstant(ctx, closed.deps), false, "клиенту при закрытом пилоте — прежнее приветствие");
  assert.equal(await greetInstant(owner, closed.deps), true, "владелец видит новое");
  const uz = fake();
  await greetInstant({ ...ctx, locale: "uz" }, uz.deps);
  assert.ok(!/[\u0400-\u04ff]/.test(uz.sent[0].html), "узбекский — латиницей");
});

test("первое сообщение: адрес → сфера; обычный текст и «другой вопрос» — в первичку", async () => {
  const f = fake();
  await greetInstant(ctx, f.deps);
  assert.equal(await ask(f.deps, "Сколько стоит интернет-магазин?"), false, "вопрос уходит первичке");
  assert.equal(f.flow(), null);
  await greetInstant(ctx, f.deps);
  assert.ok(await ask(f.deps, "dentanur.example"));
  assert.equal(f.flow()?.stage, "niche");
  const g = fake();
  await greetInstant(ctx, g.deps);
  assert.equal(await handleInstantButton(ctx, ["im", "other"], g.deps), "other");
  assert.equal(g.flow(), null);
  const h = fake();
  await greetInstant(ctx, h.deps);
  await handleInstantButton(ctx, ["im", "go"], h.deps);
  assert.equal(h.flow()?.stage, "url");
});

test("первое сообщение: Instagram — вопросами, профиль в макет; адрес без /start тоже", async () => {
  assert.equal(instagramOf("вот https://www.instagram.com/dentanur.uz/"), "dentanur.uz");
  assert.equal(instagramOf("instagram.com/p/abc123"), null);
  const f = fake();
  await greetInstant(ctx, f.deps);
  await ask(f.deps, "https://instagram.com/dentanur_demo");
  assert.equal(f.flow()?.nosite, true);
  assert.equal(f.flow()?.answers.instagram, "dentanur_demo");
  const n = fake();
  assert.equal(await instantFromAddress(ctx, "привет", n.deps), false);
  assert.equal(await instantFromAddress(ctx, "clinic.example", n.deps), true);
  assert.equal(n.flow()?.stage, "niche");
  assert.equal(await instantFromAddress(ctx, "clinic.example", fake({ open: false }).deps), false);
});

test("ручной путь: срок одним числом, кейсы — наши живые ссылки, лид — свой источник с шапкой", () => {
  assert.equal(MANUAL_HOURS, PROTOTYPE_HOURS);
  for (const niche of ["mebel", "salon-krasoty", "general", "stomatologiya"] as const) {
    const text = manualText("ru", niche);
    assert.deepEqual(badOurLinks(text), [], niche);
    assert.ok(caseLinks(niche, "ru").length >= 1);
  }
  assert.match(caseLinks("salon-krasoty", "uz")[0].url, /devuz\.studio\/uz\/cases$/, "кейсов сферы нет — все кейсы");
  assert.equal(sourceOf("built"), INSTANT_SOURCE);
  for (const why of ["soon", "day", "failed"] as const) assert.equal(sourceOf(why), MANUAL_SOURCE);
  assert.ok(INBOUND_SOURCES.includes(MANUAL_SOURCE), "в ступенях продажи — входящий");
  const head = manualHeading({ niche: "mebel", site: "https://mebel.example/" });
  assert.match(head, /🔥 <b>Нужен макет вручную · /);
  assert.match(head, /12 часов/);
  assert.match(instantLeadInput({ ctx, name: "@client_demo", niche: "mebel", site: null, link: null, phone: null, why: "soon" }).notes, /нужен макет вручную/);
});

test("первое сообщение: вебхук — реф-ссылка, промокод и вход в приложение разбираются раньше приветствия", async () => {
  const { readFileSync } = await import("node:fs");
  const src = readFileSync("app/api/telegram/webhook/route.ts", "utf8");
  const start = src.slice(src.indexOf("async function handleClient("));
  const at = (s: string) => start.indexOf(s);
  for (const before of ["BIND_PREFIX", 'payload === "partner"', "isAppStart(payload)", "parseTelegramPayload(payload)"]) {
    assert.ok(at(before) > 0 && at(before) < at("await welcome(chat.id"), before);
  }
  assert.ok(src.includes("if (!existing?.transcript.length && (await greetInstant("), "идущий разговор не перебиваем");
  assert.ok(src.includes("touchChat(chat.id, refCode)") && at("touchChat(chat.id, refCode)") < start.indexOf("await welcome(chat.id, message.from, locale, existing);"), "реф-код записан до приветствия");
});
