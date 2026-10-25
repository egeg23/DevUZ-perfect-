/**
 * Лента карточки лида (lib/admin/lead-timeline.ts, components/admin/lead-timeline.tsx).
 *
 * Владелец, 25.10.2026, на разбор «чем мы уступаем Kommo и Pipedrive»:
 * «Погнали по порядку». Вместо «Первички по касанию», «Переписки с
 * клиентом» и «Обсуждения» — одна лента по времени и одно поле ответа.
 *
 * Запуск: npm test
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { buildTimeline, channelsOf, reminderEvents, stageEvents, withTouch } from "@/lib/admin/lead-timeline";
import type { TalkLine } from "@/lib/admin/outreach-talk-store";

const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const line = (id: string, at: string, direction: "in" | "out" = "in"): TalkLine => ({
  id,
  direction,
  author: "ai",
  body: id,
  created_at: at,
  status: "sent",
  failure: null,
});

test("лента — по времени, старое сверху: пришёл лид, переписка, заметка, ступень, напоминание", () => {
  const items = buildTimeline({
    created: "2026-10-20T08:00:00Z",
    touch: [line("t2", "2026-10-20T09:05:00Z", "out"), line("t1", "2026-10-20T09:00:00Z")],
    notes: [{ id: "n1", at: "2026-10-20T10:00:00Z", author: "Дина", admin: false, own: true, body: "созвон в пятницу", edited: false }],
    events: [
      ...stageEvents({ own: { shown: { at: "2026-10-21T07:00:00Z", by: "s-1" }, replied: { at: "2026-10-20T09:00:00Z", by: null } } }),
      ...reminderEvents([{ id: "r1", due_at: "2026-10-22T05:00:00Z", note: "перезвонить", done_at: null }]),
    ],
  });
  assert.deepEqual(
    items.map((i) => i.id),
    ["created", "touch:t1", "touch:t2", "note:n1", "stage:shown", "reminder:r1"],
  );
  // «Ответил» — сама реплика клиента: второй строкой в ленте не повторяется.
  assert.ok(!items.some((i) => i.id === "stage:replied"));
});

test("свежая переписка касания заменяет старую, остальное на месте", () => {
  const before = buildTimeline({
    created: "2026-10-20T08:00:00Z",
    touch: [line("t1", "2026-10-20T09:00:00Z")],
    notes: [{ id: "n1", at: "2026-10-20T10:00:00Z", author: "Дина", admin: false, own: false, body: "x", edited: false }],
  });
  const after = withTouch(before, [line("t1", "2026-10-20T09:00:00Z"), line("t3", "2026-10-20T11:00:00Z", "in")]);
  assert.deepEqual(after.map((i) => i.id), ["created", "touch:t1", "note:n1", "touch:t3"]);
});

test("куда уйдёт ответ: клиенту — первым, если есть чем; заметка команде — всегда", () => {
  assert.deepEqual(channelsOf({ touch: true, bot: true }), ["touch", "bot", "note"]);
  assert.deepEqual(channelsOf({ touch: false, bot: true }), ["bot", "note"]);
  assert.deepEqual(channelsOf({ touch: false, bot: false }), ["note"]);
});

test("карточка: одна лента вместо трёх блоков, права — как у каждого из них", () => {
  const page = read("app/admin/leads/[id]/page.tsx");
  assert.doesNotMatch(page, /<TalkChat|<LeadThread|<details id="botwrite"/, "старые блоки остались");
  // Переписка касания и напоминания — тому, за кем лид; заметки и ступени — всем.
  assert.match(page, /const talkMine = talk && mine \? talk : null;/);
  assert.match(page, /\.\.\.\(mine \? reminderEvents\(reminders\) : \[\]\)/);
  // Переписка из чата — по кнопке, с журналом, как раньше.
  assert.match(page, /<form action=\{revealTranscriptAction\}>/);
  // Старые ссылки ведут в ленту.
  for (const id of ["talk", "transcript", "thread", "botwrite"]) assert.match(page, new RegExp(`id="${id}"`), id);
  // Одно действие на все каналы, проверки — прежние.
  const actions = read("app/admin/leads/[id]/actions.ts");
  const send = actions.slice(actions.indexOf("export async function sendFromCardAction("));
  assert.match(send, /return replyInTalkAction\(leadId, prospectId, body\);/);
  assert.match(send, /if \(!canReveal\(lead, staff\)\) return \{ ok: false, reason: "forbidden" \}/);
  assert.match(send, /await postMessage\(leadId, staff,/);
  // Лимит поля — по каналу: бот режет до BOT_WRITE_MAX, не 4000.
  assert.match(page, /limits=\{\{ touch: STAFF_REPLY_MAX, bot: BOT_WRITE_MAX, note: MAX_BODY \}\}/);
  assert.match(read("components/admin/lead-timeline.tsx"), /maxLength=\{limits\[channel\]\}/);
});
