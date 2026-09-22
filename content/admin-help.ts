import { SECTIONS } from "@/lib/admin/roles";

/**
 * Инструкции к панели.
 *
 * Два языка, а не четыре, как у сайта: панелью пользуется команда, и языки
 * здесь те, на которых в команде говорят. Узбекский — латиницей, как везде
 * на сайте.
 *
 * Текст намеренно простой: короткие предложения, никаких слов вроде
 * «квалификация» и «атрибуция». Человек читает это один раз, в первый день,
 * и должен понять с первого раза.
 *
 * Разделы хранятся по адресу вкладки, а не списком: так проверка в тестах
 * сверяет их с настоящим меню (`SECTIONS`) и ловит вкладку, которую завели,
 * а описать забыли.
 */

export const HELP_LOCALES = ["ru", "uz"] as const;
export type HelpLocale = (typeof HELP_LOCALES)[number];

export function isHelpLocale(value: string | undefined): value is HelpLocale {
  return (HELP_LOCALES as readonly string[]).includes(value ?? "");
}

export const HELP_LOCALE_NAME: Record<HelpLocale, string> = {
  ru: "Русский",
  uz: "O‘zbekcha",
};

export type HelpEntry = {
  /** Что это за вкладка — одной-двумя фразами. */
  what: string;
  /** Что на ней делать по шагам. */
  how: string[];
};

export type HelpChannel = {
  name: string;
  /** Ссылка, если в канал можно войти самому. */
  url: string | null;
  what: string;
  how: string[];
};

export type HelpCopy = {
  title: string;
  lead: string;
  sectionsTitle: string;
  /** Ключ — адрес вкладки из меню. */
  sections: Record<string, HelpEntry>;
  ownerOnly: string;
  channelsTitle: string;
  channelsLead: string;
  channels: HelpChannel[];
  rulesTitle: string;
  rules: string[];
  askTitle: string;
  ask: string;
};

const BOT_URL = "https://t.me/Devuz_studio_bot";
/** Канал закрытый, публичного имени у него нет — только ссылка-приглашение. */
const SCOUT_URL = "https://t.me/+puC_Ns-kCbQ5NzJi";

