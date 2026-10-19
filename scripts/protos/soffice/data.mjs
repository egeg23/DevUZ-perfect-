// Данные макета Soffice — только с soffice.uz (снято 19.10.2026): главная и
// страница каждого бизнес-центра. Ставка — как на их карточке «от … сум/м²»;
// за месяц ли она и с НДС ли, на их сайте не сказано (это одна из находок),
// поэтому в макете она подписана «за м² в месяц» с оговоркой в подвале.
//
// Положение на карте — примерное, по адресу и станции метро с их страниц:
// карта в макете — схема, а не навигатор.

export const F = {
  name: "Soffice",
  site: "https://soffice.uz",
  phone: "+998997307007",
  phoneT: "+998 99 730 70 07",
  wa: "https://wa.me/998997307007",
  tg: "https://t.me/Soffice_cc",
  news: "https://t.me/soffice_uz",
  ig: "https://www.instagram.com/soffice.uz/",
  mail: "info@soffice.uz",
  office: {
    ru: "Ташкент, Мирабадский район, ул. Туркистон, 12А, БЦ «Platform», 4 этаж, офис 401",
    uz: "Toshkent, Mirobod tumani, Turkiston ko‘chasi, 12A, «Platform» BM, 4-qavat, 401-ofis",
    en: "Platform Business Centre, 12A Turkiston St, office 401, 4th floor, Mirabad, Tashkent",
  },
};

/* Районы — как на их страницах. */
export const DISTRICTS = {
  mirabad: { ru: "Мирабадский", uz: "Mirobod", en: "Mirabad" },
  yunusabad: { ru: "Юнусабадский", uz: "Yunusobod", en: "Yunusabad" },
  yakkasaray: { ru: "Яккасарайский", uz: "Yakkasaroy", en: "Yakkasaray" },
  yashnabad: { ru: "Яшнабадский", uz: "Yashnobod", en: "Yashnabad" },
  shayhantahur: { ru: "Шайхантахурский", uz: "Shayxontohur", en: "Shaykhantakhur" },
};

/* Форматы, которые они сдают (главная: «Кабинеты, опенспейс, коворкинг»). */
export const TYPES = {
  office: { ru: "Офис", uz: "Ofis", en: "Office" },
  cabinet: { ru: "Кабинеты", uz: "Kabinetlar", en: "Private rooms" },
  open: { ru: "Опенспейс", uz: "Open space", en: "Open space" },
  cowork: { ru: "Коворкинг", uz: "Kovorking", en: "Coworking" },
};

/*
 * 18 бизнес-центров с главной soffice.uz, в их порядке.
 * min/max — «офисы от … до … м²» со страницы БЦ (null — площадь там не
 * названа, такой БЦ подходит под любую площадь «по запросу»; max null —
 * «1000+»). rate — «от … сум/м²». ll — [широта, долгота], примерно.
 */
