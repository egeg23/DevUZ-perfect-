import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { todayInTashkent } from "@/lib/admin/pulse";
import {
  renderShiftReport,
  SHIFT_SCHEDULE,
  SHIFT_TITLE,
  shiftTitle,
  silentShifts,
  SILENT_SUFFIX,
} from "@/lib/admin/shift-reports";

const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");

test("отчёт смены: заголовок по виду смены, текст экранирован для Telegram", () => {
  const text = renderShiftReport({ id: "1", shift: "razbor", body: "Вышло 2 из 3: <third> не нашёлся & это честно", created_at: "2026-09-17T03:30:00Z" });
  assert.equal(text, "<b>Смена разборов</b>\nВышло 2 из 3: &lt;third&gt; не нашёлся &amp; это честно");
  assert.match(renderShiftReport({ id: "2", shift: "unknown", body: "x", created_at: "" }), /^<b>unknown<\/b>/);
  assert.ok(SHIFT_TITLE.experiment);
});

test("свип доносит отчёты смен каждый проход, старые первыми, и помечает только доставленные", () => {
  assert.match(read("app/api/reminders/sweep/route.ts"), /const shifts = await sendShiftReports\(\);/);
  const lib = read("lib/admin/shift-reports.ts");
  assert.match(lib, /\.is\("notified_at", null\)\n\s+\.order\("created_at", \{ ascending: true \}\)/);
  // Недоставленное не помечается: оно уйдёт следующим проходом.
  assert.match(lib, /if \(!ok\) \{\n\s+failed \+= 1;\n\s+continue;\n\s+\}\n\s+await db\.from\("shift_reports"\)\.update/);
});

test("смены знают, куда писать: в shift_reports, а не в Telegram напрямую", () => {
  const skill = read(".claude/skills/razbor-daily/SKILL.md");
  assert.match(skill, /shift_reports/);
  assert.match(skill, /execute_sql/, "как найти инструмент базы, если префикс другой");
});

// Сторож молчания. Смена, упавшая на первом шаге, не напишет ничего — и
// её провал неотличим от тишины. Проверяем, что тишина звонит сама.

const RAZBOR = "2026-09-17"; // среда
// 08:03 по Ташкенту + 3 часа ожидания = 11:03 по Ташкенту = 06:03 UTC.
const beforeDeadline = new Date("2026-09-17T05:59:00Z");
const afterDeadline = new Date("2026-09-17T06:05:00Z");

test("сторож молчит, пока смене ещё не время отчитываться", () => {
  assert.deepEqual(silentShifts({ now: beforeDeadline, rows: [] }), []);
});

test("смена не отчиталась к сроку — сторож поднимает тревогу один раз", () => {
  const first = silentShifts({ now: afterDeadline, rows: [] });
  assert.deepEqual(first.map((s) => s.shift), ["razbor" + SILENT_SUFFIX]);
  assert.match(first[0].body, /08:03/);
  assert.match(first[0].body, /11:03/);

  // Строка тревоги и есть отметка «уже били»: второй раз за сутки не звоним.
  const again = silentShifts({
    now: new Date("2026-09-17T09:00:00Z"),
    rows: [{ shift: "razbor" + SILENT_SUFFIX, created_at: afterDeadline.toISOString() }],
  });
  assert.equal(again.filter((s) => s.shift.startsWith("razbor")).length, 0);
});

test("честно пустая смена сторожа не будит: она отчиталась", () => {
  const rows = [{ shift: "razbor", created_at: "2026-09-17T03:35:00Z" }];
  assert.deepEqual(silentShifts({ now: afterDeadline, rows }), []);
});

test("вчерашний отчёт за сегодняшний не считается", () => {
  const rows = [{ shift: "razbor", created_at: "2026-09-16T03:35:00Z" }];
  assert.deepEqual(silentShifts({ now: afterDeadline, rows }).map((s) => s.shift), ["razbor" + SILENT_SUFFIX]);
});

test("день считается по Ташкенту, а не по UTC", () => {
  // 2026-09-17T19:30Z — это уже 18 сентября, 00:30 в Ташкенте. Отчёт,
  // написанный в эту минуту, относится к 18-му, и по UTC-календарю сторож
  // засчитал бы его за 17-е.
  const t = new Date("2026-09-17T19:30:00Z");
  assert.equal(todayInTashkent(t), "2026-09-18");
  const rows = [{ shift: "razbor", created_at: t.toISOString() }];
  // На 18-е число отчёт уже есть — тревоги нет.
  assert.deepEqual(silentShifts({ now: new Date("2026-09-18T06:05:00Z"), rows }), []);
});

test("после ташкентской полуночи сторож ждёт новую смену, а не добивает прошедшую", () => {
  // 2026-09-17T20:00Z — в Ташкенте уже 18-е, час ночи. Сегодняшняя смена
  // (18-го, в 08:03) ещё даже не запускалась, и тревожиться не о чем.
  //
  // Это единственное окно, где UTC-календарь расходится с ташкентским: с
  // 19:00 до полуночи по UTC. Считай сторож день по серверным часам — он бы
  // именно здесь звонил о смене за вчера, которую владелец уже закрыл.
  assert.deepEqual(silentShifts({ now: new Date("2026-09-17T20:00:00Z"), rows: [] }), []);
});

