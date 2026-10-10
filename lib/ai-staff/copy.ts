import type { Lang } from "@/lib/ai-staff/lang";

/**
 * Фразы покупателю, которые пишет код, а не модель.
 *
 * Всё, где содержание задаёт факт (номер заявки, «ответит человек», «пишите
 * текстом»), — шаблоном: модели тут нечего добавить, а ошибиться она может.
 * Так же устроено прощание в чате студии (lib/qualify/closing.ts).
 *
 * Пишем как живой продавец: коротко, без длинных тире и штампов.
 */

type Copy = Record<Lang, string>;

/** Первое сообщение ИИ в разговоре: покупатель должен знать, что пишет ИИ (legal.md). */
export function disclosure(lang: Lang, company: string, name: string): string {
  const who = name.trim();
  if (lang === "uz") {
    return who
      ? `Sizga ${company} kompaniyasining sun'iy intellekt yordamchisi ${who} javob bermoqda.`
      : `Sizga ${company} kompaniyasining sun'iy intellekt yordamchisi javob bermoqda.`;
  }
  return who
    ? `Вам отвечает ${who}, ИИ-помощник компании ${company}.`
    : `Вам отвечает ИИ-помощник компании ${company}.`;
}

/** Заявка передана человеку: номер и что будет дальше. */
export function handedOff(lang: Lang, requestNo: string, delivered: boolean): string {
  if (lang === "uz") {
    return delivered
      ? `Arizangiz qabul qilindi, raqami ${requestNo}. Menejer tez orada siz bilan bog'lanadi.`
      : `Arizangiz saqlandi, raqami ${requestNo}. Menejer ish vaqtida siz bilan bog'lanadi.`;
  }
  return delivered
    ? `Заявка принята, номер ${requestNo}. Менеджер скоро свяжется с вами.`
    : `Заявка сохранена, номер ${requestNo}. Менеджер свяжется с вами в рабочее время.`;
}

/** ИИ не может ответить (проверка не пропустила ответ, модель недоступна). */
export const ASK_MANAGER: Copy = {
  ru: "Уточню этот вопрос у менеджера, чтобы не ошибиться. Оставьте, пожалуйста, имя и телефон, и он свяжется с вами.",
  uz: "Xato qilmaslik uchun bu savolni menejerdan aniqlab beraman. Iltimos, ismingiz va telefon raqamingizni qoldiring, u siz bilan bog'lanadi.",
};

/** ИИ молчит (лимит, срок, пауза): покупатель не должен уйти в тишину. */
export const HUMAN_WILL_ANSWER: Copy = {
  ru: "Спасибо за сообщение! Менеджер ответит вам в ближайшее время.",
  uz: "Xabaringiz uchun rahmat! Menejer tez orada javob beradi.",
};

/** Голосовое, фото, файл: в первой версии не разбираем и не храним (legal.md). */
export const TEXT_PLEASE: Copy = {
  ru: "Пока я понимаю только текст. Напишите, пожалуйста, вопрос словами, или оставьте телефон, и менеджер перезвонит.",
  uz: "Hozircha faqat matnni tushunaman. Iltimos, savolingizni yozib yuboring yoki telefon raqamingizni qoldiring, menejer qo'ng'iroq qiladi.",
};

/** Потолок реплик в разговоре: дальше человек. */
export const TOO_LONG: Copy = {
  ru: "Чтобы ничего не упустить, передаю разговор менеджеру. Он ответит здесь же.",
  uz: "Hech narsa e'tibordan chetda qolmasligi uchun suhbatni menejerga topshiraman. U shu yerda javob beradi.",
};
