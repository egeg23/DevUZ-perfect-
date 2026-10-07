// Конструктор цены — как у bloger.agency и MAVERA: плашка на каждой странице,
// тумблер включает блок, итог «сайт + допы» считается сразу.
//
// Решение владельца, 07.10.2026: сайт — 1 500 $, админка для записи и работы
// с клиентами — 450 $, остальные допы — по нижней границе рынка Ташкента.
// Счёт от ставок нашего калькулятора (content/calculator.ts) по 12 650 сум
// за доллар, взятых примерно на 60–75 % и округлённых до 50 $:
//   личный кабинет 7,5 млн (≈590 $) → 450 $;
//   онлайн-оплата 7 млн (≈555 $) → 350 $;
//   интеграция 7,5 млн за систему (≈590 $) → 400 $;
//   уведомления 4,5 млн (≈355 $) → бот 300 $, SMS 150 $;
//   SEO 4,5 млн (≈355 $) → 250 $;
//   язык — 12 % базы (180 $) → 150 $;
//   страница 0,9 млн (≈70 $) → страницы филиалов 7 × ≈30 $ = 200 $.
// Для сравнения: базовая админка в калькуляторе — 5,5 млн (≈435 $), и цена
// владельца 450 $ с ней сходится.

export const BASE = {
  price: 1500,
  ru: { t: "Сайт клиники: главная с 3D-пролётом по врачам, врачи, направления, прейскурант, запись, филиалы", d: "Русский и узбекский, телефон и компьютер, запись в три шага, скидка за 5 секунд, анимации и параллакс." },
  uz: { t: "Klinika sayti: shifokorlar bo‘ylab 3D-parvozli bosh sahifa, shifokorlar, yo‘nalishlar, narxlar, yozilish, filiallar", d: "Rus va o‘zbek tillari, telefon va kompyuter, uch qadamda yozilish, 5 soniyada chegirma, animatsiyalar va parallaks." },
  en: { t: "Clinic website: home page with a 3D fly-through of doctors, doctors, departments, price list, booking, branches", d: "Russian and Uzbek, phone and desktop, three-step booking, 5-second discount, animations and parallax." },
};

/**
 * Допы. `vis` — блок, который виден на странице (data-addon); выключили — его
 * нет. `needs` — без чего не работает: включается вместе с ним.
 */
