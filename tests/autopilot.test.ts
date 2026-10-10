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
  REPLIED_SHOWN,
  REPLY_MARK,
  REPORT_SPAN_MS,
  nicheLabel,
  prepareWindow,
  replyHeading,
  reportDue,
  reportText,
  searchLine,
  toPrepare,
  weekOf,
  type DayStats,
} from "@/lib/admin/autopilot";
import { EMPTY_CONTACTS } from "@/lib/audit/contacts";

/**
 * Автопрогон касаний — правила владельца. 05.10.2026: «в день ты делаешь 20
 * касаний (написано в тг, не меньше)… лидов, которые ответят, — закидывай
 * сразу через тг бота к менеджерам». 06.10.2026: «Нам главное не 20 попыток
 * связаться, а не останавливать поиск, пока 20 сообщений не будут
 * отправлены. Убираем правило — 1 неделя = 1 ниша. Любые ниши».
 */

const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

test("ниши поиска: ключи не повторяются, у каждой — запрос для карт; ниша карточки читается человеком", () => {
  const keys = AUTOPILOT_NICHES.map((n) => n.key);
  assert.equal(new Set(keys).size, keys.length);
  for (const n of AUTOPILOT_NICHES) assert.ok(n.label && n.maps, `${n.key}: есть название и запрос`);
  assert.equal(nicheLabel("stomatologiya"), "стоматологии", "ключ классификатора сайта");
  assert.equal(nicheLabel("Учебный центр"), "учебные центры", "кампания с карт, без учёта регистра");
  assert.equal(nicheLabel("IT Образование для детей"), "IT Образование для детей", "незнакомое — как записано");
  assert.equal(nicheLabel(null), null);
});

