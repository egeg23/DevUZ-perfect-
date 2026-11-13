/**
 * «Собрать макет» на главной сайта — тот же поток, что «Макет в боте»
 * (lib/proto/instant/bot.ts), только окно на сайте вместо лички бота.
 *
 * Владелец, 13.11.2026: «на сайте давай сделаем интерактивную генерацию
 * макета по нишам, как мы сделали в тг: чтобы перед кейсами человек мог
 * интерактивно (но с красивой анимацией отрисовки сайта, будто он делается
 * прямо сейчас, не схематично, а именно тот сайт, который он увидит) собрать
 * себе макет… И потом прямо в этом интерактивном окне получает результат.»
 *
 * Сборка — та же: сайт открывает наш аудитор (siteOpens), читает
 * readClientSite (Haiku, не больше READ_SLOTS разом), собирает buildInstant
 * со всеми проверками (условия, видео DevUz, отпечаток, ловушки, тире,
 * хвосты), пишет saveInstantProto. Шаги приходят в окно по мере того, как
 * сервер их делает: поток событий (`SiteEvent`), а не таймер.
 *
 * Лимит без Telegram-аккаунта: один макет на браузер (кука `dz_mk`),
 * не больше SITE_IP_DAY с одного адреса за сутки и SITE_DAY_CAP на всех
 * за сутки; ловушка-поле для ботов, как `website` у /api/lead. Лид — только
 * когда человек сам оставил контакт (`webLeadInput`): адрес сайта и телефон
 * с его сайта — не согласие, что ему напишут.
 */
import { cases } from "@/content/cases";
import { CASE_NICHES, nicheFromWords } from "@/lib/proto/instant/bot";
import { buildInstant, type InstantBuild } from "@/lib/proto/instant/build";
import { siteUrlOf } from "@/lib/proto/instant/limits";
import { addonTitle, offerAddons } from "@/lib/proto/instant/offer";
import { siteFromAnswers, type ReadResult } from "@/lib/proto/instant/read";
import type { BuildStep } from "@/lib/proto/instant/widget";
import { OFFER_MS } from "@/lib/admin/mockup-offer";
import { CIRCLE_NICHES, CIRCLE_NICHE_RU, isCircleNiche, type CircleNiche } from "@/lib/admin/sales-after-reply";
import { detectContactKind } from "@/lib/contact";
import { instantReady, type InstantLocale, type InstantNiche, type InstantSite } from "@/lib/proto/instant/types";
import type { QualifyToolInput } from "@/lib/qualify/types";

/** Метка макета с сайта: `facts.instant.via`. Бот её не ставит. */
export const SITE_VIA = "site";
/** Кука браузера: по ней «один макет на браузер». */
export const WEB_COOKIE = "dz_mk";
/** Сколько макетов с одного адреса за сутки: офис или семья за одним роутером — не один. */
export const SITE_IP_DAY = 3;
/** Сколько макетов с сайта на всех за сутки: сервер общий с сайтом и ботом. */
export const SITE_DAY_CAP = 80;
/** Сколько один шаг виден в окне, как STEP_SHOW_MS в боте. */
export const SITE_STEP_MS = 900;

/** Макет — на русском или узбекском, как в боте: других языков у наших макетов нет. */
export function mockupLocaleOf(siteLocale: string): InstantLocale {
  return siteLocale === "uz" ? "uz" : "ru";
}

/** Сферы карточками — те же, что кнопки в боте, «Другое» последним. */
export function siteNiches(): CircleNiche[] {
  return [...CIRCLE_NICHES.filter((n) => n !== "general"), "general"];
}

export type SiteAnswers = { name: string; phone: string; address: string; services: string };

/** Что прислал браузер — уже проверенное. */
export type SiteRequest = {
  locale: InstantLocale;
  siteLocale: string;
  niche: CircleNiche;
  /** Сфера словами — на «Другое». */
  what: string | null;
  url: string | null;
  instagram: string | null;
  answers: SiteAnswers | null;
};

const text = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

/** Instagram в адресе: профиль, без поста и рилса. */
export function instagramOfSite(value: string): string | null {
  const m = /instagram\.com\/([A-Za-z0-9._]{2,30})/i.exec(value);
  if (m && !/^(p|reel|reels|stories|explore)$/i.test(m[1])) return m[1];
  const at = /^@([A-Za-z0-9._]{2,30})$/.exec(value.trim());
  return at ? at[1] : null;
}

/**
 * Тело запроса → запрос сборки или почему нет. Ловушка заполнена — "trap":
 * отвечаем, как будто всё хорошо, и ничего не собираем.
 */
