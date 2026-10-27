/*
 * CZECHFARM: всё, что макет говорит о компании, — только из ТЗ заказчика
 * (таблица CZECHFARM-1.xlsx, прислал владелец DevUz 26.10.2026): формула
 * бренда, миссия, модель создания стоимости, аудитории, инвестиционное
 * позиционирование. Препаратов, производителей, цифр, лет, филиалов,
 * адресов, телефонов в ТЗ нет — и в макете их нет: на их месте устройство
 * блока с пометкой «после согласования».
 */
export const LANGS = ["ru", "uz", "en"];

/* Формула бренда: три смысла. */
export const PILLARS = [
  {
    id: "health",
    word: "Health",
    ru: ["Здоровье", "Высшая цель компании: здоровье и качество жизни людей. С неё начинается каждое решение."],
    uz: ["Salomatlik", "Kompaniyaning oliy maqsadi: odamlarning salomatligi va hayot sifati. Har bir qaror shundan boshlanadi."],
    en: ["Health", "The company’s highest purpose is people’s health and quality of life. Every decision starts there."],
  },
  {
    id: "trust",
    word: "Trust",
    ru: ["Доверие", "Доверие пациентов, врачей, аптек и производителей. Его зарабатывают качеством и честной информацией."],
    uz: ["Ishonch", "Bemorlar, shifokorlar, dorixonalar va ishlab chiqaruvchilar ishonchi. U sifat va halol axborot bilan qozoniladi."],
    en: ["Trust", "The trust of patients, doctors, pharmacies and manufacturers, earned with quality and honest information."],
  },
  {
    id: "value",
    word: "Value",
    ru: ["Ценность", "Долгосрочная стоимость: для людей, для партнёров и для самой компании."],
    uz: ["Qiymat", "Uzoq muddatli qiymat: odamlar, hamkorlar va kompaniyaning o‘zi uchun."],
    en: ["Value", "Long-term value for people, for partners and for the company itself."],
  },
];

/* Цепочка роста стоимости — дословно по листу «Структура страниц», «Инвесторам». */
export const CHAIN = [
  {
    id: "health",
    ru: ["Здоровье", "Начало цепочки: продукт нужен, когда он помогает человеку жить лучше."],
    uz: ["Salomatlik", "Zanjir boshi: mahsulot odamga yaxshiroq yashashga yordam bersa, u kerak bo‘ladi."],
    en: ["Health", "Where it starts: a product matters when it helps a person live better."],
  },
  {
    id: "trust",
    ru: ["Доверие", "Пациент, врач и аптека выбирают то, чему доверяют."],
    uz: ["Ishonch", "Bemor, shifokor va dorixona ishongan narsasini tanlaydi."],
    en: ["Trust", "Patients, doctors and pharmacies choose what they trust."],
  },
  {
    id: "products",
    ru: ["Продукты", "Портфель современных решений от международных производителей, который компания выводит на местный рынок."],
    uz: ["Mahsulotlar", "Kompaniya mahalliy bozorga olib chiqadigan xalqaro ishlab chiqaruvchilarning zamonaviy yechimlari portfeli."],
    en: ["Products", "A portfolio of modern solutions from international manufacturers, brought to the local market."],
  },
  {
    id: "market",
    ru: ["Рынок", "Локальный доступ: компания связывает производителя с врачами, аптеками и пациентами."],
    uz: ["Bozor", "Mahalliy kirish: kompaniya ishlab chiqaruvchini shifokorlar, dorixonalar va bemorlar bilan bog‘laydi."],
    en: ["Market", "Local access: the company connects a manufacturer with doctors, pharmacies and patients."],
  },
  {
    id: "sales",
    ru: ["Продажи", "Доверие превращается в выбор и в повторный спрос."],
    uz: ["Savdo", "Ishonch tanlovga va takroriy talabga aylanadi."],
    en: ["Sales", "Trust turns into choice and into repeat demand."],
  },
  {
    id: "cash",
    ru: ["Денежный поток", "Повторный спрос даёт устойчивый денежный поток."],
    uz: ["Pul oqimi", "Takroriy talab barqaror pul oqimini beradi."],
    en: ["Cash flow", "Repeat demand produces steady cash flow."],
  },
  {
    id: "scale",
    ru: ["Масштабирование", "Денежный поток идёт в новые продукты и новых партнёров: модель растёт."],
    uz: ["Kengayish", "Pul oqimi yangi mahsulotlar va yangi hamkorlarga yo‘naltiriladi: model o‘sadi."],
    en: ["Scale", "Cash flow goes into new products and new partners, and the model grows."],
  },
];

