import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { helpCopy } from "@/content/admin-help";
import { COURSES, COURSE_KEYS, PANEL_QUESTIONS, PANEL_QUIZ, learnCopy, type LearnCopy } from "@/content/learn";
import { helpAnchor, itemRoles } from "@/lib/admin/help";
import { PANEL_LOCALES } from "@/lib/admin/i18n";
import { AUTO_ARMS } from "@/lib/admin/letter-texts";
import { SECTIONS, SWITCHED_SECTIONS, navOf, opens, seesTeamLearning, type Role } from "@/lib/admin/roles";
import {
  LEARN_CALLBACK,
  answersById,
  answersFit,
  feedbackText,
  learnCommand,
  menuMessage,
  parseLearnCallback,
  questionMessage,
  resultText,
} from "@/lib/learn/bot";
import { grade, optionOrder, questionsFor } from "@/lib/learn/quiz";
import { PASS_PERCENT, REQUIRED_COURSES, REQUIRED_FOR_NEW, isPassed, joinedAfterLaunch, mustLearn, requiredLeft } from "@/lib/learn/rules";
import { bestOf, materialUrl } from "@/lib/learn/store";

/**
 * «Обучение»: курсы по продажам и тест по панели (владелец, 12.10.2026).
 * Тест держит: три языка одной формы, вопросы панели ведут в настоящие
 * пункты инструкции, проверка ответов и бот считают одинаково, выключатель
 * прячет раздел от команды, права проверяются на сервере.
 */

const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");

/** Все строки текста обучения на одном языке. */
function strings(copy: LearnCopy): string[] {
  const out: string[] = [copy.panel.title, copy.panel.summary];
  for (const course of Object.values(copy.courses)) {
    out.push(course.title, course.summary);
    for (const lesson of Object.values(course.lessons)) out.push(lesson.title, ...lesson.paras);
    for (const q of Object.values(course.quiz)) out.push(q.q, q.why, ...q.options);
  }
  for (const q of Object.values(copy.panel.questions)) out.push(q.q, q.why, ...q.options);
  return out;
}

test("три языка — одной формы: курсы, уроки, абзацы, вопросы и варианты", () => {
  const ru = learnCopy("ru");
  for (const locale of PANEL_LOCALES) {
    const copy = learnCopy(locale);
    assert.deepEqual(Object.keys(copy.courses).sort(), [...COURSE_KEYS].sort(), `${locale}: не те курсы`);
    for (const meta of COURSES) {
      const c = copy.courses[meta.key];
      assert.deepEqual(Object.keys(c.lessons), meta.lessons.map((l) => l.id), `${locale} ${meta.key}: не те уроки`);
      assert.deepEqual(Object.keys(c.quiz), meta.quiz.map((q) => q.id), `${locale} ${meta.key}: не те вопросы`);
      for (const l of meta.lessons) {
        assert.equal(c.lessons[l.id].paras.length, ru.courses[meta.key].lessons[l.id].paras.length, `${locale} ${meta.key}/${l.id}: абзацы`);
      }
      for (const q of meta.quiz) {
        assert.equal(c.quiz[q.id].options.length, ru.courses[meta.key].quiz[q.id].options.length, `${locale} ${meta.key}/${q.id}: варианты`);
      }
    }
    assert.deepEqual(Object.keys(copy.panel.questions), PANEL_QUESTIONS.map((q) => q.id), `${locale}: не те вопросы по панели`);
    for (const q of PANEL_QUESTIONS) {
      assert.equal(copy.panel.questions[q.id].options.length, ru.panel.questions[q.id].options.length, `${locale} ${q.id}: варианты`);
    }
  }
});

