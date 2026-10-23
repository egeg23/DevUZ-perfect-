import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { FIND_PER_KIND, cleanQuery, contactNeedles, hostOf, ilikeAny, looksLikeContact, mergeHits, type FindHit } from "@/lib/admin/find";
import { leadSearchFilter } from "@/lib/admin/leads";

/**
 * Поиск компаний и лидов в Ctrl+K и в списке «Лидов». Владелец, 23.10.2026,
 * на разбор удобства панели: «Делаем все сразу» — компанию нельзя было
 * найти по названию. Держит: строка из адреса не ломает фильтр базы,
 * менеджер по контакту ищет только среди своих лидов, кто ищет — из куки.
 */

const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");

test("строка поиска: спецсимволы PostgREST вырезаны, короткая — не ищем", () => {
  assert.equal(cleanQuery("a"), null);
  assert.equal(cleanQuery("   "), null);
  assert.equal(cleanQuery("Плов),status.eq.won,(x"), "Плов status.eq.won x");
  assert.ok(!/[,()*%"'`:\\]/.test(cleanQuery('ab,c(d)*e%f"g\'h`i:j\\k') ?? ""));
  assert.equal(cleanQuery("x".repeat(200))?.length, 60);
  assert.equal(leadSearchFilter("a"), null);
  assert.equal(leadSearchFilter("Плов"), "company.ilike.*Плов*,contact_name.ilike.*Плов*,request_no.ilike.*Плов*,niche.ilike.*Плов*");
  assert.ok(!(leadSearchFilter("x),or(status.eq.won") ?? "").includes("("), "скобка из адреса не открывает своё условие");
});

test("контакт: телефон, @ник или почта — с вариантами без @ и только цифры", () => {
  assert.ok(looksLikeContact("@demo_user"));
  assert.ok(looksLikeContact("+998 90 123 45 67"));
  assert.ok(looksLikeContact("a@b.uz"));
  assert.ok(!looksLikeContact("Плов"));
  assert.deepEqual(contactNeedles("@demo"), ["@demo", "demo"]);
  assert.deepEqual(contactNeedles("+998 90 123"), ["+998 90 123", "99890123"]);
  assert.equal(ilikeAny(["a", "b"], ["x"]), "a.ilike.*x*,b.ilike.*x*");
  assert.equal(hostOf("https://www.demo.uz/page"), "demo.uz");
  assert.equal(hostOf("demo.uz"), "demo.uz");
  assert.equal(hostOf(null), null);
});

test("выдача: лиды, потом касания, потом проекты; без повторов и не больше шести каждого", () => {
  const hit = (kind: FindHit["kind"], href: string): FindHit => ({ kind, href, label: href, meta: null });
  const leads = Array.from({ length: 9 }, (_, i) => hit("lead", `/admin/leads/${i}`));
  const merged = mergeHits([[...leads, leads[0]], [hit("prospect", "/admin/leads/1"), hit("prospect", "/admin/prospect?open=p")], [hit("project", "/admin/projects/x")]]);
  assert.equal(merged.filter((h) => h.kind === "lead").length, FIND_PER_KIND);
  assert.deepEqual(merged.slice(-2).map((h) => h.kind), ["prospect", "project"]);
  assert.equal(new Set(merged.map((h) => h.href)).size, merged.length);
});

test("права: круг лидов как в «Лидах», контакт менеджеру — только свои, кто ищет — из куки", () => {
  const store = read("lib/admin/find-store.ts");
  assert.match(store, /const scope = scopeFor\(who\);/);
  assert.match(store, /leadQuery\(\)\.or\(inScope \? `and\(or\(\$\{inScope\}\),or\(\$\{byName\}\)\)` : byName\)/);
  assert.match(store, /scope === "all"\s*\? leadQuery\(\)\.or\(byContact\)\s*: leadQuery\(\)\.eq\("assigned_staff_id", who\.id\)\.or\(byContact\)/);
  assert.match(store, /opens\(who, "\/admin\/prospect"\)/);
  assert.match(store, /opens\(who, "\/admin\/projects"\)/);
  const route = read("app/admin/find/route.ts");
  assert.match(route, /const staff = await currentStaff\(\);/);
  assert.match(route, /status: 401/);
  assert.match(route, /cleanQuery\(/);
  // Окно поиска спрашивает сервер, а не держит списки у себя.
  const menu = read("components/admin/nav-menu.tsx");
  assert.match(menu, /fetch\(`\/admin\/find\?q=\$\{encodeURIComponent\(q\)\}`/);
  assert.doesNotMatch(menu, /from\("leads"\)|serviceClient/);
});
