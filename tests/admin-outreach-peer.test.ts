import assert from "node:assert/strict";
import test from "node:test";

import { unreachableText, verdictForHandle, verdictForPhone } from "@/lib/admin/outreach-peer";

/**
 * Разбор ответа телеграма о том, кто на том конце.
 *
 * Тест существует ровно потому, что приговор вынесен отдельно от сети: в
 * цикле отправки эту ветку нельзя было бы прогнать, не подняв телеграм, — а
 * именно она решает, уйдёт письмо человеку или в канал, где его никто не
 * прочитает.
 *
 * Формы ответов — настоящие: contacts.resolveUsername отдаёт peer и users,
 * contacts.importContacts — imported и users.
 */

test("канал и группа — не адресат: в них нельзя написать в личку", () => {
  // Так выглядели девять из четырнадцати первых касаний. Телеграм отвечал на
  // них CHAT_WRITE_FORBIDDEN уже после отправки, тратя место в часовом пределе.
  assert.deepEqual(verdictForHandle({ peer: { className: "PeerChannel" }, users: [] }), {
    ok: false,
    why: "channel",
  });
  assert.deepEqual(verdictForHandle({ peer: { className: "PeerChat" }, users: [] }), {
    ok: false,
    why: "channel",
  });
});

test("бот отличается флагом, а не именем", () => {
  // Имя — только предварительный отсев: живой человек может назваться
  // @talbot. Здесь спрашиваем телеграм, и он не ошибается.
  assert.deepEqual(
    verdictForHandle({ peer: { className: "PeerUser" }, users: [{ id: 42, bot: true }] }),
    { ok: false, why: "bot" },
  );
  assert.deepEqual(verdictForHandle({ peer: { className: "PeerUser" }, users: [{ id: 42 }] }), {
    ok: true,
    userId: "42",
  });
});

test("удалённый аккаунт принимает сообщения, но их никто не прочитает", () => {
  assert.deepEqual(
    verdictForHandle({ peer: { className: "PeerUser" }, users: [{ id: 7, deleted: true }] }),
    { ok: false, why: "not_found" },
  );
});

test("пустой ответ — это ответ, а не сбой", () => {
  assert.deepEqual(verdictForHandle(null), { ok: false, why: "not_found" });
  assert.deepEqual(verdictForHandle({ peer: null, users: [] }), { ok: false, why: "not_found" });
  assert.deepEqual(verdictForHandle({ peer: { className: "PeerUser" }, users: [] }), {
    ok: false,
    why: "not_found",
  });
});

test("по номеру: пустой imported значит «телеграма на этом номере нет»", () => {
  assert.deepEqual(verdictForPhone({ imported: [], users: [], retryContacts: [] } as never), {
    ok: false,
    why: "not_found",
  });
  assert.deepEqual(
    verdictForPhone({ imported: [{ userId: 555 }], users: [{ id: 555 }] }),
    { ok: true, userId: "555" },
  );
});

test("id приходит как BigInt и не должен потерять точность", () => {
  // Числа telegram выходят за пределы Number: превратив их в число, мы
  // получили бы чужой аккаунт, а не ошибку.
  const big = 7_004_512_345_678_901n;
  assert.deepEqual(verdictForHandle({ peer: { className: "PeerUser" }, users: [{ id: big }] }), {
    ok: true,
    userId: "7004512345678901",
  });
});

test("причина объясняется по-разному в зависимости от того, чем мы шли", () => {
  // «Не нашёлся» по адресу и «не нашёлся» по номеру — разные новости: в
  // первом случае адрес на сайте устарел, во втором номер просто не привязан
  // к телеграму, и это самый обычный случай.
  assert.notEqual(unreachableText("not_found", "phone"), unreachableText("not_found", "handle"));
  assert.match(unreachableText("channel", "handle"), /канал/i);
  assert.match(unreachableText("bot", "handle"), /бот/i);
});
