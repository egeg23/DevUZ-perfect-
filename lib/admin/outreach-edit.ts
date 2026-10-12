import { waitsForPitch } from "@/lib/admin/hello-first";
import { MAIN_ACCOUNT, accountOf } from "@/lib/admin/work-accounts";
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

/** Сообщение ушло до того, как скаут стал запоминать номера реплик (0153). */
export const NO_NUMBER = "Номер этого сообщения в Telegram не сохранился — поправить его можно только с телефона рабочего аккаунта.";

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
  /**
   * Какая реплика ленты правится (outreach_messages.id) — письмо или ответ
   * после «Здравствуйте». Нет — старая правка: письмо, ушедшее первым
   * сообщением, номер которого лежит в prospects.sent_message_id.
   */
  lineId?: string | null;
};

/** Чем кончилась правка — то, что видно под кнопкой «Исправить». */
export type EditState = "waiting" | "done" | "failed";

export function editState(row: { done_at?: string | null; failure?: string | null }): EditState {
  if (row.failure) return "failed";
  return row.done_at ? "done" : "waiting";
}

/** Реплика ленты, как её видит правка. */
export type EditableLine = {
  direction: string;
  kind?: string | null;
  status: string;
  sent_at?: string | null;
  created_at: string;
  tg_message_id?: string | number | null;
};

/**
 * Приветствие касания — первое, что ушло, до ответа клиента
 * (lib/admin/hello-first.ts). Его не правим: правка превратила бы
 * «Здравствуйте» в письмо незнакомцу — ровно то, за что ограничивают
 * аккаунты.
 */
export function isHelloLine(
  line: Pick<EditableLine, "direction" | "created_at">,
  p: { hello_at?: string | null; pitch_at?: string | null },
): boolean {
  if (line.direction !== "out" || !p.hello_at) return false;
  return !p.pitch_at || Date.parse(line.created_at) < Date.parse(p.pitch_at);
}

/**
 * Можно ли нажать «Исправить» у реплики: наша, текстом (кружок не правится),
 * не приветствие, и либо ещё ждёт отправки, либо ушла с номером не раньше
 * 48 часов назад.
 */
