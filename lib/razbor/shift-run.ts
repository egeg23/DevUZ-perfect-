import Anthropic from "@anthropic-ai/sdk";

import { services } from "@/content/services";
import { auditDeep } from "@/lib/audit/batch";
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
import { inventNiche } from "@/lib/razbor/niche-ask";
import { forbiddenNiche } from "@/lib/razbor/niche-words";
import { coveredHashes, saveDraft, sourceHash, storedNiche, type RazborArticle } from "@/lib/razbor/store";
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

/**
 * `force` — запуск руками, в обход расписания и отметки «сегодня уже была».
 *
 * Нужен ровно за тем, чтобы правку смены можно было проверить в тот же
 * день, а не ждать восьми утра по Ташкенту. Автоматика этот флаг не
 * ставит никогда: смена и так ходит раз в сутки, и второй проход за день
 * означал бы двойной счёт за модель.
 */
export async function runRazborShift(now = new Date(), force = false): Promise<ShiftRun> {
  const db = serviceClient();
  if (!db) return EMPTY;
  if (!force && !shiftDue(now, await lastShiftAt())) return EMPTY;

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
  // Тот же обход, что у касания, а не быстрый разбор одной главной.
  //
  // Даёт три вещи разом и за один проход: находки внутренних страниц (с
  // ними реже срабатывает «мало находок»), нишу по заголовкам каталога —
  // из-за неё смена теряла половину сайтов, — и саму главную, из которой
  // берутся город и заголовок.
  const deep = await auditDeep({ raw: url, url, label: null, problem: null });
  const report = deep.row.report;
  const page = deep.home;
  if (!report || !page) return "сайт не открылся";

  const verdict = worthWriting(report);
  if (!verdict.ok) return verdict.why === "too_good" ? "сайт в порядке" : verdict.why === "thin" ? "мало находок" : "сайт не открылся";

  const found = await nicheFor(report.facts.niche, {
    url,
    title: titleOf(page.html),
    // Обход мог не состояться: тогда у нас только главная, и ниша будет
    // угадываться по её заголовку — или не будет вовсе.
    hints: deep.walked?.hints ?? [],
  });
  if (!found) return "ниша не определилась";
  const { niche, invented } = found;

  // Запрет проверяется и по ключу из каталога, и по словам: ключ придуманной
  // ниши может выглядеть безобидно (`finansy`), а подпись — «микрокредитная
  // организация». До появления придуманных ниш хватало списка ключей, потому
  // что банк или аптеку классификатор просто не узнавал.
  if (OFF_LIMITS.has(niche.key) || forbiddenNiche(niche)) return "нишу не разбираем";

  const city = cityFrom(page.html);
  if (!city) return "город не определился";

  const title = titleOf(page.html);
  const loss = forecast(pickFindings(report));

  const ru = await writeChecked({ report, niche, city, locale: "ru", title });
  if (typeof ru === "string") return ru;
  const uz = await writeChecked({ report, niche, city, locale: "uz", title });
  if (typeof uz === "string") return uz;

  const id = await saveDraft({
    category: niche.key,
    // Формы слова хранятся только у ниш вне каталога: каталожные лежат в
    // репозитории, и вторая копия в базе однажды с ними разойдётся.
    nicheWords: nicheByKey(niche.key) ? null : niche,
    city: city.key,
    country: city.country,
    sourceUrl: url,
    slugRu: slugFor(niche, city, "ru"),
    slugUz: slugFor(niche, city, "uz"),
    ru,
    uz,
    report: report as unknown,
    lostPer100: loss.lostPer100,
    notes:
      `Сайт взят из касаний. Находок: ${report.findings.length}, в статью вошло ${pickFindings(report).length}.` +
      // Проверяющему это первое, на что смотреть: формы слова попадают в
      // заголовок и в адрес страницы, а адрес потом не переименовать.
      (invented ? ` Ниша «${niche.ruLabel}» новая — смена назвала её сама, проверьте запрос и адрес.` : ""),
  });

  return id ? true : "не записался (скорее всего, такой запрос уже занят)";
}

