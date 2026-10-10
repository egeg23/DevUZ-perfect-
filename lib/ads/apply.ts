import { allowed, mergeNegatives, type Actor, type LiveState } from "@/lib/ads/guard";
import type { AccountLimits, AdsConnector, Payload, Period, Platform } from "@/lib/ads/types";

/**
 * Применить предложение и откатить применённое.
 *
 * Порядок всегда один: прочитать кабинет как он есть → проверить
 * ограничители (lib/ads/guard.ts) → изменить → записать в журнал, что было
 * и что стало. Запись в журнал — забота вызывающего (lib/ads/run.ts): здесь
 * только площадка, чтобы это можно было проверить тестом на заглушке.
 *
 * Откат не возвращает «как было» вслепую: с тех пор в кабинете могли
 * поменять что-то руками. Минус-слова — убираются только те, что добавили
 * мы; бюджет — возвращается, только если с тех пор его никто не трогал;
 * объявление — ставится на паузу или включается обратно. Стоп-кран откат не
 * останавливает: вернуть как было — ровно то, что нужно в аварии.
 */

export type Applied = {
  ok: true;
  before: Record<string, unknown>;
  after: Record<string, unknown>;
  /** Для теста объявлений: id нового объявления. */
  variantAdId?: string;
};
export type Refused = { ok: false; reason: string };

export async function liveState(connector: AdsConnector, period: Period, campaignIds: string[], groupIds: string[] = []): Promise<LiveState> {
  const [campaigns, keywords] = await Promise.all([connector.campaigns(period), connector.keywords()]);
  const negatives: Record<string, string[]> = {};
  for (const id of campaignIds) negatives[id] = await connector.negatives(id);
  const groupNegatives: Record<string, string[]> = {};
  for (const id of groupIds) groupNegatives[id] = await connector.groupNegatives(id);
  return { campaigns, keywords, negatives, groupNegatives };
}

export function campaignsOf(payload: Payload): string[] {
  switch (payload.kind) {
    case "negatives":
    case "cross_negatives":
      return [payload.campaignId];
    case "budget":
      return payload.moves.map((m) => m.campaignId);
    case "ad_test":
      return [payload.campaignId];
    case "ad_winner":
      return [];
  }
}

export async function applyPayload(input: {
  connector: AdsConnector;
  platform: Platform;
  limits: AccountLimits;
  actor: Actor;
  actionsToday: number;
  payload: Payload;
  period: Period;
}): Promise<Applied | Refused> {
  const { connector, payload } = input;
  const live = await liveState(
    connector,
    input.period,
    payload.kind === "negatives" ? [payload.campaignId] : [],
    payload.kind === "cross_negatives" ? payload.groups.map((g) => g.adGroupId) : [],
  );
  const verdict = allowed({ ...input, live });
  if (!verdict.ok) return verdict;

  switch (payload.kind) {
    case "negatives": {
      const before = live.negatives[payload.campaignId] ?? [];
      const after = mergeNegatives(before, payload.phrases);
      await connector.setNegatives(payload.campaignId, after);
      const added = after.filter((p) => !before.includes(p));
      return { ok: true, before: { campaignId: payload.campaignId, negatives: before }, after: { campaignId: payload.campaignId, negatives: after, added } };
    }
    case "cross_negatives": {
      // Группа за группой; площадка не приняла очередную — сделанное возвращаем.
      const done: { adGroupId: string; negatives: string[] }[] = [];
      const after: { adGroupId: string; negatives: string[]; added: string[] }[] = [];
      try {
        for (const group of payload.groups) {
          const before = live.groupNegatives?.[group.adGroupId] ?? [];
          const next = mergeNegatives(before, group.phrases);
          await connector.setGroupNegatives(group.adGroupId, next);
          done.push({ adGroupId: group.adGroupId, negatives: before });
          after.push({ adGroupId: group.adGroupId, negatives: next, added: next.filter((p) => !before.includes(p)) });
        }
      } catch (error) {
        for (const g of done.reverse()) await connector.setGroupNegatives(g.adGroupId, g.negatives).catch(() => undefined);
        return { ok: false, reason: `Площадка не приняла минус-фразы группы: ${error instanceof Error ? error.message : String(error)}. Сделанное вернули.` };
      }
      return { ok: true, before: { campaignId: payload.campaignId, groups: done }, after: { campaignId: payload.campaignId, groups: after } };
    }
    case "budget": {
      // Сначала снимаем, потом добавляем: если второй шаг упадёт, общий
      // бюджет окажется меньше, а не больше. И откатываем сделанное.
      const ordered = [...payload.moves].sort((a, b) => a.to - a.from - (b.to - b.from));
      const done: typeof ordered = [];
      try {
        for (const move of ordered) {
          await connector.setDailyBudget(move.campaignId, move.to);
          done.push(move);
        }
      } catch (error) {
        for (const move of done.reverse()) await connector.setDailyBudget(move.campaignId, move.from).catch(() => undefined);
        return { ok: false, reason: `Площадка не приняла бюджет: ${error instanceof Error ? error.message : String(error)}. Сделанное вернули.` };
      }
      return {
        ok: true,
        before: { budgets: payload.moves.map((m) => ({ campaignId: m.campaignId, amount: m.from })) },
        after: { budgets: payload.moves.map((m) => ({ campaignId: m.campaignId, amount: m.to })) },
      };
    }
    case "ad_test": {
      const variantAdId = await connector.createAd(payload.adGroupId, payload.copy);
      return {
        ok: true,
        variantAdId,
        before: { adGroupId: payload.adGroupId, controlAdId: payload.controlAdId },
        after: { adGroupId: payload.adGroupId, variantAdId, copy: payload.copy },
      };
    }
    case "ad_winner": {
      await connector.setAdActive(payload.loserAdId, false);
      return { ok: true, before: { adId: payload.loserAdId, active: true }, after: { adId: payload.loserAdId, active: false, winnerAdId: payload.winnerAdId } };
    }
  }
}

