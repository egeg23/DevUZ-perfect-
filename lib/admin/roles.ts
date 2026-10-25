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

/**
 * Группы меню — в порядке шапки.
 *
 * Владелец, 23.10.2026, на разбор удобства панели: «Делаем все сразу».
 * То, что открывают каждый день, — прямой кнопкой: «Главная», «Задачи»,
 * «Лиды», «Холодные касания», «Макеты» (каждая — своя группа из одного
 * раздела, а такая группа рисуется ссылкой). Редкое — в группах.
 *
 * Владелец, 12.10.2026: «вкладок куча, пока в каждую задаешь — с ума
 * пойдешь». Двадцать с лишним пунктов в одну строку не читаются, поэтому
 * шапка показывает группы, а разделы — в выпадающем списке группы
 * (lib/admin/nav.ts, components/admin/nav-menu.tsx). Названия групп — в
 * словаре content/admin-panel/shell.ts (`navGroupDict`).
 */
export const NAV_GROUPS = [
  "home",
  "tasks",
  "inbox",
  "leads",
  "prospect",
  "mockups",
  "money",
  "marketing",
  "team",
  "reports",
  "help",
] as const;
export type NavGroup = (typeof NAV_GROUPS)[number];

export type Section = {
  href: string;
  /** Название в меню на каждом языке панели — см. lib/admin/i18n.ts. */
  label: Tr;
  roles: readonly Role[];
  /**
   * Группа в меню. Поле, а не отдельный список групп: новый раздел без
   * группы не соберётся, и потеряться в меню ему негде.
   */
  group: NavGroup;
  /**
   * Раздел-вкладка: в меню его нет, он открывается вкладкой над страницей
   * своего раздела (components/admin/section-tabs.tsx). Владелец, 25.10.2026,
   * на «какие разделы можно объединить»: «Погнали по порядку» — 28 пунктов
   * меню стали 17. Адрес, права, галочки и инструкция у вкладки свои, как
   * были. Раздел закрыт человеку — вкладка встаёт в меню сама, в группе
   * раздела (`menuOf`), и не теряется.
   */
  parent?: string;
  /**
   * Раздел в углу шапки, а не в меню: «Настройки» — шестерёнкой рядом с
   * именем (components/admin/shell.tsx), как в любой CRM. «Найти раздел»
   * его находит, в меню и во вкладках его нет.
   */
  corner?: boolean;
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
  // Главная — командный центр владельца и руководителя: пульс компании,
  // что горит, люди, быстрая задача и рассылка в бот (app/admin/hq).
  // Владелец, 13.10.2026: «это командный центр с самыми важными пунктами,
  // что может понадобиться мне или руководителю». Менеджеру — пульс его
  // дня (владелец, 16.10.2026: «Менеджерам тоже теперь админку как у нас,
  // страница „главная“ с пульсом их работы»). Первым пунктом меню и
  // отдельной группой: группа из одного раздела — просто ссылка.
  { href: "/admin/hq", label: { ru: "Главная", uz: "Bosh sahifa", pl: "Pulpit" }, roles: EVERYONE, group: "home" },
  // Задачи — наша внутренняя CRM, своей кнопкой в шапке сразу за «Главной».
  // Владелец, 23.10.2026: «Давай вынесем CRM нашу отдельной кнопкой в наше
  // меню, чтобы она не была в лидах». Раньше задачи были блоком на «Лидах»,
  // а «История задач» — страницей без пункта меню. Группа из одного раздела —
  // просто ссылка (isSingle в lib/admin/nav.ts).
  { href: "/admin/tasks", label: { ru: "Задачи", uz: "Vazifalar", pl: "Zadania" }, roles: EVERYONE, group: "tasks" },
  // Входящие — всё, что ждёт ответа человека, одной очередью (владелец,
  // 25.10.2026: «Погнали по порядку», на «у HubSpot и Close всё, на что надо
  // ответить, — одной очередью»). Своей кнопкой рядом с «Задачами».
  { href: "/admin/inbox", label: { ru: "Входящие", uz: "Kiruvchi", pl: "Skrzynka" }, roles: EVERYONE, group: "inbox" },
  { href: "/admin", label: { ru: "Лиды", uz: "Lidlar", pl: "Leady" }, roles: EVERYONE, group: "leads" },
  // Названия — как заголовки страниц (владелец, 23.10.2026): «Касания»
  // было «Холодными касаниями» только на странице, «Поиск» новичок путал с
  // поиском по базе, «Надзор» звучал как контроль сотрудников, а «Заявки» —
  // это заказы магазина, не заявки клиентов.
  { href: "/admin/prospect", label: { ru: "Холодные касания", uz: "Sovuq aloqalar", pl: "Zimne kontakty" }, roles: EVERYONE, group: "prospect" },
  { href: "/admin/scout", label: { ru: "Сигналы скаута", uz: "Skaut signallari", pl: "Sygnały skauta" }, roles: EVERYONE, group: "prospect", parent: "/admin/prospect" },
  // Разбор переписки — уроки из разговоров касаний. Всем, а не только
  // владельцу: урок нужен тому, кто пишет следующее письмо.
  { href: "/admin/talks", label: { ru: "Разбор переписки", uz: "Yozishmalar tahlili", pl: "Analiza rozmów" }, roles: EVERYONE, group: "prospect", parent: "/admin/prospect" },
  // Макеты — всем. Владелец, 08.10.2026: «Надо сделать вкладку
  // дополнительную у всех: макеты… Там же генерируется пароль на 24 часа для
  // доступа клиента». Пароль клиенту выдаёт тот, кто с ним говорит, — а это
  // любой из команды. Собирать прототипы по-прежнему владелец («Прототипы»).
  { href: "/admin/mockups", label: { ru: "Макеты", uz: "Maketlar", pl: "Makiety" }, roles: EVERYONE, group: "mockups" },
  // Рабочие аккаунты Telegram — владельцу и руководителю. Подключить аккаунт
  // значит дать студии писать от чужого номера, и сессия равна доступу к
  // нему, — поэтому не всем. Владелец, 04.10.2026: «дай доступ к разделу
  // „Аккаунты“ Александру, чтобы он мог добавлять аккаунты для работы сам».
  { href: "/admin/accounts", label: { ru: "Аккаунты", uz: "Akkauntlar", pl: "Konta" }, roles: WITH_HEAD, group: "prospect", parent: "/admin/prospect" },
  // Кандидаты — только нанимающим. Владелец: «доступен руководителям и
  // мне, не менеджерам». Это не иерархия ради иерархии: в разборе лежат
  // чужие персональные данные и решение о человеке, и ни то ни другое не
  // становится лучше от того, что его читает вся студия.
  { href: "/admin/candidates", label: { ru: "Кандидаты", uz: "Nomzodlar", pl: "Kandydaci" }, roles: ["admin", "head"], group: "team", parent: "/admin/team" },
  { href: "/admin/projects", label: { ru: "Проекты", uz: "Loyihalar", pl: "Projekty" }, roles: EVERYONE, group: "money" },
  { href: "/admin/stats", label: { ru: "Статистика", uz: "Statistika", pl: "Statystyki" }, roles: EVERYONE, group: "reports" },
  // Ступени продажи — список компаний по ступеням. Раньше открывался только
  // по числу на «Главной» (/admin/hq/stages); теперь — пунктом «Отчётов».
  { href: "/admin/stages", label: { ru: "Ступени продажи", uz: "Sotuv bosqichlari", pl: "Etapy sprzedaży" }, roles: EVERYONE, group: "reports", parent: "/admin/stats" },
  // Трафик сайта — владельцу и руководителям. Владелец: «чтобы Александр и
  // руководители имели доступ». Реклама — их работа, и без посещаемости её
  // не оценить. Смотреть — да; подключать Метрику и Google остаётся
  // владельцу: вход в Google — его аккаунт, и кнопки у руководителя нет.
  { href: "/admin/traffic", label: { ru: "Трафик", uz: "Trafik", pl: "Ruch" }, roles: WITH_HEAD, group: "marketing" },
  // Реклама — автопилот Google Ads и Яндекс Директа (docs/ads-autopilot).
  // Владельцу и руководителю: решения о чужих рекламных деньгах и доступ к
  // кабинетам агентств — не работа менеджера.
  { href: "/admin/ads", label: { ru: "Реклама", uz: "Reklama", pl: "Reklamy" }, roles: WITH_HEAD, group: "marketing", parent: "/admin/traffic" },
  // Финансы — всем, но каждому своё: менеджер видит свои проекты и баланс,
  // руководитель — команду, владелец — всё. Границу держит страница.
  { href: "/admin/contracts", label: { ru: "Договоры", uz: "Shartnomalar", pl: "Umowy" }, roles: EVERYONE, group: "money", parent: "/admin/projects" },
  // Расходы — только соучредителям. Менеджеру они не нужны и не полагаются:
  // это не его деньги и не его решения.
  { href: "/admin/expenses", label: { ru: "Расходы", uz: "Xarajatlar", pl: "Wydatki" }, roles: ["admin", "head"], group: "money", parent: "/admin/finance" },
  { href: "/admin/finance", label: { ru: "Финансы", uz: "Moliya", pl: "Finanse" }, roles: EVERYONE, group: "money" },
  // Заказы готовых продуктов из магазина — деньги, а не продажи по лидам.
  { href: "/admin/orders", label: { ru: "Заказы магазина", uz: "Do‘kon buyurtmalari", pl: "Zamówienia sklepu" }, roles: EVERYONE, group: "money" },
  // Релизы — только у админа: выложить файл значит решить, что именно
  // получит каждый, кто уже заплатил.
  { href: "/admin/releases", label: { ru: "Релизы", uz: "Relizlar", pl: "Wydania" }, roles: ADMIN_ONLY, group: "money", parent: "/admin/orders" },
  // Команда — владельцу и руководителю проектов. Но видят они разное:
  // руководитель заводит менеджеров и смотрит состав, а роли, грейды и
  // отключение остаются за владельцем — см. hiresStaff и managesStaff.
  { href: "/admin/team", label: { ru: "Команда", uz: "Jamoa", pl: "Zespół" }, roles: WITH_HEAD, group: "team" },
  // Партнёры — владельцу и руководителю. Владелец, 07.10.2026: «Выведи в
  // дашборд руководителю вкладку „партнёры“». Руководитель ведёт программу,
  // а деньги посторонним людям — решение по выплате, персональная ставка —
  // и удаление партнёра остаются за владельцем (PARTNER_DESK в
  // lib/partners/store.ts).
  { href: "/admin/partners", label: { ru: "Партнёры", uz: "Hamkorlar", pl: "Partnerzy" }, roles: WITH_HEAD, group: "marketing" },
  // Прототипы — временно только владельцу, и причина не в доступе к данным,
  // а в деньгах. Сборка прототипа — самый дорогой вызов модели из всех:
  // на выходе целая страница, и платится она за каждый черновик, включая
  // те, что никто не отправит. Владелец решил собирать их сам, вне панели,
  // пока не пересмотрит этот способ.
  //
  // Код вкладки остался на месте: вернуть её всем — это одна строка здесь
  // и три проверки прав, которые уже написаны.
  { href: "/admin/proto", label: { ru: "Прототипы", uz: "Prototiplar", pl: "Prototypy" }, roles: ADMIN_ONLY, group: "mockups", parent: "/admin/mockups" },
  // Разборы — только владельцу: опубликованный разбор называет чужой сайт
  // плохим под именем студии, и отозвать это нельзя.
  { href: "/admin/razbor", label: { ru: "Разборы", uz: "Tahlillar", pl: "Analizy" }, roles: ADMIN_ONLY, group: "marketing" },
  { href: "/admin/audit", label: { ru: "Журнал", uz: "Jurnal", pl: "Dziennik" }, roles: ADMIN_ONLY, group: "reports" },
  // Использование — тихий кастдев: чем команда пользуется, а что шум.
  // Только владельцу: отчёт, о котором знают, меряет не работу, а
  // старание выглядеть в нём хорошо.
  { href: "/admin/usage", label: { ru: "Использование", uz: "Foydalanish", pl: "Użycie" }, roles: ADMIN_ONLY, group: "reports", parent: "/admin/audit" },
  // ИИ-сотрудники — владельцу и руководителю. Владелец, 11.10.2026: вкладка
  // «Блогеры» (внутренний ИИ-сотрудник студии, docs/ai-staff/bloggers.md) —
  // всем, кто видит раздел. Клиенты сервиса по подписке — их деньги, сроки и
  // вход поддержки в чужой кабинет (docs/ai-staff/design.md) — остаются
  // только владельцу: эту вкладку закрывает сама страница.
  { href: "/admin/ai-staff", label: { ru: "ИИ-сотрудники", uz: "SI xodimlar", pl: "Pracownicy AI" }, roles: WITH_HEAD, group: "marketing" },
  // Обучение — курсы по продажам и тест по панели (владелец, 12.10.2026:
  // «Добавить курсы по продажам и тестирование по знаниям дашборда»). Всем,
  // но с выключателем: пока владелец не нажал «Включить обучение для
  // команды», раздел видит только он (SWITCHED_SECTIONS ниже).
  { href: "/admin/learn", label: { ru: "Обучение", uz: "Ta’lim", pl: "Szkolenia" }, roles: EVERYONE, group: "team" },
  // Инструкции — последними: это справка, а не ежедневная работа. Видят все,
  // и каждый читает только про свои вкладки.
  { href: "/admin/help", label: { ru: "Инструкции", uz: "Yo‘riqnoma", pl: "Instrukcje" }, roles: EVERYONE, group: "help" },
  // Настройки — всё, что настраивают, одной страницей (lib/admin/settings.ts):
  // своё — язык, меню, телефон, сообщения бота; касаний и команды — ссылками
  // туда, где они живут. Владелец, 25.10.2026: «Погнали по порядку».
  // Шестерёнкой в шапке, а не пунктом меню.
  { href: "/admin/settings", label: { ru: "Настройки", uz: "Sozlamalar", pl: "Ustawienia" }, roles: EVERYONE, group: "help", corner: true },
];