const ru: HelpCopy = {
  title: "Инструкции",
  lead: "Коротко о том, что делает каждая вкладка и на что подписаться в Telegram. Прочитайте один раз в первый день.",

  sectionsTitle: "Вкладки",
  ownerOnly: "Видит только владелец",
  sections: {
    "/admin": {
      what: "Сюда приходят все обращения с сайта и из бота. Видно, кто написал, что ему нужно, какой бюджет и насколько срочно. Менеджер видит свободные и свои: взятый коллегой лид ему не показывается. Руководитель и владелец видят все.",
      how: [
        "Свободное обращение возьмите кнопкой «Взять». После этого оно ваше, и напоминания приходят вам.",
        "Контакт человека открывается отдельной кнопкой. Открывайте, когда собираетесь писать: это попадает в журнал.",
        "Поговорили — поменяйте статус: в работе, выиграли или потеряли. По статусам считается статистика.",
        "Не тянете лид — нажмите «Попросить передать», выберите коллегу и напишите причину. Лид остаётся у вас, пока руководитель или владелец не подтвердит.",
      ],
    },
    "/admin/orders": {
      what: "Заказы готовых продуктов из магазина: кто купил, на какую сумму, оплачено или нет.",
      how: [
        "Если суммы нет, проставьте её.",
        "Выставьте счёт — покупатель получит ссылку на оплату.",
        "Когда деньги пришли, отметьте оплату. Только после этого покупателю открываются файлы.",
      ],
    },
    "/admin/scout": {
      what: "Робот круглосуточно читает открытые чаты в Telegram и находит людей, которые ищут разработчика. Здесь видно, что он нашёл и работает ли он.",
      how: [
        "Смотрите найденное. Подходит — пишите человеку сами, со своего аккаунта.",
        "Если написано, что робот молчит или читает мало чатов, скажите владельцу.",
      ],
    },
    "/admin/prospect": {
      what: "Проверка чужих сайтов списком. Панель открывает каждый сайт, находит, что на нём не так, и пишет черновик первого сообщения.",
      how: [
        "Вставьте список сайтов, по одному в строке. Можно с названием компании рядом.",
        "Выберите язык письма и нажмите «Проверить».",
        "Прочитайте черновик, поправьте под человека и отправьте сами. Бот за вас не пишет.",
      ],
    },
    "/admin/candidates": {
      what: "Разбор резюме перед собеседованием. Загружаете PDF и пишете, на какую работу смотрим, — панель показывает вердикт, сильные стороны, стопы и вопросы, которые стоит задать.",
      how: [
        "Нужен PDF, из которого копируется текст. Скан страниц не прочитается — панель об этом скажет.",
        "Файл нигде не сохраняется: остаётся только разбор, и его можно убрать одной кнопкой.",
        "Возраст, пол и семейное положение в оценке не участвуют. Решение всё равно ваше: разбор — это подготовка к разговору, а не приговор.",
      ],
    },
    "/admin/talks": {
      what: "Разбор переписок с клиентами. Каждый затихший разговор читает вторая модель — не та, что его вела, — и говорит, что зацепило, на чём сорвалось и какой отсюда урок.",
      how: [
        "Разбор появляется сам, через час после последнего сообщения в переписке.",
        "Урок пишется только там, где клиент ответил хотя бы дважды: из одной реплики вывод сделать нельзя.",
        "Уроки пока копятся и в письма не подмешиваются — это включим отдельно, когда наберётся объём.",
      ],
    },
    "/admin/projects": {
      what: "Работа, о которой уже договорились: на какой стадии, до какого срока, на какую сумму.",
      how: [
        "Заведите проект, когда клиент согласился работать.",
        "В блоке «Деньги» стоит сумма по договору и платежи клиента.",
        "Стадию двигает владелец: это обещание клиенту, а не отметка о самочувствии.",
      ],
    },
    "/admin/stats": {
      what: "Сколько обращений пришло, сколько выиграли и потеряли. Менеджер видит свои цифры, руководитель — свои и своей команды.",
      how: ["Смотрите раз в неделю: по какой услуге приходят чаще и где теряете."],
    },
    "/admin/expenses": {
      what: "Общие траты студии и то, сколько из каждой пришлось на каждого соучредителя. Плюс налоговые сроки.",
      how: [
        "Записывать расходы могут оба соучредителя: выдуманный расход уменьшает долю самого записавшего, соврать себе в плюс нельзя.",
        "Удаляет только владелец — удалением можно убрать чужую трату из картины.",
        "Расход делится в той же пропорции, что и прибыль. Реклама на 100 долларов при делении 70/30 — это 70 владельцу и 30 руководителю.",
        "Себестоимость конкретного проекта сюда не идёт: она уже вычтена в самом проекте, и здесь вычлась бы второй раз.",
        "Налоговые сроки вверху — заготовка под разговор с бухгалтером. Пока дата не подтверждена, рядом с ней стоит об этом пометка.",
      ],
    },
    "/admin/contracts": {
      what: "Договор от нашего ИП в сторону заказчика: подготовка, подтверждение владельцем и его подпись.",
      how: [
        "Договор готовится в карточке проекта, когда сделка переходит в стадию «договор».",
        "Подготовить и проверить может любой из команды. Подтвердить — только владелец: подтверждение и есть момент, когда под документом появляется его подпись.",
        "У черновика подписи нет в документе физически, а не спрятана стилями. Распечатать черновик и выдать за подписанный не получится.",
        "Подтверждённый договор не правится. Нужна правка — готовится новый.",
        "Подпись владелец загружает один раз на этой странице: PNG с прозрачным фоном.",
      ],
    },
    "/admin/finance": {
      what: "Ваши деньги: сколько начислено, сколько ещё ждёт оплаты клиентом и сколько уже выплачено.",
      how: [
        "Начисление появляется, когда у проекта есть сумма и ответственный.",
        "Пока клиент не заплатил всю сумму, начисление стоит в заморозке — его видно, но оно не к выплате.",
        "Проценты и себестоимость ставит владелец.",
        "Расходы студии — реклама, сервисы, подрядчики — записывает владелец отдельным блоком. Себестоимость конкретного проекта туда не идёт: она уже вычтена в самом проекте.",
      ],
    },
    "/admin/partners": {
      what: "Люди, которые приводят клиентов по своей ссылке: их клиенты, проценты и заявки на выплату.",
      how: [
        "Партнёром человек становится сам: пишет боту /ref.",
        "Заявку на выплату решайте здесь: перевели деньги — нажмите «Выплачено».",
      ],
    },
    "/admin/team": {
      what: "Сотрудники: роли, грейды и кто чей руководитель. Здесь заводят нового человека и отключают ушедшего.",
      how: [
        "Нового заводят по числовому id в Telegram. Username не годится: его меняют за секунду.",
        "Грейд задаёт процент от прибыли по сделке.",
        "Руководитель проектов заводит менеджеров и высылает им приглашения. Роли, грейды, ставки и отключение остаются за владельцем — он их видит, но не правит.",
        "Заведённый руководителем менеджер сразу его. Ничьего менеджера руководитель берёт к себе кнопкой «взять к себе» — и дальше отвечает за его показатели и план/факт, ставит ему план касаний. Открепить менеджера или передать другому руководителю может только владелец.",
      ],
    },
    "/admin/releases": {
      what: "Файлы готовых продуктов, которые получают покупатели после оплаты.",
      how: ["Выкладывайте новую версию, когда продукт обновился."],
    },
    "/admin/proto": {
      what: "Прототип его будущего сайта: страница, которую вы отправляете ссылкой сразу после первички, пока разговор свежий. Он открывает её с телефона и видит свой бизнес, а не рассказ о том, как это могло бы выглядеть.",
      how: [
        "Вбейте адрес его сайта и выберите нишу. Название, описание, телефон, мессенджеры и логотип снимутся сами.",
        "Услуги впишите руками — по одной в строке, его словами. На сайте под заголовками обычно поисковый мусор, а в разговоре услуги названы верно.",
        "Цену ставьте только ту, что он назвал сам: после тире. Не назвал — оставьте строку без цены.",
        "Проверка не пройдена — прототип остаётся черновиком, и по ссылке будет 404. Почините то, что она написала, и соберите заново.",
        "Кнопка «Записаться» на прототипе открывает его телеграм или ватсап. Обращение падает ему — так он и убеждается, что это работает.",
        "После отправки смотрите, открыл ли он ссылку. Открыл и вернулся второй раз — звоните сегодня.",
      ],
    },
    "/admin/razbor": {
      what: "Разборы чужих сайтов, которые ночная смена написала и оставила на проверку. Опубликованный разбор уходит на сайт и в поиск сразу, без выкатки, и отозвать его оттуда нельзя.",
      how: [
        "Прочитайте обе статьи целиком — русскую и узбекскую. Они не перевод друг друга: это разные страницы под разные запросы.",
        "Проверьте, что компания нигде не названа: ни именем, ни адресом, ни на картинке.",
        "Сверьте числа с находками. Числа, которого нет в разборе, в тексте быть не должно.",
        "Не публикуем — впишите причину. Без неё смена вернётся к этому сайту снова.",
      ],
    },
    "/admin/audit": {
      what: "Кто что сделал в панели: взял лид, открыл контакт, подтвердил оплату. Записи нельзя изменить или удалить.",
      how: ["Сюда смотрят, когда надо разобраться, что произошло и когда."],
    },
    "/admin/help": {
      what: "Эта страница. Здесь коротко написано, что делает каждая вкладка, на что подписаться в Telegram и по каким правилам работаем.",
      how: [
        "Переключите язык ссылкой вверху, если так удобнее.",
        "Если чего-то здесь не хватает, скажите владельцу — допишем.",
      ],
    },
  },

  channelsTitle: "На что подписаться в Telegram",
  channelsLead: "Без этого панель работает, но вы будете узнавать о новом последним.",
  channels: [
    {
      name: "Бот студии",
      url: BOT_URL,
      what: "Главный бот. Через него вы входите в панель, получаете напоминания по своим лидам и берёте партнёрскую ссылку.",
      how: [
        "Откройте бота и нажмите «Старт».",
        "Напишите /login — придёт ссылка для входа в панель. Она работает один раз и живёт 15 минут.",
        "Напишите /ref, если хотите приводить клиентов и получать процент.",
        "Не отключайте звук: сюда приходят напоминания, а они и есть ваша память.",
      ],
    },
    {
      name: "Канал «Devuz Scout»",
      url: SCOUT_URL,
      what: "Сюда робот присылает людей, которые прямо сейчас ищут разработчика в открытых чатах. Каждое утро приходит короткий отчёт: работает ли робот и что нашёл за сутки.",
      how: [
        "Откройте ссылку и вступите в канал.",
        "Включите звук. Такие обращения живут час-два: кто написал первым, тот и говорит с клиентом.",
      ],
    },
    {
      name: "Чат отдела продаж",
      url: null,
      what: "Сюда падает короткая карточка по каждому новому обращению с сайта: что человеку нужно, какой бюджет, насколько срочно.",
      how: [
        "Попросите владельца добавить вас в чат.",
        "Карточку прочитали — идите в панель и возьмите лид на себя, чтобы двое не написали одному человеку.",
      ],
    },
  ],

  rulesTitle: "Три правила",
  rules: [
    "Клиенту пишет человек, а не бот. Бот только собирает и подсказывает.",
    "Взяли лид — ведите его. Не можете — верните в очередь или попросите передать коллеге.",
    "Что-то не работает или выглядит странно — скажите владельцу сразу, не ждите.",
  ],

  askTitle: "Не получается?",
  ask: "Напишите владельцу в Telegram. Лучше спросить, чем гадать: почти всё чинится за пять минут.",
};

