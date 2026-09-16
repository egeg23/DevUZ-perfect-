import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import {
  MAX_ESTIMATE_BYTES,
  MAX_SIGNATURE_BYTES,
  MAX_SIGNED_SCAN_BYTES,
} from "@/lib/admin/upload-limits";

/**
 * Три слоя режут загрузку по размеру, и работает самый маленький.
 *
 * Пока nginx стоял на 128 килобайтах, лимиты в коде — 2 мегабайта на
 * подпись, 20 на скан — были недостижимы. Владелец грузил подпись на 271
 * килобайт и получал не «файл слишком большой», а пустой экран: nginx
 * отвечает 413 без тела, и встроенный браузер Telegram показывает
 * «This page couldn't load».
 *
 * Отказ должен приходить от приложения и словами. Значит, наружные лимиты
 * обязаны быть не меньше внутренних.
 */

const read = (p: string) => readFileSync(fileURLToPath(new URL(`../${p}`, import.meta.url)), "utf8");

/** «25m», «22mb», «500kb», «1000» — в байты. */
function bytes(value: string): number {
  const m = /^(\d+(?:\.\d+)?)\s*(b|kb|k|mb|m|gb|g)?$/i.exec(value.trim());
  assert.ok(m, `не разобрал размер: ${value}`);
  const unit = (m[2] ?? "b").toLowerCase();
  const factor =
    unit === "kb" || unit === "k" ? 1024
    : unit === "mb" || unit === "m" ? 1024 * 1024
    : unit === "gb" || unit === "g" ? 1024 * 1024 * 1024
    : 1;
  return Number(m[1]) * factor;
}

/** Лимит внутри блока `location /admin` — общий по серверу нам не подходит. */
function nginxAdminLimit(): number {
  const conf = read("deploy/nginx-devuz.conf");
  const block = /location\s+\/admin\s*\{([\s\S]*?)\n    \}/.exec(conf);
  assert.ok(block, "в конфиге nginx нет блока location /admin");
  const limit = /client_max_body_size\s+([^;]+);/.exec(block[1]);
  assert.ok(limit, "в блоке /admin не задан client_max_body_size");
  return bytes(limit[1]);
}

function serverActionLimit(): number {
  const conf = read("next.config.ts");
  const m = /bodySizeLimit:\s*"([^"]+)"/.exec(conf);
  assert.ok(m, "в next.config.ts не задан bodySizeLimit для server actions");
  return bytes(m[1]);
}

test("server action пропускает самый большой файл, который разрешает код", () => {
  const biggest = Math.max(MAX_SIGNATURE_BYTES, MAX_ESTIMATE_BYTES, MAX_SIGNED_SCAN_BYTES);
  assert.ok(
    serverActionLimit() >= biggest,
    `bodySizeLimit ${serverActionLimit()} меньше лимита в коде ${biggest}`,
  );
});

test("nginx пропускает всё, что пропускает server action", () => {
  assert.ok(
    nginxAdminLimit() >= serverActionLimit(),
    `nginx ${nginxAdminLimit()} меньше bodySizeLimit ${serverActionLimit()}: ` +
      "отказ придёт кодом 413 без объяснения, а не словами от приложения",
  );
});

test("публичная часть сайта остаётся с маленьким лимитом", () => {
  const conf = read("deploy/nginx-devuz.conf");
  // Большой лимит нужен только там, где грузят файлы. Раздать его всему
  // сайту значит открыть каждому желающему приём двадцатимегабайтных тел.
  const server = /client_max_body_size\s+([^;]+);/.exec(conf);
  assert.ok(server, "общий client_max_body_size пропал");
  assert.ok(
    bytes(server[1]) <= 1024 * 1024,
    `общий лимит вырос до ${server[1]} — большой лимит должен жить только в /admin`,
  );
});
