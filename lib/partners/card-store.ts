import { cardRows, projectsWithoutLead, type CardLead, type CardRow } from "@/lib/partners/card";
import {
  agenciesOf,
  clientsOf,
  partnerById,
  referralsOf,
  summarize,
  type PartnerAgency,
  type PartnerClient,
  type PartnerSummary,
  type ProjectWithPartner,
} from "@/lib/partners/store";
import { serviceClient } from "@/lib/supabase";

export type PartnerCard = {
  summary: PartnerSummary;
  rows: CardRow[];
  /** Проекты, привязанные к партнёру руками, без его заявки. */
  extraProjects: ProjectWithPartner[];
  clients: PartnerClient[];
  agencies: PartnerAgency[];
};

/**
 * Карточка партнёра (lib/partners/card.ts): сводка — тем же `summarize`, что
 * список, клиенты — тем же `referralsOf`, что кабинет партнёра, и сверху то,
 * что видит только команда: номер заявки, кто ведёт, проект.
 */
export async function loadPartnerCard(id: string): Promise<PartnerCard | null> {
  const partner = await partnerById(id);
  if (!partner) return null;
  const [summary] = await summarize([partner]);
  const [referrals, clients, agencies] = await Promise.all([referralsOf(summary), clientsOf([id]), agenciesOf([id])]);

  const leads = new Map<string, CardLead>();
  const projectByLead = new Map<string, { id: string; title: string }>();
  const db = serviceClient();
  const leadIds = referrals.map((r) => r.leadId);
  if (db && leadIds.length) {
    const [leadRes, projectRes] = await Promise.all([
      db.from("leads").select("id, request_no, company, contact_name, status, assigned_staff_id").in("id", leadIds),
      db.from("projects").select("id, lead_id, title").in("lead_id", leadIds),
    ]);
    for (const l of leadRes.data ?? []) {
      leads.set(String(l.id), {
        id: String(l.id),
        requestNo: (l.request_no as string | null) ?? null,
        company: (l.company as string | null) ?? null,
        contactName: (l.contact_name as string | null) ?? null,
        status: String(l.status),
        ownerId: (l.assigned_staff_id as string | null) ?? null,
      });
    }
    for (const p of projectRes.data ?? []) {
      const lead = p.lead_id as string | null;
      if (lead && !projectByLead.has(lead)) projectByLead.set(lead, { id: String(p.id), title: String(p.title ?? "") });
    }
  }

  const rows = cardRows(referrals, leads, projectByLead);
  return { summary, rows, extraProjects: projectsWithoutLead(summary.projects, rows), clients, agencies };
}
