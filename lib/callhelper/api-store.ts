import type { ApiStore, StoredCall, StoredScript } from "@/lib/callhelper/api";
import { AUDIO_RATE, usageMonth, type CallSummary, type Org, type OrgPlan } from "@/lib/callhelper/orgs";
import { cleanScript } from "@/lib/callhelper/script";
import { STT_FOLDER, STT_KEY } from "@/lib/callhelper/stt-keys";
import { suggest } from "@/lib/callhelper/suggest";
import { roadFetch } from "@/lib/egress.mjs";
import { rateLimit } from "@/lib/qualify/limiter";
import { appSecret } from "@/lib/secrets";
import { serviceClient } from "@/lib/supabase";

/**
 * База и чужие сервисы для API CallHelper (lib/callhelper/api.ts).
 *
 * Живой звонок шлёт кусок звука каждые несколько секунд, поэтому колл-центр,
 * его расход и строка звонка держатся в памяти процесса по минуте, а отметка
 * «звонок жив» пишется не чаще раза в полминуты (правило «Трафик базы —
 * опросы редко, пачкой»).
 */

const MINUTE = 60_000;
const TICK_MS = 30_000;
const TICK_MAX_S = 90;

type Cached<T> = { at: number; value: T };
const orgs = new Map<string, Cached<Org | null>>();
const usage = new Map<string, Cached<number>>();
const scripts = new Map<string, Cached<StoredScript[]>>();
const calls = new Map<string, StoredCall & { orgId: string }>();
const ticks = new Map<string, number>();

const fresh = <T>(hit: Cached<T> | undefined, now: number, ttl = MINUTE): hit is Cached<T> => !!hit && now - hit.at < ttl;

/** Забыть всё о колл-центре: после смены тарифа или ключа в панели. */
export function forgetOrg(orgId: string): void {
  for (const [hash, hit] of orgs) if (hit.value?.id === orgId) orgs.delete(hash);
  usage.delete(orgId);
  scripts.delete(orgId);
}

type OrgRow = { id: string; name: string; plan: string; operators: number; trial_started_at: string | null; paid_until: string | null; active: boolean };
export const orgOf = (r: OrgRow): Org => ({
  id: r.id,
  name: r.name,
  plan: r.plan as OrgPlan,
  operators: r.operators,
  trialStartedAt: r.trial_started_at,
  paidUntil: r.paid_until,
  active: r.active,
});

type CallRow = {
  id: string;
  script_id: string | null;
  started_at: string;
  ended_at: string | null;
  operator: string | null;
  external_id: string | null;
  source: string;
  seconds: number;
  summary: CallSummary | null;
};
const CALL_COLS = "id, script_id, started_at, ended_at, operator, external_id, source, seconds, summary";
const callOf = (r: CallRow): StoredCall => ({
  id: r.id,
  scriptId: r.script_id,
  startedAt: r.started_at,
  endedAt: r.ended_at,
  operator: r.operator,
  externalId: r.external_id,
  source: r.source,
  seconds: r.seconds,
  summary: r.summary,
});

async function addUsage(orgId: string, seconds: number, now: Date): Promise<void> {
  const db = serviceClient();
  const whole = Math.round(seconds);
  if (!db || whole <= 0) return;
  const { error } = await db.rpc("callhelper_add_usage", { p_org: orgId, p_month: usageMonth(now), p_seconds: whole });
  if (error) console.error("callhelper: счёт минут", error.message);
  const hit = usage.get(orgId);
  if (hit) hit.value += whole;
}

