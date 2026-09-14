import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { test } from "node:test";

/**
 * Сторож за связанными таблицами в запросах.
 *
 * PostgREST сам ищет, по какому внешнему ключу связать таблицы в
 * `projects(..., staff(display_name))`. Пока ключ один — угадывает верно.
 * Как только появляется вторая дорога от той же таблицы к той же — прямая
 * («заявку оплатил») или через промежуточную таблицу («процент по сделке
 * сотруднику»), — запрос начинает отвечать ошибкой PGRST201 целиком.
 *
 * Так и вышло: миграция `0018_project_shares` связала проекты и
 * сотрудников вторым путём, и чтение проектов молча стало возвращать
 * пустоту — список проектов опустел, а страница проекта начала отвечать
 * 404. Ни один тест этого не поймал: в коде ничего не менялось, сломала
 * таблица, добавленная рядом.
 *
 * Поэтому связь называется явно — `staff!projects_owner_staff_id_fkey(...)`
 * или через колонку `автор:author_staff_id (...)`, — и здесь это
 * проверяется по исходникам. Стоит дёшево и ловит ровно тот случай, когда
 * новая таблица ломает старый запрос.
 */

const ROOT = new URL("../", import.meta.url).pathname;

function sources(dir: string): string[] {
  return readdirSync(new URL(dir, import.meta.url), { recursive: true, encoding: "utf8" })
    .filter((name) => name.endsWith(".ts") || name.endsWith(".tsx"))
    .map((name) => `${dir}${name}`);
}

/** Похоже на список колонок PostgREST, а не на текст или класс вёрстки. */
const SELECT_LIST = /^[A-Za-z_][A-Za-z0-9_,:!()*.\s]*$/;

/** Имя перед скобкой — это связанная таблица либо колонка после псевдонима. */
const EMBED = /([A-Za-z_][A-Za-z0-9_]*)\s*\(/g;

test("связанные таблицы в запросах названы по внешнему ключу", () => {
  const files = [...sources("../lib/"), ...sources("../app/")].filter((file) =>
    readFileSync(`${ROOT}${file.replace("../", "")}`, "utf8").includes(".from("),
  );
  assert.ok(files.length >= 5, `файлов с запросами найдено ${files.length} — проверка ничего не смотрит`);

  const bare: string[] = [];
  let checked = 0;

  for (const file of files) {
    const code = readFileSync(`${ROOT}${file.replace("../", "")}`, "utf8");
    for (const [, literal] of code.matchAll(/"([^"\n]*\([^"\n]*\)[^"\n]*)"/g)) {
      if (!SELECT_LIST.test(literal)) continue;
      checked++;
      for (const match of literal.matchAll(EMBED)) {
        const before = literal[match.index - 1];
        // `:` — связь через колонку, `!` — через имя внешнего ключа.
        if (before === ":" || before === "!") continue;
        bare.push(`${file.replace("../", "")}: ${literal}`);
      }
    }
  }

  assert.ok(checked > 0, "ни одной выборки со связанной таблицей не разобрано — проверка слепа");
  assert.deepEqual(bare, [], "связь не названа: PostgREST угадает её сам и сломается при новой таблице");
});
