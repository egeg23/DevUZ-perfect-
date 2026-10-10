/**
 * ИИ-сотрудники: Instagram Direct (lib/ai-staff/instagram.ts).
 */
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { test } from "node:test";

import {
  authorizeUrl,
  chunks,
  echoIsOurs,
  parseEvents,
  readState,
  rememberSent,
  sendIg,
  signState,
  validSignature,
} from "@/lib/ai-staff/instagram";
import { leadCard } from "@/lib/ai-staff/notify";
import { buildSystemPrompt } from "@/lib/ai-staff/prompt";
import type { Lead } from "@/lib/ai-staff/store";

const TENANT = "11111111-2222-3333-4444-555555555555";

test("подпись Meta: sha256 секретом приложения по сырому телу", () => {
  const raw = JSON.stringify({ object: "instagram", entry: [] });
  const sig = `sha256=${createHmac("sha256", "app-secret").update(raw).digest("hex")}`;
  assert.equal(validSignature(raw, sig, "app-secret"), true);
  assert.equal(validSignature(raw, sig, "other"), false);
  assert.equal(validSignature(`${raw} `, sig, "app-secret"), false, "тело изменено — подпись не сходится");
  assert.equal(validSignature(raw, null, "app-secret"), false);
});

test("события: покупатель, эхо аккаунта, вложения, удалённые и чужие объекты", () => {
  const events = parseEvents({
    object: "instagram",
    entry: [
      {
        id: "IG1",
        time: 1,
        messaging: [
          { sender: { id: "U1" }, recipient: { id: "IG1" }, timestamp: 1000, message: { mid: "m1", text: " Narxi qancha? " } },
          { sender: { id: "IG1" }, recipient: { id: "U1" }, timestamp: 1001, message: { mid: "m2", text: "Сейчас уточню", is_echo: true } },
          { sender: { id: "U2" }, recipient: { id: "IG1" }, timestamp: 1002, message: { mid: "m3", attachments: [{ type: "image" }] } },
          { sender: { id: "U3" }, recipient: { id: "IG1" }, message: { mid: "m4", is_deleted: true } },
          { sender: { id: "U4" }, recipient: { id: "IG1" }, read: { mid: "m1" } },
        ],
      },
    ],
  });
  assert.equal(events.length, 3);
  assert.deepEqual(events[0], { igId: "IG1", peerId: "U1", mid: "m1", text: "Narxi qancha?", media: false, echo: false, at: 1000 });
  assert.equal(events[1].echo, true);
  assert.equal(events[1].peerId, "U1", "у эха собеседник — получатель");
  assert.equal(events[2].media, true);
  assert.deepEqual(parseEvents({ object: "page", entry: [] }), []);
  assert.deepEqual(parseEvents(null), []);
});

test("ответ режется до 1000 байт по предложениям, без потерь текста", () => {
  const sentence = "Кухня под заказ от 4 500 000 сум за погонный метр, замер бесплатно. ";
  const long = sentence.repeat(40).trim();
  const parts = chunks(long);
  assert.ok(parts.length > 1);
  for (const p of parts) assert.ok(Buffer.byteLength(p, "utf8") <= 1000, `${Buffer.byteLength(p)} байт`);
  assert.equal(parts.join(" ").replace(/\s+/g, " "), long.replace(/\s+/g, " "));
  assert.deepEqual(chunks("Коротко."), ["Коротко."]);
  const word = "а".repeat(1500);
  assert.ok(chunks(word).every((p) => Buffer.byteLength(p) <= 1000), "слово длиннее лимита тоже режется");
});

test("эхо нашего ответа — не перехват человеком", () => {
  const base = { igId: "IG1", peerId: "U1", media: false, echo: true, at: 0 };
  rememberSent("ours-1");
  assert.equal(echoIsOurs({ ...base, mid: "ours-1", text: "что угодно" }, null), true);
  assert.equal(echoIsOurs({ ...base, mid: "x", text: "Кухня от 4 500 000 сум" }, "Вам отвечает Анна.\n\nКухня от 4 500 000 сум за метр"), true, "эхо обогнало ответ API");
  assert.equal(echoIsOurs({ ...base, mid: "y", text: "Привет, это хозяин" }, "Кухня от 4 500 000 сум"), false);
});

