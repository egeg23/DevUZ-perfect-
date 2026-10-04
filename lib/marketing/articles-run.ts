import type Anthropic from "@anthropic-ai/sdk";
import { revalidatePath } from "next/cache";

import { nextMarketingTopic, type MarketingTopic } from "@/content/marketing-topics";
import { TASHKENT_OFFSET_MS, todayInTashkent } from "@/lib/admin/pulse";
import { buildPayload, sendPing } from "@/lib/indexnow";
import { checkArticle, type CheckProblem } from "@/lib/marketing/article-check";
import {
  ARTICLE_LOCALES,
  articleHref,
  parseText,
  saveArticle,
  writtenTopics,
  type ArticleText,
} from "@/lib/marketing/articles-store";
import { anthropic } from "@/lib/model-road";
import { siteUrl } from "@/lib/seo";
import { serviceClient } from "@/lib/supabase";

/**
 * Две статьи о маркетинге в день — сами, из свипа.
 *
 * Модель — недорогая: статья короткая, по готовой теме и готовым фактам, и
 * сильная модель тут переплачивала бы за то, чего от неё не требуется.
 * Haiku пишет обе версии, русскую и узбекскую, одним вызовом — это около
 * полутора центов за статью; с повторной попыткой — до трёх. Модель можно
 * сменить переменной ARTICLE_MODEL, не трогая код.
 *
 * Время — 10:00 и 16:00 по Ташкенту. Слот забирается отметкой в
 * daily_claims до вызова модели: второй проход свипа через пять минут ту же
 * статью не начнёт, а неудачный слот не повторяется — больше двух вызовов
 * модели на слот не бывает. Пропущенный слот (сервер лежал в 10:00)
 * догоняется в тот же день следующим проходом.
 *
 * Статья публикуется сразу: проверка кодом (article-check.ts) стоит на месте
 * человека. Владельцу пишется только о том, что не вышло.
 */

const MODEL = process.env.ARTICLE_MODEL || "claude-haiku-4-5";

/** Часы выхода статей по Ташкенту. */
export const ARTICLE_HOURS = [10, 16] as const;
export const ARTICLE_SHIFT = "marketing-articles";

export type ArticleRun = { ran: boolean; topic: string | null; published: string | null; errors: string[] };

const EMPTY: ArticleRun = { ran: false, topic: null, published: null, errors: [] };

/** Слоты, время которых сегодня уже наступило: 10:00 → [1], 16:00 → [1, 2]. */
export function dueSlots(now: Date): number[] {
  const hour = new Date(now.getTime() + TASHKENT_OFFSET_MS).getUTCHours();
  return ARTICLE_HOURS.flatMap((h, i) => (hour >= h ? [i + 1] : []));
}

async function claimSlot(now: Date, slot: number): Promise<"ok" | "taken" | string> {
  const db = serviceClient();
  if (!db) return "база недоступна";
  const { data, error } = await db
    .from("daily_claims")
    .upsert(
      { job: `${ARTICLE_SHIFT}-${slot}`, day: todayInTashkent(now) },
      { onConflict: "job,day", ignoreDuplicates: true },
    )
    .select("job");
  if (error) return `слот не взят: ${error.message}`;
  return data?.length ? "ok" : "taken";
}

