import { TASHKENT_OFFSET_MS } from "@/lib/admin/pulse";

/**
 * Группы для скаута — таблица scout_chats поверх SCOUT_CHATS на сервере.
 *
 * Владелец, 06.11.2026: «Давай прокачаем скаута. Найди от 50 групп, где в
 * теории могут искать исполнителей по айтишке…», и следом: «В разделе
 * находки скаута сделай возможность добавлять группы для отслеживания
 * всем. Чтобы и менеджеры и мы прямо там могли добавлять группы и скаут их
 * мониторил. В день самостоятельно не более 10 подписок на группы с
 * интервалом 1-2 часа».
 *
 * Группу добавляет человек в «Сигналах скаута» (app/admin/scout). Скаут
 * (scout/runner.mjs) вступает в неё сам — не больше JOIN_DAILY_CAP за день
 * по Ташкенту, с паузой от JOIN_GAP_MIN_MS до JOIN_GAP_MAX_MS и только днём
 * (JOIN_FROM_HOUR–JOIN_TO_HOUR): массовое вступление — повод для Telegram
 * ограничить аккаунт, а главный аккаунт ещё и переписывается с клиентами.
 *
 * Адрес по имени — сетевой resolveUsername, на него у Telegram тесный лимит.
 * Поэтому при старте разбирается не больше RESOLVE_PER_START новых адресов,
 * а номер, который вернул Telegram, пишется в строку: дальше чат
 * открывается по номеру, без сети.
 */

/** Сколько новых адресов разбирать за один запуск скаута. */
export const RESOLVE_PER_START = 8;

/** Сколько групп скаут вступает сам за день по Ташкенту. */
export const JOIN_DAILY_CAP = 10;
/** Пауза между вступлениями: от часа до двух. */
export const JOIN_GAP_MIN_MS = 60 * 60_000;
export const JOIN_GAP_MAX_MS = 120 * 60_000;
/** Вступает только днём по Ташкенту, как живой человек. */
export const JOIN_FROM_HOUR = 8;
export const JOIN_TO_HOUR = 22;
/** Не удалось вступить по временной причине — следующая попытка не раньше. */
export const RETRY_AFTER_MS = 6 * 3600_000;

export type ChatStatus = "pending" | "joined" | "request" | "error";
export const CHAT_STATUSES: readonly ChatStatus[] = ["pending", "joined", "request", "error"];

export type ScoutChat = {
  id: string;
  handle: string | null;
  invite: string | null;
  title?: string | null;
  chat_id: string | null;
  status: ChatStatus;
  error?: string | null;
  note?: string | null;
  added_by?: string | null;
  added_at?: string;
  tried_at?: string | null;
  joined_at?: string | null;
  joined_via?: "scout" | "manual" | null;
};

const HANDLE_RE = /^[A-Za-z0-9_]{4,32}$/;
const INVITE_RE = /^[A-Za-z0-9_-]{8,64}$/;

