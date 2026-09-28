import { serviceClient } from "@/lib/supabase";

/**
 * Правка уже отправленного касания — то, что читает процесс скаута.
 *
 * 28 сентября мебельным компаниям ушли письма с USTA вместо мебельного
 * примера. Письмо написано и прочитано, но Telegram разрешает отправителю
 * править своё сообщение 48 часов, а отправитель — рабочий аккаунт. Поэтому
 * правка идёт тем же путём, что и отправка: строка в очереди, скаут её
 * забирает. Модуль отдельный и лёгкий по той же причине, что и очередь
 * касаний: у скаута своё окружение.
 */

/** Сколько Telegram даёт на правку своего сообщения в личке. */
export const EDIT_WINDOW_MS = 48 * 60 * 60_000;

/** Что пишется у правки, опоздавшей к окну. Одно на базу и на скаута. */
export const TOO_LATE = "Прошло больше 48 часов после отправки — Telegram править уже не даёт.";

export type EditJob = {
  id: string;
  prospectId: string;
  host: string;
  /** Кому ушло письмо — числовой id в Telegram. */
  userId: string;
  /** Номер отправленного сообщения в переписке. */
  messageId: number;
  body: string;
  sentAt: string | null;
};

/**
 * Что делать с ответом Telegram на правку.
 *
 * «Не изменилось» — не ошибка: текст уже такой, какой нужен (правку
 * повторили, или её сделали руками с телефона). «Время вышло» — не сбой,
 * а граница: после 48 часов письмо уже не поправить, и повторять незачем.
 */
export function editOutcome(errorMessage: string): "done" | "expired" | "failed" {
  if (/MESSAGE_NOT_MODIFIED/i.test(errorMessage)) return "done";
  if (/MESSAGE_EDIT_TIME_EXPIRED/i.test(errorMessage)) return "expired";
  return "failed";
}

type SentMessage = {
  className?: string;
  id?: unknown;
  out?: boolean;
  peerId?: { className?: string; userId?: { toString(): string } | number | string };
};

/**
 * Письмо под этим номером — наше и ушло именно этому человеку.
 *
 * Номер сообщения берётся из карточки, а правка необратима: человек увидит
 * новый текст с пометкой «изменено». Перепутанный номер правил бы чужую
 * переписку — поэтому перед правкой письмо читается из Telegram и
 * сверяется: оно есть, написали его мы, и адресат тот, что в карточке.
 *
 * Отсюда же берётся адресат для правки: ответ Telegram приносит его вместе
 * с ключом доступа, а без ключа после перезапуска скаута до переписки не
 * дотянуться — кэш адресатов в сессии не хранится.
 */
export function sentCheck(
  found: { messages?: readonly unknown[]; users?: readonly unknown[] } | null | undefined,
  job: Pick<EditJob, "userId" | "messageId">,
): { ok: true; user: unknown } | { ok: false; why: string } {
  const message = (found?.messages ?? []).find(
    (m) => (m as SentMessage | null)?.className === "Message" && Number((m as SentMessage).id) === job.messageId,
  ) as SentMessage | undefined;
  if (!message) return { ok: false, why: "Письма с этим номером в переписке нет — его удалили." };
  if (message.out !== true) return { ok: false, why: "Сообщение с этим номером написали нам, а не мы — править нельзя." };
  if (message.peerId?.className !== "PeerUser" || String(message.peerId.userId) !== job.userId) {
    return { ok: false, why: "Сообщение с этим номером ушло не тому, кто в карточке, — правку не делаем." };
  }
  const user = (found?.users ?? []).find((u) => String((u as { id?: unknown } | null)?.id) === job.userId);
  return { ok: true, user: user ?? job.userId };
}

/** Следующая правка: самая старая из несделанных, у которой есть что править. */
export async function nextEdit(): Promise<EditJob | null> {
  const db = serviceClient();
  if (!db) return null;

  const { data } = await db
    .from("outreach_edits")
    .select("id, prospect_id, body, prospects!outreach_edits_prospect_id_fkey (host, target_user_id, sent_message_id, sent_at)")
    .is("done_at", null)
    .is("failure", null)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (!data) return null;

  const p = (Array.isArray(data.prospects) ? data.prospects[0] : data.prospects) as
    | { host: string | null; target_user_id: string | number | null; sent_message_id: string | null; sent_at: string | null }
    | null;
  const id = String(data.id);

  // Править нечего или некому — это итог, а не повод крутиться в очереди.
  if (!p?.target_user_id || !p.sent_message_id) {
    await markEditFailed(id, "Письмо ушло не с рабочего аккаунта или без номера сообщения — править некому.");
    return nextEdit();
  }
  if (p.sent_at && Date.now() - Date.parse(p.sent_at) > EDIT_WINDOW_MS) {
    await markEditFailed(id, TOO_LATE);
    return nextEdit();
  }

  return {
    id,
    prospectId: String(data.prospect_id),
    host: String(p.host ?? ""),
    userId: String(p.target_user_id),
    messageId: Number(p.sent_message_id),
    body: String(data.body),
    sentAt: p.sent_at,
  };
}

/**
 * Правка прошла: текст письма в карточке и в ленте переписки — тот, что
 * теперь у человека. Иначе модель, отвечая клиенту, опиралась бы на старое
 * письмо — с USTA, которого у человека в переписке уже нет.
 */
export async function markEdited(job: EditJob): Promise<void> {
  const db = serviceClient();
  if (!db) return;

  const { data: prospect } = await db.from("prospects").select("message").eq("id", job.prospectId).maybeSingle();
  const previous = (prospect?.message as string | null) ?? null;

  await db.from("prospects").update({ message: job.body }).eq("id", job.prospectId);
  if (previous) {
    await db
      .from("outreach_messages")
      .update({ body: job.body })
      .eq("prospect_id", job.prospectId)
      .eq("direction", "out")
      .eq("body", previous);
  }
  await db
    .from("outreach_edits")
    .update({ done_at: new Date().toISOString(), previous })
    .eq("id", job.id);
}

export async function markEditFailed(id: string, why: string): Promise<void> {
  const db = serviceClient();
  if (!db) return;
  await db.from("outreach_edits").update({ failure: why.slice(0, 300) }).eq("id", id);
}
