/**
 * Карточка партнёра в панели (app/admin/partners/[id]): каких клиентов он
 * привёл и где каждый сейчас.
 *
 * Владелец, 25.10.2026: «Сделай так, чтобы я и руководители могли нажать на
 * партнёра и посмотреть, каких клиентов он завёл». В списке «Партнёров» было
 * только число «Клиентов» — а кто это, видел лишь сам партнёр в кабинете.
 *
 * Здесь — без базы: строки карточки из того, что уже считает кабинет
 * (`referralsOf`: заявка, этап, начисление), плюс то, что видно только
 * команде: номер заявки, кто ведёт, проект. Строки — lib/partners/card-store.ts.
 */
import type { PartnerAccrual } from "@/lib/partners/rules";
import type { ProjectWithPartner, Referral } from "@/lib/partners/store";

/** Заявка клиента партнёра — как её видит команда. */
export type CardLead = {
  id: string;
  requestNo: string | null;
  company: string | null;
  contactName: string | null;
  status: string;
  ownerId: string | null;
};

export type CardRow = {
  leadId: string;
  createdAt: string;
  /** Как его назвать: компания, иначе имя из заявки, иначе номер заявки. */
  who: string;
  requestNo: string | null;
  /** Откуда: метка ссылки, агентство или закреплённый клиент. */
  via: string | null;
  stage: Referral["stage"];
  voidReason: string | null;
  ownerId: string | null;
  projectId: string | null;
  projectTitle: string | null;
  accrual: PartnerAccrual | null;
};

/**
 * Клиенты по заявкам — новые сверху, как в кабинете партнёра. Проект — по
 * лиду; у лида без проекта начисления нет.
 */
export function cardRows(
  referrals: readonly Referral[],
  leads: ReadonlyMap<string, CardLead>,
  projectByLead: ReadonlyMap<string, { id: string; title: string }>,
): CardRow[] {
  return referrals.map((r) => {
    const lead = leads.get(r.leadId);
    const project = projectByLead.get(r.leadId) ?? null;
    const who = lead?.company?.trim() || r.who || lead?.contactName?.trim() || lead?.requestNo || "—";
    return {
      leadId: r.leadId,
      createdAt: r.createdAt,
      who,
      requestNo: lead?.requestNo ?? null,
      via: r.agencyName ?? r.clientName ?? r.linkLabel,
      stage: r.stage,
      voidReason: r.voidReason,
      ownerId: lead?.ownerId ?? null,
      projectId: project?.id ?? null,
      projectTitle: project?.title ?? null,
      accrual: r.accrual,
    };
  });
}

/**
 * Проекты партнёра без его заявки: владелец привязал проект к партнёру
 * руками («Партнёр» в карточке проекта) — клиент пришёл не по ссылке, но
 * засчитан ему. Их тоже видно: иначе начисление есть, а клиента нет.
 */
export function projectsWithoutLead(
  projects: readonly ProjectWithPartner[],
  rows: readonly CardRow[],
): ProjectWithPartner[] {
  const linked = new Set(rows.map((r) => r.projectId).filter((id): id is string => Boolean(id)));
  return projects.filter((p) => !linked.has(p.id));
}

/** Сколько клиентов на каждом этапе — строка над таблицей. */
export function stageCounts(rows: readonly CardRow[]): Record<Referral["stage"], number> {
  const out: Record<Referral["stage"], number> = { lead: 0, work: 0, contract: 0, signed: 0, paid: 0, lost: 0 };
  for (const row of rows) out[row.stage] += 1;
  return out;
}
