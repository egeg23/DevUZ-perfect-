import assert from "node:assert/strict";
import { test } from "node:test";

import { summarize, type StatsRow } from "@/lib/admin/stats";

function lead(patch: Partial<StatsRow> = {}): StatsRow {
  return {
    created_at: "2026-09-01T10:00:00.000Z",
    source: "chat",
    locale: "ru",
    grade: "B",
    score: 50,
    priority: "warm",
    status: "new",
    assigned_staff_id: null,
    assigned_at: null,
    services: [],
    discount_granted: false,
    ...patch,
  };
}

test("пустая база даёт нули, а не деление на ноль", () => {
  const stats = summarize([]);

  assert.equal(stats.total, 0);
  assert.equal(stats.averageScore, 0);
  assert.equal(stats.medianMinutesToTake, null);

  // Не 0 и не 100: доли выигранных ещё не существует, и показывать вместо
  // неё ноль значит сообщить, что мы всё проиграли.
  assert.equal(stats.winRate, null);
});

test("доля выигранных считается от закрытых, а не от всех", () => {
  const stats = summarize([
    lead({ status: "won" }),
    lead({ status: "won" }),
    lead({ status: "lost" }),
    // Три лида в работе. Если считать от всех, доля упадёт с 67% до 33% —
    // и чем больше работы в процессе, тем хуже будет выглядеть результат.
    lead({ status: "taken", assigned_staff_id: "s1" }),
    lead({ status: "taken", assigned_staff_id: "s1" }),
    lead({ status: "new" }),
  ]);

  assert.equal(stats.won, 2);
  assert.equal(stats.lost, 1);
  assert.equal(stats.winRate, 67);
  assert.equal(stats.taken, 2);
});

test("время до взятия считается медианой, а не средним", () => {
  const at = (minutes: number) => ({
    created_at: "2026-09-01T10:00:00.000Z",
    assigned_at: new Date(Date.parse("2026-09-01T10:00:00.000Z") + minutes * 60_000).toISOString(),
    assigned_staff_id: "s1",
  });

  // Четыре лида разобраны за считанные минуты, один забыт на неделю.
  // Среднее здесь — больше суток, то есть число, которое не описывает ни
  // один реальный день. Медиана остаётся там, где живёт работа.
  const stats = summarize([
    lead(at(3)),
    lead(at(5)),
    lead(at(7)),
    lead(at(9)),
    lead(at(60 * 24 * 7)),
  ]);

  assert.equal(stats.medianMinutesToTake, 7);
  assert.equal(stats.slowTakes, 1);
});

test("испорченная дата взятия не утаскивает медиану", () => {
  const stats = summarize([
    lead({
      created_at: "2026-09-01T10:00:00.000Z",
      assigned_at: "2026-09-01T09:00:00.000Z", // взят раньше, чем появился
      assigned_staff_id: "s1",
    }),
    lead({
      created_at: "2026-09-01T10:00:00.000Z",
      assigned_at: "2026-09-01T10:20:00.000Z",
      assigned_staff_id: "s1",
    }),
  ]);

  assert.equal(stats.medianMinutesToTake, 20);
});

test("разрезы отсортированы по убыванию и не теряют строк", () => {
  const stats = summarize([
    lead({ grade: "A", source: "chat", services: ["сайт", "магазин"] }),
    lead({ grade: "A", source: "form", services: ["сайт"] }),
    lead({ grade: "C", source: "chat", services: ["сайт"] }),
  ]);

  assert.deepEqual(stats.byGrade, [
    { key: "A", count: 2 },
    { key: "C", count: 1 },
  ]);
  assert.equal(stats.byGrade.reduce((sum, b) => sum + b.count, 0), 3);
  assert.deepEqual(stats.topServices[0], { key: "сайт", count: 3 });
});

test("недели считаются от понедельника и идут по возрастанию", () => {
  const stats = summarize([
    // 2026-09-01 — вторник, 2026-09-07 — понедельник следующей недели.
    lead({ created_at: "2026-09-01T10:00:00.000Z" }),
    lead({ created_at: "2026-09-06T23:00:00.000Z" }),
    lead({ created_at: "2026-09-07T00:30:00.000Z" }),
  ]);

  assert.deepEqual(stats.weekly, [
    { key: "2026-08-31", count: 2 },
    { key: "2026-09-07", count: 1 },
  ]);
});

test("обрезанная выборка помечена как обрезанная", () => {
  assert.equal(summarize([lead()]).truncated, false);
  assert.equal(summarize([lead()], true).truncated, true);
});
