import type { CallLine } from "@/lib/callhelper/engine";
import {
  AUDIO_MAX_BYTES,
  AUDIO_MIN_BYTES,
  callSecondsLimit,
  callSummary,
  keyFromHeader,
  keyHash,
  orgGate,
  scriptsLimitOf,
  seatsOf,
  type CallSummary,
  type Org,
} from "@/lib/callhelper/orgs";
import { EXAMPLE_SCRIPT, cleanScript, formFromScript, scriptFromForm, scriptProblems, type CallScript, type ScriptForm } from "@/lib/callhelper/script";
import { cleanLines, type Suggestion } from "@/lib/callhelper/suggest";

/**
 * DevUz CallHelper API v1 — разбор запроса без Next и без базы: всё, что
 * ходит наружу, приходит через `ApiStore` (lib/callhelper/api-store.ts), а
 * тест подставляет своё. Адреса — `/api/callhelper/v1/…`, ключ колл-центра —
 * `Authorization: Bearer chk_…`. Описание для людей — /ru/callhelper/api.
 */

export type StoredScript = { id: string; name: string; script: CallScript; updatedAt: string };
export type StoredCall = {
  id: string;
  scriptId: string | null;
  startedAt: string;
  endedAt: string | null;
  operator: string | null;
  externalId: string | null;
  source: string;
  seconds: number;
  summary: CallSummary | null;
};

export type ApiStore = {
  orgByKeyHash(hash: string): Promise<Org | null>;
  usedSeconds(org: Org, now: Date): Promise<number>;
  startTrial(orgId: string, now: Date): Promise<void>;
  scripts(orgId: string): Promise<StoredScript[]>;
  saveScript(orgId: string, id: string | null, name: string, script: CallScript): Promise<StoredScript | null>;
  deleteScript(orgId: string, id: string): Promise<boolean>;
  createCall(orgId: string, call: { scriptId: string | null; operator: string; externalId: string; source: string }, now: Date): Promise<StoredCall | null>;
  call(orgId: string, id: string): Promise<StoredCall | null>;
  activeCalls(orgId: string, now: Date): Promise<number>;
  /** Звонок жив: отметка времени и секунды в счёт минут, не чаще раза в полминуты. */
  tick(orgId: string, callId: string, now: Date): Promise<void>;
  endCall(orgId: string, callId: string, summary: CallSummary, now: Date): Promise<void>;
  calls(orgId: string, since: Date | null, limit: number): Promise<StoredCall[]>;
  recognize(pcm: Uint8Array): Promise<{ text: string } | { error: "stt_off" | "stt_down" }>;
  suggest(script: CallScript, lines: CallLine[]): Promise<Suggestion>;
  limit(key: string, max: number): boolean;
};

export type ApiRequest = {
  method: string;
  /** Часть адреса после `/api/callhelper/v1/`. */
  path: string[];
  query: URLSearchParams;
  auth: string | null;
  json(): Promise<unknown>;
  bytes(): Promise<Uint8Array>;
};

export type ApiReply = { status: number; body: unknown };

const fail = (status: number, error: string, extra: Record<string, unknown> = {}): ApiReply => ({ status, body: { error, ...extra } });
const ok = (body: unknown, status = 200): ApiReply => ({ status, body });

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const text = (value: unknown, max: number) =>
  typeof value === "string" ? value.replace(/[\u0000-\u001f\u007f]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max) : "";

const scriptOut = (s: StoredScript) => ({ id: s.id, name: s.name, script: s.script, form: formFromScript(s.script), updated_at: s.updatedAt });
const callOut = (c: StoredCall) => ({
  id: c.id,
  script_id: c.scriptId,
  operator: c.operator,
  external_id: c.externalId,
  source: c.source,
  started_at: c.startedAt,
  ended_at: c.endedAt,
  seconds: c.seconds,
  summary: c.summary,
});

/** Сценарий звонка: названный в нём или первый у колл-центра; нет ни одного — пустой. */
async function scriptFor(store: ApiStore, orgId: string, scriptId: string | null): Promise<CallScript> {
  const all = await store.scripts(orgId);
  return (all.find((s) => s.id === scriptId) ?? all[0])?.script ?? cleanScript({});
}

