import { rng } from "@/lib/ads/budget";
import type { Ad, AdCopy, AdsConnector, Campaign, Keyword, Period, SearchTerm } from "@/lib/ads/types";
import { blocks } from "@/lib/ads/words";

/**
 * Заглушка рекламного кабинета — для обкатки и тестов без ключей API.
 *
 * Данные похожи на настоящие: учебный центр в Ташкенте, три кампании в
 * сумах, запросы с мусором («бесплатно», «скачать», «вакансии»), который и
 * правда съедает деньги в таких кабинетах. Состояние живёт в
 * `ads_accounts.stub_state`: минус-слова, бюджеты и объявления меняются по
 * настоящему, а запросы, которые режет минус-слово, при следующем заборе
 * отчёта пропадают — как в жизни.
 *
 * `simulateDays` прокручивает дни: новым объявлениям в тесте набегают
 * показы, и тест доходит до итога, не дожидаясь двух недель.
 */

export type StubAd = Ad & { createdDay: number; quality: number };

export type StubState = {
  day: number;
  campaigns: Campaign[];
  terms: SearchTerm[];
  keywords: Keyword[];
  negatives: Record<string, string[]>;
  ads: StubAd[];
  nextId: number;
};

const C = (id: string, name: string, budget: number | null, cost: number, clicks: number, conv: number, learning = false): Campaign => ({
  id,
  name,
  active: true,
  dailyBudget: budget,
  learning,
  activeDays: 30,
  cost,
  clicks,
  impressions: clicks * 18,
  conversions: conv,
  revenue: 0,
});

const T = (campaignId: string, adGroupId: string, query: string, clicks: number, cost: number, conversions: number): SearchTerm => ({
  campaignId,
  adGroupId,
  query,
  clicks,
  impressions: clicks * 15,
  cost,
  conversions,
});

export function seedStubState(): StubState {
  return {
    day: 0,
    campaigns: [
      // «Английский» упирается в бюджет и даёт заявки дёшево, «IT-курсы» —
      // дорого: перераспределение должно это увидеть.
      C("101", "Английский — поиск", 300_000, 8_850_000, 590, 59),
      C("102", "IT-курсы — поиск", 400_000, 7_200_000, 410, 9),
      C("103", "Подготовка к IELTS", 200_000, 3_100_000, 190, 11, true),
    ],
    keywords: [
      { campaignId: "101", adGroupId: "1011", id: "k1", text: "курсы английского ташкент" },
      { campaignId: "101", adGroupId: "1011", id: "k2", text: "английский для взрослых" },
      { campaignId: "101", adGroupId: "1011", id: "k3", text: "ingliz tili kurslari" },
      { campaignId: "102", adGroupId: "1021", id: "k4", text: "курсы программирования ташкент" },
      { campaignId: "102", adGroupId: "1021", id: "k5", text: "python курсы" },
      { campaignId: "103", adGroupId: "1031", id: "k6", text: "подготовка ielts" },
    ],
    negatives: { "101": ["онлайн бесплатно"], "102": [], "103": [] },
    terms: [
      T("101", "1011", "курсы английского ташкент", 210, 3_150_000, 31),
      T("101", "1011", "курсы английского языка ташкент цены", 120, 1_800_000, 16),
      T("101", "1011", "английский для взрослых с нуля", 90, 1_350_000, 9),
      T("101", "1011", "ingliz tili kurslari toshkent", 60, 900_000, 3),
      T("101", "1011", "курсы английского бесплатно", 34, 510_000, 0),
      T("101", "1011", "английский бесплатно для начинающих", 22, 330_000, 0),
      T("101", "1011", "учебник английского скачать pdf", 28, 420_000, 0),
      T("101", "1011", "вакансии преподаватель английского", 26, 390_000, 0),
      T("102", "1021", "курсы программирования ташкент", 160, 2_880_000, 6),
      T("102", "1021", "python курсы с нуля", 95, 1_710_000, 3),
      T("102", "1021", "курсы программирования бесплатно", 48, 864_000, 0),
      T("102", "1021", "python скачать", 41, 738_000, 0),
      T("102", "1021", "работа программистом вакансии", 38, 684_000, 0),
      T("102", "1021", "программирование это", 28, 504_000, 0),
      T("103", "1031", "подготовка ielts ташкент", 140, 2_240_000, 10),
      T("103", "1031", "ielts тест онлайн бесплатно", 50, 860_000, 1),
    ],
    ads: [
      {
        id: "a1",
        campaignId: "101",
        adGroupId: "1011",
        active: true,
        copy: {
          headlines: ["Курсы английского в Ташкенте", "Группы по 8 человек"],
          descriptions: ["Пробный урок за 1 день. Утренние и вечерние группы в Чиланзаре и Юнусабаде."],
          url: "https://example.uz/english",
        },
        clicks: 590,
        impressions: 10_620,
        cost: 8_850_000,
        conversions: 59,
        createdDay: -30,
        quality: 0.055,
      },
    ],
    nextId: 1000,
  };
}

