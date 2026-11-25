import { createHash } from "node:crypto";

/**
 * DevUz CallHelper — пробный период и защита от «вечного пробного».
 *
 * Владелец, 25.11.2026: «Пробный период 3 дня и 50 минут, нужно убрать
 * схемы абуза (новые аккаунты создают и не платят и тд, придумай как это
 * сделать). Один айпи или в демо днях сделать ограничение, которое бы
 * побуждала к покупке платной версии».
 *
 * Пробный даётся компании, а не аккаунту: новый аккаунт той же компании
 * пробного не получает. Компанию узнаём по тому, что дорого подделать:
 * - ИНН с верной контрольной суммой (выдуманный не пройдёт) — один ИНН,
 *   один пробный, навсегда;
 * - телефон, подтверждённый кодом, и Telegram — один номер, один пробный;
 * - отпечаток браузера (кука) и адрес — один пробный в 30 дней; адрес
 *   храним отпечатком, не открытым видом.
 * Совпало хоть одно — пробного нет, сразу предложение тарифа.
 *
 * Ограничения пробного подталкивают к оплате, но дают почувствовать
 * пользу: один оператор, один сценарий, разговор до 5 минут, итог звонка
 * видно только первый, отчёт и выгрузка — после оплаты. Модель на пробном
 * та же, иначе человек решит, что продукт слабый.
 */

export const TRIAL = { days: 3, minutes: 50 } as const;

/** Что можно на пробном. Остальное — с оплатой. */
export const TRIAL_LIMITS = {
  operators: 1,
  scripts: 1,
  callMinutes: 5,
  /** Итог звонка с оценкой по скрипту — только у первого звонка, дальше замок. */
  summaries: 1,
  export: false,
  pbx: false,
} as const;

/** Адрес и браузер — один пробный в столько дней. */
export const TRIAL_REPEAT_DAYS = 30;

/** Контрольная сумма ИНН России: 10 цифр — организация, 12 — ИП. */
export function innValid(raw: string): boolean {
  const d = String(raw ?? "").replace(/\D/g, "");
  const n = [...d].map(Number);
  const check = (weights: number[]) => (weights.reduce((s, w, i) => s + w * n[i], 0) % 11) % 10;
  if (d.length === 10 && !/^0{10}$/.test(d)) return check([2, 4, 10, 3, 5, 9, 4, 6, 8]) === n[9];
  if (d.length === 12 && !/^0{12}$/.test(d)) {
    return check([7, 2, 4, 10, 3, 5, 9, 4, 6, 8]) === n[10] && check([3, 7, 2, 4, 10, 3, 5, 9, 4, 6, 8]) === n[11];
  }
  return false;
}

/** Телефон в одном виде: +7, 8 и пробелы — одно и то же. */
export function normPhone(raw: string): string {
  let d = String(raw ?? "").replace(/\D/g, "");
  if (d.length === 11 && d.startsWith("8")) d = `7${d.slice(1)}`;
  if (d.length === 10) d = `7${d}`;
  return d.length >= 11 && d.length <= 15 ? d : "";
}

/** Адрес — отпечатком: открытым видом не храним. */
export function ipPrint(ip: string, salt: string): string {
  return createHash("sha256").update(`${salt}:${String(ip ?? "").trim()}`).digest("hex").slice(0, 24);
}

export type TrialAsk = {
  inn: string;
  /** Номер, который подтвердили кодом. Не подтверждён — пусто. */
  phone: string;
  tg?: string | null;
  ipHash: string;
  device: string;
};

/** Прошлый пробный — то, что о нём хранится. */
export type TrialSeen = { inn: string; phone: string; tg?: string | null; ipHash: string; device: string; at: number };

export type TrialVerdict = { ok: true } | { ok: false; reason: "inn" | "phone" | "used" | "ip" | "device" };

const DAY = 86_400_000;

/** Можно ли дать пробный. Отказ — сразу предложение тарифа, без «попробуйте позже». */
export function trialVerdict(ask: TrialAsk, seen: readonly TrialSeen[], now: number): TrialVerdict {
  if (!innValid(ask.inn)) return { ok: false, reason: "inn" };
  const phone = normPhone(ask.phone);
  if (!phone) return { ok: false, reason: "phone" };
  const inn = ask.inn.replace(/\D/g, "");
  if (seen.some((s) => s.inn.replace(/\D/g, "") === inn || normPhone(s.phone) === phone || (!!ask.tg && s.tg === ask.tg))) {
    return { ok: false, reason: "used" };
  }
  const recent = seen.filter((s) => now - s.at < TRIAL_REPEAT_DAYS * DAY);
  if (recent.some((s) => s.device && s.device === ask.device)) return { ok: false, reason: "device" };
  if (recent.some((s) => s.ipHash === ask.ipHash)) return { ok: false, reason: "ip" };
  return { ok: true };
}

export type TrialUse = { startedAt: number; minutes: number };

/** Что осталось у пробного. Кончились дни или минуты — подсказки стоят, на экране — тарифы. */
export function trialLeft(use: TrialUse, now: number): { minutes: number; hours: number; over: boolean } {
  const minutes = Math.max(0, TRIAL.minutes - use.minutes);
  const hours = Math.max(0, Math.ceil((use.startedAt + TRIAL.days * DAY - now) / 3_600_000));
  return { minutes, hours, over: minutes === 0 || hours === 0 };
}