test("ниши любые: ни недели-ниши, ни отбора по нише", () => {
  const store = read("lib/admin/autopilot-store.ts");
  assert.doesNotMatch(store, /autopilot_weeks/, "ниша недели больше не заводится и не читается");
  assert.match(store, /export async function candidates\(limit: number/, "отбор — из всего пула");
  assert.match(store, /ensureCampaigns\(db\)/, "кампании с карт — по всем нишам списка");
  const ensure = store.slice(store.indexOf("async function ensureCampaigns"), store.indexOf("const POOL_COLUMNS"));
  assert.doesNotMatch(ensure, /active: true/, "выключенную человеком кампанию не включает");
  assert.doesNotMatch(read("lib/admin/autopilot-reply.ts"), /autopilot_weeks/);
  assert.match(replyHeading({ host: "a.uz", label: null, words: "да", niche: "стоматологии" }, esc), /Ниша: стоматологии/);
});

test("неделя — с понедельника по Ташкенту", () => {
  // Понедельник 05.10.2026, 00:30 по Ташкенту — это ещё воскресенье по UTC.
  assert.equal(weekOf(new Date("2026-10-04T19:30:00Z")), "2026-10-05");
  assert.equal(weekOf(new Date("2026-10-11T18:59:00Z")), "2026-10-05", "воскресенье 23:59 — та же неделя");
  assert.equal(weekOf(new Date("2026-10-11T19:00:00Z")), "2026-10-12");
});

test("готовит с 07:00 до 17:30, отчёт — в 18:00, в конце рабочего дня", () => {
  const at = (hhmm: string) => new Date(`2026-10-06T${hhmm}:00+05:00`);
  assert.ok(!prepareWindow(at("06:59")));
  assert.ok(prepareWindow(at("07:00")));
  assert.ok(prepareWindow(at("17:29")), "последние письма — до конца рабочего дня");
  assert.ok(!prepareWindow(at("17:30")));
  assert.ok(!reportDue(at("17:59")));
  assert.ok(reportDue(at("18:00")));
  // Отчёт — за сутки до него, а не с полуночи: ответ, пришедший в 19:00,
  // иначе не попал бы ни в один отчёт.
  assert.equal(REPORT_SPAN_MS, 24 * 3600_000);
  const store = read("lib/admin/autopilot-store.ts");
  assert.match(store, /dayStats\(now, new Date\(now\.getTime\(\) - REPORT_SPAN_MS\)\)/);
  assert.match(store, /\.in\("role", \["admin", "head"\]\)/, "владельцу и руководителю");
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
  assert.equal(ATTEMPTS_PER_TARGET, 10, "не останавливаться, пока двадцать не уйдут: потолок — только от поломки");
  assert.equal(toPrepare({ sent: 5, inFlight: 0, attempts: 80, target }), 2, "80 попыток — ещё не повод остановиться");
  assert.equal(
    toPrepare({ sent: 5, inFlight: 0, attempts: target * ATTEMPTS_PER_TARGET, target }),
    0,
    "двести попыток — что-то отбраковывает все письма, дальше не тратим",
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

  // 05–06.10 автопрогон простоял: три карточки старого импорта хранили
  // contacts = {}, и отбор падал целиком на каждом проходе.
  const broken = rank([
    row("empty", { host: null, findings: [], contacts: {} }),
    row("nulls", { contacts: null }),
    row("partial", { contacts: { phones: ["+998931234567"] } }),
  ] as never);
  assert.deepEqual(broken, ["partial"], "карточка без списков контактов пропускается, а не роняет отбор");
});

test("ответ клиента — команде через очередь лидов, с понятной шапкой", () => {
  const heading = replyHeading(
    { host: "school.uz", label: "School", words: "Здравствуйте, <интересно>, сколько стоит?", niche: "учебные центры" },
    esc,
  );
  assert.ok(heading.startsWith(`<b>${REPLY_MARK}</b> · school.uz`));
  assert.match(heading, /Ниша: учебные центры/);
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
  // С 10.10.2026 письмо автопрогона пишется после ответа (LETTER_AFTER_REPLY):
  // prepareOutreach здесь — проверка сайта по факту, а письмо пишет тот же
  // composeLetter по той же проверке и проверяет sendProblems (writeLetterLater).
  assert.match(run, /prepareOutreach\(id, AUTOPILOT, \{ letter: !LETTER_AFTER_REPLY \}\)/, "проверка по факту — только prepareOutreach");
  assert.match(run, /queueOutreach\(id, LETTER_AFTER_REPLY \? null : prepared\.message, AUTOPILOT/, "отправка — через проверку перед отправкой");
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

test("свип зовёт автопрогон, отчёт и поиск лидов", () => {
  const sweep = read("app/api/reminders/sweep/route.ts");
  assert.match(sweep, /runAutopilot\(new Date\(\)\)/);
  assert.match(sweep, /sendAutopilotReport\(new Date\(\)\)/);
  assert.match(sweep, /leadSearchPass\(new Date\(\)\)/);
});

test("отчёт за день: норма, аккаунты, ответы и что делать, если не добрали", () => {
  const base: DayStats = {
    day: "2026-10-06",
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
    replied: [
      { who: "school.uz", takenBy: "@stas", refused: false },
      { who: "<b>kids.uz</b>", takenBy: null, refused: false },
      { who: "lang.uz", takenBy: null, refused: true },
    ],
  };
  const ok = reportText(base, esc);
  assert.match(ok, /Автопрогон касаний — отчёт за 06\.10/);
  assert.doesNotMatch(ok, /Ниша недели/, "ниши любые");
  assert.doesNotMatch(ok, /Firecrawl/, "без ключа Firecrawl строки нет");
  assert.match(ok, /За сутки до 18:00/);
  assert.match(ok, /Написали — ушло в Telegram: <b>21<\/b> из 20 ✅ \(M1 — 9, главный — 7, M2 — 5\)/);
  assert.match(ok, /Ответили: <b>2<\/b> → взяли в работу: 1, просили не писать: 1/);
  assert.match(ok, /• school\.uz — взял @stas/);
  assert.match(ok, /• &lt;b&gt;kids\.uz&lt;\/b&gt; — ⏳ ещё ничей/, "имя компании экранируется");
  assert.match(ok, /• lang\.uz — просил не писать/);
  assert.doesNotMatch(ok, /Не добрали/);
  assert.doesNotMatch(ok, /\n\n\n/, "без двойных пустых строк");
  assert.match(ok, /С начала недели: 41 письмо, 4 ответа/);
  assert.match(reportText({ ...base, weekSent: 25, weekReplies: 11 }, esc), /25 писем, 11 ответов/);

  const many = reportText(
    { ...base, replied: Array.from({ length: REPLIED_SHOWN + 3 }, (_, i) => ({ who: `s${i}.uz`, takenBy: null, refused: false })) },
    esc,
  );
  assert.match(many, /• и ещё 3/);

  const short = reportText({ ...base, sent: 12 }, esc);
  assert.match(short, /<b>12<\/b> из 20 ⚠️/);
  assert.match(short, /Не добрали/);
  assert.match(reportText({ ...base, enabled: false, sent: 0 }, esc), /выключен/);

  // Сбой прохода назван в отчёте, а не списан на нишу и аккаунты.
  const broke = reportText({ ...base, sent: 0, trouble: "TypeError: <x>" }, esc);
  assert.match(broke, /❗ Автопрогон сбоил/);
  assert.match(broke, /<code>TypeError: &lt;x&gt;<\/code>/);
  assert.match(broke, /Не добрали из-за сбоя выше/);
  assert.doesNotMatch(broke, /Проверьте раздел «Аккаунты»/);
  assert.doesNotMatch(reportText({ ...base, trouble: "TypeError" }, esc), /сбоил/, "норма набрана — разовый сбой не тревога");

  // Firecrawl: на что ушли кредиты и что дали.
  const found = reportText({ ...base, search: { credits: 31, cap: 33, contacts: 4, tried: 27, queued: 6 } }, esc);
  assert.match(found, /🔎 Поиск лидов \(Firecrawl\): 31 из 33 кредитов — Telegram или мобильный нашёлся у 4 из 27 компаний без него, новых сайтов на проверку: 6/);
  assert.equal(searchLine({ credits: 0, cap: null, contacts: 0, tried: 0, queued: 0 }), "🔎 Поиск лидов (Firecrawl): 0 кредитов");
  assert.match(reportText({ ...base, sent: 12, attempts: 200 }, esc), /200 попыток за день/);
});

test("миграция: отметки на карточке, неделя-ниша, настройки с нормой 20", () => {
  const sql = read("supabase/migrations/0090_autopilot.sql");
  for (const column of ["autopilot_at", "autopilot_note", "autopilot_replied_at"]) assert.match(sql, new RegExp(column));
  assert.match(sql, /create table if not exists public\.autopilot_weeks/);
  assert.match(sql, /daily_target smallint not null default 20/);
  assert.match(sql, /autopilot_weeks enable row level security/);
  assert.match(sql, /autopilot_settings enable row level security/);
});
