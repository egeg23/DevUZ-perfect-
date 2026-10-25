/**
 * «Входящие» — одна очередь того, что ждёт ответа человека.
 *
 * Владелец, 25.10.2026, на разбор «чем мы уступаем HubSpot и Close»:
 * «Погнали по порядку». У них всё, на что надо ответить, — одной очередью,
 * её проходят подряд. У нас то же лежало в трёх местах: ответ клиента на
 * касание — строкой в Telegram и в карточке лида, обращение в бота — только
 * в Telegram владельца и руководителя, новые заявки — в «Лидах».
 *
 * Здесь — без базы: кто что видит и в каком порядке. Строки —
 * lib/admin/inbox-store.ts. Правила «чьё» — те же, что у «Главной»
 * менеджера (`mineReply`): касание с лидом — хозяину лида, без лида — тому,
 * кто ведёт касание.
 */
import { mineReply } from "@/lib/admin/hq-my";
import { seesEveryone, type Role } from "@/lib/admin/roles";

export type InboxTouch = {
  kind: "touch";
  prospectId: string;
  leadId: string | null;
  label: string;
  /** С какого входящего клиент ждёт: самое раннее неотвеченное. */
  since: string;
  /** Последние слова клиента. */
  text: string;
  ownerId: string | null;
};

export type InboxBot = {
  kind: "bot";
  chatId: number;
  label: string;
  since: string;
  text: string;
  /** Кто из команды ведёт разговор (bot_users.human_by). */
  ownerId: string | null;
};

export type InboxItem = InboxTouch | InboxBot;

/**
 * Касание ждёт человека: модель разговор отпустила или его забрали
 * («Отвечать самому»), касание не закрыто, а входящее не отвечено.
 * Автоответчик («Мы ответим в рабочее время») — не ответ клиента.
 */
export function touchWaits(p: { ai_handling: boolean | null; closed_at: string | null }, msg: { kind: string | null }): boolean {
  return p.ai_handling === false && !p.closed_at && msg.kind !== "auto";
}

/**
 * Обращение в бота ждёт человека: разговор ведёт человек (модель молчит
 * HUMAN_HOLD_DAYS), а клиент написал после его ответа. Остальное в боте
 * ведёт модель — ей отвечать не нужно.
 */
export function botWaits(
  u: { human_at: string | null; last_text_at: string | null; blocked_at: string | null },
  now: number,
  holdDays: number,
): boolean {
  if (!u.human_at || !u.last_text_at || u.blocked_at) return false;
  const human = Date.parse(u.human_at);
  return now - human < holdDays * 86_400_000 && Date.parse(u.last_text_at) > human;
}

/** Обращения в бота — только владельцу и руководителю, как «📩 Обращение в бота». */
export function seesBotInbox(role: Role): boolean {
  return role === "admin" || role === "head";
}

/**
 * Что видит человек: менеджер — свои касания (mineReply), руководитель и
 * владелец — все и обращения в бота. Дольше ждёт — выше.
 */
export function inboxFor(
  items: readonly (InboxItem & { mine?: { hasLead: boolean; leadOwner: string | null; handled_by: string | null; claimed_by: string | null; touched_by: string | null } })[],
  viewer: { id: string; role: Role },
): InboxItem[] {
  const all = seesEveryone(viewer.role);
  return items
    .filter((item) => {
      if (item.kind === "bot") return seesBotInbox(viewer.role);
      if (all) return true;
      return item.mine ? mineReply(item.mine, viewer.id) : item.ownerId === viewer.id;
    })
    .map(({ ...item }) => {
      delete (item as { mine?: unknown }).mine;
      return item as InboxItem;
    })
    .sort((a, b) => Date.parse(a.since) - Date.parse(b.since));
}

/** Сколько клиент ждёт, в минутах. */
export function waitedMinutes(since: string, now: number): number {
  const ms = Date.parse(since);
  return Number.isNaN(ms) ? 0 : Math.max(0, Math.floor((now - ms) / 60_000));
}
