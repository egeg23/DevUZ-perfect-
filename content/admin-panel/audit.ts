import { defineDict, plural } from "@/lib/admin/i18n";

/**
 * Раздел «Журнал» (/admin/audit) — только владельцу.
 *
 * Подписи действий — Tr-таблица ACTION_LABEL в lib/admin/journal.ts: её же
 * берут «Использование» и тесты журнала.
 */
export const auditDict = defineDict({
  title: { ru: "Журнал", uz: "Jurnal", pl: "Dziennik" },
  intro: {
    ru: "Только добавление: правку и удаление запрещает триггер в базе, и снять его не может даже наш сервер. Журнал, который можно подчистить, ничего не доказывает.",
    uz: "Faqat qo‘shish mumkin: tahrirlash va o‘chirishni bazadagi trigger taqiqlaydi, uni hatto bizning serverimiz ham olib tashlay olmaydi. Tozalab qo‘yish mumkin bo‘lgan jurnal hech narsani isbotlamaydi.",
    pl: "Tylko dopisywanie: edycję i usuwanie blokuje wyzwalacz w bazie i nie może go zdjąć nawet nasz serwer. Dziennik, który da się wyczyścić, niczego nie dowodzi.",
  },
  offline: {
    ru: "База недоступна — это не «записей нет».",
    uz: "Baza mavjud emas — bu «yozuvlar yo‘q» degani emas.",
    pl: "Baza jest niedostępna — to nie znaczy «brak wpisów».",
  },
  who: { ru: "Кто", uz: "Kim", pl: "Kto" },
  everyone: { ru: "все", uz: "hammasi", pl: "wszyscy" },
  system: { ru: "система", uz: "tizim", pl: "system" },
  what: { ru: "Что", uz: "Nima", pl: "Co" },
  everything: { ru: "всё", uz: "hammasi", pl: "wszystko" },
  total: {
    ru: (n: number) => `${n} ${plural("ru", n, "запись", "записи", "записей")}`,
    uz: (n: number) => `${n} ta yozuv`,
    pl: (n: number) => `${n} ${plural("pl", n, "wpis", "wpisy", "wpisów")}`,
  },
  page: {
    ru: (page: number, pages: number) => ` · страница ${page} из ${pages}`,
    uz: (page: number, pages: number) => ` · ${pages} tadan ${page}-sahifa`,
    pl: (page: number, pages: number) => ` · strona ${page} z ${pages}`,
  },
  emptyOffline: {
    ru: "Нечего показать: база не отвечает.",
    uz: "Ko‘rsatadigan narsa yo‘q: baza javob bermayapti.",
    pl: "Nie ma czego pokazać: baza nie odpowiada.",
  },
  emptyFilter: {
    ru: "Под этот фильтр ничего не попало.",
    uz: "Bu filtrga hech narsa tushmadi.",
    pl: "Nic nie pasuje do tego filtra.",
  },
  newer: { ru: "← новее", uz: "← yangiroq", pl: "← nowsze" },
  older: { ru: "старее →", uz: "eskiroq →", pl: "starsze →" },
  lead: {
    ru: (id: string) => `лид ${id}`,
    uz: (id: string) => `lid ${id}`,
    pl: (id: string) => `lead ${id}`,
  },
  viaChat: { ru: "из чата", uz: "chatdan", pl: "z czatu" },
  reactivated: { ru: "включён обратно", uz: "qayta yoqilgan", pl: "włączony ponownie" },
});
