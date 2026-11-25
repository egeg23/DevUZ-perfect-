import { isLocale, locales, type Locale } from "@/lib/i18n";

/**
 * Версия сайта для ИИ-агентов: у каких страниц есть текстовый двойник.
 *
 * Владелец, 24.11.2026: «Нам нужно сделать отдельную версию сайта для Ии
 * агентов, как сделали Akamai» (у них указатель llms.txt и к адресу любой
 * страницы дописывается `.md`). На «делаем по твоему плану» — «Делаем.
 * Разрешаем агенту отправлять нам заявки».
 *
 * Здесь только адреса, без текстов: модуль читает middleware, и тянуть в
 * него кейсы и словари незачем. Тексты — lib/agent/markdown.ts.
 *
 * Двойник — тот же текст, что видит человек, без вёрстки: другие цены или
 * обещания роботам отдавать нельзя (поисковик считает это подменой).
 */

/** Разделы с двойником. Ключ — первая часть пути после языка. */
const WITH_CHILDREN = new Set(["services", "cases"]);
const LEAF = new Set(["contact"]);

/** Весь язык одним файлом: `/ru/full.md`. Только как `.md`. */
export const FULL_SEGMENT = "full";

/** Куда middleware переписывает запрос двойника (app/agent-md). */
export const AGENT_MD_ROUTE = "/agent-md";

/** Куда агент шлёт заявку за клиента (app/api/agent/lead). */
export const AGENT_LEAD_PATH = "/api/agent/lead";

export type AgentPath = { locale: Locale; segments: string[] };

const SLUG = /^[a-z0-9][a-z0-9-]{0,80}$/;

function known(segments: string[], md: boolean): boolean {
  if (segments.length === 0) return true;
  const [head, slug, ...rest] = segments;
  if (rest.length) return false;
  if (head === FULL_SEGMENT) return md && slug === undefined;
  if (LEAF.has(head)) return slug === undefined;
  if (WITH_CHILDREN.has(head)) return slug === undefined || SLUG.test(slug);
  return false;
}

/**
 * Разбирает адрес: обычный (`/ru/services/landing-page`) или с `.md` на
 * конце (`/ru/services/landing-page.md`, главная — `/ru.md`). Чужой адрес,
 * панель, раздел без двойника — null.
 */
export function agentPath(pathname: string): (AgentPath & { md: boolean }) | null {
  const md = pathname.endsWith(".md");
  const clean = (md ? pathname.slice(0, -3) : pathname).replace(/\/+$/, "");
  const [, locale, ...segments] = clean.split("/");
  if (!isLocale(locale)) return null;
  if (!known(segments, md)) return null;
  return { locale, segments, md };
}

/** Адрес двойника: `/ru.md`, `/ru/cases/samauto.md`. */
export function agentMdHref(locale: Locale, segments: readonly string[] = []): string {
  return `/${[locale, ...segments].join("/")}.md`;
}

/** Адрес страницы для людей. */
export function agentHtmlHref(locale: Locale, segments: readonly string[] = []): string {
  return `/${[locale, ...segments].join("/")}`;
}

/** Просит ли клиент текст, а не страницу: `Accept: text/markdown` без HTML. */
export function wantsMarkdown(accept: string | null): boolean {
  if (!accept) return false;
  const value = accept.toLowerCase();
  return value.includes("text/markdown") && !value.includes("text/html");
}

export const AGENT_LOCALES: readonly Locale[] = locales;
