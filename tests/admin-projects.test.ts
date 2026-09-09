import assert from "node:assert/strict";
import { test } from "node:test";

import {
  ALL_STAGES,
  STAGES,
  STAGE_LABEL,
  daysOnStage,
  stageProgress,
} from "@/lib/admin/projects";

test("у каждой стадии есть подпись по-русски", () => {
  for (const stage of ALL_STAGES) {
    assert.ok(STAGE_LABEL[stage], `стадия ${stage} без подписи`);
  }
  // И наоборот: подпись без стадии — след от переименования, который
  // потом ищут глазами по всему файлу.
  for (const key of Object.keys(STAGE_LABEL)) {
    assert.ok(ALL_STAGES.includes(key), `подпись ${key} ни к чему не относится`);
  }
});

test("полоса растёт по порядку стадий и доходит до конца", () => {
  const values = STAGES.map((stage) => stageProgress(stage));

  for (let i = 1; i < values.length; i += 1) {
    assert.ok(
      (values[i] as number) > (values[i - 1] as number),
      `${STAGES[i]} не дальше, чем ${STAGES[i - 1]}`,
    );
  }
  assert.equal(values[0], Math.round((1 / STAGES.length) * 100));
  assert.equal(values[values.length - 1], 100);
});

/**
 * Главное решение файла, вынесенное в проверку.
 *
 * «На паузе» — не начало и не конец. Ноль сказал бы клиенту и команде, что
 * работа не начиналась, сто — что она закончена; неправда в обе стороны
 * сразу. Поэтому полоса для таких стадий просто не рисуется.
 */
test("стадии вне линии не притворяются прогрессом", () => {
  for (const stage of ["paused", "done", "cancelled", "выдумка"]) {
    assert.equal(stageProgress(stage), null, `${stage} получил долю прогресса`);
  }
});

test("дни на стадии считаются вниз, но не уходят в минус", () => {
  const now = Date.parse("2026-09-09T12:00:00.000Z");

  assert.equal(daysOnStage("2026-09-09T11:00:00.000Z", now), 0);
  assert.equal(daysOnStage("2026-09-06T12:00:00.000Z", now), 3);

  // Дата из будущего — испорченные данные. Отрицательное число дней в
  // карточке выглядит как ошибка чтения, а не как ошибка данных.
  assert.equal(daysOnStage("2026-09-20T12:00:00.000Z", now), 0);
});
