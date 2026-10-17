/**
 * Продажа после ответа — про него, цена раньше, ответы на возражения.
 *
 * Владелец, 17.10.2026: «Делаем все по твоим рекомендациям, они правдивые».
 * 07–17.10.2026: 453 «Здравствуйте» → 206 ответили, 188 получили кружок →
 * 63 ответили после него, «+» — 5; за 30 дней 41 макет, 0 оплат.
 *
 * Запуск: npm test
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { pickCircles, pickNicheCircles, circleFor, circleFileKey, slotOfFileKey, missingNicheSlots } from "@/lib/admin/circle-store";
import { circleNicheButtons, circleNicheChoice, circleChoice } from "@/lib/admin/circle-bot";
import { LADDER, PROMO, announceText } from "@/lib/admin/mockup-offer";
import { OBJECTIONS, objectionOf, objectionReply } from "@/lib/admin/objections";
import { jargonWords } from "@/lib/admin/outreach";
import { readInbound } from "@/lib/admin/outreach-talk";
import { aiMarkers, LONG_DASH, SPACED_HYPHEN } from "@/lib/proto/plain-text";
import {
  AB_MIN_HELLO,
  CIRCLE_NICHES,
  HUMAN_MAX_MS,
  HUMAN_MIN_MS,
  SALES_NEW,
  abVerdict,
  aiStyleProblems,
  bossAskDue,
  bossAskText,
  circleNicheOf,
  humanSendAfter,
  introLine,
  introTargetOf,
  isAutoReply,
  ladderLines,
  pickArm,
  plainHost,
  priceLine,
  salesNew,
  showLine,
  withoutOpener,
  type ArmCounts,
} from "@/lib/admin/sales-after-reply";

const read = (file: string) => readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
const between = (text: string, from: string, to: string) => {
  const start = text.indexOf(from);
  return text.slice(start, text.indexOf(to, start + from.length));
};

/** Текст клиенту проходит те же проверки, что письма и макеты. */
function clientTextOk(text: string, lang: "ru" | "uz", hosts: string[] = []) {
  assert.deepEqual(jargonWords(text, hosts), [], `жаргон: ${text}`);
  assert.ok(!LONG_DASH.test(text), `длинное тире: ${text}`);
  assert.ok(!SPACED_HYPHEN.test(text), `тире дефисом: ${text}`);
  assert.deepEqual(aiMarkers(text), [], `штамп: ${text}`);
  if (lang === "uz") assert.ok(!/[А-Яа-яЁё]/.test(text), `кириллица в узбекском: ${text}`);
}

