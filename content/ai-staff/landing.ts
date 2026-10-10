/**
 * Публичная страница сервиса ИИ-сотрудников: /ru/ai-sotrudnik и /uz/ai-sotrudnik.
 *
 * Запрос — по Google Trends, Узбекистан, 12 месяцев до 10.10.2026
 * (docs/ai-staff/research.md, 1.6): «чат бот» и «бот для бизнеса» в поиске
 * почти нулевые, а «ии» вырос вдвое за год; узбекский «bot yaratish» растёт.
 * Поэтому в заголовке «ИИ», а не «чат-бот»: «ИИ-менеджер продаж для
 * Telegram». Вордстат (регион 171) не снимался: нет WORDSTAT_TOKEN.
 *
 * Правила макетов (CLAUDE.md): без длинных тире и штампов. Держит тест
 * tests/ai-staff-landing.test.ts через ту же проверку, что у макетов.
 */

export const LANDING_PATH = "ai-sotrudnik";
export const LANDING_LOCALES = ["ru", "uz"] as const;
export type LandingLocale = (typeof LANDING_LOCALES)[number];

export type Landing = {
  seoTitle: string;
  seoDescription: string;
  title: string;
  lead: string;
  cta: string;
  ctaNote: string;
  demoTitle: string;
  demoNote: string;
  demoPh: string;
  demoSend: string;
  demoFail: string;
  demoOff: string;
  howTitle: string;
  how: Array<{ title: string; text: string }>;
  whatTitle: string;
  what: string[];
  pricesTitle: string;
  pricesNote: string;
  plans: Array<{ name: string; price: string; lines: string[] }>;
  faqTitle: string;
  faq: Array<{ q: string; a: string }>;
};

