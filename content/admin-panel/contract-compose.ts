import { defineDict } from "@/lib/admin/i18n";

/**
 * Договор проще (владелец, 29.10.2026): «Состав из макета», «Вставить
 * реквизиты», карточка договора в проекте и «чего не хватает» у отправки.
 * Компоненты: components/admin/contract-compose.tsx, requisites-paste.tsx,
 * страницы app/admin/projects/[id] и app/admin/contracts/[id].
 *
 * Термины — по GLOSSARY.md: договор — «shartnoma» / «umowa», смета —
 * «smeta» / «kosztorys», макет — «maket» / «makieta».
 */
export const contractComposeDict = defineDict({
  title: { ru: "Состав из макета", uz: "Maketdan tarkib", pl: "Skład z makiety" },
  note: {
    ru: "Выберите макет — ниже его допы с ценами из конструктора на макете. Отмеченные ★ включены сразу, снимите лишнее. Смета, сумма, предмет и срок договора встанут сами.",
    uz: "Maketni tanlang — pastda maketdagi konstruktordan narxlari bilan qo‘shimchalar. ★ belgilanganlari darhol kiritilgan, keraksizini olib tashlang. Smeta, summa, shartnoma predmeti va muddati o‘zi qo‘yiladi.",
    pl: "Wybierz makietę — poniżej jej dodatki z cenami z konfiguratora na makiecie. Oznaczone ★ są włączone od razu, odznacz zbędne. Kosztorys, kwota, przedmiot i termin umowy wstawią się same.",
  },
  plan: { ru: "Макет", uz: "Maket", pl: "Makieta" },
  none: {
    ru: "без макета — сумма и предмет руками",
    uz: "maketsiz — summa va predmet qo‘lda",
    pl: "bez makiety — kwota i przedmiot ręcznie",
  },
  base: { ru: "Основа", uz: "Asos", pl: "Podstawa" },
  weeks: {
    ru: (n: number) => `срок до ${n} нед.`,
    uz: (n: number) => `muddat ${n} haftagacha`,
    pl: (n: number) => `termin do ${n} tyg.`,
  },
  addons: { ru: "Допы", uz: "Qo‘shimchalar", pl: "Dodatki" },
  extras: {
    ru: "Свои строки (до трёх). Цена 0 — в подарок",
    uz: "O‘z qatorlaringiz (uchtagacha). Narx 0 — sovg‘a",
    pl: "Własne wiersze (do trzech). Cena 0 — w prezencie",
  },
  extraTitle: { ru: "Название", uz: "Nomi", pl: "Nazwa" },
  extraPrice: { ru: "Цена, $", uz: "Narx, $", pl: "Cena, $" },
  total: {
    ru: (sum: string) => `Итого по составу: $${sum}`,
    uz: (sum: string) => `Tarkib bo‘yicha jami: $${sum}`,
    pl: (sum: string) => `Razem według składu: $${sum}`,
  },
  fromPlan: {
    ru: "С макетом сумма и предмет договора берутся из состава, поля ниже можно не трогать.",
    uz: "Maket bilan shartnoma summasi va predmeti tarkibdan olinadi, pastdagi maydonlarga tegmasangiz bo‘ladi.",
    pl: "Z makietą kwota i przedmiot umowy biorą się ze składu, pól poniżej można nie ruszać.",
  },
  apply: { ru: "Поставить в договор", uz: "Shartnomaga qo‘yish", pl: "Wstaw do umowy" },
  composed: {
    ru: "Состав поставлен: смета, сумма, предмет и срок — из макета.",
    uz: "Tarkib qo‘yildi: smeta, summa, predmet va muddat — maketdan.",
    pl: "Skład wstawiony: kosztorys, kwota, przedmiot i termin — z makiety.",
  },

  pasteTitle: { ru: "Вставить реквизиты", uz: "Rekvizitlarni qo‘yish", pl: "Wklej dane firmy" },
  pastePh: {
    ru: "Вставьте реквизиты одним текстом, как их прислал клиент",
    uz: "Rekvizitlarni mijoz yuborganidek bitta matn bilan qo‘ying",
    pl: "Wklej dane jednym tekstem, tak jak przysłał je klient",
  },
  pasteBtn: { ru: "Разложить по полям", uz: "Maydonlarga taqsimlash", pl: "Rozłóż na pola" },
  pasteFound: {
    ru: (n: number) => `Разложено полей: ${n}.`,
    uz: (n: number) => `Taqsimlangan maydonlar: ${n}.`,
    pl: (n: number) => `Rozłożono pól: ${n}.`,
  },
  pasteMissing: {
    ru: (list: string) => `Не нашлось: ${list}. Допишите руками.`,
    uz: (list: string) => `Topilmadi: ${list}. Qo‘lda yozing.`,
    pl: (list: string) => `Nie znaleziono: ${list}. Dopisz ręcznie.`,
  },
  pasteAll: {
    ru: "Всё нашлось. Проверьте поля глазами.",
    uz: "Hammasi topildi. Maydonlarni ko‘z bilan tekshiring.",
    pl: "Wszystko znalezione. Sprawdź pola wzrokiem.",
  },
  f_name: { ru: "название", uz: "nomi", pl: "nazwa" },
  f_address: { ru: "адрес", uz: "manzil", pl: "adres" },
  f_taxId: { ru: "ИНН или ПИНФЛ", uz: "STIR yoki JShShIR", pl: "INN lub PINFL" },
  f_account: { ru: "расчётный счёт", uz: "hisob raqami", pl: "rachunek" },
  f_mfo: { ru: "МФО", uz: "MFO", pl: "MFO" },
  f_bank: { ru: "банк", uz: "bank", pl: "bank" },

  client: { ru: "Реквизиты заказчика", uz: "Buyurtmachi rekvizitlari", pl: "Dane zamawiającego" },
  saveClient: { ru: "Сохранить реквизиты", uz: "Rekvizitlarni saqlash", pl: "Zapisz dane" },

  missing: {
    ru: "До «Отправить на подпись» не хватает:",
    uz: "«Imzoga yuborish»gacha yetishmaydi:",
    pl: "Do „Wyślij do podpisu” brakuje:",
  },
  ready: {
    ru: "Всё заполнено — можно отправлять на подпись.",
    uz: "Hammasi to‘ldirilgan — imzoga yuborsa bo‘ladi.",
    pl: "Wszystko uzupełnione — można wysłać do podpisu.",
  },
  open: { ru: "Открыть договор", uz: "Shartnomani ochish", pl: "Otwórz umowę" },
  openSign: { ru: "Открыть и подписать", uz: "Ochish va imzolash", pl: "Otwórz i podpisz" },
  number: {
    ru: (no: string) => `Договор № ${no}`,
    uz: (no: string) => `Shartnoma № ${no}`,
    pl: (no: string) => `Umowa nr ${no}`,
  },
  amount: {
    ru: (sum: string) => `Сумма: ${sum}`,
    uz: (sum: string) => `Summa: ${sum}`,
    pl: (sum: string) => `Kwota: ${sum}`,
  },
  existed: {
    ru: "У проекта уже есть договор — открыли его, второй не создан.",
    uz: "Loyihada shartnoma allaqachon bor — u ochildi, ikkinchisi yaratilmadi.",
    pl: "Projekt ma już umowę — otworzyliśmy ją, druga nie powstała.",
  },
  preparing: { ru: "Готовлю договор…", uz: "Shartnoma tayyorlanmoqda…", pl: "Przygotowuję umowę…" },
  sending: { ru: "Отправляю…", uz: "Yuborilmoqda…", pl: "Wysyłam…" },
});
