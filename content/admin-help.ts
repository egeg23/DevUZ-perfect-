import type { HelpEntry } from "@/lib/admin/help";
import { SECTIONS, type Role } from "@/lib/admin/roles";

import { ru } from "@/content/admin-help-ru";
import { uz } from "@/content/admin-help-uz";
import { pl } from "@/content/admin-help-pl";

/**
 * Инструкции к панели.
 *
 * Три языка — те же, что у панели (lib/admin/i18n.ts): русский, узбекский
 * латиницей и польский. Инструкция открывается на языке панели сотрудника.
 *
 * Правило владельца (см. CLAUDE.md): простыми словами, но подробно — что от
 * чего зависит и зачем; у менеджера, руководителя и владельца — своё, по
 * правам доступа; из каждого раздела кнопка ведёт в нужный пункт. Текст —
 * в admin-help-ru.ts и admin-help-uz.ts, устройство пунктов и якорей — в
 * lib/admin/help.ts.
 *
 * Разделы хранятся по адресу вкладки, а не списком: так тесты сверяют их с
 * настоящим меню (`SECTIONS`) и ловят вкладку, которую завели, а описать
 * забыли.
 */

export const HELP_LOCALES = ["ru", "uz", "pl"] as const;
export type HelpLocale = (typeof HELP_LOCALES)[number];

export function isHelpLocale(value: string | undefined): value is HelpLocale {
  return (HELP_LOCALES as readonly string[]).includes(value ?? "");
}

export const HELP_LOCALE_NAME: Record<HelpLocale, string> = {
  ru: "Русский",
  uz: "O‘zbekcha",
  pl: "Polski",
};

export type HelpChannel = {
  name: string;
  /** Ссылка, если в канал можно войти самому. */
  url: string | null;
  what: string;
  how: string[];
  /** Кому показывать. Не задано — всем. */
  roles?: readonly Role[];
};

/** Подписи поля «Найти в инструкции» (components/admin/help-search.tsx). */
export type HelpSearchCopy = {
  label: string;
  placeholder: string;
  button: string;
  searching: string;
  /** «Открыт пункт:» — перед названием найденного пункта. */
  opened: string;
  /** «Ещё может подойти:» — перед остальными найденными пунктами. */
  also: string;
  /** Нашли не модель, а совпадение слов. */
  byWords: string;
  nothing: string;
  failed: string;
};

export type HelpCopy = {
  title: string;
  lead: string;
  contentsTitle: string;
  sectionsTitle: string;
  openSection: string;
  /** «Показать как:» — переключатель роли у владельца. */
  viewAs: string;
  roleNames: Record<Role, string>;
  /** Ключ — адрес вкладки из меню. */
  sections: Record<string, HelpEntry>;
  ownerOnly: string;
  search: HelpSearchCopy;
  channelsTitle: string;
  channelsLead: string;
  channels: HelpChannel[];
  rulesTitle: string;
  rules: string[];
  askTitle: string;
  ask: string;
};

const copy: Record<HelpLocale, HelpCopy> = { ru, uz, pl };

export function helpCopy(locale: HelpLocale): HelpCopy {
  return copy[locale];
}

/** Адреса вкладок в порядке меню — чтобы инструкция шла тем же порядком. */
export const HELP_ORDER: readonly string[] = SECTIONS.map((section) => section.href);
