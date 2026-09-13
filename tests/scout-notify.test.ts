import assert from "node:assert/strict";
import { test } from "node:test";

import {
  notifiableFilter,
  noticeFrom,
  processBatch,
  resendUnnotifiedSignals,
  type ResendIo,
  type ScoutIo,
  type ScoutMessage,
} from "@/lib/scout/store";

function message(overrides: Partial<ScoutMessage> = {}): ScoutMessage {
  return {
    chatId: -1001234567890,
    chatTitle: "Чат",
    chatUsername: "uzdev",
    messageId: 42,
    authorTelegramId: 7,
    authorUsername: "ivan",
    text: "Нужен интернет-магазин для сети аптек, кто может взяться?",
    ...overrides,
  };
}

const classify = async (batch: { key: string }[]) =>
  batch.map((item) => ({ key: item.key, score: 80, category: "магазин", rationale: "аптеки" }));

/** Подменный ввод-вывод, который записывает, что с ним делали. */
function fakeIo(save: ScoutIo["save"], notify: ScoutIo["notify"]) {
  const log: string[] = [];
  const io: ScoutIo = {
    save: async (input) => {
      log.push("save");
      return save(input);
    },
    notify: async (notice) => {
      log.push("notify");
      return notify(notice);
    },
    markSent: async (id) => {
      log.push(`sent:${id}`);
    },
    markFailed: async (id, attempts) => {
      log.push(`failed:${id}:${attempts}`);
    },
  };
  return { io, log };
}

test("вставленный и доставленный сигнал получает отметку доставки", async () => {
  const { io, log } = fakeIo(
    async () => ({ outcome: "inserted", id: "s1" }),
    async () => "sent",
  );
  const run = await processBatch([message()], classify, { io });

  assert.equal(run.saved, 1);
  assert.equal(run.notified, 1);
  assert.deepEqual(log, ["save", "notify", "sent:s1"]);
});

/**
 * Главная из проверок файла: дубль не уведомляется.
 *
 * Раньше проигнорированный дубль возвращал «сохранено», и уведомление
 * уходило второй раз — та же ссылка, тот же канал. Два процесса на одной
 * сессии или повтор обновления при переподключении делали из одного
 * сигнала два.
 */
test("дубль не пишет оператору второй раз", async () => {
  const { io, log } = fakeIo(
    async () => ({ outcome: "duplicate" }),
    async () => "sent",
  );
  const run = await processBatch([message()], classify, { io });

  assert.equal(run.saved, 0, "дубль — не сохранённое");
  assert.equal(run.notified, 0);
  assert.deepEqual(log, ["save"], "после дубля не должно быть ни уведомления, ни отметок");
});

test("недоставленный сигнал записывает первую неудачу, а не отметку доставки", async () => {
  const { io, log } = fakeIo(
    async () => ({ outcome: "inserted", id: "s1" }),
    async () => "failed",
  );
  const run = await processBatch([message()], classify, { io });

  assert.equal(run.saved, 1);
  assert.equal(run.notified, 0);
  assert.deepEqual(log, ["save", "notify", "failed:s1:1"]);
});

test("пропущенный сигнал не трогает ни отметку, ни счётчик", async () => {
  // Канала нет или порог не пройден: отправки не было, считать неудачей
  // нечего. Иначе счётчик рос бы на сигналах без отправки, и досылка
  // сдавалась бы раньше, чем появится канал.
  const { io, log } = fakeIo(
    async () => ({ outcome: "inserted", id: "s1" }),
    async () => "skipped",
  );
  await processBatch([message()], classify, { io });
  assert.deepEqual(log, ["save", "notify"]);
});

test("уведомление собирается со ссылкой на сообщение", () => {
  const notice = noticeFrom({
    ...message(),
    topics: ["магазин"],
    score: 80,
    category: "магазин",
    rationale: "аптеки",
  });
  assert.equal(notice.link, "https://t.me/uzdev/42");
  assert.equal(notice.score, 80);
  assert.equal(notice.chatTitle, "Чат");
});

// ── Досылка ──────────────────────────────────────────────────────────────

function withChannel<T>(value: string | undefined, fn: () => Promise<T>): Promise<T> {
  const before = process.env.TELEGRAM_SCOUT_CHANNEL_ID;
  if (value === undefined) delete process.env.TELEGRAM_SCOUT_CHANNEL_ID;
  else process.env.TELEGRAM_SCOUT_CHANNEL_ID = value;
  return fn().finally(() => {
    if (before === undefined) delete process.env.TELEGRAM_SCOUT_CHANNEL_ID;
    else process.env.TELEGRAM_SCOUT_CHANNEL_ID = before;
  });
}

const stored = (id: string, attempts = 0) => ({
  id,
  chat_title: "Чат",
  message_link: `https://t.me/uzdev/${id}`,
  author_username: "ivan",
  excerpt: "нужен сайт",
  score: 80,
  category: "сайт",
  rationale: "н",
  notify_attempts: attempts,
});