export function parseSiteRequest(body: Record<string, unknown>): SiteRequest | "trap" | "bad" {
  if (text(body.hp, 200)) return "trap";
  const siteLocale = text(body.locale, 5) || "ru";
  const locale = mockupLocaleOf(siteLocale);
  const nicheRaw = text(body.niche, 40);
  if (!isCircleNiche(nicheRaw)) return "bad";
  const what = text(body.what, 120) || null;
  // «Другое» — ближайший наш макет по словам, как в боте.
  const niche = nicheRaw === "general" ? (what ? nicheFromWords(what) : "general") : nicheRaw;
  const address = text(body.url, 300);
  const instagram = address ? instagramOfSite(address) : null;
  const url = address && !instagram ? siteUrlOf(address) : null;
  const a = body.answers && typeof body.answers === "object" ? (body.answers as Record<string, unknown>) : null;
  const answers: SiteAnswers | null = a
    ? { name: text(a.name, 60), phone: text(a.phone, 30), address: text(a.address, 140), services: text(a.services, 1500) }
    : null;
  if (!url) {
    // Без сайта — нужны ответы: название и телефон обязательны, как в боте.
    if (!answers || !answers.name || answers.phone.replace(/\D/g, "").length < 9) return "bad";
  }
  return { locale, siteLocale, niche, what, url, instagram, answers: url ? null : answers };
}

export type LimitInput = { has: "none" | "ready" | "draft"; ipDay: number; allDay: number };
export type SiteLimit = "ok" | "has" | "draft" | "ip" | "day";

/** Один макет на браузер, потолок на адрес и на всех за сутки. */
export function siteLimit(input: LimitInput): SiteLimit {
  if (input.has === "ready") return "has";
  if (input.has === "draft") return "draft";
  if (input.ipDay >= SITE_IP_DAY) return "ip";
  if (input.allDay >= SITE_DAY_CAP) return "day";
  return "ok";
}

/** Кейсы сферы на языке сайта: до трёх, нет — все кейсы. */
export function siteCaseLinks(niche: CircleNiche, siteLocale: string): { name: string; href: string }[] {
  const keys = CASE_NICHES[niche];
  const found = cases.filter((c) => c.forNiches.some((n) => keys.includes(n))).slice(0, 3);
  return found.map((c) => ({ name: c.name, href: `/${siteLocale}/cases/${c.slug}` }));
}

/** Что окно знает о клиенте по ходу сборки: имя, цвет, услуги — как виджет в боте. */
export type SiteInfo = { name?: string; color?: string | null; services?: string[]; host?: string | null };

export type SiteDone = {
  t: "done";
  token: string;
  name: string;
  niche: InstantNiche;
  color: string | null;
  admin: boolean;
  /** Когда кончаются спецусловия: 48 часов от сборки. */
  expires: string;
  addons: { name: string; price: number }[];
};

export type SiteEvent =
  | { t: "step"; step: BuildStep; info?: SiteInfo }
  | { t: "open" }
  | { t: "manual"; why: "failed" | "limit"; niche: CircleNiche; cases: { name: string; href: string }[] }
  | { t: "has"; token: string; name: string; admin: boolean }
  | SiteDone
  | { t: "error" };

export type SiteDeps = {
  reachable: (url: string) => Promise<string | null>;
  read: (url: string, niche: InstantNiche, locale: InstantLocale, onStep: (s: BuildStep, site?: InstantSite) => Promise<void>) => Promise<ReadResult>;
  save: (build: InstantBuild) => Promise<{ id: string; token: string } | null>;
  now: () => Date;
  pace?: (ms: number) => Promise<void>;
};

const hostOf = (url: string | null) => {
  try {
    return url ? new URL(url).hostname.replace(/^www\./, "") || null : null;
  } catch {
    return null;
  }
};

const infoOf = (site: InstantSite, host: string | null): SiteInfo => ({
  name: site.name || undefined,
  color: site.color,
  services: site.services.map((s) => s.name).slice(0, 6),
  host,
});

/**
 * Сборка для окна на сайте: каждый шаг — после настоящего шага сервера,
 * как runBuild в боте. Источник макета без сайта — «ответы на сайте», а не
 * «ответы в Telegram»: строка печатается в подвале макета.
 */
