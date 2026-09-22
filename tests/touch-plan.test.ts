import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import {
  TOUCH_PLAN_MAX,
  parseTouchPlan,
  planLine,
  touchProgress,
  weekWindow,
} from "@/lib/admin/touch-plan";

const ROOT = new URL("../", import.meta.url);
const read = (file: string) => readFileSync(new URL(file, ROOT), "utf8");

/**
 * Недельный план касаний.
 *
 * Менеджеры пишут со своих аккаунтов — подключить всех к одной сессии
 * Telegram нельзя, — и по очереди отправки видно только то, что ушло от
 * студии. Значит, счёт держится на отметке «связался сам», а план — на том,
 * что руководитель поставил в «Сотрудниках».
 */

test("плана нет — и требовать нечего", () => {
  const p = touchProgress(null, 7);
  assert.equal(p.plan, null);
  assert.equal(p.done, 7);
  // Ноль и «не задан» — разные вещи: «осталось 0 из 0» тому, кому план не
  // ставили, это неправда, а не пустая строка.
  assert.equal(p.left, null);
  assert.equal(planLine(p), null, "человеку без плана панель говорит лишнее");
});

test("осталось считается до нуля, а не в минус", () => {
  assert.equal(touchProgress(30, 18).left, 12);
  assert.equal(touchProgress(30, 30).left, 0);
  assert.equal(touchProgress(30, 41).left, 0, "перевыполнение ушло в отрицательный долг");
});

test("строка плана одна на главную и на касания", () => {
  assert.match(planLine(touchProgress(30, 18)) ?? "", /осталось 12/);
  assert.match(planLine(touchProgress(30, 18)) ?? "", /18 из 30/);
  assert.match(planLine(touchProgress(30, 30)) ?? "", /закрыт/);
  assert.match(planLine(touchProgress(30, 41)) ?? "", /закрыт/);
});

test("пустое поле снимает план, мусор не сохраняется", () => {
  // Стирание поля — единственный способ снять план, который руководитель
  // попробует; если он не сработает, план останется навсегда.
  assert.deepEqual(parseTouchPlan("   "), { ok: true, plan: null });
  assert.deepEqual(parseTouchPlan("30"), { ok: true, plan: 30 });
  assert.equal(parseTouchPlan("тридцать").ok, false);
  assert.equal(parseTouchPlan("-5").ok, false);
  assert.equal(parseTouchPlan(String(TOUCH_PLAN_MAX + 1)).ok, false);

  // Потолок в коде и в проверке базы обязан быть одним: разойдясь, они
  // отдали бы форму, которая молча не сохраняется.
  assert.match(
    read("supabase/migrations/0043_touch_plan.sql"),
    new RegExp(`touch_plan <= ${TOUCH_PLAN_MAX}`),
  );
});

test("неделя начинается в понедельник по Ташкенту", () => {
  // Вторник 22 сентября, полдень по Гринвичу — значит неделя началась в
  // понедельник 21-го в полночь по Ташкенту, то есть в 19:00 UTC двадцатого.
  const week = weekWindow(new Date("2026-09-22T12:00:00Z"));
  assert.equal(week.from.toISOString(), "2026-09-20T19:00:00.000Z");
  assert.equal(week.to.toISOString(), "2026-09-27T19:00:00.000Z");

  // Воскресенье 23:00 по Ташкенту — ещё та неделя, понедельник 00:30 — уже
  // следующая. Считать по UTC значило бы переносить касания через границу
  // недели пять часов подряд каждое воскресенье.
  const sundayLate = weekWindow(new Date("2026-09-27T18:00:00Z"));
  assert.equal(sundayLate.from.toISOString(), "2026-09-20T19:00:00.000Z");
  const mondayEarly = weekWindow(new Date("2026-09-27T19:30:00Z"));
  assert.equal(mondayEarly.from.toISOString(), "2026-09-27T19:00:00.000Z");
});

test("касание записывается на того, кто написал, а не на того, кто взял", () => {
  const store = read("lib/admin/outreach-store.ts");

  // claimed_by ставится на подготовке письма и остаётся, даже если письмо
  // так и не ушло: она отвечает на «кто взял». Считать по ней значило бы
  // записать касание тому, кто подготовил.
  assert.match(store, /touched_by: staff\.id/);
  assert.match(store, /touched_at: when/, "у отметки «связался сам» нет времени");

  const counts = read("lib/admin/touch-store.ts");
  assert.match(counts, /\.neq\("status", "failed"\)/, "несостоявшиеся отправки идут в план");
  assert.match(counts, /touched_at/, "счёт идёт не по времени касания");
});

test("«связался сам» доступен до того, как что-то отправлено", () => {
  const store = read("lib/admin/outreach-store.ts");
  const list = read("components/admin/outreach-list.tsx");

  // Связаться можно и до того, как модель написала письмо: менеджер пишет со
  // своего аккаунта, и панель об этом узнаёт только отметкой.
  assert.match(store, /SELF_CONTACT_FROM = \["new", "contacting", "manual"\]/);

  // Контакты не проверяются: человек уже написал, и спорить с фактом,
  // потому что аудитор не нашёл на сайте телефон, панели не по чину.
  const fn = store.slice(store.indexOf("export async function markSelfContacted"));
  assert.ok(!/canContact\(/.test(fn.slice(0, 1200)), "отметка упирается в наши же находки");

  assert.match(list, /row\.status === "new" \|\| row\.status === "contacting"/);
  assert.match(list, /Связался сам/);
});

test("план ставит руководитель, а видит его менеджер", () => {
  const team = read("lib/admin/team.ts");
  // Руководитель — только своим: иначе он второй владелец.
  assert.match(team, /actor\.role !== "admin" && target\.head_staff_id !== actor\.id/);

  assert.match(read("app/admin/team/page.tsx"), /План касаний/, "план негде поставить");
  // Обе страницы, где менеджер работает: главная и сами касания.
  assert.match(read("app/admin/page.tsx"), /TouchPlanLine/);
  assert.match(read("app/admin/prospect/page.tsx"), /TouchPlanLine/);
});
