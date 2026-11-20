/*
 * Всё об академии — только с asapharmacademy.uz (снято 20.11.2026,
 * scripts/protos/asapharm/BEFORE.md). Узбекский текст — наш перевод: у
 * академии на сайте только русский. Цен, отзывов и сертификата на их сайте
 * нет: в макете цена — «уточняйте», отзывы и сертификат подписаны «пример».
 * Длинные тире их текста заменены двоеточием (правило макетов).
 */

export const F = {
  name: "ASAPHARM Academy",
  phone: "+998 97 407 11 40",
  tel: "+998974071140",
  email: "info@asapharmacademy.uz",
  tg: "a_zakirova",
  site: "https://asapharmacademy.uz",
  oferta: "https://asapharmacademy.uz/oferta",
  addr: { ru: "100015, Ташкент, Мирабадский район, ул. Катта Мирабад, 3/5", uz: "100015, Toshkent, Mirobod tumani, Katta Mirobod ko‘chasi, 3/5" },
  map: "https://yandex.uz/maps/?text=" + encodeURIComponent("Ташкент, ул. Катта Мирабад, 3"),
};

export const TAG = {
  ru: "Учебный центр для специалистов фармацевтической отрасли в сфере регистрации лекарственных средств",
  uz: "Farmatsevtika sohasi mutaxassislari uchun dori vositalarini ro‘yxatdan o‘tkazish bo‘yicha o‘quv markazi",
};

export const MISSION = {
  ru: "Наша миссия: способствовать росту числа высококлассных специалистов, которые будут работать на благо здоровья людей, обеспечивая доступность, качество и безопасность лекарственных средств.",
  uz: "Missiyamiz: inson salomatligi yo‘lida ishlaydigan, dori vositalarining mavjudligi, sifati va xavfsizligini ta’minlaydigan malakali mutaxassislar sonini oshirishga hissa qo‘shish.",
};

/* Направления обучения — три пункта с их сайта. */
export const DIRS = [
  { ru: "Регистрация лекарственных средств", uz: "Dori vositalarini ro‘yxatdan o‘tkazish" },
  { ru: "Управление отделом регистрации фармацевтической компании", uz: "Farmatsevtika kompaniyasining ro‘yxatdan o‘tkazish bo‘limini boshqarish" },
  { ru: "Повышение квалификации специалистов и руководителей регуляторных отделов", uz: "Regulyator bo‘limlar mutaxassislari va rahbarlari malakasini oshirish" },
];

/* Кому полезно — «три двери» (их блок «Кому мы будем полезны»). */
export const WHO = [
  { k: "corp", ic: "build", to: "corp",
    ru: { t: "Фармацевтическим компаниям", d: "Стремящимся повысить квалификацию своих сотрудников и улучшить эффективность их работы.", go: "Корпоративное обучение" },
    uz: { t: "Farmatsevtika kompaniyalariga", d: "Xodimlari malakasini oshirish va ish samaradorligini yaxshilashni istagan kompaniyalarga.", go: "Korporativ o‘qitish" } },
  { k: "staff", ic: "badge", to: "pro",
    ru: { t: "Сотрудникам фармкомпаний", d: "Которые хотят получить профессиональные навыки для развития личной карьеры.", go: "Продвинутый курс" },
    uz: { t: "Farmkompaniya xodimlariga", d: "Shaxsiy karyerasini rivojlantirish uchun professional ko‘nikmalar olmoqchi bo‘lganlarga.", go: "Professional kurs" } },
  { k: "grad", ic: "cap", to: "base",
    ru: { t: "Выпускникам медицинских и фармацевтических институтов", d: "Желающим освоить перспективную профессию в фармацевтике.", go: "Базовый курс" },
    uz: { t: "Tibbiyot va farmatsevtika institutlari bitiruvchilariga", d: "Farmatsevtikada istiqbolli kasbni egallashni istaganlarga.", go: "Boshlang‘ich kurs" } },
];

