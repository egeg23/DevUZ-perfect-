import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { MARKETING_TOPICS, nextMarketingTopic } from "@/content/marketing-topics";
import {
  AD_COMMISSION,
  AD_VAT,
  MARKETING_PATH,
  channels,
  marketingCopy,
  projects,
} from "@/content/marketing";
import { locales } from "@/lib/i18n";
import { checkArticle, missingStems, numbersIn } from "@/lib/marketing/article-check";
import { ARTICLE_HOURS, articlePrompt, dueSlots } from "@/lib/marketing/articles-run";
import { articleHref, isArticleLocale, parseText, type ArticleText } from "@/lib/marketing/articles-store";
import { estimateMarketing } from "@/lib/marketing/estimate";

/**
 * Раздел «Маркетинг»: калькулятор, предложение «сайт + маркетинг» и статьи,
 * которые выходят сами.
 *
 * Главное здесь — проверка статей. Человек их до публикации не читает, и
 * если проверка пропустит придуманную цифру, она окажется на сайте студии
 * от её имени.
 */

const ROOT = new URL("../", import.meta.url);
const read = (file: string) => readFileSync(new URL(file, ROOT), "utf8");

const CYRILLIC = /[Ѐ-ӿ]/;

test("калькулятор: работа, бюджет, НДС рекламных систем и комиссия", () => {
  const result = estimateMarketing({ picked: ["target"], context: "none", budget: 6_500_000 });
  assert.ok(result);
  const target = channels.find((c) => c.id === "target")!;
  assert.equal(result.monthly, target.monthly);
  assert.equal(result.first, target.first);
  assert.equal(result.adBudget, 6_500_000);
  assert.equal(result.vat, Math.round(6_500_000 * AD_VAT));
  assert.equal(result.commission, Math.round(6_500_000 * AD_COMMISSION));
  assert.equal(result.monthlyTotal, target.monthly + 6_500_000 + result.vat + result.commission);
  assert.equal(AD_VAT, 0.12, "НДС рекламных систем — 12% (владелец, 04.10.2026)");
});

test("калькулятор: без рекламного канала бюджета нет", () => {
  const result = estimateMarketing({ picked: ["smm", "seo"], context: "none", budget: 6_500_000 });
  assert.ok(result);
  assert.equal(result.adBudget, 0);
  assert.equal(result.vat, 0);
  assert.equal(result.monthlyTotal, result.monthly);
});

test("калькулятор: контекст — один из двух вариантов, пустой выбор — нет расчёта", () => {
  const both = estimateMarketing({ picked: ["context-google"], context: "both", budget: 0 });
  assert.deepEqual(both?.lines.map((c) => c.id), ["context-both"]);
  assert.equal(estimateMarketing({ picked: [], context: "none", budget: 0 }), null);
});

test("цены и тексты на всех шести языках", () => {
  for (const item of [...channels, ...projects]) {
    for (const locale of locales) {
      assert.ok(item.title[locale]?.trim(), `${item.id}: нет названия на ${locale}`);
      assert.ok(item.note[locale]?.trim(), `${item.id}: нет описания на ${locale}`);
    }
  }
  for (const locale of locales) {
    const copy = marketingCopy[locale];
    assert.ok(copy.seoTitle.length <= 95, `${locale}: заголовок для выдачи длинный`);
    assert.ok(copy.seoDescription.length >= 100 && copy.seoDescription.length <= 260, `${locale}: описание для выдачи`);
    assert.equal(copy.faq.length, marketingCopy.ru.faq.length, `${locale}: вопросов не столько, сколько по-русски`);
  }
  for (const locale of ["uz", "pl", "en", "zh"] as const) {
    const text = JSON.stringify(marketingCopy[locale]);
    assert.ok(!CYRILLIC.test(text), `${locale}: кириллица в текстах страницы`);
  }
});

