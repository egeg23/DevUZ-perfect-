import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { GAP_MS, PER_SECOND, audienceOf, segmentCounts, segmentsOf, tallyOf, userMessage, type BotUser, type Marks } from "@/lib/admin/bot-users";

/**
 * Рассылка «Пользователям бота» и «Сотрудникам». Владелец, 13.10.2026: «У
 * нас же рассылка через бота не завязана на ИИ?… это именно рассылка
 * своего текста через бот сотрудникам или пользователям, раздели их».
 */

const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");

const MODULES = [
  "lib/admin/broadcast.ts",
  "lib/admin/broadcast-store.ts",
  "lib/admin/bot-users.ts",
  "lib/admin/bot-users-store.ts",
  "app/admin/hq/actions.ts",
  "components/admin/hq-broadcast.tsx",
];

test("рассылка без модели: ни один модуль не тянет Anthropic, model-road или движок разговора", () => {
  for (const file of MODULES) {
    const src = read(file);
    for (const bad of ["@anthropic-ai", "model-road", "qualify/engine", "anthropic(", "ARTICLE_MODEL", "claude-"]) {
      assert.ok(!src.includes(bad), `${file}: «${bad}» — рассылка не должна зависеть от модели`);
    }
  }
  // Путь — прямо в Bot API.
  assert.match(read("lib/admin/bot-users-store.ts"), /import \{ sendBroadcastMessage \} from "@\/lib\/qualify\/telegram";/);
  assert.match(read("lib/admin/broadcast-store.ts"), /import \{ sendMessage \} from "@\/lib\/qualify\/telegram";/);
});

const marks: Marks = { staff: new Set([1]), partners: new Set([2]), buyers: new Set([3, 2]) };
const user = (chat_id: number, blocked = false): BotUser => ({ chat_id, username: null, first_name: null, blocked_at: blocked ? "2026-10-13T00:00:00Z" : null });
const users = [user(1), user(2), user(3), user(4), user(5, true)];

test("пользователи: сотрудников нет никогда, заблокировавшие бот не получают, сегменты по базе", () => {
  assert.deepEqual(segmentsOf(2, marks), ["all", "partners", "buyers"]);
  assert.deepEqual(segmentsOf(4, marks), ["all", "clients"]);
  assert.deepEqual(
    audienceOf(users, marks, "all").map((u) => u.chat_id),
    [2, 3, 4],
  );
  assert.deepEqual(segmentCounts(users, marks), { all: 3, partners: 1, buyers: 2, clients: 1 });
  assert.ok(!audienceOf(users, marks, "all").some((u) => u.chat_id === 1), "сотрудник");
  assert.ok(!audienceOf(users, marks, "all").some((u) => u.chat_id === 5), "заблокировал бота");
});

test("текст пользователю — ровно свой, экранированный, без подписи сотрудника", () => {
  assert.equal(userMessage("  Скидка <b>10%</b> & ссылка https://devuz.studio  "), "Скидка &lt;b&gt;10%&lt;/b&gt; &amp; ссылка https://devuz.studio");
});

test("лимит Telegram: не быстрее 25 в секунду, порциями; 403 — «заблокировал», больше не шлём", () => {
  assert.equal(PER_SECOND, 25);
  assert.equal(GAP_MS, 40);
  const store = read("lib/admin/bot-users-store.ts");
  assert.match(store, /await sleep\(GAP_MS\);/);
  assert.match(store, /if \(budget <= 0\) break;/);
  assert.match(store, /if \(outcome === "blocked"\) await db\.from\("bot_users"\)\.update\(\{ blocked_at:/);
  assert.match(read("lib/qualify/telegram.ts"), /"error_code"\\s\*:\\s\*403/);
  // Отметка — до сообщения.
  const claim = store.indexOf('.upsert({ broadcast_id: b.id, chat_id: chat }, { onConflict: "broadcast_id,chat_id", ignoreDuplicates: true })');
  assert.ok(claim > 0 && claim < store.indexOf("await sendBroadcastMessage(chat, text)"));
  // Снова написал боту — разблокировал.
  assert.match(store, /last_at: now\.toISOString\(\),\s*blocked_at: null,/);
  assert.match(read("app/api/telegram/webhook/route.ts"), /noteBotUser\(/);
});

test("итог: дошло, не дошло (попытки кончились), заблокировали, ещё в пути", () => {
  assert.deepEqual(
    tallyOf(6, [
      { status: "sent", attempts: 1 },
      { status: "sent", attempts: 2 },
      { status: "blocked", attempts: 1 },
      { status: "failed", attempts: 3 },
      { status: "failed", attempts: 1 },
    ]),
    { sent: 2, failed: 1, blocked: 1, pending: 2 },
  );
});

test("два вида раздельно: доставка сотрудникам не трогает рассылки пользователям, история — по виду", () => {
  const staff = read("lib/admin/broadcast-store.ts");
  assert.match(staff, /export async function sendBroadcasts[\s\S]*?\.eq\("kind", "staff"\)/);
  assert.match(read("lib/admin/bot-users-store.ts"), /\.eq\("kind", "users"\)/);
  assert.match(staff, /export async function broadcastHistory\(kind: "staff" \| "users"/);
  const actions = read("app/admin/hq/actions.ts");
  assert.match(actions, /if \(formData\.get\("kind"\) === "users"\)/);
  assert.match(read("lib/admin/bot-users-store.ts"), /if \(!sendsBroadcasts\(actor\.role\)\) return \{ ok: false, reason: "forbidden" \}/);
  assert.match(read("app/api/reminders/sweep/route.ts"), /await sendUserBroadcasts\(new Date\(\)\)/);
  const sql = read("supabase/migrations/0162_bot_users.sql");
  assert.match(sql, /alter table public\.bot_users enable row level security;/);
  assert.match(sql, /alter table public\.bot_broadcast_sent enable row level security;/);
});
