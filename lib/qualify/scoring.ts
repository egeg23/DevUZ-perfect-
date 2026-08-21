import type {
  Grade,
  QualifyToolInput,
  ScoredLead,
} from "@/lib/qualify/types";
import type { Locale } from "@/lib/i18n";

/**
 * Веса скоринга.
 *
 * Сумма максимумов ровно 100, чтобы балл читался как процент и не требовал
 * пересчёта в голове. Ниша и экспертность вместе дают половину веса: это
 * ICP-часть, она отвечает на вопрос «стоит ли нам вообще браться». Вторая
 * половина — BANT, то есть «готова ли сделка двигаться».
 *
 * Внутри BANT бюджет и ЛПР весят больше потребности и срочности намеренно:
 * заинтересованный клиент без денег и без права решать съедает время
 * продавца ровно так же, как горячий, но не приносит выручки.
 */
const WEIGHTS = {
  tier: { 1: 30, 2: 20, 3: 10 },
  expertise: { high: 20, medium: 12, low: 5 },
  budget: { B1: 15, B2: 10, B3: 3 },
  authority: { A1: 15, A2: 9, A3: 3 },
  need: { N1: 10, N2: 6, N3: 2 },
  timing: { T1: 10, T2: 6, T3: 2 },
} as const;

export const MAX_SCORE = 100;

function toGrade(score: number): Grade {
  if (score >= 75) return "A";
  if (score >= 55) return "B";
  if (score >= 35) return "C";
  return "D";
}

/**
 * Считает балл и решает, как маршрутизировать лида.
 *
 * Намерение сильнее балла в двух случаях. Просьба поговорить с человеком
 * поднимает лида в «горячие» при любом скоринге — отказать в живом разговоре
 * дороже, чем потратить пятнадцать минут продавца. Явный отказ, наоборот,
 * опускает в архив, каким бы привлекательным ни выглядел портрет компании.
 */
export function scoreLead(input: QualifyToolInput, locale: Locale): ScoredLead {
  const breakdown = {
    tier: WEIGHTS.tier[input.niche_tier] ?? 0,
    expertise: WEIGHTS.expertise[input.expertise] ?? 0,
    budget: WEIGHTS.budget[input.budget] ?? 0,
    authority: WEIGHTS.authority[input.authority] ?? 0,
    need: WEIGHTS.need[input.need] ?? 0,
    timing: WEIGHTS.timing[input.timing] ?? 0,
  };

  const score = Object.values(breakdown).reduce((sum, value) => sum + value, 0);
  const grade = toGrade(score);

  let priority: ScoredLead["priority"];
  if (input.intent === "not_interested") {
    priority = "archive";
  } else if (input.intent === "needs_human") {
    priority = "hot";
  } else if (grade === "A") {
    priority = "hot";
  } else if (grade === "B") {
    priority = "warm";
  } else {
    priority = "nurture";
  }

  return { ...input, score, grade, breakdown, priority, locale };
}

/** Эмодзи-маркер приоритета для карточки в Telegram. */
export function priorityBadge(lead: ScoredLead): string {
  if (lead.intent === "needs_human") return "👤 НУЖЕН ЧЕЛОВЕК";
  if (lead.intent === "wants_discount") return "💰 ПРОСИТ СКИДКУ";
  switch (lead.priority) {
    case "hot":
      return "🔥 ГОРЯЧИЙ ЛИД";
    case "warm":
      return "🟡 ТЁПЛЫЙ ЛИД";
    case "nurture":
      return "🌱 В ПРОГРЕВ";
    default:
      return "📁 В АРХИВ";
  }
}
