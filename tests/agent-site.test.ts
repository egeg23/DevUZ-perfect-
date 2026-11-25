import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import robots from "@/app/robots";
import { agentCopy } from "@/content/agent-copy";
import { leadChannelDict } from "@/content/admin-panel/lead-origin";
import { casesOnSite } from "@/content/cases";
import { proof } from "@/content/company";
import { LANDINGS } from "@/content/service-landings";
import { calcPrice, landingMoney, landingText } from "@/content/service-landings/fill";
import { services } from "@/content/services";
import { leadKindOf } from "@/lib/admin/lead-kinds";
import { INBOUND_SOURCES } from "@/lib/admin/sales-stages";
import { AGENT_SOURCE, agentLeadInput, agentName, contactLooksReal, parseAgentLead } from "@/lib/agent/lead";
import { agentPage, agentSegments, agentServiceSlugs, llmsFull, llmsIndex } from "@/lib/agent/markdown";
import { AGENT_LEAD_PATH, agentMdHref, agentPath, wantsMarkdown } from "@/lib/agent/paths";
import { locales } from "@/lib/i18n";

/**
 * Версия сайта для ИИ-агентов (владелец, 24.11.2026: «отдельную версию сайта
 * для Ии агентов, как сделали Akamai… Разрешаем агенту отправлять нам
 * заявки»): указатель /llms.txt, текстовые двойники страниц и приём заявок.
 */

const read = (path: string) => readFileSync(path, "utf8");

test("адреса: двойник есть у главной, услуг, кейсов и контактов, у остального нет", () => {
  assert.deepEqual(agentPath("/ru.md"), { locale: "ru", segments: [], md: true });
  assert.deepEqual(agentPath("/ru"), { locale: "ru", segments: [], md: false });
  assert.deepEqual(agentPath("/uz/services/landing-page.md"), { locale: "uz", segments: ["services", "landing-page"], md: true });
  assert.deepEqual(agentPath("/en/cases/samauto"), { locale: "en", segments: ["cases", "samauto"], md: false });
  assert.deepEqual(agentPath("/pl/full.md"), { locale: "pl", segments: ["full"], md: true });
  // «Весь сайт одним файлом» — только текстом: страницы /ru/full на сайте нет.
  assert.equal(agentPath("/ru/full"), null);
  for (const path of ["/admin.md", "/admin/leads.md", "/ru/admin.md", "/ru/partners.md", "/xx.md", "/ru/cases/a/b.md", "/ru/services/../x.md", "/proto/abc.md"]) {
    assert.equal(agentPath(path), null, path);
  }
  assert.equal(agentMdHref("ru"), "/ru.md");
  assert.equal(agentMdHref("uz", ["cases", "samauto"]), "/uz/cases/samauto.md");
});

test("текст отдаётся только тому, кто просит текст, а не страницу", () => {
  assert.equal(wantsMarkdown("text/markdown"), true);
  assert.equal(wantsMarkdown("text/markdown, text/plain;q=0.8"), true);
  assert.equal(wantsMarkdown("text/html,application/xhtml+xml,*/*;q=0.8"), false);
  assert.equal(wantsMarkdown("text/html, text/markdown"), false, "браузер с расширением получает страницу");
  assert.equal(wantsMarkdown("*/*"), false);
  assert.equal(wantsMarkdown(null), false);
});

