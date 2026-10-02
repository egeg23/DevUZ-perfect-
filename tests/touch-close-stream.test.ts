/**
 * «Клиент отказался» / «Игнорирует», поток «Получать лиды» и объявление
 * команде.
 *
 * Владелец, 29.09: «если лид отказался к примеру, который был в касаниях —
 * сделать кнопку в тг и на сайте — клиент отказался / игнорирует. Чтобы он
 * вылетал из очереди. Сделать кнопку — получать лиды (в тг). Туда будут
 * прилетать компании без ограничений, пока не нажмут кнопку — не получать
 * лиды. Сделай оповещение по руководителям и менеджерам по новым функциям».
 *
 * Запуск: npm test
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import type { Prospect } from "@/lib/admin/outreach-store";
import { visibleProspects } from "@/lib/admin/outreach-view";
import { reportLine, touchesText } from "@/lib/admin/portion";
import { STREAM_BUFFER, STREAM_OFF, STREAM_ON, streamCommand, streamHours, streamNeed, streamWaiting } from "@/lib/admin/stream";
import { NEWS, newsActive, newsWindow } from "@/lib/admin/team-news";
import { CLOSE_REASONS, CLOSE_TEXT, canClose, closeCallback, closesLead, isCloseReason, mayClose } from "@/lib/admin/touch-close";

const read = (file: string) => readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
const between = (text: string, from: string, to?: string) =>
  text.slice(text.indexOf(from), to ? text.indexOf(to, text.indexOf(from) + from.length) : undefined);

/* ── «Клиент отказался» / «Игнорирует» ─────────────────────────────────── */

test("закрыть можно только то, что уже ушло, и только один раз", () => {
  assert.equal(canClose({ status: "sent" }), true);
  assert.equal(canClose({ status: "sent", closed_reason: "refused" }), false);
  for (const status of ["new", "contacting", "sending", "manual", "failed", "skipped"]) {
    assert.equal(canClose({ status }), false, status);
  }
  assert.ok(isCloseReason("refused") && isCloseReason("ignored"));
  assert.equal(isCloseReason("lost"), false);
});

test("закрывает тот, кто касание ведёт, руководитель и владелец", () => {
  const p = { claimed_by: "a", touched_by: "b", handled_by: "c" };
  for (const id of ["a", "b", "c"]) assert.equal(mayClose(p, { id, role: "manager" }), true, id);
  assert.equal(mayClose(p, { id: "x", role: "manager" }), false);
  assert.equal(mayClose(p, { id: "x", role: "head" }), true);
  assert.equal(mayClose(p, { id: "x", role: "admin" }), true);
  assert.equal(mayClose({ claimed_by: null, touched_by: null }, { id: "x", role: "manager" }), false);
});

test("лид закрывается «проиграли», только если он ещё в работе", () => {
  assert.ok(closesLead("taken") && closesLead("new"));
  for (const status of ["won", "lost", "dropped", null, undefined]) assert.equal(closesLead(status), false);
});

test("кнопки в боте: текст как в панели, callback влезает в 64 байта", () => {
  const id = "123e4567-e89b-12d3-a456-426614174000";
  for (const reason of CLOSE_REASONS) {
    assert.ok(Buffer.byteLength(closeCallback(reason, id)) <= 64);
    assert.match(closeCallback(reason, id), /^tc:(refused|ignored):/);
  }
  assert.equal(CLOSE_TEXT.refused.button, "🙅 Клиент отказался");
  assert.equal(CLOSE_TEXT.ignored.button, "🔇 Игнорирует");
});

test("закрытое касание уходит из «в работе», свежее незакрытое — остаётся", () => {
  const now = new Date("2026-09-29T09:00:00Z");
  const sent = (id: string, closed: Prospect["closed_reason"]) =>
    ({ id, status: "sent", sent_at: "2026-09-28T09:00:00Z", created_at: "2026-09-01T00:00:00Z", closed_reason: closed }) as Prospect;
  const view = visibleProspects([sent("open", null), sent("refused", "refused"), sent("ignored", "ignored")], {
    keep: new Set(),
    more: 20,
    now,
  });
  // Все три видны (остальных меньше двадцати), но в работе — только открытое:
  // закрытые попали в «остальные» и пагинируются как старые.
  assert.equal(view.shown.length, 3);
  const onlyPinned = visibleProspects([sent("open", null), sent("refused", "refused")], { keep: new Set(), more: 20, now });
  assert.equal(onlyPinned.hidden, 0);
  const tight = visibleProspects(
    [sent("open", null), ...Array.from({ length: 20 }, (_, i) => ({ ...sent(`n${i}`, null), status: "new" }) as Prospect), sent("refused", "refused")],
    { keep: new Set(), more: 20, now },
  );
  assert.ok(tight.shown.some((r) => r.id === "open"));
  assert.ok(!tight.shown.some((r) => r.id === "refused"), "закрытое касание всё ещё закреплено в работе");
});

