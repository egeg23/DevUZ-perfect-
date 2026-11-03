import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { toastDict } from "@/content/admin-panel/toast";
import { SKIP_MAX, idleDue, parseSkip, sortHref, sortQueue } from "@/lib/admin/lead-sort";
import type { IdleLead } from "@/lib/admin/lead-tidy";

/**
 * Владелец, 03.11.2026: «сделай более удобный способ разгребать лиды,
 * которые скапливаются» и «экран после нажатия … не уносил экран наверх, а
 * оставался на месте, а результат … высвечивался сверху экрана».
 */

const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");
const NOW = new Date("2026-11-03T08:00:00Z");
const daysAgo = (d: number) => new Date(NOW.getTime() - d * 86_400_000).toISOString();
const id = (n: number) => `00000000-0000-0000-0000-${String(n).padStart(12, "0")}`;
const idle = (n: number, moved: number, over: Partial<IdleLead> = {}): IdleLead => ({
  id: id(n),
  label: `L${n}`,
  ownerId: "me",
  movedAt: daysAgo(moved),
  snoozedUntil: null,
  askedAt: null,
  waitStreak: 0,
  ...over,
});
const free = (n: number, created: number) => ({ id: id(n), label: `F${n}`, requestNo: null, createdAt: daysAgo(created), request: null, source: null, priority: null });

test("очередь: сначала свои без движения (дольше висит — раньше), потом ничьи новые (старше — раньше)", () => {
  const queue = sortQueue(
    { idle: [idle(1, 8), idle(2, 30), idle(3, 2), idle(4, 10, { snoozedUntil: daysAgo(-2) })], free: [free(5, 1), free(6, 4)] },
    NOW,
    new Set(),
  );
  assert.deepEqual(
    queue.map((c) => c.id),
    [id(2), id(1), id(6), id(5)],
    "3 — свежий, 4 — отложен задачей до будущего дня",
  );
  assert.equal(idleDue(idle(7, 7), NOW), true);
  assert.equal(idleDue(idle(8, 9, { snoozedUntil: daysAgo(1) }), NOW), true, "срок задачи прошёл — снова висит");
  // Пропущенные — не в этом заходе.
  assert.deepEqual(sortQueue({ idle: [idle(2, 30)], free: [free(6, 4)] }, NOW, new Set([id(2)])).map((c) => c.id), [id(6)]);
  // Трижды «ещё в работе» — только «Выиграли» и «Проиграли».
  const [card] = sortQueue({ idle: [idle(9, 12, { waitStreak: 3 })], free: [] }, NOW, new Set());
  assert.equal(card.kind === "idle" && card.canWait, false);
});

test("пропуски и адрес следующего шага", () => {
  assert.deepEqual(parseSkip(`${id(1)},bad,${id(2)}`), [id(1), id(2)]);
  assert.equal(parseSkip(Array.from({ length: 60 }, (_, i) => id(i)).join(",")).length, SKIP_MAX);
  assert.equal(sortHref("trashed", [id(1)]), `/admin/leads/sort?done=trashed&skip=${encodeURIComponent(id(1))}`);
  assert.equal(sortHref(null, []), "/admin/leads/sort");
});

test("решения — тем же путём, что карточка и бот; каждый код результата — в плашке", () => {
  const page = read("app/admin/leads/sort/page.tsx");
  assert.match(page, /const staff = await requireSection\("\/admin"\)/);
  const actions = read("app/admin/leads/sort/actions.ts");
  assert.match(actions, /takeLead\(leadId, staff, await requestIp\(\)\)/);
  assert.match(actions, /decideTidy\(staff, parsed\.answer, parsed\.leadId, "panel"/);
  assert.match(actions, /trashLead\(leadId, staff, undefined, "panel"\)/);
  assert.match(actions, /if \(decision\.answer === "won"\) redirect\(myHref\.project\(parsed\.leadId\)\)/, "«Выиграли» — сразу «Завести проект»");
  for (const code of new Set([...actions.matchAll(/"((?:no_|fail)[a-z_]*|taken|trashed|skipped|term)"/g)].map((m) => m[1]))) {
    assert.ok(Object.hasOwn(toastDict, `done_${code}`), `нет текста плашки для «${code}»`);
  }
  // Вход — с «Лидов».
  assert.match(read("app/admin/page.tsx"), /href="\/admin\/leads\/sort"/);
});

test("экран остаётся на месте, результат — плашкой сверху на 2–3 секунды, во всей панели", () => {
  const keep = read("components/admin/keep-place.tsx");
  assert.match(keep, /document\.addEventListener\("submit", onSubmit, true\)/, "место запоминается перед любой формой");
  assert.match(keep, /saved\.path === location\.pathname/, "возвращаем только на ту же страницу");
  assert.match(keep, /const SHOW_MS = 2600;/);
  assert.match(keep, /\[data-result\]/, "текст — из строки результата, что рисует страница");
  assert.match(read("components/admin/shell.tsx"), /<KeepPlace \/>/);
  assert.match(read("app/admin/leads/[id]/page.tsx"), /data-result=\{result === "ok"/);
  const css = read("app/globals.css");
  assert.match(css, /@keyframes os-toast/);
  assert.match(css, /prefers-reduced-motion: reduce\) \{\s*\.os-toast \{\s*animation: none;/);
});
