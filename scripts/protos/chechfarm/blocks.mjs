/*
 * Премиум-блоки CHECHFARM (владелец, 26.10.2026: «Выглядит как-то сильно
 * просто… Доделываем»): сцена первого экрана, стеклянные блоки цепочки,
 * глобус с маршрутами, главная под аудиторию, «что нужно от компании»,
 * стоимость с допами за половину цены. Разметка здесь, поведение — в
 * premium.js, стили — в premium.css. Факты — те же, только из ТЗ.
 */
import { PARTNER_STEPS, AUDIENCES } from "./data.mjs";
import { BASE, ADDONS, ALL, OFFER_HOURS, RATE } from "./plan.mjs";

/* Сцена: кадров столько, сколько нарезал scene.py (seq/d/f00…). */
export const SCENE_FRAMES = 48;

/* Стеклянные блоки на кадре steps: левый край, правый, верх, низ — в долях кадра. */
const BLOCKS = [
  [0.119, 0.229, 0.617, 0.72], [0.231, 0.334, 0.575, 0.707], [0.346, 0.439, 0.53, 0.7], [0.452, 0.548, 0.488, 0.7],
  [0.56, 0.658, 0.441, 0.702], [0.665, 0.768, 0.385, 0.709], [0.771, 0.881, 0.315, 0.72],
];

/* Что видит каждая аудитория на главной: устройство сайта, не обещания. */
const AUD_POINTS = {
  patients: {
    ru: ["Понятные карточки продуктов: что это и для кого", "Инструкция PDF на странице продукта", "На каждой странице: информация не заменяет врача"],
    uz: ["Tushunarli mahsulot kartochkalari: bu nima va kim uchun", "Mahsulot sahifasida PDF yo‘riqnoma", "Har bir sahifada: ma’lumot shifokor o‘rnini bosmaydi"],
    en: ["Clear product cards: what it is and who it is for", "A PDF leaflet on the product page", "On every page: information never replaces a doctor"],
  },
  doctors: {
    ru: ["Материалы о продуктах в одном месте", "Вещество, форма выпуска, производитель", "Вопрос компании в одну форму"],
    uz: ["Mahsulot materiallari bir joyda", "Modda, chiqarilish shakli, ishlab chiqaruvchi", "Kompaniyaga savol bitta shaklda"],
    en: ["Product materials in one place", "Substance, dosage form, manufacturer", "A question to the company in one form"],
  },
  pharmacies: {
    ru: ["Заявка на сотрудничество в два шага", "Статус заявки виден на сайте", "Ответ приходит менеджеру компании"],
    uz: ["Ikki qadamda hamkorlik arizasi", "Ariza holati saytda ko‘rinadi", "Javob kompaniya menejeriga keladi"],
    en: ["A partnership request in two steps", "The request status shows on the site", "A company manager receives it"],
  },
  makers: {
    ru: ["CHECHFARM как локальный партнёр", "Пять шагов от заявки до запуска", "Заявка производителя: компания, страна, продукты"],
    uz: ["CHECHFARM mahalliy hamkor sifatida", "Arizadan ishga tushirishgacha besh qadam", "Ishlab chiqaruvchi arizasi: kompaniya, mamlakat, mahsulotlar"],
    en: ["CHECHFARM as a local partner", "Five steps from request to launch", "A manufacturer request: company, country, products"],
  },
  investors: {
    ru: ["Здоровье создаёт устойчивую стоимость", "Цепочка роста в семи шагах", "Материалы и встреча по запросу"],
    uz: ["Salomatlik barqaror qiymat yaratadi", "Yetti qadamda o‘sish zanjiri", "So‘rov bo‘yicha materiallar va uchrashuv"],
    en: ["Health creates sustainable value", "The growth chain in seven steps", "Materials and a meeting on request"],
  },
};

