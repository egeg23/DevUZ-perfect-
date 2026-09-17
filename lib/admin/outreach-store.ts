import Anthropic from "@anthropic-ai/sdk";

import { record } from "@/lib/admin/audit";
import {
  OUTREACH_SYSTEM,
  OUTREACH_TOOL,
  canContact,
  isStopError,
  messageProblems,
  outreachPrompt,
  targetFor,
  type Reason,
} from "@/lib/admin/outreach";
import type { Staff } from "@/lib/admin/session";
import type { Finding } from "@/lib/audit/checks";
import { EMPTY_CONTACTS, type Contacts } from "@/lib/audit/contacts";
import { hostOf } from "@/lib/audit/pitch";
import type { ProspectRow } from "@/lib/audit/batch";
import { serviceClient } from "@/lib/supabase";

/**
 * Проспекты: хранение, подготовка сообщения и очередь отправки.
 *
 * Отправляет не сайт, а процесс скаута: пользовательская сессия Telegram
 * живёт там. Сайт кладёт задание в очередь и на этом заканчивает свою
 * часть — так ни отправка не ждёт страницы, ни страница отправки.
 */

const MODEL = process.env.ANTHROPIC_MODEL || "claude-opus-5";

export type ProspectStatus = "new" | "contacting" | "sending" | "sent" | "failed" | "skipped";

export type Prospect = {
  id: string;
  created_at: string;
  url: string;
  host: string;
  label: string | null;
  score: number | null;
  findings: Finding[];
  contacts: Contacts;
  draft: string | null;
  message: string | null;
  status: ProspectStatus;
  target: string | null;
  claimed_by: string | null;
  claimed_name: string | null;
  sent_at: string | null;
  failure: string | null;
  lead_id: string | null;
};

const COLUMNS =
  "id, created_at, url, host, label, score, findings, contacts, draft, message, status, target, claimed_by, sent_at, failure, lead_id, staff:claimed_by (display_name)";

function shape(row: Record<string, unknown>): Prospect {
  const joined = row.staff as unknown;
  const person = (Array.isArray(joined) ? joined[0] : joined) as { display_name?: string } | null | undefined;
  return {
    id: String(row.id),
    created_at: String(row.created_at),
    url: String(row.url),
    host: String(row.host),
    label: (row.label as string | null) ?? null,
    score: (row.score as number | null) ?? null,
    findings: Array.isArray(row.findings) ? (row.findings as Finding[]) : [],
    contacts: { ...EMPTY_CONTACTS, ...((row.contacts as Partial<Contacts>) ?? {}) },
    draft: (row.draft as string | null) ?? null,
    message: (row.message as string | null) ?? null,
    status: (row.status as ProspectStatus) ?? "new",
    target: (row.target as string | null) ?? null,
    claimed_by: (row.claimed_by as string | null) ?? null,
    claimed_name: person?.display_name ?? null,
    sent_at: (row.sent_at as string | null) ?? null,
    failure: (row.failure as string | null) ?? null,
    lead_id: (row.lead_id as string | null) ?? null,
  };
}

/* ── Сохранение прогона ────────────────────────────────────────────────── */

/**
 * Разобранные сайты — в базу. Повтор того же домена не заводит вторую
 * строку и не затирает уже начатое касание: писали один раз — значит,
 * писали, и новый прогон этого не отменяет.
 */
export async function saveProspects(rows: readonly ProspectRow[]): Promise<number> {
  const db = serviceClient();
  if (!db) return 0;

  const fresh = rows
    .filter((r) => r.url && r.findings.length)
    .map((r) => ({
      url: r.url as string,
      host: hostOf(r.url as string) ?? r.url!,
      label: r.label,
      score: r.score,
      findings: r.findings,
      contacts: r.contacts,
      draft: r.draft,
    }))
    .filter((r) => r.host);
  if (!fresh.length) return 0;

  const { data, error } = await db
    .from("prospects")
    .upsert(fresh, { onConflict: "host", ignoreDuplicates: true })
    .select("id");
  if (error) {
    console.error("касания: не сохранил прогон", error.message);
    return 0;
  }
  return (data ?? []).length;
}

