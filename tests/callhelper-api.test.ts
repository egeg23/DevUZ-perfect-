import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { CALLHELPER_API_DOCS, CALLHELPER_API_ERRORS } from "@/content/callhelper-api";
import { handleApi, type ApiRequest, type ApiStore, type StoredCall, type StoredScript } from "@/lib/callhelper/api";
import { AUDIO_MAX_BYTES, callSummary, keyFromHeader, keyHash, keyLooksRight, newOrgKey, orgGate, usageMonth, type Org } from "@/lib/callhelper/orgs";
import { parseOrgPatch } from "@/lib/callhelper/orgs-admin";
import { EXAMPLE_SCRIPT } from "@/lib/callhelper/script";

/**
 * API DevUz CallHelper (владелец, 26.11.2026: «подготовить базу апи под
 * интеграции, чтобы и они могли к нам цепляться и мы к ним»): ключ
 * колл-центра, допуск по тарифу, звонок от начала до итога.
 */

const NOW = new Date("2026-12-15T10:00:00Z");
const KEY = newOrgKey();
const SID = "11111111-1111-4111-8111-111111111111";

function world(over: Partial<Org> = {}) {
  const org: Org = { id: "org-1", name: "Тест", plan: "trial", operators: 1, trialStartedAt: null, paidUntil: null, active: true, ...over };
  const scripts: StoredScript[] = [];
  const calls: StoredCall[] = [];
  const state = { used: 0, ticks: 0, limited: false, trialStarted: false };
  let n = 0;
  const store: ApiStore = {
    orgByKeyHash: async (hash) => (hash === keyHash(KEY) ? org : null),
    usedSeconds: async () => state.used,
    startTrial: async () => {
      state.trialStarted = true;
    },
    scripts: async () => scripts,
    saveScript: async (_o, id, name, script) => {
      const row = { id: id ?? SID, name, script, updatedAt: NOW.toISOString() };
      if (id) {
        const i = scripts.findIndex((s) => s.id === id);
        if (i === -1) return null;
        scripts[i] = row;
      } else scripts.push(row);
      return row;
    },
    deleteScript: async (_o, id) => scripts.splice(0, scripts.length, ...scripts.filter((s) => s.id !== id)).length > scripts.length,
    createCall: async (_o, c, now) => {
      n += 1;
      const call: StoredCall = {
        id: `22222222-2222-4222-8222-00000000000${n}`,
        scriptId: c.scriptId,
        startedAt: now.toISOString(),
        endedAt: null,
        operator: c.operator,
        externalId: c.externalId,
        source: c.source,
        seconds: 0,
        summary: null,
      };
      calls.push(call);
      return call;
    },
    call: async (_o, id) => calls.find((c) => c.id === id) ?? null,
    activeCalls: async () => calls.filter((c) => !c.endedAt).length,
    tick: async () => {
      state.ticks += 1;
    },
    endCall: async (_o, id, summary, now) => {
      const call = calls.find((c) => c.id === id)!;
      call.endedAt = now.toISOString();
      call.summary = summary;
      call.seconds = summary.seconds;
    },
    calls: async () => calls,
    recognize: async () => ({ text: "а сколько это стоит" }),
    suggest: async (script, lines) => ({ hint: {} as never, phrase: `этапов ${script.stages.length}, реплик ${lines.length}`, source: "code" }),
    limit: () => !state.limited,
  };
  const ask = (method: string, path: string, body?: unknown, opts: { key?: string | null; now?: Date; bytes?: Uint8Array } = {}) => {
    const [p, q = ""] = path.split("?");
    const req: ApiRequest = {
      method,
      path: p.split("/").filter(Boolean),
      query: new URLSearchParams(q),
      auth: opts.key === null ? null : `Bearer ${opts.key ?? KEY}`,
      json: async () => body ?? {},
      bytes: async () => opts.bytes ?? new Uint8Array(32_000),
    };
    return handleApi(req, store, opts.now ?? NOW);
  };
  return { org, scripts, calls, state, ask };
}