export const apiStore: ApiStore = {
  async orgByKeyHash(hash) {
    const now = Date.now();
    const hit = orgs.get(hash);
    if (fresh(hit, now)) return hit.value;
    const db = serviceClient();
    if (!db) return null;
    const { data, error } = await db
      .from("callhelper_orgs")
      .select("id, name, plan, operators, trial_started_at, paid_until, active")
      .eq("key_hash", hash)
      .maybeSingle();
    if (error) return null;
    const org = data ? orgOf(data as OrgRow) : null;
    orgs.set(hash, { at: now, value: org });
    if (orgs.size > 2000) for (const [k, v] of orgs) if (now - v.at > MINUTE) orgs.delete(k);
    return org;
  },

  async usedSeconds(org, now) {
    const hit = usage.get(org.id);
    if (fresh(hit, now.getTime())) return hit.value;
    const db = serviceClient();
    if (!db) return 0;
    // Пробный считается целиком, платный — за текущий месяц.
    const query = db.from("callhelper_usage").select("seconds").eq("org_id", org.id);
    const { data } = await (org.plan === "trial" ? query : query.eq("month", usageMonth(now)));
    const total = (data ?? []).reduce((sum, r) => sum + (Number(r.seconds) || 0), 0);
    usage.set(org.id, { at: now.getTime(), value: total });
    return total;
  },

  async startTrial(orgId, now) {
    const db = serviceClient();
    if (!db) return;
    await db.from("callhelper_orgs").update({ trial_started_at: now.toISOString() }).eq("id", orgId).is("trial_started_at", null);
    forgetOrg(orgId);
  },

  async scripts(orgId) {
    const now = Date.now();
    const hit = scripts.get(orgId);
    if (fresh(hit, now)) return hit.value;
    const db = serviceClient();
    if (!db) return [];
    const { data } = await db
      .from("callhelper_scripts")
      .select("id, name, script, updated_at")
      .eq("org_id", orgId)
      .order("updated_at", { ascending: false })
      .limit(60);
    const list = (data ?? []).map((r) => ({
      id: r.id as string,
      name: r.name as string,
      script: cleanScript(r.script),
      updatedAt: r.updated_at as string,
    }));
    scripts.set(orgId, { at: now, value: list });
    return list;
  },

  async saveScript(orgId, id, name, script) {
    const db = serviceClient();
    if (!db) return null;
    const row = { org_id: orgId, name, script, updated_at: new Date().toISOString() };
    const query = id
      ? db.from("callhelper_scripts").update(row).eq("id", id).eq("org_id", orgId)
      : db.from("callhelper_scripts").insert(row);
    const { data, error } = await query.select("id, name, script, updated_at").maybeSingle();
    scripts.delete(orgId);
    if (error || !data) return null;
    return { id: data.id as string, name: data.name as string, script: cleanScript(data.script), updatedAt: data.updated_at as string };
  },

  async deleteScript(orgId, id) {
    const db = serviceClient();
    if (!db) return false;
    const { data } = await db.from("callhelper_scripts").delete().eq("id", id).eq("org_id", orgId).select("id");
    scripts.delete(orgId);
    return !!data?.length;
  },

  async createCall(orgId, call, now) {
    const db = serviceClient();
    if (!db) return null;
    const stamp = now.toISOString();
    const { data, error } = await db
      .from("callhelper_calls")
      .insert({
        org_id: orgId,
        script_id: call.scriptId,
        operator: call.operator || null,
        external_id: call.externalId || null,
        source: call.source,
        started_at: stamp,
        last_at: stamp,
      })
      .select(CALL_COLS)
      .maybeSingle();
    if (error || !data) return null;
    const stored = callOf(data as CallRow);
    calls.set(stored.id, { ...stored, orgId });
    ticks.set(stored.id, now.getTime());
    return stored;
  },

  async call(orgId, id) {
    const hit = calls.get(id);
    if (hit) return hit.orgId === orgId ? hit : null;
    const db = serviceClient();
    if (!db) return null;
    const { data } = await db.from("callhelper_calls").select(CALL_COLS).eq("id", id).eq("org_id", orgId).maybeSingle();
    if (!data) return null;
    const stored = callOf(data as CallRow);
    if (!stored.endedAt) calls.set(id, { ...stored, orgId });
    return stored;
  },

  async activeCalls(orgId, now) {
    const db = serviceClient();
    if (!db) return 0;
    const { count } = await db
      .from("callhelper_calls")
      .select("id", { count: "exact", head: true })
      .eq("org_id", orgId)
      .is("ended_at", null)
      .gte("last_at", new Date(now.getTime() - TICK_MAX_S * 1000).toISOString());
    return count ?? 0;
  },

  async tick(orgId, callId, now) {
    const last = ticks.get(callId);
    const at = now.getTime();
    if (last === undefined) {
      // Процесс перезапустили посреди звонка: с этой минуты считаем заново.
      ticks.set(callId, at);
      return;
    }
    if (at - last < TICK_MS) return;
    ticks.set(callId, at);
    const db = serviceClient();
    if (!db) return;
    await db.from("callhelper_calls").update({ last_at: now.toISOString() }).eq("id", callId).eq("org_id", orgId);
    await addUsage(orgId, Math.min((at - last) / 1000, TICK_MAX_S), now);
  },

  async endCall(orgId, callId, summary, now) {
    const last = ticks.get(callId);
    if (last !== undefined) await addUsage(orgId, Math.min((now.getTime() - last) / 1000, TICK_MAX_S), now);
    ticks.delete(callId);
    calls.delete(callId);
    const db = serviceClient();
    if (!db) return;
    const stamp = now.toISOString();
    await db
      .from("callhelper_calls")
      .update({ ended_at: stamp, last_at: stamp, seconds: summary.seconds, summary })
      .eq("id", callId)
      .eq("org_id", orgId);
  },

  async calls(orgId, since, limit) {
    const db = serviceClient();
    if (!db) return [];
    let query = db.from("callhelper_calls").select(CALL_COLS).eq("org_id", orgId).order("started_at", { ascending: false }).limit(limit);
    if (since) query = query.gte("started_at", since.toISOString());
    const { data } = await query;
    return ((data ?? []) as CallRow[]).map(callOf);
  },

  async recognize(pcm) {
    const [key, folder] = await Promise.all([appSecret(STT_KEY), appSecret(STT_FOLDER)]);
    if (!key || !folder) return { error: "stt_off" };
    const url =
      "https://stt.api.cloud.yandex.net/speech/v1/stt:recognize" +
      `?folderId=${encodeURIComponent(folder)}&lang=ru-RU&topic=general&format=lpcm&sampleRateHertz=${AUDIO_RATE}`;
    try {
      const res = await roadFetch(url, {
        method: "POST",
        headers: { Authorization: `Api-Key ${key}`, "Content-Type": "application/octet-stream" },
        body: new Uint8Array(pcm),
        signal: AbortSignal.timeout(15_000),
      });
      if (!res.ok) {
        console.error("callhelper: распознавание ответило", res.status);
        return { error: "stt_down" };
      }
      const body = (await res.json()) as { result?: unknown };
      return { text: String(body.result ?? "").trim().slice(0, 2000) };
    } catch {
      return { error: "stt_down" };
    }
  },

  suggest: (script, lines) => suggest(script, lines),

  limit: (key, max) => rateLimit(`callhelper-api:${key}`, { limit: max, windowMs: MINUTE }).ok,
};
