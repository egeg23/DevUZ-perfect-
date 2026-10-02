import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { parseTargets, trimSeparators } from "@/lib/audit/batch";
import type { Prospect } from "@/lib/admin/outreach-store";
import { REST_PAGE, parseMore, visibleProspects } from "@/lib/admin/outreach-view";

/**
 * «Разобранные сайты» рисуются не целиком.
 *
 * Владелец, 29.09: «у некоторых сотрудников зависает страница в касаниях,
 * когда они копируют текст». 200 карточек сразу — около 2 МБ страницы и
 * замирания по несколько секунд на слабых компьютерах.
 */

const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const NOW = new Date("2026-09-29T09:00:00Z");

function row(id: string, status: Prospect["status"], sentDaysAgo: number | null = null): Prospect {
  return {
    id,
    created_at: "2026-09-01T00:00:00Z",
    status,
    sent_at: sentDaysAgo === null ? null : new Date(NOW.getTime() - sentDaysAgo * 86_400_000).toISOString(),
  } as Prospect;
}

test("сразу — строки в работе, отправленные за неделю, порция и открытая; остальные — по двадцать", () => {
  const rows: Prospect[] = [
    row("c1", "contacting"),
    ...Array.from({ length: 30 }, (_, i) => row(`n${i}`, "new")),
    row("s-fresh", "sent", 2),
    row("s-old", "sent", 30),
    row("q1", "sending"),
    row("m1", "manual"),
    row("portion", "new"),
    row("skip", "skipped"),
  ];
  const view = visibleProspects(rows, { keep: new Set(["portion"]), more: REST_PAGE, now: NOW });
  const ids = view.shown.map((r) => r.id);

  for (const pinned of ["c1", "s-fresh", "q1", "m1", "portion"]) assert.ok(ids.includes(pinned), `${pinned} скрыта`);
  // Из остальных — ровно двадцать первых, в исходном порядке.
  const rest = ids.filter((id) => !["c1", "s-fresh", "q1", "m1", "portion"].includes(id));
  assert.deepEqual(rest, Array.from({ length: 20 }, (_, i) => `n${i}`));
  assert.ok(!ids.includes("s-old") && !ids.includes("skip"));
  // n20…n29, s-old, skip — скрыты; «Показать ещё» ведёт на первую скрытую.
  assert.equal(view.hidden, 12);
  assert.equal(view.nextId, "n20");
  // Порядок списка сохранён: c1 первой, как и была.
  assert.equal(ids[0], "c1");

  const all = visibleProspects(rows, { keep: new Set(), more: 60, now: NOW });
  assert.equal(all.shown.length, rows.length);
  assert.equal(all.hidden, 0);
  assert.equal(all.nextId, null);
});

test("?more= из адреса: не меньше двадцати, не больше пятисот, мусор — двадцать", () => {
  assert.equal(parseMore(undefined), REST_PAGE);
  assert.equal(parseMore("abc"), REST_PAGE);
  assert.equal(parseMore("5"), REST_PAGE);
  assert.equal(parseMore("40.5"), REST_PAGE);
  assert.equal(parseMore("40"), 40);
  assert.equal(parseMore("99999"), 500);
});

test("страница отдаёт в список только отобранное, открытая карточка и порция не прячутся", () => {
  const page = read("app/admin/prospect/page.tsx");
  assert.match(page, /rows=\{view\.shown\}/, "список снова рисуется целиком");
  assert.match(page, /keep: new Set\(\[\.\.\.portion\.map\(\(p\) => p\.id\), \.\.\.\(open \? \[open\] : \[\]\)\]\)/);
  assert.match(page, /href: `\/admin\/prospect\?more=\$\{more \+ REST_PAGE\}\$\{view\.nextId \? `#p-\$\{view\.nextId\}` : ""\}`/);

  const list = read("components/admin/outreach-list.tsx");
  assert.match(list, /\{t\.showMore\(Math\.min\(REST_PAGE, more\.hidden\)\)\}/);
  assert.match(read("content/admin-panel/prospect.ts"), /`Показать ещё \$\{n\}`/);
  // Кнопка ведёт на ту же тяжёлую страницу — предзагружать её нельзя.
  assert.match(list, /href=\{more\.href\}\s*prefetch=\{false\}/);
  assert.match(list, /helpAnchor\("\/admin\/prospect", "list"\)/);
});

test("поле «Список сайтов»: длинные серии пробелов и тире разбираются мгновенно", () => {
  assert.equal(trimSeparators("  — Ромашка ,; "), "Ромашка");
  assert.equal(trimSeparators("ООО «Ромашка» — "), "ООО «Ромашка»");
  assert.equal(trimSeparators(" \t,;|—–- "), "");

  for (const text of ["a" + " ".repeat(20000) + "b", "x" + "—".repeat(20000) + "y", ("site.uz " + " - ".repeat(3000) + "z\n").repeat(3)]) {
    const started = performance.now();
    parseTargets(text);
    const ms = performance.now() - started;
    assert.ok(ms < 100, `разбор занял ${ms.toFixed(0)} мс — поле снова будет тормозить на вставке`);
  }
  // Подпись по-прежнему без разделителей по краям.
  assert.equal(parseTargets("ООО «Ромашка» — romashka.uz")[0].label, "ООО «Ромашка»");
  assert.equal(parseTargets("romashka.uz, Ромашка")[0].label, "Ромашка");
});
