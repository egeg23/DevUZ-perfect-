import type { Locale } from "@/lib/i18n";

/** Грейд ниши по ICP. 1 — крупный системный бизнес, 3 — микробизнес. */
export type NicheTier = 1 | 2 | 3;

/** Наша экспертность в нише клиента: считается по библиотеке кейсов. */
export type Expertise = "high" | "medium" | "low";

export type BudgetGrade = "B1" | "B2" | "B3";
export type AuthorityGrade = "A1" | "A2" | "A3";
export type NeedGrade = "N1" | "N2" | "N3";
export type TimingGrade = "T1" | "T2" | "T3";

/**
 * Намерение клиента поверх формальной квалификации.
 *
 * `needs_human` и `wants_discount` — не оттенки заинтересованности, а
 * отдельные маршруты: первый требует человека независимо от балла, второй
 * помечает лида, которому нельзя обещать скидку в чате.
 */
export type Intent =
  | "interested"
  | "exploring"
  | "wants_discount"
  | "needs_human"
  | "not_interested";

/** Резюме по восьми пунктам — ровно то, что видит менеджер в Telegram. */
export type LeadSummary = {
  client: string;
  request: string;
  niche: string;
  expertise: string;
  budget: string;
  authority: string;
  need: string;
  timing: string;
};

/** Чем именно оставлен контакт — от этого зависит, во что превратить ссылку. */
export type ContactKind = "telegram" | "phone" | "email" | "none";

/** То, что модель возвращает через инструмент qualify_lead. */
export type QualifyToolInput = {
  contact_name: string;
  company: string;
  contact_handle: string;
  contact_kind: ContactKind;
  niche: string;
  niche_tier: NicheTier;
  expertise: Expertise;
  services: string[];
  budget: BudgetGrade;
  authority: AuthorityGrade;
  need: NeedGrade;
  timing: TimingGrade;
  intent: Intent;
  summary: LeadSummary;
  notes: string;
  /**
   * Готовая первая фраза менеджера на языке клиента.
   *
   * Менеджер открывает диалог с холодного старта: он не читал переписку и не
   * знает, на чём она оборвалась. Заготовка снимает с него необходимость
   * придумывать заход и убирает главную причину, по которой горячие лиды
   * остывают, — паузу между «взял в работу» и первым сообщением.
   */
  opening_line: string;
  /**
   * Что ассистент уже пообещал или озвучил.
   *
   * Без этого менеджер рискует назвать другую вилку или забыть про
   * упомянутый кейс — и клиент видит, что подрядчик не помнит собственных слов.
   */
  already_told: string[];
  /**
   * Что уже выяснено и переспрашивать нельзя.
   *
   * Повторный вопрос про бюджет после того, как клиент его назвал, — самый
   * быстрый способ показать, что его не слушали.
   */
  avoid_asking: string[];
};

export type Grade = "A" | "B" | "C" | "D";

export type ScoredLead = QualifyToolInput & {
  score: number;
  grade: Grade;
  /** Разбор балла по составляющим — уходит в Telegram и в базу. */
  breakdown: Record<string, number>;
  priority: "hot" | "warm" | "nurture" | "archive";
  locale: Locale;
};

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};
