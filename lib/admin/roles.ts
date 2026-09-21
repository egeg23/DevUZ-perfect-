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
  head: "руководитель проектов",
  manager: "менеджер",
};

/** Короткая подпись рядом с именем в шапке панели. */
export const ROLE_BADGE: Record<Role, string> = {
  admin: "админ",
  head: "рук. проектов",
  manager: "менеджер",
};

export type Section = {
  href: string;
  label: string;
  roles: readonly Role[];
};

const EVERYONE: readonly Role[] = ROLES;
const ADMIN_ONLY: readonly Role[] = ["admin"];
const WITH_HEAD: readonly Role[] = ["admin", "head"];

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
  // Надзор — рядом с касаниями: это разбор тех же разговоров. Всем, а не
  // только владельцу: урок нужен тому, кто пишет следующее письмо.
  { href: "/admin/talks", label: "Надзор", roles: EVERYONE },
  // Кандидаты — только нанимающим. Владелец: «доступен руководителям и
  // мне, не менеджерам». Это не иерархия ради иерархии: в разборе лежат
  // чужие персональные данные и решение о человеке, и ни то ни другое не
  // становится лучше от того, что его читает вся студия.
  { href: "/admin/candidates", label: "Кандидаты", roles: ["admin", "head"] },
  { href: "/admin/projects", label: "Проекты", roles: EVERYONE },
  { href: "/admin/stats", label: "Статистика", roles: EVERYONE },
  // Финансы — всем, но каждому своё: менеджер видит свои проекты и баланс,
  // руководитель — команду, владелец — всё. Границу держит страница.
  { href: "/admin/contracts", label: "Договоры", roles: EVERYONE },
  // Расходы — только соучредителям. Менеджеру они не нужны и не полагаются:
  // это не его деньги и не его решения.
  { href: "/admin/expenses", label: "Расходы", roles: ["admin", "head"] },
  { href: "/admin/finance", label: "Финансы", roles: EVERYONE },
  // Релизы — только у админа: выложить файл значит решить, что именно
  // получит каждый, кто уже заплатил.
  { href: "/admin/releases", label: "Релизы", roles: ADMIN_ONLY },
  // Команда — владельцу и руководителю проектов. Но видят они разное:
  // руководитель заводит менеджеров и смотрит состав, а роли, грейды и
  // отключение остаются за владельцем — см. hiresStaff и managesStaff.
  { href: "/admin/team", label: "Команда", roles: WITH_HEAD },
  // Партнёры — деньги посторонним людям: только владелец.
  { href: "/admin/partners", label: "Партнёры", roles: ADMIN_ONLY },
  // Прототипы — временно только владельцу, и причина не в доступе к данным,
  // а в деньгах. Сборка прототипа — самый дорогой вызов модели из всех:
  // на выходе целая страница, и платится она за каждый черновик, включая
  // те, что никто не отправит. Владелец решил собирать их сам, вне панели,
  // пока не пересмотрит этот способ.
  //
  // Код вкладки остался на месте: вернуть её всем — это одна строка здесь
  // и три проверки прав, которые уже написаны.
  { href: "/admin/proto", label: "Прототипы", roles: ADMIN_ONLY },
  // Разборы — только владельцу: опубликованный разбор называет чужой сайт
  // плохим под именем студии, и отозвать это нельзя.
  { href: "/admin/razbor", label: "Разборы", roles: ADMIN_ONLY },
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

/**
 * Кто заводит сотрудников и шлёт приглашения.
 *
 * Руководитель проектов набирает себе менеджеров сам — это его работа, и
 * ждать владельца ради одного Telegram id незачем. Кого именно он вправе
 * завести, решает `hiredRoles`: не «любую роль, кроме админа», а список.
 */
export function hiresStaff(role: Role): boolean {
  return role === "admin" || role === "head";
}

/**
 * Кого этот человек вправе завести.
 *
 * Руководитель — только менеджеров. Иначе он завёл бы второго руководителя,
 * а через него — доступ к чужим лидам в обход владельца.
 */
export function hiredRoles(role: Role): readonly AssignableRole[] {
  return role === "admin" ? ASSIGNABLE_ROLES : ["manager"];
}

/**
 * Кто правит чужие записи в команде: роль, грейд, руководителя, отключение.
 *
 * Только владелец. Это не про доверие, а про то, что каждое из этих
 * действий меняет деньги или доступ к чужим клиентам, и человек, который
 * ими распоряжается, не должен иметь возможности переписать сам себя.
 */
export function managesStaff(role: Role): boolean {
  return role === "admin";
}

/**
 * Кто видит, сколько остаётся владельцу.
 *
 * Отдельная функция, а не `role === "admin"` по месту: строка «остаётся
 * владельцу» показывается в двух разных экранах, и правило должно быть
 * одно. Руководитель проектов видит свои начисления и начисления команды,
 * но не долю студии — это не та цифра, которая помогает ему работать.
 */
/**
 * Расходы студии видят и ведут оба соучредителя.
 *
 * Отдельно от `seesOwnerMoney`, и разница здесь не формальная. Расход
 * уменьшает долю каждого из них, поэтому второй соучредитель имеет право
 * знать, на что уходят деньги, — владелец так и сказал: «их может видеть
 * Александр (реклама и тд)».
 *
 * А вот котёл и доли от ПРИБЫЛИ остаются владельцу. Показать руководителю
 * его 30% значит показать и остальные 70%: одно делится из другого в уме.
 * Поэтому в разделе расходов доли считаются от расхода, а не от прибыли.
 */
export function keepsExpenses(role: Role): boolean {
  return role === "admin" || role === "head";
}

export function seesOwnerMoney(role: Role): boolean {
  return role === "admin";
}
