// Конструктор нашей цены, как у LIDER PROF PROEKT: плашка «Конструктор» на
// каждой странице, тумблер включает и выключает настоящий блок на странице,
// итог «сайт + допы» считается сразу. То, чего на макете нет (бот записи,
// МИС, английский, поиск, отзывы с карт), — группа «Сверх сайта» на странице
// «Что дальше».
//
// Владелец, 13.10.2026: «Стоимость для клиента без допников 1700$, с допами не
// более 3000$. Поставь в допы то, что клиенту реально нужно будет».
// Раскладка: сайт 1 700 $, допы на макете 670 $, сверх сайта 630 $, со всеми
// тумблерами ровно 3 000 $. Середина рынка Ташкента: сайт клиники на двух
// языках с управлением 1 200-2 500 $, с онлайн-записью и интеграциями от
// 2 500 $ (docs/research/asmo.md). Держит tests/proto-bundles.test.ts.

/** Сайт: главная, услуги, специалисты, цены, контакты, ru и uz, управление. */
export const BASE = {
  price: 1700,
  ru: {
    t: "Сайт клиники: главная, услуги, специалисты, цены, контакты и управление",
    d: "Три направления и все процедуры с вашего сайта, специалисты и график, цены, вопросы, карта и запись в Telegram с готовым текстом. Русский и узбекский. Врачей, цены и тексты меняете сами в панели. Делаем в первую очередь под телефон.",
  },
  uz: {
    t: "Klinika sayti: bosh sahifa, xizmatlar, mutaxassislar, narxlar, kontaktlar va boshqaruv",
    d: "Saytingizdagi uchta yo‘nalish va barcha muolajalar, mutaxassislar va jadval, narxlar, savollar, xarita va tayyor matnli Telegram yozuv. Rus va o‘zbek tillari. Shifokorlar, narxlar va matnlarni paneldan o‘zingiz o‘zgartirasiz. Avvalo telefon uchun qilamiz.",
  },
};

/**
 * Блоки, которые видно на макете. `where` — "" (главная) или "all". На
 * странице блок помечен data-addon="<id>"; выключили — его нет.
 */
export const ADDONS = [
  {
    id: "intro", where: "", price: 90,
    ru: { t: "Влёт в логотип", e: "Точки знака Asmo собираются на экране, камера влетает в голубой круг и открывает сайт" },
    uz: { t: "Logotipga uchib kirish", e: "Asmo belgisining nuqtalari ekranda yig‘iladi, kamera havorang doira ichiga uchib kirib saytni ochadi" },
  },
  {
    id: "story", where: "", price: 190, star: true,
    ru: { t: "Сцена при прокрутке: под дерматоскопом и вглубь кожи", e: "Листаете вниз: линза идёт по коже и увеличивает родинку, камера уходит сквозь слои кожи, к каждому слою подписано, что вы лечите" },
    uz: { t: "Aylantirishda sahna: dermatoskop ostida va teri ichiga", e: "Pastga aylantirasiz: linza teri bo‘ylab yurib xolni kattalashtiradi, kamera teri qatlamlari orqali kiradi, har bir qatlamda nimani davolashingiz yozilgan" },
  },
  {
    id: "booking", where: "", price: 160, star: true,
    ru: { t: "Онлайн-запись: направление, день и время", e: "Человек выбирает врача, день и свободное время, заявка уходит администратору в Telegram. В работе подключаем ваш настоящий график" },
    uz: { t: "Onlayn yozilish: yo‘nalish, kun va vaqt", e: "Odam shifokor, kun va bo‘sh vaqtni tanlaydi, ariza administratorga Telegramga boradi. Ishda haqiqiy jadvalingizni ulaymiz" },
  },
  {
    id: "prices", where: "", price: 120,
    ru: { t: "Конструктор лечения с ценами", e: "Отмечаете процедуры и число сеансов, итог в сумах считается сразу и уходит в Telegram вместе с записью" },
    uz: { t: "Narxli davolash konstruktori", e: "Muolajalar va seanslar sonini belgilaysiz, so‘mdagi jami darhol hisoblanadi va yozilish bilan Telegramga boradi" },
  },
  {
    id: "quiz", where: "", price: 70,
    ru: { t: "Тест «К кому записаться»", e: "Три вопроса, и сайт подсказывает направление и специалиста. Человек не гадает, к кому идти" },
    uz: { t: "«Kimga yozilish kerak» testi", e: "Uchta savol va sayt yo‘nalish va mutaxassisni aytadi. Odam kimga borishni taxmin qilmaydi" },
  },
  {
    id: "motion", where: "all", price: 40,
    ru: { t: "Своё движение у каждого блока и смена цвета между блоками", e: "Карточки услуг всплывают, как клетки, этапы прочерчиваются, цвет страницы плавно меняется от блока к блоку" },
    uz: { t: "Har bir blokda o‘z harakati va bloklar orasida rang almashishi", e: "Xizmat kartochkalari hujayralar kabi suzib chiqadi, bosqichlar chiziladi, sahifa rangi blokdan blokka ravon o‘zgaradi" },
  },
];

