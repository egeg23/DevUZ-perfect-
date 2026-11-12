/*
 * Запуск фарм-бренда под ключ — главный смысл CZECHFARM. Со слов клиента
 * (переписка владельца DevUz, 26.10.2026): к ним приходит производитель,
 * например из Китая, его препарат в Узбекистане не знают, а у CZECHFARM
 * налажено всё — точки сбыта, бренд, маркетинг, полный комплект; проекты от
 * 10 000 000 $. Цифр сверх этого нет.
 *
 *   «Путь вашего бренда» (#launch): производитель вписывает название и страну,
 *   безымянная коробка проходит бренд → маркетинг → точки сбыта → под ключ.
 *   Сцена — рендеры Higgsfield (владелец, 12.11.2026: «отрисуй что можно и
 *   нужно через higgsfield», «коробка перекрывает текст и неуклюже стоит»):
 *   четыре фона этапов и коробка, пустая и фирменная, вырезанные
 *   (public/protos/chechfarm/launch); название препарата код пишет на её
 *   лицевой стороне. Подпись этапа стоит внутри карточки, на телефоне сцена
 *   не прилипает к экрану и текст не закрывает;
 *   «Сам или с CZECHFARM» (#compare): два сценария одним переключателем.
 * Поведение — launch.js, стили — launch.css.
 */
import { withAr } from "./ar.mjs";

const ORIGINS = {
  ru: ["Китай", "Индия", "Европа", "Турция", "Корея", "Другая страна"],
  uz: ["Xitoy", "Hindiston", "Yevropa", "Turkiya", "Koreya", "Boshqa mamlakat"],
  en: ["China", "India", "Europe", "Turkey", "Korea", "Another country"],
};

const STAGES = [
  { ru: ["Сейчас", "Препарат есть, но в Узбекистане его не знают. Аптеки не берут то, чего не спрашивают."], uz: ["Hozir", "Dori bor, lekin O‘zbekistonda uni bilishmaydi. Dorixonalar so‘ralmaganini olmaydi."], en: ["Today", "The product exists, but nobody in Uzbekistan knows it. Pharmacies do not stock what nobody asks for."] },
  { ru: ["Бренд", "Бренд под местный рынок: имя, упаковка, понятная информация."], uz: ["Brend", "Mahalliy bozorga mos brend: nom, qadoq, tushunarli ma’lumot."], en: ["Brand", "A brand for the local market: name, packaging, clear information."] },
  { ru: ["Маркетинг", "О бренде узнают врачи, аптеки и пациенты."], uz: ["Marketing", "Brend haqida shifokorlar, dorixonalar va bemorlar bilib oladi."], en: ["Marketing", "Doctors, pharmacies and patients learn about the brand."] },
  { ru: ["Точки сбыта", "Продукт встаёт на полки: сбыт у CZECHFARM уже налажен."], uz: ["Sotuv nuqtalari", "Mahsulot peshtaxtaga chiqadi: CZECHFARMda sotuv allaqachon yo‘lga qo‘yilgan."], en: ["Points of sale", "The product reaches the shelves: CZECHFARM already has sales in place."] },
  { ru: ["Под ключ", "Бренд работает на рынке. Полный комплект: сбыт, бренд, маркетинг."], uz: ["Kalit topshirish", "Brend bozorda ishlaydi. To‘liq to‘plam: sotuv, brend, marketing."], en: ["Turnkey", "The brand is live on the market. The full set: sales, brand, marketing."] },
];

