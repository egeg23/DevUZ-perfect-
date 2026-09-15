import assert from "node:assert/strict";
import { test } from "node:test";

import { readFileSync } from "node:fs";

import { razborCopy } from "@/content/razbor/page-copy";
import { forecast, lossFor, scaleTo } from "@/lib/razbor/forecast";
import { RAZBOR_LOCALES } from "@/lib/razbor/routing";

/**
 * Прогноз потерь.
 *
 * Здесь проверяется не арифметика ради арифметики, а три обещания, которые
 * владелец студии даёт читателю: цифра не превышает ста процентов, она
 * растёт не быстрее, чем список находок, и она не берётся из воздуха для
 * находки, которой мы доли не назначали.
 */

const f = (...codes: string[]) => codes.map((code) => ({ code }));

test("потери не суммируются, а накапливаются через дошедших", () => {
  // Пять находок по 25 % суммой дали бы 125 % — больше, чем людей было.
  // Человек, ушедший из-за отсутствия телефона, второй раз не уйдёт.
  const many = forecast(f("no_phone", "no_prices", "no_messenger", "slow", "no_title"));
  assert.ok(many.lostPer100[1] <= 100, `верхняя граница ${many.lostPer100[1]}`);
  assert.ok(many.lostPer100[0] <= many.lostPer100[1], "границы перепутаны");
});

test("больше находок — больше потерь, и никогда наоборот", () => {
  const one = forecast(f("no_prices"));
  const two = forecast(f("no_prices", "no_messenger"));
  const three = forecast(f("no_prices", "no_messenger", "no_phone"));
  assert.ok(one.lostPer100[1] < two.lostPer100[1]);
  assert.ok(two.lostPer100[1] < three.lostPer100[1]);
});

test("здоровый сайт теряет ноль, а не «немного»", () => {
  const none = forecast([]);
  assert.deepEqual(none.lostPer100, [0, 0]);
  assert.deepEqual(none.counted, []);
});

test("находка без назначенной доли в расчёт не идёт и об этом говорится", () => {
  // Появится новая проверка — она не должна молча получить цифру.
  const r = forecast(f("no_prices", "чего-то-нового"));
  assert.deepEqual(r.counted, ["no_prices"]);
  assert.deepEqual(r.skipped, ["чего-то-нового"]);
  assert.equal(lossFor("чего-то-нового"), null);
});

test("повтор одной находки потери не удваивает", () => {
  assert.deepEqual(
    forecast(f("no_phone", "no_phone")).lostPer100,
    forecast(f("no_phone")).lostPer100,
  );
});

test("лежащий сайт теряет почти всё", () => {
  const dead = forecast(f("unreachable"));
  assert.ok(dead.lostPer100[0] >= 90, `нижняя граница ${dead.lostPer100[0]}`);
  assert.equal(dead.lostPer100[1], 100);
});

test("границы разведены: это оценка, а не замер", () => {
  // Узкий диапазон читается как измерение, которым он не является.
  for (const code of ["no_phone", "no_prices", "no_messenger", "slow"]) {
    const band = lossFor(code);
    assert.ok(band, `нет доли для ${code}`);
    assert.ok(band[1] > band[0] * 1.3, `${code}: границы слишком близко`);
    assert.ok(band[1] <= 1 && band[0] >= 0, `${code}: доля вне [0,1]`);
  }
});

test("пересчёт на месяц берёт число владельца, а не выдумывает своё", () => {
  const r = forecast(f("no_phone", "no_prices"));
  const [lo, hi] = scaleTo(r, 400);
  assert.equal(lo, Math.round(r.lostPer100[0] * 4));
  assert.equal(hi, Math.round(r.lostPer100[1] * 4));

  // Без числа — ноль, а не догадка.
  assert.deepEqual(scaleTo(r, 0), [0, 0]);
  assert.deepEqual(scaleTo(r, -100), [0, 0]);
  assert.deepEqual(scaleTo(r, Number.NaN), [0, 0]);
});

