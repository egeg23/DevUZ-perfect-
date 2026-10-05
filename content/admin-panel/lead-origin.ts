import { defineDict } from "@/lib/admin/i18n";

/**
 * Откуда пришёл лид — словами для карточки лида и для брифа в Telegram.
 *
 * Русские строки — те же, что уходят в бриф команде: бот пока пишет
 * по-русски (lib/qualify/origin.ts зовёт их с языком "ru" по умолчанию),
 * а карточка — на языке панели того, кто её открыл.
 */

/** Канал, по которому пришёл разговор. Ключ — `leads.source`. */
export const leadChannelDict = defineDict({
  chat: { ru: "чат на сайте", uz: "saytdagi chat", pl: "czat na stronie" },
  telegram: { ru: "бот в Telegram", uz: "Telegramdagi bot", pl: "bot w Telegramie" },
  form: { ru: "форма на сайте", uz: "saytdagi forma", pl: "formularz na stronie" },
  showcase: { ru: "витрина — бриф по заказу", uz: "vitrina — buyurtma brifi", pl: "witryna — brief zamówienia" },
  outreach: { ru: "наше холодное касание", uz: "bizning sovuq aloqamiz", pl: "nasz zimny kontakt" },
  manual: { ru: "добавлен вручную в панели", uz: "panelda qo‘lda qo‘shilgan", pl: "dodany ręcznie w panelu" },
  partner: {
    ru: "клиента закрепил партнёр в кабинете",
    uz: "mijozni hamkor kabinetda biriktirgan",
    pl: "klienta przypisał partner w swoim panelu",
  },
});

export const leadOriginDict = defineDict({
  noChannel: { ru: "канал не указан", uz: "kanal ko‘rsatilmagan", pl: "kanał nieznany" },
  unknownTime: { ru: "время неизвестно", uz: "vaqt noma’lum", pl: "czas nieznany" },
  botDm: { ru: "личные сообщения боту", uz: "botga shaxsiy xabarlar", pl: "wiadomości prywatne do bota" },
  page: {
    ru: (path: string) => `страница ${path}`,
    uz: (path: string) => `sahifa ${path}`,
    pl: (path: string) => `strona ${path}`,
  },
  direct: { ru: "прямой заход", uz: "to‘g‘ridan-to‘g‘ri kirish", pl: "wejście bezpośrednie" },
  cameFrom: {
    ru: (ref: string) => `перешёл с ${ref}`,
    uz: (ref: string) => `${ref} orqali kelgan`,
    pl: (ref: string) => `przyszedł z ${ref}`,
  },
});
