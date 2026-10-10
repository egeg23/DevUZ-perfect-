import { createHash } from "node:crypto";

import { safeEqual } from "@/lib/ai-staff/crypto";

/**
 * Оплата тарифа картой: Payme (Merchant API) и Click (SHOP API).
 *
 * Обе системы устроены одинаково по сути: клиент платит у них, а они
 * спрашивают нас — есть ли такой счёт, верна ли сумма, — и сообщают, что
 * деньги списаны. Наше дело — ответить по протоколу и продлить тариф ровно
 * один раз, сколько бы раз система ни повторила запрос.
 *
 * Здесь только протокол: база передаётся снаружи (PayRepo), поэтому каждый
 * ответ проверяется тестом без сети. Ключи — AI_STAFF_PAYME_KEY и
 * AI_STAFF_CLICK_SECRET в хранилище секретов, их выдают при заключении
 * договора (docs/ai-staff/pilot.md).
 *
 * Сверено с документацией Payme (developer.help.paycom.uz: методы и коды
 * ошибок) и с описанием подписи Click; перед включением — прогон в
 * песочнице каждой системы.
 */

export type Invoice = { id: string; tenant_id: string; amount_uzs: number; status: "pending" | "paid" | "cancelled" };

export type Tx = {
  id: number;
  provider: "payme" | "click";
  ext_id: string;
  invoice_id: string;
  amount_tiyin: number;
  state: number;
  create_time: number;
  perform_time: number;
  cancel_time: number;
  reason: number | null;
  provider_time: number;
};

export type PayRepo = {
  invoice(id: string): Promise<Invoice | null>;
  tx(provider: Tx["provider"], extId: string): Promise<Tx | null>;
  txById(id: number): Promise<Tx | null>;
  /** Незакрытая транзакция по счёту (state 1). */
  openTx(provider: Tx["provider"], invoiceId: string): Promise<Tx | null>;
  createTx(input: Omit<Tx, "id" | "perform_time" | "cancel_time" | "reason">): Promise<Tx>;
  updateTx(id: number, patch: Partial<Pick<Tx, "state" | "perform_time" | "cancel_time" | "reason">>): Promise<void>;
  txBetween(provider: Tx["provider"], from: number, to: number): Promise<Tx[]>;
  /** Счёт оплачен: продлить тариф. Вызывается один раз на счёт. */
  paid(invoice: Invoice, provider: Tx["provider"]): Promise<void>;
};

/** Payme отменяет неоплаченную транзакцию через 12 часов. */
export const PAYME_TIMEOUT_MS = 43_200_000;

/* ── Payme ────────────────────────────────────────────────────────────── */

type Localized = { ru: string; uz: string; en: string };
export type PaymeError = { code: number; message: Localized; data?: string };
export type PaymeReply = { result: unknown } | { error: PaymeError };

const msg = (ru: string, uz: string, en: string): Localized => ({ ru, uz, en });

export const PAYME_ERRORS = {
  auth: { code: -32504, message: msg("Недостаточно прав", "Ruxsat yo'q", "Insufficient privileges") },
  method: { code: -32601, message: msg("Метод не найден", "Metod topilmadi", "Method not found") },
  parse: { code: -32700, message: msg("Ошибка разбора запроса", "So'rovni o'qib bo'lmadi", "Parse error") },
  request: { code: -32600, message: msg("Неверный запрос", "Noto'g'ri so'rov", "Invalid request") },
  amount: { code: -31001, message: msg("Неверная сумма", "Summa noto'g'ri", "Invalid amount") },
  notFound: { code: -31003, message: msg("Транзакция не найдена", "Tranzaksiya topilmadi", "Transaction not found") },
  noCancel: { code: -31007, message: msg("Услуга оказана, отменить нельзя", "Xizmat ko'rsatilgan, bekor qilib bo'lmaydi", "Service provided") },
  cannot: { code: -31008, message: msg("Операцию выполнить нельзя", "Amalni bajarib bo'lmaydi", "Operation not allowed") },
  noOrder: { code: -31050, message: msg("Счёт не найден", "Hisob topilmadi", "Invoice not found"), data: "order_id" },
  orderPaid: { code: -31051, message: msg("Счёт уже оплачен", "Hisob allaqachon to'langan", "Invoice already paid"), data: "order_id" },
  orderBusy: { code: -31052, message: msg("Счёт ожидает оплаты", "Hisob to'lovni kutmoqda", "Invoice awaits payment"), data: "order_id" },
} satisfies Record<string, PaymeError>;

