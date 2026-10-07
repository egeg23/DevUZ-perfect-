import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { partnerCopy } from "@/content/partner-bot";
import { canSee } from "@/lib/admin/roles";

/**
 * Владелец, 07.10.2026: «Выведи в дашборд руководителю вкладку „партнёры“.
 * Дай мне возможность удалять партнёра… Убери у сотрудников возможность
 * регистрироваться в качестве партнёров, через тг аутентиф делаем проверку
 * пользователя в списке сотрудников».
 */

const read = (file: string) => readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
const between = (src: string, from: string, to?: string) => {
  const at = src.indexOf(from);
  assert.ok(at >= 0, `нет ${from}`);
  return src.slice(at, to ? src.indexOf(to, at + from.length) : undefined);
};

test("сотрудник не становится партнёром: проверка по Telegram id в списке активных сотрудников", () => {
  const store = read("lib/partners/store.ts");
  const check = between(store, "export async function isStaffTelegram(", "\n}\n");
  assert.match(check, /\.from\("staff"\)\s*\.select\("id"\)\s*\.eq\("telegram_user_id", telegramUserId\)\s*\.eq\("is_active", true\)/);

  // Регистрация через бота — единственная дверь — закрыта до создания записи.
  const ensure = between(store, "export async function ensurePartner(", "\n}\n");
  assert.ok(ensure.indexOf("isStaffTelegram(from.id)") < ensure.indexOf(".insert("), "проверка после создания");

  // Бот отвечает сотруднику отказом раньше, чем что-то заводит или открывает.
  const bot = between(read("lib/partners/bot.ts"), "export async function handlePartnerCommand(", "\n}\n");
  assert.match(bot, /if \(await isStaffTelegram\(from\.id\)\) \{\s*await sendMessage\(chatId, copy\.staffOnly\);\s*return;\s*\}/);
  assert.ok(bot.indexOf("isStaffTelegram") < bot.indexOf("ensurePartner(from)"));

  // Старая сессия кабинета сотрудника не открывает.
  assert.match(read("lib/partners/session.ts"), /\(await isStaffTelegram\(partner\.telegram_user_id\)\) \? null : partner/);

  // Руками в панели — тоже нет.
  const create = between(store, "export async function createPartner(", "\n}\n");
  assert.match(create, /if \(await isStaffTelegram\(fields\.telegramUserId\)\) return \{ ok: false, reason: "staff" \};/);
});

test("отказ сотруднику — на каждом языке бота", () => {
  for (const locale of ["ru", "en", "uk", "pl"] as const) {
    const text = partnerCopy(locale).staffOnly;
    assert.ok(text.length > 40, `${locale}: пусто`);
    assert.ok(!/[<>&]/.test(text), `${locale}: сломает разметку бота`);
  }
});

test("раздел у руководителя: работа с программой — да, деньги и удаление — нет", () => {
  assert.equal(canSee("head", "/admin/partners"), true);
  assert.equal(canSee("manager", "/admin/partners"), false);

  const actions = read("app/admin/partners/actions.ts");
  for (const name of ["addPartner", "editPartner", "decideAgencyAction", "cancelClientAction"]) {
    assert.match(between(actions, `export async function ${name}(`, "\n}\n"), /await requireRole\("admin", "head"\)/, name);
  }
  for (const name of ["decide", "deletePartnerAction"]) {
    assert.match(between(actions, `export async function ${name}(`, "\n}\n"), /await requireAdmin\(\)/, name);
  }
  // Пустое поле ставки у руководителя ставку не стирает.
  assert.match(actions, /percentOverride: owner \? percent : undefined/);

  const store = read("lib/partners/store.ts");
  assert.match(between(store, "export async function decidePayout(", "\n}\n"), /if \(admin\.role !== "admin"\) return \{ ok: false, reason: "forbidden" \}/);
  assert.match(
    between(store, "export async function updatePartner(", "\n}\n"),
    /if \(fields\.percentOverride !== undefined && admin\.role !== "admin"\) return \{ ok: false, reason: "forbidden" \}/,
  );

  const page = read("app/admin/partners/page.tsx");
  assert.match(page, /const admin = await requireRole\("admin", "head"\);\s*const owner = admin\.role === "admin";/);
  assert.match(page, /\{owner \? \(\s*<form action=\{decide\}/);
  assert.match(page, /\{owner \? \(\s*<DeleteBlock/);
  assert.match(page, /\{owner \? \(\s*<>\s*<input\s*name="percent"/);
  // Партнёр с Telegram сотрудника помечен — его видно и удалить.
  assert.match(page, /staffIds\.has\(partner\.telegram_user_id\)/);
});

test("удалить партнёра может только владелец; с выплатами — нельзя, всё в журнал", () => {
  const store = read("lib/partners/store.ts");
  const del = between(store, "export async function deletePartner(", "\n}\n");
  assert.match(del, /if \(admin\.role !== "admin"\) return \{ ok: false, reason: "forbidden" \}/);
  assert.ok(del.indexOf('reason: "has_payouts"') < del.indexOf('.from("partners").delete()'), "удаляет с выплатами");
  assert.match(del, /record\("partner\.deleted"/);
  assert.match(read("lib/admin/journal.ts"), /"partner\.deleted": \{ ru: "удалил партнёра"/);
});

test("агентство и закреплённый клиент — сообщение владельцу и руководителю, выплаты — владельцу", () => {
  const cabinet = read("app/[locale]/partners/cabinet/actions.ts");
  assert.equal((cabinet.match(/await alertPartnerDesk\(/g) ?? []).length, 2);
  const bot = read("lib/partners/bot.ts");
  assert.match(between(bot, "export async function alertPartnerDesk(", "\n}\n"), /chatIdsOf\(\["admin", "head"\]\)/);
  assert.match(bot, /const adminChatIds = \(\) => chatIdsOf\(\["admin"\]\);/);
  assert.match(between(bot, "export async function alertPayoutRequest(", "\n}\n"), /await adminChatIds\(\)/);
});