export const EXTRAS = [
  {
    id: "admin", price: 450, needs: [], pv: "admin", group: "core",
    ru: { t: "Админ-панель для записи и работы с пациентами", e: "Журнал записей, расписание врачей, карточки пациентов, статусы, напоминания, выгрузка", why: "Сейчас запись — только звонок на 1183, а «Записаться» у карточек врачей на сайте никуда не ведёт. В админке каждая заявка с сайта ложится в журнал: администратор видит свободные окна врача, подтверждает время, а пациент получает напоминание.", li: ["Журнал записей по дням и филиалам", "Расписание каждого врача: смены, отпуска, перерывы", "Карточка пациента: визиты, врачи, заметки", "Статусы: новая → подтверждена → пришёл → не пришёл", "Напоминания пациенту за день и за 2 часа", "Выгрузка в Excel для бухгалтерии и главврача", "Цены, врачи и направления правятся без программиста"] },
    uz: { t: "Yozilish va bemorlar bilan ishlash uchun admin panel", e: "Yozilishlar jurnali, shifokorlar jadvali, bemor kartalari, holatlar, eslatmalar, eksport", why: "Hozir yozilish — faqat 1183 ga qo‘ng‘iroq, saytdagi shifokor kartalaridagi «Yozilish» esa hech qayerga olib bormaydi. Admin panelda saytdagi har bir ariza jurnalga tushadi: administrator shifokorning bo‘sh vaqtini ko‘radi, vaqtni tasdiqlaydi, bemor esa eslatma oladi.", li: ["Kunlar va filiallar bo‘yicha yozilishlar jurnali", "Har bir shifokor jadvali: smenalar, ta’tillar, tanaffuslar", "Bemor kartasi: tashriflar, shifokorlar, izohlar", "Holatlar: yangi → tasdiqlangan → keldi → kelmadi", "Bemorga bir kun va 2 soat oldin eslatma", "Buxgalteriya va bosh shifokor uchun Excelga eksport", "Narxlar, shifokorlar va yo‘nalishlar dasturchisiz tahrirlanadi"] },
    en: { t: "Admin panel for bookings and patient management", e: "Booking log, doctor schedules, patient records, statuses, reminders, export", why: "Today booking is only a call to 1183, and the «Book» button on doctor cards leads nowhere. In the admin panel every website request lands in the log: the receptionist sees the doctor's free slots, confirms the time, and the patient gets a reminder.", li: ["Booking log by day and branch", "Each doctor's schedule: shifts, leave, breaks", "Patient record: visits, doctors, notes", "Statuses: new → confirmed → arrived → no-show", "Reminders a day and 2 hours before", "Excel export for accounting and the chief physician", "Prices, doctors and departments edited without a developer"] },
  },
  {
    id: "bot", price: 300, needs: ["admin"], pv: "bot", group: "core",
    ru: { t: "Telegram-бот записи", e: "Запись к врачу и напоминания прямо в Telegram", why: "Бот @shoxgroupbot у вас уже отдаёт результаты. Научим его записывать: направление → врач → время, а запись сразу попадает в журнал админки.", li: ["Запись в три нажатия", "Напоминание и «перенести» в один тап", "Результаты анализов — как сейчас"] },
    uz: { t: "Yozilish uchun Telegram-bot", e: "Shifokorga yozilish va eslatmalar to‘g‘ridan-to‘g‘ri Telegramda", why: "@shoxgroupbot botingiz allaqachon natijalarni beradi. Uni yozishga o‘rgatamiz: yo‘nalish → shifokor → vaqt, yozilish esa darhol admin panel jurnaliga tushadi.", li: ["Uch bosishda yozilish", "Eslatma va bir bosishda «ko‘chirish»", "Tahlil natijalari — hozirgidek"] },
    en: { t: "Telegram booking bot", e: "Book a doctor and get reminders right in Telegram", why: "Your bot @shoxgroupbot already delivers results. We teach it to book: department → doctor → time, and the booking lands straight in the admin log.", li: ["Booking in three taps", "Reminder and one-tap «reschedule»", "Test results — as today"] },
  },
  {
    id: "sms", price: 150, needs: ["admin"], pv: "sms", group: "core",
    ru: { t: "SMS-напоминания через Eskiz или Playmobile", e: "Тем, у кого нет Telegram, — SMS за день до приёма", why: "Пациент, который забыл о приёме, — пустое окно у врача. SMS уходит сама из журнала записей. Сами сообщения оплачиваются по тарифу оператора.", li: ["Подтверждение записи", "Напоминание за день", "Ссылка «отменить или перенести»"] },
    uz: { t: "Eskiz yoki Playmobile orqali SMS-eslatmalar", e: "Telegrami yo‘qlarga — qabuldan bir kun oldin SMS", why: "Qabulni unutgan bemor — shifokorda bo‘sh vaqt. SMS yozilishlar jurnalidan o‘zi ketadi. Xabarlar operator tarifi bo‘yicha to‘lanadi.", li: ["Yozilishni tasdiqlash", "Bir kun oldin eslatma", "«Bekor qilish yoki ko‘chirish» havolasi"] },
    en: { t: "SMS reminders via Eskiz or Playmobile", e: "For patients without Telegram — an SMS the day before", why: "A patient who forgot the visit is an empty slot. The SMS goes out from the booking log by itself. Messages are paid at the operator's rate.", li: ["Booking confirmation", "Reminder the day before", "«Cancel or reschedule» link"] },
  },
  {
    id: "cabinet", price: 450, needs: ["admin"], pv: "cabinet", group: "patients",
    ru: { t: "Личный кабинет пациента с результатами анализов", e: "Вход по номеру телефона, результаты, история визитов", why: "Сейчас за результатом идут в бот. В кабинете на сайте — все анализы и заключения по датам, их можно скачать и показать другому врачу.", li: ["Вход по коду из Telegram или SMS", "Результаты анализов и заключения в PDF", "История визитов и назначений", "Повторная запись к тому же врачу"] },
    uz: { t: "Tahlil natijalari bilan bemor shaxsiy kabineti", e: "Telefon raqami orqali kirish, natijalar, tashriflar tarixi", why: "Hozir natija uchun botga murojaat qilinadi. Saytdagi kabinetda barcha tahlillar va xulosalar sanalar bo‘yicha, ularni yuklab olib boshqa shifokorga ko‘rsatish mumkin.", li: ["Telegram yoki SMS kodi orqali kirish", "Tahlil natijalari va xulosalar PDFda", "Tashriflar va tayinlovlar tarixi", "O‘sha shifokorga qayta yozilish"] },
    en: { t: "Patient account with test results", e: "Phone-number login, results, visit history", why: "Today patients go to the bot for results. In the account on the website every test and report is filed by date and can be downloaded and shown to another doctor.", li: ["Login with a code from Telegram or SMS", "Test results and reports as PDF", "History of visits and prescriptions", "Rebook the same doctor"] },
  },
  {
    id: "pay", price: 350, needs: ["admin"], pv: "pay", group: "patients",
    ru: { t: "Оплата Payme, Click, Uzum", e: "Предоплата приёма или чек-апа на сайте", why: "Оплаченная запись — та, на которую приходят. Плюс иностранным пациентам проще заплатить заранее, чем везти наличные.", li: ["Оплата при записи или по ссылке", "Чек и статус оплаты в админке", "Возврат при отмене"] },
    uz: { t: "Payme, Click, Uzum orqali to‘lov", e: "Saytda qabul yoki chek-ap uchun oldindan to‘lov", why: "To‘langan yozilish — kelinadigan yozilish. Chet ellik bemorlarga ham naqd pul olib kelgandan ko‘ra oldindan to‘lash osonroq.", li: ["Yozilishda yoki havola orqali to‘lov", "Admin panelda chek va to‘lov holati", "Bekor qilinganda qaytarish"] },
    en: { t: "Payments via Payme, Click, Uzum", e: "Prepay a visit or check-up on the website", why: "A prepaid booking is a booking people show up for. Foreign patients also find it easier to pay in advance than to bring cash.", li: ["Pay when booking or via a link", "Receipt and payment status in the admin", "Refund on cancellation"] },
  },
  {
    id: "video", price: 300, needs: ["admin"], pv: "video", group: "patients",
    ru: { t: "Онлайн-консультация", e: "Видеоприём с врачом по записи", why: "Пациенту из Андижана или из-за рубежа не нужно ехать, чтобы показать снимки и понять, нужна ли операция.", li: ["Запись на видеоприём в том же календаре", "Ссылка на звонок приходит в Telegram", "Файлы и снимки до приёма"] },
    uz: { t: "Onlayn konsultatsiya", e: "Shifokor bilan yozilish bo‘yicha videoqabul", why: "Andijondan yoki chet eldan kelgan bemorga suratlarni ko‘rsatish va operatsiya kerakmi-yo‘qligini bilish uchun kelish shart emas.", li: ["O‘sha kalendarda videoqabulga yozilish", "Qo‘ng‘iroq havolasi Telegramga keladi", "Qabuldan oldin fayllar va suratlar"] },
    en: { t: "Online consultation", e: "Video appointment with a doctor", why: "A patient from Andijan or abroad doesn't need to travel just to show scans and find out whether surgery is needed.", li: ["Book a video visit in the same calendar", "Call link arrives in Telegram", "Files and scans before the visit"] },
  },
  {
    id: "mis", price: 400, needs: ["admin"], pv: "mis", group: "patients",
    ru: { t: "Связка с вашей медицинской системой или 1С", e: "Расписание и пациенты — из одной базы", why: "Если врачи уже ведут приём в своей системе, сайт берёт свободные окна оттуда, а записи с сайта уходят туда же — без двойного ввода. Цена — за одну систему.", li: ["Свободное время врачей — из вашей системы", "Запись с сайта — обратно в неё", "Пациенты и оплаты — в 1С"] },
    uz: { t: "Tibbiy tizimingiz yoki 1C bilan bog‘lash", e: "Jadval va bemorlar — bitta bazadan", why: "Agar shifokorlar qabulni o‘z tizimida olib borsa, sayt bo‘sh vaqtni o‘sha yerdan oladi, saytdagi yozilishlar esa o‘sha yerga ketadi — ikki marta kiritmasdan. Narx — bitta tizim uchun.", li: ["Shifokorlarning bo‘sh vaqti — tizimingizdan", "Saytdan yozilish — unga qaytib", "Bemorlar va to‘lovlar — 1Cda"] },
    en: { t: "Integration with your medical system or 1C", e: "Schedules and patients from one database", why: "If doctors already work in their own system, the site takes free slots from it and sends website bookings back — no double entry. Price per system.", li: ["Doctors' free time from your system", "Website bookings back into it", "Patients and payments in 1C"] },
  },
  {
    id: "checkup", price: 150, needs: [], vis: true, group: "site",
    ru: { t: "Чек-ап программы с записью", e: "Блок «Комплексное обследование» с программами" },
    uz: { t: "Yozilish bilan chek-ap dasturlari", e: "Dasturlar bilan «Kompleks tekshiruv» bloki" },
    en: { t: "Check-up programmes with booking", e: "«Comprehensive check-up» block with programmes" },
  },
  {
    id: "reviews", price: 150, needs: ["admin"], vis: true, group: "site",
    ru: { t: "Отзывы пациентов с модерацией", e: "Пациент пишет отзыв о враче, администратор публикует" },
    uz: { t: "Moderatsiyali bemorlar sharhlari", e: "Bemor shifokor haqida sharh yozadi, administrator e’lon qiladi" },
    en: { t: "Patient reviews with moderation", e: "A patient reviews a doctor, the admin publishes it" },
  },
  {
    id: "foreign", price: 200, needs: [], vis: true, group: "site",
    ru: { t: "Страница для иностранных и иногородних пациентов", e: "Как приехать на лечение: заявка, план, стационар, сопровождение" },
    uz: { t: "Chet ellik va boshqa shahardan kelgan bemorlar uchun sahifa", e: "Davolanishga qanday kelish: ariza, reja, statsionar, kuzatuv" },
    en: { t: "Page for international and out-of-town patients", e: "How to come for treatment: request, plan, inpatient stay, support" },
  },
  {
    id: "en", price: 150, needs: [], vis: true, group: "site",
    ru: { t: "Английская версия", e: "Третий язык — как «Eng» на вашем старом сайте" },
    uz: { t: "Inglizcha versiya", e: "Uchinchi til — eski saytingizdagi «Eng» kabi" },
    en: { t: "English version", e: "A third language — like «Eng» on your old site" },
  },
  {
    id: "branches", price: 200, needs: [], pv: "branches", group: "grow",
    ru: { t: "Страница каждого филиала", e: "7 филиалов: адрес, врачи, телефон, как проехать", why: "Люди ищут «клиника Юнусабад» или «МРТ Чиланзар». Своя страница у каждого филиала — со своими врачами и телефоном — выходит в поиске по району.", li: ["7 страниц филиалов", "Врачи и направления филиала", "Карта и маршрут"] },
    uz: { t: "Har bir filial sahifasi", e: "7 ta filial: manzil, shifokorlar, telefon, yo‘l", why: "Odamlar «Yunusobod klinika» yoki «Chilonzor MRT» deb qidiradi. Har bir filialning o‘z shifokorlari va telefoni bilan alohida sahifasi tuman bo‘yicha qidiruvda chiqadi.", li: ["7 ta filial sahifasi", "Filial shifokorlari va yo‘nalishlari", "Xarita va yo‘nalish"] },
    en: { t: "A page for every branch", e: "7 branches: address, doctors, phone, directions", why: "People search for «clinic Yunusabad» or «MRI Chilanzar». A page per branch, with its own doctors and phone, shows up in search for that district.", li: ["7 branch pages", "The branch's doctors and departments", "Map and route"] },
  },
  {
    id: "seo", price: 250, needs: [], pv: "seo", group: "grow",
    ru: { t: "SEO-пакет и 4 статьи", e: "Чтобы клинику находили по «МРТ Ташкент», «роботохирургия»", why: "Сейчас в описании сайта для поисковиков написано «zamonaviy klinika Farg‘onada» — клиника из Ташкента показывается как ферганская. Исправим заголовки и описания всех страниц, добавим разметку врачей и услуг и 4 статьи под живые запросы.", li: ["Заголовки и описания на трёх языках", "Разметка врачей, услуг и филиалов", "4 статьи под запросы из Google и Яндекса"] },
    uz: { t: "SEO-paket va 4 ta maqola", e: "Klinikani «MRT Toshkent», «robot jarrohlik» bo‘yicha topishlari uchun", why: "Hozir sayt tavsifida qidiruv tizimlari uchun «Farg‘onadagi zamonaviy klinika» deb yozilgan — Toshkentdagi klinika Farg‘onaniki bo‘lib ko‘rinadi. Barcha sahifalar sarlavha va tavsiflarini tuzatamiz, shifokorlar va xizmatlar belgisini va jonli so‘rovlar bo‘yicha 4 ta maqola qo‘shamiz.", li: ["Uch tilda sarlavhalar va tavsiflar", "Shifokorlar, xizmatlar va filiallar belgisi", "Google va Yandeks so‘rovlari bo‘yicha 4 ta maqola"] },
    en: { t: "SEO package and 4 articles", e: "So people find the clinic for «MRI Tashkent», «robotic surgery»", why: "Today the site's search description says «a modern clinic in Fergana» — a Tashkent clinic shows up as a Fergana one. We fix titles and descriptions on every page, add markup for doctors and services and write 4 articles for real search queries.", li: ["Titles and descriptions in three languages", "Markup for doctors, services and branches", "4 articles for Google and Yandex queries"] },
  },
  {
    id: "analytics", price: 100, needs: [], pv: "analytics", group: "grow",
    ru: { t: "Аналитика и цели", e: "Сколько записей пришло с сайта, из Instagram, с рекламы", why: "Чтобы видеть, какая реклама приводит пациентов, а какая — только просмотры. Цели: запись, звонок, Telegram.", li: ["Яндекс Метрика и Google Analytics", "Цели: запись, звонок, Telegram", "Отчёт по направлениям и врачам"] },
    uz: { t: "Analitika va maqsadlar", e: "Saytdan, Instagramdan, reklamadan nechta yozilish keldi", why: "Qaysi reklama bemor olib kelishini, qaysi biri faqat ko‘rishlar berishini ko‘rish uchun. Maqsadlar: yozilish, qo‘ng‘iroq, Telegram.", li: ["Yandeks Metrika va Google Analytics", "Maqsadlar: yozilish, qo‘ng‘iroq, Telegram", "Yo‘nalishlar va shifokorlar bo‘yicha hisobot"] },
    en: { t: "Analytics and goals", e: "How many bookings came from the site, Instagram, ads", why: "To see which ads bring patients and which bring only views. Goals: booking, call, Telegram.", li: ["Yandex Metrica and Google Analytics", "Goals: booking, call, Telegram", "Report by department and doctor"] },
  },
];

export const GROUPS = {
  core: { ru: "Запись и работа с пациентами", uz: "Yozilish va bemorlar bilan ishlash", en: "Bookings and patient management" },
  patients: { ru: "Для пациентов", uz: "Bemorlar uchun", en: "For patients" },
  site: { ru: "Блоки на сайте", uz: "Saytdagi bloklar", en: "Website blocks" },
  grow: { ru: "Чтобы находили", uz: "Topishlari uchun", en: "To be found" },
};
