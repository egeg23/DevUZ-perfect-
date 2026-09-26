/**
 * Две дороги наружу: через прокси и напрямую (lib/egress.mjs).
 *
 * 25–26 сентября умер прокси, через который сервер ходил в Telegram, и бот
 * сутки молчал: не видел /login, не присылал ни ссылок на вход, ни лидов,
 * ни напоминаний — хотя напрямую api.telegram.org отвечал.
 */
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { readFileSync } from "node:fs";
import { createServer } from "node:http";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { createRoads } from "../lib/egress.mjs";

const read = (file: string) => readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
const DIRECT = { direct: true };
const URL_TG = "https://api.telegram.org/botX/sendMessage";

type Call = { url: string; road: "proxy" | "direct" };

/** Подставные дороги: для каждой — упасть сетью, ответить кодом или повиснуть. */
function roadsWith(behaviour: { proxy: "ok" | "broken" | number; direct: "ok" | "broken" | number }) {
  const calls: Call[] = [];
  const logs: string[] = [];
  const fetchImpl = async (url: string, init: RequestInit & { dispatcher?: unknown } = {}) => {
    const road = init.dispatcher === DIRECT ? "direct" : "proxy";
    calls.push({ url, road });
    const how = behaviour[road];
    if (how === "broken") throw new TypeError("fetch failed");
    return new Response("{}", { status: how === "ok" ? 200 : how });
  };
  const roads = createRoads({ fetchImpl, direct: () => DIRECT, proxied: () => true, log: (line) => logs.push(line) });
  return { ...roads, calls, logs };
}

test("прокси умер — запрос тут же уходит напрямую, и дальше ходим так", async () => {
  const r = roadsWith({ proxy: "broken", direct: "ok" });

  const first = await r.roadFetch(URL_TG, { method: "POST", body: "{}" });
  assert.equal(first.status, 200);
  assert.deepEqual(r.calls.map((c) => c.road), ["proxy", "direct"]);
  assert.equal(r.logs.length, 1, "о смене дороги не сказано в журнале");

  // Следующий запрос к тому же хосту не тратит время на мёртвый прокси.
  await r.roadFetch(URL_TG);
  assert.deepEqual(r.calls.slice(2).map((c) => c.road), ["direct"]);
  assert.deepEqual(r.roads(), { "api.telegram.org": "direct" });
});

test("прямая дорога закрылась — возвращаемся на прокси", async () => {
  const behaviour: { proxy: "ok" | "broken"; direct: "ok" | "broken" } = { proxy: "broken", direct: "ok" };
  const r = roadsWith(behaviour);
  await r.roadFetch(URL_TG);
  behaviour.proxy = "ok";
  behaviour.direct = "broken";
  const back = await r.roadFetch(URL_TG);
  assert.equal(back.status, 200);
  assert.deepEqual(r.roads(), { "api.telegram.org": "proxy" });
});

test("ответ с ошибкой — это работающая дорога: вторую не пробуем", async () => {
  // 400 от Telegram по другой дороге будет тем же 400, а сообщение ушло бы дважды.
  const r = roadsWith({ proxy: 400, direct: "ok" });
  const response = await r.roadFetch(URL_TG);
  assert.equal(response.status, 400);
  assert.deepEqual(r.calls.map((c) => c.road), ["proxy"]);
});

test("обе дороги мертвы — ошибка доходит до вызывающего", async () => {
  const r = roadsWith({ proxy: "broken", direct: "broken" });
  await assert.rejects(r.roadFetch(URL_TG), TypeError);
  assert.deepEqual(r.calls.map((c) => c.road), ["proxy", "direct"]);
});

test("дороги запоминаются по хосту: Telegram напрямую не уводит туда Метрику", async () => {
  const r = roadsWith({ proxy: "broken", direct: "ok" });
  await r.roadFetch(URL_TG);
  r.calls.length = 0;
  await r.roadFetch("https://api-metrika.yandex.net/stat/v1/data");
  assert.deepEqual(r.calls.map((c) => c.road), ["proxy", "direct"]);
});

test("время вызывающего вышло — второй попытки нет, но следующий запрос пойдёт другой дорогой", async () => {
  const calls: string[] = [];
  const controller = new AbortController();
  const fetchImpl = async (_url: string, init: RequestInit & { dispatcher?: unknown } = {}) => {
    calls.push(init.dispatcher === DIRECT ? "direct" : "proxy");
    controller.abort(new DOMException("timeout", "TimeoutError"));
    throw controller.signal.reason;
  };
  const r = createRoads({ fetchImpl, direct: () => DIRECT, proxied: () => true, log: () => undefined });
  await assert.rejects(r.roadFetch(URL_TG, { signal: controller.signal }));
  assert.deepEqual(calls, ["proxy"]);
  assert.deepEqual(r.roads(), { "api.telegram.org": "direct" });
});

test("прокси не задан — обычный fetch, одна дорога", async () => {
  const seen: unknown[] = [];
  const fetchImpl = async (_url: string, init: RequestInit & { dispatcher?: unknown } = {}) => {
    seen.push(init.dispatcher);
    return new Response("ok");
  };
  const r = createRoads({ fetchImpl, direct: () => DIRECT, proxied: () => false });
  await r.roadFetch(URL_TG);
  assert.deepEqual(seen, [undefined]);
});