test("у каждой страницы каждого языка есть двойник без неподставленных значков", () => {
  const segments = agentSegments();
  assert.equal(segments.length, 4 + agentServiceSlugs().length + casesOnSite.length);
  for (const locale of locales) {
    for (const path of segments) {
      const doc = agentPage(locale, path);
      assert.ok(doc, `${locale}/${path.join("/")}: двойника нет`);
      assert.match(doc.body, /^# \S/, `${locale}/${path.join("/")}: нет заголовка`);
      assert.doesNotMatch(doc.body, /\{[a-z]+\}/i, `${locale}/${path.join("/")}: значок не подставлен`);
      assert.doesNotMatch(doc.body, /undefined|\[object Object\]|NaN/, `${locale}/${path.join("/")}`);
    }
  }
  assert.equal(agentPage("ru", ["services", "net-takoy"]), null);
  assert.equal(agentPage("ru", ["cases", "net-takogo"]), null);
  assert.equal(agentPage("ru", ["partners"]), null);
});

test("цены и числа двойника — те же, что на странице для людей", () => {
  for (const locale of locales) {
    for (const meta of LANDINGS) {
      const body = agentPage(locale, ["services", meta.slug])!.body;
      const text = landingText(meta, locale);
      assert.ok(body.includes(landingMoney(calcPrice(meta.calc).uzs, locale).main), `${locale}/${meta.slug}: цена «от»`);
      assert.ok(body.includes(text.lead), `${locale}/${meta.slug}: первый абзац`);
      for (const item of text.faq) assert.ok(body.includes(item.a), `${locale}/${meta.slug}: ответ «${item.q}»`);
      meta.kinds.forEach((kind) => {
        assert.ok(body.includes(landingMoney(calcPrice(kind.calc).uzs, locale).main), `${locale}/${meta.slug}: цена вида работ`);
      });
    }
    const home = agentPage(locale, [])!.body;
    assert.ok(home.includes(`${proof.projects}+`) && home.includes(String(proof.staff)) && home.includes(String(proof.countries)));
    for (const service of services) {
      const body = agentPage(locale, ["services", service.slug])!.body;
      assert.ok(body.length > 400, `${locale}/${service.slug}`);
    }
  }
  // Направление без страницы под запрос — с ценой из content/services.
  const ai = services.find((s) => s.slug === "ai-llm-rag")!;
  assert.ok(agentPage("ru", ["services", "ai-llm-rag"])!.body.includes(`$${ai.priceFromUsd.toLocaleString("en-US")}`));
});

test("слова «прототип» в версии для агентов нет, как и на сайте", () => {
  const word = /прототип|prototyp|prototip|原型/i;
  for (const locale of locales) {
    for (const value of Object.values(agentCopy[locale]).flat()) assert.doesNotMatch(String(value), word, locale);
    for (const path of [[], ["services"], ["contact"], ...LANDINGS.map((l) => ["services", l.slug])]) {
      assert.doesNotMatch(agentPage(locale, path)!.body, word, `${locale}/${path.join("/")}`);
    }
  }
});

test("/llms.txt: заголовок, описание, все ссылки ведут на существующие двойники", () => {
  const index = llmsIndex();
  assert.match(index, /^# DevUz Studio\n\n> /);
  const links = [...index.matchAll(/\]\((https:\/\/[^)]+)\)/g)].map((m) => new URL(m[1]).pathname);
  assert.ok(links.length > 20);
  for (const path of links) {
    if (path === "/llms-full.txt") continue;
    const found = agentPath(path);
    assert.ok(found?.md, `${path}: не двойник`);
    assert.ok(agentPage(found.locale, found.segments), `${path}: страницы нет`);
  }
  for (const locale of locales) assert.ok(index.includes(`/${locale}.md`), `нет указателя языка ${locale}`);
  assert.ok(index.includes(AGENT_LEAD_PATH), "в указателе нет адреса для заявок");
  assert.ok(llmsFull().length > 50_000);
  // В общем файле хвост «как заказать» один, а не на каждой странице.
  assert.equal(llmsFull().split(agentCopy.en.agentTitle).length - 1, 1);
});

test("в каждом двойнике — как агенту оставить заявку, на языке страницы", () => {
  for (const locale of locales) {
    const body = agentPage(locale, ["services", "landing-page"])!.body;
    assert.ok(body.includes(agentCopy[locale].agentTitle), locale);
    assert.ok(body.includes("https://devuz.studio/api/agent/lead") || body.includes(AGENT_LEAD_PATH), locale);
    assert.ok(body.includes("21:00") && body.includes("08:00"), `${locale}: ночные часы бота`);
    assert.equal(agentCopy[locale].agentSteps.length, agentCopy.ru.agentSteps.length, `${locale}: шагов столько же, сколько по-русски`);
  }
});

test("заявка агента: без согласия, контакта и задачи не принимается", () => {
  const ok = { contact: "+998 90 123-45-67", message: "Нужен лендинг для стоматологии", consent: true };
  assert.equal(parseAgentLead(null).ok, false);
  assert.deepEqual(parseAgentLead({ ...ok, consent: "true" }), { ok: false, error: "consent_required" });
  assert.deepEqual(parseAgentLead({ ...ok, consent: undefined }), { ok: false, error: "consent_required" });
  assert.deepEqual(parseAgentLead({ ...ok, contact: " " }), { ok: false, error: "contact_required" });
  assert.deepEqual(parseAgentLead({ ...ok, contact: "напишите мне" }), { ok: false, error: "contact_invalid" });
  assert.deepEqual(parseAgentLead({ ...ok, message: "сайт" }), { ok: false, error: "message_required" });

  const parsed = parseAgentLead({ ...ok, name: "  Азиз ", company: "Dent", locale: "uz", agent: "ChatGPT", extra: "<script>" });
  assert.ok(parsed.ok);
  assert.deepEqual(parsed.lead, {
    name: "Азиз",
    company: "Dent",
    contact: "+998 90 123-45-67",
    contactKind: "phone",
    message: "Нужен лендинг для стоматологии",
    agent: "ChatGPT",
    locale: "uz",
  });
  const unknownLocale = parseAgentLead({ ...ok, locale: "de" });
  assert.ok(unknownLocale.ok && unknownLocale.lead.locale === "ru");
  const long = parseAgentLead({ ...ok, message: "а".repeat(5000) });
  assert.ok(long.ok && long.lead.message.length === 1500);
});

