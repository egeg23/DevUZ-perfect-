/**
 * «Кто это» у лида, добавленного вручную: клиент, агентство или блогер.
 * Владелец, 09.11.2026: «Когда вручную добавляем лидов в панели нашей —
 * сделай возможность выбрать: клиент / агентство или блоггер».
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { leadPartyDict } from "@/content/admin-panel/lead-add";
import { manualLeadRow, parseManualLead } from "@/lib/admin/lead-add";
import { LEAD_PARTIES, PARTY_HOME, partyOf } from "@/lib/admin/lead-party";
import { LIST_COLUMNS } from "@/lib/admin/leads";
import { SECTIONS } from "@/lib/admin/roles";

const read = (path: string) => readFileSync(path, "utf8");
const form = { name: "Азиз", company: "MediaPro", contact: "@mediapro_uz", need: "", from: "выставка" };

test("три варианта, по умолчанию клиент; непонятное из формы — клиент", () => {
  assert.deepEqual([...LEAD_PARTIES], ["client", "agency", "blogger"]);
  assert.equal(partyOf("agency"), "agency");
  assert.equal(partyOf("blogger"), "blogger");
  for (const bad of [undefined, "", "admin", "AGENCY", 3]) assert.equal(partyOf(bad), "client", String(bad));
  const parsed = parseManualLead(form);
  assert.ok(parsed.ok);
  assert.equal(parsed.lead.party, "client", "поле не пришло — клиент");
});

test("выбор пишется в строку лида и в заметку, журнал знает, кто это", () => {
  const parsed = parseManualLead({ ...form, party: "agency" });
  assert.ok(parsed.ok);
  const row = manualLeadRow(parsed.lead, { id: "s1", username: "aziz", display_name: "Азиз" }, { display_name: "Егор" }, "DZ-1", "2026-11-09T10:00:00Z");
  assert.equal(row.party, "agency");
  assert.match(String(row.notes), /Кто это: агентство\./);
  assert.match(read("lib/admin/lead-add.ts"), /party: parsed\.lead\.party/);
  assert.match(read("app/admin/actions.ts"), /party: text\("party"\)/);
});

test("форма, список и карточка показывают выбор; куда завести — разделы, которые есть", () => {
  const formSource = read("components/admin/lead-add.tsx");
  assert.match(formSource, /type="radio" name="party"/);
  assert.match(formSource, /defaultChecked=\{party === "client"\}/);
  assert.ok(LIST_COLUMNS.split(", ").includes("party"), "список берёт колонку");
  assert.match(read("components/admin/lead-table.tsx"), /partyOf\(lead\.party\) !== "client"/);
  const card = read("app/admin/leads/[id]/page.tsx");
  assert.match(card, /opens\(staff, PARTY_HOME\[/, "ссылка — только в открытый раздел");
  for (const href of Object.values(PARTY_HOME)) assert.ok(SECTIONS.some((s) => s.href === href), href);
  for (const key of ["party", "client", "agency", "blogger", "hintAgency", "hintBlogger"] as const) assert.ok(leadPartyDict[key].uz, key);
  const sql = read("supabase/migrations/0183_lead_party.sql");
  assert.match(sql, /party text not null default 'client'/);
  assert.match(sql, /check \(party in \('client', 'agency', 'blogger'\)\)/);
});