test("настоящий Node с --use-env-proxy и мёртвым прокси доходит напрямую", async () => {
  // Прямая дорога — второй экземпляр глобального диспетчера Node. Если Node
  // однажды поменяет, как устроен --use-env-proxy, это должно упасть здесь,
  // а не молчанием бота на сервере.
  const server = createServer((_req, res) => res.end("напрямую"));
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.2", () => resolve()));
  const port = (server.address() as { port: number }).port;
  const egress = fileURLToPath(new URL("../lib/egress.mjs", import.meta.url));
  const script = `
    const { roadFetch, currentRoads } = await import(${JSON.stringify(egress)});
    const r = await roadFetch("http://127.0.0.2:${port}/");
    console.log(JSON.stringify({ body: await r.text(), roads: currentRoads() }));
  `;
  try {
    const out = await new Promise<string>((resolve, reject) => {
      // Прокси — закрытый порт: так выглядит умерший прокси.
      const env = { NODE_ENV: "test" as const, PATH: process.env.PATH, HTTP_PROXY: "http://127.0.0.1:1", HTTPS_PROXY: "http://127.0.0.1:1", NO_PROXY: "localhost" };
      const child = spawn(process.execPath, ["--use-env-proxy", "--no-warnings", "--input-type=module", "-e", script], {
        env,
        stdio: ["ignore", "pipe", "pipe"],
      });
      let stdout = "";
      let stderr = "";
      child.stdout.on("data", (c: Buffer) => (stdout += c));
      child.stderr.on("data", (c: Buffer) => (stderr += c));
      child.on("close", (code: number | null) => (code === 0 ? resolve(stdout) : reject(new Error(`код ${code}: ${stderr}`))));
    });
    const result = JSON.parse(out.trim().split("\n").at(-1)!);
    assert.equal(result.body, "напрямую");
    assert.deepEqual(result.roads, { [`127.0.0.2:${port}`]: "direct" });
  } finally {
    server.close();
  }
});

test("WebSocket скаута при мёртвом прокси идёт напрямую, а встроенный — застревает", async () => {
  // Скаут без прокси ходит в дата-центр Telegram через WebSocket по 443:
  // голый TCP из России закрыт. Но встроенный WebSocket в Node идёт через
  // прокси из .env так же, как fetch, — и с мёртвым прокси не доходит.
  const server = createServer();
  const reached: string[] = [];
  server.on("upgrade", (req, socket) => {
    reached.push(String(req.headers["sec-websocket-protocol"]));
    socket.destroy();
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.2", () => resolve()));
  const port = (server.address() as { port: number }).port;
  const egress = fileURLToPath(new URL("../lib/egress.mjs", import.meta.url));
  const script = `
    const { directWebSocket } = await import(${JSON.stringify(egress)});
    const attempt = (Impl) => new Promise((resolve) => {
      const ws = new Impl("ws://127.0.0.2:${port}/apiws", "binary");
      ws.onerror = ws.onclose = () => resolve();
      setTimeout(resolve, 3000);
    });
    await attempt(WebSocket);
    console.log("встроенный");
    await attempt(directWebSocket());
    console.log("прямой");
  `;
  try {
    const env = { NODE_ENV: "test" as const, PATH: process.env.PATH, HTTP_PROXY: "http://127.0.0.1:1", HTTPS_PROXY: "http://127.0.0.1:1", NO_PROXY: "localhost" };
    const out = await new Promise<string>((resolve, reject) => {
      const child = spawn(process.execPath, ["--use-env-proxy", "--no-warnings", "--input-type=module", "-e", script], {
        env,
        stdio: ["ignore", "pipe", "pipe"],
      });
      let stdout = "";
      let stderr = "";
      child.stdout.on("data", (c: Buffer) => (stdout += c));
      child.stderr.on("data", (c: Buffer) => (stderr += c));
      child.on("close", (code: number | null) => (code === 0 ? resolve(stdout) : reject(new Error(`код ${code}: ${stderr}`))));
    });
    assert.match(out, /встроенный\s+прямой/);
    // Дошёл ровно один — прямой, и с тем же подпротоколом, что просит библиотека.
    assert.deepEqual(reached, ["binary"]);
  } finally {
    server.close();
  }
});

test("Telegram, поллер, Метрика и скаут ходят двумя дорогами, модель — только через прокси", () => {
  assert.match(read("lib/qualify/telegram.ts"), /await roadFetch\(`\$\{API\}\$\{token\}\/\$\{method\}`/);
  assert.match(read("bot/poller.mjs"), /await roadFetch\(`\$\{API\}\/\$\{method\}`/);
  assert.match(read("lib/analytics/traffic.ts"), /await roadFetch\(url,/);
  const scout = read("scout/runner.mjs");
  assert.match(scout, /await probeTunnel\(proxyUrl, dc\.host, dc\.port\)/);
  assert.match(scout, /proxyUrl && !refused \? await startProxyBridge/);
  // Без прокси — WebSocket по 443 мимо прокси, а не голый TCP.
  assert.match(scout, /PromisedWebSockets\.webSocketImpl = directWebSocket\(\)/);
  assert.match(scout, /bridge \? \{ proxy: bridge\.socks \} : \{ networkSocket: PromisedWebSockets \}/);
  // Anthropic напрямую отвечает 403 — «рабочая дорога» для roadFetch, на
  // которой модели нет. Модели сюда нельзя.
  for (const file of ["app/api/health/route.ts", "lib/qualify/engine.ts"]) {
    assert.doesNotMatch(read(file), /roadFetch/, file);
  }
});