export async function listProspects(limit = 200): Promise<Prospect[]> {
  const db = serviceClient();
  if (!db) return [];
  const { data } = await db.from("prospects").select(COLUMNS).order("created_at", { ascending: false }).limit(limit);
  return (data ?? []).map((row) => shape(row as Record<string, unknown>));
}

export async function prospectById(id: string): Promise<Prospect | null> {
  const db = serviceClient();
  if (!db) return null;
  const { data } = await db.from("prospects").select(COLUMNS).eq("id", id).maybeSingle();
  return data ? shape(data as Record<string, unknown>) : null;
}


/* ── Подготовка сообщения ──────────────────────────────────────────────── */

export type PrepareResult =
  | { ok: true; message: string }
  | { ok: false; why: string; reason?: Reason };

/**
 * Модель пишет первое сообщение, отталкиваясь от находок анализа.
 *
 * Сохраняется вместе с тем, кто нажал: дальше править и отправлять его
 * будет он, и лид закрепится за ним же.
 */
export async function prepareOutreach(id: string, staff: Staff): Promise<PrepareResult> {
  const db = serviceClient();
  if (!db) return { ok: false, why: "База недоступна." };

  const prospect = await prospectById(id);
  if (!prospect) return { ok: false, why: "Такого сайта в списке уже нет." };

  const reason = canContact({
    contacts: prospect.contacts,
    findings: prospect.findings,
    status: prospect.status,
  });
  if (reason !== "ok") return { ok: false, why: "", reason };

  if (!process.env.ANTHROPIC_API_KEY) return { ok: false, why: "Нет ключа модели — сообщение некому написать." };

  const prompt = outreachPrompt({
    host: prospect.host,
    label: prospect.label,
    niche: null,
    findings: prospect.findings,
    draft: prospect.draft,
    sender: staff.display_name,
  });

  let message: string;
  try {
    const response = await new Anthropic().beta.messages.create({
      model: MODEL,
      max_tokens: 1024,
      system: [{ type: "text" as const, text: OUTREACH_SYSTEM, cache_control: { type: "ephemeral" as const } }],
      messages: [{ role: "user" as const, content: prompt }],
      tools: [OUTREACH_TOOL as unknown as Anthropic.Beta.BetaToolUnion],
      tool_choice: { type: "tool", name: OUTREACH_TOOL.name },
      output_config: { effort: "medium" as const },
    });
    const block = response.content.find((b) => b.type === "tool_use");
    const raw = block && block.type === "tool_use" ? (block.input as { message?: unknown }).message : null;
    if (typeof raw !== "string" || !raw.trim()) return { ok: false, why: "Модель не вернула сообщение." };
    message = raw.trim();
  } catch (error) {
    return { ok: false, why: error instanceof Error ? error.message : String(error) };
  }

  // Что не так — покажем сотруднику рядом с текстом: правит он, а не мы.
  await db
    .from("prospects")
    .update({ message, status: "contacting", claimed_by: staff.id, claimed_at: new Date().toISOString() })
    .eq("id", id);

  return { ok: true, message };
}

/* ── Отправка ──────────────────────────────────────────────────────────── */

export type QueueResult = { ok: true; leadId: string | null } | { ok: false; why: string };

/**
 * Поставить сообщение в очередь и завести лид.
 *
 * Лид заводится здесь, а не после доставки: владелец просил, чтобы лид
 * закреплялся за тем, кто нажал отправить. Если Telegram потом откажет,
 * лид останется с пометкой о провале — это честнее, чем лид, появившийся
 * у кого-то другого через сутки.
 */
