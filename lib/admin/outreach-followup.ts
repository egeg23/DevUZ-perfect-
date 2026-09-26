import Anthropic from "@anthropic-ai/sdk";

import { bannedPhrase, inventedNumbers, leadFindings } from "@/lib/admin/outreach";
import { isWorkday, tashkentHour } from "@/lib/admin/portion";
import type { Finding } from "@/lib/audit/checks";
import { effortFor } from "@/lib/model-limits";
import { modelTroubleSays } from "@/lib/model-trouble";
import { serviceClient } from "@/lib/supabase";
import { anthropic } from "@/lib/model-road";

/**
 * Дожим касаний: человек не ответил на первое сообщение — второе через три
 * дня, третье, последнее, через семь. Дальше не пишем.
 *
 * Из десяти отправленных касаний ответили пятеро, и ни одного второго
 * сообщения промолчавшим не ушло. В холодной переписке большая часть
 * ответов приходит на второе-третье сообщение.
 *
 * Только то, что ушло ботом (статус sent): по ручному маршруту переписка в
 * WhatsApp, и дожимать там — дело менеджера. Только в рабочее время по
 * Ташкенту: сообщение от незнакомой студии в 23:00 — повод пожаловаться.
 */

/** Через сколько дней после первого сообщения — второе и третье. */
export const FOLLOWUP_AFTER_DAYS = [3, 7] as const;
export const MAX_FOLLOWUPS = FOLLOWUP_AFTER_DAYS.length;
export const FOLLOWUP_FROM_HOUR = 10;
export const FOLLOWUP_TO_HOUR = 17;
/** За проход свипа — не больше: рабочий аккаунт не должен выглядеть рассылкой. */
const PER_PASS = 3;

const MODEL = process.env.OUTREACH_MODEL || "claude-sonnet-5";
const DAY_MS = 24 * 3600_000;

/** Между двумя дожимами — не меньше: иначе у давних касаний оба ушли бы подряд. */
export const MIN_GAP_DAYS = 3;
/** Касание старше — не дожимаем: через месяц это уже не «вернусь к разговору», а новая рассылка. */
export const STALE_AFTER_DAYS = 30;

export type FollowupCandidate = {
  status: string;
  replied_at: string | null;
  ai_handling: boolean;
  sent_at: string | null;
  followups: number;
  target_kind: string | null;
  last_followup_at?: string | null;
};

/** Какой по счёту дожим пора слать: 1, 2 — или null, если не пора или уже нельзя. */
export function followupDue(p: FollowupCandidate, now: Date): 1 | 2 | null {
  if (p.status !== "sent" || p.replied_at || !p.ai_handling || !p.sent_at) return null;
  if (p.target_kind === "manual") return null;
  if (p.followups >= MAX_FOLLOWUPS) return null;
  const days = (now.getTime() - Date.parse(p.sent_at)) / DAY_MS;
  if (days > STALE_AFTER_DAYS) return null;
  if (p.last_followup_at && (now.getTime() - Date.parse(p.last_followup_at)) / DAY_MS < MIN_GAP_DAYS) return null;
  return days >= FOLLOWUP_AFTER_DAYS[p.followups] ? ((p.followups + 1) as 1 | 2) : null;
}

export function followupWindow(now: Date): boolean {
  const hour = tashkentHour(now);
  return isWorkday(now) && hour >= FOLLOWUP_FROM_HOUR && hour < FOLLOWUP_TO_HOUR;
}

export const FOLLOWUP_SYSTEM = `Ты пишешь короткое повторное сообщение владельцу компании в Узбекистане от имени веб-студии DevUz Studio. Несколько дней назад мы написали ему про его сайт, он не ответил.

Правила:
— 25–60 слов, одним-двумя абзацами. Короче первого письма.
— Не пересказывай первое письмо и не извиняйся за беспокойство. Не «напоминаю о себе».
— Второе сообщение: одна другая находка из переданных — не та, с которой открывалось первое, — и чем она оборачивается для его клиентов. Кончи простым вопросом, на который можно ответить одним словом: «Актуально для вас?».
— Третье, последнее: вежливо закрой разговор — больше писать не будем; если вопрос с сайтом станет актуальным, короткий разбор на созвоне бесплатный, достаточно ответить на это сообщение.
— Не обещай ничего прислать. Не называй чисел, которых нет в задании.
— На «вы», без восклицательных знаков и эмодзи. Язык — тот же, что у первого письма.

Ответь только текстом сообщения.`;

export function followupPrompt(input: {
  host: string;
  label: string | null;
  firstMessage: string;
  findings: readonly Finding[];
  n: 1 | 2;
  sender: string;
}): string {
  const list = leadFindings(input.findings, 3);
  const shown = list.length ? list : input.findings.slice(0, 3);
  return [
    `Сайт: ${input.host}${input.label ? ` (${input.label})` : ""}`,
    `Отправитель: ${input.sender}, DevUz Studio.`,
    `Это ${input.n === 1 ? "второе" : "третье, последнее"} сообщение.`,
    "",
    "Первое письмо, на которое он не ответил:",
    `"""\n${input.firstMessage}\n"""`,
    "",
    "Находки по его сайту:",
    ...shown.map((f, i) => `${i + 1}. ${f.title} — ${f.impact}`),
  ].join("\n");
}

