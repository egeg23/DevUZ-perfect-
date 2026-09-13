import assert from "node:assert/strict";
import { test } from "node:test";

import { verdictsFrom } from "@/lib/scout/classify";
import { openChats } from "@/lib/scout/chats";
import { shape } from "@/lib/scout/shape";
import { nextStrikes, shouldExit, STRIKES_TO_EXIT } from "@/lib/scout/watchdog";

// ── Ответ модели ─────────────────────────────────────────────────────────

const BATCH = [
  { key: "-100111:1", text: "нужен сайт" },
  { key: "-100111:2", text: "нужен бот" },
];

function reply(verdicts: unknown, stop = "tool_use") {
  return {
    stop_reason: stop,
    content: [{ type: "tool_use", input: { verdicts } }],
  };
}

test("обрезанный ответ помечается, а не выдаётся за пустой", () => {
  // Обрезка по max_tokens приходит с тем, что успело сгенерироваться.
  // Если её не пометить, «модель ничего не нашла» и «ответ не влез» в
  // журнале выглядят одинаково — и второе не заметит никто.
  const full = verdictsFrom(reply([{ key: "-100111:1", score: 80, category: "сайт", rationale: "н" }]), BATCH);
  assert.equal(full.truncated, false);
  assert.equal(full.verdicts.length, 1);

  const cut = verdictsFrom(
    reply([{ key: "-100111:1", score: 80, category: "сайт", rationale: "н" }], "max_tokens"),
    BATCH,
  );
  assert.equal(cut.truncated, true, "обрезка должна быть видна");
  assert.equal(cut.verdicts.length, 1, "то, что успело прийти, не выбрасывается");

  // Обрезка посреди JSON: инструмент пришёл без input.
  const broken = verdictsFrom({ stop_reason: "max_tokens", content: [{ type: "tool_use" }] }, BATCH);
  assert.equal(broken.truncated, true);
  assert.deepEqual(broken.verdicts, []);
});

test("вердикт с чужим ключом или оценкой вне шкалы не проходит", () => {
  const { verdicts } = verdictsFrom(
    reply([
      { key: "-100111:1", score: 80, category: "сайт", rationale: "ок" },
      { key: "-100999:7", score: 90, category: "сайт", rationale: "чужой ключ" },
      { key: "-100111:2", score: 140, category: "сайт", rationale: "вне шкалы" },
      { key: "-100111:2", score: "80", category: "сайт", rationale: "строка" },
    ]),
    BATCH,
  );
  assert.deepEqual(
    verdicts.map((v) => v.key),
    ["-100111:1"],
  );
});

// ── Порядок открытия чатов ───────────────────────────────────────────────

test("список диалогов запрашивается раньше разбора адресов", async () => {
  // Диалоги наполняют кэш сущностей. Разбор до них — это числовой id,
  // который не открывается, и сетевой resolveUsername на каждый адрес
  // при каждом перезапуске.
  const calls: string[] = [];
  const client = {
    getInputEntity: async (name: string) => {
      calls.push(`resolve:${name}`);
      return { id: "-1001" };
    },
    getPeerId: async (entity: unknown) => (entity as { id: string }).id,
    getDialogs: async () => {
      calls.push("dialogs");
      return [{ id: "-1001" }];
    },
  };

  await openChats(client, ["@a", "@b"]);

  assert.equal(calls[0], "dialogs", `первым должен идти список диалогов, а не ${calls[0]}`);
  assert.deepEqual(calls.slice(1), ["resolve:@a", "resolve:@b"]);
});

// ── Форма сообщения ──────────────────────────────────────────────────────

test("сообщение без чата не читается, а не ложится под chat_id 0", () => {
  assert.equal(shape({ id: 7, message: "нужен сайт", chat: null }), null);
  assert.equal(shape({ id: 7, message: "нужен сайт" }), null);
  assert.equal(shape({ id: 7, message: "нужен сайт", chat: { id: null } }), null);
});

test("id канала получает префикс -100, готовый уже не трогается", () => {
  const fromChannel = shape({ id: 7, message: "н", chat: { id: 4364419635n, title: "Чат" } });
  assert.equal(fromChannel?.chatId, -1004364419635);

  const marked = shape({ id: 7, message: "н", chat: { id: "-1004364419635" } });
  assert.equal(marked?.chatId, -1004364419635);

  assert.equal(fromChannel?.messageId, 7);
  assert.equal(fromChannel?.chatTitle, "Чат");
});

test("автор без id остаётся null, а не NaN", () => {
  const shaped = shape({ id: 7, message: "н", chat: { id: 1n }, sender: { username: "x" } });
  assert.equal(shaped?.authorTelegramId, null);
  assert.equal(shaped?.authorUsername, "x");
});

// ── Сторож ───────────────────────────────────────────────────────────────

test("сторож выходит после двух промахов подряд, а не после одного", () => {
  const down = { disconnected: true, reconnecting: false };
  const up = { disconnected: false, reconnecting: false };

  let strikes = 0;
  strikes = nextStrikes(strikes, down);
  assert.equal(shouldExit(strikes), false, "один промах — ещё не стоп");
  strikes = nextStrikes(strikes, down);
  assert.equal(shouldExit(strikes), true, `${STRIKES_TO_EXIT} подряд — стоп`);

  // Восстановление сбрасывает счёт: промахи с перерывом — не стоп.
  strikes = nextStrikes(1, up);
  assert.equal(strikes, 0);
});

test("переподключение не считается промахом", () => {
  // Библиотека в этот момент работает; выйти сейчас — значит прервать
  // ровно то, что нас спасает.
  const busy = { disconnected: true, reconnecting: true };
  assert.equal(nextStrikes(1, busy), 0);
});