test("отправка: кусками, id сообщений запоминаются", async () => {
  const calls: Array<{ url: string; body: unknown; auth: string | null }> = [];
  const fake = (async (url: string, init?: RequestInit) => {
    calls.push({ url, body: JSON.parse(String(init?.body)), auth: new Headers(init?.headers).get("authorization") });
    return new Response(JSON.stringify({ recipient_id: "U1", message_id: `mid-${calls.length}` }), { status: 200 });
  }) as unknown as typeof fetch;
  const mids = await sendIg("tok", "U1", "Раз. ".repeat(300), fake);
  assert.equal(mids.length, calls.length);
  assert.ok(calls.length >= 2);
  assert.match(calls[0].url, /graph\.instagram\.com\/v25\.0\/me\/messages$/);
  assert.equal(calls[0].auth, "Bearer tok");
  assert.deepEqual((calls[0].body as { recipient: unknown }).recipient, { id: "U1" });
  assert.equal(echoIsOurs({ igId: "IG1", peerId: "U1", mid: mids[0], text: "", media: false, echo: true, at: 0 }, null), true);
});

test("state входа: подписан, привязан к клиенту, живёт 15 минут", () => {
  const now = 1_760_000_000_000;
  const state = signState(TENANT, "key", now);
  assert.equal(readState(state, "key", now + 60_000), TENANT);
  assert.equal(readState(state, "other", now), null);
  assert.equal(readState(state, "key", now + 16 * 60_000), null);
  assert.equal(readState(state.replace(TENANT, "99999999-2222-3333-4444-555555555555"), "key", now), null);
  const url = new URL(authorizeUrl("app-1", state));
  assert.equal(url.host, "www.instagram.com");
  assert.equal(url.searchParams.get("scope"), "instagram_business_basic,instagram_business_manage_messages");
  assert.match(url.searchParams.get("redirect_uri") ?? "", /\/cabinet\/instagram\/callback$/);
});

test("Instagram в промпте и в карточке заявки", () => {
  const prompt = buildSystemPrompt({ company: "X", niche: "", assistantName: "Анна", tone: "friendly", channel: "instagram", knowledge: [] });
  assert.match(prompt, /Instagram Direct/);
  assert.match(prompt, /попроси телефон/);
  const card = leadCard({ request_no: "AI-1", name: "", contact: "", need: "", budget: "", urgency: "", summary: "", test: false } as unknown as Lead, {
    kind: "instagram",
    customer_name: "",
    customer_handle: null,
    off_hours: false,
  });
  assert.match(card, /Instagram Direct/);
  assert.match(card, /замолчит на 12 часов/);
});

test("вебхук без подписи и проверка адреса с чужим токеном — отказ", async () => {
  process.env.AI_STAFF_IG_APP_ID = "app";
  process.env.AI_STAFF_IG_APP_SECRET = "app-secret";
  process.env.AI_STAFF_IG_VERIFY_TOKEN = "verify-me";
  const { GET, POST } = await import("@/app/api/ai-staff/instagram/route");
  const ok = await GET(new Request("http://x/api/ai-staff/instagram?hub.mode=subscribe&hub.verify_token=verify-me&hub.challenge=42"));
  assert.equal(ok.status, 200);
  assert.equal(await ok.text(), "42");
  assert.equal((await GET(new Request("http://x/?hub.mode=subscribe&hub.verify_token=no&hub.challenge=42"))).status, 403);
  const unsigned = await POST(new Request("http://x", { method: "POST", body: '{"object":"instagram","entry":[]}' }));
  assert.equal(unsigned.status, 403);
  delete process.env.AI_STAFF_IG_APP_ID;
  delete process.env.AI_STAFF_IG_APP_SECRET;
  delete process.env.AI_STAFF_IG_VERIFY_TOKEN;
});
