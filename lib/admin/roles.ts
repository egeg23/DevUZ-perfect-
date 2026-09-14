/**
 * Роли и что кому видно.
 *
 * Единственное место, где роль сравнивается со строкой. Раньше проверка
 * `role !== "admin"` была рассыпана по десятку файлов, и третья роль
 * означала бы десять правок с одним и тем же шансом пропустить одну — и
 * узнать об этом от менеджера, увидевшего чужие контакты.
 */

export const ROLES = ["admin", "head", "manager"] as const;
export type Role = (typeof ROLES)[number];

export function isRole(value: string): value is Role {
  return (ROLES as readonly string[]).includes(value);
}

/**
 * Что можно назначить через панель.
 *
 * Администратор — только владелец, и он один. Роль admin через интерфейс
 * не выдаётся никому: кнопки «сделать админом» нет, а действие на сервере
 * такой запрос отклоняет — форму можно отправить и мимо кнопки.
 */
export const ASSIGNABLE_ROLES = ["head", "manager"] as const;
export type AssignableRole = (typeof ASSIGNABLE_ROLES)[number];

export function isAssignable(value: string): value is AssignableRole {
  return (ASSIGNABLE_ROLES as readonly string[]).includes(value);
}

/** Как роль называется человеку — в сообщениях и на странице команды. */
export const ROLE_TITLE: Record<Role, string> = {
  admin: "администратор",
  head: "руководитель",
  manager: "менеджер",
};

/** Короткая подпись рядом с именем в шапке панели. */
export const ROLE_BADGE: Record<Role, string> = {
  admin: "админ",
  head: "руководитель",
  manager: "менеджер",
};

export type Section = {
  href: string;
  label: string;
  roles: readonly Role[];
};

const EVERYONE: readonly Role[] = ROLES;
const ADMIN_ONLY: readonly Role[] = ["admin"];

/**
 * Разделы панели и кому они показываются.
 *
 * Скрытый раздел — не защита: каждая страница сама начинается с проверки
 * прав. Матрица нужна, чтобы в меню не висели пункты, которые у половины
 * команды отвечают редиректом.
 */
export const SECTIONS: readonly Section[] = [
  { href: "/admin", label: "Лиды", roles: EVERYONE },
  { href: "/admin/orders", label: "Заявки", roles: EVERYONE },
  { href: "/admin/scout", label: "Поиск", roles: EVERYONE },
  { href: "/admin/prospect", label: "Касания", roles: EVERYONE },
  { href: "/admin/projects", label: "Проекты", roles: EVERYONE },
  { href: "/admin/stats", label: "Статистика", roles: EVERYONE },
  // Финансы — всем, но каждому своё: менеджер видит свои проекты и баланс,
  // руководитель — команду, владелец — всё. Границу держит страница.
  { href: "/admin/finance", label: "Финансы", roles: EVERYONE },
  // Релизы — только у админа: выложить файл значит решить, что именно
  // получит каждый, кто уже заплатил.
  { href: "/admin/releases", label: "Релизы", roles: ADMIN_ONLY },
  { href: "/admin/team", label: "Команда", roles: ADMIN_ONLY },
  // Партнёры — деньги посторонним людям: только владелец.
  { href: "/admin/partners", label: "Партнёры", roles: ADMIN_ONLY },
  { href: "/admin/audit", label: "Журнал", roles: ADMIN_ONLY },
  // Инструкции — последними: это справка, а не ежедневная работа. Видят все,
  // и каждый читает только про свои вкладки.
  { href: "/admin/help", label: "Инструкции", roles: EVERYONE },
];

export function navFor(role: Role): Section[] {
  return SECTIONS.filter((section) => section.roles.includes(role));
}

export function canSee(role: Role, href: string): boolean {
  return SECTIONS.some((section) => section.href === href && section.roles.includes(role));
}

/**
 * Видит и правит чужое: все лиды, чужие напоминания, статистику команды.
 *
 * Руководитель здесь наравне с администратором — его работа и есть чужие
 * лиды. Разница между ними не в лидах, а в разделах: команда, релизы,
 * журнал остаются за владельцем.
 */
export function seesEveryone(role: Role): boolean {
  return role === "admin" || role === "head";
}
