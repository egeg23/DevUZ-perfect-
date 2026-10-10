import { money } from "@/lib/ads/negatives";
import type { Ad, Campaign, Keyword } from "@/lib/ads/types";
import { blocks } from "@/lib/ads/words";

/**
 * Тревоги — то, что маркетолог должен узнать сразу, а не в отчёте недели.
 *
 * Механика — «правила и оповещения» Optmyzr и K50 (research.md, §4.2), но
 * без конструктора правил: пять проверок, которые в кабинетах Ташкента
 * чаще всего стоят денег, с порогами, которые не будят по пустякам.
 *
 * - stall: кампания обычно тратит, а вчера не потратила ничего. Кончились
 *   деньги, объявления отклонили, расписание, — клиент теряет день заявок.
 * - spike: вчера потрачено вдвое больше обычного, а заявок не прибавилось.
 * - no_leads: обычно в день есть заявки, а вчера при тех же деньгах — ноль
 *   (сломалась форма, цель в Метрике, телефон на сайте).
 * - rejected: площадка отклонила объявление.
 * - conflict: минус-слово кампании режет её же ключ — показов нет, а деньги
 *   на этом не тратятся, поэтому сам кабинет об этом молчит.
 *
 * «Обычно» — средняя за 7 дней до вчера. Проверка — по вчерашнему дню:
 * сегодняшние цифры площадки досчитывают до утра.
 */

export type AlertKind = "stall" | "spike" | "no_leads" | "rejected" | "conflict";

export type Alert = {
  kind: AlertKind;
  /** Одна открытая тревога на ключ: повтор не будит второй раз. */
  key: string;
  data: Record<string, string | number>;
};

/** Кампания должна обычно тратить хотя бы столько в день, чтобы её «остановка» что-то значила. */
export const MIN_DAILY_COST_SHARE = 0.02;
/** Во сколько раз вчерашний расход выше обычного — уже тревога. */
export const SPIKE_RATIO = 2;
/** Сколько заявок за неделю, чтобы «ни одной вчера» не было случайностью. */
export const NO_LEADS_WEEK = 14;

export function detectAlerts(input: {
  yesterday: Campaign[];
  week: Campaign[];
  ads: Ad[];
  keywords: Keyword[];
  negatives: Record<string, string[]>;
}): Alert[] {
  const out: Alert[] = [];
  const totalDaily = input.week.reduce((s, c) => s + c.cost, 0) / 7;

  for (const w of input.week) {
    const y = input.yesterday.find((c) => c.id === w.id);
    if (!y || !y.active) continue;
    const avg = w.cost / 7;
    const avgConv = w.conversions / 7;
    const base = { campaign: w.name, avg: Math.round(avg), cost: Math.round(y.cost) };

    if (w.activeDays >= 5 && avg > 0 && avg >= totalDaily * MIN_DAILY_COST_SHARE && y.cost === 0) {
      out.push({ kind: "stall", key: `stall:${w.id}`, data: base });
      continue;
    }
    if (avg > 0 && y.cost >= avg * SPIKE_RATIO && y.conversions <= Math.max(avgConv * 1.2, avgConv + 1)) {
      out.push({ kind: "spike", key: `spike:${w.id}`, data: { ...base, conversions: y.conversions } });
    }
    if (w.conversions >= NO_LEADS_WEEK && y.conversions === 0 && y.cost >= avg * 0.7) {
      out.push({ kind: "no_leads", key: `no_leads:${w.id}`, data: { ...base, avgConv: Math.round(avgConv * 10) / 10 } });
    }
  }

  for (const ad of input.ads) {
    if (!ad.rejected) continue;
    const campaign = input.week.find((c) => c.id === ad.campaignId)?.name ?? ad.campaignId;
    out.push({ kind: "rejected", key: `rejected:${ad.id}`, data: { campaign, headline: ad.copy.headlines[0] ?? ad.id } });
  }

  for (const [campaignId, negatives] of Object.entries(input.negatives)) {
    const campaign = input.week.find((c) => c.id === campaignId)?.name ?? campaignId;
    for (const negative of negatives) {
      const hit = input.keywords.filter((k) => k.campaignId === campaignId && blocks(negative, k.text));
      if (hit.length) {
        out.push({
          kind: "conflict",
          key: `conflict:${campaignId}:${negative.toLowerCase()}`,
          data: { campaign, negative, keywords: hit.slice(0, 3).map((k) => k.text).join(", ") },
        });
      }
    }
  }
  return out;
}