/**
 * Сверх сайта: блока на макете нет, на странице «Что дальше» — описание.
 * `needs` — без чего не работает: включается вместе с ним.
 */
export const BLOCKS = [
  {
    id: "bot", price: 220, needs: ["booking"], star: true,
    ru: { t: "Telegram-бот записи и напоминаний", why: "Пациент записывается в боте за минуту, бот за день и за два часа напоминает о приёме и даёт перенести время. Меньше пустых окон у врачей, администратор не обзванивает всех вручную.", li: ["Запись в боте", "Напоминание за день и за 2 часа", "Перенос и отмена в одно касание"] },
    uz: { t: "Yozilish va eslatma Telegram-boti", why: "Bemor botda bir daqiqada yoziladi, bot qabuldan bir kun va ikki soat oldin eslatadi va vaqtni ko‘chirishga imkon beradi. Shifokorlarda bo‘sh oynalar kamayadi, administrator hammaga qo‘lda qo‘ng‘iroq qilmaydi.", li: ["Botda yozilish", "Bir kun va 2 soat oldin eslatma", "Bir bosishda ko‘chirish va bekor qilish"] },
  },
  {
    id: "mis", price: 150, needs: ["booking"],
    ru: { t: "Интеграция с вашей МИС или CRM", why: "Заявка с сайта и из бота сама встаёт в вашу программу записи или CRM (amoCRM, Bitrix24 или ваша МИС), а свободное время на сайте берётся оттуда же. Двойной записи на одно время не будет.", li: ["Заявки сразу в программу", "Свободное время из графика", "Кто записался и откуда"] },
    uz: { t: "MIS yoki CRM bilan integratsiya", why: "Sayt va botdan ariza o‘zi yozilish dasturingiz yoki CRMga (amoCRM, Bitrix24 yoki MISingiz) tushadi, saytdagi bo‘sh vaqt ham o‘sha yerdan olinadi. Bir vaqtga ikki marta yozilish bo‘lmaydi.", li: ["Arizalar darhol dasturga", "Bo‘sh vaqt jadvaldan", "Kim va qayerdan yozildi"] },
  },
  {
    id: "seo", price: 130, needs: [],
    ru: { t: "Запуск в поиске: страницы под запросы", why: "Отдельные страницы под то, что ищут в Ташкенте: «дерматолог», «удаление папиллом», «лечение акне», «трихолог», «озонотерапия». Карточки клиники в Яндекс Картах и Google, разметка для поиска. Сейчас у сайта нет даже описания страницы.", li: ["Страница на каждую услугу", "Яндекс Карты и Google", "Заголовки и описания"] },
    uz: { t: "Qidiruvda ishga tushirish: so‘rovlar uchun sahifalar", why: "Toshkentda qidiriladigan narsalar uchun alohida sahifalar: «dermatolog», «papilloma olib tashlash», «akne davolash», «trixolog», «ozon terapiya». Yandex Xarita va Google’da klinika kartochkalari, qidiruv uchun belgilash. Hozir saytda hatto sahifa tavsifi yo‘q.", li: ["Har bir xizmatga sahifa", "Yandex Xarita va Google", "Sarlavha va tavsiflar"] },
  },
  {
    id: "en", price: 90, needs: [],
    ru: { t: "Английская версия", why: "Для пациентов из других стран и экспатов в Ташкенте: услуги, специалисты, запись и контакты на английском. Переключатель RU / UZ / EN в шапке.", li: ["Услуги и врачи на английском", "Запись на языке пациента", "Переключатель в шапке"] },
    uz: { t: "Ingliz tilidagi versiya", why: "Boshqa mamlakatlardan kelgan bemorlar va Toshkentdagi ekspatlar uchun: xizmatlar, mutaxassislar, yozilish va kontaktlar ingliz tilida. Sarlavhada RU / UZ / EN almashtirgich.", li: ["Xizmatlar va shifokorlar inglizcha", "Bemor tilida yozilish", "Sarlavhada almashtirgich"] },
  },
  {
    id: "reviews", price: 40, needs: [],
    ru: { t: "Отзывы с Яндекс и Google Карт", why: "Настоящие отзывы ваших пациентов с карт подтягиваются на сайт сами, с оценкой и датой. Мы их не пишем и не правим: человек видит то же, что на карте.", li: ["Оценка и число отзывов", "Свежие отзывы сами", "Ссылка оставить отзыв"] },
    uz: { t: "Yandex va Google Xaritalardan sharhlar", why: "Bemorlaringizning xaritalardagi haqiqiy sharhlari saytga baho va sanasi bilan o‘zi tushadi. Biz ularni yozmaymiz va tahrirlamaymiz: odam xaritadagini ko‘radi.", li: ["Baho va sharhlar soni", "Yangi sharhlar o‘zi", "Sharh qoldirish havolasi"] },
  },
];
