/**
 * Сторож соединения.
 *
 * Библиотека переподключается бесконечно и пингует сервер каждые девять
 * секунд — проверено по исходникам teleproto. Остаётся одна дыра: цикл
 * обновлений *выходит*, когда клиент считает себя отключённым. Процесс
 * после этого живёт, systemd показывает active, сообщений нет — классический
 * «скаут перестал видеть чаты» без единой ошибки в журнале.
 *
 * Сторож смотрит на клиента раз в несколько минут и считает промахи.
 * Выход — только после двух подряд: одиночный промах бывает и при штатном
 * переподключении, а два подряд с интервалом в минуты — это уже не оно.
 * Выход с ошибкой превращает тихий стоп в перезапуск от systemd.
 */

export type ConnectionState = {
  disconnected: boolean;
  /** Переподключение идёт прямо сейчас — это не стоп, а работа. */
  reconnecting: boolean;
};

export const STRIKES_TO_EXIT = 2;

/** Сколько промахов подряд после этой проверки. */
export function nextStrikes(previous: number, state: ConnectionState): number {
  if (!state.disconnected || state.reconnecting) return 0;
  return previous + 1;
}

export function shouldExit(strikes: number): boolean {
  return strikes >= STRIKES_TO_EXIT;
}
