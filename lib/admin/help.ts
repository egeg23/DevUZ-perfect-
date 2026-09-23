import { SECTIONS, type Role } from "@/lib/admin/roles";

/**
 * Устройство инструкций: пункты, якоря, роли и ссылки внутри текста.
 *
 * Сам текст лежит в content/admin-help.ts, здесь — только то, по чему его
 * читают страница инструкций, кнопка «Как пользоваться разделом» и тесты.
 *
 * Владелец: «инструкции у менеджеров, руководителей и у меня разные — по
 * правам доступа». Поэтому у пункта может быть свой текст для каждой роли:
 * менеджеру в «Лидах» рассказывают про «Взять» и очередь, руководителю — про
 * лиды команды, владельцу — про вкладки главной. Якорь при этом один: кнопка
 * «?» у блока ведёт в тот же пункт, а какой текст там откроется, решает роль
 * читающего.
 */

/** Абзац. Внутри — `[текст](/admin/раздел#пункт)` для ссылок и `**так**` для выделения. */
export type Para = string;

/** Текст пункта для каждой роли отдельно. Роли без текста этот пункт не видят. */
export type ByRole = Partial<Record<Role, readonly Para[]>>;

export type HelpItem = {
  /** Часть якоря: `#<раздел>-<id>`. Латиница, через дефис. Менять нельзя — на него ведут кнопки «?». */
  id: string;
  title: string;
  body: readonly Para[] | ByRole;
  /** Кому показывать. Не задано — всем, кто видит раздел (или всем ролям из `body`, если он по ролям). */
  roles?: readonly Role[];
};

export type HelpEntry = {
  /** Что это за раздел и зачем он — двумя-тремя фразами. */
  what: string;
  items: readonly HelpItem[];
};

export function isByRole(body: HelpItem["body"]): body is ByRole {
  return !Array.isArray(body);
}

/** Якорь раздела: «/admin» — это лиды, остальное — последняя часть адреса. */
export function helpSlug(href: string): string {
  return href === "/admin" ? "leads" : href.replace(/^\/admin\//, "");
}

export function helpAnchor(href: string, itemId?: string): string {
  return itemId ? `${helpSlug(href)}-${itemId}` : helpSlug(href);
}

export function helpHref(href: string, itemId?: string): string {
  return `/admin/help#${helpAnchor(href, itemId)}`;
}

/**
 * Какие роли видят пункт — с учётом того, кто вообще видит раздел.
 *
 * Пересечение, а не что-то одно: пункт «для руководителя» в разделе, куда
 * руководителя не пускают, показывать некому, и тест это поймает.
 */
export function itemRoles(item: HelpItem, sectionRoles: readonly Role[]): Role[] {
  const own = item.roles ?? (isByRole(item.body) ? (Object.keys(item.body) as Role[]) : sectionRoles);
  return sectionRoles.filter((role) => own.includes(role));
}

/** Текст пункта для роли; null — эта роль пункт не видит. */
export function bodyFor(item: HelpItem, role: Role, sectionRoles: readonly Role[]): readonly Para[] | null {
  if (!itemRoles(item, sectionRoles).includes(role)) return null;
  if (!isByRole(item.body)) return item.body;
  return item.body[role] ?? null;
}

export type Inline =
  | { kind: "text"; text: string }
  | { kind: "bold"; text: string }
  | { kind: "link"; text: string; href: string };

const INLINE = /\[([^\]]+)\]\(([^)\s]+)\)|\*\*([^*]+)\*\*/g;

/** Разбор абзаца на текст, ссылки и выделение. Больше ничего: инструкция — не документ Word. */
export function parseInline(text: string): Inline[] {
  const out: Inline[] = [];
  let last = 0;
  for (const match of text.matchAll(INLINE)) {
    const at = match.index ?? 0;
    if (at > last) out.push({ kind: "text", text: text.slice(last, at) });
    if (match[1] !== undefined) out.push({ kind: "link", text: match[1], href: match[2] });
    else out.push({ kind: "bold", text: match[3] });
    last = at + match[0].length;
  }
  if (last < text.length) out.push({ kind: "text", text: text.slice(last) });
  return out;
}

/** Раздел, к которому относится адрес ссылки: «/admin/prospect#portion» → «/admin/prospect». */
export function sectionOfHref(href: string): string | null {
  const path = href.split(/[?#]/)[0].replace(/\/+$/, "") || "/admin";
  if (path === "/admin" || path.startsWith("/admin/leads")) return "/admin";
  const match = /^\/admin\/([a-z-]+)/.exec(path);
  if (!match) return null;
  const section = `/admin/${match[1]}`;
  return SECTIONS.some((s) => s.href === section) ? section : null;
}

/**
 * Страницы внутри разделов, у которых есть свой пункт в инструкции.
 *
 * Карточка лида — не список лидов: человек, открывший карточку и нажавший
 * «Как пользоваться», хочет прочитать про кнопки карточки, а не про фильтры
 * списка.
 */
export const PAGE_TOPICS: readonly { prefix: string; section: string; item: string }[] = [
  { prefix: "/admin/leads/", section: "/admin", item: "card" },
  { prefix: "/admin/projects/", section: "/admin/projects", item: "card" },
  { prefix: "/admin/contracts/", section: "/admin/contracts", item: "review" },
  { prefix: "/admin/razbor/", section: "/admin/razbor", item: "review" },
];

/** Куда ведёт «Как пользоваться разделом» с этой страницы. null — страница без инструкции. */
export function helpTopicFor(pathname: string): string | null {
  const path = pathname.split(/[?#]/)[0].replace(/\/+$/, "") || "/admin";
  if (path === "/admin/help") return null;
  const page = PAGE_TOPICS.find((t) => path.startsWith(t.prefix) && path.length > t.prefix.length);
  if (page) return helpHref(page.section, page.item);
  const section = sectionOfHref(path);
  return section ? helpHref(section) : null;
}
