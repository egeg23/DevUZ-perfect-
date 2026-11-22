import { defineDict } from "@/lib/admin/i18n";

/**
 * Вкладка «Друзья» (/admin/friends) у «Партнёров»: программа «Приведи друга —
 * сайт бесплатно» (lib/partners/friend.ts). Имена, ники и слова — данные, не
 * переводятся.
 */
export const friendsDict = defineDict({
  title: { ru: "Друзья", uz: "Do‘stlar", pl: "Znajomi" },
  intro: {
    ru: (price: number) =>
      `Программа «Приведи друга — сайт бесплатно». Участник — любой клиент или подписчик бота, кроме сотрудников. Друг заказал проект от ${price} $ и оплатил его целиком: участнику лендинг по нашему макету бесплатно, без допов, или ${price} $ в зачёт его собственного заказа. Один оплативший друг: один сайт. Денег и процента у участника нет.`,
    uz: (price: number) =>
      `«Do‘stni olib keling — sayt bepul» dasturi. Ishtirokchi: xodimlardan tashqari istalgan mijoz yoki bot obunachisi. Do‘st ${price} $ dan loyiha buyurtma qilib, to‘liq to‘lasa: ishtirokchiga maketimiz bo‘yicha landing bepul, qo‘shimchalarsiz, yoki ${price} $ uning buyurtmasi hisobiga. Bitta to‘lagan do‘st: bitta sayt. Ishtirokchida pul va foiz yo‘q.`,
    pl: (price: number) =>
      `Program «Poleć znajomego, strona za darmo». Uczestnik: każdy klient lub subskrybent bota, oprócz pracowników. Znajomy zamówił projekt od ${price} $ i opłacił go w całości: uczestnik dostaje landing page na naszej makiecie za darmo, bez dodatków, albo ${price} $ na poczet własnego zamówienia. Jeden płacący znajomy: jedna strona. Uczestnik nie ma pieniędzy ani procentu.`,
  },
  cardPeople: { ru: "Участников", uz: "Ishtirokchilar", pl: "Uczestników" },
  cardCame: { ru: "Друзей пришло", uz: "Kelgan do‘stlar", pl: "Przyszło znajomych" },
  cardOrdered: { ru: "Заказали", uz: "Buyurtma qildi", pl: "Zamówili" },
  cardSites: { ru: "Сайтов заработано", uz: "Ishlab topilgan saytlar", pl: "Zdobytych stron" },
  thWho: { ru: "Участник", uz: "Ishtirokchi", pl: "Uczestnik" },
  thWord: { ru: "Слово", uz: "So‘z", pl: "Słowo" },
  thCame: { ru: "Пришли", uz: "Keldi", pl: "Przyszli" },
  thOrdered: { ru: "Заказали", uz: "Buyurtma qildi", pl: "Zamówili" },
  thPaid: { ru: "Оплатили = сайтов", uz: "To‘ladi = saytlar", pl: "Zapłacili = stron" },
  thSince: { ru: "С какого дня", uz: "Qaysi kundan", pl: "Od kiedy" },
  empty: {
    ru: "Пока никого. Участники заводятся сами: кнопка «🎁 Приведи друга» в боте после макета или команда /friend.",
    uz: "Hozircha hech kim yo‘q. Ishtirokchilar o‘zlari qo‘shiladi: botda maketdan keyin «🎁 Do‘stni olib keling» tugmasi yoki /friend buyrug‘i.",
    pl: "Na razie nikogo. Uczestnicy dodają się sami: przycisk «🎁 Poleć znajomego» w bocie po makiecie albo komenda /friend.",
  },
  blocked: { ru: "заблокирован", uz: "bloklangan", pl: "zablokowany" },
  broadcastTitle: { ru: "Текст рассылки об акции", uz: "Aksiya haqida xabar matni", pl: "Tekst wysyłki o akcji" },
  broadcastNote: {
    ru: "Не отправлен. Владелец решает, когда отправлять: тогда текст уходит рассылкой «Пользователям бота» на «Главной».",
    uz: "Yuborilmagan. Qachon yuborishni egasi hal qiladi: shunda matn «Bosh sahifa»dagi «Bot foydalanuvchilariga» xabari bilan ketadi.",
    pl: "Nie wysłany. O terminie decyduje właściciel: wtedy tekst idzie wysyłką «Użytkownikom bota» na «Pulpit».",
  },
});
