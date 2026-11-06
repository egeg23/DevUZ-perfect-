/**
 * Обучение по панели — один раз на сотрудника.
 *
 * Владелец, 03.11.2026: «При первом заходе сотрудников сделай красивый
 * туториал на 5-7 шагов, чтобы они поняли, что поменялся визуал и стало
 * удобнее, но функционал не трогали». И 06.11.2026 о «Рынках»: «краткий
 * туториал для менеджеров по новым странам разделу сделай, прям очень
 * простыми словами, подсвети нужные моменты в дашборде».
 *
 * «Видел» хранится в базе (`stats_snapshots`, ключ `panel-tour:<обучение>:<id>`),
 * а не только в браузере: человек заходит с телефона и компьютера, и второй
 * раз на другом устройстве обучение ему ни к чему. Новая версия обучения —
 * новый ключ: его увидят все ещё раз. Без миграции и без модели.
 */

/** Знакомство с новой панелью (components/admin/panel-tour.tsx). */
export const TOUR_VERSION = "os-2026-11";
/** «Рынки» для менеджеров (components/admin/markets-tour.tsx). */
export const MARKETS_TOUR = "markets-2026-11";

export const TOURS = [TOUR_VERSION, MARKETS_TOUR] as const;
export type TourId = (typeof TOURS)[number];

export const tourKey = (staffId: string, tour: TourId = TOUR_VERSION) => `panel-tour:${tour}:${staffId}`;

/** Что пришло от браузера → известное обучение; чужое — знакомство с панелью. */
export function tourOf(raw: unknown): TourId {
  return (TOURS as readonly unknown[]).includes(raw) ? (raw as TourId) : TOUR_VERSION;
}

/** Событие «знакомство с панелью закрыто» — после него может начаться следующее обучение. */
export const TOUR_DONE_EVENT = "admin-tour-done";
