import type { LegalDoc } from "@/content/legal";
import type { Locale } from "@/lib/i18n";

/**
 * Публичная оферта.
 *
 * Текст написан по структуре, принятой для договоров оферты в Узбекистане,
 * и принят владельцем как есть 12 сентября 2026 года. Юрист его не читал —
 * это зафиксированный факт, а не недоделка: решение принято осознанно, и
 * записано оно здесь, чтобы следующий читатель не принял документ за
 * черновик и не начал дописывать его на свой вкус.
 *
 * Если дело дойдёт до спора, перечитывать в первую очередь разделы 3, 6 и
 * 7 — цену, возврат и ответственность. Оферта заключается без подписи, и
 * всё, чего в ней нет, толкуется не в пользу того, кто её составил.
 *
 * Версия документа хранится вместе с каждой заявкой. Иначе «покупатель
 * согласился с офертой» недоказуемо: текст на сайте меняется, а заявка
 * лежит с прошлого года, и какой именно редакции покупатель говорил «да»,
 * установить будет нечем.
 *
 * Меняя текст по существу — меняйте OFFER_VERSION. Дата в `updated`
 * показывается человеку, версия ложится в базу; расходиться они не должны,
 * это держит тест.
 */
export const OFFER_VERSION = "2026-09-10";