test("заявка агента: заглушка вместо контакта не проходит", () => {
  for (const good of ["+998909120578", "8 (923) 233-00-37", "@aziz_dent", "t.me/aziz_dent", "https://t.me/aziz_dent", "aziz@dent.uz"]) {
    assert.equal(contactLooksReal(good), true, good);
  }
  for (const bad of ["1234567", "0000000000", "123456789", "user@example.com", "phone", "@ab", "+99890", "позвоните", "john@test.local"]) {
    assert.equal(contactLooksReal(bad), false, bad);
  }
});

test("заявка агента — лид со словами «прислал ИИ-агент», без выдуманной квалификации", () => {
  const parsed = parseAgentLead({ contact: "@aziz_dent", message: "Нужен сайт клиники, бюджет до 1000", consent: true, name: "Азиз" });
  assert.ok(parsed.ok);
  assert.equal(agentName(parsed.lead, "Mozilla/5.0 ChatGPT-User"), "Mozilla/5.0 ChatGPT-User");
  assert.equal(agentName({ agent: "Perplexity" }, "curl"), "Perplexity");
  assert.equal(agentName({ agent: "" }, null), "не назвался");
  const input = agentLeadInput(parsed.lead, "ChatGPT");
  assert.equal(input.contact_kind, "telegram");
  assert.equal(input.summary.request, "Нужен сайт клиники, бюджет до 1000");
  assert.deepEqual([input.budget, input.authority, input.need, input.timing], ["B3", "A3", "N3", "T3"]);
  assert.match(input.notes, /ИИ-агент \(ChatGPT\)/);
  assert.match(input.notes, /не проверены/);
  assert.match(input.opening_line, /Азиз/);
});

test("источник «agent» заведён везде, где его читают", () => {
  assert.equal(AGENT_SOURCE, "agent");
  assert.ok(INBOUND_SOURCES.includes(AGENT_SOURCE), "в ступенях заявка агента — входящая");
  assert.equal(leadKindOf({ source: AGENT_SOURCE }), "inbound");
  assert.equal(leadChannelDict.agent.ru, "заявка от ИИ-агента");
  assert.match(read("content/admin-panel/lead-sort.ts"), /src_agent:/);
  assert.match(read("supabase/migrations/0194_lead_source_agent.sql"), /'leadgen', 'agent'\)/);
  const route = read("app/api/agent/lead/route.ts");
  assert.match(route, /saveLead\(lead, \[\], AGENT_SOURCE/);
  assert.match(route, /routeNewLead\(/);
  assert.match(route, /parseAgentLead\(body\)/);
});

test("robots.txt пускает агента к приёму заявок, остальной /api/ закрыт", () => {
  for (const rule of robots().rules as { allow?: string | string[]; disallow?: string | string[] }[]) {
    assert.ok([rule.allow ?? []].flat().includes("/api/agent/"));
    assert.ok([rule.disallow ?? []].flat().includes("/api/"));
  }
  assert.ok(AGENT_LEAD_PATH.startsWith("/api/agent/"));
});

test("middleware: двойник раньше языкового разбора, странице — ссылка на её текст", () => {
  const source = read("middleware.ts");
  const md = source.indexOf("agentPath(pathname)");
  assert.ok(md > 0 && md < source.indexOf("const hasLocale"), "двойник должен разбираться до языка: /ru.md не раздел сайта");
  assert.ok(md > source.indexOf('pathname.startsWith("/admin/")'), "панель — раньше: у неё двойников нет");
  assert.match(source, /rel="alternate"; type="text\/markdown"/);
  const route = read("app/agent-md/[...path]/route.ts");
  assert.match(route, /rel="canonical"/, "двойник называет поисковику страницу для людей");
  assert.match(route, /text\/markdown; charset=utf-8/);
});
