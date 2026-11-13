import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { siteInstantCopy } from "@/content/site-instant-copy";
import { CIRCLE_NICHES } from "@/lib/admin/sales-after-reply";
import { LANG_TEXT, manualText, priceText } from "@/lib/proto/instant/bot";
import { manualHeading } from "@/lib/proto/instant/bot-deps";
import type { InstantBuild } from "@/lib/proto/instant/build";
import {
  SITE_DAY_CAP,
  SITE_IP_DAY,
  contactOk,
  instagramOfSite,
  mockupLocaleOf,
  parseSiteRequest,
  runSiteBuild,
  siteCaseLinks,
  siteLimit,
  webLeadInput,
  type SiteDeps,
  type SiteEvent,
  type SiteRequest,
} from "@/lib/proto/instant/site";
import { emptySite, type InstantNiche, type InstantSite } from "@/lib/proto/instant/types";
import { STEPS, stepCaption } from "@/lib/proto/instant/widget";
import { locales } from "@/lib/i18n";
import { EXAMPLE } from "@/scripts/protos/instant/preview-data.mjs";

/**
 * «Собрать макет» на главной (CLAUDE.md, владелец 13.11.2026): тот же поток,
 * что в боте; шаги окна — после настоящих шагов сервера; один макет на
 * браузер, потолок на адрес и на день; лид — только с контактом, который
 * человек оставил сам; слова «шаблон» клиенту нет ни на сайте, ни в боте.
 */

const example = EXAMPLE as InstantSite;
const req = (over: Partial<SiteRequest> = {}): SiteRequest => ({
  locale: "ru",
  siteLocale: "ru",
  niche: "stomatologiya",
  what: null,
  url: "https://clinic.example/",
  instagram: null,
  answers: null,
  ...over,
});

function deps(over: Partial<SiteDeps> = {}) {
  const saved: InstantBuild[] = [];
  const d: SiteDeps = {
    reachable: async () => null,
    read: async (_u, niche, locale, onStep) => {
      await onStep("read");
      const site = { ...example, niche, locale };
      await onStep("brand", site);
      await onStep("services", site);
      return { ok: true, site, usedModel: true };
    },
    save: async (b) => {
      saved.push(b);
      return { id: "p1", token: "tok123" };
    },
    now: () => new Date("2026-11-13T10:00:00Z"),
    pace: async () => undefined,
    ...over,
  };
  return { d, saved };
}

async function run(r: SiteRequest, d: SiteDeps) {
  const events: SiteEvent[] = [];
  const last = await runSiteBuild(r, d, (e) => events.push(e));
  return { events, last };
}

test("запрос: ловушка, сайт, Instagram без ответов, «Другое» — ближайший макет", () => {
  assert.equal(parseSiteRequest({ hp: "x", niche: "medcentr", url: "a.uz" }), "trap");
  assert.equal(parseSiteRequest({ niche: "чужое", url: "a.uz" }), "bad");
  const site = parseSiteRequest({ niche: "medcentr", url: "clinic.uz", locale: "en" });
  assert.ok(site !== "bad" && site !== "trap");
  assert.equal(site.url, "https://clinic.uz/");
  assert.equal(site.locale, "ru", "макет — на русском для языков сайта без своих макетов");
  assert.equal(parseSiteRequest({ niche: "medcentr", url: "instagram.com/clinic" }), "bad", "Instagram — только с ответами");
  const insta = parseSiteRequest({ niche: "medcentr", url: "instagram.com/clinic", answers: { name: "Клиника", phone: "+998 90 123 45 67" } });
  assert.ok(insta !== "bad" && insta !== "trap");
  assert.equal(insta.instagram, "clinic");
  assert.equal(insta.url, null);
  const other = parseSiteRequest({ niche: "general", what: "ремонт квартир", url: "remont.uz", locale: "uz" });
  assert.ok(other !== "bad" && other !== "trap");
  assert.notEqual(other.niche, "general");
  assert.equal(other.locale, "uz");
  assert.equal(mockupLocaleOf("pl"), "ru");
  assert.equal(instagramOfSite("@my.shop"), "my.shop");
});

