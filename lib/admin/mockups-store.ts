import { record } from "@/lib/admin/audit";
import type { PanelLocale } from "@/lib/admin/i18n";
import {
  SHOWCASE_LOCK,
  clientMessage,
  mockupNiche,
  parseMockupRef,
  showcaseCases,
  showcaseRow,
  tashkentTime,
  type MockupRow,
} from "@/lib/admin/mockups";
import type { Staff } from "@/lib/admin/session";
import { issueProtoCode, issueShowcaseCode, liveCodesUntil } from "@/lib/proto/code-store";
import { protoUrl } from "@/lib/proto/store";
import { serviceClient } from "@/lib/supabase";

/**
 * Раздел «Макеты»: список из базы и выдача пароля на сутки.
 *
 * Что такое макет и откуда список — lib/admin/mockups.ts.
 */

export async function mockupList(locale: PanelLocale): Promise<MockupRow[]> {
  const db = serviceClient();
  const live = await liveCodesUntil();
  const rows: MockupRow[] = [];

  if (db) {
    // Черновики не в списке: по их ссылке открывается 404 (lib/proto/serve).
    const { data, error } = await db
      .from("protos")
      .select("id, token, niche, locale, name, source, created_at, opens, auto, closed_at, lock:facts->>lock")
      .neq("status", "draft")
      .order("created_at", { ascending: false })
      .limit(1000);
    if (error) console.error("макеты: не прочитал прототипы", error.message);
    for (const row of data ?? []) {
      const id = String(row.id);
      const closed = Boolean(row.closed_at) || Boolean(row.lock);
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
        auto: row.auto === true,
        opens: Number(row.opens ?? 0),
        lang: row.locale === "uz" ? "uz" : "ru",
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
    .select("id, token, name, locale, status, closed_at, lock:facts->>lock")
    .eq("id", target.id)
    .maybeSingle();
  if (!proto || proto.status === "draft") return { ok: false, reason: "not_found" };
  const wasOpen = !proto.closed_at && !proto.lock;
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