const COMPARE = [
  { ru: ["Бренд", "В Узбекистане его не знают", "Бренд под местный рынок"], uz: ["Brend", "O‘zbekistonda uni bilishmaydi", "Mahalliy bozorga mos brend"], en: ["Brand", "Nobody in Uzbekistan knows it", "A brand built for the local market"] },
  { ru: ["Маркетинг", "С нуля, своими силами", "Налажен у CZECHFARM"], uz: ["Marketing", "Noldan, o‘z kuchingiz bilan", "CZECHFARMda yo‘lga qo‘yilgan"], en: ["Marketing", "From scratch, on your own", "Already in place at CZECHFARM"] },
  { ru: ["Точки сбыта", "Искать самому, одну за другой", "Уже налажены"], uz: ["Sotuv nuqtalari", "O‘zingiz birma-bir qidirasiz", "Allaqachon yo‘lga qo‘yilgan"], en: ["Points of sale", "Find them yourself, one by one", "Already in place"] },
  { ru: ["Кто ведёт", "Вы из другой страны", "Команда на месте, полный комплект"], uz: ["Kim boshqaradi", "Siz boshqa mamlakatdan", "Joyidagi jamoa, to‘liq to‘plam"], en: ["Who runs it", "You, from another country", "A team on the ground, the full set"] },
];

withAr(ORIGINS); withAr(STAGES); withAr(COMPARE);

