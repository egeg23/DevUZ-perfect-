import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import {
  BROADCAST_MAX,
  audienceFrom,
  broadcastKey,
  broadcastMessage,
  canCancel,
  reachable,
  recipientsOf,
  sendAtFrom,
  sendableNow,
  sendsBroadcasts,
  statusOf,
  textProblem,
  type BroadcastPerson,
} from "@/lib/admin/broadcast";

/**
 * Рассылка в бот команде с «Главной». Владелец, 13.10.2026: «запустить
 * рассылку в бот с нашего сервиса для всех (понадобится, чтобы руководитель
 * оповещал через бот о созвонах)». И быстрая задача — тем же createTasks.
 */

const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");

const people: BroadcastPerson[] = [
  { id: "a", display_name: "Егор", role: "admin", telegram: true },
  { id: "h", display_name: "Александр", role: "head", telegram: true },
  { id: "m1", display_name: "Данил", role: "manager", telegram: true },
  { id: "m2", display_name: "Камила", role: "manager", telegram: false },
];

// 14.10.2026, 15:00 по Ташкенту; 02:00 — ночь.
const DAY = new Date("2026-10-14T10:00:00Z");
const NIGHT = new Date("2026-10-13T21:00:00Z");

test("рассылают владелец и руководитель — по роли, не по галочке", () => {
  assert.ok(sendsBroadcasts("admin"));
  assert.ok(sendsBroadcasts("head"));
  assert.ok(!sendsBroadcasts("manager"));
  const actions = read("app/admin/hq/actions.ts");
  assert.match(actions, /export async function broadcastAction[\s\S]*?!sendsBroadcasts\(staff\.role\)\) return \{ ok: false, error: "forbidden"/);
  assert.match(actions, /export async function cancelBroadcastAction[\s\S]*?!sendsBroadcasts\(staff\.role\)\) return;/);
  assert.match(read("lib/admin/broadcast-store.ts"), /if \(!sendsBroadcasts\(actor\.role\)\) return \{ ok: false, reason: "forbidden" \}/);
});

test("кому: все, по ролям, выбранные; автору — не приходит; без Telegram — видно, но не уходит", () => {
  const all = recipientsOf({ kind: "all" }, people, "h");
  assert.deepEqual(
    all.map((p) => p.id),
    ["a", "m1", "m2"],
  );
  assert.deepEqual(
    reachable(all).map((p) => p.id),
    ["a", "m1"],
  );
  assert.deepEqual(
    recipientsOf({ kind: "roles", roles: ["manager"] }, people, "a").map((p) => p.id),
    ["m1", "m2"],
  );
  assert.deepEqual(
    recipientsOf({ kind: "pick", ids: ["m1", "h"] }, people, "h").map((p) => p.id),
    ["m1"],
  );
  assert.deepEqual(audienceFrom("roles", ["manager", "hacker"], []), { kind: "roles", roles: ["manager"] });
  assert.equal(audienceFrom("roles", [], []), null);
  assert.equal(audienceFrom("pick", [], ["../x"]), null);
  assert.equal(audienceFrom("everyone", [], []), null);
});

test("текст экранируется (HTML Telegram), ссылки остаются текстом-ссылкой", () => {
  const msg = broadcastMessage("Алекс <b>", "Созвон в 15:00 <script>&\nhttps://meet.google.com/abc-defg");
  assert.equal(msg, "📣 <b>Алекс &lt;b&gt;</b>\n\nСозвон в 15:00 &lt;script&gt;&amp;\nhttps://meet.google.com/abc-defg");
  assert.equal(textProblem("   "), "empty");
  assert.equal(textProblem("x".repeat(BROADCAST_MAX + 1)), "long");
  assert.equal(textProblem("ок"), null);
});

test("ночь: с 23:00 до 07:00 по Ташкенту не шлём без галочки «отправить и ночью»", () => {
  assert.ok(sendableNow(DAY, false));
  assert.ok(!sendableNow(NIGHT, false));
  assert.ok(sendableNow(NIGHT, true));
  assert.equal(statusOf({ send_at: NIGHT.toISOString(), night_ok: false, cancelled_at: null, done_at: null }, NIGHT), "night");
  assert.equal(statusOf({ send_at: NIGHT.toISOString(), night_ok: true, cancelled_at: null, done_at: null }, NIGHT), "sending");
});

