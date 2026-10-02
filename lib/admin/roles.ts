/**
 * Роли и что кому видно.
 *
 * Единственное место, где роль сравнивается со строкой. Раньше проверка
 * `role !== "admin"` была рассыпана по десятку файлов, и третья роль
 * означала бы десять правок с одним и тем же шансом пропустить одну — и
 * узнать об этом от менеджера, увидевшего чужие контакты.
 */

import type { PanelLocale, Tr } from "@/lib/admin/i18n";

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

/** Как роль называется человеку — на странице команды, на языке панели. */
export const ROLE_TITLE_TR: Record<Role, Tr> = {
  admin: { ru: "администратор", uz: "administrator", pl: "administrator" },
  head: { ru: "руководитель проектов", uz: "loyiha rahbari", pl: "kierownik projektów" },
  manager: { ru: "менеджер", uz: "menejer", pl: "menedżer" },
};

/** То же по-русски — для сообщений бота: бот пока пишет только по-русски. */
export const ROLE_TITLE: Record<Role, string> = {
  admin: ROLE_TITLE_TR.admin.ru,
  head: ROLE_TITLE_TR.head.ru,
  manager: ROLE_TITLE_TR.manager.ru,
};

/** Короткая подпись рядом с именем в шапке панели. */
export const ROLE_BADGE: Record<Role, Tr> = {
  admin: { ru: "админ", uz: "admin", pl: "admin" },
  head: { ru: "рук. проектов", uz: "loyiha rahbari", pl: "kier. projektów" },
  manager: { ru: "менеджер", uz: "menejer", pl: "menedżer" },
};