test("предложение «сайт + маркетинг»: исправления и SEO-доработки бесплатно", () => {
  for (const locale of locales) {
    const { utp } = marketingCopy[locale];
    assert.ok(utp.title && utp.text && utp.fine, `${locale}: предложение без текста`);
  }
  assert.match(marketingCopy.ru.utp.title, /бесплатно/);
  assert.match(marketingCopy.ru.utp.fine, /3 месяцев/);
});

test("чужое агентство на сайте не названо", () => {
  for (const file of ["content/marketing.ts", "content/marketing-topics.ts", "lib/marketing/articles-run.ts"]) {
    assert.ok(!/the agency/i.test(read(file)), `${file}: упомянуто агентство`);
  }
});

test("страница в меню, в подвале, на главной и в карте сайта", () => {
  const header = read("components/layout/header.tsx");
  assert.match(header, /\{ href: localeHref\(locale, "marketing"\), label: dict\.nav\.marketing \}/);
  assert.match(header, /label: dict\.nav\.contacts, mobileOnly: true/);
  assert.match(read("components/layout/footer.tsx"), /localeHref\(locale, "marketing"\)/);
  assert.match(read("app/[locale]/page.tsx"), /<MarketingSection locale=\{locale\} \/>/);
  const sitemap = read("app/sitemap.ts");
  assert.match(sitemap, /path: MARKETING_PATH/);
  assert.match(sitemap, /articleEntries/);
  assert.equal(MARKETING_PATH, "marketing");
});

test("статьи — только на русском и узбекском, адреса строятся одним местом", () => {
  assert.equal(isArticleLocale("ru"), true);
  assert.equal(isArticleLocale("uz"), true);
  assert.equal(isArticleLocale("en"), false);
  assert.equal(articleHref("ru", "keys-old-spice"), "/ru/marketing/articles/keys-old-spice");
  assert.equal(articleHref("uz"), "/uz/marketing#articles");
});