function fakeResend(rows: ReturnType<typeof stored>[], notify: ResendIo["notify"]) {
  const log: string[] = [];
  const io: ResendIo = {
    load: async () => {
      log.push("load");
      return rows;
    },
    notify: async (notice) => {
      log.push(`notify:${notice.link}`);
      return notify(notice);
    },
    markSent: async (id) => {
      log.push(`sent:${id}`);
    },
    markFailed: async (id, attempts) => {
      log.push(`failed:${id}:${attempts}`);
    },
  };
  return { io, log };
}

test("без канала досылка не читает базу вовсе", async () => {
  await withChannel(undefined, async () => {
    const { io, log } = fakeResend([stored("a")], async () => "sent");
    const result = await resendUnnotifiedSignals(io);
    assert.deepEqual(result, { sent: 0, failed: 0 });
    assert.deepEqual(log, [], "слать некуда — и читать незачем");
  });
});

test("досылка отмечает доставленное и считает неудачи с учётом прошлых", async () => {
  await withChannel("-100777", async () => {
    let calls = 0;
    const { io, log } = fakeResend([stored("a"), stored("b", 3)], async () => {
      calls += 1;
      return calls === 1 ? "sent" : "failed";
    });
    const result = await resendUnnotifiedSignals(io);

    assert.deepEqual(result, { sent: 1, failed: 1 });
    assert.deepEqual(log, [
      "load",
      "notify:https://t.me/uzdev/a",
      "sent:a",
      "notify:https://t.me/uzdev/b",
      // Четвёртая неудача, а не первая: счётчик копится между свипами,
      // иначе предел попыток никогда не наступит.
      "failed:b:4",
    ]);
  });
});

/**
 * Холостой прогон гоняет всю цепочку — иначе проверять нечего, — но его
 * результат не должен попадать в очередь оператора как настоящий лид.
 *
 * Проверка появилась не сразу. Сама пометка была сделана раньше и держалась
 * на разборе кода: `saveSignal` без живой базы возвращает неудачу, и
 * записанный статус наблюдать было неоткуда. Шов `io` сделал это место
 * проверяемым, и правка перестала быть обещанием.
 */
/**
 * Записываем в массивы, а не в переменную: присваивание идёт внутри
 * замыкания, и TypeScript, не видя его, сужает `let … = null` до `never`.
 * Тот же приём, что у `log` выше.
 */
function recordingIo() {
  const savedStatus: string[] = [];
  const notifiedRehearsal: (boolean | undefined)[] = [];

  const io: ScoutIo = {
    save: async (input) => {
      savedStatus.push(input.rehearsal ? "ignored" : "new");
      return { outcome: "inserted", id: "s1" };
    },
    notify: async (notice) => {
      notifiedRehearsal.push(notice.rehearsal);
      return "sent";
    },
    markSent: async () => {},
    markFailed: async () => {},
  };

  return { io, savedStatus, notifiedRehearsal };
}

test("сигнал холостого прогона помечен и в базе, и в уведомлении", async () => {
  const { io, savedStatus, notifiedRehearsal } = recordingIo();

  await processBatch([message()], classify, { io, rehearsal: true });

  assert.deepEqual(savedStatus, ["ignored"], "фикстура легла в очередь как новая");
  assert.deepEqual(notifiedRehearsal, [true], "уведомление не отличает прогон от лида");
});

test("живой сигнал прогоном не помечается", async () => {
  const { io, savedStatus, notifiedRehearsal } = recordingIo();

  // Без параметра — то, как зовёт живой раннер.
  await processBatch([message()], classify, { io });

  assert.deepEqual(savedStatus, ["new"]);
  assert.ok(!notifiedRehearsal[0], "живой сигнал помечен как прогон");
});

test("noticeFrom переносит признак прогона дальше в уведомление", () => {
  const base = {
    chatId: -1001234567890,
    chatTitle: null,
    messageId: 1,
    chatUsername: null,
    authorTelegramId: null,
    authorUsername: null,
    text: "Нужен сайт",
    topics: ["сайт"],
    score: 70,
    category: "сайт",
    rationale: "нужен сайт",
  };

  assert.equal(noticeFrom({ ...base, rehearsal: true }).rehearsal, true);
  assert.equal(noticeFrom(base).rehearsal, false, "по умолчанию — живой сигнал");
});

/**
 * Досылка и живая отправка обязаны считать «доходит до оператора» одинаково.
 *
 * Субподряд идёт в канал мимо порога (shouldNotify), а досылка выбирает из
 * базы — и если выбирает только по порогу, субподряд с баллом 25, не
 * доставленный с первого раза, не будет дослан никогда. Правило одно, и
 * фильтр собирается из того же списка.
 */
test("фильтр досылки пропускает категории мимо порога", () => {
  const before = process.env.SCOUT_MIN_SCORE;
  try {
    process.env.SCOUT_MIN_SCORE = "70";
    const filter = notifiableFilter();
    assert.match(filter, /score\.gte\.70/, "порог в фильтре должен быть текущим");
    assert.match(filter, /category\.eq\.субподряд/, "субподряд обязан проходить и в досылке");
  } finally {
    if (before === undefined) delete process.env.SCOUT_MIN_SCORE;
    else process.env.SCOUT_MIN_SCORE = before;
  }
});