/**
 * Прокрутить дни: каждой активной кампании — день показов, новым
 * объявлениям — их доля. Детерминированно: от номера дня.
 */
export function simulateDays(state: StubState, days: number): StubState {
  const next: StubState = structuredClone(state);
  for (let d = 0; d < days; d++) {
    next.day += 1;
    const random = rng(next.day * 7919);
    for (const group of new Set(next.ads.filter((a) => a.active).map((a) => a.adGroupId))) {
      const ads = next.ads.filter((a) => a.active && a.adGroupId === group);
      for (const ad of ads) {
        const impressions = Math.round(400 / ads.length + random() * 40);
        const clicks = Math.round(impressions * ad.quality * (0.9 + random() * 0.2));
        ad.impressions += impressions;
        ad.clicks += clicks;
        ad.conversions += Math.round(clicks * 0.1 * (0.8 + random() * 0.4));
        ad.cost += clicks * 15_000;
      }
    }
  }
  return next;
}

export function stubConnector(initial: StubState, save: (state: StubState) => Promise<void>): AdsConnector & { state(): StubState } {
  let state = structuredClone(initial);
  const commit = async () => save(state);

  const visibleTerms = () =>
    state.terms.filter((t) => !(state.negatives[t.campaignId] ?? []).some((n) => blocks(n, t.query)));

  return {
    platform: "stub",
    state: () => state,
    async campaigns(_period: Period) {
      // Деньги кампании — сумма её видимых запросов: минус-слово, срезавшее
      // мусор, видно и в расходе.
      return state.campaigns.map((c) => {
        const terms = visibleTerms().filter((t) => t.campaignId === c.id);
        const hidden = state.terms.filter((t) => t.campaignId === c.id).length - terms.length;
        if (!hidden) return { ...c };
        return {
          ...c,
          cost: terms.reduce((s, t) => s + t.cost, 0),
          clicks: terms.reduce((s, t) => s + t.clicks, 0),
          conversions: terms.reduce((s, t) => s + t.conversions, 0),
        };
      });
    },
    async searchTerms() {
      return visibleTerms().map((t) => ({ ...t }));
    },
    async keywords() {
      return state.keywords.map((k) => ({ ...k }));
    },
    async ads() {
      return state.ads.map(({ createdDay: _d, quality: _q, ...ad }) => ({ ...ad, copy: structuredClone(ad.copy) }));
    },
    async negatives(campaignId) {
      return [...(state.negatives[campaignId] ?? [])];
    },
    async setNegatives(campaignId, phrases) {
      state = { ...state, negatives: { ...state.negatives, [campaignId]: [...phrases] } };
      await commit();
    },
    async setDailyBudget(campaignId, amount) {
      state = { ...state, campaigns: state.campaigns.map((c) => (c.id === campaignId ? { ...c, dailyBudget: amount } : c)) };
      await commit();
    },
    async createAd(adGroupId: string, copy: AdCopy) {
      const group = state.ads.find((a) => a.adGroupId === adGroupId) ?? state.keywords.find((k) => k.adGroupId === adGroupId);
      if (!group) throw new Error(`группы ${adGroupId} нет`);
      const id = `a${state.nextId}`;
      // Вариант чуть кликабельнее: заглушка должна уметь показать победу.
      const ad: StubAd = {
        id,
        campaignId: group.campaignId,
        adGroupId,
        active: true,
        copy: structuredClone(copy),
        clicks: 0,
        impressions: 0,
        cost: 0,
        conversions: 0,
        createdDay: state.day,
        quality: 0.075,
      };
      state = { ...state, ads: [...state.ads, ad], nextId: state.nextId + 1 };
      await commit();
      return id;
    },
    async setAdActive(adId, active) {
      if (!state.ads.some((a) => a.id === adId)) throw new Error(`объявления ${adId} нет`);
      state = { ...state, ads: state.ads.map((a) => (a.id === adId ? { ...a, active } : a)) };
      await commit();
    },
  };
}
