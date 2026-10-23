import { record } from "@/lib/admin/audit";
import { ownPromo } from "@/lib/admin/mockup-offer";
import type { PanelLocale } from "@/lib/admin/i18n";
import {
  SHOWCASE_LOCK,
  assignsMockups,
  clientMessage,
  mockupNiche,
  mockupOwner,
  mockupSends,
  parseMockupRef,
  showcaseCases,
  showcaseRow,
  tashkentTime,
  type MockupRow,
} from "@/lib/admin/mockups";
import type { Staff } from "@/lib/admin/session";
import { accountTags } from "@/lib/admin/work-accounts-store";
import { issueProtoCode, issueShowcaseCode, liveCodesUntil } from "@/lib/proto/code-store";
import { protoUrl } from "@/lib/proto/store";
import { activeLock } from "@/lib/proto/lock";
import { closesAt } from "@/lib/proto/auto-close";
import { firstSends, inputOf, type FirstSend } from "@/lib/proto/auto-close-read";
import { serviceClient } from "@/lib/supabase";

/**
 * Раздел «Макеты»: список из базы и выдача пароля на сутки.
 *
 * Что такое макет и откуда список — lib/admin/mockups.ts.
 */

/**
 * Все отправки макетов клиентам: кому и с какого аккаунта (mockupSends).
 * Строка mockup_offers одна на клиента и макет, поэтому их немного.
 */
async function allSends(refs: readonly string[]) {
  const db = serviceClient();
  if (!db || !refs.length) return [];
  const { data, error } = await db
    .from("mockup_offers")
    .select("mockup_ref, client, peer, account, sent_at, lead_id, prospect_id")
    .in("mockup_ref", [...refs])
    .order("sent_at", { ascending: true })
    .limit(3000);
  if (error) console.error("макеты: не прочитал отправки", error.message);
  return data ?? [];
}

export async function mockupList(locale: PanelLocale): Promise<MockupRow[]> {
  const db = serviceClient();
  const live = await liveCodesUntil();
  const rows: MockupRow[] = [];

  if (db) {
    // Черновики не в списке: по их ссылке открывается 404 (lib/proto/serve).
    const { data, error } = await db
      .from("protos")
      .select(
        "id, token, niche, locale, name, source, created_at, opens, opened_at, prospect_id, auto, closed_at, auto_closed_at, owner_staff_id, created_by, lock:facts->>lock, lockAt:facts->>lockAt, open:facts->>open, promo:facts->promo",
      )
      .neq("status", "draft")
      .order("created_at", { ascending: false })
      .limit(1000);
    if (error) console.error("макеты: не прочитал прототипы", error.message);
    // Первая отправка клиенту — у каждого макета: по ней «отправлен клиенту»,
    // ответственный (хозяин лида) и сколько открытый ещё живёт без пароля
    // (24 часа, lib/proto/auto-close.ts).
    const refs = (data ?? []).filter((r) => r.auto !== true).map((r) => `p:${r.id}`);
    const [sends, every, tags] = await Promise.all([firstSends(refs), allSends(refs), accountTags()]);
    const sendsByRef = mockupSends(every, tags);
    const owners = await ownerIds(data ?? [], sends);
    const now = new Date();
    for (const row of data ?? []) {
      // Собранные ботом для касаний (lib/proto/auto) — не в списке. Владелец,
      // 09.10.2026: «Убери из макетов „для касаний“… чтобы менеджеры не
      // путались». Их ссылки у клиентов продолжают открываться.
      if (row.auto === true) continue;
      const id = String(row.id);
      const closed = Boolean(row.closed_at) || Boolean(activeLock(row));
      rows.push({
        ref: `p:${id}`,
        kind: "proto",
        name: String(row.name),
        site: String(row.source || "") || null,
        url: protoUrl(String(row.token)),
        openHref: `/admin/mockups/open/${id}`,
        niche: mockupNiche(String(row.niche), locale),
        created: String(row.created_at),
        access: closed ? "closed" : "open",
        canCode: true,
        liveUntil: live.protos.get(id) ?? null,
        opens: Number(row.opens ?? 0),
        lang: row.locale === "uz" ? "uz" : "ru",
        promo: promoOf(row.promo),
        owner: mockupOwner(owners.ids.get(id) ?? { set: null, lead: null, touch: null, made: null }, owners.names),
        sentAt: sends.get(`p:${id}`)?.sent_at ?? null,
        sends: sendsByRef.get(`p:${id}`) ?? [],
        ...openState(row, sends.get(`p:${id}`), now),
      });
    }
  }

  for (const item of showcaseCases()) {
    const key = SHOWCASE_LOCK[item.slug];
    rows.push(showcaseRow(item, locale, key ? (live.showcases.get(key) ?? null) : null));
  }

  // Свежие сверху. У витрины дата без часов — она встаёт после прототипов того же дня.
  return rows.sort((a, b) => b.created.localeCompare(a.created));
}

