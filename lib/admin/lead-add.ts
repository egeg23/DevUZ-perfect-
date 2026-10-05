import { record } from "@/lib/admin/audit";
import { AUTO_REMINDER_HOURS, createReminder, handleOf } from "@/lib/admin/ownership";
import { staffById, type Staff } from "@/lib/admin/session";
import { approves } from "@/lib/admin/transfers";
import { newRequestNo } from "@/lib/qualify/engine";
import { esc, sendMessage } from "@/lib/qualify/telegram";
import { siteUrl } from "@/lib/seo";
import { serviceClient } from "@/lib/supabase";

/**
 * Лид, добавленный руками.
 *
 * Владелец, 05.10.2026: «В лидах сделай кнопку „добавить лид вручную“, чтобы
 * мы могли добавлять клиентов руками не в проект, а в лидах». Клиент пришёл
 * мимо сайта и бота — позвонил, пришёл по рекомендации, встретились лично, —
 * и до сих пор записать его было некуда, кроме проекта, а проект — это уже
 * договор.
 *
 * Такой лид сразу «в работе» у того, кто его добавил: очереди он не нужен,
 * клиента нашёл сам человек. Руководитель и владелец могут отдать его
 * другому — так же, как отдают лид в карточке. Дальше это обычный лид:
 * номер заявки, напоминание через 4 часа «что дальше?», статусы и сделка.
 */

export type ManualLeadForm = {
  name: string;
  company: string;
  contact: string;
  need: string;
  from: string;
};

export type ContactKind = "telegram" | "phone" | "email" | "none";

export type ManualLead = {
  name: string;
  company: string;
  contact: string;
  kind: ContactKind;
  need: string;
  from: string;
};

export type ManualLeadError = "no_name" | "no_contact";
export type AddLeadError = ManualLeadError | "assignee" | "offline" | "failed";

/**
 * Контакт — в том виде, по которому его потом найдут: @адрес, номер с «+» и
 * кодом страны, почта строчными. Девять цифр — номер Узбекистана без кода.
 * Чего не узнали — оставляем как написали: человек разберётся, а панель не
 * должна выкидывать то, что ей продиктовали по телефону.
 */
export function contactOf(raw: string): { contact: string; kind: ContactKind } {
  const text = raw.trim().slice(0, 120);
  const tg = text.match(/^(?:@|(?:https?:\/\/)?t\.me\/)([A-Za-z0-9_]{4,32})\/?$/i);
  if (tg) return { contact: `@${tg[1]}`, kind: "telegram" };
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text)) return { contact: text.toLowerCase(), kind: "email" };
  const digits = text.replace(/\D/g, "");
  if (/^[+\d\s()\-.]+$/.test(text) && digits.length >= 9 && digits.length <= 15) {
    return { contact: digits.length === 9 ? `+998${digits}` : `+${digits}`, kind: "phone" };
  }
  return { contact: text, kind: "none" };
}

/** Что пришло из формы — проверенное и обрезанное. */
export function parseManualLead(form: ManualLeadForm): { ok: true; lead: ManualLead } | { ok: false; reason: ManualLeadError } {
  const name = form.name.trim().slice(0, 120);
  if (!name) return { ok: false, reason: "no_name" };
  if (!form.contact.trim()) return { ok: false, reason: "no_contact" };
  const { contact, kind } = contactOf(form.contact);
  return {
    ok: true,
    lead: {
      name,
      company: form.company.trim().slice(0, 120),
      contact,
      kind,
      need: form.need.trim().slice(0, 2000),
      from: form.from.trim().slice(0, 200),
    },
  };
}

const UNKNOWN = "не выяснено — лид добавлен вручную";

/**
 * Строка лида. Квалификации ещё не было, поэтому оценки — средние, как у
 * лидов из касаний и от партнёров: «не выяснено», пока человек не поговорит
 * с клиентом и не поправит в карточке.
 */
