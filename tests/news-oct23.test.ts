/**
 * Объявления 23.10.2026: менеджерам — что поменялось для них, «было →
 * стало»; владельцу и руководителю — все доработки с 16 по 22 октября.
 *
 * Владелец, 22.10.2026: «Завтра утром сделай рассылку тезисно для менеджеров
 * и для руководителей и меня… Не отсылай им то, что не влияет на их работу.
 * Для меня и руководителей полностью по всем доработкам».
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { appDict } from "@/content/admin-panel/app";
import { hqMyDict } from "@/content/admin-panel/hq-my";
import { leadCardDict } from "@/content/admin-panel/lead-card";
import { loginDict } from "@/content/admin-panel/login";
import { mockupsDict } from "@/content/admin-panel/mockups";
import { salesStagesDict } from "@/content/admin-panel/sales-stages";
import { PROMO } from "@/lib/admin/mockup-offer";
import { REPLY_HOLD_MIN, TAKE_OVER_BUTTON } from "@/lib/admin/reply-heads-up";
import { NEWS, headNewsOct23, newsActive, newsWindow, teamNewsOct23 } from "@/lib/admin/team-news";

const read = (file: string) => readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
const plain = (s: string) => s.replace(/<\/?[bi]>/g, "");
/** Момент по часам Ташкента. */
const tk = (iso: string) => new Date(`${iso}+05:00`);
// Одно сообщение Telegram — до 4096 знаков: длиннее бот режет на части.
const MESSAGE_MAX = 4096;

const heads = NEWS.find((n) => n.id === "2026-10-23-heads-all");
const team = NEWS.find((n) => n.id === "2026-10-23-team");

test("уходит в пятницу 23.10 с 09:00 по Ташкенту, не ночью и не в выходные", () => {
  assert.ok(heads && team);
  assert.deepEqual([...heads.roles].sort(), ["admin", "head"]);
  assert.deepEqual([...team.roles], ["manager"]);
  for (const news of [heads, team]) {
    const window = news.window ?? newsWindow;
    assert.equal(newsActive(news, tk("2026-10-22T23:50:00")), false, "22.10 — ещё рано");
    assert.equal(window(tk("2026-10-23T08:59:00")), false, "08:59 — ждём");
    assert.equal(window(tk("2026-10-23T09:00:00")), true, "09:00, пятница");
    assert.equal(newsActive(news, tk("2026-10-23T09:00:00")), true);
    assert.equal(window(tk("2026-10-24T10:00:00")), false, "суббота — нет");
    assert.equal(newsActive(news, tk("2026-10-26T10:00:00")), true, "не дошло в пятницу — понедельник");
    assert.equal(newsActive(news, tk("2026-10-27T10:00:00")), false, "дальше — устарело");
  }
  // Сначала владельцу и руководителю, потом менеджерам.
  assert.ok(NEWS.indexOf(heads) < NEWS.indexOf(team));
  assert.equal(team.copyRole, "manager", "владельцу — копия текста менеджеров");
});

test("каждое — одним сообщением Telegram, копия владельцу тоже", () => {
  assert.ok(plain(headNewsOct23()).length < MESSAGE_MAX, `руководителю: ${plain(headNewsOct23()).length}`);
  const copy = plain([team?.copyNote ?? "", "", teamNewsOct23()].join("\n"));
  assert.ok(copy.length < MESSAGE_MAX, `копия: ${copy.length}`);
});

test("менеджерам — «было → стало», названия как на экране и в боте", () => {
  const text = teamNewsOct23();
  assert.ok((text.match(/^Было: /gm) ?? []).length >= 8, "каждый пункт — «было»");
  assert.equal((text.match(/^Было: /gm) ?? []).length, (text.match(/^Стало: /gm) ?? []).length);
  for (const label of [
    salesStagesDict.markShown.ru,
    salesStagesDict.markPriced.ru,
    leadCardDict.quickTitle.ru,
    hqMyDict.mockTitle.ru,
    appDict.install.ru,
    appDict.enable.ru,
    loginDict.appGetCode.ru,
    mockupsDict.sendsTitle.ru,
    TAKE_OVER_BUTTON,
  ]) {
    assert.ok(text.includes(`«${label}»`), `нет «${label}»`);
  }
  assert.match(read("lib/admin/bot-text-edit.ts"), /export const EDIT_BUTTON = "✏️ Изменить текст";/);
  assert.ok(text.includes("«✏️ Изменить текст»"));
  assert.match(read("lib/admin/reply-heads-up.ts"), /💬 <b>Ваш лид ответил<\/b>/);
  assert.ok(text.includes(`через ${REPLY_HOLD_MIN} минут`));
  assert.match(read("lib/admin/staff-helper.ts"), /export const HELPER_DAILY = 30;/);
  assert.ok(text.includes("до 30 вопросов в день"));
  assert.ok(text.includes(`лендинг от ${PROMO.landing.price} $`), "цена — та, что называет бот");
});

test("менеджерам — только их работа: ни мусора, ни базы, ни денег студии и грейда", () => {
  const text = teamNewsOct23();
  for (const word of [/Мусор/, /ГБ/, /трафик/i, /грейд/i, /%/, /КП/, /Supabase/i, /договор/i]) {
    assert.doesNotMatch(text, word);
  }
});

test("владельцу и руководителю — всё, с «зачем», без доли студии", () => {
  const text = headNewsOct23();
  assert.match(read("lib/admin/lead-trash.ts"), /export const TRASH_BUTTON = "🗑 Мусор";/);
  for (const part of ["«🗑 Мусор»", "«🗄 Отклонить»", "«Новый заход после ответа»", "«Ступени продажи»", "Davlat", "5 ГБ"]) {
    assert.ok(text.includes(part), `нет ${part}`);
  }
  assert.ok((text.match(/Зачем: /g) ?? []).length >= 8, "у доработок — зачем");
  assert.doesNotMatch(text, /доля студии|котёл|соучредител/i);
  // Владелец, 23.10.2026: «Убери… название Claude / Qwen».
  assert.doesNotMatch(text, /Claude|Qwen|Haiku|Sonnet|Opus/i);
  assert.ok(text.includes("Своя LLM — этап аудита текущих требований к запуску."));
});