const ru: LegalDoc = {
  title: "Публичная оферта",
  updated: "Редакция от 10 сентября 2026 года",
  intro:
    "Это предложение заключить договор. Оно адресовано любому, кто оставляет заявку на сайте DevUz Studio. Отдельный документ подписывать не нужно: договор считается заключённым с момента, описанного в разделе «Как заключается договор». Прочитайте текст до того, как оставите заявку — после оплаты счёта он становится обязательным для обеих сторон.",
  sections: [
    {
      heading: "1. Кто и что предлагает",
      body: [
        "Исполнитель — индивидуальный предприниматель MAKSIMOV EGOR ANDREEVICH (DevUz Studio), Республика Узбекистан, город Ташкент. Реквизиты указаны в конце документа.",
        "Заказчик — юридическое лицо или индивидуальный предприниматель, оставивший заявку на сайте. Физическим лицам студия по этой оферте не продаёт: расчёты идут по счёту на банковский перевод.",
        "Предмет — разработка программного обеспечения по заданию заказчика (услуги) и передача прав на готовые программные продукты из каталога студии (лицензия). Условия использования готового кода описаны в отдельном документе — Лицензии на программный код, которая является неотъемлемой частью этой оферты.",
      ],
    },
    {
      heading: "2. Как заключается договор",
      body: [
        "Заявка на сайте — это запрос счёта, а не заключение договора. На этом этапе стороны ничем друг другу не обязаны, и заявку можно отозвать одним сообщением.",
        "Получив заявку, исполнитель выставляет счёт с указанием предмета, суммы и срока оплаты. Счёт действует 14 календарных дней, если в нём не указано иное.",
        "Договор считается заключённым в момент поступления оплаты на счёт исполнителя. Оплата счёта означает, что заказчик прочитал эту оферту и Лицензию на программный код и принимает их полностью и без оговорок.",
        "Если оплата поступила частично или после истечения срока действия счёта, исполнитель вправе либо принять её, подтвердив это письменно, либо вернуть в течение 10 банковских дней. Молчание согласием не считается.",
      ],
    },
    {
      heading: "3. Цена и оплата",
      body: [
        "Цены на сайте указаны в долларах США и являются ориентировочными: окончательная сумма фиксируется в счёте. Цена в каталоге не является публичной офертой в смысле статьи 369 Гражданского кодекса Республики Узбекистан — офертой является выставленный счёт.",
        "Оплата производится в сумах по курсу Центрального банка Республики Узбекистан на день выставления счёта, если в счёте не указано иное.",
        "Исполнитель не является плательщиком налога на добавленную стоимость. В счёте указывается «НДС не облагается».",
        "На каждый платёж оформляется электронный счёт-фактура (ЭСФ) в порядке, установленном законодательством. Для этого заказчик — юридическое лицо обязан сообщить свой ИНН до выставления счёта.",
        "Оплата наличными и в криптовалюте не принимается.",
      ],
    },
    {
      heading: "4. Сроки и передача результата",
      body: [
        "Срок выполнения работ указывается в счёте или в согласованном сторонами техническом задании и отсчитывается от даты поступления оплаты.",
        "Готовый продукт из каталога передаётся в течение 3 рабочих дней с момента оплаты — ссылкой на архив с исходным кодом и документацией. Ссылка действует ограниченное время и выдаётся повторно по запросу заказчика.",
        "Работы по заданию заказчика передаются по частям в согласованном порядке. Результат считается принятым, если заказчик не направил мотивированные замечания в течение 10 рабочих дней с момента передачи.",
        "Срок сдвигается на время, в течение которого исполнитель ждёт от заказчика данных, доступов или решений, без которых работа не может продолжаться. О таком ожидании исполнитель сообщает письменно.",
      ],
    },
    {
      heading: "5. Права на результат",
      body: [
        "Права на готовые продукты из каталога передаются на условиях Лицензии на программный код. Заказчик получает право использовать код, изменять его и запускать в своих проектах; перепродажа исходного кода как самостоятельного товара не допускается.",
        "Права на работы, выполненные по заданию заказчика, переходят к нему в объёме, указанном в счёте или техническом задании, после полной оплаты. До оплаты все права остаются у исполнителя.",
        "В код могут входить компоненты с открытым исходным кодом. На них действуют их собственные лицензии, и эта оферта их не отменяет и не изменяет. Перечень таких компонентов передаётся вместе с кодом.",
        "Исполнитель вправе указывать факт сотрудничества и общее описание задачи в своём портфолио. Коммерческие показатели, содержание переписки и данные, которые заказчик обозначил как конфиденциальные, не публикуются.",
      ],
    },
    {
      heading: "6. Возврат",
      body: [
        "До начала работ — заказчик вправе отказаться и получить всю сумму обратно в течение 10 банковских дней.",
        "После начала работ — возвращается сумма за вычетом стоимости фактически выполненного, подтверждённой переданными результатами.",
        "Готовый продукт из каталога после передачи ссылки на исходный код возврату не подлежит: код невозможно вернуть так, чтобы он перестал быть у заказчика. Это прямо соответствует статье 21 Закона Республики Узбекистан «О защите прав потребителей» в части товаров, не подлежащих возврату, и является причиной, по которой демонстрация продукта доступна до покупки.",
        "Если исполнитель не может передать оплаченный продукт — например, у продукта нет актуального релиза, — деньги возвращаются полностью в течение 10 банковских дней, независимо от того, сколько времени прошло с оплаты.",
      ],
    },
    {
      heading: "7. Ответственность",
      body: [
        "Исполнитель отвечает за то, что переданный код работает так, как описано в документации к нему. Ошибки, обнаруженные в течение 30 календарных дней с момента передачи, исправляются бесплатно.",
        "Исполнитель не отвечает за работу кода в среде заказчика, если она отличается от описанной в документации, за последствия изменений, внесённых заказчиком или третьими лицами, и за сбои сторонних сервисов, от которых код зависит.",
        "Размер ответственности исполнителя в любом случае ограничен суммой, фактически полученной от заказчика по конкретному счёту.",
        "Ни одна из сторон не отвечает за неисполнение, вызванное обстоятельствами непреодолимой силы, включая ограничения доступа к сети связи и решения государственных органов.",
      ],
    },
    {
      heading: "8. Данные и переписка",
      body: [
        "Обработка персональных данных описана в Политике конфиденциальности. Оставляя заявку, заказчик подтверждает, что ознакомлен с ней.",
        "Переписка в Telegram и по электронной почте с адресов, указанных сторонами, признаётся юридически значимой. Сообщение считается полученным в день отправки.",
        "Стороны обязуются не разглашать сведения, полученные друг от друга и обозначенные как конфиденциальные, в течение трёх лет после завершения работ.",
      ],
    },
    {
      heading: "9. Изменение оферты",
      body: [
        "Исполнитель вправе изменить текст оферты. Новая редакция действует с даты публикации на сайте и применяется к заявкам, поданным после неё.",
        "К уже заключённым договорам применяется та редакция, которая действовала на момент оплаты. Версия документа сохраняется вместе с заявкой, поэтому установить её можно точно.",
      ],
    },
    {
      heading: "10. Споры",
      body: [
        "Стороны разрешают разногласия переговорами. Претензия рассматривается в течение 15 календарных дней с момента получения.",
        "Если договориться не удалось, спор рассматривается в компетентном суде Республики Узбекистан по месту нахождения исполнителя. Применяется право Республики Узбекистан.",
      ],
    },
  ],
};

