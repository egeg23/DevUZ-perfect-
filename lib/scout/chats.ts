/**
 * Открытие чатов до подписки на события.
 *
 * NewMessage({chats}) умеет разбирать адреса сам, но делает это одним
 * списком и без пощады: первый же адрес, который не открылся, роняет разбор
 * целиком. Ошибку библиотека ловит и продолжает работу, а флаг «разобрано»
 * оставляет снятым — и обработчик не выполняется ни разу, ни для одного
 * чата. Со стороны это выглядит как исправный сервис: строка «читаю 16
 * чатов» напечатана, systemd показывает active, в журнале тишина. Одна
 * опечатка из шестнадцати — и не читается ни один.
 *
 * Поэтому адреса разбираются здесь, по одному, и в фильтр уходят уже
 * готовые номера: на них разбор не нужен и упасть ему негде.
 */

export type OpenedChat = { name: string; id: string };

export type ChatRoster = {
  /** Открылись: адрес существует и доступен аккаунту. */
  opened: OpenedChat[];
  /** Не открылись вовсе — с причиной, как её назвал Telegram. */
  failed: { name: string; reason: string }[];
  /**
   * Открылись, но аккаунт в них не состоит.
   *
   * Разница неочевидна и стоит дня поисков: публичный адрес разбирается у
   * кого угодно, вступать для этого не нужно, — а вот обновления Telegram
   * шлёт только по тем чатам, где аккаунт состоит. Такой чат виден в
   * списке, ошибок не даёт и не присылает ничего.
   */
  outside: OpenedChat[];
  /** Список диалогов получить не удалось: про членство ничего не известно. */
  rosterUnknown: boolean;
};

/** Ровно то, что нам нужно от клиента Telegram, — и ничего больше. */
type Client = {
  getInputEntity: (name: string) => Promise<unknown>;
  getPeerId: (entity: unknown) => Promise<unknown>;
  getDialogs: (params: Record<string, unknown>) => Promise<{ id?: unknown }[]>;
};

export async function openChats(client: Client, names: string[]): Promise<ChatRoster> {
  const opened: OpenedChat[] = [];
  const failed: { name: string; reason: string }[] = [];

  for (const name of names) {
    try {
      const id = await client.getPeerId(await client.getInputEntity(name));
      opened.push({ name, id: String(id) });
    } catch (error) {
      failed.push({
        name,
        reason: error instanceof Error ? error.message : String(error),
      });
    }
  }

  // Сверка с диалогами — диагностика, а не условие работы. Если она не
  // удалась, скаут всё равно читает: молчать про членство хуже, чем не
  // запуститься из-за упавшей проверки.
  let roster: Set<string> | null = null;
  try {
    const dialogs = await client.getDialogs({});
    roster = new Set(
      dialogs
        .map((dialog) => (dialog.id === undefined || dialog.id === null ? "" : String(dialog.id)))
        .filter(Boolean),
    );
  } catch {
    roster = null;
  }

  const known = roster;
  return {
    opened,
    failed,
    outside: known ? opened.filter((chat) => !known.has(chat.id)) : [],
    rosterUnknown: known === null,
  };
}