export async function runMarketingArticles(now = new Date()): Promise<ArticleRun> {
  if (!serviceClient()) return EMPTY;

  let slot: number | null = null;
  for (const candidate of dueSlots(now)) {
    const claim = await claimSlot(now, candidate);
    if (claim === "taken") continue;
    if (claim !== "ok") return { ...EMPTY, errors: [claim] };
    slot = candidate;
    break;
  }
  if (slot === null) return EMPTY;

  const run: ArticleRun = { ran: true, topic: null, published: null, errors: [] };
  const written = await writtenTopics();
  if (!written) {
    run.errors.push("не прочитать, какие темы уже написаны");
    await report(run, "Статья не вышла: база не ответила.");
    return run;
  }
  const topic = nextMarketingTopic(written);
  if (!topic) {
    // Раз в день, а не на каждый слот: напоминание дважды в день — уже шум.
    if (slot === 1) {
      await report(run, "Темы кончились: все темы из content/marketing-topics.ts написаны. Добавьте новые — статьи пойдут со следующего слота.");
    }
    return run;
  }
  run.topic = topic.key;

  try {
    let notes: CheckProblem[] = [];
    let pair: { ru: ArticleText; uz: ArticleText } | null = null;
    for (let attempt = 0; attempt < 2 && !pair; attempt += 1) {
      const result = await writeArticle(topic, notes);
      if ("problems" in result) notes = result.problems;
      else pair = result;
    }
    if (!pair) {
      run.errors.push(notes.map((p) => `${p.locale}: ${p.text}`).join(" "));
    } else {
      const failed = await saveArticle({
        topicKey: topic.key,
        kind: topic.kind,
        slug: topic.slug,
        ru: pair.ru,
        uz: pair.uz,
        sourceUrl: topic.source ?? null,
        model: MODEL,
      });
      if (failed) run.errors.push(`не сохранилась: ${failed}`);
      else {
        run.published = topic.slug;
        await announce(topic.slug);
      }
    }
  } catch (error) {
    run.errors.push(error instanceof Error ? error.message : String(error));
  }

  if (run.errors.length) await report(run, `Статья по теме «${topic.brief}» не вышла.`);
  return run;
}

/** Сбросить кэш страниц и сказать Bing и Яндексу о новой статье. */
async function announce(slug: string): Promise<void> {
  for (const locale of ARTICLE_LOCALES) {
    try {
      revalidatePath(`/${locale}/marketing`);
      revalidatePath(articleHref(locale, slug));
    } catch {
      // Вне запроса сброс недоступен — страницы обновятся сами по revalidate.
    }
  }
  try {
    revalidatePath("/sitemap.xml");
  } catch {
    // То же.
  }

  const key = (process.env.INDEXNOW_KEY || "").trim();
  if (!key) return;
  try {
    const urls = ARTICLE_LOCALES.map((locale) => `${siteUrl}${articleHref(locale, slug)}`);
    await sendPing(buildPayload({ key, siteUrl, urls }));
  } catch {
    // Пинг — ускоритель, не условие: статья уже в карте сайта.
  }
}

const TEXT_SCHEMA = {
  type: "object",
  properties: {
    title: { type: "string" },
    description: { type: "string" },
    paragraphs: { type: "array", items: { type: "string" } },
    tips: { type: "array", items: { type: "string" } },
  },
  required: ["title", "description", "paragraphs", "tips"],
} as const;

const TOOL = {
  name: "article",
  description: "Статья о маркетинге на двух языках.",
  input_schema: {
    type: "object",
    properties: { ru: TEXT_SCHEMA, uz: TEXT_SCHEMA },
    required: ["ru", "uz"],
  },
} as const;

export async function writeArticle(
  topic: MarketingTopic,
  notes: CheckProblem[] = [],
): Promise<{ ru: ArticleText; uz: ArticleText } | { problems: CheckProblem[] }> {
  const message = await anthropic().messages.create({
    model: MODEL,
    max_tokens: 6000,
    system: [{ type: "text", text: SYSTEM, cache_control: { type: "ephemeral" } }],
    tools: [TOOL as unknown as Anthropic.Tool],
    tool_choice: { type: "tool", name: TOOL.name },
    messages: [{ role: "user", content: articlePrompt(topic, notes) }],
  });

  const use = message.content.find((block) => block.type === "tool_use");
  if (!use || use.type !== "tool_use") return { problems: [{ locale: "both", text: "модель не собрала статью" }] };

  const raw = use.input as { ru?: unknown; uz?: unknown };
  const ru = parseText(raw.ru);
  const uz = parseText(raw.uz);
  if (!ru || !uz) return { problems: [{ locale: "both", text: "нет одной из версий статьи — нужны обе, ru и uz" }] };

  const problems = [...checkArticle(topic, "ru", ru), ...checkArticle(topic, "uz", uz)];
  return problems.length ? { problems } : { ru, uz };
}