const en: LegalDoc = {
  title: "Public offer",
  updated: "Version of 10 September 2026",
  intro:
    "This is an offer to enter into a contract. It is addressed to anyone who submits a request on the DevUz Studio website. No separate document needs to be signed: the contract is concluded at the moment described in “How the contract is concluded”. Please read this text before submitting a request — once the invoice is paid it becomes binding on both parties.",
  sections: [
    {
      heading: "1. Who is offering what",
      body: [
        "The Contractor is individual entrepreneur MAKSIMOV EGOR ANDREEVICH (DevUz Studio), Republic of Uzbekistan, Tashkent. Full details are given at the end of this document.",
        "The Client is a legal entity or individual entrepreneur who submits a request on the website. The studio does not sell to private individuals under this offer: settlement is by bank transfer against an invoice.",
        "The subject is software development to the Client’s specification (services) and the transfer of rights to ready-made software products from the studio’s catalogue (licence). Terms of use for ready-made code are set out in a separate document — the Source Code Licence — which forms an integral part of this offer.",
      ],
    },
    {
      heading: "2. How the contract is concluded",
      body: [
        "A request on the website is a request for an invoice, not the conclusion of a contract. At this stage neither party owes the other anything, and a request can be withdrawn with a single message.",
        "On receiving a request, the Contractor issues an invoice stating the subject, the amount and the payment deadline. An invoice is valid for 14 calendar days unless stated otherwise.",
        "The contract is concluded when payment reaches the Contractor’s account. Paying the invoice means the Client has read this offer and the Source Code Licence and accepts them in full and without reservation.",
        "If payment arrives in part, or after the invoice has expired, the Contractor may either accept it and confirm this in writing, or return it within 10 banking days. Silence does not count as acceptance.",
      ],
    },
    {
      heading: "3. Price and payment",
      body: [
        "Prices on the website are given in US dollars and are indicative: the final amount is fixed in the invoice. A catalogue price is not a public offer within the meaning of Article 369 of the Civil Code of the Republic of Uzbekistan — the issued invoice is the offer.",
        "Payment is made in soum at the Central Bank of the Republic of Uzbekistan rate on the invoice date, unless the invoice states otherwise.",
        "The Contractor is not a VAT payer. Invoices are marked “VAT not applicable”.",
        "An electronic invoice (ESF) is issued for every payment as required by law. For this, a Client that is a legal entity must provide its taxpayer identification number before the invoice is issued.",
        "Payment in cash or in cryptocurrency is not accepted.",
      ],
    },
    {
      heading: "4. Deadlines and delivery",
      body: [
        "The delivery period is stated in the invoice or in the agreed specification and runs from the date payment is received.",
        "A ready-made product from the catalogue is delivered within 3 working days of payment, as a link to an archive containing the source code and documentation. The link is valid for a limited time and is reissued on request.",
        "Work to the Client’s specification is delivered in stages as agreed. A deliverable is deemed accepted if the Client raises no substantiated objections within 10 working days of delivery.",
        "Deadlines shift by the time the Contractor spends waiting for data, access or decisions from the Client without which work cannot continue. The Contractor gives written notice of such waiting.",
      ],
    },
    {
      heading: "5. Rights in the result",
      body: [
        "Rights to ready-made catalogue products are transferred under the Source Code Licence. The Client may use, modify and run the code in its own projects; reselling the source code as a product in its own right is not permitted.",
        "Rights to work performed to the Client’s specification pass to the Client, to the extent stated in the invoice or specification, upon payment in full. Until payment, all rights remain with the Contractor.",
        "The code may include open-source components. Their own licences apply, and this offer neither overrides nor modifies them. A list of such components is supplied with the code.",
        "The Contractor may state the fact of the engagement and a general description of the task in its portfolio. Commercial figures, the contents of correspondence, and anything the Client has marked confidential are not published.",
      ],
    },
    {
      heading: "6. Refunds",
      body: [
        "Before work begins — the Client may withdraw and receive the full amount back within 10 banking days.",
        "After work begins — the amount is returned less the value of work actually performed, evidenced by deliverables handed over.",
        "A ready-made catalogue product is non-refundable once the source-code link has been delivered: code cannot be returned in a way that removes it from the Client. This corresponds directly to Article 21 of the Law of the Republic of Uzbekistan “On protection of consumer rights” regarding non-returnable goods, and is the reason a demonstration is available before purchase.",
        "If the Contractor cannot deliver a paid product — for example, the product has no current release — the money is refunded in full within 10 banking days, however much time has passed since payment.",
      ],
    },
    {
      heading: "7. Liability",
      body: [
        "The Contractor is responsible for the delivered code working as described in its documentation. Defects found within 30 calendar days of delivery are fixed free of charge.",
        "The Contractor is not responsible for how the code behaves in the Client’s environment if it differs from the one described in the documentation, for the consequences of changes made by the Client or third parties, or for failures of third-party services the code depends on.",
        "The Contractor’s liability is in every case limited to the amount actually received from the Client under the particular invoice.",
        "Neither party is liable for non-performance caused by force majeure, including restrictions on network access and decisions of state authorities.",
      ],
    },
    {
      heading: "8. Data and correspondence",
      body: [
        "Processing of personal data is described in the Privacy Policy. By submitting a request the Client confirms having read it.",
        "Correspondence via Telegram and by email from the addresses given by the parties is legally significant. A message is deemed received on the day it is sent.",
        "The parties undertake not to disclose information received from each other and marked confidential for three years after the work is completed.",
      ],
    },
    {
      heading: "9. Changes to this offer",
      body: [
        "The Contractor may change the text of this offer. A new version takes effect on the date it is published on the website and applies to requests submitted after that date.",
        "Contracts already concluded are governed by the version in force at the time of payment. The document version is stored together with the request, so it can be established precisely.",
      ],
    },
    {
      heading: "10. Disputes",
      body: [
        "The parties resolve disagreements by negotiation. A claim is considered within 15 calendar days of receipt.",
        "Failing agreement, the dispute is heard by the competent court of the Republic of Uzbekistan at the Contractor’s location. The law of the Republic of Uzbekistan applies.",
      ],
    },
  ],
};

