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

/**
 * Карточка ушла без текста (bare_at) — что с ней делать теперь.
 *
 * «send» — письмо написано, а компанию никто не тронул: досылаем текст.
 * «drop» — уже не нужно: человек написал сам, отправил, нажал «Не
 * подходит» или компанию забрал другой. «wait» — письма пока нет.
 */
export function textDue(
  p: { status: string; message: string | null; claimed_by: string | null; touched_by: string | null; touched_at: string | null },
  staffId: string,
  day: string,
): "send" | "drop" | "wait" {
  if (outcomeOf(p, staffId, day) !== null) return "drop";
  if (p.status !== "new" && p.status !== "contacting") return "drop";
  if (p.claimed_by && p.claimed_by !== staffId) return "drop";
  return p.message ? "send" : "wait";
}

/**
 * Замен за «Не подходит» в день — не больше двух порций.
 *
 * Владелец, 29.09: «сделать нужно 5 в день, без учёта „не подходит“. То есть
 * именно 5 „связались“, а не 3 связались и 2 пропустили». Поэтому на каждую
 * «Не подходит» выдаётся замена из пула. Но «Не подходит» навсегда убирает
 * компанию из пула, и без потолка пропусками можно было бы перебрать всю
 * базу в поисках самых удобных. Две порции замен — с запасом на честный
 * день, когда пул подсунул подряд несколько мёртвых сайтов.
 */
export const REPLACE_FACTOR = 2;
export const replaceLimit = (target: number): number => target * REPLACE_FACTOR;

export type PortionTally = {
  /** Цель дня — утренняя раздача. Замены в неё не входят: они вместо пропущенных. */
  target: number;
  /** «Отправить» и «Написал сам» — только они в счёт. */
  done: number;
  skipped: number;
  replaced: number;
  /** «Не подходит», на место которых замены не нашлось: пул пуст или лимит. */
  short: number;
};

export function tallyPortion(
  rows: readonly { replaces: string | null; outcome: PortionOutcome | null }[],
): PortionTally {
  const target = rows.filter((r) => !r.replaces).length;
  const done = rows.filter((r) => r.outcome === "sent" || r.outcome === "self").length;
  const skipped = rows.filter((r) => r.outcome === "skipped").length;
  const replaced = rows.filter((r) => r.replaces).length;
  return { target, done, skipped, replaced, short: Math.max(0, skipped - replaced) };
}

/** Сколько замен выдать сейчас: по одной на каждую «Не подходит» без замены — в пределах лимита. */
export function replacementsDue(t: PortionTally): number {
  return Math.max(0, Math.min(t.skipped - t.replaced, replaceLimit(t.target) - t.replaced));
}

/** «5 касаний», «3 касания», «1 касание». */
export function touchesText(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  const word =
    mod10 === 1 && mod100 !== 11
      ? "касание"
      : mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)
        ? "касания"
        : "касаний";
  return `${n} ${word}`;
}

export type PersonReport = {
  name: string;
  target: number;
  done: number;
  skipped: number;
  short: number;
  /** Касания из потока «Получать лиды» — сверх порции, в «из» не входят. */
  stream?: number;
  /** Все касания за день: порция, поток и написанное из панели сверх них. */
  touches: number;
};

/** Всего касаний: не меньше, чем сделано по порции и потоку, — они его часть. */
export function touchesOf(p: PersonReport): number {
  return Math.max(p.touches, p.done + (p.stream ?? 0));
}

/**
 * Строка отчёта: «Данил — 7 касаний (поток 2) · порция 4 из 5, не подошло 2, без замены 1».
 *
 * Сначала — сколько человек написал за день всего: владелец, 01.10, —
 * руководителям «сколько было касаний у каждого менеджера, сколько из
 * порции дня они сделали». Порция — следом: «из» — цель дня, сделано —
 * только касания; две «Не подходит» при трёх отправленных — это 3 из 5, а
 * не «порция закрыта». Ноль касаний по порции — ⚠️, сколько бы ни было
 * пропусков. Поток — в скобках: он сверх порции, и смешать его с ней
 * значило бы закрывать порцию потоком.
 */
export function reportLine(p: PersonReport): string {
  const stream = p.stream ? ` (поток ${p.stream})` : "";
  const head = `${p.name} — ${touchesText(touchesOf(p))}${stream}`;
  if (p.target === 0) return `${head} · порции не было`;
  const tail = [p.skipped ? `не подошло ${p.skipped}` : "", p.short ? `без замены ${p.short}` : ""]
    .filter(Boolean)
    .join(", ");
  const flag = p.done === 0 ? " ⚠️" : p.done >= p.target ? " ✅" : "";
  return `${head} · порция ${p.done} из ${p.target}${tail ? `, ${tail}` : ""}${flag}`;
}

/** Итог отчёта: «Всего: 34 касания · порции: 21 из 45». */
export function reportTotal(reports: readonly PersonReport[]): string {
  const touches = reports.reduce((sum, r) => sum + touchesOf(r), 0);
  const done = reports.reduce((sum, r) => sum + r.done, 0);
  const target = reports.reduce((sum, r) => sum + r.target, 0);
  return `Всего: ${touchesText(touches)}${target ? ` · порции: ${done} из ${target}` : ""}`;
}

/** Порядок в отчёте: больше касаний — выше; поровну — по имени. */
export function byTouches(a: PersonReport, b: PersonReport): number {
  return touchesOf(b) - touchesOf(a) || a.name.localeCompare(b.name, "ru");
}
