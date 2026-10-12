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
  findSection: { ru: "Найти раздел", uz: "Bo‘limni topish", pl: "Znajdź sekcję" },
  findPlaceholder: {
    ru: "Начните писать: «дог» — «Договоры»",
    uz: "Yozishni boshlang: «shar» — «Shartnomalar»",
    pl: "Zacznij pisać: «umo» — «Umowy»",
  },
  findNothing: { ru: "Такого раздела нет", uz: "Bunday bo‘lim yo‘q", pl: "Nie ma takiej sekcji" },
  findKeys: {
    ru: "↑ ↓ — выбрать, Enter — открыть, Esc — закрыть",
    uz: "↑ ↓ — tanlash, Enter — ochish, Esc — yopish",
    pl: "↑ ↓ — wybierz, Enter — otwórz, Esc — zamknij",
  },
});

/** Группы меню (NAV_GROUPS в lib/admin/roles.ts) на языке панели. */
export const navGroupDict = defineDict({
  sales: { ru: "Продажи", uz: "Sotuv", pl: "Sprzedaż" },
  money: { ru: "Проекты и деньги", uz: "Loyihalar va pul", pl: "Projekty i finanse" },
  marketing: { ru: "Маркетинг", uz: "Marketing", pl: "Marketing" },
  team: { ru: "Команда", uz: "Jamoa", pl: "Zespół" },
  reports: { ru: "Отчёты", uz: "Hisobotlar", pl: "Raporty" },
  help: { ru: "Инструкции", uz: "Yo‘riqnoma", pl: "Instrukcje" },
});
