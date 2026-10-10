import type { Locale } from "@/lib/i18n";

/**
 * Последняя фраза первички — готовым текстом, а не вторым запросом к модели.
 *
 * Разведка «ИИ → код», 10.10.2026: после вызова qualify_lead движок делал ещё
 * один запрос к модели с тем же системным промптом и всей перепиской, чтобы
 * она сказала «передал менеджеру, номер такой-то». Содержание этой фразы
 * целиком задаёт код — доставлена заявка или нет, какой у неё номер, куда
 * писать, если не дошла, — модели в ней решать нечего. Шаблон говорит то же,
 * не может ошибиться в номере и не стоит запроса.
 *
 * Исход — фактический, а не желаемый: сказать «передал менеджеру», когда
 * доставка не удалась, значит отпустить клиента в уверенности, что им
 * займутся, и потерять его молча.
 */

/** delivered — сохранена и у менеджера; saved — в базе, но уведомление не ушло; lost — ни того, ни другого. */
export type ClosingOutcome = "delivered" | "saved" | "lost";

type Copy = Record<ClosingOutcome, string>;

/** {no} — номер заявки, {tg} — наш Telegram без «@». */
const CLOSING: Record<Locale, Copy> = {
  ru: {
    delivered: "Спасибо! Запрос передан менеджеру, номер заявки — {no}. Он напишет вам в оставленный контакт в ближайшее время.",
    saved: "Спасибо! Заявку приняли, номер — {no}. Уведомление менеджеру сейчас не прошло, поэтому на всякий случай напишите нам в Telegram @{tg} и назовите этот номер.",
    lost: "Извините, заявка сейчас не сохранилась. Напишите нам напрямую в Telegram @{tg}, так запрос точно не потеряется.",
  },
  en: {
    delivered: "Thank you! Your request is with a manager now, request number {no}. They will contact you shortly at the contact you left.",
    saved: "Thank you! We've got your request, number {no}. The notification to the manager didn't go through just now, so to be safe, message us on Telegram @{tg} and mention this number.",
    lost: "Sorry, the request didn't save just now. Please message us directly on Telegram @{tg} so it doesn't get lost.",
  },
  uz: {
    delivered: "Rahmat! So‘rovingiz menejerga yuborildi, ariza raqami: {no}. Menejer yaqin orada siz qoldirgan kontakt orqali yozadi.",
    saved: "Rahmat! Arizangiz qabul qilindi, raqami: {no}. Menejerga xabar hozir yetib bormadi, shuning uchun bizga Telegram’da @{tg} ga yozing va shu raqamni ayting.",
    lost: "Kechirasiz, ariza hozir saqlanmadi. Bizga Telegram’da to‘g‘ridan-to‘g‘ri @{tg} ga yozing, shunda so‘rovingiz yo‘qolmaydi.",
  },
  zh: {
    delivered: "谢谢！您的需求已转交客户经理，申请编号：{no}。客户经理会尽快通过您留下的联系方式与您联系。",
    saved: "谢谢！已收到您的申请，编号：{no}。通知暂时未能发送给客户经理，为保险起见，请通过 Telegram @{tg} 联系我们并告知此编号。",
    lost: "抱歉，申请暂时未能保存。请直接通过 Telegram @{tg} 联系我们，以免需求遗失。",
  },
  uk: {
    delivered: "Дякуємо! Запит передано менеджеру, номер заявки — {no}. Він напише вам у залишений контакт найближчим часом.",
    saved: "Дякуємо! Заявку прийняли, номер — {no}. Сповіщення менеджеру зараз не пройшло, тож про всяк випадок напишіть нам у Telegram @{tg} і назвіть цей номер.",
    lost: "Вибачте, заявка зараз не збереглася. Напишіть нам напряму в Telegram @{tg}, так запит точно не загубиться.",
  },
  pl: {
    delivered: "Dziękujemy! Zapytanie trafiło do menedżera, numer zgłoszenia: {no}. Wkrótce odezwie się na podany kontakt.",
    saved: "Dziękujemy! Zgłoszenie przyjęte, numer: {no}. Powiadomienie do menedżera teraz nie dotarło, więc na wszelki wypadek napisz do nas na Telegramie @{tg} i podaj ten numer.",
    lost: "Przepraszamy, zgłoszenie teraz się nie zapisało. Napisz do nas bezpośrednio na Telegramie @{tg}, wtedy na pewno nie zginie.",
  },
};

/**
 * Касание — другой разговор: заявки клиент не оставлял, а разговор дальше
 * ведёт человек с этого же аккаунта (см. talkNote). Номер заявки и «напишите
 * в наш Telegram» ему ни к чему при любом исходе: лид всё равно уходит
 * человеку через handOver.
 */
const OUTREACH: Record<Locale, string> = {
  ru: "Всё записали. В ближайшее время продолжим здесь же, в этой переписке.",
  en: "Got it all down. We'll continue right here in this chat shortly.",
  uz: "Hammasini yozib oldik. Tez orada shu yozishmada davom ettiramiz.",
  zh: "都记下了。我们很快会在这个对话里继续。",
  uk: "Усе записали. Найближчим часом продовжимо тут же, у цьому листуванні.",
  pl: "Wszystko zapisane. Wkrótce wrócimy do rozmowy tutaj, w tym czacie.",
};

export function closingText(input: {
  locale: Locale;
  source: string;
  outcome: ClosingOutcome;
  requestNo: string;
  telegram: string;
}): string {
  if (input.source === "outreach") return OUTREACH[input.locale] ?? OUTREACH.ru;
  const copy = CLOSING[input.locale] ?? CLOSING.ru;
  return copy[input.outcome].replaceAll("{no}", input.requestNo).replaceAll("{tg}", input.telegram);
}
