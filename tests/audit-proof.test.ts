/**
 * Чем письмо подпирает себя, кроме находок.
 *
 * Владелец: «надо ещё жути нагнать, вот — делали тут конкуренту вашему
 * (ссылка), вырос в X раз по заказам… результат по любой нише в среднем
 * х2-х4 к лидогенерации»; и следом: «у нас и так штат 65 человек айтишников
 * и более 550 завершённых проектов из разных ниш. Я привёл тебе среднее
 * значение. Подтверждение моих слов перед клиентом будет статистика нашего
 * аналитика до / после».
 *
 * Отсюда две вещи, которые здесь и сторожатся. Числа масштаба живут в одном
 * месте и в письмо попадают оттуда, а не из головы модели. А проект в письме
 * называется только настоящий и только из ниши адресата: «делали в вашей
 * нише» про чужую нишу адресат ловит за десять секунд, и на этом письмо
 * заканчивается вместе со студией.
 */
import { test } from "node:test";
import assert from "node:assert/strict";

import { NICHES } from "@/content/razbor/catalog";
import { cases } from "@/content/cases";
import { proof } from "@/content/company";
import { nicheBrief, proofFor, proofLines, referenceFor } from "@/lib/audit/proof";

test("застройщик не уезжает в письмо логистической компании", () => {
  // Владелец: «MAVERA идёт в пример логистики, странно. Это же застройщик,
  // так же как и Golden House».
  //
  // Так и было: подбор шёл по общим словам, у MAVERA в нишах стоит
  // «quruvchi kompaniya», у логистики в приметах — «logistika kompaniya»,
  // и слова «kompaniya» хватало. Адресат видит такую подстановку первым же
  // переходом по ссылке: ему прислали застройщика как пример его ниши.
  const logistics = referenceFor("logistika");
  assert.notEqual(logistics?.name, "MAVERA", "застройщик снова в примерах логистики");
  assert.equal(logistics?.name, "TezKetKaz");

  // Та же ошибка через слово «услуги»: юрфирме показывали маркетплейс
  // бытовых услуг.
  assert.equal(referenceFor("yurfirma")?.name, "Legal AI");
});

test("каждая ниша получает либо свой кейс, либо честное ничего", () => {
  // Ни одна ниша не должна получить кейс, у которого её нет в списке.
  // Список проставлен руками — это и есть то место, где решается, что
  // «в вашей нише» не ложь.
  for (const niche of NICHES) {
    const ref = referenceFor(niche.key);
    if (!ref) continue;
    const item = cases.find((c) => c.name === ref.name);
    assert.ok(item, `кейс ${ref.name} не нашёлся в списке`);
    assert.ok(
      item.forNiches.includes(niche.key),
      `${niche.key}: подставлен ${ref.name}, у которого этой ниши нет`,
    );
  }
});

test("письмо говорит словами ниши адресата, а не про «сайт вообще»", () => {
  // Владелец: «адаптируй обращение в зависимости от ниши того, чем
  // занимается потенциальный клиент».
  const brief = nicheBrief("logistika");
  assert.match(brief, /логистическая компания/);
  assert.match(brief, /перевозки по стране/);
  assert.match(brief, /склад/);
  // Ничего про стоматологию в письме логисту быть не может.
  assert.ok(!/кариес/i.test(brief));

  // Ниша, которой нет в каталоге разборов, но которую классификатор знает:
  // имя берём у кейса, услуги не выдумываем.
  const developer = nicheBrief("nedvizhimost", referenceFor("nedvizhimost"));
  assert.match(developer, /Адресат — застройщик/);

  // Ниша неизвестна — никакого описания бизнеса из головы.
  assert.equal(nicheBrief(null), "");
});

test("латинский слаг ниши доходит до русских кейсов", () => {
  // Классификатор отдаёт «nedvizhimost», кейс описан как «недвижимость» —
  // общих букв у этих строк нет ни одной. Живой прогон по
  // nirvanaresidence.uz на этом и споткнулся: нишу определили верно, а самая
  // сильная строка письма в него не попала.
  const ref = referenceFor("nedvizhimost");
  assert.ok(ref, "слаг ниши обязан доходить до кейса");
  assert.equal(ref.url, "https://devuz.studio/cases/mavera");
  assert.equal(ref.niche, "застройщик");
});

test("заголовки страниц работают там, где ниша не определилась", () => {
  // Классификатор знает четырнадцать ниш, и мир в них не помещается. Но в
  // заголовке страницы «жилой комплекс» стоит открытым текстом — и этого
  // достаточно, чтобы пример нашёлся.
  const ref = referenceFor(null, ["Nirvana Residence — жилой комплекс в Ташкенте"]);
  assert.equal(ref?.name, "MAVERA");
});

