import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { TENDER_TOPICS } from "@/content/razbor/tenders";
import { razborCopy, tenderCopy } from "@/content/razbor/page-copy";
import { getDictionary } from "@/content/dictionaries";
import { services } from "@/content/services";
import { locales } from "@/lib/i18n";
import { SHIFT_SCHEDULE, SHIFT_TITLE } from "@/lib/admin/shift-reports";
import { serviceFor } from "@/lib/razbor/service-link";
import {
  TENDER_NICHE,
  TENDER_SERVICE,
  TENDER_SHIFT,
  nextTopic,
  tashkentWeek,
  tenderDue,
  tenderPool,
  tenderPrice,
  tenderProblems,
  tenderSource,
} from "@/lib/razbor/tender";
import type { RazborArticle } from "@/lib/razbor/store";

/**
 * Тендеры и госконтракты: услуга на главной и тендерный разбор недели.
 *
 * Владелец, 28.09: «На главной… сделай блок тендерные и гос контракты. Туда
 * впиши: составление технических заданий и требований для подрядчиков,
 * работаем как субподрядчики и т. д. Не забудь всё внести в sitemap… 1
 * статья в неделю с разбором должна писаться в общем пуле вкладки
 * „Разборы“».
 */

const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

/* ── Услуга ─────────────────────────────────────────────────────────────── */

