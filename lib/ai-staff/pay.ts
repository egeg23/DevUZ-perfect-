import { clickLink, paymeLink, type Invoice, type PayRepo } from "@/lib/ai-staff/billing";
import { PLANS, extendPaid, formatUzs, type PlanId } from "@/lib/ai-staff/plans";
import { botToken } from "@/lib/ai-staff/service";
import * as store from "@/lib/ai-staff/store";
import { esc, sendHtml } from "@/lib/ai-staff/telegram";
import { appSecret } from "@/lib/secrets";
import { siteUrl } from "@/lib/seo";

/**
 * Оплата картой — связка протокола (billing.ts) с базой и Telegram.
 *
 * Касса включается сама, когда в хранилище секретов появились ключи:
 * Payme — AI_STAFF_PAYME_MERCHANT_ID и AI_STAFF_PAYME_KEY; Click —
 * AI_STAFF_CLICK_SERVICE_ID, AI_STAFF_CLICK_MERCHANT_ID и
 * AI_STAFF_CLICK_SECRET. Нет ключей — в кабинете остаётся оплата по счёту.
 */

export type PayConfig = {
  payme: { merchantId: string; key: string } | null;
  click: { serviceId: string; merchantId: string; secret: string } | null;
};

export async function payConfig(): Promise<PayConfig> {
  const [pm, pk, cs, cm, cx] = await Promise.all([
    appSecret("AI_STAFF_PAYME_MERCHANT_ID"),
    appSecret("AI_STAFF_PAYME_KEY"),
    appSecret("AI_STAFF_CLICK_SERVICE_ID"),
    appSecret("AI_STAFF_CLICK_MERCHANT_ID"),
    appSecret("AI_STAFF_CLICK_SECRET"),
  ]);
  return {
    payme: pm && pk ? { merchantId: pm, key: pk } : null,
    click: cs && cm && cx ? { serviceId: cs, merchantId: cm, secret: cx } : null,
  };
}

/** Счёт оплачен: тариф продлён той же записью, что и отметка руками, владельцу — сообщение. */
async function invoicePaid(invoice: Invoice, provider: "payme" | "click"): Promise<void> {
  if (!(await store.claimInvoicePaid(invoice.id, provider))) return;
  const row = await store.invoiceForPayment(invoice.id);
  const tenant = row ? await store.tenantById(row.tenant_id) : null;
  if (!row || !tenant) return;
  const paidUntil = extendPaid(tenant.paid_until, row.months, new Date());
  await store.addPayment(tenant.id, {
    plan: row.plan,
    months: row.months,
    amountUzs: row.amount_uzs,
    method: provider,
    paidUntil,
    staffId: null,
  });
  await store.setEmployeeTier(tenant.id, PLANS[row.plan].tier);

  const token = await botToken().catch(() => null);
  if (!token) return;
  const until = paidUntil.toLocaleDateString(tenant.locale === "uz" ? "uz-Latn-UZ" : "ru-RU", { timeZone: "Asia/Tashkent" });
  const text =
    tenant.locale === "uz"
      ? `<b>To'lov qabul qilindi:</b> ${formatUzs(row.amount_uzs)} so'm. «${esc(tenant.name)}» kabineti ${until} gacha to'langan.`
      : `<b>Оплата получена:</b> ${formatUzs(row.amount_uzs)} сум. Кабинет «${esc(tenant.name)}» оплачен до ${until}.`;
  for (const member of await store.members(tenant.id)) {
    if (member.role === "owner") await sendHtml(token, member.telegram_user_id, text);
  }
}

export const dbPayRepo: PayRepo = {
  async invoice(id) {
    const row = await store.invoiceForPayment(id);
    return row ? { id: row.id, tenant_id: row.tenant_id, amount_uzs: Number(row.amount_uzs), status: row.status } : null;
  },
  tx: (provider, extId) => store.payTx(provider, extId),
  txById: (id) => store.payTxById(id),
  openTx: (provider, invoiceId) => store.openPayTx(provider, invoiceId),
  createTx: (input) => store.insertPayTx(input),
  updateTx: (id, patch) => store.patchPayTx(id, patch),
  txBetween: (provider, from, to) => store.payTxBetween(provider, from, to),
  paid: invoicePaid,
};

/** Счёт из кабинета и ссылка на кассу. null — кассы нет. */
export async function startPayment(
  tenant: store.Tenant,
  input: { plan: PlanId; months: number; provider: "payme" | "click" },
): Promise<string | null> {
  if (input.plan === "trial") return null;
  const cfg = await payConfig();
  const months = Math.max(1, Math.min(12, Math.round(input.months)));
  const amount = PLANS[input.plan].priceUzs * months;
  const back = `${siteUrl}/cabinet/plan?n=paid`;
  if (input.provider === "payme" && cfg.payme) {
    const invoice = await store.createInvoice(tenant.id, { plan: input.plan, months, amountUzs: amount, provider: "payme" });
    return paymeLink(cfg.payme.merchantId, invoice.id, amount, back);
  }
  if (input.provider === "click" && cfg.click) {
    const invoice = await store.createInvoice(tenant.id, { plan: input.plan, months, amountUzs: amount, provider: "click" });
    return clickLink(cfg.click.serviceId, cfg.click.merchantId, invoice.id, amount, back);
  }
  return null;
}
