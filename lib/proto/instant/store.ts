/**
 * «Макет в боте» в базе.
 *
 * - Макет — обычная запись `protos` (раздел «Макеты», ссылка /proto/<токен>,
 *   журнал показа, пароль через 24 часа, «Проверить сайт»): готовая страница
 *   с отпечатком, `facts.instant` — чей и из чего собран. `facts.niche` —
 *   «instant-<ниша>»: пересборка панели (upgradeProto) такой макет не
 *   переписывает своим шаблоном.
 * - Лимит считается по `protos`: макеты этого Telegram-аккаунта и за день.
 * - Разговор (адрес, ниша, ответы без сайта) — `stats_snapshots`
 *   «instant-flow:<чат>»: сессия бота живёт в памяти и выкатку не переживает.
 */
import { record } from "@/lib/admin/audit";
import { newAccessToken } from "@/lib/store/access";
import type { InstantBuild } from "@/lib/proto/instant/build";
import { RUN_HOLD_MS, tashkentDayStart } from "@/lib/proto/instant/limits";
import type { InstantLocale, InstantNiche } from "@/lib/proto/instant/types";
import { serviceClient } from "@/lib/supabase";

export type FlowStage = "url" | "niche" | "q_name" | "q_phone" | "q_address" | "q_services" | "building";

export type Flow = {
  stage: FlowStage;
  locale: InstantLocale;
  url: string | null;
  nosite: boolean;
  niche: InstantNiche | null;
  answers: { name?: string; phone?: string; address?: string; services?: string };
  at: string;
};

const flowKey = (chatId: number) => `instant-flow:${chatId}`;

export async function flowOf(chatId: number): Promise<Flow | null> {
  const db = serviceClient();
  if (!db) return null;
  const { data } = await db.from("stats_snapshots").select("payload").eq("key", flowKey(chatId)).maybeSingle();
  const flow = (data?.payload ?? null) as Flow | null;
  if (!flow || typeof flow.stage !== "string") return null;
  // Разговор старше суток — забыт: человек давно о нём не помнит.
  if (Date.now() - Date.parse(flow.at) > 24 * 3600_000) return null;
  return flow;
}

export async function saveFlow(chatId: number, flow: Flow): Promise<void> {
  const db = serviceClient();
  if (!db) return;
  await db
    .from("stats_snapshots")
    .upsert({ key: flowKey(chatId), payload: { ...flow, at: new Date().toISOString() }, computed_at: new Date().toISOString() });
}

export async function dropFlow(chatId: number): Promise<void> {
  const db = serviceClient();
  if (!db) return;
  await db.from("stats_snapshots").delete().eq("key", flowKey(chatId));
}

/**
 * Забрать сборку: стадия «building» ставится условным обновлением, второй
 * запрос того же чата в те же минуты сборку не запустит.
 */
export async function claimBuild(chatId: number, flow: Flow): Promise<boolean> {
  const db = serviceClient();
  if (!db) return false;
  const now = new Date().toISOString();
  const { data } = await db
    .from("stats_snapshots")
    .update({ payload: { ...flow, stage: "building", at: now }, computed_at: now })
    .eq("key", flowKey(chatId))
    .neq("payload->>stage", "building")
    .select("key");
  if (data?.length) return true;
  // Застрявшая сборка (процесс упал посреди) — через RUN_HOLD_MS можно снова.
  const stale = new Date(Date.now() - RUN_HOLD_MS).toISOString();
  const { data: again } = await db
    .from("stats_snapshots")
    .update({ payload: { ...flow, stage: "building", at: now }, computed_at: now })
    .eq("key", flowKey(chatId))
    .lt("computed_at", stale)
    .select("key");
  return Boolean(again?.length);
}

/** Макеты этого аккаунта и все макеты в боте за сегодня по Ташкенту. */
export async function instantCounts(tgId: number, now = new Date()): Promise<{ mine: number; today: number; link: string | null } | null> {
  const db = serviceClient();
  if (!db) return null;
  const [mine, today] = await Promise.all([
    db.from("protos").select("token").eq("facts->instant->>tg", String(tgId)).order("created_at", { ascending: false }).limit(1),
    db
      .from("protos")
      .select("id", { count: "exact", head: true })
      .not("facts->instant", "is", null)
      .gte("created_at", tashkentDayStart(now).toISOString()),
  ]);
  if (mine.error || today.error) return null;
  const token = mine.data?.[0]?.token as string | undefined;
  return { mine: mine.data?.length ?? 0, today: today.count ?? 0, link: token ?? null };
}

/** Записать готовый макет: сразу «ушёл клиенту» — ссылка уходит в эту же минуту. */
export async function saveInstantProto(
  build: InstantBuild,
  who: { tgId: number; username: string | null; staffId: string | null; leadId?: string | null },
): Promise<{ id: string; token: string } | null> {
  const db = serviceClient();
  if (!db) return null;
  const now = new Date().toISOString();
  const { data, error } = await db
    .from("protos")
    .insert({
      token: newAccessToken(),
      niche: build.site.niche,
      locale: build.site.locale,
      name: build.site.name,
      source: build.site.source,
      facts: {
        niche: `instant-${build.site.niche}`,
        name: build.site.name,
        source: build.site.source,
        locale: build.site.locale,
        instant: { tg: String(who.tgId), username: who.username, staff: who.staffId, site: build.site },
      },
      html: build.html,
      stamp: build.stamp,
      problems: build.problems,
      status: build.problems.length ? "draft" : "sent",
      sent_at: build.problems.length ? null : now,
      created_by: who.staffId,
      auto: false,
    })
    .select("id, token")
    .single();
  if (error || !data) {
    console.error("макет в боте: не записался", error?.message);
    return null;
  }
  await record("proto.instant", {
    actorStaffId: who.staffId,
    targetType: "proto",
    targetId: String(data.id),
    meta: { name: build.site.name, niche: build.site.niche, problems: build.problems.length, tg: who.tgId },
  });
  return { id: String(data.id), token: String(data.token) };
}

/** Лид, заведённый по макету, — в facts.instant.lead: «Макеты» и разбор потом видят связь. */
export async function setProtoLead(protoId: string, leadId: string): Promise<void> {
  const db = serviceClient();
  if (!db) return;
  const { data } = await db.from("protos").select("facts").eq("id", protoId).maybeSingle();
  const facts = (data?.facts ?? null) as { instant?: Record<string, unknown> } | null;
  if (!facts?.instant) return;
  await db.from("protos").update({ facts: { ...facts, instant: { ...facts.instant, lead: leadId } } }).eq("id", protoId);
}