export function lineEditable(
  line: EditableLine,
  p: { hello_at?: string | null; pitch_at?: string | null },
  now = Date.now(),
): boolean {
  if (line.direction !== "out" || (line.kind ?? "text") !== "text") return false;
  if (isHelloLine(line, p)) return false;
  if (line.status === "queued") return true;
  if (line.status !== "sent" || !line.tg_message_id || !line.sent_at) return false;
  return now - Date.parse(line.sent_at) <= EDIT_WINDOW_MS;
}

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
export async function nextEdit(
  /** Править может только отправивший: письмо лежит в его переписке. */
  account: string = MAIN_ACCOUNT,
): Promise<EditJob | null> {
  const db = serviceClient();
  if (!db) return null;

  const { data: rows } = await db
    .from("outreach_edits")
    .select(
      "id, prospect_id, body, message_id, prospects!outreach_edits_prospect_id_fkey (host, target_user_id, sent_message_id, sent_at, sent_via, hello_at, pitch_at), outreach_messages!outreach_edits_message_id_fkey (id, direction, kind, status, sent_at, created_at, tg_message_id, body)",
    )
    .is("done_at", null)
    .is("failure", null)
    .order("created_at", { ascending: true })
    .limit(10);

  for (const data of rows ?? []) {
    const p = (Array.isArray(data.prospects) ? data.prospects[0] : data.prospects) as
      | {
          host: string | null;
          target_user_id: string | number | null;
          sent_message_id: string | null;
          sent_at: string | null;
          sent_via: string | null;
          hello_at: string | null;
          pitch_at: string | null;
        }
      | null;
    const id = String(data.id);

    // Правка чужого аккаунта — её заберёт он сам.
    if (p && accountOf(p.sent_via) !== account) continue;

    // Правка реплики ленты: письма после «Здравствуйте» или ответа.
    if (data.message_id) {
      const line = (Array.isArray(data.outreach_messages) ? data.outreach_messages[0] : data.outreach_messages) as
        | (EditableLine & { id: string; body: string })
        | null;
      if (!line) {
        await markEditFailed(id, "Этого сообщения в переписке уже нет.");
        continue;
      }
      // Ещё не ушло — правим текст в очереди, уйдёт уже исправленным.
      if (line.status === "queued") {
        await db.from("outreach_messages").update({ body: String(data.body) }).eq("id", line.id);
        await db
          .from("outreach_edits")
          .update({ done_at: new Date().toISOString(), previous: line.body })
          .eq("id", id);
        continue;
      }
      if (line.direction !== "out" || (line.kind ?? "text") !== "text" || line.status !== "sent") {
        await markEditFailed(id, "Это сообщение клиенту не уходило — править нечего.");
        continue;
      }
      if (p && isHelloLine(line, p)) {
        await markEditFailed(id, "Приветствие не правим: до ответа клиента ему уходит только оно.");
        continue;
      }
      if (!line.tg_message_id || !p?.target_user_id) {
        await markEditFailed(id, NO_NUMBER);
        continue;
      }
      if (line.sent_at && Date.now() - Date.parse(line.sent_at) > EDIT_WINDOW_MS) {
        await markEditFailed(id, TOO_LATE);
        continue;
      }
      return {
        id,
        prospectId: String(data.prospect_id),
        host: String(p.host ?? ""),
        userId: String(p.target_user_id),
        messageId: Number(line.tg_message_id),
        body: String(data.body),
        sentAt: line.sent_at ?? null,
        lineId: line.id,
      };
    }

    // Ушло только «Здравствуйте», письмо ждёт ответа клиента
    // (lib/admin/hello-first.ts): в Telegram править нечего — правим само
    // письмо, оно уйдёт уже исправленным.
    if (p && waitsForPitch(p)) {
      await db.from("prospects").update({ message: String(data.body) }).eq("id", data.prospect_id);
      await db.from("outreach_edits").update({ done_at: new Date().toISOString() }).eq("id", id);
      continue;
    }

    // Без реплики: sent_message_id после «Здравствуйте» — номер самого
    // приветствия, и правка заменила бы его письмом. Такую правку не делаем.
    if (p?.hello_at) {
      await markEditFailed(id, "Не сказано, какое сообщение править: исправьте его кнопкой «Исправить» у нужной реплики.");
      continue;
    }

    // Править нечего или некому — это итог, а не повод крутиться в очереди.
    if (!p?.target_user_id || !p.sent_message_id) {
      await markEditFailed(id, "Письмо ушло не с рабочего аккаунта или без номера сообщения — править некому.");
      continue;
    }
    if (p.sent_at && Date.now() - Date.parse(p.sent_at) > EDIT_WINDOW_MS) {
      await markEditFailed(id, TOO_LATE);
      continue;
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
  return null;
}

/**
 * Правка прошла: текст письма в карточке и в ленте переписки — тот, что
 * теперь у человека. Иначе модель, отвечая клиенту, опиралась бы на старое
 * письмо — с USTA, которого у человека в переписке уже нет.
 */
export async function markEdited(job: EditJob): Promise<void> {
  const db = serviceClient();
  if (!db) return;

  // Правили реплику ленты: она и есть то, что у человека в переписке.
  // Письмо в карточке — тот же текст, если ушло без перевода.
  if (job.lineId) {
    const { data: line } = await db.from("outreach_messages").select("body").eq("id", job.lineId).maybeSingle();
    const before = (line?.body as string | null) ?? null;
    await db.from("outreach_messages").update({ body: job.body }).eq("id", job.lineId);
    if (before) {
      await db.from("prospects").update({ message: job.body }).eq("id", job.prospectId).eq("message", before);
    }
    await db
      .from("outreach_edits")
      .update({ done_at: new Date().toISOString(), previous: before })
      .eq("id", job.id);
    return;
  }

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

/** Последняя правка — для подписи под кнопкой: ждёт, исправлено или не вышло и почему. */
export type EditView = { state: EditState; failure: string | null; at: string; lineId: string | null };

/** Последняя правка каждой карточки (lineId null — письмо до ответа) и каждой реплики. */
export async function lastEdits(prospectIds: readonly string[]): Promise<Map<string, EditView>> {
  const out = new Map<string, EditView>();
  const db = serviceClient();
  if (!db || !prospectIds.length) return out;
  const { data } = await db
    .from("outreach_edits")
    .select("prospect_id, message_id, done_at, failure, created_at")
    .in("prospect_id", [...prospectIds].slice(0, 200))
    .gte("created_at", new Date(Date.now() - 2 * EDIT_WINDOW_MS).toISOString())
    .order("created_at", { ascending: false })
    .limit(500);
  for (const row of data ?? []) {
    const view: EditView = {
      state: editState(row as { done_at: string | null; failure: string | null }),
      failure: (row.failure as string | null) ?? null,
      at: String(row.created_at),
      lineId: (row.message_id as string | null) ?? null,
    };
    // По карточке — самая свежая любая; по реплике — самая свежая её.
    const card = String(row.prospect_id);
    if (!out.has(card)) out.set(card, view);
    if (view.lineId && !out.has(view.lineId)) out.set(view.lineId, view);
  }
  return out;
}
