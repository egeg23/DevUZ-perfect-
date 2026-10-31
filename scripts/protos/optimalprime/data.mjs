// Факты Optimal Prime — только с их сайта optimal-prime.uz (ru и /uz/),
// снято 31.10.2026. Узбекские строки — их же с /uz/, где у них по-русски
// (часть допуслуг), перевели мы. Ничего сверх их слов: ни числа клиентов,
// ни «гарантий», ни отзывов (отзывов на сайте нет).

export const LANGS = ["ru", "uz"];

export const COMPANY = {
  name: "Optimal Prime",
  legal: { ru: "ООО «Optimal Prime»", uz: "«Optimal Prime» MChJ" },
  phones: ["+998 55 510 89 89", "+998 94 777 07 10", "+998 77 299 89 89"],
  tel: "+998555108989",
  tg: "optimal_prime_uz",
  mail: "optimalprime@umail.uz",
  site: "https://optimal-prime.uz",
  since: 2008,
  years: 18,
  addr: {
    ru: "Ташкент, Чиланзарский район, квартал «Ц», ул. Чопон-ота, 6Б",
    uz: "Toshkent, Chilonzor tumani, «Ts» kvartali, Chopon-ota ko‘chasi, 6B",
  },
  hours: { ru: "Пн-Пт: 9:00-18:00", uz: "Du-Ju: 9:00-18:00" },
  slogan: { ru: "Баланс в финансах, рост в бизнесе", uz: "Moliyada muvozanat, biznesda o‘sish" },
};

/* Четыре направления и их пункты — дословно с сайта. */
export const SERVICES = [
  { id: "acc", icon: "ledger",
    ru: ["Бухгалтерский учёт", ["Ведение всех участков бухгалтерского учёта", "Учёт ТМЦ и основных средств", "Обработка первичной документации", "Бухгалтерская и статистическая отчётность"]],
    uz: ["Buxgalteriya hisobi", ["Barcha buxgalteriya bo‘limlarini yuritish", "TMZ va asosiy vositalar hisobi", "Boshlang‘ich hujjatlarni qayta ishlash", "Buxgalteriya va statistik hisobot"]] },
  { id: "tax", icon: "tax",
    ru: ["Налоговый учёт", ["Ведение налогового и управленческого учёта", "Начисление и перечисление налогов", "Подготовка и сдача отчётности", "Работа с налоговыми органами"]],
    uz: ["Soliq hisobi", ["Soliq va boshqaruv hisobini yuritish", "Soliqlarni hisoblash va to‘lash", "Hisobotlarni tayyorlash va topshirish", "Soliq organlari bilan ishlash"]] },
  { id: "hr", icon: "people",
    ru: ["HR-аутсорсинг", ["Ведение кадрового делопроизводства", "Расчёт заработной платы и кадровых показателей", "Оформление сотрудников и приказов", "Подбор и замена персонала"]],
    uz: ["HR autsorsing", ["Kadrlar ish yuritishi", "Ish haqi va kadr ko‘rsatkichlarini hisoblash", "Xodimlarni rasmiylashtirish va buyruqlar", "Kadrlarni tanlash va almashtirish"]] },
  { id: "fx", icon: "globe",
    ru: ["ВЭД и финансы", ["Сопровождение экспортно-импортных контрактов", "Учёт валютных операций и курсовых разниц", "Регистрация контрактов в ЕЭИСВО", "Контроль кассовых и банковских операций"]],
    uz: ["TIF va moliya", ["Eksport-import shartnomalarni qo‘llab-quvvatlash", "Valyuta operatsiyalari hisobi", "EEAXAT tizimida shartnomalarni ro‘yxatdan o‘tkazish", "Kassa va bank operatsiyalarini nazorat qilish"]] },
];

/* «Почему мы» — их четыре пункта. */
export const WHY = [
  { ru: ["Снижение затрат", "Экономия на содержании штата, инфраструктуре и сопутствующих расходах"], uz: ["Xarajatlar kamayishi", "Shtat saqlash, infratuzilma va boshqa xarajatlarda tejamkorlik"] },
  { ru: ["Экспертность", "Опыт в бухгалтерском и HR-аутсорсинге с 2008 года, профессиональная команда"], uz: ["Tajriba", "2008 yildan beri buxgalteriya va HR autsorsing sohasida, professional jamoa"] },
  { ru: ["Гибкость", "Возможность быстро масштабировать объём услуг под задачи вашего бизнеса"], uz: ["Moslashuvchanlik", "Xizmatlar hajmini biznes vazifalariga moslashtirish imkoniyati"] },
  { ru: ["Непрерывность", "Стабильная работа без рисков, связанных с отсутствием персонала"], uz: ["Uzluksizlik", "Xodim yo‘qligi bilan bog‘liq xavflarsiz barqaror ish"] },
];

