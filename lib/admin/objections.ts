import { PROTOTYPE_HOURS } from "@/lib/admin/outreach";
import { LADDER, PROMO } from "@/lib/admin/mockup-offer";
import { ladderLines, partsLine, type CircleNiche, type IntroLang } from "@/lib/admin/sales-after-reply";

/**
 * Готовые ответы на возражения — правилами, без модели.
 *
 * Владелец, 17.10.2026: «Делаем все по твоим рекомендациям». Что пишут
 * клиенты после кружка и макета (разбор переписок 07–17.10.2026): «Какой
 * сайт?», «Что значит прототип?»; «сайтом не пользуемся, клиенты через
 * Инстаграм»; «у нас уже есть сайт»; «дорого», «есть намного дешевле»,
 * «Narhi qimmat ekan»; «передам руководству», «напишите нашему менеджеру»;
 * «Бесплатно?», «ты чё прикалываешься»; «я не перехожу по ссылкам».
 *
 * Где работает:
 * - в переписке модели до макета (untilMockup) у половины «new»: на
 *   распознанное возражение уходит готовый текст, модель в эту минуту
 *   молчит (outreach-talk-run → answerOne);
 * - у менеджера в карточке лида — кнопки «Ответы на возражения» рядом с
 *   ответом клиенту (components/admin/talk-chat.tsx): вставляют текст в
 *   поле, менеджер правит и отправляет. Для всех.
 *
 * Тексты — словами покупателя, коротко, без жаргона (jargonWords), без
 * длинных тире и штампов (plain-text), узбекский — латиницей. Это держит
 * tests/sales-after-reply.test.ts. Цены — из LADDER и PROMO.
 */

export const OBJECTIONS = ["what", "free", "no_links", "boss", "social", "have_site", "expensive"] as const;
export type Objection = (typeof OBJECTIONS)[number];

/**
 * Слова возражений. Порядок важен: «что за сайт, у нас уже есть» — сначала
 * вопрос «что это», «дорого, передам руководству» — сначала руководство.
 */
