// Стоимость сайта CHECHFARM по этому макету. Все цены макета — здесь и только здесь.
//
// Основа — корпоративный сайт из PROMO (lib/admin/mockup-offer): 1 000 $ вместо
// 2 500 $, если начинаем в течение 48 часов. Допы — часы × 20 $ (ставка
// веб-студий Ташкента, как в soffice/plan.mjs), и по слову владельца DevUz
// (26.10.2026: «допы сделай за 50% от цены») каждый доп идёт за половину:
// на странице старая цена зачёркнута, рядом половина.

export const BASE = {
  price: 2500,
  promo: 1000,
  weeks: [3, 5],
  ru: { t: "Корпоративный сайт CHECHFARM", d: "Семь страниц из этого макета: главная, о компании, портфель, партнёрам, инвесторам, новости, контакты. Русский и узбекский, формы обращений на почту, под телефон и компьютер" },
  uz: { t: "CHECHFARM korporativ sayti", d: "Shu maketdagi yetti sahifa: bosh sahifa, kompaniya haqida, portfel, hamkorlarga, investorlarga, yangiliklar, aloqa. Rus va o‘zbek tillari, murojaat shakllari pochtaga, telefon va kompyuter uchun" },
  en: { t: "CHECHFARM corporate website", d: "Seven pages from this mockup: home, about, portfolio, partners, investors, news, contacts. Russian and Uzbek, request forms to email, for phone and desktop" },
};

/** Акция: 48 часов с первого открытия макета на этом устройстве. */
export const OFFER_HOURS = 48;
/** Ставка за час работы, $. */
export const RATE = 20;
/** Допы — за половину цены (владелец, 26.10.2026). */
export const ADDON_OFF = 0.5;