test("лимит: один макет на браузер, потолок адреса и дня", () => {
  assert.equal(siteLimit({ has: "none", ipDay: 0, allDay: 0 }), "ok");
  assert.equal(siteLimit({ has: "ready", ipDay: 0, allDay: 0 }), "has");
  assert.equal(siteLimit({ has: "draft", ipDay: 0, allDay: 0 }), "draft");
  assert.equal(siteLimit({ has: "none", ipDay: SITE_IP_DAY, allDay: 0 }), "ip");
  assert.equal(siteLimit({ has: "none", ipDay: 0, allDay: SITE_DAY_CAP }), "day");
});

test("сборка с сайтом: шаги по порядку, после настоящих, в конце готовый макет", async () => {
  const { d, saved } = deps();
  const { events, last } = await run(req(), d);
  const steps = events.filter((e) => e.t === "step").map((e) => (e.t === "step" ? e.step : ""));
  assert.deepEqual(steps, [...STEPS]);
  assert.equal(last.t, "done");
  assert.equal(saved.length, 1);
  assert.equal(saved[0].problems.length, 0, saved[0].problems.map((p) => p.code).join(","));
  if (last.t === "done") {
    assert.equal(last.token, "tok123");
    assert.ok(last.addons.length > 0);
    assert.equal(Date.parse(last.expires) - Date.parse("2026-11-13T10:00:00Z"), 48 * 3600_000);
  }
  // Имя клиента приходит в окно после чтения, а не выдумывается заранее.
  const brand = events.find((e) => e.t === "step" && e.step === "brand");
  assert.ok(brand && brand.t === "step" && brand.info?.name === example.name);
});

test("сайт не открылся — «open», без сборки; проверка не прошла — ручной путь и черновик", async () => {
  const closed = deps({ reachable: async () => "ответ 404" });
  assert.equal((await run(req(), closed.d)).last.t, "open");
  assert.equal(closed.saved.length, 0);
  const empty = deps({ read: async () => ({ ok: false, why: "empty" }) });
  assert.equal((await run(req(), empty.d)).last.t, "open");
  // Без телефона и мессенджера сборка не проходит проверку.
  const bare = deps({ read: async (_u, niche, locale) => ({ ok: true, site: { ...emptySite(niche, locale, "Без связи", "x"), phone: null }, usedModel: false }) });
  const { last } = await run(req(), bare.d);
  assert.equal(last.t, "manual");
  assert.equal(bare.saved.length, 1, "черновик пишется: в «Макетах» видно, что не так");
});

for (const niche of ["restoran", "logistika", "salon-krasoty"] as InstantNiche[]) {
  test(`без сайта, ответами: ${niche} собирается до конца, источник — сайт, не Telegram`, async () => {
    const { d, saved } = deps();
    const answers = { name: "Новая компания", phone: "+998 90 123 45 67", address: "Ташкент, Чиланзар", services: "Первая услуга - 100 000 сум\nВторая услуга" };
    const { last } = await run(req({ niche, url: null, answers }), d);
    assert.equal(last.t, "done", saved[0]?.problems.map((p) => p.code).join(","));
    assert.match(saved[0].site.source, /devuz\.studio/);
    assert.doesNotMatch(saved[0].site.source, /Telegram/);
  });
}

