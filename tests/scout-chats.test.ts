import assert from "node:assert/strict";
import { test } from "node:test";

import { openChats } from "@/lib/scout/chats";

type FakeOptions = {
  /** Какие адреса открываются и во что. */
  entities: Record<string, string>;
  /** Где аккаунт состоит. "падает" — список диалогов получить не удалось. */
  dialogs: string[] | "падает";
};

function fakeClient(options: FakeOptions) {
  return {
    getInputEntity: async (name: string) => {
      const id = options.entities[name];
      // Слово в слово как у Telegram: по нему читают журнал.
      if (!id) throw new Error("No user has" + ` "${name}" as username`);
      return { id };
    },
    getPeerId: async (entity: unknown) => (entity as { id: string }).id,
    getDialogs: async () => {
      if (options.dialogs === "падает") throw new Error("TIMEOUT");
      return options.dialogs.map((id) => ({ id }));
    },
  };
}

const THREE = {
  "@uzdevgroup": "-1001111111111",
  "@progersuz": "-1002222222222",
  "@freelead": "-1003333333333",
};

test("открывает все чаты и видит, что аккаунт в них состоит", async () => {
  const roster = await openChats(fakeClient({ entities: THREE, dialogs: Object.values(THREE) }), [
    "@uzdevgroup",
    "@progersuz",
    "@freelead",
  ]);

  assert.equal(roster.opened.length, 3);
  assert.deepEqual(roster.failed, []);
  assert.deepEqual(roster.outside, []);
  assert.equal(roster.rosterUnknown, false);
});

/**
 * Главная из четырёх.
 *
 * Ровно это делала библиотека: споткнувшись об один адрес, она переставала
 * читать все. Здесь плохой адрес уходит в failed, а остальные два читаются.
 */
test("один неоткрывшийся адрес не отменяет остальные", async () => {
  const roster = await openChats(
    fakeClient({ entities: THREE, dialogs: Object.values(THREE) }),
    ["@uzdevgroup", "@опечатка", "@freelead"],
  );

  assert.deepEqual(
    roster.opened.map((chat) => chat.name),
    ["@uzdevgroup", "@freelead"],
  );
  assert.equal(roster.failed.length, 1);
  assert.equal(roster.failed[0].name, "@опечатка");
  assert.match(roster.failed[0].reason, /username/, "причина потерялась — в журнале будет нечего читать");
});

/**
 * Публичный адрес разбирается у кого угодно, а обновления приходят только
 * из тех чатов, где аккаунт состоит. Без этой проверки такой чат выглядит
 * рабочим и молчит.
 */
test("отличает «открылся» от «состою»", async () => {
  const roster = await openChats(
    // В диалогах только первый из трёх.
    fakeClient({ entities: THREE, dialogs: ["-1001111111111"] }),
    Object.keys(THREE),
  );

  assert.equal(roster.opened.length, 3, "открыться должны все три: адреса публичные");
  assert.deepEqual(
    roster.outside.map((chat) => chat.name),
    ["@progersuz", "@freelead"],
  );
  assert.equal(roster.reading, 1);
});

test("упавший список диалогов не мешает читать", async () => {
  const roster = await openChats(fakeClient({ entities: THREE, dialogs: "падает" }), Object.keys(THREE));

  assert.equal(roster.opened.length, 3, "диагностика упала — чтение всё равно должно работать");
  assert.equal(roster.rosterUnknown, true);
  assert.deepEqual(roster.outside, [], "про членство ничего не известно — выдумывать нечего");
});

/**
 * В фильтр событий уходят именно эти строки. Библиотека пропускает без
 * обращения к сети только то, что похоже на число (Utils.parseID:
 * /^(-?[0-9][0-9]*)$/). Всё остальное она пойдёт разбирать сама — то есть
 * вернёт ровно ту поломку, ради которой этот модуль и написан.
 */
test("номера отдаются в том виде, который библиотека не пойдёт разбирать заново", async () => {
  const roster = await openChats(fakeClient({ entities: THREE, dialogs: Object.values(THREE) }), Object.keys(THREE));

  for (const chat of roster.opened) {
    assert.match(chat.id, /^-?[0-9]+$/, `${chat.name} отдан как «${chat.id}» — это снова пойдёт в резолв`);
  }
});

/**
 * Номер, не открывшийся из кэша, — это «не состою», а не ошибка.
 *
 * После перехода на числа в SCOUT_CHATS двадцать невступленных чатов
 * давали двадцать строк «Could not find the input entity» — английская
 * ошибка библиотеки по одной на чат, которая читалась как поломка. Это тот
 * же список «вступи и перезапусти», и место ему в той же строке.
 */
test("невступленный номер попадает в «не состою», а не в ошибки", async () => {
  const client = fakeClient({ entities: { "-1001": "-1001" }, dialogs: ["-1001"] });
  const roster = await openChats(client, ["-1001", "-1002", "@опечатка"]);

  assert.deepEqual(roster.opened.map((chat) => chat.name), ["-1001"]);
  assert.deepEqual(
    roster.outside.map((chat) => chat.name),
    ["-1002"],
    "номер без кэша — значит, аккаунт там не состоит",
  );
  // Читаемых — один, а не «открыл минус не состою» = 0. Невступленный
  // номер в «открыл» не входит, и разность длин здесь врёт; на бою она
  // дала минус пять и ушла в пульс панели.
  assert.equal(roster.reading, 1, "читаемых должно быть столько, сколько открылось и состоим");
  // Адрес по имени, который не разобрался, — по-прежнему ошибка: публичный
  // адрес открывается у кого угодно, и его провал это опечатка или закрытый чат.
  assert.deepEqual(
    roster.failed.map((chat) => chat.name),
    ["@опечатка"],
  );
});
