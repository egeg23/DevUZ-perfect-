import { createHash, randomBytes } from "node:crypto";

import { analyze, objectionIn, type CallLine } from "@/lib/callhelper/engine";
import type { CallScript } from "@/lib/callhelper/script";
import { CALLHELPER_TARIFFS } from "@/lib/callhelper/tariffs";
import { TRIAL, TRIAL_LIMITS, trialLeft } from "@/lib/callhelper/trial";

/**
 * DevUz CallHelper — колл-центр как клиент API (владелец, 26.11.2026: «надо
 * для виртуальных станций подготовить базу апи под интеграции, чтобы и они
 * могли к нам цепляться и мы к ним, и клиенты чтобы видели прям
 * расширением»).
 *
 * Колл-центр — строка `callhelper_orgs` с ключом `chk_…`. Ключ показывается
 * один раз при выдаче, в базе лежит только отпечаток. Тем же ключом ходят
 * расширение браузера оператора и чужие программы (сервис набора, CRM).
 * Здесь — правила без базы: ключ, допуск по тарифу, итог звонка.
 */

export const KEY_PREFIX = "chk_";
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";

/** Новый ключ: `chk_` и 40 знаков без похожих букв. */
export function newOrgKey(): string {
  const bytes = randomBytes(40);
  let out = KEY_PREFIX;
  for (const b of bytes) out += ALPHABET[b % ALPHABET.length];
  return out;
}

export const keyLooksRight = (key: string) => /^chk_[A-Za-z0-9]{40}$/.test(key);
export const keyHash = (key: string) => createHash("sha256").update(key).digest("hex");
export const keyHint = (key: string) => key.slice(-4);

/** Ключ из заголовка `Authorization: Bearer chk_…`. */
export function keyFromHeader(header: string | null): string | null {
  const m = /^Bearer\s+(\S+)$/i.exec(String(header ?? "").trim());
  return m && keyLooksRight(m[1]) ? m[1] : null;
}

export const ORG_PLANS = ["trial", "start", "work"] as const;
export type OrgPlan = (typeof ORG_PLANS)[number];
export const isOrgPlan = (v: unknown): v is OrgPlan => (ORG_PLANS as readonly string[]).includes(String(v));

export type Org = {
  id: string;
  name: string;
  plan: OrgPlan;
  operators: number;
  trialStartedAt: string | null;
  paidUntil: string | null;
  active: boolean;
};

export type GateReason = "inactive" | "trial_over" | "unpaid";
export type Gate =
  | { ok: true; minutesLeft: number | null; hoursLeft: number | null; minutesIncluded: number | null }
  | { ok: false; reason: GateReason };

/**
 * Можно ли колл-центру пользоваться суфлёром сейчас. `usedSeconds` — за
 * пробный целиком или за текущий месяц у платного. Минуты сверх пакета
 * платному не закрывают доступ: они считаются и идут в счёт по цене
 * `CALLHELPER_OVER_RUB`.
 */
export function orgGate(org: Org, usedSeconds: number, now: number): Gate {
  if (!org.active) return { ok: false, reason: "inactive" };
  const usedMinutes = Math.floor(usedSeconds / 60);
  if (org.plan === "trial") {
    if (!org.trialStartedAt) return { ok: true, minutesLeft: TRIAL.minutes, hoursLeft: null, minutesIncluded: null };
    const left = trialLeft({ startedAt: Date.parse(org.trialStartedAt), minutes: usedMinutes }, now);
    if (left.over) return { ok: false, reason: "trial_over" };
    return { ok: true, minutesLeft: left.minutes, hoursLeft: left.hours, minutesIncluded: null };
  }
  if (org.paidUntil && Date.parse(org.paidUntil) < now) return { ok: false, reason: "unpaid" };
  const included = (CALLHELPER_TARIFFS.find((t) => t.key === org.plan)?.minutes ?? 0) * org.operators;
  return { ok: true, minutesLeft: Math.max(0, included - usedMinutes), hoursLeft: null, minutesIncluded: included };
}

/** Сколько звонков разом: на пробном один оператор, у платного — сколько оплачено мест. */
export const seatsOf = (org: Org) => (org.plan === "trial" ? TRIAL_LIMITS.operators : org.operators);

/** Сколько сценариев можно держать. */
export const scriptsLimitOf = (org: Org) => (org.plan === "trial" ? TRIAL_LIMITS.scripts : 50);

/** На пробном звонок не длиннее стольких секунд, у платного предела нет (4 часа — защита от забытого звонка). */
export const callSecondsLimit = (org: Org) => (org.plan === "trial" ? TRIAL_LIMITS.callMinutes * 60 : 4 * 3600);

/** Месяц счёта минут, `2026-11`, по Москве: клиенты в России. */
export function usageMonth(now: Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Moscow", year: "numeric", month: "2-digit" }).format(now).slice(0, 7);
}

/** Кусок звука для распознавания: 16 кГц, 16 бит, моно. До 20 секунд. */
export const AUDIO_RATE = 16_000;
export const AUDIO_MAX_BYTES = AUDIO_RATE * 2 * 20;
export const AUDIO_MIN_BYTES = AUDIO_RATE * 2 * 0.2;

export type CallSummary = {
  seconds: number;
  lines: number;
  stages: { name: string; done: boolean }[];
  stagesDone: number;
  /** Возражения клиента за звонок, каждое один раз, по порядку. */
  objections: string[];
  banned: string[];
  missingMust: string[];
  recordNotice: boolean;
};

/**
 * Итог звонка — кодом, без модели и без хранения разговора: что из сценария
 * пройдено, какие возражения звучали, что оператор нарушил.
 */
export function callSummary(script: CallScript, lines: readonly CallLine[], seconds: number): CallSummary {
  const hint = analyze(script, lines);
  const objections: string[] = [];
  for (const line of lines) {
    if (line.who !== "client") continue;
    const found = objectionIn(line.text, script);
    if (found && !objections.includes(found.name)) objections.push(found.name);
  }
  return {
    seconds: Math.max(0, Math.round(seconds)),
    lines: lines.length,
    stages: hint.stages,
    stagesDone: hint.stages.filter((s) => s.done).length,
    objections,
    banned: hint.banned,
    missingMust: hint.missingMust,
    recordNotice: !hint.noRecordNotice && lines.some((l) => l.who === "operator"),
  };
}
