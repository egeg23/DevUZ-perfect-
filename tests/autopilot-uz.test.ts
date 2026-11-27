import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import {
  AUTOPILOT_GAP_MS,
  AUTOPILOT_PER_ACCOUNT,
  AUTOPILOT_UZ_ONLY,
  autopilotRoom,
  dayTarget,
  uzbekProspect,
} from "@/lib/admin/autopilot";
import { HELLO_TEXT, sentHello, sentHelloLang } from "@/lib/admin/hello-first";
import { UZ_STYLE, talkNote } from "@/lib/admin/outreach-talk";
import { takesAutopilot } from "@/lib/admin/work-accounts";

test("автопрогон: пять в день с аккаунта, не чаще раза в полтора часа", () => {
  assert.equal(AUTOPILOT_PER_ACCOUNT, 5);
  const now = Date.parse("2026-11-28T10:00:00Z");
  assert.equal(autopilotRoom([], now), true);
  assert.equal(autopilotRoom([now - AUTOPILOT_GAP_MS + 60_000], now), false);
  assert.equal(autopilotRoom([now - AUTOPILOT_GAP_MS], now), true);
  const five = [1, 2, 3, 4, 5].map((h) => now - h * 3 * 3_600_000);
  assert.equal(autopilotRoom(five, now), false);
  assert.equal(dayTarget(2), 10);
  assert.equal(dayTarget(0), 0);
  assert.equal(takesAutopilot("main"), false, "главный автопрогон не берёт");
});

test("автопрогон: только компании Узбекистана — сайт .uz или номер +998", () => {
  const c = (phones: string[] = [], whatsapp: string[] = []) => ({ phones, whatsapp, telegram: [], emails: [] });
  assert.equal(uzbekProspect({ host: "klinika.uz", contacts: c() }), true);
  assert.equal(uzbekProspect({ host: "klinika.ru", contacts: c(["+998901234567"]) }), true);
  assert.equal(uzbekProspect({ host: null, contacts: c([], ["998 90 123-45-67"]) }), true);
  assert.equal(uzbekProspect({ host: "klinika.ru", contacts: c(["+79161234567"]) }), false);
  assert.equal(uzbekProspect({ host: null, contacts: c() }), false);
  const store = readFileSync("lib/admin/autopilot-store.ts", "utf8");
  assert.match(store, /AUTOPILOT_UZ_ONLY \? rows\.filter\(\(r\) => uzbekProspect/);
  assert.match(store, /dayTarget\(await readyAccounts\(db, now\)\)/);
});

test("автопрогон: «Assalomu alaykum» и разговор на узбекском, ручное касание — как было", () => {
  assert.equal(AUTOPILOT_UZ_ONLY, true);
  assert.equal(sentHelloLang({ message: null, walked: { lang: "ru" }, autopilot_at: "2026-11-28T05:00:00Z" }), "uz");
  assert.equal(sentHello({ message: null, walked: { lang: "ru" }, autopilot_at: "2026-11-28T05:00:00Z" }), HELLO_TEXT.uz);
  assert.equal(sentHelloLang({ message: "Ваш сайт", walked: { lang: "ru" }, autopilot_at: null }), "ru");
  const queue = readFileSync("lib/admin/outreach-queue.ts", "utf8");
  assert.match(queue, /hello: sentHello\(data, hellos\)/);
  assert.match(queue, /autopilotRoom\(await autopilotSentToday\(\), now\)/);
  assert.equal((readFileSync("lib/admin/outreach-talk-store.ts", "utf8").match(/sentHelloLang\(\{/g) ?? []).length, 3);
  const base = { host: "klinika.uz", label: null, findings: [], firstMessage: "Assalomu alaykum", managerName: "Mohinur", repliesSoFar: 0 };
  assert.ok(talkNote({ ...base, untilMockup: true }).includes(UZ_STYLE));
  assert.ok(talkNote(base).includes(UZ_STYLE));
  assert.match(UZ_STYLE, /Латиница/);
});
