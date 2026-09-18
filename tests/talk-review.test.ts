/**
 * Надзиратель: что он вправе утверждать, а что нет.
 *
 * Владелец: «чтобы чаты мониторились арбитром или надзирателем, на основании
 * ответов клиентов строились разные подходы… в идеале самообучающаяся
 * модель».
 *
 * Главная опасность тут не в том, что разбор выйдет слабым, а в том, что он
 * выйдет уверенным. Модель, которую попросили сделать вывод, сделает его из
 * одной реплики и напишет так, что не отличишь от настоящего. Дальше этот
 * вывод ляжет в копилку рядом с настоящими и будет учить систему на шуме.
 * Поэтому уверенность здесь проверяется не словом модели, а длиной
 * разговора.
 */
import { test } from "node:test";
import assert from "node:assert/strict";

import { ENOUGH_TURNS, cleanReview, outcomeOf, reviewPrompt } from "@/lib/talk/review";

test("исход считается по базе, а не со слов модели", () => {
  // Чем кончился разговор, мы знаем точно. Спрашивать об этом ту же модель,
  // которая его вела, — значит впустить мнение туда, где есть факт.
  assert.equal(outcomeOf({ aiHandling: true, handoverReason: null, turns: 3 }), "talking");
  assert.equal(
    outcomeOf({ aiHandling: false, handoverReason: "просил больше не писать", turns: 1 }),
    "refused",
  );
  assert.equal(
    outcomeOf({ aiHandling: false, handoverReason: "просит человека — звонок или менеджера", turns: 2 }),
    "asked_human",
  );
  assert.equal(
    outcomeOf({ aiHandling: false, handoverReason: "первичка закрыта, дальше человек", turns: 6 }),
    "qualified",
  );
  // Всё прочее — заглохло. В том числе «ответ модели не прошёл проверку»:
  // для копилки это разговор, который ничем не кончился.
  assert.equal(
    outcomeOf({ aiHandling: false, handoverReason: "ответ модели не прошёл проверку", turns: 1 }),
    "stalled",
  );
});

test("урок из короткого разговора стирается, чем бы модель его ни обосновала", () => {
  const confident = {
    hook: "Цена",
    objection: "Дорого",
    failed: "Мы предложили созвон слишком рано",
    lesson: "Никогда не предлагать созвон в первом письме",
    confidence: "high" as const,
  };

  // Одна реплика — это реакция, а не переписка. Вывести из неё «подход к
  // общению» значит принять случайность за закономерность.
  const weak = cleanReview(confident, 1);
  assert.equal(weak.lesson, "", "урок из одной реплики остался в копилке");
  assert.equal(weak.confidence, "low", "модель назвала себя уверенной, и ей поверили");

  // Наблюдения при этом сохраняются: они про эту переписку, а не про все
  // будущие, и врать в них нечем.
  assert.equal(weak.hook, "Цена");
  assert.equal(weak.objection, "Дорого");

  // А с двух реплик урок уже настоящий.
  const strong = cleanReview(confident, ENOUGH_TURNS);
  assert.equal(strong.lesson, "Никогда не предлагать созвон в первом письме");
  assert.equal(strong.confidence, "high");
});

test("модель может признать, что учиться нечему", () => {
  const empty = cleanReview({ hook: "", objection: "", failed: "", lesson: "", confidence: "low" }, 5);
  assert.deepEqual(empty, { hook: "", objection: "", failed: "", lesson: "", confidence: "low" });

  // И мусор вместо ответа не роняет разбор.
  const junk = cleanReview(null, 3);
  assert.equal(junk.lesson, "");
  assert.equal(junk.confidence, "low");
});

test("на разбор уходит переписка целиком, а не пересказ", () => {
  const prompt = reviewPrompt({
    host: "namuna.uz",
    niche: "mebel",
    lang: "uz",
    outcome: "refused",
    thread: [
      { direction: "out", body: "Assalomu alaykum. Saytingizni ko'rib chiqdik." },
      { direction: "in", body: "Kerak emas" },
    ],
  });

  assert.match(prompt, /namuna\.uz/);
  assert.match(prompt, /МЫ: Assalomu alaykum/, "нашей реплики нет в ленте");
  assert.match(prompt, /КЛИЕНТ: Kerak emas/, "реплики клиента нет в ленте");
  assert.match(prompt, /отказался/, "исход не назван");
});