test("курс — от 4 до 6 вопросов к своим урокам, вариантов не меньше трёх и без повторов", () => {
  for (const meta of COURSES) {
    assert.ok(meta.quiz.length >= 4 && meta.quiz.length <= 6, `${meta.key}: ${meta.quiz.length} вопросов`);
    const lessons = new Set(meta.lessons.map((l) => l.id));
    for (const q of meta.quiz) assert.ok(lessons.has(q.lesson), `${meta.key}/${q.id}: урока ${q.lesson} нет`);
  }
  for (const locale of PANEL_LOCALES) {
    const copy = learnCopy(locale);
    const all = [...Object.values(copy.courses).flatMap((c) => Object.values(c.quiz)), ...Object.values(copy.panel.questions)];
    for (const q of all) {
      assert.ok(q.options.length >= 3, `${locale}: «${q.q}» — меньше трёх вариантов`);
      assert.equal(new Set(q.options).size, q.options.length, `${locale}: «${q.q}» — повтор варианта`);
      assert.ok(q.why.trim(), `${locale}: «${q.q}» без объяснения`);
    }
  }
  assert.ok(PANEL_QUESTIONS.length >= 25 && PANEL_QUESTIONS.length <= 32, `вопросов по панели ${PANEL_QUESTIONS.length}`);
});