export const landing: Record<LandingLocale, Landing> = {
  ru: {
    seoTitle: "ИИ-менеджер продаж для Telegram и сайта | DevUz Studio",
    seoDescription:
      "ИИ-менеджер продаж отвечает вашим покупателям в Telegram и на сайте круглосуточно, по вашему прайсу, на русском и узбекском, и передаёт заявку менеджеру. 14 дней бесплатно.",
    title: "ИИ-менеджер продаж для Telegram и сайта",
    lead: "ИИ-менеджер продаж отвечает покупателям за секунды, днём и ночью, по вашему прайсу. Выясняет, что нужно, берёт телефон и передаёт заявку вашему менеджеру в Telegram. Русский и узбекский.",
    cta: "Попробовать 14 дней бесплатно",
    ctaNote: "Настройка за 10 минут. Карта не нужна.",
    demoTitle: "Напишите ему сами",
    demoNote: "Это демо: ИИ отвечает за выдуманный мебельный салон по его прайсу. Спросите цену кухни, доставку или оставьте телефон.",
    demoPh: "Сколько стоит кухня на 3 метра?",
    demoSend: "Отправить",
    demoFail: "Не получилось отправить, попробуйте ещё раз.",
    demoOff: "Демо скоро появится здесь.",
    howTitle: "Как подключить",
    how: [
      { title: "Создайте кабинет", text: "Нажмите «Старт» в нашем боте в Telegram. Пароль не нужен." },
      { title: "Дайте ему прайс", text: "Вставьте ссылку на сайт или прайс текстом. Цены он называет только отсюда." },
      { title: "Подключите канал", text: "Свой Telegram в настройках Telegram для бизнеса, свой бот по токену или чат на сайт одной строкой." },
      { title: "Получайте заявки", text: "Имя, телефон, что нужно и когда приходят вашим менеджерам в Telegram с кнопкой «Беру»." },
    ],
    whatTitle: "Что он делает",
    what: [
      "Отвечает в вашем личном Telegram от вашего имени. Напишете в чат сами, и он замолчит в этом чате на 12 часов.",
      "Называет цены, сроки и адрес ровно как в вашем прайсе. Чего нет в прайсе, не придумывает: говорит, что уточнит у менеджера.",
      "Понимает русский и узбекский, латиницей и кириллицей, и отвечает на языке покупателя.",
      "Сам первым никому не пишет: только отвечает тем, кто написал вам.",
      "Показывает в кабинете, сколько заявок пришло ночью и на какие вопросы не нашлось ответа в прайсе.",
    ],
    pricesTitle: "Цены",
    pricesNote: "Диалог: разговор с покупателем, в котором ИИ ответил хотя бы раз за месяц. Оплата по счёту.",
    plans: [
      { name: "Старт", price: "490 000 сум в месяц", lines: ["300 диалогов", "1 канал"] },
      { name: "Бизнес", price: "990 000 сум в месяц", lines: ["1 000 диалогов", "Telegram, бот и сайт"] },
      { name: "Про", price: "2 490 000 сум в месяц", lines: ["1 500 диалогов", "самая сильная модель"] },
    ],
    faqTitle: "Частые вопросы",
    faq: [
      { q: "Он скажет покупателю, что он ИИ?", a: "Да, в первом сообщении. Так честнее, и этого требует закон Узбекистана об обработке данных с помощью ИИ." },
      { q: "Что нужно для работы в моём Telegram?", a: "Telegram Premium: бизнес-функции Telegram работают с ним. Без Premium подключите своего бота или чат на сайт." },
      { q: "А если он ошибётся с ценой?", a: "Каждый ответ проверяется до отправки: число, которого нет в вашем прайсе, покупатель не увидит." },
      { q: "Сколько занимает настройка?", a: "Около 10 минут, если есть сайт или прайс текстом. Проверить ответы можно на себе до подключения." },
    ],
  },
  uz: {
    seoTitle: "Sun'iy intellekt sotuv menejeri Telegram va sayt uchun | DevUz Studio",
    seoDescription:
      "Sun'iy intellekt sotuv menejeri xaridorlaringizga Telegram va saytda kecha-kunduz, narxlaringiz bo'yicha, rus va o'zbek tilida javob beradi va arizani menejerga topshiradi. 14 kun bepul.",
    title: "Sun'iy intellekt sotuv menejeri Telegram va sayt uchun",
    lead: "Sun'iy intellekt sotuv menejeri xaridorlarga soniyalar ichida, kechayu kunduz, narxlaringiz bo'yicha javob beradi. Nima kerakligini aniqlaydi, telefon raqamini oladi va arizani Telegramda menejeringizga topshiradi. Rus va o'zbek tilida.",
    cta: "14 kun bepul sinab ko'rish",
    ctaNote: "Sozlash 10 daqiqa. Karta kerak emas.",
    demoTitle: "Unga o'zingiz yozing",
    demoNote: "Bu demo: sun'iy intellekt o'ylab topilgan mebel saloni nomidan uning narxlari bo'yicha javob beradi. Oshxona narxini, yetkazib berishni so'rang yoki telefon qoldiring.",
    demoPh: "3 metrli oshxona qancha turadi?",
    demoSend: "Yuborish",
    demoFail: "Yuborilmadi, qaytadan urinib ko'ring.",
    demoOff: "Demo tez orada shu yerda paydo bo'ladi.",
    howTitle: "Qanday ulash",
    how: [
      { title: "Kabinet yarating", text: "Telegramdagi botimizda «Start» ni bosing. Parol kerak emas." },
      { title: "Unga narxlarni bering", text: "Sayt havolasini yoki narxlarni matn bilan qo'ying. Narxlarni faqat shu yerdan aytadi." },
      { title: "Kanalni ulang", text: "Telegram Business sozlamalarida shaxsiy Telegramingiz, token orqali o'z botingiz yoki bitta qator bilan saytdagi chat." },
      { title: "Arizalarni oling", text: "Ism, telefon, nima va qachon kerakligi menejerlaringizga Telegramda «Olaman» tugmasi bilan keladi." },
    ],
    whatTitle: "U nima qiladi",
    what: [
      "Shaxsiy Telegramingizda sizning nomingizdan javob beradi. Chatga o'zingiz yozsangiz, u shu chatda 12 soat jim turadi.",
      "Narx, muddat va manzilni aynan narxlar ro'yxatingizdagidek aytadi. Ro'yxatda yo'q narsani o'ylab topmaydi: menejerdan aniqlab berishini aytadi.",
      "Rus va o'zbek tilini, lotin va kirill yozuvida tushunadi va xaridor tilida javob beradi.",
      "Hech kimga birinchi bo'lib yozmaydi: faqat sizga yozganlarga javob beradi.",
      "Kabinetda kechasi nechta ariza kelganini va qaysi savollarga narxlar ro'yxatida javob topilmaganini ko'rsatadi.",
    ],
    pricesTitle: "Narxlar",
    pricesNote: "Suhbat: sun'iy intellekt oy davomida kamida bir marta javob bergan xaridor bilan muloqot. To'lov hisob orqali.",
    plans: [
      { name: "Start", price: "oyiga 490 000 so'm", lines: ["300 suhbat", "1 kanal"] },
      { name: "Biznes", price: "oyiga 990 000 so'm", lines: ["1 000 suhbat", "Telegram, bot va sayt"] },
      { name: "Pro", price: "oyiga 2 490 000 so'm", lines: ["1 500 suhbat", "eng kuchli model"] },
    ],
    faqTitle: "Ko'p beriladigan savollar",
    faq: [
      { q: "U xaridorga sun'iy intellekt ekanini aytadimi?", a: "Ha, birinchi xabarda. Bu halolroq va O'zbekistonning sun'iy intellekt yordamida ma'lumotlarni qayta ishlash haqidagi qonuni shuni talab qiladi." },
      { q: "Mening Telegramimda ishlashi uchun nima kerak?", a: "Telegram Premium: Telegramning biznes funksiyalari u bilan ishlaydi. Premium bo'lmasa, o'z botingizni yoki saytdagi chatni ulang." },
      { q: "Agar u narxda xato qilsa-chi?", a: "Har bir javob yuborishdan oldin tekshiriladi: narxlar ro'yxatingizda yo'q raqamni xaridor ko'rmaydi." },
      { q: "Sozlash qancha vaqt oladi?", a: "Sayt yoki matnli narxlar bo'lsa, taxminan 10 daqiqa. Javoblarni ulashdan oldin o'zingizda sinab ko'rish mumkin." },
    ],
  },
};
