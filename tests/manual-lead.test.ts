/**
 * Лид, добавленный вручную.
 *
 * Владелец, 05.10.2026: «В лидах сделай кнопку „добавить лид вручную“, чтобы
 * мы могли добавлять клиентов руками не в проект, а в лидах».
 *
 * Запуск: npm test
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { leadChannelDict } from "@/content/admin-panel/lead-origin";
import { contactOf, manualLeadRow, parseManualLead } from "@/lib/admin/lead-add";

const read = (file: string) => readFileSync(new URL(`../${file}`, import.meta.url), "utf8");

test("контакт — в том виде, по которому клиента потом найдут", () => {
  assert.deepEqual(contactOf("+998 (90) 123-45-67"), { contact: "+998901234567", kind: "phone" });
  assert.deepEqual(contactOf("90 123 45 67"), { contact: "+998901234567", kind: "phone" }, "9 цифр — номер Узбекистана");
  assert.deepEqual(contactOf("+7 923 233-00-37"), { contact: "+79232330037", kind: "phone" });
  assert.deepEqual(contactOf("@Akbar_Shop"), { contact: "@Akbar_Shop", kind: "telegram" });
  assert.deepEqual(contactOf("https://t.me/akbar_shop"), { contact: "@akbar_shop", kind: "telegram" });
  assert.deepEqual(contactOf("Info@Clinic.UZ"), { contact: "info@clinic.uz", kind: "email" });
  assert.deepEqual(contactOf("через секретаря Нодиру"), { contact: "через секретаря Нодиру", kind: "none" }, "непонятное — как написали");
});

test("без имени и без контакта лид не добавляется", () => {
  const form = { name: "  ", company: "", contact: "+998901234567", need: "", from: "" };
  assert.deepEqual(parseManualLead(form), { ok: false, reason: "no_name" });
  assert.deepEqual(parseManualLead({ ...form, name: "Нодира", contact: " " }), { ok: false, reason: "no_contact" });
  const ok = parseManualLead({ ...form, name: " Нодира ", company: "Dental Pro", need: "Сайт для клиники" });
  assert.ok(ok.ok);
  assert.equal(ok.ok && ok.lead.name, "Нодира");
});

test("лид сразу в работе у выбранного, с пометкой, что добавлен вручную", () => {
  const parsed = parseManualLead({
    name: "Нодира",
    company: "Dental Pro",
    contact: "90 123 45 67",
    need: "Сайт для клиники, до конца месяца",
    from: "рекомендация",
  });
  assert.ok(parsed.ok);
  if (!parsed.ok) return;
  const row = manualLeadRow(
    parsed.lead,
    { id: "m1", username: "dnr_0110", display_name: "Динара" },
    { display_name: "Александр" },
    "DZ-1005-AB12",
    "2026-10-05T07:00:00.000Z",
  );
  assert.equal(row.source, "manual");
  assert.equal(row.status, "taken");
  assert.equal(row.assigned_staff_id, "m1");
  assert.equal(row.assigned_to, "@dnr_0110");
  assert.equal(row.assigned_at, "2026-10-05T07:00:00.000Z");
  assert.equal(row.request_no, "DZ-1005-AB12");
  assert.equal(row.contact_handle, "+998901234567");
  assert.equal(row.contact_kind, "phone");
  assert.equal(row.company, "Dental Pro");
  assert.equal((row.summary as { request: string }).request, "Сайт для клиники, до конца месяца");
  assert.match(String(row.notes), /Добавлен вручную: Александр\./);
  assert.match(String(row.notes), /Откуда клиент: рекомендация\./);
  // Поля, которые база требует: без них вставка падает на not null / check.
  for (const key of ["locale", "services", "intent", "score", "grade", "priority", "breakdown", "transcript", "already_told", "avoid_asking"]) {
    assert.ok(row[key] !== undefined, `нет ${key}`);
  }
  assert.ok(["hot", "warm", "nurture", "archive"].includes(String(row.priority)));
});

test("отдать лид другому может только руководитель или владелец", () => {
  const lib = read("lib/admin/lead-add.ts");
  assert.match(lib, /if \(assigneeId && assigneeId !== actor\.id\) \{\s*if \(!approves\(actor\.role\)\) return \{ ok: false, reason: "assignee" \};/);
  // Отключённому не отдать: staffById берёт только активных.
  assert.match(lib, /assignee = await staffById\(assigneeId\);/);
  assert.match(read("lib/admin/session.ts"), /export async function staffById[\s\S]{0,300}\.eq\("is_active", true\)/);
  // Напоминание, журнал и сообщение тому, кому отдали.
  assert.match(lib, /await record\("lead\.added"/);
  assert.match(lib, /await createReminder\(id, assignee,/);
  assert.match(lib, /if \(assignee\.id !== actor\.id\) \{[\s\S]{0,200}await sendMessage\(/);

  const action = read("app/admin/actions.ts");
  assert.match(action, /export async function addLead\(formData: FormData\) \{\s*const staff = await requireStaff\(\);/);
  const page = read("app/admin/page.tsx");
  assert.match(page, /const assignees = approves\(staff\.role\) \? await activeStaff\(\) : \[\];/);
  assert.match(page, /<LeadAdd locale=\{locale\} selfId=\{staff\.id\} assignees=\{assignees\} notice=\{params\.add\} \/>/);
});

test("база принимает источник «manual» — и «partner», который она не знала", () => {
  const migration = read("supabase/migrations/0086_manual_leads.sql");
  assert.match(migration, /check \(source in \([^)]*'partner'[^)]*'manual'\)\)/);
  assert.ok(read("supabase/migrations/0086_manual_leads.down.sql").includes("leads_source_check"));
  // Откуда лид — словами на трёх языках.
  assert.ok(leadChannelDict.manual.ru && leadChannelDict.manual.uz && leadChannelDict.manual.pl);
});

test("форма рисуется на языке панели; выбор «Кому лид» — только когда есть кому отдать", async () => {
  const { createElement } = await import("react");
  const { renderToStaticMarkup } = await import("react-dom/server");
  const { LeadAdd } = await import("@/components/admin/lead-add");
  const people = [
    { id: "me", display_name: "Александр" },
    { id: "m1", display_name: "Динара" },
  ];
  for (const locale of ["ru", "uz", "pl"] as const) {
    const manager = renderToStaticMarkup(createElement(LeadAdd, { locale, selfId: "me", assignees: [] }));
    assert.ok(manager.includes("data-lead-add"));
    assert.ok(!manager.includes('name="assignee"'), `${locale}: менеджер добавляет только себе`);
    const head = renderToStaticMarkup(createElement(LeadAdd, { locale, selfId: "me", assignees: people, notice: "no_contact" }));
    assert.ok(head.includes('name="assignee"'));
    assert.ok(head.includes("open"), `${locale}: с ошибкой форма открыта`);
    if (locale !== "ru") {
      // Кириллица — только в именах сотрудников из базы.
      const text = head.replace(/Александр|Динара/g, "");
      assert.ok(!/[Ѐ-ӿ]/.test(text), `${locale}: русский текст в форме`);
    }
  }
});
