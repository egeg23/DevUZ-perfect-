import type { LegalDoc } from "@/content/legal";
import type { Locale } from "@/lib/i18n";

/**
 * Лицензия на программный код из каталога.
 *
 * ВНИМАНИЕ, TODO(владелец): как и оферта, юристом не проверена. До первой
 * продажи готового кода её должен прочитать юрист — прежде всего раздел о
 * том, что покупателю запрещено: именно он отделяет «купил и пользуюсь» от
 * «купил и продаю то же самое рядом», и именно его формулировка решает,
 * можно ли будет что-то предъявить.
 *
 * Отдельный документ, а не раздел оферты, по двум причинам. Первая: оферта
 * покрывает и услуги разработки, где прав на чужой готовый код нет вовсе.
 * Вторая: лицензию читают после покупки и по конкретному поводу — «можно
 * ли поставить это второму клиенту», — и искать ответ в десятом разделе
 * договора никто не станет.
 *
 * Версия общая с офертой: они меняются вместе и принимаются одним
 * действием, поэтому две независимые версии означали бы, что покупатель
 * согласился с парой документов, которую нельзя восстановить целиком.
 */
export { OFFER_VERSION as LICENCE_VERSION } from "@/content/offer";

const ru: LegalDoc = {
  title: "Лицензия на программный код",
  updated: "Редакция от 10 сентября 2026 года",
  intro:
    "Этот документ описывает, что покупатель может делать с исходным кодом, купленным в каталоге DevUz Studio, и чего делать нельзя. Он является неотъемлемой частью Публичной оферты и принимается вместе с ней. Короткая версия: код ваш, пользуйтесь им в своих проектах сколько угодно, но не продавайте его как товар.",
  sections: [
    {
      heading: "1. Что вы получаете",
      body: [
        "Неисключительное право использовать исходный код бессрочно и на территории всего мира. Оплатив счёт, вы получаете это право навсегда: оно не заканчивается, не требует продления и не отзывается, если вы соблюдаете условия ниже.",
        "Право изменять код как угодно: дописывать, вырезать, переписывать, соединять со своим кодом. Изменённая версия принадлежит вам в части ваших изменений.",
        "Право запускать код в неограниченном числе собственных проектов и на неограниченном числе серверов — как своих, так и арендованных.",
        "Право передать код подрядчику, который работает над вашим проектом, — при условии, что он использует его только для вас и на тех же условиях.",
      ],
    },
    {
      heading: "2. Чего делать нельзя",
      body: [
        "Продавать, дарить или иначе передавать исходный код как самостоятельный товар — целиком или существенной частью. Это единственный запрет, ради которого существует весь документ: продукт продаётся многим покупателям, и каждая перепродажа обесценивает покупку всех остальных.",
        "Публиковать код в открытом доступе — в публичном репозитории, в составе открытого проекта, в обучающем материале с приложенными исходниками.",
        "Выдавать сублицензии, то есть передавать третьим лицам права по этому документу. Права получает покупатель, а не тот, кому он захочет их передать.",
        "Убирать из файлов сведения об авторстве, если они там есть.",
        "Запрет не мешает продавать продукт, сделанный на этом коде: сайт, приложение или сервис, где код работает внутри, — это ваш продукт, и распоряжаетесь им вы. Граница простая: покупатель платит вам за то, что код делает, а не за сам код.",
      ],
    },
    {
      heading: "3. Сколько компаний и проектов",
      body: [
        "Лицензия выдаётся одному юридическому лицу или индивидуальному предпринимателю — тому, на кого выставлен счёт. Дочерние и аффилированные компании считаются отдельными лицами, и им нужна своя лицензия.",
        "Число проектов внутри вашей компании не ограничено. Число внешних клиентов, которым вы делаете проекты на этом коде, тоже не ограничено — при условии, что вы продаёте им готовый продукт или работу, а не сам код.",
      ],
    },
    {
      heading: "4. Чужие компоненты внутри",
      body: [
        "В код входят библиотеки и компоненты с открытым исходным кодом. На них эта лицензия не распространяется — действуют их собственные условия, и мы не вправе их изменить.",
        "Список таких компонентов с указанием их лицензий передаётся вместе с кодом. Если какая-то из них накладывает обязательства на вас как на распространителя, это указано в списке отдельно.",
      ],
    },
    {
      heading: "5. Что передаётся вместе с кодом",
      body: [
        "Исходный код целиком, без вырезанных частей и без ограничителей, требующих связи с нашими серверами.",
        "Документация: как поднять, как настроить, из чего состоит, где что менять.",
        "Перечень внешних зависимостей и сервисов, без которых код не работает, с указанием того, какие из них платные.",
        "Кода, который требует подписки на что-либо у DevUz Studio, в каталоге нет. Купленный продукт продолжает работать, даже если студия прекратит существование.",
      ],
    },
    {
      heading: "6. Обновления и поддержка",
      body: [
        "Вы получаете ту версию продукта, которая актуальна на день оплаты. Последующие обновления не входят в цену, если это прямо не указано в счёте.",
        "Ошибки в переданной версии исправляются бесплатно в течение 30 календарных дней с момента передачи. Речь об ошибках в коде, а не о доработках под ваши задачи.",
        "Доработка под ваши задачи — отдельная работа по отдельному счёту. Это не отказ в помощи: цена продукта посчитана из того, что код передаётся как есть, и включать в неё неизвестный объём доработок означало бы поднять её для всех.",
      ],
    },
    {
      heading: "7. Гарантии и их пределы",
      body: [
        "Мы гарантируем, что код работает так, как описано в документации, и что мы вправе его вам передать.",
        "Мы не гарантируем, что код подойдёт под вашу конкретную задачу, если она отличается от описанной, и что он будет работать в среде, отличающейся от описанной в документации. Именно поэтому демонстрация продукта доступна до покупки — посмотрите её.",
        "Мы не отвечаем за убытки, возникшие от использования кода, сверх суммы, которую вы за него заплатили.",
      ],
    },
    {
      heading: "8. Прекращение",
      body: [
        "Право использовать код прекращается, только если нарушен раздел 2 — то есть если код продан, опубликован или сублицензирован. В этом случае лицензия прекращается с момента нарушения, а уплаченные деньги не возвращаются.",
        "Никакие другие обстоятельства — окончание поддержки, изменение каталога, прекращение работы студии — на ваше право использовать уже купленный код не влияют.",
      ],
    },
  ],
};

