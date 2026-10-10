import { copyProblems } from "@/lib/ads/copy";
import { GOOGLE_CAMPAIGN_NEGATIVES, YANDEX_CAMPAIGN_CHARS, safeNegative } from "@/lib/ads/negatives";
import type { AccountLimits, Campaign, Payload, Platform } from "@/lib/ads/types";

/**
 * Ограничители: что автопилот НЕ может сделать.
 *
 * Деньги клиента — главный риск сервиса. Проверка стоит перед каждым
 * изменением, кто бы его ни запустил — человек кнопкой «Принять» или
 * автопилот сам, — и смотрит на кабинет как он есть сейчас, а не каким он
 * был, когда предложение писалось: бюджет могли поменять руками, ключ —
 * дописать.
 *
 * - стоп-кран — не применяется ничего;
 * - режим «предлагаю» — сам автопилот не применяет ничего, только человек;
 * - потолок действий в сутки — для автопилота;
 * - общий бюджет не растёт никогда: сколько сняли, столько добавили, не больше;
 * - сдвиг бюджета кампании — не больше `maxShiftPct` (и не больше 30% вообще);
 * - кампанию, которая учится, не трогаем;
 * - минус-слово не режет ни одного ключа кампании — по ключам на сейчас;
 * - объявление — без тире, штампов, запрещённых обещаний и лишних знаков.
 *
 * Удалять автопилот не умеет вовсе: в `AdsConnector` нет такого метода.
 */

export const HARD_MAX_SHIFT_PCT = 30;

export type Actor = "human" | "auto";

export type LiveState = {
  campaigns: Campaign[];
  keywords: { campaignId: string; text: string }[];
  negatives: Record<string, string[]>;
};

export type Verdict = { ok: true } | { ok: false; reason: string };

const no = (reason: string): Verdict => ({ ok: false, reason });

export function allowed(input: {
  limits: AccountLimits;
  actor: Actor;
  actionsToday: number;
  payload: Payload;
  live: LiveState;
  platform: Platform;
}): Verdict {
  const { limits, actor, payload, live } = input;
  if (limits.stopped) return no("В кабинете нажат стоп-кран: изменения не применяются.");
  if (actor === "auto" && limits.mode !== "auto") return no("Режим «предлагаю»: без подтверждения человека ничего не меняем.");
  if (actor === "auto" && input.actionsToday >= limits.maxActionsDay) {
    return no(`Сегодня уже ${input.actionsToday} изменений — это потолок кабинета.`);
  }

  switch (payload.kind) {
    case "negatives": {
      const campaign = live.campaigns.find((c) => c.id === payload.campaignId);
      if (!campaign) return no("Кампании больше нет в кабинете.");
      const keywords = live.keywords.filter((k) => k.campaignId === payload.campaignId).map((k) => k.text);
      const bad = payload.phrases.filter((p) => !safeNegative(p, keywords));
      if (bad.length) return no(`Минус-слова задевают ключи кампании: ${bad.map((b) => `«${b}»`).join(", ")}.`);
      const merged = mergeNegatives(live.negatives[payload.campaignId] ?? [], payload.phrases);
      if (input.platform === "google" && merged.length > GOOGLE_CAMPAIGN_NEGATIVES) return no("В кампании не помещается столько минус-слов.");
      if (input.platform !== "google" && merged.join(" ").length > YANDEX_CAMPAIGN_CHARS) return no("Минус-фразы кампании не помещаются в 20 000 знаков.");
      return { ok: true };
    }
    case "budget": {
      const pct = Math.min(limits.maxShiftPct, HARD_MAX_SHIFT_PCT) / 100;
      const before = payload.moves.reduce((s, m) => s + m.from, 0);
      const after = payload.moves.reduce((s, m) => s + m.to, 0);
      if (after > before + 1e-6) return no("Общий бюджет вырос бы — автопилот его не повышает никогда.");
      for (const move of payload.moves) {
        const campaign = live.campaigns.find((c) => c.id === move.campaignId);
        if (!campaign) return no(`Кампании «${move.campaignName}» больше нет.`);
        if (campaign.learning) return no(`«${move.campaignName}» сейчас учится — бюджет не трогаем.`);
        if (campaign.dailyBudget === null) return no(`У «${move.campaignName}» бюджет задан стратегией — не трогаем.`);
        if (Math.abs(campaign.dailyBudget - move.from) > 0.5) {
          return no(`Бюджет «${move.campaignName}» поменяли в кабинете после предложения — пересчитаем.`);
        }
        if (move.to <= 0) return no(`Бюджет «${move.campaignName}» стал бы нулевым.`);
        if (Math.abs(move.to - move.from) > move.from * pct + 1e-6) {
          return no(`Сдвиг «${move.campaignName}» больше ${Math.round(pct * 100)}% её бюджета.`);
        }
      }
      return { ok: true };
    }
    case "ad_test": {
      const problems = copyProblems(payload.copy, input.platform);
      if (problems.length) return no(`Объявление не прошло проверку: ${problems.map((p) => p.text).join(" ")}`);
      const campaign = live.campaigns.find((c) => c.id === payload.campaignId);
      if (!campaign || !campaign.active) return no("Кампания не работает — тест не начнётся.");
      return { ok: true };
    }
    case "ad_winner":
      return { ok: true };
  }
}

/** Добавить минус-фразы к списку кампании: без повторов, порядок прежний. */
export function mergeNegatives(existing: readonly string[], add: readonly string[]): string[] {
  const seen = new Set(existing.map((p) => p.toLowerCase().trim()));
  const out = [...existing];
  for (const phrase of add) {
    const key = phrase.toLowerCase().trim();
    if (!seen.has(key)) {
      seen.add(key);
      out.push(phrase.trim());
    }
  }
  return out;
}
