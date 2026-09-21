/**
 * Ниши и города, по которым идут разборы.
 *
 * Список не про то, «какие бывают сайты», а про то, где сходятся три вещи:
 * плохих сайтов много, деньги на переделку есть, и по запросу почти никто
 * не пишет. По «заказать сайт Ташкент» мы агентствам с десятилетним доменом
 * не конкуренты; по «сайт для автосервиса в Ташкенте» — конкуренты, потому
 * что таких страниц нет вовсе.
 *
 * Формы слов лежат здесь готовыми, а не собираются правилами. Русский
 * предложный и узбекский местный падеж исключений имеют больше, чем правил,
 * и ошибка в заголовке страницы стоит дороже, чем десять строк словаря.
 */

export type Country = "UZ" | "KZ" | "KG";

export type City = {
  key: string;
  country: Country;
  /** Именительный: «Ташкент». */
  ru: string;
  /** Предложный, для «в …»: «Ташкенте». */
  ruIn: string;
  uz: string;
  /** Местный, для «где»: «Toshkentda». */
  uzIn: string;
};

export type Niche = {
  key: string;
  /** Родительный, для «сайт для …»: «стоматологии». */
  ruGen: string;
  /** Как называем сам бизнес в подписи: «стоматологическая клиника». */
  ruLabel: string;
  /** Узбекский корень для запроса: «stomatologiya». */
  uz: string;
  uzLabel: string;
  /**
   * Нейтральное имя для макета «как сделали бы мы».
   *
   * Чужой логотип и название в макет не попадают: разбор анонимный, и
   * рисовать чужой товарный знак нашими руками — отдельный риск. Вместо
   * имени — род занятий: «Стоматология», «Автосервис».
   */
  ruMock: string;
  uzMock: string;
  /**
   * Что такой бизнес обычно продаёт. Для блока услуг в макете.
   *
   * Это факты категории, а не утверждения о разобранной компании: у любой
   * стоматологии есть лечение кариеса. Цифр здесь нет и быть не должно —
   * выдуманное «5000 довольных клиентов» в макете превращает разбор в
   * рекламу с придуманными данными.
   */
  ruServices: readonly string[];
  uzServices: readonly string[];
};

/**
 * Города. Узбекистан первым и шире остальных: это домашний рынок, и
 * разборов по нему должно быть больше, чем по соседним.
 */
export const CITIES: readonly City[] = [
  { key: "tashkent", country: "UZ", ru: "Ташкент", ruIn: "Ташкенте", uz: "Toshkent", uzIn: "Toshkentda" },
  { key: "samarkand", country: "UZ", ru: "Самарканд", ruIn: "Самарканде", uz: "Samarqand", uzIn: "Samarqandda" },
  { key: "bukhara", country: "UZ", ru: "Бухара", ruIn: "Бухаре", uz: "Buxoro", uzIn: "Buxoroda" },
  { key: "namangan", country: "UZ", ru: "Наманган", ruIn: "Намангане", uz: "Namangan", uzIn: "Namanganda" },
  { key: "andijan", country: "UZ", ru: "Андижан", ruIn: "Андижане", uz: "Andijon", uzIn: "Andijonda" },
  { key: "fergana", country: "UZ", ru: "Фергана", ruIn: "Фергане", uz: "Farg'ona", uzIn: "Farg'onada" },
  { key: "nukus", country: "UZ", ru: "Нукус", ruIn: "Нукусе", uz: "Nukus", uzIn: "Nukusda" },
  { key: "almaty", country: "KZ", ru: "Алматы", ruIn: "Алматы", uz: "Olmaota", uzIn: "Olmaotada" },
  { key: "astana", country: "KZ", ru: "Астана", ruIn: "Астане", uz: "Ostona", uzIn: "Ostonada" },
  { key: "shymkent", country: "KZ", ru: "Шымкент", ruIn: "Шымкенте", uz: "Chimkent", uzIn: "Chimkentda" },
  { key: "bishkek", country: "KG", ru: "Бишкек", ruIn: "Бишкеке", uz: "Bishkek", uzIn: "Bishkekda" },
  { key: "osh", country: "KG", ru: "Ош", ruIn: "Оше", uz: "O'sh", uzIn: "O'shda" },
];

