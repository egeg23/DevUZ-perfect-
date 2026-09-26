/**
 * Дорога к модели: прокси или ProxyAPI (lib/model-road.ts).
 *
 * 25–26 сентября у proxy6 лёг дата-центр, и сутки молчали ассистент на
 * сайте, разбор чатов скаутом и касания. Владелец: «как только прокси
 * вернётся — возвращаем его без моей команды; случится снова — снова на
 * ProxyAPI».
 */
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { test } from "node:test";

import Anthropic from "@anthropic-ai/sdk";

import { PROXYAPI_BASE, RETRY_PROXY_MS, createModelFetch, planRoads, type ModelRoad } from "@/lib/model-road";

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages?beta=true";
const DIRECT = { direct: true };
const HOUR = 60 * 60_000;

type Seen = { url: string; road: ModelRoad; headers: Headers; dispatcher: unknown; body: unknown };

function rig(behaviour: { proxy: "ok" | "dead" | number; proxyapi?: "ok" | "dead" | number }, key: string | null = "pa-key") {
  let clock = 1_000_000;
  const seen: Seen[] = [];
  const switches: ModelRoad[] = [];
  const fetchImpl = async (url: string, init: RequestInit & { dispatcher?: unknown } = {}) => {
    const road: ModelRoad = url.startsWith(PROXYAPI_BASE) ? "proxyapi" : "proxy";
    seen.push({ url, road, headers: new Headers(init.headers), dispatcher: init.dispatcher, body: init.body });
    const how = behaviour[road] ?? "ok";
    if (how === "dead") throw new TypeError("fetch failed");
    return new Response(JSON.stringify({ ok: true }), { status: how === "ok" ? 200 : how });
  };
  const road = createModelFetch({
    fetchImpl,
    key: async () => key,
    direct: () => DIRECT,
    now: () => clock,
    onSwitch: (to) => {
      switches.push(to);
    },
  });
  const call = () =>
    road.modelFetch(ANTHROPIC_URL, {
      method: "POST",
      headers: { "x-api-key": "sk-ant-secret", "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: JSON.stringify({ model: "claude-sonnet-5", max_tokens: 1 }),
    });
  return { road, call, seen, switches, advance: (ms: number) => (clock += ms) };
}

test("порядок дорог: без ключа — только прокси; на ProxyAPI до срока — только шлюз", () => {
  assert.deepEqual(planRoads({ road: "proxy", retryAt: 0 }, 0, false), ["proxy"]);
  assert.deepEqual(planRoads({ road: "proxy", retryAt: 0 }, 0, true), ["proxy", "proxyapi"]);
  assert.deepEqual(planRoads({ road: "proxyapi", retryAt: 100 }, 50, true), ["proxyapi"]);
  assert.deepEqual(planRoads({ road: "proxyapi", retryAt: 100 }, 100, true), ["proxy", "proxyapi"]);
});

test("прокси умер — тот же запрос уходит через ProxyAPI: Bearer, без ключа Anthropic, мимо прокси", async () => {
  const r = rig({ proxy: "dead", proxyapi: "ok" });
  const response = await r.call();
  assert.equal(response.status, 200);
  assert.deepEqual(r.seen.map((s) => s.road), ["proxy", "proxyapi"]);

  const gateway = r.seen[1];
  assert.equal(gateway.url, `${PROXYAPI_BASE}/v1/messages?beta=true`);
  assert.equal(gateway.headers.get("authorization"), "Bearer pa-key");
  assert.equal(gateway.headers.get("x-api-key"), null, "ключ Anthropic ушёл на чужой сервер");
  assert.equal(gateway.headers.get("anthropic-version"), "2023-06-01");
  assert.equal(gateway.dispatcher, DIRECT, "к шлюзу пошли через мёртвый прокси");
  assert.equal(gateway.body, r.seen[0].body, "тело запроса потерялось по дороге");

  assert.equal(r.road.state().road, "proxyapi");
  assert.deepEqual(r.switches, ["proxyapi"], "владелец не узнал о смене дороги");
});

test("три часа ходим через шлюз, не тратя время на мёртвый прокси", async () => {
  const r = rig({ proxy: "dead", proxyapi: "ok" });
  await r.call();
  r.seen.length = 0;
  r.advance(RETRY_PROXY_MS - 1);
  await r.call();
  assert.deepEqual(r.seen.map((s) => s.road), ["proxyapi"]);
});

test("через три часа прокси ожил — возвращаемся сами, без команды", async () => {
  const behaviour: { proxy: "ok" | "dead"; proxyapi: "ok" } = { proxy: "dead", proxyapi: "ok" };
  const r = rig(behaviour);
  await r.call();
  behaviour.proxy = "ok";
  r.advance(RETRY_PROXY_MS);
  r.seen.length = 0;
  await r.call();
  assert.deepEqual(r.seen.map((s) => s.road), ["proxy"]);
  assert.equal(r.road.state().road, "proxy");
  assert.deepEqual(r.switches, ["proxyapi", "proxy"]);

  // И снова упал — снова на шлюз.
  behaviour.proxy = "dead";
  await r.call();
  assert.equal(r.road.state().road, "proxyapi");
  assert.deepEqual(r.switches, ["proxyapi", "proxy", "proxyapi"]);
});

test("через три часа прокси всё ещё мёртв — ещё три часа на шлюзе, без повторного сообщения", async () => {
  const r = rig({ proxy: "dead", proxyapi: "ok" });
  await r.call();
  r.advance(RETRY_PROXY_MS + HOUR);
  await r.call();
  assert.equal(r.road.state().road, "proxyapi");
  assert.ok(r.road.state().retryAt > RETRY_PROXY_MS, "срок следующей пробы не сдвинулся");
  assert.deepEqual(r.switches, ["proxyapi"]);
});

test("ответ с ошибкой — дорога рабочая: через шлюз не повторяем и не переключаемся", async () => {
  // 529 «перегружено» по другой дороге будет тем же 529, а 400 спишет деньги дважды.
  for (const status of [400, 429, 529]) {
    const r = rig({ proxy: status, proxyapi: "ok" });
    const response = await r.call();
    assert.equal(response.status, status);
    assert.deepEqual(r.seen.map((s) => s.road), ["proxy"]);
    assert.deepEqual(r.switches, []);
  }
});

test("ключа ProxyAPI нет — как раньше: только прокси, ошибка сети доходит до вызывающего", async () => {
  const r = rig({ proxy: "dead" }, null);
  await assert.rejects(r.call(), TypeError);
  assert.deepEqual(r.seen.map((s) => s.road), ["proxy"]);
});

test("посетитель закрыл чат — это не повод уходить на шлюз", async () => {
  const controller = new AbortController();
  const switches: ModelRoad[] = [];
  const road = createModelFetch({
    fetchImpl: async () => {
      controller.abort();
      throw new DOMException("aborted", "AbortError");
    },
    key: async () => "pa-key",
    direct: () => DIRECT,
    onSwitch: (to) => {
      switches.push(to);
    },
  });
  await assert.rejects(road.modelFetch(ANTHROPIC_URL, { signal: controller.signal }));
  assert.equal(road.state().road, "proxy");
  assert.deepEqual(switches, []);
});

test("настоящий SDK: запрос доходит до шлюза с ключом шлюза и тем же телом", async () => {
  const seen: { url: string; headers: Headers; body: string }[] = [];
  const road = createModelFetch({
    fetchImpl: async (url, init = {}) => {
      if (!url.startsWith(PROXYAPI_BASE)) throw new TypeError("fetch failed");
      seen.push({ url, headers: new Headers(init.headers), body: String(init.body) });
      return new Response(
        JSON.stringify({
          id: "msg_1",
          type: "message",
          role: "assistant",
          model: "claude-sonnet-5",
          content: [{ type: "text", text: "ок" }],
          stop_reason: "end_turn",
          stop_sequence: null,
          usage: { input_tokens: 1, output_tokens: 1 },
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      );
    },
    key: async () => "pa-key",
    direct: () => DIRECT,
    onSwitch: () => undefined,
  });
  const client = new Anthropic({ apiKey: "sk-ant-secret", fetch: road.modelFetch, maxRetries: 0 });
  const message = await client.messages.create({
    model: "claude-sonnet-5",
    max_tokens: 5,
    messages: [{ role: "user", content: "привет" }],
  });
  assert.equal(message.content[0].type === "text" && message.content[0].text, "ок");
  assert.equal(seen.length, 1);
  assert.equal(seen[0].url, `${PROXYAPI_BASE}/v1/messages`);
  assert.equal(seen[0].headers.get("authorization"), "Bearer pa-key");
  assert.equal(seen[0].headers.get("x-api-key"), null);
  assert.equal(JSON.parse(seen[0].body).messages[0].content, "привет");
});

test("все клиенты модели создаются через anthropic() — с запасной дорогой", () => {
  const root = new URL("../", import.meta.url);
  const offenders: string[] = [];
  const walk = (dir: string) => {
    for (const name of readdirSync(new URL(dir, root))) {
      const path = `${dir}${name}`;
      if (statSync(new URL(path, root)).isDirectory()) walk(`${path}/`);
      else if (/\.(ts|tsx|mjs)$/.test(name) && path !== "lib/model-road.ts") {
        if (/new Anthropic\(/.test(readFileSync(new URL(path, root), "utf8"))) offenders.push(path);
      }
    }
  };
  walk("lib/");
  walk("app/");
  assert.deepEqual(offenders, [], "клиент без запасной дороги: при мёртвом прокси эти места замолчат");
});
