import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";

/**
 * Списки определений: термин перед определением.
 *
 * Поймано проверкой Lighthouse на главной: «дерево доступности имеет
 * неверный формат», элемент — полоса «65 разработчиков в штате, 550+
 * проектов». Внутри карточки `<dd>` с числом стоял перед `<dt>` с подписью,
 * потому что так надо глазами: число крупно сверху, подпись под ним.
 *
 * Для разметки это не пара, а два случайных узла: читалка и ИИ-агент
 * получают «65» и не знают, к чему оно относится. Порядок показа правится
 * стилем (flex-col-reverse), порядок разметки — нет.
 *
 * Проверка идёт по исходникам, а не по собранной странице: она должна
 * ловить правку в редакторе, а не через сутки в Search Console.
 */

const ROOT = new URL("../", import.meta.url);

function tsxFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(new URL(dir, ROOT), { withFileTypes: true })) {
    const next = path.posix.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === ".next") continue;
      out.push(...tsxFiles(next));
    } else if (entry.name.endsWith(".tsx")) {
      out.push(next);
    }
  }
  return out;
}

test("в списках определений термин стоит перед определением", () => {
  const broken: string[] = [];

  for (const file of [...tsxFiles("app"), ...tsxFiles("components")]) {
    const source = readFileSync(new URL(file, ROOT), "utf8");
    const dt = source.indexOf("<dt");
    const dd = source.indexOf("<dd");

    // Ни того, ни другого — файл не про списки определений.
    if (dt === -1 && dd === -1) continue;
    // Пара разнесена по файлам: подпись рисует один компонент, значение
    // другой. Такие места проверяет соседний тест — по самим компонентам.
    if (dt === -1 || dd === -1) continue;

    if (dd < dt) broken.push(file);
  }

  assert.deepEqual(broken, [], "определение стоит раньше термина");
});

test("числа студии перевёрнуты стилем, а не разметкой", () => {
  // Самый вероятный способ сломать это обратно — «поправить» порядок,
  // увидев, что подпись показывается снизу, и вернуть dd наверх.
  for (const file of ["components/sections/scale.tsx", "app/[locale]/about/page.tsx"]) {
    const source = readFileSync(new URL(file, ROOT), "utf8");
    assert.match(source, /flex-col-reverse/, `${file}: показ больше не переворачивается стилем`);
    assert.ok(
      source.indexOf("<dt") < source.indexOf("<dd"),
      `${file}: dd снова впереди dt`,
    );
  }
});
