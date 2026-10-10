import Anthropic from "@anthropic-ai/sdk";

import {
  FOREIGN_LOCALES,
  NICHE_NAMES,
  articleOf,
  cityByKey,
  foreignPrice,
  foreignProblems,
  foreignQuery,
  foreignSlug,
  validSubject,
  validTenderQuery,
} from "@/lib/razbor/foreign";
import type { ForeignLocale } from "@/lib/razbor/model";
import { isTender } from "@/lib/razbor/tender";
import type { RazborArticle } from "@/lib/razbor/store";
import { serviceClient } from "@/lib/supabase";
import { anthropic } from "@/lib/model-road";
import { keywordResearch } from "@/lib/seo/keywords";

// Статья — той же моделью, что русские разборы: Sonnet, не Opus
// (владелец, 04.10.2026: «не используй сильно дорогую модель»). Короткий
// ответ «как это назвать на другом языке» — Хайку, как статьи о маркетинге.
const MODEL = process.env.RAZBOR_MODEL || "claude-sonnet-5";
const NAME_MODEL = process.env.ARTICLE_MODEL || "claude-haiku-4-5";

/**
 * Английские и польские версии разборов — на сервере, по одной на язык за
 * проход свипа.
 *
 * Берётся опубликованный разбор без версии на этом языке, и Sonnet
 * переносит его русскую статью под запрос на этом языке. Не прошла
 * проверку дважды — разбор отдыхает шесть часов (`en_tried_at`,
 * `pl_tried_at`) и пробует снова: так сломанная статья не съедает модель
 * каждые пять минут.
 *
 * Без человека, в отличие от русской и узбекской версий: факты в ней те же,
 * что человек уже проверил и выпустил, а код следит, чтобы ни одного нового
 * числа, процента или находки не появилось.
 */

export type ForeignRun = { translated: string[]; failed: string[]; errors: string[] };

/** Через сколько пробовать снова, если версия не вышла. */
export const RETRY_AFTER_MS = 6 * 60 * 60 * 1000;

export async function runForeignPass(now = new Date(), limit = 1): Promise<ForeignRun> {
  const run: ForeignRun = { translated: [], failed: [], errors: [] };
  for (const locale of FOREIGN_LOCALES) {
    const one = await passLocale(locale, now, limit);
    run.translated.push(...one.translated);
    run.failed.push(...one.failed);
    run.errors.push(...one.errors);
  }
  return run;
}

async function passLocale(locale: ForeignLocale, now: Date, limit: number): Promise<ForeignRun> {
  const run: ForeignRun = { translated: [], failed: [], errors: [] };
  const db = serviceClient();
  if (!db) return run;

  const tried = `${locale}_tried_at`;
  const cutoff = new Date(now.getTime() - RETRY_AFTER_MS).toISOString();
  const { data: rows, error } = await db
    .from("razbors")
    .select(`id, category, city, niche_words, slug_${locale}, article_ru`)
    .eq("status", "published")
    .is(`article_${locale}`, null)
    .or(`${tried}.is.null,${tried}.lt."${cutoff}"`)
    .order("published_at", { ascending: false })
    .limit(limit);
  if (error) return { ...run, errors: [`${locale}: ${error.message}`] };

  for (const raw of rows ?? []) {
    const row = raw as unknown as Record<string, unknown>;
    // Отметка до модели: свип ходит каждые пять минут, а статья пишется
    // минуту-две. Без отметки следующий проход взял бы тот же разбор и
    // заплатил за него второй раз.
    const { data: claimed } = await db
      .from("razbors")
      .update({ [tried]: now.toISOString() })
      .eq("id", String(row.id))
      .is(`article_${locale}`, null)
      .or(`${tried}.is.null,${tried}.lt."${cutoff}"`)
      .select("id");
    if (!claimed?.length) continue;

    const target: Row = {
      id: String(row.id),
      category: String(row.category ?? ""),
      city: String(row.city ?? ""),
      niche_words: (row.niche_words as Row["niche_words"]) ?? null,
      slug: row[`slug_${locale}`] ? String(row[`slug_${locale}`]) : null,
      article_ru: row.article_ru,
    };
    let failure: string | null = null;
    try {
      const result = await translateOne(locale, target);
      if (typeof result === "string") {
        failure = result;
        run.failed.push(`${locale} ${target.id}: ${result}`);
      } else {
        run.translated.push(result.path);
      }
    } catch (err) {
      failure = err instanceof Error ? err.message : String(err);
      run.errors.push(`${locale} ${target.id}: ${failure}`);
    }
    // Причина — в строку разбора: лог сервера отсюда не виден, а повтор
    // через шесть часов без неё чинится вслепую. Вышла — поле очищено в save.
    if (failure) await db.from("razbors").update({ [`${locale}_note`]: failure.slice(0, 2000) }).eq("id", target.id);
  }

  return run;
}

