import { appSecret } from "@/lib/secrets";

import { payConfig } from "@/lib/ai-staff/pay";

/**
 * Готов ли сервис к пилоту — для владельца в панели.
 *
 * Аудит 22.10.2026: без токена бота сервиса заявки клиентам молча не
 * доходили, отчёты не уходили, а панель показывала только «Включён». Что не
 * настроено, было видно лишь после нажатия «Подключить бота сервиса» или из
 * журнала сервера. Здесь — то же, что проверяет код в бою, одним списком.
 * Значения секретов наружу не уходят, только «есть / нет».
 */
export type ReadyKey = "botToken" | "webhookSecret" | "cipherKey" | "instagram" | "cards" | "delivery";
export type ReadyState = "ok" | "missing" | "waiting";
export type ReadyRow = { key: ReadyKey; state: ReadyState; count?: number };

export type ReadyInput = {
  botToken: boolean;
  webhookSecret: boolean;
  cipherKey: boolean;
  /** Ключи Instagram есть / Meta проверила приложение (AI_STAFF_IG_PUBLIC=1). */
  igKeys: boolean;
  igPublic: boolean;
  cards: boolean;
  /** Заявок за месяц, не дошедших до людей клиента. */
  undelivered: number;
};

export function readiness(i: ReadyInput): ReadyRow[] {
  return [
    { key: "botToken", state: i.botToken ? "ok" : "missing" },
    { key: "webhookSecret", state: i.webhookSecret ? "ok" : "missing" },
    { key: "cipherKey", state: i.cipherKey ? "ok" : "missing" },
    { key: "instagram", state: !i.igKeys ? "missing" : i.igPublic ? "ok" : "waiting" },
    { key: "cards", state: i.cards ? "ok" : "waiting" },
    { key: "delivery", state: i.undelivered ? "missing" : "ok", count: i.undelivered },
  ];
}

export async function loadReadiness(undelivered: number): Promise<ReadyRow[]> {
  const has = async (name: string) => Boolean(await appSecret(name).catch(() => null));
  const [botToken, webhookSecret, cipherKey, igId, igSecret, igVerify, igPublic, pay] = await Promise.all([
    has("AI_STAFF_BOT_TOKEN"),
    has("AI_STAFF_WEBHOOK_SECRET"),
    has("AI_STAFF_KEY"),
    has("AI_STAFF_IG_APP_ID"),
    has("AI_STAFF_IG_APP_SECRET"),
    has("AI_STAFF_IG_VERIFY_TOKEN"),
    appSecret("AI_STAFF_IG_PUBLIC").catch(() => null),
    payConfig().catch(() => ({ payme: null, click: null })),
  ]);
  return readiness({
    botToken,
    webhookSecret,
    cipherKey,
    igKeys: igId && igSecret && igVerify,
    igPublic: igPublic === "1",
    cards: Boolean(pay.payme || pay.click),
    undelivered,
  });
}