/* Что нужно от компании, чтобы сайт вышел: вместо пустых заготовок. */
const NEEDS = [
  ["mark", { ru: ["Логотип и фирменный стиль", "Пока на сайте наш знак-концепт"], uz: ["Logotip va firma uslubi", "Hozircha saytda bizning konsept belgimiz"], en: ["Logo and brand style", "The site uses our concept mark for now"] }],
  ["hist", { ru: ["История, география, филиалы", "Блок «Факты о компании»"], uz: ["Tarix, geografiya, filiallar", "«Kompaniya haqida faktlar» bloki"], en: ["History, geography, branches", "The company facts block"] }],
  ["team", { ru: ["Руководство и команда", "Фото, имя, должность"], uz: ["Rahbariyat va jamoa", "Rasm, ism, lavozim"], en: ["Leadership and team", "Photo, name, role"] }],
  ["prod", { ru: ["Перечень продуктов", "И кто утверждает медицинские тексты"], uz: ["Mahsulotlar ro‘yxati", "Va tibbiy matnlarni kim tasdiqlaydi"], en: ["Product list", "And who approves medical texts"] }],
  ["cont", { ru: ["Контакты и адрес", "Телефон, почта, карта, соцсети"], uz: ["Kontaktlar va manzil", "Telefon, pochta, xarita, ijtimoiy tarmoqlar"], en: ["Contacts and address", "Phone, email, map, social media"] }],
  ["chan", { ru: ["Куда слать обращения", "Почта, Telegram или CRM"], uz: ["Murojaatlarni qayerga yuborish", "Pochta, Telegram yoki CRM"], en: ["Where requests go", "Email, Telegram or CRM"] }],
  ["cons", { ru: ["Текст согласия", "Для форм обращений"], uz: ["Rozilik matni", "Murojaat shakllari uchun"], en: ["Consent text", "For the request forms"] }],
  ["ir", { ru: ["Материалы для инвесторов", "Презентация, показатели"], uz: ["Investorlar uchun materiallar", "Taqdimot, ko‘rsatkichlar"], en: ["Investor materials", "Presentation, figures"] }],
];

