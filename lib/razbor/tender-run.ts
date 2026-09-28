import Anthropic from "@anthropic-ai/sdk";

import type { TenderTopic } from "@/content/razbor/tenders";
import { anthropic } from "@/lib/model-road";
import type { RazborLocale } from "@/lib/razbor/model";
import {
  TENDER_NICHE,
  TENDER_SHIFT,
  nextTopic,
  tashkentWeek,
  tenderDue,
  tenderPool,
  tenderPrice,
  tenderProblems,
  tenderSource,
} from "@/lib/razbor/tender";
import { coveredHashes, saveDraft, sourceHash, type RazborArticle } from "@/lib/razbor/store";
import { serviceClient } from "@/lib/supabase";

const MODEL = process.env.RAZBOR_MODEL || process.env.ANTHROPIC_MODEL || "claude-opus-5";

/**
 * Тендерный разбор недели — на сервере, рядом с ежедневной сменой.
 *
 * Ходит тем же свипом раз в пять минут, раз в неделю работает: берёт
 * следующую тему из content/razbor/tenders.ts, пишет статью на двух языках
 * и кладёт её на проверку во вкладку «Разборы». Публикует человек — как и
 * разбор сайта.
 *
 * Отметки у смены свои: отчёт с `shift: "razbor-tender"` и неделя в
 * daily_claims. Возьми она имя «razbor», ежедневная смена прочитала бы её
 * отчёт как свой и пропустила бы день.
 */

export type TenderRun = {
  ran: boolean;
  topic: string | null;
  drafted: boolean;
  errors: string[];
};

const EMPTY: TenderRun = { ran: false, topic: null, drafted: false, errors: [] };

async function lastTenderAt(): Promise<string | null> {
  const db = serviceClient();
  if (!db) return null;
  const { data } = await db
    .from("shift_reports")
    .select("created_at")
    .eq("shift", TENDER_SHIFT)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data?.created_at ? String(data.created_at) : null;
}

/** Забрать неделю: отметка в начале, чтобы второй проход свипа не начал ту же статью. */
async function claimWeek(now: Date): Promise<"ok" | "taken" | string> {
  const db = serviceClient();
  if (!db) return "база недоступна";
  const { data, error } = await db
    .from("daily_claims")
    .upsert({ job: TENDER_SHIFT, day: tashkentWeek(now) }, { onConflict: "job,day", ignoreDuplicates: true })
    .select("job");
  if (error) return `смена не взяла неделю: ${error.message}`;
  return data?.length ? "ok" : "taken";
}

/** `force` — запуск руками (scripts/razbor-shift.mjs --tender), в обход недели. */
export async function runTenderShift(now = new Date(), force = false): Promise<TenderRun> {
  const db = serviceClient();
  if (!db) return EMPTY;
  if (!force && !tenderDue(now, await lastTenderAt())) return EMPTY;
  if (!force) {
    const claim = await claimWeek(now);
    if (claim === "taken") return EMPTY;
    if (claim !== "ok") return { ...EMPTY, errors: [claim] };
  }

  const run: TenderRun = { ran: true, topic: null, drafted: false, errors: [] };
  const covered = await coveredHashes();
  const topic = nextTopic((source) => covered.has(sourceHash(source)));
  if (!topic) {
    await report(run, "Темы кончились: все темы из content/razbor/tenders.ts уже разобраны. Добавьте новые — и статья выйдет на следующей неделе.");
    return run;
  }
  run.topic = topic.key;

  try {
    const ru = await writeChecked(topic, "ru");
    const uz = typeof ru === "string" ? ru : await writeChecked(topic, "uz");
    if (typeof ru === "string" || typeof uz === "string") {
      run.errors.push(typeof ru === "string" ? `ru: ${ru}` : `uz: ${uz}`);
    } else {
      const id = await saveDraft({
        category: TENDER_NICHE,
        nicheWords: null,
        // Город и страна обязательны в строке разбора. Закупки — по
        // Узбекистану, и в тексте город не участвует: подпись и запрос у
        // темы свои.
        city: "tashkent",
        country: "UZ",
        sourceUrl: tenderSource(topic.key),
        slugRu: topic.ru.slug,
        slugUz: topic.uz.slug,
        ru,
        uz,
        report: { kind: "tender", topic: topic.key, brief: topic.brief },
        lostPer100: null,
        notes: "Тендерный разбор недели: снимков у него нет и не будет — разбирается типовое ТЗ, а не сайт.",
      });
      if (id) run.drafted = true;
      else run.errors.push("черновик не лёг: дубль запроса или слага, или база не ответила");
    }
  } catch (error) {
    run.errors.push(error instanceof Error ? error.message : String(error));
  }

  await report(
    run,
    run.drafted
      ? `Тема «${topic.ru.query}» — статья на двух языках ждёт проверки в панели, раздел «Разборы».`
      : `Статья по теме «${topic.ru.query}» не вышла.`,
  );
  return run;
}

const CHECK_FAILED = "статья не прошла проверку";

/** Две попытки: провал проверки возвращается модели её же словами. */
async function writeChecked(topic: TenderTopic, locale: RazborLocale): Promise<RazborArticle | string> {
  const first = await writeTender(topic, locale);
  if (typeof first !== "string" || !first.startsWith(CHECK_FAILED)) return first;
  return writeTender(topic, locale, first);
}

