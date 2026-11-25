import { createHash } from "node:crypto";

import { contactLooksReal } from "@/lib/agent/lead";

/**
 * Лист ожидания DevUz CallHelper (владелец, 25.11.2026: «Сделай лист
 * ожидания для CallHelper с заявками в панель, такие заявки показываются
 * только мне, никому из команды пока не показываем»).
 *
 * Это не лид: заявка не идёт ни в `leads`, ни в очередь тёплых лидов, ни в
 * «Входящие». Она лежит строкой `stats_snapshots` с ключом
 * `callhelper-wait:<отпечаток контакта>` (повтор того же контакта
 * обновляет строку, а не заводит новую) и видна только владельцу внизу
 * раздела CallHelper. Здесь — разбор и проверка, без базы: это держит тест.
 */

export const WAIT_PREFIX = "callhelper-wait:";

/** Сколько заявок с одного адреса за 10 минут и на весь сайт за сутки. */
export const WAIT_IP_LIMIT = 3;
export const WAIT_DAY_CAP = 100;

export type WaitEntry = {
  name: string;
  company: string;
  contact: string;
  /** Сколько операторов, 0 — не сказали. */
  operators: number;
  comment: string;
};

export type WaitRow = WaitEntry & { at: string; first_at: string; times: number };

export type WaitError = "invalid_json" | "contact_required" | "contact_invalid";

const text = (value: unknown, max: number) =>
  typeof value === "string" ? value.replace(/\s+/g, " ").trim().slice(0, max) : "";

export function parseWait(body: unknown): { ok: true; entry: WaitEntry } | { ok: false; error: WaitError } {
  if (!body || typeof body !== "object" || Array.isArray(body)) return { ok: false, error: "invalid_json" };
  const b = body as Record<string, unknown>;
  const contact = text(b.contact, 200);
  if (!contact) return { ok: false, error: "contact_required" };
  if (!contactLooksReal(contact)) return { ok: false, error: "contact_invalid" };
  const ops = Number.parseInt(String(b.operators ?? "").replace(/\D/g, ""), 10);
  return {
    ok: true,
    entry: {
      name: text(b.name, 120),
      company: text(b.company, 120),
      contact,
      operators: Number.isFinite(ops) && ops > 0 ? Math.min(ops, 100_000) : 0,
      comment: text(b.comment, 600),
    },
  };
}

/** Ключ строки: отпечаток контакта без пробелов, скобок и регистра. */
export function waitKey(contact: string): string {
  const norm = contact.toLowerCase().replace(/[\s()\-+]/g, "").replace(/^https?:\/\/t\.me\//, "@");
  return WAIT_PREFIX + createHash("sha256").update(norm).digest("hex").slice(0, 20);
}

/** Строка в базу: повтор того же контакта — та же строка, счёт обращений растёт. */
export function mergeWait(prev: WaitRow | null, entry: WaitEntry, now: Date): WaitRow {
  const at = now.toISOString();
  if (!prev) return { ...entry, at, first_at: at, times: 1 };
  return {
    name: entry.name || prev.name,
    company: entry.company || prev.company,
    contact: entry.contact,
    operators: entry.operators || prev.operators,
    comment: entry.comment || prev.comment,
    at,
    first_at: prev.first_at || at,
    times: (prev.times || 1) + 1,
  };
}

/** Разбор строки из базы: чужое и битое отбрасывается. */
export function readWait(payload: unknown): WaitRow | null {
  if (!payload || typeof payload !== "object") return null;
  const p = payload as Record<string, unknown>;
  if (typeof p.contact !== "string" || !p.contact) return null;
  const s = (v: unknown) => (typeof v === "string" ? v : "");
  return {
    name: s(p.name),
    company: s(p.company),
    contact: p.contact,
    operators: Number(p.operators) || 0,
    comment: s(p.comment),
    at: s(p.at),
    first_at: s(p.first_at) || s(p.at),
    times: Number(p.times) || 1,
  };
}

/** Новые сверху. */
export function sortWait(rows: WaitRow[]): WaitRow[] {
  return [...rows].sort((a, b) => b.at.localeCompare(a.at));
}
