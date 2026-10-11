import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { weekStats } from "@/components/ads/board";
import { explain } from "@/lib/ads/explain";
import { recentlyMoved, syncNotice } from "@/lib/ads/run";
import type { Account, Action, Proposal } from "@/lib/ads/store";
import { canSee } from "@/lib/admin/roles";

/**
 * Кабинет автопилота: кто его видит, как он подключён к свипу и боту, и что
 * узбекский и польский читатель видит предложение на своём языке.
 */

const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");

test("раздел «Реклама» — владельцу и руководителю, не менеджеру", () => {
  assert.ok(canSee("admin", "/admin/ads"));
  assert.ok(canSee("head", "/admin/ads"));
  assert.ok(!canSee("manager", "/admin/ads"));
  // Страницы и действия проверяют сами, а не только меню.
  assert.match(read("app/admin/ads/page.tsx"), /requireRole\("admin", "head"\)/);
  assert.match(read("app/admin/ads/[account]/page.tsx"), /requireRole\("admin", "head"\)/);
  assert.match(read("lib/ads/access.ts"), /staff\.role !== "admin" && staff\.role !== "head"/);
});

test("каждое действие кабинета само проверяет права", () => {
  const code = read("app/ads/actions.ts");
  const actions = [...code.matchAll(/export async function (\w+)\(formData: FormData\) \{\n([^]*?)\n\}/g)];
  assert.ok(actions.length >= 12, `нашлось ${actions.length}`);
  for (const [, name, body] of actions) {
    assert.match(body, /await account\(formData\)|canUseWorkspace|staffAdsActor/, `${name} не проверяет, кто нажал`);
  }
  // Заглушку и людей заводит только студия.
  assert.match(code, /platform === "stub" && actor\.kind !== "staff"/);
});

test("фоновый проход — после ответа таймеру, за флагом", () => {
  const sweep = read("app/api/reminders/sweep/route.ts");
  assert.match(sweep, /after\(async \(\) => \{\n\s+const ads = await runAdsPass/);
  assert.match(read("lib/ads/run.ts"), /if \(!\(await adsEnabled\(\)\)\) return/);
});

test("бот: ссылка входа только участнику, посторонний — как незнакомый payload", () => {
  const hook = read("app/api/telegram/webhook/route.ts");
  assert.match(hook, /payload === "ads" && identity && \(await handleAdsLogin\(chat\.id, identity\.id\)\)\) return;/);
  assert.match(read("lib/ads/bot.ts"), /if \(!member\) return false;/);
  assert.match(read("middleware.ts"), /pathname\.startsWith\("\/ads\/"\)\) return NextResponse\.next\(\)/);
});

test("ключи клиента не уходят из базы в страницу", () => {
  const store = read("lib/ads/store.ts");
  // В карточку кабинета — только признак «ключ есть».
  assert.match(store, /has_credentials: Boolean\(credentials_enc\)/);
  for (const file of ["components/ads/board.tsx", "app/ads/page.tsx", "app/admin/ads/page.tsx"]) {
    assert.doesNotMatch(read(file), /credentials_enc|refresh_token|access_token/, file);
  }
});

const proposal = (payload: Proposal["payload"], numbers: Proposal["numbers"]): Proposal =>
  ({ id: 1, account_id: "a", kind: payload.kind, status: "new", title: "Минус-слова", why: "по-русски", numbers, payload, created_at: "", decided_at: null, decided_by: null, error: null }) as Proposal;