test("узбекский и польский переведены: кириллица только в «ёлочках», o‘ и g‘ — через ‘", () => {
  for (const locale of ["uz", "pl"] as const) {
    for (const line of strings(learnCopy(locale))) {
      const plain = line.replace(/«[^»]*»/g, "");
      assert.ok(!/[а-яё]/i.test(plain), `${locale}: не переведено: ${line}`);
    }
  }
  for (const line of strings(learnCopy("uz"))) assert.ok(!/[og]['`ʻ]/.test(line), `uz: o‘/g‘ через ‘: ${line}`);
});

test("урок о заходе показывает настоящий текст из AUTO_ARMS", () => {
  const arms = COURSES.flatMap((c) => c.lessons).map((l) => l.arm).filter(Boolean);
  assert.deepEqual([...arms].sort(), AUTO_ARMS.map((a) => a.key).sort(), "каждый заход автопрогона — в своём уроке");
  assert.match(read("app/admin/learn/[course]/page.tsx"), /AUTO_ARMS\.find\(\(a\) => a\.key === lesson\.arm\)/);
});

test("вопрос по панели ведёт в существующий пункт инструкции на каждом языке, и роль его видит", () => {
  for (const locale of PANEL_LOCALES) {
    const { sections } = helpCopy(locale);
    for (const q of PANEL_QUESTIONS) {
      const section = SECTIONS.find((s) => s.href === q.href);
      assert.ok(section, `${q.id}: раздела ${q.href} нет`);
      const item = sections[q.href]?.items.find((i) => i.id === q.item);
      assert.ok(item, `${locale} ${q.id}: пункта ${helpAnchor(q.href, q.item)} нет`);
      const seen = itemRoles(item, section.roles);
      for (const role of q.roles ?? section.roles) {
        assert.ok(seen.includes(role), `${q.id}: роль ${role} не видит пункт ${helpAnchor(q.href, q.item)}`);
      }
    }
  }
  // Главные разделы покрыты.
  const covered = new Set(PANEL_QUESTIONS.map((q) => q.href));
  for (const href of ["/admin", "/admin/prospect", "/admin/mockups", "/admin/projects", "/admin/finance", "/admin/team", "/admin/partners"]) {
    assert.ok(covered.has(href), `нет вопросов про ${href}`);
  }
});

test("тест по панели — только о разделах, открытых человеку", () => {
  const manager = questionsFor(PANEL_QUIZ, { role: "manager" }, "ru").map((q) => q.id);
  const head = questionsFor(PANEL_QUIZ, { role: "head" }, "ru").map((q) => q.id);
  const admin = questionsFor(PANEL_QUIZ, { role: "admin" }, "ru").map((q) => q.id);
  for (const id of ["team-plan", "partner-count", "partner-payout", "accounts-circle", "autopilot"]) {
    assert.ok(!manager.includes(id), `менеджеру вопрос ${id}`);
    assert.ok(head.includes(id), `руководителю нет вопроса ${id}`);
  }
  assert.equal(admin.length, PANEL_QUESTIONS.length);
  // Галочка владельца открывает раздел — и вопросы о нём.
  const granted = questionsFor(PANEL_QUIZ, { role: "manager", section_access: { "/admin/team": true } }, "ru").map((q) => q.id);
  assert.ok(granted.includes("team-plan"));
  assert.ok(manager.length >= 20, `менеджеру всего ${manager.length} вопросов`);
  for (const q of questionsFor(PANEL_QUIZ, { role: "manager" }, "uz")) assert.match(q.anchor ?? "", /^[a-z-]+$/);
});

test("варианты перемешаны одинаково на сервере и в браузере, верный не всегда первый", () => {
  let firstRight = 0;
  for (const q of PANEL_QUESTIONS) {
    const n = learnCopy("ru").panel.questions[q.id].options.length;
    const order = optionOrder(q.id, n);
    assert.deepEqual([...order].sort(), Array.from({ length: n }, (_, i) => i), `${q.id}: не перестановка`);
    assert.deepEqual(optionOrder(q.id, n), order, `${q.id}: порядок не повторяется`);
    if (order[0] === 0) firstRight++;
  }
  assert.ok(firstRight < PANEL_QUESTIONS.length * 0.6, `верный первым в ${firstRight} вопросах из ${PANEL_QUESTIONS.length}`);
});

test("проверка ответов: верный — первый вариант текста, пропуск и мусор — ошибка", () => {
  const qs = questionsFor("hello", { role: "manager" }, "ru");
  const allRight = Object.fromEntries(qs.map((q) => [q.id, 0]));
  assert.deepEqual(
    { score: grade(qs, allRight).score, total: grade(qs, allRight).total, passed: grade(qs, allRight).passed },
    { score: qs.length, total: qs.length, passed: true },
  );
  const skipped = grade(qs, { [qs[0].id]: 0 });
  assert.equal(skipped.score, 1);
  assert.equal(skipped.wrong.length, qs.length - 1);
  const junk = grade(qs, { [qs[0].id]: 99, [qs[1].id]: "0", [qs[2].id]: -1, nope: 0 });
  assert.equal(junk.score, 0);
  assert.deepEqual(junk.answers, {});
  assert.equal(grade(qs, null).score, 0);
  assert.equal(grade(qs, [0, 0]).score, 0);
});

test("правила владельца: 70%, обязательно менеджерам, работу не закрывает", () => {
  assert.equal(PASS_PERCENT, 70);
  assert.equal(REQUIRED_FOR_NEW, true);
  assert.ok(isPassed(7, 10));
  assert.ok(!isPassed(6, 10));
  assert.ok(isPassed(5, 6) && !isPassed(4, 6), "4 из 6 — 67%, не сдан");
  assert.ok(!isPassed(0, 0));
  assert.deepEqual([...REQUIRED_COURSES].sort(), [...COURSE_KEYS, PANEL_QUIZ].sort(), "обязательны все курсы и тест по панели");

  assert.ok(mustLearn({ role: "manager" }));
  assert.ok(!mustLearn({ role: "head" }) && !mustLearn({ role: "admin" }));
  assert.ok(!mustLearn({ role: "manager" }, false), "выключено — не обязательно");
  assert.deepEqual(requiredLeft({ role: "manager" }, new Set(["hello", "panel"])), REQUIRED_COURSES.filter((k) => k !== "hello" && k !== "panel"));
  assert.deepEqual(requiredLeft({ role: "manager" }, new Set(REQUIRED_COURSES)), []);
  assert.deepEqual(requiredLeft({ role: "head" }, new Set()), []);
  assert.deepEqual(requiredLeft({ role: "manager" }, new Set(), { on: false }), []);
  assert.ok(joinedAfterLaunch("2026-10-13T09:00:00Z"));
  assert.ok(!joinedAfterLaunch("2026-09-01T09:00:00Z"));
  assert.ok(!joinedAfterLaunch(null));

  // Только показывается: в обработке лидов и порции обучение не участвует.
  for (const file of ["lib/admin/lead-queue-store.ts", "lib/admin/portion-store.ts", "lib/admin/guard.ts"]) {
    assert.doesNotMatch(read(file), /lib\/learn/, `${file} зависит от обучения`);
  }
});

test("лучший результат: сдан хоть раз — сдан, счёт — лучший, попытки считаются", () => {
  const best = bestOf([
    { staffId: "a", course: "hello", score: 3, total: 6, passed: false, source: "panel", createdAt: "2026-10-12T10:00:00Z" },
    { staffId: "a", course: "hello", score: 6, total: 6, passed: true, source: "bot", createdAt: "2026-10-12T09:00:00Z" },
    { staffId: "b", course: "panel", score: 10, total: 25, passed: false, source: "panel", createdAt: "2026-10-12T08:00:00Z" },
  ]);
  assert.deepEqual(best.get("a")?.get("hello"), { passed: true, score: 6, total: 6, tries: 2, lastAt: "2026-10-12T10:00:00Z" });
  assert.equal(best.get("b")?.get("panel")?.passed, false);
});

test("выключатель: пока обучение не включено, раздел видит только владелец", () => {
  assert.ok(SWITCHED_SECTIONS.includes("/admin/learn"));
  const section = SECTIONS.find((s) => s.href === "/admin/learn");
  assert.deepEqual(section?.label, { ru: "Обучение", uz: "Ta’lim", pl: "Szkolenia" });
  assert.deepEqual(section?.roles, ["admin", "head", "manager"], "когда включено — всем");
  const help = SECTIONS.findIndex((s) => s.href === "/admin/help");
  assert.equal(SECTIONS.findIndex((s) => s.href === "/admin/learn"), help - 1, "перед «Инструкциями»");

  const off = ["/admin/learn"];
  for (const role of ["manager", "head"] as Role[]) {
    assert.ok(!opens({ role, sections_off: off }, "/admin/learn"), `${role} видит выключенное`);
    assert.ok(!navOf({ role, sections_off: off }).some((s) => s.href === "/admin/learn"));
    assert.ok(!opens({ role, sections_off: off, section_access: { "/admin/learn": true } }, "/admin/learn"), "галочка не обходит выключатель");
    assert.ok(opens({ role, sections_off: [] }, "/admin/learn"), `${role} не видит включённое`);
  }
  assert.ok(opens({ role: "admin", sections_off: off }, "/admin/learn"), "владелец видит всегда");
  assert.ok(opens({ role: "manager", sections_off: off }, "/admin"), "выключатель не трогает другие разделы");

  // Сессия панели читает выключатель; нет строки или база молчит — выключено.
  assert.match(read("lib/admin/session.ts"), /if \(staff\.role !== "admin"\) staff\.sections_off = await sectionsOff\(\);/);
  const sw = read("lib/admin/section-switch.ts");
  assert.match(sw, /if \(!db\) return \[\.\.\.SWITCHED_SECTIONS\];/);
  assert.match(sw, /payload as \{ on\?: unknown \} \| null\)\?\.on === true/);
});

test("права — на сервере: тест сдаёт тот, кому открыт раздел; выключатель и материалы — только владелец", () => {
  for (const page of ["app/admin/learn/page.tsx", "app/admin/learn/[course]/page.tsx"]) {
    assert.match(read(page), /const staff = await requireSection\("\/admin\/learn"\)/);
    assert.match(read(page), /<AdminShell/);
  }
  const actions = read("app/admin/learn/actions.ts");
  assert.match(actions, /if \(!staff \|\| !course \|\| !opens\(staff, HREF\)\) return \{ ok: false \};/);
  assert.match(actions, /const result = grade\(questions, answers\);/, "ответы считает сервер");
  for (const fn of ["switchLearn", "addMaterialAction", "removeMaterialAction"]) {
    const body = actions.slice(actions.indexOf(`export async function ${fn}`)).split("export async function")[1];
    assert.match(body, /if \(!staff \|\| staff\.role !== "admin"\) return;/, `${fn}: не только владелец`);
  }
  assert.equal(seesTeamLearning("manager"), false);
  assert.equal(seesTeamLearning("head"), true);
  assert.equal(seesTeamLearning("admin"), true);
  assert.match(read("app/admin/learn/page.tsx"), /listAttempts\(team \? null : staff\.id\)/, "менеджер читает только свои попытки");
});

test("материал — только ссылка http(s)", () => {
  assert.equal(materialUrl("https://youtu.be/abc"), "https://youtu.be/abc");
  assert.equal(materialUrl(" http://example.com/a "), "http://example.com/a");
  assert.equal(materialUrl("javascript:alert(1)"), null);
  assert.equal(materialUrl("ftp://x.y"), null);
  assert.equal(materialUrl("https://a b"), null);
  assert.equal(materialUrl(""), null);
});

test("миграция: попытки и материалы, RLS без политик, откат", () => {
  const sql = read("supabase/migrations/0154_learn.sql");
  assert.match(sql, /create table if not exists public\.learn_attempts/);
  assert.match(sql, /staff_id uuid not null references public\.staff \(id\) on delete cascade/);
  assert.match(sql, /answers jsonb not null/);
  assert.match(sql, /source text not null default 'panel' check \(source in \('panel', 'bot'\)\)/);
  assert.match(sql, /create table if not exists public\.learn_materials/);
  assert.equal((sql.match(/enable row level security/g) ?? []).length, 2);
  assert.doesNotMatch(sql, /create policy/);
  const down = read("supabase/migrations/0154_learn.down.sql");
  assert.match(down, /drop table if exists public\.learn_attempts/);
  assert.match(down, /drop table if exists public\.learn_materials/);
});

/* ── Бот ─────────────────────────────────────────────────────────────────── */

test("бот: /learn и «Обучение» открывают список, остальное — нет", () => {
  for (const text of ["/learn", "/Learn", "/learn@Devuz_studio_bot", "Обучение", "🎓 Обучение"]) assert.ok(learnCommand(text), text);
  for (const text of ["", "учиться", "/leads", "обучение продажам", null]) assert.ok(!learnCommand(text), String(text));
  const menu = menuMessage("https://devuz.studio");
  assert.equal(menu.rows.length, COURSES.length + 1);
  assert.match(menu.text, /70%/);
  assert.match(menu.text, /https:\/\/devuz\.studio\/admin\/learn/);
});

test("бот: кнопки разбираются строго, ответы едут в кнопке и укладываются в 64 байта", () => {
  assert.deepEqual(parseLearnCallback(["lr", "s", "hello"]), { kind: "start", key: "hello" });
  assert.deepEqual(parseLearnCallback(["lr", "a", "panel", "0120"]), { kind: "answer", key: "panel", answers: [0, 1, 2, 0] });
  assert.equal(parseLearnCallback(["lr", "s", "nope"]), null);
  assert.equal(parseLearnCallback(["lr", "a", "hello", "x1"]), null);
  assert.equal(parseLearnCallback(["lr", "a", "hello"]), null);
  assert.equal(parseLearnCallback(["tk", "s", "hello"]), null);

  // Самый длинный путь: весь тест по панели у владельца, все ответы в кнопке.
  const qs = questionsFor(PANEL_QUIZ, { role: "admin" }, "ru");
  const answers = qs.slice(0, -1).map(() => 2);
  const last = questionMessage(PANEL_QUIZ, qs, qs.length - 1, answers);
  for (const button of last.rows.flat()) {
    const data = "callback_data" in button ? button.callback_data : "";
    assert.ok(Buffer.byteLength(data) <= 64, `кнопка ${data.length} байт`);
    assert.ok(data.startsWith(`${LEARN_CALLBACK}:a:${PANEL_QUIZ}:${answers.join("")}`));
  }
  for (const key of COURSE_KEYS) {
    const cqs = questionsFor(key, { role: "manager" }, "ru");
    const msg = questionMessage(key, cqs, cqs.length - 1, cqs.slice(0, -1).map(() => 3));
    for (const b of msg.rows.flat()) assert.ok(Buffer.byteLength("callback_data" in b ? b.callback_data : "") <= 64);
  }
});

test("бот: вопрос, отметка и итог — те же правила, что в панели", () => {
  const qs = questionsFor(PANEL_QUIZ, { role: "manager" }, "ru");
  const msg = questionMessage(PANEL_QUIZ, qs, 0, []);
  const order = optionOrder(qs[0].id, qs[0].copy.options.length);
  // Номер на кнопке — место на экране, в кнопке — номер варианта в тексте.
  msg.rows[0].forEach((b, shown) => {
    assert.equal(b.text, String(shown + 1));
    assert.ok("callback_data" in b && b.callback_data.endsWith(String(order[shown])));
  });
  assert.match(msg.text, /вопрос 1 из/);

  assert.ok(answersFit(qs, [0, 1]));
  assert.ok(!answersFit(qs, []));
  assert.ok(!answersFit(qs, [9]));
  assert.ok(!answersFit(qs, qs.map(() => 0).concat(0)));

  assert.match(feedbackText(qs[0], 0, "https://devuz.studio"), /^✅ Верно/);
  const wrong = feedbackText(qs[0], 1, "https://devuz.studio");
  assert.match(wrong, /^❌ Неверно\. Верный ответ:/);
  assert.match(wrong, new RegExp(`https://devuz\\.studio/admin/help#${qs[0].anchor}`));

  const graded = grade(qs, answersById(qs, qs.map(() => 0)));
  assert.equal(graded.score, qs.length);
  assert.match(resultText(graded.score, graded.total, graded.passed, true), /Тест сдан/);
  assert.match(resultText(1, 6, false, false), /не сдан[\s\S]*не сохранился/);
});

test("бот: тесты только в личке сотрудника и только при включённом обучении (владельцу — всегда)", () => {
  const hook = read("app/api/telegram/webhook/route.ts");
  assert.match(hook, /if \(chat\.type === "private" && learnCommand\(update\.message\.text\)\) \{\s*if \(await handleLearnCommand\(update\.message\)\) return;/);
  assert.match(hook, /if \(parts\[0\] === LEARN_CALLBACK\) \{\s*if \(chatId === undefined \|\| chatId !== query\.from\?\.id\) \{/);
  assert.match(hook, /return staff\.role === "admin" \|\| \(await sectionOn\("\/admin\/learn"\)\);/);
  assert.match(hook, /source: "bot"/);
  const menu = read("lib/qualify/menu.ts");
  assert.match(menu, /command: "learn"/);
  assert.match(menu, /learnOn \|\| row\.role === "admin" \? LEARN_EXTRA : \[\]/);
});

test("инструкция к разделу: выключатель — владельцу, результаты — руководителю и владельцу", () => {
  for (const locale of PANEL_LOCALES) {
    const items = helpCopy(locale).sections["/admin/learn"].items;
    assert.deepEqual(items.find((i) => i.id === "switch")?.roles, ["admin"]);
    assert.deepEqual(items.find((i) => i.id === "results")?.roles, ["admin", "head"]);
    const text = JSON.stringify(items);
    assert.match(text, /70%/, `${locale}: порог не назван`);
  }
});