/** «@JS_Jobs», «https://t.me/js_jobs», «t.me/s/js_jobs» → «js_jobs». */
export function chatHandle(raw: string): string {
  return raw
    .trim()
    .replace(/^https?:\/\//i, "")
    .replace(/^(www\.)?t(elegram)?\.me\/(s\/)?/i, "")
    .replace(/^@/, "")
    .replace(/[/?#].*$/, "")
    .trim();
}

/**
 * Что человек вставил в поле: адрес группы или ссылку-приглашение.
 * null — ни то, ни другое (бот, личный аккаунт по номеру телефона, мусор).
 */
export function parseChatInput(raw: string): { handle: string } | { invite: string } | null {
  const text = raw.trim();
  if (!text) return null;
  const invite = text.match(/(?:t(?:elegram)?\.me\/)?(?:\+|joinchat\/)([A-Za-z0-9_-]{8,64})\s*$/i);
  if (invite && (text.includes("+") || /joinchat\//i.test(text))) return { invite: invite[1] };
  const handle = chatHandle(text);
  if (!HANDLE_RE.test(handle)) return null;
  // Бота скаут не читает: у бота нет ленты сообщений.
  if (/bot$/i.test(handle)) return null;
  return { handle };
}

export type WatchPlan = {
  /** Что отдать openChats: SCOUT_CHATS, номера из таблицы и порция новых адресов. */
  names: string[];
  /** Адреса, которые разбираются в этот запуск. */
  resolving: string[];
  /** Ещё не разобраны — подождут следующего запуска или вступления. */
  waiting: string[];
};

export function watchPlan(env: readonly string[], chats: readonly ScoutChat[], perStart = RESOLVE_PER_START): WatchPlan {
  const taken = new Set(env.map((item) => chatHandle(item).toLowerCase()));
  const names = [...env];
  const resolving: string[] = [];
  const waiting: string[] = [];
  for (const chat of chats) {
    if (chat.status === "error") continue;
    const handle = chat.handle?.toLowerCase() ?? null;
    if ((handle && taken.has(handle)) || (chat.chat_id && taken.has(chat.chat_id))) continue;
    if (chat.chat_id) {
      taken.add(chat.chat_id);
      names.push(chat.chat_id);
      continue;
    }
    // Закрытую группу по ссылке без номера не открыть: сначала вступление.
    if (!chat.handle || !handle) continue;
    if (resolving.length < perStart) {
      resolving.push(chat.handle);
      names.push(chat.handle);
    } else {
      waiting.push(chat.handle);
    }
    taken.add(handle);
  }
  return { names, resolving, waiting };
}

/** Ошибка, после которой адрес пробовать ещё раз бессмысленно. FLOOD_WAIT и сеть — не такие. */
export function lastingFailure(reason: string): boolean {
  if (/flood|wait|timeout|network|disconnect|ECONN|socket/i.test(reason)) return false;
  return /USERNAME_INVALID|USERNAME_NOT_OCCUPIED|No user has|Cannot find any entity|CHANNEL_PRIVATE|CHANNEL_INVALID|INVITE_HASH_EXPIRED|INVITE_HASH_INVALID/i.test(
    reason,
  );
}

/** Что делать с ответом Telegram на вступление. */
export type JoinOutcome =
  | { kind: "joined" }
  | { kind: "request" }
  | { kind: "error"; reason: string }
  | { kind: "pause"; ms: number; reason: string }
  | { kind: "retry"; reason: string };

export function joinOutcome(error: unknown): JoinOutcome {
  const reason = (error instanceof Error ? error.message : String(error ?? "")).slice(0, 200);
  if (/USER_ALREADY_PARTICIPANT/i.test(reason)) return { kind: "joined" };
  // gramjs отдаёт и код, и текст: «You have successfully requested to join…»
  // (uzsellerclub, 07.11.2026 — заявка ушла, а строка осталась «ждёт»).
  if (/INVITE_REQUEST_SENT|successfully requested to join/i.test(reason)) return { kind: "request" };
  const flood = reason.match(/FLOOD_WAIT_?(\d+)|wait of (\d+) seconds/i);
  if (flood) return { kind: "pause", ms: Number(flood[1] ?? flood[2]) * 1000, reason };
  if (/CHANNELS_TOO_MUCH|FROZEN_METHOD_INVALID|PEER_FLOOD|USER_RESTRICTED/i.test(reason)) {
    return { kind: "pause", ms: 24 * 3600_000, reason };
  }
  if (lastingFailure(reason) || /USER_BANNED_IN_CHANNEL|CHAT_INVALID/i.test(reason)) return { kind: "error", reason };
  return { kind: "retry", reason };
}

/** Начало сегодняшнего дня по Ташкенту, мс. */
export function tashkentDayStart(now: Date): number {
  const shifted = now.getTime() + TASHKENT_OFFSET_MS;
  return shifted - (shifted % 86_400_000) - TASHKENT_OFFSET_MS;
}

/** Пауза после вступления — своя у каждого, но та же после перезапуска: от номера строки. */
export function gapAfter(id: string): number {
  let hash = 0;
  for (const char of id) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return JOIN_GAP_MIN_MS + (hash % (JOIN_GAP_MAX_MS - JOIN_GAP_MIN_MS + 1));
}

export type JoinState = {
  /** Сколько попыток вступить скаут сделал сегодня по Ташкенту (вступил, заявка, отказ). */
  triedToday: number;
  /** Последняя попытка: когда и какая строка. Пауза считается от неё. */
  last: { id: string; at: string } | null;
  /** До какого момента Telegram просил не вступать (FLOOD_WAIT и т. п.). */
  pausedUntil: number | null;
};

/**
 * Можно ли вступать сейчас; если нет — когда станет можно (мс) или null,
 * если сегодня уже нельзя (предел выбран или окно закрылось).
 *
 * Предел — на попытки, а не на удачи: каждое вступление и каждая неудача —
 * запрос в Telegram, а ограничение аккаунт получает за частоту запросов.
 */
export function nextJoinAt(state: JoinState, now: Date): number | null {
  const t = now.getTime();
  const dayStart = tashkentDayStart(now);
  const opens = dayStart + JOIN_FROM_HOUR * 3600_000;
  const closes = dayStart + JOIN_TO_HOUR * 3600_000;
  let at = Math.max(t, opens);
  if (state.pausedUntil) at = Math.max(at, state.pausedUntil);
  if (state.last) at = Math.max(at, new Date(state.last.at).getTime() + gapAfter(state.last.id));
  if (state.triedToday >= JOIN_DAILY_CAP || at >= closes) return null;
  return at;
}

/** Когда снова заглядывать, если сегодня уже нельзя: завтра в начале окна. */
export function tomorrowOpens(now: Date): number {
  return tashkentDayStart(now) + 86_400_000 + JOIN_FROM_HOUR * 3600_000;
}

type RosterView = {
  opened: readonly { name: string; id: string }[];
  failed: readonly { name: string; reason: string }[];
  outside: readonly { name: string; id: string }[];
  rosterUnknown: boolean;
};

export type ChatPatch = Partial<Pick<ScoutChat, "chat_id" | "status" | "error" | "joined_at" | "joined_via">>;

/**
 * Что узнали при старте скаута — обратно в строки: номер чата, «уже
 * состою» (вступили руками или одобрили заявку), «не откроется никогда».
 * FLOOD_WAIT и сеть адрес не губят — попробуем в следующий раз.
 */
export function rosterPatches(chats: readonly ScoutChat[], roster: RosterView, now: Date): { id: string; patch: ChatPatch }[] {
  const key = (name: string) => (/^-?\d+$/.test(name) ? name : chatHandle(name).toLowerCase());
  const opened = new Map(roster.opened.map((chat) => [key(chat.name), chat.id]));
  const failed = new Map(roster.failed.map((chat) => [key(chat.name), chat.reason]));
  const outside = new Set(roster.outside.map((chat) => chat.id));
  const out: { id: string; patch: ChatPatch }[] = [];
  for (const chat of chats) {
    if (chat.status === "error") continue;
    const handle = chat.handle?.toLowerCase() ?? null;
    const id = (handle && opened.get(handle)) || (chat.chat_id && opened.get(chat.chat_id)) || null;
    const patch: ChatPatch = {};
    if (id) {
      if (id !== chat.chat_id) patch.chat_id = id;
      const member = !roster.rosterUnknown && !outside.has(id);
      if (member && chat.status !== "joined") {
        patch.status = "joined";
        patch.error = null;
        patch.joined_at = now.toISOString();
        // Заявку отправлял скаут — одобрили её, вступление его.
        patch.joined_via = chat.status === "request" ? "scout" : "manual";
      } else if (!member && !roster.rosterUnknown && chat.status === "joined") {
        // Вышли или исключили: снова в очередь, вступит заново или скажет почему нет.
        patch.status = "pending";
        patch.joined_at = null;
      }
    } else {
      const reason = (handle && failed.get(handle)) || null;
      if (reason && lastingFailure(reason)) {
        patch.status = "error";
        patch.error = reason.slice(0, 200);
      }
    }
    if (Object.keys(patch).length) out.push({ id: chat.id, patch });
  }
  return out;
}

/** Следующая группа на вступление: по порядку добавления, без недавних неудач. */
export function nextToJoin(chats: readonly ScoutChat[], now: Date): ScoutChat | null {
  const t = now.getTime();
  return (
    chats
      .filter((chat) => chat.status === "pending")
      .filter((chat) => !chat.tried_at || t - new Date(chat.tried_at).getTime() >= RETRY_AFTER_MS)
      .sort((a, b) => (a.added_at ?? "").localeCompare(b.added_at ?? ""))[0] ?? null
  );
}

/**
 * Как часто скаут сверяет свои диалоги с группами из базы. Владелец,
 * 07.11.2026: «Я кстати там вступил в новые группы со скаута, проверь» — до
 * этого вступление руками скаут замечал только при перезапуске (по
 * RESOLVE_PER_START адресов) или когда очередь вступления доходила до
 * группы, по одной в час-два, и всё это время из неё ничего не читал.
 */
export const DIALOG_SYNC_MS = 20 * 60_000;

/** Группа или канал из списка диалогов аккаунта. */
export type DialogView = { id: string; usernames: readonly string[]; title?: string | null };

/**
 * Группы, которые в базе ещё ждут вступления или одобрения заявки, а в
 * диалогах аккаунта уже есть: вступили руками (или одобрили заявку скаута).
 * Сверка по номеру и по адресу; закрытую группу по ссылке без номера
 * узнать не по чему — её отметит очередь вступления (ChatInviteAlready).
 * Список диалогов сетевого resolveUsername не тратит.
 */
export function dialogPatches(
  chats: readonly ScoutChat[],
  dialogs: readonly DialogView[],
  now: Date,
): { id: string; chatId: string; patch: ChatPatch & { title?: string } }[] {
  const byId = new Map(dialogs.map((dialog) => [dialog.id, dialog]));
  const byName = new Map<string, DialogView>();
  for (const dialog of dialogs) {
    for (const name of dialog.usernames) if (name) byName.set(name.toLowerCase(), dialog);
  }
  const out: { id: string; chatId: string; patch: ChatPatch & { title?: string } }[] = [];
  for (const chat of chats) {
    if (chat.status !== "pending" && chat.status !== "request") continue;
    const dialog = (chat.chat_id && byId.get(chat.chat_id)) || (chat.handle && byName.get(chat.handle.toLowerCase())) || null;
    if (!dialog) continue;
    const patch: ChatPatch & { title?: string } = {
      status: "joined",
      error: null,
      joined_at: now.toISOString(),
      // Заявку отправлял скаут — одобрили её, вступление его.
      joined_via: chat.status === "request" ? "scout" : "manual",
    };
    if (dialog.id !== chat.chat_id) patch.chat_id = dialog.id;
    if (!chat.title && dialog.title) patch.title = dialog.title.slice(0, 200);
    out.push({ id: chat.id, chatId: dialog.id, patch });
  }
  return out;
}

/** Ссылка на группу для людей: публичный адрес — t.me/адрес, закрытая — t.me/+ключ. */
export function chatUrl(chat: Pick<ScoutChat, "handle" | "invite">): string {
  return chat.handle ? `https://t.me/${chat.handle}` : `https://t.me/+${chat.invite ?? ""}`;
}

export function isInvite(value: string | null | undefined): boolean {
  return Boolean(value && INVITE_RE.test(value));
}
