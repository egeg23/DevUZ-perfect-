/**
 * Руководитель берёт менеджеров к себе, открепляет — только владелец.
 *
 * Владелец: «руководитель может под себя сам брать менеджеров и быть
 * ответственным за их показатели и план/факт, а могу назначать я.
 * Отказаться от менеджера только могу я».
 *
 * Отсюда три правила, и каждое легко потерять при следующей правке:
 *  1. руководитель берёт только ничьего менеджера — забрать чужого значило
 *     бы открепить его от прежнего руководителя;
 *  2. у руководителя нет ни одного пути поставить «без руководителя»;
 *  3. двое, нажавшие одновременно, не переписывают друг друга.
 *
 * Запуск: npm test
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createServer } from "node:http";
import { test } from "node:test";

const ROOT = new URL("../", import.meta.url);
const read = (file: string) => readFileSync(new URL(file, ROOT), "utf8");

type Call = { method: string; body: Record<string, unknown> };
const calls: Call[] = [];

const server = createServer((req, res) => {
  let raw = "";
  req.on("data", (chunk) => (raw += chunk));
  req.on("end", () => {
    calls.push({ method: String(req.url).split("/").pop() ?? "", body: raw ? JSON.parse(raw) : {} });
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify({ ok: true, result: { message_id: 1 } }));
  });
});
await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
const { port } = server.address() as { port: number };

process.env.TELEGRAM_API_BASE = `http://127.0.0.1:${port}`;
process.env.TELEGRAM_BOT_TOKEN = "stub-token";
process.env.NEXT_PUBLIC_SITE_URL = "https://devuz.example";

const { claimVerdict } = await import("@/lib/admin/team");
const { notifyHeadChange, notifyOwnersOfClaim } = await import("@/lib/admin/staff-notice");

const HEAD = "head-1";
const manager = (over: Partial<{ id: string; role: "admin" | "head" | "manager"; is_active: boolean; head_staff_id: string | null }> = {}) => ({
  id: "m-1",
  role: "manager" as const,
  is_active: true,
  head_staff_id: null,
  ...over,
});

test("руководитель берёт к себе только ничьего менеджера", () => {
  assert.equal(claimVerdict({ actorId: HEAD, actorRole: "head", target: manager() }), "ok");
  // Уже его — не ошибка: второй клик по той же кнопке.
  assert.equal(claimVerdict({ actorId: HEAD, actorRole: "head", target: manager({ head_staff_id: HEAD }) }), "already");
  // Чужой — нельзя: это и есть «открепить от того», а открепляет владелец.
  assert.equal(
    claimVerdict({ actorId: HEAD, actorRole: "head", target: manager({ head_staff_id: "head-2" }) }),
    "has_head",
  );
});

test("руководителя, себя и отключённого к себе не взять", () => {
  assert.equal(claimVerdict({ actorId: HEAD, actorRole: "head", target: manager({ role: "head", id: "head-2" }) }), "forbidden");
  assert.equal(claimVerdict({ actorId: HEAD, actorRole: "head", target: manager({ role: "admin" }) }), "forbidden");
  assert.equal(claimVerdict({ actorId: HEAD, actorRole: "head", target: manager({ id: HEAD, role: "head" }) }), "forbidden");
  assert.equal(claimVerdict({ actorId: HEAD, actorRole: "head", target: manager({ is_active: false }) }), "gone");
});

test("брать к себе может только руководитель", () => {
  // Менеджер не берёт никого, владелец закрепляет через assignHead — там же
  // и открепляет.
  assert.equal(claimVerdict({ actorId: "m-2", actorRole: "manager", target: manager() }), "forbidden");
  assert.equal(claimVerdict({ actorId: "owner", actorRole: "admin", target: manager() }), "forbidden");
});

/* ── Проверки исходников ────────────────────────────────────────────────── */

function body(source: string, signature: string, length = 2600): string {
  const at = source.indexOf(signature);
  assert.ok(at >= 0, `${signature} пропала`);
  return source.slice(at, at + length);
}

