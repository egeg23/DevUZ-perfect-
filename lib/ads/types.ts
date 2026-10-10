/**
 * Автопилот рекламы: общие типы.
 *
 * Google Ads и Яндекс Директ устроены по-разному (ресурсы и GAQL у Google,
 * сервисы и TSV-отчёты у Яндекса), но автопилоту нужно от них одно и то же:
 * кампании с деньгами и заявками, поисковые запросы, ключи, объявления — и
 * несколько изменений, каждое с обратным. Поэтому все решения принимаются
 * над этими типами, а площадка — только `AdsConnector`.
 *
 * Деньги — в валюте кабинета, обычным числом (не микро-единицами): микро
 * переводит коннектор, на границе с API.
 */

export type Platform = "yandex" | "google" | "stub";
export type Mode = "suggest" | "auto";

export type Period = { from: string; to: string };

export type Campaign = {
  id: string;
  name: string;
  /** Работает ли кампания сейчас. Остановленные не трогаем. */
  active: boolean;
  /**
   * Дневной бюджет, если он задан самой кампанией и его можно менять.
   * null — бюджет в стратегии, общий или его нет: такую кампанию автопилот
   * не двигает.
   */
  dailyBudget: number | null;
  /** Стратегия учится (Google: BIDDING_STRATEGY_LEARNING, Яндекс: обучение). */
  learning: boolean;
  /** Сколько дней из периода кампания показывалась. */
  activeDays: number;
  cost: number;
  clicks: number;
  impressions: number;
  conversions: number;
  revenue: number;
};

export type SearchTerm = {
  campaignId: string;
  adGroupId: string;
  query: string;
  clicks: number;
  impressions: number;
  cost: number;
  conversions: number;
};

export type Keyword = {
  campaignId: string;
  adGroupId: string;
  id: string;
  text: string;
};

export type AdCopy = {
  /** Яндекс: заголовок 1 и 2; Google: заголовки адаптивного объявления. */
  headlines: string[];
  /** Яндекс: текст; Google: описания. */
  descriptions: string[];
  url: string;
};

export type Ad = {
  id: string;
  campaignId: string;
  adGroupId: string;
  active: boolean;
  /** Площадка отклонила объявление на модерации — оно не показывается. */
  rejected?: boolean;
  copy: AdCopy;
  clicks: number;
  impressions: number;
  cost: number;
  conversions: number;
};

/**
 * Что автопилот умеет делать с кабинетом. Каждое изменение — с обратным:
 * `setNegatives` возвращает прежний список, бюджет — прежнюю сумму, новое
 * объявление ставится на паузу, а не удаляется. Удалять автопилот не умеет
 * вовсе: такого метода нет.
 */
export interface AdsConnector {
  readonly platform: Platform;
  campaigns(period: Period): Promise<Campaign[]>;
  searchTerms(period: Period): Promise<SearchTerm[]>;
  keywords(): Promise<Keyword[]>;
  ads(period: Period): Promise<Ad[]>;
  /** Минус-фразы кампании как они есть сейчас. */
  negatives(campaignId: string): Promise<string[]>;
  /** Записать минус-фразы кампании целиком (добавление и откат — через него). */
  setNegatives(campaignId: string, phrases: string[]): Promise<void>;
  setDailyBudget(campaignId: string, amount: number): Promise<void>;
  /** Новое объявление в группе; вернуть его id. */
  createAd(adGroupId: string, copy: AdCopy): Promise<string>;
  setAdActive(adId: string, active: boolean): Promise<void>;
}

/* ── Предложения ───────────────────────────────────────────────────────── */

export type NegativesPayload = {
  kind: "negatives";
  campaignId: string;
  campaignName: string;
  phrases: string[];
};

export type BudgetMove = { campaignId: string; campaignName: string; from: number; to: number };

export type BudgetPayload = {
  kind: "budget";
  moves: BudgetMove[];
};

export type AdTestPayload = {
  kind: "ad_test";
  campaignId: string;
  adGroupId: string;
  controlAdId: string;
  copy: AdCopy;
  lang: "ru" | "uz";
};

export type AdWinnerPayload = {
  kind: "ad_winner";
  testId: number;
  /** Объявление, которое ставим на паузу. */
  loserAdId: string;
  winnerAdId: string;
};

export type Payload = NegativesPayload | BudgetPayload | AdTestPayload | AdWinnerPayload;
export type ProposalKind = Payload["kind"];

export type Draft = {
  kind: ProposalKind;
  /** Одинаковое предложение не заводится, пока открыто первое. */
  dedupeKey: string;
  title: string;
  /** Почему — простыми словами, с цифрами. */
  why: string;
  numbers: Record<string, number | string>;
  payload: Payload;
};

/* ── Кабинет и его ограничители ────────────────────────────────────────── */

export type Thresholds = {
  /** Сколько денег запрос или слово должны потратить без заявки, чтобы стать минусом. */
  wasteCost: number;
  /** И сколько кликов при этом собрать — меньше двух кликов ничего не значит. */
  wasteClicks: number;
  /** Своя цена заявки, если известна, — иначе берётся средняя по кабинету. */
  targetCpa: number | null;
  /** Слова, которые нельзя делать минусом никогда: бренд, услуга, город. */
  protectedWords: string[];
  /** Что за бизнес — для модели, которая отличает мусорные запросы. */
  business: string;
};

export const DEFAULT_THRESHOLDS: Thresholds = {
  wasteCost: 0,
  wasteClicks: 3,
  targetCpa: null,
  protectedWords: [],
  business: "",
};

export type AccountLimits = {
  mode: Mode;
  /** Стоп-кран: ничего не применяется, ни руками, ни автопилотом. */
  stopped: boolean;
  /** На сколько процентов можно сдвинуть бюджет одной кампании за раз. */
  maxShiftPct: number;
  /** Сколько изменений в сутки автопилот может применить в кабинете. */
  maxActionsDay: number;
};