export function articlePrompt(topic: MarketingTopic, notes: CheckProblem[] = []): string {
  const lines = [`Тема: ${topic.brief}`];
  if (topic.kind === "case") {
    lines.push(
      "",
      "Вид: разбор известной кампании. Факты — единственное, что ты знаешь о кейсе. Пересказывай их своими словами, ничего не добавляй: ни чисел, ни дат, ни имён, ни результатов, которых здесь нет.",
      ...(topic.facts ?? []).map((fact) => `- ${fact}`),
      "",
      `Главный вывод: ${topic.lesson}`,
      "Дальше — как применить этот приём малому и среднему бизнесу в Узбекистане, без чисел.",
    );
  } else if (topic.kind === "mistake") {
    lines.push(
      "",
      "Вид: частая ошибка в маркетинге. Как она выглядит у бизнеса, чем вредит, как исправить по шагам. Без статистики, процентов, сумм и годов — только практика.",
    );
  } else {
    lines.push(
      "",
      "Вид: практическое руководство по нише и каналу. Что в этой нише решает клиент, какой контент и какие предложения работают, какие ошибки частые, с чего начать на первой неделе. Без статистики, процентов, сумм и годов.",
    );
  }
  if (notes.length) {
    lines.push(
      "",
      "Предыдущая попытка не прошла проверку:",
      ...notes.map((n) => `- ${n.locale}: ${n.text}`),
      "Напиши обе версии заново, исправив это.",
    );
  }
  return lines.join("\n");
}

const SYSTEM = `Ты пишешь короткие статьи о маркетинге для блога на devuz.studio — сайте веб-студии DevUz Studio из Ташкента, которая делает сайты и ведёт маркетинг: SMM, таргет, контекстная реклама Google и Яндекс, Telegram Ads, SEO.

Читатель — владелец или маркетолог малого и среднего бизнеса в Узбекистане. Он пришёл из Google или Яндекса и хочет за три минуты понять одну вещь и что с ней делать.

Каждая статья — две версии одного текста: ru (русский) и uz (узбекский, латиница, литературный деловой язык, без кальки с русского и без кириллицы). Узбекская — не дословный перевод: пиши так, как ищут и говорят по-узбекски.

Что нельзя ни при каких условиях:

- Придумывать факты, числа, даты, проценты, суммы, исследования, цитаты, имена и компании. В разборе кейса — только факты из темы. В остальных статьях — без статистики вовсе.
- Обещать результат: «гарантированно», «в 10 раз больше заявок».
- Упоминать другие агентства и студии, ставить ссылки и адреса сайтов.
- Рекламировать студию в тексте: предложение студии страница покажет сама после статьи.

Как устроена версия:

- title — заголовок до 90 знаков с ключевой фразой темы, по-человечески, без кликбейта.
- description — одно-два предложения для выдачи поисковика, 100–180 знаков.
- paragraphs — 4–6 абзацев по 2–4 предложения, всего 1200–2800 знаков. Без подзаголовков и списков внутри абзацев.
- tips — 3–5 коротких практических советов «что сделать у себя», по одному предложению.

Тон: спокойный, конкретный, без канцелярита и восклицательных знаков.`;

async function report(run: ArticleRun, body: string): Promise<void> {
  const db = serviceClient();
  if (!db) return;
  const text = run.errors.length ? `${body} Причина: ${run.errors.slice(0, 2).join("; ")}` : body;
  await db.from("shift_reports").insert({ shift: ARTICLE_SHIFT, body: text.slice(0, 2000) });
}