/* Курсы — с их сайта: название, описание, старт, часы, срок. */
export const COURSES = [
  { k: "base", img: "course-base", start: "2026-11-24", hours: 24, months: 2,
    ru: { lvl: "Базовый курс", t: "Менеджер по регистрации лекарственных средств", d: "Подходит для новичков. Слушатели получат базовые знания о том, как осуществляется регуляторное сопровождение фармацевтической деятельности, научатся осуществлять регистрацию лекарственных средств и смогут освоить новую, перспективную профессию на пересечении бизнеса, науки и заботы о здоровье людей.", for: "Новичкам и выпускникам" },
    uz: { lvl: "Boshlang‘ich kurs", t: "Dori vositalarini ro‘yxatdan o‘tkazish bo‘yicha menejer", d: "Yangi boshlovchilar uchun mos. Tinglovchilar farmatsevtika faoliyatini regulyator kuzatib borish qanday amalga oshirilishi haqida asosiy bilim oladi, dori vositalarini ro‘yxatdan o‘tkazishni o‘rganadi va biznes, fan hamda inson salomatligi tutashgan joydagi yangi, istiqbolli kasbni egallay oladi.", for: "Yangi boshlovchilar va bitiruvchilarga" } },
  { k: "pro", img: "course-pro", start: "2026-11-26", hours: 48, months: 3,
    ru: { lvl: "Продвинутый курс", t: "Регистрация лекарственных средств. Professional", d: "Слушатели получат комплексные знания о том, как осуществляется регуляторное сопровождение фармацевтической деятельности, научатся самостоятельно формировать досье на препараты, интерпретировать данные ДКИ и КЛИ, осуществлять весь цикл по регистрации ЛС и МИ.", for: "Тем, кто идёт в регистрацию всерьёз" },
    uz: { lvl: "Professional kurs", t: "Dori vositalarini ro‘yxatdan o‘tkazish. Professional", d: "Tinglovchilar farmatsevtika faoliyatini regulyator kuzatib borish haqida kompleks bilim oladi, preparatlarga dosyeni mustaqil shakllantirishni, klinikagacha va klinik tadqiqotlar ma’lumotlarini talqin qilishni, dori vositalari va tibbiy buyumlarni ro‘yxatdan o‘tkazishning butun siklini bajarishni o‘rganadi.", for: "Ro‘yxatdan o‘tkazishga jiddiy kirayotganlarga" } },
];

/* Вебинары — даты и темы с их сайта, все 15:00-17:00 по Ташкенту. */
export const WEBINARS = [
  { d: "2026-11-16", free: true, ru: "Менеджер по регистрации лекарственных средств. Введение в профессию", uz: "Dori vositalarini ro‘yxatdan o‘tkazish bo‘yicha menejer. Kasbga kirish" },
  { d: "2026-11-17", ru: "Регистрация лекарственных препаратов по правилам ЕАЭС", uz: "Dori preparatlarini YeOII qoidalari bo‘yicha ro‘yxatdan o‘tkazish" },
  { d: "2026-11-18", ru: "Внесение изменений в регистрационное досье, основные правила", uz: "Ro‘yxatdan o‘tkazish dosyesiga o‘zgartirish kiritish: asosiy qoidalar" },
  { d: "2026-11-24", ru: "Основы фармаконадзора. Мониторинг безопасности лекарственных средств", uz: "Farmakonazorat asoslari. Dori vositalari xavfsizligini monitoring qilish" },
  { d: "2026-11-25", ru: "Актуальные требования законодательства к доклиническим и клиническим исследованиям", uz: "Klinikagacha va klinik tadqiqotlarga qonunchilikning dolzarb talablari" },
  { d: "2026-11-26", ru: "Формирование ОХЛП на воспроизведённые препараты при приведении досье в соответствие с последними требованиями", uz: "Dosyeni so‘nggi talablarga moslashtirishda generik preparatlar uchun dori preparatining umumiy tavsifini shakllantirish" },
];

