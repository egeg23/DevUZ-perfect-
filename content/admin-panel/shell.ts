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
});
