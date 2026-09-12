/**
 * Банковские реквизиты поставщика для счёта.
 *
 * Живут в переменных окружения, а не в content/company.ts, по одной
 * причине: репозиторий когда-нибудь откроют или отдадут подрядчику, а
 * расчётный счёт — это то, что в открытом коде не лежит. Секретом он не
 * является (его печатают на каждом счёте), но и в git его класть незачем.
 *
 * Главное здесь — поведение при незаполненных реквизитах. Счёт без номера
 * счёта не документ, а бумажка, по которой нельзя заплатить; напечатать
 * такую хуже, чем не напечатать никакой, потому что покупатель уйдёт её
 * оплачивать и вернётся через два дня с вопросом. Поэтому `sellerBank()`
 * возвращает null, если не хватает хотя бы одного обязательного поля, а
 * `missingBankVars()` называет менеджеру, чего именно не хватает.
 */

export type SellerBank = {
  taxId: string;
  bankName: string;
  account: string;
  mfo: string;
  /** SWIFT нужен только для валютного перевода из-за рубежа. */
  swift: string | null;
  bankAddress: string | null;
  /** Через сколько дней счёт считается просроченным. */
  paymentDays: number;
};

/** Обязательный минимум: без любого из них платёж не уйдёт. */
const REQUIRED = [
  "INVOICE_TAX_ID",
  "INVOICE_BANK_NAME",
  "INVOICE_BANK_ACCOUNT",
  "INVOICE_BANK_MFO",
] as const;

function read(name: string): string {
  return (process.env[name] ?? "").trim();
}

export function missingBankVars(): string[] {
  return REQUIRED.filter((name) => !read(name));
}

export function sellerBank(): SellerBank | null {
  if (missingBankVars().length) return null;

  // Значение вне разумных границ — почти наверняка опечатка в окружении
  // («14 дней» записали как 1400). Тихо взять его значило бы выставить
  // покупателю счёт со сроком оплаты в четыре года.
  const days = Number.parseInt(read("INVOICE_PAYMENT_DAYS"), 10);
  const paymentDays = Number.isFinite(days) && days >= 1 && days <= 180 ? days : 14;

  return {
    taxId: read("INVOICE_TAX_ID"),
    bankName: read("INVOICE_BANK_NAME"),
    account: read("INVOICE_BANK_ACCOUNT"),
    mfo: read("INVOICE_BANK_MFO"),
    swift: read("INVOICE_BANK_SWIFT") || null,
    bankAddress: read("INVOICE_BANK_ADDRESS") || null,
    paymentDays,
  };
}
