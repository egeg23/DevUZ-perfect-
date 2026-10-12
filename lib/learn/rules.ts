import type { Role } from "@/lib/admin/roles";

/**
 * Правила раздела «Обучение»: когда тест сдан и кому он обязателен.
 *
 * Владелец, 12.10.2026: «Добавить курсы по продажам и тестирование по
 * знаниям дашборда». И в тот же день — владелец, 12.10.2026: обязательно,
 * 70%. Значения меняются здесь одной строкой: страница, проверка ответов и
 * таблица команды берут их отсюда (инструкция называет их словами — меняя
 * число, поправьте и её на трёх языках).
 *
 * Обязательность только показывается: блок «осталось пройти» у менеджера и
 * «не сдали» в таблице команды у руководителя и владельца. Работу —
 * карточки, порцию, очередь лидов — она не закрывает.
 */

/** Сколько процентов правильных ответов — «сдано». Владелец, 12.10.2026: обязательно, 70%. */
export const PASS_PERCENT = 70;

/** Обязательны ли курсы новичку. Владелец, 12.10.2026: обязательно, 70%. */
export const REQUIRED_FOR_NEW = true;

/** День, когда раздел появился: кто заведён позже — новичок по определению. */
export const LEARN_LAUNCHED_AT = "2026-10-12T00:00:00+05:00";

/** Какие курсы обязательны: все курсы по продажам и тест по панели. */
export const REQUIRED_COURSES: readonly string[] = ["hello", "circle", "plus", "objections", "letters", "warm", "panel"];

/**
 * Кому курсы обязательны. Новичок — менеджер, заведённый после запуска
 * раздела или ещё не сдавший обязательное. Второе покрывает первое для
 * всех, кто ещё не сдал, поэтому на деле это любой менеджер, пока у него
 * что-то не сдано: сдал всё — блок пропадает сам. Руководитель и владелец
 * проходят курсы по желанию.
 */
export function mustLearn(who: { role: Role }, on: boolean = REQUIRED_FOR_NEW): boolean {
  return on && who.role === "manager";
}

/** Заведён ли человек после запуска раздела — для пометки «новый» в таблице команды. */
export function joinedAfterLaunch(createdAt: string | null | undefined): boolean {
  if (!createdAt) return false;
  const at = Date.parse(createdAt);
  return Number.isFinite(at) && at >= Date.parse(LEARN_LAUNCHED_AT);
}

/** Сдано ли: доля правильных не ниже порога. Пустой тест не сдаётся. */
export function isPassed(score: number, total: number, percent: number = PASS_PERCENT): boolean {
  if (total <= 0) return false;
  return score * 100 >= percent * total;
}

/** Процент — целым числом, для строки результата. */
export function percentOf(score: number, total: number): number {
  return total > 0 ? Math.round((score * 100) / total) : 0;
}

/**
 * Что осталось пройти: обязательные курсы без сданной попытки. Пустой
 * список — всё сдано, правило выключено или человеку курсы не обязательны.
 */
export function requiredLeft(
  who: { role: Role },
  passed: ReadonlySet<string>,
  opts: { on?: boolean; required?: readonly string[] } = {},
): string[] {
  if (!mustLearn(who, opts.on ?? REQUIRED_FOR_NEW)) return [];
  return (opts.required ?? REQUIRED_COURSES).filter((key) => !passed.has(key));
}