export const BC = [
  { id: "grossplaza", n: "Gross Plaza", cls: "A", d: "mirabad", rate: 420000, min: 80, max: 2500, ll: [41.2968, 69.2797],
    a: { ru: "ул. Тараса Шевченко, 21А", uz: "Taras Shevchenko ko‘chasi, 21A", en: "21A Taras Shevchenko St" }, m: { ru: "Ойбек", uz: "Oybek", en: "Oybek" },
    p: { ru: "двухуровневая парковка", uz: "ikki qavatli avtoturargoh", en: "two-level parking" }, x: { ru: "потолки 4 м, панорамные окна", uz: "shift 4 m, panorama derazalar", en: "4 m ceilings, panoramic windows" }, t: ["office", "cabinet", "open"] },
  { id: "sapphire", n: "Sapphire", cls: "A", d: "mirabad", rate: 420000, min: 60, max: 10000, ll: [41.2898, 69.2925],
    a: { ru: "ул. Авлиё Ота, 128", uz: "Avliyo Ota ko‘chasi, 128", en: "128 Avliyo Ota St" }, m: { ru: "Тошкент", uz: "Toshkent", en: "Toshkent" },
    p: { ru: "170 мест, подземный и наземный", uz: "170 o‘rin, yer osti va yer usti", en: "170 spaces, underground and outdoor" }, x: { ru: "блоки или этаж целиком", uz: "bloklar yoki butun qavat", en: "blocks or whole floors" }, t: ["office", "cabinet", "open"] },
  { id: "forum", n: "Forum", cls: "A+", d: "yunusabad", rate: 480000, min: 100, max: 10000, ll: [41.3138, 69.2738],
    a: { ru: "пр. Шароф Рашидов, 16", uz: "Sharof Rashidov shoh ko‘chasi, 16", en: "16 Sharof Rashidov Ave" }, m: { ru: "Мустакиллик", uz: "Mustaqillik maydoni", en: "Mustaqillik Square" },
    p: { ru: "340 мест, наземный", uz: "340 o‘rin, yer usti", en: "340 outdoor spaces" }, x: { ru: "рядом Hyatt Regency", uz: "yonida Hyatt Regency", en: "next to Hyatt Regency" }, t: ["office", "cabinet", "open"] },
  { id: "trilliant", n: "Trilliant", cls: "A+", d: "yunusabad", rate: 540000, min: null, max: null, ll: [41.3152, 69.2836],
    a: { ru: "ул. Шахрисабз, 2", uz: "Shahrisabz ko‘chasi, 2", en: "2 Shahrisabz St" }, m: { ru: "Юнуса Раджаби", uz: "Yunus Rajabiy", en: "Yunus Rajabiy" },
    p: { ru: "подземный, с гостевыми местами", uz: "yer osti, mehmonlar uchun joylar bilan", en: "underground, with guest spaces" }, x: { ru: "open space и кабинеты", uz: "open space va kabinetlar", en: "open space and private rooms" }, t: ["office", "cabinet", "open"] },
  { id: "dream", n: "Dream", cls: "B", d: "yakkasaray", rate: 430000, min: null, max: null, ll: [41.2842, 69.2585],
    a: { ru: "ул. Махмуда Тараби, 16", uz: "Mahmud Torobiy ko‘chasi, 16", en: "16 Mahmud Torobiy St" }, m: { ru: "Ойбек", uz: "Oybek", en: "Oybek" },
    p: { ru: "64+ места, крытый", uz: "64+ o‘rin, yopiq", en: "64+ covered spaces" }, x: { ru: "около 80 офисных блоков", uz: "80 ga yaqin ofis bloki", en: "about 80 office units" }, t: ["office", "cabinet", "open"] },
  { id: "nestone", n: "Nest One", cls: "A+", d: "shayhantahur", rate: 490000, min: null, max: null, ll: [41.3158, 69.2488],
    a: { ru: "ул. Батыра Закирова, 1А/1", uz: "Botir Zokirov ko‘chasi, 1A/1", en: "1A/1 Botir Zokirov St" }, m: { ru: "Пахтакор", uz: "Paxtakor", en: "Paxtakor" },
    p: { ru: "подземный и гостевой", uz: "yer osti va mehmonlar uchun", en: "underground and guest" }, x: { ru: "рядом Tashkent City Mall", uz: "yonida Tashkent City Mall", en: "next to Tashkent City Mall" }, t: ["office", "cabinet", "open"] },
  { id: "modera", n: "Modera Towers", cls: "A+", d: "yakkasaray", rate: 456000, min: 100, max: null, ll: [41.2948, 69.2702],
    a: { ru: "ул. Шота Руставели, 2", uz: "Shota Rustaveli ko‘chasi, 2", en: "2 Shota Rustaveli St" }, m: { ru: "Ойбек", uz: "Oybek", en: "Oybek" },
    p: { ru: "подземный, 3 уровня", uz: "yer osti, 3 qavat", en: "underground, 3 levels" }, x: { ru: "8 лифтов OTIS, 48 часов своего света", uz: "8 ta OTIS lift, 48 soat o‘z elektri", en: "8 OTIS lifts, 48 h backup power" }, t: ["office", "cabinet", "open", "cowork"] },
  { id: "infinity", n: "Infinity", cls: "A", d: "yashnabad", rate: 420000, min: 130, max: 2000, ll: [41.2932, 69.2985],
    a: { ru: "ул. Истикбол, 41", uz: "Istiqbol ko‘chasi, 41", en: "41 Istiqbol St" }, m: { ru: "Тошкент", uz: "Toshkent", en: "Toshkent" },
    p: { ru: "256 мест, отдельное здание", uz: "256 o‘rin, alohida bino", en: "256 spaces, separate building" }, x: { ru: "20 000 м² всего", uz: "jami 20 000 m²", en: "20,000 m² in total" }, t: ["office", "cabinet", "open"] },
  { id: "orient", n: "Orient", cls: "A", d: "yunusabad", rate: 360000, min: 100, max: 500, ll: [41.3268, 69.2905],
    a: { ru: "ул. Олой Бозори, 64", uz: "Oloy bozori ko‘chasi, 64", en: "64 Oloy Bozori St" }, m: { ru: "Абдуллы Кадыри", uz: "Abdulla Qodiriy", en: "Abdulla Qodiriy" },
    p: { ru: "подземный и наземный", uz: "yer osti va yer usti", en: "underground and outdoor" }, x: { ru: "11 этажей", uz: "11 qavat", en: "11 floors" }, t: ["office", "cabinet", "open"] },
  { id: "platform", n: "Platform", cls: "A", d: "mirabad", rate: 300000, min: 35, max: 500, ll: [41.2918, 69.2868],
    a: { ru: "ул. Туркистон, 12А", uz: "Turkiston ko‘chasi, 12A", en: "12A Turkiston St" }, m: { ru: "Тошкент", uz: "Toshkent", en: "Toshkent" },
    p: { ru: "крытый на 2 этаже и гостевой", uz: "2-qavatda yopiq va mehmonlar uchun", en: "covered on floor 2, plus guest" }, x: { ru: "потолки 3,5 м, вход по лицу", uz: "shift 3,5 m, yuz orqali kirish", en: "3.5 m ceilings, face ID entry" }, t: ["office", "cabinet", "open"] },
  { id: "kayan", n: "Kayan", cls: "A", d: "yashnabad", rate: 360000, min: 90, max: null, ll: [41.2898, 69.3085],
    a: { ru: "ул. Махтумкули, 1", uz: "Maxtumquli ko‘chasi, 1", en: "1 Makhtumkuli St" }, m: { ru: "Машинасозлар", uz: "Mashinasozlar", en: "Mashinasozlar" },
    p: { ru: "120 мест под землёй, зарядка для электромобиля", uz: "yer ostida 120 o‘rin, elektromobil quvvatlash", en: "120 underground, EV charging" }, x: { ru: "17 этажей, коворкинг", uz: "17 qavat, kovorking", en: "17 floors, coworking" }, t: ["office", "cabinet", "open", "cowork"] },
  { id: "novaplaza", n: "Nova Plaza", cls: "A", d: "yunusabad", rate: 360000, min: 50, max: null, ll: [41.3232, 69.2818],
    a: { ru: "ул. Абдуллы Кадыри, 1А", uz: "Abdulla Qodiriy ko‘chasi, 1A", en: "1A Abdulla Qodiriy St" }, m: { ru: "Абдуллы Кадыри", uz: "Abdulla Qodiriy", en: "Abdulla Qodiriy" },
    p: { ru: "120 мест, двухуровневый", uz: "120 o‘rin, ikki qavatli", en: "120 spaces, two levels" }, x: { ru: "большие залы с делением", uz: "bo‘linadigan katta zallar", en: "large floors, can be split" }, t: ["office", "cabinet", "open"] },
  { id: "businesspark", n: "Business Park", cls: "B+", d: "yashnabad", rate: 240000, min: null, max: null, ll: [41.2985, 69.3290],
    a: { ru: "ул. Махтумкули, 114", uz: "Maxtumquli ko‘chasi, 114", en: "114 Makhtumkuli St" }, m: { ru: "Машинасозлар", uz: "Mashinasozlar", en: "Mashinasozlar" },
    p: { ru: "подземный и наземный", uz: "yer osti va yer usti", en: "underground and outdoor" }, x: { ru: "6 корпусов, 1,8 га, зелёный двор", uz: "6 bino, 1,8 ga, yashil hovli", en: "6 blocks, 1.8 ha, green courtyard" }, t: ["office", "cabinet", "open"] },
  { id: "solidpremium", n: "Solid.Premium", cls: "B+", d: "yakkasaray", rate: 420000, min: 70, max: 800, ll: [41.2880, 69.2652],
    a: { ru: "ул. Тафаккур, 68А", uz: "Tafakkur ko‘chasi, 68A", en: "68A Tafakkur St" }, m: { ru: "Ойбек", uz: "Oybek", en: "Oybek" },
    p: { ru: "60 мест перед зданием", uz: "bino oldida 60 o‘rin", en: "60 spaces in front" }, x: { ru: "6 этажей, директорские кабинеты", uz: "6 qavat, direktor kabinetlari", en: "6 floors, executive rooms" }, t: ["office", "cabinet", "open"] },
  { id: "newera", n: "New Era", cls: "A", d: "yakkasaray", rate: 360000, min: 50, max: 800, ll: [41.2858, 69.2628],
    a: { ru: "ул. Шота Руставели, 44А", uz: "Shota Rustaveli ko‘chasi, 44A", en: "44A Shota Rustaveli St" }, m: { ru: "Ойбек", uz: "Oybek", en: "Oybek" },
    p: { ru: "80 мест, крытый и внешний", uz: "80 o‘rin, yopiq va ochiq", en: "80 spaces, covered and outdoor" }, x: { ru: "высокие потолки, витражи", uz: "baland shiftlar, vitrajlar", en: "high ceilings, glass walls" }, t: ["office", "cabinet", "open"] },
  { id: "panoramic", n: "Panoramic", cls: "B", d: "mirabad", rate: 240000, min: 30, max: 3000, ll: [41.2975, 69.2762],
    a: { ru: "ул. Афросиаб, 6/1", uz: "Afrosiyob ko‘chasi, 6/1", en: "6/1 Afrosiyob St" }, m: { ru: "Ойбек", uz: "Oybek", en: "Oybek" },
    p: { ru: "40 мест, закрытая наземная", uz: "40 o‘rin, yopiq yer usti", en: "40 gated outdoor spaces" }, x: { ru: "панорамные виды", uz: "panorama manzaralar", en: "panoramic views" }, t: ["office", "cabinet", "open"] },
  { id: "ventumplaza", n: "Ventum Plaza", cls: "B", d: "yakkasaray", rate: 300000, min: 50, max: 700, ll: [41.2812, 69.2768],
    a: { ru: "ул. Абдуллы Каххара, 56А", uz: "Abdulla Qahhor ko‘chasi, 56A", en: "56A Abdulla Qahhor St" }, m: { ru: "Тошкент", uz: "Toshkent", en: "Toshkent" },
    p: { ru: "70 мест, наземная", uz: "70 o‘rin, yer usti", en: "70 outdoor spaces" }, x: { ru: "8 этажей", uz: "8 qavat", en: "8 floors" }, t: ["office", "cabinet", "open"] },
  { id: "novaminor", n: "Nova Minor", cls: "B", d: "mirabad", rate: 300000, min: 30, max: 500, ll: [41.3352, 69.2868],
    a: { ru: "пр. Ш. Рашидова, 99А", uz: "Sh. Rashidov shoh ko‘chasi, 99A", en: "99A Sh. Rashidov Ave" }, m: { ru: "Бодомзор и Минор", uz: "Bodomzor va Minor", en: "Bodomzor and Minor" },
    p: { ru: "внешняя парковка", uz: "ochiq avtoturargoh", en: "outdoor parking" }, x: { ru: "5 этажей", uz: "5 qavat", en: "5 floors" }, t: ["office", "cabinet", "open"] },
];