export async function runSiteBuild(req: SiteRequest, deps: SiteDeps, emit: (e: SiteEvent) => void): Promise<SiteEvent> {
  const finish = (e: SiteEvent) => {
    emit(e);
    return e;
  };
  const manual = () => finish({ t: "manual", why: "failed", niche: req.niche, cases: siteCaseLinks(req.niche, req.siteLocale) });
  if (!instantReady(req.niche)) return manual();
  const niche = req.niche;
  const pace = deps.pace ?? ((ms: number) => new Promise<void>((r) => setTimeout(r, ms)));
  const host = hostOf(req.url);
  let info: SiteInfo = { host };
  let first = true;
  const step = async (s: BuildStep) => {
    if (!first) await pace(SITE_STEP_MS);
    first = false;
    emit({ t: "step", step: s, info });
  };

  let site: InstantSite | null = null;
  if (req.url) {
    await step("read");
    const fail = await deps.reachable(req.url);
    if (fail) {
      console.error("макет на сайте: сайт не открылся:", fail);
      return finish({ t: "open" });
    }
    const res = await deps.read(req.url, niche, req.locale, async (s, partial) => {
      if (partial) info = infoOf(partial, host);
      if (s !== "read") await step(s);
    });
    if (!res.ok) {
      console.error("макет на сайте: сайт не прочитан:", res.why);
      return finish({ t: "open" });
    }
    site = res.site;
  } else if (req.answers) {
    const a = req.answers;
    site = siteFromAnswers({ niche, locale: req.locale, name: a.name, phone: a.phone, address: a.address, services: a.services, instagram: req.instagram });
    site = { ...site, source: req.locale === "uz" ? "devuz.studio saytidagi javoblar" : "ответы на сайте devuz.studio" };
    info = infoOf(site, null);
    await step("brand");
    await step("services");
  }
  if (!site) return finish({ t: "error" });

  info = infoOf(site, host);
  await step("build");
  const build = buildInstant(site, undefined, deps.now());
  await step("check");
  if (build.problems.length) {
    console.error("макет на сайте: проверка не прошла", build.problems.map((p) => p.code).join(","));
    await deps.save(build); // черновиком: в «Макетах» видно, что не так
    return manual();
  }
  const saved = await deps.save(build);
  if (!saved) return manual();
  await step("done");
  const at = deps.now();
  return finish({
    t: "done",
    token: saved.token,
    name: build.site.name,
    niche: build.site.niche,
    color: build.site.color,
    admin: Boolean(build.pages.admin),
    expires: new Date(at.getTime() + OFFER_MS).toISOString(),
    addons: offerAddons(build.site.niche).map((x) => ({ name: addonTitle(x, req.locale), price: x.price })),
  });
}

/** Контакт, который человек оставил в окне: Telegram или телефон. */
export function contactOk(value: string): boolean {
  const v = value.trim();
  if (/^@?[A-Za-z][A-Za-z0-9_]{4,31}$/.test(v) || /t\.me\/[A-Za-z0-9_]{5,32}/i.test(v)) return true;
  return v.replace(/\D/g, "").length >= 9;
}

export type WebLead = {
  contact: string;
  name: string;
  niche: CircleNiche;
  site: string | null;
  link: string | null;
  why: "built" | "failed";
  siteLocale: string;
};

/** Лид без диалога — как у бота: грейды худшие, суть — в заметке. */
export function webLeadInput(input: WebLead): QualifyToolInput {
  const niche = CIRCLE_NICHE_RU[input.niche];
  const what =
    input.why === "built" ? "собрал себе макет на сайте devuz.studio (блок «Собрать макет» на главной)" : "хотел макет на сайте devuz.studio, автоматически не собрался: нужен макет вручную";
  const request = [`Клиент ${what}.`, `Сфера: ${niche}.`, input.site ? `Сайт: ${input.site}` : "Сайта нет.", input.link ? `Макет: ${input.link}` : ""].filter(Boolean).join(" ");
  const unknown = "не выяснено: лид из «Собрать макет» на сайте, без диалога";
  const opener =
    input.why === "built"
      ? "Здравствуйте! Видел, вы собрали макет сайта у нас на devuz.studio. Как вам? Могу показать за 15 минут, что ещё добавить и сколько это будет стоить."
      : "Здравствуйте! Я из DevUz Studio, вы хотели макет сайта у нас на devuz.studio. Расскажите, чем занимается компания, и я соберу его для вас.";
  return {
    contact_name: "",
    company: input.name,
    contact_handle: input.contact,
    contact_kind: detectContactKind(input.contact),
    niche,
    niche_tier: 3,
    expertise: "low",
    services: ["website"],
    budget: "B3",
    authority: "A3",
    need: input.why === "built" ? "N2" : "N3",
    timing: "T3",
    intent: "needs_human",
    summary: { client: input.name || input.contact, request, niche, expertise: unknown, budget: unknown, authority: unknown, need: unknown, timing: unknown },
    notes: `${request} Контакт клиент оставил сам в окне «Собрать макет».`,
    opening_line: opener,
    already_told: [],
    avoid_asking: [],
  };
}
