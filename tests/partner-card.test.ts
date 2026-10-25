/**
 * Карточка партнёра в «Партнёрах» (lib/partners/card.ts): каких клиентов он
 * привёл и где каждый сейчас.
 *
 * Владелец, 25.10.2026: «Сделай так, чтобы я и руководители могли нажать на
 * партнёра и посмотреть, каких клиентов он завёл».
 *
 * Запуск: npm test
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { helpTopicFor } from "@/lib/admin/help";
import { cardRows, projectsWithoutLead, stageCounts, type CardLead } from "@/lib/partners/card";
import type { ProjectWithPartner, Referral } from "@/lib/partners/store";

const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

const referral = (over: Partial<Referral>): Referral => ({
  leadId: "l1",
  createdAt: "2026-10-20T10:00:00Z",
  who: null,
  linkLabel: null,
  agencyName: null,
  clientName: null,
  stage: "lead",
  voidReason: null,
  accrual: null,
  ...over,
});

const lead = (id: string, over: Partial<CardLead> = {}): CardLead => ({
  id,
  requestNo: `DZ-${id}`,
  company: null,
  contactName: null,
  status: "new",
  ownerId: null,
  ...over,
});

test("строка клиента: имя — компания, иначе имя из заявки, иначе номер; откуда — агентство, закрепление, метка", () => {
  const rows = cardRows(
    [
      referral({ leadId: "a", who: "Магнат" }),
      referral({ leadId: "b", agencyName: "Agency X", linkLabel: "Instagram" }),
      referral({ leadId: "c", clientName: "Флора", linkLabel: "Instagram" }),
      referral({ leadId: "d", linkLabel: "Instagram" }),
    ],
    new Map([
      ["a", lead("a", { company: "ООО Магнат", ownerId: "s1", status: "in_progress" })],
      ["b", lead("b", { contactName: "Дина" })],
      ["c", lead("c")],
    ]),
    new Map([["a", { id: "p1", title: "Сайт Магнат" }]]),
  );
  assert.deepEqual(
    rows.map((r) => [r.who, r.via]),
    [
      ["ООО Магнат", null],
      ["Дина", "Agency X"],
      ["DZ-c", "Флора"],
      ["—", "Instagram"],
    ],
  );
  assert.equal(rows[0].ownerId, "s1");
  assert.equal(rows[0].projectId, "p1");
  assert.equal(rows[1].projectId, null);
});

test("проекты, засчитанные руками без заявки партнёра, видны отдельно; этапы считаются", () => {
  const rows = cardRows(
    [referral({ leadId: "a", stage: "paid" }), referral({ leadId: "b", stage: "lost" }), referral({ leadId: "c", stage: "work" })],
    new Map(),
    new Map([["a", { id: "p1", title: "" }]]),
  );
  const projects = [{ id: "p1" }, { id: "p2" }] as ProjectWithPartner[];
  assert.deepEqual(projectsWithoutLead(projects, rows).map((p) => p.id), ["p2"]);
  const counts = stageCounts(rows);
  assert.equal(counts.paid, 1);
  assert.equal(counts.lost, 1);
  assert.equal(counts.work, 1);
  assert.equal(counts.lead, 0);
});

test("карточка — в разделе «Партнёры»: тот же доступ, имя в списке ведёт в неё, инструкция — свой пункт", () => {
  const page = read("app/admin/partners/[id]/page.tsx");
  assert.match(page, /requireSection\("\/admin\/partners"\)/, "владелец и руководитель, как весь раздел");
  assert.match(page, /href=\{`\/admin\/leads\/\$\{row\.leadId\}`\}/, "клиент — в карточку лида");
  assert.match(read("lib/partners/card-store.ts"), /referralsOf\(summary\)/, "этапы — те же, что видит партнёр");
  assert.match(read("app/admin/partners/page.tsx"), /href=\{`\/admin\/partners\/\$\{partner\.id\}`\}/);
  assert.match(helpTopicFor("/admin/partners/0b8e4d4e-1111-4222-8333-444455556666") ?? "", /partners-card/);
  assert.match(helpTopicFor("/admin/partners/promo") ?? "", /partners-promo/);
});