/* Станции метро со страниц БЦ — для схемы карты: [широта, долгота]. */
export const METRO = [
  { n: { ru: "Пахтакор", uz: "Paxtakor", en: "Paxtakor" }, ll: [41.3098, 69.2465] },
  { n: { ru: "Мустакиллик", uz: "Mustaqillik", en: "Mustaqillik" }, ll: [41.3058, 69.2712] },
  { n: { ru: "Ойбек", uz: "Oybek", en: "Oybek" }, ll: [41.2965, 69.2735] },
  { n: { ru: "Тошкент", uz: "Toshkent", en: "Toshkent" }, ll: [41.2908, 69.2878] },
  { n: { ru: "Машинасозлар", uz: "Mashinasozlar", en: "Mashinasozlar" }, ll: [41.2945, 69.3205] },
  { n: { ru: "Юнуса Раджаби", uz: "Yunus Rajabiy", en: "Yunus Rajabiy" }, ll: [41.3125, 69.2808] },
  { n: { ru: "Абдуллы Кадыри", uz: "Abdulla Qodiriy", en: "Abdulla Qodiriy" }, ll: [41.3248, 69.2850] },
  { n: { ru: "Минор", uz: "Minor", en: "Minor" }, ll: [41.3328, 69.2848] },
];

/* Логотипы арендаторов с их главной (l-01 … l-18), подпись — для alt. */
export const LOGOS = ["Siemens Healthineers", "Abu Dhabi Uzbek Investment", "korzinka.uz", "Servier", "Masdar", "Rödl & Partner", "BI Group", "NRG", "SAP", "Seven Media Group", "European Bank for Reconstruction and Development", "Hareket", "EPA", "Uztransgaz", "Magnum", "IKS Holding", "Metka EGN", "Gross Insurance"];