type Row = {
  id: string;
  category: string;
  city: string;
  niche_words: ({ ruLabel?: string } & Partial<Record<ForeignLocale, string>>) | null;
  /** Адрес версии на этом языке, если он уже был. */
  slug: string | null;
  article_ru: unknown;
};

/** `{ path }` — версия легла; строка — почему нет. */
async function translateOne(locale: ForeignLocale, row: Row): Promise<{ path: string } | string> {
  const ru = articleOf(row.article_ru);
  if (!ru) return "нет русской статьи";

  const named = await queryFor(locale, row, ru);
  if ("error" in named) return `не назвали запрос: ${named.error}`;
  const { query } = named;

  // Что ищут вместе с запросом в Узбекистане — Google Trends и Вордстат,
  // как у любой статьи сайта (правило владельца, 04.10.2026).
  const { related } = await keywordResearch(query);
  const price = foreignPrice(locale, row.category);

  const input = { locale, ru, query, related, price };
  const first = await writeVersion(input);
  const version = typeof first === "string" && first.startsWith(CHECK_FAILED) ? await writeVersion(input, first) : first;
  if (typeof version === "string") return version;

  return save(locale, row, version);
}

/**
 * Записать статью и адрес. Адрес, который уже есть, не меняется: он мог
 * попасть в поиск. Новый занят другим разбором (два разных рода занятий
 * назвались одинаково) — к нему добавляется номер.
 */
async function save(locale: ForeignLocale, row: Row, version: RazborArticle): Promise<{ path: string } | string> {
  const db = serviceClient();
  if (!db) return "база недоступна";

  const base = row.slug || foreignSlug(locale, version.query);
  for (let n = 1; n <= 5; n += 1) {
    const slug = row.slug || (n === 1 ? base : `${base}-${n}`);
    const { error } = await db
      .from("razbors")
      .update({ [`slug_${locale}`]: slug, [`article_${locale}`]: version, [`${locale}_note`]: null })
      .eq("id", row.id);
    if (!error) return { path: `/${locale}/razbor/${slug}` };
    if (error.code !== "23505" || row.slug) return `не записалась: ${error.message}`;
  }
  return "все адреса заняты";
}

/* ── Запрос ─────────────────────────────────────────────────────────────── */

const NAME_TOOL = {
  name: "name",
  description: "Название для поискового запроса на нужном языке.",
  input_schema: {
    type: "object",
    properties: { name: { type: "string" } },
    required: ["name"],
  },
} as const;

const NAME_SYSTEM = `Ты называешь на нужном языке то, что человек набрал бы в Google, когда ищет это на этом языке.

- Обычные слова поиска, как пишут люди, а не перевод слово в слово. Строчными буквами языка — по-польски с ą, ć, ę, ł, ń, ó, ś, ź, ż.
- Одно название, без кавычек, пояснений и вариантов через «/».
- Никаких имён компаний, брендов и городов, если тебя о них не просили.
- Только то, что просят, без пояснений.`;

/** Ответ модели — или почему его нет: причина уходит в `_note` разбора. */
async function askName(task: string): Promise<{ text: string } | { error: string }> {
  try {
    const message = await anthropic("razbor-foreign-name").messages.create({
      model: NAME_MODEL,
      max_tokens: 100,
      system: [{ type: "text", text: NAME_SYSTEM }],
      tools: [NAME_TOOL as unknown as Anthropic.Tool],
      tool_choice: { type: "tool", name: NAME_TOOL.name },
      messages: [{ role: "user", content: task }],
    });
    const use = message.content.find((block) => block.type === "tool_use");
    if (!use || use.type !== "tool_use") return { error: "модель не ответила инструментом" };
    return { text: String((use.input as { name?: unknown }).name ?? "") };
  } catch (err) {
    return { error: err instanceof Error ? err.message : String(err) };
  }
}

