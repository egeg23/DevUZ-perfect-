/**
 * Клиент бота дописал после того, как лид взяли, — строка хозяину лида.
 *
 * Владелец, 23.10.2026, про лид FloraEdu Global: «запиши его на меня…
 * Уведомления по этому клиенту приходят мне, проверь».
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { ownerNotice } from "@/lib/qualify/lead-owner-notify";

const read = (file: string) => readFileSync(new URL(`../${file}`, import.meta.url), "utf8");

test("строка хозяину: кто, номер заявки, слова клиента, ссылка на карточку", () => {
  const text = ownerNotice({ label: "FloraEdu Global", requestNo: "DZ-1022-DJ79", leadId: "L1", text: "Rahmat, <b>smeta</b> kerak" });
  assert.match(text, /💬 <b>Клиент написал в бот<\/b> · FloraEdu Global · DZ-1022-DJ79/);
  assert.match(text, /«Rahmat, &lt;b&gt;smeta&lt;\/b&gt; kerak»/, "слова клиента экранированы");
  assert.match(text, /\/admin\/leads\/L1/);
});

test("ищет взятый лид по нику, пишет только днём, переписку кладёт в карточку", () => {
  const store = read("lib/qualify/lead-owner-notify.ts");
  assert.match(store, /\.ilike\("tg_username", username\)/);
  assert.match(store, /\.not\("assigned_staff_id", "is", null\)/);
  assert.match(store, /update\(\{ transcript: \[\.\.\.stored, \.\.\.input\.turns\] \}\)/, "переписка дописывается, а не заменяется сессией бота");
  assert.ok(store.indexOf("...input.turns]") < store.indexOf("if (!messageWindow(now)) return false;"), "переписка — и ночью");
  assert.match(store, /wants\(.*"talks"\)/);
  const hook = read("app/api/telegram/webhook/route.ts");
  assert.match(hook, /const fresh = history\.slice\(session\.transcript\.length\);/);
  assert.match(hook, /tellLeadOwner\(\{ username: from\?\.username \?\? null, text, turns: fresh, skipChats: notified \}\)/);
  assert.doesNotMatch(hook, /tellLeadOwner\(\{[^}]*\bhistory\b/, "всю сессию в карточку не пишем");
  assert.match(store, /if \(input\.skipChats\?\.has\(chat\)\) return false;/, "кому ушло обращение в бота — второй строки нет");
});
