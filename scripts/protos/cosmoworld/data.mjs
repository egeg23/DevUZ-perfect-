/*
 * Cosmo World: всё, что макет говорит о компании, — только с их сайтов
 * cosmoworld.uz (RU и /en) и cosmo.kg, сняты 28.10.2026 (разведка —
 * docs/research/cosmoworld.md). Цен на их сайте нет — в макете их нет.
 * Узбекский — наш перевод их же слов, латиницей.
 */
export const LANGS = ["ru", "uz", "en"];

export const COMPANY = {
  name: "Cosmo World",
  legal: "OOO “COSMO WORLD”",
  slogan: {
    ru: "Объединяем усилия, превосходим ожидания",
    uz: "Kuchlarni birlashtiramiz, kutilganidan oshib ketamiz",
    en: "Joining forces, exceeding expectations",
  },
  lead: {
    ru: "Надёжный дистрибьютор товаров для дома и личной гигиены в Узбекистане",
    uz: "O‘zbekistonda uy va shaxsiy gigiyena mahsulotlarining ishonchli distribyutori",
    en: "A reliable distributor of household and personal care products in Uzbekistan",
  },
  phone: "+998 77 3507025",
  phoneHref: "tel:+998773507025",
  email: "info@cosmoworld.uz",
  telegram: "https://t.me/cosmoworlduz",
  whatsapp: "https://wa.me/998773507025",
  instagram: "https://www.instagram.com/cosmoworld.uz",
  address: {
    ru: "100077, г. Ташкент, Мирзо-Улугбекский район, улица Буюк Ипак Йули, дом 152/1",
    uz: "100077, Toshkent sh., Mirzo Ulug‘bek tumani, Buyuk Ipak Yo‘li ko‘chasi, 152/1-uy",
    en: "100077, Tashkent, Mirzo-Ulugbek district, Buyuk Ipak Yuli Street, 152/1",
  },
  logo: "https://static.tildacdn.com/tild3965-6334-4336-b366-323663393330/logo.svg",
  colors: { navy: "#052659", sky: "#67adfc", light: "#edf8ff" },
};

/* Цифры — ровно те, что на их сайте (счётчики «О бренде» и «Покрытие»). */
export const NUMBERS = [
  { v: "10", ru: "лет в индустрии красоты и бытовой химии", uz: "yil go‘zallik va maishiy kimyo sohasida", en: "years in beauty and household care" },
  { v: "10+", ru: "стран-партнёров", uz: "hamkor davlat", en: "partner countries" },
  { v: "500 м²", vuz: "500 m²", ven: "500 m²", ru: "площадь офиса", uz: "ofis maydoni", en: "office space" },
  { v: "3 000", ru: "паллетомест на складе", uz: "ombordagi palleta o‘rni", en: "pallet spaces in the warehouse" },
  { v: "2 000 м²", vuz: "2 000 m²", ven: "2,000 m²", ru: "собственный автоматизированный склад", uz: "o‘z avtomatlashtirilgan omborimiz", en: "own automated warehouse" },
  { v: "150+", ru: "сотрудников", uz: "xodim", en: "employees" },
];