const en: LegalDoc = {
  title: "Source code licence",
  updated: "Version of 10 September 2026",
  intro:
    "This document sets out what a buyer may and may not do with source code purchased from the DevUz Studio catalogue. It forms an integral part of the Public Offer and is accepted together with it. The short version: the code is yours, use it in your own projects as much as you like, but do not sell it as a product.",
  sections: [
    {
      heading: "1. What you receive",
      body: [
        "A non-exclusive right to use the source code, perpetually and worldwide. Once the invoice is paid this right is yours for good: it does not expire, does not need renewal and is not revoked, provided you observe the conditions below.",
        "The right to modify the code in any way: extend it, cut it down, rewrite it, combine it with your own code. The modified version belongs to you as regards your changes.",
        "The right to run the code in an unlimited number of your own projects and on an unlimited number of servers, whether owned or rented.",
        "The right to hand the code to a contractor working on your project, provided they use it only for you and on the same terms.",
      ],
    },
    {
      heading: "2. What you may not do",
      body: [
        "Sell, give away or otherwise transfer the source code as a product in its own right — whole or in substantial part. This is the single prohibition the whole document exists for: the product is sold to many buyers, and every resale devalues everyone else’s purchase.",
        "Publish the code openly — in a public repository, as part of an open project, or in teaching material with the sources attached.",
        "Grant sublicences, that is, pass the rights under this document to third parties. The rights belong to the buyer, not to whomever the buyer chooses to pass them on to.",
        "Remove authorship notices from files where they are present.",
        "None of this prevents you from selling a product built on this code: a website, app or service with the code running inside it is your product and yours to dispose of. The line is simple: your customer pays you for what the code does, not for the code itself.",
      ],
    },
    {
      heading: "3. How many companies and projects",
      body: [
        "The licence is granted to one legal entity or individual entrepreneur — the one the invoice is issued to. Subsidiaries and affiliates count as separate entities and need their own licence.",
        "The number of projects within your company is unlimited. So is the number of external clients you build projects for using this code — provided you sell them a finished product or work, not the code itself.",
      ],
    },
    {
      heading: "4. Third-party components inside",
      body: [
        "The code includes open-source libraries and components. This licence does not extend to them — their own terms apply, and we are not entitled to change them.",
        "A list of such components with their licences is supplied with the code. Where one of them places obligations on you as a distributor, this is noted separately in the list.",
      ],
    },
    {
      heading: "5. What comes with the code",
      body: [
        "The complete source code, with no parts removed and no limiters requiring contact with our servers.",
        "Documentation: how to run it, how to configure it, what it consists of, where to change what.",
        "A list of external dependencies and services the code needs in order to work, with paid ones marked as such.",
        "The catalogue contains no code that requires a subscription to anything from DevUz Studio. A purchased product keeps working even if the studio ceases to exist.",
      ],
    },
    {
      heading: "6. Updates and support",
      body: [
        "You receive the version of the product current on the day of payment. Subsequent updates are not included in the price unless the invoice says otherwise.",
        "Defects in the delivered version are fixed free of charge within 30 calendar days of delivery. This means defects in the code, not adaptations to your requirements.",
        "Adaptation to your requirements is separate work under a separate invoice. This is not a refusal to help: the price is calculated on the basis that the code is delivered as is, and folding an unknown amount of adaptation into it would raise the price for everyone.",
      ],
    },
    {
      heading: "7. Warranties and their limits",
      body: [
        "We warrant that the code works as described in its documentation and that we are entitled to supply it to you.",
        "We do not warrant that the code will suit your particular task if it differs from the one described, nor that it will run in an environment differing from the one described in the documentation. That is precisely why a demonstration is available before purchase — look at it.",
        "We are not liable for losses arising from use of the code beyond the amount you paid for it.",
      ],
    },
    {
      heading: "8. Termination",
      body: [
        "The right to use the code terminates only if section 2 is breached — that is, if the code is sold, published or sublicensed. In that case the licence ends at the moment of breach and money paid is not refunded.",
        "No other circumstance — support ending, the catalogue changing, the studio ceasing to operate — affects your right to use code you have already bought.",
      ],
    },
  ],
};