const uz: LegalDoc = {
  title: "Ommaviy oferta",
  updated: "2026-yil 10-sentyabr tahriri",
  intro:
    "Bu — shartnoma tuzish taklifi. U DevUz Studio saytida ariza qoldirgan har bir shaxsga qaratilgan. Alohida hujjat imzolash shart emas: shartnoma «Shartnoma qanday tuziladi» bo‘limida ko‘rsatilgan paytdan tuzilgan hisoblanadi. Matnni ariza qoldirishdan oldin o‘qing — hisob to‘langach, u ikkala tomon uchun majburiy bo‘ladi.",
  sections: [
    {
      heading: "1. Kim va nimani taklif qiladi",
      body: [
        "Ijrochi — yakka tartibdagi tadbirkor MAKSIMOV EGOR ANDREEVICH (DevUz Studio), O‘zbekiston Respublikasi, Toshkent shahri. Rekvizitlar hujjat oxirida keltirilgan.",
        "Buyurtmachi — saytda ariza qoldirgan yuridik shaxs yoki yakka tartibdagi tadbirkor. Ushbu oferta bo‘yicha studiya jismoniy shaxslarga sotmaydi: hisob-kitob bank o‘tkazmasi orqali amalga oshiriladi.",
        "Predmet — buyurtmachi topshirig‘i bo‘yicha dasturiy ta’minot ishlab chiqish (xizmatlar) va studiya katalogidagi tayyor dasturiy mahsulotlarga huquqlarni berish (litsenziya). Tayyor koddan foydalanish shartlari alohida hujjatda — Dasturiy kod litsenziyasida belgilangan, u ushbu ofertaning ajralmas qismidir.",
      ],
    },
    {
      heading: "2. Shartnoma qanday tuziladi",
      body: [
        "Saytdagi ariza — bu hisob so‘rovi, shartnoma tuzish emas. Bu bosqichda tomonlar bir-biriga hech narsa qarzdor emas va arizani bitta xabar bilan qaytarib olish mumkin.",
        "Arizani olgach, ijrochi predmet, summa va to‘lov muddati ko‘rsatilgan hisobni beradi. Hisob, agar unda boshqacha ko‘rsatilmagan bo‘lsa, 14 kalendar kun amal qiladi.",
        "Shartnoma to‘lov ijrochining hisobiga tushgan paytdan tuzilgan hisoblanadi. Hisobni to‘lash buyurtmachi ushbu ofertani va Dasturiy kod litsenziyasini o‘qib chiqqanini va ularni to‘liq, hech qanday izohsiz qabul qilishini bildiradi.",
        "Agar to‘lov qisman yoki hisob muddati tugagach tushsa, ijrochi uni yozma tasdiqlagan holda qabul qilishi yoki 10 bank kuni ichida qaytarishi mumkin. Sukut saqlash rozilik hisoblanmaydi.",
      ],
    },
    {
      heading: "3. Narx va to‘lov",
      body: [
        "Saytdagi narxlar AQSH dollarida ko‘rsatilgan va taxminiydir: yakuniy summa hisobda qayd etiladi. Katalogdagi narx O‘zbekiston Respublikasi Fuqarolik kodeksining 369-moddasi ma’nosida ommaviy oferta emas — oferta bu berilgan hisobdir.",
        "To‘lov, agar hisobda boshqacha ko‘rsatilmagan bo‘lsa, hisob berilgan kundagi O‘zbekiston Respublikasi Markaziy banki kursi bo‘yicha so‘mda amalga oshiriladi.",
        "Ijrochi qo‘shilgan qiymat solig‘i to‘lovchisi emas. Hisobda «QQS solinmaydi» deb ko‘rsatiladi.",
        "Har bir to‘lov uchun qonun hujjatlarida belgilangan tartibda elektron hisob-faktura (EHF) rasmiylashtiriladi. Buning uchun yuridik shaxs bo‘lgan buyurtmachi hisob berilgunga qadar o‘z STIRini bildirishi shart.",
        "Naqd pulda va kriptovalyutada to‘lov qabul qilinmaydi.",
      ],
    },
    {
      heading: "4. Muddatlar va natijani topshirish",
      body: [
        "Ishlarni bajarish muddati hisobda yoki tomonlar kelishgan texnik topshiriqda ko‘rsatiladi va to‘lov tushgan sanadan hisoblanadi.",
        "Katalogdagi tayyor mahsulot to‘lovdan keyin 3 ish kuni ichida — manba kodi va hujjatlari bo‘lgan arxivga havola tarzida topshiriladi. Havola cheklangan vaqt amal qiladi va buyurtmachi so‘roviga ko‘ra qayta beriladi.",
        "Buyurtmachi topshirig‘i bo‘yicha ishlar kelishilgan tartibda qismlarga bo‘lib topshiriladi. Agar buyurtmachi topshirilgan paytdan 10 ish kuni ichida asoslantirilgan e’tirozlar yubormasa, natija qabul qilingan hisoblanadi.",
        "Muddat ijrochi buyurtmachidan ma’lumot, ruxsat yoki qarorlarni kutgan vaqtga suriladi. Bunday kutish haqida ijrochi yozma xabar beradi.",
      ],
    },
    {
      heading: "5. Natijaga bo‘lgan huquqlar",
      body: [
        "Katalogdagi tayyor mahsulotlarga huquqlar Dasturiy kod litsenziyasi shartlarida beriladi. Buyurtmachi koddan foydalanish, uni o‘zgartirish va o‘z loyihalarida ishga tushirish huquqini oladi; manba kodini mustaqil tovar sifatida qayta sotishga yo‘l qo‘yilmaydi.",
        "Buyurtmachi topshirig‘i bo‘yicha bajarilgan ishlarga huquqlar to‘liq to‘lovdan so‘ng, hisobda yoki texnik topshiriqda ko‘rsatilgan hajmda unga o‘tadi. To‘lovgacha barcha huquqlar ijrochida qoladi.",
        "Kod tarkibiga ochiq manbali komponentlar kirishi mumkin. Ularga o‘z litsenziyalari amal qiladi va ushbu oferta ularni bekor qilmaydi hamda o‘zgartirmaydi. Bunday komponentlar ro‘yxati kod bilan birga topshiriladi.",
        "Ijrochi hamkorlik faktini va vazifaning umumiy tavsifini o‘z portfoliosida ko‘rsatishga haqli. Tijorat ko‘rsatkichlari, yozishmalar mazmuni va buyurtmachi maxfiy deb belgilagan ma’lumotlar chop etilmaydi.",
      ],
    },
    {
      heading: "6. Pulni qaytarish",
      body: [
        "Ishlar boshlangunga qadar — buyurtmachi voz kechib, butun summani 10 bank kuni ichida qaytarib olishga haqli.",
        "Ishlar boshlangach — topshirilgan natijalar bilan tasdiqlangan, amalda bajarilgan ish qiymati chegirib tashlangan holda qaytariladi.",
        "Katalogdagi tayyor mahsulot manba kodiga havola topshirilgandan keyin qaytarilmaydi: kodni buyurtmachida qolmaydigan qilib qaytarib bo‘lmaydi. Bu O‘zbekiston Respublikasining «Iste’molchilar huquqlarini himoya qilish to‘g‘risida»gi qonuni 21-moddasiga bevosita mos keladi va mahsulotni sotib olishdan oldin ko‘rish imkoni berilishining sababidir.",
        "Agar ijrochi to‘langan mahsulotni topshira olmasa — masalan, mahsulotning amaldagi relizi bo‘lmasa — to‘lovdan qancha vaqt o‘tganidan qat’i nazar, pul 10 bank kuni ichida to‘liq qaytariladi.",
      ],
    },
    {
      heading: "7. Javobgarlik",
      body: [
        "Ijrochi topshirilgan kod o‘z hujjatlarida tasvirlanganidek ishlashi uchun javob beradi. Topshirilgan paytdan 30 kalendar kun ichida aniqlangan xatolar bepul tuzatiladi.",
        "Ijrochi kodning buyurtmachi muhitidagi ishi uchun, agar u hujjatlarda tasvirlangandan farq qilsa, buyurtmachi yoki uchinchi shaxslar kiritgan o‘zgarishlar oqibatlari uchun va kod bog‘liq bo‘lgan uchinchi tomon xizmatlaridagi uzilishlar uchun javob bermaydi.",
        "Ijrochi javobgarligining miqdori har qanday holatda muayyan hisob bo‘yicha buyurtmachidan amalda olingan summa bilan cheklanadi.",
        "Tomonlarning hech biri yengib bo‘lmaydigan kuch holatlari, jumladan aloqa tarmog‘iga kirishning cheklanishi va davlat organlari qarorlari tufayli majburiyat bajarilmaganligi uchun javob bermaydi.",
      ],
    },
    {
      heading: "8. Ma’lumotlar va yozishmalar",
      body: [
        "Shaxsga doir ma’lumotlarni qayta ishlash Maxfiylik siyosatida tavsiflangan. Ariza qoldirar ekan, buyurtmachi u bilan tanishganini tasdiqlaydi.",
        "Tomonlar ko‘rsatgan manzillardan Telegram va elektron pochta orqali yozishma yuridik ahamiyatga ega deb tan olinadi. Xabar yuborilgan kunida olingan hisoblanadi.",
        "Tomonlar bir-biridan olingan va maxfiy deb belgilangan ma’lumotlarni ishlar tugagandan keyin uch yil davomida oshkor qilmaslik majburiyatini oladi.",
      ],
    },
    {
      heading: "9. Ofertani o‘zgartirish",
      body: [
        "Ijrochi oferta matnini o‘zgartirishga haqli. Yangi tahrir saytda chop etilgan sanadan amal qiladi va undan keyin berilgan arizalarga tatbiq etiladi.",
        "Tuzilgan shartnomalarga to‘lov paytida amalda bo‘lgan tahrir qo‘llaniladi. Hujjat versiyasi ariza bilan birga saqlanadi, shu sababli uni aniq belgilash mumkin.",
      ],
    },
    {
      heading: "10. Nizolar",
      body: [
        "Tomonlar kelishmovchiliklarni muzokaralar yo‘li bilan hal qiladi. Da’vo olingan paytdan 15 kalendar kun ichida ko‘rib chiqiladi.",
        "Kelishuvga erishilmasa, nizo ijrochining joylashgan yeri bo‘yicha O‘zbekiston Respublikasining vakolatli sudida ko‘rib chiqiladi. O‘zbekiston Respublikasi huquqi qo‘llaniladi.",
      ],
    },
  ],
};