/* Бренды — порядок и слова их каталога; PDF — их же ссылки на Яндекс. */
export const BRANDS = [
  {
    id: "arnest", name: "Арнест", latin: "Arnest", origin: "ru",
    ru: "Крупный российский производитель косметической, парфюмерной продукции и товаров бытовой химии.",
    uz: "Kosmetika, parfyumeriya va maishiy kimyo mahsulotlarining yirik Rossiya ishlab chiqaruvchisi.",
    en: "A major Russian manufacturer of cosmetics, perfumes and household chemicals.",
    pdf: "Каталог Арнест.pdf",
  },
  {
    id: "vesna", name: "Весна", latin: "Vesna", origin: "ru",
    ru: "Парфюмерно-косметическая компания. Входит в тройку лидеров российского рынка средств личной гигиены и бытовой химии.",
    uz: "Parfyumeriya-kosmetika kompaniyasi. Rossiyada shaxsiy gigiyena va maishiy kimyo bozorining uchta yetakchisidan biri.",
    en: "A perfume and cosmetics company, one of the top three on the Russian market for personal hygiene and household chemicals.",
    pdf: "Каталог Весна.pdf",
  },
  {
    id: "rashel", name: "Dr. Rashel Estelin", origin: "ae",
    ru: "Бренд уходовой косметики из ОАЭ с широким ассортиментом.",
    uz: "BAAdan keng assortimentli parvarish kosmetikasi brendi.",
    en: "A skincare brand from the UAE with a wide range.",
    pdf: "Dr Rashel Estelin.pdf",
  },
  {
    id: "peros", name: "Peros", origin: "tr",
    ru: "Ведущий турецкий бренд, специализирующийся на производстве бытовой химии и средств для ухода за домом.",
    uz: "Maishiy kimyo va uy parvarishi vositalariga ixtisoslashgan yetakchi Turkiya brendi.",
    en: "A leading Turkish brand of household chemicals and home care products.",
    pdf: "Каталог PEROS.pdf",
  },
  {
    id: "forest", name: "Forest Clean", origin: "ru",
    ru: "Российский бренд экологичных бытовых чистящих и моющих средств.",
    uz: "Ekologik toza tozalash va yuvish vositalari ishlab chiqaruvchi Rossiya brendi.",
    en: "A Russian brand of eco-friendly household cleaning and washing products.",
    pdf: "Каталог Forest clean.pdf",
  },
  {
    id: "bily", name: "Bily", origin: "tr",
    ru: "Турецкий бренд экологичных бытовых чистящих и моющих средств.",
    uz: "Ekologik toza tozalash va yuvish vositalari ishlab chiqaruvchi Turkiya brendi.",
    en: "A Turkish brand of eco-friendly household cleaning and washing products.",
    pdf: "Каталог BILLY clean.pdf",
  },
  {
    id: "parachute", name: "Parachute", origin: "in",
    ru: "Линейка масел на основе кокоса индийской компании Marico. Уже многие десятилетия остаётся эталоном качества, натуральности и чистоты.",
    uz: "Hindistonning Marico kompaniyasi ishlab chiqaradigan kokos moylari liniyasi. O‘nlab yillardan beri sifat, tabiiylik va tozalik namunasi.",
    en: "Coconut-based oils by the Indian company Marico, for decades a benchmark of quality, naturalness and purity.",
    pdf: "Каталог Parachute.pdf",
  },
  {
    id: "brandfree", name: "Brandfree", origin: "ru",
    ru: "Российский бренд безопасной бытовой химии, основан в 2021 году: экологически чистые средства для уборки и стирки.",
    uz: "2021-yilda tashkil etilgan xavfsiz maishiy kimyo Rossiya brendi: tozalash va kir yuvish uchun ekologik toza vositalar.",
    en: "A Russian brand of safe household chemicals founded in 2021: eco-friendly cleaning and laundry products.",
    pdf: "Каталог Brandfree.pdf",
  },
  {
    id: "mixit", name: "MIXIT", origin: "ru",
    ru: "Российский производитель косметики и парфюмерии с собственным заводом и лабораторией, основан в 2014 году, представлен более чем в 32 000 торговых точек в России и за рубежом.",
    uz: "O‘z zavodi va laboratoriyasiga ega Rossiya kosmetika va parfyumeriya ishlab chiqaruvchisi, 2014-yilda tashkil etilgan, Rossiya va xorijdagi 32 000 dan ortiq savdo nuqtasida bor.",
    en: "A Russian cosmetics and perfume maker with its own factory and laboratory, founded in 2014 and present in more than 32,000 retail outlets in Russia and abroad.",
    pdf: "Каталог 2025 MIXIT.pdf",
  },
  {
    id: "nefis", name: "Nefis", origin: "ru",
    ru: "Крупный российский производитель бытовой химии и косметической продукции, основан в 1855 году. Входит в тройку лидеров по средствам для стирки, моющим и чистящим средствам.",
    uz: "1855-yilda tashkil etilgan maishiy kimyo va kosmetikaning yirik Rossiya ishlab chiqaruvchisi. Kir yuvish, yuvish va tozalash vositalari bo‘yicha uchta yetakchidan biri.",
    en: "A major Russian maker of household chemicals and cosmetics, founded in 1855, among the top three in laundry, washing and cleaning products.",
    pdf: "Каталог 2025 Nefis.pdf",
  },
];

/* «Территориальное покрытие»: все 14 регионов, как в их списке. */
export const REGIONS = [
  ["Республика Каракалпакстан", "Qoraqalpog‘iston Respublikasi", "Republic of Karakalpakstan"],
  ["Хорезмская", "Xorazm", "Khorezm"],
  ["Навоийская", "Navoiy", "Navoi"],
  ["Бухарская", "Buxoro", "Bukhara"],
  ["Самаркандская", "Samarqand", "Samarkand"],
  ["Кашкадарьинская", "Qashqadaryo", "Kashkadarya"],
  ["Сурхандарьинская", "Surxondaryo", "Surkhandarya"],
  ["Джизакская", "Jizzax", "Jizzakh"],
  ["Сырдарьинская", "Sirdaryo", "Syrdarya"],
  ["Ташкентская", "Toshkent", "Tashkent"],
  ["Наманганская", "Namangan", "Namangan"],
  ["Андижанская", "Andijon", "Andijan"],
  ["Ферганская", "Farg‘ona", "Fergana"],
  ["г. Ташкент", "Toshkent shahri", "Tashkent city"],
];

