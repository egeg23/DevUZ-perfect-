import type { InstantLocale } from "@/lib/proto/instant/types";

/**
 * «Приведи друга — сайт бесплатно» в боте студии: тексты на пяти языках бота
 * (язык выбирают в начале, lib/proto/instant/store, botLangOf). Числа
 * подставляет код: цена подарка и порог — FRIEND_GIFT_USD и FRIEND_MIN_USD
 * (lib/partners/friend.ts), своих чисел здесь нет.
 */

export type FriendNumbers = { came: number; ordered: number; paid: number };

export type FriendCopy = {
  button: string;
  intro: (o: { link: string; bot: string; word: string; price: number }) => string;
  stats: (n: FriendNumbers) => string;
  staffOnly: string;
  unavailable: string;
  partner: (word: string) => string;
  came: (who: string | null) => string;
  earned: (price: number) => string;
  shareButton: string;
  share: (o: { link: string; word: string }) => string;
};

const ru: FriendCopy = {
  button: "🎁 Приведи друга — сайт бесплатно",
  intro: ({ link, bot, word, price }) =>
    [
      "🎁 <b>Приведи друга и получи сайт бесплатно</b>",
      "",
      `Друг заказал у нас сайт от ${price} $ и оплатил его целиком: вам лендинг по нашему макету бесплатно. Если вы уже наш клиент, ${price} $ пойдут в зачёт вашего заказа.`,
      "Один оплативший друг: один сайт. Друзей сколько угодно, лотереи нет.",
      "",
      `Ваша ссылка на сайт: ${link}`,
      `Ссылка на бота: ${bot}`,
      `Или пусть друг назовёт слово <b>${word}</b> менеджеру.`,
    ].join("\n"),
  stats: ({ came, ordered, paid }) =>
    [
      "<b>Ваши друзья</b>",
      `Пришли: ${came}`,
      `Заказали: ${ordered}`,
      `Оплатили: ${paid}`,
      `Сайтов заработано: ${paid}`,
    ].join("\n"),
  staffOnly: "Сотрудники студии в программе «Приведи друга» не участвуют: ваши клиенты считаются в панели.",
  unavailable: "Сейчас не получается открыть программу. Попробуйте через пару минут: /friend",
  partner: (word) =>
    `Вы уже в партнёрской программе студии: с каждого заказа по вашей ссылке и слову ${word} вам процент деньгами. Ссылка и начисления: /ref`,
  came: (who) => `🎁 По вашей ссылке пришёл ${who ?? "новый друг"}. Закажет и оплатит сайт: вам сайт бесплатно. Прогресс: /friend`,
  earned: (price) =>
    `🎉 Ваш друг оплатил сайт, и вы заработали сайт бесплатно: лендинг по нашему макету или ${price} $ в зачёт вашего заказа. Менеджер напишет вам, чтобы начать. Прогресс: /friend`,
  shareButton: "Переслать другу",
  share: ({ link, word }) => `Заказываю сайты в DevUz Studio, макет собирают за 2 минуты прямо в боте. Попробуй: ${link} (или назови менеджеру слово ${word}).`,
};

const uz: FriendCopy = {
  button: "🎁 Do‘stni olib keling — sayt bepul",
  intro: ({ link, bot, word, price }) =>
    [
      "🎁 <b>Do‘stingizni olib keling va saytni bepul oling</b>",
      "",
      `Do‘stingiz bizdan ${price} $ dan sayt buyurtma qilib, to‘liq to‘lasa: sizga maketimiz bo‘yicha landing bepul. Agar siz allaqachon mijozimiz bo‘lsangiz, ${price} $ buyurtmangiz hisobiga o‘tadi.`,
      "Bitta to‘lagan do‘st: bitta sayt. Do‘stlar soni cheklanmagan, lotereya yo‘q.",
      "",
      `Saytga havolangiz: ${link}`,
      `Botga havola: ${bot}`,
      `Yoki do‘stingiz menejerga <b>${word}</b> so‘zini aytsin.`,
    ].join("\n"),
  stats: ({ came, ordered, paid }) =>
    [
      "<b>Do‘stlaringiz</b>",
      `Keldi: ${came}`,
      `Buyurtma qildi: ${ordered}`,
      `To‘ladi: ${paid}`,
      `Ishlab topilgan saytlar: ${paid}`,
    ].join("\n"),
  staffOnly: "Studiya xodimlari «Do‘stni olib keling» dasturida qatnashmaydi: mijozlaringiz panelda hisoblanadi.",
  unavailable: "Hozir dasturni ochib bo‘lmayapti. Bir necha daqiqadan keyin urinib ko‘ring: /friend",
  partner: (word) =>
    `Siz allaqachon studiyaning hamkorlik dasturidasiz: havolangiz va ${word} so‘zi bo‘yicha har bir buyurtmadan sizga pul ko‘rinishida foiz. Havola va hisob: /ref`,
  came: (who) => `🎁 Havolangiz orqali ${who ?? "yangi do‘st"} keldi. Sayt buyurtma qilib to‘lasa: sizga sayt bepul. Natija: /friend`,
  earned: (price) =>
    `🎉 Do‘stingiz saytni to‘ladi, siz bepul sayt ishlab topdingiz: maketimiz bo‘yicha landing yoki ${price} $ buyurtmangiz hisobiga. Boshlash uchun menejer sizga yozadi. Natija: /friend`,
  shareButton: "Do‘stga yuborish",
  share: ({ link, word }) => `DevUz Studio’da sayt buyurtma qilaman, maketni botda 2 daqiqada yig‘ishadi. Sinab ko‘r: ${link} (yoki menejerga ${word} so‘zini ayt).`,
};

