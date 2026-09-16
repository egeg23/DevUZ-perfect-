import test from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

/**
 * Переменная, которую читает код, должна доезжать до контейнера.
 *
 * docker compose передаёт внутрь не всё подряд, а только то, что перечислено
 * в `environment:`. Строки нет — значение из `/opt/devuz/.env` молча
 * игнорируется: ошибки не будет, приложение просто ведёт себя так, будто
 * переменная не задана. Так и вышло дважды: владелец вписал реквизиты банка
 * в .env, пересобрал контейнер, а счёт продолжал печататься без счёта.
 *
 * Поймать это руками нельзя — падать нечему. Поэтому проверка считает обе
 * стороны сама: имена, которые встречаются в коде, и имена, которые
 * перечислены в compose.
 */

const root = (p: string) => fileURLToPath(new URL(`../${p}`, import.meta.url));

const SCANNED = ["app", "lib", "components"];

// Даёт рантайм, а не мы: Next выставляет NODE_ENV сам, и строка в compose
// перебила бы его сборочное значение.
// Даёт рантайм или выкатка, а не владелец: NODE_ENV выставляет Next,
// GIT_COMMIT подставляет скрипт выкатки. Строка в .env их бы только сломала.
const PROVIDED_BY_RUNTIME = new Set(["NODE_ENV", "GIT_COMMIT"]);

function sourceFiles(dir: string): string[] {
  return readdirSync(root(dir), { recursive: true, encoding: "utf8" })
    .filter((name) => /\.(ts|tsx)$/.test(name))
    .map((name) => `${dir}/${name}`);
}

function envNamesUsed(): Map<string, string> {
  const found = new Map<string, string>();
  for (const dir of SCANNED) {
    for (const file of sourceFiles(dir)) {
      const code = readFileSync(root(file), "utf8");
      for (const m of code.matchAll(/process\.env\.([A-Z][A-Z0-9_]*)/g)) {
        if (!found.has(m[1])) found.set(m[1], file);
      }
      // Обращение по имени — `process.env[name]` — прячет имя от простого
      // поиска. В таком файле любая КОНСТАНТА в кавычках считается именем
      // переменной: в реквизитах поставщика это ровно они и есть.
      if (code.includes("process.env[")) {
        for (const m of code.matchAll(/"([A-Z][A-Z0-9_]{3,})"/g)) {
          if (!found.has(m[1])) found.set(m[1], file);
        }
      }
    }
  }
  return found;
}

function composeNames(): Set<string> {
  const yml = readFileSync(root("docker-compose.yml"), "utf8");
  const names = new Set<string>();
  for (const m of yml.matchAll(/^\s+([A-Z][A-Z0-9_]*):\s/gm)) names.add(m[1]);
  return names;
}

test("каждая переменная из кода перечислена в docker-compose.yml", () => {
  const passed = composeNames();
  const missing = [...envNamesUsed()]
    .filter(([name]) => !passed.has(name) && !PROVIDED_BY_RUNTIME.has(name))
    .map(([name, file]) => `${name} (${file})`);

  assert.deepEqual(
    missing,
    [],
    `не доедут до контейнера, добавьте в environment: ${missing.join(", ")}`,
  );
});

test("переменная из compose названа в .env.example", () => {
  const example = readFileSync(root(".env.example"), "utf8");
  // Владелец заполняет .env по этому файлу. Переменной нет здесь — он о ней
  // не узнает, и она останется пустой ровно до первой поломки.
  const undocumented = [...composeNames()].filter(
    (name) => !new RegExp(`^${name}=`, "m").test(example) && !PROVIDED_BY_RUNTIME.has(name),
  );
  assert.deepEqual(undocumented, [], `нет в .env.example: ${undocumented.join(", ")}`);
});
