/**
 * Кабинет клиента ИИ-сотрудников — русский и узбекский (латиница).
 *
 * Кабинет отдельно от панели студии и её словарей (content/admin-panel):
 * его читают владельцы бизнеса, не сотрудники, и польский им не нужен.
 * Узбекский — деловой, как пишут в Ташкенте; названия продуктов (Telegram,
 * BotFather) не переводятся.
 */

export type CabLocale = "ru" | "uz";
type Tr = { ru: string; uz: string };

export const cab = {
  title: { ru: "Кабинет ИИ-сотрудника", uz: "Sun'iy intellekt xodimi kabineti" },
  navHome: { ru: "Обзор", uz: "Umumiy" },
  navKnowledge: { ru: "База знаний", uz: "Bilimlar bazasi" },
  navChannels: { ru: "Каналы", uz: "Kanallar" },
  navTest: { ru: "Проверить на себе", uz: "O'zingizda sinab ko'ring" },
  navTalks: { ru: "Разговоры", uz: "Suhbatlar" },
  navLeads: { ru: "Заявки", uz: "Arizalar" },
  navSettings: { ru: "Настройки", uz: "Sozlamalar" },
  navTeam: { ru: "Команда", uz: "Jamoa" },
  navPlan: { ru: "Тариф", uz: "Tarif" },
  logout: { ru: "Выйти", uz: "Chiqish" },
  support: { ru: "Вход поддержки DevUz", uz: "DevUz yordam xizmati kirishi" },
  switchTenant: { ru: "Кабинет", uz: "Kabinet" },

  loginTitle: { ru: "Вход в кабинет", uz: "Kabinetga kirish" },
  loginBody: {
    ru: "Кабинет открывается через Telegram, пароль не нужен. Откройте нашего бота, нажмите «Старт», и он пришлёт ссылку для входа. Ссылка действует 15 минут.",
    uz: "Kabinet Telegram orqali ochiladi, parol kerak emas. Botimizni oching, «Start» tugmasini bosing, u kirish havolasini yuboradi. Havola 15 daqiqa amal qiladi.",
  },
  loginButton: { ru: "Открыть бота в Telegram", uz: "Botni Telegramda ochish" },
  loginNoBot: { ru: "Бот сервиса ещё не подключён. Напишите нам, и мы откроем кабинет вручную.", uz: "Xizmat boti hali ulanmagan. Bizga yozing, kabinetni qo'lda ochib beramiz." },
  loginExpired: { ru: "Ссылка устарела или уже использована. Нажмите «Старт» в боте ещё раз.", uz: "Havola eskirgan yoki ishlatilgan. Botda «Start» ni yana bosing." },

  startTitle: { ru: "Создайте кабинет", uz: "Kabinet yarating" },
  startBody: {
    ru: "Четыре шага, около 10 минут: компания, база знаний, канал, проверка. 14 дней бесплатно, карта не нужна.",
    uz: "To'rt qadam, taxminan 10 daqiqa: kompaniya, bilimlar bazasi, kanal, sinov. 14 kun bepul, karta kerak emas.",
  },
  company: { ru: "Название компании", uz: "Kompaniya nomi" },
  niche: { ru: "Чем занимаетесь", uz: "Faoliyat turi" },
  nichePh: { ru: "Например: мебель на заказ", uz: "Masalan: buyurtma asosida mebel" },
  language: { ru: "Основной язык покупателей", uz: "Xaridorlarning asosiy tili" },
  site: { ru: "Сайт (если есть)", uz: "Sayt (bo'lsa)" },
  create: { ru: "Создать кабинет", uz: "Kabinet yaratish" },

  statusTrial: { ru: "Пробный период до", uz: "Sinov muddati gacha" },
  statusPaid: { ru: "Оплачено до", uz: "To'langan sana" },
  statusStopped: { ru: "ИИ сейчас не отвечает покупателям", uz: "Sun'iy intellekt hozir xaridorlarga javob bermayapti" },
  stop_limit: { ru: "закончились диалоги по тарифу на этот месяц", uz: "bu oy uchun tarif bo'yicha suhbatlar tugadi" },
  stop_trial_over: { ru: "закончился пробный период", uz: "sinov muddati tugadi" },
  stop_unpaid: { ru: "закончился оплаченный срок", uz: "to'langan muddat tugadi" },
  stop_paused: { ru: "работа на паузе", uz: "ish to'xtatilgan" },
  stop_blocked: { ru: "кабинет заблокирован", uz: "kabinet bloklangan" },
  dialogs: { ru: "Диалогов в этом месяце", uz: "Bu oydagi suhbatlar" },
  leadsMonth: { ru: "Заявок в этом месяце", uz: "Bu oydagi arizalar" },
  firstReply: { ru: "Скорость первого ответа", uz: "Birinchi javob tezligi" },
  offHours: { ru: "Заявок в нерабочее время", uz: "Ish vaqtidan tashqari arizalar" },
  unanswered: { ru: "Вопросов без ответа в базе", uz: "Bazada javobi yo'q savollar" },
  unansweredHint: {
    ru: "ИИ не нашёл ответа в базе знаний и предложил связаться с менеджером. Откройте разговоры с пометкой и допишите базу.",
    uz: "Sun'iy intellekt bilimlar bazasida javob topmadi va menejer bilan bog'lanishni taklif qildi. Belgilangan suhbatlarni oching va bazani to'ldiring.",
  },
  sec: { ru: "сек", uz: "son" },
  steps: { ru: "Подключение", uz: "Ulash" },
  stepCompany: { ru: "Компания создана", uz: "Kompaniya yaratildi" },
  stepKnowledge: { ru: "База знаний: цены, услуги, адрес, часы", uz: "Bilimlar bazasi: narxlar, xizmatlar, manzil, ish vaqti" },
  stepChannel: { ru: "Подключён канал: Telegram или сайт", uz: "Kanal ulandi: Telegram yoki sayt" },
  stepTest: { ru: "Проверили ответы на себе", uz: "Javoblarni o'zingizda sinab ko'rdingiz" },
  stepTeam: { ru: "Менеджеры получают заявки в Telegram", uz: "Menejerlar arizalarni Telegramda oladi" },
  go: { ru: "Перейти", uz: "O'tish" },
  done: { ru: "готово", uz: "tayyor" },

  kbIntro: {
    ru: "ИИ отвечает покупателям только по этой базе. Цены, сроки и адреса он называет ровно как здесь, а если ответа нет, предлагает связаться с менеджером. Чем полнее база, тем меньше вопросов уходит людям.",
    uz: "Sun'iy intellekt xaridorlarga faqat shu baza bo'yicha javob beradi. Narx, muddat va manzillarni aynan shu yerdagidek aytadi, javob bo'lmasa, menejer bilan bog'lanishni taklif qiladi. Baza qanchalik to'liq bo'lsa, odamlarga shunchalik kam savol tushadi.",
  },
  kbFromSite: { ru: "Загрузить с сайта", uz: "Saytdan yuklash" },
  kbFromSiteHint: {
    ru: "Откроем главную и до четырёх страниц с ценами, услугами, доставкой и контактами и разложим текст по пунктам. Пункты с прошлой загрузки заменятся, написанное руками останется. Числа, которых нет на сайте, не попадут в базу.",
    uz: "Bosh sahifa va narxlar, xizmatlar, yetkazib berish va kontaktlar bo'lgan to'rttagacha sahifani ochib, matnni bandlarga ajratamiz. Oldingi yuklash bandlari almashtiriladi, qo'lda yozilgani qoladi. Saytda yo'q raqamlar bazaga tushmaydi.",
  },
  kbLoad: { ru: "Загрузить", uz: "Yuklash" },
  kbAdd: { ru: "Добавить пункт", uz: "Band qo'shish" },
  kbKind: { ru: "Раздел", uz: "Bo'lim" },
  kbTitle: { ru: "Заголовок", uz: "Sarlavha" },
  kbBody: { ru: "Текст", uz: "Matn" },
  kbBodyPh: {
    ru: "Например: Кухня под заказ от 4 500 000 сум за погонный метр. Замер бесплатно.",
    uz: "Masalan: Buyurtma oshxona bir metri 4 500 000 so'mdan. O'lchov bepul.",
  },
  save: { ru: "Сохранить", uz: "Saqlash" },
  remove: { ru: "Удалить", uz: "O'chirish" },
  fromSite: { ru: "с сайта", uz: "saytdan" },
  kbEmpty: { ru: "База пока пуста. Загрузите сайт или добавьте прайс текстом.", uz: "Baza hozircha bo'sh. Saytni yuklang yoki narxlarni matn bilan qo'shing." },
  kind_about: { ru: "О компании", uz: "Kompaniya haqida" },
  kind_price: { ru: "Цены", uz: "Narxlar" },
  kind_service: { ru: "Товары и услуги", uz: "Mahsulot va xizmatlar" },
  kind_faq: { ru: "Частые вопросы", uz: "Ko'p beriladigan savollar" },
  kind_hours: { ru: "Часы работы", uz: "Ish vaqti" },
  kind_address: { ru: "Адрес", uz: "Manzil" },
  kind_delivery: { ru: "Доставка", uz: "Yetkazib berish" },
  kind_payment: { ru: "Оплата", uz: "To'lov" },
  kind_other: { ru: "Другое", uz: "Boshqa" },
  importOk: { ru: "Загружено пунктов", uz: "Yuklangan bandlar" },
  importDropped: { ru: "отброшено с выдуманными числами", uz: "o'ylab topilgan raqamlar bilan tashlab yuborildi" },
  importFail: { ru: "Сайт не открылся или на нём мало текста. Добавьте пункты руками.", uz: "Sayt ochilmadi yoki unda matn kam. Bandlarni qo'lda qo'shing." },

  chBusiness: { ru: "Ваш Telegram (Telegram Business)", uz: "Sizning Telegramingiz (Telegram Business)" },
  chBusinessHint: {
    ru: "ИИ отвечает покупателям прямо в вашем личном Telegram, от вашего имени. Нужен Telegram Premium. Напишете в чат сами, и ИИ замолчит в этом чате на 12 часов. Отвечать Telegram разрешает только тем, кто написал вам за последние 24 часа: первым ИИ не пишет никому.",
    uz: "Sun'iy intellekt xaridorlarga to'g'ridan-to'g'ri shaxsiy Telegramingizda, sizning nomingizdan javob beradi. Telegram Premium kerak. Chatga o'zingiz yozsangiz, sun'iy intellekt shu chatda 12 soat jim turadi. Telegram faqat oxirgi 24 soatda sizga yozganlarga javob berishga ruxsat beradi: sun'iy intellekt hech kimga birinchi bo'lib yozmaydi.",
  },
  chBusinessSteps: {
    ru: "1. Telegram → Настройки → Telegram для бизнеса → Чат-боты.\n2. Введите имя бота: @{bot}.\n3. Выберите «Все личные чаты кроме…» или нужные чаты и включите «Отвечать на сообщения».\n4. Бот напишет вам «Готово».",
    uz: "1. Telegram → Sozlamalar → Telegram Business → Chat-botlar.\n2. Bot nomini kiriting: @{bot}.\n3. «Barcha shaxsiy chatlar…» yoki kerakli chatlarni tanlang va «Xabarlarga javob berish» ni yoqing.\n4. Bot sizga «Tayyor» deb yozadi.",
  },
  chOwnBot: { ru: "Ваш Telegram-бот", uz: "Sizning Telegram-botingiz" },
  chOwnBotHint: {
    ru: "Если у компании уже есть бот или нет Telegram Premium. Создайте бота в @BotFather (/newbot), скопируйте токен и вставьте сюда. Токен хранится зашифрованным.",
    uz: "Agar kompaniyada bot bo'lsa yoki Telegram Premium bo'lmasa. @BotFather da bot yarating (/newbot), tokenni nusxalang va shu yerga qo'ying. Token shifrlangan holda saqlanadi.",
  },
  chToken: { ru: "Токен бота", uz: "Bot tokeni" },
  chConnect: { ru: "Подключить", uz: "Ulash" },
  chDisconnect: { ru: "Отключить", uz: "Uzish" },
  chInstagram: { ru: "Instagram Direct", uz: "Instagram Direct" },
  chInstagramHint: {
    ru: "ИИ отвечает покупателям в Direct вашего Instagram от имени аккаунта. Нужен профессиональный аккаунт (бизнес или автор). Нажмите кнопку, войдите в Instagram и разрешите доступ к сообщениям. Ответить Instagram разрешает в течение 24 часов после сообщения покупателя: первым ИИ не пишет никому. Напишете в чат сами, и ИИ замолчит в этом чате на 12 часов.",
    uz: "Sun'iy intellekt xaridorlarga Instagramingizning Direct'ida akkaunt nomidan javob beradi. Professional akkaunt (biznes yoki muallif) kerak. Tugmani bosing, Instagramga kiring va xabarlarga ruxsat bering. Instagram xaridor xabaridan keyin 24 soat ichida javob berishga ruxsat beradi: sun'iy intellekt hech kimga birinchi bo'lib yozmaydi. Chatga o'zingiz yozsangiz, sun'iy intellekt shu chatda 12 soat jim turadi.",
  },
  chInstagramConnect: { ru: "Подключить Instagram", uz: "Instagramni ulash" },
  chInstagramSoon: {
    ru: "Подключение Instagram скоро откроется: ждём одобрения Meta. Напишите нам, если Instagram для вас главный канал, подключим первыми.",
    uz: "Instagramni ulash tez orada ochiladi: Meta tasdig'ini kutyapmiz. Agar Instagram siz uchun asosiy kanal bo'lsa, bizga yozing, birinchi bo'lib ulaymiz.",
  },
  ch_ig_ok: { ru: "Instagram подключён. Напишите себе в Direct с другого аккаунта и проверьте ответ.", uz: "Instagram ulandi. Boshqa akkauntdan Direct'ingizga yozing va javobni tekshiring." },
  ch_ig_fail: { ru: "Instagram не подключился. Проверьте, что аккаунт профессиональный, и попробуйте ещё раз.", uz: "Instagram ulanmadi. Akkaunt professional ekanini tekshiring va qaytadan urinib ko'ring." },
  ch_ig_off: { ru: "Подключение Instagram пока недоступно.", uz: "Instagramni ulash hozircha mavjud emas." },
  chTokenExpired: { ru: "доступ истёк: подключите заново", uz: "ruxsat muddati tugadi: qayta ulang" },
  chWidget: { ru: "Чат на сайте", uz: "Saytdagi chat" },
  chWidgetHint: {
    ru: "Вставьте эту строку на сайт перед </body>. Справа внизу появится кнопка «Задать вопрос». Язык виджета берётся из языка страницы.",
    uz: "Ushbu qatorni saytga </body> dan oldin qo'ying. O'ng pastda «Savol berish» tugmasi paydo bo'ladi. Vidjet tili sahifa tilidan olinadi.",
  },
  chActive: { ru: "работает", uz: "ishlayapti" },
  chOff: { ru: "отключён", uz: "uzilgan" },
  chError: { ru: "ошибка", uz: "xato" },
  chNone: { ru: "не подключён", uz: "ulanmagan" },
  chNoReply: { ru: "нет права отвечать: включите «Отвечать на сообщения» в настройках чат-бота", uz: "javob berish huquqi yo'q: chat-bot sozlamalarida «Xabarlarga javob berish» ni yoqing" },
  ch_bad_token: { ru: "Telegram не принял токен. Скопируйте его из @BotFather целиком.", uz: "Telegram tokenni qabul qilmadi. Uni @BotFather dan to'liq nusxalang." },
  ch_limit: { ru: "На тарифе «Старт» работает один канал. Отключите другой или смените тариф.", uz: "«Start» tarifida bitta kanal ishlaydi. Boshqasini uzing yoki tarifni almashtiring." },
  ch_taken: { ru: "Этот бот уже подключён к другому кабинету.", uz: "Bu bot boshqa kabinetga ulangan." },
  ch_webhook: { ru: "Не получилось подключить бота. Попробуйте ещё раз через минуту.", uz: "Botni ulab bo'lmadi. Bir daqiqadan keyin qayta urinib ko'ring." },
  ch_no_key: { ru: "Подключение ботов временно недоступно. Мы уже знаем.", uz: "Botlarni ulash vaqtincha mavjud emas. Biz bilamiz." },
  copy: { ru: "Скопировать", uz: "Nusxalash" },

  testIntro: {
    ru: "Напишите так, как написал бы покупатель. ИИ ответит по вашей базе знаний тем же способом, что и настоящим покупателям. Проверка не тратит диалоги тарифа; заявки отсюда приходят с пометкой «Проверка».",
    uz: "Xaridor yozganidek yozing. Sun'iy intellekt bilimlar bazangiz bo'yicha haqiqiy xaridorlarga qanday javob bersa, shunday javob beradi. Sinov tarif suhbatlarini sarflamaydi; bu yerdan arizalar «Sinov» belgisi bilan keladi.",
  },
  testPh: { ru: "Например: сколько стоит кухня 3 метра?", uz: "Masalan: 3 metrli oshxona qancha turadi?" },
  send: { ru: "Отправить", uz: "Yuborish" },
  reset: { ru: "Начать заново", uz: "Qaytadan boshlash" },
  thinking: { ru: "ИИ пишет…", uz: "Sun'iy intellekt yozmoqda…" },
  failed: { ru: "Не получилось. Попробуйте ещё раз.", uz: "Bo'lmadi. Qaytadan urinib ko'ring." },

  talksEmpty: { ru: "Разговоров пока нет. Они появятся, когда покупатели напишут в подключённый канал.", uz: "Hozircha suhbatlar yo'q. Xaridorlar ulangan kanalga yozganda paydo bo'ladi." },
  modeAi: { ru: "ведёт ИИ", uz: "sun'iy intellekt olib boryapti" },
  modeHuman: { ru: "ведёт человек", uz: "odam olib boryapti" },
  takeOver: { ru: "Вести самому", uz: "O'zim olib boraman" },
  giveBack: { ru: "Вернуть ИИ", uz: "Sun'iy intellektga qaytarish" },
  replyAsBot: { ru: "Ответить покупателю от имени бота", uz: "Xaridorga bot nomidan javob berish" },
  needsKb: { ru: "нет ответа в базе", uz: "bazada javob yo'q" },
  customer: { ru: "Покупатель", uz: "Xaridor" },
  ai: { ru: "ИИ", uz: "SI" },
  human: { ru: "Менеджер", uz: "Menejer" },
  back: { ru: "Назад", uz: "Orqaga" },

  leadsEmpty: { ru: "Заявок пока нет.", uz: "Hozircha arizalar yo'q." },
  status_new: { ru: "новая", uz: "yangi" },
  status_taken: { ru: "в работе", uz: "ishda" },
  status_won: { ru: "сделка", uz: "bitim" },
  status_lost: { ru: "отказ", uz: "rad etildi" },
  test: { ru: "проверка", uz: "sinov" },
  contact: { ru: "Контакт", uz: "Kontakt" },
  need: { ru: "Нужно", uz: "Kerak" },
  budget: { ru: "Бюджет", uz: "Byudjet" },
  when: { ru: "Когда", uz: "Qachon" },
  took: { ru: "Взял", uz: "Oldi" },
  openTalk: { ru: "Разговор", uz: "Suhbat" },

  setCompany: { ru: "Компания", uz: "Kompaniya" },
  setAssistant: { ru: "ИИ-сотрудник", uz: "Sun'iy intellekt xodimi" },
  assistantName: { ru: "Имя помощника", uz: "Yordamchi ismi" },
  tone: { ru: "Тон", uz: "Ohang" },
  toneFriendly: { ru: "дружелюбный", uz: "do'stona" },
  toneFormal: { ru: "деловой", uz: "rasmiy" },
  greeting: { ru: "Приветствие в чате на сайте", uz: "Saytdagi chatda salomlashish" },
  enabled: { ru: "ИИ отвечает покупателям", uz: "Sun'iy intellekt xaridorlarga javob beradi" },
  mode: { ru: "Когда отвечает ИИ в вашем Telegram", uz: "Telegramingizda sun'iy intellekt qachon javob beradi" },
  modeAlways: { ru: "всегда", uz: "doim" },
  modeOffHours: { ru: "только в нерабочее время", uz: "faqat ish vaqtidan tashqari" },
  modeHint: {
    ru: "«Только в нерабочее время» действует в вашем Telegram: днём отвечаете вы, ночью и в выходные ИИ. В боте и на сайте ИИ отвечает всегда: там покупателю больше некому ответить.",
    uz: "«Faqat ish vaqtidan tashqari» Telegramingizda amal qiladi: kunduzi siz javob berasiz, kechasi va dam olish kunlari sun'iy intellekt. Botda va saytda sun'iy intellekt doim javob beradi: u yerda xaridorga boshqa javob beradigan odam yo'q.",
  },
  hours: { ru: "Часы работы (Ташкент)", uz: "Ish vaqti (Toshkent)" },
  days: { ru: "Рабочие дни", uz: "Ish kunlari" },
  dayNames: { ru: "Вс,Пн,Вт,Ср,Чт,Пт,Сб", uz: "Ya,Du,Se,Ch,Pa,Ju,Sh" },
  saved: { ru: "Сохранено", uz: "Saqlandi" },

  teamIntro: {
    ru: "Заявки приходят в Telegram всем, у кого стоит галочка. Чтобы добавить менеджера, отправьте ему ссылку: он нажмёт «Старт» в боте и попадёт в команду. Менеджер видит разговоры и заявки, но не меняет настройки.",
    uz: "Arizalar belgi qo'yilgan hammaga Telegramda keladi. Menejer qo'shish uchun unga havolani yuboring: u botda «Start» ni bosib jamoaga qo'shiladi. Menejer suhbatlar va arizalarni ko'radi, lekin sozlamalarni o'zgartirmaydi.",
  },
  invite: { ru: "Ссылка-приглашение", uz: "Taklif havolasi" },
  owner: { ru: "владелец", uz: "egasi" },
  manager: { ru: "менеджер", uz: "menejer" },
  getsLeads: { ru: "получает заявки", uz: "arizalarni oladi" },

  planCurrent: { ru: "Ваш тариф", uz: "Sizning tarifingiz" },
  plan_trial: { ru: "Пробный", uz: "Sinov" },
  plan_start: { ru: "Старт", uz: "Start" },
  plan_business: { ru: "Бизнес", uz: "Biznes" },
  plan_pro: { ru: "Про", uz: "Pro" },
  perMonth: { ru: "сум в месяц", uz: "so'm oyiga" },
  dialogsPerMonth: { ru: "диалогов в месяц", uz: "suhbat oyiga" },
  channelsN: { ru: "канал(а)", uz: "kanal" },
  premiumModel: { ru: "самая сильная модель", uz: "eng kuchli model" },
  free14: { ru: "14 дней бесплатно", uz: "14 kun bepul" },
  dialogWhat: {
    ru: "Диалог — разговор с покупателем, в котором ИИ ответил хотя бы раз за месяц. Сколько бы сообщений в нём ни было, это один диалог. Лимит кончился: ИИ замолкает, покупатель получает «менеджер ответит», вам приходит сообщение в Telegram.",
    uz: "Suhbat: sun'iy intellekt oy davomida kamida bir marta javob bergan xaridor bilan muloqot. Unda qancha xabar bo'lishidan qat'i nazar, bu bitta suhbat. Limit tugasa: sun'iy intellekt jim bo'ladi, xaridor «menejer javob beradi» xabarini oladi, sizga Telegramda xabar keladi.",
  },
  howPay: { ru: "Как оплатить", uz: "Qanday to'lash" },
  howPayBody: {
    ru: "Пока оплата по счёту: напишите нам в Telegram, какой тариф и на сколько месяцев, и мы пришлём счёт на компанию или реквизиты для перевода. После оплаты срок продлится в течение рабочего дня. Оплата картой через Click и Payme скоро появится здесь.",
    uz: "Hozircha to'lov hisob-faktura orqali: bizga Telegramda qaysi tarif va necha oyga ekanini yozing, kompaniyaga hisob yoki o'tkazma rekvizitlarini yuboramiz. To'lovdan keyin muddat ish kuni davomida uzaytiriladi. Click va Payme orqali karta bilan to'lov tez orada shu yerda paydo bo'ladi.",
  },
  writeUs: { ru: "Написать в Telegram", uz: "Telegramda yozish" },
  payCard: { ru: "Оплатить картой", uz: "Karta bilan to'lash" },
  payCardHint: {
    ru: "Выберите тариф и срок. Оплата идёт на стороне Payme или Click, после неё тариф продлится сам, а вам придёт сообщение в Telegram. Срок считается от уже оплаченной даты: оплата заранее не сгорает.",
    uz: "Tarif va muddatni tanlang. To'lov Payme yoki Click tomonida bo'ladi, shundan keyin tarif o'zi uzaytiriladi va sizga Telegramda xabar keladi. Muddat to'langan sanadan hisoblanadi: oldindan to'lov yonib ketmaydi.",
  },
  payWith: { ru: "Оплатить через", uz: "Orqali to'lash" },
  paidThanks: {
    ru: "Спасибо! Как только платёжная система подтвердит оплату, срок обновится здесь, обычно за минуту.",
    uz: "Rahmat! To'lov tizimi to'lovni tasdiqlashi bilan muddat shu yerda yangilanadi, odatda bir daqiqada.",
  },
  payFail: { ru: "Оплата картой сейчас недоступна. Напишите нам, пришлём счёт.", uz: "Karta bilan to'lov hozir mavjud emas. Bizga yozing, hisob yuboramiz." },
  history: { ru: "Оплаты", uz: "To'lovlar" },
  months: { ru: "мес.", uz: "oy" },
} satisfies Record<string, Tr>;

export type CabKey = keyof typeof cab;

export function tr(locale: CabLocale): (key: CabKey) => string {
  return (key) => cab[key][locale];
}

export function isCabLocale(value: unknown): value is CabLocale {
  return value === "ru" || value === "uz";
}

export const CAB_LANG_COOKIE = "ai_cab_lang";
