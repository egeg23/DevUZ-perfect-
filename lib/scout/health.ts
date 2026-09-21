import { serviceClient } from "@/lib/supabase";

/**
 * Пульс скаута.
 *
 * Скаут живёт отдельным процессом на хосте, и всё, что он о себе
 * рассказывает, уходит в журнал systemd. Оттуда это не видно ни из панели,
 * ни из базы — а вопрос к нему всегда один: «в канале пусто, он сломался или
 * в чатах правда тихо?».
 *
 * Без записи в базу ответа нет. Пустой канал одинаково выглядит при мёртвом
 * процессе, при аккаунте, который не состоит ни в одном чате, при недоступной
 * модели и при спокойном вечере в чатах. Различают их не догадки, а числа:
 * когда был последний проход, сколько сообщений прошло каждую ступень и
 * сколько чатов удалось открыть.
 *
 * Сторож соединения (`watchdog.ts`) решает соседнюю задачу и не заменяет эту:
 * он вытаскивает процесс из тихого зависания, но снаружи по-прежнему ничего
 * не видно. Сторож чинит, пульс показывает.
 */

const KEY = "scout_health";

/** Пульс: мгновенный снимок того, что скаут видит и умеет. */
export type ScoutPulse = {
  /** Когда записан, ISO. */
  at: string;
  /** Когда процесс стартовал — отличает «работает давно» от «только что перезапустился». */
  startedAt: string;
  /** Сколько чатов в SCOUT_CHATS. */
  chatsWatched: number;
  /** В скольких из них аккаунт действительно состоит и читает. */
  chatsReading: number;
  /** Накопительно за время жизни процесса. */
  seen: number;
  passedPrefilter: number;
  classified: number;
  saved: number;
  notified: number;
  /** Разбивка отсева: та же, что в журнале. */
  dropped: Record<string, number>;
};

export const EMPTY_PULSE: Omit<ScoutPulse, "at" | "startedAt"> = {
  chatsWatched: 0,
  chatsReading: 0,
  seen: 0,
  passedPrefilter: 0,
  classified: 0,
  saved: 0,
  notified: 0,
  dropped: {},
};

/** Что показывать человеку. «ok» не значит «есть лиды» — значит «механизм цел». */
export type ScoutVerdict = {
  state: "ok" | "quiet" | "stale" | "no_chats" | "model_down";
  /** Одна фраза по-русски: её читают вместо чисел. */
  says: string;
};

/**
 * Через сколько молчания пульс считается протухшим.
 *
 * Скаут пишет пульс по таймеру, а не по сообщениям: в тихом чате проходов
 * нет вовсе, и пульс по проходам не отличил бы тишину от смерти — ровно ту
 * разницу, ради которой всё и затевалось.
 */
export const STALE_AFTER_MS = 15 * 60_000;

/**
 * Числа → ответ на вопрос «сломалось или тихо».
 *
 * Порядок проверок не случаен: он идёт от того, что отменяет остальное.
 * У мёртвого процесса числа чатов ничего не значат, а у аккаунта вне чатов
 * бессмысленно обсуждать отсев.
 */
export function diagnose(pulse: ScoutPulse | null, now = Date.now()): ScoutVerdict {
  if (!pulse) {
    return {
      state: "stale",
      says: "Скаут ни разу не отчитывался. Либо не запускался, либо запущен без доступа к базе.",
    };
  }

  const silentMs = now - Date.parse(pulse.at);
  if (silentMs > STALE_AFTER_MS) {
    const minutes = Math.round(silentMs / 60_000);
    return {
      state: "stale",
      says: `Скаут молчит ${minutes} мин. Процесс упал или остановлен — проверьте systemd.`,
    };
  }

  if (pulse.chatsReading === 0) {
    return {
      state: "no_chats",
      says:
        "Скаут жив, но не читает ни одного чата: аккаунт в них не состоит " +
        "или адреса не открылись. Вступать нужно руками.",
    };
  }

  /**
   * Отсев пропустил, а модель не разобрала — самый коварный случай.
   *
   * Так выглядит скаут, запущенный без `NODE_OPTIONS=--use-env-proxy`: чтение
   * чатов идёт через собственный мост и работает, а обращение к модели —
   * обычный `fetch`, который с сервера напрямую не проходит. В журнале это
   * «разобрано 0», то есть неотличимо от «модель ничего не нашла». Отсюда же
   * читается и потерянный ключ модели.
   */
  if (pulse.passedPrefilter > 0 && pulse.classified === 0) {
    return {
      state: "model_down",
      says:
        `Отсев пропустил ${pulse.passedPrefilter}, а разобрано 0. Модель недоступна: ` +
        "кончились деньги на ключе, ключа нет вовсе либо скаут запущен без " +
        "NODE_OPTIONS=--use-env-proxy.",
    };
  }

  if (pulse.seen === 0) {
    return {
      state: "quiet",
      says: `Скаут читает ${pulse.chatsReading} чат(ов), но не видел ещё ни одного сообщения.`,
    };
  }

  if (pulse.saved === 0) {
    return {
      state: "quiet",
      says:
        `Механизм цел: увидел ${pulse.seen}, до модели дошло ${pulse.passedPrefilter}. ` +
        "Запросов на разработку пока не было — это тишина в чатах, а не поломка.",
    };
  }

  return {
    state: "ok",
    says:
      `Увидел ${pulse.seen}, до модели дошло ${pulse.passedPrefilter}, ` +
      `сохранено ${pulse.saved}, отправлено ${pulse.notified}.`,
  };
}

/**
 * Сколько заданных чатов аккаунт не читает.
 *
 * Тревога поднималась только на полном нуле, а 21 сентября в пульсе стояло
 * «читает 13 из 29»: шестнадцать чатов не читались больше суток, и панель
 * при этом писала «механизм цел». Наполовину работающий скаут выглядит как
 * работающий — этим он и опасен.
 */
export function unreadChats(pulse: ScoutPulse | null): number {
  if (!pulse) return 0;
  return Math.max(0, pulse.chatsWatched - pulse.chatsReading);
}

/** Прибавить итоги одного прохода к накопленному пульсу. */
export function accumulate(
  pulse: ScoutPulse,
  run: { seen: number; passedPrefilter: number; classified: number; saved: number; notified: number; dropped: Record<string, number> },
): ScoutPulse {
  const dropped = { ...pulse.dropped };
  for (const [reason, count] of Object.entries(run.dropped)) {
    dropped[reason] = (dropped[reason] ?? 0) + count;
  }

  return {
    ...pulse,
    seen: pulse.seen + run.seen,
    passedPrefilter: pulse.passedPrefilter + run.passedPrefilter,
    classified: pulse.classified + run.classified,
    saved: pulse.saved + run.saved,
    notified: pulse.notified + run.notified,
    dropped,
  };
}

export async function writePulse(pulse: ScoutPulse): Promise<void> {
  const db = serviceClient();
  if (!db) return;

  const { error } = await db
    .from("stats_snapshots")
    .upsert(
      { key: KEY, payload: pulse, computed_at: pulse.at },
      { onConflict: "key" },
    );

  // Не роняем скаут из-за диагностики: пульс — это про наблюдение, а не про
  // работу. Упавший пульс не должен уносить с собой чтение чатов.
  if (error) console.error("scout: не записал пульс", error.message);
}

export async function readPulse(): Promise<ScoutPulse | null> {
  const db = serviceClient();
  if (!db) return null;

  const { data } = await db
    .from("stats_snapshots")
    .select("payload")
    .eq("key", KEY)
    .maybeSingle();

  return (data?.payload as ScoutPulse | undefined) ?? null;
}
