/**
 * Данные сотрудника в «Команде»: ФИО, имя в панели, username, телефон.
 *
 * Владелец, 05.10.2026: «Сделай возможность в разделе „Команда“ менять ФИО
 * и данные по сотрудникам. Менять может руководитель и я».
 *
 * Запуск: npm test
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { editsStaff } from "@/lib/admin/roles";
import { staffDetailsFrom } from "@/lib/admin/team";

const read = (file: string) => readFileSync(new URL(`../${file}`, import.meta.url), "utf8");

const form = { fullName: "", displayName: "Динара", username: "", phone: "" };

test("правит владелец — всех, руководитель — себя и менеджеров, менеджер — никого", () => {
  assert.ok(editsStaff("admin", "manager", false));
  assert.ok(editsStaff("admin", "head", false));
  assert.ok(editsStaff("admin", "admin", true), "владелец — и себя");
  assert.ok(editsStaff("head", "manager", false));
  assert.ok(editsStaff("head", "head", true), "руководитель — себя");
  assert.ok(!editsStaff("head", "head", false), "второго руководителя — нет");
  assert.ok(!editsStaff("head", "admin", false), "владельца — нет");
  assert.ok(!editsStaff("manager", "manager", true), "менеджер своих данных не правит");
  assert.ok(!editsStaff("manager", "manager", false));
});

test("данные приводятся к общему виду: @ без «@», телефон с кодом страны", () => {
  const ok = staffDetailsFrom({
    fullName: "  Каримова   Динара  Рустамовна ",
    displayName: " Динара ",
    username: "@dnr_0110",
    phone: "90 123 45 67",
  });
  assert.deepEqual(ok, {
    ok: true,
    details: { full_name: "Каримова Динара Рустамовна", display_name: "Динара", username: "dnr_0110", phone: "+998901234567" },
  });
  const link = staffDetailsFrom({ ...form, username: "https://t.me/Nultime", phone: "+7 (923) 233-00-37" });
  assert.ok(link.ok);
  assert.equal(link.ok && link.details.username, "Nultime");
  assert.equal(link.ok && link.details.phone, "+79232330037");
  // Пустое необязательное — null, а не пустая строка.
  const empty = staffDetailsFrom(form);
  assert.deepEqual(empty.ok && empty.details, { full_name: null, display_name: "Динара", username: null, phone: null });
});

test("пустое имя, кривой username или телефон — не сохраняются", () => {
  assert.deepEqual(staffDetailsFrom({ ...form, displayName: "  " }), { ok: false, reason: "name_empty" });
  assert.deepEqual(staffDetailsFrom({ ...form, username: "Владислав" }), { ok: false, reason: "username_bad" });
  assert.deepEqual(staffDetailsFrom({ ...form, username: "ab" }), { ok: false, reason: "username_bad" });
  assert.deepEqual(staffDetailsFrom({ ...form, phone: "12-34" }), { ok: false, reason: "phone_bad" });
  assert.deepEqual(staffDetailsFrom({ ...form, phone: "звонить секретарю" }), { ok: false, reason: "phone_bad" });
});

test("права проверяются в действии и в базе, а имя переписывается у лидов", () => {
  const action = read("app/admin/team/actions.ts");
  assert.match(action, /export async function saveDetails\(formData: FormData\) \{\s*const actor = await requireRole\("admin", "head"\);/);
  assert.match(action, /if \(!editsStaff\(actor\.role, target\.role, target\.id === actor\.id\)\) back\(\{ ok: false, reason: "forbidden" \}\);/);

  const lib = read("lib/admin/team.ts");
  assert.match(lib, /if \(!editsStaff\(actor\.role, target\.role as Role, target\.id === actor\.id\)\) return \{ ok: false, reason: "forbidden" \};/);
  // «Кто ведёт» у лидов — копия имени: её переписываем вместе с ним.
  assert.match(lib, /\.from\("leads"\)\.update\(\{ assigned_to: handle \}\)\.eq\("assigned_staff_id", staffId\)/);
  assert.match(lib, /await record\("staff\.updated"/);

  const page = read("app/admin/team/page.tsx");
  assert.match(page, /\{editsStaff\(viewer\.role, member\.role, member\.id === viewer\.id\) \? \(\s*<DetailsBlock member=\{member\} t=\{t\} \/>/);

  const migration = read("supabase/migrations/0087_staff_details.sql");
  assert.match(migration, /add column if not exists full_name text/);
  assert.match(migration, /add column if not exists phone text/);
});
