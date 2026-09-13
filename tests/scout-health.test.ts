import assert from "node:assert/strict";
import { test } from "node:test";

import {
  EMPTY_PULSE,
  STALE_AFTER_MS,
  accumulate,
  diagnose,
  type ScoutPulse,
} from "@/lib/scout/health";

/**
 * Пульс существует ради одного вопроса: «в канале пусто — сломалось или в
 * чатах тихо?». Поэтому проверяется не запись в базу, а то, что числа
 * превращаются в верный ответ: именно здесь ошибка уводит разбор в сторону
 * на часы.
 */

const NOW = Date.parse("2026-09-13T20:00:00Z");

function pulse(patch: Partial<ScoutPulse> = {}): ScoutPulse {
  return {
    ...EMPTY_PULSE,
    at: new Date(NOW - 60_000).toISOString(),
    startedAt: new Date(NOW - 3_600_000).toISOString(),
    chatsWatched: 3,
    chatsReading: 3,
    ...patch,
  };
}

test("нет пульса вовсе — скаут не запускался", () => {
  const verdict = diagnose(null, NOW);
  assert.equal(verdict.state, "stale");
});

test("протухший пульс отличается от тишины", () => {
  // Ровно та разница, ради которой пульс и пишется по таймеру: мёртвый
  // процесс и спокойный вечер в чатах дают одинаково пустой канал.
  const свежий = diagnose(pulse({ seen: 40 }), NOW);
  assert.notEqual(свежий.state, "stale");

  const старый = diagnose(
    pulse({ seen: 40, at: new Date(NOW - STALE_AFTER_MS - 60_000).toISOString() }),
    NOW,
  );
  assert.equal(старый.state, "stale");
  assert.match(старый.says, /молчит/i);
});

test("аккаунт вне чатов важнее всего остального", () => {
  const verdict = diagnose(pulse({ chatsReading: 0, seen: 0 }), NOW);
  assert.equal(verdict.state, "no_chats");
});

test("отсев пропустил, а разобрано ноль — это недоступная модель", () => {
  // Самый коварный случай: так выглядит скаут без NODE_OPTIONS=--use-env-proxy.
  // Чтение чатов идёт через свой мост и работает, а обращение к модели —
  // обычный fetch, который с сервера не проходит. В журнале это «разобрано 0»,
  // то есть неотличимо от «модель ничего не нашла».
  const verdict = diagnose(pulse({ seen: 120, passedPrefilter: 4, classified: 0 }), NOW);
  assert.equal(verdict.state, "model_down");
  assert.match(verdict.says, /use-env-proxy|ключ/i);
});

test("тишина в чатах названа тишиной, а не поломкой", () => {
  // Механизм цел, запросов не было. Это не авария, и говорить о ней как об
  // аварии значит послать человека чинить работающее.
  const пусто = diagnose(pulse({ seen: 0 }), NOW);
  assert.equal(пусто.state, "quiet");

  const шёл = diagnose(pulse({ seen: 300, passedPrefilter: 2, classified: 2, saved: 0 }), NOW);
  assert.equal(шёл.state, "quiet");
  assert.match(шёл.says, /тишина в чатах, а не поломка/i);
});

test("нормальная работа не выдаётся за аварию", () => {
  const verdict = diagnose(
    pulse({ seen: 300, passedPrefilter: 5, classified: 5, saved: 2, notified: 2 }),
    NOW,
  );
  assert.equal(verdict.state, "ok");
});

test("накопление складывает ступени и разбивку отсева", () => {
  const начало = pulse();
  const после = accumulate(
    accumulate(начало, {
      seen: 10,
      passedPrefilter: 2,
      classified: 2,
      saved: 1,
      notified: 1,
      dropped: { no_topic: 6, supply: 2 },
    }),
    {
      seen: 5,
      passedPrefilter: 1,
      classified: 1,
      saved: 0,
      notified: 0,
      dropped: { supply: 3, spam: 1 },
    },
  );

  assert.equal(после.seen, 15);
  assert.equal(после.passedPrefilter, 3);
  assert.equal(после.saved, 1);
  assert.deepEqual(после.dropped, { no_topic: 6, supply: 5, spam: 1 });

  // Накопитель не трогает то, что пришло извне прохода.
  assert.equal(после.chatsReading, начало.chatsReading);
  assert.equal(после.startedAt, начало.startedAt);
});