const en: FriendCopy = {
  button: "🎁 Refer a friend, get a free website",
  intro: ({ link, bot, word, price }) =>
    [
      "🎁 <b>Refer a friend and get a website for free</b>",
      "",
      `Your friend orders a website from us from $${price} and pays it in full: you get a landing page on our mockup for free. If you are already our client, $${price} goes towards your own order.`,
      "One paying friend: one website. Bring as many friends as you like, no lottery.",
      "",
      `Your link to the site: ${link}`,
      `Link to the bot: ${bot}`,
      `Or your friend can tell the manager the word <b>${word}</b>.`,
    ].join("\n"),
  stats: ({ came, ordered, paid }) =>
    ["<b>Your friends</b>", `Came: ${came}`, `Ordered: ${ordered}`, `Paid: ${paid}`, `Websites earned: ${paid}`].join("\n"),
  staffOnly: "Studio staff do not take part in «Refer a friend»: your clients are counted in the panel.",
  unavailable: "The programme is not available right now. Please try again in a couple of minutes: /friend",
  partner: (word) =>
    `You are already in the studio partner programme: every order through your link and the word ${word} pays you a percentage in money. Link and earnings: /ref`,
  came: (who) => `🎁 ${who ?? "A new friend"} came through your link. If they order and pay for a website, you get a website for free. Progress: /friend`,
  earned: (price) =>
    `🎉 Your friend paid for a website, so you have earned a free one: a landing page on our mockup or $${price} towards your own order. A manager will message you to get started. Progress: /friend`,
  shareButton: "Send to a friend",
  share: ({ link, word }) => `I order websites from DevUz Studio, they build a mockup in 2 minutes right in the bot. Try it: ${link} (or tell the manager the word ${word}).`,
};

const ar: FriendCopy = {
  button: "🎁 ادعُ صديقًا واحصل على موقع مجانًا",
  intro: ({ link, bot, word, price }) =>
    [
      "🎁 <b>ادعُ صديقًا واحصل على موقع مجانًا</b>",
      "",
      `إذا طلب صديقك موقعًا منا بسعر يبدأ من ${price} $ ودفع ثمنه كاملًا، تحصل على صفحة هبوط بتصميمنا مجانًا. وإذا كنت عميلًا لدينا بالفعل، تُخصم ${price} $ من طلبك.`,
      "صديق واحد دفع: موقع واحد. ادعُ أي عدد من الأصدقاء، بلا سحب.",
      "",
      `رابطك إلى الموقع: ${link}`,
      `رابط البوت: ${bot}`,
      `أو ليذكر صديقك للمدير الكلمة <b>${word}</b>.`,
    ].join("\n"),
  stats: ({ came, ordered, paid }) =>
    ["<b>أصدقاؤك</b>", `جاؤوا: ${came}`, `طلبوا: ${ordered}`, `دفعوا: ${paid}`, `مواقع مكتسبة: ${paid}`].join("\n"),
  staffOnly: "موظفو الاستوديو لا يشاركون في برنامج «ادعُ صديقًا»: عملاؤك يُحتسبون في اللوحة.",
  unavailable: "تعذّر فتح البرنامج الآن. حاول بعد دقيقتين: /friend",
  partner: (word) =>
    `أنت بالفعل في برنامج شركاء الاستوديو: كل طلب عبر رابطك والكلمة ${word} يمنحك نسبة مالية. الرابط والأرباح: /ref`,
  came: (who) => `🎁 جاء ${who ?? "صديق جديد"} عبر رابطك. إذا طلب موقعًا ودفع ثمنه، تحصل على موقع مجانًا. التقدم: /friend`,
  earned: (price) =>
    `🎉 دفع صديقك ثمن موقع، فكسبت موقعًا مجانيًا: صفحة هبوط بتصميمنا أو ${price} $ تُخصم من طلبك. سيراسلك المدير للبدء. التقدم: /friend`,
  shareButton: "أرسل إلى صديق",
  share: ({ link, word }) => `أطلب المواقع من DevUz Studio، يصممون نموذجًا في دقيقتين داخل البوت. جرّب: ${link} (أو اذكر للمدير الكلمة ${word}).`,
};

