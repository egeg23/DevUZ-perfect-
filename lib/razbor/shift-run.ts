import Anthropic from "@anthropic-ai/sdk";

import { services } from "@/content/services";
import { analyze } from "@/lib/audit/checks";
import { enrich, probe } from "@/lib/audit/fetch";
import { forecast } from "@/lib/razbor/forecast";
import { labelFor, pickFindings, queryFor, slugFor, worthWriting } from "@/lib/razbor/model";
import { serviceFor } from "@/lib/razbor/service-link";
import {
  LOOK_AT,
  OFF_LIMITS,
  PER_SHIFT,
  articleProblems,
  cityFrom,
  nicheByKey,
  shiftDue,
} from "@/lib/razbor/shift";
import { coveredHashes, saveDraft, sourceHash, type RazborArticle } from "@/lib/razbor/store";
import { serviceClient } from "@/lib/supabase";
import type { AuditReport } from "@/lib/audit/checks";
import type { City, Niche } from "@/content/razbor/catalog";

const MODEL = process.env.RAZBOR_MODEL || process.env.ANTHROPIC_MODEL || "claude-opus-5";

/**
 * Ночная смена разборов — на сервере, а не в плановой сессии.
 *
 * Здесь есть всё, чего у плановой сессии не было: ключ модели, база и тот
 * самый аудитор, которым пользуется публичная страница. Смена ходит вместе
 * со свипом, раз в пять минут заглядывает на часы и раз в сутки работает.
 *
 * Сайты берутся из касаний — те, до которых менеджеры не дошли или которые
 * отложили. Это не случайный выбор: их уже открывали, и второй системы
 * поиска сайтов заводить незачем. Разобранный сайт больше не вернётся:
 * отпечаток адреса лежит в базе с уникальным индексом.
 */

export type ShiftRun = {
  ran: boolean;
  looked: number;
  drafted: number;
  skipped: Record<string, number>;
  errors: string[];
};

const EMPTY: ShiftRun = { ran: false, looked: 0, drafted: 0, skipped: {}, errors: [] };

async function lastShiftAt(): Promise<string | null> {
  const db = serviceClient();
  if (!db) return null;
  const { data } = await db
    .from("shift_reports")
    .select("created_at")
    .eq("shift", "razbor")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data?.created_at ? String(data.created_at) : null;
}