test("closeTouch: условно по статусу, гасит очередь, закрывает лид, пишет журнал", () => {
  const store = read("lib/admin/outreach-store.ts");
  const close = between(store, "export async function closeTouch(");
  assert.match(close, /if \(!mayClose\(who, staff\)\)/);
  assert.match(close, /ai_handling: false/);
  assert.match(close, /\.eq\("status", "sent"\)\s*\.is\("closed_reason", null\)/);
  // Поставленный дожим или ответ модели после «не пишите» не уходит.
  assert.match(close, /from\("outreach_messages"\)[\s\S]{0,200}\.eq\("direction", "out"\)\s*\.eq\("status", "queued"\)/);
  assert.match(close, /closesLead\(lead\?\.status[\s\S]{0,120}setStatus\(leadId, "lost", staff, ip, via\)/);
  assert.match(close, /record\("prospect\.closed"/);
  // Статус касания не трогается — написали на самом деле.
  assert.doesNotMatch(close, /from\("prospects"\)\s*\.update\(\{[^}]*\bstatus:/);
  // Дожим и так не идёт без ai_handling — проверка в самом отборе.
  assert.match(read("lib/admin/outreach-followup.ts"), /\.eq\("ai_handling", true\)/);
});

test("панель: кнопки у отправленных, действие с проверкой причины", () => {
  const list = read("components/admin/outreach-list.tsx");
  assert.match(list, /row\.status === "sent" && viewer && mayClose\(row, viewer\)/);
  assert.match(list, /<form action=\{closeTouchAction\}/);
  assert.match(list, /helpAnchor\("\/admin\/prospect", "close"\)/);
  assert.match(read("app/admin/prospect/page.tsx"), /viewer=\{staff\}/);
  const actions = read("app/admin/prospect/actions.ts");
  const action = between(actions, "export async function closeTouchAction(", "export async function skipProspectAction(");
  assert.match(action, /await requireStaff\(\)/);
  assert.match(action, /isCloseReason\(reason\)/);
  assert.match(action, /closeTouch\(id, reason, staff, await requestIp\(\), "panel"\)/);
});

test("бот: закрыть — только в личке, под карточкой после касания и под ответом клиента", () => {
  const hook = read("app/api/telegram/webhook/route.ts");
  assert.match(hook, /parts\[0\] === "tc" \|\| parts\[0\] === "ls"\) \{\s*if \(chatId === undefined \|\| chatId !== query\.from\?\.id\)/);
  const handler = between(hook, "async function handleCloseButton(");
  assert.match(handler, /closeTouch\(prospectId, reason, staff, "", "telegram"\)/);
  // После «Отправить» и «Написал сам» кнопки не гаснут, а меняются на «Отказался» / «Игнорирует».
  const portion = between(hook, "async function handlePortionButton(", "async function handleCloseButton(");
  assert.match(portion, /setButtons\(query\.message\.chat\.id, query\.message\.message_id, closeRows\(prospectId, label\)\)/);
  assert.match(portion, /await touched\("📤 В очереди бота"\)/);
  assert.match(portion, /await touched\("✋ Отмечено: написал сам"\)/);
  // Под «Клиент написал» — «Клиент отказался».
  const talk = read("lib/admin/outreach-talk-store.ts");
  assert.match(talk, /if \(options\.refuse && canClose\(/);
  assert.equal((talk.match(/\{ refuse: true \}|refuse: true,/g) ?? []).length, 2);
});

/* ── Поток «Получать лиды» ─────────────────────────────────────────────── */

test("кнопка внизу чата и /leads — в любом написании", () => {
  assert.equal(streamCommand(STREAM_ON), "on");
  assert.equal(streamCommand(STREAM_OFF), "off");
  assert.equal(streamCommand("Получать лиды"), "on");
  assert.equal(streamCommand("не получать лиды "), "off");
  assert.equal(streamCommand("/leads"), "toggle");
  assert.equal(streamCommand("/Leads@Devuz_studio_bot"), "toggle");
  for (const text of ["", "получать", "хочу получать лиды", "/leadsx", "/login", null, undefined]) {
    assert.equal(streamCommand(text), null, String(text));
  }
});

test("поток — по будням с 9 до 18 по Ташкенту, до трёх неразобранных", () => {
  // 29.09.2026 — вторник; Ташкент = UTC+5.
  assert.equal(streamHours(new Date("2026-09-29T03:59:00Z")), false); // 08:59
  assert.equal(streamHours(new Date("2026-09-29T04:00:00Z")), true); // 09:00
  assert.equal(streamHours(new Date("2026-09-29T12:59:00Z")), true); // 17:59
  assert.equal(streamHours(new Date("2026-09-29T13:00:00Z")), false); // 18:00
  assert.equal(streamHours(new Date("2026-10-03T06:00:00Z")), false); // суббота
  assert.equal(STREAM_BUFFER, 3);
  assert.deepEqual([0, 1, 2, 3, 5].map(streamNeed), [3, 2, 1, 0, 0]);
});

test("место в потоке держит только нетронутая компания этого человека", () => {
  const day = "2026-09-29";
  const base = { status: "new", touched_by: null, touched_at: null, claimed_by: null };
  assert.equal(streamWaiting(base, "me", day), true);
  assert.equal(streamWaiting({ ...base, status: "contacting", claimed_by: "me" }, "me", day), true);
  // Забрал другой — место освобождается, иначе поток встал бы до вечера.
  assert.equal(streamWaiting({ ...base, status: "contacting", claimed_by: "other" }, "me", day), false);
  assert.equal(streamWaiting({ ...base, status: "skipped" }, "me", day), false);
  assert.equal(
    streamWaiting({ status: "sent", touched_by: "me", touched_at: "2026-09-29T05:00:00Z", claimed_by: "me" }, "me", day),
    false,
  );
  assert.equal(streamWaiting({ ...base, status: "sending", claimed_by: "me" }, "me", day), false);
});

test("отчёт: поток — хвостом, в «из» не входит", () => {
  assert.equal(touchesText(1), "1 касание");
  assert.equal(touchesText(4), "4 касания");
  assert.equal(touchesText(11), "11 касаний");
  assert.equal(touchesText(22), "22 касания");
  assert.equal(
    reportLine({ name: "Данил", target: 5, done: 3, skipped: 0, short: 0, stream: 4, touches: 7 }),
    "Данил — 7 касаний (поток 4) · порция 3 из 5",
  );
  assert.equal(reportLine({ name: "Мадина", target: 5, done: 5, skipped: 0, short: 0, touches: 5 }), "Мадина — 5 касаний · порция 5 из 5 ✅");
  assert.equal(
    reportLine({ name: "Алексей", target: 0, done: 0, skipped: 0, short: 0, stream: 2, touches: 2 }),
    "Алексей — 2 касания (поток 2) · порции не было",
  );
});

test("порция считает только свои строки, поток — только свои", () => {
  const store = read("lib/admin/portion-store.ts");
  const deliver = between(store, "export async function deliverPortions(", "export type TopUp");
  assert.match(deliver, /r\.source === "portion"/);
  const top = between(store, "export async function topUpPortion(", "export async function topUpPortions(");
  assert.match(top, /r\.staff_id === staffId && !r\.closed && r\.source === "portion"/);
  // Исключение из пула — по всем сегодняшним строкам, и порции, и потока.
  assert.match(top, /pool\(due \+ 3, new Set\(everyone\.map\(\(r\) => r\.prospect_id\)\)\)/);
  const tops = between(store, "export async function topUpPortions(", "export async function deliverReplacement(");
  assert.match(tops, /r\.source === "portion"/);
  const report = between(store, "export async function reportPortions(");
  assert.match(report, /if \(row\.source === "stream"\)/);
  // Вечерний возврат в пул — для всех строк, поток тоже.
  assert.ok(report.indexOf('update({ status: "new", claimed_by: null, claimed_at: null, message: null })') > 0);

  const stream = read("lib/admin/stream-store.ts");
  assert.match(stream, /insert\(\{ day, staff_id: staffId, prospect_id: prospectId, source: "stream" \}\)/);
  // Замок подачи: кнопка и свип не наливают одновременно.
  assert.match(stream, /\.or\(`feeding_at\.is\.null,feeding_at\.lt\."\$\{stale\}"`\)/);
  assert.match(stream, /update\(\{ feeding_at: null \}\)/);
  // Сначала утренняя порция.
  assert.match(stream, /r\.source === "portion" && !r\.replaces && !r\.delivered_at/);
  // Строки потока некому вернуть в пул, если вечер уже подведён.
  assert.match(stream, /if \(!mark\?\.assigned_at \|\| mark\.reported_at\) return 0;/);
  // Только тем, кто получает порцию.
  assert.match(stream, /if \(!inQueue\(staff\.role\)\) return \{ ok: false, why: "role" \}/);
});

test("бот: кнопка потока — до клиентского разговора, «Не подходит» в потоке без замены", () => {
  const hook = read("app/api/telegram/webhook/route.ts");
  const route = between(hook, "async function route(", "function identityOf(");
  assert.ok(route.indexOf("streamCommand(update.message.text)") < route.indexOf("await handleClient(update.message)"));
  const command = between(hook, "async function handleStreamCommand(", "async function handleClient(");
  // Не сотрудник — сообщение идёт в обычный разговор.
  assert.match(command, /if \(!command \|\| !staff\) return false;/);
  assert.match(command, /if \(on\) await feedStream\(staff\.id\)/);
  const portion = between(hook, "async function handlePortionButton(", "async function handleCloseButton(");
  const streamSkip = between(portion, 'if (action === "skip" && source === "stream")', 'if (action === "skip") {');
  assert.match(streamSkip, /await feedStream\(staff\.id\)/);
  assert.doesNotMatch(streamSkip, /topUpPortion/);

  const sweep = read("app/api/reminders/sweep/route.ts");
  assert.match(sweep, /after\(async \(\) => \{[\s\S]{0,1200}await feedStreams\(new Date\(\)\)/);
  assert.match(sweep, /after\(async \(\) => \{\s*await sendTeamNews\(new Date\(\)\)/);

  const menu = read("lib/qualify/menu.ts");
  assert.match(menu, /command: "leads"/);
  assert.match(menu, /inQueue\(row\.role as Role\) \? QUEUE_EXTRA : \[\]/);

  assert.match(read("lib/admin/offboarding.ts"), /from\("lead_streams"\)\.delete\(\)\.eq\("staff_id", staffId\)/);
});

test("миграция: поля закрытия, источник строки, поток и отметки объявлений", () => {
  const sql = read("supabase/migrations/0068_touch_close_stream.sql");
  assert.match(sql, /closed_reason text check \(closed_reason in \('refused', 'ignored'\)\)/);
  assert.match(sql, /closed_by uuid references public\.staff\(id\) on delete set null/);
  assert.match(sql, /source text not null default 'portion' check \(source in \('portion', 'stream'\)\)/);
  assert.match(sql, /create table if not exists public\.lead_streams/);
  assert.match(sql, /primary key \(news_id, staff_id\)/);
  assert.equal((sql.match(/enable row level security/g) ?? []).length, 2);
});

/* ── Объявление команде ────────────────────────────────────────────────── */

test("объявление: руководителям и менеджерам, в рабочее время, пока свежее", () => {
  const news = NEWS.find((n) => n.id === "2026-09-29-touches");
  assert.ok(news);
  assert.deepEqual([...news.roles].sort(), ["head", "manager"]);
  assert.equal(news.streamKey, true);
  assert.equal(newsActive(news, new Date("2026-09-29T10:00:00Z")), true);
  assert.equal(newsActive(news, new Date("2026-10-03T00:00:00Z")), false);
  // 29.09 14:00 по Ташкенту — да; 20:00 — нет; суббота — нет.
  assert.equal(newsWindow(new Date("2026-09-29T09:00:00Z")), true);
  assert.equal(newsWindow(new Date("2026-09-29T15:00:00Z")), false);
  assert.equal(newsWindow(new Date("2026-10-03T06:00:00Z")), false);
});

test("объявление: у каждого — своё, и всё про новые кнопки", async () => {
  const news = NEWS[0];
  const manager = (await news.text("manager")) ?? "";
  const head = (await news.text("head")) ?? "";
  for (const text of [manager, head]) {
    assert.ok(text.length < 4096, "Telegram не примет сообщение длиннее 4096");
    assert.match(text, /«🙅 Клиент отказался» и «🔇 Игнорирует»/);
    assert.match(text, /«▶️ Получать лиды»/);
    assert.match(text, /«⏸ Не получать лиды»/);
    assert.match(text, /5 именно касаний/);
    assert.match(text, /«Показать ещё 20»/);
    // Разметка — только то, что понимает Telegram.
    assert.doesNotMatch(text.replace(/<\/?(b|i)>/g, ""), /[<>]/);
  }
  // Руководителю — про отчёт и передачу, менеджеру — нет.
  assert.match(head, /Вечерний отчёт по порциям/);
  assert.match(head, /передаче лида/);
  assert.doesNotMatch(manager, /Вечерний отчёт по порциям|галочки|«Трафик»/);

  const store = read("lib/admin/team-news.ts");
  // Отметка — до сообщения и условно; не дошло — снимается.
  assert.match(store, /onConflict: "news_id,staff_id", ignoreDuplicates: true/);
  assert.match(store, /else \{\s*await db\.from\("team_news_sent"\)\.delete\(\)/);
  assert.match(store, /sendKeyboard\(reader\.chat, text, \[\[STREAM_ON\]\]\)/);
});
