/**
 * Сборка «Макета в боте»: данные клиента → шаблон ниши → отпечаток.
 *
 * Строковая подстановка в готовый шаблон, без браузера и без модели: на
 * сервере это миллисекунды (CLAUDE.md «Сервер не собирает сайт»). Проверка
 * (lib/proto/instant/check) идёт по странице до отпечатка — там видны
 * ловушки и метка числа; отпечаток (lib/proto/stamp) — свой на клиента.
 */
import { dentalHtml } from "@/lib/proto/instant/dental";
import { medcentrHtml } from "@/lib/proto/instant/medcentr";
import { kpHtml } from "@/lib/proto/instant/kp";
import { MOCKUP_TERMS_PATH } from "@/content/mockup-terms";
import { adminHtml, panelHtml } from "@/lib/proto/instant/admin";
import { mebelHtml } from "@/lib/proto/instant/mebel";
import { restoranHtml } from "@/lib/proto/instant/restoran";
import { salonHtml } from "@/lib/proto/instant/salon";
import { turHtml } from "@/lib/proto/instant/tur";
import { eduHtml } from "@/lib/proto/instant/edu";
import { nedvHtml } from "@/lib/proto/instant/nedv";
import { magazinHtml } from "@/lib/proto/instant/magazin";
import { avtoservisHtml } from "@/lib/proto/instant/avtoservis";
import { logistikaHtml } from "@/lib/proto/instant/logistika";
import { stroitelstvoHtml } from "@/lib/proto/instant/stroitelstvo";
import { uslugiHtml } from "@/lib/proto/instant/uslugi";
import { avtosalonHtml } from "@/lib/proto/instant/avtosalon";
import { foreignWords, instantProblems, tailsIn, type InstantProblem } from "@/lib/proto/instant/check";
import { brandColor, clean, handleOf, imageUrl } from "@/lib/proto/instant/safe";
import { INSTANT_LOCALES, LIMITS, instantMissing, isBaseLocale, type BaseSite, type InstantLocale, type InstantNiche, type InstantSite } from "@/lib/proto/instant/types";
import { pageProblems, withoutDashes } from "@/lib/proto/plain-text";
import { newSeed, stampHtml, type Stamp } from "@/lib/proto/stamp";
import { withTelegramFix } from "@/lib/proto/instant/telegram";

const TEMPLATES: Record<InstantNiche, (s: BaseSite) => string> = { stomatologiya: dentalHtml, medcentr: medcentrHtml, mebel: mebelHtml, restoran: restoranHtml, turagentstvo: (s: BaseSite) => turHtml(s), "uchebnyy-centr": eduHtml, nedvizhimost: nedvHtml, "salon-krasoty": salonHtml, magazin: magazinHtml, avtoservis: avtoservisHtml, logistika: logistikaHtml, stroitelstvo: stroitelstvoHtml, uslugi: uslugiHtml, avtosalon: avtosalonHtml };
/** Сферы с переводом шаблона на en, ar, pl (MOCKUP_EXTRA). */
const EXTRA_TEMPLATES: Partial<Record<InstantNiche, (s: InstantSite) => string>> = { stomatologiya: dentalHtml, medcentr: medcentrHtml, restoran: restoranHtml };

/**
 * Страница сферы на языке клиента. Сфера без перевода на en, ar, pl сюда не
 * доходит (бот ведёт её ручным путём, mockupSpeaks); на всякий случай — на
 * русском, и проверка `lang` не пропустит такую страницу клиенту.
 */
function pageOf(site: InstantSite): string {
  const extra = EXTRA_TEMPLATES[site.niche];
  if (isBaseLocale(site.locale)) return TEMPLATES[site.niche](site as BaseSite);
  return extra ? extra(site) : TEMPLATES[site.niche]({ ...site, locale: "ru" });
}

const plain = (text: string | null, max: number) => {
  const out = clean(text, max);
  return out ? withoutDashes(out) : null;
};

