/**
 * Чистые кусочки поллера — отдельно, чтобы их закрывали тесты.
 */

/** Следующий offset для getUpdates: подтверждаем всё до этого update включительно. */
export function ackOffset(current, updateId) {
  return Math.max(current, updateId + 1);
}

/** Пауза после подряд идущих ошибок: 2, 4, 8, 16, 32 с — и не больше 30 с. */
export function backoffMs(failures) {
  return Math.min(30_000, 1_000 * 2 ** Math.min(Math.max(failures, 1), 5));
}

/**
 * Что делать с ответом Telegram на getUpdates.
 *
 * 409 — вебхук снова кем-то поставлен или второй поллер: обновлений не
 * будет, пока не снять. Остальные ошибки — обычная сеть, ждём и пробуем.
 */
export function classifyError(status, description) {
  if (status === 409) return "conflict";
  if (status === 401) return "token";
  return "retry";
}