test("ключ колл-центра: вид, отпечаток, заголовок", () => {
  assert.ok(keyLooksRight(KEY));
  assert.notEqual(newOrgKey(), KEY);
  assert.equal(keyHash(KEY).length, 64);
  assert.equal(keyFromHeader(`Bearer ${KEY}`), KEY);
  assert.equal(keyFromHeader(`bearer ${KEY}`), KEY);
  assert.equal(keyFromHeader("Bearer chk_short"), null);
  assert.equal(keyFromHeader(null), null);
});

test("допуск: пробный с первого звонка, 3 дня и 50 минут; платный до даты, сверх пакета не закрывается", () => {
  const base: Org = { id: "o", name: "n", plan: "trial", operators: 1, trialStartedAt: null, paidUntil: null, active: true };
  const now = NOW.getTime();
  assert.deepEqual(orgGate(base, 0, now), { ok: true, minutesLeft: 50, hoursLeft: null, minutesIncluded: null });
  const started = { ...base, trialStartedAt: new Date(now - 24 * 3600_000).toISOString() };
  const day2 = orgGate(started, 10 * 60, now);
  assert.ok(day2.ok && day2.minutesLeft === 40 && day2.hoursLeft === 48);
  assert.deepEqual(orgGate(started, 50 * 60, now), { ok: false, reason: "trial_over" });
  assert.deepEqual(orgGate({ ...base, trialStartedAt: new Date(now - 4 * 24 * 3600_000).toISOString() }, 0, now), { ok: false, reason: "trial_over" });
  assert.deepEqual(orgGate({ ...base, active: false }, 0, now), { ok: false, reason: "inactive" });
  const paid: Org = { ...base, plan: "start", operators: 3, paidUntil: new Date(now + 1000).toISOString() };
  assert.deepEqual(orgGate(paid, 100 * 60, now), { ok: true, minutesLeft: 2900, hoursLeft: null, minutesIncluded: 3000 });
  assert.ok(orgGate(paid, 9999 * 60, now).ok, "сверх пакета доступ не закрывается");
  assert.deepEqual(orgGate({ ...paid, paidUntil: new Date(now - 1000).toISOString() }, 0, now), { ok: false, reason: "unpaid" });
  assert.equal(usageMonth(new Date("2026-12-31T22:30:00Z")), "2027-01", "месяц по Москве");
});

test("без ключа и с чужим ключом — 401, и ничего больше", async () => {
  const w = world();
  assert.equal((await w.ask("GET", "me", undefined, { key: null })).status, 401);
  assert.equal((await w.ask("GET", "me", undefined, { key: newOrgKey() })).status, 401);
  assert.equal((await w.ask("POST", "calls", {}, { key: "chk_bad" })).status, 401);
});