/**
 * Ниша сайта: из каталога, из прежнего разбора или у модели.
 *
 * Порядок не случаен. Каталог бесплатен и выверен руками. Прежний разбор
 * той же ниши держит формы слова одинаковыми — иначе у нас появятся две
 * страницы под «сайт для автошколы» и «сайт для автошкол», то есть две
 * наши страницы под один запрос, между которыми Google не выберет.
 * Модель — последняя, и стоит она одного дешёвого вызова на сайт.
 */
async function nicheFor(
  key: string | null,
  site: { url: string; title: string | null; hints: readonly string[] },
): Promise<{ niche: Niche; invented: boolean } | null> {
  const fromCatalog = nicheByKey(key);
  if (fromCatalog) return { niche: fromCatalog, invented: false };

  // Классификатор мог назвать ключ, которого в каталоге нет: так было с
  // застройщиками — `nedvizhimost` он узнавал, а каталога под него не
  // существовало, и каждый такой сайт уходил в «ниша не определилась».
  if (key) {
    const known = await storedNiche(key);
    if (known) return { niche: known, invented: false };
  }

  const made = await inventNiche(site);
  if (!made) return null;

  const same = await storedNiche(made.key);
  return same ? { niche: same, invented: false } : { niche: made, invented: true };
}

export function titleOf(html: string): string | null {
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
          properties: {
            // Код находки из списка — дословно. По нему к находке
            // подставляется снимок того места на сайте, о котором она
            // говорит; без кода находка выйдет без картинки.
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
    required: ["title", "description", "intro", "findings", "outcome"],
  },
} as const;

/**
 * Две попытки на статью, а не одна.
 *
 * Три ночи подряд в отчёте смены стояло «статья не прошла проверку: Числа,
 * которых нет в аудите» — и раздел не получил ни одного разбора. Одно
 * выдуманное число хоронило сайт целиком, хотя переписать текст стоит
 * одного лишнего вызова.
 *
 * Ремень не новый: у письма касания он появился в сентябре и работает там
 * ровно так же — промахи возвращаются модели её же словами. Повторяем
 * только провал проверки: «модель не собрала статью» вторым заходом не
 * лечится, а стоит столько же.
 */
const CHECK_FAILED = "статья не прошла проверку";

async function writeChecked(input: {
  report: AuditReport;
  niche: Niche;
  city: City;
  locale: "ru" | "uz";
  title: string | null;
}): Promise<RazborArticle | string> {
  const first = await writeArticle(input);
  if (typeof first !== "string" || !first.startsWith(CHECK_FAILED)) return first;
  return writeArticle(input, first);
}

export async function writeArticle(
  input: {
    report: AuditReport;
    niche: Niche;
    city: City;
    locale: "ru" | "uz";
    title: string | null;
  },
  notes: string | null = null,
): Promise<RazborArticle | string> {
  const { report, niche, city, locale } = input;
  const picked = pickFindings(report);
  const codes = new Set(picked.map((f) => f.code));
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
    "Находки аудита — единственные факты о сайте, которые у тебя есть.",
    "В квадратных скобках — код находки; перенеси его в поле code как есть.",
    ...picked.map((f) => `- [${f.code}] [${f.severity}] ${f.title} | ${f.impact} | ${f.fix}`),
    "",
    `Факты о сайте: время до первого байта ${report.facts.ttfbMs} мс, общий балл ${report.score}.`,
    `Цена студии, дословно: «${price}».`,
    ...(notes
      ? [
          "",
          `Предыдущая попытка не прошла проверку: ${notes}`,
          "Напиши заново, исправив это. Числа бери только из находок и фактов выше — других у тебя нет.",
        ]
      : []),
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
      // Код принимается только из списка, который модели и давали. Своё
      // придуманное имя привязало бы к находке чужой снимок или никакой, и
      // заметить это было бы нечем: подпись под картинкой пришла бы из
      // правил, а картинка — с другого места страницы.
      ...(f.code && codes.has(String(f.code)) ? { code: String(f.code) } : {}),
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
  if (problems.length) return `${CHECK_FAILED}: ${problems.map((p) => p.text).join(" ")}`;

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
- findings — от трёх до восьми: code (код находки из списка, дословно — по нему к ней подставляется снимок того места на сайте), title (что видит посетитель, следствием а не причиной), impact (чем оборачивается для клиентов и денег), fix (что делаем и сколько это обычно занимает).
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
