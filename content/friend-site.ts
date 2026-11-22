import type { Locale } from "@/lib/i18n";

/**
 * Страница «Приведи друга — сайт бесплатно» (/{язык}/friend) на шести языках
 * сайта. Цена — значком: её подставляет страница из FRIEND_GIFT_USD
 * (lib/partners/friend.ts), своих чисел здесь нет. Без длинных тире.
 */
export type FriendSite = {
  title: string;
  lead: (price: string) => string;
  stepsTitle: string;
  steps: (price: string) => string[];
  rulesTitle: string;
  rules: (price: string) => string[];
  cta: string;
  ctaNote: string;
};

export const FRIEND_PATH = "friend";

export const friendSite: Record<Locale, FriendSite> = {
  ru: {
    title: "Приведи друга и получи сайт бесплатно",
    lead: (p) => `Ваш друг заказал у нас сайт от ${p} и оплатил его: вам лендинг по нашему макету бесплатно. Без розыгрышей, сайт получает каждый.`,
    stepsTitle: "Как это работает",
    steps: (p) => [
      "Откройте бота студии и нажмите «Приведи друга»: бот пришлёт вашу ссылку и слово.",
      "Отправьте ссылку другу или скажите ему слово, пусть назовёт его менеджеру.",
      `Друг заказал сайт от ${p} и оплатил его целиком: вам сайт в подарок, бот напишет сам.`,
    ],
    rulesTitle: "Условия",
    rules: (p) => [
      "Один оплативший друг: один сайт. Друзей сколько угодно.",
      `Подарок: лендинг по нашему макету, без допов. Уже наш клиент? ${p} пойдут в зачёт вашего заказа.`,
      "Самого себя привести нельзя: тот же Telegram, телефон, сайт или компания не считаются.",
      "Друг, который уже был нашим клиентом, не считается. Сотрудники студии не участвуют.",
    ],
    cta: "Получить ссылку в Telegram",
    ctaNote: "Регистрация в боте одной кнопкой.",
  },
  uz: {
    title: "Do‘stingizni olib keling — saytni bepul oling",
    lead: (p) => `Do‘stingiz bizdan ${p} dan sayt buyurtma qilib to‘lasa: sizga maketimiz bo‘yicha landing bepul. Lotereya yo‘q, saytni har kim oladi.`,
    stepsTitle: "Qanday ishlaydi",
    steps: (p) => [
      "Studiya botini oching va «Do‘stni olib keling» tugmasini bosing: bot havolangiz va so‘zingizni yuboradi.",
      "Havolani do‘stingizga yuboring yoki so‘zni ayting, u menejerga aytsin.",
      `Do‘st ${p} dan sayt buyurtma qilib, to‘liq to‘lasa: sizga sayt sovg‘a, bot o‘zi yozadi.`,
    ],
    rulesTitle: "Shartlar",
    rules: (p) => [
      "Bitta to‘lagan do‘st: bitta sayt. Do‘stlar soni cheklanmagan.",
      `Sovg‘a: maketimiz bo‘yicha landing, qo‘shimchalarsiz. Allaqachon mijozimizmisiz? ${p} buyurtmangiz hisobiga o‘tadi.`,
      "O‘zingizni olib kelolmaysiz: bir xil Telegram, telefon, sayt yoki kompaniya hisoblanmaydi.",
      "Avval mijozimiz bo‘lgan do‘st hisoblanmaydi. Studiya xodimlari qatnashmaydi.",
    ],
    cta: "Telegramda havola olish",
    ctaNote: "Botda bitta tugma bilan ro‘yxatdan o‘tasiz.",
  },
  en: {
    title: "Refer a friend, get a website for free",
    lead: (p) => `Your friend orders a website from us from ${p} and pays for it: you get a landing page on our mockup for free. No lottery, everyone gets their site.`,
    stepsTitle: "How it works",
    steps: (p) => [
      "Open the studio bot and tap «Refer a friend»: the bot sends your link and your word.",
      "Send the link to your friend or tell them the word to give to our manager.",
      `Your friend orders a website from ${p} and pays in full: you get a website as a gift, the bot will tell you.`,
    ],
    rulesTitle: "Terms",
    rules: (p) => [
      "One paying friend: one website. Bring as many friends as you like.",
      `The gift: a landing page on our mockup, without extras. Already our client? ${p} goes towards your own order.`,
      "You cannot refer yourself: the same Telegram, phone, website or company does not count.",
      "A friend who was already our client does not count. Studio staff do not take part.",
    ],
    cta: "Get your link in Telegram",
    ctaNote: "Sign up in the bot with one tap.",
  },
  pl: {
    title: "Poleć znajomego, odbierz stronę za darmo",
    lead: (p) => `Znajomy zamawia u nas stronę od ${p} i ją opłaca: dostajesz landing page na naszej makiecie za darmo. Bez loterii, stronę dostaje każdy.`,
    stepsTitle: "Jak to działa",
    steps: (p) => [
      "Otwórz bota studia i naciśnij «Poleć znajomego»: bot wyśle Twój link i słowo.",
      "Wyślij link znajomemu albo podaj mu słowo, niech powie je menedżerowi.",
      `Znajomy zamawia stronę od ${p} i opłaca ją w całości: dostajesz stronę w prezencie, bot sam napisze.`,
    ],
    rulesTitle: "Warunki",
    rules: (p) => [
      "Jeden płacący znajomy: jedna strona. Znajomych bez limitu.",
      `Prezent: landing page na naszej makiecie, bez dodatków. Już jesteś klientem? ${p} zaliczamy na poczet Twojego zamówienia.`,
      "Nie możesz polecić samego siebie: ten sam Telegram, telefon, strona lub firma się nie liczą.",
      "Znajomy, który już był naszym klientem, się nie liczy. Pracownicy studia nie biorą udziału.",
    ],
    cta: "Odbierz link w Telegramie",
    ctaNote: "Rejestracja w bocie jednym przyciskiem.",
  },
  uk: {
    title: "Приведи друга й отримай сайт безкоштовно",
    lead: (p) => `Ваш друг замовив у нас сайт від ${p} і оплатив його: вам лендінг за нашим макетом безкоштовно. Без розіграшів, сайт отримує кожен.`,
    stepsTitle: "Як це працює",
    steps: (p) => [
      "Відкрийте бота студії й натисніть «Приведи друга»: бот надішле ваше посилання і слово.",
      "Надішліть посилання другові або скажіть йому слово, хай назве його менеджеру.",
      `Друг замовив сайт від ${p} і оплатив його повністю: вам сайт у подарунок, бот напише сам.`,
    ],
    rulesTitle: "Умови",
    rules: (p) => [
      "Один друг, що оплатив: один сайт. Друзів скільки завгодно.",
      `Подарунок: лендінг за нашим макетом, без доповнень. Уже наш клієнт? ${p} підуть у залік вашого замовлення.`,
      "Привести самого себе не можна: той самий Telegram, телефон, сайт чи компанія не рахуються.",
      "Друг, який уже був нашим клієнтом, не рахується. Співробітники студії не беруть участі.",
    ],
    cta: "Отримати посилання в Telegram",
    ctaNote: "Реєстрація в боті однією кнопкою.",
  },
  zh: {
    title: "推荐朋友,免费获得网站",
    lead: (p) => `您的朋友在我们这里订购 ${p} 起的网站并付款后,您将免费获得一个基于我们样稿的落地页。没有抽奖,人人都能拿到。`,
    stepsTitle: "如何参与",
    steps: (p) => [
      "打开工作室机器人,点击「推荐朋友」:机器人会发送您的链接和口令。",
      "把链接发给朋友,或告诉他口令,让他告诉经理。",
      `朋友订购 ${p} 起的网站并全额付款:网站作为礼物送给您,机器人会通知您。`,
    ],
    rulesTitle: "规则",
    rules: (p) => [
      "一位付款的朋友:一个网站。朋友数量不限。",
      `礼物:基于我们样稿的落地页,不含附加功能。已经是我们的客户?${p} 可抵扣您的订单。`,
      "不能推荐自己:相同的 Telegram、电话、网站或公司不计入。",
      "已经是我们客户的朋友不计入。工作室员工不参与。",
    ],
    cta: "在 Telegram 获取链接",
    ctaNote: "在机器人中一键注册。",
  },
};
