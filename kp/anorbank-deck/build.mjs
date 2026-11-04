// Презентация для ANORBANK: node kp/anorbank-deck/build.mjs → anorbank-ru.html, anorbank-uz.html
//
// Владелец, 04.11.2026: «Нужно подготовить 2 КП: на русском и узбекском… Пока
// без цен… Надо сделать 2 концепта», и следом: «Давай сделаем 2 концепта в
// рамках одного документа просто. Типа можем так, а можем вот так».
// Экраны — img/<язык>/ (снимает shots.mjs из concepts/). Цифры и названия
// услуг — с anorbank.uz и из их приложения на 04.11.2026; цен нет.
import { writeFileSync } from "node:fs";
import path from "node:path";

const DIR = path.dirname(new URL(import.meta.url).pathname);
const Q = "‘"; // o‘, g‘ — как в прошлых КП на узбекском
const uz = (s) => s.replace(/'/g, Q);

const T = {
  ru: {
    title: "ANORBANK · новый сайт, два концепта",
    foot: "ANORBANK · новый сайт · концепт DevUz Studio",
    cover: {
      kick: "Коммерческое предложение",
      h1: "Новый сайт ANORBANK. <em>Можем так, а можем вот так.</em>",
      lead: "Два концепта главной страницы: светлый функциональный «Ясный» и тёмный премиальный «Гранат». Выбираете один или собираем из двух.",
      tag: "04.11.2026 · без цен, сначала выбор пути",
      la: "Концепт 1 · «Ясный»",
      lb: "Концепт 2 · «Гранат»",
    },
    now: {
      kick: "Что видим сейчас",
      h2: "Приложение уже новое. <em>Сайт выглядит старше него.</em>",
      cards: [
        ["Главная", "7 баннеров подряд, у каждого заголовок первого уровня. Поисковик видит семь главных тем вместо одной."],
        ["Меню", "Два этажа: 3 раздела сверху и 14 пунктов ниже. Нужную услугу ищут глазами."],
        ["Вес страницы", "40 скриптов и 19 файлов стилей, 665 КБ одного кода страницы без картинок. На мобильном интернете это заметно."],
        ["Доступ из-за рубежа", "С зарубежных адресов сайт отвечает «доступ запрещён»: у нас открылась только главная, без картинок и стилей. Стоит проверить, видят ли сайт поисковики и клиенты Astrasend за границей."],
        ["Приложение", "4,7 в App Store, 5 896 оценок, новый интерфейс и «всё в одном приложении». Сайт его не продолжает."],
        ["Что сохраняем", "Гранатовый цвет, знак с короной, Montserrat, карты Anor Black и Milliy, AnorEx, Anor Nasiya, номер 1290."],
      ],
      note: "Проверено 04.11.2026 по главной anorbank.uz и странице приложения в App Store.",
    },
    trends: {
      kick: "Тренды 2026 для банков",
      h2: "Банк на сайте: <em>спокойно, понятно, с телефона</em>",
      cards: [
        ["Ясность вместо баннеров", "Меньше слайдов, больше воздуха, одно действие на блок. Человек приходит за делом, а не за рекламой."],
        ["Сначала телефон", "Кнопки под большим пальцем, нижняя панель как в приложении, ничего не обрезано."],
        ["Доверие на виду", "Гарантия по вкладам, памятка о мошенниках и 1290 на каждой странице, а не в подвале."],
        ["«Скажите, что нужно»", "Строка с подсказками и ИИ-помощник вместо поиска по меню. Чат у вас уже есть, его стоит вывести вперёд."],
        ["Калькуляторы вместо обещаний", "Платёж по кредиту, доход по вкладу и рассрочка считаются сразу, до заявки."],
        ["Скорость и доступность", "Лёгкие страницы и версия для слабовидящих по стандарту WCAG. Версия для слабовидящих у вас уже есть."],
      ],
      src: "Обзоры трендов 2026: Digidop, RedSpider, Veza Digital, Seahawk Media.",
    },
    two: {
      kick: "Два пути",
      h2: "Можем так, <em>а можем вот так</em>",
      a: ["«Ясный»: банк в одном экране", "Светлый и спокойный. Первый экран спрашивает «что сделаем сегодня?» и сразу ведёт к услуге. Для ежедневных клиентов."],
      b: ["«Гранат»: тёмный премиум", "Эмоция и бренд. Гранат раскрывается при прокрутке, зёрна становятся услугами. Для рекламы и премиальных карт."],
      mix: "Можно взять один или собрать из двух: например, первый экран «Граната» и карточки «Ясного».",
    },
    c1a: {
      kick: "Концепт 1 · «Ясный»",
      h2: "Банк в одном экране",
      lead: "Первый экран не рекламирует, а спрашивает. Человек пишет «перевести деньги в Россию» или нажимает подсказку и сразу попадает в услугу.",
      pts: ["Строка «Что сделаем сегодня?» и шесть подсказок: карта, микрозайм, рассрочка, вклад, AnorEx, перевод", "Карта Anor Black и живые подсказки «перевод без комиссии», «обмен 24/7»", "Доверие в первом экране: 4,7 в App Store, 100% гарантия по вкладам, 1290"],
    },
    c1b: {
      kick: "Концепт 1 · «Ясный»",
      h2: "Главное <em>на одном экране</em>",
      lead: "Вместо семи баннеров подряд: продукты карточками, у каждой одно действие.",
      pts: ["Mastercard Milliy: «переводы без комиссии до 100 млн сум в месяц»", "Микрозайм до 50 млн сум за минуту", "Калькулятор вклада прямо на главной", "Anor Nasiya по категориям партнёров", "Astrasend, AnorEx и памятка о мошенниках"],
    },
    c1c: {
      kick: "Концепт 1 · «Ясный» на телефоне",
      h2: "Как приложение, <em>только в браузере</em>",
      pts: ["Нижняя панель: главная, карты, переводы, вклады, ещё", "Подсказки листаются пальцем в одну строку", "Карточки по одной на экран, кнопка всегда видна", "Шрифт не меньше 15 px, без прокрутки вбок"],
    },
    c2a: {
      kick: "Концепт 2 · «Гранат»",
      h2: "Всё, что нужно от банка. <em>В одном гранате.</em>",
      lead: "Кинематографичный первый экран: раскрытый гранат, зёрна как рубины. Этот экран работает и как рекламный: его узнают в баннере и в сторис.",
      pts: ["Факты сразу под заголовком: карта за 72 часа, микрозайм до 50 млн, 4,7 в App Store", "На телефоне свой вертикальный кадр, а не обрезанный с компьютера", "Две кнопки: «Заказать карту» и «Скачать приложение»"],
    },
    c2b: {
      kick: "Концепт 2 · «Гранат»",
      h2: "Каждое зерно <em>это услуга</em>",
      lead: "При прокрутке гранат раскрывается, и зёрна превращаются в шесть карточек: карты, переводы, вклады, микрозайм, рассрочка, AnorEx.",
      pts: ["Сцена по прокрутке, но прокрутку не перехватываем: страница листается как обычно", "Каждая карточка в два касания ведёт в услугу", "Стекло и мягкое свечение на тёмном фоне"],
    },
    c2c: {
      kick: "Концепт 2 · «Гранат»",
      h2: "Anor Premium: <em>карты веером</em>",
      lead: "Visa Infinite, Mastercard World Elite и Anor Black лежат веером, как в кошельке. Наведение поднимает карту и показывает её главное.",
      pts: ["Консьерж-сервис Anor Premium", "Безлимитные привилегии World Elite", "Anor Black: покупки в 200 странах мира"],
    },
    cmp: {
      kick: "Сравнение",
      h2: "Чем отличаются",
      head: ["", "«Ясный»", "«Гранат»"],
      rows: [
        ["Настроение", "Спокойный, светлый, деловой", "Эмоциональный, премиальный, яркий"],
        ["Первый экран", "Строка «Что сделаем сегодня?» и подсказки", "Раскрытый гранат и зёрна-рубины"],
        ["Сильная сторона", "Быстрый путь к услуге", "Бренд запоминается с первого взгляда"],
        ["Лучше всего для", "Ежедневные клиенты: карта, перевод, рассрочка", "Реклама, премиальные карты, молодая аудитория"],
        ["Цвета", "Белый и ваш гранатовый #A30041", "Винный фон и светящийся гранатовый"],
        ["Шрифты", "Montserrat, как сейчас, и Inter", "Unbounded и Inter"],
        ["Движение", "Мягкие появления, калькулятор отвечает сразу", "Сцена по прокрутке, карты веером"],
      ],
    },
    both: {
      kick: "В обоих концептах",
      h2: "Что войдёт в сайт <em>при любом выборе</em>",
      cards: [
        ["ИИ-помощник", "Чат на сайте у вас уже есть: выводим его вперёд, он отвечает и ведёт к заявке."],
        ["Калькуляторы", "Кредит, вклад и рассрочка считаются сразу, до заявки."],
        ["Заявка со статусом", "Клиент оставил заявку и видит, на каком она этапе."],
        ["Курсы и AnorEx", "Живые курсы валют и переход в обмен в приложении."],
        ["Офисы и банкоматы", "На карте, с часами работы и маршрутом."],
        ["Три языка", "Русский, узбекский и английский, переключение без потери страницы."],
        ["Для слабовидящих", "Крупный шрифт, контраст и чтение экрана по стандарту WCAG."],
        ["Раздел «Бизнесу»", "Тот же стиль и та же логика для юрлиц."],
      ],
      note: "Сайт можно оставить на вашей системе управления (сейчас Битрикс) или перенести. Решаем вместе на старте.",
    },
    steps: {
      kick: "Как работаем",
      h2: "От выбора концепта <em>до запуска</em>",
      cards: [
        ["Выбор пути", "«Ясный», «Гранат» или смесь двух."],
        ["Прототип", "Главная, карта, кредит и вклад: как это будет работать."],
        ["Дизайн", "Все страницы и мобильная версия на трёх языках."],
        ["Разработка", "Вёрстка, калькуляторы, заявки и ваши системы."],
        ["Запуск", "Без остановки текущего сайта, с переадресацией старых адресов."],
      ],
      note: "Сроки и стоимость назовём после выбора концепта и списка страниц.",
    },
    cta: {
      kick: "Следующий шаг",
      h2: "Какой путь <em>ближе вам?</em>",
      lead: "Напишите «Ясный», «Гранат» или что взять из каждого. Следующим шагом раскроем выбранный концепт на ключевые страницы.",
      rows: [["Сайт", "devuz.studio"], ["Telegram", "t.me/Devuz_studio_bot"], ["Александр", "+998 90 912-05-78"], ["Егор", "+7 923 233-00-37"]],
    },
  },
};

T.uz = {
  title: "ANORBANK · yangi sayt, ikki konsepsiya",
  foot: "ANORBANK · yangi sayt · DevUz Studio konsepsiyasi",
  cover: {
    kick: "Tijoriy taklif",
    h1: uz("ANORBANK uchun yangi sayt. <em>Bunday qila olamiz, bunday ham.</em>"),
    lead: uz("Bosh sahifaning ikki konsepsiyasi: yorug' va qulay «Tiniq» hamda to'q va premium «Anor». Bittasini tanlaysiz yoki ikkalasidan yig'amiz."),
    tag: uz("04.11.2026 · narxlarsiz, avval yo'lni tanlaymiz"),
    la: "1-konsepsiya · «Tiniq»",
    lb: "2-konsepsiya · «Anor»",
  },
  now: {
    kick: "Hozir nimani ko'ryapmiz".replace(/'/g, Q),
    h2: uz("Ilova allaqachon yangi. <em>Sayt undan eskiroq ko'rinadi.</em>"),
    cards: [
      ["Bosh sahifa", uz("Ketma-ket 7 ta banner, har birida birinchi darajali sarlavha. Qidiruv tizimi bitta o'rniga yettita asosiy mavzuni ko'radi.")],
      ["Menyu", uz("Ikki qavat: tepada 3 bo'lim va pastda 14 ta band. Kerakli xizmatni ko'z bilan qidirishadi.")],
      ["Sahifa og'irligi", uz("40 ta skript va 19 ta uslub fayli, rasmlarsiz faqat sahifa kodining o'zi 665 KB. Mobil internetda bu sezilarli.")],
      ["Chet eldan kirish", uz("Xorijiy manzillardan sayt «kirish taqiqlangan» deb javob beradi: bizda faqat bosh sahifa ochildi, rasm va uslublarsiz. Qidiruv tizimlari va chet eldagi Astrasend mijozlari saytni ko'ra oladimi, tekshirish kerak.")],
      ["Ilova", uz("App Store'da 4,7, 5 896 ta baho, yangi interfeys va «hammasi bitta ilovada». Sayt uni davom ettirmaydi.")],
      ["Nimani saqlaymiz", uz("Anor rangi, tojli belgi, Montserrat, Anor Black va Milliy kartalari, AnorEx, Anor Nasiya, 1290 raqami.")],
    ],
    note: uz("04.11.2026 da anorbank.uz bosh sahifasi va App Store'dagi ilova sahifasi bo'yicha tekshirildi."),
  },
  trends: {
    kick: "Banklar uchun 2026 trendlari",
    h2: uz("Saytdagi bank: <em>xotirjam, tushunarli, telefondan</em>"),
    cards: [
      ["Bannerlar o'rniga aniqlik".replace(/'/g, Q), uz("Kamroq slayd, ko'proq bo'sh joy, har blokda bitta harakat. Odam reklama uchun emas, ish uchun keladi.")],
      ["Avval telefon", uz("Tugmalar bosh barmoq ostida, pastki panel ilovadagidek, hech narsa qirqilmaydi.")],
      ["Ishonch ko'z oldida".replace(/'/g, Q), uz("Omonatlar kafolati, firibgarlar haqida eslatma va 1290 har bir sahifada, pastki qismda emas.")],
      ["«Nima kerakligini ayting»", uz("Menyudan qidirish o'rniga maslahatli qator va SI-yordamchi. Chat sizda allaqachon bor, uni oldinga chiqarish kerak.")],
      ["Va'dalar o'rniga kalkulyatorlar".replace(/'/g, Q), uz("Kredit to'lovi, omonat daromadi va muddatli to'lov ariza berishdan oldin darhol hisoblanadi.")],
      ["Tezlik va qulaylik", uz("Yengil sahifalar va WCAG standarti bo'yicha zaif ko'ruvchilar uchun versiya. Bu versiya sizda allaqachon bor.")],
    ],
    src: "2026 trendlari sharhlari: Digidop, RedSpider, Veza Digital, Seahawk Media.",
  },
  two: {
    kick: uz("Ikki yo'l"),
    h2: uz("Bunday qila olamiz, <em>bunday ham</em>"),
    a: [uz("«Tiniq»: bank bitta ekranda"), uz("Yorug' va xotirjam. Birinchi ekran «bugun nima qilamiz?» deb so'raydi va darhol xizmatga olib boradi. Har kungi mijozlar uchun.")],
    b: [uz("«Anor»: to'q premium"), uz("Hissiyot va brend. Sahifa aylantirilganda anor ochiladi, donalar xizmatlarga aylanadi. Reklama va premium kartalar uchun.")],
    mix: uz("Bittasini olish yoki ikkalasidan yig'ish mumkin: masalan, «Anor»ning birinchi ekrani va «Tiniq»ning kartochkalari."),
  },
  c1a: {
    kick: "1-konsepsiya · «Tiniq»",
    h2: "Bank bitta ekranda",
    lead: uz("Birinchi ekran reklama qilmaydi, balki so'raydi. Odam «Rossiyaga pul o'tkazish» deb yozadi yoki maslahatni bosadi va darhol xizmatga o'tadi."),
    pts: [uz("«Bugun nima qilamiz?» qatori va oltita maslahat: karta, mikroqarz, muddatli to'lov, omonat, AnorEx, o'tkazma"), uz("Anor Black kartasi va jonli belgilar: «komissiyasiz o'tkazma», «ayirboshlash 24/7»"), uz("Birinchi ekranda ishonch: App Store'da 4,7, omonatlarga 100% kafolat, 1290")],
  },
  c1b: {
    kick: "1-konsepsiya · «Tiniq»",
    h2: "Asosiysi <em>bitta ekranda</em>",
    lead: uz("Ketma-ket yettita banner o'rniga: mahsulotlar kartochkalarda, har birida bitta harakat."),
    pts: [uz("Mastercard Milliy: «oyiga 100 mln so'mgacha komissiyasiz o'tkazmalar»"), uz("Bir daqiqada 50 mln so'mgacha mikroqarz"), "Omonat kalkulyatori to‘g‘ridan-to‘g‘ri bosh sahifada", uz("Hamkorlar toifalari bo'yicha Anor Nasiya"), "Astrasend, AnorEx va firibgarlar haqida eslatma"],
  },
  c1c: {
    kick: "1-konsepsiya · «Tiniq» telefonda",
    h2: uz("Ilovadek, <em>faqat brauzerda</em>"),
    pts: [uz("Pastki panel: asosiy, kartalar, o'tkazmalar, omonatlar, yana"), uz("Maslahatlar bitta qatorda barmoq bilan suriladi"), uz("Har ekranda bitta kartochka, tugma doim ko'rinadi"), uz("Shrift 15 px dan kichik emas, yon tomonga aylantirishsiz")],
  },
  c2a: {
    kick: "2-konsepsiya · «Anor»",
    h2: uz("Bankdan kerak bo'lgan hammasi. <em>Bitta anorda.</em>"),
    lead: uz("Kinematografik birinchi ekran: ochilgan anor, donalar yoqutdek. Bu ekran reklama sifatida ham ishlaydi: uni bannerda va storisda tanishadi."),
    pts: [uz("Faktlar sarlavha ostida: 72 soatda karta, 50 mln gacha mikroqarz, App Store'da 4,7"), uz("Telefonda kompyuterdan qirqilgan emas, o'zining vertikal kadri"), uz("Ikki tugma: «Kartaga buyurtma» va «Ilovani yuklab olish»")],
  },
  c2b: {
    kick: "2-konsepsiya · «Anor»",
    h2: uz("Har bir dona <em>bu xizmat</em>"),
    lead: uz("Sahifa aylantirilganda anor ochiladi va donalar oltita kartochkaga aylanadi: kartalar, o'tkazmalar, omonatlar, mikroqarz, muddatli to'lov, AnorEx."),
    pts: [uz("Aylantirishga bog'langan sahna, lekin aylantirishni ushlab qolmaymiz: sahifa odatdagidek suriladi"), uz("Har bir kartochka ikki bosishda xizmatga olib boradi"), uz("To'q fonda shisha va yumshoq yorug'lik")],
  },
  c2c: {
    kick: "2-konsepsiya · «Anor»",
    h2: uz("Anor Premium: <em>yelpig'ich kartalar</em>"),
    lead: uz("Visa Infinite, Mastercard World Elite va Anor Black hamyondagidek yelpig'ich bo'lib turadi. Kursor kartani ko'taradi va asosiysini ko'rsatadi."),
    pts: ["Anor Premium konsyerj-servisi", "World Elite cheksiz imtiyozlari", uz("Anor Black: dunyoning 200 ta mamlakatida xaridlar")],
  },
  cmp: {
    kick: "Taqqoslash",
    h2: "Nimasi bilan farq qiladi",
    head: ["", "«Tiniq»", "«Anor»"],
    rows: [
      ["Kayfiyat", uz("Xotirjam, yorug', ishchan"), "Hissiyotli, premium, yorqin"],
      ["Birinchi ekran", "«Bugun nima qilamiz?» qatori va maslahatlar", "Ochilgan anor va yoqut donalar"],
      ["Kuchli tomoni", "Xizmatga tez yo‘l", "Brend birinchi qarashdan esda qoladi"],
      ["Kimga mos", uz("Har kungi mijozlar: karta, o'tkazma, muddatli to'lov"), "Reklama, premium kartalar, yosh auditoriya"],
      ["Ranglar", "Oq va sizning anor rangingiz #A30041", uz("Vino rangli fon va yonib turuvchi anor rangi")],
      ["Shriftlar", "Montserrat, hozirgidek, va Inter", "Unbounded va Inter"],
      ["Harakat", uz("Yumshoq paydo bo'lish, kalkulyator darhol javob beradi"), uz("Aylantirishdagi sahna, yelpig'ich kartalar")],
    ],
  },
  both: {
    kick: "Ikkala konsepsiyada",
    h2: uz("Har qanday tanlovda <em>saytga nima kiradi</em>"),
    cards: [
      ["SI-yordamchi", uz("Saytda chat sizda allaqachon bor: uni oldinga chiqaramiz, u javob beradi va arizaga olib boradi.")],
      ["Kalkulyatorlar", uz("Kredit, omonat va muddatli to'lov ariza berishdan oldin darhol hisoblanadi.")],
      ["Holatli ariza", uz("Mijoz ariza qoldirdi va u qaysi bosqichda ekanini ko'radi.")],
      ["Kurslar va AnorEx", uz("Jonli valyuta kurslari va ilovadagi ayirboshlashga o'tish.")],
      ["Filiallar va bankomatlar", uz("Xaritada, ish vaqti va yo'nalish bilan.")],
      ["Uch til", uz("Rus, o'zbek va ingliz tillari, sahifani yo'qotmasdan almashtirish.")],
      ["Zaif ko'ruvchilar uchun".replace(/'/g, Q), uz("Katta shrift, kontrast va WCAG standarti bo'yicha ekranni o'qish.")],
      ["«Biznesga» bo'limi".replace(/'/g, Q), uz("Yuridik shaxslar uchun o'sha uslub va o'sha mantiq.")],
    ],
    note: uz("Saytni sizning boshqaruv tizimingizda (hozir Bitrix) qoldirish yoki ko'chirish mumkin. Buni boshida birga hal qilamiz."),
  },
  steps: {
    kick: "Qanday ishlaymiz",
    h2: uz("Konsepsiyani tanlashdan <em>ishga tushirishgacha</em>"),
    cards: [
      [uz("Yo'lni tanlash"), uz("«Tiniq», «Anor» yoki ikkalasining aralashmasi.")],
      ["Prototip", uz("Bosh sahifa, karta, kredit va omonat: bu qanday ishlashi.")],
      ["Dizayn", uz("Barcha sahifalar va mobil versiya uch tilda.")],
      ["Ishlab chiqish", uz("Sahifalar, kalkulyatorlar, arizalar va sizning tizimlaringiz.")],
      ["Ishga tushirish", uz("Joriy saytni to'xtatmasdan, eski manzillardan yo'naltirish bilan.")],
    ],
    note: uz("Muddat va narxni konsepsiya va sahifalar ro'yxati tanlangandan keyin aytamiz."),
  },
  cta: {
    kick: "Keyingi qadam",
    h2: uz("Qaysi yo'l <em>sizga yaqinroq?</em>"),
    lead: uz("«Tiniq», «Anor» yoki har biridan nimani olishni yozing. Keyingi qadamda tanlangan konsepsiyani asosiy sahifalarga ochib beramiz."),
    rows: [["Sayt", "devuz.studio"], ["Telegram", "t.me/Devuz_studio_bot"], ["Aleksandr", "+998 90 912-05-78"], ["Yegor", "+7 923 233-00-37"]],
  },
};

const li = (xs) => `<ul class="pts">${xs.map((x) => `<li>${x}</li>`).join("")}</ul>`;
const cards = (xs) => xs.map(([b, p]) => `<div class="card"><b>${b}</b><p>${p}</p></div>`).join("");
const img = (L, f) => `img/${L}/${f}.jpg`;

function deck(L) {
  const t = T[L];
  let n = 0;
  const foot = (dark) => `<footer><img src="concepts/img/${dark ? "mark-white" : "mark-red"}.png" alt=""><b>${t.foot}</b><span class="n">${++n}</span></footer>`;
  const s = [];
  s.push(`<section class="slide cover"><div>
  <div class="logo"><img src="concepts/img/mark-red.png" alt="">ANORBANK</div>
  <div class="kick">${t.cover.kick}</div><h1>${t.cover.h1}</h1><p class="lead" style="margin-top:24px">${t.cover.lead}</p>
  <span class="tag">${t.cover.tag}</span></div>
  <div class="cv"><div class="br a"><img src="${img(L, "c1-d-hero")}" alt=""></div><span class="lab" style="top:-6px;left:24px">${t.cover.la}</span>
  <div class="br b"><img src="${img(L, "c2-d-hero")}" alt=""></div><span class="lab" style="top:250px;left:180px">${t.cover.lb}</span></div>${foot()}</section>`);
  s.push(`<section class="slide"><div class="kick">${t.now.kick}</div><h2>${t.now.h2}</h2><div class="grid3">${cards(t.now.cards)}</div>
  <p class="foot-note">${t.now.note}</p>${foot()}</section>`);
  s.push(`<section class="slide"><div class="kick">${t.trends.kick}</div><h2>${t.trends.h2}</h2><div class="grid3">${cards(t.trends.cards)}</div>
  <p class="src">${t.trends.src}</p>${foot()}</section>`);
  s.push(`<section class="slide"><div class="kick">${t.two.kick}</div><h2>${t.two.h2}</h2>
  <div class="two"><div class="opt"><div class="br"><img src="${img(L, "c1-d-hero")}" alt=""></div><h3>${t.two.a[0]}</h3><p>${t.two.a[1]}</p></div>
  <div class="opt"><div class="br" style="background:#120810"><img src="${img(L, "c2-d-hero")}" alt=""></div><h3>${t.two.b[0]}</h3><p>${t.two.b[1]}</p></div></div>
  <p class="foot-note">${t.two.mix}</p>${foot()}</section>`);
  s.push(`<section class="slide split"><div><div class="kick">${t.c1a.kick}</div><h2>${t.c1a.h2}</h2><p class="lead">${t.c1a.lead}</p>${li(t.c1a.pts)}</div>
  <div class="pic"><div class="br"><img src="${img(L, "c1-d-hero")}" alt=""></div><div class="ph" style="width:210px;right:-36px;bottom:-90px"><img src="${img(L, "c1-m-hero")}" alt=""></div></div>${foot()}</section>`);
  s.push(`<section class="slide split"><div><div class="kick">${t.c1b.kick}</div><h2>${t.c1b.h2}</h2><p class="lead">${t.c1b.lead}</p>${li(t.c1b.pts)}</div>
  <div class="pic"><div class="br"><img src="${img(L, "c1-d-bento")}" alt=""></div></div>${foot()}</section>`);
  s.push(`<section class="slide split"><div><div class="kick">${t.c1c.kick}</div><h2>${t.c1c.h2}</h2>${li(t.c1c.pts)}</div>
  <div class="pic" style="height:720px"><div class="ph" style="width:300px;left:90px;top:0"><img src="${img(L, "c1-m-hero")}" alt=""></div><div class="ph" style="width:300px;left:430px;top:60px"><img src="${img(L, "c1-m-bento")}" alt=""></div></div>${foot()}</section>`);
  s.push(`<section class="slide split rev dark"><div class="pic"><div class="br"><img src="${img(L, "c2-d-hero")}" alt=""></div><div class="ph" style="width:210px;right:-40px;bottom:-90px"><img src="${img(L, "c2-m-hero")}" alt=""></div></div>
  <div><div class="kick">${t.c2a.kick}</div><h2>${t.c2a.h2}</h2><p class="lead">${t.c2a.lead}</p>${li(t.c2a.pts)}</div>${foot(true)}</section>`);
  s.push(`<section class="slide split rev dark"><div class="pic"><div class="br"><img src="${img(L, "c2-d-seeds")}" alt=""></div></div>
  <div><div class="kick">${t.c2b.kick}</div><h2>${t.c2b.h2}</h2><p class="lead">${t.c2b.lead}</p>${li(t.c2b.pts)}</div>${foot(true)}</section>`);
  s.push(`<section class="slide split rev dark"><div class="pic"><div class="br"><img src="${img(L, "c2-d-prem")}" alt=""></div><div class="ph" style="width:200px;right:-40px;bottom:-110px"><img src="${img(L, "c2-m-seeds")}" alt=""></div></div>
  <div><div class="kick">${t.c2c.kick}</div><h2>${t.c2c.h2}</h2><p class="lead">${t.c2c.lead}</p>${li(t.c2c.pts)}</div>${foot(true)}</section>`);
  s.push(`<section class="slide"><div class="kick">${t.cmp.kick}</div><h2>${t.cmp.h2}</h2><table class="cmp"><tr>${t.cmp.head.map((h, i) => `<th${i === 2 ? ' class="c2"' : ""}>${h}</th>`).join("")}</tr>
  ${t.cmp.rows.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join("")}</tr>`).join("")}</table>${foot()}</section>`);
  s.push(`<section class="slide"><div class="kick">${t.both.kick}</div><h2>${t.both.h2}</h2><div class="grid4">${cards(t.both.cards)}</div>
  <p class="foot-note">${t.both.note}</p>${foot()}</section>`);
  s.push(`<section class="slide"><div class="kick">${t.steps.kick}</div><h2>${t.steps.h2}</h2><div class="steps">${cards(t.steps.cards)}</div>
  <p class="foot-note">${t.steps.note}</p>${foot()}</section>`);
  s.push(`<section class="slide"><div class="cta"><div><div class="kick">${t.cta.kick}</div><h2>${t.cta.h2}</h2><p class="lead">${t.cta.lead}</p></div>
  <div class="contacts">${t.cta.rows.map(([a, b]) => `<div><span>${a}</span><b>${b}</b></div>`).join("")}</div></div>${foot()}</section>`);
  return `<!doctype html><html lang="${L}"><head><meta charset="utf-8"><title>${t.title}</title>
<link rel="stylesheet" href="../fonts-anorbank.css"><link rel="stylesheet" href="deck.css"></head><body>
${s.join("\n")}
</body></html>`;
}

for (const L of ["ru", "uz"]) {
  writeFileSync(`${DIR}/anorbank-${L}.html`, deck(L));
  console.log(`anorbank-${L}.html`);
}
