import { defineDict } from "@/lib/admin/i18n";

/** Сбой страницы панели (app/admin/error.tsx). */
export const crashDict = defineDict({
  retrying: { ru: "Обновляем страницу…", uz: "Sahifa yangilanmoqda…", pl: "Odświeżamy stronę…" },
  title: { ru: "Страница не загрузилась", uz: "Sahifa yuklanmadi", pl: "Strona się nie załadowała" },
  text: {
    ru: "Такое бывает при коротком сбое связи с сервером. Нажмите «Обновить» — всё, что вы уже сохранили, на месте. Сбой записан, мы его разберём.",
    uz: "Bu server bilan aloqa qisqa uzilganda bo‘ladi. «Yangilash» tugmasini bosing: saqlaganlaringiz joyida. Nosozlik yozib olindi, biz uni ko‘rib chiqamiz.",
    pl: "Zdarza się to przy krótkiej przerwie w połączeniu z serwerem. Kliknij «Odśwież»: wszystko, co już zapisałeś, jest na miejscu. Błąd został zapisany, przyjrzymy się mu.",
  },
  reload: { ru: "Обновить", uz: "Yangilash", pl: "Odśwież" },
});
