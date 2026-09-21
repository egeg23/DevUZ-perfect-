import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";

const ROOT = new URL("../", import.meta.url);
const read = (file: string) => readFileSync(new URL(file, ROOT), "utf8");

/**
 * Где стоит счётчик — и, что важнее, где он не стоит.
 */

test("тег Google отдаётся ровно так, как его описывает Google", () => {
  const source = read("components/layout/analytics.tsx");

  assert.match(source, /googletagmanager\.com\/gtag\/js\?id=\$\{ga\}/);
  assert.match(source, /gtag\('js',new Date\(\)\)/);
  assert.match(source, /gtag\('config',\$\{JSON\.stringify\(ga\)\}\)/);

  // Идентификатора нет — не рисуем ничего. Лишние запросы к Google с
  // машины разработчика никому не нужны, а «пустой» config засоряет отчёт.
  assert.match(source, /if \(!ym && !ga\) return null;/);
});

test("счётчика нет в панели и в прототипах клиентов", () => {
  // Это не про аккуратность, а про чужие данные. В адресах панели стоят
  // идентификаторы лидов и заказов — `/admin/leads/<id>`, `/proto/<token>`.
  // Счётчик отправляет адрес страницы в Google как есть, то есть вместе с
  // ними. Публичные страницы таких адресов не имеют.
  const mounted: string[] = [];
  const walk = (dir: string) => {
    for (const entry of readdirSync(new URL(dir, ROOT), { withFileTypes: true })) {
      const next = path.posix.join(dir, entry.name);
      if (entry.isDirectory()) walk(next);
      else if (entry.name.endsWith(".tsx") && read(next).includes("<Analytics")) mounted.push(next);
    }
  };
  walk("app");

  assert.deepEqual(mounted, ["app/[locale]/layout.tsx"], "счётчик появился там, где его быть не должно");
});

test("переменная счётчика объявлена во всех трёх местах", () => {
  // NEXT_PUBLIC_ вшивается на сборке: забыть её в аргументах образа значит
  // получить пустой тег на боевом сайте при заполненном .env.
  assert.match(read(".env.example"), /^NEXT_PUBLIC_GA_ID=/m);
  assert.match(read("docker-compose.yml"), /NEXT_PUBLIC_GA_ID/);
  assert.match(read("scripts/vps-deploy.sh"), /--build-arg "NEXT_PUBLIC_GA_ID=/);
  assert.match(read("Dockerfile"), /ARG NEXT_PUBLIC_GA_ID/);
});