export type AlertLocale = "ru" | "uz" | "pl";

/** Текст тревоги на языке читающего — из цифр, а не готовой строки. */
export function alertText(alert: Pick<Alert, "kind" | "data">, locale: AlertLocale, currency: string): string {
  const d = alert.data;
  const m = (n: unknown) => money(Number(n ?? 0), currency, locale === "uz" ? "uz" : "ru").replace(" сум", locale === "pl" ? " UZS" : " сум");
  const c = `«${d.campaign}»`;
  const texts: Record<AlertKind, Record<AlertLocale, string>> = {
    stall: {
      ru: `${c} вчера не потратила ничего, хотя обычно тратит около ${m(d.avg)} в день. Проверьте баланс, модерацию и расписание показов.`,
      uz: `${c} kecha hech narsa sarflamadi, odatda kuniga taxminan ${m(d.avg)} sarflaydi. Balans, moderatsiya va ko‘rsatish jadvalini tekshiring.`,
      pl: `${c} wczoraj nic nie wydała, choć zwykle wydaje około ${m(d.avg)} dziennie. Sprawdź saldo, moderację i harmonogram wyświetleń.`,
    },
    spike: {
      ru: `${c} вчера потратила ${m(d.cost)} при обычных ${m(d.avg)} в день, а заявок не прибавилось (${d.conversions}). Проверьте ставки и новые запросы.`,
      uz: `${c} kecha ${m(d.cost)} sarfladi, odatda kuniga ${m(d.avg)}, arizalar esa ko‘paymadi (${d.conversions}). Stavkalar va yangi so‘rovlarni tekshiring.`,
      pl: `${c} wczoraj wydała ${m(d.cost)} przy zwykłych ${m(d.avg)} dziennie, a zgłoszeń nie przybyło (${d.conversions}). Sprawdź stawki i nowe zapytania.`,
    },
    no_leads: {
      ru: `${c} вчера не дала ни одной заявки при обычных ${d.avgConv} в день, хотя деньги тратились (${m(d.cost)}). Проверьте форму, телефон на сайте и цель в Метрике.`,
      uz: `${c} kecha birorta ham ariza keltirmadi, odatda kuniga ${d.avgConv} ta, pul esa sarflangan (${m(d.cost)}). Saytdagi forma, telefon va Metrikadagi maqsadni tekshiring.`,
      pl: `${c} wczoraj nie dała żadnego zgłoszenia przy zwykłych ${d.avgConv} dziennie, choć pieniądze szły (${m(d.cost)}). Sprawdź formularz, telefon na stronie i cel w Metryce.`,
    },
    rejected: {
      ru: `В ${c} площадка отклонила объявление «${d.headline}». Пока его не поправить, оно не показывается.`,
      uz: `${c} da platforma «${d.headline}» e’lonini rad etdi. Tuzatilmaguncha u ko‘rsatilmaydi.`,
      pl: `W ${c} platforma odrzuciła reklamę «${d.headline}». Dopóki nie zostanie poprawiona, nie jest wyświetlana.`,
    },
    conflict: {
      ru: `В ${c} минус-слово «${d.negative}» режет ваши ключи: ${d.keywords}. По ним реклама не показывается.`,
      uz: `${c} da «${d.negative}» minus-so‘zi kalit so‘zlaringizni kesmoqda: ${d.keywords}. Ular bo‘yicha reklama ko‘rsatilmaydi.`,
      pl: `W ${c} wykluczenie «${d.negative}» blokuje Twoje słowa kluczowe: ${d.keywords}. Dla nich reklama się nie wyświetla.`,
    },
  };
  return texts[alert.kind][locale];
}
