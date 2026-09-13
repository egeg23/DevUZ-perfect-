import assert from "node:assert/strict";
import { test } from "node:test";

import { DIGEST_HOUR, isDue, localParts, renderDigest, type DailyStats } from "@/lib/scout/digest";
import type { ScoutPulse } from "@/lib/scout/health";

// Ташкент — UTC+5 круглый год: перевода часов в Узбекистане нет.
const utc = (iso: string) => new Date(iso);

test("дата и час считаются по Ташкенту, а не по серверу", () => {
  // 20:30 UTC 13-го — это 01:30 14-го по Ташкенту. Сводка «за 13-е» и
  // «за 14-е» — разные сводки, и путать их значит слать две или ни одной.
  assert.deepEqual(localParts(utc("2026-09-13T20:30:00Z")), { date: "2026-09-14", hour: 1 });
  assert.deepEqual(localParts(utc("2026-09-14T04:00:00Z")), { date: "2026-09-14", hour: 9 });
});

test("сводка уходит с девяти утра и один раз в день", () => {
  const before = utc("2026-09-14T03:59:00Z"); // 08:59 по Ташкенту
  const morning = utc("2026-09-14T04:00:00Z"); // 09:00
  const evening = utc("2026-09-14T15:00:00Z"); // 20:00

  assert.equal(isDue(before, null), false, "до девяти — рано");
  assert.equal(isDue(morning, null), true, `с ${DIGEST_HOUR}:00 — пора`);
  assert.equal(isDue(morning, "2026-09-14"), false, "за сегодня уже слали");
  // Сервер лежал всё утро: вечером сводка всё равно уходит — опоздавшая
  // честнее пропущенной.
  assert.equal(isDue(evening, "2026-09-13"), true, "вчерашняя отметка не считается");
});

const PULSE: ScoutPulse = {
  at: "2026-09-14T03:55:00Z",
  startedAt: "2026-09-13T20:49:45Z",
  chatsWatched: 29,
  chatsReading: 12,
  seen: 340,
  passedPrefilter: 6,
  classified: 6,
  saved: 2,
  notified: 1,
  dropped: { no_topic: 300, no_demand: 30, supply: 4 },
};

const DAILY: DailyStats = { saved: 2, notified: 1, byCategory: { сайт: 1, субподряд: 1 } };

test("в сводке есть всё, ради чего её читают", () => {
  const text = renderDigest(PULSE, DAILY, utc("2026-09-14T04:00:00Z"));

  assert.match(text, /Читаю <b>12<\/b> из 29 чатов/);
  assert.match(text, /увидел 340, до модели дошло 6, разобрано 6/);
  assert.match(text, /отсев: не по теме 300, без спроса 30, предложение 4/);
  assert.match(text, /За сутки в базу: <b>2<\/b>, в канал: <b>1<\/b> \(сайт 1, субподряд 1\)/);
  assert.match(text, /\/admin\/scout/);
  // Старт — по Ташкенту: 20:49 UTC это 01:49.
  assert.match(text, /С последнего старта \(01:49\)/);
});

test("тихие сутки называются тишиной, а мёртвый скаут — поломкой", () => {
  // Тихий пульс: сообщения были, сохранённых нет. Именно это пульс
  // называет «механизм цел» — и это ответ на вопрос «сломался или тихо».
  const quiet = renderDigest(
    { ...PULSE, saved: 0, notified: 0 },
    { saved: 0, notified: 0, byCategory: {} },
    utc("2026-09-14T04:00:00Z"),
  );
  assert.match(quiet, /За сутки запросов на разработку не было/);
  assert.match(quiet, /Механизм цел/, "первой строкой — вердикт пульса");

  // Пульс протух: молчание дольше порога — это уже не тишина в чатах.
  const stale = renderDigest(PULSE, DAILY, utc("2026-09-14T06:00:00Z"));
  assert.match(stale, /Скаут молчит \d+ мин/);

  const never = renderDigest(null, DAILY, utc("2026-09-14T04:00:00Z"));
  assert.match(never, /ни разу не отчитывался/);
  assert.doesNotMatch(never, /Читаю/, "без пульса числа чатов взять неоткуда");
});