/** Basic-авторизация Payme: логин «Paycom», пароль — ключ кассы. */
export function paymeAuthorized(header: string | null, key: string): boolean {
  if (!header?.startsWith("Basic ")) return false;
  const decoded = Buffer.from(header.slice(6).trim(), "base64").toString("utf8");
  return safeEqual(decoded, `Paycom:${key}`);
}

type Params = Record<string, unknown>;
const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : NaN);
const orderOf = (p: Params) => {
  const account = (p.account ?? {}) as Record<string, unknown>;
  return typeof account.order_id === "string" ? account.order_id : "";
};

async function payableInvoice(repo: PayRepo, p: Params): Promise<{ invoice: Invoice } | { error: PaymeError }> {
  const id = orderOf(p);
  const invoice = /^[0-9a-f-]{36}$/.test(id) ? await repo.invoice(id) : null;
  if (!invoice || invoice.status === "cancelled") return { error: PAYME_ERRORS.noOrder };
  if (invoice.status === "paid") return { error: PAYME_ERRORS.orderPaid };
  if (num(p.amount) !== invoice.amount_uzs * 100) return { error: PAYME_ERRORS.amount };
  return { invoice };
}

const txView = (tx: Tx) => ({
  create_time: tx.create_time,
  perform_time: tx.perform_time,
  cancel_time: tx.cancel_time,
  transaction: String(tx.id),
  state: tx.state,
  reason: tx.reason,
});

