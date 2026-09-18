#!/usr/bin/env node
/**
 * Пересобрать разборы по уже найденным сайтам.
 *
 *   node --import ./tests/alias-hook.mjs scripts/prospect-refresh.mjs
 *   node --import ./tests/alias-hook.mjs scripts/prospect-refresh.mjs --dry-run
 *
 * Нужен после каждой правки аудитора, и это не удобство, а обязанность.
 * Находки лежат в базе снимком: менеджер открывает карточку и отправляет то,
 * что было посчитано в день прогона. Починив аудитор и не тронув базу, мы
 * чиним будущее и оставляем в работе прошлое — а именно прошлое и уходит
 * клиентам.
 *
 * Поводом был akbar-rich.uz. Разбор утверждал «на сайте не видно телефона»,
 * когда номер стоял в шапке: страницу собирает браузер, и по проводу приходит
 * пустая заготовка. Правка вышла, но в карточке по-прежнему лежала прежняя
 * ложь — с кнопкой «Связаться» рядом.
 *
 * Трогает только `new`: карточку, по которой уже писали, переписывать нельзя.
 * Находки в ней — то, на что человек ссылался в отправленном письме, и
 * подменить их значит рассогласовать переписку с панелью.
 */
import { auditOne, toProspectRow } from "@/lib/audit/batch";
import { serviceClient } from "@/lib/supabase";

const dryRun = process.argv.includes("--dry-run");
const limit = Number(process.argv.find((a) => /^--limit=/.test(a))?.split("=")[1] ?? 200);

const db = serviceClient();
if (!db) {
  console.error("Нет доступа к базе: проверьте NEXT_PUBLIC_SUPABASE_URL и SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(2);
}

const { data, error } = await db
  .from("prospects")
  .select("id, url, host, score")
  .eq("status", "new")
  .order("created_at", { ascending: true })
  .limit(limit);

if (error) {
  console.error("Не прочитал список:", error.message);
  process.exit(1);
}

const rows = data ?? [];
console.log(`Пересобираю ${rows.length} ${rows.length === 1 ? "разбор" : "разборов"}${dryRun ? " (вхолостую)" : ""}\n`);

let changed = 0;
for (const row of rows) {
  // По одному: это чужие сайты, и десяток одновременных запросов с одного
  // адреса выглядит со стороны ровно как то, чем не является.
  const fresh = toProspectRow(await auditOne({ raw: row.url, url: row.url, label: null, problem: null }));

  const before = row.score;
  const after = fresh.score;
  const codes = fresh.findings.map((f) => f.code);
  const mark = before === after ? " " : "·";
  console.log(`${mark} ${String(row.host).padEnd(28)} ${String(before ?? "—").padStart(3)} → ${String(after ?? "—").padStart(3)}  ${codes.join(", ") || "находок нет"}`);

  if (dryRun) continue;

  const { error: saveError } = await db
    .from("prospects")
    .update({
      score: fresh.score,
      findings: fresh.findings,
      contacts: fresh.contacts,
      draft: fresh.draft,
    })
    .eq("id", row.id)
    // Условие повторяется намеренно: между чтением списка и записью менеджер
    // мог взять карточку в работу, и перезаписать её разбор мы уже не вправе.
    .eq("status", "new");
  if (saveError) {
    console.error(`  не сохранил ${row.host}: ${saveError.message}`);
    continue;
  }
  changed += 1;
}

console.log(`\n${dryRun ? "Вхолостую: изменилось бы" : "Обновлено"} ${changed} из ${rows.length}`);