test("темы: ключи и адреса уникальны, у кейса есть факты и источник", () => {
  const keys = new Set(MARKETING_TOPICS.map((t) => t.key));
  const slugs = new Set(MARKETING_TOPICS.map((t) => t.slug));
  assert.equal(keys.size, MARKETING_TOPICS.length, "повтор ключа темы");
  assert.equal(slugs.size, MARKETING_TOPICS.length, "повтор адреса статьи");
  assert.ok(MARKETING_TOPICS.length >= 100, "тем меньше чем на полтора месяца");
  for (const topic of MARKETING_TOPICS) {
    assert.match(topic.slug, /^[a-z0-9-]{3,120}$/, `${topic.key}: адрес не латиницей`);
    if (topic.kind === "case") {
      assert.ok(topic.facts?.length, `${topic.key}: кейс без фактов`);
      assert.match(topic.source ?? "", /^https:\/\/en\.wikipedia\.org\/wiki\//, `${topic.key}: нет источника`);
    }
  }
  // По очереди: объяснение, кейс, ошибка, ниша — объяснения первыми.
  assert.deepEqual(MARKETING_TOPICS.slice(0, 4).map((t) => t.kind), ["explainer", "case", "mistake", "niche"]);
  assert.equal(nextMarketingTopic(new Set([MARKETING_TOPICS[0].key]))?.key, MARKETING_TOPICS[1].key);
  assert.equal(nextMarketingTopic(new Set(MARKETING_TOPICS.map((t) => t.key))), null);
});

test("ошибки и ниши — без статистики в самой теме", () => {
  for (const topic of MARKETING_TOPICS.filter((t) => t.kind !== "case")) {
    assert.ok(!topic.brief.includes("%"), `${topic.key}: процент в теме`);
    assert.ok(!numbersIn(topic.brief).some((n) => n.length >= 2), `${topic.key}: число в теме`);
  }
});

test("две статьи в день: в 10:00 и 16:00 по Ташкенту", () => {
  assert.deepEqual([...ARTICLE_HOURS], [10, 16]);
  // 04:59 UTC = 09:59 в Ташкенте — ещё рано.
  assert.deepEqual(dueSlots(new Date("2026-10-04T04:59:00Z")), []);
  assert.deepEqual(dueSlots(new Date("2026-10-04T05:00:00Z")), [1]);
  assert.deepEqual(dueSlots(new Date("2026-10-04T11:00:00Z")), [1, 2]);
});

test("недорогая модель по умолчанию, переменная доезжает до контейнера", () => {
  const run = read("lib/marketing/articles-run.ts");
  assert.match(run, /process\.env\.ARTICLE_MODEL \|\| "claude-haiku-4-5"/);
  assert.match(read("docker-compose.yml"), /ARTICLE_MODEL: \$\{ARTICLE_MODEL:-\}/);
  assert.match(read("app/api/reminders/sweep/route.ts"), /runMarketingArticles\(new Date\(\)\)/);
});

const caseTopic = MARKETING_TOPICS.find((t) => t.key === "case:dollar-shave-club")!;
const mistakeTopic = MARKETING_TOPICS.find((t) => t.kind === "mistake")!;

function article(paragraph: string, locale: "ru" | "uz" = "ru"): ArticleText {
  const base =
    locale === "ru"
      ? "Это абзац статьи о маркетинге для малого бизнеса в Узбекистане, достаточно длинный для проверки длины текста целиком. "
      : "Bu O‘zbekistondagi kichik biznes uchun marketing haqidagi maqola xatboshisi, matn uzunligini tekshirish uchun yetarli. ";
  return {
    title: locale === "ru" ? "Как Dollar Shave Club продал бритвы роликом" : "Dollar Shave Club roliki bilan qanday sotdi",
    description:
      locale === "ru"
        ? "Разбор известной кампании: что сработало и как применить этот приём малому бизнесу в Узбекистане."
        : "Mashhur kampaniya tahlili: nima ishladi va bu usulni O‘zbekistondagi kichik biznesga qanday qo‘llash mumkin.",
    paragraphs: [paragraph, base.repeat(3), base.repeat(3), base.repeat(2)],
    tips: locale === "ru"
      ? ["Сформулируйте предложение одной фразой.", "Покажите характер бренда.", "Ведите рекламу на понятное действие."]
      : ["Taklifni bitta jumlada ayting.", "Brend xarakterini ko‘rsating.", "Reklamani tushunarli harakatga olib boring."],
  };
}

test("кейс: числа из фактов проходят, придуманные — нет", () => {
  const ok = article("В 2012 году ролик обошёлся примерно в $4 500, а за двое суток пришло около 12 000 заказов.");
  assert.deepEqual(checkArticle(caseTopic, "ru", ok), []);
  const bad = article("После ролика продажи выросли в 7 раз, а подписчиков стало 250 000.");
  const problems = checkArticle(caseTopic, "ru", bad).map((p) => p.text).join(" ");
  assert.match(problems, /250000/);
  assert.match(problems, /7/);
});

test("ошибка: ни процентов, ни сумм, ни годов", () => {
  for (const text of [
    "Без пикселя реклама теряет до 40% заявок.",
    "Настройка стоит около $300 в месяц.",
    "Исследование 2023 года показало, что это важно.",
  ]) {
    assert.ok(checkArticle(mistakeTopic, "ru", article(text)).length > 0, `пропущено: ${text}`);
  }
  assert.deepEqual(checkArticle(mistakeTopic, "ru", article("Сделайте 3 креатива и отвечайте в течение 15 минут.")), []);
});

test("узбекская версия — без кириллицы; ссылки и чужое агентство — нельзя", () => {
  const uz = article("Bu maqola xatboshisi, marketing haqida yetarlicha uzun matn. Bu maqola xatboshisi, marketing haqida.", "uz");
  assert.deepEqual(checkArticle(mistakeTopic, "uz", uz), []);
  const mixed = { ...uz, tips: [...uz.tips.slice(0, 2), "Сделайте это сегодня."] };
  assert.ok(checkArticle(mistakeTopic, "uz", mixed).some((p) => /кириллица/.test(p.text)));
  const linked = article("Подробнее на https://example.com — там всё расписано для владельцев бизнеса.");
  assert.ok(checkArticle(mistakeTopic, "ru", linked).length > 0);
  const named = article("Так советует The Agency, и это правильный подход для бизнеса в Ташкенте.");
  assert.ok(checkArticle(mistakeTopic, "ru", named).length > 0);
});

test("огрызок вместо статьи не проходит", () => {
  const short: ArticleText = { title: "Коротко", description: "Мало.", paragraphs: ["Один абзац."], tips: [] };
  assert.ok(checkArticle(mistakeTopic, "ru", short).length >= 4);
  assert.equal(parseText({ title: "", paragraphs: [] }), null);
});

test("задание модели: факты кейса внутри, замечания проверки — при повторе", () => {
  const prompt = articlePrompt(caseTopic, { notes: [{ locale: "ru", text: "Числа, которых нет в фактах темы: 7." }] });
  for (const fact of caseTopic.facts ?? []) assert.ok(prompt.includes(fact));
  assert.match(prompt, /не прошла проверку/);
  assert.match(prompt, /Язык версии: русский/);
  assert.match(articlePrompt(mistakeTopic), /Без статистики/);
});

test("узбекская версия пишется по готовой русской, отдельным вызовом", () => {
  const base = article("Это первый абзац русской версии статьи.");
  const prompt = articlePrompt(caseTopic, { locale: "uz", base });
  assert.match(prompt, /Язык версии: узбекский, латиницей/);
  assert.ok(prompt.includes(base.title));
  for (const p of base.paragraphs) assert.ok(prompt.includes(p));
  // Одна версия за вызов: схема инструмента плоская, без вложенных ru/uz.
  const run = read("lib/marketing/articles-run.ts");
  assert.match(run, /writeChecked\(topic, "ru", null, /);
  assert.match(run, /writeChecked\(topic, "uz", ru, /);
  assert.doesNotMatch(run, /properties: \{ ru: /);
});

test("ответ модели разбирается, даже если поля пришли строкой JSON", () => {
  const text = parseText({
    title: "Заголовок статьи",
    description: "Описание",
    paragraphs: JSON.stringify(["Первый абзац.", "Второй абзац."]),
    tips: "Совет один.\n\nСовет два.",
  });
  assert.deepEqual(text?.paragraphs, ["Первый абзац.", "Второй абзац."]);
  assert.deepEqual(text?.tips, ["Совет один.", "Совет два."]);
  const whole = parseText(JSON.stringify({ title: "Т", description: "", paragraphs: ["А"], tips: [] }));
  assert.equal(whole?.title, "Т");
  assert.equal(parseText("просто текст"), null);
});

test("статья на сайте: Article и хлебные крошки, связка ru ↔ uz, ссылка на калькулятор", () => {
  const page = read("app/[locale]/marketing/articles/[slug]/page.tsx");
  assert.match(page, /"@type": "Article"/);
  assert.match(page, /breadcrumbSchema\(/);
  assert.match(page, /alternates: \{ ru: path, uz: path \}/);
  assert.match(page, /#calculator/);
  const section = read("app/[locale]/marketing/page.tsx");
  assert.match(section, /faqSchema\(faq\)/);
  assert.match(section, /"OfferCatalog"/);
  assert.match(section, /id="articles"/);
});

test("объяснения — под запросы из поиска, на обоих языках", () => {
  const explainers = MARKETING_TOPICS.filter((t) => t.kind === "explainer");
  assert.ok(explainers.length >= 10, "объяснений меньше десяти");
  for (const topic of explainers) {
    assert.ok(topic.query?.ru && topic.query?.uz, `${topic.key}: нет запроса на одном из языков`);
    assert.ok(!/[\u0400-\u04FF]/.test(topic.query.uz ?? ""), `${topic.key}: узбекский запрос кириллицей`);
  }
  const keys = explainers.map((t) => t.key);
  for (const want of ["explainer:smm", "explainer:target", "explainer:seo", "explainer:tashkent-ads"]) {
    assert.ok(keys.includes(want), `нет темы ${want}`);
  }
  // Ниши — тоже под запрос «продвижение … в …».
  const niche = MARKETING_TOPICS.find((t) => t.kind === "niche");
  assert.match(niche?.query?.ru ?? "", /^продвижение /);
});

test("запрос — в заголовке, описании и первом абзаце, по началу слова", () => {
  assert.deepEqual(missingStems("реклама в Ташкенте", "Рекламы в Ташкенте: что работает"), []);
  assert.deepEqual(missingStems("продвижение стоматологии в Instagram", "Как продвигать стоматологию в Instagram"), []);
  assert.deepEqual(missingStems("SMM nima", "SMM nima va u biznesga nima beradi"), []);
  assert.deepEqual(missingStems("что такое SMM", "Таргет для бизнеса"), ["smm"]);

  const smm = MARKETING_TOPICS.find((t) => t.key === "explainer:smm")!;
  const good = article("SMM — это ведение соцсетей бизнеса так, чтобы они приводили клиентов, а не просто собирали лайки.");
  const ok = { ...good, title: "Что такое SMM и что он даёт бизнесу", description: "Что такое SMM простыми словами: из чего состоит работа, когда ждать результата и как понять, что он работает." };
  assert.deepEqual(checkArticle(smm, "ru", ok), []);
  const off = { ...ok, title: "Соцсети для бизнеса: с чего начать работу" };
  assert.ok(checkArticle(smm, "ru", off).some((p) => /нет в заголовке/.test(p.text)));
  assert.match(articlePrompt(smm, { locale: "uz" }), /Поисковый запрос, под который пишется версия: «SMM nima»/);
});

test("перед статьёй — Google Trends и Вордстат по Узбекистану", async () => {
  const { mergeRelated, trendsJson, WORDSTAT_UZ, TRENDS_GEO } = await import("@/lib/seo/keywords");
  assert.equal(TRENDS_GEO, "UZ");
  assert.equal(WORDSTAT_UZ, 171);
  // Защитная строка Trends перед JSON.
  assert.deepEqual(trendsJson(")]}'\n{\"a\":1}"), { a: 1 });
  // Сначала Вордстат, потом Trends; без повторов и без самого запроса.
  const merged = mergeRelated(
    "smm nima",
    { ok: true, phrases: [{ phrase: "SMM nima", value: 9 }, { phrase: "smm kurslari", value: 5 }] },
    { ok: false, reason: "нет токена" },
    { ok: true, phrases: [{ phrase: "smm kurslari", value: 50 }, { phrase: "smm marketing", value: 40 }] },
  );
  assert.deepEqual(merged, ["smm kurslari", "smm marketing"]);

  // Все генераторы статей спрашивают оба источника и передают модели.
  const run = read("lib/marketing/articles-run.ts");
  assert.match(run, /keywordResearch\(ruQuery\)/);
  assert.match(run, /keywordResearch\(uzQuery\)/);
  assert.match(run, /research,\n\s+\}\);/, "ответ источников пишется в строку статьи");
  assert.match(articlePrompt(MARKETING_TOPICS[0], { related: ["smm kurslari"] }), /Google Trends и Вордстат\): «smm kurslari»/);
  assert.match(read("lib/razbor/shift-run.ts"), /keywordResearch\(queryFor\(/);
  assert.match(read("lib/razbor/tender-run.ts"), /keywordResearch\(topic\[locale\]\.query\)/);
  // Правило — в CLAUDE.md, чтобы его видела и ручная работа.
  assert.match(read("CLAUDE.md"), /## Статьи — под живые запросы и недорогой моделью/);
});