/** Название раздела на языке панели. */
export function sectionLabel(section: Section, locale: PanelLocale): string {
  return section.label[locale];
}

export function navFor(role: Role): Section[] {
  return SECTIONS.filter((section) => section.roles.includes(role));
}

/** Видит ли роль раздел по умолчанию — без галочек владельца (см. opens). */
export function canSee(role: Role, href: string): boolean {
  return SECTIONS.some((section) => section.href === href && section.roles.includes(role));
}

/**
 * Галочки владельца поверх роли: раздел → открыт или закрыт этому человеку.
 *
 * Владелец, 11.10.2026: «отдельные настройки доступа, чтобы я мог через
 * галочки выдавать права на просмотр каждого раздела сотрудникам. А то
 * только через тебя сейчас это делается». Хранится только отличие от роли
 * (`staff.section_access`): новый раздел или смена роли не требуют
 * пересохранять галочки всей команды.
 *
 * Галочка открывает раздел — меню, страницу и инструкцию к нему. Что
 * человек может в разделе менять, по-прежнему решает роль: выплаты
 * партнёрам, роли и ставки команды галочкой не отдаются.
 */
export type SectionAccess = Readonly<Record<string, boolean>>;

/**
 * Разделы, которые не закрываются никому: «Лиды» — главная панели,
 * «Задачи» — задачу может получить любой, и кнопка бота у неё ведёт сюда,
 * «Инструкции» — справка, «Настройки» — свой язык и телефон есть у каждого,
 * а чужие настройки там и так отобраны по галочкам (`settingsFor`).
 */
