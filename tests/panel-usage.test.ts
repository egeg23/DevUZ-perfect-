/**
 * «Чем пользуется команда» — тихий кастдев для владельца.
 *
 * Владелец: «хочу только для себя видеть, чем менеджеры и руководители
 * пользуются чаще всего — какие функции реально нужны, а какие шум».
 *
 * Здесь три обещания: отчёт видит только владелец; сам владелец в счёт не
 * входит; разделы и функции, которыми не пользовался никто, в отчёте есть —
 * ради них он и строится.
 *
 * Запуск: npm test
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { canSee } from "@/lib/admin/roles";
import {
  FEATURES,
  TRACKED,
  periodOf,
  sectionOf,
  usageReport,
  verdictOf,
  type Person,
} from "@/lib/admin/usage";
import { AUDIT_ACTIONS } from "@/lib/admin/audit";

const ROOT = new URL("../", import.meta.url);
const read = (file: string) => readFileSync(new URL(file, ROOT), "utf8");

test("путь страницы сворачивается в раздел меню", () => {
  assert.equal(sectionOf("/admin"), "/admin");
  assert.equal(sectionOf("/admin/"), "/admin");
  assert.equal(sectionOf("/admin?p=ok"), "/admin");
  assert.equal(sectionOf("/admin/stats"), "/admin/stats");
  assert.equal(sectionOf("/admin/projects/9b1c-uuid"), "/admin/projects");
  // Карточка лида — отдельной строкой: там и идёт работа с лидом.
  assert.equal(sectionOf("/admin/leads/abc"), "/admin/leads");
  // Вход, выход и мусор в адресе в таблицу не попадают.
  assert.equal(sectionOf("/admin/login"), null);
  assert.equal(sectionOf("/admin/enter"), null);
  assert.equal(sectionOf("/admin/unknown"), null);
  assert.equal(sectionOf("/ru/services"), null);
  assert.equal(sectionOf("/admin/STATS"), null);
});

test("каждый раздел, который пишется, проходит проверку в базе", () => {
  // В миграции на колонке section стоит check — раздел, который он не
  // пропустит, молча терял бы просмотры.
  const check = /^\/admin(\/[a-z-]+)?$/;
  for (const t of TRACKED) assert.match(t.href, check, `${t.href} не пройдёт check в базе`);
  assert.match(read("supabase/migrations/0047_panel_usage.sql"), /check \(section ~ '\^\/admin\(\/\[a-z-\]\+\)\?\$'\)/);
});

test("функции собраны только из настоящих действий журнала", () => {
  const known = new Set<string>(AUDIT_ACTIONS);
  const seen = new Set<string>();
  for (const f of FEATURES) {
    for (const a of f.actions) {
      assert.ok(known.has(a), `${f.key}: действия ${a} нет в журнале`);
      assert.ok(!seen.has(a), `${a} посчитано в двух функциях`);
      seen.add(a);
    }
  }
  // Служебное — не выбор сотрудника.
  for (const a of ["login.succeeded", "reminder.sent", "download.served"]) {
    assert.ok(!seen.has(a), `${a} посчитано как функция`);
  }
});

test("ядро — половина и больше, никто — кандидат в шум", () => {
  assert.equal(verdictOf(0, 7), "unused");
  assert.equal(verdictOf(1, 7), "some");
  assert.equal(verdictOf(3, 7), "some");
  assert.equal(verdictOf(4, 7), "core");
  assert.equal(verdictOf(1, 1), "core");
  assert.equal(verdictOf(1, 2), "core");
});

const people: Person[] = [
  { id: "owner", name: "Егор", role: "admin" },
  { id: "h1", name: "Александр", role: "head" },
  { id: "m1", name: "Данил", role: "manager" },
  { id: "m2", name: "Мадина", role: "manager" },
];

test("отчёт: владелец не в счёте, нули на месте, бот отдельно", () => {
  const report = usageReport({
    people,
    views: [
      { day: "2026-09-21", staff_id: "m1", section: "/admin/prospect", views: 5 },
      { day: "2026-09-22", staff_id: "m1", section: "/admin/prospect", views: 2 },
      { day: "2026-09-22", staff_id: "m2", section: "/admin/prospect", views: 1 },
      { day: "2026-09-22", staff_id: "h1", section: "/admin/stats", views: 3 },
      // Владелец — не считается, даже если строка откуда-то взялась.
      { day: "2026-09-22", staff_id: "owner", section: "/admin/talks", views: 40 },
    ],
    prevViews: [{ day: "2026-09-10", staff_id: "m1", section: "/admin/prospect", views: 1 }],
    actions: [
      { action: "lead.taken", actor: "h1", at: "2026-09-22T05:00:00+00:00", via: "telegram" },
      { action: "lead.taken", actor: "m1", at: "2026-09-22T06:00:00+00:00", via: "panel" },
      { action: "login.succeeded", actor: "m2", at: "2026-09-22T04:00:00+00:00", via: null },
      { action: "lead.viewed", actor: "owner", at: "2026-09-22T04:00:00+00:00", via: null },
    ],
    prevActions: [],
  });

  assert.equal(report.team, 3, "владелец посчитан в команду");
  assert.equal(report.active, 3);
  assert.equal(report.views, 11);

  const prospect = report.sections.find((s) => s.href === "/admin/prospect")!;
  assert.equal(prospect.views, 8);
  assert.equal(prospect.people, 2);
  assert.equal(prospect.eligible, 3);
  assert.equal(prospect.days, 2);
  assert.equal(prospect.prevViews, 1);
  assert.equal(prospect.verdict, "core");

  // «Надзор» открывал только владелец — для команды это ноль и «шум?».
  const talks = report.sections.find((s) => s.href === "/admin/talks")!;
  assert.equal(talks.views, 0);
  assert.equal(talks.verdict, "unused");

  // Разделы только владельца в отчёт про команду не попадают.
  assert.ok(!report.sections.some((s) => s.href === "/admin/usage" || s.href === "/admin/audit"));

  // Кандидаты видны только руководителю: доля считается от одного.
  assert.equal(report.sections.find((s) => s.href === "/admin/candidates")?.eligible, 1);

  const take = report.features.find((f) => f.key === "lead-take")!;
  assert.equal(take.count, 2);
  assert.equal(take.people, 2);
  assert.equal(take.viaBot, 1);
  assert.equal(report.features.find((f) => f.key === "lead-open")?.count, 0, "владелец попал в функции");
  assert.ok(report.features.some((f) => f.verdict === "unused"), "нули пропали из отчёта");

  const danil = report.persons.find((p) => p.id === "m1")!;
  assert.equal(danil.views, 7);
  assert.equal(danil.actions, 1);
  assert.equal(danil.activeDays, 2);
  assert.deepEqual(danil.top, ["Касания"]);
  const madina = report.persons.find((p) => p.id === "m2")!;
  assert.equal(madina.logins, 1);
  assert.equal(madina.actions, 0, "вход посчитан как действие");
});

test("период — только 7, 30 или 90 дней", () => {
  assert.equal(periodOf("7"), 7);
  assert.equal(periodOf("90"), 90);
  assert.equal(periodOf(undefined), 30);
  assert.equal(periodOf("365"), 30);
  assert.equal(periodOf("abc"), 30);
});

test("отчёт видит только владелец", () => {
  assert.equal(canSee("admin", "/admin/usage"), true);
  assert.equal(canSee("head", "/admin/usage"), false);
  assert.equal(canSee("manager", "/admin/usage"), false);
  assert.match(read("app/admin/usage/page.tsx"), /const staff = await requireAdmin\(\)/);
});

test("владелец не пишется ни маячком, ни сервером", () => {
  const route = read("app/admin/beacon/route.ts");
  // Кто смотрит — из сессии, а не из тела запроса.
  assert.match(route, /await currentStaff\(\)/);
  assert.match(route, /staff\.role === "admin"\) return done/);
  assert.ok(!/body\.staff|staff_id/.test(route), "автор просмотра берётся из запроса");

  const shell = read("components/admin/shell.tsx");
  assert.match(shell, /staff\.role === "admin" \? null : <UsageBeacon \/>/);

  // Маячок — клиентский и по смене адреса: серверный счёт засчитывал бы
  // предзагрузку ссылок меню как просмотры.
  const beacon = read("components/admin/usage-beacon.tsx");
  assert.match(beacon, /^"use client";/);
  assert.match(beacon, /\[pathname\]/);
  assert.match(beacon, /sendBeacon/);
});

test("маячок стучится туда, куда приходит кука сессии", () => {
  // Кука панели живёт только на /admin. Маячок на /api/usage до 24.09
  // приходил без неё, и ни один просмотр не записался.
  assert.match(read("app/admin/login/actions.ts"), /path: "\/admin"/);
  const beacon = read("components/admin/usage-beacon.tsx");
  assert.match(beacon, /const BEACON = "\/admin\/beacon";/);
  assert.doesNotMatch(beacon, /\/api\/usage/);
});

test("счётчик в базе закрыт от всех, кроме сервера", () => {
  const sql = read("supabase/migrations/0047_panel_usage.sql");
  assert.match(sql, /enable row level security/);
  assert.match(sql, /revoke all on function public\.bump_panel_usage\(uuid, text, date\) from public, anon, authenticated/);
  assert.match(sql, /on conflict \(day, staff_id, section\)\s+do update set views = panel_usage\.views \+ 1/);
});
