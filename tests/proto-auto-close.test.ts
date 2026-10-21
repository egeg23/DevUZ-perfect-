/**
 * Макет открыт 24 часа, потом — только по паролю.
 *
 * Владелец, 14.10.2026: «Убедись, что все макеты, которые мы делаем,
 * доступны 24 часа, после автоматически переходят на пароль. Не завязывай
 * это правило на ИИ, сделай сценарием».
 *
 * Запуск: npm test
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import {
  OPEN_MS,
  autoCloseAt,
  closeDue,
  closedDigest,
  closedText,
  closesAt,
  hoursLeft,
  openFrom,
  parseCodeCallback,
  type AutoCloseInput,
} from "@/lib/proto/auto-close";

const read = (file: string) => readFileSync(new URL(`../${file}`, import.meta.url), "utf8");

function proto(over: Partial<AutoCloseInput> = {}): AutoCloseInput {
  return {
    auto: false,
    closedAt: null,
    lock: null,
    lockAt: null,
    sentAt: null,
    openedAt: null,
    createdAt: "2026-10-10T08:00:00.000Z",
    ...over,
  };
}

test("24 часа — от отправки клиенту, потом от первого открытия, потом от публикации", () => {
  const all = proto({ sentAt: "2026-10-12T10:00:00.000Z", openedAt: "2026-10-11T09:00:00.000Z" });
  assert.deepEqual(openFrom(all), { at: Date.parse("2026-10-12T10:00:00.000Z"), by: "sent" });
  assert.equal(autoCloseAt(all), Date.parse("2026-10-12T10:00:00.000Z") + OPEN_MS);

  const opened = proto({ openedAt: "2026-10-11T09:00:00.000Z" });
  assert.equal(openFrom(opened).by, "opened");
  assert.equal(autoCloseAt(opened), Date.parse("2026-10-12T09:00:00.000Z"));

  const fresh = proto();
  assert.equal(openFrom(fresh).by, "published");
  assert.equal(autoCloseAt(fresh), Date.parse("2026-10-11T08:00:00.000Z"));
});

test("закрывается через 24 часа, не раньше", () => {
  const p = proto({ sentAt: "2026-10-13T10:00:00.000Z" });
  assert.equal(closeDue(p, new Date("2026-10-14T09:59:00.000Z")), false);
  assert.equal(closeDue(p, new Date("2026-10-14T10:00:00.000Z")), true);
  assert.equal(hoursLeft(autoCloseAt(p)!, new Date("2026-10-13T22:30:00.000Z")), 12);
  assert.equal(hoursLeft(autoCloseAt(p)!, new Date("2026-10-14T09:59:00.000Z")), 1);
});

test("уже закрытый, собранный ботом и с ручным паролем — правило не трогает", () => {
  const now = new Date("2026-10-20T00:00:00.000Z");
  assert.equal(closeDue(proto({ closedAt: "2026-10-11T00:00:00.000Z" }), now), false, "закрытие один раз");
  assert.equal(closeDue(proto({ auto: true }), now), false);
  // Ручной lockAt главнее: макет закрывается в его час, не в наш.
  const manual = proto({ lock: "hash", lockAt: "2026-10-25T10:00:00.000Z" });
  assert.equal(closeDue(manual, now), false);
  assert.equal(closesAt(manual, now), Date.parse("2026-10-25T10:00:00.000Z"));
  // Ручной пароль без lockAt — макет и так закрыт.
  assert.equal(closesAt(proto({ lock: "hash" }), now), null);
  assert.equal(closesAt(proto({ closedAt: "2026-10-11T00:00:00.000Z" }), now), null);
});

test("facts.open — макет без пароля по слову владельца: свип его не закрывает", async () => {
  // Владелец, 21.10.2026, макет SamAuto: «сделаем в виде макета без пароля».
  const now = new Date("2026-10-30T00:00:00.000Z");
  const open = proto({ open: true, sentAt: "2026-10-21T10:00:00.000Z" });
  assert.equal(autoCloseAt(open), null);
  assert.equal(closeDue(open, now), false);
  assert.equal(closesAt(open, now), null);
  // Из базы приходит строкой (facts->>open), и читают её все три места.
  const { inputOf } = await import("@/lib/proto/auto-close-read");
  const row = { id: "x", name: "SamAuto", prospect_id: null, auto: false, closed_at: null, opened_at: null, created_at: "2026-10-21T10:00:00.000Z", lock: null, lockAt: null };
  assert.equal(inputOf({ ...row, open: "true" }, undefined).open, true);
  assert.equal(inputOf({ ...row, open: null }, undefined).open, false);
  for (const file of ["lib/proto/auto-close-store.ts", "lib/admin/mockups-store.ts", "lib/admin/hq-my-store.ts"]) {
    assert.ok(read(file).includes("open:facts->>open"), `${file}: не читает facts.open`);
  }
});

test("свип закрывает условно и один раз, без модели", () => {
  const store = read("lib/proto/auto-close-store.ts");
  assert.match(store, /\.update\(\{ closed_at: now\.toISOString\(\), auto_closed_at: now\.toISOString\(\) \}\)/);
  assert.match(store, /\.is\("closed_at", null\)/);
  assert.doesNotMatch(store, /anthropic|messages\.create/i);
  assert.doesNotMatch(read("lib/proto/auto-close.ts"), /anthropic|messages\.create/i);
  // Витрину (портфолио) правило не закрывает: только protos.
  assert.doesNotMatch(store, /showcase/);
  assert.match(read("app/api/reminders/sweep/route.ts"), /await runProtoAutoClose\(new Date\(\)\)/);
});

test("строка в бот и кнопка пароля", () => {
  assert.equal(closedText("Asmo"), "🔒 Макет «Asmo» закрылся паролем: прошло 24 часа. Нужен клиенту — нажмите «Сгенерировать пароль».");
  assert.equal(closedDigest([]), null);
  assert.match(closedDigest(["A", "B"]) ?? "", /Закрылись паролем: 2/);
  const id = "a7e22a6a-e4b5-4aba-a000-01110a332b44";
  assert.deepEqual(parseCodeCallback(["mc", id]), { protoId: id });
  assert.equal(parseCodeCallback(["mc", "x"]), null);
  assert.equal(parseCodeCallback(["mo", id]), null);
  const hook = read("app/api/telegram/webhook/route.ts");
  assert.match(hook, /parts\[0\] === CODE_CALLBACK/);
  assert.match(hook, /mockupCode\(`p:\$\{cb\.protoId\}`, staff, null\)/);
});

test("в «Макетах» видно, сколько макет ещё открыт и с какого часа закрыт", () => {
  const list = read("components/admin/mockup-list.tsx");
  assert.match(list, /t\.openFor\(row\.openHours\)/);
  assert.match(list, /t\.closedSince\(row\.closedAtText\)/);
});