/* «Где купить»: сети, чьи логотипы стоят у них на сайте. */
export const STORES = ["Korzinka", "Makro", "Magnum", "Магнит Косметик", "Toshkent Parfum", "ABC", "Lillykay", "Evo Eva"];

/* Команда — имена, должности и стаж с их сайта. */
export const TEAM = [
  { name: ["Мухамеджанов Анвар", "Anvar Muxamedjanov", "Anvar Mukhammedjanov"], role: ["Основатель компании", "Kompaniya asoschisi", "Founder"], facts: [["20", "лет в бизнесе и дистрибуции", "yil biznes va distribyutsiyada", "years in business and distribution"], ["5", "основанных компаний", "ta tashkil etilgan kompaniya", "companies founded"]], quote: ["Стабильность, проверенная временем. Доверие, которое становится стандартом", "Vaqt sinovidan o‘tgan barqarorlik. Standartga aylanadigan ishonch", "Stability, time-tested. Trust that sets the standard"] },
  { name: ["Гунько Людмила", "Lyudmila Gunko", "Ludmila Gunko"], role: ["CEO", "CEO", "CEO"], facts: [["17", "лет в дистрибуции", "yil distribyutsiyada", "years in distribution"], ["10", "крупных проектов", "ta yirik loyiha", "major projects"]], quote: ["Лидерство это не должность, а ответственность", "Yetakchilik lavozim emas, mas’uliyat", "Leadership is not a position, but a responsibility"] },
  { name: ["Дибиров Ислам", "Islam Dibirov", "Islam Dibirov"], role: ["Руководитель отдела продаж", "Savdo bo‘limi rahbari", "Head of Sales"], facts: [["16", "лет в продажах и дистрибуции", "yil savdo va distribyutsiyada", "years in sales and distribution"]], quote: ["Продажи это стратегия, ответственность и результат", "Savdo bu strategiya, mas’uliyat va natija", "Sales are strategy, responsibility and results"] },
  { name: ["Шабанов Игорь", "Igor Shabanov", "Igor Shabanov"], role: ["KAM по внешним и внутренним партнёрам", "Tashqi va ichki hamkorlar bo‘yicha KAM", "Key Account Manager"], facts: [["14", "лет в дистрибуции", "yil distribyutsiyada", "years in distribution"]], quote: ["Развивая бренды, создавая команды, достигая успеха", "Brendlarni rivojlantirib, jamoalar tuzib, muvaffaqiyatga erishamiz", "Developing brands, building teams, achieving success"] },
  { name: ["Хуррамов Дильшоджон", "Dilshodjon Xurramov", "Dilshodjon Khurramov"], role: ["Руководитель по продажам в регионах", "Hududlardagi savdo rahbari", "Regional Sales Manager"], facts: [], quote: ["Видеть возможности, развивать потенциал, достигать целей", "Imkoniyatni ko‘rish, salohiyatni rivojlantirish, maqsadga erishish", "Seeing opportunities, developing potential, achieving goals"] },
  { name: ["Олифиренко Анастасия", "Anastasiya Olifirenko", "Anastasia Olifirenko"], role: ["HRD", "HRD", "HRD"], facts: [["6", "лет в подборе кадров", "yil kadrlar tanlashda", "years in recruitment"]], quote: ["HR-стратегии для бизнеса, возможности для людей", "Biznes uchun HR strategiyalar, odamlar uchun imkoniyatlar", "HR strategies for business, opportunities for people"] },
];

/* Приоритеты — пять карточек их сайта. */
export const VALUES = [
  ["Профессионализм", "Professionallik", "Professionalism"],
  ["Прозрачность", "Shaffoflik", "Transparency"],
  ["Доверие", "Ishonch", "Trust"],
  ["Высокое качество продукции", "Yuqori sifatli mahsulot", "High product quality"],
  ["Условия под ваш бизнес", "Biznesingizga mos shartlar", "Terms for your business"],
];

/* Филиал в Кыргызстане — cosmo.kg. */
export const KG = {
  site: "https://cosmo.kg/",
  phone: "+996 551 597778",
  numbers: [["200 м²", "площадь офиса"], ["1 500", "паллетомест"], ["1 500 м²", "автоматизированный склад"]],
  extraBrand: "Dr. Heal",
};
