import { OFFER_MS, tashkentDay } from "@/lib/admin/mockup-offer";
import { TASHKENT_OFFSET_MS } from "@/lib/admin/pulse";

/**
 * Скан макетов: дважды в день находит в переписке наши ссылки на макеты,
 * которые ушли клиентам мимо живой записи, и вносит их в «Макеты клиентов».
 *
 * Владелец, 14.10.2026: «Идентифицируй макеты по нашей ссылке, мы же
 * отправляем их вида devuz.studio/proto/*********, пусть бот сканирует 2 раза
 * в день и вносит туда эти данные».
 *
 * Живая запись (mockup-offer-store: очередь бота и скаут по исходящим)
 * пропускает то, что ушло, пока скаут перезапускался, и всё, что ушло до
 * 13.10. Скан идёт двумя путями, оба — правилами, без модели:
 * - база: исходящие касаний (outreach_messages) и переписка лидов
 *   (lead_messages) — свип (mockup-scan-store);
 * - рабочие аккаунты Telegram: скаут проходит свои диалоги за 14 дней,
 *   порциями и с паузами, ограниченный аккаунт пропускает (scout/runner.mjs).
 *
 * Старое задним числом клиенту не пишется (scanKind):
 * - ушло больше 48 часов назад — строка сразу «закончилась», в истории;
 * - в окне 48 часов, но больше 3 часов назад — «идёт», но тихо (quiet):
 *   ни условий, ни напоминаний клиенту, команде — карточка «найдено сканом»;
 * - свежее (до 3 часов) — как обычный путь, с условиями клиенту.
 *
 * Здесь чистая арифметика: «сейчас» приходит аргументом.
 */

/** Когда скан — по Ташкенту. Окно — три часа: свип и скаут успеют, даже если час пропустили. */
export const SCAN_HOURS = [9, 15] as const;
export const SCAN_WINDOW_H = 3;

/** Насколько назад смотрит скан. */
export const SCAN_DAYS = 14;
export const SCAN_MS = SCAN_DAYS * 24 * 3600_000;

/** Найденное моложе этого — как обычная отправка, с условиями клиенту. */
export const FRESH_MS = 3 * 3600_000;

/** Скаут: не больше стольких диалогов за скан на аккаунт и пауза между ними. */
export const SCAN_DIALOGS = 80;
export const SCAN_PAGE = 50;
export const SCAN_PAUSE_MS = 2_000;

/** Итог скана владельцу — когда найденное не прибавлялось столько минут. */
export const SCAN_SETTLE_MS = 15 * 60_000;

/** Метка «найдено сканом» в базе: mockup_offers.source. */
export type OfferSource = "live" | "scan";

/**
 * Слот скана сейчас: «2026-10-14@9». Вне окна — null. Слот — ключ, по которому
 * каждый аккаунт и база сканируются один раз (mockup_scans).
 */
export function scanSlot(now: Date): string | null {
  const hour = new Date(now.getTime() + TASHKENT_OFFSET_MS).getUTCHours();
  const start = SCAN_HOURS.find((h) => hour >= h && hour < h + SCAN_WINDOW_H);
  return start === undefined ? null : `${tashkentDay(now.getTime())}@${start}`;
}

export type ScanKind = "expired" | "quiet" | "fresh";

/** Что делать с найденной ссылкой, по возрасту сообщения. */
export function scanKind(sentAt: Date, now: Date): ScanKind {
  const age = now.getTime() - sentAt.getTime();
  if (age >= OFFER_MS) return "expired";
  if (age > FRESH_MS) return "quiet";
  return "fresh";
}

/** Поля новой строки mockup_offers для найденного сканом. */
export function scanFields(sentAt: Date, now: Date): {
  source: OfferSource;
  quiet: boolean;
  status: "active" | "expired";
  expired_noted_at: string | null;
} {
  const kind = scanKind(sentAt, now);
  return {
    source: "scan",
    quiet: kind !== "fresh",
    status: kind === "expired" ? "expired" : "active",
    // Закончилась до того, как мы о ней узнали: строки «акция закончилась» не будет.
    expired_noted_at: kind === "expired" ? now.toISOString() : null,
  };
}

/** Входит ли сообщение в окно скана. */
export function inScan(sentAt: Date, now: Date): boolean {
  const t = sentAt.getTime();
  return Number.isFinite(t) && t >= now.getTime() - SCAN_MS && t <= now.getTime() + 60_000;
}

/** Итог скана — одной строкой владельцу и руководителю. Пусто — не слать. */
export function scanSummary(
  rows: readonly { client: string; mockup_name: string; status: string; quiet: boolean }[],
): string | null {
  if (!rows.length) return null;
  const live = rows.filter((r) => r.status === "active").length;
  const lines = rows.slice(0, 15).map((r) => {
    const who = r.client || r.mockup_name;
    if (r.status !== "active") return `⌛ ${who} · ушёл больше 48 часов назад, акция закончилась`;
    return r.quiet ? `⏳ ${who} · акция идёт, клиенту не пишем — ушёл давно` : `⏳ ${who} · акция идёт, условия уйдут клиенту`;
  });
  const more = rows.length > 15 ? [`…и ещё ${rows.length - 15}`] : [];
  return [`🔎 <b>Скан макетов</b>: нашлось ${rows.length}, акция идёт у ${live}`, ...lines, ...more].join("\n");
}