const zh: LegalDoc = {
  title: "公开要约",
  updated: "2026 年 9 月 10 日版本",
  intro:
    "这是一份订立合同的要约，面向在 DevUz Studio 网站提交申请的任何人。无需另行签署文件：合同自「合同如何订立」一节所述时点起成立。请在提交申请前阅读本文——发票付款后，本文对双方均具有约束力。",
  sections: [
    {
      heading: "1. 要约主体与内容",
      body: [
        "服务方为个体工商户 MAKSIMOV EGOR ANDREEVICH（DevUz Studio），乌兹别克斯坦共和国塔什干市。详细信息见本文末尾。",
        "客户为在网站提交申请的法人或个体工商户。本要约不面向自然人销售：结算通过发票银行转账进行。",
        "标的为按客户要求开发软件（服务）以及转让工作室目录中现成软件产品的权利（许可）。现成代码的使用条件载于另一份文件《源代码许可》，该文件为本要约不可分割的组成部分。",
      ],
    },
    {
      heading: "2. 合同如何订立",
      body: [
        "网站上的申请是索取发票，而非订立合同。此阶段双方互不负有义务，申请可通过一条消息撤回。",
        "收到申请后，服务方开具载明标的、金额和付款期限的发票。除非另有说明，发票有效期为 14 个日历日。",
        "合同自款项到达服务方账户时成立。支付发票即表示客户已阅读本要约和《源代码许可》，并完全、无保留地予以接受。",
        "若款项部分支付或在发票失效后到账，服务方可书面确认后接受，或在 10 个银行工作日内退回。沉默不视为接受。",
      ],
    },
    {
      heading: "3. 价格与付款",
      body: [
        "网站价格以美元列示，仅供参考：最终金额以发票为准。目录价格不构成乌兹别克斯坦共和国民法典第 369 条意义上的公开要约——要约是已开具的发票。",
        "除发票另有说明外，付款以苏姆按发票开具之日乌兹别克斯坦共和国中央银行汇率进行。",
        "服务方非增值税纳税人。发票注明「不征收增值税」。",
        "每笔付款均按法律规定开具电子发票（ESF）。为此，作为法人的客户须在开票前提供其纳税人识别号。",
        "不接受现金和加密货币付款。",
      ],
    },
    {
      heading: "4. 期限与交付",
      body: [
        "履行期限载于发票或双方商定的技术任务书，自款项到账之日起算。",
        "目录中的现成产品在付款后 3 个工作日内交付——以包含源代码和文档的压缩包链接形式。链接有效期有限，可应客户要求重新签发。",
        "按客户要求进行的工作按约定分阶段交付。若客户在交付后 10 个工作日内未提出有理由的异议，则视为已验收。",
        "服务方等待客户提供数据、访问权限或决策而无法继续工作的时间，相应顺延期限。服务方就此类等待发出书面通知。",
      ],
    },
    {
      heading: "5. 成果权利",
      body: [
        "目录中现成产品的权利依《源代码许可》转让。客户有权在自有项目中使用、修改和运行代码；不得将源代码作为独立商品转售。",
        "按客户要求完成的工作，其权利在全额付款后按发票或技术任务书载明的范围转移给客户。付款前，全部权利归服务方所有。",
        "代码中可能包含开源组件。其自身许可继续适用，本要约不予取消或变更。此类组件清单随代码一并交付。",
        "服务方有权在其作品集中说明合作事实及任务的概括描述。商业数据、往来通信内容以及客户标注为保密的信息不予公开。",
      ],
    },
    {
      heading: "6. 退款",
      body: [
        "工作开始前——客户有权取消并在 10 个银行工作日内取回全部款项。",
        "工作开始后——扣除已交付成果所证明的实际完成部分价值后退还。",
        "目录中的现成产品在源代码链接交付后不予退款：代码无法以使其不再为客户所持有的方式退回。这直接对应乌兹别克斯坦共和国《消费者权益保护法》第 21 条关于不可退货商品的规定，也是购买前提供演示的原因。",
        "若服务方无法交付已付款的产品——例如该产品没有当前版本——无论距付款过去多久，均在 10 个银行工作日内全额退款。",
      ],
    },
    {
      heading: "7. 责任",
      body: [
        "服务方负责所交付代码按其文档描述运行。交付后 30 个日历日内发现的缺陷免费修复。",
        "若客户环境与文档描述不符，服务方不对代码在该环境中的表现负责；亦不对客户或第三方所作修改的后果，以及代码所依赖的第三方服务故障负责。",
        "服务方的责任在任何情况下均以就特定发票实际收到的客户款项为限。",
        "任何一方均不对不可抗力（包括通信网络访问限制和国家机关决定）导致的不履行承担责任。",
      ],
    },
    {
      heading: "8. 数据与通信",
      body: [
        "个人数据处理见《隐私政策》。提交申请即表示客户确认已阅读该政策。",
        "通过双方所提供地址进行的 Telegram 和电子邮件通信具有法律意义。消息于发送当日视为送达。",
        "双方承诺在工作完成后三年内，不披露自对方获得并标注为保密的信息。",
      ],
    },
    {
      heading: "9. 要约的变更",
      body: [
        "服务方有权变更本要约文本。新版本自在网站公布之日起生效，适用于其后提交的申请。",
        "已订立的合同适用付款时有效的版本。文件版本与申请一并保存，因此可以准确确定。",
      ],
    },
    {
      heading: "10. 争议",
      body: [
        "双方通过协商解决分歧。索赔自收到之日起 15 个日历日内处理。",
        "协商不成的，争议由服务方所在地的乌兹别克斯坦共和国主管法院审理。适用乌兹别克斯坦共和国法律。",
      ],
    },
  ],
};

export const offer: Record<Locale, LegalDoc> = { ru, en, uz, zh };