const pl: FriendCopy = {
  button: "🎁 Poleć znajomego, strona za darmo",
  intro: ({ link, bot, word, price }) =>
    [
      "🎁 <b>Poleć znajomego i odbierz stronę za darmo</b>",
      "",
      `Znajomy zamawia u nas stronę od ${price} $ i opłaca ją w całości: dostajesz landing page na naszej makiecie za darmo. Jeśli już jesteś naszym klientem, ${price} $ zaliczamy na poczet Twojego zamówienia.`,
      "Jeden płacący znajomy: jedna strona. Znajomych bez limitu, bez loterii.",
      "",
      `Twój link do strony: ${link}`,
      `Link do bota: ${bot}`,
      `Albo niech znajomy poda menedżerowi słowo <b>${word}</b>.`,
    ].join("\n"),
  stats: ({ came, ordered, paid }) =>
    ["<b>Twoi znajomi</b>", `Przyszli: ${came}`, `Zamówili: ${ordered}`, `Zapłacili: ${paid}`, `Zdobyte strony: ${paid}`].join("\n"),
  staffOnly: "Pracownicy studia nie biorą udziału w programie «Poleć znajomego»: Twoi klienci liczą się w panelu.",
  unavailable: "Nie udało się teraz otworzyć programu. Spróbuj za kilka minut: /friend",
  partner: (word) =>
    `Jesteś już w programie partnerskim studia: z każdego zamówienia z Twojego linku i słowa ${word} dostajesz procent w pieniądzach. Link i naliczenia: /ref`,
  came: (who) => `🎁 Z Twojego linku przyszedł ${who ?? "nowy znajomy"}. Jeśli zamówi i opłaci stronę, dostajesz stronę za darmo. Postęp: /friend`,
  earned: (price) =>
    `🎉 Twój znajomy opłacił stronę, więc zdobywasz darmową: landing page na naszej makiecie albo ${price} $ na poczet Twojego zamówienia. Menedżer napisze, żeby zacząć. Postęp: /friend`,
  shareButton: "Wyślij znajomemu",
  share: ({ link, word }) => `Zamawiam strony w DevUz Studio, makietę robią w 2 minuty w bocie. Spróbuj: ${link} (albo podaj menedżerowi słowo ${word}).`,
};

const COPY: Record<InstantLocale, FriendCopy> = { ru, uz, en, ar, pl };

export function friendCopy(locale: InstantLocale | string | null | undefined): FriendCopy {
  return COPY[(locale ?? "ru") as InstantLocale] ?? ru;
}

export const FRIEND_COPY_LOCALES = Object.keys(COPY) as InstantLocale[];

/**
 * Текст рассылки подписчикам бота об акции. НЕ отправлен: владелец, 22.11.2026
 * — рассылку не делать, ждать его слова «отправляй». Показывается во вкладке
 * «Друзья», отправляют его руками рассылкой «Пользователям бота» на «Главной».
 */
export const FRIEND_BROADCAST = (price: number): string =>
  [
    "🎁 Приведи друга и получи сайт бесплатно",
    "",
    `Ваш друг заказал у нас сайт от ${price} $ и оплатил его: вам лендинг по нашему макету в подарок. Уже наш клиент? ${price} $ пойдут в зачёт вашего заказа.`,
    "Один оплативший друг: один сайт. Без розыгрышей и лотереи, сайт получает каждый.",
    "",
    "Ваша ссылка и слово для друга: /friend",
  ].join("\n");