type OwnerIds = Parameters<typeof mockupOwner>[0];

/**
 * Кандидаты в ответственные у каждого прототипа и имена сотрудников. Три
 * запроса на весь список, а не на строку: лиды первой отправки, касания и
 * сотрудники.
 */
async function ownerIds(
  rows: readonly Record<string, unknown>[],
  sends: Map<string, FirstSend>,
): Promise<{ ids: Map<string, OwnerIds>; names: Map<string, string> }> {
  const ids = new Map<string, OwnerIds>();
  const names = new Map<string, string>();
  const db = serviceClient();
  if (!db) return { ids, names };
  const str = (v: unknown) => (typeof v === "string" && v ? v : null);

  const leadIds = new Set<string>();
  const prospectIds = new Set<string>();
  for (const row of rows) {
    const sent = sends.get(`p:${String(row.id)}`);
    if (sent?.lead_id) leadIds.add(sent.lead_id);
    const prospect = sent?.prospect_id ?? str(row.prospect_id);
    if (prospect) prospectIds.add(prospect);
  }
  const [leads, prospects] = await Promise.all([
    leadIds.size
      ? db.from("leads").select("id, assigned_staff_id").in("id", [...leadIds])
      : Promise.resolve({ data: [] as Record<string, unknown>[] }),
    prospectIds.size
      ? db.from("prospects").select("id, touched_by").in("id", [...prospectIds])
      : Promise.resolve({ data: [] as Record<string, unknown>[] }),
  ]);
  const leadOwner = new Map((leads.data ?? []).map((l) => [String(l.id), str(l.assigned_staff_id)]));
  const toucher = new Map((prospects.data ?? []).map((p) => [String(p.id), str(p.touched_by)]));

  const staffIds = new Set<string>();
  for (const row of rows) {
    const id = String(row.id);
    const sent = sends.get(`p:${id}`);
    const prospect = sent?.prospect_id ?? str(row.prospect_id);
    const entry: OwnerIds = {
      set: str(row.owner_staff_id),
      lead: sent?.lead_id ? (leadOwner.get(sent.lead_id) ?? null) : null,
      touch: prospect ? (toucher.get(prospect) ?? null) : null,
      made: str(row.created_by),
    };
    ids.set(id, entry);
    for (const v of Object.values(entry)) if (v) staffIds.add(v);
  }
  if (staffIds.size) {
    const { data } = await db.from("staff").select("id, display_name").in("id", [...staffIds]);
    for (const s of data ?? []) if (s.display_name) names.set(String(s.id), String(s.display_name));
  }
  return { ids, names };
}

/** Кого можно назначить ответственным: все, кто работает сейчас. */
export async function mockupStaffOptions(): Promise<{ id: string; name: string }[]> {
  const db = serviceClient();
  if (!db) return [];
  const { data } = await db.from("staff").select("id, display_name").eq("is_active", true).order("display_name").limit(200);
  return (data ?? []).filter((s) => s.display_name).map((s) => ({ id: String(s.id), name: String(s.display_name) }));
}

export type OwnerResult = { ok: true } | { ok: false; reason: "forbidden" | "not_found" | "offline" };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Назначить ответственного за прототип. Руководитель и владелец
 * (assignsMockups); пустой staffId — снять назначение, и ответственный снова
 * берётся по лиду и касанию. У витрины ответственного нет.
 */
export async function setMockupOwner(ref: string, staffId: string, staff: Staff, ip: string | null): Promise<OwnerResult> {
  if (!assignsMockups(staff.role)) return { ok: false, reason: "forbidden" };
  const target = parseMockupRef(ref);
  if (!target || target.kind !== "proto") return { ok: false, reason: "not_found" };
  if (staffId && !UUID.test(staffId)) return { ok: false, reason: "not_found" };
  const db = serviceClient();
  if (!db) return { ok: false, reason: "offline" };

  let ownerName: string | null = null;
  if (staffId) {
    const { data: who } = await db.from("staff").select("id, display_name, is_active").eq("id", staffId).maybeSingle();
    if (!who?.is_active) return { ok: false, reason: "not_found" };
    ownerName = String(who.display_name ?? "");
  }
  const { data: proto, error } = await db
    .from("protos")
    .update({ owner_staff_id: staffId || null })
    .eq("id", target.id)
    .neq("status", "draft")
    .select("id, name")
    .maybeSingle();
  if (error) {
    console.error("макеты: не сохранил ответственного", error.message);
    return { ok: false, reason: "offline" };
  }
  if (!proto) return { ok: false, reason: "not_found" };
  await record("mockup.owner", {
    actorStaffId: staff.id,
    targetType: "proto",
    targetId: String(proto.id),
    meta: { name: String(proto.name), owner: ownerName },
    ip,
  });
  return { ok: true };
}

