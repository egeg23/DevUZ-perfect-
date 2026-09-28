import type { Staff } from "@/lib/admin/session";
import { record } from "@/lib/admin/audit";
import type { Role } from "@/lib/admin/roles";
import { serviceClient } from "@/lib/supabase";

/**
 * Какие сообщения бота кому приходят.
 *
 * Владелец, 28.09: «чтобы он [Александр] и я могли выбирать, что приходит
 * менеджерам. По умолчанию приходит всё. Но мы можем через галочки выбрать,
 * что идёт, а что нет».
 *
 * Хранится список выключенного, а не включённого. Так «по умолчанию всё»
 * держится само: новый сотрудник получает всё, и новый вид сообщений,
 * добавленный позже, тоже приходит всем, пока его кто-то не выключит.
 * Список включённого пришлось бы дописывать каждому при каждом новом виде
 * — и забытая строка молча лишала бы человека уведомлений.
 *
 * Служебное — приглашение, смена роли и руководителя, просьба подтвердить
 * передачу — здесь не выключается: это не рассылка, а действие, которое
 * без сообщения не состоится.
 */

export const NOTICE_KINDS = [
  "queue",
  "open",
  "watch",
  "reminders",
  "messages",
  "transfers",
  "talks",
  "portion",
  "coach",
  "reports",
] as const;
export type NoticeKind = (typeof NOTICE_KINDS)[number];

export function isNoticeKind(value: string): value is NoticeKind {
  return (NOTICE_KINDS as readonly string[]).includes(value);
}

const EVERYONE: readonly Role[] = ["admin", "head", "manager"];
const IN_QUEUE: readonly Role[] = ["head", "manager"];

/**
 * Названия — ровно как на странице «Команда», пояснение — что будет, если
 * выключить. Второе важнее первого: галочку «Новые заявки по очереди»
 * снимают, не думая, что человек тем самым выходит из очереди.
 */
export const NOTICES: Record<NoticeKind, { title: string; off: string; roles: readonly Role[] }> = {
  queue: {
    title: "Новые заявки по очереди",
    off: "человек выходит из очереди: лиды ему не предлагаются и идут следующему",
    roles: IN_QUEUE,
  },
  open: {
    title: "Заявки для всех",
    off: "ночные заявки и те, что очередь не разобрала, ему не приходят — только в панели",
    roles: EVERYONE,
  },
  watch: {
    title: "Копии предложений очереди",
    off: "не приходит, кому и когда очередь предложила лид",
    roles: ["admin"],
  },
  reminders: {
    title: "Напоминания по лидам",
    off: "напоминания не приходят в Telegram, видны только в панели",
    roles: EVERYONE,
  },
  messages: {
    title: "Сообщения в чате лида",
    off: "о новом сообщении коллеги в карточке его лида бот не пишет",
    roles: EVERYONE,
  },
  transfers: {
    title: "Передачи лидов",
    off: "не приходит «вам передали лид» и ответ на его просьбу о передаче",
    roles: EVERYONE,
  },
  talks: {
    title: "Ответы клиентов на касания",
    off: "ответ клиента на касание виден только в «Касаниях» — бот не позовёт",
    roles: EVERYONE,
  },
  portion: {
    title: "Порция касаний на день",
    off: "порция утром не приходит в Telegram, но остаётся в «Касаниях»",
    roles: IN_QUEUE,
  },
  coach: {
    title: "Рекомендации на неделю",
    off: "недельный разбор не приходит, но есть на главной панели",
    roles: IN_QUEUE,
  },
  reports: {
    title: "Отчёты: порция дня и сводка на сегодня",
    off: "вечерний отчёт по порциям и утренняя сводка не приходят",
    roles: ["admin", "head"],
  },
};

/** Какие галочки у этой роли вообще есть. Остальное ей и так не приходит. */
export function kindsFor(role: Role): NoticeKind[] {
  return NOTICE_KINDS.filter((kind) => NOTICES[kind].roles.includes(role));
}

/** Хочет ли человек получать это. Пусто или непонятно — хочет: по умолчанию всё. */
export function wants(off: readonly string[] | null | undefined, kind: NoticeKind): boolean {
  return !(off ?? []).includes(kind);
}

/**
 * Из формы с галочками — список выключенного.
 *
 * Форма присылает только отмеченное, поэтому выключено всё, что положено
 * роли и не пришло. Лишнее и чужое отбрасывается: галочку, которой у роли
 * нет, прислать можно, а записать — нет.
 */
export function offFromForm(checked: readonly string[], role: Role): NoticeKind[] {
  const on = new Set(checked);
  return kindsFor(role).filter((kind) => !on.has(kind));
}

/** Что выключено — строкой для страницы: «всё приходит» или перечень. */
export function offSummary(off: readonly string[] | null | undefined, role: Role): string {
  const muted = kindsFor(role).filter((kind) => !wants(off, kind));
  if (!muted.length) return "приходит всё";
  if (muted.length === kindsFor(role).length) return "всё выключено";
  return `выключено: ${muted.length} из ${kindsFor(role).length}`;
}

/* ── База ───────────────────────────────────────────────────────────────── */

type Row = { id: string; telegram_user_id: number | null; notify_off: string[] | null };

async function activeRows(): Promise<Row[] | null> {
  const db = serviceClient();
  if (!db) return null;
  const { data, error } = await db
    .from("staff")
    .select("id, telegram_user_id, notify_off")
    .eq("is_active", true);
  if (error) return null;
  return (data as Row[] | null) ?? [];
}

/**
 * Чаты сотрудников, выключивших этот вид сообщений.
 *
 * При сбое базы — пусто, то есть сообщение уходит всем. Лишнее сообщение
 * хуже тишины только для того, кто сам его выключил; потерянная заявка —
 * для всех.
 */
export async function mutedChats(kind: NoticeKind): Promise<Set<string>> {
  const rows = await activeRows();
  const out = new Set<string>();
  for (const row of rows ?? []) {
    if (row.telegram_user_id !== null && !wants(row.notify_off, kind)) out.add(String(row.telegram_user_id));
  }
  return out;
}

/** Писать ли в этот чат. Чат не сотрудника (группа продаж) — писать. */
export async function allowsChat(kind: NoticeKind, chat: number | string | null | undefined): Promise<boolean> {
  if (chat === null || chat === undefined || chat === "") return true;
  return !(await mutedChats(kind)).has(String(chat));
}

export type NoticesResult = { ok: true } | { ok: false; reason: "offline" | "gone" | "failed" };

/** Записать галочки. Кто вправе — решает `tunesNotices` в действии страницы. */
export async function setNotices(
  staffId: string,
  off: readonly NoticeKind[],
  actor: Staff,
  ip: string,
): Promise<NoticesResult> {
  const db = serviceClient();
  if (!db) return { ok: false, reason: "offline" };

  const { data, error } = await db
    .from("staff")
    .update({ notify_off: [...off] })
    .eq("id", staffId)
    .select("id")
    .maybeSingle();
  if (error) return { ok: false, reason: "failed" };
  if (!data) return { ok: false, reason: "gone" };

  await record("staff.notices", {
    actorStaffId: actor.id,
    targetType: "staff",
    targetId: staffId,
    ip,
    meta: { off: [...off] },
  });
  return { ok: true };
}
