/**
 * Раздел «Макеты»: все макеты студии в одном списке и пароль на сутки.
 *
 * Владелец, 08.10.2026: «Надо сделать вкладку дополнительную у всех: макеты.
 * Туда сгрузи все макеты, которые мы делали в девуз. Там же генерируется
 * пароль на 24 часа для доступа клиента, после пароль протухает. Ссылка >
 * название для кого был макет > Ниша > кнопка сгенерировать пароль доступа…
 * А то макетов много, теряться начинаем в них».
 *
 * Макеты живут в двух местах, и список собирает оба:
 *
 * - прототипы на devuz.studio/proto, собранные руками (scripts/protos и
 *   «Прототипы» в панели); берутся из базы, новый появляется в списке сам.
 *   Собранных ботом для касаний (lib/proto/auto) здесь нет (владелец,
 *   09.10.2026), их ссылки у клиентов продолжают открываться;
 * - витрина globalex — проекты из content/cases.ts, чей адрес на витрине.
 *   Пароль на сутки витрина умеет только у тех, что закрыты кодом
 *   (SHOWCASE_LOCK): остальные владелец открыл всем, и для поисковиков тоже.
 *
 * Здесь — то, что не трогает базу: витрина, ниши, текст для клиента.
 * Чтение и пароли — lib/admin/mockups-store.ts.
 */
import { cases, type Case } from "@/content/cases";
import { protoNicheByKey } from "@/content/proto/models";
import { protoNichePl } from "@/content/admin-panel/proto";
import { mockupNicheDict } from "@/content/admin-panel/mockups";
import type { PanelLocale, Tr } from "@/lib/admin/i18n";
import { mockupTermsUrl } from "@/lib/proto/booking";

export const SHOWCASE_HOST = "https://globalex.maximov-tech.ru/";

/**
 * Проекты витрины, закрытые кодом: проект в content/cases.ts → ключ в
 * showcase_codes. Тот же список держит проверка в базе
 * (showcase_code_check, миграция 0094): новый ключ — сначала туда.
 */
export const SHOWCASE_LOCK: Readonly<Record<string, string>> = {
  mavera: "mavera",
  "golden-house": "gh",
  engelberg: "engelberg",
};

/** Ниша проекта витрины — ключ словаря mockupNicheDict. */
export const SHOWCASE_NICHE: Readonly<Record<string, string>> = {
  mavera: "nedvizhimost",
  "golden-house": "nedvizhimost",
  "global-export": "eksport",
  "harvest-motion": "eksport",
  adar: "podarki",
  "apollo-travel": "turagentstvo",
  engelberg: "okna",
  namuna: "mebel",
  "comfort-mebel": "mebel",
  medacademy: "uchebnyy-centr",
  delta: "it-shkola",
  "arsenal-d": "hosting",
  "akbar-rich": "dveri",
  transtelecom: "svyaz",
  tranio: "agentstvo-nedvizhimosti",
  foodmaxx: "konservy",
};

export type MockupAccess =
  /** Открывается по ссылке, без пароля. */
  | "open"
  /** Только по паролю. */
  | "closed"
  /** Проект витрины, открытый всем (и поисковикам): пароль ему не ставится. */
  | "public";

/** Строка списка. Уходит в браузер — поэтому без фактов, html и контактов. */
export type MockupRow = {
  /** «p:<id прототипа>» или «s:<проект витрины>» — так его зовёт кнопка пароля. */
  ref: string;
  kind: "proto" | "showcase";
  name: string;
  /** Сайт клиента, с которого делали: «tirex.uz». */
  site: string | null;
  /** Ссылка, которая уходит клиенту. */
  url: string;
  /** Как открыть самому из панели: прототип — через доступ команды. */
  openHref: string;
  niche: string;
  /** Когда сделан: ISO или ГГГГ-ММ-ДД. */
  created: string;
  access: MockupAccess;
  canCode: boolean;
  /** До какой минуты живёт последний выданный пароль клиента. */
  liveUntil: string | null;
  /** Сколько раз открыл клиент; у витрины не считается. */
  opens: number | null;
  /** Язык макета — на нём текст для клиента. */
  lang: "ru" | "uz";
};

/** Ниша на языке панели. Неизвестная — как есть: лучше ключ, чем пусто. */
export function mockupNiche(key: string, locale: PanelLocale): string {
  const extra = (mockupNicheDict as Record<string, Tr | undefined>)[key];
  if (extra) return extra[locale];
  const niche = protoNicheByKey(key);
  if (niche) return locale === "pl" ? (protoNichePl[key] ?? niche.ru) : niche[locale];
  return key;
}

/** Проекты витрины: все, чей адрес на globalex. */
export function showcaseCases(list: readonly Case[] = cases): Case[] {
  return list.filter((item) => item.url?.startsWith(SHOWCASE_HOST));
}

export function showcaseRow(item: Case, locale: PanelLocale, liveUntil: string | null): MockupRow {
  const locked = item.slug in SHOWCASE_LOCK;
  return {
    ref: `s:${item.slug}`,
    kind: "showcase",
    name: item.name,
    site: null,
    url: item.url!,
    openHref: item.url!,
    niche: SHOWCASE_NICHE[item.slug] ? mockupNiche(SHOWCASE_NICHE[item.slug], locale) : item.category[locale],
    created: item.date,
    access: locked ? "closed" : "public",
    canCode: locked,
    liveUntil: locked ? liveUntil : null,
    opens: null,
    lang: "ru",
  };
}

/** «p:<uuid>» или «s:<проект>»; что-то другое — null. */
export function parseMockupRef(ref: string): { kind: "proto"; id: string } | { kind: "showcase"; slug: string } | null {
  const proto = /^p:([0-9a-f-]{36})$/.exec(ref);
  if (proto) return { kind: "proto", id: proto[1] };
  const showcase = /^s:([a-z0-9-]{1,40})$/.exec(ref);
  if (showcase) return { kind: "showcase", slug: showcase[1] };
  return null;
}

/** «09.10 14:30» по Ташкенту — так время пароля видят и менеджер, и клиент. */
export function tashkentTime(iso: string): string {
  const parts = new Intl.DateTimeFormat("ru-RU", {
    timeZone: "Asia/Tashkent",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date(iso));
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return `${get("day")}.${get("month")} ${get("hour")}:${get("minute")}`;
}

/**
 * Текст клиенту — на языке макета: ссылка, пароль, до какого часа он
 * действует и ссылка на условия (правило «Макеты и прототипы» в CLAUDE.md:
 * условия идут клиенту вместе с макетом).
 */
export function clientMessage(input: { url: string; code: string; expiresAt: string; lang: "ru" | "uz" }): string {
  const until = tashkentTime(input.expiresAt);
  if (input.lang === "uz") {
    return [
      `Maketingiz: ${input.url}`,
      `Parol: ${input.code}`,
      `Parol Toshkent vaqti bilan ${until} gacha amal qiladi.`,
      `Maketdan foydalanish shartlari: ${mockupTermsUrl("uz")}`,
    ].join("\n");
  }
  return [
    `Ваш макет: ${input.url}`,
    `Пароль: ${input.code}`,
    `Пароль действует до ${until} по Ташкенту.`,
    `Условия использования макета: ${mockupTermsUrl("ru")}`,
  ].join("\n");
}