/** Очистить данные: длины, тире, адреса, дубли. Чужое поле — пустое, а не сломанное. */
export function normalizeSite(raw: InstantSite): InstantSite {
  const seen = new Set<string>();
  const uniq = <T,>(list: T[], key: (x: T) => string) =>
    list.filter((x) => {
      const k = key(x).toLowerCase();
      if (!k || seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  const services = uniq(
    (raw.services ?? [])
      .map((s) => ({ name: plain(s?.name ?? null, 70) ?? "", price: plain(s?.price ?? null, 40) }))
      .filter((s) => s.name),
    (s) => `s:${s.name}`,
  ).slice(0, LIMITS.services);
  const doctors = uniq(
    (raw.doctors ?? [])
      .map((d) => ({ name: plain(d?.name ?? null, 60) ?? "", role: plain(d?.role ?? null, 80) }))
      .filter((d) => d.name),
    (d) => `d:${d.name}`,
  ).slice(0, LIMITS.doctors);
  const perks = uniq(
    (raw.perks ?? []).map((p) => plain(p, 140) ?? "").filter(Boolean),
    (p) => `p:${p}`,
  ).slice(0, LIMITS.perks);
  return {
    niche: raw.niche,
    locale: (INSTANT_LOCALES as readonly string[]).includes(raw.locale) ? (raw.locale as InstantLocale) : "ru",
    name: plain(raw.name, 60) ?? "",
    tagline: plain(raw.tagline, 80),
    about: plain(raw.about, 320),
    city: plain(raw.city, 40),
    color: brandColor(raw.color),
    logo: imageUrl(raw.logo),
    services,
    doctors,
    perks,
    phone: plain(raw.phone, 30),
    telegram: handleOf(raw.telegram),
    whatsapp: plain(raw.whatsapp, 30),
    instagram: handleOf(raw.instagram),
    address: plain(raw.address, 140),
    hours: plain(raw.hours, 80),
    photos: (raw.photos ?? []).map(imageUrl).filter((u): u is string => Boolean(u)).slice(0, LIMITS.photos),
    source: plain(raw.source, 120) ?? "",
  };
}

export type InstantBuild = {
  site: InstantSite;
  /** Страница с отпечатком — то, что уходит клиенту. */
  html: string;
  stamp: Stamp;
  problems: InstantProblem[];
  /**
   * Страницы рядом с макетом: `kp` — КП на бланке, цена закреплена на 48 часов
   * от сборки; `admin` — админка сферы из нашего макета (lib/proto/instant/admin),
   * у сферы без панели её нет.
   */
  pages: { kp: string; admin?: string; panel?: string };
};

export function buildInstant(raw: InstantSite, seed = newSeed(), now = new Date()): InstantBuild {
  const site = normalizeSite(raw);
  const missing = instantMissing(site);
  const page = withTelegramFix(pageOf(site));
  const problems = [
    ...missing.map((m) => ({ code: `missing:${m}`, text: m === "name" ? "Нет названия." : "Нет телефона, Telegram или WhatsApp." })),
    ...instantProblems(page, site),
  ];
  const stamped = stampHtml(page, seed);
  // Слова-ловушки — после отпечатка: хвостом прошлого клиента стать не могут, но проверим.
  const late = tailsIn(stamped.html, site);
  if (late.length && !problems.some((p) => p.code === "tail")) problems.push({ code: "tail", text: `Хвост: ${late[0]}` });
  const lateForeign = foreignWords(stamped.html, site);
  if (lateForeign.length && !problems.some((p) => p.code === "lang")) problems.push({ code: "lang", text: `Русские слова после отпечатка: ${lateForeign.slice(0, 3).join(", ")}` });
  const kp = kpHtml(site, now);
  for (const p of pageProblems(kp, site.name)) problems.push({ code: `kp-${p.code}`, text: `КП: ${p.text}` });
  const kpForeign = foreignWords(kp, site);
  if (kpForeign.length) problems.push({ code: "kp-lang", text: `КП: русские слова на ${site.locale}: ${kpForeign.slice(0, 5).join(", ")}` });
  const pages: InstantBuild["pages"] = { kp };
  // Админки наших макетов — на русском и узбекском; на en, ar, pl макет идёт без админки.
  const base = isBaseLocale(site.locale) ? (site as BaseSite) : null;
  const admin = base && adminHtml(base);
  if (admin) {
    // Тот же отпечаток, что у макета: ловушки и числа скрипта — свои у клиента.
    const panel = stampHtml(admin, stamped.stamp.seed).html;
    const left = tailsIn(panel, site);
    if (left.length) problems.push({ code: "admin-tail", text: `Админка: хвост прошлого макета: ${left.slice(0, 3).join(", ")}` });
    if (!panel.includes(MOCKUP_TERMS_PATH)) problems.push({ code: "admin-terms", text: "Админка: нет ссылки на условия макета." });
    if (/<script[^>]+src=/i.test(panel) || /<iframe/i.test(panel)) problems.push({ code: "admin-net", text: "Админка: скрипт или страница со стороны." });
    for (const p of pageProblems(panel, site.name)) problems.push({ code: `admin-${p.code}`, text: `Админка: ${p.text}` });
    pages.admin = panel;
  }
  // Вторая панель (у логистики — «Обычная админка» рядом с супер-админкой): те же проверки.
  const second = base && panelHtml(base);
  if (second) {
    const pn = stampHtml(second, stamped.stamp.seed).html;
    const left = tailsIn(pn, site);
    if (left.length) problems.push({ code: "panel-tail", text: `Панель: хвост прошлого макета: ${left.slice(0, 3).join(", ")}` });
    if (!pn.includes(MOCKUP_TERMS_PATH)) problems.push({ code: "panel-terms", text: "Панель: нет ссылки на условия макета." });
    if (/<script[^>]+src=/i.test(pn) || /<iframe/i.test(pn)) problems.push({ code: "panel-net", text: "Панель: скрипт или страница со стороны." });
    for (const p of pageProblems(pn, site.name)) problems.push({ code: `panel-${p.code}`, text: `Панель: ${p.text}` });
    pages.panel = pn;
  }
  return { site, html: stamped.html, stamp: stamped.stamp, problems, pages };
}