/** Как просить у модели название: на каждом языке своя форма. */
const ASK: Record<ForeignLocale, { subject: string; tender: string }> = {
  en: {
    subject:
      "Дай английское название этого рода занятий, 1–4 слова, как в запросе «<род занятий> website». " +
      "Например: «leather manufacturer», «hotel», «programming school». Без слова website.",
    tender:
      "Дай английский поисковый запрос на ту же тему: 3–8 слов, без кавычек и без точки. " +
      "Например: «technical specification for a mobile app tender».",
  },
  pl: {
    subject:
      "Дай польское название этого рода занятий в родительном падеже, как его подставляют в запрос «strona internetowa dla …»: 1–5 слов, строчными. " +
      "Например: «garbarni», «hotelu», «szkoły programowania». Без слов strona и internetowa.",
    tender:
      "Дай польский поисковый запрос на ту же тему: 3–9 слов, строчными, без кавычек и без точки. " +
      "Например: «specyfikacja techniczna aplikacji mobilnej do przetargu».",
  },
};

/**
 * Запрос версии. Ниша каталога — словарём (NICHE_NAMES); ниша вне каталога —
 * названием, которое модель дала вместе с самой нишей (`niche_words.en`,
 * `niche_words.pl`) или которое уже взял другой разбор той же ниши. Нет ни
 * того, ни другого (разборы до 10.10.2026) — одним коротким вызовом дешёвой
 * модели, и ответ записывается к нише: второй раз его не спрашивают.
 */
async function queryFor(locale: ForeignLocale, row: Row, ru: RazborArticle): Promise<{ query: string } | { error: string }> {
  // Что ответила модель — в причину провала: без этого «не назвали запрос»
  // чинится вслепую.
  const named = (answer: { text: string } | { error: string }, valid: (raw: string) => string | null) =>
    "error" in answer ? { error: `модель названия: ${answer.error}` } : valid(answer.text) ?? { error: `модель назвала «${answer.text.slice(0, 120)}» — не подходит по форме` };

  if (isTender(row.category)) {
    const answer = await askName(`Русский запрос статьи: «${ru.query}». Заголовок: «${ru.title}».\n${ASK[locale].tender}`);
    const result = named(answer, (raw) => validTenderQuery(locale, raw));
    return typeof result === "string" ? { query: result } : result;
  }

  const city = cityByKey(row.city);
  if (!city) return { error: `город «${row.city}» не из каталога` };

  const known = NICHE_NAMES[locale][row.category];
  if (known) return { query: foreignQuery(locale, known, city) };

  const stored = await storedName(locale, row);
  if (stored) return { query: foreignQuery(locale, stored, city) };

  const label = row.niche_words?.ruLabel || ru.label;
  const answer = await askName(`Род занятий бизнеса: «${label}» (русский запрос: «${ru.query}»).\n${ASK[locale].subject}`);
  const result = named(answer, (raw) => validSubject(locale, raw));
  if (typeof result !== "string") return result;
  await rememberName(locale, row, result);
  return { query: foreignQuery(locale, result, city) };
}

/** Название ниши на этом языке: у самого разбора или у другого той же ниши. */
async function storedName(locale: ForeignLocale, row: Row): Promise<string | null> {
  const own = row.niche_words?.[locale];
  const valid = own ? validSubject(locale, own) : null;
  if (valid) return valid;

  const db = serviceClient();
  if (!db) return null;
  const { data } = await db
    .from("razbors")
    .select("niche_words")
    .eq("category", row.category)
    .not(`niche_words->>${locale}`, "is", null)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  const other = (data?.niche_words as Row["niche_words"])?.[locale];
  return other ? validSubject(locale, other) : null;
}

/** Ответ модели — к нише разбора: следующая версия и следующий разбор ниши возьмут его. */
async function rememberName(locale: ForeignLocale, row: Row, name: string): Promise<void> {
  const db = serviceClient();
  if (!db || !row.niche_words) return;
  await db.from("razbors").update({ niche_words: { ...row.niche_words, [locale]: name } }).eq("id", row.id);
}

