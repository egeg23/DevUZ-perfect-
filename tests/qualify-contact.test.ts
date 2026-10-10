/**
 * Контакт клиента в бриф — кодом, если модель его не переписала (разведка
 * «ИИ → код», 10.10.2026). Лид без контакта — лид, которому менеджеру
 * некуда написать.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { contactIn, withTalkContact } from "@/lib/qualify/contact";
import type { QualifyToolInput } from "@/lib/qualify/types";

test("телефон, @ник и почта находятся в реплике клиента", () => {
  assert.deepEqual(contactIn("пишите на +998 90 123-45-67, я на связи"), { handle: "+998 90 123-45-67", kind: "phone" });
  assert.deepEqual(contactIn("мой номер 90 123 45 67"), { handle: "90 123 45 67", kind: "phone" });
  assert.deepEqual(contactIn("Zadzwoń: +48 501 234 567"), { handle: "+48 501 234 567", kind: "phone" });
  assert.deepEqual(contactIn("мой телеграм @akbar_rich"), { handle: "@akbar_rich", kind: "telegram" });
  assert.deepEqual(contactIn("почта info@cherry.uz"), { handle: "info@cherry.uz", kind: "email" });
});

test("бюджет, даты и цены за телефон не принимаются", () => {
  assert.equal(contactIn("бюджет 150000000 сум"), null);
  assert.equal(contactIn("бюджет 15 000 000 сум, старт 10.10.2026"), null);
  assert.equal(contactIn("сайт за 2 300 $ и 12 часов"), null);
  assert.equal(contactIn("@ab"), null, "слишком короткий ник");
});

test("контакт модели не трогаем, пустой — берём последний из реплик клиента", () => {
  const input = { contact_handle: "", contact_kind: "none" } as QualifyToolInput;
  const history = [
    { role: "user" as const, content: "звоните 90 111 22 33" },
    { role: "assistant" as const, content: "Наш телеграм @devuz_studio" },
    { role: "user" as const, content: "лучше в телеграм @client_one" },
  ];
  assert.deepEqual(
    { handle: withTalkContact(input, history).contact_handle, kind: withTalkContact(input, history).contact_kind },
    { handle: "@client_one", kind: "telegram" },
  );
  const told = { contact_handle: "+998 90 000 00 00", contact_kind: "phone" } as QualifyToolInput;
  assert.equal(withTalkContact(told, history), told);
  assert.equal(withTalkContact(input, [{ role: "assistant", content: "@devuz_studio" }]).contact_handle, "", "наш контакт — не контакт клиента");

  const engine = readFileSync(new URL("../lib/qualify/engine.ts", import.meta.url), "utf8");
  assert.match(engine, /withTalkContact\(sanitizeToolInput\(toolUse\.input as QualifyToolInput, truncated\), history\)/);
});
