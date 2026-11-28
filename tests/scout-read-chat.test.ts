import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { pickDialog, readAsk, storeName, READ_LIMIT, READ_LIMIT_MAX } from "@/lib/scout/read-chat";

test("чтение чата скаутом: просьба, выбор чата, имя файла", () => {
  assert.equal(readAsk({}), null);
  assert.deepEqual(readAsk({ chat: "CZECHFARM" }), { chat: "CZECHFARM", limit: READ_LIMIT, days: 7, files: true });
  assert.equal(readAsk({ chat: "x", limit: 99999 })?.limit, READ_LIMIT_MAX);
  assert.equal(readAsk({ chat: "x", files: false })?.files, false);
  const dialogs = [
    { id: "-1001", title: "Рабочий чат", entity: { username: "work" } },
    { id: "-100777", title: "CZECHFARM x DevUz", entity: null },
    { id: "55", name: "Иван", entity: { username: "ivan" } },
  ];
  assert.equal(pickDialog(dialogs, "czechfarm")?.id, "-100777");
  assert.equal(pickDialog(dialogs, "@ivan")?.id, "55");
  assert.equal(pickDialog(dialogs, "777")?.id, "-100777");
  assert.equal(pickDialog(dialogs, "нет такого"), null);

  assert.match(storeName(12, "Сертификат GMP.pdf", "pdf"), /^12-[\w.-]+\.pdf$/);
  assert.equal(storeName(5, "", "jpg"), "5-file.jpg");
});

test("чтение чата скаутом: только читает, в журнал — числа", () => {
  const src = readFileSync(new URL("../scout/runner.mjs", import.meta.url), "utf8");
  const body = src.slice(src.indexOf("function startChatReader"), src.indexOf("/** Как часто скаут смотрит, пора ли"));
  assert.ok(body.length > 200);
  assert.ok(!/sendMessage|markAsRead|readHistory/.test(body), "читатель ничего не пишет в чат");
  for (const line of body.match(/console\.(log|error)\([^;]*;/g) ?? []) assert.ok(!/item\.text|message\.message|from\b/.test(line), `в журнал не уходит текст: ${line}`);
});