test("не нашлось ничего — не подставляем похожее", () => {
  // Соблазн показать «ну хоть что-нибудь» здесь стоит дороже пустоты:
  // «делали в вашей нише» про чужую нишу — это ложь, которую проверяют
  // одним переходом по ссылке.
  assert.equal(referenceFor("ветеринарная стоматология для рептилий"), null);
  assert.equal(referenceFor(null), null);
  assert.equal(referenceFor(""), null);

  // Короткие слова не считаются совпадением: «сайт» и «B2B» есть у всех.
  assert.equal(referenceFor("B2B"), null);
});

test("свой сайт не показываем как пример работы для клиента", () => {
  // У кейса devuz в нишах стоят «услуги» и «лендинг» — под них попадает
  // половина адресатов. «Мы сделали сайт себе» в ответ на «а вы кому-то
  // делали» — это ответ «нет».
  const self = cases.find((c) => c.slug === "devuz");
  assert.ok(self, "кейс студии должен быть в списке — иначе тест ничего не сторожит");
  for (const niche of self.niches) {
    assert.notEqual(referenceFor(niche)?.url, "https://devuz.studio/cases/devuz");
  }
});

test("масштаб берётся из одного места, а не из головы модели", () => {
  const p = proofFor("dostavka");
  assert.equal(p.staff, proof.staff);
  assert.equal(p.projects, proof.projects);
  assert.deepEqual([...p.lift], [...proof.lift]);

  const lines = proofLines(p);
  assert.ok(lines.includes(String(proof.staff)));
  assert.ok(lines.includes(String(proof.projects)));
  assert.ok(lines.includes(`${proof.lift[0]}–${proof.lift[1]}`));

  // Среднее названо средним. Обещание «вырастем в четыре раза» — это уже
  // обязательство, за которое отвечать нечем.
  assert.match(lines, /средн/i);
  assert.ok(!/гаранти/i.test(lines), "в подпорке не должно быть гарантий");

  // Проверка словами клиента: статистика до и после.
  assert.match(lines, /до работ и после/);
});

test("нет примера — промпт прямо запрещает называть чужой проект", () => {
  const lines = proofLines(proofFor("ветеринарная стоматология для рептилий"));
  assert.ok(!lines.includes("devuz.studio/cases/"), "ссылки на кейс быть не должно");
  assert.match(lines, /не должно/);
});

test("ссылка на пример ведёт на существующий разбор", () => {
  // Битая ссылка в холодном письме хуже её отсутствия: адресат нажал,
  // получил 404 и закрыл разговор.
  const ref = referenceFor("nedvizhimost");
  assert.ok(ref);
  const slug = ref.url.split("/").pop();
  assert.ok(cases.some((c) => c.slug === slug), `кейса ${slug} нет в списке`);
});

/* ── Сайт и письмо говорят одно число ──────────────────────────────────── */

test("оба числа из письма есть на сайте и стоят выше остальных", async () => {
  const { headline, stats } = await import("@/content/company");

  // Стояло «12+ проектов в продакшене», а письмо говорило «550+
  // завершённых». Формально разные величины, но адресат, перешедший по
  // ссылке, разницы не разбирает: он видит два числа, расходящихся в сорок
  // раз, и дальше не верит ни баллу видимости, ни расчёту потерь, ни всему
  // остальному, что мы честно измерили.
  const projects = headline.find((h) => h.value === String(proof.projects));
  assert.ok(projects, `на сайте нет числа ${proof.projects}`);
  assert.equal(projects.suffix, "+", "«550» без плюса читается как ровно 550");

  // Штат письмо называет тоже — и он обязан находиться там же, где ищут.
  assert.ok(
    headline.some((h) => h.value === String(proof.staff)),
    `на сайте нет числа ${proof.staff}`,
  );

  // Выше остальных — не по вёрстке, а по тому, что это разные списки:
  // подпорка письма и рассказ о работе. Смешав их, мы бы через месяц
  // получили обратно одну сетку, в которой штат стоит четвёртым.
  for (const h of headline) {
    assert.ok(
      !stats.some((s) => s.value === h.value),
      `${h.value} задвоилось: оно и в главных числах, и в остальных`,
    );
  }

  // Ни одно прежнее число не потерялось по дороге.
  for (const kept of ["4", "35", "60"]) {
    assert.ok(stats.some((s) => s.value === kept), `плитка «${kept}» пропала с сайта`);
  }
});

test("число в заголовке кейсов подставляется на всех языках", async () => {
  const { casesTitle } = await import("@/content/company");
  const { getDictionary } = await import("@/content/dictionaries");
  const { locales } = await import("@/lib/i18n");

  for (const locale of locales) {
    const title = casesTitle(getDictionary(locale).cases.title);
    assert.ok(title.includes(String(proof.projects)), `${locale}: числа нет в заголовке`);
    // Незамещённая скобка на витрине — то же, что ценник с «{price}».
    assert.ok(!title.includes("{n}"), `${locale}: «{n}» осталось в заголовке`);
  }
});
