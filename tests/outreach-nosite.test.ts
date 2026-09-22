import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { canContact } from "@/lib/admin/outreach";
import { NOSITE_SYSTEM, nositeProblems, nositePrompt } from "@/lib/admin/outreach-nosite";
import { EMPTY_CONTACTS } from "@/lib/audit/contacts";

const ROOT = new URL("../", import.meta.url);
const read = (file: string) => readFileSync(new URL(file, ROOT), "utf8");

/**
 * Касание компании, у которой сайта нет.
 *
 * Половина малого бизнеса в Ташкенте живёт в инстаграме, и именно ему наш
 * разговор нужнее всего. Обычное касание строится вокруг находки на сайте —
 * здесь открывать нечего, и подставлять вместо находки общие слова нельзя:
 * получится ровно та рассылка, от которой весь разбор и отстраивается.
 */

const PROMPT = nositePrompt({ label: "Barber House", niche: "барбершоп", sender: "Егор" });

test("письмо пишется от ниши, а не от находок", () => {
  assert.match(PROMPT, /Barber House/);
  assert.match(PROMPT, /барбершоп/);
  // Зацепка одна и она проверяемая: человек ищет нишу в поиске и попадает к
  // конкурентам. Это адресат проверит со своего телефона за минуту.
  assert.match(PROMPT, /барбершоп Ташкент/);
  assert.match(PROMPT, /Сайта нет/);

  // Запрет на выдумывание — в системном промпте, а не в пожеланиях: про
  // компанию без сайта мы не знаем ничего, и первая же выдуманная деталь
  // закрывает разговор.
  assert.match(NOSITE_SYSTEM, /Не выдумывай ничего про его дело/);
  assert.match(NOSITE_SYSTEM, /Соцсети не ругай/);
});

const GOOD = [
  "Здравствуйте! Меня зовут Егор, я из веб-студии devuz.studio в Ташкенте.",
  "Нашёл вас через знакомых: вы барбершоп, а сайта у вас нет.",
  "Это значит, что человек, который ищет барбершоп в Ташкенте через поиск, попадает не к вам, а к тем, у кого сайт есть.",
  "Откройте поиск и посмотрите сами — это видно за минуту.",
  "Аккаунт в соцсети это хорошо, но его можно потерять вместе со всей перепиской, и поиск его не читает.",
  "Могу собрать первый экран под ваши услуги и прислать ссылку — посмотрите, как это выглядело бы у вас.",
].join(" ");

test("хорошее письмо проверка пропускает", () => {
  assert.deepEqual(nositeProblems(GOOD, PROMPT), []);
});

test("проверка ловит то же, что и у обычного касания", () => {
  // Кто пишет — обязательно: без адреса студии письмо читается как спам от
  // неизвестного.
  assert.ok(
    nositeProblems(GOOD.replace("devuz.studio", "нашей студии"), PROMPT).some((p) => p.code === "no_us"),
  );

  // Обещание позиций — самый быстрый способ уехать в спам у того, кто читал
  // уже двадцать похожих писем.
  assert.ok(
    nositeProblems(`${GOOD} Выведем вас в топ.`, PROMPT).some((p) => p.code === "banned"),
  );

  // Выдуманное число в письме к тому, о ком мы не знаем ничего.
  assert.ok(
    nositeProblems(`${GOOD} Вы теряете 47 клиентов в месяц.`, PROMPT).some((p) => p.code === "invented"),
  );

  assert.ok(nositeProblems("Здравствуйте, это devuz.studio.", PROMPT).some((p) => p.code === "short"));
});

test("компанию без сайта не отсекают проверки, рассчитанные на сайт", () => {
  const empty = { contacts: EMPTY_CONTACTS, findings: [], status: "new" };

  // Обе проверки смотрят на то, что дал разбор сайта: находки и контакты,
  // опубликованные на нём. У компании без сайта нет ни того, ни другого — и
  // никогда не будет.
  assert.notEqual(canContact(empty), "ok", "сайт без находок вдруг стало о чём разбирать");
  assert.equal(canContact({ ...empty, noSite: true }), "ok");

  // Повтор при этом остаётся повтором: второе касание — это рассылка, и
  // отсутствие сайта тут ничего не меняет.
  assert.equal(canContact({ ...empty, noSite: true, status: "sent" }), "already");
});

test("ветка без сайта стоит до разбора, а не внутри него", () => {
  const store = read("lib/admin/outreach-store.ts");

  // Если поставить её после canContact, та откажет всем таким карточкам
  // разом — по находкам, которых не будет никогда.
  const prepare = store.slice(store.indexOf("export async function prepareOutreach"));
  const branch = prepare.indexOf("prepareNoSite");
  const gate = prepare.indexOf("canContact({");
  assert.ok(branch > 0 && branch < gate, "разбор сайта успевает отказать компании без сайта");

  // Строки ложатся без адреса и домена: уникальность по хосту в базе теперь
  // частичная, иначе вторая компания без сайта не завелась бы вовсе.
  assert.match(store, /url: null, host: null/);
  assert.match(
    read("supabase/migrations/0043_touch_plan.sql"),
    /on public\.prospects \(host\)\s*\n\s*where host is not null/,
  );
});

test("галочка меняет смысл поля, и ниша спрашивается сразу", () => {
  const runner = read("components/admin/prospect-runner.tsx");

  assert.match(runner, /У компании нет сайта/);
  // Поле ниши появляется по галочке — оно и есть то единственное, от чего
  // будет написано письмо.
  assert.match(runner, /\{noSite \? \(\s*\n\s*<label/);
  assert.match(runner, /Ниша — от неё будет написано письмо/);
  assert.match(runner, /saveNoSiteAction/);

  // Без ниши кнопка не нажимается: письмо вышло бы про «ваш бизнес», то есть
  // про никого.
  assert.match(runner, /disabled=\{running \|\| !names\.length \|\| !niche\.trim\(\)\}/);
});
