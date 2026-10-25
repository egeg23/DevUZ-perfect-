import { defineDict } from "@/lib/admin/i18n";

/**
 * Каркас панели: шапка, выход, переключатель языка, кнопки инструкции.
 *
 * Названия разделов меню — в lib/admin/roles.ts (SECTIONS), рядом с тем,
 * кому раздел виден. Узбекский — латиницей, польский — как в польских CRM.
 */
export const shellDict = defineDict({
  panel: { ru: "панель", uz: "panel", pl: "panel" },
  signOut: { ru: "Выйти", uz: "Chiqish", pl: "Wyloguj" },
  // Строка вкладок над разделом (components/admin/section-tabs.tsx) — подпись для экранного диктора.
  sectionTabs: { ru: "Вкладки раздела", uz: "Bo‘lim yorliqlari", pl: "Karty sekcji" },
  // Число на кнопке «Задачи» (components/admin/task-count.tsx) — подсказка при наведении.
  tasksCount: {
    ru: (n: number) => `Открытых задач на вас: ${n}`,
    uz: (n: number) => `Sizdagi ochiq vazifalar: ${n}`,
    pl: (n: number) => `Otwarte zadania dla ciebie: ${n}`,
  },
  tasksCountLate: {
    ru: (n: number, late: number) => `Открытых задач на вас: ${n}, просрочено: ${late}`,
    uz: (n: number, late: number) => `Sizdagi ochiq vazifalar: ${n}, muddati o‘tgan: ${late}`,
    pl: (n: number, late: number) => `Otwarte zadania dla ciebie: ${n}, po terminie: ${late}`,
  },
  language: { ru: "Язык панели", uz: "Panel tili", pl: "Język panelu" },
  sectionHelp: {
    ru: "Как пользоваться разделом",
    uz: "Bo‘limdan qanday foydalanish",
    pl: "Jak korzystać z sekcji",
  },
  howItWorks: { ru: "Как это работает", uz: "Bu qanday ishlaydi", pl: "Jak to działa" },
  pageTitle: { ru: "Панель — DevUz Studio", uz: "Panel — DevUz Studio", pl: "Panel — DevUz Studio" },
  // Меню группами и быстрый переход (components/admin/nav-menu.tsx).
  nav: { ru: "Разделы панели", uz: "Panel bo‘limlari", pl: "Sekcje panelu" },
  menu: { ru: "Меню", uz: "Menyu", pl: "Menu" },
  closeMenu: { ru: "Закрыть меню", uz: "Menyuni yopish", pl: "Zamknij menu" },
  findSection: { ru: "Найти раздел или компанию", uz: "Bo‘lim yoki kompaniyani topish", pl: "Znajdź sekcję lub firmę" },
  findPlaceholder: {
    ru: "Раздел, компания, лид, телефон или @ник",
    uz: "Bo‘lim, kompaniya, lid, telefon yoki @nik",
    pl: "Sekcja, firma, lead, telefon lub @nick",
  },
  findNothing: { ru: "Ничего не нашлось", uz: "Hech narsa topilmadi", pl: "Nic nie znaleziono" },
  // Компании и лиды в том же окне (app/admin/find, lib/admin/find-store.ts).
  findHits: { ru: "Компании и лиды", uz: "Kompaniyalar va lidlar", pl: "Firmy i leady" },
  findSearching: { ru: "Ищу компании и лиды…", uz: "Kompaniya va lidlarni qidiryapman…", pl: "Szukam firm i leadów…" },
  findKindLead: { ru: "лид", uz: "lid", pl: "lead" },
  findKindProspect: { ru: "касание", uz: "aloqa", pl: "kontakt" },
  findKindProject: { ru: "проект", uz: "loyiha", pl: "projekt" },
  // Тумблер «Новое меню»: выключил — меню как раньше, одной строкой.
  navNew: { ru: "Новое меню", uz: "Yangi menyu", pl: "Nowe menu" },
  navNewHint: {
    ru: "Включено — разделы группами и «Найти раздел или компанию». Выключите — меню будет как раньше, одной строкой.",
    uz: "Yoqilgan — bo‘limlar guruhlarda va «Bo‘lim yoki kompaniyani topish». O‘chirsangiz — menyu avvalgidek, bitta qatorda bo‘ladi.",
    pl: "Włączone — sekcje w grupach i «Znajdź sekcję lub firmę». Wyłącz — menu będzie jak dawniej, w jednym rzędzie.",
  },
  findKeys: {
    ru: "↑ ↓ — выбрать, Enter — открыть, Esc — закрыть",
    uz: "↑ ↓ — tanlash, Enter — ochish, Esc — yopish",
    pl: "↑ ↓ — wybierz, Enter — otwórz, Esc — zamknij",
  },
});

/** Группы меню (NAV_GROUPS в lib/admin/roles.ts) на языке панели. */
export const navGroupDict = defineDict({
  home: { ru: "Главная", uz: "Bosh sahifa", pl: "Pulpit" },
  tasks: { ru: "Задачи", uz: "Vazifalar", pl: "Zadania" },
  leads: { ru: "Лиды", uz: "Lidlar", pl: "Leady" },
  prospect: { ru: "Холодные касания", uz: "Sovuq aloqalar", pl: "Zimne kontakty" },
  mockups: { ru: "Макеты", uz: "Maketlar", pl: "Makiety" },
  money: { ru: "Деньги", uz: "Pul", pl: "Pieniądze" },
  marketing: { ru: "Маркетинг", uz: "Marketing", pl: "Marketing" },
  team: { ru: "Команда", uz: "Jamoa", pl: "Zespół" },
  reports: { ru: "Отчёты", uz: "Hisobotlar", pl: "Raporty" },
  help: { ru: "Инструкции", uz: "Yo‘riqnoma", pl: "Instrukcje" },
});