export type Section = {
  href: string;
  /** Название в меню на каждом языке панели — см. lib/admin/i18n.ts. */
  label: Tr;
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
  { href: "/admin", label: { ru: "Лиды", uz: "Lidlar", pl: "Leady" }, roles: EVERYONE },
  { href: "/admin/orders", label: { ru: "Заявки", uz: "Buyurtmalar", pl: "Zamówienia" }, roles: EVERYONE },
  { href: "/admin/scout", label: { ru: "Поиск", uz: "Qidiruv", pl: "Wyszukiwanie" }, roles: EVERYONE },
  { href: "/admin/prospect", label: { ru: "Касания", uz: "Aloqalar", pl: "Kontakty" }, roles: EVERYONE },
  // Надзор — рядом с касаниями: это разбор тех же разговоров. Всем, а не
  // только владельцу: урок нужен тому, кто пишет следующее письмо.
  { href: "/admin/talks", label: { ru: "Надзор", uz: "Nazorat", pl: "Nadzór" }, roles: EVERYONE },
  // Рабочие аккаунты Telegram — только владельцу: подключить аккаунт значит
  // дать студии писать от чужого номера, и сессия равна доступу к нему.
  { href: "/admin/accounts", label: { ru: "Аккаунты", uz: "Akkauntlar", pl: "Konta" }, roles: ADMIN_ONLY },
  // Кандидаты — только нанимающим. Владелец: «доступен руководителям и
  // мне, не менеджерам». Это не иерархия ради иерархии: в разборе лежат
  // чужие персональные данные и решение о человеке, и ни то ни другое не
  // становится лучше от того, что его читает вся студия.
  { href: "/admin/candidates", label: { ru: "Кандидаты", uz: "Nomzodlar", pl: "Kandydaci" }, roles: ["admin", "head"] },
  { href: "/admin/projects", label: { ru: "Проекты", uz: "Loyihalar", pl: "Projekty" }, roles: EVERYONE },
  { href: "/admin/stats", label: { ru: "Статистика", uz: "Statistika", pl: "Statystyki" }, roles: EVERYONE },
  // Трафик сайта — владельцу и руководителям. Владелец: «чтобы Александр и
  // руководители имели доступ». Реклама — их работа, и без посещаемости её
  // не оценить. Смотреть — да; подключать Метрику и Google остаётся
  // владельцу: вход в Google — его аккаунт, и кнопки у руководителя нет.
  { href: "/admin/traffic", label: { ru: "Трафик", uz: "Trafik", pl: "Ruch" }, roles: WITH_HEAD },
  // Финансы — всем, но каждому своё: менеджер видит свои проекты и баланс,
  // руководитель — команду, владелец — всё. Границу держит страница.
  { href: "/admin/contracts", label: { ru: "Договоры", uz: "Shartnomalar", pl: "Umowy" }, roles: EVERYONE },
  // Расходы — только соучредителям. Менеджеру они не нужны и не полагаются:
  // это не его деньги и не его решения.
  { href: "/admin/expenses", label: { ru: "Расходы", uz: "Xarajatlar", pl: "Wydatki" }, roles: ["admin", "head"] },
  { href: "/admin/finance", label: { ru: "Финансы", uz: "Moliya", pl: "Finanse" }, roles: EVERYONE },
  // Релизы — только у админа: выложить файл значит решить, что именно
  // получит каждый, кто уже заплатил.
  { href: "/admin/releases", label: { ru: "Релизы", uz: "Relizlar", pl: "Wydania" }, roles: ADMIN_ONLY },
  // Команда — владельцу и руководителю проектов. Но видят они разное:
  // руководитель заводит менеджеров и смотрит состав, а роли, грейды и
  // отключение остаются за владельцем — см. hiresStaff и managesStaff.
  { href: "/admin/team", label: { ru: "Команда", uz: "Jamoa", pl: "Zespół" }, roles: WITH_HEAD },
  // Партнёры — деньги посторонним людям: только владелец.
  { href: "/admin/partners", label: { ru: "Партнёры", uz: "Hamkorlar", pl: "Partnerzy" }, roles: ADMIN_ONLY },
  // Прототипы — временно только владельцу, и причина не в доступе к данным,
  // а в деньгах. Сборка прототипа — самый дорогой вызов модели из всех:
  // на выходе целая страница, и платится она за каждый черновик, включая
  // те, что никто не отправит. Владелец решил собирать их сам, вне панели,
  // пока не пересмотрит этот способ.
  //
  // Код вкладки остался на месте: вернуть её всем — это одна строка здесь
  // и три проверки прав, которые уже написаны.
  { href: "/admin/proto", label: { ru: "Прототипы", uz: "Prototiplar", pl: "Prototypy" }, roles: ADMIN_ONLY },
  // Разборы — только владельцу: опубликованный разбор называет чужой сайт
  // плохим под именем студии, и отозвать это нельзя.
  { href: "/admin/razbor", label: { ru: "Разборы", uz: "Tahlillar", pl: "Analizy" }, roles: ADMIN_ONLY },
  { href: "/admin/audit", label: { ru: "Журнал", uz: "Jurnal", pl: "Dziennik" }, roles: ADMIN_ONLY },
  // Использование — тихий кастдев: чем команда пользуется, а что шум.
  // Только владельцу: отчёт, о котором знают, меряет не работу, а
  // старание выглядеть в нём хорошо.
  { href: "/admin/usage", label: { ru: "Использование", uz: "Foydalanish", pl: "Użycie" }, roles: ADMIN_ONLY },
  // Инструкции — последними: это справка, а не ежедневная работа. Видят все,
  // и каждый читает только про свои вкладки.
  { href: "/admin/help", label: { ru: "Инструкции", uz: "Yo‘riqnoma", pl: "Instrukcje" }, roles: EVERYONE },
];

/** Название раздела на языке панели. */
export function sectionLabel(section: Section, locale: PanelLocale): string {
  return section.label[locale];
}

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
 * Кого этот человек вправе отключить — убрать из команды.
 *
 * Владелец, 28.09: «сделай Александру возможность удалять сотрудников».
 * Руководитель проектов отключает менеджеров — тех, кого он и заводит
 * (`hiredRoles`). Второго руководителя и владельца — нет: иначе один
 * руководитель мог бы убрать другого вместе с его командой, а это решение
 * владельца. Себя не отключает никто — это проверяет `disableStaff`.
 */
export function disables(viewer: Role, target: Role): boolean {
  if (viewer === "admin") return true;
  if (viewer === "head") return target === "manager";
  return false;
}

/**
 * Кому этот человек выбирает, какие сообщения бота приходят.
 *
 * Владелец — всем, себе тоже. Руководитель проектов — менеджерам и себе:
 * «чтобы он и я могли выбирать, что приходит менеджерам». Менеджер своих
 * галочек не трогает: иначе выйти из очереди можно было бы одним щелчком,
 * не спросив никого.
 */
export function tunesNotices(viewer: Role, target: Role, self: boolean): boolean {
  if (viewer === "admin") return true;
  if (viewer === "head") return self || target === "manager";
  return false;
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
