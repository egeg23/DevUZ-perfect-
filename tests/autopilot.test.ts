import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import {
  ATTEMPTS_PER_TARGET,
  AUTOPILOT_NICHES,
  AUTOPILOT_SENDER,
  DAILY_TARGET,
  IN_FLIGHT_MAX,
  PREPARE_PER_PASS,
  REPLY_MARK,
  inNiche,
  nextNiche,
  nicheByKey,
  prepareWindow,
  replyHeading,
  reportDue,
  reportText,
  toPrepare,
  weekOf,
  type DayStats,
} from "@/lib/admin/autopilot";
import { EMPTY_CONTACTS } from "@/lib/audit/contacts";

/**
 * Автопрогон касаний — правило владельца, 05.10.2026: «1 неделя = 1 ниша…
 * в день ты делаешь 20 касаний (написано в тг, не меньше)… лидов, которые
 * ответят, — закидывай сразу через тг бота к менеджерам».
 */

const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

test("ниши идут по кругу, ключи не повторяются, у каждой есть перевод", () => {
  const keys = AUTOPILOT_NICHES.map((n) => n.key);
  assert.equal(new Set(keys).size, keys.length);
  assert.equal(nextNiche(null).key, AUTOPILOT_NICHES[0].key, "первая неделя — первая ниша");
  assert.equal(nextNiche("какая-то-убранная").key, AUTOPILOT_NICHES[0].key);
  assert.equal(nextNiche(AUTOPILOT_NICHES[0].key).key, AUTOPILOT_NICHES[1].key);
  assert.equal(nextNiche(AUTOPILOT_NICHES.at(-1)!.key).key, AUTOPILOT_NICHES[0].key, "после последней — снова первая");
  for (const n of AUTOPILOT_NICHES) {
    assert.ok(n.uz && !/[Ѐ-ӿ]/.test(n.uz), `${n.key}: узбекское название латиницей`);
    assert.ok(n.pl && !/[Ѐ-ӿ]/.test(n.pl), `${n.key}: польское название без кириллицы`);
    assert.ok(n.match.length && n.maps, `${n.key}: есть по чему искать`);
  }
});

test("первая ниша — та, где пул уже есть: учебные центры", () => {
  // На 05.10.2026 в пуле учебных центров 55 сайтов и 189 мобильных номеров —
  // больше, чем у любой другой ниши.
  assert.equal(AUTOPILOT_NICHES[0].key, "uchebnyy-centr");
  const n = nicheByKey("uchebnyy-centr")!;
  assert.ok(inNiche(n, "Учебный центр"), "без учёта регистра");
  assert.ok(inNiche(n, "uchebnyy-centr"), "ключ классификатора сайта");
  assert.ok(!inNiche(n, "стоматология"));
  assert.ok(!inNiche(n, null));
});

test("неделя — с понедельника по Ташкенту", () => {
  // Понедельник 05.10.2026, 00:30 по Ташкенту — это ещё воскресенье по UTC.
  assert.equal(weekOf(new Date("2026-10-04T19:30:00Z")), "2026-10-05");
  assert.equal(weekOf(new Date("2026-10-11T18:59:00Z")), "2026-10-05", "воскресенье 23:59 — та же неделя");
  assert.equal(weekOf(new Date("2026-10-11T19:00:00Z")), "2026-10-12");
});

test("готовит с 07:00 до 19:30, отчёт — после 20:45", () => {
  const at = (hhmm: string) => new Date(`2026-10-06T${hhmm}:00+05:00`);
  assert.ok(!prepareWindow(at("06:59")));
  assert.ok(prepareWindow(at("07:00")));
  assert.ok(prepareWindow(at("19:29")));
  assert.ok(!prepareWindow(at("19:30")));
  assert.ok(!reportDue(at("20:44")));
  assert.ok(reportDue(at("20:45")));
});

