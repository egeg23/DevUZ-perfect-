/**
 * Кто лид: клиент, агентство или блогер.
 *
 * Владелец, 09.11.2026: «Когда вручную добавляем лидов в панели нашей —
 * сделай возможность выбрать: клиент / агентство или блоггер». Выбирают в
 * «Добавить лид вручную» (по умолчанию «Клиент»), колонка `leads.party`
 * (миграция 0183). Агентство и блогер не покупают сами, а приводят
 * клиентов: в списке у них метка, в карточке — куда их завести, чтобы
 * считались их проценты (агентство — «Агентства», блогер — «Партнёры»).
 */

export const LEAD_PARTIES = ["client", "agency", "blogger"] as const;
export type LeadParty = (typeof LEAD_PARTIES)[number];

/** Что пришло из формы или базы; непонятное — клиент. */
export function partyOf(raw: unknown): LeadParty {
  return typeof raw === "string" && (LEAD_PARTIES as readonly string[]).includes(raw) ? (raw as LeadParty) : "client";
}

/** Куда завести, чтобы считались проценты. */
export const PARTY_HOME: Record<Exclude<LeadParty, "client">, string> = {
  agency: "/admin/agencies",
  blogger: "/admin/partners",
};