/** Откатить запись журнала. `kind` и `before/after` — как их записал `applyPayload`. */
export async function rollback(input: {
  connector: AdsConnector;
  kind: string;
  before: Record<string, unknown>;
  after: Record<string, unknown>;
  period: Period;
}): Promise<Applied | Refused> {
  const { connector, after } = input;
  switch (input.kind) {
    case "negatives": {
      const campaignId = String(after.campaignId);
      const added = new Set(((after.added as string[]) ?? []).map((p) => p.toLowerCase()));
      const current = await connector.negatives(campaignId);
      const next = current.filter((p) => !added.has(p.toLowerCase()));
      await connector.setNegatives(campaignId, next);
      return { ok: true, before: { campaignId, negatives: current }, after: { campaignId, negatives: next, removed: [...added] } };
    }
    case "cross_negatives": {
      const groups = (after.groups as { adGroupId: string; added: string[] }[]) ?? [];
      const was: { adGroupId: string; negatives: string[] }[] = [];
      const now: { adGroupId: string; negatives: string[] }[] = [];
      for (const g of groups) {
        const added = new Set(g.added.map((p) => p.toLowerCase()));
        const current = await connector.groupNegatives(g.adGroupId);
        const next = current.filter((p) => !added.has(p.toLowerCase()));
        await connector.setGroupNegatives(g.adGroupId, next);
        was.push({ adGroupId: g.adGroupId, negatives: current });
        now.push({ adGroupId: g.adGroupId, negatives: next });
      }
      return { ok: true, before: { groups: was }, after: { groups: now } };
    }
    case "budget": {
      const want = (input.before.budgets as { campaignId: string; amount: number }[]) ?? [];
      const was = (after.budgets as { campaignId: string; amount: number }[]) ?? [];
      const campaigns = await connector.campaigns(input.period);
      for (const w of was) {
        const now = campaigns.find((c) => c.id === w.campaignId)?.dailyBudget;
        if (now === undefined || now === null || Math.abs(now - w.amount) > 0.5) {
          return { ok: false, reason: "Бюджет поменяли в кабинете после нас — откатывать вслепую не будем, проверьте руками." };
        }
      }
      // Обратный сдвиг: снова сначала снимаем.
      const ordered = want
        .map((b) => ({ ...b, delta: b.amount - (was.find((w) => w.campaignId === b.campaignId)?.amount ?? b.amount) }))
        .sort((a, b) => a.delta - b.delta);
      for (const b of ordered) await connector.setDailyBudget(b.campaignId, b.amount);
      return { ok: true, before: { budgets: was }, after: { budgets: want } };
    }
    case "ad_test": {
      const variantAdId = String(after.variantAdId);
      await connector.setAdActive(variantAdId, false);
      return { ok: true, before: { adId: variantAdId, active: true }, after: { adId: variantAdId, active: false } };
    }
    case "ad_winner": {
      const adId = String(after.adId);
      await connector.setAdActive(adId, true);
      return { ok: true, before: { adId, active: false }, after: { adId, active: true } };
    }
    default:
      return { ok: false, reason: "Это действие откатить нельзя." };
  }
}