export const ALWAYS_OPEN: readonly string[] = ["/admin", "/admin/tasks", "/admin/help", "/admin/settings"];

/** Строка из базы — в галочки: только известные разделы и только да/нет. */
export function sectionAccess(raw: unknown): SectionAccess {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const out: Record<string, boolean> = {};
  for (const [href, on] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof on === "boolean" && SECTIONS.some((s) => s.href === href) && !ALWAYS_OPEN.includes(href)) out[href] = on;
  }
  return out;
}

/**
 * Разделы с выключателем владельца: пока он не включил раздел для команды,
 * его видит только владелец — ни меню, ни страницы, ни инструкции, ни бота.
 *
 * Владелец, 12.10.2026, об «Обучении»: «Пока не активируй, просто делаем
 * чтобы я видел, потом через кнопку включу». Почему выключатель, а не роль
 * ADMIN_ONLY в SECTIONS: роли раздела — это то, кому он положен, когда
 * работает, и по ним написана и проверяется инструкция для каждой роли.
 * Выключатель — временное состояние в базе (lib/admin/section-switch.ts),
 * которое кнопка меняет без выкатки. Сессия кладёт выключенные разделы в
 * `sections_off`, а `opens` их закрывает поверх роли и галочек.
 */
export const SWITCHED_SECTIONS: readonly string[] = ["/admin/learn"];

