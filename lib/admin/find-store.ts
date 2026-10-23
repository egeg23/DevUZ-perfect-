import { FIND_PER_KIND, contactNeedles, hostOf, ilikeAny, looksLikeContact, mergeHits, type FindHit } from "@/lib/admin/find";
import { leadScopeLabel } from "@/lib/admin/find-labels";
import type { PanelLocale } from "@/lib/admin/i18n";
import { scopeFilter, scopeFor } from "@/lib/admin/leads";
import { opens, type Role, type Viewer } from "@/lib/admin/roles";
import { serviceClient } from "@/lib/supabase";

/**
 * Запросы поиска для Ctrl+K (правила — lib/admin/find.ts). Три коротких
 * запроса параллельно, по FIND_PER_KIND строк: окно поиска открывают на
 * ходу, и ждать его дольше секунды никто не будет.
 */
type Who = Viewer & { id: string; role: Role; panel_locale: PanelLocale };

type Row = Record<string, unknown>;
const str = (v: unknown): string | null => (typeof v === "string" && v.trim() ? v.trim() : null);

export async function findAll(who: Who, q: string): Promise<FindHit[]> {
  const db = serviceClient();
  if (!db) return [];
  const contact = looksLikeContact(q);
  const scope = scopeFor(who);
  const inScope = scopeFilter(scope);

  const leadQuery = () => db.from("leads").select("id, request_no, company, contact_name, status, assigned_staff_id").order("created_at", { ascending: false }).limit(FIND_PER_KIND);
  const byName = ilikeAny(["company", "contact_name", "request_no", "niche"], [q]);
  // Два «или» — только внутри одного «и»: второй параметр or PostgREST не складывает.
  const leadsByName = leadQuery().or(inScope ? `and(or(${inScope}),or(${byName}))` : byName);
  // По контакту менеджер ищет только среди своих: контакт чужого ему не открыт.
  const byContact = ilikeAny(["contact_handle", "tg_username"], contactNeedles(q));
  const leadsByContact = contact
    ? scope === "all"
      ? leadQuery().or(byContact)
      : leadQuery().eq("assigned_staff_id", who.id).or(byContact)
    : null;

  const prospects = opens(who, "/admin/prospect")
    ? db
        .from("prospects")
        .select("id, label, host, url, status, lead_id")
        .or(ilikeAny(contact ? ["label", "host", "url", "target"] : ["label", "host", "url"], contact ? contactNeedles(q) : [q]))
        .order("created_at", { ascending: false })
        .limit(FIND_PER_KIND)
    : null;
  const projects = opens(who, "/admin/projects")
    ? db.from("projects").select("id, title, client, stage").or(ilikeAny(["title", "client"], [q])).order("created_at", { ascending: false }).limit(FIND_PER_KIND)
    : null;

  const [a, b, c, d] = await Promise.all([leadsByName, leadsByContact, prospects, projects]);
  const rows = (res: { data: unknown; error: unknown } | null): Row[] => (res && !res.error ? ((res.data as Row[] | null) ?? []) : []);

  // Чей лид — именем, отдельным коротким запросом: связи leads → staff в
  // запросе не держим, имена берём по найденным id.
  const leadRows = [...rows(b), ...rows(a)];
  const ownerIds = [...new Set(leadRows.map((r) => str(r.assigned_staff_id)).filter((id): id is string => Boolean(id)))];
  const owners = ownerIds.length
    ? new Map(rows(await db.from("staff").select("id, display_name").in("id", ownerIds)).map((r) => [String(r.id), str(r.display_name)]))
    : new Map<string, string | null>();

  const lead = (r: Row): FindHit => {
    const owner = owners.get(String(r.assigned_staff_id ?? "")) ?? null;
    return {
      kind: "lead",
      href: `/admin/leads/${String(r.id)}`,
      label: str(r.company) ?? str(r.contact_name) ?? str(r.request_no) ?? String(r.id).slice(0, 8),
      meta: leadScopeLabel(who.panel_locale, String(r.status ?? ""), str(r.request_no), owner),
    };
  };
  const prospect = (r: Row): FindHit => ({
    kind: "prospect",
    // Касание, из которого вырос лид, открываем лидом: там переписка и кнопки.
    href: r.lead_id ? `/admin/leads/${String(r.lead_id)}` : `/admin/prospect?open=${String(r.id)}#p-${String(r.id)}`,
    label: str(r.label) ?? hostOf(str(r.url)) ?? str(r.host) ?? String(r.id).slice(0, 8),
    meta: hostOf(str(r.url)) ?? str(r.host),
  });
  const project = (r: Row): FindHit => ({
    kind: "project",
    href: `/admin/projects/${String(r.id)}`,
    label: str(r.title) ?? String(r.id).slice(0, 8),
    meta: str(r.client),
  });

  return mergeHits([leadRows.map(lead), rows(c).map(prospect), rows(d).map(project)]);
}
