import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import {
  OFFER_MINUTES,
  QUEUE_ROLES,
  clock,
  mayTake,
  missedNotice,
  monthStartOf,
  offerHeading,
  pickNext,
  watchHeading,
  type Candidate,
} from "@/lib/admin/lead-queue";

const ROOT = new URL("../", import.meta.url);
const read = (file: string) => readFileSync(new URL(file, ROOT), "utf8");

/**
 * Честная очередь на тёплые лиды.
 *
 * Владелец: «есть ушлый менеджер, который всех лидов берёт на себя, а в
 * холодную не работает вообще». Лид доставался тому, кто быстрее нажал.
 * Теперь он предлагается одному — у кого за месяц меньше всех, — на
 * полчаса; не взял — следующему; круг пройден — открыт всем.
 */

const c = (id: string, taken: number, missed = 0, lastOfferAt: string | null = null): Candidate => ({
  id,
  taken,
  missed,
  lastOfferAt,
});

test("лид достаётся тому, у кого меньше всех", () => {
  const next = pickNext([c("ушлый", 12), c("азиз", 3), c("дина", 5)], new Set());
  assert.equal(next?.id, "азиз");
});

test("пропущенное предложение считается полученным шансом", () => {
  // Кто не берёт ничего — в отпуске, болеет, не смотрит в телефон, —
  // навсегда оставался бы с наименьшим числом и получал каждый лид первым.
  // Каждый лид ждал бы его полчаса, прежде чем дойти до того, кто работает.
  const next = pickNext([c("в отпуске", 0, 6), c("работает", 4)], new Set());
  assert.equal(next?.id, "работает");
});

test("при равенстве — тот, кому дольше не предлагали", () => {
  const next = pickNext(
    [
      c("вчера", 2, 0, "2026-09-21T10:00:00Z"),
      c("неделю назад", 2, 0, "2026-09-15T10:00:00Z"),
      c("ни разу", 2, 0, null),
    ],
    new Set(),
  );
  assert.equal(next?.id, "ни разу");

  // Иначе двое с одинаковым счётом решались бы в пользу одного и того же.
  const again = pickNext([c("вчера", 2, 0, "2026-09-21T10:00:00Z"), c("неделю назад", 2, 0, "2026-09-15T10:00:00Z")], new Set());
  assert.equal(again?.id, "неделю назад");
});

test("второй раз за круг лид тому же не предлагают", () => {
  const all = [c("азиз", 1), c("дина", 2), c("ушлый", 9)];
  assert.equal(pickNext(all, new Set(["азиз"]))?.id, "дина");
  assert.equal(pickNext(all, new Set(["азиз", "дина"]))?.id, "ушлый");
  // Круг пройден — предлагать некому, лид открывается всем.
  assert.equal(pickNext(all, new Set(["азиз", "дина", "ушлый"])), null);
});

const NOW = new Date("2026-09-22T10:00:00Z");
const LIVE = "2026-09-22T10:20:00Z";
const GONE = "2026-09-22T09:55:00Z";

test("в свои полчаса лид берёт только тот, кому он предложен", () => {
  const offers = [{ staffId: "азиз", expiresAt: LIVE, outcome: null }];
  const base = { offers, openedAt: null, now: NOW };

  assert.deepEqual(mayTake({ ...base, role: "manager", staffId: "азиз" }), { ok: true });

  const other = mayTake({ ...base, role: "manager", staffId: "ушлый" });
  assert.equal(other.ok, false);
  // Руководитель стоит в очереди наравне со всеми — вне её только владелец.
  assert.equal(mayTake({ ...base, role: "head", staffId: "рук" }).ok, false);
  assert.deepEqual(mayTake({ ...base, role: "admin", staffId: "владелец" }), { ok: true });
});

test("вышло время — шанс упущен, даже если свип ещё не передал лид", () => {
  // До пяти минут между проходами свипа. Отдать лид в эти минуты тому, кто
  // первым нажмёт, значило бы вернуть то, от чего очередь и строилась.
  const offers = [{ staffId: "азиз", expiresAt: GONE, outcome: null }];
  assert.equal(mayTake({ role: "manager", staffId: "азиз", offers, openedAt: null, now: NOW }).ok, false);
  assert.equal(mayTake({ role: "manager", staffId: "ушлый", offers, openedAt: null, now: NOW }).ok, false);
});

test("между предложениями лид не бесхозный", () => {
  // Предыдущее закрыто, следующее ещё не выдано: действующего нет, но лид
  // в очереди — и взять его в эту щель не может никто, кроме владельца.
  const offers = [{ staffId: "азиз", expiresAt: GONE, outcome: "expired" }];
  assert.equal(mayTake({ role: "manager", staffId: "ушлый", offers, openedAt: null, now: NOW }).ok, false);
});

test("лид вне очереди и открытый лид берёт любой", () => {
  // Пришёл до очереди или очередь некому было вести — открыт, как раньше.
  assert.deepEqual(mayTake({ role: "manager", staffId: "ушлый", offers: [], openedAt: null, now: NOW }), { ok: true });
  // Круг пройден.
  const offers = [{ staffId: "азиз", expiresAt: GONE, outcome: "expired" }];
  assert.deepEqual(mayTake({ role: "manager", staffId: "ушлый", offers, openedAt: GONE, now: NOW }), { ok: true });
});

