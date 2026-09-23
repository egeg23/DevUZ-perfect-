import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import {
  ALL_STAGES,
  STAGES,
  STAGE_LABEL,
  canEditProjectData,
  daysOnStage,
  stageProgress,
} from "@/lib/admin/projects";

const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");

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

test("«Данные проекта» правят ведущий, его руководитель и владелец — не любой", () => {
  const owner = { id: "o", role: "admin" };
  const lead = { id: "m1", role: "manager" };
  const other = { id: "m2", role: "manager" };
  const head = { id: "h", role: "head" };
  assert.equal(canEditProjectData(owner, "m1", []), true);
  assert.equal(canEditProjectData(lead, "m1", []), true);
  assert.equal(canEditProjectData(other, "m1", []), false, "чужой менеджер правил чужой проект");
  assert.equal(canEditProjectData(head, "m1", ["m1"]), true);
  assert.equal(canEditProjectData(head, "m1", ["m9"]), false, "руководитель правил проект не своей команды");
  assert.equal(canEditProjectData(other, null, []), false);

  const store = read("lib/admin/projects.ts");
  const update = store.slice(store.indexOf("export async function updateProject"));
  assert.match(update, /if \(!canEditProjectData\(staff, ownerId, team\)\) return "forbidden";/);
  // Ведущего меняет только владелец — от него зависят начисления.
  assert.match(update, /if \(staff\.role !== "admin"\) return "forbidden";\s*if \(!fields\.ownerStaffId \|\| !\(await activeStaff/);
  // И при создании сотрудник не записывает проект на другого.
  const create = store.slice(store.indexOf("export async function createProject"), store.indexOf("export async function setStage"));
  assert.match(create, /if \(staff\.role !== "admin" \|\| !\(await activeStaff\(fields\.ownerStaffId\)\)\) return null;/);
});

test("у владельца выбор ведущего обязателен, и его проект без начислений виден", () => {
  const list = read("app/admin/projects/page.tsx");
  assert.match(list, /\{isAdmin \? \(\s*<select\s+name="owner"\s+required/);
  const card = read("app/admin/projects/[id]/page.tsx");
  assert.match(card, /isAdmin && ownerLeads \?/);
  // Отключённый ведущий остаётся в списке — иначе сохранение молча сменило бы его.
  assert.match(card, /p\.is_active \|\| p\.id === project\.owner_staff_id/);
});

test("карточка проекта ведёт на договор в любом статусе и говорит, почему он не подготовился", () => {
  const card = read("app/admin/projects/[id]/page.tsx");
  for (const status of ["draft", "pending", "approved", "signed"]) {
    assert.match(card, new RegExp(`${status}: "`), `статус ${status} без подписи`);
  }
  // Форма подготовки — только когда действующего договора нет.
  assert.match(card, /\{activeContracts\.length \? \(/);
  assert.match(card, /contractErrorText\(contractError, contractDetail\)/);
  assert.match(read("app/admin/contracts/actions.ts"), /\?contract=\$\{result\.why\}\$\{detail\}#contract/);
});