export async function handleApi(req: ApiRequest, store: ApiStore, now: Date = new Date()): Promise<ApiReply> {
  const key = keyFromHeader(req.auth);
  if (!key) return fail(401, "unauthorized");
  const org = await store.orgByKeyHash(keyHash(key));
  if (!org) return fail(401, "unauthorized");

  const used = await store.usedSeconds(org, now);
  const gate = orgGate(org, used, now.getTime());
  const [head, id, action] = req.path;
  const route = `${req.method} ${head ?? ""}${id ? "/:id" : ""}${action ? `/${action}` : ""}`;

  if (route === "GET me") {
    return ok({
      org: { id: org.id, name: org.name, plan: org.plan, operators: seatsOf(org) },
      access: gate.ok
        ? { ok: true, minutes_left: gate.minutesLeft, hours_left: gate.hoursLeft, minutes_included: gate.minutesIncluded }
        : { ok: false, reason: gate.reason },
      used_minutes: Math.floor(used / 60),
      limits: { scripts: scriptsLimitOf(org), call_seconds: callSecondsLimit(org) },
    });
  }

  if (route === "GET scripts") return ok({ scripts: (await store.scripts(org.id)).map(scriptOut) });

  // Пример сценария: с него начинает колл-центр, у которого своего ещё нет.
  if (route === "GET scripts/:id" && id === "example") return ok({ script: EXAMPLE_SCRIPT, form: formFromScript(EXAMPLE_SCRIPT) });

  if (route === "PUT scripts" || route === "PUT scripts/:id") {
    if (id && !UUID.test(id)) return fail(404, "not_found");
    let body: Record<string, unknown>;
    try {
      body = (await req.json()) as Record<string, unknown>;
    } catch {
      return fail(400, "bad_json");
    }
    const name = text(body?.name, 120) || "Сценарий";
    // Сценарий — готовой структурой или простыми текстовыми полями, как в панели (`form`).
    const script = body?.form && typeof body.form === "object" ? scriptFromForm(body.form as Partial<ScriptForm>) : cleanScript(body?.script);
    const problems = scriptProblems(script);
    if (problems.length) return fail(400, "script", { problems });
    if (!id && (await store.scripts(org.id)).length >= scriptsLimitOf(org)) return fail(402, "scripts_limit", { limit: scriptsLimitOf(org) });
    const saved = await store.saveScript(org.id, id ?? null, name, script);
    return saved ? ok({ script: scriptOut(saved) }) : fail(id ? 404 : 502, id ? "not_found" : "save_failed");
  }

  if (route === "DELETE scripts/:id") {
    if (!UUID.test(id)) return fail(404, "not_found");
    return (await store.deleteScript(org.id, id)) ? ok({ ok: true }) : fail(404, "not_found");
  }

  if (route === "GET calls") {
    const sinceRaw = req.query.get("since");
    const since = sinceRaw && !Number.isNaN(Date.parse(sinceRaw)) ? new Date(sinceRaw) : null;
    const limit = Math.min(200, Math.max(1, Number.parseInt(req.query.get("limit") ?? "50", 10) || 50));
    return ok({ calls: (await store.calls(org.id, since, limit)).map(callOut) });
  }

  if (route === "POST calls") {
    if (!gate.ok) return fail(402, gate.reason);
    let body: Record<string, unknown> = {};
    try {
      body = ((await req.json()) ?? {}) as Record<string, unknown>;
    } catch {
      return fail(400, "bad_json");
    }
    const scriptId = typeof body.script_id === "string" && UUID.test(body.script_id) ? body.script_id : null;
    if ((await store.activeCalls(org.id, now)) >= seatsOf(org)) return fail(409, "seats", { seats: seatsOf(org) });
    if (org.plan === "trial" && !org.trialStartedAt) await store.startTrial(org.id, now);
    const call = await store.createCall(
      org.id,
      { scriptId, operator: text(body.operator, 120), externalId: text(body.external_id, 160), source: text(body.source, 40) || "api" },
      now,
    );
    return call ? ok({ call: callOut(call), limits: { call_seconds: callSecondsLimit(org) } }, 201) : fail(502, "save_failed");
  }

  if (head === "calls" && id && UUID.test(id)) {
    const call = await store.call(org.id, id);
    if (!call) return fail(404, "not_found");
    if (route === "GET calls/:id") return ok({ call: callOut(call) });

    const live = req.method === "POST" && (action === "stt" || action === "hint");
    if (live) {
      if (call.endedAt) return fail(409, "ended");
      if (!gate.ok) return fail(402, gate.reason);
      if (now.getTime() - Date.parse(call.startedAt) > callSecondsLimit(org) * 1000) return fail(402, "call_limit", { seconds: callSecondsLimit(org) });
    }

    if (route === "POST calls/:id/stt") {
      if (!store.limit(`stt:${org.id}`, 240 * seatsOf(org))) return fail(429, "rate");
      const who = req.query.get("who") === "operator" ? "operator" : "client";
      const pcm = await req.bytes();
      if (pcm.byteLength > AUDIO_MAX_BYTES) return fail(413, "too_big", { max_bytes: AUDIO_MAX_BYTES });
      if (pcm.byteLength < AUDIO_MIN_BYTES || pcm.byteLength % 2) return fail(400, "audio");
      await store.tick(org.id, call.id, now);
      const heard = await store.recognize(pcm);
      if ("error" in heard) return fail(503, heard.error);
      return ok({ who, text: heard.text });
    }

    if (route === "POST calls/:id/hint") {
      if (!store.limit(`hint:${org.id}`, 60 * seatsOf(org))) return fail(429, "rate");
      let body: Record<string, unknown>;
      try {
        body = (await req.json()) as Record<string, unknown>;
      } catch {
        return fail(400, "bad_json");
      }
      await store.tick(org.id, call.id, now);
      return ok(await store.suggest(await scriptFor(store, org.id, call.scriptId), cleanLines(body?.lines)));
    }

    if (route === "POST calls/:id/end") {
      if (call.endedAt) return ok({ call: callOut(call) });
      let body: Record<string, unknown> = {};
      try {
        body = ((await req.json()) ?? {}) as Record<string, unknown>;
      } catch {
        body = {};
      }
      const seconds = Math.min((now.getTime() - Date.parse(call.startedAt)) / 1000, callSecondsLimit(org));
      const summary = callSummary(await scriptFor(store, org.id, call.scriptId), cleanLines(body.lines, 400), seconds);
      await store.endCall(org.id, call.id, summary, now);
      return ok({ call: callOut({ ...call, endedAt: now.toISOString(), seconds: summary.seconds, summary }) });
    }
  }

  return fail(404, "not_found");
}