export async function payme(repo: PayRepo, method: string, p: Params, now: number): Promise<PaymeReply> {
  switch (method) {
    case "CheckPerformTransaction": {
      const found = await payableInvoice(repo, p);
      if ("error" in found) return found;
      if (await repo.openTx("payme", found.invoice.id)) return { error: PAYME_ERRORS.orderBusy };
      return { result: { allow: true } };
    }

    case "CreateTransaction": {
      const extId = typeof p.id === "string" ? p.id : "";
      if (!extId) return { error: PAYME_ERRORS.request };
      const existing = await repo.tx("payme", extId);
      if (existing) {
        if (existing.state !== 1) return { error: PAYME_ERRORS.cannot };
        if (now - existing.create_time > PAYME_TIMEOUT_MS) {
          await repo.updateTx(existing.id, { state: -1, cancel_time: now, reason: 4 });
          return { error: PAYME_ERRORS.cannot };
        }
        return { result: { create_time: existing.create_time, transaction: String(existing.id), state: 1 } };
      }
      const found = await payableInvoice(repo, p);
      if ("error" in found) return found;
      // Другая попытка по тому же счёту ещё открыта — вторую не заводим.
      const open = await repo.openTx("payme", found.invoice.id);
      if (open) {
        if (now - open.create_time <= PAYME_TIMEOUT_MS) return { error: PAYME_ERRORS.orderBusy };
        await repo.updateTx(open.id, { state: -1, cancel_time: now, reason: 4 });
      }
      const tx = await repo.createTx({
        provider: "payme",
        ext_id: extId,
        invoice_id: found.invoice.id,
        amount_tiyin: num(p.amount),
        state: 1,
        create_time: now,
        provider_time: Number.isFinite(num(p.time)) ? num(p.time) : 0,
      });
      return { result: { create_time: tx.create_time, transaction: String(tx.id), state: 1 } };
    }

    case "PerformTransaction": {
      const tx = typeof p.id === "string" ? await repo.tx("payme", p.id) : null;
      if (!tx) return { error: PAYME_ERRORS.notFound };
      if (tx.state === 2) return { result: { transaction: String(tx.id), perform_time: tx.perform_time, state: 2 } };
      if (tx.state !== 1) return { error: PAYME_ERRORS.cannot };
      if (now - tx.create_time > PAYME_TIMEOUT_MS) {
        await repo.updateTx(tx.id, { state: -1, cancel_time: now, reason: 4 });
        return { error: PAYME_ERRORS.cannot };
      }
      const invoice = await repo.invoice(tx.invoice_id);
      if (!invoice || invoice.status === "cancelled") return { error: PAYME_ERRORS.cannot };
      await repo.updateTx(tx.id, { state: 2, perform_time: now });
      if (invoice.status !== "paid") await repo.paid(invoice, "payme");
      return { result: { transaction: String(tx.id), perform_time: now, state: 2 } };
    }

    case "CancelTransaction": {
      const tx = typeof p.id === "string" ? await repo.tx("payme", p.id) : null;
      if (!tx) return { error: PAYME_ERRORS.notFound };
      if (tx.state === 1) {
        const reason = Number.isInteger(num(p.reason)) ? num(p.reason) : null;
        await repo.updateTx(tx.id, { state: -1, cancel_time: now, reason });
        return { result: { transaction: String(tx.id), cancel_time: now, state: -1 } };
      }
      // Оплаченный месяц уже идёт: тариф продлён, ИИ отвечает. Возврат —
      // разговором с владельцем студии, а не кнопкой в кассе.
      if (tx.state === 2) return { error: PAYME_ERRORS.noCancel };
      return { result: { transaction: String(tx.id), cancel_time: tx.cancel_time, state: tx.state } };
    }

    case "CheckTransaction": {
      const tx = typeof p.id === "string" ? await repo.tx("payme", p.id) : null;
      if (!tx) return { error: PAYME_ERRORS.notFound };
      return { result: txView(tx) };
    }

    case "GetStatement": {
      const list = await repo.txBetween("payme", num(p.from), num(p.to));
      return {
        result: {
          transactions: list.map((tx) => ({
            id: tx.ext_id,
            time: tx.provider_time,
            amount: tx.amount_tiyin,
            account: { order_id: tx.invoice_id },
            ...txView(tx),
          })),
        },
      };
    }

    default:
      return { error: { ...PAYME_ERRORS.method, data: method } };
  }
}

/** Ссылка на оплату в Payme: параметры в base64 после адреса кассы. */
export function paymeLink(merchantId: string, invoiceId: string, amountUzs: number, returnUrl: string): string {
  const params = `m=${merchantId};ac.order_id=${invoiceId};a=${amountUzs * 100};c=${returnUrl}`;
  return `https://checkout.paycom.uz/${Buffer.from(params).toString("base64")}`;
}

/* ── Click ────────────────────────────────────────────────────────────── */

export const CLICK_ERRORS = {
  ok: [0, "Success"],
  sign: [-1, "SIGN CHECK FAILED!"],
  amount: [-2, "Incorrect parameter amount"],
  action: [-3, "Action not found"],
  paid: [-4, "Already paid"],
  noOrder: [-5, "User does not exist"],
  noTx: [-6, "Transaction does not exist"],
  request: [-8, "Error in request from click"],
  cancelled: [-9, "Transaction cancelled"],
} as const;

type ClickCode = keyof typeof CLICK_ERRORS;

/**
 * Подпись Click: md5 от click_trans_id + service_id + секрет + merchant_trans_id
 * (+ merchant_prepare_id в Complete) + amount + action + sign_time.
 */