/* ── Статья ─────────────────────────────────────────────────────────────── */

const TOOL = {
  name: "razbor_version",
  description: "Версия разбора на другом языке.",
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

const CHECK_FAILED = "версия не прошла проверку";

/** Чем версии отличаются друг от друга: язык, раздел, читатель, запятая. */
const LANG: Record<ForeignLocale, { version: string; language: string; section: string; reader: string; decimals: string }> = {
  en: {
    version: "английскую",
    language: "английским",
    section: "Website teardowns",
    reader:
      "иностранная компания или владелец бизнеса, который ищет подрядчика в Узбекистане и Центральной Азии по-английски",
    decimals: "десятичная точка вместо запятой («1,3» → «1.3»)",
  },
  pl: {
    version: "польскую",
    language: "польским",
    section: "Analizy stron",
    reader: "польская компания или владелец бизнеса, который ищет подрядчика в Узбекистане и Центральной Азии по-польски",
    decimals: "десятичная запятая, как в русском («1,3»)",
  },
};

const systemFor = (locale: ForeignLocale) => {
  const lang = LANG[locale];
  return `Ты делаешь ${lang.version} версию разбора сайта для раздела «${lang.section}» на devuz.studio — сайте веб-студии DevUz Studio из Ташкента.

Тебе дают русскую статью, уже проверенную и опубликованную. Эту версию читает другой человек: ${lang.reader}. Пиши для него естественным деловым ${lang.language}, а не переводом слово в слово.

Что нельзя ни при каких условиях:

- Добавлять факты. Всё, что есть в этой версии, есть в русской: находки, числа, выводы. Новых чисел, сроков, сумм и процентов нет.
- Менять числа. Каждое число — как в русской статье; ${lang.decimals}, «мс» → «ms». Число, написанное в русской статье словами, пиши словами и здесь («шесть страниц» → «six pages»).
- Называть компанию. Бизнес называется только подписью из русской статьи, переведённой на язык версии.
- Обещать места в выдаче и гарантии.

Как устроена статья:

- title — заголовок с запросом внутри, по-человечески.
- description — одно предложение для выдачи, с запросом.
- label — подпись разобранного бизнеса на языке версии.
- intro — столько же абзацев, сколько в русской; запрос — в первом абзаце.
- findings — все находки русской статьи, по одной, в том же порядке, с тем же code дословно (по нему к находке подставляется снимок).
- outcome — итог русской статьи на языке версии.

Кириллицы в ответе нет нигде.${locale === "pl" ? "\n\nПольский — со всеми диакритическими знаками: ą, ć, ę, ł, ń, ó, ś, ź, ż. Текст без них поляк читает как неграмотный." : ""}`;
};

export async function writeVersion(
  input: { locale: ForeignLocale; ru: RazborArticle; query: string; related: readonly string[]; price: string },
  notes: string | null = null,
): Promise<RazborArticle | string> {
  const { locale, ru, query, related, price } = input;
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
    `Запрос, под который пишем: «${query}». Он звучит в заголовке, описании и первом абзаце естественно, а не вставлен куском.`,
    ...(related.length
      ? [
          `С этим запросом в Узбекистане ищут ещё (Google Trends и Вордстат): ${related.map((r) => `«${r}»`).join(", ")}. 1–2 подходящих по смыслу вставь естественно; чисел из них не бери, чужие по теме пропусти.`,
        ]
      : []),
    `Цена студии на языке версии, её вставит страница сама: «${price}». В тексте цену не повторяй.`,
    "",
    "Русская статья:",
    JSON.stringify(source, null, 2),
    ...(notes
      ? ["", `Предыдущая попытка не прошла проверку: ${notes}`, "Сделай заново, исправив это. Числа — только из русской статьи."]
      : []),
  ].join("\n");

  const message = await anthropic("razbor-foreign").beta.messages.create({
    model: MODEL,
    max_tokens: 6000,
    system: [{ type: "text", text: systemFor(locale), cache_control: { type: "ephemeral" } }],
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
  const version: RazborArticle = {
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

  const problems = foreignProblems(locale, version, ru);
  if (problems.length) return `${CHECK_FAILED}: ${problems.map((p) => p.text).join(" ")}`;
  return version;
}