test("кнопка «взять к себе» — только у руководителя, открепить — только владелец", () => {
  const actions = read("app/admin/team/actions.ts");
  assert.match(body(actions, "export async function claim(", 300), /requireRole\("head"\)/);
  // Назначить и открепить — прежнее действие владельца.
  assert.match(body(actions, "export async function assignHead(", 300), /requireAdmin\(\)/);

  const team = read("lib/admin/team.ts");
  const claim = body(team, "export async function claimManager(");
  // «Ничей» проверяется в самом запросе: двое нажали одновременно — второй
  // не переписывает первого.
  assert.match(claim, /\.is\("head_staff_id", null\)/);
  assert.match(claim, /update\(\{ head_staff_id: actor\.id \}\)/);
  assert.ok(!/head_staff_id: null/.test(claim), "руководитель может открепить менеджера");
});

test("заведённый руководителем менеджер сразу его", () => {
  const team = read("lib/admin/team.ts");
  const invite = body(team, "export async function inviteStaff(", 4200);
  assert.match(invite, /admin\.role === "head" && input\.role === "manager" \? admin\.id : null/);
  assert.match(invite, /head_staff_id: ownHead/);
  // Вернувшегося — только если он ничей: прежнего руководителя снимает владелец.
  assert.match(invite, /ownHead && !existing\.head_staff_id/);
});

test("страница: руководитель видит «взять к себе» и не видит «открепить»", () => {
  const page = read("app/admin/team/page.tsx");
  assert.match(page, /action=\{claim\}/);
  assert.match(page, /взять к себе/);
  assert.match(page, /открепляет владелец/);
  // Выпадающий список с «без руководителя» — только в ветке владельца.
  const select = page.indexOf("action={assignHead}");
  const branch = page.lastIndexOf("!manages ?", select);
  assert.ok(branch > 0 && page.slice(branch, select).includes(") : ("), "список руководителей не за manages");
});

test("план/факт касаний команды — на главной у руководителя и владельца", () => {
  const home = read("components/admin/dashboard-home.tsx");
  assert.match(home, /touchProgressFor\(peopleIds, now\)/);
  assert.match(home, /touch: touches\.get\(id\)/);
  assert.match(read("components/admin/dashboard.tsx"), /План касаний/);
});

/* ── Сообщения ─────────────────────────────────────────────────────────── */

test("менеджеру — кто его руководитель, владельцу — кто кого взял", async () => {
  calls.length = 0;
  await notifyHeadChange({ telegramId: 111, headName: "Александр", changedBy: "Александр" });
  const toManager = calls.find((c) => c.method === "sendMessage");
  assert.equal(toManager?.body.chat_id, 111);
  assert.match(String(toManager?.body.text), /Ваш руководитель теперь — Александр/);

  calls.length = 0;
  await notifyOwnersOfClaim({ ownerIds: [1, 2], headName: "Иван", managerName: "Мадина", teamPercent: 5 });
  const sent = calls.filter((c) => c.method === "sendMessage");
  assert.deepEqual(sent.map((c) => c.body.chat_id).sort(), [1, 2]);
  const text = String(sent[0].body.text);
  assert.match(text, /Иван взял к себе менеджера Мадина/);
  assert.match(text, /5 %/, "владелец не узнал, что с команды пойдёт процент");
  assert.match(text, /только вы/);
});

test("соучредителю процент с команды не пишем — его и нет", async () => {
  calls.length = 0;
  await notifyOwnersOfClaim({ ownerIds: [1], headName: "Александр", managerName: "Данил", teamPercent: 0 });
  const text = String(calls.find((c) => c.method === "sendMessage")?.body.text);
  assert.ok(!/%/.test(text), "соучредителю приписан процент с команды");
});

test("снятие руководителя — отдельным текстом", async () => {
  calls.length = 0;
  await notifyHeadChange({ telegramId: 7, headName: null, changedBy: "Егор" });
  assert.match(String(calls[0]?.body.text), /Руководитель с вас снят/);
});

test.after(() => server.close());
