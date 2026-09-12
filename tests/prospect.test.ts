import assert from "node:assert/strict";
import { test } from "node:test";

import { BATCH_CAP, parseTargets, toProspectRow } from "@/lib/audit/batch";
import { leadFinding, pitch } from "@/lib/audit/pitch";
import type { AuditReport, Finding } from "@/lib/audit/checks";

/**
 * Пакетный аудит существует ради одной вещи: черновика, вокруг которого есть
 * проверяемая находка. Поэтому проверяется не «функция не упала», а то, от
 * чего зависит смысл — разбор человеческого списка и то, что попадает в
 * письмо живому человеку.
 */

function report(findings: Finding[], facts: Partial<AuditReport["facts"]> = {}): AuditReport {
  return {
    url: "https://example.uz/",
    score: 100 - findings.length * 20,
    findings,
    facts: {
      https: true,
      ttfbMs: 200,
      platform: null,
      isShop: false,
      certDaysLeft: null,
      ...facts,
    },
  };
}

const CRITICAL: Finding = {
  code: "no_viewport",
  severity: "critical",
  title: "Сайт не приспособлен к телефонам",
  impact: "На телефоне страница открывается в масштабе рабочего стола.",
};
const MINOR: Finding = {
  code: "no_h1",
  severity: "minor",
  title: "На странице нет главного заголовка",
  impact: "Поисковику не за что зацепиться.",
};

test("список разбирается так, как его реально вставляют", () => {
  const targets = parseTargets(
    [
      "mebel-tashkent.uz",
      "ООО «Ромашка» — romashka.uz",
      "https://example.uz/catalog, Пример",
      "Кафе Достон\tdoston.uz",
      "   ",
      "просто текст без адреса",
    ].join("\n"),
  );

  assert.equal(targets.length, 5, "пустая строка не должна становиться целью");

  assert.equal(targets[0].url, "https://mebel-tashkent.uz/");
  assert.equal(targets[0].label, null);

  // Название компании с пробелами не должно резаться по первому пробелу.
  assert.equal(targets[1].label, "ООО «Ромашка»");
  assert.equal(targets[1].url, "https://romashka.uz/");

  assert.equal(targets[2].label, "Пример");
  assert.match(targets[2].url ?? "", /^https:\/\/example\.uz\/catalog/);

  assert.equal(targets[3].label, "Кафе Достон");
  assert.equal(targets[3].url, "https://doston.uz/");

  const junk = targets[4];
  assert.equal(junk.url, null);
  assert.ok(junk.problem, "строка без адреса должна объяснять, почему не взята");
});

test("один и тот же сайт не проверяется дважды", () => {
  // Дубли в выгрузках — обычное дело, и второй проход означает второй стук
  // к человеку, который ни о чём не просил.
  const targets = parseTargets(
    ["romashka.uz", "https://romashka.uz/", "www.romashka.uz/contacts"].join("\n"),
  );
  assert.equal(targets.length, 1);
});

test("список длиннее потолка обрезается, а не проглатывается", () => {
  const many = Array.from({ length: BATCH_CAP + 50 }, (_, i) => `site${i}.uz`).join("\n");
  assert.equal(parseTargets(many).length, BATCH_CAP);
});

test("адрес во внутреннюю сеть не становится целью", () => {
  // Разбор в браузере — не защита, настоящая проверка на сервере. Но
  // пропустить такое в список значило бы показать менеджеру строку, по
  // которой мы пойдём стучаться сами в себя.
  for (const bad of ["file:///etc/passwd", "ftp://example.uz", "javascript:alert(1)"]) {
    const [target] = parseTargets(bad);
    assert.equal(target.url, null, `«${bad}» разобрался как адрес сайта`);
  }
});

test("в письмо идёт самая тяжёлая находка", () => {
  const lead = leadFinding(report([MINOR, CRITICAL]));
  assert.equal(lead?.code, "no_viewport", "мелочь вытеснила критичное");
});