/** Что не так с текстом дожима. Пусто — можно ставить в очередь. */
export function followupProblems(text: string, prompt: string): string[] {
  const out: string[] = [];
  const t = text.trim();
  if (t.length < 40) out.push("слишком коротко");
  if (t.length > 700) out.push("длиннее 700 знаков");
  const invented = inventedNumbers(t, prompt);
  if (invented.length) out.push(`числа не из анализа: ${invented.join(", ")}`);
  if (bannedPhrase(t)) out.push("запрещённый оборот");
  if (/!/.test(t)) out.push("восклицательный знак");
  return out;
}

/**
 * Запасной текст, если модель недоступна или не прошла проверку. Только
 * по-русски и от «мы»: отправитель может быть и Данилом, и Мадиной, а
 * «я писал» в чужом письме — ошибка, которую адресат заметит первой.
 */
export function fallbackFollowup(n: 1 | 2, host: string, sender: string): string {
  return n === 1
    ? `Добрый день. Коротко вернёмся к ${host}: то, о чём мы писали, видно с телефона за минуту — это как раз то место, где уходят клиенты. Актуально для вас?\n\n${sender}, DevUz Studio`
    : `Добрый день. Больше не будем беспокоить. Если вопрос с сайтом ${host} станет актуальным — покажем на созвоне, что и в каком порядке поправить, это бесплатно. Достаточно ответить на это сообщение.\n\n${sender}, DevUz Studio`;
}

async function writeFollowup(prompt: string): Promise<string | null> {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  try {
    const response = await anthropic().beta.messages.create({
      model: MODEL,
      max_tokens: 600,
      system: FOLLOWUP_SYSTEM,
      messages: [{ role: "user", content: prompt }],
      ...effortFor(MODEL, "low"),
    });
    const text = response.content
      .filter((block): block is Anthropic.Beta.BetaTextBlock => block.type === "text")
      .map((block) => block.text)
      .join("")
      .trim();
    return text || null;
  } catch (error) {
    console.error("дожим: модель не ответила —", modelTroubleSays(error));
    return null;
  }
}

export type FollowupRun = { queued: number; errors: string[] };

export async function runFollowups(now: Date = new Date()): Promise<FollowupRun> {
  const run: FollowupRun = { queued: 0, errors: [] };
  if (!followupWindow(now)) return run;
  const db = serviceClient();
  if (!db) return run;

  const { data } = await db
    .from("prospects")
    .select(
      "id, host, label, message, findings, status, replied_at, ai_handling, sent_at, followups, last_followup_at, target, target_kind, lead_id, walked, claimed_by",
    )
    .eq("status", "sent")
    .is("replied_at", null)
    .eq("ai_handling", true)
    .lt("followups", MAX_FOLLOWUPS)
    .lte("sent_at", new Date(now.getTime() - FOLLOWUP_AFTER_DAYS[0] * DAY_MS).toISOString())
    .order("sent_at", { ascending: true })
    .limit(30);

  for (const p of data ?? []) {
    if (run.queued >= PER_PASS) break;
    const n = followupDue(
      {
        status: String(p.status),
        replied_at: (p.replied_at as string | null) ?? null,
        ai_handling: p.ai_handling === true,
        sent_at: (p.sent_at as string | null) ?? null,
        followups: Number(p.followups ?? 0),
        target_kind: (p.target_kind as string | null) ?? null,
        last_followup_at: (p.last_followup_at as string | null) ?? null,
      },
      now,
    );
    // Без адреса бот не знает, куда писать: сообщение легло бы в очередь и
    // висело там, не пуская следующие.
    if (!n || !p.host || !p.message || !p.target) continue;

    // Уже что-то стоит в очереди — не наслаиваем второе сообщение на первое.
    const { count } = await db
      .from("outreach_messages")
      .select("id", { count: "exact", head: true })
      .eq("prospect_id", p.id)
      .eq("status", "queued");
    if (count) continue;

    // Сначала счётчик — условно: два прохода не поставят один дожим дважды.
    const { data: claimed } = await db
      .from("prospects")
      .update({ followups: n, last_followup_at: now.toISOString() })
      .eq("id", p.id)
      .eq("followups", n - 1)
      .select("id");
    if (!claimed?.length) continue;

    const { data: staff } = p.claimed_by
      ? await db.from("staff").select("display_name").eq("id", p.claimed_by).eq("is_active", true).maybeSingle()
      : { data: null };
    const sender = String(staff?.display_name ?? "Команда");
    const lang = (p.walked as { lang?: string } | null)?.lang ?? "ru";

    const prompt = followupPrompt({
      host: String(p.host),
      label: (p.label as string | null) ?? null,
      firstMessage: String(p.message),
      findings: (p.findings as Finding[] | null) ?? [],
      n,
      sender,
    });
    const written = await writeFollowup(prompt);
    const body =
      written && !followupProblems(written, prompt).length
        ? written
        : lang === "ru"
          ? fallbackFollowup(n, String(p.host), sender)
          : null;
    if (!body) {
      // Нерусское письмо запасным русским не дожимаем — лучше промолчать.
      run.errors.push(`${p.host}: дожим не сложился`);
      continue;
    }

    const { error } = await db.from("outreach_messages").insert({
      prospect_id: p.id,
      lead_id: p.lead_id ?? null,
      direction: "out",
      author: "ai",
      body,
      status: "queued",
    });
    if (error) {
      run.errors.push(`${p.host}: ${error.message}`);
      continue;
    }
    run.queued += 1;
  }
  return run;
}
