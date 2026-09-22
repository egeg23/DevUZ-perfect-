/**
 * Отключённый сотрудник теряет всё, что за него держалось.
 *
 * Владелец: «убедись, что при удалении сотрудника ему перестают падать лиды,
 * убирается доступ к панели и теряются все взаимосвязи».
 *
 * Доступ проверяется в двух местах, и оба должны искать только активных:
 * сессия панели и кнопки бота. Остальное — что висит после: лиды в работе,
 * очередь, переписки, где модель подписывается его именем, напоминания,
 * команда руководителя и карточки лидов в его личке.
 *
 * Запуск: npm test
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { offboardingSummary } from "@/lib/admin/offboarding";

const ROOT = new URL("../", import.meta.url);
const read = (file: string) => readFileSync(new URL(file, ROOT), "utf8");

function body(source: string, signature: string, length = 6000): string {
  const at = source.indexOf(signature);
  assert.ok(at >= 0, `${signature} пропала`);
  return source.slice(at, at + length);
}

test("доступ: сессия и бот видят только активных, сессии сносятся сразу", () => {
  const session = read("lib/admin/session.ts");
  assert.match(body(session, "export async function staffById(", 400), /\.eq\("is_active", true\)/);
  assert.match(body(session, "export async function staffByTelegramId(", 400), /\.eq\("is_active", true\)/);

  const disable = body(read("lib/admin/team.ts"), "export async function disableStaff(", 3000);
  assert.match(disable, /from\("staff_sessions"\)\.delete\(\)/);
  assert.match(disable, /from\("login_tokens"\)\.delete\(\)/);
  // Разрыв связей — после того, как человек отключён: рассылки внутри уже
  // собираются без него.
  assert.ok(
    disable.indexOf("is_active: false") < disable.indexOf("offboardStaff("),
    "связи рвутся до отключения — рассылка вернувшихся лидов дойдёт и до него",
  );
});

test("новые лиды ему не приходят: рассылка и очередь — только активные", () => {
  const brief = read("lib/qualify/brief.ts");
  assert.match(body(brief, "export async function salesRecipients(", 1600), /\.eq\("is_active", true\)/);
  const queue = read("lib/admin/lead-queue-store.ts");
  assert.match(body(queue, "async function queueCandidates(", 1200), /\.eq\("is_active", true\)/);
});

test("всё, что висит на нём, разрывается", () => {
  const off = body(read("lib/admin/offboarding.ts"), "export async function offboardStaff(", 9000);

  // Очередь: его полчаса истекают сейчас и проход передаёт лид дальше.
  assert.match(off, /from\("lead_offers"\)\s*\.update\(\{ expires_at: now \}\)/);
  assert.match(off, /await advanceQueues\(/);

  // Лиды в работе — в очередь заново; закрытые остаются историей.
  assert.match(off, /\.eq\("status", "taken"\)/);
  assert.match(off, /requeueLead\(leadId/);

  assert.match(off, /from\("lead_reminders"\)\s*\.update\(\{ cancelled_at: now \}\)/);
  assert.match(off, /from\("lead_transfers"\)[\s\S]{0,200}status: "declined"/);

  // Касания: неотправленные — в пул, переписки — наследнику.
  assert.match(off, /status: "new", claimed_by: null/);
  assert.match(off, /update\(\{ claimed_by: heir\.id \}\)/);

  // Команда руководителя и карточки в личке.
  assert.match(off, /target\.role === "head"\) out\.team = await detachTeam\(staffId\)/);
  assert.match(off, /withdrawCards\(list\)/);
  assert.match(off, /from\("lead_notices"\)\.delete\(\)\.eq\("chat_id", chat\)/);
});

test("лиды ушедшего идут через очередь, а не кто первый нажал", () => {
  const requeue = body(read("lib/admin/lead-queue-store.ts"), "export async function requeueLead(", 1600);
  // Старое «открыт всем» снимается — иначе проверка взятия пускала бы любого.
  assert.match(requeue, /queue_opened_at: null, fair_share: false/);
  assert.match(requeue, /await startQueue\(/);
});

test("модель не подписывается именем отключённого и не пишет ему", () => {
  const talk = read("lib/admin/outreach-talk-store.ts");
  const lookups = [...talk.matchAll(/\.from\("staff"\)[\s\S]{0,200}?\.maybeSingle\(\)/g)].map((m) => m[0]);
  assert.ok(lookups.length >= 2, "поиск ведущего касания пропал");
  for (const q of lookups) assert.match(q, /\.eq\("is_active", true\)/, "касание находит отключённого ведущего");
});

test("снятый с должности руководитель теряет команду", () => {
  const role = body(read("lib/admin/team.ts"), "export async function setStaffRole(", 3000);
  assert.match(role, /target\.role === "head" && role !== "head" \? await detachTeam\(staffId\)/);
});

test("итог отключения — только то, что было", () => {
  const none = { leads: 0, talks: 0, pool: 0, team: 0, reminders: 0, transfers: 0, cards: 0 };
  assert.equal(offboardingSummary(none), "Незакрытых дел за ним не было.");

  const text = offboardingSummary({ ...none, leads: 2, talks: 1, cards: 14 });
  assert.match(text, /лидов в работе вернулось в очередь — 2/);
  assert.match(text, /переписок из касаний передано — 1/);
  assert.match(text, /карточек лидов убрано из его Telegram — 14/);
  assert.ok(!/напоминаний/.test(text), "в итоге нули");
});

test("страница говорит, что будет, а не старое «переназначьте руками»", () => {
  const page = read("app/admin/team/page.tsx");
  assert.ok(!/останутся закреплены за ним/.test(page), "предупреждение обещает старое поведение");
  assert.match(page, /вернутся в очередь/);
  assert.match(page, /offboardingSummary\(/);
});