export function clickSign(f: Record<string, string>, secret: string, complete: boolean): string {
  const raw =
    f.click_trans_id +
    f.service_id +
    secret +
    f.merchant_trans_id +
    (complete ? f.merchant_prepare_id ?? "" : "") +
    f.amount +
    f.action +
    f.sign_time;
  return createHash("md5").update(raw).digest("hex");
}

export type ClickReply = Record<string, string | number>;

function clickReply(f: Record<string, string>, code: ClickCode, extra: Record<string, number> = {}): ClickReply {
  const [error, error_note] = CLICK_ERRORS[code];
  return { click_trans_id: f.click_trans_id ?? "", merchant_trans_id: f.merchant_trans_id ?? "", ...extra, error, error_note };
}

/** Сумма Click — в сумах, иногда с копейками: «490000», «490000.00». */
const clickAmountMatches = (raw: string, invoice: Invoice) => Math.round(Number(raw) * 100) === invoice.amount_uzs * 100;

export async function click(
  repo: PayRepo,
  f: Record<string, string>,
  cfg: { secret: string; serviceId: string },
  now: number,
): Promise<ClickReply> {
  const complete = f.action === "1";
  if (f.action !== "0" && f.action !== "1") return clickReply(f, "action");
  if (!f.click_trans_id || !f.merchant_trans_id || !f.sign_string || !f.sign_time) return clickReply(f, "request");
  if (!safeEqual(clickSign(f, cfg.secret, complete), f.sign_string.toLowerCase()) || f.service_id !== cfg.serviceId) {
    return clickReply(f, "sign");
  }
  const invoice = /^[0-9a-f-]{36}$/.test(f.merchant_trans_id) ? await repo.invoice(f.merchant_trans_id) : null;
  if (!invoice) return clickReply(f, "noOrder");

  if (!complete) {
    if (invoice.status === "paid") return clickReply(f, "paid");
    if (invoice.status === "cancelled") return clickReply(f, "cancelled");
    if (!clickAmountMatches(f.amount, invoice)) return clickReply(f, "amount");
    const existing = await repo.tx("click", f.click_trans_id);
    const tx =
      existing ??
      (await repo.createTx({
        provider: "click",
        ext_id: f.click_trans_id,
        invoice_id: invoice.id,
        amount_tiyin: Math.round(Number(f.amount) * 100),
        state: 1,
        create_time: now,
        provider_time: 0,
      }));
    return clickReply(f, "ok", { merchant_prepare_id: tx.id });
  }

  const tx = /^\d+$/.test(f.merchant_prepare_id ?? "") ? await repo.txById(Number(f.merchant_prepare_id)) : null;
  if (!tx || tx.provider !== "click" || tx.ext_id !== f.click_trans_id || tx.invoice_id !== invoice.id) return clickReply(f, "noTx");
  if (tx.state === 2) return clickReply(f, "paid", { merchant_confirm_id: tx.id });
  if (tx.state < 0) return clickReply(f, "cancelled");
  // Click сообщает об отказе на своей стороне отрицательным error — отменяем у себя.
  if (Number(f.error) < 0) {
    await repo.updateTx(tx.id, { state: -1, cancel_time: now, reason: Number(f.error) });
    return clickReply(f, "cancelled");
  }
  if (!clickAmountMatches(f.amount, invoice)) return clickReply(f, "amount");
  if (invoice.status === "paid") return clickReply(f, "paid");
  await repo.updateTx(tx.id, { state: 2, perform_time: now });
  await repo.paid(invoice, "click");
  return clickReply(f, "ok", { merchant_confirm_id: tx.id });
}

/** Ссылка на оплату в Click. */
export function clickLink(serviceId: string, merchantId: string, invoiceId: string, amountUzs: number, returnUrl: string): string {
  const q = new URLSearchParams({
    service_id: serviceId,
    merchant_id: merchantId,
    amount: String(amountUzs),
    transaction_param: invoiceId,
    return_url: returnUrl,
  });
  return `https://my.click.uz/services/pay?${q}`;
}