/* Отзывы с их главной: имя, должность и текст как у них; uz и en — перевод. */
export const REVIEWS = [
  { id: "babaev", n: { ru: "Дониер Бабаев", uz: "Doniyor Boboyev", en: "Doniyor Babaev" }, r: { ru: "Глава представительства Tetra Tech ES Inc., проект USAID", uz: "Tetra Tech ES Inc. vakolatxonasi rahbari, USAID loyihasi", en: "Head of Office, Tetra Tech ES Inc., USAID project" },
    q: { ru: "Офисное пространство сочетает стильный дизайн, функциональность и продуманную организацию территории. Просторный паркинг и внимательный персонал. Компания всегда учитывает пожелания арендаторов.", uz: "Ofis maydoni zamonaviy dizayn, qulaylik va hududning puxta tashkil etilishini birlashtiradi. Keng avtoturargoh va e’tiborli xodimlar. Kompaniya har doim ijarachilar istaklarini hisobga oladi.", en: "The space combines stylish design, practicality and a well-planned site. Spacious parking and attentive staff. The company always listens to its tenants." } },
  { id: "hashimov", n: { ru: "Зафар Хашимов", uz: "Zafar Hoshimov", en: "Zafar Khashimov" }, r: { ru: "Основатель Anglesey Food (korzinka.uz, City Taxi, Red Tag, FLO)", uz: "Anglesey Food asoschisi (korzinka.uz, City Taxi, Red Tag, FLO)", en: "Founder, Anglesey Food (korzinka.uz, City Taxi, Red Tag, FLO)" },
    q: { ru: "Их проект Gross Plaza на улице Тараса Шевченко произвёл сильное впечатление своим масштабом и продуманностью. За ними стоит энергичная и компетентная команда.", uz: "Taras Shevchenko ko‘chasidagi Gross Plaza loyihasi o‘z ko‘lami va puxtaligi bilan katta taassurot qoldirdi. Ularning ortida g‘ayratli va malakali jamoa turibdi.", en: "Their Gross Plaza on Taras Shevchenko Street impressed me with its scale and thoughtful design. There is an energetic, capable team behind it." } },
  { id: "rahmanov", n: { ru: "Тимур Рахманов", uz: "Temur Rahmonov", en: "Timur Rakhmanov" }, r: { ru: "Генеральный директор Abu Dhabi Uzbek Investment", uz: "Abu Dhabi Uzbek Investment bosh direktori", en: "CEO, Abu Dhabi Uzbek Investment" },
    q: { ru: "Перед тем как наши клиенты посещают офис, они взаимодействуют с сервисной командой Soffice, и впечатление всегда самое положительное. Отдельное преимущество: гибкая планировка Open Space.", uz: "Mijozlarimiz ofisga kelishidan oldin Soffice servis jamoasi bilan muloqot qiladi va taassurot doim ijobiy. Alohida afzallik: Open Space’ning moslashuvchan rejasi.", en: "Before our clients reach the office they meet the Soffice service team, and the impression is always positive. A real plus: the flexible open-space layout." } },
  { id: "agzamov", n: { ru: "Дмитрий Агзамов", uz: "Dmitriy Agzamov", en: "Dmitry Agzamov" }, r: { ru: "Глава представительства SIS BS, партнёр Siemens Healthineers в Узбекистане", uz: "SIS BS vakolatxonasi rahbari, O‘zbekistonda Siemens Healthineers hamkori", en: "Head of SIS BS, Siemens Healthineers partner in Uzbekistan" },
    q: { ru: "Наш офис в бизнес-центре Platform оказался идеальным: центр города, круглосуточный доступ, подземная парковка. Команда Soffice оперативно решает любые вопросы по аренде.", uz: "Platform biznes-markazidagi ofisimiz ideal bo‘lib chiqdi: shahar markazi, kecha-kunduz kirish, yer osti avtoturargohi. Soffice jamoasi ijara bo‘yicha har qanday savolni tez hal qiladi.", en: "Our office at Platform turned out ideal: city centre, 24/7 access, underground parking. The Soffice team sorts out any lease question fast." } },
  { id: "kramers", n: { ru: "Eleanor Kramers", uz: "Eleanor Kramers", en: "Eleanor Kramers" }, r: { ru: "Managing Director, Montfort Eurasia", uz: "Managing Director, Montfort Eurasia", en: "Managing Director, Montfort Eurasia" },
    q: { ru: "Работа с Soffice в бизнес-центре Platform стала отличным опытом. Все, от охраны до технической службы, профессиональны и доброжелательны. Мы рады продолжить сотрудничество.", uz: "Platform biznes-markazida Soffice bilan ishlash ajoyib tajriba bo‘ldi. Qo‘riqchilardan texnik xizmatgacha hamma professional va xushmuomala. Hamkorlikni davom ettirishdan xursandmiz.", en: "Working with Soffice at Platform has been a great experience. Everyone, from security to maintenance, is professional and friendly. We are glad to continue." } },
];