const WORDS: Readonly<Record<Objection, readonly RegExp[]>> = {
  what: [
    /как(?:ой|ом)\s+сайт/iu,
    /о\s+как(?:ом|ой)\s+(?:сайте|макете|прототипе)/iu,
    /что\s+(?:это|за\s+(?:сайт|макет|прототип|предложение))(?:[\s?!.]|$)/iu,
    /что\s+(?:значит|такое)\s+(?:прототип|макет)/iu,
    /(?:^|[^\p{L}])зачем\s+(?:это|мне|нам)(?:[\s?!.]|$)/iu,
    /в\s+ч[её]м\s+суть/iu,
    /qanday\s+sayt/iu,
    /bu\s+nima/iu,
    /nima\s+(?:degani|bu|gap)/iu,
    /(?:prototip|maket)\s+nima/iu,
    /what\s+(?:is\s+(?:this|it)|website)/iu,
  ],
  free: [
    /бесплатно\s*\?/iu,
    /(?:в\s+ч[её]м|где)\s+подвох/iu,
    /прикалыва/iu,
    /развод/iu,
    /шутите/iu,
    /(?<!\p{L})ии(?!\p{L})|нейросет|робот/iu,
    /bepul(?:mi)?\s*\?/iu,
    /tekin(?:mi)?\s*\?/iu,
    /aldov|hazil/iu,
  ],
  no_links: [
    /не\s+(?:перехож\p{L}*|открыва\p{L}*|хож\p{L}*)\s+по\s+ссылк/iu,
    /ссылк\p{L}*\s+не\s+(?:открыва|перехож)/iu,
    /havola\p{L}*\s+(?:ochmayman|o['ʻ‘`]?tmayman|ochmaymiz)/iu,
    /ssilka\p{L}*\s+(?:ochmayman|bosmayman)/iu,
  ],
  boss: [
    /переда(?:м|дим|ю|ла|л)\s+(?:\p{L}+\s+)?(?:руковод|директор|начальств|владел|шеф)/iu,
    /руковод\p{L}*\s+(?:реша|посмотр|ответ)/iu,
    /напишите\s+(?:\p{L}+\s+)?(?:менеджеру|директору|руководителю|админ\p{L}*)/iu,
    /(?:это|решает)\s+(?:не\s+ко\s+мне|не\s+я)/iu,
    /rahbar\p{L}*\s+(?:\p{L}+\s+)?(?:yetkaz|ayt|ko['ʻ‘`]?rsat|hal)/iu,
    /rahbariyat/iu,
    /direktor\p{L}*\s+bilan/iu,
  ],
  social: [
    /сайт\p{L}*\s+не\s+пользу/iu,
    /(?:через|в)\s+(?:инст\p{L}*|instagram|телеграм\p{L}*|telegram|тг)(?:[\s,.!?]|$)/iu,
    /инст\p{L}*\s+(?:хватает|достаточно)/iu,
    /sayt\p{L}*\s+(?:ishlatmaymiz|foydalanmaymiz)/iu,
    /(?:instagram|telegram|insta)\s+orqali/iu,
  ],
  have_site: [
    /(?:уже|у\s+нас)\s+есть\s+сайт/iu,
    /сайт\s+(?:уже\s+)?есть/iu,
    /зачем\s+(?:нам\s+)?(?:ещё|еще|новый|другой)/iu,
    /sayt(?:imiz)?\s+bor/iu,
  ],
  expensive: [
    /дорог/iu,
    /дешевл/iu,
    /qimmat/iu,
    /arzon/iu,
    /expensive|cheaper/iu,
  ],
};

/** Какое возражение в ответе клиента. null — не распознали, отвечает модель или человек. */
export function objectionOf(text: string): Objection | null {
  const body = text.trim();
  if (!body) return null;
  return OBJECTIONS.find((kind) => WORDS[kind].some((re) => re.test(body))) ?? null;
}

export type ObjectionContext = {
  lang: IntroLang;
  /** Хост сайта текстом; null — сайта нет. */
  host: string | null;
  niche: CircleNiche;
};

/** «Один пациент окупает…» — словами ниши, без чисел, которых нет в лесенке. */
const PAYBACK: Readonly<Record<CircleNiche, { ru: string; uz: string }>> = {
  general: { ru: "Сайт окупают один-два новых клиента", uz: "Saytni bir-ikki yangi mijoz qoplaydi" },
  medcentr: { ru: "Один новый пациент на обследование окупает сайт", uz: "Tekshiruvga kelgan bitta yangi bemor saytni qoplaydi" },
  stomatologiya: { ru: "Один пациент на имплант или брекеты окупает сайт целиком", uz: "Implant yoki breketga kelgan bitta bemor saytni to‘liq qoplaydi" },
  mebel: { ru: "Один заказ кухни или шкафа с сайта окупает его целиком", uz: "Saytdan kelgan bitta oshxona yoki shkaf buyurtmasi uni to‘liq qoplaydi" },
  restoran: { ru: "Один банкет, заказанный через сайт, окупает его", uz: "Sayt orqali buyurtma qilingan bitta banket uni qoplaydi" },
  "salon-krasoty": { ru: "Сайт окупают две-три новые постоянные клиентки", uz: "Saytni ikki-uchta yangi doimiy mijoz qoplaydi" },
  turagentstvo: { ru: "Один проданный тур окупает сайт", uz: "Bitta sotilgan tur saytni qoplaydi" },
  "uchebnyy-centr": { ru: "Один ученик на годовой курс окупает сайт", uz: "Yillik kursga yozilgan bitta o‘quvchi saytni qoplaydi" },
  nedvizhimost: { ru: "Одна сделка окупает сайт много раз", uz: "Bitta bitim saytni bir necha bor qoplaydi" },
};

/** Готовый ответ на возражение — на языке клиента. */
export function objectionReply(kind: Objection, ctx: ObjectionContext): string {
  const host = ctx.host;
  const uz = ctx.lang === "uz";
  const plus = uz ? "Qiziq bo‘lsa, «+» yuboring." : "Если интересно, отправьте «+».";
  const hours = PROTOTYPE_HOURS;
  switch (kind) {
    case "what":
      return uz
        ? host
          ? `Bu sizning saytingiz ${host} haqida: uni xaridor ko‘zi bilan ko‘rib chiqdik va ${hours} soatda yangi bosh sahifa maketini bepul tayyorlaymiz, solishtirib ko‘rasiz. ${plus}`
          : `Bu sizning kompaniyangiz haqida: ${hours} soatda sayt maketini bepul tayyorlaymiz, telefoningizda ko‘rib chiqasiz. ${plus}`
        : host
          ? `Это про ваш сайт ${host}: мы посмотрели его глазами покупателя и бесплатно соберём макет новой главной за ${hours} часов, чтобы вы сравнили. ${plus}`
          : `Это про вашу компанию: бесплатно соберём макет сайта за ${hours} часов, посмотрите с телефона. ${plus}`;
    case "free":
      return uz
        ? `Ha, bepul. Biz uchun ishni puldan oldin ko‘rsatish foydali: maket yoqsa, sayt haqida gaplashamiz, yoqmasa, hech narsa to‘lamaysiz. ${plus}`
        : `Да, бесплатно. Нам выгодно показать работу до денег: понравится макет, поговорим о сайте, нет, вы ничего не платите. ${plus}`;
    case "no_links":
      return uz
        ? `Tushunaman, notanish havolalarni ochmagan ma’qul. Maket tayyor bo‘lganda rasm qilib yuboraman. Qisqasi, unda: bosh sahifa, buyurtma tugmasi va aloqa ma’lumotlari birinchi ekranda, telefondan qulay. ${plus}`
        : `Понимаю, ссылки от незнакомых лучше не открывать. Когда макет будет готов, пришлю картинками. Если коротко, на нём главная, кнопка заказа и контакты сразу на первом экране, удобно с телефона. ${plus}`;
    case "boss": {
      const what = uz
        ? host
          ? `DevUz Studio ${host} uchun yangi sayt maketini ${hours} soatda bepul tayyorlaydi.`
          : `DevUz Studio kompaniyangiz uchun sayt maketini ${hours} soatda bepul tayyorlaydi.`
        : host
          ? `Студия DevUz бесплатно соберёт макет нового сайта ${host} за ${hours} часов.`
          : `Студия DevUz бесплатно соберёт макет сайта для вашей компании за ${hours} часов.`;
      return uz
        ? [
            "Rahmat! Iltimos, unga yuborib qo‘ying, qisqasi:",
            what,
            "Telefondan ko‘rsa bo‘ladi, hech narsaga majbur qilmaydi.",
            `Yoqsa: lending ${PROMO.landing.price} $ dan, to‘lov qismlarga bo‘lib.`,
          ].join("\n")
        : [
            "Спасибо! Перешлите ему, пожалуйста, вот коротко:",
            what,
            "Посмотреть можно с телефона, ни к чему не обязывает.",
            `Понравится: лендинг от ${PROMO.landing.price} $, оплата частями.`,
          ].join("\n");
    }
    case "social":
      return uz
        ? "Tushunaman, mijozlar Instagram va Telegramga yozadi. Unda sayt shart emas: Telegram-bot orqali yozilish yoki buyurtma, katalog va xaritadagi kartochka qilish mumkin. Bu Instagramdan tashqari qidiruvdan ham mijoz olib keladi."
        : "Понимаю, клиенты пишут в Инстаграм и Telegram. Тогда сайт и не нужен: можно сделать запись или заказ через Telegram-бота, каталог и карточку на картах. Это клиенты из поиска, сверх Инстаграма.";
    case "have_site":
      return uz
        ? `Yangi sayt shart emas. ${host ? `${host} saytidagi` : "Saytingizdagi"} murojaatlarni yo‘qotayotgan ${LADDER.fixes.count} ta xatoni ${LADDER.fixes.days} kunda tuzatamiz: ${LADDER.fixes.price} $. ${partsLine("uz")}`
        : `Новый сайт и не нужен. Исправим ${LADDER.fixes.count} ошибки, из-за которых ${host ? `сайт ${host}` : "сайт"} теряет обращения, за ${LADDER.fixes.days} дня: ${LADDER.fixes.price} $. ${partsLine("ru")}`;
    case "expensive": {
      const ladder = ladderLines(ctx.lang, Boolean(host)).join("; ");
      return uz
        ? `Nima bilan solishtiryapsiz? ${PAYBACK[ctx.niche].uz}. Kichikdan boshlash mumkin: ${ladder}. ${partsLine("uz")}`
        : `С чем сравниваете? ${PAYBACK[ctx.niche].ru}. Можно начать с малого: ${ladder}. ${partsLine("ru")}`;
    }
  }
}
