/**
 * Чаты скаута из базы — поверх SCOUT_CHATS на сервере.
 *
 * Владелец, 06.11.2026: «Давай прокачаем скаута. Найди от 50 групп, где в
 * теории могут искать исполнителей по айтишке… выведи удобным списком прямо
 * через бота нашего в тг… подпишемся на эти паблики». Список SCOUT_CHATS
 * живёт в `.env` сервера, и каждая новая группа — правка руками на боевой
 * машине. Поэтому новые чаты лежат строкой stats_snapshots с ключом
 * `scout-chats`: `{ chats: [{ name: "handle", id?, error?, added?, note? }] }`.
 *
 * Вступать скаут по-прежнему не умеет (`chats()` в scout/runner.mjs): в чат
 * входит человек, руками и не за один день. Чат из списка, в котором аккаунт
 * не состоит, всё равно стоит в фильтре — вступили, и сообщения пошли без
 * перезапуска (lib/scout/chats.ts).
 *
 * Адрес по имени — сетевой resolveUsername, а на него у Telegram тесный
 * лимит: пять выкаток за день — полторы сотни запросов. Поэтому за один
 * запуск разбирается не больше RESOLVE_PER_START новых адресов, а номер,
 * который Telegram вернул, записывается обратно в список: со следующего
 * запуска чат открывается по номеру, без сети.
 */

export const EXTRA_CHATS_KEY = "scout-chats";

/** Сколько новых адресов разбирать за один запуск скаута. */
export const RESOLVE_PER_START = 8;

export type ExtraChat = {
  /** Адрес без @ и без t.me/. */
  name: string;
  /** Номер чата, который вернул Telegram: дальше открываем по нему. */
  id?: string | null;
  /** Адрес не открылся насовсем (нет такого, закрыт): больше не пробуем. */
  error?: string | null;
  added?: string;
  note?: string;
};

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

export function parseExtraChats(payload: unknown): ExtraChat[] {
  const list = (payload as { chats?: unknown } | null)?.chats;
  if (!Array.isArray(list)) return [];
  const out: ExtraChat[] = [];
  const seen = new Set<string>();
  for (const item of list) {
    const raw = item as Record<string, unknown> | null;
    const name = typeof raw?.name === "string" ? chatHandle(raw.name) : "";
    if (!name || seen.has(name.toLowerCase())) continue;
    seen.add(name.toLowerCase());
    out.push({
      name,
      id: typeof raw?.id === "string" && /^-?\d+$/.test(raw.id) ? raw.id : null,
      error: typeof raw?.error === "string" ? raw.error : null,
      ...(typeof raw?.added === "string" ? { added: raw.added } : {}),
      ...(typeof raw?.note === "string" ? { note: raw.note } : {}),
    });
  }
  return out;
}

export type WatchPlan = {
  /** Что отдать openChats: SCOUT_CHATS, номера из базы и порция новых адресов. */
  names: string[];
  /** Адреса, которые разбираются в этот запуск. */
  resolving: string[];
  /** Ещё не разобраны — подождут следующего запуска. */
  waiting: string[];
};

export function watchPlan(env: readonly string[], extra: readonly ExtraChat[], perStart = RESOLVE_PER_START): WatchPlan {
  const taken = new Set(env.map((item) => chatHandle(item).toLowerCase()));
  const names = [...env];
  const resolving: string[] = [];
  const waiting: string[] = [];
  for (const chat of extra) {
    if (chat.error) continue;
    if (taken.has(chat.name.toLowerCase()) || (chat.id && taken.has(chat.id))) continue;
    if (chat.id) {
      taken.add(chat.id);
      names.push(chat.id);
      continue;
    }
    if (resolving.length < perStart) {
      resolving.push(chat.name);
      names.push(chat.name);
    } else {
      waiting.push(chat.name);
    }
    taken.add(chat.name.toLowerCase());
  }
  return { names, resolving, waiting };
}

/** Ошибка, после которой адрес пробовать ещё раз бессмысленно. FLOOD_WAIT и сеть — не такие. */
export function lastingFailure(reason: string): boolean {
  if (/flood|wait|timeout|network|disconnect|ECONN|socket/i.test(reason)) return false;
  return /USERNAME_INVALID|USERNAME_NOT_OCCUPIED|No user has|Cannot find any entity|CHANNEL_PRIVATE|CHANNEL_INVALID/i.test(reason);
}

/**
 * Список с тем, что узнали в этот запуск: номера открывшихся адресов и
 * отметка у тех, что не откроются никогда. null — менять нечего.
 */
export function withResolved(
  extra: readonly ExtraChat[],
  opened: readonly { name: string; id: string }[],
  failed: readonly { name: string; reason: string }[] = [],
): ExtraChat[] | null {
  const ids = new Map(opened.map((chat) => [chat.name.toLowerCase(), chat.id]));
  const lost = new Map(failed.filter((f) => lastingFailure(f.reason)).map((f) => [f.name.toLowerCase(), f.reason]));
  let changed = false;
  const next = extra.map((chat) => {
    const key = chat.name.toLowerCase();
    const id = ids.get(key);
    if (!chat.id && id && /^-?\d+$/.test(id)) {
      changed = true;
      return { ...chat, id };
    }
    const reason = lost.get(key);
    if (!chat.id && !chat.error && reason) {
      changed = true;
      return { ...chat, error: reason.slice(0, 200) };
    }
    return chat;
  });
  return changed ? next : null;
}
