import { record } from "@/lib/admin/audit";
import { CONTACT_PER_KIND, leadState, prospectState, seesContacts, type ContactHit } from "@/lib/admin/contact-find";
import { contactNeedles, hostOf, ilikeAny, looksLikeContact } from "@/lib/admin/find";
import type { Role } from "@/lib/admin/roles";
import { serviceClient } from "@/lib/supabase";

/**
 * Поиск контакта для бота (правила — lib/admin/contact-find.ts). Три
 * коротких запроса параллельно, как у Ctrl+K, только с контактом: лиды по
 * имени, компании, номеру заявки, нише и самому контакту; касания по сайту,
 * названию и контакту; проекты по названию, клиенту и заметке — в заметку
 * пишут, с какой компанией говорили («Adar»), а контакт берётся из лида
 * проекта. Каждый показанный контакт лида — «открыл контакт клиента» в
 * журнале с пометкой «через бота», весь поиск — одна строка `bot.contact_found`.
 */
type Row = Record<string, unknown>;
const str = (v: unknown): string | null => (typeof v === "string" && v.trim() ? v.trim() : null);

const LEAD_FIELDS = "id, request_no, company, contact_name, contact_kind, contact_handle, tg_username, status, assigned_staff_id";

export async function findContacts(staff: { id: string; role: Role }, q: string): Promise<ContactHit[] | null> {
  if (!seesContacts(staff.role)) return null;
  const db = serviceClient();
  if (!db) return null;
  const contact = looksLikeContact(q);
  const needles = contact ? contactNeedles(q) : [q];

  const leadCols = contact ? ["company", "contact_name", "request_no", "contact_handle", "tg_username"] : ["company", "contact_name", "request_no", "niche"];
  const prospectCols = contact ? ["label", "host", "url", "target"] : ["label", "host", "url"];
  const [leadsRes, prospectsRes, projectsRes] = await Promise.all([
    db.from("leads").select(LEAD_FIELDS).or(ilikeAny(leadCols, needles)).order("created_at", { ascending: false }).limit(CONTACT_PER_KIND),
    db
      .from("prospects")
      .select("id, label, host, url, target, target_kind, status, lead_id, touched_by")
      .or(ilikeAny(prospectCols, needles))
      .order("created_at", { ascending: false })
      .limit(CONTACT_PER_KIND),
    contact
      ? Promise.resolve({ data: [] as Row[], error: null })
      : db.from("projects").select("id, title, client, lead_id").or(ilikeAny(["title", "client", "notes"], [q])).order("created_at", { ascending: false }).limit(CONTACT_PER_KIND),
  ]);
  const rows = (res: { data: unknown; error: unknown }): Row[] => (res.error ? [] : ((res.data as Row[] | null) ?? []));
  const leads = rows(leadsRes);
  const prospects = rows(prospectsRes);
  const projects = rows(projectsRes);
  if (leadsRes.error) console.error("контакт в боте: лиды", leadsRes.error);

  // Контакт проекта и касания, выросшего в лид, — из их лида.
  const have = new Set(leads.map((l) => String(l.id)));
  const more = [...new Set([...projects, ...prospects].map((r) => str(r.lead_id)).filter((id): id is string => Boolean(id) && !have.has(id as string)))];
  const linked = more.length ? rows(await db.from("leads").select(LEAD_FIELDS).in("id", more)) : [];
  const leadById = new Map([...leads, ...linked].map((l) => [String(l.id), l]));

  const ownerIds = [
    ...new Set(
      [...leads, ...linked]
        .map((l) => str(l.assigned_staff_id))
        .concat(prospects.map((p) => str(p.touched_by)))
        .filter((id): id is string => Boolean(id)),
    ),
  ];
  const owners = ownerIds.length
    ? new Map(rows(await db.from("staff").select("id, display_name").in("id", ownerIds)).map((r) => [String(r.id), str(r.display_name)]))
    : new Map<string, string | null>();
  const ownerOf = (id: unknown) => owners.get(String(id ?? "")) ?? null;

  const leadContact = (l: Row) => ({
    contact: str(l.contact_handle) ?? (str(l.tg_username) ? `@${String(l.tg_username).replace(/^@/, "")}` : null),
    contactKind: str(l.contact_handle) ? str(l.contact_kind) : str(l.tg_username) ? "telegram" : null,
  });

  const hits: ContactHit[] = [];
  for (const l of leads) {
    hits.push({
      kind: "lead",
      title: str(l.company) ?? str(l.contact_name) ?? str(l.request_no) ?? "лид",
      ...leadContact(l),
      ref: str(l.request_no),
      state: leadState(str(l.status), ownerOf(l.assigned_staff_id)),
      href: `/admin/leads/${String(l.id)}`,
    });
  }
  for (const p of prospects) {
    const lead = p.lead_id ? leadById.get(String(p.lead_id)) : undefined;
    // Касание, из которого вырос найденный лид, — тот же клиент второй строкой не нужен.
    if (lead && have.has(String(lead.id))) continue;
    const site = hostOf(str(p.url)) ?? str(p.host);
    const fromLead = lead ? leadContact(lead) : null;
    hits.push({
      kind: "prospect",
      title: str(p.label) ?? site ?? "касание",
      contact: fromLead?.contact ?? str(p.target),
      contactKind: fromLead?.contactKind ?? str(p.target_kind),
      ref: site && site !== str(p.label) ? site : null,
      state: prospectState(str(p.status), ownerOf(p.touched_by)),
      href: lead ? `/admin/leads/${String(lead.id)}` : `/admin/prospect?open=${String(p.id)}#p-${String(p.id)}`,
    });
  }
  for (const pr of projects) {
    const lead = pr.lead_id ? leadById.get(String(pr.lead_id)) : undefined;
    const fromLead = lead ? leadContact(lead) : null;
    hits.push({
      kind: "project",
      title: str(pr.title) ?? "проект",
      contact: fromLead?.contact ?? null,
      contactKind: fromLead?.contactKind ?? null,
      ref: str(pr.client) ? `клиент ${str(pr.client)}` : null,
      state: null,
      via: lead ? `из лида ${str(lead.request_no) ?? ""}`.trim() : "в проекте контакта нет",
      href: `/admin/projects/${String(pr.id)}`,
    });
  }

  const shownLeads = [...new Set([...leads, ...linked].filter((l) => leadContact(l).contact).map((l) => String(l.id)))];
  await Promise.all([
    ...shownLeads.map((id) =>
      record("lead.contact_revealed", { actorStaffId: staff.id, targetType: "lead", targetId: id, meta: { via: "bot", query: q } }),
    ),
    record("bot.contact_found", { actorStaffId: staff.id, meta: { query: q, found: hits.length, leads: shownLeads.length } }),
  ]);
  return hits;
}