/* Аудитории из ТЗ и куда ведёт каждая. */
export const AUDIENCES = [
  {
    id: "makers",
    to: "partners",
    ru: ["Производителям", "Запуск вашего фарм-бренда в Узбекистане под ключ: бренд, маркетинг, точки сбыта."],
    uz: ["Ishlab chiqaruvchilarga", "Farm-brendingizni O‘zbekistonda kalit topshirish asosida ishga tushirish: brend, marketing, sotuv nuqtalari."],
    en: ["Manufacturers", "A turnkey launch of your pharma brand in Uzbekistan: brand, marketing, points of sale."],
  },
  {
    id: "patients",
    to: "products",
    ru: ["Пациентам", "Понятная информация о продуктах компании. Только утверждённая, и она не заменяет совет врача."],
    uz: ["Bemorlarga", "Kompaniya mahsulotlari haqida tushunarli ma’lumot. Faqat tasdiqlangan, u shifokor maslahatining o‘rnini bosmaydi."],
    en: ["Patients", "Clear information about the company’s products. Approved only, and never a substitute for a doctor’s advice."],
  },
  {
    id: "doctors",
    to: "products",
    ru: ["Врачам", "Материалы о продуктах для специалистов: состав и формат согласуем с компанией."],
    uz: ["Shifokorlarga", "Mutaxassislar uchun mahsulot materiallari: tarkibi va formatini kompaniya bilan kelishamiz."],
    en: ["Doctors", "Product materials for specialists; scope and format to be agreed with the company."],
  },
  {
    id: "pharmacies",
    to: "contacts",
    ru: ["Аптекам", "Сотрудничество с аптеками: заявка в два шага, ответ приходит менеджеру компании."],
    uz: ["Dorixonalarga", "Dorixonalar bilan hamkorlik: ikki qadamda ariza, javob kompaniya menejeriga keladi."],
    en: ["Pharmacies", "Working with pharmacies: a two-step request that goes straight to a company manager."],
  },
  {
    id: "investors",
    to: "investors",
    ru: ["Инвесторам", "Фармацевтическая платформа, где улучшение здоровья создаёт устойчивую стоимость."],
    uz: ["Investorlarga", "Salomatlikni yaxshilash barqaror qiymat yaratadigan farmatsevtika platformasi."],
    en: ["Investors", "A pharmaceutical platform where improving health creates sustainable value."],
  },
];

/* Шаги сотрудничества с производителем: как идёт разговор, без обещаний услуг. */
/* Шаги запуска бренда под ключ. Со слов клиента (переписка владельца DevUz,
   26.10.2026): CZECHFARM запускает фарм-направления под ключ для тех, кто
   заходит на рынок: бренд, маркетинг, точки сбыта уже налажены. */
