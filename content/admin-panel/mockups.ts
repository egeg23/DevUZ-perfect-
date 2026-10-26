import { defineDict } from "@/lib/admin/i18n";

/**
 * Раздел «Макеты» (/admin/mockups): все макеты студии и пароль на сутки.
 *
 * Названия макетов и сайты клиентов — данные, они не переводятся. Текст,
 * который уходит клиенту, пишется на языке макета (lib/admin/mockups.ts,
 * clientMessage), а не на языке панели.
 */
export const mockupsDict = defineDict({
  title: { ru: "Макеты", uz: "Maketlar", pl: "Makiety" },
  intro: {
    ru: "Все макеты студии в одном списке: прототипы на devuz.studio и проекты витрины globalex. Клиенту уходят ссылка и пароль на сутки. «Сгенерировать пароль» каждый раз выдаёт новый, через 24 часа он перестаёт подходить, и макет у клиента закрывается.",
    uz: "Studiyaning barcha maketlari bitta ro‘yxatda: devuz.studio’dagi prototiplar va globalex vitrinasidagi loyihalar. Mijozga havola va bir sutkalik parol yuboriladi. «Parol yaratish» har safar yangi parol beradi, 24 soatdan keyin u yaramay qoladi va mijozda maket yopiladi.",
    pl: "Wszystkie makiety studia na jednej liście: prototypy na devuz.studio i projekty witryny globalex. Klient dostaje link i hasło na dobę. „Wygeneruj hasło” za każdym razem daje nowe, po 24 godzinach przestaje działać i makieta u klienta się zamyka.",
  },
  total: {
    ru: (n: number) => `Макетов: ${n}`,
    uz: (n: number) => `Maketlar: ${n}`,
    pl: (n: number) => `Makiet: ${n}`,
  },
  search: {
    ru: "Найти: название, сайт, ниша, ответственный или клиент",
    uz: "Qidirish: nom, sayt, nisha, mas’ul yoki mijoz",
    pl: "Szukaj: nazwa, strona, branża, odpowiedzialny lub klient",
  },
  filterAll: { ru: "Все", uz: "Hammasi", pl: "Wszystkie" },
  filterHand: { ru: "Сделаны вручную", uz: "Qo‘lda yig‘ilgan", pl: "Zrobione ręcznie" },
  filterUnsent: { ru: "Не отправлены", uz: "Yuborilmagan", pl: "Niewysłane" },
  filterShowcase: { ru: "Витрина", uz: "Vitrina", pl: "Witryna" },
  empty: { ru: "Ничего не нашлось.", uz: "Hech narsa topilmadi.", pl: "Nic nie znaleziono." },
  niche: { ru: "Ниша", uz: "Nisha", pl: "Branża" },
  made: { ru: "Сделан", uz: "Yaratilgan", pl: "Zrobiona" },
  tagShowcase: { ru: "витрина", uz: "vitrina", pl: "witryna" },
  accessOpen: { ru: "открыт по ссылке", uz: "havola orqali ochiq", pl: "otwarta przez link" },
  accessClosed: { ru: "по паролю", uz: "parol bilan", pl: "na hasło" },
  accessPublic: { ru: "открыт всем", uz: "hammaga ochiq", pl: "otwarta dla wszystkich" },
  openFor: {
    ru: (h: number) => `открыт ещё ${h} ч, потом по паролю`,
    uz: (h: number) => `yana ${h} soat ochiq, keyin parol bilan`,
    pl: (h: number) => `otwarta jeszcze ${h} godz., potem na hasło`,
  },
  closedSince: {
    ru: (time: string) => `закрыт паролем с ${time}`,
    uz: (time: string) => `${time} dan parol bilan yopiq`,
    pl: (time: string) => `zamknięta na hasło od ${time}`,
  },
  closedAuto: {
    ru: (time: string) => `закрыт паролем с ${time}: прошло 24 часа`,
    uz: (time: string) => `${time} dan parol bilan yopiq: 24 soat o‘tdi`,
    pl: (time: string) => `zamknięta na hasło od ${time}: minęły 24 godziny`,
  },
  ownPromo: {
    ru: (price: number, regular: number) => `акция 48 ч: ${price} $ вместо ${regular} $`,
    uz: (price: number, regular: number) => `48 soatlik aksiya: ${price} $ (odatda ${regular} $)`,
    pl: (price: number, regular: number) => `promocja 48 godz.: ${price} $ zamiast ${regular} $`,
  },
  liveUntil: {
    ru: (time: string) => `пароль клиента до ${time}`,
    uz: (time: string) => `mijoz paroli ${time} gacha`,
    pl: (time: string) => `hasło klienta do ${time}`,
  },
  opens: {
    ru: (n: number) => `клиент открывал: ${n}`,
    uz: (n: number) => `mijoz ochgan: ${n} marta`,
    pl: (n: number) => `otwarcia klienta: ${n}`,
  },
  owner: { ru: "Ответственный", uz: "Mas’ul", pl: "Odpowiedzialny" },
  ownerNone: { ru: "не назначен", uz: "tayinlanmagan", pl: "nie wyznaczono" },
  ownerAuto: {
    ru: (name: string, from: string) => `${name} (${from})`,
    uz: (name: string, from: string) => `${name} (${from})`,
    pl: (name: string, from: string) => `${name} (${from})`,
  },
  ownerFrom_set: { ru: "назначен", uz: "tayinlangan", pl: "wyznaczony" },
  ownerFrom_order: { ru: "по заказу", uz: "buyurtma bo‘yicha", pl: "według zlecenia" },
  ownerFrom_lead: { ru: "по лиду", uz: "lid bo‘yicha", pl: "według leada" },
  ownerFrom_touch: { ru: "по касанию", uz: "aloqa bo‘yicha", pl: "według kontaktu" },
  ownerFrom_made: { ru: "собрал", uz: "yig‘gan", pl: "zbudował" },
  sentAt: {
    ru: (time: string) => `отправлен клиенту ${time}`,
    uz: (time: string) => `mijozga ${time} da yuborilgan`,
    pl: (time: string) => `wysłana klientowi ${time}`,
  },
  notSent: { ru: "клиенту не отправлен", uz: "mijozga yuborilmagan", pl: "nie wysłano klientowi" },
  // Витрина открыта всем — «не отправлен» у неё не тревога, а просто факт.
  notSentShowcase: { ru: "с рабочих аккаунтов не отправляли", uz: "ish akkauntlaridan yuborilmagan", pl: "nie wysyłano z kont roboczych" },
  /** Кому и с какого аккаунта ушёл (mockupSends): каждая отправка строкой. */
  sendsTitle: { ru: "Кому ушёл", uz: "Kimga yuborilgan", pl: "Do kogo wysłano" },
  /**
   * С какого рабочего аккаунта: `null` — главный, пусто — аккаунта в базе
   * уже нет. Название и ник — как в «Аккаунтах», не переводятся.
   */
  sendFrom: {
    ru: (label: string | null, handle: string | null) =>
      label === null ? "с главного аккаунта" : label ? `с аккаунта «${label}»${handle ? ` ${handle}` : ""}` : "с рабочего аккаунта",
    uz: (label: string | null, handle: string | null) =>
      label === null ? "asosiy akkauntdan" : label ? `«${label}» akkauntidan${handle ? ` (${handle})` : ""}` : "ish akkauntidan",
    pl: (label: string | null, handle: string | null) =>
      label === null ? "z konta głównego" : label ? `z konta «${label}»${handle ? ` ${handle}` : ""}` : "z konta firmowego",
  },
  sendFromUnknown: { ru: "аккаунт не записан", uz: "akkaunt yozilmagan", pl: "konto nie zapisane" },
  moreSends: {
    ru: (n: number) => `ещё ${n}`,
    uz: (n: number) => `yana ${n} ta`,
    pl: (n: number) => `jeszcze ${n}`,
  },
  ownerFail_forbidden: {
    ru: "Ответственного назначают руководитель и владелец.",
    uz: "Mas’ulni rahbar va egasi tayinlaydi.",
    pl: "Osobę odpowiedzialną wyznacza kierownik i właściciel.",
  },
  ownerFail_not_found: {
    ru: "Макет или сотрудник не найден. Обновите страницу.",
    uz: "Maket yoki xodim topilmadi. Sahifani yangilang.",
    pl: "Nie znaleziono makiety lub pracownika. Odśwież stronę.",
  },
  ownerFail_offline: {
    ru: "База не ответила. Попробуйте через минуту.",
    uz: "Baza javob bermadi. Bir daqiqadan keyin urinib ko‘ring.",
    pl: "Baza nie odpowiedziała. Spróbuj za minutę.",
  },
  // Заказ макета из задачи (lib/admin/mockup-order.ts): привязать макет к
  // открытому заказу — тот, кто заказал, станет ответственным.
  orderLabel: { ru: "Заказ", uz: "Buyurtma", pl: "Zlecenie" },
  orderPick: { ru: "привязать к заказу…", uz: "buyurtmaga bog‘lash…", pl: "powiąż ze zleceniem…" },
  orderOption: {
    ru: (title: string, client: string | null, who: string | null) => `${title}${client ? ` · ${client}` : ""}${who ? ` · от ${who}` : ""}`,
    uz: (title: string, client: string | null, who: string | null) => `${title}${client ? ` · ${client}` : ""}${who ? ` · ${who}dan` : ""}`,
    pl: (title: string, client: string | null, who: string | null) => `${title}${client ? ` · ${client}` : ""}${who ? ` · od ${who}` : ""}`,
  },
  orderSuggested: { ru: "сайт совпадает", uz: "sayt mos keladi", pl: "strona się zgadza" },
  orderLink: { ru: "Привязать", uz: "Bog‘lash", pl: "Powiąż" },
  orderDone: {
    ru: "Макет привязан к заказу: ответственный — тот, кто заказал.",
    uz: "Maket buyurtmaga bog‘landi: mas’ul — buyurtma bergan xodim.",
    pl: "Makieta powiązana ze zleceniem: odpowiada osoba, która zleciła.",
  },
  orderDoneClosed: {
    ru: "Макет привязан к заказу, задача закрыта «Сделано» — заказавшему ушло сообщение.",
    uz: "Maket buyurtmaga bog‘landi, vazifa «Bajarildi» bilan yopildi — buyurtma bergan xodimga xabar ketdi.",
    pl: "Makieta powiązana ze zleceniem, zadanie zamknięte jako «Zrobione» — zlecający dostał wiadomość.",
  },
  orderFail_forbidden: {
    ru: "Привязать может исполнитель задачи, руководитель или владелец.",
    uz: "Vazifa ijrochisi, rahbar yoki egasi bog‘lashi mumkin.",
    pl: "Powiązać może wykonawca zadania, kierownik lub właściciel.",
  },
  orderFail_not_found: {
    ru: "Заказ или макет не найден. Обновите страницу.",
    uz: "Buyurtma yoki maket topilmadi. Sahifani yangilang.",
    pl: "Nie znaleziono zlecenia lub makiety. Odśwież stronę.",
  },
  orderFail_linked: {
    ru: "К этому заказу макет уже привязан.",
    uz: "Bu buyurtmaga maket allaqachon bog‘langan.",
    pl: "Do tego zlecenia makieta jest już powiązana.",
  },
  orderFail_offline: {
    ru: "База не ответила. Попробуйте через минуту.",
    uz: "Baza javob bermadi. Bir daqiqadan keyin urinib ko‘ring.",
    pl: "Baza nie odpowiedziała. Spróbuj za minutę.",
  },
  open: { ru: "Открыть", uz: "Ochish", pl: "Otwórz" },
  copyLink: { ru: "Скопировать ссылку", uz: "Havolani nusxalash", pl: "Kopiuj link" },
  generate: { ru: "Сгенерировать пароль", uz: "Parol yaratish", pl: "Wygeneruj hasło" },
  busy: { ru: "Создаю…", uz: "Yaratilmoqda…", pl: "Tworzę…" },
  noCode: { ru: "пароль не нужен", uz: "parol kerak emas", pl: "hasło niepotrzebne" },
  confirmClose: {
    ru: (name: string) =>
      `Макет «${name}» сейчас открыт по ссылке. С первым паролем он закроется: кто откроет ссылку без пароля, увидит поле для пароля. Продолжить?`,
    uz: (name: string) =>
      `«${name}» maketi hozir havola orqali ochiq. Birinchi parol bilan u yopiladi: havolani parolsiz ochgan kishi parol maydonini ko‘radi. Davom etamizmi?`,
    pl: (name: string) =>
      `Makieta „${name}” jest teraz otwarta przez link. Z pierwszym hasłem się zamknie: kto otworzy link bez hasła, zobaczy pole na hasło. Kontynuować?`,
  },
  password: { ru: "Пароль", uz: "Parol", pl: "Hasło" },
  validUntil: {
    ru: (time: string) => `действует до ${time} по Ташкенту`,
    uz: (time: string) => `Toshkent vaqti bilan ${time} gacha amal qiladi`,
    pl: (time: string) => `ważne do ${time} czasu Taszkentu`,
  },
  copyMessage: { ru: "Скопировать для клиента", uz: "Mijoz uchun nusxalash", pl: "Kopiuj dla klienta" },
  copyCode: { ru: "Скопировать пароль", uz: "Parolni nusxalash", pl: "Kopiuj hasło" },
  messageHint: {
    ru: "Текст для клиента — на языке макета: ссылка, пароль, до какого часа он действует и ссылка на условия.",
    uz: "Mijoz uchun matn maket tilida: havola, parol, u qaysi soatgacha amal qilishi va shartlar havolasi.",
    pl: "Tekst dla klienta jest w języku makiety: link, hasło, do której godziny działa i link do warunków.",
  },
  closedNow: {
    ru: "Макет закрыт: теперь он открывается только по паролю.",
    uz: "Maket yopildi: endi u faqat parol bilan ochiladi.",
    pl: "Makieta zamknięta: teraz otwiera się tylko na hasło.",
  },
  fail_not_found: { ru: "Макет не найден. Обновите страницу.", uz: "Maket topilmadi. Sahifani yangilang.", pl: "Nie znaleziono makiety. Odśwież stronę." },
  fail_no_lock: {
    ru: "Этот проект витрины открыт всем, пароль ему не нужен.",
    uz: "Vitrinaning bu loyihasi hammaga ochiq, unga parol kerak emas.",
    pl: "Ten projekt witryny jest otwarty dla wszystkich, hasło nie jest potrzebne.",
  },
  fail_offline: {
    ru: "База не ответила. Попробуйте через минуту.",
    uz: "Baza javob bermadi. Bir daqiqadan keyin urinib ko‘ring.",
    pl: "Baza nie odpowiedziała. Spróbuj za minutę.",
  },
});