/* «Ваша выгода» — их шесть пунктов, коротко их же словами. */
export const GAINS = [
  { ru: ["Финансовая выгода", "Без отпускных, больничных и налогов на штат, без аренды места, оборудования и лицензий"], uz: ["Moliyaviy foyda", "Shtat uchun ta’til, kasallik va soliqlarsiz, joy, jihoz va litsenziya ijarasisiz"] },
  { ru: ["Фокус на главном", "Внутренние ресурсы уходят на развитие бизнеса и стратегические задачи"], uz: ["Asosiysiga e’tibor", "Ichki resurslar biznes rivoji va strategik vazifalarga ketadi"] },
  { ru: ["Опыт узких специалистов", "Доступ к навыкам, которых нет в штате"], uz: ["Tor mutaxassislar tajribasi", "Shtatda yo‘q ko‘nikmalardan foydalanish"] },
  { ru: ["Объём под задачу", "Команду можно быстро увеличить или уменьшить"], uz: ["Vazifaga mos hajm", "Jamoani tez kattalashtirish yoki kichraytirish mumkin"] },
  { ru: ["Кадры на нас", "Подбор, обучение и замену сотрудников ведёт исполнитель"], uz: ["Kadrlar bizda", "Xodimlarni tanlash, o‘qitish va almashtirishni ijrochi olib boradi"] },
  { ru: ["Без простоев", "Увольнение или болезнь бухгалтера не останавливает учёт: замену даём мы"], uz: ["To‘xtalishsiz", "Buxgalterning ketishi yoki kasalligi hisobni to‘xtatmaydi: almashtirishni biz beramiz"] },
];

/* Их довод о тайне зарплат — главный «крючок» макета. */
export const SECRET = {
  ru: ["Зарплаты коллег никто внутри не увидит", "Даже если зарплаты знают двое, новость о прибавке быстро расходится по компании, и поднимать приходится всем. Передайте расчёт зарплаты и кадры нам: внутри компании их не увидит никто. Риск утечки сводится к нулю."],
  uz: ["Hamkasblar maoshini ichkarida hech kim ko‘rmaydi", "Maoshni ikki kishi bilsa ham, oshirish haqidagi xabar tez tarqaladi va hammaga oshirishga to‘g‘ri keladi. Ish haqi hisobi va kadrlarni bizga topshiring: kompaniya ichida ularni hech kim ko‘rmaydi. Sizib chiqish xavfi nolga tushadi."],
};

export const INDUSTRIES = {
  ru: ["Строительство и недвижимость", "Производство", "IT и технологии", "Торговля (ритейл)", "Транспорт и логистика", "Медицина и фармацевтика", "Образование", "Туризм и гостиничный бизнес", "Экспорт и импорт · ЕЭИСВО", "Услуги"],
  uz: ["Qurilish va ko‘chmas mulk", "Ishlab chiqarish", "IT va texnologiyalar", "Savdo (riteyl)", "Transport va logistika", "Tibbiyot va farmatsevtika", "Ta’lim", "Turizm va mehmonxona biznesi", "Eksport va import · EEAXAT", "Xizmatlar"],
};

/* Схема работы — их шесть шагов. */
export const STEPS = [
  { ru: ["Заявка или звонок", "Свяжитесь с нами любым удобным способом"], uz: ["Ariza yoki qo‘ng‘iroq", "Biz bilan istalgan qulay tarzda bog‘laning"] },
  { ru: ["Встреча и анализ", "Обсудим ваши задачи и проведём аудит"], uz: ["Uchrashuv va tahlil", "Vazifalaringizni muhokama qilamiz va audit o‘tkazamiz"] },
  { ru: ["Расчёт стоимости", "Подготовим индивидуальное предложение"], uz: ["Narx hisoblash", "Individual taklif tayyorlaymiz"] },
  { ru: ["Подписание договора", "Заключим договор с чёткими условиями"], uz: ["Shartnoma imzolash", "Aniq shartlar bilan shartnoma tuzamiz"] },
  { ru: ["Передача документов", "Организуем приём-передачу документации"], uz: ["Hujjatlarni topshirish", "Hujjatlarni qabul qilish-topshirishni tashkil qilamiz"] },
  { ru: ["Начало работы", "Приступаем к продуктивному сотрудничеству"], uz: ["Ish boshlash", "Samarali hamkorlikka kirishamiz"] },
];

/* «Нам доверяют» — их список, как на сайте. */
export const CLIENTS = ["НПО «Узэлектроаппарат»", "ООО ИП «LEKXIM»", "ООО ИП «METSO»", "ООО ИП «VISAMETRIC»", "ООО ИП «Azra Fashion»", "ООО «BIZ ALLIANCE»", "ООО «O'ZGAZINJINIRING»", "ООО «OU-YI CONSTRUCTION»", "ООО «ALL BUSINESS BROKERS»", "ООО «WELKIN CLIMAT»", "ЧП «ZARDUHST»"];
/* На узбекской странице — латиницей, формы собственности по-узбекски. */
export const CLIENTS_UZ = ["«Uzelektroapparat» IICHB", "«LEKXIM» XK MChJ", "«METSO» XK MChJ", "«VISAMETRIC» XK MChJ", "«Azra Fashion» XK MChJ", "«BIZ ALLIANCE» MChJ", "«O'ZGAZINJINIRING» MChJ", "«OU-YI CONSTRUCTION» MChJ", "«ALL BUSINESS BROKERS» MChJ", "«WELKIN CLIMAT» MChJ", "«ZARDUHST» XK"];

/* Темы для «Чем помочь» в форме — их «Тип услуги». */
export const KINDS = {
  ru: ["Бухгалтерский учёт", "Налоговая отчётность", "Кадровый учёт", "ВЭД и финансы"],
  uz: ["Buxgalteriya hisobi", "Soliq hisoboti", "Kadrlar hisobi", "TIF va moliya"],
};
