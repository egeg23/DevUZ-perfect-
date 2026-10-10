import {
  AUTO_ARMS,
  candidates,
  pickVariant,
  type ArmStats,
  type StoredText,
  type Variant,
} from "@/lib/admin/letter-texts";
import { serviceClient } from "@/lib/supabase";

/**
 * Тексты писем в базе (letter_texts) и статистика по ним.
 *
 * Правка текста не переписывает строку: старая уходит в архив, новая
 * заводится рядом. Касание помнит, каким текстом ушло (prospects.
 * letter_variant), — и статистика честно считается по тому тексту, который
 * клиент на самом деле прочитал, а не по последней правке.
 */

const COLUMNS = "id, owner_id, slot, body, body_uz";

const shape = (row: Record<string, unknown>): StoredText => ({
  id: String(row.id),
  owner: (row.owner_id as string | null) ?? null,
  slot: row.slot === "b" ? "b" : "a",
  body: String(row.body ?? ""),
  body_uz: (row.body_uz as string | null) ?? null,
});

/** Все живые тексты: свои у каждого и общие (owner = null). */
export async function liveTexts(): Promise<StoredText[]> {
  const db = serviceClient();
  if (!db) return [];
  const { data } = await db.from("letter_texts").select(COLUMNS).is("archived_at", null).order("slot");
  return (data ?? []).map((row) => shape(row as Record<string, unknown>));
}

/**
 * Какой текст достаётся этому касанию — и запомнить выбор.
 * `owner` — менеджер; null — автопрогон (его заходы из кода).
 */
export async function chooseVariant(owner: string | null, hasReference: boolean): Promise<Variant | null> {
  const texts = owner ? await liveTexts() : [];
  return pickVariant(
    candidates({
      autopilot: owner === null,
      own: texts.filter((t) => t.owner === owner),
      common: texts.filter((t) => t.owner === null),
      hasReference,
    }),
  );
}

/** Каким текстом писалось касание — для проверки перед отправкой и статистики. */
export async function variantById(id: string | null): Promise<Variant | null> {
  if (!id) return null;
  if (id.startsWith("auto:")) {
    const arm = AUTO_ARMS.find((a) => `auto:${a.key}` === id);
    return arm ? { id, body: arm.body, body_uz: null } : null;
  }
  const db = serviceClient();
  if (!db || !id.startsWith("text:")) return null;
  const { data } = await db.from("letter_texts").select(COLUMNS).eq("id", id.slice(5)).maybeSingle();
  return data ? { id, body: String(data.body), body_uz: (data.body_uz as string | null) ?? null } : null;
}

/**
 * Сохранить текст в слот. Тот же текст — ничего не меняется (и статистика
 * не обнуляется); другой — старый в архив, новый рядом.
 */
export async function saveText(input: {
  owner: string | null;
  slot: "a" | "b";
  body: string;
  body_uz: string | null;
  by: string;
}): Promise<boolean> {
  const db = serviceClient();
  if (!db) return false;
  const live = (await liveTexts()).find((t) => t.owner === input.owner && t.slot === input.slot);
  if (live && live.body === input.body && live.body_uz === input.body_uz) return true;
  if (live) await db.from("letter_texts").update({ archived_at: new Date().toISOString() }).eq("id", live.id);
  const { error } = await db.from("letter_texts").insert({
    owner_id: input.owner,
    slot: input.slot,
    body: input.body,
    body_uz: input.body_uz,
    created_by: input.by,
  });
  return !error;
}

/** Убрать текст из слота: касания им больше не пишутся, статистика остаётся. */
export async function removeText(owner: string | null, slot: "a" | "b"): Promise<void> {
  const db = serviceClient();
  if (!db) return;
  let query = db.from("letter_texts").update({ archived_at: new Date().toISOString() }).eq("slot", slot).is("archived_at", null);
  query = owner ? query.eq("owner_id", owner) : query.is("owner_id", null);
  await query;
}

/** Текст менеджера — в общие, в выбранный слот. */
export async function makeCommon(textId: string, slot: "a" | "b", by: string): Promise<boolean> {
  const db = serviceClient();
  if (!db) return false;
  const { data } = await db.from("letter_texts").select(COLUMNS).eq("id", textId).maybeSingle();
  if (!data) return false;
  return saveText({ owner: null, slot, body: String(data.body), body_uz: (data.body_uz as string | null) ?? null, by });
}