test("у каждой проверки аудита есть доля, кроме намеренно пропущенных", () => {
  // Если проверку завели, а долю забыли, прогноз молча занизится — и
  // заметить это будет нечем.
  const codes = [
    "unreachable", "http_error", "no_https", "cert_expiring", "no_viewport",
    "slow", "no_title", "no_description", "no_og", "no_h1",
    "no_phone", "phone_not_clickable", "no_messenger", "no_prices",
    "img_no_alt", "no_schema", "one_language", "mixed_content",
  ];
  for (const code of codes) {
    assert.ok(lossFor(code), `проверка ${code} заведена, а доля не назначена`);
  }
});

/* ── Как это доезжает до человека ───────────────────────────────────────── */

const ROOT = new URL("../", import.meta.url);
const read = (file: string) => readFileSync(new URL(file, ROOT), "utf8");

test("цифра в статье хранится, а не пересчитывается при показе", () => {
  // Набор проверок растёт. Пересчёт задним числом менял бы число в уже
  // опубликованном тексте: читатель увидел бы одно, а через месяц другое.
  const items = read("content/razbor/items.ts");
  assert.match(items, /lostPer100: readonly \[number, number\] \| null/);

  const page = read("app/[locale]/razbor/[slug]/page.tsx");
  assert.match(page, /item\.lostPer100/);
  assert.ok(!page.includes("forecast("), "страница считает заново вместо чтения");
});

test("оговорка про допущение стоит рядом с цифрой на всех языках", () => {
  // Число без этой строки читается как замер чужой статистики, которого мы
  // не делали. Убрать её — превратить расчёт в то самое «+340 % конверсии».
  const page = read("app/[locale]/razbor/[slug]/page.tsx");
  const at = page.indexOf("copy.lossBody");
  assert.ok(at > 0, "блок потерь пропал со страницы");
  assert.match(page.slice(at, at + 400), /copy\.lossHow/);

  for (const locale of RAZBOR_LOCALES) {
    const copy = razborCopy[locale];
    assert.ok(copy.lossHow.length > 60, `${locale}: оговорка слишком короткая`);
    assert.match(copy.lossBody, /\{lo\}.*\{hi\}/, `${locale}: нет мест под числа`);
  }
  // Не «строки разные», а именно узбекский: Google индексирует узбекский на
  // латинице, и кириллица в этом поле — не опечатка, а выпадение из выдачи.
  for (const key of ["lossTitle", "lossBody", "lossHow"] as const) {
    assert.ok(
      !/[\u0400-\u04FF]/.test(razborCopy.uz[key]),
      `uz.${key} написан кириллицей: «${razborCopy.uz[key].slice(0, 40)}…»`,
    );
    assert.ok(/[\u0400-\u04FF]/.test(razborCopy.ru[key]), `ru.${key} не по-русски`);
  }
});

test("аудитор показывает потери и ту же оговорку", () => {
  const audit = read("components/audit/site-audit.tsx");
  assert.match(audit, /forecast\(report\.findings\)/);
  assert.match(audit, /t\.lossHow/);
  // Блока нет, когда терять нечего: «теряется 0 из 100» читается глупо.
  assert.match(audit, /loss\.counted\.length > 0 && loss\.lostPer100\[1\] > 0/);
});

test("подписи есть во всех четырёх языках сайта", () => {
  const dict = read("content/dictionaries.ts");
  for (const key of ["lossTitle", "lossBody", "lossHow", "lossNone"]) {
    const count = dict.split(`${key}:`).length - 1;
    assert.equal(count, 4, `${key}: заведён в ${count} словарях вместо четырёх`);
  }
});

test("ежедневная задача обязана читать мастер-промпт", () => {
  // Мастер-промпт нужен именно дешёвой модели: смоук-тест показал, что она
  // укладывается во все формальные рамки и всё равно сдаёт брак.
  const daily = read(".claude/skills/razbor-daily/SKILL.md");
  const at = daily.indexOf("razbor-master");
  const seo = daily.indexOf("seo-razbor/SKILL.md");
  assert.ok(at > 0, "задача не знает про мастер-промпт");
  assert.ok(at < seo, "мастер-промпт читается после seo-razbor, а не до");

  const master = read(".claude/skills/razbor-master/SKILL.md");
  for (const must of ["forecast(", "lostPer100", "services.ts", "дословно"]) {
    assert.ok(master.includes(must), `в мастер-промпте нет «${must}»`);
  }
});