test("норма: не меньше 20 ушедших, не больше четырёх в очереди, не больше двух за проход", () => {
  assert.equal(DAILY_TARGET, 20);
  const target = DAILY_TARGET;
  assert.equal(toPrepare({ sent: 0, inFlight: 0, attempts: 0, target }), PREPARE_PER_PASS);
  assert.equal(toPrepare({ sent: 0, inFlight: IN_FLIGHT_MAX, attempts: 4, target }), 0, "очередь полна — письма менеджеров не ждут");
  assert.equal(toPrepare({ sent: 0, inFlight: IN_FLIGHT_MAX - 1, attempts: 3, target }), 1);
  assert.equal(toPrepare({ sent: 19, inFlight: 0, attempts: 25, target }), 1, "до нормы одно — готовим одно");
  assert.equal(toPrepare({ sent: 18, inFlight: 2, attempts: 25, target }), 0, "ушедшее и стоящее в очереди покрывают норму");
  assert.equal(toPrepare({ sent: 20, inFlight: 0, attempts: 30, target }), 0);
  // Номер без Telegram ушёл «руками» — в счёт не идёт, и следующий проход
  // увидит недостачу снова.
  assert.equal(toPrepare({ sent: 15, inFlight: 0, attempts: 22, target }), 2);
  assert.equal(
    toPrepare({ sent: 5, inFlight: 0, attempts: target * ATTEMPTS_PER_TARGET, target }),
    0,
    "попытки на день кончились — пустой пул не съедает сотни обходов",
  );
  assert.equal(toPrepare({ sent: 0, inFlight: 0, attempts: 0, target: 0 }), 0, "норма 0 — не пишет");
});

test("кому писать: только туда, куда дотянется Telegram, @адрес — первым", async () => {
  const { rank } = await import("@/lib/admin/autopilot-store");
  const finding = { code: "no_phone", severity: "critical", title: "Нет телефона на главной", impact: "x", fix: "y", evidence: "z" };
  const row = (id: string, over: Record<string, unknown>) => ({
    id,
    host: "example.uz",
    findings: [finding],
    contacts: { ...EMPTY_CONTACTS },
    score: 40,
    niche: "учебный центр",
    ...over,
  });
  const ids = rank([
    row("landline", { contacts: { ...EMPTY_CONTACTS, phones: ["+998712345678"] } }),
    row("nosite", { host: null, findings: [], contacts: { ...EMPTY_CONTACTS, phones: ["+998901234567"] } }),
    row("phone", { contacts: { ...EMPTY_CONTACTS, phones: ["+998931234567"] } }),
    row("handle", { contacts: { ...EMPTY_CONTACTS, telegram: ["school_uz"] } }),
    row("nothing", { findings: [], contacts: { ...EMPTY_CONTACTS, telegram: ["empty_uz"] } }),
    row("busy", { contacts: { ...EMPTY_CONTACTS, telegram: ["busy_uz"] } }),
  ] as never, new Set(["busy"]));
  assert.deepEqual(ids, ["handle", "phone", "nosite"]);
});

test("ответ клиента — команде через очередь лидов, с понятной шапкой", () => {
  const heading = replyHeading(
    { host: "school.uz", label: "School", words: "Здравствуйте, <интересно>, сколько стоит?", niche: "учебные центры" },
    esc,
  );
  assert.ok(heading.startsWith(`<b>${REPLY_MARK}</b> · school.uz`));
  assert.match(heading, /Ниша недели: учебные центры/);
  assert.match(heading, /&lt;интересно&gt;/, "слова клиента экранируются — их пишет посторонний");

  const reply = read("lib/admin/autopilot-reply.ts");
  assert.match(reply, /routeNewLead\(/, "по очереди на тёплые лиды, а не «всем, кто первый нажал»");
  assert.match(reply, /\.is\("autopilot_replied_at", null\)/, "один лид на касание, даже если клиент пишет тремя сообщениями");
  assert.match(reply, /\.is\("claimed_by", null\)/, "взятое касание ведёт тот, кто взял");
  assert.match(reply, /verdict === "stop"\) return \{ kind: "refused" \}/, "«не пишите» — не лид");

  const talk = read("lib/admin/outreach-talk-store.ts");
  const save = talk.slice(talk.indexOf("async function saveInbound"));
  assert.ok(save.indexOf("routeAutopilotReply(") > 0, "входящее проверяется на автопрогон");
  assert.ok(save.indexOf("routeAutopilotReply(") < save.indexOf("announcePrototype("), "лид заводится до рассылки о прототипе — её взятие отдаёт этот лид");
});

