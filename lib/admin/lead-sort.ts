/**
 * «Разобрать лиды» — скопившееся по одному, с решением в одно нажатие.
 *
 * Владелец, 03.11.2026: «сделай более удобный способ разгребать лиды,
 * которые скапливаются». Скапливается двух видов:
 *
 * - **ничьи новые** — общая очередь: лид пришёл, никто не взял. Решение —
 *   «Взять», «🗑 Мусор» или «Пропустить»;
 * - **свои без движения** — лид «в работе» 7+ дней без шага (то же правило,
 *   что у бота «Порядок в лидах», lib/admin/lead-tidy.ts). Решение — «🏆 /
 *   ❌ / ⏳ срок» тем же decideTidy, «🗑 Мусор» или «Пропустить».
 *
 * Сначала — свои без движения (это долг), потом ничьи, старое первым.
 * «Пропустить» откладывает лид до конца захода (`skip` в адресе), в базе
 * ничего не меняет. Здесь — без базы, строки — lead-sort-store.ts.
 */
import { canWait, stale, type IdleLead } from "@/lib/admin/lead-tidy";

export const SORT_HREF = "/admin/leads/sort";
/** Больше пропусков адрес не держит — да и столько подряд не пропускают. */
export const SKIP_MAX = 40;

export type SortFree = {
  id: string;
  label: string;
  requestNo: string | null;
  createdAt: string;
  request: string | null;
  source: string | null;
  priority: string | null;
};

export type SortCard =
  | ({ kind: "free" } & SortFree)
  | { kind: "idle"; id: string; label: string; movedAt: string; canWait: boolean };

/** Свой лид висит: без движения 7+ дней и не отложен задачей до будущего дня. */
export function idleDue(lead: IdleLead, now: Date): boolean {
  if (!stale(lead, now)) return false;
  return !lead.snoozedUntil || Date.parse(lead.snoozedUntil) <= now.getTime();
}

/** Очередь захода: свои висящие (дольше висит — раньше), за ними ничьи новые (старше — раньше). */
export function sortQueue(input: { idle: readonly IdleLead[]; free: readonly SortFree[] }, now: Date, skip: ReadonlySet<string>): SortCard[] {
  const idle = input.idle
    .filter((l) => idleDue(l, now) && !skip.has(l.id))
    .sort((a, b) => Date.parse(a.movedAt) - Date.parse(b.movedAt))
    .map((l) => ({ kind: "idle" as const, id: l.id, label: l.label, movedAt: l.movedAt, canWait: canWait(l) }));
  const free = input.free
    .filter((l) => !skip.has(l.id))
    .sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt))
    .map((l) => ({ kind: "free" as const, ...l }));
  return [...idle, ...free];
}

/** Пропуски из адреса: только похожее на id, не больше SKIP_MAX. */
export function parseSkip(raw: string | undefined | null): string[] {
  return String(raw ?? "")
    .split(",")
    .filter((id) => /^[0-9a-f-]{36}$/i.test(id))
    .slice(-SKIP_MAX);
}

/** Адрес следующего шага: результат плашкой (`done`, components/admin/keep-place.tsx) и пропуски. */
export function sortHref(done: string | null, skip: readonly string[]): string {
  const params = new URLSearchParams();
  if (done) params.set("done", done);
  if (skip.length) params.set("skip", skip.slice(-SKIP_MAX).join(","));
  const q = params.toString();
  return q ? `${SORT_HREF}?${q}` : SORT_HREF;
}
