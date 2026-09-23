/**
 * Ссылки для телефонов студии: позвонить и открыть WhatsApp.
 *
 * Отдельно от разметки, чтобы шапка, подвал и тесты брали одно и то же.
 */

/** Номер для wa.me — только цифры, без плюса; текст уже набран в поле. */
export function whatsappUrl(phone: { e164: string }, text: string): string {
  return `https://wa.me/${phone.e164.replace(/\D/g, "")}?text=${encodeURIComponent(text)}`;
}

export function telUrl(phone: { e164: string }): string {
  return `tel:${phone.e164}`;
}