const uz: HelpCopy = {
  title: "Yo‘riqnoma",
  lead: "Har bir bo‘lim nima qilishi va Telegramda nimaga obuna bo‘lish kerakligi haqida qisqacha. Birinchi kuni bir marta o‘qib chiqing.",

  sectionsTitle: "Bo‘limlar",
  ownerOnly: "Faqat egasi ko‘radi",
  sections: {
    "/admin": {
      what: "Saytdan va botdan kelgan barcha murojaatlar shu yerga tushadi. Kim yozgani, unga nima kerakligi, byudjeti va qanchalik shoshilinchligi ko‘rinadi. Menejer bo‘sh va o‘zinikini ko‘radi: hamkasb olgan lid unga ko‘rinmaydi. Rahbar va ega hammasini ko‘radi.",
      how: [
        "Bo‘sh murojaatni «Взять» tugmasi bilan o‘zingizga oling. Shundan keyin u sizniki, eslatmalar sizga keladi.",
        "Mijozning aloqa ma’lumoti alohida tugma bilan ochiladi. Yozmoqchi bo‘lganingizda oching: bu jurnalga yoziladi.",
        "Gaplashdingiz — holatini o‘zgartiring: ishdami, yutdingizmi yoki yo‘qotdingizmi. Statistika shu holatlar bo‘yicha hisoblanadi.",
        "Lidni uddalay olmasangiz — «Попросить передать» tugmasini bosing, hamkasbni tanlang va sababini yozing. Rahbar yoki ega tasdiqlamaguncha lid sizda qoladi.",
      ],
    },
    "/admin/orders": {
      what: "Do‘kondagi tayyor mahsulotlarga buyurtmalar: kim sotib olgani, qancha summaga, to‘langanmi yoki yo‘q.",
      how: [
        "Summa qo‘yilmagan bo‘lsa, qo‘ying.",
        "Hisob-faktura chiqaring — xaridor to‘lov havolasini oladi.",
        "Pul kelgach, to‘lovni belgilang. Fayllar xaridorga faqat shundan keyin ochiladi.",
      ],
    },
    "/admin/scout": {
      what: "Robot kechayu kunduz Telegramdagi ochiq chatlarni o‘qiydi va dasturchi qidirayotgan odamlarni topadi. Bu yerda u nima topgani va ishlayotgani ko‘rinadi.",
      how: [
        "Topilganlarni ko‘ring. Mos kelsa — odamga o‘zingiz, o‘z akkauntingizdan yozing.",
        "Robot jim turgani yoki kam chat o‘qiyotgani yozilgan bo‘lsa, egasiga ayting.",
      ],
    },
    "/admin/prospect": {
      what: "Begona saytlarni ro‘yxat bilan tekshirish. Panel har bir saytni ochadi, undagi kamchilikni topadi va birinchi xat qoralamasini yozib beradi.",
      how: [
        "Saytlar ro‘yxatini joylang, har biri alohida qatorda. Yoniga kompaniya nomini yozsa ham bo‘ladi.",
        "Xat tilini tanlang va «Проверить» tugmasini bosing.",
        "Qoralamani o‘qing, odamga moslab to‘g‘rilang va o‘zingiz yuboring. Bot siz uchun yozmaydi.",
      ],
    },
    "/admin/candidates": {
      what: "Suhbatdan oldin rezyumeni tahlil qilish. PDF yuklaysiz va qaysi ish uchun qarayotganingizni yozasiz — panel xulosa, kuchli tomonlar, to‘xtatuvchi belgilar va beriladigan savollarni ko‘rsatadi.",
      how: [
        "Matni nusxalanadigan PDF kerak. Sahifa skani o‘qilmaydi — panel buni aytadi.",
        "Fayl hech qayerda saqlanmaydi: faqat tahlil qoladi, uni bitta tugma bilan o‘chirsa bo‘ladi.",
        "Yosh, jins va oilaviy holat bahoda qatnashmaydi. Qaror baribir sizniki: tahlil — suhbatga tayyorgarlik, hukm emas.",
      ],
    },
    "/admin/talks": {
      what: "Mijozlar bilan yozishmalarning tahlili. Har bir tinchigan suhbatni ikkinchi model — uni olib borgani emas — o‘qiydi va nima ta’sir qilgani, nimada uzilgani va bundan qanday saboq borligini aytadi.",
      how: [
        "Tahlil o‘zi paydo bo‘ladi — yozishmadagi oxirgi xabardan bir soat o‘tgach.",
        "Saboq faqat mijoz kamida ikki marta javob bergan joyda yoziladi: bitta javobdan xulosa chiqarib bo‘lmaydi.",
        "Hozircha saboqlar faqat to‘planadi va xatlarga qo‘shilmaydi — buni keyinroq, hajm yig‘ilgach yoqamiz.",
      ],
    },
    "/admin/projects": {
      what: "Kelishib bo‘lingan ish: qaysi bosqichda, qaysi muddatga, qancha summaga.",
      how: [
        "Mijoz ishlashga rozi bo‘lgach, loyihani kiriting.",
        "«Деньги» blokida shartnoma summasi va mijoz to‘lovlari turadi.",
        "Bosqichni egasi o‘zgartiradi: bu mijozga berilgan va’da.",
      ],
    },
    "/admin/stats": {
      what: "Qancha murojaat kelgani, qanchasini yutgan va yo‘qotganingiz. Menejer o‘z raqamlarini, rahbar o‘zi va jamoasining raqamlarini ko‘radi.",
      how: ["Haftada bir marta qarang: qaysi xizmat bo‘yicha ko‘proq kelishadi va qayerda yo‘qotyapsiz."],
    },
    "/admin/expenses": {
      what: "Studiyaning umumiy xarajatlari va har biridan har bir muassisga qanchasi to‘g‘ri kelgani. Ustiga soliq muddatlari.",
      how: [
        "Xarajatni ikkala muassis ham yozishi mumkin: o‘ylab topilgan xarajat yozganning o‘z ulushini kamaytiradi, o‘ziga foydali yolg‘on gapirib bo‘lmaydi.",
        "O‘chirishni faqat ega qiladi — o‘chirish orqali birovning xarajatini manzaradan olib tashlash mumkin.",
        "Xarajat foyda bilan bir xil nisbatda bo‘linadi. 70/30 da 100 dollarlik reklama — egaga 70, rahbarga 30.",
        "Aniq loyihaning tannarxi bu yerga kirmaydi: u loyihaning o‘zida ayirilgan va bu yerda ikkinchi marta ayirilardi.",
        "Yuqoridagi soliq muddatlari — buxgalter bilan suhbat uchun qoralama. Sana tasdiqlanmagan bo‘lsa, yonida shu haqda belgi turadi.",
      ],
    },
    "/admin/contracts": {
      what: "Bizning YaTT nomidan buyurtmachi tomonga shartnoma: tayyorlash, ega tomonidan tasdiqlash va uning imzosi.",
      how: [
        "Shartnoma loyiha kartochkasida, bitim «shartnoma» bosqichiga o‘tganda tayyorlanadi.",
        "Tayyorlash va tekshirishni jamoadagi har kim qila oladi. Tasdiqlashni — faqat ega: tasdiqlash aynan hujjat ostida uning imzosi paydo bo‘ladigan payt.",
        "Qoralamada imzo hujjatda jismonan yo‘q, uslublar bilan yashirilgan emas. Qoralamani chop etib, imzolangan deb ko‘rsatib bo‘lmaydi.",
        "Tasdiqlangan shartnoma tahrirlanmaydi. Tuzatish kerak bo‘lsa — yangisi tayyorlanadi.",
        "Imzoni ega shu sahifada bir marta yuklaydi: shaffof fonli PNG.",
      ],
    },
    "/admin/finance": {
      what: "Sizning pulingiz: qancha hisoblangani, qanchasi hali mijoz to‘lovini kutayotgani va qanchasi to‘lab bo‘lingani.",
      how: [
        "Hisoblash loyihada summa va mas’ul bo‘lganda paydo bo‘ladi.",
        "Mijoz to‘liq to‘lamaguncha hisoblash muzlatilgan turadi — ko‘rinadi, lekin to‘lovga ketmaydi.",
        "Foizlarni va tannarxni egasi qo‘yadi.",
        "Studiyaning umumiy xarajatlarini — reklama, xizmatlar, pudratchilar — egasi alohida blokda yozadi. Aniq loyihaning tannarxi u yerga kirmaydi: u loyihaning o‘zida allaqachon ayirilgan.",
      ],
    },
    "/admin/partners": {
      what: "O‘z havolasi bilan mijoz olib keladigan odamlar: ularning mijozlari, foizlari va to‘lov so‘rovlari.",
      how: [
        "Odam hamkorga o‘zi aylanadi: botga /ref deb yozadi.",
        "To‘lov so‘rovini shu yerda hal qiling: pulni o‘tkazdingiz — «Выплачено» tugmasini bosing.",
      ],
    },
    "/admin/team": {
      what: "Xodimlar: rollari, darajalari va kim kimning rahbari. Yangi odam shu yerda kiritiladi, ketgani o‘chiriladi.",
      how: [
        "Yangi odam Telegramdagi raqamli id bo‘yicha kiritiladi. Username yaramaydi: uni bir soniyada almashtirish mumkin.",
        "Daraja bitim foydasidan tushadigan foizni belgilaydi.",
        "Loyihalar rahbari menejerlarni kiritadi va ularga taklifnoma yuboradi. Rollar, darajalar, stavkalar va o‘chirish egasida qoladi — u ularni ko‘radi, lekin o‘zgartirmaydi.",
        "Rahbar kiritgan menejer darhol unga biriktiriladi. Hech kimga biriktirilmagan menejerni rahbar «o‘zimga olish» tugmasi bilan oladi — shundan keyin uning ko‘rsatkichlari va reja/faktiga javob beradi, unga haftalik xatlar rejasini qo‘yadi. Menejerni ajratish yoki boshqa rahbarga o‘tkazishni faqat ega qila oladi.",
      ],
    },
    "/admin/releases": {
      what: "Xaridorlar to‘lovdan keyin oladigan tayyor mahsulot fayllari.",
      how: ["Mahsulot yangilangach, yangi versiyani joylang."],
    },
    "/admin/proto": {
      what: "Uning bo‘lajak saytining prototipi: birlamchi suhbatdan keyin darrov havola qilib yuboradigan sahifa. U telefonidan ochadi va o‘z biznesini ko‘radi, «qanday bo‘lishi mumkinligi» haqidagi gapni emas.",
      how: [
        "Uning sayt manzilini kiriting va nishani tanlang. Nomi, tavsifi, telefoni, messenjerlari va logotipi o‘zi olinadi.",
        "Xizmatlarni qo‘lda yozing — har qatorga bittadan, uning so‘zlari bilan. Saytdagi sarlavhalarda odatda qidiruv uchun yozilgan chiqindi bo‘ladi, suhbatda esa xizmatlar to‘g‘ri aytilgan.",
        "Narxni faqat u aytganini qo‘ying: tiredan keyin. Aytmagan bo‘lsa — qatorni narxsiz qoldiring.",
        "Tekshiruvdan o‘tmasa, prototip qoralama bo‘lib qoladi va havola 404 beradi. Yozilganini tuzating va qaytadan yig‘ing.",
        "Prototipdagi «Yozilish» tugmasi uning telegrami yoki vatsapini ochadi. Murojaat unga tushadi — shunda u buning ishlashiga ishonadi.",
        "Yuborgandan keyin havolani ochgan-ochmaganini kuzating. Ochib, ikkinchi marta qaytgan bo‘lsa — bugun qo‘ng‘iroq qiling.",
      ],
    },
    "/admin/razbor": {
      what: "Tungi smena yozib, tekshiruvga qoldirgan begona saytlar tahlili. Chop etilgan tahlil darhol saytga va qidiruvga chiqadi, uni ortga qaytarib bo‘lmaydi.",
      how: [
        "Ikkala maqolani ham to‘liq o‘qing — ruschasini ham, o‘zbekchasini ham. Ular bir-birining tarjimasi emas: bular turli so‘rovlar uchun turli sahifalar.",
        "Kompaniya hech qayerda nomlanmaganiga ishonch hosil qiling: na nomi, na manzili, na rasmda.",
        "Raqamlarni tahlil bilan solishtiring. Tahlilda yo‘q raqam matnda ham bo‘lmasligi kerak.",
        "Chop etmasangiz — sababini yozing. Usiz smena bu saytga yana qaytadi.",
      ],
    },
    "/admin/audit": {
      what: "Panelda kim nima qilgani: lidni oldi, aloqa ma’lumotini ochdi, to‘lovni tasdiqladi. Yozuvlarni o‘zgartirib ham, o‘chirib ham bo‘lmaydi.",
      how: ["Nima va qachon bo‘lganini aniqlash kerak bo‘lganda shu yerga qaraladi."],
    },
    "/admin/help": {
      what: "Shu sahifa. Bu yerda har bir bo‘lim nima qilishi, Telegramda nimaga obuna bo‘lish kerakligi va qanday qoidalar bilan ishlashimiz qisqacha yozilgan.",
      how: [
        "Shunday qulayroq bo‘lsa, yuqoridagi havola bilan tilni almashtiring.",
        "Bu yerda biror narsa yetishmasa, egasiga ayting — qo‘shib qo‘yamiz.",
      ],
    },
  },

  channelsTitle: "Telegramda nimaga obuna bo‘lish kerak",
  channelsLead: "Busiz ham panel ishlaydi, lekin yangiliklarni eng oxirida bilasiz.",
  channels: [
    {
      name: "Studiya boti",
      url: BOT_URL,
      what: "Asosiy bot. U orqali panelga kirasiz, o‘z lidlaringiz bo‘yicha eslatma olasiz va hamkorlik havolangizni olasiz.",
      how: [
        "Botni oching va «Start» tugmasini bosing.",
        "/login deb yozing — panelga kirish havolasi keladi. U bir marta ishlaydi va 15 daqiqa yashaydi.",
        "Mijoz olib kelib foiz olmoqchi bo‘lsangiz, /ref deb yozing.",
        "Ovozni o‘chirmang: eslatmalar shu yerga keladi, ular sizning xotirangiz.",
      ],
    },
    {
      name: "«Devuz Scout» kanali",
      url: SCOUT_URL,
      what: "Robot ochiq chatlarda hozir dasturchi qidirayotgan odamlarni shu yerga yuboradi. Har kuni ertalab qisqa hisobot keladi: robot ishlayaptimi va sutkada nima topdi.",
      how: [
        "Havolani oching va kanalga qo‘shiling.",
        "Ovozni yoqing. Bunday murojaatlar bir-ikki soat yashaydi: kim birinchi yozsa, mijoz bilan o‘sha gaplashadi.",
      ],
    },
    {
      name: "Sotuv bo‘limi chati",
      url: null,
      what: "Saytdan kelgan har bir yangi murojaat bo‘yicha qisqa kartochka shu yerga tushadi: odamga nima kerak, byudjeti qancha, qanchalik shoshilinch.",
      how: [
        "Egasidan sizni chatga qo‘shishni so‘rang.",
        "Kartochkani o‘qidingiz — panelga kiring va lidni o‘zingizga oling, aks holda bir odamga ikki kishi yozib yuboradi.",
      ],
    },
  ],

  rulesTitle: "Uchta qoida",
  rules: [
    "Mijozga bot emas, odam yozadi. Bot faqat yig‘adi va maslahat beradi.",
    "Lidni oldingizmi — olib boring. Uddalay olmasangiz, navbatga qaytaring yoki hamkasbga berishni so‘rang.",
    "Biror narsa ishlamasa yoki g‘alati ko‘rinsa — kutmasdan egasiga ayting.",
  ],

  askTitle: "Chiqmayaptimi?",
  ask: "Egasiga Telegramda yozing. Taxmin qilgandan ko‘ra so‘ragan yaxshi: deyarli hammasi besh daqiqada tuzatiladi.",
};

const copy: Record<HelpLocale, HelpCopy> = { ru, uz };

export function helpCopy(locale: HelpLocale): HelpCopy {
  return copy[locale];
}

/** Адреса вкладок в порядке меню — чтобы инструкция шла тем же порядком. */
export const HELP_ORDER: readonly string[] = SECTIONS.map((section) => section.href);