/* «Почему выбирают» — три пункта их сайта и четвёртый из фактов о команде. */
export const WHY = [
  { ic: "fresh", ru: { t: "Актуальные знания", d: "Программы актуальны на 2026 год. Мы постоянно обновляем курсы с учётом последних изменений в законодательстве РУз." },
    uz: { t: "Dolzarb bilim", d: "Dasturlar 2026 yil uchun dolzarb. Kurslarni O‘zR qonunchiligidagi so‘nggi o‘zgarishlarni hisobga olib doimiy yangilaymiz." } },
  { ic: "formats", ru: { t: "Широкий выбор форматов", d: "Офлайн-обучение, онлайн-обучение, профессиональные чаты и вебинары." },
    uz: { t: "Formatlar tanlovi keng", d: "Oflayn o‘qish, onlayn o‘qish, professional chatlar va vebinarlar." } },
  { ic: "anywhere", ru: { t: "Доступность", d: "Обучайтесь в удобном для вас режиме: на работе, дома и даже в путешествии." },
    uz: { t: "Qulaylik", d: "O‘zingizga qulay rejimda o‘qing: ishda, uyda va hatto sayohatda." } },
  { ic: "team", ru: { t: "Преподают практики отрасли", d: "Директор в фармацевтике с 2014 года, руководители направлений прошли путь в международных компаниях и институтах." },
    uz: { t: "Soha amaliyotchilari dars beradi", d: "Direktor 2014 yildan farmatsevtikada, yo‘nalish rahbarlari xalqaro kompaniya va institutlarda ishlagan." } },
];

export const TEAM = [
  { k: "mamykin", ru: { n: "Дмитрий Мамыкин", r: "Директор ASAPHARM Academy", b: "В фармацевтической отрасли с 2014 года. Степень MBA (Grenoble Ecole de Management, Франция). Занимался международным развитием бизнеса в западных, российских и узбекских компаниях. Разрабатывал регуляторные стратегии и выводил биотехнологические лекарственные препараты на глобальные рынки.", tags: ["с 2014 года в отрасли", "MBA Grenoble"] },
    uz: { n: "Dmitriy Mamikin", r: "ASAPHARM Academy direktori", b: "2014 yildan farmatsevtika sohasida. MBA darajasi (Grenoble Ecole de Management, Fransiya). G‘arb, Rossiya va O‘zbekiston kompaniyalarida biznesni xalqaro rivojlantirish bilan shug‘ullangan. Regulyator strategiyalarni ishlab chiqqan va biotexnologik dori preparatlarini global bozorlarga olib chiqqan.", tags: ["2014 yildan sohada", "MBA Grenoble"] } },
  { k: "anisimova", ru: { n: "Ольга Анисимова", r: "Руководитель направления «Фарм регулирование»", b: "В фармацевтической отрасли более 10 лет. Высшее образование в сфере регистрации лекарственных средств (CESIF, Испания). Руководит проектами по международной регистрации в институте биотехнологий. Принимала участие в процедуре переквалификации иммунобиологических препаратов ВОЗ.", tags: ["более 10 лет", "CESIF, Испания"] },
    uz: { n: "Olga Anisimova", r: "«Farm regulyatsiya» yo‘nalishi rahbari", b: "Farmatsevtika sohasida 10 yildan ortiq. Dori vositalarini ro‘yxatdan o‘tkazish bo‘yicha oliy ma’lumot (CESIF, Ispaniya). Biotexnologiyalar institutida xalqaro ro‘yxatdan o‘tkazish loyihalariga rahbarlik qiladi. JSST immunobiologik preparatlarini qayta malakalash jarayonida qatnashgan.", tags: ["10 yildan ortiq", "CESIF, Ispaniya"] } },
  { k: "khakimov", ru: { n: "Азиз Хакимов", r: "Руководитель направления «Фарм маркетинг»", b: "В фармацевтической отрасли 12 лет. Высшее фармацевтическое образование и степень MBA по стратегическому менеджменту. Прошёл путь от рядового медицинского представителя до топ-руководителя Bayer CH по Узбекистану, Кыргызстану и Монголии.", tags: ["12 лет в отрасли", "Bayer CH"] },
    uz: { n: "Aziz Xakimov", r: "«Farm marketing» yo‘nalishi rahbari", b: "Farmatsevtika sohasida 12 yil. Oliy farmatsevtik ma’lumot va strategik menejment bo‘yicha MBA darajasi. Oddiy tibbiy vakildan Bayer CH kompaniyasining O‘zbekiston, Qirg‘iziston va Mo‘g‘ulistondagi top-rahbarigacha bo‘lgan yo‘lni bosib o‘tgan.", tags: ["sohada 12 yil", "Bayer CH"] } },
  { k: "yagyaeva", ru: { n: "Сусана Ягъяева", r: "Руководитель направления «Фарм HR»", b: "HR-эксперт, бизнес-тренер, консультант по управлению персоналом и организационному развитию. Более 20 лет опыта в крупных международных организациях, в том числе в фармацевтическом секторе. Прошла путь от инспектора отдела кадров до HRD, члена Совета директоров.", tags: ["более 20 лет", "HRD"] },
    uz: { n: "Susana Yag‘yayeva", r: "«Farm HR» yo‘nalishi rahbari", b: "HR ekspert, biznes-trener, xodimlarni boshqarish va tashkiliy rivojlanish bo‘yicha maslahatchi. Yirik xalqaro tashkilotlarda, jumladan farmatsevtika sohasida 20 yildan ortiq tajriba. Kadrlar bo‘limi inspektoridan HRD va direktorlar kengashi a’zosigacha bo‘lgan yo‘lni bosib o‘tgan.", tags: ["20 yildan ortiq", "HRD"] } },
];

