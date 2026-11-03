/**
 * Владелец, 22.10.2026: «Добавь руководителям и мне кнопку в боте на
 * лидах — мусор… менеджерам… ваш лид ответил, если хотите чтобы модель
 * ответила сама через N минут, проигнорируйте… не надо так длинно
 * расписывать — что сказали, BANT и тд».
 *
 * Запуск: npm test
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { canTrash, managerTrashLine, mayTrash, seesTrash, trashCallback, trashedLabel } from "@/lib/admin/lead-trash";
import { trashLead } from "@/lib/admin/lead-trash-store";
import {
  REPLY_HOLD_MIN,
  REPLY_HOLD_MS,
  headsUpText,
  heldUntil,
  saidShort,
  takeOverCallback,
} from "@/lib/admin/reply-heads-up";
import { scoreLead } from "@/lib/qualify/scoring";
import { formatLeadBrief, plainPriority } from "@/lib/qualify/telegram";
import type { QualifyToolInput } from "@/lib/qualify/types";

const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");

function lead(over: Partial<QualifyToolInput> = {}) {
  const input: QualifyToolInput = {
    contact_name: "Азиз",
    company: "Магнат",
    contact_handle: "@aziz",
    contact_kind: "telegram",
    niche: "розница",
    niche_tier: 1,
    expertise: "high",
    services: ["ecommerce"],
    budget: "B1",
    authority: "A1",
    need: "N1",
    timing: "T1",
    intent: "interested",
    summary: {
      client: "Азиз, «Магнат»",
      request: "интернет-магазин на 5000 позиций",
      niche: "розница",
      expertise: "высокая",
      budget: "от 20 000 $",
      authority: "владелец",
      need: "срочно",
      timing: "не выяснено",
    },
    notes: "прошлый подрядчик сорвал сроки",
    opening_line: "Азиз, здравствуйте, по магазину на 5000 позиций",
    already_told: ["назвали срок 6-8 недель"],
    avoid_asking: ["про бюджет, уже назван"],
    ...over,
  };
  return scoreLead(input, "ru");
}

test("карточка лида: коротко, словами, без баллов и BANT", () => {
  const brief = formatLeadBrief(lead(), "DZ-1022-HAT9", "https://devuz.example/admin/leads/abc");
  for (const gone of [/BANT/, /ICP/, /\/100/, /КВАЛИФИКАЦИЯ/, /УЖЕ СКАЗАНО/, /НЕ ПЕРЕСПРАШИВАТЬ/, /НА ЧТО ОБРАТИТЬ/, /ЛПР/]) {
    assert.doesNotMatch(brief, gone);
  }
  assert.match(brief, /Горячий/);
  assert.match(brief, /<b>Что хочет:<\/b> интернет-магазин/);
  assert.match(brief, /<b>Бюджет:<\/b> от 20 000 \$/);
  assert.doesNotMatch(brief, /Когда нужно/, "«не выяснено» не показываем");
  assert.match(brief, /Можно начать так/);
  assert.ok(brief.length < 900, `карточка ${brief.length} знаков`);
  // Davlat: «НУЖЕН ЧЕЛОВЕК · D · 25/100» — теперь словами.
  assert.match(plainPriority(lead({ intent: "needs_human" })), /Просит живого человека/);
});

test("«🗑 Мусор»: владелец и руководитель — любой лид, менеджер — ничей или свой", async () => {
  // Владелец, 03.11.2026: «открой менеджерам кнопку „мусор“, чтобы лиды не попадали в общую очередь».
  assert.equal(canTrash("admin"), true);
  assert.equal(canTrash("head"), true);
  assert.equal(canTrash("manager"), false, "полные права — только у владельца и руководителя");
  assert.equal(seesTrash("manager"), true);
  assert.equal(seesTrash("designer"), false);
  const manager = { id: "m", role: "manager" };
  assert.equal(mayTrash(manager, { assigned_staff_id: null }), true, "ничей — из общей очереди");
  assert.equal(mayTrash(manager, { assigned_staff_id: "m" }), true, "свой");
  assert.equal(mayTrash(manager, { assigned_staff_id: "other" }), false, "чужой — нет");
  assert.equal(mayTrash({ id: "h", role: "head" }, { assigned_staff_id: "other" }), true);
  assert.equal(trashCallback("abc"), "trash:abc");
  assert.match(trashedLabel({ username: "egor", display_name: "Егор" }), /Удалён как мусор — @egor/);
  assert.match(managerTrashLine({ username: "dina", display_name: "Дина" }, { request_no: "DZ-1", label: "Тест", words: "спам" }), /@dina убрал лид как мусор DZ-1: Тест/);
  // Чужая роль не удаляет, даже прислав колбэк руками: база не трогается.
  const res = await trashLead("abc", { id: "d", role: "designer" as never, username: null, display_name: "Д" });
  assert.deepEqual(res, { ok: false, reason: "role" });

  const store = read("lib/admin/lead-trash-store.ts");
  const fn = store.slice(store.indexOf("export async function trashLead"));
  assert.ok(fn.indexOf("mayTrash(staff") < fn.indexOf('.delete().eq("id", leadId)'), "права по лиду — до удаления");
  assert.match(fn, /if \(!canTrash\(staff\.role\)\) await tellBosses\(managerTrashLine/, "менеджер удалил — строка владельцу и руководителю");
  assert.match(store, /if \(!messageWindow\(new Date\(\)\)\) return;/, "ночью строк нет");
  const route = read("app/api/telegram/webhook/route.ts");
  const handler = route.slice(route.indexOf('if (action === "trash")'));
  assert.ok(handler.indexOf("seesTrash(staff.role)") < handler.indexOf("trashLead("), "роль проверяется до удаления");
  // Кнопка — в личке сотрудников, которым приходят карточки.
  const tg = read("lib/qualify/telegram.ts");
  assert.match(tg, /trashChats\(targets\)/);
  assert.match(read("lib/qualify/notices.ts"), /\.in\("role", \[\.\.\.TRASH_BUTTON_ROLES\]\)/);
  // В панели — из карточки и из «Разобрать лиды», тем же trashLead.
  assert.match(read("app/admin/leads/[id]/actions.ts"), /trashLead\(leadId, staff, undefined, "panel"\)/);
  assert.match(read("app/admin/leads/sort/actions.ts"), /trashLead\(leadId, staff, undefined, "panel"\)/);
  // Удаление уносит предложения очереди: lead_offers — on delete cascade.
  assert.match(read("supabase/migrations/0045_lead_offers.sql"), /references public\.leads\(id\) on delete cascade/);
});

test("«Ваш лид ответил»: модель ждёт окно, «✋ Отвечу сам» её снимает", () => {
  const now = Date.parse("2026-10-22T10:00:00Z");
  const human = new Date(now + 60_000).toISOString();
  assert.equal(heldUntil(human, now, false), human, "строка не ушла — обычная пауза");
  assert.equal(Date.parse(heldUntil(human, now, true)!), now + REPLY_HOLD_MS);
  assert.equal(Date.parse(heldUntil(null, now, true)!), now + REPLY_HOLD_MS);

  const text = headsUpText({ host: "magnat.uz", said: saidShort("Здравствуйте, а сколько стоит? ".repeat(20)) });
  assert.match(text, /Ваш лид ответил/);
  assert.match(text, new RegExp(`через ${REPLY_HOLD_MIN} мин`));
  assert.match(text, /ничего не нажимайте/);
  assert.match(text, /Подключайтесь, когда будет больше информации/);
  assert.ok(text.length < 600);
  assert.equal(takeOverCallback("p1"), "tk:p1");

  const run = read("lib/admin/outreach-talk-run.ts");
  assert.match(run, /if \(inbound\.untilMockup \|\| !inbound\.managerChatId\) return human;/, "ничьё касание — без строки");
  const store = read("lib/admin/outreach-talk-store.ts");
  const take = store.slice(store.indexOf("export async function takeOverFromBot"));
  assert.match(take, /\.eq\("author", "ai"\)\s*\.eq\("status", "queued"\)/, "неушедший ответ модели снимается");
  assert.match(take, /p\.claimed_by === staff\.id/);
  const route = read("app/api/telegram/webhook/route.ts");
  assert.match(route, /parts\[0\] === "tk"/);
});
