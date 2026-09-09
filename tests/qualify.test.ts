/**
 * Тесты на чистые функции, где цена ошибки максимальна, а зависимостей нет.
 *
 * Пирамиды здесь нет намеренно: покрыты ровно те места, где поломка не видна
 * глазом и стоит потерянного лида — скоринг, по которому лид маршрутизируется,
 * и формат брифа, который Telegram отвергает целиком, если разметка битая.
 *
 * Запуск: npm test
 */
import { test } from "node:test";
import assert from "node:assert/strict";

import { scoreLead } from "@/lib/qualify/scoring";
import { esc, formatLeadBrief } from "@/lib/qualify/telegram";
import { newRequestNo } from "@/lib/qualify/engine";
import { clientIp } from "@/lib/qualify/limiter";
import type { QualifyToolInput } from "@/lib/qualify/types";

/** Идеальный лид: все составляющие в максимуме. */
function perfect(): QualifyToolInput {
  return {
    contact_name: "Азиз Каримов",
    company: "Магнат",
    contact_handle: "@azizk",
    contact_kind: "telegram",
    niche: "сеть магазинов",
    niche_tier: 1,
    expertise: "high",
    services: ["ecommerce"],
    budget: "B1",
    authority: "A1",
    need: "N1",
    timing: "T1",
    intent: "interested",
    summary: {
      client: "", request: "", niche: "", expertise: "",
      budget: "", authority: "", need: "", timing: "",
    },
    notes: "",
    opening_line: "",
    already_told: [],
    avoid_asking: [],
  };
}

test("веса скоринга дают ровно 100 на идеальном лиде", () => {
  // Инвариант из комментария к WEIGHTS: сумма максимумов равна 100, чтобы
  // балл читался как процент. Проверяем его, а не отдельные веса — при
  // правке любого из шести весов тест упадёт, и это как раз нужно.
  assert.equal(scoreLead(perfect(), "ru").score, 100);
});

test("границы грейдов: 75 / 55 / 35", () => {
  const at = (input: Partial<QualifyToolInput>) =>
    scoreLead({ ...perfect(), ...input }, "ru");

  assert.equal(at({}).grade, "A");                                   // 100
  assert.equal(at({ niche_tier: 3, expertise: "low" }).grade, "B");   // 65
  assert.equal(at({ niche_tier: 3, expertise: "low",
                    budget: "B3", authority: "A3" }).grade, "C");     // 41
  assert.equal(at({ niche_tier: 3, expertise: "low", budget: "B3",
                    authority: "A3", need: "N3", timing: "T3" })
                 .grade, "D");                                       // 25
});

test("просьба поговорить с человеком поднимает в горячие при любом балле", () => {
  // Осознанное переопределение: отказать в живом разговоре дороже, чем
  // потратить время продавца. Балл здесь минимальный — приоритет всё равно hot.
  const lead = scoreLead(
    { ...perfect(), niche_tier: 3, expertise: "low", budget: "B3",
      authority: "A3", need: "N3", timing: "T3", intent: "needs_human" },
    "ru",
  );
  assert.equal(lead.grade, "D");
  assert.equal(lead.priority, "hot");
});

test("явный отказ уводит в архив даже при сотне баллов", () => {
  const lead = scoreLead({ ...perfect(), intent: "not_interested" }, "ru");
  assert.equal(lead.score, 100);
  assert.equal(lead.priority, "archive");
});

test("esc экранирует кавычку — иначе бриф не доходит вообще", () => {
  // Контакт вида «"Иван" <ivan@mail.ru>» копируется из почтового клиента.
  // Без экранирования кавычки он закрывает атрибут href раньше времени,
  // Telegram отвергает сообщение целиком, и лид теряется молча.
  assert.equal(
    esc('"Иван" <ivan@mail.ru> & Ко'),
    "&quot;Иван&quot; &lt;ivan@mail.ru&gt; &amp; Ко",
  );
});

test("бриф не превышает лимит Telegram на патологическом входе", () => {
  const huge = "я".repeat(9000);
  const lead = scoreLead(
    { ...perfect(), notes: huge, niche: huge, company: huge,
      already_told: [huge], avoid_asking: [huge] },
    "ru",
  );
  const brief = formatLeadBrief(lead, "DZ-0904-K4M7");
  assert.ok(brief.length <= 4096, `бриф ${brief.length} символов`);
  // Обрезка не должна оставлять оборванный тег: Telegram такое не принимает.
  assert.equal((brief.match(/</g) ?? []).length, (brief.match(/>/g) ?? []).length);
});

test("номер заявки: формат DZ-MMDD-XXXX без похожих друг на друга символов", () => {
  const no = newRequestNo(new Date(Date.UTC(2026, 8, 4)));
  assert.match(no, /^DZ-0904-[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{4}$/);
  // 0/O и 1/I исключены намеренно — но только из случайного хвоста: в дате
  // ноль встречается законно (0904), и проверять всю строку было бы неверно.
  assert.doesNotMatch(no.slice(-4), /[01OI]/);
});

test("адрес клиента берётся из заголовка, который нельзя подделать", () => {
  const req = (headers: Record<string, string>) =>
    clientIp(new Request("https://devuz.maximov-tech.ru/api/audit", { headers }));

  // Главный случай: посетитель прислал свой X-Forwarded-For, nginx дописал
  // настоящий адрес справа и проставил X-Real-IP. Верить можно только ему,
  // иначе лимит обходится сменой одной строки в запросе.
  assert.equal(
    req({ "x-forwarded-for": "1.2.3.4", "x-real-ip": "203.0.113.9" }),
    "203.0.113.9",
  );

  // Без X-Real-IP берём последний элемент — он ближе всего к нам.
  assert.equal(req({ "x-forwarded-for": "1.2.3.4, 203.0.113.9" }), "203.0.113.9");

  // Пустые значения не должны превращаться в ключ, общий для всех.
  assert.equal(req({ "x-real-ip": "   ", "x-forwarded-for": "203.0.113.9" }), "203.0.113.9");
  assert.equal(req({}), "unknown");
});
