/**
 * Запомнить чтение базы на время: соседние загрузки страницы берут готовое.
 *
 * 22.10.2026 Supabase Free: трафик из базы 6,69 ГБ при 5 ГБ за 17 дней.
 * «Главная» обновляется раз в 90 секунд, пока вкладка видна, и каждый раз
 * заново читала то, что меняется раз в час: ступени продажи за 30 дней,
 * лиды без движения, грейд, уровни, историю рассылок. Здесь такие чтения
 * живут несколько минут в памяти процесса сайта; свежие числа пульса
 * (касания сегодня, предложения, задачи) читаются как раньше.
 *
 * Ошибку не запоминаем: следующий вызов прочитает снова. Изменение, которое
 * человек должен увидеть сразу (отметка ступени, новая рассылка), снимает
 * запомненное — forget по началу ключа.
 */

const store = new Map<string, { at: number; value: Promise<unknown> }>();

export function memo<T>(key: string, ttlMs: number, load: () => Promise<T>, now: number = Date.now()): Promise<T> {
  const hit = store.get(key);
  if (hit && now - hit.at < ttlMs) return hit.value as Promise<T>;
  const value = load();
  store.set(key, { at: now, value });
  value.catch(() => {
    if (store.get(key)?.value === value) store.delete(key);
  });
  return value;
}

/** Забыть всё, что начинается с prefix: данные поменялись, и это должно быть видно сразу. */
export function forget(prefix: string): void {
  for (const key of [...store.keys()]) if (key.startsWith(prefix)) store.delete(key);
}

/** Сколько ключей сейчас запомнено — для теста. */
export function memoSize(): number {
  return store.size;
}

/** Сколько держать то, что меняется раз в час и реже. */
export const SLOW_MS = 5 * 60_000;