const uz: LegalDoc = {
  title: "Dasturiy kod litsenziyasi",
  updated: "2026-yil 10-sentyabr tahriri",
  intro:
    "Ushbu hujjat DevUz Studio katalogidan sotib olingan manba kodi bilan xaridor nima qilishi mumkinligini va nima qilib bo‘lmasligini belgilaydi. U Ommaviy ofertaning ajralmas qismi bo‘lib, u bilan birga qabul qilinadi. Qisqacha: kod sizniki, o‘z loyihalaringizda xohlagancha foydalaning, lekin uni tovar sifatida sotmang.",
  sections: [
    {
      heading: "1. Siz nimani olasiz",
      body: [
        "Manba kodidan muddatsiz va butun dunyo hududida foydalanishning mutlaq bo‘lmagan huquqi. Hisobni to‘lagach, bu huquq sizda abadiy qoladi: u tugamaydi, uzaytirishni talab qilmaydi va quyidagi shartlarga rioya qilsangiz, qaytarib olinmaydi.",
        "Kodni xohlagancha o‘zgartirish huquqi: qo‘shish, olib tashlash, qayta yozish, o‘z kodingiz bilan birlashtirish. O‘zgartirilgan versiya o‘z o‘zgarishlaringiz qismida sizga tegishli.",
        "Kodni cheklanmagan sonli o‘z loyihalaringizda va cheklanmagan sonli serverlarda — o‘zingizniki bo‘lsin, ijaraga olingan bo‘lsin — ishga tushirish huquqi.",
        "Kodni loyihangiz ustida ishlayotgan pudratchiga berish huquqi — u faqat siz uchun va shu shartlarda foydalanishi sharti bilan.",
      ],
    },
    {
      heading: "2. Nima qilib bo‘lmaydi",
      body: [
        "Manba kodini mustaqil tovar sifatida — to‘liq yoki muhim qismini — sotish, sovg‘a qilish yoki boshqa yo‘l bilan berish. Butun hujjat shu yagona taqiq uchun mavjud: mahsulot ko‘p xaridorlarga sotiladi, va har bir qayta sotish qolganlarning xaridini qadrsizlantiradi.",
        "Kodni ochiq kirishda chop etish — ommaviy repozitoriyda, ochiq loyiha tarkibida yoki manba fayllari ilova qilingan o‘quv materialida.",
        "Sublitsenziya berish, ya’ni ushbu hujjat bo‘yicha huquqlarni uchinchi shaxslarga o‘tkazish. Huquqlarni xaridor oladi, u kimga bermoqchi bo‘lsa, o‘sha emas.",
        "Fayllardan mualliflik haqidagi ma’lumotlarni, agar ular mavjud bo‘lsa, olib tashlash.",
        "Bu taqiq ushbu kod asosida yaratilgan mahsulotni sotishga to‘sqinlik qilmaydi: kod ichida ishlaydigan sayt, ilova yoki xizmat — bu sizning mahsulotingiz va uni siz tasarruf etasiz. Chegara oddiy: xaridor sizga kod nima qilishi uchun to‘laydi, kodning o‘zi uchun emas.",
      ],
    },
    {
      heading: "3. Nechta kompaniya va loyiha",
      body: [
        "Litsenziya bitta yuridik shaxsga yoki yakka tartibdagi tadbirkorga — hisob kimga berilgan bo‘lsa, o‘shanga beriladi. Sho‘ba va affillangan kompaniyalar alohida shaxs hisoblanadi va ularga o‘z litsenziyasi kerak.",
        "Kompaniyangiz ichidagi loyihalar soni cheklanmagan. Ushbu kodda loyiha qilib berayotgan tashqi mijozlaringiz soni ham cheklanmagan — ularga tayyor mahsulot yoki ishni sotayotgan bo‘lsangiz, kodning o‘zini emas.",
      ],
    },
    {
      heading: "4. Ichidagi begona komponentlar",
      body: [
        "Kod tarkibiga ochiq manbali kutubxonalar va komponentlar kiradi. Ushbu litsenziya ularga tatbiq etilmaydi — ularning o‘z shartlari amal qiladi va biz ularni o‘zgartirishga haqli emasmiz.",
        "Bunday komponentlar ro‘yxati litsenziyalari ko‘rsatilgan holda kod bilan birga topshiriladi. Agar ulardan biri sizga tarqatuvchi sifatida majburiyat yuklasa, bu ro‘yxatda alohida qayd etiladi.",
      ],
    },
    {
      heading: "5. Kod bilan birga nima topshiriladi",
      body: [
        "Manba kodi to‘liq, kesib olingan qismlarsiz va bizning serverlarimiz bilan aloqani talab qiladigan cheklovchilarsiz.",
        "Hujjatlar: qanday ko‘tarish, qanday sozlash, nimalardan iborat, nimani qayerda o‘zgartirish.",
        "Kod ishlashi uchun zarur tashqi bog‘liqliklar va xizmatlar ro‘yxati, ulardan qaysilari pullik ekani ko‘rsatilgan holda.",
        "Katalogda DevUz Studio’dan biror obunani talab qiladigan kod yo‘q. Sotib olingan mahsulot studiya faoliyatini to‘xtatsa ham ishlashda davom etadi.",
      ],
    },
    {
      heading: "6. Yangilanishlar va qo‘llab-quvvatlash",
      body: [
        "Siz to‘lov kunida amalda bo‘lgan mahsulot versiyasini olasiz. Keyingi yangilanishlar, agar hisobda boshqacha ko‘rsatilmagan bo‘lsa, narxga kirmaydi.",
        "Topshirilgan versiyadagi xatolar topshirilgan paytdan 30 kalendar kun ichida bepul tuzatiladi. Gap koddagi xatolar haqida, sizning vazifalaringiz uchun qo‘shimcha ishlanmalar haqida emas.",
        "Sizning vazifalaringiz uchun ishlanma — alohida hisob bo‘yicha alohida ish. Bu yordamdan bosh tortish emas: mahsulot narxi kod qanday bo‘lsa shundayligicha topshirilishidan kelib chiqib hisoblangan, va unga noma’lum hajmdagi ishlanmalarni kiritish narxni hamma uchun oshirish demakdir.",
      ],
    },
    {
      heading: "7. Kafolatlar va ularning chegaralari",
      body: [
        "Biz kod o‘z hujjatlarida tasvirlanganidek ishlashini va uni sizga topshirishga haqli ekanimizni kafolatlaymiz.",
        "Agar vazifangiz tasvirlanganidan farq qilsa, kod aynan sizning vazifangizga mos kelishini, shuningdek hujjatlarda tasvirlangandan farq qiluvchi muhitda ishlashini kafolatlamaymiz. Aynan shu sababli mahsulot namoyishi sotib olishdan oldin ochiq — unga qarang.",
        "Koddan foydalanish natijasida yuzaga kelgan zararlar uchun siz to‘lagan summadan ortiq javob bermaymiz.",
      ],
    },
    {
      heading: "8. Tugatilishi",
      body: [
        "Koddan foydalanish huquqi faqat 2-bo‘lim buzilgan taqdirda — ya’ni kod sotilgan, chop etilgan yoki sublitsenziyalangan bo‘lsa — tugaydi. Bunday holda litsenziya buzilish paytidan tugaydi, to‘langan pul qaytarilmaydi.",
        "Boshqa hech qanday holat — qo‘llab-quvvatlashning tugashi, katalogning o‘zgarishi, studiya faoliyatining to‘xtashi — allaqachon sotib olingan koddan foydalanish huquqingizga ta’sir qilmaydi.",
      ],
    },
  ],
};