/* ── Статистика ──────────────────────────────────────────────────────────── */

/** За сколько дней считаем: дольше — тексты успевают смениться. */
const STATS_DAYS = 120;

type Row = {
  id: string;
  letter_variant: string;
  target_kind: string | null;
  status: string;
  pitch_at: string | null;
  touched_at: string | null;
  proto_requested_at: string | null;
  lead_id: string | null;
};

/**
 * Ушло → ответили → хотят макет → сделка, по каждому тексту.
 *
 * «Ушло» — письмо дошло до клиента: через бота это сообщение после ответа на
 * «Здравствуйте», по ручному маршруту — отметка менеджера, что написал сам.
 * «Ответили» — входящее после письма. «Хотят макет» — «+» на предложение
 * (proto_requested_at). «Сделка» — по лиду заведён проект.
 */
export async function variantStats(): Promise<Map<string, ArmStats>> {
  const out = new Map<string, ArmStats>();
  const db = serviceClient();
  if (!db) return out;

  const since = new Date(Date.now() - STATS_DAYS * 86_400_000).toISOString();
  const { data } = await db
    .from("prospects")
    .select("id, letter_variant, target_kind, status, pitch_at, touched_at, proto_requested_at, lead_id")
    .not("letter_variant", "is", null)
    .gte("checked_at", since)
    .limit(3000);
  const rows = (data ?? []) as Row[];
  if (!rows.length) return out;

  const ids = rows.map((r) => r.id);
  const messages: { prospect_id: string; direction: string; kind: string | null; status: string; created_at: string; sent_at: string | null }[] = [];
  for (let i = 0; i < ids.length; i += 200) {
    const { data: part } = await db
      .from("outreach_messages")
      .select("prospect_id, direction, kind, status, created_at, sent_at")
      .in("prospect_id", ids.slice(i, i + 200))
      .limit(5000);
    messages.push(...((part ?? []) as typeof messages));
  }

  const leadIds = rows.map((r) => r.lead_id).filter((x): x is string => Boolean(x));
  const deals = new Set<string>();
  for (let i = 0; i < leadIds.length; i += 200) {
    const { data: part } = await db.from("projects").select("lead_id").in("lead_id", leadIds.slice(i, i + 200));
    for (const p of part ?? []) if (p.lead_id) deals.add(String(p.lead_id));
  }

  const byProspect = new Map<string, typeof messages>();
  for (const m of messages) byProspect.set(m.prospect_id, [...(byProspect.get(m.prospect_id) ?? []), m]);

  for (const r of rows) {
    const s = out.get(r.letter_variant) ?? { id: r.letter_variant, sent: 0, replied: 0, wanted: 0, deals: 0 };
    const thread = byProspect.get(r.id) ?? [];
    const letterAt = letterSentAt(r, thread);
    if (letterAt !== null) {
      s.sent += 1;
      if (thread.some((m) => m.direction === "in" && Date.parse(m.created_at) > letterAt)) s.replied += 1;
      if (r.proto_requested_at) s.wanted += 1;
      if (r.lead_id && deals.has(r.lead_id)) s.deals += 1;
    }
    out.set(r.letter_variant, s);
  }
  return out;
}

/** Когда письмо дошло до клиента; null — не дошло (ответили по-русски — ушёл кружок, или молчат). */
export function letterSentAt(
  r: Pick<Row, "target_kind" | "status" | "pitch_at" | "touched_at">,
  thread: readonly { direction: string; kind: string | null; status: string; created_at: string; sent_at: string | null }[],
): number | null {
  if (r.target_kind === "manual") {
    return r.status === "sent" && r.touched_at ? Date.parse(r.touched_at) : null;
  }
  if (!r.pitch_at) return null;
  const pitch = Date.parse(r.pitch_at);
  const letter = thread.find(
    (m) => m.direction === "out" && m.kind !== "circle" && m.status === "sent" && Date.parse(m.created_at) >= pitch,
  );
  return letter ? Date.parse(letter.sent_at ?? letter.created_at) : null;
}
