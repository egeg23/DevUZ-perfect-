import type { ChatMessage, QualifyToolInput } from "@/lib/qualify/types";

/**
 * Контакт клиента из переписки — кодом, если модель его не переписала.
 *
 * Разведка «ИИ → код», 10.10.2026: телефон, @ник и почту клиент пишет сам, и
 * найти их в его репликах — работа для регулярного выражения, а не для
 * модели. Модель контакт обычно переписывает, но если поле осталось пустым,
 * а клиент контакт оставлял, лид уходит менеджеру без адреса — писать некуда.
 * Заполненное моделью не трогаем: она видит, какой из контактов клиент
 * назвал «для связи».
 */

export type FoundContact = { handle: string; kind: "telegram" | "phone" | "email" };

const EMAIL = /[\w.+-]+@[\w-]+(?:\.[\w-]+)*\.[a-z]{2,}/i;
// @ник Telegram: 5–32 знака, буквы, цифры и подчёркивание; не часть почты.
const HANDLE = /(?:^|[^\w@.])@([a-z][\w]{4,31})\b/i;
// Телефон — с кодом страны («+998 90 123-45-67», «+48 501 234 567») или
// узбекский мобильный без кода («90 123 45 67», «33 123 45 67»). Голые девять
// цифр без кода оператора — скорее бюджет в сумах, чем телефон.
const PHONE = /\+\d[\d\s()-]{7,16}\d|(?<!\d)(?:9\d|33|50|55|77|88|20)[\s-]?\d{3}[\s-]?\d{2}[\s-]?\d{2}(?!\d)/;

export function contactIn(text: string): FoundContact | null {
  const email = text.match(EMAIL);
  if (email) return { handle: email[0], kind: "email" };
  const handle = text.match(HANDLE);
  if (handle) return { handle: `@${handle[1]}`, kind: "telegram" };
  const phone = text.match(PHONE);
  if (phone) {
    const digits = phone[0].replace(/\D/g, "");
    if (digits.length >= 9 && digits.length <= 13) return { handle: phone[0].trim(), kind: "phone" };
  }
  return null;
}

/** Последний контакт, который клиент написал сам, — в пустое поле брифа. */
export function withTalkContact(input: QualifyToolInput, history: readonly ChatMessage[]): QualifyToolInput {
  if (input.contact_handle?.trim()) return input;
  for (const message of [...history].reverse()) {
    if (message.role !== "user") continue;
    const found = contactIn(message.content);
    if (found) return { ...input, contact_handle: found.handle, contact_kind: found.kind };
  }
  return input;
}