export function manualLeadRow(
  lead: ManualLead,
  assignee: { id: string; username: string | null; display_name: string },
  addedBy: { display_name: string },
  requestNo: string,
  nowIso: string,
): Record<string, unknown> {
  const who = lead.company ? `${lead.name}, ${lead.company}` : lead.name;
  return {
    source: "manual",
    request_no: requestNo,
    locale: "ru",
    contact_name: lead.name,
    company: lead.company || null,
    contact_handle: lead.contact,
    contact_kind: lead.kind,
    tg_username: lead.kind === "telegram" ? lead.contact.slice(1) : null,
    niche: lead.company || lead.name,
    niche_tier: 3,
    expertise: "medium",
    services: [],
    budget: "B3",
    authority: "A3",
    need: "N3",
    timing: "T3",
    intent: "exploring",
    score: 0,
    grade: "D",
    priority: "warm",
    breakdown: {},
    summary: {
      client: who,
      request: lead.need || "не записали — уточните у клиента",
      niche: lead.company || lead.name,
      expertise: UNKNOWN,
      budget: UNKNOWN,
      authority: UNKNOWN,
      need: UNKNOWN,
      timing: UNKNOWN,
    },
    notes: [
      `Добавлен вручную: ${addedBy.display_name}.`,
      `Откуда клиент: ${lead.from || "не указали"}.`,
      lead.need ? `\nЧто нужно: ${lead.need}` : "",
    ]
      .filter(Boolean)
      .join("\n"),
    opening_line: null,
    already_told: [],
    avoid_asking: [],
    transcript: [],
    status: "taken",
    assigned_staff_id: assignee.id,
    assigned_to: assignee.username ? `@${assignee.username}` : assignee.display_name,
    assigned_at: nowIso,
  };
}

/**
 * Добавить лид. Отдать другому может только руководитель или владелец —
 * менеджер добавляет себе: иначе лид можно было бы подкинуть коллеге мимо
 * того, кто распределяет работу.
 */
export async function addManualLead(
  actor: Staff,
  form: ManualLeadForm,
  assigneeId: string,
  ip: string,
): Promise<{ ok: true; id: string } | { ok: false; reason: AddLeadError }> {
  const parsed = parseManualLead(form);
  if (!parsed.ok) return parsed;

  const db = serviceClient();
  if (!db) return { ok: false, reason: "offline" };

  let assignee: Staff | null = actor;
  if (assigneeId && assigneeId !== actor.id) {
    if (!approves(actor.role)) return { ok: false, reason: "assignee" };
    assignee = await staffById(assigneeId);
    if (!assignee) return { ok: false, reason: "assignee" };
  }

  const now = new Date();
  const { data, error } = await db
    .from("leads")
    .insert(manualLeadRow(parsed.lead, assignee, actor, newRequestNo(now), now.toISOString()))
    .select("id")
    .maybeSingle();
  if (error || !data) {
    console.error("admin: лид вручную не сохранился", error?.message);
    return { ok: false, reason: "failed" };
  }
  const id = String(data.id);

  await record("lead.added", {
    actorStaffId: actor.id,
    targetType: "lead",
    targetId: id,
    ip,
    meta: { assignee: assignee.id, contact_kind: parsed.lead.kind, assigned_to: handleOf(assignee) },
  });

  // Как у взятого лида: забытый всплывёт сам.
  await createReminder(id, assignee, {
    dueAt: new Date(now.getTime() + AUTO_REMINDER_HOURS * 3600_000).toISOString(),
    kind: "auto",
    note: "Взят в работу — что дальше?",
    ip,
  });

  // Отдали другому — он должен узнать об этом сейчас, а не открыв список.
  if (assignee.id !== actor.id) {
    const who = parsed.lead.company ? `${parsed.lead.name}, ${parsed.lead.company}` : parsed.lead.name;
    await sendMessage(
      assignee.telegram_user_id,
      `<b>Вам добавили лид</b>\n${esc(who)} · ${esc(parsed.lead.contact)}\nДобавил(а): ${esc(actor.display_name)}\n\n${siteUrl}/admin/leads/${id}`,
    );
  }
  return { ok: true, id };
}