/* Что сейчас на soffice.uz мешает арендатору (проверено 19.10.2026) и как станет. */
export const NOW = [
  { k: "speed",
    ru: ["На телефоне главная открывается около 8 секунд: сначала грузятся счётчики и карта, потом офисы.", "Первый экран и подбор появляются сразу, фото и карта догружаются, пока человек читает."],
    uz: ["Telefonda bosh sahifa 8 soniyaga yaqin ochiladi: avval hisoblagichlar va xarita, keyin ofislar yuklanadi.", "Birinchi ekran va tanlash darhol chiqadi, suratlar va xarita odam o‘qiyotganda yuklanadi."],
    en: ["On a phone the home page takes about 8 seconds: trackers and the map load before the offices.", "The first screen and the finder appear at once; photos and the map load while people read."] },
  { k: "cookie",
    ru: ["Полоса про cookies закрывает главную кнопку «Найти офис».", "Кнопка «Подобрать офис» видна всегда, на телефоне внизу под большим пальцем."],
    uz: ["Cookie haqidagi chiziq asosiy «Ofis topish» tugmasini yopib qo‘yadi.", "«Ofis tanlash» tugmasi doim ko‘rinadi, telefonda pastda, bosh barmoq ostida."],
    en: ["The cookie banner covers the main “Find an office” button.", "“Find an office” is always visible; on a phone it sits at the bottom, under the thumb."] },
  { k: "contact",
    ru: ["Telegram ведёт в новостной канал, а не к менеджеру. Позвонить можно только в два нажатия.", "Менеджер в Telegram, WhatsApp с готовым текстом и звонок одним нажатием."],
    uz: ["Telegram menejerga emas, yangiliklar kanaliga olib boradi. Qo‘ng‘iroq faqat ikki bosishda.", "Telegramda menejer, tayyor matnli WhatsApp va bir bosishda qo‘ng‘iroq."],
    en: ["Telegram opens the news channel, not a manager. Calling takes two taps.", "A manager on Telegram, WhatsApp with the message ready, and a call in one tap."] },
  { k: "lang",
    ru: ["В узбекской версии в заголовке и меню русские буквы «А» вместо латинских, местами русский текст в узбекской и английской.", "Каждый язык чистый: узбекский латиницей без единой русской буквы, английский для иностранных компаний."],
    uz: ["O‘zbekcha versiyada sarlavha va menyuda lotincha «A» o‘rniga ruscha harf turibdi, ba’zi joylarda o‘zbekcha va inglizcha sahifalarda ruscha matn bor.", "Har bir til toza: o‘zbekcha lotincha, birorta rus harfisiz, inglizchasi xorijiy kompaniyalar uchun."],
    en: ["The Uzbek version has Cyrillic letters posing as Latin “A” in the heading and menu, and Russian text slips into the Uzbek and English pages.", "Each language is clean: Uzbek in Latin script with no Cyrillic, English for foreign companies."] },
  { k: "alt",
    ru: ["У фото офисов нет подписей, поэтому в поиске по картинкам Google их нет.", "У каждого фото подпись: бизнес-центр, район, что на снимке. Офисы находят и по картинкам."],
    uz: ["Ofis suratlarida izoh yo‘q, shuning uchun ular Google rasmlar qidiruvida chiqmaydi.", "Har bir suratda izoh: biznes-markaz, tuman, suratda nima bor. Ofislarni rasmlar orqali ham topishadi."],
    en: ["Office photos have no captions, so they never show up in Google image search.", "Every photo is captioned: building, district, what is in the shot. People find offices through images too."] },
  { k: "card",
    ru: ["Google не знает адреса бизнес-центров и телефон: в поиске нет карточки с адресом и кнопкой звонка.", "Google и Яндекс показывают Soffice и каждый бизнес-центр с адресом, телефоном и часами прямо в поиске."],
    uz: ["Google biznes-markazlar manzili va telefonni bilmaydi: qidiruvda manzil va qo‘ng‘iroq tugmasi bilan kartochka yo‘q.", "Google va Yandex qidiruvda Soffice va har bir biznes-markazni manzil, telefon va ish vaqti bilan ko‘rsatadi."],
    en: ["Google does not know the buildings’ addresses or the phone, so search shows no card with an address and a call button.", "Google and Yandex show Soffice and every building with address, phone and hours right in search."] },
  { k: "price",
    ru: ["У цены «от 420 000 сум/м²» не сказано, за месяц ли это и с НДС ли. Сколько будет за офис, приходится считать самому.", "Ставка подписана: за м² в месяц, с НДС или без. Рядом сразу сумма за ваш офис в месяц."],
    uz: ["«m² uchun 420 000 so‘mdan» narxida bu oyiga ekani va QQS bilanmi yoki yo‘qmi aytilmagan. Ofis qanchaga tushishini o‘zingiz hisoblaysiz.", "Stavka aniq yozilgan: m² uchun oyiga, QQS bilan yoki QQSsiz. Yonida darhol ofisingiz uchun oylik summa."],
    en: ["“From 420,000 UZS/m²” does not say whether it is monthly or includes VAT. Tenants have to work out the office cost themselves.", "The rate is labelled per m² per month, with or without VAT, and the monthly total for your office sits right next to it."] },
];