test("месяц и часы — по Ташкенту", () => {
  // 1 сентября, полночь по Ташкенту — это 19:00 UTC тридцать первого.
  assert.equal(monthStartOf(new Date("2026-09-22T10:00:00Z")).toISOString(), "2026-08-31T19:00:00.000Z");
  // Лид, пришедший в первые пять часов месяца по Ташкенту, — уже новый месяц.
  assert.equal(monthStartOf(new Date("2026-09-30T20:00:00Z")).toISOString(), "2026-09-30T19:00:00.000Z");

  assert.equal(clock("2026-09-22T09:35:00Z"), "14:35");
});

test("шапки говорят срок и не ломают разметку", () => {
  assert.match(offerHeading("2026-09-22T09:35:00Z"), new RegExp(`${OFFER_MINUTES} минут — до 14:35`));
  // Имя и название уходят в HTML: угловая скобка в них заставила бы
  // Telegram отклонить сообщение целиком — и лид не дошёл бы вовсе.
  assert.ok(watchHeading("<b>Азиз", "2026-09-22T09:35:00Z").includes("&lt;b&gt;Азиз"));
  assert.ok(missedNotice("ООО <Ромашка>").includes("&lt;Ромашка&gt;"));
});

test("в очереди менеджеры и руководитель, владелец — вне её", () => {
  assert.deepEqual([...QUEUE_ROLES].sort(), ["head", "manager"]);
});

test("взять вне очереди нельзя ни из бота, ни из панели", () => {
  const ownership = read("lib/admin/ownership.ts");
  const take = ownership.slice(ownership.indexOf("export async function takeLead"));
  // Проверка стоит до записи: запрет, живущий в одной кнопке, обходился бы
  // другой, а проверка после записи уже ничего не запрещает.
  const check = take.indexOf("mayTake(");
  const write = take.indexOf(".update({");
  assert.ok(check > 0 && check < write, "лид берут до проверки очереди");
  assert.match(take, /if \(!verdict\.ok\) return \{ ok: false, reason: "queued" \}/);
  // Взятый лид свип не должен «передать дальше» через полчаса.
  assert.match(take, /await closeOfferAfterTake\(leadId, staff\.id\)/);

  // Отпущенный и возвращённый в новые лид открыт — иначе в очереди без
  // действующего предложения его не взял бы никто.
  assert.match(ownership.slice(ownership.indexOf("export async function releaseLead")), /await openQueue\(leadId\)/);
  assert.match(ownership, /if \(status === "new"\) await openQueue\(leadId\)/);

  assert.match(read("app/api/telegram/webhook/route.ts"), /taken\.reason === "queued"/);
  assert.match(read("app/admin/leads/[id]/page.tsx"), /queued: "Не ваша очередь/);
});

test("очередь на всех входах, крупный заказ — мимо неё", () => {
  // Разные пути для одного лида — это ровно то, через что лиды и уходили
  // тому, кто быстрее: через вход, где очереди почему-то не оказалось.
  for (const file of ["lib/qualify/engine.ts", "app/api/lead/route.ts", "app/api/brief/route.ts"]) {
    assert.match(read(file), /routeNewLead\(/, `${file} рассылает лид мимо очереди`);
  }
  assert.match(read("lib/qualify/engine.ts"), /route\.ownerOnly\s*\n?\s*\? await sendLead/);
  assert.match(read("app/api/brief/route.ts"), /route\.ownerOnly\s*\n?\s*\? sendLead/);
});

test("свип передаёт лиды раньше тяжёлых смен и без двойной передачи", () => {
  const sweep = read("app/api/reminders/sweep/route.ts");
  const queue = sweep.indexOf("await advanceQueues(");
  assert.ok(queue > 0, "свип не ведёт очередь");
  for (const heavy of ["await runRazborShift(", "await runTalks(", "await sweepOrders("]) {
    assert.ok(queue < sweep.indexOf(heavy), `очередь идёт после ${heavy}`);
  }

  // Предложение закрывается условным обновлением до всего остального: два
  // прохода свипа не передадут один лид дважды.
  const store = read("lib/admin/lead-queue-store.ts");
  const advance = store.slice(store.indexOf("export async function advanceQueues"));
  assert.match(advance, /outcome: "expired"[\s\S]{0,120}\.is\("outcome", null\)/);
  assert.ok(advance.indexOf('outcome: "expired"') < advance.indexOf("missedNotice("));

  const migration = read("supabase/migrations/0045_lead_offers.sql");
  assert.match(migration, /on public\.lead_offers \(lead_id\)\s*\n\s*where outcome is null/);
});

test("ник клиента не виден тому, чья очередь не пришла", () => {
  // Иначе очередь обходилась бы без кнопки: открыл чужой лид в панели,
  // увидел ник — написал клиенту сам.
  const page = read("app/admin/leads/[id]/page.tsx");
  assert.match(page, /const hideHandle = free && !turn\.ok;/);
  assert.match(page, /hideHandle \? "скрыт — лид в очереди у другого" : usernameOf\(/);

  // Контакт целиком и раньше открывался только тому, за кем лид, и
  // владельцу — очередь это правило не ослабляет.
  const ownership = read("lib/admin/ownership.ts");
  const reveal = ownership.slice(ownership.indexOf("export async function revealContact"));
  assert.match(reveal.slice(0, 600), /if \(!lead \|\| !canEdit\(lead, staff\)\) return null;/);
});