/** Своя цена акции 48 часов — та, что на самом макете (lib/admin/mockup-offer.ts, ownPromo). */
function promoOf(raw: unknown): MockupRow["promo"] {
  const own = ownPromo({ promo: raw });
  return own ? { price: own.price, regular: own.regular } : null;
}

export function openState(
  row: { closed_at?: unknown; auto_closed_at?: unknown; lock?: unknown; lockAt?: unknown; open?: unknown } & Record<string, unknown>,
  sent: Parameters<typeof inputOf>[1],
  now: Date,
): Pick<MockupRow, "openUntil" | "closedAt" | "autoClosed"> {
  const input = inputOf(
    {
      id: String(row.id),
      name: String(row.name ?? ""),
      prospect_id: (row.prospect_id as string | null) ?? null,
      auto: row.auto === true,
      closed_at: (row.closed_at as string | null) ?? null,
      opened_at: (row.opened_at as string | null) ?? null,
      created_at: String(row.created_at),
      lock: (row.lock as string | null) ?? null,
      lockAt: (row.lockAt as string | null) ?? null,
      open: (row.open as string | null) ?? null,
    },
    sent,
  );
  if (input.closedAt) return { openUntil: null, closedAt: input.closedAt, autoClosed: Boolean(row.auto_closed_at) };
  const until = closesAt(input, now);
  return { openUntil: until !== null && until > now.getTime() ? new Date(until).toISOString() : null, closedAt: null, autoClosed: false };
}

export type CodeResult =
  | { ok: true; code: string; expiresAt: string; until: string; url: string; message: string; closedNow: boolean }
  | { ok: false; reason: "not_found" | "no_lock" | "offline" };

/**
 * Пароль на сутки к макету. Каждое нажатие — новый пароль: каждому клиенту
 * свой, а выданные раньше живут до своего часа.
 */
export async function mockupCode(ref: string, staff: Staff, ip: string | null): Promise<CodeResult> {
  const target = parseMockupRef(ref);
  if (!target) return { ok: false, reason: "not_found" };

  if (target.kind === "showcase") {
    const item = showcaseCases().find((c) => c.slug === target.slug);
    if (!item) return { ok: false, reason: "not_found" };
    const key = SHOWCASE_LOCK[item.slug];
    if (!key) return { ok: false, reason: "no_lock" };
    const issued = await issueShowcaseCode(key, staff.id, `раздел «Макеты»: ${staff.display_name}`);
    if (!issued) return { ok: false, reason: "offline" };
    await record("mockup.code", {
      actorStaffId: staff.id,
      targetType: "showcase",
      targetId: null,
      meta: { name: item.name, showcase: key },
      ip,
    });
    return {
      ok: true,
      code: issued.code,
      expiresAt: issued.expiresAt,
      until: tashkentTime(issued.expiresAt),
      url: item.url!,
      message: clientMessage({ url: item.url!, code: issued.code, expiresAt: issued.expiresAt, lang: "ru" }),
      closedNow: false,
    };
  }

  const db = serviceClient();
  if (!db) return { ok: false, reason: "offline" };
  const { data: proto } = await db
    .from("protos")
    .select("id, token, name, locale, status, closed_at, lock:facts->>lock, lockAt:facts->>lockAt")
    .eq("id", target.id)
    .maybeSingle();
  if (!proto || proto.status === "draft") return { ok: false, reason: "not_found" };
  const wasOpen = !proto.closed_at && !activeLock(proto);
  const issued = await issueProtoCode(String(proto.id), "client", staff.id);
  if (!issued) return { ok: false, reason: "offline" };
  await record("mockup.code", {
    actorStaffId: staff.id,
    targetType: "proto",
    targetId: String(proto.id),
    meta: { name: String(proto.name), closed: wasOpen },
    ip,
  });
  const url = protoUrl(String(proto.token));
  const lang = proto.locale === "uz" ? "uz" : "ru";
  return {
    ok: true,
    code: issued.code,
    expiresAt: issued.expiresAt,
    until: tashkentTime(issued.expiresAt),
    url,
    message: clientMessage({ url, code: issued.code, expiresAt: issued.expiresAt, lang }),
    closedNow: wasOpen,
  };
}
