/**
 * Накопитель сообщений между чтением и разбором.
 *
 * Клиент Telegram отдаёт сообщения по одному и сразу. Разбирать их по
 * одному нельзя: каждый вызов модели — это отдельная плата за один и тот
 * же системный промпт и отдельная задержка. Поэтому сообщения копятся и
 * уходят пачкой — либо когда пачка набралась, либо когда истекло окно.
 *
 * Окно нужно не для экономии, а против тишины: в чате, где пишут раз в
 * полчаса, сообщение иначе лежало бы до набора пачки, то есть до вечера.
 */

export type BufferedMessage = {
  chatId: number;
  messageId: number;
  [key: string]: unknown;
};

export type Buffer<T extends BufferedMessage> = {
  push: (message: T) => void;
  /** Отправить накопленное немедленно. */
  flush: () => Promise<void>;
  /** Остановить окно и слить остаток. */
  stop: () => Promise<void>;
  size: () => number;
};

export type BufferOptions<T extends BufferedMessage> = {
  /** Сколько ждать, прежде чем отправить неполную пачку. */
  flushMs: number;
  /** Размер, при котором пачка уходит не дожидаясь окна. */
  maxBatch: number;
  onFlush: (batch: T[]) => Promise<void>;
  /** Подменяется в тестах; в бою — setTimeout. */
  timer?: {
    set: (fn: () => void, ms: number) => unknown;
    clear: (handle: unknown) => void;
  };
};

export function createBuffer<T extends BufferedMessage>(
  options: BufferOptions<T>,
): Buffer<T> {
  const timer = options.timer ?? {
    set: (fn: () => void, ms: number) => setTimeout(fn, ms),
    clear: (handle: unknown) => clearTimeout(handle as ReturnType<typeof setTimeout>),
  };

  /**
   * Ключ — пара «чат + сообщение». Клиент присылает одно и то же дважды
   * чаще, чем кажется: при переподключении, при правке сообщения, при
   * пересылке апдейта. Дубль в пачке — это дубль в ленте оператора и
   * лишний вызов модели.
   */
  const pending = new Map<string, T>();

  let handle: unknown = null;
  let stopped = false;

  /**
   * Отправки не идут внахлёст.
   *
   * Разбор пачки занимает секунды, и за это время окно успевает истечь
   * снова. Две одновременные отправки читают и очищают один и тот же
   * накопитель: часть сообщений уходит дважды, часть теряется.
   *
   * Первая версия делала это цепочкой промисов с рекурсивным доливом
   * внутри — и вставала намертво. Долив вызывался из тела отправки и
   * пристраивался в ту же очередь, то есть ждал завершения отправки,
   * внутри которой он и был запущен. Поймал тест на перекрытии; ни типы,
   * ни сборка такого не видят.
   *
   * Поэтому теперь не цепочка, а один проход с циклом: он сам выгребает
   * всё, что накопилось, включая пришедшее за время разбора.
   */
  let current: Promise<void> | null = null;

  async function drain(): Promise<void> {
    while (pending.size) {
      const batch = [...pending.values()].slice(0, options.maxBatch);
      for (const item of batch) pending.delete(key(item));

      try {
        await options.onFlush(batch);
      } catch (error) {
        // Разбор упал — сообщения уже забраны и обратно не возвращаются.
        // Возврат выглядел бы заботливее, но означал бы вечный цикл на
        // сообщении, которое ломает разбор каждый раз.
        console.error("scout: пачка не разобрана", error);
      }
    }
  }

  function schedule(): void {
    if (stopped || handle !== null || !pending.size) return;
    handle = timer.set(() => {
      handle = null;
      void flush();
    }, options.flushMs);
  }

  function flush(): Promise<void> {
    // Проход уже идёт — дожидаемся его. Он сам подберёт то, что пришло за
    // это время; если между концом цикла и сбросом флага что-то успело
    // прилететь, запускаем ещё один.
    if (current) {
      return current.then(() => (pending.size ? flush() : undefined));
    }

    current = drain().finally(() => {
      current = null;
    });
    return current;
  }

  function key(message: T): string {
    return `${message.chatId}:${message.messageId}`;
  }

  return {
    push(message: T): void {
      if (stopped) return;
      pending.set(key(message), message);

      if (pending.size >= options.maxBatch) {
        if (handle !== null) {
          timer.clear(handle);
          handle = null;
        }
        void flush();
        return;
      }
      schedule();
    },

    flush,

    async stop(): Promise<void> {
      stopped = true;
      if (handle !== null) {
        timer.clear(handle);
        handle = null;
      }
      await flush();
    },

    size: () => pending.size,
  };
}
