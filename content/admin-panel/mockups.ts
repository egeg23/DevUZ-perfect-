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
  search: { ru: "Найти: название, сайт или ниша", uz: "Qidirish: nom, sayt yoki nisha", pl: "Szukaj: nazwa, strona lub branża" },
  filterAll: { ru: "Все", uz: "Hammasi", pl: "Wszystkie" },
  filterHand: { ru: "Сделаны вручную", uz: "Qo‘lda yig‘ilgan", pl: "Zrobione ręcznie" },
  filterAuto: { ru: "Для касаний", uz: "Aloqalar uchun", pl: "Do kontaktów" },
  filterShowcase: { ru: "Витрина", uz: "Vitrina", pl: "Witryna" },
  empty: { ru: "Ничего не нашлось.", uz: "Hech narsa topilmadi.", pl: "Nic nie znaleziono." },
  niche: { ru: "Ниша", uz: "Nisha", pl: "Branża" },
  made: { ru: "Сделан", uz: "Yaratilgan", pl: "Zrobiona" },
  tagAuto: { ru: "для касания", uz: "aloqa uchun", pl: "do kontaktu" },
  tagShowcase: { ru: "витрина", uz: "vitrina", pl: "witryna" },
  accessOpen: { ru: "открыт по ссылке", uz: "havola orqali ochiq", pl: "otwarta przez link" },
  accessClosed: { ru: "по паролю", uz: "parol bilan", pl: "na hasło" },
  accessPublic: { ru: "открыт всем", uz: "hammaga ochiq", pl: "otwarta dla wszystkich" },
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
});