export function makeBlocks({ T, href, ICON, IMG, L3, CHAIN, pad, BASE_URL }) {
  const usd = (n) => `${String(n).replace(/\B(?=(\d{3})+(?!\d))/g, " ")} $`;

  /* ── Сцена первого экрана ──────────────────────────────────────────── */
  function heroScene(l, inner) {
    const t = T(l);
    return `<section class="hs" id="hero" aria-label="CHECHFARM"><div class="hs-stick">
<div class="hs-media" aria-hidden="true">
<picture class="hs-a"><source media="(max-width: 899px) and (orientation: portrait)" srcset="${IMG}/hero-m-1080.webp"><img src="${IMG}/hero-2400.webp" srcset="${IMG}/hero-900.webp 900w, ${IMG}/hero-1400.webp 1400w, ${IMG}/hero-2400.webp 2400w" sizes="100vw" alt="" fetchpriority="high"></picture>
<picture class="hs-b"><source media="(max-width: 899px) and (orientation: portrait)" srcset="${IMG}/open-m-1080.webp"><img src="${IMG}/open-2400.webp" srcset="${IMG}/open-1400.webp 1400w, ${IMG}/open-2400.webp 2400w" sizes="100vw" alt="" loading="lazy"></picture>
<canvas class="hs-cv"></canvas><span class="hs-veil"></span></div>
${inner}
<div class="hs-load" id="hs-load" aria-hidden="true"><span><b id="hs-n">0</b>%</span><i><u id="hs-b"></u></i><small>${t("сцена загружается", "sahna yuklanmoqda", "scene loading")}</small></div>
<p class="hs-hint" aria-hidden="true"><span></span>${t("Листайте: капсула раскроется", "Aylantiring: kapsula ochiladi", "Scroll: the capsule opens")}</p>
</div></section>`;
  }

  /* ── Стеклянные блоки: цепочка на кадре ────────────────────────────── */
  function blocksStage(l) {
    const t = T(l);
    return `<section class="sec dark gb-sec" id="blocks"><div class="wrap">
<div class="sec-h mv mv-up"><p class="kicker">${t("Семь шагов в стекле", "Shishadagi yetti qadam", "Seven steps in glass")}</p><h2 class="h2">${t("Каждый шаг <b>держит следующий</b>", "Har bir qadam <b>keyingisini ushlab turadi</b>", "Each step <b>holds up the next</b>")}</h2><p class="lead">${t("Блоки загораются по очереди, от бирюзового здоровья до золотого масштабирования. Нажмите на блок.", "Bloklar navbat bilan yonadi, firuza salomatlikdan oltin kengayishgacha. Blokni bosing.", "The blocks light up in turn, from teal health to golden scale. Tap a block.")}</p></div>
<div class="gb mv mv-scale"><img src="${IMG}/steps-2000.webp" srcset="${IMG}/steps-1100.webp 1100w, ${IMG}/steps-2000.webp 2000w" sizes="(min-width: 1240px) 1160px, 100vw" alt="${t("Семь стеклянных блоков по возрастанию", "O‘sib boruvchi yetti shisha blok", "Seven ascending glass blocks")}" loading="lazy" width="2000" height="1116">
${BLOCKS.map(([a, b, c, d], i) => `<button type="button" class="gb-b" style="left:${(a * 100).toFixed(1)}%;width:${((b - a) * 100).toFixed(1)}%;top:${(c * 100).toFixed(1)}%;height:${((d - c) * 100).toFixed(1)}%;--k:${(i / 6).toFixed(3)}" aria-label="${pad(i + 1)}. ${L3(CHAIN[i], l)[0]}"><i aria-hidden="true"></i><span class="gb-l">${pad(i + 1)}<b>${L3(CHAIN[i], l)[0]}</b></span></button>`).join("")}
</div>
<div class="gb-card glass-d" aria-live="polite"><p class="no"></p><h3></h3><p class="ds"></p></div>
</div></section>`;
  }

  /* ── Глобус партнёрства ───────────────────────────────────────────── */
  const ROUTES = [[745, 60], [770, 215], [700, 405], [540, 30], [560, 425]];
  const PIN = [340, 118];
  function globeBlock(l) {
    const t = T(l);
    const arc = ([x, y]) => `M${x} ${y} Q${((x + PIN[0]) / 2 + 40).toFixed(0)} ${(Math.min(y, PIN[1]) - 70).toFixed(0)} ${PIN[0]} ${PIN[1]}`;
    return `<section class="sec dark gl-sec" id="globe"><div class="wrap">
<div class="sec-h mv mv-up"><p class="kicker">${t("Маршрут партнёра", "Hamkor yo‘li", "A partner’s route")}</p><h2 class="h2">${t("От производителя <b>к местному рынку</b>", "Ishlab chiqaruvchidan <b>mahalliy bozorga</b>", "From manufacturer <b>to the local market</b>")}</h2><p class="lead">${t("Каждый маршрут на схеме: один шаг сотрудничества. Наведите или нажмите.", "Sxemadagi har bir yo‘l: hamkorlikning bir qadami. Ustiga olib boring yoki bosing.", "Each route on the diagram is one partnership step. Hover or tap.")}</p></div>
<div class="gl mv mv-scale"><img src="${IMG}/globe-2000.webp" srcset="${IMG}/globe-1100.webp 1100w, ${IMG}/globe-2000.webp 2000w" sizes="(min-width: 1240px) 1160px, 100vw" alt="${t("Стеклянный глобус с линиями маршрутов", "Yo‘nalish chiziqlari bilan shisha globus", "A glass globe with route lines")}" loading="lazy" width="2000" height="1116">
<svg class="gl-svg" viewBox="0 0 800 447" role="group" aria-label="${t("Шаги сотрудничества", "Hamkorlik qadamlari", "Partnership steps")}">${ROUTES.map((p, i) => `<g class="gl-r" tabindex="0" role="button" data-i="${i}" aria-label="${pad(i + 1)}. ${L3(PARTNER_STEPS[i], l)[0]}"><path class="gl-hit" d="${arc(p)}"/><path class="gl-p" d="${arc(p)}"/><circle class="gl-dot" r="3.5"/><circle class="gl-src" cx="${p[0]}" cy="${p[1]}" r="5"/></g>`).join("")}<g class="gl-pin" transform="translate(${PIN.join(" ")})"><circle r="14" class="gl-pulse"/><circle r="6"/></g><text class="gl-pt" x="${PIN[0] - 18}" y="${PIN[1] + 30}" text-anchor="end">CHECHFARM</text></svg></div>
<div class="gl-card glass-d" aria-live="polite"><p class="no"></p><h3></h3><p class="ds"></p></div>
</div></section>`;
  }

  /* ── Главная под аудиторию ────────────────────────────────────────── */
  function audienceSwitch(l) {
    const t = T(l);
    return `<section class="sec mint" id="audience"><div class="wrap">
<div class="sec-h mv mv-up"><p class="kicker">${t("Направления и аудитории", "Yo‘nalishlar va auditoriya", "Who it is for")}</p><h2 class="h2">${t("Кто вы? <b>Сайт подстроится</b>", "Siz kimsiz? <b>Sayt moslashadi</b>", "Who are you? <b>The site adapts</b>")}</h2><p class="lead">${t("Выбор меняет кнопку на первом экране и ведёт по вашему пути. Его можно поменять в любой момент.", "Tanlov birinchi ekrandagi tugmani o‘zgartiradi va sizni o‘z yo‘lingizdan olib boradi. Uni istalgan payt o‘zgartirish mumkin.", "Your choice changes the first-screen button and leads you down your path. Change it any time.")}</p></div>
<div class="as mv mv-up"><div class="as-tabs" role="tablist" aria-label="${t("Аудитория", "Auditoriya", "Audience")}">${AUDIENCES.map((a, i) => `<button type="button" role="tab" id="as-t-${a.id}" aria-controls="as-p-${a.id}" aria-selected="${i ? "false" : "true"}" data-a="${a.id}">${ICON[a.id]}<span>${L3(a, l)[0]}</span></button>`).join("")}</div>
${AUDIENCES.map((a, i) => `<div class="as-p${a.id === "investors" ? " inv" : ""}" role="tabpanel" id="as-p-${a.id}" aria-labelledby="as-t-${a.id}"${i ? " hidden" : ""}><div><span class="au-i">${ICON[a.id]}</span><h3>${L3(a, l)[0]}</h3><p>${L3(a, l)[1]}</p></div><ul class="ticks">${AUD_POINTS[a.id][l].map((x) => `<li>${ICON.check}<span>${x}</span></li>`).join("")}</ul><a class="btn btn-pri" href="${href(l, a.to)}">${t("Мой путь", "Mening yo‘lim", "My path")}${ICON.arrow}</a></div>`).join("")}
</div></div></section>`;
  }
  const audCta = (l) => Object.fromEntries(AUDIENCES.map((a) => [a.id, { h: href(l, a.to), t: T(l)(...{ patients: ["К продуктам", "Mahsulotlarga", "See products"], doctors: ["Материалы врачам", "Shifokorlarga materiallar", "Materials for doctors"], pharmacies: ["Заявка аптеки", "Dorixona arizasi", "Pharmacy request"], makers: ["Стать партнёром", "Hamkor bo‘lish", "Become a partner"], investors: ["Инвесторам", "Investorlarga", "For investors"] }[a.id]) }]));

  /* ── Что нужно от компании ────────────────────────────────────────── */
  function needsBlock(l) {
    const t = T(l);
    return `<section class="sec" id="needs"><div class="wrap split">
<div class="sec-h mv mv-left" style="margin:0"><p class="kicker">${t("Чтобы сайт вышел", "Sayt chiqishi uchun", "To launch the site")}</p><h2 class="h2">${t("Что нужно <b>от CHECHFARM</b>", "<b>CHECHFARM’dan</b> nima kerak", "What we need <b>from CHECHFARM</b>")}</h2><p class="lead">${t("Цифр, фактов и названий, которых нет в ТЗ, мы не придумываем: сайт фармацевтической компании говорит только проверенное. Восемь вещей, и макет становится сайтом.", "TTda yo‘q raqam, fakt va nomlarni o‘ylab topmaymiz: farmatsevtika kompaniyasi sayti faqat tekshirilganini aytadi. Sakkiz narsa va maket saytga aylanadi.", "We do not invent figures, facts or names that are not in the brief: a pharmaceutical company’s site says only what is checked. Eight things, and the mockup becomes a site.")}</p></div>
<ol class="needs">${NEEDS.map(([id, x], i) => `<li class="mv mv-up" style="--d:${(i % 4) * 70}ms"><span class="nd-n">${pad(i + 1)}</span><span><b>${x[l][0]}</b><small>${x[l][1]}</small></span></li>`).join("")}</ol>
</div></section>`;
  }

  /* ── Стоимость: основа по акции, допы за половину ─────────────────── */
  function priceBlock(l) {
    const t = T(l);
    const row = (a) => `<label class="kit-row"><input type="checkbox" data-k="${a.id}" data-p="${a.price}"${a.star ? " checked" : ""}><span class="sw" aria-hidden="true"></span><span class="kit-t"><b>${a[l].t}</b><small>${a[l].e}</small></span><span class="kit-pr"><s>${usd(a.full)}</s><b>+${usd(a.price)}</b></span></label>`;
    return `<section class="sec dark offer" id="cena" aria-label="${t("Стоимость сайта", "Sayt narxi", "Website price")}"><div class="wrap">
<div class="sec-h mv mv-up"><p class="kicker"><span class="chip">${t("Предложение DevUz Studio", "DevUz Studio taklifi", "DevUz Studio proposal")}</span></p><h2 class="h2">${t("Сайт <b>по этому макету</b>", "Shu maket <b>bo‘yicha sayt</b>", "A website <b>built on this mockup</b>")}</h2><p class="lead">${t(`48 часов с момента, как макет пришёл вам: корпоративный сайт ${usd(BASE.promo)} вместо ${usd(BASE.price)}, а всё, что в макете работает сверх него, за половину цены.`, `Maket sizga kelganidan 48 soat: korporativ sayt ${usd(BASE.price)} o‘rniga ${usd(BASE.promo)}, maketdagi undan tashqari ishlaydigan hamma narsa yarim narxda.`, `For 48 hours from when the mockup reached you: the corporate website is ${usd(BASE.promo)} instead of ${usd(BASE.price)}, and everything beyond it in the mockup is half price.`)}</p></div>
<div class="kit" id="kit"><div class="kit-l">
<div class="kit-base mv mv-up"><div><span class="chip">${t("Входит всегда", "Har doim kiradi", "Always included")}</span><b>${BASE[l].t}</b><p>${BASE[l].d}</p><p class="note">${t(`Срок: ${BASE.weeks[0]}-${BASE.weeks[1]} недель`, `Muddat: ${BASE.weeks[0]}-${BASE.weeks[1]} hafta`, `Timeline: ${BASE.weeks[0]}-${BASE.weeks[1]} weeks`)}</p></div><div class="kb-p"><s>${usd(BASE.price)}</s><b>${usd(BASE.promo)}</b></div></div>
<p class="kit-h">${t("Допы за 50% от цены", "Qo‘shimchalar narxining 50% ga", "Add-ons at 50% off")}</p>
${ADDONS.map(row).join("")}
</div>
<div class="kit-side"><div class="kit-total glass-d">
<div class="timer" id="timer"><span>${t("Цены действуют", "Narxlar amal qiladi", "Prices hold")}<small>${t(`${OFFER_HOURS} часов с первого открытия макета`, `maket birinchi ochilgandan ${OFFER_HOURS} soat`, `${OFFER_HOURS} hours from first opening`)}</small></span><b id="tm">48:00:00</b></div>
<div class="kt-line"><span>${BASE[l].t}</span><span><s>${usd(BASE.price)}</s> ${usd(BASE.promo)}</span></div>
<div class="kt-line"><span>${t("Допы", "Qo‘shimchalar", "Add-ons")} · <span id="kit-cnt">0</span></span><span id="kit-add">0 $</span></div>
<div class="kt-line kt-save"><span>${t("Экономия на допах", "Qo‘shimchalarda tejash", "Saved on add-ons")}</span><span id="kit-save">0 $</span></div>
<div class="kt-sum"><small>${t("Итого", "Jami", "Total")}</small><b id="kit-sum">${usd(BASE.promo)}</b><small>${t(`со всеми допами ${usd(ALL)}`, `barcha qo‘shimchalar bilan ${usd(ALL)}`, `with every add-on ${usd(ALL)}`)}</small></div>
<button type="button" class="btn btn-line" id="kit-all">${t("Всё из макета", "Maketdagi hammasi", "Everything in the mockup")}</button>
<a class="btn btn-gold" href="https://t.me/Devuz_studio_bot?start=chechfarm" target="_blank" rel="noopener">${ICON.send}<span>${t("Обсудить с DevUz Studio", "DevUz Studio bilan muhokama qilish", "Discuss with DevUz Studio")}</span></a>
<button type="button" class="btn btn-line" id="kit-copy">${t("Скопировать состав", "Tarkibni nusxalash", "Copy the list")}</button>
</div><p class="note">${t(`Цены допов: часы работы × ${RATE} $, как у веб-студий Ташкента, и минус половина. Хостинг, домен и тарифы CRM компания оплачивает сама.`, `Qo‘shimchalar narxi: ish soatlari × ${RATE} $, Toshkent veb-studiyalaridagidek, va yarmi chegirma. Xosting, domen va CRM tariflarini kompaniya o‘zi to‘laydi.`, `Add-on prices: work hours × ${RATE} $, like Tashkent web studios, minus half. Hosting, domain and CRM plans are paid by the company.`)}</p></div>
</div></div></section>`;
  }

  function offerData(l) {
    const t = T(l);
    return { items: ADDONS.map((a) => ({ id: a.id, t: a[l].t, p: a.price, f: a.full })), base: BASE.promo, baseName: BASE[l].t, hours: OFFER_HOURS, head: t("Сайт CHECHFARM, состав:", "CHECHFARM sayti, tarkibi:", "CHECHFARM website, scope:"), totalW: t("Итого", "Jami", "Total"), copied: t("Скопировано", "Nusxalandi", "Copied"), ended: t("Срок акции вышел, цены обычные", "Aksiya muddati tugadi, narxlar odatiy", "The offer has ended; regular prices apply") };
  }

  return { heroScene, blocksStage, globeBlock, audienceSwitch, audCta, needsBlock, priceBlock, offerData, BASE_URL };
}