test("автопрогон пишет тем же путём, что менеджер: проверка по факту и проверка перед отправкой", () => {
  const store = read("lib/admin/autopilot-store.ts");
  const run = store.slice(store.indexOf("export async function runAutopilot"), store.indexOf("async function release("));
  assert.match(run, /prepareOutreach\(id, AUTOPILOT\)/, "письмо пишет только prepareOutreach — там проверка по факту");
  assert.match(run, /queueOutreach\(id, prepared\.message, AUTOPILOT/, "отправка — через проверку перед отправкой");
  assert.doesNotMatch(run, /from\("prospects"\)\s*\.update\(\{[^}]*message:/, "своего письма в обход не кладёт");

  const outreach = read("lib/admin/outreach-store.ts");
  const queue = outreach.slice(outreach.indexOf("export async function queueOutreach"), outreach.indexOf("/* ── Ручной маршрут"));
  assert.match(queue, /const leadId = isAutopilot\(staff\) \? null :/, "лид — не при отправке, а на ответе клиента");
  assert.match(queue, /if \(auto\) update = update\.is\("claimed_by", null\)/, "карточку, взятую менеджером, не перехватывает");
  assert.equal(AUTOPILOT_SENDER, "DevUz Studio", "чужим именем не подписывается");
});

test("порция и поток не выдают карточку, которую пишет автопрогон", () => {
  const portion = read("lib/admin/portion-store.ts");
  const pool = portion.slice(portion.indexOf("export async function pool"), portion.indexOf("export type PortionAssign"));
  assert.match(pool, /autopilot_at\.is\.null,autopilot_note\.not\.is\.null/);
});

test("свип зовёт автопрогон и отчёт", () => {
  const sweep = read("app/api/reminders/sweep/route.ts");
  assert.match(sweep, /runAutopilot\(new Date\(\)\)/);
  assert.match(sweep, /sendAutopilotReport\(new Date\(\)\)/);
});

test("отчёт за день: норма, аккаунты, ответы и что делать, если не добрали", () => {
  const base: DayStats = {
    day: "2026-10-06",
    niche: "учебные центры",
    target: 20,
    enabled: true,
    sent: 21,
    byAccount: [
      { name: "M1", n: 9 },
      { name: null, n: 7 },
      { name: "M2", n: 5 },
    ],
    inFlight: 0,
    attempts: 30,
    manual: 3,
    dropped: 6,
    replies: 2,
    taken: 1,
    refused: 1,
    weekSent: 41,
    weekReplies: 4,
  };
  const ok = reportText(base, esc);
  assert.match(ok, /Автопрогон за 06\.10/);
  assert.match(ok, /ниша недели: учебные центры/);
  assert.match(ok, /Ушло в Telegram: 21 из 20 ✅ \(M1 — 9, главный — 7, M2 — 5\)/);
  assert.match(ok, /Ответили: 2 → взяли в работу: 1, просили не писать: 1/);
  assert.doesNotMatch(ok, /Не добрали/);

  const short = reportText({ ...base, sent: 12 }, esc);
  assert.match(short, /12 из 20 ⚠️/);
  assert.match(short, /Не добрали/);
  assert.match(reportText({ ...base, sent: 12, attempts: 80 }, esc), /кончились попытки/);
  assert.match(reportText({ ...base, enabled: false, sent: 0 }, esc), /выключен/);
});

test("миграция: отметки на карточке, неделя-ниша, настройки с нормой 20", () => {
  const sql = read("supabase/migrations/0090_autopilot.sql");
  for (const column of ["autopilot_at", "autopilot_note", "autopilot_replied_at"]) assert.match(sql, new RegExp(column));
  assert.match(sql, /create table if not exists public\.autopilot_weeks/);
  assert.match(sql, /daily_target smallint not null default 20/);
  assert.match(sql, /autopilot_weeks enable row level security/);
  assert.match(sql, /autopilot_settings enable row level security/);
});