/**
 * Кто смотрит: роль, галочки владельца и выключенные разделы. Без
 * `sections_off` (тесты, бот, чужая запись в «Команде») выключатель не
 * учитывается — его читает только сессия панели.
 */
export type Viewer = { role: Role; section_access?: SectionAccess | null; sections_off?: readonly string[] | null };

/** Открыт ли раздел этому человеку: владельцу — всё, остальным — выключатель, роль и галочки. */
export function opens(who: Viewer, href: string): boolean {
  if (who.role === "admin" || ALWAYS_OPEN.includes(href)) return true;
  const section = SECTIONS.find((s) => s.href === href);
  if (!section) return false;
  if (who.sections_off?.includes(href)) return false;
  const own = who.section_access?.[href];
  return typeof own === "boolean" ? own : section.roles.includes(who.role);
}

/**
 * Куда вести после входа и по логотипу: всем — «Главная» (владельцу и
 * руководителю — командный центр, менеджеру — пульс его дня), если
 * владелец не закрыл её галочкой; закрыли — в «Лиды», как раньше.
 */
export function homeOf(who: Viewer): string {
  return opens(who, "/admin/hq") ? "/admin/hq" : "/admin";
}

/** Меню этого человека — с галочками владельца. */
export function navOf(who: Viewer): Section[] {
  return SECTIONS.filter((section) => opens(who, section.href));
}