/* «Почему это важно» — их текст (на сайте обрезан «Читать далее»). */
export const IMPORTANT = {
  ru: ["В настоящее время фармацевтический рынок Узбекистана стремительно меняется. Государство ужесточает требования к регистрации лекарственных средств на основе международных стандартов, идёт гармонизация с требованиями ВОЗ, ICH, ЕАЭС.", "Компании нуждаются в специалистах, которые понимают фармацевтическую регуляторику на глубоком уровне и могут работать по международным стандартам. Такие сотрудники должны знать основы фармаконадзора и принципы формирования регистрационного досье."],
  uz: ["Hozirgi vaqtda O‘zbekiston farmatsevtika bozori tez o‘zgarmoqda. Davlat xalqaro standartlar asosida dori vositalarini ro‘yxatdan o‘tkazish talablarini kuchaytirmoqda, JSST, ICH va YeOII talablari bilan uyg‘unlashtirish ketmoqda.", "Kompaniyalarga farmatsevtika regulyatorikasini chuqur tushunadigan va xalqaro standartlar bo‘yicha ishlay oladigan mutaxassislar kerak. Bunday xodimlar farmakonazorat asoslarini va ro‘yxatdan o‘tkazish dosyesini shakllantirish tamoyillarini bilishi lozim."],
};

/* «Путь досье» — три шага, каждый к темам их курсов и вебинаров. */
export const PATH = [
  { ru: { n: "01 · Досье", t: "Собираем досье", d: "Модули досье, общая характеристика препарата, данные доклинических и клинических исследований. По требованиям ВОЗ, ICH и ЕАЭС." },
    uz: { n: "01 · Dosye", t: "Dosyeni yig‘amiz", d: "Dosye modullari, preparatning umumiy tavsifi, klinikagacha va klinik tadqiqotlar ma’lumotlari. JSST, ICH va YeOII talablari bo‘yicha." } },
  { ru: { n: "02 · Экспертиза", t: "Проходим экспертизу", d: "Что проверяют, как отвечать на замечания и как вносить изменения в регистрационное досье." },
    uz: { n: "02 · Ekspertiza", t: "Ekspertizadan o‘tamiz", d: "Nimani tekshirishadi, izohlarga qanday javob berish va ro‘yxatdan o‘tkazish dosyesiga qanday o‘zgartirish kiritish." } },
  { ru: { n: "03 · Удостоверение", t: "Получаем регистрационное удостоверение", d: "Весь цикл регистрации лекарственных средств и медицинских изделий, а дальше: фармаконадзор и мониторинг безопасности." },
    uz: { n: "03 · Guvohnoma", t: "Ro‘yxatdan o‘tganlik guvohnomasini olamiz", d: "Dori vositalari va tibbiy buyumlarni ro‘yxatdan o‘tkazishning butun sikli, keyin esa farmakonazorat va xavfsizlik monitoringi." } },
];