test("сайт без претензий не даёт черновика", () => {
  // Это главное правило всей затеи: касание без содержания портит и
  // адресата, и того, кто пишет. Пустая строка честнее вымученного повода.
  const result = pitch(report([]), "ООО «Ромашка»");
  assert.equal(result.ok, false);
  assert.ok(result.ok === false && result.why);
});

test("черновик называет находку словами адресата и не сыплет внутренним", () => {
  const result = pitch(report([CRITICAL, MINOR]), "ООО «Ромашка»");
  assert.ok(result.ok);
  const text = result.ok ? result.text : "";

  assert.ok(text.includes("ООО «Ромашка»"), "название компании не подставилось");
  assert.ok(/телефон/i.test(text), "находка не названа по существу");

  // Внутренние коды проверок, коды ошибок и жаргон в письмо не попадают.
  for (const leak of ["no_viewport", "no_h1", "severity", "critical", "ttfb", "undefined", "null"]) {
    assert.ok(!text.includes(leak), `в черновике встретилось «${leak}»`);
  }

  // Обещаний, которые нечем подтвердить, быть не должно.
  for (const promise of ["в топ", "гарантируем", "первое место", "% продаж"]) {
    assert.ok(!text.toLowerCase().includes(promise), `в черновике обещание «${promise}»`);
  }
});

test("разные находки дают разные заходы, а не шаблон с подстановкой", () => {
  const slow: Finding = {
    code: "slow",
    severity: "major",
    title: "Сервер отвечает за 4.2 сек",
    impact: "Посетитель смотрит на белый экран.",
  };

  const a = pitch(report([CRITICAL]), null);
  const b = pitch(report([slow], { ttfbMs: 4200 }), null);
  assert.ok(a.ok && b.ok);

  const textA = a.ok ? a.text : "";
  const textB = b.ok ? b.text : "";
  assert.notEqual(textA, textB);
  // Замер попадает в письмо числом: это и есть то, что адресат может пойти
  // и проверить сам.
  assert.ok(textB.includes("4.2"), "замер не попал в черновик");
});

test("недоступный сайт — это находка, а не пропуск", () => {
  const row = toProspectRow({
    target: { raw: "romashka.uz", url: "https://romashka.uz/", label: "Ромашка", problem: null },
    report: report([
      {
        code: "unreachable",
        severity: "critical",
        title: "Сайт не отвечает",
        impact: "Не открылся: домен не найден.",
      },
    ]),
    failure: null,
  });

  assert.ok(row.draft, "по неотвечающему сайту черновик должен быть");
  assert.ok(!row.draft?.includes("unreachable"));
});

test("строка без отчёта объясняет причину и не выдумывает черновик", () => {
  const row = toProspectRow({
    target: { raw: "10.0.0.1", url: null, label: null, problem: "адрес отклонён: private" },
    report: null,
    failure: "адрес отклонён: private",
  });

  assert.equal(row.draft, null);
  assert.equal(row.score, null);
  assert.ok(row.note);
});

test("телефон и голый IP не принимаются за сайт", () => {
  // В таких списках телефоны попадаются постоянно, и точки в них есть.
  // Без проверки на буквы в домене менеджер получил бы строку «сайт не
  // отвечает» по номеру телефона и пошёл бы выяснять, что у клиента с
  // хостингом.
  for (const bad of ["+998.90.1234567", "998.90.123.45.67", "10.0.0.1", "127.0.0.1:3000"]) {
    const [target] = parseTargets(bad);
    assert.equal(target.url, null, `«${bad}» разобрался как адрес сайта`);
    assert.ok(target.problem);
  }

  // А настоящие адреса с цифрами в имени по-прежнему проходят.
  for (const good of ["shop24.uz", "1c-service.uz", "mysite.uz:8443"]) {
    const [target] = parseTargets(good);
    assert.ok(target.url, `«${good}» отвергнут, хотя это адрес сайта`);
  }
});
