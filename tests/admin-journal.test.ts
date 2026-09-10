import assert from "node:assert/strict";
import { test } from "node:test";

import { AUDIT_ACTIONS } from "@/lib/admin/audit";
import { ACTION_LABEL, SENSITIVE } from "@/lib/admin/journal";

/**
 * Экран журнала перечисляет действия по AUDIT_ACTIONS, а подписывает их по
 * ACTION_LABEL. Разъехавшись, эти два списка ломают экран ровно там, где он
 * нужен: новое действие пишется в базу, но в фильтре выглядит как пустая
 * кнопка, а в ленте — как «staff.role_changed» вместо человеческой фразы.
 * Заметить это без проверки можно только глазами и только случайно.
 */
test("у каждого журналируемого действия есть подпись", () => {
  for (const action of AUDIT_ACTIONS) {
    const label = ACTION_LABEL[action];
    assert.ok(label, `действие ${action} без подписи`);
    assert.notEqual(label, action, `подпись для ${action} — это само действие`);
  }
});

test("нет подписей к действиям, которых больше нет", () => {
  // Обратная сторона: переименовали действие, подпись осталась — и её
  // потом ищут глазами по всему файлу.
  for (const key of Object.keys(ACTION_LABEL)) {
    assert.ok(
      (AUDIT_ACTIONS as readonly string[]).includes(key),
      `подпись ${key} ни к чему не относится`,
    );
  }
});

test("подсветка чувствительного не ссылается на несуществующее", () => {
  for (const action of SENSITIVE) {
    assert.ok(
      (AUDIT_ACTIONS as readonly string[]).includes(action),
      `${action} подсвечен, но такого действия нет`,
    );
  }
  // Раскрытие контакта и чтение переписки — то, ради чего журнал вообще
  // существует после Э2. Если они выпадут из подсветки, лента снова станет
  // однородным потоком, в котором их не найти.
  assert.ok(SENSITIVE.has("lead.contact_revealed"));
  assert.ok(SENSITIVE.has("lead.transcript_viewed"));
});