/* Механики, которых нет у ташкентских конкурентов (docs/research/soffice.md). */
export const MECH = [
  { k: "find", from: "WeWork, Industrious",
    ru: ["Подбор за минуту", "Площадь, район, бюджет в месяц: и сразу видно, сколько бизнес-центров подходит."],
    uz: ["Bir daqiqada tanlash", "Maydon, tuman, oylik byudjet: va darhol nechta biznes-markaz mos kelishi ko‘rinadi."],
    en: ["Find in a minute", "Size, district, monthly budget, and you instantly see how many buildings fit."] },
  { k: "map", from: "IWG, Bayut",
    ru: ["Все бизнес-центры на одной карте", "У каждого цена в месяц за вашу площадь, класс, метро и парковка."],
    uz: ["Barcha biznes-markazlar bitta xaritada", "Har birida maydoningiz uchun oylik narx, sinf, metro va avtoturargoh."],
    en: ["Every building on one map", "Each shows the monthly price for your size, class, metro and parking."] },
  { k: "calc", from: "Industrious, C-Space",
    ru: ["«Сколько это в месяц»", "Не ставка за метр, а сумма за ваш офис: в месяц, в год, с НДС и без."],
    uz: ["«Bu oyiga qancha»", "Metr narxi emas, ofisingiz uchun summa: oyiga, yiliga, QQS bilan va QQSsiz."],
    en: ["“What is that per month”", "Not a rate per metre but the cost of your office: per month, per year, with and without VAT."] },
  { k: "floor", from: "Bayut, Moscow City",
    ru: ["Схема этажа со свободными блоками", "Нажали на блок: площадь, окна, сумма в месяц и запись на просмотр именно его."],
    uz: ["Bo‘sh bloklar bilan qavat sxemasi", "Blokni bosdingiz: maydon, derazalar, oylik summa va aynan shu blokni ko‘rishga yozilish."],
    en: ["Floor plan with free units", "Tap a unit: size, windows, monthly cost and a viewing for that exact unit."] },
  { k: "tour", from: "Industrious, WeWork",
    ru: ["Просмотр в два нажатия", "День и время, и сообщение менеджеру уже готово, с бизнес-центром и площадью."],
    uz: ["Ikki bosishda ko‘rish", "Kun va vaqt, menejerga xabar tayyor, biznes-markaz va maydon bilan."],
    en: ["Viewing in two taps", "Pick a day and a time; the message to the manager is ready, with the building and size."] },
  { k: "cmp", from: "Bayut, CBRE",
    ru: ["Сравнение бизнес-центров", "Два-три центра рядом: класс, ставка, сумма в месяц, метро, парковка."],
    uz: ["Biznes-markazlarni solishtirish", "Ikki-uch markaz yonma-yon: sinf, stavka, oylik summa, metro, avtoturargoh."],
    en: ["Compare buildings", "Two or three side by side: class, rate, monthly cost, metro, parking."] },
];

