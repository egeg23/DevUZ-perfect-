import type { ContractStage } from "@/content/contract";

/**
 * Счёт на оплату по договору: то, что считается без базы.
 *
 * Владелец: «выставление счёта должно идти вместе с подписанным договором от
 * меня и появляться у менеджера и клиента».
 *
 * Счёт выставляется на ЭТАП, а не на договор целиком. По тексту договора
 * каждый этап оплачивается авансом в 100% его стоимости; счёт на всю сумму
 * противоречил бы документу, под которым стоит подпись, и первый же
 * бухгалтер заказчика это заметит.
 */

/** Номер счёта: номер договора и этап. Один взгляд — и видно, что к чему. */
export function invoiceNumber(contractNumber: string, stageIndex: number): string {
  return `${contractNumber}-${stageIndex + 1}`;
}

/**
 * Сумма этапа.
 *
 * Округляется до целого доллара: центы в счёте, который оплачивают
 * банковским переводом в сумах по курсу дня, — это точность, которой нет.
 *
 * Последний этап добирает остаток, а не считается своей долей. Иначе доли
 * 33,3 + 33,3 + 33,4 после округления каждой дадут сумму, не равную
 * договору, и заказчик заплатит на доллар меньше или больше, чем подписал.
 */
export function stageAmountUsd(
  amountUsd: number,
  stages: readonly ContractStage[],
  stageIndex: number,
): number {
  if (stageIndex < 0 || stageIndex >= stages.length) return 0;

  const isLast = stageIndex === stages.length - 1;
  if (!isLast) return Math.round((amountUsd * stages[stageIndex].percent) / 100);

  const before = stages
    .slice(0, stageIndex)
    .reduce((sum, stage) => sum + Math.round((amountUsd * stage.percent) / 100), 0);
  return Math.round(amountUsd) - before;
}

/** Дата, до которой ждём оплату. */
export function dueDate(issuedAt: string, paymentDays: number): string {
  const date = new Date(`${issuedAt}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + paymentDays);
  return date.toISOString().slice(0, 10);
}

export type InvoiceBlock =
  | "not_approved"
  | "no_such_stage"
  | "already"
  | "no_bank"
  | "ok";

export const BLOCK_TEXT: Record<InvoiceBlock, string> = {
  not_approved: "Счёт выставляется к подтверждённому договору: до подписи платить не за что.",
  no_such_stage: "У договора нет такого этапа.",
  already: "Счёт на этот этап уже выставлен.",
  no_bank: "Не заполнены банковские реквизиты студии — счёт без счёта не документ.",
  ok: "",
};

/**
 * Можно ли выставить счёт на этот этап.
 *
 * Отдельной чистой функцией, потому что этот же вопрос задаёт и кнопка в
 * панели, и хранилище перед записью. Разойдутся — менеджер увидит кнопку,
 * нажмёт и получит отказ без объяснения.
 */
export function canIssue(input: {
  status: string;
  stages: readonly ContractStage[];
  stageIndex: number;
  issuedStages: readonly number[];
  hasBank: boolean;
}): InvoiceBlock {
  if (input.status !== "approved" && input.status !== "signed") return "not_approved";
  if (input.stageIndex < 0 || input.stageIndex >= input.stages.length) return "no_such_stage";
  if (input.issuedStages.includes(input.stageIndex)) return "already";
  if (!input.hasBank) return "no_bank";
  return "ok";
}

export type Invoice = {
  id: string;
  contract_id: string;
  stage_index: number;
  number: string;
  amount_usd: number;
  issued_at: string;
  due_at: string;
  paid_at: string | null;
};

/** Просрочен ли счёт. Сравнение по датам, без часов: у счёта их нет. */
export function overdue(invoice: Pick<Invoice, "due_at" | "paid_at">, today: string): boolean {
  return !invoice.paid_at && invoice.due_at < today;
}