export function makeLaunch({ T, href, ICON, pad, img }) {

  function launchBlock(l) {
    const t = T(l);
    const aud = [
      ["doctors", t("Врачи", "Shifokorlar", "Doctors")],
      ["patients", t("Пациенты", "Bemorlar", "Patients")],
      ["pharmacies", t("Аптеки", "Dorixonalar", "Pharmacies")],
    ];
    return `<section class="sec ln-sec" id="launch"><div class="wrap">
<div class="sec-h mv mv-up"><p class="kicker">${t("Путь вашего бренда", "Brendingiz yo‘li", "Your brand’s path")}</p><h2 class="h2">${t("Впишите свой препарат <b>и проведите его на рынок</b>", "Doringizni yozing <b>va uni bozorga olib chiqing</b>", "Type in your product <b>and take it to market</b>")}</h2><p class="lead">${t("Так выглядит запуск под ключ: от препарата, который здесь никто не знает, до бренда на полках аптек.", "Kalit topshirish asosida ishga tushirish shunday ko‘rinadi: bu yerda hech kim bilmaydigan doridan dorixona peshtaxtasidagi brendgacha.", "This is what a turnkey launch looks like: from a product nobody here knows to a brand on pharmacy shelves.")}</p></div>
<div class="ln mv mv-scale" id="ln" data-s="0">
<div class="ln-l">
<div class="ln-in"><label class="fl"><span>${t("Название вашего препарата", "Doringiz nomi", "Your product name")}</span><input id="ln-name" maxlength="22" autocomplete="off" placeholder="${t("Например, Vitalix", "Masalan, Vitalix", "For example, Vitalix")}"></label>
<label class="fl"><span>${t("Откуда производитель", "Ishlab chiqaruvchi qayerdan", "Where the manufacturer is")}</span><select id="ln-org">${ORIGINS[l].map((o) => `<option>${o}</option>`).join("")}</select></label></div>
<ol class="ln-steps">${STAGES.map((s, i) => `<li><button type="button" data-s="${i}"><span class="ln-n">${pad(i)}</span><span><b>${s[l][0]}</b><small>${s[l][1]}</small></span></button></li>`).join("")}</ol>
<div class="ln-ctl"><button type="button" class="btn btn-pri" id="ln-next"><span>${t("Дальше", "Keyingisi", "Next")}</span>${ICON.arrow}</button><button type="button" class="btn btn-line" id="ln-reset">${t("Сначала", "Boshidan", "Start over")}</button></div>
<a class="btn btn-gold ln-go" id="ln-go" href="${href(l, "partners")}#form">${ICON.send}<span>${t("Обсудить запуск", "Ishga tushirishni muhokama qilish", "Discuss the launch")}</span></a>
</div>
<div class="ln-stage">
<div class="ln-bg" aria-hidden="true">${[0, 1, 2, 3].map((i) => `<img class="ln-b" data-b="${i}" src="${img}/launch/bg${i}.webp" alt="" width="1280" height="956" loading="lazy" decoding="async">`).join("")}</div>
<ul class="ln-aud" aria-hidden="true">${aud.map(([id, name], i) => `<li style="--i:${i}"><i>${ICON[id]}</i>${name}</li>`).join("")}</ul>
<div class="ln-box" aria-hidden="true"><img class="bx0" src="${img}/launch/box0.webp" alt="" width="469" height="760" loading="lazy" decoding="async"><img class="bx1" src="${img}/launch/box1.webp" alt="" width="469" height="760" loading="lazy" decoding="async"><span class="bx-q">?</span><span class="bx-lab"><b class="bx-name"></b><small class="bx-org"></small></span></div>
<p class="ln-seal" aria-hidden="true">${t("ПОД КЛЮЧ", "KALIT TOPSHIRISH", "TURNKEY")}</p>
<div class="ln-cap" aria-live="polite"><span class="ln-capn"></span><b class="ln-capt"></b><p class="ln-capd"></p></div>
</div>
</div>
<p class="note" style="margin-top:14px">${t("Схема для наглядности: название и страну вписываете вы, ничего никуда не отправляется, пока вы не нажмёте «Обсудить запуск».", "Ko‘rgazmali sxema: nom va mamlakatni o‘zingiz yozasiz, «Ishga tushirishni muhokama qilish»ni bosmaguningizcha hech narsa yuborilmaydi.", "An illustrative diagram: you type the name and country; nothing is sent until you press “Discuss the launch”.")}</p>
</div></section>`;
  }

  function compareBlock(l) {
    const t = T(l);
    return `<section class="sec dark cmp-sec" id="compare"><div class="wrap">
<div class="sec-h mv mv-up"><p class="kicker">${t("Сам или с CZECHFARM", "O‘zingiz yoki CZECHFARM bilan", "On your own or with CZECHFARM")}</p><h2 class="h2">${t("Один и тот же препарат. <b>Два разных запуска</b>", "Bitta dori. <b>Ikki xil ishga tushirish</b>", "The same product. <b>Two different launches</b>")}</h2></div>
<div class="vs mv mv-up" id="vs" data-on="0"><div class="vs-sw" role="group" aria-label="${t("Сценарий", "Ssenariy", "Scenario")}"><button type="button" data-v="0" aria-pressed="true">${t("Сам", "O‘zingiz", "On your own")}</button><button type="button" data-v="1" aria-pressed="false">${t("С CZECHFARM", "CZECHFARM bilan", "With CZECHFARM")}</button><i aria-hidden="true"></i></div>
<ul class="vs-l">${COMPARE.map((c, i) => `<li style="--i:${i}"><span class="vs-k">${c[l][0]}</span><span class="vs-v"><span class="vs-a">${ICON.close}${c[l][1]}</span><span class="vs-b">${ICON.check}${c[l][2]}</span></span></li>`).join("")}</ul>
<a class="btn btn-gold vs-go" href="${href(l, "partners")}#form">${t("Запустить бренд с CZECHFARM", "Brendni CZECHFARM bilan ishga tushirish", "Launch a brand with CZECHFARM")}${ICON.arrow}</a></div>
</div></section>`;
  }

  const launchData = (l) => ({ stages: STAGES.map((s) => s[l]), mine: T(l)("Ваш бренд", "Sizning brendingiz", "Your brand"), madeIn: T(l)("Производство: ", "Ishlab chiqarilgan: ", "Made in: "), talk: T(l)("Обсудить запуск «{n}»", "«{n}» ishga tushirishini muhokama qilish", "Discuss launching “{n}”"), msg: T(l)("Хотим запустить бренд «{n}» в Узбекистане под ключ. Производитель: {o}.", "«{n}» brendini O‘zbekistonda kalit topshirish asosida ishga tushirmoqchimiz. Ishlab chiqaruvchi: {o}.", "We want a turnkey launch of the “{n}” brand in Uzbekistan. Manufacturer: {o}.") });

  return { launchBlock, compareBlock, launchData };
}
