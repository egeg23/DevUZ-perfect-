import { PUSH_TIMEOUT_MS, privateChatId, pushPayload, type PushButton } from "@/lib/admin/push";
import { deliverAll, subscribedChats, type FanoutResult, type StoredSubscription } from "@/lib/admin/push-store";
import { noteBell } from "@/lib/admin/bell-store";
import { siteUrl } from "@/lib/seo";

/**
 * Зеркало сообщений бота в пуш (CLAUDE.md, «Панель — приложение на
 * телефоне и пуш»).
 *
 * Висит в одном месте — у отправки в Telegram (lib/qualify/telegram.ts:
 * sendMessage, кнопки, карточка лида, картинка). Расставлять пуш по
 * полутора сотням мест, откуда бот пишет команде, — значит забыть
 * половину; здесь любое новое сообщение сотруднику уходит пушем само.
 *
 * Что не зеркалится — решает не это место, а то, через что идёт отправка:
 * правки уже отправленных сообщений (editMessage, setButtons), рассылка
 * «Пользователям бота» (sendBroadcastMessage) и код входа в приложение
 * (`mirror: false`) сюда не заходят. Здесь отсекаются группы и чаты не
 * сотрудников: пуш уходит, только если чат — личка активного сотрудника с
 * подпиской.
 *
 * Telegram пуш никогда не ждёт: вызов не возвращает обещание, всё
 * происходит в фоне, отправка в службу пуша ограничена пятью секундами, а
 * ошибки только пишутся в лог.
 *
 * Отсюда же — колокольчик в шапке панели (lib/admin/bell-store.ts): то же
 * сообщение строкой у сотрудника, с подпиской на пуш или без.
 */

type Deps = {
  chats?: () => Promise<Map<number, StoredSubscription[]>>;
  deliver?: (subs: readonly StoredSubscription[], payload: ReturnType<typeof pushPayload>) => Promise<FanoutResult>;
  site?: string;
  /** Сколько ждать всё вместе — для тестов. */
  timeoutMs?: number;
  /** Колокольчик: по умолчанию noteBell, false — не писать (тесты). */
  bell?: typeof noteBell | false;
};

const inFlight = new Set<Promise<unknown>>();

/** Дождаться всех пушей в пути — для тестов и аккуратной остановки. */
export async function pushInFlight(): Promise<void> {
  await Promise.allSettled([...inFlight]);
}

async function mirror(
  chatId: number | string,
  html: string,
  rows: readonly (readonly PushButton[])[],
  silent: boolean,
  deps: Deps,
): Promise<FanoutResult | null> {
  const id = privateChatId(chatId);
  if (id === null) return null;
  // Ссылка входа (/login) — одноразовый вход, ему не место на экране блокировки.
  if (/\/admin\/login\?t=/.test(html)) return null;
  const subs = (await (deps.chats ?? subscribedChats)()).get(id);
  if (!subs?.length) return null;
  const payload = pushPayload(html, rows, deps.site ?? siteUrl, silent);
  return (deps.deliver ?? deliverAll)(subs, payload);
}

/**
 * Отправить пушем копию сообщения бота. Ничего не возвращает и не бросает:
 * Telegram ждать нечего.
 */
export function mirrorToPush(
  chatId: number | string,
  html: string,
  rows: readonly (readonly PushButton[])[] = [],
  options: { silent?: boolean } = {},
  deps: Deps = {},
): void {
  // Группа или канал — даже в базу не ходим.
  if (privateChatId(chatId) === null) return;
  const bell = deps.bell === undefined ? noteBell : deps.bell;
  if (bell) {
    const noted = bell(chatId, html, rows)
      .catch((error: unknown) => console.error("колокольчик: не записал —", error instanceof Error ? error.message : error))
      .finally(() => inFlight.delete(noted));
    inFlight.add(noted);
  }
  let timer: ReturnType<typeof setTimeout> | undefined;
  const run = Promise.race([
    mirror(chatId, html, rows, options.silent ?? false, deps),
    new Promise<null>((resolve) => {
      // Подписки, ключи и сама отправка — всё вместе не дольше этого.
      timer = setTimeout(() => resolve(null), deps.timeoutMs ?? PUSH_TIMEOUT_MS + 1_000);
    }),
  ])
    .catch((error: unknown) => {
      console.error("пуш: зеркало не ушло —", error instanceof Error ? error.message : error);
      return null;
    })
    .finally(() => {
      clearTimeout(timer);
      inFlight.delete(run);
    });
  inFlight.add(run);
}
