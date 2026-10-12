import { PANEL_LOCALES, type PanelLocale } from "@/lib/admin/i18n";
import { NAV_GROUPS, navOf, type NavGroup, type Section, type Viewer } from "@/lib/admin/roles";

/**
 * Меню панели группами и быстрый переход к разделу.
 *
 * Владелец, 12.10.2026: «вкладок куча, пока в каждую задаешь — с ума
 * пойдешь». Что кому открыто, решает по-прежнему `navOf` (роль, галочки
 * владельца, выключатели) — здесь только раскладка открытого по группам и
 * поиск по названиям. Раздел, открытый галочкой, попадает в свою группу
 * так же, как положенный по роли.
 */

export type MenuGroup = { group: NavGroup; sections: Section[] };

/** Группы этого человека в порядке шапки. Пустых нет: группа без открытых разделов не рисуется. */
export function menuOf(who: Viewer): MenuGroup[] {
  const open = navOf(who);
  return NAV_GROUPS.map((group) => ({ group, sections: open.filter((s) => s.group === group) })).filter(
    (g) => g.sections.length > 0,
  );
}

/** Группа с одним разделом — просто ссылка на него: выпадающий список из одного пункта — лишний щелчок. */
export function isSingle(group: MenuGroup): boolean {
  return group.sections.length === 1;
}

/** Для сравнения: регистр, ё/е, узбекские o‘/g‘ в любом написании, польские буквы — как набирают без раскладки. */
export function foldName(text: string): string {
  return text
    .toLowerCase()
    .replace(/ё/g, "е")
    .replace(/[‘’ʻʼ'`]/g, "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/ł/g, "l")
    .trim();
}

export type Findable = { href: string; label: string; group: string; other: readonly string[] };

/** Что искать у раздела: название на языке панели, группа и названия на других языках — на случай чужой раскладки. */
export function findable(section: Section, groupLabel: string, locale: PanelLocale): Findable {
  return {
    href: section.href,
    label: section.label[locale],
    group: groupLabel,
    other: PANEL_LOCALES.filter((l) => l !== locale).map((l) => section.label[l]),
  };
}

/**
 * Разделы под набранное: «дог» → «Договоры».
 *
 * Сначала — название целиком («Konta», а не «Kontakty»), потом — где оно
 * начинается с набранного, потом — где с него начинается слово
 * («сотр» в «ИИ-сотрудники»), потом — где оно просто встречается, и в
 * конце — совпадения по названию группы («продажи» — все её разделы) и по
 * другим языкам. Пустой запрос — все разделы по порядку меню.
 */
export function findSections<T extends Findable>(query: string, items: readonly T[]): T[] {
  const q = foldName(query);
  if (!q) return [...items];
  const rank = (item: T): number => {
    const label = foldName(item.label);
    if (label === q) return 0;
    if (label.startsWith(q)) return 1;
    if (label.split(/[\s-]+/).some((w) => w.startsWith(q))) return 2;
    if (label.includes(q)) return 3;
    if (foldName(item.group).split(/\s+/).some((w) => w.startsWith(q))) return 4;
    if (item.other.some((o) => foldName(o).startsWith(q))) return 5;
    return -1;
  };
  return items
    .map((item, index) => ({ item, index, r: rank(item) }))
    .filter((x) => x.r >= 0)
    .sort((a, b) => a.r - b.r || a.index - b.index)
    .map((x) => x.item);
}
