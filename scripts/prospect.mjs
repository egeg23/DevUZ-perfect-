#!/usr/bin/env node
/**
 * Пакетный аудит из командной строки.
 *
 * Тот же путь, что у страницы «Холодные касания», но без панели и без
 * человека в середине: агент ведёт лидогенерацию сам, а кликать в админке
 * ради каждой пачки — это ровно та работа, которую эксперимент и должен
 * снять с владельца.
 *
 * Список приносит вызывающий — файлом или через stdin. Автоматическим
 * обходом чужих каталогов этот скрипт список не собирает, ровно как и
 * lib/audit/batch.ts: граница проходит там же, и переносить её сюда, потому
 * что «из консоли не видно», было бы жульничеством.
 *
 *   node --import ./tests/alias-hook.mjs scripts/prospect.mjs targets.txt
 *   cat targets.txt | node --import ./tests/alias-hook.mjs scripts/prospect.mjs
 *
 * Флаги:
 *   --lang ru|en    язык черновиков, по умолчанию русский
 *   --json <путь>   сложить полный результат машинно-читаемым
 *   --only-drafts   печатать только то, что готово к отправке
 *
 * Про сеть: probe() ходит мимо прокси намеренно (см. шапку lib/audit/fetch.ts),
 * иначе замер скорости мерил бы дорогу до прокси, а не до сайта клиента.
 * В песочнице, где прямой выход наружу закрыт, все адреса вернутся
 * недоступными — это ограничение среды, а не поломка аудита. Гонять нужно
 * оттуда, откуда есть прямой выход.
 */
import { readFileSync, writeFileSync } from "node:fs";

import { BATCH_CAP, CHUNK, auditOne, parseTargets, toProspectRow } from "@/lib/audit/batch";
import { pitchLocales } from "@/lib/audit/pitch";

const argv = process.argv.slice(2);
const flag = (name) => {
  const i = argv.indexOf(name);
  return i === -1 ? null : argv[i + 1] ?? null;
};
const has = (name) => argv.includes(name);

const lang = flag("--lang") ?? "ru";
if (!pitchLocales.includes(lang)) {
  console.error(`Язык «${lang}» не поддержан. Доступны: ${pitchLocales.join(", ")}.`);
  process.exit(1);
}

const jsonOut = flag("--json");
const onlyDrafts = has("--only-drafts");
const VALUED = ["--json", "--lang"];
const file = argv.find((a, i) => !a.startsWith("--") && !VALUED.includes(argv[i - 1]));

const input = file ? readFileSync(file, "utf8") : readFileSync(0, "utf8");
const targets = parseTargets(input);

if (!targets.length) {
  console.error("Список пуст. Строка на адрес, можно «Название — адрес».");
  process.exit(1);
}
if (targets.length === BATCH_CAP) {
  console.error(`! Список обрезан по потолку в ${BATCH_CAP} адресов.`);
}

// Пачками, а не всё разом: чужие сайты не должны получать от нас десяток
// одновременных запросов, да и восемь секунд таймаута на каждый складываются.
const rows = [];
for (let i = 0; i < targets.length; i += CHUNK) {
  const chunk = targets.slice(i, i + CHUNK);
  process.stderr.write(`  аудит ${i + 1}–${i + chunk.length} из ${targets.length}\n`);
  rows.push(...(await Promise.all(chunk.map(auditOne))).map((r) => toProspectRow(r, lang)));
}

const ready = rows.filter((r) => r.draft);
const nothingToSay = rows.filter((r) => !r.draft && r.score !== null);
const failed = rows.filter((r) => r.score === null);

for (const r of ready) {
  console.log(`\n${"─".repeat(72)}\n${r.label ?? r.url}  ·  ${r.url}  ·  балл ${r.score}\n`);
  console.log(r.draft);
}

if (!onlyDrafts) {
  console.log(`\n${"═".repeat(72)}`);
  console.log(`Готовы к отправке: ${ready.length}`);
  // Сайт без претензий — это результат, а не осечка: придуманный повод
  // портит и адресата, и отправителя.
  console.log(`Писать не о чем:   ${nothingToSay.length}`);
  console.log(`Не открылись:      ${failed.length}`);
  for (const r of failed) console.log(`  · ${r.raw} — ${r.note}`);
}

if (jsonOut) {
  writeFileSync(jsonOut, JSON.stringify({ generatedAt: new Date().toISOString(), lang, rows }, null, 2) + "\n");
  console.log(`\nПолный результат: ${jsonOut}`);
}