/* Отзывы: на их сайте отзывов нет, поэтому это примеры, без имён. */
export const REVIEWS = [
  { ru: { q: "Пришла из аптеки без опыта в регистрации. После базового курса понимаю, из чего состоит досье и что спросит экспертиза.", who: "Выпускница базового курса" },
    uz: { q: "Dorixonadan ro‘yxatdan o‘tkazish tajribasisiz keldim. Boshlang‘ich kursdan keyin dosye nimadan iborat va ekspertiza nimani so‘rashini tushunaman.", who: "Boshlang‘ich kurs bitiruvchisi" } },
  { ru: { q: "Отдел прошёл обучение вместе: теперь говорим с регулятором на одном языке, а досье собираем по одной схеме.", who: "Руководитель регуляторного отдела" },
    uz: { q: "Bo‘lim birga o‘qidi: endi regulyator bilan bir tilda gaplashamiz, dosyeni esa bitta tartibda yig‘amiz.", who: "Regulyator bo‘lim rahbari" } },
  { ru: { q: "Вебинары по одной теме за два часа. Внесение изменений в досье разобрали на живых примерах.", who: "Специалист фармкомпании" },
    uz: { q: "Bitta mavzu bo‘yicha ikki soatlik vebinarlar. Dosyega o‘zgartirish kiritishni jonli misollarda ko‘rib chiqdik.", who: "Farmkompaniya mutaxassisi" } },
  { ru: { q: "Выбирала между онлайн и офлайн, взяла онлайн: занималась после работы и не пропустила ни одного модуля.", who: "Слушательница онлайн-формата" },
    uz: { q: "Onlayn va oflayn orasida tanladim, onlaynni oldim: ishdan keyin o‘qidim va bitta modulni ham o‘tkazib yubormadim.", who: "Onlayn format tinglovchisi" } },
];

export const FAQ = [
  { ru: ["Нужен ли опыт в фармацевтике?", "Для базового курса нет: он подходит новичкам и выпускникам медицинских и фармацевтических институтов. Продвинутый курс даёт весь цикл регистрации: досье, данные ДКИ и КЛИ, регистрацию ЛС и МИ. Какой подойдёт вам, подскажет администратор."],
    uz: ["Farmatsevtikada tajriba kerakmi?", "Boshlang‘ich kurs uchun yo‘q: u yangi boshlovchilar va tibbiyot hamda farmatsevtika institutlari bitiruvchilariga mos. Professional kurs ro‘yxatdan o‘tkazishning butun siklini beradi. Sizga qaysi biri mosligini administrator aytib beradi."] },
  { ru: ["Сколько длится обучение?", "Базовый курс: 24 академических часа, 2 месяца. Продвинутый: 48 академических часов, 3 месяца. Вебинар идёт два часа, с 15:00 до 17:00."],
    uz: ["O‘qish qancha davom etadi?", "Boshlang‘ich kurs: 24 akademik soat, 2 oy. Professional: 48 akademik soat, 3 oy. Vebinar ikki soat davom etadi, 15:00 dan 17:00 gacha."] },
  { ru: ["Можно учиться онлайн?", "Да. Есть офлайн-обучение, онлайн-обучение, профессиональные чаты и вебинары: учитесь на работе, дома и даже в путешествии."],
    uz: ["Onlayn o‘qish mumkinmi?", "Ha. Oflayn o‘qish, onlayn o‘qish, professional chatlar va vebinarlar bor: ishda, uyda va hatto sayohatda o‘qing."] },
  { ru: ["Сколько стоит обучение?", "Стоимость зависит от курса и формата. Администратор назовёт её при записи и подскажет ближайший поток."],
    uz: ["O‘qish qancha turadi?", "Narx kurs va formatga bog‘liq. Administrator yozilishda narxni aytadi va eng yaqin oqimni tavsiya qiladi."] },
  { ru: ["Обучаете сотрудников компании?", "Да, корпоративное обучение для фармацевтических компаний. В заявке выберите «Корпоративное обучение», администратор согласует программу и даты."],
    uz: ["Kompaniya xodimlarini o‘qitasizmi?", "Ha, farmatsevtika kompaniyalari uchun korporativ o‘qitish. Arizada «Korporativ o‘qitish»ni tanlang, administrator dastur va sanalarni kelishadi."] },
  { ru: ["Где проходят занятия?", "Ташкент, Мирабадский район, ул. Катта Мирабад, 3/5. Онлайн-формат: из любого города."],
    uz: ["Darslar qayerda o‘tadi?", "Toshkent, Mirobod tumani, Katta Mirobod ko‘chasi, 3/5. Onlayn format: istalgan shahardan."] },
];