export async function runRazborShift(now = new Date()): Promise<ShiftRun> {
  const db = serviceClient();
  if (!db) return EMPTY;
  if (!shiftDue(now, await lastShiftAt())) return EMPTY;

  const run: ShiftRun = { ran: true, looked: 0, drafted: 0, skipped: {}, errors: [] };
  const skip = (why: string) => {
    run.skipped[why] = (run.skipped[why] ?? 0) + 1;
  };

  const covered = await coveredHashes();

  // Касания, до которых не дошли руки: писать им мы не собираемся, а
  // разобрать анонимно — можем. Те, кому уже написали, не берём: человек,
  // получивший от нас письмо, узнает свой сайт в разборе.
  const { data: rows } = await db
    .from("prospects")
    .select("url, host, label")
    .in("status", ["new", "skipped"])
    .order("created_at", { ascending: false })
    .limit(LOOK_AT * 4);

  for (const row of rows ?? []) {
    if (run.drafted >= PER_SHIFT || run.looked >= LOOK_AT) break;

    // Адрес из касаний уже нормализован: он прошёл через тот же аудитор.
    // Второй разбор той же строки отсекается отпечатком.
    const url = String(row.url ?? "").trim();
    if (!url || covered.has(sourceHash(url))) {
      skip("уже разбирали");
      continue;
    }

    run.looked += 1;
    try {
      const drafted = await draftOne(url);
      if (drafted === true) {
        run.drafted += 1;
        covered.add(sourceHash(url));
      } else {
        skip(drafted);
      }
    } catch (error) {
      run.errors.push(`${row.host}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  await report(run);
  return run;
}

/** `true` — черновик лёг; строка — почему сайт не взяли. */
async function draftOne(url: string): Promise<true | string> {
  // Тот же путь, что у публичной страницы, но разобранный на части: нам
  // нужна не только сводка, а ещё html — по нему определяется город.
  const page = await enrich(await probe(url));
  const report = analyze(page);

  const verdict = worthWriting(report);
  if (!verdict.ok) return verdict.why === "too_good" ? "сайт в порядке" : verdict.why === "thin" ? "мало находок" : "сайт не открылся";

  const niche = nicheByKey(report.facts.niche);
  if (!niche) return "ниша не определилась";
  if (OFF_LIMITS.has(niche.key)) return "нишу не разбираем";

  const city = cityFrom(page.html);
  if (!city) return "город не определился";

  const title = titleOf(page.html);
  const loss = forecast(pickFindings(report));

  const ru = await write({ report, niche, city, locale: "ru", title });
  if (typeof ru === "string") return ru;
  const uz = await write({ report, niche, city, locale: "uz", title });
  if (typeof uz === "string") return uz;

  const id = await saveDraft({
    category: niche.key,
    city: city.key,
    country: city.country,
    sourceUrl: url,
    slugRu: slugFor(niche, city, "ru"),
    slugUz: slugFor(niche, city, "uz"),
    ru,
    uz,
    report: report as unknown,
    lostPer100: loss.lostPer100,
    notes: `Сайт взят из касаний. Находок: ${report.findings.length}, в статью вошло ${pickFindings(report).length}.`,
  });

  return id ? true : "не записался (скорее всего, такой запрос уже занят)";
}

function titleOf(html: string): string | null {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return match ? match[1].trim().slice(0, 200) : null;
}

const TOOL = {
  name: "razbor",
  description: "Статья разбора на одном языке.",
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
          properties: { title: { type: "string" }, impact: { type: "string" }, fix: { type: "string" } },
          required: ["title", "impact", "fix"],
        },
      },
      outcome: { type: "array", items: { type: "string" } },
    },
    required: ["title", "description", "intro", "findings", "outcome"],
  },
} as const;

async function write(input: {
  report: AuditReport;
  niche: Niche;
  city: City;
  locale: "ru" | "uz";
  title: string | null;
}): Promise<RazborArticle | string> {
  const { report, niche, city, locale } = input;
  const picked = pickFindings(report);
  const label = labelFor(niche, city, report.facts, locale);
  const query = queryFor(niche, city, locale);

  // Цена — из того же файла, что и сайт, целиком: «от $2500, 3–8 недель».
  // «От трёх недель» — обещание, которого студия не давала.
  //
  // И услуга берётся под нишу, а не первая из списка: интернет-магазину
  // называть цену обычного сайта значит занизить её на глазах у человека,
  // который потом придёт с этой цифрой.
  const slug = serviceFor(niche.key);
  const service = services.find((item) => item.slug === slug) ?? services[0];
  const price =
    locale === "ru"
      ? `от $${service.priceFromUsd}, ${service.weeksFrom}–${service.weeksTo} недель`
      : `$${service.priceFromUsd} dan, ${service.weeksFrom}–${service.weeksTo} hafta`;

  const prompt = [
    `Язык статьи: ${locale === "ru" ? "русский" : "узбекский (латиница)"}.`,
    `Запрос, под который пишем: «${query}». Он должен звучать в заголовке естественно, а не быть вставлен куском.`,
    `Как называем разобранный бизнес: «${label}». Имени компании у тебя нет и не будет.`,
    "",
    "Находки аудита — единственные факты о сайте, которые у тебя есть:",
    ...picked.map((f) => `- [${f.severity}] ${f.title} | ${f.impact} | ${f.fix}`),
    "",
    `Факты о сайте: время до первого байта ${report.facts.ttfbMs} мс, общий балл ${report.score}.`,
    `Цена студии, дословно: «${price}».`,
  ].join("\n");

  const client = new Anthropic();
  const message = await client.beta.messages.create({
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
    label,
    query,
    intro: (raw.intro ?? []).map(String).filter(Boolean),
    findings: (raw.findings ?? []).map((f) => ({
      title: String(f.title ?? ""),
      impact: String(f.impact ?? ""),
      fix: String(f.fix ?? ""),
    })),
    outcome: (raw.outcome ?? []).map(String).filter(Boolean),
    price,
  };

  // Текст проверяется машиной, а не совестью: модель, уложившаяся во все
  // формальные рамки, всё равно способна перезамерить время ответа или
  // скопировать находки дословно.
  const problems = articleProblems({ article, report, title: input.title });
  if (problems.length) return `статья не прошла проверку: ${problems.map((p) => p.text).join(" ")}`;

  return article;
}

const SYSTEM = `Ты пишешь разбор чужого сайта для раздела «Разборы» на devuz.studio — сайте веб-студии DevUz Studio из Ташкента. Разбор читает владелец похожего бизнеса, пришедший из поиска Google.

Жанр: спокойный профессиональный разбор, а не реклама и не издёвка. Человек по ту сторону вложил в этот сайт деньги, и разговаривать с ним свысока нельзя.

Что нельзя ни при каких условиях:

- Называть компанию. Ни имени, ни домена, ни города в имени. Бизнес называется только той подписью, которую тебе дали.
- Называть число, которого нет в находках аудита или в цене студии. Не перезамеряй и не округляй в свою пользу: 1261 мс — это «примерно 1,3 секунды», а не «примерно 1,2».
- Называть проценты прироста. Никогда, ни в каком виде: замеров «до» у чужого сайта нет.
- Обещать места в выдаче, «в топ», гарантии.
- Копировать заголовки находок из аудита дословно. Аудит пишет одинаково для всех сайтов; ты переписываешь под нишу и под то, что видит посетитель именно этого сайта.

Как устроена статья:

- title — заголовок страницы с запросом внутри, по-человечески.
- description — одно предложение для выдачи.
- intro — два-три абзаца: какой бизнес, что у него за сайт, почему смотрим именно это.
- findings — от трёх до восьми: title (что видит посетитель, следствием а не причиной), impact (чем оборачивается для клиентов и денег), fix (что делаем и сколько это обычно занимает).
- outcome — три-четыре строки о том, что даёт переделка. В клиентах, а не в пикселях.

Цену не выдумывай: тебе её дали строкой, вставь её как есть.`;

async function report(run: ShiftRun): Promise<void> {
  const db = serviceClient();
  if (!db) return;

  const why = Object.entries(run.skipped)
    .sort((a, b) => b[1] - a[1])
    .map(([reason, count]) => `${reason} ${count}`)
    .join(", ");

  const body =
    run.drafted > 0
      ? `Вышло ${run.drafted} из ${PER_SHIFT}. Посмотрено сайтов: ${run.looked}.` +
        (why ? ` Не взяли: ${why}.` : "") +
        " Ждут проверки в панели, разделе «Разборы»."
      : `Ни одного разбора. Посмотрено сайтов: ${run.looked}.` +
        (why ? ` Причины: ${why}.` : " Смотреть было нечего: в касаниях не осталось неразобранных сайтов.");

  await db.from("shift_reports").insert({
    shift: "razbor",
    body: (run.errors.length ? `${body} Сбои: ${run.errors.slice(0, 3).join("; ")}` : body).slice(0, 2000),
  });
}
