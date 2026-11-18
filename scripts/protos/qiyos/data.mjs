// Данные макета агрегатора микрозаймов «Qiyos» (рабочее имя), 18.11.2026.
//
// Партнёры — банки Узбекистана с лицензией ЦБ РУз. Ставки, суммы, сроки,
// требования — только с их открытых страниц продукта (снято 18.11.2026,
// адрес у каждого в `src`, подробно — SOURCES.md). Номер лицензии — с
// карточки банка на bank.uz (`/org/<банк>`). Чего у банка не нашлось — null:
// на сайте это «уточняйте у банка», мы не придумываем.
//
// Ставка:
//   tiers — [[до скольки месяцев, % годовых], …] — точная по сроку;
//   lo/hi — вилка «от-до»: платёж считаем по нижней и по верхней.
// Флаги фильтров: docs — «без справок» (банк сам пишет, что нужен только
// паспорт или ID), card — деньги на карту (так у банка написано), zero —
// первый займ под 0% (сейчас ни у кого, включается в админке).

export const LANGS = ["ru", "uz"];

export const BRAND = {
  name: "Qiyos",
  // «qiyos» по-узбекски: сравнение. Рабочее имя, владелец не утверждал.
  tg: "https://t.me/Devuz_studio_bot?start=qiyos",
};

/** Предупреждение о рисках: ЗРУ-1187 от 10.11.2026, п. 20¹ Положения ЦБ № 3030. */
export const WARN = {
  ru: "Пользование кредитом и неисполнение долговых обязательств могут повлечь финансовые риски: неустойку, рост долга, испорченную кредитную историю.",
  uz: "Kreditdan foydalanish va qarz majburiyatlarini bajarmaslik moliyaviy xatarlarga olib kelishi mumkin: penya, qarzning oshishi, buzilgan kredit tarixi.",
};