test("предложение на узбекском и польском — без русских слов вне кавычек", () => {
  const list = [
    proposal({ kind: "negatives", campaignId: "1", campaignName: "Английский", phrases: ["бесплатно", "скачать"] }, { wasted: 1_260_000, clicks: 84 }),
    proposal({ kind: "budget", moves: [{ campaignId: "1", campaignName: "IT", from: 400_000, to: 340_000 }, { campaignId: "2", campaignName: "Англ", from: 300_000, to: 360_000 }] }, { amount: 60_000, confidence: 0.97 }),
    proposal({ kind: "ad_test", campaignId: "1", adGroupId: "g", controlAdId: "a", copy: { headlines: ["Курсы", "Группы"], descriptions: ["Текст"], url: "https://x.uz" }, lang: "ru" }, { impressions: 2000 }),
    proposal({ kind: "ad_winner", testId: 1, loserAdId: "a", winnerAdId: "b" }, { probability: 0.96 }),
  ];
  for (const p of list) {
    assert.equal(explain(p, "ru", "UZS").why, "по-русски");
    for (const locale of ["uz", "pl"] as const) {
      const { title, why } = explain(p, locale, "UZS");
      const bare = `${title} ${why}`.replace(/«[^»]*»/g, "");
      assert.doesNotMatch(bare, /[а-яё]/i, `${locale}/${p.kind}: ${bare}`);
    }
  }
});

test("уведомление после прохода: что применено и что ждёт; пусто — молчим", () => {
  const account = { name: "Учебный центр", external_id: "" } as Account;
  const created = [{ title: "Минус-слова: 4 в «Английский»" }] as Proposal[];
  assert.equal(syncNotice(account, [], { accountId: "a", created: 0, applied: 0, refused: [] }, "ru"), null);
  assert.match(syncNotice(account, created, { accountId: "a", created: 1, applied: 0, refused: [] }, "ru")!, /Ждут вашего решения: 1/);
  assert.match(syncNotice(account, created, { accountId: "a", created: 1, applied: 1, refused: [] }, "uz")!, /O‘zi qo‘lladi: 1/);
});

test("бюджет кампании — не чаще раза в 3 дня; неделя — без откатов и настроек", () => {
  const now = new Date("2026-10-10T10:00:00Z");
  const action = (kind: string, at: string, extra: Partial<Action> = {}): Action =>
    ({ id: 1, account_id: "a", proposal_id: 7, kind, actor: "x", auto: false, why: "", before: {}, after: { budgets: [{ campaignId: "101", amount: 1 }] }, at, rolled_back_at: null, rollback_of: null, ...extra }) as Action;
  assert.deepEqual([...recentlyMoved([action("budget", "2026-10-08T10:00:00Z")], now)], ["101"]);
  assert.deepEqual([...recentlyMoved([action("budget", "2026-10-06T10:00:00Z")], now)], []);

  const week = weekStats(
    [
      action("negatives", "2026-10-09T10:00:00Z"),
      action("settings", "2026-10-09T10:00:00Z"),
      action("negatives", "2026-10-09T11:00:00Z", { rollback_of: 1 }),
      action("budget", "2026-09-01T10:00:00Z"),
    ],
    [{ id: 7, numbers: { monthly: 900_000 } } as unknown as Proposal],
    2,
    now.getTime(),
  );
  assert.deepEqual(week, { applied: 1, saved: 900_000, waiting: 2 });
});

test("сбой обновления — одно сообщение людям кабинета, на узбекском без русских слов", async () => {
  const { failureNotice } = await import("@/lib/ads/run");
  const ru = failureNotice({ name: "Учебный центр", external_id: "" }, "Директ: Ошибка авторизации", "ru");
  assert.match(ru, /не обновился/);
  assert.match(ru, /«Подключить заново»/);
  const uz = failureNotice({ name: "X", external_id: "" }, "token revoked", "uz");
  assert.doesNotMatch(uz.replace(/«[^»]*»/g, ""), /[а-яё]/i);
  // Сказать один раз: только при переходе в сбой, а не каждые сутки.
  const run = read("lib/ads/run.ts");
  assert.match(run, /if \(account\.status !== "error"\) await notifyFailure/);
  assert.match(run, /if \(account\.status !== "disconnected"\) await notifyFailure/);
});

test("после подключения кабинета первое обновление — сразу, фоном", () => {
  const callback = read("app/api/ads/oauth/[platform]/callback/route.ts");
  assert.match(callback, /after\(async \(\) => \{\n\s+const fresh = await accountById/);
});