/**
 * Ниши.
 *
 * Отбирались по тому же принципу, что и города: малый и средний бизнес,
 * который живёт с потока клиентов и у которого сайт — не витрина, а вход.
 * Салон красоты и автосервис здесь не для полноты списка, а потому что у
 * них сайт чаще всего либо старый, либо один экран без формы записи.
 */
export const NICHES: readonly Niche[] = [
  { key: "stomatologiya", ruGen: "стоматологии", ruLabel: "стоматологическая клиника", uz: "stomatologiya", uzLabel: "stomatologiya klinikasi", ruMock: "Стоматология", uzMock: "Stomatologiya", ruServices: ["Лечение кариеса", "Имплантация", "Протезирование", "Гигиена и отбеливание"], uzServices: ["Karies davolash", "Implantatsiya", "Protezlash", "Gigiyena va oqartirish"] },
  { key: "medcentr", ruGen: "медицинского центра", ruLabel: "медицинский центр", uz: "tibbiyot markazi", uzLabel: "tibbiyot markazi", ruMock: "Медцентр", uzMock: "Tibbiyot markazi", ruServices: ["Приём специалистов", "Анализы", "УЗИ и диагностика", "Вызов врача на дом"], uzServices: ["Mutaxassislar qabuli", "Tahlillar", "UZI va diagnostika", "Shifokorni uyga chaqirish"] },
  { key: "internet-magazin", ruGen: "интернет-магазина", ruLabel: "интернет-магазин", uz: "internet do'kon", uzLabel: "internet do'kon", ruMock: "Магазин", uzMock: "Do‘kon", ruServices: ["Каталог с фильтрами", "Доставка по городу", "Оплата картой", "Возврат за 14 дней"], uzServices: ["Filtrli katalog", "Shahar bo‘ylab yetkazish", "Karta bilan to‘lov", "14 kunda qaytarish"] },
  { key: "restoran", ruGen: "ресторана", ruLabel: "ресторан", uz: "restoran", uzLabel: "restoran", ruMock: "Ресторан", uzMock: "Restoran", ruServices: ["Меню с ценами", "Бронь столика", "Банкеты", "Доставка"], uzServices: ["Narxli menyu", "Stol band qilish", "Banketlar", "Yetkazib berish"] },
  { key: "dostavka-edy", ruGen: "доставки еды", ruLabel: "служба доставки еды", uz: "ovqat yetkazib berish", uzLabel: "ovqat yetkazib berish xizmati", ruMock: "Доставка", uzMock: "Yetkazish", ruServices: ["Меню на день", "Заказ за минуту", "Доставка 30 минут", "Оплата при получении"], uzServices: ["Kunlik menyu", "Bir daqiqada buyurtma", "30 daqiqada yetkazish", "Olganda to‘lash"] },
  { key: "avtoservis", ruGen: "автосервиса", ruLabel: "автосервис", uz: "avtoservis", uzLabel: "avtoservis", ruMock: "Автосервис", uzMock: "Avtoservis", ruServices: ["Диагностика", "Ремонт двигателя", "Шиномонтаж", "Кузовные работы"], uzServices: ["Diagnostika", "Dvigatel ta’miri", "Shinamontaj", "Kuzov ishlari"] },
  { key: "stroitelnaya-kompaniya", ruGen: "строительной компании", ruLabel: "строительная компания", uz: "qurilish kompaniyasi", uzLabel: "qurilish kompaniyasi", ruMock: "Строительство", uzMock: "Qurilish", ruServices: ["Проектирование", "Строительство под ключ", "Ремонт", "Смета за день"], uzServices: ["Loyihalash", "Kalit topshirish qurilishi", "Ta’mirlash", "Bir kunda smeta"] },
  { key: "mebel", ruGen: "мебельного салона", ruLabel: "мебельный салон", uz: "mebel saloni", uzLabel: "mebel saloni", ruMock: "Мебель", uzMock: "Mebel", ruServices: ["Кухни на заказ", "Шкафы-купе", "Мягкая мебель", "Замер бесплатно"], uzServices: ["Buyurtma oshxonalar", "Kupe shkaflar", "Yumshoq mebel", "Bepul o‘lchov"] },
  { key: "uchebnyy-centr", ruGen: "учебного центра", ruLabel: "учебный центр", uz: "o'quv markazi", uzLabel: "o'quv markazi", ruMock: "Учебный центр", uzMock: "O‘quv markazi", ruServices: ["Английский", "Программирование", "Подготовка к экзаменам", "Пробный урок"], uzServices: ["Ingliz tili", "Dasturlash", "Imtihonga tayyorgarlik", "Sinov darsi"] },
  { key: "turagentstvo", ruGen: "турагентства", ruLabel: "турагентство", uz: "turizm agentligi", uzLabel: "turizm agentligi", ruMock: "Турагентство", uzMock: "Turagentlik", ruServices: ["Туры и цены", "Визы", "Авиабилеты", "Подбор за день"], uzServices: ["Turlar va narxlar", "Vizalar", "Aviachiptalar", "Bir kunda tanlov"] },
  { key: "yurfirma", ruGen: "юридической фирмы", ruLabel: "юридическая фирма", uz: "yuridik firma", uzLabel: "yuridik firma", ruMock: "Юрфирма", uzMock: "Yuridik firma", ruServices: ["Регистрация бизнеса", "Договоры", "Суды", "Консультация"], uzServices: ["Biznes ro‘yxati", "Shartnomalar", "Sudlar", "Maslahat"] },
  { key: "salon-krasoty", ruGen: "салона красоты", ruLabel: "салон красоты", uz: "go'zallik saloni", uzLabel: "go'zallik saloni", ruMock: "Салон красоты", uzMock: "Go‘zallik saloni", ruServices: ["Стрижка и укладка", "Маникюр", "Косметология", "Запись онлайн"], uzServices: ["Soch olish va turmak", "Manikyur", "Kosmetologiya", "Onlayn yozilish"] },
  { key: "logistika", ruGen: "логистической компании", ruLabel: "логистическая компания", uz: "logistika kompaniyasi", uzLabel: "logistika kompaniyasi", ruMock: "Логистика", uzMock: "Logistika", ruServices: ["Перевозки по стране", "Международные", "Склад", "Расчёт за час"], uzServices: ["Mamlakat bo‘ylab tashish", "Xalqaro", "Ombor", "Bir soatda hisob"] },
  // Недвижимость: классификатор узнавал её с самого начала, а каталога под
  // ключ не было — и каждый сайт застройщика уходил в «ниша не
  // определилась», хотя это одна из главных ниш студии и её собственный
  // кейс.
  //
  // Запрос и подпись здесь расходятся, и это не описка. Ищут «сайт для
  // жилого комплекса» — так говорят о предмете. А письмо и подпись под
  // разбором обращены к тому, кто его строит: адресат — застройщик, а не
  // жилой комплекс. Узбекский корень запроса тоже про дом, а не про
  // компанию: «qurilish kompaniyasi» уже занято строительной компанией, и
  // две наши страницы под один узбекский запрос — это когда Google не
  // выбирает ни одну.
  { key: "nedvizhimost", ruGen: "жилого комплекса", ruLabel: "застройщик", uz: "turar-joy majmuasi", uzLabel: "quruvchi kompaniya", ruMock: "Жилой комплекс", uzMock: "Turar-joy majmuasi", ruServices: ["Квартиры и планировки", "Цены за квадрат", "Ипотека и рассрочка", "Запись на показ"], uzServices: ["Kvartiralar va planirovkalar", "Kvadrat narxi", "Ipoteka va bo‘lib to‘lash", "Ko‘rikka yozilish"] },
  { key: "fitnes", ruGen: "фитнес-клуба", ruLabel: "фитнес-клуб", uz: "fitnes klubi", uzLabel: "fitnes klubi", ruMock: "Фитнес", uzMock: "Fitnes", ruServices: ["Абонементы", "Групповые занятия", "Тренажёрный зал", "Первое занятие"], uzServices: ["Abonementlar", "Guruh mashg‘ulotlari", "Trenajyor zali", "Birinchi mashg‘ulot"] },
];

export function cityByKey(key: string): City | null {
  return CITIES.find((c) => c.key === key) ?? null;
}

export function nicheByKey(key: string): Niche | null {
  return NICHES.find((n) => n.key === key) ?? null;
}