/**
 * Галочки из формы — в то, что сохранить: только отличия от роли.
 * `checked` — разделы с галочкой; раздел без неё закрыт.
 */
export function accessFromForm(role: Role, checked: readonly string[]): SectionAccess {
  const on = new Set(checked);
  const out: Record<string, boolean> = {};
  for (const section of SECTIONS) {
    if (ALWAYS_OPEN.includes(section.href)) continue;
    const want = on.has(section.href);
    if (want !== section.roles.includes(role)) out[section.href] = want;
  }
  return out;
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
 * Кто видит результаты обучения всей команды: кто что сдал и кто ещё нет.
 * Руководитель и владелец — им решать, кого доучить. Менеджер видит свои.
 */
export function seesTeamLearning(role: Role): boolean {
  return seesEveryone(role);
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
 * Чьи данные этот человек правит: ФИО, имя в панели, @ в Telegram, телефон.
 *
 * Владелец, 05.10.2026: «менять может руководитель и я». Владелец — всех,
 * себя тоже. Руководитель проектов — себя и менеджеров, как с отключением и
 * уведомлениями: второго руководителя и владельца — нет. Менеджер своих
 * данных не правит — их правит тот, кто за него отвечает.
 */
export function editsStaff(viewer: Role, target: Role, self: boolean): boolean {
  if (viewer === "admin") return true;
  if (viewer === "head") return self || target === "manager";
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