/* star — включено сразу: то, ради чего макет. */
export const ADDONS = [
  { id: "launch", h: 16, star: true,
    ru: { t: "«Путь вашего бренда» и «Сам или с CHECHFARM»", e: "Производитель вписывает свой препарат и видит его запуск: бренд, маркетинг, полки аптек, под ключ; заявка заполняется сама" },
    uz: { t: "«Brendingiz yo‘li» va «O‘zingiz yoki CHECHFARM bilan»", e: "Ishlab chiqaruvchi dorisini yozadi va uning ishga tushishini ko‘radi: brend, marketing, dorixona peshtaxtalari, kalit topshirish; ariza o‘zi to‘ldiriladi" },
    en: { t: "“Your brand’s path” and “On your own or with CHECHFARM”", e: "A manufacturer types in their product and watches it launch: brand, marketing, pharmacy shelves, turnkey; the request fills itself in" } },
  { id: "scene", h: 24, star: true,
    ru: { t: "Сцена на первом экране", e: "Капсула раскрывается по прокрутке: кадры в высоком качестве, загрузка до 100%, отдельный вариант для телефона, кадры защищены шифром" },
    uz: { t: "Birinchi ekrandagi sahna", e: "Aylantirganda kapsula ochiladi: yuqori sifatli kadrlar, 100% gacha yuklash, telefon uchun alohida variant, kadrlar shifr bilan himoyalangan" },
    en: { t: "First-screen scene", e: "The capsule opens as you scroll: high-quality frames, loading to 100%, a separate phone version, frames protected by encryption" } },
  { id: "chain", h: 14, star: true,
    ru: { t: "Живая цепочка стоимости", e: "Семь шагов от здоровья до масштабирования: импульс бежит сам, стеклянные блоки загораются, нажатие на шаг открывает пояснение" },
    uz: { t: "Jonli qiymat zanjiri", e: "Salomatlikdan kengayishgacha yetti qadam: impuls o‘zi yuradi, shisha bloklar yonadi, qadamni bosish izohni ochadi" },
    en: { t: "Live value chain", e: "Seven steps from health to scale: the pulse runs itself, glass blocks light up, tapping a step opens its explanation" } },
  { id: "audience", h: 10,
    ru: { t: "Главная под аудиторию", e: "Пациент, врач, аптека, производитель или инвестор: выбор меняет первый экран и путь по сайту" },
    uz: { t: "Auditoriyaga mos bosh sahifa", e: "Bemor, shifokor, dorixona, ishlab chiqaruvchi yoki investor: tanlov birinchi ekran va sayt bo‘ylab yo‘lni o‘zgartiradi" },
    en: { t: "Home page by audience", e: "Patient, doctor, pharmacy, manufacturer or investor: the choice changes the first screen and the path" } },
  { id: "globe", h: 8,
    ru: { t: "Глобус партнёрства", e: "Маршруты от производителей к местному рынку: каждый маршрут показывает шаг сотрудничества" },
    uz: { t: "Hamkorlik globusi", e: "Ishlab chiqaruvchilardan mahalliy bozorga yo‘nalishlar: har biri hamkorlik qadamini ko‘rsatadi" },
    en: { t: "Partnership globe", e: "Routes from manufacturers to the local market: each one shows a partnership step" } },
  { id: "catalog", h: 30,
    ru: { t: "Каталог продуктов", e: "Поиск по названию и веществу, фильтры по направлениям, страница продукта с инструкцией PDF и напоминанием про врача" },
    uz: { t: "Mahsulotlar katalogi", e: "Nomi va modda bo‘yicha qidiruv, yo‘nalish filtrlari, PDF yo‘riqnomali va shifokor haqida eslatmali mahsulot sahifasi" },
    en: { t: "Product catalogue", e: "Search by name and substance, area filters, a product page with a PDF leaflet and a see-your-doctor note" } },
  { id: "panel", h: 40, star: true,
    ru: { t: "Панель: обращения, статусы, роли", e: "Обращения с сайта первой строкой, статус виден человеку на сайте, заметки, история действий, роли владельца, руководителя и менеджера" },
    uz: { t: "Panel: murojaatlar, holatlar, rollar", e: "Saytdan murojaatlar birinchi qatorda, holat saytda ko‘rinadi, izohlar, harakatlar tarixi, ega, rahbar va menejer rollari" },
    en: { t: "Panel: requests, statuses, roles", e: "Website requests on top, status visible on the site, notes, action history, owner, head and manager roles" } },
  { id: "content", h: 16,
    ru: { t: "Новости и портфель из панели", e: "Новость или продукт публикуется кнопкой и сразу появляется на сайте, снимается так же" },
    uz: { t: "Paneldan yangiliklar va portfel", e: "Yangilik yoki mahsulot tugma bilan e’lon qilinadi va darhol saytda chiqadi, xuddi shunday olinadi" },
    en: { t: "News and portfolio from the panel", e: "A news item or product is published with one button and shows up on the site at once" } },
  { id: "seo", h: 6,
    ru: { t: "Заголовки страниц без программиста", e: "Заголовок и описание каждой страницы для поиска правятся в панели" },
    uz: { t: "Dasturchisiz sahifa sarlavhalari", e: "Har bir sahifaning qidiruv uchun sarlavhasi va tavsifi panelda tahrirlanadi" },
    en: { t: "Page titles without a developer", e: "Each page’s search title and description are edited in the panel" } },
  { id: "investor", h: 20,
    ru: { t: "Комната инвестора", e: "Презентация, показатели и отчётность по запросу: доступ по личной ссылке, кто и когда открыл" },
    uz: { t: "Investor xonasi", e: "Taqdimot, ko‘rsatkichlar va hisobotlar so‘rov bo‘yicha: shaxsiy havola orqali kirish, kim va qachon ochgani" },
    en: { t: "Investor room", e: "Presentation, figures and reports on request: access by personal link, who opened what and when" } },
  { id: "tgbot", h: 12,
    ru: { t: "Обращения в Telegram команде", e: "Каждое обращение с сайта сразу у нужного человека в Telegram, с кнопкой «Взял»" },
    uz: { t: "Murojaatlar jamoaga Telegramda", e: "Saytdan har bir murojaat darhol kerakli odamga Telegramda «Oldim» tugmasi bilan" },
    en: { t: "Requests to the team on Telegram", e: "Every website request goes straight to the right person on Telegram with a “Mine” button" } },
  { id: "crm", h: 16,
    ru: { t: "Связь с amoCRM или Bitrix24", e: "Обращение с сайта становится сделкой в CRM: тема, страница, контакт" },
    uz: { t: "amoCRM yoki Bitrix24 bilan bog‘lanish", e: "Saytdan murojaat CRMda bitimga aylanadi: mavzu, sahifa, kontakt" },
    en: { t: "amoCRM or Bitrix24 link", e: "A website request becomes a CRM deal: topic, page, contact" } },
  { id: "en", h: 10,
    ru: { t: "Английская версия", e: "Для международных производителей и инвесторов: весь сайт на английском" },
    uz: { t: "Inglizcha versiya", e: "Xalqaro ishlab chiqaruvchilar va investorlar uchun: butun sayt inglizcha" },
    en: { t: "English version", e: "For international manufacturers and investors: the whole site in English" } },
].map((a) => ({ ...a, full: a.h * RATE, price: Math.round(a.h * RATE * ADDON_OFF) }));

export const ALL = BASE.promo + ADDONS.reduce((s, a) => s + a.price, 0);
export const ALL_FULL = ADDONS.reduce((s, a) => s + a.full, 0);
