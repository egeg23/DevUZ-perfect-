import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { SYSTEM_HREF, attentionHref, attentionOf, hrefTo, leadsPulse, type AttentionInput, type AttentionKind } from "@/lib/admin/hq";

/**
 * Правки владельца после первого просмотра «Главной» на телефоне, 14.10.2026:
 * «Поставить задачу» из карточки отмечает человека; строка «Требует
 * внимания» ведёт в конкретное, а не в общий список; нажатие видно сразу.
 */

const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");
const NOW = new Date("2026-10-14T10:00:00Z");
const ahead = (h: number) => new Date(NOW.getTime() + h * 3600_000).toISOString();

/** Адрес конкретной сущности, а не списка. */
const CONCRETE = [
  /^\/admin\/leads\/[0-9a-z-]+$/,
  /^\/admin\/tasks\/[0-9a-z-]+$/,
  /^\/admin\/accounts#account-[0-9a-z-]+$/,
  /^\/admin\/mockups#mockup-[0-9a-z-]+$/,
  /^\/admin\/contracts\/[0-9a-z-]+$/,
  /^\/admin\/prospect\?open=[0-9a-z-]+#p-[0-9a-z-]+$/,
];

const lead = (id: string) => ({ id, created_at: ahead(-1), status: "new", priority: "hot", assigned_staff_id: null, label: id });

function everything(n: number): AttentionInput {
  const many = (p: string) => Array.from({ length: n }, (_, i) => ({ id: `${p}${i}`, label: `${p}${i}` }));
  return {
    role: "admin",
    now: NOW,
    sweep: null,
    autopilotTrouble: null,
    bans: [{ key: "main", account: "Главный", until: Date.parse(ahead(2)) }],
    circlesMissing: { ru: many("acc"), uz: [] },
    circleFallback: many("pr"),
    leads: leadsPulse(Array.from({ length: n }, (_, i) => lead(`lead${i}`)), [], [], NOW),
    burned: many("lb"),
    overdue: many("task"),
    stale: many("ls"),
    transfers: many("lt"),
    contracts: many("ct"),
    ending: many("p:mock"),
    firecrawlRemaining: null,
  };
}

test("каждая строка с сущностью ведёт в конкретную карточку; несколько — список, каждый пункт в свою", () => {
  const entityKinds = new Set<AttentionKind>([
    "ban",
    "circle",
    "circleFallback",
    "unowned",
    "burned",
    "overdue",
    "stale",
    "transfers",
    "contracts",
    "ending",
  ]);
  for (const n of [1, 3]) {
    const items = attentionOf(everything(n));
    const kinds = new Set(items.map((a) => a.kind));
    for (const k of entityKinds) assert.ok(kinds.has(k), `${k}: строки нет`);
    for (const a of items) {
      if (SYSTEM_HREF[a.kind]) continue;
      assert.ok(a.links.length > 0, `${a.kind}: нет ни одной ссылки на сущность`);
      for (const link of a.links) {
        assert.ok(CONCRETE.some((re) => re.test(link.href)), `${a.kind}: «${link.href}» — это не конкретная карточка`);
      }
      const href = attentionHref(a);
      if (a.links.length === 1) assert.equal(href, a.links[0].href, `${a.kind}: одна штука — строка и есть ссылка`);
      else assert.equal(href, null, `${a.kind}: несколько — раскрывается списком`);
    }
  }
  assert.equal(hrefTo.mockup("p:1f2e"), "/admin/mockups#mockup-p-1f2e");
});

test("якоря есть там, куда ведут ссылки", () => {
  assert.match(read("app/admin/accounts/page.tsx"), /id=\{`account-\$\{MAIN_ACCOUNT\}`\}/);
  assert.match(read("app/admin/accounts/page.tsx"), /id=\{`account-\$\{a\.id\}`\}/);
  assert.match(read("components/admin/mockup-list.tsx"), /id=\{`mockup-\$\{row\.ref\.replace\(/);
  assert.match(read("components/admin/autopilot-panel.tsx"), /id="autopilot"/);
  // Задача — своя карточка с историей, видна тому же, кто видит её в истории.
  const card = read("app/admin/tasks/[id]/page.tsx");
  assert.match(card, /const card = await taskCard\(id, \{ id: staff\.id, role: staff\.role \}\);/);
  assert.match(read("lib/admin/task-store.ts"), /if \(!seesTask\(task, viewer, ownerIds\)\) return null;/);
});

test("«Поставить задачу» из карточки: форма заново с отмеченным человеком, на экране, курсор в «Что сделать»", () => {
  assert.match(read("components/admin/hq-side.tsx"), /<HqTask key=\{preselect \?\? "none"\}/);
  const form = read("components/admin/hq-task.tsx");
  assert.match(form, /defaultChecked=\{p\.id === preselect\}/);
  assert.match(form, /section\?\.scrollIntoView\(/);
  assert.match(form, /title\.current\?\.focus\(/);
  assert.match(form, /<input ref=\{title\} name="title"/);
});

test("нажатие видно сразу: пункт меню подсвечен до ответа, точка ожидания, полоса загрузки, :active", () => {
  const link = read("components/admin/nav-link.tsx");
  assert.match(link, /setPressedAt\(pathname\)/);
  assert.match(link, /const here = sectionOfHref\(pathname \?\? ""\);/);
  // Пункт горит и на своих вкладках (lib/admin/nav.ts, tabsOf): открыты «Договоры» — горят «Проекты».
  assert.match(link, /const active = here === href \|\| \(here !== null && also\.includes\(here\)\) \|\| pressed;/);
  assert.match(link, /<LinkPending \/>/);
  assert.match(read("components/admin/link-pending.tsx"), /const \{ pending \} = useLinkStatus\(\);/);
  // Меню группами и меню телефона рисуют пункты этим же компонентом.
  const menu = read("components/admin/nav-menu.tsx");
  assert.ok((menu.match(/<AdminNavLink /g) ?? []).length >= 3);
  assert.match(read("components/admin/shell.tsx"), /<NavProgress \/>/);
  assert.match(read("components/admin/nav-progress.tsx"), /document\.addEventListener\("click", onClick, true\)/);
  assert.match(read("app/globals.css"), /\.admin-panel :is\(a, button, summary, label\):active \{/);
  // «Отдать» — кнопкой с ожиданием, как все формы панели.
  assert.match(read("components/admin/hq.tsx"), /<SubmitButton base="min-h-11 rounded-xl px-4 text-sm font-semibold" pendingLabel=\{t\.giving\}>/);
});