export const PARTNERS = [
  {
    id: "mkb", logo: "mkb.svg", color: "#1d4f9c",
    bank: { ru: "Микрокредитбанк", uz: "Mikrokreditbank" },
    legal: { ru: "АКБ «Микрокредитбанк»", uz: "«Mikrokreditbank» ATB" },
    product: { ru: "Микрозайм на карту", uz: "Kartaga mikroqarz" },
    lic: { n: "37", d: "13.05.2006" },
    min: 1000000, max: 100000000, tmin: 1, tmax: 60,
    tiers: [[12, 24], [24, 25], [36, 26], [48, 27], [60, 28]],
    online: false, docs: false, card: true, zero: false, noPledge: false,
    who: { ru: "Участникам зарплатного проекта банка и работникам бюджетных организаций, 18-60 лет", uz: "Bankning ish haqi loyihasi ishtirokchilari va byudjet tashkilotlari xodimlariga, 18-60 yosh" },
    how: { ru: "В отделении банка, наличными или на карту", uz: "Bank filialida, naqd yoki kartaga" },
    pledge: { ru: "Поручительство, страховой полис или залог", uz: "Kafillik, sug‘urta polisi yoki garov" },
    src: "https://mkbank.uz/ru/private/crediting/microloan/",
  },
  {
    id: "aloqa", logo: "aloqa.webp", color: "#1e93f0",
    bank: { ru: "Алокабанк", uz: "Aloqabank" },
    legal: { ru: "АКБ «Алокабанк»", uz: "«Aloqabank» ATB" },
    product: { ru: "Онлайн микрозайм", uz: "Onlayn mikroqarz" },
    lic: { n: "48", d: "22.03.1995" },
    min: 5000000, max: 100000000, tmin: 6, tmax: 60,
    lo: 23, tiers: [[24, 27.9], [60, 28.9]],
    online: true, docs: false, card: true, zero: false, noPledge: false,
    who: { ru: "Гражданам Узбекистана с постоянным доходом в виде зарплаты", uz: "Ish haqi ko‘rinishida doimiy daromadi bor O‘zbekiston fuqarolariga" },
    how: { ru: "Онлайн, зачислением на карту", uz: "Onlayn, kartaga o‘tkazish orqali" },
    pledge: { ru: "23% с поручителем, без обеспечения 27,9-28,9%", uz: "Kafil bilan 23%, ta’minotsiz 27,9-28,9%" },
    src: "https://aloqabank.uz/ru/private/crediting/onlayn-mikrozayem/",
  },
  {
    id: "ipak", logo: "ipak.svg", color: "#1f8f3a",
    bank: { ru: "Ипак Йули", uz: "Ipak Yo‘li" },
    legal: { ru: "АИКБ «Ипак Йули»", uz: "«Ipak Yo‘li» AITB" },
    product: { ru: "Онлайн микрозайм", uz: "Onlayn mikroqarz" },
    lic: { n: "10", d: "31.12.1990" },
    min: null, max: null, tmin: 1, tmax: 48,
    lo: 32.81, hi: null,
    online: true, docs: true, card: false, zero: false, noPledge: true,
    who: { ru: "Сумму определяет скоринг в приложении по кредитной истории", uz: "Summani ilovadagi skoring kredit tarixi bo‘yicha belgilaydi" },
    how: { ru: "В Ipak Yuli Mobile, на кошелёк, только паспорт или ID", uz: "Ipak Yuli Mobile’da, hamyonga, faqat pasport yoki ID" },
    pledge: { ru: "Без залога и поручителей", uz: "Garov va kafillarsiz" },
    src: "https://ru.ipakyulibank.uz/physical/kredity/mikrozaymy/onlayn-mikrozaym",
  },
  {
    id: "brb", logo: "brb.svg", color: "#d6262d",
    bank: { ru: "Бизнесни ривожлантириш банки", uz: "Biznesni rivojlantirish banki" },
    legal: { ru: "АКБ «Бизнесни ривожлантириш банки»", uz: "«Biznesni rivojlantirish banki» ATB" },
    product: { ru: "Онлайн-микрозайм", uz: "Onlayn mikroqarz" },
    lic: { n: "77", d: "30.04.2009" },
    min: 1000000, max: 100000000, tmin: 12, tmax: 48,
    lo: 26, hi: 38,
    online: true, docs: false, card: true, zero: false, noPledge: false,
    who: { ru: "Ставка 26-38% по итогам скоринга", uz: "Stavka skoring natijasiga ko‘ra 26-38%" },
    how: { ru: "Онлайн, на карту", uz: "Onlayn, kartaga" },
    pledge: { ru: "Без обеспечения или под поручительство", uz: "Ta’minotsiz yoki kafillik ostida" },
    src: "https://brb.uz/ru/fizicheskim-litsam/kredity/onlayn-mikroqarz",
  },
  {
    id: "sqb", logo: "sqb.svg", color: "#0a3a6b",
    bank: { ru: "SQB (Узпромстройбанк)", uz: "SQB (O‘zsanoatqurilishbank)" },
    legal: { ru: "АКБ «Узпромстройбанк»", uz: "«O‘zsanoatqurilishbank» ATB" },
    product: { ru: "Микрозайм в SQB Mobile", uz: "SQB Mobile’da mikroqarz" },
    lic: { n: "17", d: "25.06.1991" },
    min: 2000000, max: 100000000, tmin: 1, tmax: 48,
    tiers: [[6, 24], [9, 25], [12, 26], [24, 27], [36, 28], [48, 29]],
    online: true, docs: false, card: false, zero: false, noPledge: false,
    who: { ru: "Ставка меняется вместе с основной ставкой ЦБ", uz: "Stavka MBning asosiy stavkasi bilan birga o‘zgaradi" },
    how: { ru: "В приложении SQB Mobile", uz: "SQB Mobile ilovasida" },
    pledge: { ru: "После скоринга может понадобиться поручитель или залог", uz: "Skoringdan keyin kafil yoki garov kerak bo‘lishi mumkin" },
    src: "https://sqb.uz/individuals/credits/sqb-mobile-ilovasida-mikroqarz-ru/",
  },
  {
    id: "tenge", logo: "tenge.svg", color: "#0e8a66",
    bank: { ru: "Tenge Bank", uz: "Tenge Bank" },
    legal: { ru: "АКБ «Tenge Bank»", uz: "«Tenge Bank» ATB" },
    product: { ru: "Онлайн микрозайм", uz: "Onlayn mikroqarz" },
    lic: { n: "85", d: "18.05.2019" },
    min: 1000000, max: 90000000, tmin: 6, tmax: 36,
    lo: 24.6, hi: 49,
    online: true, docs: true, card: true, zero: false, noPledge: true,
    who: { ru: "21-60 лет, паспорт или ID и ПИНФЛ", uz: "21-60 yosh, pasport yoki ID va JShShIR" },
    how: { ru: "В приложении Tenge24, на виртуальную карту", uz: "Tenge24 ilovasida, virtual kartaga" },
    pledge: { ru: "Без залога и поручительств", uz: "Garov va kafilliksiz" },
    src: "https://tengebank.uz/ru/credit/mikrozajm-onlajn",
  },
  {
    id: "aab", logo: "aab.svg", color: "#1d4fd8",
    bank: { ru: "Asia Alliance Bank", uz: "Asia Alliance Bank" },
    legal: { ru: "АКБ «Asia Alliance Bank»", uz: "«Asia Alliance Bank» ATB" },
    product: { ru: "Микрозайм «Online»", uz: "«Online» mikroqarzi" },
    lic: { n: "79", d: "21.10.2017" },
    min: 500000, max: 100000000, tmin: 1, tmax: 36,
    lo: 25, hi: 38,
    online: true, docs: false, card: false, zero: false, noPledge: false,
    who: { ru: "Постоянный официальный доход последние 6 месяцев", uz: "Oxirgi 6 oyda doimiy rasmiy daromad" },
    how: { ru: "Онлайн", uz: "Onlayn" },
    pledge: { ru: "Страхование жизни на 125% суммы", uz: "Summaning 125% miqdorida hayot sug‘urtasi" },
    src: "https://aab.uz/ru/private/crediting/mikrozaym-online-/",
  },
  {
    id: "uzum", logo: "uzum.webp", color: "#7000ff",
    bank: { ru: "Uzum Bank", uz: "Uzum Bank" },
    legal: { ru: "АО «Uzum Bank»", uz: "«Uzum Bank» AJ" },
    product: { ru: "Кредит в приложении", uz: "Ilovada kredit" },
    lic: { n: "88", d: null },
    min: null, max: 100000000, tmin: 12, tmax: 36, step: 3,
    lo: 38, hi: 38,
    online: true, docs: true, card: false, zero: false, noPledge: true,
    who: { ru: "20-65 лет, стаж от 6 месяцев, долговая нагрузка до 50%", uz: "20-65 yosh, 6 oydan staj, qarz yuki 50% gacha" },
    how: { ru: "Только в приложении Uzum Bank, документы не нужны", uz: "Faqat Uzum Bank ilovasida, hujjat kerak emas" },
    pledge: { ru: "Без залогов и поручителей, ставка фиксированная", uz: "Garov va kafillarsiz, stavka qat’iy" },
    src: "https://uzumbank.uz/ru/credit/",
  },
  {
    id: "tbc", logo: "tbc.webp", color: "#00a3c4",
    bank: { ru: "TBC Bank", uz: "TBC Bank" },
    legal: { ru: "АКБ «TBC Bank»", uz: "«TBC Bank» ATB" },
    product: { ru: "Онлайн-кредит", uz: "Onlayn kredit" },
    lic: { n: "86", d: "11.04.2020" },
    min: 300000, max: 100000000, tmin: 3, tmax: 36,
    lo: 28, hi: 49,
    online: true, docs: true, card: false, zero: false, noPledge: true,
    who: { ru: "С 18 лет, нужен только номер паспорта или ID", uz: "18 yoshdan, faqat pasport yoki ID raqami kerak" },
    how: { ru: "В приложении TBC Bank Uzbekistan, деньги в тот же день", uz: "TBC Bank Uzbekistan ilovasida, pul o‘sha kuni" },
    pledge: { ru: "Без залога и поручителей", uz: "Garov va kafillarsiz" },
    src: "https://tbcbank.uz/ru/product/kredity/",
  },
];

