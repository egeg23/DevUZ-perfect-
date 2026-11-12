import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { deflateSync } from "node:zlib";

import plans from "@/content/mockup-plans.json" with { type: "json" };
import { PROMO } from "@/lib/admin/mockup-offer";
import { INBOUND_SOURCES } from "@/lib/admin/sales-stages";
import { LANG_TEXT, MANUAL_HOURS, beginInstant, caseLinks, greetInstant, handleInstantButton, handleInstantText, instagramOf, instantFromAddress, langOfText, manualText, priceText, startInstant, type Ctx, type Deps } from "@/lib/proto/instant/bot";
import { badOurLinks } from "@/lib/admin/our-links";
import { buildInstant } from "@/lib/proto/instant/build";
import { EXAMPLE } from "@/scripts/protos/instant/preview-data.mjs";
import type { InstantSite } from "@/lib/proto/instant/types";
const example = EXAMPLE as InstantSite;
import { PROTOTYPE_HOURS } from "@/lib/admin/outreach";
import { INSTANT_SOURCE, MANUAL_SOURCE, READ_SLOTS, inSlot, instantLeadInput, manualHeading, sourceOf } from "@/lib/proto/instant/bot-deps";
import { MOCKUP_BOT_OPEN, limitVerdict, mayUseInstant, siteUrlOf } from "@/lib/proto/instant/limits";
import type { Flow } from "@/lib/proto/instant/store";
import { INSTANT_NICHES, emptySite } from "@/lib/proto/instant/types";
import { OPEN_NEWS, OPEN_TEXT } from "@/lib/proto/instant/announce-store";
import { STEPS, STEP_WAIT, stepCaption, widgetHtml, widgetState } from "@/lib/proto/instant/widget";

/**
 * «Макет в боте» (CLAUDE.md): 1 аккаунт — 1 макет, дневного потолка нет,
 * сотрудники без лимита; виджет — в пределах Telegram и без сети; шаги
 * виджета — после настоящих шагов сборки; в конце цена и лид.
 */

const ctx: Ctx = { chatId: 77, tgId: 77, username: "client_demo", locale: "ru", staffId: null, role: null };
const owner: Ctx = { chatId: 5, tgId: 5, username: "owner_demo", locale: "ru", staffId: "s-admin", role: "admin" };