test("время: «сейчас» или по Ташкенту из формы, не в прошлом и не дальше недели", () => {
  assert.equal(sendAtFrom("now", "", DAY), DAY);
  const at = sendAtFrom("at", "2026-10-14T14:50", new Date("2026-10-14T09:00:00Z"));
  assert.ok(at instanceof Date);
  assert.equal((at as Date).toISOString(), "2026-10-14T09:50:00.000Z", "14:50 по Ташкенту — 09:50 UTC");
  assert.equal(sendAtFrom("at", "2026-10-14T14:00", DAY), "past");
  assert.equal(sendAtFrom("at", "2026-10-30T14:00", DAY), "far");
  assert.equal(sendAtFrom("at", "завтра", DAY), "bad");
});

test("статус и отмена: пока никому не ушло — автор или владелец", () => {
  const b = { author_id: "h", send_at: new Date(DAY.getTime() + 3600_000).toISOString(), night_ok: false, cancelled_at: null, done_at: null };
  assert.equal(statusOf(b, DAY), "scheduled");
  assert.ok(canCancel(b, 0, { id: "h", role: "head" }, DAY));
  assert.ok(canCancel(b, 0, { id: "a", role: "admin" }, DAY));
  assert.ok(!canCancel(b, 0, { id: "h2", role: "head" }, DAY), "чужую — только владелец");
  assert.ok(!canCancel(b, 1, { id: "h", role: "head" }, DAY), "кому-то уже ушло");
  assert.ok(!canCancel({ ...b, done_at: DAY.toISOString() }, 0, { id: "a", role: "admin" }, DAY));
  assert.equal(statusOf({ ...b, cancelled_at: DAY.toISOString() }, DAY), "cancelled");
});

test("доставка: отметка до сообщения, каждому один раз; не дошло — отметка снимается; сутки — сдаёмся", () => {
  const store = read("lib/admin/broadcast-store.ts");
  assert.equal(broadcastKey("x"), "broadcast:x");
  const send = store.slice(store.indexOf("export async function sendBroadcasts"));
  const claim = send.indexOf('.upsert({ news_id: key, staff_id: id }, { onConflict: "news_id,staff_id", ignoreDuplicates: true })');
  const message = send.indexOf("await sendMessage(chat, text)");
  assert.ok(claim > 0 && message > claim, "сначала отметка, потом сообщение");
  assert.match(send, /if \(!claimed\?\.length\) continue;/);
  assert.match(send, /else \{\s*failed \+= 1;\s*await db\.from\("team_news_sent"\)\.delete\(\)\.eq\("news_id", key\)\.eq\("staff_id", id\);/);
  assert.match(send, /if \(already\.has\(id\)\) continue;/);
  assert.match(send, /if \(!sendableNow\(now, b\.night_ok\)\) continue;/);
  assert.match(send, /GIVE_UP_H \* 3600_000/);
  assert.match(read("app/api/reminders/sweep/route.ts"), /await sendBroadcasts\(new Date\(\)\)/);
  // Получатели замораживаются при отправке, а число из предпросмотра сверяется.
  assert.match(store, /if \(reach\.length !== input\.expected\) return \{ ok: false, reason: "changed" \}/);
  assert.match(store, /recipients: reach\.map\(\(p\) => p\.id\)/);
  // Запись в журнал.
  assert.match(store, /await record\("broadcast\.created"/);
  assert.match(store, /await record\("broadcast\.cancelled"/);
});

test("таблица — миграцией с RLS", () => {
  const sql = read("supabase/migrations/0161_staff_broadcasts.sql");
  assert.match(sql, /create table if not exists public\.staff_broadcasts/);
  assert.match(sql, /alter table public\.staff_broadcasts enable row level security;/);
  assert.match(read("supabase/migrations/0161_staff_broadcasts.down.sql"), /drop table if exists public\.staff_broadcasts;/);
});

test("быстрая задача — тем же createTasks, бот пишет исполнителю, ночью — утром", () => {
  const actions = read("app/admin/hq/actions.ts");
  assert.match(actions, /const result = await createTasks\(/);
  assert.match(actions, /if \(others\.length && day\)/);
  assert.match(actions, /deliverAssignment\(task\.id\)/);
  assert.match(actions, /if \(!staff \|\| !opens\(staff, HREF\)\) return \{ ok: false, error: "forbidden", at \};/);
  // Кнопка «Поставить задачу» в карточке человека отмечает его в форме.
  assert.match(read("app/admin/hq/page.tsx"), /personTaskHref=\{\(id\) => `\/admin\/hq\?to=\$\{id\}#task`\}/);
  assert.match(read("components/admin/hq-task.tsx"), /defaultChecked=\{p\.id === preselect\}/);
});