/** Ставка для срока: [нижняя, верхняя] (верхняя null — банк назвал только «от»). */
export function ratesFor(p, n) {
  if (p.tiers) {
    const t = (p.tiers.find(([m]) => n <= m) || p.tiers[p.tiers.length - 1])[1];
    return [p.lo ?? t, t];
  }
  return [p.lo, p.hi];
}

/** Аннуитет: равный платёж в месяц. */
export function annuity(sum, rate, n) {
  const r = rate / 1200;
  return r ? (sum * r) / (1 - Math.pow(1 + r, -n)) : sum / n;
}

export const FAQ = {
  ru: [
    ["Это вы даёте займы?", "Нет. Мы сравниваем предложения банков с лицензией ЦБ Узбекистана. Заявку рассматривает и деньги выдаёт банк, договор вы заключаете с ним."],
    ["Почему платёж «от» и «до»?", "Многие банки называют вилку ставки: точную ставку они ставят после скоринга. Мы считаем платёж по нижней и по верхней ставке, чтобы вы видели оба края."],
    ["Что такое переплата?", "Сколько вы отдадите сверх взятой суммы: все платежи минус сам займ. Комиссии и страховки банка сюда не входят, они в полной стоимости кредита у банка."],
    ["Сколько можно платить в месяц?", "Банки смотрят долговую нагрузку. У Uzum Bank, например, платежи по всем займам должны быть не больше половины дохода. Проверьте себя калькулятором ниже."],
    ["Сайт берёт плату?", "Нет. Сравнение для вас бесплатное, сервису платят банки за приведённых клиентов. На ставку и решение банка это не влияет."],
  ],
  uz: [
    ["Qarzni siz berasizmi?", "Yo‘q. Biz O‘zbekiston MB litsenziyasiga ega banklarning takliflarini solishtiramiz. Arizani bank ko‘rib chiqadi va pulni bank beradi, shartnomani u bilan tuzasiz."],
    ["Nega to‘lov «dan» va «gacha»?", "Ko‘p banklar stavka oralig‘ini aytadi: aniq stavkani skoringdan keyin qo‘yadi. Biz to‘lovni quyi va yuqori stavka bo‘yicha hisoblaymiz, ikkala chegara ham ko‘rinsin."],
    ["Ortiqcha to‘lov nima?", "Olingan summadan tashqari qancha berasiz: barcha to‘lovlar minus qarzning o‘zi. Bank komissiyalari va sug‘urtalar bunga kirmaydi, ular bankdagi kreditning to‘liq qiymatida."],
    ["Oyiga qancha to‘lash mumkin?", "Banklar qarz yukiga qaraydi. Masalan, Uzum Bank’da barcha qarzlar bo‘yicha to‘lovlar daromadning yarmidan oshmasligi kerak. Pastdagi kalkulyator bilan o‘zingizni tekshiring."],
    ["Sayt pul oladimi?", "Yo‘q. Solishtirish siz uchun bepul, servisga keltirilgan mijozlar uchun banklar to‘laydi. Bu stavka va bank qaroriga ta’sir qilmaydi."],
  ],
};