test("звонок от начала до итога: сценарий, звук, подсказка, итог", async () => {
  const w = world();
  const me = await w.ask("GET", "me");
  assert.equal(me.status, 200);
  assert.deepEqual((me.body as { access: unknown }).access, { ok: true, minutes_left: 50, hours_left: null, minutes_included: null });

  const bad = await w.ask("PUT", "scripts", { name: "Пусто", script: {} });
  assert.equal(bad.status, 400);
  const put = await w.ask("PUT", "scripts", { name: "Кухни", script: EXAMPLE_SCRIPT });
  assert.equal(put.status, 200);
  assert.equal((await w.ask("PUT", "scripts", { name: "Второй", script: EXAMPLE_SCRIPT })).status, 402, "на пробном один сценарий");
  assert.equal((await w.ask("PUT", `scripts/${SID}`, { name: "Кухни 2", script: EXAMPLE_SCRIPT })).status, 200, "правка своего сценария лимитом не считается");

  const start = await w.ask("POST", "calls", { script_id: SID, operator: " Анна ", external_id: "call-1", source: "test" });
  assert.equal(start.status, 201);
  assert.ok(w.state.trialStarted, "пробный отсчитывается с первого звонка");
  const id = w.calls[0].id;
  assert.equal(w.calls[0].operator, "Анна");
  assert.equal((await w.ask("POST", "calls", {})).status, 409, "на пробном один звонок разом");

  const stt = await w.ask("POST", `calls/${id}/stt?who=operator`);
  assert.deepEqual(stt.body, { who: "operator", text: "а сколько это стоит" });
  assert.equal((await w.ask("POST", `calls/${id}/stt`, undefined, { bytes: new Uint8Array(AUDIO_MAX_BYTES + 2) })).status, 413);
  assert.equal((await w.ask("POST", `calls/${id}/stt`, undefined, { bytes: new Uint8Array(101) })).status, 400);

  const lines = [
    { who: "operator", text: EXAMPLE_SCRIPT.stages[0].say },
    { who: "client", text: "это дорого" },
  ];
  const hint = await w.ask("POST", `calls/${id}/hint`, { lines });
  assert.equal(hint.status, 200);
  assert.equal((hint.body as { phrase: string }).phrase, `этапов ${EXAMPLE_SCRIPT.stages.length}, реплик 2`);
  assert.ok(w.state.ticks >= 2, "живой звонок отмечается");

  const late = new Date(NOW.getTime() + 6 * 60_000);
  assert.equal((await w.ask("POST", `calls/${id}/hint`, { lines }, { now: late })).status, 402, "на пробном звонок до 5 минут");

  const end = await w.ask("POST", `calls/${id}/end`, { lines }, { now: new Date(NOW.getTime() + 90_000) });
  assert.equal(end.status, 200);
  const summary = (end.body as { call: { seconds: number; summary: ReturnType<typeof callSummary> } }).call;
  assert.equal(summary.seconds, 90);
  assert.deepEqual(summary.summary.objections, ["Дорого"]);
  assert.equal(summary.summary.lines, 2);
  assert.equal((await w.ask("POST", `calls/${id}/stt`)).status, 409, "после итога звук не принимается");
  assert.equal((await w.ask("POST", "calls", {})).status, 201, "место освободилось");
  assert.equal(((await w.ask("GET", "calls?limit=5")).body as { calls: unknown[] }).calls.length, 2);
});

test("пробный кончился или колл-центр выключен: звонок не начать, ключ проверить можно", async () => {
  for (const over of [{ active: false }, { trialStartedAt: "2026-12-01T00:00:00Z" }] as Partial<Org>[]) {
    const w = world(over);
    assert.equal((await w.ask("POST", "calls", {})).status, 402);
    const me = await w.ask("GET", "me");
    assert.equal(me.status, 200);
    assert.equal((me.body as { access: { ok: boolean } }).access.ok, false);
  }
});

test("слишком часто — 429", async () => {
  const w = world();
  await w.ask("POST", "calls", {});
  w.state.limited = true;
  assert.equal((await w.ask("POST", `calls/${w.calls[0].id}/stt`)).status, 429);
  assert.equal((await w.ask("POST", `calls/${w.calls[0].id}/hint`, { lines: [] })).status, 429);
});

test("итог звонка считает код: этапы, возражения, запрещённое, запись", () => {
  const s = callSummary(
    EXAMPLE_SCRIPT,
    [
      { who: "operator", text: "Здравствуйте, разговор записывается" },
      { who: "client", text: "мне некогда" },
      { who: "client", text: "и вообще дорого" },
      { who: "client", text: "очень дорого" },
    ],
    61.4,
  );
  assert.equal(s.seconds, 61);
  assert.equal(s.lines, 4);
  assert.equal(s.objections.length, 2, "каждое возражение один раз");
  assert.equal(s.recordNotice, true);
  assert.equal(s.stages.length, EXAMPLE_SCRIPT.stages.length);
});