test("лид — только с контактом человека: Telegram или телефон, суть в заметке", () => {
  assert.ok(contactOk("@client_name"));
  assert.ok(contactOk("+998 90 123 45 67"));
  assert.ok(!contactOk("привет"));
  const lead = webLeadInput({ contact: "@client_name", name: "Клиника", niche: "stomatologiya", site: "https://clinic.uz/", link: "https://devuz.studio/proto/x", why: "built", siteLocale: "ru" });
  assert.equal(lead.contact_kind, "telegram");
  assert.match(lead.notes, /Собрать макет/);
  assert.match(lead.summary.request, /proto\/x/);
  const manual = webLeadInput({ contact: "+998901234567", name: "", niche: "general", site: null, link: null, why: "failed", siteLocale: "en" });
  assert.equal(manual.need, "N3");
  assert.match(manualHeading({ niche: "general", site: null }, "site"), /на сайте/);
});

test("кейсы ручного пути — на языке сайта", () => {
  for (const c of siteCaseLinks("stomatologiya", "pl")) assert.match(c.href, /^\/pl\/cases\//);
});

test("тексты окна — шесть языков одной формы, сферы все, слова «шаблон» нет", () => {
  const shape = (o: unknown): string => (o && typeof o === "object" ? Object.keys(o).sort().map((k) => `${k}:${shape((o as Record<string, unknown>)[k])}`).join(",") : typeof o);
  const ru = shape(siteInstantCopy.ru).replace(/langNote:(string|object)/, "langNote:");
  for (const l of locales) {
    assert.ok(siteInstantCopy[l], l);
    assert.equal(shape(siteInstantCopy[l]).replace(/langNote:(string|object)/, "langNote:"), ru, `${l}: та же форма, что у русского`);
    for (const n of CIRCLE_NICHES) assert.ok(siteInstantCopy[l].niches[n], `${l}: ${n}`);
    assert.doesNotMatch(JSON.stringify(siteInstantCopy[l]), /шаблон|shablon|template|szablon|模板|шаблон/i, `${l}: «шаблон» клиенту не говорим`);
  }
});

test("бот: ни в одном тексте клиенту нет слова «шаблон»", () => {
  const out = [LANG_TEXT, manualText("ru", "general"), manualText("uz", "medcentr"), priceText("ru", new Date()), priceText("uz", new Date())];
  for (const s of STEPS) out.push(stepCaption("ru", s), stepCaption("uz", s));
  // Тексты бота клиенту — объект T в bot.ts и подписи виджета.
  const bot = readFileSync("lib/proto/instant/bot.ts", "utf8");
  const t = bot.slice(bot.indexOf("const T = {"), bot.indexOf("} as const;", bot.indexOf("const T = {")));
  assert.ok(t.length > 1000);
  out.push(t);
  for (const text of out) assert.doesNotMatch(text, /шаблон|shablon/i);
});

test("главная: окно перед «Работами», те же проверки и слоты чтения, что у бота", () => {
  const home = readFileSync("components/home/glass-home.tsx", "utf8");
  assert.ok(home.indexOf("<InstantMaker") > 0 && home.indexOf("<InstantMaker") < home.indexOf('id="works"'));
  const route = readFileSync("app/api/instant/route.ts", "utf8");
  assert.match(route, /inSlot\(\(\) => readClientSite/);
  assert.match(route, /siteOpens/);
  assert.match(route, /HttpOnly/);
  const ui = readFileSync("components/home/instant-maker.tsx", "utf8");
  assert.match(ui, /className=\{g\.trap\}/, "ловушка для ботов в окне");
  assert.match(ui, /\/proto\/\$\{done\.token\}/, "в окне — сам макет, а не схема");
  const css = readFileSync("components/home/instant-maker.module.css", "utf8");
  assert.match(css, /prefers-reduced-motion: reduce/);
  for (const m of css.matchAll(/transition:\s*([^;]+);/g)) {
    for (const prop of m[1].split(/,(?![^(]*\))/).map((x) => x.trim().split(/\s+/)[0])) {
      assert.ok(["transform", "opacity", "border-color", "background-color", "none"].includes(prop), `анимируется ${prop}`);
    }
  }
  // Макеты с сайта — не подписчики бота.
  assert.match(readFileSync("lib/admin/bot-users-store.ts", "utf8"), /"facts->instant->>tg", "is", null/);
});
