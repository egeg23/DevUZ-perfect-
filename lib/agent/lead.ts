import { detectContactKind } from "@/lib/contact";
import { isLocale, type Locale } from "@/lib/i18n";
import type { ContactKind, QualifyToolInput } from "@/lib/qualify/types";

/**
 * Заявка, которую за клиента прислал ИИ-агент (app/api/agent/lead).
 *
 * Владелец, 24.11.2026: «Разрешаем агенту отправлять нам заявки». Адрес
 * открыт всем, как и форма сайта, поэтому проверки строже формы: контакт
 * должен быть похож на контакт, задача названа, и агент прямо говорит, что
 * клиент сам попросил отправить заявку (`consent: true`).
 *
 * Здесь только разбор и проверка, без базы и Telegram: это проверяет тест.
 */

/** `leads.source` у такой заявки (миграция 0194). */
export const AGENT_SOURCE = "agent";

/** Не больше стольких заявок от агентов в сутки на весь сайт: защита очереди лидов от потока. */
export const AGENT_DAY_CAP = 40;

export const AGENT_LEAD_ERRORS = [
  "invalid_json",
  "consent_required",
  "contact_required",
  "contact_invalid",
  "message_required",
] as const;
export type AgentLeadError = (typeof AGENT_LEAD_ERRORS)[number];

export type AgentLead = {
  name: string;
  company: string;
  contact: string;
  contactKind: ContactKind;
  message: string;
  agent: string;
  locale: Locale;
};

const text = (value: unknown, max: number) =>
  typeof value === "string" ? value.replace(/\s+/g, " ").trim().slice(0, max) : "";

const EMAIL = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+$/;
const TELEGRAM = /^(?:@|(?:https?:\/\/)?t\.me\/)[A-Za-z0-9_]{4,32}$/;

/** Контакт похож на телефон, почту или ник Telegram. Заглушки агентов — нет. */
export function contactLooksReal(contact: string): boolean {
  const value = contact.trim();
  if (EMAIL.test(value)) return !/@(example\.(com|org|net)|test\.|localhost)/i.test(value);
  if (TELEGRAM.test(value)) return true;
  const digits = value.replace(/\D/g, "");
  if (/[A-Za-zА-Яа-яЁё]/.test(value)) return false;
  // 1234567, 0000000 и номера из кино (555-01xx) агент подставляет, когда контакта нет.
  if (digits.length < 9 || digits.length > 15) return false;
  if (/^(\d)\1+$/.test(digits) || "01234567890123456789".includes(digits)) return false;
  return true;
}

export function parseAgentLead(body: unknown): { ok: true; lead: AgentLead } | { ok: false; error: AgentLeadError } {
  if (!body || typeof body !== "object" || Array.isArray(body)) return { ok: false, error: "invalid_json" };
  const b = body as Record<string, unknown>;
  if (b.consent !== true) return { ok: false, error: "consent_required" };
  const contact = text(b.contact, 200);
  if (!contact) return { ok: false, error: "contact_required" };
  if (!contactLooksReal(contact)) return { ok: false, error: "contact_invalid" };
  const message = text(b.message, 1500);
  if (message.length < 10) return { ok: false, error: "message_required" };
  return {
    ok: true,
    lead: {
      name: text(b.name, 120),
      company: text(b.company, 120),
      contact,
      contactKind: detectContactKind(contact),
      message,
      agent: text(b.agent, 60),
      locale: isLocale(b.locale as string) ? (b.locale as Locale) : "ru",
    },
  };
}

/** Чей это агент: поле `agent`, иначе подпись запроса, иначе «не назвался». */
export function agentName(lead: Pick<AgentLead, "agent">, userAgent: string | null): string {
  if (lead.agent) return lead.agent;
  const ua = (userAgent ?? "").replace(/\s+/g, " ").trim().slice(0, 60);
  return ua || "не назвался";
}

const OPENERS: Record<Locale, (name: string) => string> = {
  ru: (name) => `Здравствуйте${name ? ", " + name : ""}! Меня зовут [имя], я из студии DevUz. Вы оставили у нас заявку через ИИ-помощника. Расскажите, пожалуйста, чуть подробнее о задаче?`,
  en: (name) => `Hello${name ? " " + name : ""}! I'm [name] from DevUz Studio. You sent us a request through an AI assistant. Could you tell me a bit more about the project?`,
  uz: (name) => `Assalomu alaykum${name ? ", " + name : ""}! Men DevUz studiyasidan [ism]. Siz bizga SI-yordamchi orqali ariza qoldirgansiz. Iltimos, vazifa haqida biroz batafsilroq aytib bering?`,
  zh: (name) => `您好${name ? "，" + name : ""}！我是 DevUz Studio 的 [姓名]。您通过 AI 助手给我们留了需求，能否再多说一些项目情况？`,
  uk: (name) => `Доброго дня${name ? ", " + name : ""}! Мене звати [ім'я], я зі студії DevUz. Ви залишили нам заявку через ШІ-помічника. Розкажіть, будь ласка, трохи докладніше про задачу?`,
  pl: (name) => `Dzień dobry${name ? ", " + name : ""}! Nazywam się [imię], piszę ze studia DevUz. Zostawiłeś u nas zapytanie przez asystenta AI. Opowiedz, proszę, trochę więcej o zadaniu?`,
};

/**
 * Лид для очереди. Квалификации нет, как у формы сайта: грейды худшие, а в
 * заметке прямо сказано, что заявку прислал агент и контакт не проверен.
 */
export function agentLeadInput(lead: AgentLead, who: string): QualifyToolInput {
  const unknown = "не выяснено — заявку прислал ИИ-агент, диалога с клиентом не было";
  return {
    contact_name: lead.name,
    company: lead.company,
    contact_handle: lead.contact,
    contact_kind: lead.contactKind,
    niche: unknown,
    niche_tier: 3,
    expertise: "low",
    services: [],
    budget: "B3",
    authority: "A3",
    need: "N3",
    timing: "T3",
    intent: "needs_human",
    summary: {
      client: [lead.name || "имя не указано", lead.company].filter(Boolean).join(", "),
      request: lead.message,
      niche: unknown,
      expertise: unknown,
      budget: unknown,
      authority: unknown,
      need: unknown,
      timing: unknown,
    },
    notes: `Заявку за клиента прислал ИИ-агент (${who}). Контакт и задача записаны со слов агента и не проверены: напишите клиенту и уточните задачу сами. Квалификации нет, грейды худшие по умолчанию.`,
    opening_line: OPENERS[lead.locale](lead.name),
    already_told: [],
    avoid_asking: [],
  };
}
