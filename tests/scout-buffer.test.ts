import assert from "node:assert/strict";
import { test } from "node:test";

import { createBuffer, type BufferedMessage } from "@/lib/scout/buffer";

type Msg = BufferedMessage & { text: string };

/** Управляемое время: тест не должен ждать настоящее окно. */
function fakeTimer() {
  const jobs = new Map<number, () => void>();
  let next = 1;
  return {
    api: {
      set: (fn: () => void) => {
        const id = next++;
        jobs.set(id, fn);
        return id;
      },
      clear: (handle: unknown) => {
        jobs.delete(handle as number);
      },
    },
    /** Наступило окно. */
    fire() {
      const all = [...jobs.values()];
      jobs.clear();
      for (const job of all) job();
    },
    pending: () => jobs.size,
  };
}

const msg = (chatId: number, messageId: number, text = "текст"): Msg => ({
  chatId,
  messageId,
  text,
});

test("пачка уходит по истечении окна", async () => {
  const sent: Msg[][] = [];
  const clock = fakeTimer();
  const buffer = createBuffer<Msg>({
    flushMs: 1000,
    maxBatch: 10,
    timer: clock.api,
    onFlush: async (batch) => {
      sent.push(batch);
    },
  });

  buffer.push(msg(-100, 1));
  buffer.push(msg(-100, 2));
  assert.equal(sent.length, 0, "до окна ничего не уходит");

  clock.fire();
  await buffer.flush();

  assert.equal(sent.length, 1);
  assert.deepEqual(
    sent[0].map((m) => m.messageId),
    [1, 2],
  );
});

test("полная пачка уходит не дожидаясь окна", async () => {
  const sent: Msg[][] = [];
  const clock = fakeTimer();
  const buffer = createBuffer<Msg>({
    flushMs: 100000,
    maxBatch: 3,
    timer: clock.api,
    onFlush: async (batch) => {
      sent.push(batch);
    },
  });

  buffer.push(msg(-100, 1));
  buffer.push(msg(-100, 2));
  buffer.push(msg(-100, 3));
  await buffer.flush();

  assert.equal(sent.length, 1, "окно не понадобилось");
  assert.equal(sent[0].length, 3);
  assert.equal(clock.pending(), 0, "таймер снят, иначе выстрелит впустую");
});

/**
 * Клиент присылает одно и то же сообщение чаще, чем кажется: при
 * переподключении, при правке, при повторной доставке апдейта. Дубль в
 * пачке — это дубль в ленте оператора и лишний вызов модели.
 */
test("повтор одного сообщения не задваивает пачку", async () => {
  const sent: Msg[][] = [];
  const clock = fakeTimer();
  const buffer = createBuffer<Msg>({
    flushMs: 1000,
    maxBatch: 10,
    timer: clock.api,
    onFlush: async (batch) => {
      sent.push(batch);
    },
  });

  buffer.push(msg(-100, 7, "первая версия"));
  buffer.push(msg(-100, 7, "правленая версия"));
  buffer.push(msg(-200, 7, "другой чат, тот же номер"));

  assert.equal(buffer.size(), 2, "разные чаты не схлопываются");

  clock.fire();
  await buffer.flush();

  assert.equal(sent[0].length, 2);
  assert.equal(
    sent[0].find((m) => m.chatId === -100)?.text,
    "правленая версия",
    "остаётся последняя редакция",
  );
});

/**
 * Главная проверка файла.
 *
 * Разбор пачки занимает секунды, и за это время окно успевает истечь
 * снова. Две одновременные отправки читают и очищают один накопитель:
 * часть сообщений уходит дважды, часть теряется. Проверяем, что вторая
 * отправка ждёт первую.
 */
test("отправки не идут внахлёст", async () => {
  const order: string[] = [];
  let release!: () => void;
  const blocked = new Promise<void>((resolve) => {
    release = resolve;
  });

  const clock = fakeTimer();
  const buffer = createBuffer<Msg>({
    flushMs: 1000,
    maxBatch: 2,
    timer: clock.api,
    onFlush: async (batch) => {
      order.push(`начало ${batch.map((m) => m.messageId).join(",")}`);
      if (batch.length === 2) await blocked;
      order.push(`конец ${batch.map((m) => m.messageId).join(",")}`);
    },
  });

  buffer.push(msg(-100, 1));
  buffer.push(msg(-100, 2)); // пачка полна — отправка началась и висит

  buffer.push(msg(-100, 3));
  buffer.push(msg(-100, 4)); // вторая пачка полна, но первая ещё в полёте

  await new Promise((resolve) => setImmediate(resolve));
  assert.deepEqual(order, ["начало 1,2"], "вторая пачка не начиналась");

  release();
  await buffer.flush();

  assert.deepEqual(order, ["начало 1,2", "конец 1,2", "начало 3,4", "конец 3,4"]);
});

test("падение разбора не роняет накопитель и не зацикливает сообщение", async () => {
  const attempts: number[][] = [];
  const clock = fakeTimer();
  const buffer = createBuffer<Msg>({
    flushMs: 1000,
    maxBatch: 10,
    timer: clock.api,
    onFlush: async (batch) => {
      attempts.push(batch.map((m) => m.messageId));
      throw new Error("модель недоступна");
    },
  });

  buffer.push(msg(-100, 1));
  clock.fire();
  await buffer.flush();

  buffer.push(msg(-100, 2));
  clock.fire();
  await buffer.flush();

  // Сломавшее разбор сообщение не возвращается в накопитель: возврат
  // выглядел бы заботливее, но означал бы вечный цикл на нём.
  assert.deepEqual(attempts, [[1], [2]]);
  assert.equal(buffer.size(), 0);
});

test("остановка сливает остаток и больше ничего не принимает", async () => {
  const sent: number[][] = [];
  const clock = fakeTimer();
  const buffer = createBuffer<Msg>({
    flushMs: 100000,
    maxBatch: 10,
    timer: clock.api,
    onFlush: async (batch) => {
      sent.push(batch.map((m) => m.messageId));
    },
  });

  buffer.push(msg(-100, 1));
  await buffer.stop();

  assert.deepEqual(sent, [[1]], "остаток не потерян");

  buffer.push(msg(-100, 2));
  assert.equal(buffer.size(), 0, "после остановки не принимает");
});