function fake(over: Partial<Deps> = {}, counts: { mine: number; link: string | null; draft?: boolean } = { mine: 0, link: null }) {
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

test("макет в боте: лимиты — один на аккаунт, сотрудник без лимита, дневного потолка нет", () => {
  assert.equal(limitVerdict({ staff: false, mine: 0 }), "ok");
  assert.equal(limitVerdict({ staff: false, mine: 1 }), "has");
  assert.equal(limitVerdict({ staff: true, mine: 5 }), "ok");
  const limits = readFileSync(new URL("../lib/proto/instant/limits.ts", import.meta.url), "utf8");
  assert.doesNotMatch(limits, /DAILY_CAP/, "владелец, 12.11.2026: «Нет лимита 30 в день»");
  const store = readFileSync(new URL("../lib/proto/instant/store.ts", import.meta.url), "utf8");
  assert.doesNotMatch(store, /tashkentDayStart|today/, "макеты за день больше не считаем");
});

test("макет в боте: второй макет тому же аккаунту не собирается", async () => {
  const f = fake({}, { mine: 1, link: "old" });
  await startInstant(ctx, f.deps);
  assert.match(f.sent[0].html, /уже собран/);
  assert.match(f.sent[0].html, /proto\/old/);
  assert.equal(f.flow(), null);
});

test("макет в боте: прошлая сборка не прошла проверку — ссылки на черновик нет, макет за дизайнером", async () => {
  const f = fake({}, { mine: 1, link: "draft-token", draft: true });
  await startInstant(ctx, f.deps);
  assert.match(f.sent[0].html, /дизайнер вручную/);
  assert.doesNotMatch(f.sent[0].html, /draft-token/);
  assert.deepEqual(f.leads, [], "лид по этой сборке уже заведён");
  assert.equal(f.flow(), null);
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
  assert.deepEqual(ready.rows, [[{ text: "Открыть макет", url: "https://devuz.studio/proto/tok" }], [{ text: "🛠 Админка", url: "https://devuz.studio/proto/tok/admin" }]]);
  assert.match(ready.html, /Админка рядом/);
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
  await ask(f.deps, "shop.example");
  await handleInstantButton(ctx, ["im", "n", "general"], f.deps);
  assert.match(f.sent.at(-1)!.html, /дизайнер вручную, пришлём сюда в течение 12 часов/);
  assert.match(f.sent.at(-1)!.html, /devuz\.studio\/ru\/cases/, "кейсы сферы или все кейсы");
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
  for (const s of STEPS) assert.ok(Buffer.byteLength(widgetState(s, "build")) <= 1024);
  assert.match(stepCaption("ru", "services"), /✅ Логотип и цвета\n⏳ Услуги и цены/);
  assert.match(stepCaption("uz", "done"), /✅ Tayyor/);
});

test("сайт не открылся — сразу после адреса, без сферы и виджета; «Dental.uz» с заглавной — тот же адрес", async () => {
  const seen: string[] = [];
  const f = fake({ reachable: async (u) => (seen.push(u), "ENOTFOUND") });
  await startInstant(ctx, f.deps);
  await ask(f.deps, "Dental.uz");
  assert.deepEqual(seen, ["https://dental.uz/"], "регистр адреса не мешает");
  assert.match(f.sent.at(-1)!.html, /Не получилось открыть сайт/);
  assert.equal(JSON.stringify(f.sent.at(-1)!.rows).includes(":nosite"), true, "кнопка «Сайта нет»");
  assert.ok(!f.sent.some((m) => /Чем занимается/.test(m.html)), "сферу не спрашиваем");
  assert.ok(!f.log.some((l) => l.startsWith("widget")), "виджет не начинаем");
  assert.equal(f.flow()?.stage, "url", "ждём адрес снова");
  assert.equal(f.flow()?.fail, "ENOTFOUND", "причина сбоя записана в разговор");
  assert.ok(!f.sent.some((m) => /менеджер/.test(m.html)), "«передали менеджеру» не говорим");
  assert.deepEqual(f.leads, []);
  const ok = fake({ reachable: async () => null });
  await startInstant(ctx, ok.deps);
  await ask(ok.deps, "Dental.uz");
  assert.equal(ok.flow()?.stage, "niche");
});

test("сбой посреди сборки — крестик на шаге, без «передали менеджеру», без повтора в подписи", () => {
  const site = JSON.parse(widgetState("read", "site"));
  assert.equal(site.f, 1);
  const cap = stepCaption("ru", "read", "site");
  assert.match(cap, /✖️ Читаем сайт/);
  assert.doesNotMatch(cap, /менеджер|⚠️|Логотип/);
  assert.equal(JSON.parse(widgetState("check", "build")).f, 2);
  const html = widgetHtml("ru");
  assert.ok(html.includes("Сайт не открылся") && html.includes("Соберёт дизайнер вручную"));
  assert.doesNotMatch(widgetHtml("ru") + widgetHtml("uz"), /передали менеджеру|menejerga topshirdik/);
});

test("цена: спецусловия 48 часов из PROMO и допы из плана нашего макета, на 30% дешевле", async () => {
  const { offerAddonPrice, offerAddons } = await import("@/lib/proto/instant/offer");
  assert.equal(offerAddonPrice(200), 140);
  assert.equal(offerAddonPrice(155), 110, "до 5 $");
  const text = priceText("ru", new Date("2026-11-10T10:00:00Z"));
  assert.ok(text.includes(`${PROMO.landing.price} $`));
  const nek = (plans as { id: string; addons: { id: string; price: number }[] }[]).find((p) => p.id === "nek")!;
  for (const id of ["admin", "chat"]) {
    const plan = nek.addons.find((a) => a.id === id)!.price;
    assert.ok(text.includes(`: ${offerAddonPrice(plan)} $`), id);
    assert.equal(offerAddons("stomatologiya").find((a) => a.id === `nek-${id}`)!.price, offerAddonPrice(plan));
    assert.ok(offerAddonPrice(plan) < plan);
  }
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

test("открыто всем: клиенту и менеджеру поток доступен, откат флагом возвращает пилот", async () => {
  assert.equal(MOCKUP_BOT_OPEN, true, "владелец, 12.11.2026: «Открываем для всех»");
  assert.ok(mayUseInstant(null) && mayUseInstant("manager") && mayUseInstant("admin"));
  assert.ok(mayUseInstant("admin", false) && mayUseInstant("head", false));
  assert.ok(!mayUseInstant("manager", false) && !mayUseInstant(null, false));
  for (const who of [ctx, { ...ctx, staffId: "s-m", role: "manager" }]) {
    const closed = fake({ open: false });
    await startInstant(who, closed.deps);
    await handleInstantButton(who, ["im", "n", "stomatologiya"], closed.deps);
    assert.equal(closed.sent.length, 0, "откат: как до пилота");
    assert.equal(closed.flow(), null);
    const opened = fake({ open: true });
    await startInstant(who, opened.deps);
    assert.match(opened.sent[0].html, /Пришлите адрес/);
  }
});

test("сотруднику, и менеджеру тоже, — без лимита, лида из его сборки нет", async () => {
  for (const who of [owner, { ...ctx, chatId: 9, tgId: 9, staffId: "s-m", role: "manager" }]) {
    const f = fake({}, { mine: 3, link: "old" });
    await startInstant(who, f.deps);
    assert.match(f.sent[0].html, /Пришлите адрес/);
    await handleInstantText(who.chatId, async () => who, "dentanur.example", f.deps);
    await handleInstantButton(who, ["im", "n", "stomatologiya"], f.deps);
    assert.ok(f.log.includes("save:0"), "проверки те же, что у клиента");
    assert.ok(f.sent.some((m) => /Готово/.test(m.html)));
    assert.deepEqual(f.leads, [], "сборка сотрудника лида не заводит");
    assert.ok(!f.log.includes("setLead"));
  }
});

test("команде — одно сообщение «открыт всем»: как это выглядит у клиента и что делать самим", () => {
  assert.equal(OPEN_NEWS, "instant-open:v1");
  assert.match(OPEN_TEXT, /\/maket/);
  assert.match(OPEN_TEXT, /один макет на аккаунт/);
  assert.match(OPEN_TEXT, /из бота, собрал сотрудник/);
  assert.match(OPEN_TEXT, /🔥 Нужен макет вручную/);
  const src = readFileSync(new URL("../lib/proto/instant/announce-store.ts", import.meta.url), "utf8");
  assert.match(src, /!MOCKUP_BOT_OPEN \|\| !messageWindow\(now\)/, "ночью и при откате не уходит");
  assert.match(readFileSync(new URL("../app/api/reminders/sweep/route.ts", import.meta.url), "utf8"), /sendInstantOpenNote\(/);
});

test("рассылка всем: одна заявка «макет вручную» с аккаунта за 7 дней, сайты читаем не больше четырёх разом", async () => {
  const store = readFileSync(new URL("../lib/proto/instant/store.ts", import.meta.url), "utf8");
  assert.match(store, /MANUAL_HOLD_DAYS = 7/);
  const deps = readFileSync(new URL("../lib/proto/instant/bot-deps.ts", import.meta.url), "utf8");
  assert.match(deps, /manualWhy\(input\.why\) && !\(await claimManual\(input\.ctx\.tgId\)/, "повтор второй карточкой не становится");
  assert.match(deps, /inSlot\(\(\) => readClientSite\(/);
  assert.equal(READ_SLOTS, 4);
  let now = 0;
  let peak = 0;
  const order: number[] = [];
  const job = (n: number) => async () => {
    now += 1;
    peak = Math.max(peak, now);
    await new Promise((r) => setTimeout(r, 5));
    now -= 1;
    order.push(n);
    return n;
  };
  const done = await Promise.all([1, 2, 3, 4, 5, 6, 7].map((n) => inSlot(job(n), 2)));
  assert.deepEqual(done, [1, 2, 3, 4, 5, 6, 7]);
  assert.equal(peak, 2, "больше двух разом не идёт");
  assert.equal(order.length, 7, "никто не потерялся");
  await assert.rejects(inSlot(async () => { throw new Error("сайт упал"); }, 2));
  assert.equal(await inSlot(async () => "ok", 2), "ok", "место после сбоя освобождается");
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
  assert.ok(html.includes("e.textContent=t") && html.includes("ty($('nm'),n"), "данные клиента не разметкой");
  assert.doesNotMatch(html, /innerHTML|insertAdjacentHTML|document\.write/, "данные клиента только через textContent");
});

test("виджет: сайт собирается на глазах — в виде шаблона сферы, с ценами, телефоном и адресом клиента", () => {
  const st = JSON.parse(
    widgetState("services", false, {
      name: "Диванный мир",
      host: "divanmir.uz",
      phone: "+998 90 123 45 67",
      sub: "Мебель  на заказ,\nТашкент",
      services: ["Диваны", "Кухни", "Шкафы"],
      prices: ["от 3 млн сум", null, "от 2 млн сум"],
    }),
  );
  assert.equal(st.u, "divanmir.uz");
  assert.equal(st.p, "+998 90 123 45 67");
  assert.equal(st.g, "Мебель на заказ, Ташкент");
  assert.deepEqual(st.r, ["от 3 млн сум", "", "от 2 млн сум"], "цены по порядку услуг");
  assert.equal(JSON.parse(widgetState("services", false, { services: ["Диваны"], prices: [null] })).r, undefined, "цен нет — поля нет");
  const fat = widgetState("done", false, { name: "я".repeat(500), sub: "ю".repeat(500), host: "h".repeat(500), services: Array(9).fill("услуга ".repeat(20)), prices: Array(9).fill("цена ".repeat(20)) });
  assert.ok(Buffer.byteLength(fat) <= 1024);
  const cut = JSON.parse(fat);
  assert.equal((cut.r ?? []).length <= (cut.s ?? []).length, true, "цен не больше, чем услуг");

  // Вид мини-сайта — как у шаблона сферы: мебель тёмная, стоматология светлая с засечками.
  const mebel = widgetHtml("ru", "mebel");
  const dental = widgetHtml("ru", "stomatologiya");
  assert.ok(mebel.includes("background:#121110") && mebel.includes("--a:#cf3d1c") && mebel.includes("Заказать замер"));
  assert.ok(dental.includes("background:#f8f4ef") && /\.h1\{[^}]*serif/.test(dental));
  assert.ok(widgetHtml("ru").includes("var(--tg-theme-secondary-bg-color)"), "без сферы — в цветах чата");

  // Пределы профиля виджетов Telegram: чего нет в профиле, клиент молча выбросит.
  for (const niche of INSTANT_NICHES) {
    for (const locale of ["ru", "uz"] as const) {
      const html = widgetHtml(locale, niche);
      assert.ok(deflateSync(Buffer.from(html), { level: 9 }).length <= 4000, `${niche} ${locale}: запас до 4096`);
      assert.doesNotMatch(html, /clip-path|text-shadow|color-mix|oklch|backdrop-filter|filter:|perspective|translate3d|rotate[XY]|vh[;}]|inset:|@container|:has\(/, `${niche}: вне профиля`);
      assert.doesNotMatch(html, /opacity|blur\(/, "прозрачность и размытие — не больше 16 элементов, не используем вовсе");
      assert.doesNotMatch(html, /offset(Top|Left|Parent|Height)|scroll(Top|IntoView)/, "раскладку читаем только getBoundingClientRect");
      assert.doesNotMatch(html, /font(-family)?:[^;}]*(Georgia|Arial|Helvetica|Manrope|Roboto)/i, "только системные семейства шрифтов");
    }
  }
  // Сцена на каждый шаг; пересозданный виджет на последнем шаге ставит всё сразу.
  assert.ok(mebel.includes("st().k>=L") && mebel.includes("k>i+1"));
  assert.ok(mebel.includes("prefers-reduced-motion"));
});

test("бот ждёт сцену виджета перед следующим шагом, без виджета — как раньше", async () => {
  assert.ok(STEP_WAIT.build >= 3000 && STEP_WAIT.done >= 2000, "сцены услуг и проверки успевают доиграть");
  assert.ok(Object.values(STEP_WAIT).reduce((a, b) => a + b, 0) <= 14000, "вся постановка не дольше 14 секунд");
  const src = readFileSync(new URL("../lib/proto/instant/bot.ts", import.meta.url), "utf8");
  assert.match(src, /pace\(widget \? Math\.max\(STEP_SHOW_MS, STEP_WAIT\[s\]\) : STEP_SHOW_MS\)/);
  assert.match(src, /widgetState\("read", false, \{ host \}\)/, "адрес сайта — в строке браузера с первого кадра");
  assert.match(src, /prices: x\.services\.map\(\(v\) => v\.price\)/);
});

test("медцентр: допы с ценами — из плана нашего макета Shox", () => {
  const ru = priceText("ru", new Date("2026-11-10T10:00:00Z"), "medcentr");
  assert.ok(ru.includes("Telegram-бот записи: 210 $"));
  assert.ok(ru.includes("Админ-панель для записи и работы с пациентами: 315 $"));
  assert.ok(!ru.includes("Улыбка"), "допы стоматологии не путаются");
  assert.ok(!/[ЀЁ-ӿ]{3}/.test(priceText("uz", new Date(), "medcentr").split("\n").slice(-7).join(" ")), "узбекские допы без кириллицы");
});

test("мебель: допы с ценами — из планов наших макетов (Enotmebel, Usemtau, Karomat)", () => {
  const ru = priceText("ru", new Date("2026-11-10T10:00:00Z"), "mebel");
  assert.ok(ru.includes("Панель заявок и замеров: статусы, менеджеры: 315 $"));
  assert.ok(ru.includes("Рассрочка Uzum Nasiya и Alif: 55 $"));
  assert.ok(!ru.includes("Telegram-бот записи"), "допы медцентра не путаются");
  assert.ok(!/[ЀЁ-ӿ]{3}/.test(priceText("uz", new Date(), "mebel").split("\n").slice(-7).join(" ")), "узбекские допы без кириллицы");
});

/** Первое сообщение и выбор языка кнопкой — как это делает клиент. */
async function greeted(f: ReturnType<typeof fake>, who: Ctx = ctx, lang: "ru" | "uz" = "ru") {
  await greetInstant(who, f.deps);
  await handleInstantButton(who, ["im", "l", lang], f.deps);
}

test("первое сообщение: сначала язык, потом «соберём макет прямо здесь»; пока закрыто — false", async () => {
  const f = fake();
  assert.equal(await greetInstant(ctx, f.deps), true);
  assert.equal(f.sent[0].html, LANG_TEXT);
  assert.match(LANG_TEXT, /На каком языке вам удобнее\?[\s\S]*Qaysi tilda qulay\?/, "вопрос на двух языках сразу");
  assert.deepEqual(JSON.stringify(f.sent[0].rows).match(/im:l:(ru|uz)/g), ["im:l:ru", "im:l:uz"]);
  assert.equal(f.flow()?.stage, "lang");
  await handleInstantButton(ctx, ["im", "l", "ru"], f.deps);
  assert.match(f.sent[1].html, /за 2 минуты и бесплатно\. Пришлите адрес вашего сайта или Instagram/);
  assert.deepEqual(JSON.stringify(f.sent[1].rows).match(/im:(go|other)/g), ["im:go", "im:other"]);
  assert.equal(f.flow()?.stage, "greet");
  const closed = fake({ open: false });
  assert.equal(await greetInstant(ctx, closed.deps), false, "клиенту при закрытом пилоте — прежнее приветствие");
  assert.equal(await greetInstant(owner, closed.deps), true, "владелец видит новое");
});

test("язык: выбор главнее языка Telegram, запоминается и ведёт весь разговор и макет", async () => {
  const picked: string[] = [];
  const f = fake({ setLang: async (_c, l) => void picked.push(l) });
  // Telegram у клиента русский, выбирает узбекский.
  await greeted(f, ctx, "uz");
  assert.deepEqual(picked, ["uz"]);
  assert.equal(f.flow()?.locale, "uz");
  assert.ok(!/[\u0400-\u04ff]/.test(f.sent[1].html), "предложение макета — по-узбекски, латиницей");
  await handleInstantButton(ctx, ["im", "go"], f.deps);
  assert.match(f.sent.at(-1)!.html, /Saytingiz maketini/, "«Собрать макет» — на выбранном языке");
  await ask(f.deps, "dentanur.example");
  assert.match(f.sent.at(-1)!.html, /Kompaniyangiz nima bilan/);
  await handleInstantButton(ctx, ["im", "n", "stomatologiya"], f.deps);
  assert.ok(f.log.includes("save:0"), "макет собран");
  assert.match(f.sent.map((m) => m.html).join("\n"), /Tayyor!/, "итог — по-узбекски");
});

test("язык: словом вместо кнопки, адрес до выбора не теряется, вопрос уходит первичке", async () => {
  assert.equal(langOfText("Русский"), "ru");
  assert.equal(langOfText("o‘zbekcha"), "uz");
  assert.equal(langOfText("O'zbek tili"), "uz");
  assert.equal(langOfText("узбекский"), "uz");
  assert.equal(langOfText("Сколько стоит сайт на русском и узбекском?"), null);
  const w = fake();
  await greetInstant(ctx, w.deps);
  assert.ok(await ask(w.deps, "o‘zbekcha"));
  assert.equal(w.flow()?.stage, "greet");
  assert.equal(w.flow()?.locale, "uz");

  // Адрес прислан раньше, чем выбран язык: спрашиваем язык ещё раз и идём с этим адресом.
  const a = fake();
  await greetInstant(ctx, a.deps);
  assert.ok(await ask(a.deps, "dentanur.example"));
  assert.equal(a.flow()?.stage, "lang");
  assert.equal(a.flow()?.pending, "dentanur.example");
  assert.equal(a.sent.at(-1)!.html, LANG_TEXT);
  await handleInstantButton(ctx, ["im", "l", "ru"], a.deps);
  assert.equal(a.flow()?.stage, "niche");
  assert.equal(a.flow()?.url, "https://dentanur.example/");

  const q = fake();
  await greetInstant(ctx, q.deps);
  assert.equal(await ask(q.deps, "Сколько стоит интернет-магазин?"), false, "не язык и не адрес — первичка");
  assert.equal(q.flow(), null);
});

test("язык: /maket — после выбора сразу адрес сайта, без «Собрать макет»", async () => {
  const f = fake();
  await beginInstant(owner, f.deps);
  assert.equal(f.sent[0].html, LANG_TEXT);
  assert.equal(f.flow()?.next, "url");
  await handleInstantButton(owner, ["im", "l", "uz"], f.deps);
  assert.equal(f.flow()?.stage, "url");
  assert.match(f.sent.at(-1)!.html, /Kompaniyangiz sayti manzilini yuboring/);
  const closed = fake({ open: false });
  await beginInstant(ctx, closed.deps);
  assert.deepEqual(closed.sent, [], "пока закрыто — клиенту ничего");
  // Кнопка из старого сообщения без разговора — начинаем с языка.
  const stale = fake();
  await handleInstantButton(ctx, ["im", "nosite"], stale.deps);
  assert.equal(stale.sent[0].html, LANG_TEXT);
  const src = readFileSync(new URL("../app/api/telegram/webhook/route.ts", import.meta.url), "utf8");
  assert.doesNotMatch(src, /await startInstant\(/, "вебхук начинает с языка");
  assert.match(src, /existing\?\.locale \?\? \(await botLangOf\(chat\.id\)/, "выбранный язык переживает выкатку");
});

test("первое сообщение: адрес → сфера; обычный текст и «другой вопрос» — в первичку", async () => {
  const f = fake();
  await greeted(f);
  assert.equal(await ask(f.deps, "Сколько стоит интернет-магазин?"), false, "вопрос уходит первичке");
  assert.equal(f.flow(), null);
  await greeted(f);
  assert.ok(await ask(f.deps, "dentanur.example"));
  assert.equal(f.flow()?.stage, "niche");
  const g = fake();
  await greeted(g);
  assert.equal(await handleInstantButton(ctx, ["im", "other"], g.deps), "other");
  assert.equal(g.flow(), null);
  const h = fake();
  await greeted(h);
  await handleInstantButton(ctx, ["im", "go"], h.deps);
  assert.equal(h.flow()?.stage, "url");
});

test("первое сообщение: Instagram — вопросами, профиль в макет; адрес без /start тоже", async () => {
  assert.equal(instagramOf("вот https://www.instagram.com/dentanur.uz/"), "dentanur.uz");
  assert.equal(instagramOf("instagram.com/p/abc123"), null);
  const f = fake();
  await greeted(f);
  await ask(f.deps, "https://instagram.com/dentanur_demo");
  assert.equal(f.flow()?.nosite, true);
  assert.equal(f.flow()?.answers.instagram, "dentanur_demo");
  const n = fake();
  assert.equal(await instantFromAddress(ctx, "привет", n.deps), false);
  assert.equal(await instantFromAddress(ctx, "clinic.example", n.deps), true);
  assert.equal(n.flow()?.stage, "lang", "сначала язык");
  await handleInstantButton(ctx, ["im", "l", "ru"], n.deps);
  assert.equal(n.flow()?.stage, "niche", "адрес не потерян");
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
  for (const why of ["soon", "failed"] as const) assert.equal(sourceOf(why), MANUAL_SOURCE);
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

test("личка владельца — чат продаж: /maket, ?start=maket и ответы посреди сборки идут в поток макета", async () => {
  const { readFileSync } = await import("node:fs");
  const route = readFileSync("app/api/telegram/webhook/route.ts", "utf8");
  const sales = route.slice(route.indexOf("async function handleSales("), route.indexOf("async function handleGroup("));
  assert.ok(sales.length > 0);
  // Поток макета — раньше служебного «Это чат отдела продаж» и приветствия брифов.
  const flowAt = sales.indexOf("beginInstant(ictx, instantDeps())");
  assert.ok(flowAt > 0, "в чате продаж есть вход в поток макета");
  assert.ok(flowAt < sales.indexOf("Это чат отдела продаж"));
  assert.ok(flowAt < sales.indexOf("бот отдела продаж"));
  assert.match(sales, /\(maket\|mockup\)/);
  assert.match(sales, /startPayloadOf\(raw\) === INSTANT_START/);
  assert.match(sales, /instantOpenFor\(ictx\)/, "тот же выключатель: только admin/head, пока поток закрыт");
  assert.ok(sales.indexOf("handleInstantText(") < sales.indexOf("handleStaffText("), "ответы посреди сборки — потоку, остальной текст — помощнику");
});

test("КП: база 500 / 1 000 $ и допы ниши не дороже 1 500 $, сайт целиком не дороже 2 500 $", async () => {
  const { offerAddons, offerBase, OFFER_ADDONS_MAX } = await import("@/lib/proto/instant/offer");
  const { INSTANT_NICHES } = await import("@/lib/proto/instant/types");
  const base = offerBase("ru");
  assert.deepEqual(base.map((b) => b.price), [500, 1000]);
  for (const niche of INSTANT_NICHES) {
    const sum = offerAddons(niche).reduce((s, a) => s + a.price, 0);
    assert.ok(sum > 0 && sum <= OFFER_ADDONS_MAX, `${niche}: допы ${sum} $`);
    assert.ok(base[1].price + sum <= 2500, `${niche}: сайт целиком ${base[1].price + sum} $`);
    for (const a of offerAddons(niche)) assert.ok(!/[Ѐ-ӿ]/.test(a.uz), `${niche}: «${a.uz}» узбекский без кириллицы`);
  }
});

test("КП: на бланке, срок 48 часов от сборки, без тире и штампов, имя клиента экранировано", async () => {
  const { kpHtml } = await import("@/lib/proto/instant/kp");
  const { pageProblems } = await import("@/lib/proto/plain-text");
  const { INSTANT_NICHES } = await import("@/lib/proto/instant/types");
  const at = new Date("2026-11-10T10:00:00Z");
  for (const locale of ["ru", "uz"] as const) {
    for (const niche of INSTANT_NICHES) {
      const html = kpHtml({ ...example, niche, locale, name: "Клиника <b>«Улыбка»</b>" }, at);
      assert.deepEqual(pageProblems(html), [], `${locale} ${niche}`);
      assert.ok(html.includes("2026-11-12T10:00:00.000Z"), "срок — 48 часов от сборки");
      assert.ok(html.includes("MAKSIMOV EGOR ANDREEVICH") && html.includes("t.me/Devuz_studio_bot"), "бланк студии");
      assert.ok(html.includes("__PROTO_BASE__/"), "кнопка обратно на макет");
      assert.ok(!html.includes("<b>«Улыбка»</b>"), "имя экранировано");
      assert.ok(/mockup-terms/.test(html), "ссылка на условия макета");
    }
  }
  const uz = kpHtml({ ...example, locale: "uz", name: "Tabassum" }, at);
  assert.ok(!/[Ѐ-ӿ]/.test(uz.replace(/<script[\s\S]*?<\/script>/g, "")), "узбекское КП без кириллицы");
});

test("КП: сборка кладёт его страницей kp, бот даёт кнопку на /kp", async () => {
  const build = buildInstant(example, "0".repeat(32), new Date("2026-11-10T10:00:00Z"));
  assert.ok(build.pages.kp.includes("Коммерческое предложение"));
  assert.ok(!build.problems.some((p) => p.code.startsWith("kp-")), JSON.stringify(build.problems));
});

test("макет в боте: кнопка в виджете сборки — по сфере", () => {
  assert.match(widgetHtml("ru"), /<span class="bk z" id="bk">Записаться<\/span>/);
  assert.match(widgetHtml("ru", "stomatologiya"), /<span class="bk z" id="bk">Записаться<\/span>/);
  assert.match(widgetHtml("ru", "restoran"), /<span class="bk z" id="bk">Забронировать<\/span>/);
  assert.match(widgetHtml("uz", "nedvizhimost"), /<span class="bk z" id="bk">Obyekt tanlash<\/span>/);
});