test("проверка до звонка: текст без звонка и без минут, по тарифу и с пределом частоты", async () => {
  const w = world();
  const heard = await w.ask("POST", "stt?who=client");
  assert.equal(heard.status, 200);
  assert.deepEqual(heard.body, { who: "client", text: "а сколько это стоит" });
  assert.equal(w.calls.length, 0, "звонок не заводится");
  assert.ok(!w.state.trialStarted, "пробный не начинается");
  assert.equal((await w.ask("POST", "stt", undefined, { bytes: new Uint8Array(101) })).status, 400);
  assert.equal((await w.ask("POST", "stt", undefined, { bytes: new Uint8Array(AUDIO_MAX_BYTES + 2) })).status, 413);
  assert.equal((await world({ active: false }).ask("POST", "stt")).status, 402);
  assert.equal((await w.ask("POST", "stt", undefined, { key: null })).status, 401);
});

test("описание API: каждый адрес со страницы есть в коде, каждая ошибка названа", async () => {
  const w = world({ plan: "work", operators: 5 });
  await w.ask("PUT", "scripts", { name: "Кухни", script: EXAMPLE_SCRIPT });
  await w.ask("POST", "calls", {});
  const callId = w.calls[0].id;
  for (const doc of CALLHELPER_API_DOCS) {
    const id = doc.path.startsWith("/scripts") ? SID : callId;
    const reply = await w.ask(doc.method, doc.path.replace("{id}", id).slice(1), { name: "x", script: EXAMPLE_SCRIPT, lines: [] });
    assert.notEqual(reply.status, 404, `${doc.method} ${doc.path}`);
    assert.doesNotMatch(doc.title + doc.what, /[—–]/, "без длинных тире");
  }
  const api = readFileSync("lib/callhelper/api.ts", "utf8");
  const named = new Set(CALLHELPER_API_ERRORS.map((e) => e.code));
  for (const m of api.matchAll(/fail\(\d+, "([a-z_]+)"/g)) {
    if (m[1] === "bad_json" || m[1] === "save_failed" || m[1] === "stt_off") continue;
    assert.ok(named.has(m[1]), `ошибка ${m[1]} описана на странице`);
  }
  assert.equal((await w.ask("GET", "nothing")).status, 404);
});

test("ключ не хранится, таблицы закрыты, блок ключей только владельцу", () => {
  const sql = readFileSync("supabase/migrations/0195_callhelper_orgs.sql", "utf8");
  for (const t of ["callhelper_orgs", "callhelper_scripts", "callhelper_calls", "callhelper_usage"]) {
    assert.match(sql, new RegExp(`alter table public\\.${t} enable row level security`));
  }
  assert.match(sql, /key_hash text not null unique/);
  assert.doesNotMatch(sql, /\bkey text\b/, "самого ключа в базе нет");
  const admin = readFileSync("lib/callhelper/orgs-admin.ts", "utf8");
  assert.doesNotMatch(admin, /\.select\("[^"]*key_hash/, "отпечаток наружу не читается");
  const actions = readFileSync("app/admin/callhelper/actions.ts", "utf8");
  for (const name of ["createOrgAction", "reissueOrgKeyAction", "updateOrgAction"]) {
    assert.match(actions, new RegExp(`export async function ${name}[^{]*\\{\\s*const staff = await requireRole\\("admin"\\)`), name);
  }
  assert.doesNotMatch(actions, /meta: \{[^}]*key[:,]/, "ключ в журнал не пишется");
  const page = readFileSync("app/admin/callhelper/page.tsx", "utf8");
  assert.match(page, /owner \? <CallHelperOrgs/);
  const route = readFileSync("app/api/callhelper/v1/[...path]/route.ts", "utf8");
  assert.doesNotMatch(route, /cookies\(|currentStaff/, "API ходит по ключу, не по куке панели");
  assert.equal(parseOrgPatch({ plan: "gold", operators: "1", paidUntil: "", active: "1" }), null);
  assert.equal(parseOrgPatch({ plan: "start", operators: "0", paidUntil: "", active: "1" }), null);
  assert.deepEqual(parseOrgPatch({ plan: "work", operators: "12", paidUntil: "2027-01-31", active: "" }), {
    plan: "work",
    operators: 12,
    paidUntil: "2027-01-31T20:59:59.000Z",
    active: false,
  });
});