/* Частые вопросы — их же, коротко. */
export const FAQ = [
  { ru: ["Какой срок аренды?", "Как правило, от одного года. Индивидуальные условия и расширение, если компания растёт, обсуждаются."],
    uz: ["Ijara muddati qancha?", "Odatda bir yildan. Alohida shartlar va kompaniya o‘ssa kengayish muhokama qilinadi."],
    en: ["What is the lease term?", "Usually from one year. Custom terms and room to grow can be discussed."] },
  { ru: ["Есть ли комиссия?", "Нет. Все объекты Soffice в собственности компании или под её прямым управлением, посредников нет."],
    uz: ["Komissiya bormi?", "Yo‘q. Soffice’ning barcha obyektlari kompaniya mulki yoki uning bevosita boshqaruvida, vositachilar yo‘q."],
    en: ["Is there a commission?", "No. Every Soffice building is owned or directly managed by the company, with no brokers in between."] },
  { ru: ["Что входит в стоимость?", "Базовые коммунальные услуги и общая инфраструктура бизнес-центра. В зависимости от пакета: уборка, охрана, переговорные, коворкинг, интернет."],
    uz: ["Narxga nima kiradi?", "Asosiy kommunal xizmatlar va biznes-markazning umumiy infratuzilmasi. Paketga qarab: tozalash, qo‘riqlash, muzokara xonalari, kovorking, internet."],
    en: ["What is included?", "Basic utilities and the building’s shared facilities. Depending on the package: cleaning, security, meeting rooms, coworking, internet."] },
  { ru: ["Как посмотреть офис?", "Выберите день и время в блоке «Просмотр»: менеджер подтвердит визит в Telegram или WhatsApp."],
    uz: ["Ofisni qanday ko‘rish mumkin?", "«Ko‘rish» blokida kun va vaqtni tanlang: menejer tashrifni Telegram yoki WhatsApp’da tasdiqlaydi."],
    en: ["How do I view an office?", "Pick a day and time in the Viewing block; a manager confirms on Telegram or WhatsApp."] },
];