test("услуга «Тендеры и госконтракты»: четыре языка, раскрытые пункты на карточке главной", () => {
  const service = services.find((s) => s.slug === TENDER_SERVICE);
  assert.ok(service, "услуги нет — не будет ни карточки на главной, ни страницы, ни строки в sitemap");
  for (const locale of locales) {
    assert.ok(service.seoTitle[locale] && service.seoDescription[locale], `${locale}: нет заголовка для поиска`);
    assert.ok(service.title[locale] && service.description[locale], `${locale}: нет текста`);
    assert.equal(service.bullets[locale].length, service.bullets.ru.length, `${locale}: пунктов меньше`);
    assert.equal(service.highlights?.[locale].length, 4, `${locale}: на карточке не четыре пункта`);
  }
  // То, что владелец назвал словами, — на карточке главной.
  const ru = service.highlights!.ru.join(" ");
  assert.match(ru, /ТЗ и требований к подрядчикам/);
  assert.match(ru, /Субподряд/);

  assert.match(read("components/sections/services.tsx"), /service\.highlights \?/);
  // Владелец: «составление ТЗ от 400 $… добавь, что влияет на стоимость».
  assert.equal(service.priceFromUsd, 400);
  for (const locale of locales) {
    assert.equal(service.priceFactors?.[locale].length, service.priceFactors!.ru.length, `${locale}: факторов цены меньше`);
    assert.ok(getDictionary(locale).services.priceFactors, `${locale}: нет подписи «От чего зависит цена»`);
  }
  assert.match(service.priceFactors!.ru.join(" "), /Архитектура/);
  assert.match(service.priceFactors!.ru.join(" "), /Языки программирования/);
  assert.match(read("app/[locale]/services/[slug]/page.tsx"), /service\.priceFactors \?/);
  assert.equal(getDictionary("ru").services.title, "Шесть направлений");
  // Страница услуги и sitemap собираются из того же списка.
  assert.match(read("app/sitemap.ts"), /\.\.\.services\.map\(\(s\) => \(\{\s*path: `services\/\$\{s\.slug\}`/);
  assert.match(read("app/[locale]/services/[slug]/page.tsx"), /services\.map\(\(service\) => \(\{ locale, slug: service\.slug \}\)\)/);
  // AI-менеджер умеет отметить интерес к тендерам.
  assert.match(read("lib/qualify/tool.ts"), /it-tenders/);
});

test("вопрос про тендеры в FAQ главной — на всех языках", () => {
  for (const locale of locales) {
    const faq = getDictionary(locale).faq.items;
    assert.ok(
      faq.some((item) => /тендер|tender|招标/i.test(item.q)),
      `${locale}: вопроса про тендеры нет`,
    );
  }
});

/* ── Темы разборов ──────────────────────────────────────────────────────── */

test("темы тендерных разборов: уникальные слаги и запросы, влезают в базу", () => {
  const slugs = new Set<string>();
  const queries = new Set<string>();
  const keys = new Set<string>();
  assert.ok(TENDER_TOPICS.length >= 12, "тем меньше, чем на квартал");
  for (const topic of TENDER_TOPICS) {
    assert.ok(!keys.has(topic.key), `ключ ${topic.key} повторяется`);
    keys.add(topic.key);
    for (const side of [topic.ru, topic.uz]) {
      // Те же ограничения, что в 0021_razbors.sql.
      assert.match(side.slug, /^[a-z0-9]+(-[a-z0-9]+)*$/, side.slug);
      assert.ok(side.query.length >= 5 && side.query.length <= 120, side.query);
      assert.ok(side.label.length >= 5 && side.label.length <= 200, side.label);
      assert.ok(!slugs.has(side.slug), `слаг ${side.slug} повторяется`);
      assert.ok(!queries.has(side.query.toLowerCase()), `запрос ${side.query} повторяется`);
      slugs.add(side.slug);
      queries.add(side.query.toLowerCase());
    }
    // Числа в брифе становятся разрешёнными для статьи — их там нет.
    assert.doesNotMatch(topic.brief, /\d/, `${topic.key}: в брифе цифры`);
  }
});

test("следующая тема — первая неразобранная; кончились — null", () => {
  const [first, second] = TENDER_TOPICS;
  assert.equal(nextTopic(() => false)?.key, first.key);
  assert.equal(nextTopic((source) => source === tenderSource(first.key))?.key, second.key);
  assert.equal(nextTopic(() => true), null);
  assert.match(tenderSource(first.key), /^https:\/\/devuz\.studio\/ru\/services\/it-tenders#/);
});

/* ── Раз в неделю ───────────────────────────────────────────────────────── */

test("неделя по Ташкенту: с понедельника по воскресенье", () => {
  // 28.09.2026 — понедельник.
  assert.equal(tashkentWeek(new Date("2026-09-28T04:00:00Z")), "2026-09-28");
  // Воскресенье 23:00 по Ташкенту — ещё та же неделя.
  assert.equal(tashkentWeek(new Date("2026-10-04T18:00:00Z")), "2026-09-28");
  // Понедельник 00:30 по Ташкенту (а в UTC ещё воскресенье) — уже следующая.
  assert.equal(tashkentWeek(new Date("2026-10-04T19:30:00Z")), "2026-10-05");
});

test("статья — одна в неделю, не раньше 08:33, и в любой день, если понедельник пропал", () => {
  const monday0900 = new Date("2026-09-28T04:00:00Z"); // 09:00 Ташкент
  const monday0800 = new Date("2026-09-28T03:00:00Z"); // 08:00 Ташкент
  const wednesday = new Date("2026-09-30T06:00:00Z");
  assert.equal(tenderDue(monday0900, null), true);
  assert.equal(tenderDue(monday0800, null), false, "раньше ежедневной смены с запасом");
  assert.equal(tenderDue(wednesday, monday0900.toISOString()), false, "вторая статья за неделю");
  assert.equal(tenderDue(wednesday, "2026-09-21T04:00:00Z"), true, "неделя без статьи — пишем в среду");
});

/* ── Проверка статьи ────────────────────────────────────────────────────── */

const article = (patch: Partial<RazborArticle> = {}): RazborArticle => ({
  title: "Техническое задание на сайт госоргана: что обычно упускают",
  description: "Разбор типового ТЗ.",
  label: "сайт",
  query: "техническое задание на сайт госоргана",
  intro: ["Закупают сайт организации.", "ТЗ по ГОСТ 34 решает исход."],
  findings: [
    { title: "Нет ролей в админке", impact: "Спор на приёмке.", fix: "Описать роли." },
    { title: "Нет требований к хостингу", impact: "Сайт падает.", fix: "Указать нагрузку." },
    { title: "Приёмка по внешнему виду", impact: "Спор.", fix: "Сценарии испытаний." },
  ],
  outcome: ["Меньше споров."],
  price: tenderPrice("ru"),
  ...patch,
});

test("тендерная статья: чисел не из брифа и процентов нет, пунктов не меньше трёх", () => {
  const topic = TENDER_TOPICS[0];
  const pool = tenderPool(topic, "ru");
  assert.deepEqual(tenderProblems(article(), pool), []);

  const invented = tenderProblems(article({ intro: ["Контракты на 500 миллионов сумов."] }), pool);
  assert.deepEqual(invented.map((p) => p.code), ["invented"]);

  const percent = tenderProblems(article({ outcome: ["Экономия 30 %"] }), pool).map((p) => p.code);
  assert.ok(percent.includes("percent"));

  const thin = tenderProblems(article({ findings: article().findings.slice(0, 2) }), pool);
  assert.deepEqual(thin.map((p) => p.code), ["thin"]);
});

test("цена в статье — из услуги, а не из головы модели", () => {
  const service = services.find((s) => s.slug === TENDER_SERVICE)!;
  assert.ok(tenderPrice("ru").includes(`$${service.priceFromUsd}`));
  assert.ok(tenderPrice("uz").includes(`$${service.priceFromUsd}`));
});

/* ── Путь статьи ────────────────────────────────────────────────────────── */

test("тендерный разбор — в тот же пул, на проверку, со своими отметками", () => {
  const run = read("lib/razbor/tender-run.ts");
  assert.match(run, /await saveDraft\(\{\s*category: TENDER_NICHE,/, "статья не в общей таблице разборов");
  assert.match(run, /\.eq\("shift", TENDER_SHIFT\)/);
  assert.match(run, /job: TENDER_SHIFT, day: tashkentWeek\(now\)/);
  assert.match(run, /from\("shift_reports"\)\.insert\(\{ shift: TENDER_SHIFT/);
  // Имя «razbor» ежедневная смена прочла бы как свой отчёт и пропустила бы день.
  assert.notEqual(TENDER_SHIFT, "razbor");
  assert.ok(SHIFT_TITLE[TENDER_SHIFT]);
  assert.ok(!SHIFT_SCHEDULE.some((e) => e.shift === TENDER_SHIFT));

  const sweep = read("app/api/reminders/sweep/route.ts");
  assert.match(sweep, /after\(async \(\) => \{\s*const tender = await runTenderShift\(new Date\(\)\)/);

  // Съёмка не фотографирует служебный адрес темы как «сайт как есть».
  const shots = read("scripts/razbor-shots.mjs");
  assert.match(shots, new RegExp(`const TENDER_NICHE = "${TENDER_NICHE}";`));
  assert.match(shots, /\.neq\("category", TENDER_NICHE\)/);
});

test("страница тендерного разбора: свои подписи, ссылка на услугу тендеров, призыв — в контакты", () => {
  assert.equal(serviceFor(TENDER_NICHE), TENDER_SERVICE);
  for (const locale of ["ru", "uz"] as const) {
    for (const key of Object.keys(tenderCopy[locale])) {
      assert.ok(key in razborCopy[locale], `${locale}: подписи ${key} нет в общих`);
    }
    assert.deepEqual(Object.keys(tenderCopy[locale]).sort(), Object.keys(tenderCopy.ru).sort());
    assert.match(razborCopy[locale].lead, /тендер|tender/i, `${locale}: раздел не говорит о тендерных разборах`);
  }
  const page = read("app/[locale]/razbor/[slug]/page.tsx");
  assert.match(page, /const copy = tender \? \{ \.\.\.razborCopy\[locale\], \.\.\.tenderCopy\[locale\] \}/);
  assert.match(page, /href=\{tender \? `\/\$\{locale\}\/contact` : `\/\$\{locale\}\/audit`\}/);
});
