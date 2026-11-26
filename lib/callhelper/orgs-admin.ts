import { forgetOrg, orgOf } from "@/lib/callhelper/api-store";
import { isOrgPlan, keyHash, keyHint, newOrgKey, orgGate, usageMonth, type Org, type OrgPlan } from "@/lib/callhelper/orgs";
import { serviceClient } from "@/lib/supabase";

/**
 * Колл-центры CallHelper для блока владельца в /admin/callhelper: список,
 * выдача ключа, тариф. Ключ возвращается только из `createOrg` и
 * `reissueKey`, один раз; в базе его нет.
 */

export type OrgRowView = Org & {
  contact: string;
  keyHint: string;
  createdAt: string;
  usedMinutes: number;
  /** Доступ сейчас: «ok» или причина отказа. */
  access: string;
  minutesLeft: number | null;
};

export async function listOrgs(now: Date = new Date()): Promise<OrgRowView[]> {
  const db = serviceClient();
  if (!db) return [];
  const { data, error } = await db
    .from("callhelper_orgs")
    .select("id, name, contact, key_hint, plan, operators, trial_started_at, paid_until, active, created_at")
    .order("created_at", { ascending: false })
    .limit(200);
  if (error || !data?.length) return [];
  const ids = data.map((r) => r.id as string);
  const { data: used } = await db.from("callhelper_usage").select("org_id, month, seconds").in("org_id", ids).limit(2000);
  const month = usageMonth(now);
  return data.map((r) => {
    const org = orgOf(r as Parameters<typeof orgOf>[0]);
    const seconds = (used ?? [])
      .filter((u) => u.org_id === org.id && (org.plan === "trial" || u.month === month))
      .reduce((sum, u) => sum + (Number(u.seconds) || 0), 0);
    const gate = orgGate(org, seconds, now.getTime());
    return {
      ...org,
      contact: String(r.contact ?? ""),
      keyHint: String(r.key_hint ?? ""),
      createdAt: String(r.created_at ?? ""),
      usedMinutes: Math.floor(seconds / 60),
      access: gate.ok ? "ok" : gate.reason,
      minutesLeft: gate.ok ? gate.minutesLeft : null,
    };
  });
}

export async function createOrg(input: { name: string; contact: string; plan: OrgPlan; operators: number; staffId: string | null }): Promise<{ id: string; key: string } | null> {
  const db = serviceClient();
  if (!db) return null;
  const key = newOrgKey();
  const { data, error } = await db
    .from("callhelper_orgs")
    .insert({
      name: input.name,
      contact: input.contact || null,
      plan: input.plan,
      operators: input.operators,
      key_hash: keyHash(key),
      key_hint: keyHint(key),
      created_by: input.staffId,
    })
    .select("id")
    .maybeSingle();
  if (error || !data) return null;
  return { id: data.id as string, key };
}

export async function reissueKey(orgId: string): Promise<string | null> {
  const db = serviceClient();
  if (!db) return null;
  const key = newOrgKey();
  const { data, error } = await db
    .from("callhelper_orgs")
    .update({ key_hash: keyHash(key), key_hint: keyHint(key) })
    .eq("id", orgId)
    .select("id");
  if (error || !data?.length) return null;
  forgetOrg(orgId);
  return key;
}

export type OrgPatch = { plan: OrgPlan; operators: number; paidUntil: string | null; active: boolean };

/** Поля формы «Тариф» → правка; мусор не проходит. */
export function parseOrgPatch(raw: { plan: string; operators: string; paidUntil: string; active: string }): OrgPatch | null {
  if (!isOrgPlan(raw.plan)) return null;
  const operators = Number.parseInt(raw.operators, 10);
  if (!Number.isFinite(operators) || operators < 1 || operators > 5000) return null;
  let paidUntil: string | null = null;
  if (raw.paidUntil) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(raw.paidUntil)) return null;
    // До конца названного дня по Москве.
    paidUntil = new Date(`${raw.paidUntil}T23:59:59+03:00`).toISOString();
  }
  return { plan: raw.plan, operators, paidUntil, active: raw.active === "1" };
}

export async function updateOrg(orgId: string, patch: OrgPatch): Promise<boolean> {
  const db = serviceClient();
  if (!db) return false;
  const { data, error } = await db
    .from("callhelper_orgs")
    .update({ plan: patch.plan, operators: patch.operators, paid_until: patch.paidUntil, active: patch.active })
    .eq("id", orgId)
    .select("id");
  forgetOrg(orgId);
  return !error && !!data?.length;
}
