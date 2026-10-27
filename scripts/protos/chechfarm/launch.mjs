/*
 * Запуск фарм-бренда под ключ — главный смысл CZECHFARM. Со слов клиента
 * (переписка владельца DevUz, 26.10.2026): к ним приходит производитель,
 * например из Китая, его препарат в Узбекистане не знают, а у CZECHFARM
 * налажено всё — точки сбыта, бренд, маркетинг, полный комплект; проекты от
 * 10 000 000 $. Цифр сверх этого нет.
 *
 *   «Путь вашего бренда» (#launch): производитель вписывает название и страну,
 *   безымянная коробка проходит бренд → маркетинг → точки сбыта → под ключ;
 *   «Сам или с CZECHFARM» (#compare): два сценария одним переключателем.
 * Поведение — launch.js, стили — launch.css.
 */
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

/* Полки: где стоят маленькие коробки на сцене точек сбыта. */
const SHELF = [];
for (let r = 0; r < 3; r++) for (let c = 0; c < 6; c++) SHELF.push([388 + c * 38, 108 + r * 92]);

export function makeLaunch({ T, href, ICON, pad }) {
  const box = (cls) => `<g class="${cls}"><path class="bx-side" d="M0 0 L36 -22 L36 158 L0 180Z" transform="translate(140 0)"/><path class="bx-top" d="M0 0 L140 0 L176 -22 L36 -22Z"/><rect class="bx-front" width="140" height="180" rx="4"/><rect class="bx-band" y="112" width="140" height="22"/><text class="bx-q" x="70" y="104" text-anchor="middle">?</text><text class="bx-name" x="70" y="72" text-anchor="middle"></text><text class="bx-org" x="70" y="160" text-anchor="middle"></text><g class="bx-mk" transform="translate(58 18) scale(.6)"><path d="M20 8h-4.5a8 8 0 0 0 0 16H20Z" class="m-a"/><path d="M20 8h4.5a8 8 0 0 1 0 16H20Z" class="m-b"/></g></g>`;

  function launchBlock(l) {
    const t = T(l);
    const aud = [
      ["doctors", 92, 76, t("Врачи", "Shifokorlar", "Doctors")],
      ["pharmacies", 92, 336, t("Аптеки", "Dorixonalar", "Pharmacies")],
      ["patients", 92, 206, t("Пациенты", "Bemorlar", "Patients")],
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
<div class="ln-stage" aria-hidden="true"><svg viewBox="0 0 640 440" class="ln-svg">
<defs><linearGradient id="ln-fl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fbfaf7"/><stop offset="1" stop-color="#ebe7de"/></linearGradient></defs>
<rect width="640" height="440" rx="24" fill="url(#ln-fl)"/>
<g class="ln-shelf">${[0, 1, 2].map((r) => `<rect x="372" y="${196 + r * 92}" width="236" height="8" rx="3" class="sh-b"/>`).join("")}<rect x="372" y="60" width="6" height="292" class="sh-b"/><rect x="602" y="60" width="6" height="292" class="sh-b"/><text x="490" y="44" text-anchor="middle" class="sh-t">${t("Аптечные полки", "Dorixona peshtaxtalari", "Pharmacy shelves")}</text>
${SHELF.map(([x, y], i) => `<g class="mini" style="--i:${i}" transform="translate(${x} ${y})"><rect class="mini-b" width="28" height="84" rx="2"/><rect class="mini-s" y="52" width="28" height="9"/></g>`).join("")}</g>
<g class="ln-aud">${aud.map(([id, x, y, name]) => `<g class="au-n" transform="translate(${x} ${y})"><circle r="30" class="au-c"/><circle r="30" class="au-r"/><g transform="translate(-12 -12)" class="au-ic">${ICON[id].replace("<svg ", '<svg width="24" height="24" ')}</g><text y="50" text-anchor="middle">${name}</text></g><path class="au-l" d="M${x + 32} ${y} L250 ${200}"/>`).join("")}</g>
<g transform="translate(250 130)"><g class="ln-box">${box("bx")}</g></g>
<g class="ln-seal" transform="translate(490 120) rotate(-8)"><rect x="-92" y="-26" width="184" height="52" rx="10"/><text text-anchor="middle" y="9">${t("ПОД КЛЮЧ", "KALIT TOPSHIRISH", "TURNKEY")}</text></g>
<text class="ln-cap" x="320" y="420" text-anchor="middle"></text>
</svg></div>
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