test("смены сторожатся по отдельности, у каждой свой срок", () => {
  // Разборы отчитались, эксперимент — нет.
  const rows = [{ shift: "razbor", created_at: "2026-09-17T03:35:00Z" }];
  const late = silentShifts({ now: new Date("2026-09-17T07:10:00Z"), rows });
  assert.deepEqual(late.map((s) => s.shift), ["experiment" + SILENT_SUFFIX]);

  // Но в 06:05 UTC срок эксперимента (09:05 + 3 ч = 12:05 по Ташкенту,
  // 07:05 UTC) ещё не вышел — тревожить рано.
  assert.deepEqual(silentShifts({ now: afterDeadline, rows }), []);
  assert.equal(SHIFT_SCHEDULE.length, 2, "расписание сторожа знает обе смены");
  assert.ok(RAZBOR);
});

test("тревога отличается от отчёта первым же словом", () => {
  assert.equal(shiftTitle("razbor"), "Смена разборов");
  assert.equal(shiftTitle("razbor" + SILENT_SUFFIX), "Смена разборов — молчит");
  assert.equal(shiftTitle("experiment" + SILENT_SUFFIX), "Эксперимент 300→2000 — молчит");
});

test("свип поднимает тревогу до отправки, чтобы она ушла этим же проходом", () => {
  const route = read("app/api/reminders/sweep/route.ts");
  const warn = route.indexOf("await warnAboutSilentShifts(");
  const send = route.indexOf("await sendShiftReports(");
  assert.ok(warn > 0 && send > warn, "сторож вызывается раньше отправки");
});

// Промпты плановых смен лежат в репозитории копией: саму рутину из кода не
// видно, её нельзя сравнить с прошлой версией и нельзя восстановить. Копия
// без обязательных кусков бесполезна — вот их и стережём.
for (const [file, shift] of [
  [".claude/routines/razbor-daily.md", "razbor"],
  [".claude/routines/experiment-300-2000.md", "experiment"],
] as const) {
  test(`промпт смены ${shift}: сама достаёт репозиторий и отчитывается при любом исходе`, () => {
    const prompt = read(file);

    // Смена стартует в пустой папке. Без этих трёх шагов первая же команда
    // падает, и смена кончается ничем — как 16 и 17 сентября.
    assert.match(prompt, /add_repo/, "нечем достать репозиторий");
    assert.match(prompt, /register_repo_root/, "клон без регистрации не даёт навыков");
    assert.match(prompt, /git clone https:\/\/github\.com\/egeg23\/DevUZ-perfect-\.git/, "нет запасного пути");

    // Провал должен быть слышен. Строка про недоступный репозиторий — это
    // разница между «смена упала» и «два дня тишины».
    assert.match(
      prompt,
      new RegExp(`insert into shift_reports \\(shift, body\\) values \\('${shift}', 'Смена не началась`),
      "провал бутстрапа уходит молча",
    );
    assert.ok(
      prompt.includes(`insert into shift_reports (shift, body) values ('${shift}',`),
      "смена не знает, куда писать отчёт",
    );

    // Ночью никто не ответит на вопрос: смена, которая ждёт отмашки, висит
    // до самого конца контейнера.
    assert.match(prompt, /НИКТО НЕ СМОТРИТ/, "смена может уйти спрашивать разрешения");

    // Ключ сторожа и ключ смены — одна строка: разъедутся, и сторож будет
    // звонить о смене, которая исправно отчитывается.
    assert.ok(
      SHIFT_SCHEDULE.some((e) => e.shift === shift),
      "смена не в расписании сторожа",
    );
  });
}

// Голос смены, которому не нужны инструменты. Плановая сессия стартует с
// bash и ничем больше: ни execute_sql, ни GitHub, ни add_repo. Правило
// «напиши строку через execute_sql» выполнить было нечем — отсюда curl.
test("отчёт смены принимается по curl, и адрес закрыт секретом", () => {
  const route = read("app/api/shift/report/route.ts");

  // Нет секрета в окружении — отказ всем, включая своих. Обратный порядок
  // открывает адрес наружу в тот день, когда переменная не доедет.
  assert.match(route, /if \(!expected \|\| provided !== expected\) \{\s*\n\s+return new Response\("forbidden", \{ status: 403 \}\)/);
  assert.match(route, /request\.headers\.get\("x-devuz-shift"\)/);

  // Вид смены — из словаря сторожа, а не любой присланный: опечатка в
  // промпте завела бы смену, о которой сторож не знает, и тревога
  // прозвенела бы поверх пришедшего отчёта.
  assert.match(route, /if \(!SHIFT_TITLE\[shift\]\)/);
  assert.ok(SHIFT_TITLE.razbor && SHIFT_TITLE.experiment);

  // Переменная доезжает до контейнера: compose передаёт только то, что
  // перечислено у него, остальное из .env молча теряется.
  assert.match(read("docker-compose.yml"), /SHIFT_REPORT_SECRET: \$\{SHIFT_REPORT_SECRET\}/);
  assert.match(read(".env.example"), /^SHIFT_REPORT_SECRET=/m);
});

test("смена читает ответ endpoint-а и по нему понимает, отчиталась ли", () => {
  // Пустой 200 смена не отличит от «секрет не тот»: она увидит успех там,
  // где его нет, и снова промолчит.
  const route = read("app/api/shift/report/route.ts");
  assert.match(route, /return Response\.json\(\{ ok: true, shift, chars: body\.length \}\)/);
  assert.match(route, /ok: false, why:/);
});
