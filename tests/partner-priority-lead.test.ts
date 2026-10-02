import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import {
  PRIORITY_HEADING,
  PRIORITY_PING_MINUTES,
  PRIORITY_SOURCE,
  pingDue,
  reminderHeading,
} from "@/lib/partners/priority-lead";

/**
 * Закреплённый партнёром клиент — сразу лидом, приоритетным. Владелец, 02.10:
 * «Сразу лидом, причём он идёт с уведомлением всем менеджерам. Эти лиды идут
 * всегда вверху списка лидов и выделены цветом + в тг идёт постоянное
 * уведомление, пока его кто-то не возьмёт».
 */

const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");
// 10:00 по Ташкенту — рабочее время; 20:00 — нет.
const DAY = new Date("2026-10-05T05:00:00Z");
const NIGHT = new Date("2026-10-05T15:00:00Z");

test("напоминание — каждые 15 минут в рабочее время, не дольше недели", () => {
  assert.equal(PRIORITY_PING_MINUTES, 15);
  const at = (min: number) => new Date(DAY.getTime() - min * 60_000).toISOString();
  assert.ok(pingDue({ created_at: at(60), partner_ping_at: at(15) }, DAY));
  assert.ok(!pingDue({ created_at: at(60), partner_ping_at: at(14) }, DAY), "прошло меньше 15 минут");
  assert.ok(pingDue({ created_at: at(20), partner_ping_at: null }, DAY), "напоминаний ещё не было — от времени лида");
  assert.ok(!pingDue({ created_at: at(60), partner_ping_at: at(30) }, NIGHT), "ночью не будим");
  assert.ok(!pingDue({ created_at: at(8 * 24 * 60), partner_ping_at: at(30) }, DAY), "старше недели — уже не звонок, а вопрос");
});

test("шапки карточек: приоритет и «всё ещё ничей»", () => {
  assert.match(PRIORITY_HEADING, /Приоритет: клиента привёл партнёр/);
  assert.match(PRIORITY_HEADING, /каждые 15 минут/);
  assert.match(reminderHeading(45), /всё ещё ничей — 45 мин/);
  assert.match(reminderHeading(180), /всё ещё ничей — 3 ч/);
});

test("закрепление сразу заводит лид — мимо очереди, всем, с партнёром и закреплением", () => {
  assert.equal(PRIORITY_SOURCE, "partner");
  const lead = read("lib/partners/priority-lead.ts");
  const create = lead.slice(lead.indexOf("export async function createPartnerLead("));
  assert.match(create, /source: PRIORITY_SOURCE/);
  assert.match(create, /queue_opened_at: now\.toISOString\(\)/, "лид пошёл в очередь, а не открыт всем");
  assert.match(create, /partner_client_id: client\.id/);
  assert.match(create, /partner_id: partner\.id/);
  assert.match(create, /client_inn: client\.inn/);
  assert.match(create, /to: await teamChats\(true\)/, "первая карточка не уходит всей команде");
  assert.match(create, /\.is\("first_lead_at", null\)/, "срок закрепления не стартует с лида");

  const ping = lead.slice(lead.indexOf("export async function pingPriorityLeads("));
  assert.match(ping, /\.eq\("partner_pin", true\)/);
  assert.match(ping, /\.or\(`partner_ping_at\.is\.null,partner_ping_at\.lte\.\$\{before\}`\)/, "два прохода свипа напомнят дважды");
  assert.match(ping, /if \(!card \|\| !card\.free\) continue;/);

  const actions = read("app/[locale]/partners/cabinet/actions.ts");
  assert.match(actions, /const leadId = await createPartnerLead\(partner, c, now\);/);
  assert.match(read("app/api/reminders/sweep/route.ts"), /await pingPriorityLeads\(new Date\(\)\)/);
});

test("ничей лид от партнёра — первым в списке и выделен", () => {
  const sql = read("supabase/migrations/0077_partner_priority_leads.sql");
  assert.match(sql, /generated always as \(source = 'partner' and status = 'new' and assigned_staff_id is null\) stored/);
  const leads = read("lib/admin/leads.ts");
  assert.match(leads, /\.order\("partner_pin", \{ ascending: false \}\)\s*\.order\("created_at", \{ ascending: false \}\)/);
  assert.match(leads, /"partner_pin",/);
  const table = read("components/admin/lead-table.tsx");
  assert.match(table, /lead\.source === "partner"/);
  assert.match(table, /border-l-gold/);
});