test("правила надзирателя записаны там, где их прочитает модель", async () => {
  const { readFileSync } = await import("node:fs");
  const src = readFileSync(new URL("../lib/talk/review.ts", import.meta.url), "utf8");

  // Выдуманный урок хуже отсутствующего: он попадёт в копилку и будет
  // учить систему на шуме.
  assert.match(src, /Пустой урок лучше выдуманного/);
  // Урок обязан быть выполнимым, иначе он не урок, а лозунг.
  assert.match(src, /«Быть убедительнее» выполнить нельзя/);
  // Балла нет намеренно.
  assert.ok(!/score|балл/i.test(src.replace(/Чего здесь нет[\s\S]{0,400}/, "")), "в разборе завёлся балл");
});

test("уроки пока только копятся — это сказано человеку, а не подразумевается", async () => {
  const { readFileSync } = await import("node:fs");
  const page = readFileSync(new URL("../app/admin/talks/page.tsx", import.meta.url), "utf8");
  assert.match(page, /никуда не подмешиваются/, "страница не говорит, что обучение не включено");

  // И в промпт первого письма копилка действительно не заглядывает.
  const outreach = readFileSync(new URL("../lib/admin/outreach.ts", import.meta.url), "utf8");
  assert.ok(!/talk_reviews|listReviews|lesson/.test(outreach), "уроки уже подмешиваются в письмо");
});

test("урок про этого клиента — не урок, а задача", () => {
  // Первый же живой разбор это и выдал: по gh.uz надзиратель написал
  // «отправляй разбор на info@gh.uz, адресуй отделу маркетинга». Выполнимо,
  // верно и бесполезно: следующему адресату это не говорит ничего, а в
  // копилке выглядело бы как вывод.
  const task = {
    hook: "Нет цен на сайте",
    objection: "Пришлите разбор, рассмотрим",
    failed: "",
    lesson: "Отправляй разбор на info@gh.uz, адресуй отделу маркетинга",
    confidence: "high" as const,
  };
  const cleaned = cleanReview(task, 2, "gh.uz");
  assert.equal(cleaned.lesson, "", "урок про одного клиента остался в копилке");
  assert.equal(cleaned.confidence, "low");
  // Наблюдения при этом целы: они и должны быть про этот разговор.
  assert.equal(cleaned.hook, "Нет цен на сайте");

  // Домен в тексте — тот же признак.
  assert.equal(cleanReview({ ...task, lesson: "Писать на сайт namuna.uz письмо короче" }, 3, "namuna.uz").lesson, "");
  // И @адрес: урок, где назван конкретный собеседник, — про него одного.
  assert.equal(cleanReview({ ...task, lesson: "Отвечать @muradbuildings быстрее" }, 3, "mbc.uz").lesson, "");

  // А переносимый урок проходит.
  const real = cleanReview(
    {
      ...task,
      lesson: "Если отвечает корпоративный аккаунт, а не владелец, — не звать на созвон, а спрашивать, кому адресовать разбор",
    },
    3,
    "gh.uz",
  );
  assert.match(real.lesson, /корпоративный аккаунт/);
  assert.equal(real.confidence, "high");
});

test("отказ базы поднимается наружу, а не превращается в «разбирать нечего»", async () => {
  const { readFileSync } = await import("node:fs");
  const store = readFileSync(new URL("../lib/talk/review-store.ts", import.meta.url), "utf8");

  // Первая версия просила у таблицы колонку `facts`, которой там нет.
  // PostgREST отвечал отказом, data приходил пустым — и надзиратель молча не
  // видел ни одной переписки. Снаружи это выглядело как «разбирать нечего», и
  // отличить одно от другого было нельзя.
  assert.ok(!/select\("[^"]*facts/.test(store), "в запросе снова колонка, которой нет в таблице");
  assert.match(store, /if \(error\) throw new Error/, "отказ базы по-прежнему глотается");
  assert.match(store, /разбор не сохранился/, "несохранённый разбор проходит молча");

  // Свип обязан показать такую ошибку, а не считать проход удачным.
  const run = readFileSync(new URL("../lib/talk/review-run.ts", import.meta.url), "utf8");
  assert.match(run, /run\.errors\.push\(`очередь разборов/);
});