const TOOL = {
  name: "razbor",
  description: "Тендерный разбор на одном языке.",
  input_schema: {
    type: "object",
    properties: {
      title: { type: "string" },
      description: { type: "string" },
      intro: { type: "array", items: { type: "string" } },
      findings: {
        type: "array",
        items: {
          type: "object",
          properties: {
            title: { type: "string" },
            impact: { type: "string" },
            fix: { type: "string" },
          },
          required: ["title", "impact", "fix"],
        },
      },
      outcome: { type: "array", items: { type: "string" } },
    },
    required: ["title", "description", "intro", "findings", "outcome"],
  },
} as const;

export async function writeTender(
  topic: TenderTopic,
  locale: RazborLocale,
  notes: string | null = null,
): Promise<RazborArticle | string> {
  const side = topic[locale];
  const price = tenderPrice(locale);
  const pool = tenderPool(topic, locale);

  const prompt = [
    `Язык статьи: ${locale === "ru" ? "русский" : "узбекский (латиница)"}.`,
    `Запрос, под который пишем: «${side.query}». Он должен звучать в заголовке естественно.`,
    `Что закупают: «${side.label}».`,
    "",
    "Бриф — единственное, на что опираешься:",
    topic.brief,
    "",
    `Цена студии, дословно (её вставит код, в тексте её не повторяй): «${price}».`,
    ...(notes
      ? [
          "",
          `Предыдущая попытка не прошла проверку: ${notes}`,
          "Напиши заново, исправив это. Чисел, которых нет в брифе, у тебя нет.",
        ]
      : []),
  ].join("\n");

  const message = await anthropic().beta.messages.create({
    model: MODEL,
    max_tokens: 4096,
    system: [{ type: "text", text: SYSTEM, cache_control: { type: "ephemeral" } }],
    tools: [TOOL as unknown as Anthropic.Beta.BetaToolUnion],
    tool_choice: { type: "tool", name: "razbor" },
    messages: [{ role: "user", content: prompt }],
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
  });

  const use = message.content.find((block) => block.type === "tool_use");
  if (!use || use.type !== "tool_use") return "модель не собрала статью";

  const raw = use.input as Partial<RazborArticle>;
  const article: RazborArticle = {
    title: String(raw.title ?? ""),
    description: String(raw.description ?? ""),
    label: side.label,
    query: side.query,
    intro: (raw.intro ?? []).map(String).filter(Boolean),
    findings: (raw.findings ?? []).map((f) => ({
      title: String(f.title ?? ""),
      impact: String(f.impact ?? ""),
      fix: String(f.fix ?? ""),
    })),
    outcome: (raw.outcome ?? []).map(String).filter(Boolean),
    price,
  };

  const problems = tenderProblems(article, pool);
  if (problems.length) return `${CHECK_FAILED}: ${problems.map((p) => p.text).join(" ")}`;
  return article;
}

const SYSTEM = `Ты пишешь тендерный разбор для раздела «Разборы» на devuz.studio — сайте веб-студии DevUz Studio из Ташкента. Раз в неделю раздел разбирает не сайт, а типовое техническое задание IT-закупки: госзакупки и тендеры крупных компаний в Узбекистане.

Читатель — тот, кто готовит закупку (заказчик: госорган или компания), или подрядчик, который собирается подавать заявку. Он пришёл из поиска Google с запросом про техническое задание.

Жанр: спокойный профессиональный разбор типового ТЗ. Что в нём обычно есть, что упускают, чем это оборачивается на исполнении и приёмке, как написать правильно. Без рекламы и без страшилок.

Что нельзя ни при каких условиях:

- Называть конкретных заказчиков, организации, закупки, лоты, площадки, подрядчиков. Разбирается типовое ТЗ, а не чья-то закупка.
- Называть число, которого нет в брифе: суммы контрактов, сроки закупок, количества, номера статей законов и постановлений. Номера стандартов, которые есть в брифе и цене, — можно.
- Называть проценты: ни экономии, ни прироста, ни доли сорванных контрактов.
- Обещать победу в тендере, «гарантированную приёмку», связи.
- Повторять цену студии в тексте — её вставит код.

Как устроена статья:

- title — заголовок страницы с запросом внутри, по-человечески.
- description — одно предложение для выдачи.
- intro — два-три абзаца: что закупают, кто обычно заказчик (в общем виде), почему исход проекта решается ещё на этапе ТЗ.
- findings — от четырёх до семи пунктов: title (что обычно упускают или пишут размыто — как это выглядит в ТЗ), impact (чем оборачивается: спор на приёмке, срыв срока, удорожание, заявки без конкуренции, система, которой не пользуются), fix (как написать правильно — какой раздел или формулировка должны быть в ТЗ).
- outcome — три-четыре строки: что даёт хорошее ТЗ заказчику и подрядчику.

Пиши на языке статьи. Узбекский — латиницей, литературный, без кальки с русского.`;

async function report(run: TenderRun, body: string): Promise<void> {
  const db = serviceClient();
  if (!db) return;
  const text = run.errors.length ? `${body} Сбои: ${run.errors.slice(0, 3).join("; ")}` : body;
  await db.from("shift_reports").insert({ shift: TENDER_SHIFT, body: text.slice(0, 2000) });
}