export const PARTNER_STEPS = [
  { ru: ["Заявка", "Компания, страна, продукт и масштаб запуска. Минута времени."], uz: ["Ariza", "Kompaniya, mamlakat, mahsulot va ishga tushirish ko‘lami. Bir daqiqa."], en: ["Request", "Company, country, product and launch scale. One minute."] },
  { ru: ["Знакомство", "Созвон с командой CZECHFARM: что за продукт и чего вы ждёте от рынка."], uz: ["Tanishuv", "CZECHFARM jamoasi bilan qo‘ng‘iroq: qanday mahsulot va bozordan nima kutasiz."], en: ["Introduction", "A call with the CZECHFARM team: what the product is and what you expect from the market."] },
  { ru: ["Бренд под рынок", "Имя, упаковка и понятная информация для врачей, аптек и пациентов."], uz: ["Bozorga mos brend", "Nom, qadoq va shifokorlar, dorixonalar va bemorlar uchun tushunarli ma’lumot."], en: ["A brand for the market", "Name, packaging and clear information for doctors, pharmacies and patients."] },
  { ru: ["Маркетинг и сбыт", "О бренде узнают, продукт встаёт в точки сбыта: у CZECHFARM это уже налажено."], uz: ["Marketing va sotuv", "Brend haqida bilishadi, mahsulot sotuv nuqtalariga chiqadi: CZECHFARMda bu allaqachon yo‘lga qo‘yilgan."], en: ["Marketing and sales", "People learn the brand and the product reaches points of sale: CZECHFARM already has this in place."] },
  { ru: ["Запуск и масштаб", "Бренд работает на рынке, дальше растёт вместе с повторным спросом."], uz: ["Ishga tushirish va kengayish", "Brend bozorda ishlaydi, keyin takroriy talab bilan o‘sadi."], en: ["Launch and scale", "The brand is live on the market and grows with repeat demand."] },
];

/* Поля карточки продукта: что покажет каталог, когда компания даст перечень. */
export const PRODUCT_FIELDS = [
  { id: "name", ru: "Название", uz: "Nomi", en: "Name" },
  { id: "inn", ru: "Действующее вещество", uz: "Ta’sir etuvchi modda", en: "Active substance" },
  { id: "form", ru: "Форма выпуска", uz: "Chiqarilish shakli", en: "Dosage form" },
  { id: "maker", ru: "Производитель и страна", uz: "Ishlab chiqaruvchi va mamlakat", en: "Manufacturer and country" },
  { id: "dir", ru: "Направление", uz: "Yo‘nalish", en: "Therapeutic area" },
  { id: "rx", ru: "Отпуск: по рецепту или без", uz: "Berilishi: retsept bilan yoki retseptsiz", en: "Prescription status" },
  { id: "doc", ru: "Инструкция (PDF)", uz: "Yo‘riqnoma (PDF)", en: "Leaflet (PDF)" },
];

/* Факты о компании, которые даёт заказчик (лист «Контент и материалы»). */
export const FACTS = [
  { ru: "История", uz: "Tarix", en: "History" },
  { ru: "География работы", uz: "Ish geografiyasi", en: "Where we work" },
  { ru: "Команда", uz: "Jamoa", en: "Team" },
  { ru: "Филиалы", uz: "Filiallar", en: "Branches" },
  { ru: "Показатели", uz: "Ko‘rsatkichlar", en: "Key figures" },
  { ru: "Производители", uz: "Ishlab chiqaruvchilar", en: "Manufacturers" },
];

/* Материалы для инвесторов: в ТЗ «не предоставлены», показываем устройство. */
export const IR_DOCS = [
  { ru: ["Презентация компании", "PDF для первой встречи"], uz: ["Kompaniya taqdimoti", "Birinchi uchrashuv uchun PDF"], en: ["Company presentation", "A PDF for the first meeting"] },
  { ru: ["Ключевые показатели", "Таблица, которую компания обновляет сама"], uz: ["Asosiy ko‘rsatkichlar", "Kompaniya o‘zi yangilaydigan jadval"], en: ["Key figures", "A table the company updates itself"] },
  { ru: ["Отчётность", "Документы по мере публикации"], uz: ["Hisobotlar", "E’lon qilinishiga qarab hujjatlar"], en: ["Reports", "Documents as they are published"] },
];