const zh: LegalDoc = {
  title: "源代码许可",
  updated: "2026 年 9 月 10 日版本",
  intro:
    "本文件规定购买方对自 DevUz Studio 目录购买的源代码可以做什么、不可以做什么。它是《公开要约》不可分割的组成部分，与之一并接受。简而言之：代码归您所有，可在自有项目中随意使用，但不得将其作为商品出售。",
  sections: [
    {
      heading: "1. 您获得什么",
      body: [
        "在全球范围内永久使用源代码的非独占权利。发票付清后，该权利即永久归您所有：不会到期，无需续期，只要您遵守以下条件即不会被撤销。",
        "以任何方式修改代码的权利：扩展、删减、重写、与您自己的代码合并。修改后的版本中，您所作的改动归您所有。",
        "在数量不限的自有项目中、在数量不限的服务器（自有或租用）上运行代码的权利。",
        "将代码交给为您项目工作的承包方的权利，条件是其仅为您使用并遵守相同条件。",
      ],
    },
    {
      heading: "2. 不得做什么",
      body: [
        "将源代码作为独立商品出售、赠送或以其他方式转让——无论全部还是实质部分。整份文件正是为这一条禁令而存在：产品面向众多买家销售，每一次转售都会贬损其他所有人的购买。",
        "公开发布代码——在公共代码库中、作为开源项目的一部分，或在附带源码的教学材料中。",
        "授予再许可，即将本文件项下的权利转予第三方。权利归购买方，而非购买方愿意转予的任何人。",
        "删除文件中已有的著作权署名信息。",
        "以上均不妨碍您销售基于本代码构建的产品：内部运行该代码的网站、应用或服务是您的产品，由您处分。界线很简单：您的客户为代码所实现的功能付费，而非为代码本身付费。",
      ],
    },
    {
      heading: "3. 多少家公司与项目",
      body: [
        "许可授予一个法人或个体工商户——即发票开具对象。子公司和关联公司视为独立主体，需各自取得许可。",
        "贵公司内部的项目数量不受限制。使用本代码为其构建项目的外部客户数量同样不受限制——前提是您向其销售的是成品或服务，而非代码本身。",
      ],
    },
    {
      heading: "4. 其中的第三方组件",
      body: [
        "代码中包含开源库与组件。本许可不适用于它们——适用其各自条款，我们无权变更。",
        "此类组件及其许可清单随代码一并提供。若其中某项对作为分发者的您设有义务，将在清单中单独注明。",
      ],
    },
    {
      heading: "5. 随代码一并交付的内容",
      body: [
        "完整源代码，无删减部分，无需与我方服务器通信的限制装置。",
        "文档：如何运行、如何配置、由哪些部分构成、在何处修改何内容。",
        "代码运行所需的外部依赖与服务清单，并标明其中哪些为付费项。",
        "目录中不含任何需要向 DevUz Studio 订阅的代码。即使工作室停止存在，已购产品仍可继续运行。",
      ],
    },
    {
      heading: "6. 更新与支持",
      body: [
        "您获得付款当日的现行产品版本。除发票另有说明外，后续更新不含在价格内。",
        "所交付版本中的缺陷在交付后 30 个日历日内免费修复。此处指代码缺陷，而非针对您需求的定制开发。",
        "针对您需求的定制开发属于另开发票的独立工作。这不是拒绝提供帮助：产品价格是按代码「照原样」交付计算的，将数量未知的定制开发计入其中会抬高所有人的价格。",
      ],
    },
    {
      heading: "7. 保证及其限度",
      body: [
        "我们保证代码按其文档描述运行，并保证我们有权向您提供该代码。",
        "若您的任务与所描述的不同，我们不保证代码适合该特定任务；亦不保证代码可在与文档所述不同的环境中运行。这正是购买前提供演示的原因——请先查看。",
        "对因使用代码而产生的损失，我们的责任不超过您为其支付的金额。",
      ],
    },
    {
      heading: "8. 终止",
      body: [
        "使用代码的权利仅在违反第 2 节时终止——即代码被出售、公开或再许可。此时许可自违约之时终止，已付款项不予退还。",
        "其他任何情形——支持结束、目录变更、工作室停止运营——均不影响您使用已购代码的权利。",
      ],
    },
  ],
};

export const licence: Record<Locale, LegalDoc> = { ru, en, uz, zh };
