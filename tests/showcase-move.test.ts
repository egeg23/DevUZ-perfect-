/**
 * Переезд витрины и USTA с maximov-tech.ru на devuz.studio.
 *
 * Владелец, 12.10.2026: «Перенеси готовые макеты и дизайны в Devuz Studio,
 * чтобы не осталось никаких следов .ru». Переезд — кнопкой
 * (.github/workflows/move-to-devuz.yml): держит, что кнопка ничего не
 * ломает, если что-то пошло не так, и что старые ссылки продолжают работать.
 *
 * Запуск: npm test
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const flow = readFileSync(new URL("../.github/workflows/move-to-devuz.yml", import.meta.url), "utf8");

test("переезд: оба адреса, сначала DNS, «только посмотреть» ничего не меняет", () => {
  assert.match(flow, /move_site globalex\.maximov-tech\.ru cases\.devuz\.studio/);
  assert.match(flow, /move_site usta\.maximov-tech\.ru usta\.devuz\.studio/);
  assert.match(flow, /workflow_dispatch:\s*\n\s*inputs:\s*\n\s*dry_run:/);
  assert.match(flow, /getent ahostsv4 "\$new"/);
  const body = flow.slice(flow.indexOf("move_site() {"));
  assert.ok(body.indexOf('if [ "$DRY" = "true" ]; then') < body.indexOf("certbot certonly"), "сертификат выпускается и в «только посмотреть»");
});

test("переезд: свой сертификат, копия конфига и откат, если nginx не принял", () => {
  assert.match(flow, /certbot certonly --nginx -d "\$new" --cert-name "\$new"/);
  assert.match(flow, /\$SUDO cp "\$real" "\$backup"/);
  assert.match(flow, /✗ nginx не принял — возвращаю как было"\s*\n\s*\$SUDO cp "\$backup" "\$real"/);
});

test("старый адрес ведёт на новый с тем же путём, и его сертификат можно продлить", () => {
  // В location, а не на уровне server: иначе проверка certbot уйдёт по переадресации.
  assert.match(flow, /location \/ \{ return 301 https:\/\/%s\$request_uri; \}/);
  assert.doesNotMatch(flow, /server_name %s;\\n    return 301/);
});

test("адрес витрины для поиска меняется на cases.devuz.studio", () => {
  assert.match(flow, /NEXT_PUBLIC_SITE_URL=https:\/\/cases\.devuz\.studio/);
});