export async function queueOutreach(id: string, message: string, staff: Staff, ip: string): Promise<QueueResult> {
  const db = serviceClient();
  if (!db) return { ok: false, why: "База недоступна." };

  const prospect = await prospectById(id);
  if (!prospect) return { ok: false, why: "Такого сайта в списке уже нет." };

  const reason = canContact({
    contacts: prospect.contacts,
    findings: prospect.findings,
    status: prospect.status,
  });
  if (reason !== "ok") return { ok: false, why: reason };

  const target = targetFor(prospect.contacts);
  if (!target) return { ok: false, why: "no_telegram" };

  const text = message.trim();
  const problems = messageProblems(
    text,
    outreachPrompt({
      host: prospect.host,
      label: prospect.label,
      niche: null,
      findings: prospect.findings,
      draft: prospect.draft,
      sender: staff.display_name,
    }),
    prospect.host,
  );
  if (problems.length) return { ok: false, why: problems.map((p) => p.text).join(" ") };

  const leadId = await createOutreachLead(prospect, staff, text);

  const { error } = await db
    .from("prospects")
    .update({
      message: text,
      target,
      status: "sending",
      claimed_by: staff.id,
      claimed_at: new Date().toISOString(),
      lead_id: leadId,
      failure: null,
    })
    .eq("id", id)
    .in("status", ["new", "contacting"]);
  if (error) return { ok: false, why: "Не получилось поставить в очередь." };

  await record("prospect.queued", {
    actorStaffId: staff.id,
    targetType: "prospect",
    targetId: id,
    ip,
    meta: { host: prospect.host, target },
  });
  return { ok: true, leadId };
}

/**
 * Лид из касания — сразу закреплён за отправившим.
 *
 * Пишется напрямую, а не через saveLead: там квалификация ассистента с
 * баллами и грейдами, а здесь ничего этого ещё нет — есть сайт, находки и
 * человек, которому написали. Выдуманные грейды в такой строке были бы
 * враньём, поэтому все неизвестные поля стоят в худшее.
 */
async function createOutreachLead(prospect: Prospect, staff: Staff, message: string): Promise<string | null> {
  const db = serviceClient();
  if (!db) return null;

  const findings = prospect.findings.slice(0, 4).map((f) => f.title).join("; ");
  const { data, error } = await db
    .from("leads")
    .insert({
      source: "outreach",
      locale: "ru",
      contact_name: prospect.label ?? prospect.host,
      company: prospect.label,
      contact_handle: prospect.target ?? targetFor(prospect.contacts),
      contact_kind: "telegram",
      niche: prospect.label ?? prospect.host,
      niche_tier: 3,
      expertise: "medium",
      services: ["web-development"],
      budget: "B3",
      authority: "A3",
      need: "N3",
      timing: "T3",
      intent: "exploring",
      score: 0,
      grade: "D",
      priority: "nurture",
      breakdown: {},
      summary: {
        client: prospect.label ?? prospect.host,
        request: `Холодное касание по сайту ${prospect.host}. Нашли: ${findings}.`,
        niche: prospect.label ?? prospect.host,
        expertise: "не выяснено — разговора ещё не было",
        budget: "не выяснено — разговора ещё не было",
        authority: "не выяснено — разговора ещё не было",
        need: "не выяснено — пишем первыми, запроса от клиента не было",
        timing: "не выяснено — разговора ещё не было",
      },
      notes: `Первое сообщение отправлено ${staff.display_name} с рабочего аккаунта:\n\n${message}`,
      opening_line: message,
      already_told: [`Разобрали сайт ${prospect.host}`, ...prospect.findings.slice(0, 3).map((f) => f.title)],
      avoid_asking: [],
      status: "taken",
      assigned_staff_id: staff.id,
      assigned_to: staff.username ? `@${staff.username}` : staff.display_name,
      assigned_at: new Date().toISOString(),
    })
    .select("id")
    .maybeSingle();

  if (error) {
    console.error("касания: не завёл лид", error.message);
    return null;
  }
  return data ? String(data.id) : null;
}

/** Убрать сайт из очереди руками: не всякую находку стоит писать. */
export async function skipProspect(id: string, reason: string): Promise<void> {
  const db = serviceClient();
  if (!db) return;
  await db
    .from("prospects")
    .update({ status: "skipped", skip_reason: reason.trim().slice(0, 300) || null })
    .eq("id", id)
    .in("status", ["new", "contacting"]);
}