/**
 * Ниши макетов, которых нет в каталоге ниш прототипов (content/proto/models):
 * у макетов, собранных руками, и у проектов витрины ниша своя. Ниши из
 * каталога берутся оттуда.
 */
export const mockupNicheDict = defineDict({
  "it-shkola": { ru: "IT-школа", uz: "IT-maktab", pl: "Szkoła IT" },
  "influence-agentstvo": { ru: "Агентство блогеров", uz: "Blogerlar agentligi", pl: "Agencja influencerów" },
  nedvizhimost: { ru: "Недвижимость", uz: "Ko‘chmas mulk", pl: "Nieruchomości" },
  "bystrovozvodimye-zdaniya": { ru: "Быстровозводимые здания", uz: "Tez quriladigan binolar", pl: "Hale i budynki stalowe" },
  kursy: { ru: "Онлайн-курсы", uz: "Onlayn kurslar", pl: "Kursy online" },
  "doska-obyavleniy": { ru: "Доска объявлений", uz: "E’lonlar taxtasi", pl: "Serwis ogłoszeń" },
  marketpleys: { ru: "Торговая площадка", uz: "Savdo maydonchasi", pl: "Platforma handlowa" },
  metalloprokat: { ru: "Металлопрокат и стройка", uz: "Metall prokat va qurilish", pl: "Wyroby hutnicze i budowa" },
  "telegram-mini-app": { ru: "Мини-приложение Telegram", uz: "Telegram mini-ilova", pl: "Mini-aplikacja Telegram" },
  avtoshkola: { ru: "Автошкола", uz: "Avtomaktab", pl: "Szkoła jazdy" },
  podarki: { ru: "Подарочные наборы", uz: "Sovg‘a to‘plamlari", pl: "Zestawy prezentowe" },
  eksport: { ru: "Экспорт продуктов", uz: "Mahsulot eksporti", pl: "Eksport żywności" },
  turagentstvo: { ru: "Турагентство", uz: "Turagentlik", pl: "Biuro podróży" },
  okna: { ru: "Окна и двери", uz: "Deraza va eshiklar", pl: "Okna i drzwi" },
  mebel: { ru: "Мебель", uz: "Mebel", pl: "Meble" },
  hosting: { ru: "Домены и хостинг", uz: "Domen va hosting", pl: "Domeny i hosting" },
  dveri: { ru: "Двери", uz: "Eshiklar", pl: "Drzwi" },
  svyaz: { ru: "Связь и интернет", uz: "Aloqa va internet", pl: "Telekomunikacja" },
  "agentstvo-nedvizhimosti": { ru: "Зарубежная недвижимость", uz: "Xorijdagi ko‘chmas mulk", pl: "Nieruchomości za granicą" },
  konservy: { ru: "Консервы", uz: "Konservalar", pl: "Konserwy" },
  bady: { ru: "Биодобавки", uz: "Bioqo‘shimchalar", pl: "Suplementy diety" },
  odezhda: { ru: "Закрытая женская одежда", uz: "Yopiq ayollar kiyimi", pl: "Skromna odzież damska" },
  restoran: { ru: "Ресторан", uz: "Restoran", pl: "Restauracja" },
  medoborudovanie: { ru: "Медицинское оборудование", uz: "Tibbiy uskunalar", pl: "Sprzęt medyczny" },
  obuv: { ru: "Обувь и аксессуары", uz: "Poyabzal va aksessuarlar", pl: "Obuwie i akcesoria" },
  farma: { ru: "Фармацевтика", uz: "Farmatsevtika", pl: "Farmacja" },
});
