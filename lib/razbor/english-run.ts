import Anthropic from "@anthropic-ai/sdk";

import {
  NICHE_EN,
  articleOf,
  cityByKey,
  englishPrice,
  englishProblems,
  englishQuery,
  englishSlug,
  validSubject,
  validTenderQuery,
} from "@/lib/razbor/english";
import { isTender } from "@/lib/razbor/tender";
import type { RazborArticle } from "@/lib/razbor/store";
import { serviceClient } from "@/lib/supabase";
import { anthropic } from "@/lib/model-road";
import { keywordResearch } from "@/lib/seo/keywords";

// Статья — той же моделью, что русские разборы: Sonnet, не Opus
// (владелец, 04.10.2026: «не используй сильно дорогую модель»). Короткий
// ответ «как это назвать по-английски» — Хайку, как статьи о маркетинге.
const MODEL = process.env.RAZBOR_MODEL || "claude-sonnet-5";
const NAME_MODEL = process.env.ARTICLE_MODEL || "claude-haiku-4-5";

/**
 * Английские версии разборов — на сервере, по одной за проход свипа.
 *
 * Берётся опубликованный разбор без английской версии, и Sonnet переносит
 * его русскую статью на английский под английский запрос. Не прошла
 * проверку дважды — разбор отдыхает шесть часов (`en_tried_at`) и пробует
 * снова: так сломанная статья не съедает модель каждые пять минут.
 *
 * Без человека, в отличие от русской и узбекской версий: факты в ней те же,
 * что человек уже проверил и выпустил, а код следит, чтобы ни одного нового
 * числа, процента или находки не появилось.
 */

export type EnglishRun = { translated: string[]; failed: string[]; errors: string[] };

/** Через сколько пробовать снова, если английская версия не вышла. */
export const RETRY_AFTER_MS = 6 * 60 * 60 * 1000;

const SELECT = "id, category, city, niche_words, slug_en, article_ru";

