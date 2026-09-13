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
  /**
   * Сколько чатов скаут читает на самом деле: открылись и аккаунт в них
   * состоит.
   *
   * Считается здесь, а не в раннере, потому что раннер однажды посчитал
   * сам — «открыл минус не состою» — и получил минус пять. Формула была
   * верна, пока «не состою» было подмножеством «открыл»; с номерами это не
   * так: невступленный номер не открывается вовсе и в «открыл» не входит.
   * Число ушло в журнал и в пульс на странице панели, прежде чем его
   * заметили.
   */
  reading: number;
};

/** Ровно то, что нам нужно от клиента Telegram, — и ничего больше. */
type Client = {
  getInputEntity: (name: string) => Promise<unknown>;
  getPeerId: (entity: unknown) => Promise<unknown>;
  getDialogs: (params: Record<string, unknown>) => Promise<{ id?: unknown }[]>;
};

export async function openChats(client: Client, names: string[]): Promise<ChatRoster> {
  /**
   * Диалоги — первыми, до разбора адресов. Это не только диагностика.
   *
   * Список диалогов наполняет кэш сущностей клиента всеми чатами, где
   * аккаунт состоит. Без него числовой id из SCOUT_CHATS не открывается
   * вовсе: клиент ищет число только в кэше и на холодном старте бросает
   * «Could not find the input entity» — при том, что README этот формат
   * обещает. А адрес по имени без кэша — это сетевой resolveUsername на
   * каждый чат при каждом перезапуске, и на этот метод у Telegram
   * отдельный тесный лимит: пять выкаток за день — полторы сотни
   * запросов с одного аккаунта. После FLOOD_WAIT все адреса после первого
   * отказавшего «не открываются», и скаут читает три чата из тридцати до
   * следующего перезапуска.
   *
   * Если список не получить — читаем всё равно: молчать про членство
   * хуже, чем не запуститься из-за упавшей проверки.
   */
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

  const opened: OpenedChat[] = [];
  const failed: { name: string; reason: string }[] = [];
  const notJoined: OpenedChat[] = [];

  for (const name of names) {
    try {
      const id = await client.getPeerId(await client.getInputEntity(name));
      opened.push({ name, id: String(id) });
    } catch (error) {
      // Номер, который не открылся, — это не ошибка, а «не состою».
      //
      // Номер открывается только из кэша, кэш наполняют диалоги, то есть
      // чаты, где аккаунт есть. Не нашёлся — значит, ещё не вступили.
      // Раньше такие уходили в «не открыл» с английской ошибкой из
      // библиотеки, по строке на чат: двадцать невступленных — двадцать
      // строк «Could not find the input entity», которые читались как
      // поломка. Адрес по имени сюда не попадает: публичный адрес
      // разбирается у кого угодно, и его провал — настоящая ошибка.
      if (isNumericId(name)) {
        notJoined.push({ name, id: name });
        continue;
      }
      failed.push({
        name,
        reason: error instanceof Error ? error.message : String(error),
      });
    }
  }

  const known = roster;
  const outside = [...(known ? opened.filter((chat) => !known.has(chat.id)) : []), ...notJoined];
  const outsideIds = new Set(outside.map((chat) => chat.id));

  return {
    opened,
    failed,
    outside,
    rosterUnknown: known === null,
    // Пересечение, а не разность длин: см. комментарий к полю.
    reading: opened.filter((chat) => !outsideIds.has(chat.id)).length,
  };
}

function isNumericId(name: string): boolean {
  return /^-?\d+$/.test(name);
}
