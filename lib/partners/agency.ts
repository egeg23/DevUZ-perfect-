import { AGENCY_FINDER_PERCENT, accrualState, paidOf, type PaymentMoney } from "@/lib/admin/finance";
import { agencyFinder, partnerAccrualOf, type PartnerKind, type PartnerProject } from "@/lib/partners/rules";

/**
 * Деньги одного агентства-партнёра для вкладки «Агентства» — правилами, без
 * базы и без модели.
 *
 * Агентству — 15% с суммы каждого его проекта (partnerAccrualOf с `kind:
 * agency`). Тому, кто привёл, — 5% с суммы проектов, заведённых в его 12
 * месяцах (agencyFinder). Обе доли заморожены до полной оплаты проекта, как
 * у всех; отменённый проект не считается вовсе.
 */

export type AgencyMoneyProject = PartnerProject & { created_at: string };

export type Split = { earned: number; frozen: number };

export type AgencyMoney = {
  /** Живых проектов агентства (без отменённых). */
  projects: number;
  /** Сумма их договоров. */
  turnover: number;
  /** 15% агентству. */
  agency: Split;
  /** 5% тому, кто привёл, — только проекты в его 12 месяцах. */
  finder: Split;
  /** Сколько проектов в 12 месяцах того, кто привёл. */
  finderProjects: number;
};

export function agencyMoney(
  agency: { id: string; percent_override: number | null; kind: PartnerKind; brought_by: string | null; brought_at: string | null },
  projects: readonly AgencyMoneyProject[],
  payments: PaymentMoney[],
): AgencyMoney {
  const out: AgencyMoney = {
    projects: 0,
    turnover: 0,
    agency: { earned: 0, frozen: 0 },
    finder: { earned: 0, frozen: 0 },
    finderProjects: 0,
  };
  for (const project of projects) {
    if (project.partner_id !== agency.id || project.stage === "cancelled") continue;
    out.projects += 1;
    out.turnover += Math.max(0, project.amount_usd ?? 0);

    const line = partnerAccrualOf(project, payments, agency);
    if (line && line.state !== "void") out.agency[line.state] += line.amount_usd;

    if (agencyFinder(project, agency) && project.amount_usd !== null && project.amount_usd > 0) {
      out.finderProjects += 1;
      const state = accrualState(project, paidOf(project.id, payments));
      if (state !== "void") out.finder[state] += Math.round((project.amount_usd * AGENCY_FINDER_PERCENT) / 100);
    }
  }
  return out;
}