export async function runEnglishPass(now = new Date(), limit = 1): Promise<EnglishRun> {
  const run: EnglishRun = { translated: [], failed: [], errors: [] };
  const db = serviceClient();
  if (!db) return run;

  const cutoff = new Date(now.getTime() - RETRY_AFTER_MS).toISOString();
  const { data: rows, error } = await db
    .from("razbors")
    .select(SELECT)
    .eq("status", "published")
    .is("article_en", null)
    .or(`en_tried_at.is.null,en_tried_at.lt."${cutoff}"`)
    .order("published_at", { ascending: false })
    .limit(limit);
  if (error) return { ...run, errors: [error.message] };

  for (const row of rows ?? []) {
    // Отметка до модели: свип ходит каждые пять минут, а статья пишется
    // минуту-две. Без отметки следующий проход взял бы тот же разбор и
    // заплатил за него второй раз.
    const { data: claimed } = await db
      .from("razbors")
      .update({ en_tried_at: now.toISOString() })
      .eq("id", row.id)
      .is("article_en", null)
      .or(`en_tried_at.is.null,en_tried_at.lt."${cutoff}"`)
      .select("id");
    if (!claimed?.length) continue;

    try {
      const result = await translateOne(row as unknown as Row);
      if (typeof result === "string") run.failed.push(`${row.id}: ${result}`);
      else run.translated.push(result.path);
    } catch (err) {
      run.errors.push(`${row.id}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  return run;
}

type Row = {
  id: string;
  category: string;
  city: string;
  niche_words: { ruLabel?: string } | null;
  slug_en: string | null;
  article_ru: unknown;
};

/** `{ path }` — английская версия легла; строка — почему нет. */
async function translateOne(row: Row): Promise<{ path: string } | string> {
  const ru = articleOf(row.article_ru);
  if (!ru) return "нет русской статьи";

  const query = await queryFor(row, ru);
  if (!query) return "не назвали английский запрос";

  // Что ищут вместе с запросом в Узбекистане — Google Trends и Вордстат,
  // как у любой статьи сайта (правило владельца, 04.10.2026).
  const { related } = await keywordResearch(query);
  const price = englishPrice(row.category);

  const first = await writeEnglish({ ru, query, related, price });
  const en = typeof first === "string" && first.startsWith(CHECK_FAILED) ? await writeEnglish({ ru, query, related, price }, first) : first;
  if (typeof en === "string") return en;

  return save(row, en);
}

/**
 * Записать статью и адрес. Адрес, который уже есть, не меняется: он мог
 * попасть в поиск. Новый занят другим разбором (два разных рода занятий
 * по-английски назвались одинаково) — к нему добавляется номер.
 */
async function save(row: Row, en: RazborArticle): Promise<{ path: string } | string> {
  const db = serviceClient();
  if (!db) return "база недоступна";

  const base = row.slug_en || englishSlug(en.query);
  for (let n = 1; n <= 5; n += 1) {
    const slug = row.slug_en || (n === 1 ? base : `${base}-${n}`);
    const { error } = await db.from("razbors").update({ slug_en: slug, article_en: en }).eq("id", row.id);
    if (!error) return { path: `/en/razbor/${slug}` };
    if (error.code !== "23505" || row.slug_en) return `не записалась: ${error.message}`;
  }
  return "все адреса заняты";
}

/* ── Запрос ─────────────────────────────────────────────────────────────── */

const NAME_TOOL = {
  name: "english",
  description: "Английское название для поискового запроса.",
  input_schema: {
    type: "object",
    properties: { english: { type: "string" } },
    required: ["english"],
  },
} as const;

const NAME_SYSTEM = `Ты называешь по-английски то, что человек набрал бы в Google, когда ищет это на английском.

- Обычные слова поиска, как пишут люди, а не перевод слово в слово. Строчными буквами, латиницей.
- Никаких имён компаний, брендов и городов, если тебя о них не просили.
- Только то, что просят, без пояснений.`;

async function askName(task: string): Promise<string | null> {
  try {
    const message = await anthropic().messages.create({
      model: NAME_MODEL,
      max_tokens: 100,
      system: [{ type: "text", text: NAME_SYSTEM }],
      tools: [NAME_TOOL as unknown as Anthropic.Tool],
      tool_choice: { type: "tool", name: NAME_TOOL.name },
      messages: [{ role: "user", content: task }],
    });
    const use = message.content.find((block) => block.type === "tool_use");
    return use && use.type === "tool_use" ? String((use.input as { english?: unknown }).english ?? "") : null;
  } catch {
    return null;
  }
}

/**
 * Английский запрос разбора. Ниша каталога — словарём, остальное — одним
 * коротким вызовом дешёвой модели, с проверкой формы ответа.
 */
async function queryFor(row: Row, ru: RazborArticle): Promise<string | null> {
  if (isTender(row.category)) {
    const raw = await askName(
      `Русский запрос статьи: «${ru.query}». Заголовок: «${ru.title}».\n` +
        "Дай английский поисковый запрос на ту же тему: 3–8 слов, без кавычек и без точки. " +
        "Например: «technical specification for a mobile app tender».",
    );
    return raw ? validTenderQuery(raw) : null;
  }

  const city = cityByKey(row.city);
  if (!city) return null;

  const known = NICHE_EN[row.category];
  if (known) return englishQuery(known, city);

  const label = row.niche_words?.ruLabel || ru.label;
  const raw = await askName(
    `Род занятий бизнеса: «${label}» (русский запрос: «${ru.query}»).\n` +
      "Дай английское название этого рода занятий, 1–4 слова, как в запросе «<род занятий> website». " +
      "Например: «leather manufacturer», «hotel», «programming school». Без слова website.",
  );
  const subject = raw ? validSubject(raw) : null;
  return subject ? englishQuery(subject, city) : null;
}

/* ── Статья ─────────────────────────────────────────────────────────────── */

const TOOL = {
  name: "razbor_en",
  description: "Английская версия разбора.",
  input_schema: {
    type: "object",
    properties: {
      title: { type: "string" },
      description: { type: "string" },
      label: { type: "string" },
      intro: { type: "array", items: { type: "string" } },
      findings: {
        type: "array",
        items: {
          type: "object",
          properties: {
            code: { type: "string" },
            title: { type: "string" },
            impact: { type: "string" },
            fix: { type: "string" },
          },
          required: ["code", "title", "impact", "fix"],
        },
      },
      outcome: { type: "array", items: { type: "string" } },
    },
    required: ["title", "description", "label", "intro", "findings", "outcome"],
  },
} as const;

const CHECK_FAILED = "английская версия не прошла проверку";

const SYSTEM = `Ты делаешь английскую версию разбора сайта для раздела «Website teardowns» на devuz.studio — сайте веб-студии DevUz Studio из Ташкента.

Тебе дают русскую статью, уже проверенную и опубликованную. Английскую читает другой человек: иностранная компания или владелец бизнеса, который ищет подрядчика в Узбекистане и Центральной Азии по-английски. Пиши для него естественным деловым английским, а не переводом слово в слово.

Что нельзя ни при каких условиях:

- Добавлять факты. Всё, что есть в английской версии, есть в русской: находки, числа, выводы. Новых чисел, сроков, сумм и процентов нет.
- Менять числа. Каждое число — как в русской статье; десятичная точка вместо запятой («1,3» → «1.3»), «мс» → «ms».
- Называть компанию. Бизнес называется только подписью из русской статьи, переведённой на английский.
- Обещать места в выдаче и гарантии.

Как устроена статья:

- title — заголовок с английским запросом внутри, по-человечески.
- description — одно предложение для выдачи, с запросом.
- label — подпись разобранного бизнеса по-английски.
- intro — столько же абзацев, сколько в русской; запрос — в первом абзаце.
- findings — все находки русской статьи, по одной, в том же порядке, с тем же code дословно (по нему к находке подставляется снимок).
- outcome — итог русской статьи по-английски.

Кириллицы в ответе нет нигде.`;

export async function writeEnglish(
  input: { ru: RazborArticle; query: string; related: readonly string[]; price: string },
  notes: string | null = null,
): Promise<RazborArticle | string> {
  const { ru, query, related, price } = input;
  const source = {
    title: ru.title,
    description: ru.description,
    label: ru.label,
    intro: ru.intro,
    findings: ru.findings.map((f) => ({ code: f.code ?? "", title: f.title, impact: f.impact, fix: f.fix })),
    outcome: ru.outcome,
    price: ru.price,
  };

  const prompt = [
    `Английский запрос, под который пишем: «${query}». Он звучит в заголовке, описании и первом абзаце естественно, а не вставлен куском.`,
    ...(related.length
      ? [
          `С этим запросом в Узбекистане ищут ещё (Google Trends и Вордстат): ${related.map((r) => `«${r}»`).join(", ")}. 1–2 подходящих по смыслу вставь естественно; чисел из них не бери, чужие по теме пропусти.`,
        ]
      : []),
    `Цена студии по-английски, её вставит страница сама: «${price}». В тексте цену не повторяй.`,
    "",
    "Русская статья:",
    JSON.stringify(source, null, 2),
    ...(notes
      ? ["", `Предыдущая попытка не прошла проверку: ${notes}`, "Сделай заново, исправив это. Числа — только из русской статьи."]
      : []),
  ].join("\n");

  const message = await anthropic().beta.messages.create({
    model: MODEL,
    max_tokens: 6000,
    system: [{ type: "text", text: SYSTEM, cache_control: { type: "ephemeral" } }],
    tools: [TOOL as unknown as Anthropic.Beta.BetaToolUnion],
    tool_choice: { type: "tool", name: TOOL.name },
    messages: [{ role: "user", content: prompt }],
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
  });

  if (message.stop_reason === "max_tokens") return `${CHECK_FAILED}: текст обрезан по лимиту длины.`;
  const use = message.content.find((block) => block.type === "tool_use");
  if (!use || use.type !== "tool_use") return "модель не собрала статью";

  const raw = use.input as Partial<RazborArticle>;
  const codes = new Set(ru.findings.map((f) => f.code).filter(Boolean));
  const en: RazborArticle = {
    title: String(raw.title ?? ""),
    description: String(raw.description ?? ""),
    label: String(raw.label ?? ""),
    query,
    intro: (raw.intro ?? []).map(String).filter(Boolean),
    findings: (raw.findings ?? []).map((f) => ({
      // Код — только из русской статьи: свой придуманный привязал бы к
      // находке чужой снимок.
      ...(f.code && codes.has(String(f.code)) ? { code: String(f.code) } : {}),
      title: String(f.title ?? ""),
      impact: String(f.impact ?? ""),
      fix: String(f.fix ?? ""),
    })),
    outcome: (raw.outcome ?? []).map(String).filter(Boolean),
    price,
  };

  const problems = englishProblems(en, ru);
  if (problems.length) return `${CHECK_FAILED}: ${problems.map((p) => p.text).join(" ")}`;
  return en;
}