test("1. автоответчик — не ответ: примеры из базы", () => {
  for (const text of [
    "Мы отвечаем в рабочее время \n\nПн–Пт 10:00–18:00. \n\nВаше сообщение получено, ответим при первой возможности.",
    "Здравствуйте! Вы обратились к нам в нерабочее время или мы не в сети.",
    "Спасибо за обращение в Novikov Café! \n\nМы свяжемся с вами в ближайшее время.",
    "Ваше сообщение передано менеджеру",
    "Добрый день! Вы обратились в коммерческую службу WEproject. Менеджер вам ответит в рабочее время.",
    "Assalomu alaykum!\nHunter Avtoservisi ga murojaatingiz uchun rahmat.\n\n✅Xabaringiz qabul qilindi.",
    "Assalomu alaykum!\nSizga tez orada javob beramiz)",
    "👍Assalomu Aleykum!\nAfsuski, operatorlar hozir ishlamayapti.\nBizning ish vaqtlarimiz: har kuni soat 9:00 dan 18:00 gacha.",
    "Hello!\nThank you for contacting Westminster International School in Tashkent.\nOur working hours are Monday to Friday.",
  ]) {
    assert.ok(isAutoReply(text), text);
  }
  // Живые ответы — ответы.
  for (const text of ["Да?", "Кто это?", "Какой сайт?", "Assalomu alaykum", "Спасибо за предложение! Мы обдумаем и если будет актуально, мы свяжемся с вами", "Дорого", "+"]) {
    assert.ok(!isAutoReply(text), text);
  }
  // Встроено до всего остального и для обеих половин A/B.
  const store = read("lib/admin/outreach-talk-store.ts");
  const save = between(store, "async function saveInbound(", "/**\n * Клиент ответил на «Здравствуйте»");
  assert.ok(save.indexOf("isAutoReply(body)") < save.indexOf("const hello = waitsForPitch(prospect);"), "автоответчик — раньше «Здравствуйте»");
  assert.match(save, /if \(isAutoReply\(body\)\) \{\s*await saveAutoReply\(prospect, body\);\s*return \{ matched: true, host: String\(prospect\.host\), verdict: "auto" \};/);
  const auto = between(store, "async function saveAutoReply(", "\n}\n");
  assert.match(auto, /kind: "auto"/);
  assert.match(auto, /answered_at:/);
  assert.doesNotMatch(auto, /replied_at|pitch_at|tellManager/);
});

test("2. строка перед кружком — про его сайт, хост текстом", () => {
  assert.equal(introLine("ru", { kind: "site", host: "clinic.uz" }), "Это про ваш сайт clinic.uz, 40 секунд");
  assert.equal(introLine("uz", { kind: "site", host: "clinic.uz" }), "Bu sizning saytingiz clinic.uz haqida, 40 soniya");
  assert.equal(plainHost("https://www.Clinic.uz/ru/about"), "clinic.uz");
  assert.deepEqual(introTargetOf({ host: "https://www.clinic.uz/" }), { kind: "site", host: "clinic.uz" });
  // Без сайта — про то, что у нас есть.
  assert.equal(introTargetOf({ host: null, label: "Lazzat", place_id: "abc" }).kind, "maps");
  assert.deepEqual(introTargetOf({ host: null, label: "Lazzat", contacts: { instagram: ["lazzat"] } }), {
    kind: "profile",
    where: "instagram",
    label: "Lazzat",
  });
  assert.match(introLine("ru", { kind: "maps", label: "Lazzat" }), /карточку «Lazzat» на картах/);
  for (const lang of ["ru", "uz"] as const) {
    for (const target of [
      { kind: "site", host: "clinic.uz" } as const,
      { kind: "maps", label: "Lazzat" } as const,
      { kind: "profile", where: "instagram", label: null } as const,
      { kind: "company", label: null } as const,
    ]) {
      const line = introLine(lang, target);
      assert.doesNotMatch(line, /https?:\/\//, "ссылкой не делаем");
      clientTextOk(line, lang, ["clinic.uz"]);
    }
  }
  // Половине «new»: строка ложится перед кружком, скаут шлёт её без превью, ждёт и шлёт кружок.
  const store = read("lib/admin/outreach-talk-store.ts");
  const hello = between(store, "async function answerHello(", "/**\n * Письмо тем, кто ответил");
  assert.ok(hello.indexOf('kind: "intro"') < hello.indexOf('kind: "circle"'), "строка — до кружка");
  assert.match(hello, /if \(salesNew\(\{ sales_arm: await salesArmOf\(id\) \}\)\)/);
  const runner = read("scout/runner.mjs");
  assert.match(runner, /client\.sendMessage\(to, \{ message: reply\.intro\.body, linkPreview: false \}\)/);
  assert.ok(runner.indexOf("reply.intro.body") < runner.indexOf("client.sendFile(to, { file: circle.media })"));
  assert.match(between(store, "export async function nextReply(", "export async function markReplySent("), /if \(row\.kind === "intro"\) continue;/);
});

test("3. кружок ниши: своя ниша, нет — общий; общий не берёт чужой кружок ниши", () => {
  assert.equal(circleNicheOf({ niche: "stomatologiya" }), "stomatologiya");
  assert.equal(circleNicheOf({ niche: "ресторан" }), "restoran");
  assert.equal(circleNicheOf({ niche: "agentstvo-nedvizhimosti" }), "nedvizhimost");
  assert.equal(circleNicheOf({ niche: null, label: "Dental Clinic Smile" }), "stomatologiya");
  assert.equal(circleNicheOf({ niche: null, label: "", host: "mebel-lux.uz" }), "mebel");
  assert.equal(circleNicheOf({ niche: "avtoservis", label: "Hunter" }), "general");
  assert.equal(CIRCLE_NICHES.length, 9);

  const saved = [
    { id: 50, date: 5, bytes: 500 }, // кружок стоматологии, ru
    { id: 40, date: 4, bytes: 400 }, // узбекский общий
    { id: 30, date: 3, bytes: 300 }, // русский общий
  ];
  const general = pickCircles(saved, [40], null, { ids: [50] });
  assert.equal(general.ru?.id, 30, "общий русский — не кружок ниши");
  assert.equal(general.uz?.id, 40);
  const niche = pickNicheCircles(saved, { "ru:stomatologiya": [50] });
  assert.equal(circleFor(general, niche, { lang: "ru", niche: "stomatologiya" })?.id, 50);
  assert.equal(circleFor(general, niche, { lang: "ru", niche: "mebel" })?.id, 30, "нет кружка ниши — общий");
  assert.equal(circleFor(general, niche, { lang: "uz", niche: "stomatologiya" })?.id, 40);
  // Номера пропали — по размеру файла.
  assert.equal(pickNicheCircles(saved, {}, { "ru:stomatologiya": 500 })["ru:stomatologiya"]?.id, 50);
  // Без кружков ниш — всё как было.
  assert.deepEqual(pickCircles(saved, [40]), { ru: saved[0], uz: saved[1] });

  // Ключи хранилища: общие — прежние.
  assert.equal(circleFileKey("ru"), "tg-circle-file");
  assert.equal(circleFileKey("uz"), "tg-circle-file:uz");
  assert.equal(circleFileKey("uz", "mebel"), "tg-circle-file:uz:mebel");
  assert.deepEqual(slotOfFileKey("tg-circle-file"), { lang: "ru", niche: "general" });
  assert.deepEqual(slotOfFileKey("tg-circle-file:ru:restoran"), { lang: "ru", niche: "restoran" });

  // Каких не хватает: 8 ниш × 2 языка минус загруженные и лежащие в «Избранном».
  const missing = missingNicheSlots(new Map([["ru:mebel", {}]]), [{ nicheSavedAt: { "uz:mebel": 1 } }]);
  assert.equal(missing.length, 14);
  assert.ok(!missing.some((s) => s.niche === "mebel"));

  // Бот: после языка — ниша кнопками, в пределе Telegram.
  const rows = circleNicheButtons("uz", 123456789);
  const buttons = rows.flat();
  assert.equal(buttons.length, 9);
  for (const b of buttons) assert.ok(Buffer.byteLength(b.callback_data) <= 64, b.callback_data);
  assert.deepEqual(circleNicheChoice(buttons[2].callback_data.split(":")), { lang: "uz", niche: "stomatologiya", messageId: 123456789 });
  assert.equal(circleChoice(buttons[2].callback_data.split(":")), null, "кнопка ниши — не кнопка языка");
  assert.deepEqual(circleChoice(["cl", "ru", "5"]), { lang: "ru", messageId: 5 });
});

test("4. цена после «+» — из PROMO, kind 'price', вместе с условиями", () => {
  const ru = priceLine("ru");
  const uz = priceLine("uz");
  assert.ok(ru.includes(`${PROMO.landing.price} $`));
  assert.ok(uz.includes(`${PROMO.landing.price} $`));
  assert.match(ru, /^Макет бесплатно\. Понравится, лендинг от \d+ \$, можно частями: половина при старте, половина после запуска, когда всё работает\.$/);
  clientTextOk(ru, "ru");
  clientTextOk(uz, "uz");
  const src = read("lib/admin/sales-after-reply.ts");
  assert.doesNotMatch(between(src, "export function priceLine", "\n}\n"), /500/, "цена — не строкой");
  const store = read("lib/admin/outreach-talk-store.ts");
  const announced = between(store, "  if (announced) {", "  if (verdict !== \"talk\" && !announced)");
  assert.ok(announced.indexOf("protoTermsText(lang)") < announced.indexOf("priceLine(lang)"), "сначала условия, потом цена");
  assert.match(announced, /kind: PRICE_KIND/);
  assert.match(src, /export const PRICE_KIND = "price";/);
  assert.match(read("supabase/migrations/0168_sales_after_reply.sql"), /'text', 'circle', 'intro', 'price', 'auto'/);
});

test("5. лесенка — одно место для цен, оплата частями", () => {
  assert.deepEqual(
    { fixes: LADDER.fixes.price, card: LADDER.card.price, landing: LADDER.landing.price, corporate: LADDER.corporate.price },
    { fixes: 150, card: 250, landing: 500, corporate: 1000 },
  );
  assert.equal(LADDER.landing.price, PROMO.landing.price);
  assert.equal(LADDER.corporate.price, PROMO.corporate.price);
  const ru = ladderLines("ru");
  assert.equal(ru.length, 4);
  assert.match(ru[0], /исправим 3 ошибки на вашем сайте за 2 дня: 150 \$/);
  assert.equal(ladderLines("ru", false).length, 3, "без сайта — ошибки не исправляем");
  for (const lang of ["ru", "uz"] as const) for (const line of ladderLines(lang)) clientTextOk(line, lang);
});

test("6. возражения ru и uz: распознавание и тексты", () => {
  const cases: [string, string][] = [
    ["Какой сайт?", "what"],
    ["О каком сайте речь?", "what"],
    ["Что значит прототип?", "what"],
    ["Зачем это?", "what"],
    ["Bu nima?", "what"],
    ["Бесплатно? В чём подвох?", "free"],
    ["ты чё прикалываешься", "free"],
    ["Отличный ИИ 😂", "free"],
    ["я не перехожу по ссылкам", "no_links"],
    ["Передам руководству", "boss"],
    ["напишите нашему менеджеру", "boss"],
    ["Rahbarga yetkazaman", "boss"],
    ["Сайтом не пользуемся, клиенты через Инстаграм и Telegram", "social"],
    ["у нас уже есть сайт, зачем ещё", "have_site"],
    ["Saytimiz bor", "have_site"],
    ["дорого", "expensive"],
    ["есть намного дешевле", "expensive"],
    ["Juda ham zor… Narhi qimmat ekan", "expensive"],
  ];
  for (const [text, kind] of cases) assert.equal(objectionOf(text), kind, text);
  for (const text of ["+", "Да", "Добрый вечер", "Сколько по времени?"]) assert.equal(objectionOf(text), null, text);

  for (const kind of OBJECTIONS) {
    for (const lang of ["ru", "uz"] as const) {
      for (const host of ["clinic.uz", null]) {
        const text = objectionReply(kind, { lang, host, niche: "stomatologiya" });
        assert.ok(text.length > 20 && text.length < 600, `${kind}/${lang}: ${text.length}`);
        clientTextOk(text, lang, host ? [host] : []);
      }
    }
  }
  // «Дорого»: вопрос, окупаемость словами ниши, лесенка из LADDER, частями.
  const expensive = objectionReply("expensive", { lang: "ru", host: "smile.uz", niche: "stomatologiya" });
  assert.match(expensive, /^С чем сравниваете\?/);
  assert.match(expensive, /пациент/);
  assert.ok(expensive.includes(`${LADDER.fixes.price} $`) && expensive.includes(`${LADDER.corporate.price} $`));
  assert.match(expensive, /половина при старте/);
  assert.match(objectionReply("what", { lang: "ru", host: "smile.uz", niche: "general" }), /smile\.uz/);
  assert.match(objectionReply("boss", { lang: "ru", host: "smile.uz", niche: "general" }), /^Спасибо! Перешлите ему, пожалуйста/);
  assert.equal(objectionReply("boss", { lang: "ru", host: "smile.uz", niche: "general" }).split("\n").length, 4, "спасибо + 3 строки");
  assert.match(objectionReply("have_site", { lang: "ru", host: "smile.uz", niche: "general" }), /150 \$/);

  // «Что значит прототип?» — вопрос, а не согласие.
  assert.equal(readInbound("Что значит прототип?", { afterCircle: true }), "talk");
  assert.equal(readInbound("Хочу макет"), "proto");

  // В переписке модели до макета у «new» — готовый текст, модель молчит.
  const run = read("lib/admin/outreach-talk-run.ts");
  assert.match(run, /const objection = inbound\.untilMockup && inbound\.salesNew \? objectionOf\(inbound\.body\) : null;/);
  assert.ok(run.indexOf("objectionReply(") < run.indexOf("await runQualifyTurn("), "готовый текст — до модели");
  // У менеджера — кнопки для всех.
  const chat = read("components/admin/talk-chat.tsx");
  assert.match(chat, /onClick=\{\(\) => setText\(q\.text\)\}/);
  assert.match(read("lib/admin/outreach-talk-store.ts"), /const quick: TalkView\["quick"\] = OBJECTIONS\.map/);
});

test("7. «Руководитель успел посмотреть?» — ровно один раз, через 2 дня, в рабочее время", () => {
  const promised = "2026-10-12T07:00:00.000Z"; // понедельник 12:00 по Ташкенту
  const p = { boss_promised_at: promised, boss_asked_at: null, closed_reason: null };
  const wed = Date.parse("2026-10-14T07:30:00.000Z"); // среда 12:30
  assert.equal(bossAskDue(p, null, Date.parse("2026-10-13T07:30:00.000Z")), false, "рано");
  assert.equal(bossAskDue(p, null, wed), true);
  assert.equal(bossAskDue({ ...p, boss_asked_at: "2026-10-14T07:00:00.000Z" }, null, wed), false, "второй раз — нет");
  assert.equal(bossAskDue(p, "2026-10-13T10:00:00.000Z", wed), false, "ответил — нет");
  assert.equal(bossAskDue(p, null, Date.parse("2026-10-14T16:00:00.000Z")), false, "21:00 — не рабочее время");
  assert.equal(bossAskDue(p, null, Date.parse("2026-10-17T07:30:00.000Z")), false, "суббота — нет");
  assert.equal(bossAskText("ru"), "Руководитель успел посмотреть?");
  clientTextOk(bossAskText("uz"), "uz");
  // Отметка — условно и до очереди: два свипа не спросят дважды.
  const store = read("lib/admin/sales-after-reply-store.ts");
  const run = between(store, "export async function runBossAsks(", "\n}\n");
  assert.ok(run.indexOf('.is("boss_asked_at", null)\n      .select("id")') < run.indexOf("await queueReply("));
  assert.match(read("app/api/reminders/sweep/route.ts"), /await runBossAsks\(\)/);
  // Обещание запоминается только у «new».
  assert.match(read("lib/admin/outreach-talk-store.ts"), /objectionOf\(body\) === "boss" && salesNew\(/);
  assert.match(read("CLAUDE.md"), /Руководитель успел посмотреть\?/);
});

test("8. ответ модели: пауза 40–120 секунд и короткий, без «Отлично!» и списков", () => {
  const now = Date.parse("2026-10-17T10:00:00.000Z");
  const fresh = new Date(now - 5_000).toISOString();
  const at = Date.parse(humanSendAfter(fresh, now, () => 0)!);
  assert.equal(at - Date.parse(fresh), HUMAN_MIN_MS);
  assert.equal(Date.parse(humanSendAfter(fresh, now, () => 0.999999)!) - Date.parse(fresh) <= HUMAN_MAX_MS, true);
  // Пауза уже есть (свип пришёл через 4 минуты) — не трогаем.
  assert.equal(humanSendAfter(new Date(now - 4 * 60_000).toISOString(), now, () => 0.5), null);

  assert.deepEqual(aiStyleProblems("Макет бесплатный. Если интересно, отправьте «+»."), []);
  assert.deepEqual(aiStyleProblems("Отлично! Соберём макет.").map((p) => p.code), ["opener"]);
  assert.deepEqual(aiStyleProblems("Что будет:\n- главная\n- кнопка").map((p) => p.code), ["list"]);
  assert.ok(aiStyleProblems("Раз. Два. Три. Четыре.").some((p) => p.code === "long"));
  assert.equal(withoutOpener("Конечно! Макет бесплатный."), "Макет бесплатный.");
  assert.equal(withoutOpener("Макет бесплатный."), "Макет бесплатный.");

  const run = read("lib/admin/outreach-talk-run.ts");
  assert.match(run, /if \(inbound\.untilMockup\) text = withoutOpener\(text\);/);
  assert.match(run, /if \(inbound\.untilMockup\) problems\.push\(\.\.\.aiStyleProblems\(text\)\);/);
  assert.match(run, /sendAfter: humanSendAfter\(inbound\.createdAt, Date\.now\(\)\)/);
});

test("9. показ вместо ссылки: «Покажу за 15 минут» — в акции у «new», не ломая её", () => {
  const exp = "2026-10-19T06:00:00.000Z";
  assert.equal(announceText("ru", exp, null, false), announceText("ru", exp));
  assert.ok(announceText("ru", exp, null, true).endsWith(showLine("ru")));
  assert.ok(announceText("uz", exp, null, true).endsWith(showLine("uz")));
  assert.equal(showLine("ru"), "Покажу за 15 минут: по видео или подъеду к вам.");
  clientTextOk(showLine("ru"), "ru");
  clientTextOk(showLine("uz"), "uz");
  assert.match(read("lib/admin/mockup-offer-run.ts"), /salesNew\(\{ sales_arm: await salesArmOf\(String\(o\.prospect_id\)\) \}\)/);
});

test("10. A/B: поровну при «Здравствуйте», победитель — не раньше 100 на половину", () => {
  let x = 0;
  const seq = () => ((x = (x * 9301 + 49297) % 233280), x / 233280);
  const arms = Array.from({ length: 2000 }, () => pickArm(seq));
  const share = arms.filter((a) => a === "new").length / arms.length;
  assert.ok(share > 0.45 && share < 0.55, `доля new ${share}`);
  assert.match(read("lib/admin/outreach-queue.ts"), /update\(\{ sales_arm: pickArm\(\) \}\)\.eq\("id", id\)\.is\("sales_arm", null\)/);

  const arm = (a: "old" | "new", hello: number, plus: number): ArmCounts => ({ arm: a, hello, live: 0, afterCircle: 0, plus, mockup: 0, paid: 0 });
  assert.deepEqual(abVerdict(arm("old", 99, 1), arm("new", 300, 40)), { kind: "early", need: 1 });
  assert.equal(AB_MIN_HELLO, 100);
  const lead = abVerdict(arm("old", 200, 2), arm("new", 200, 20));
  assert.equal(lead.kind, "leader");
  assert.equal(lead.kind === "leader" && lead.arm, "new");
  assert.equal(abVerdict(arm("old", 200, 5), arm("new", 200, 6)).kind, "even");
});

test("SALES_NEW = false возвращает старое", () => {
  assert.equal(SALES_NEW, true);
  assert.equal(salesNew({ sales_arm: "new" }), true);
  assert.equal(salesNew({ sales_arm: "new" }, false), false, "выключено — «new» идёт как «old»");
  assert.equal(salesNew({ sales_arm: "old" }), false);
  assert.equal(salesNew({ sales_arm: null }), false, "старые касания — как было");
  // Всё новое поведение проходит через salesNew — и только через него.
  const store = read("lib/admin/outreach-talk-store.ts");
  for (const piece of ['kind: "intro"', "priceLine(lang)", "boss_promised_at"]) {
    const at = store.indexOf(piece);
    assert.ok(at > 0, piece);
    assert.ok(store.lastIndexOf("salesNew(", at) > store.lastIndexOf("\n}\n", at), `${piece} — под salesNew`);
  }
  // Исправления — для всех: автоответчик и пауза модели от salesNew не зависят.
  const save = between(store, "async function saveInbound(", "/**\n * Клиент ответил на «Здравствуйте»");
  assert.ok(save.indexOf("isAutoReply(body)") < save.indexOf("salesNew("));
  assert.doesNotMatch(read("lib/admin/outreach-talk-run.ts").split("humanSendAfter(inbound.createdAt")[0].slice(-200), /salesNew/);
});
