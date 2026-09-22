import { TASHKENT_OFFSET_MS } from "@/lib/admin/pulse";

/**
 * Порция дня — чистая арифметика: сколько кому, как делить, что считать
 * сделанным. База и Telegram — в portion-store.
 *
 * Владелец: «нужно решение, которое поможет менеджерам работать эффективно».
 * Проверенных компаний с контактами лежало сорок, отправлено десять — и все
 * одним человеком. Менеджеру не нужно больше искать сайты и решать, с чего
 * начать: утром у него в личке порция с готовыми текстами.
 */

/** Без плана касаний — столько в день. */
export const PORTION_DEFAULT = 5;
export const PORTION_MIN = 2;
export const PORTION_MAX = 15;

/** Раздача в 07:00, в личку — с 09:00 (или когда тексты готовы), отчёт — в 18:00. */
export const ASSIGN_HOUR = 7;
export const DELIVER_HOUR = 9;
/** Дольше не ждём неготовых текстов: в 10:00 порция уходит как есть. */
export const DELIVER_LATEST_HOUR = 10;
export const REPORT_HOUR = 18;

/**
 * Рабочие дни — с понедельника по пятницу.
 *
 * Суббота в Ташкенте для многих рабочая, но не для всех; порция в выходной
 * у того, кто не работает, к понедельнику превратилась бы в «не сделано».
 */
export const WORKDAYS = [1, 2, 3, 4, 5] as const;

function tashkent(now: Date): Date {
  return new Date(now.getTime() + TASHKENT_OFFSET_MS);
}

export function tashkentHour(now: Date): number {
  return tashkent(now).getUTCHours();
}

export function isWorkday(now: Date): boolean {
  return (WORKDAYS as readonly number[]).includes(tashkent(now).getUTCDay());
}

/** Начало дня по Ташкенту — в UTC, для сравнения с метками из базы. */
export function dayStartUtc(day: string): Date {
  return new Date(Date.parse(`${day}T00:00:00Z`) - TASHKENT_OFFSET_MS);
}

/**
 * Сколько компаний в день.
 *
 * Из недельного плана касаний: план на пять рабочих дней, округление вверх —
 * лучше на одну больше, чем к пятнице недобрать. Ноль в плане — это «ему
 * касаний не нужно», и порции нет. Плана нет — пять.
 */
export function quotaOf(touchPlan: number | null): number {
  if (touchPlan === null) return PORTION_DEFAULT;
  if (touchPlan <= 0) return 0;
  return Math.min(PORTION_MAX, Math.max(PORTION_MIN, Math.ceil(touchPlan / WORKDAYS.length)));
}

/**
 * Поделить пул поровну: по одной по кругу, пока у каждого не наберётся своё.
 *
 * По кругу, а не «первому пять, второму пять»: когда пул меньше суммы
 * порций, иначе последний в списке оставался бы ни с чем, а первый — с
 * полной порцией. Лучшие компании пула (он приходит отсортированным) так
 * тоже делятся поровну, а не достаются первому.
 */
export function distribute(
  people: readonly { id: string; quota: number }[],
  pool: readonly string[],
): Map<string, string[]> {
  const out = new Map<string, string[]>(people.map((p) => [p.id, []]));
  let next = 0;
  let progressed = true;
  while (next < pool.length && progressed) {
    progressed = false;
    for (const person of people) {
      if (next >= pool.length) break;
      const mine = out.get(person.id)!;
      if (mine.length >= person.quota) continue;
      mine.push(pool[next]);
      next += 1;
      progressed = true;
    }
  }
  return out;
}

export type PortionOutcome = "sent" | "self" | "skipped";

/**
 * Чем кончилась компания из порции — по самому касанию, а не по кнопке.
 *
 * Сделать можно и из Telegram, и из панели; считать по кнопке значило бы
 * пропустить второе. Касание засчитано тому, у кого оно в порции, и только
 * в этот день.
 */
export function outcomeOf(
  prospect: { status: string; touched_by: string | null; touched_at: string | null },
  staffId: string,
  day: string,
): PortionOutcome | null {
  if (prospect.status === "skipped") return "skipped";
  const touchedToday =
    prospect.touched_by === staffId &&
    prospect.touched_at !== null &&
    Date.parse(prospect.touched_at) >= dayStartUtc(day).getTime();
  if (!touchedToday) return null;
  return prospect.status === "manual" ? "self" : "sent";
}

export type PersonReport = { name: string; total: number; done: number; skipped: number };

/** Строка отчёта: «Данил — 4 из 5, пропущено 1». Ноль сделанного — отметкой. */
export function reportLine(p: PersonReport): string {
  const tail = p.skipped ? `, не подошло ${p.skipped}` : "";
  const flag = p.done === 0 && p.skipped === 0 ? " ⚠️" : p.done >= p.total ? " ✅" : "";
  return `${p.name} — ${p.done} из ${p.total}${tail}${flag}`;
}
