import { defineDict } from "@/lib/admin/i18n";

/** Колокольчик в шапке (components/admin/bell.tsx, lib/admin/bell.ts) — на языке сотрудника. */
export const bellDict = defineDict({
  title: { ru: "Что пришло", uz: "Nima keldi", pl: "Co przyszło" },
  button: {
    ru: (n: number) => (n ? `Что пришло: ${n} не сделано` : "Что пришло"),
    uz: (n: number) => (n ? `Nima keldi: ${n} ta bajarilmagan` : "Nima keldi"),
    pl: (n: number) => (n ? `Co przyszło: ${n} niezrobione` : "Co przyszło"),
  },
  note: {
    ru: "То же, что бот писал вам в Telegram, за 14 дней.",
    uz: "Bot sizga Telegramda yozgan narsa, 14 kun ichida.",
    pl: "To samo, co bot pisał ci w Telegramie, z 14 dni.",
  },
  done: { ru: "✓ Сделано", uz: "✓ Bajarildi", pl: "✓ Zrobione" },
  doneMark: { ru: "сделано", uz: "bajarildi", pl: "zrobione" },
  allDone: { ru: "Отметить всё", uz: "Hammasini belgilash", pl: "Zaznacz wszystko" },
  open: { ru: "Открыть", uz: "Ochish", pl: "Otwórz" },
  empty: {
    ru: "Пока ничего. Новое от бота появится здесь.",
    uz: "Hozircha hech narsa yo‘q. Botdan yangisi shu yerda chiqadi.",
    pl: "Na razie nic. Nowe od bota pojawi się tutaj.",
  },
  loading: { ru: "Загружаю…", uz: "Yuklanmoqda…", pl: "Ładuję…" },
  failed: {
    ru: "Не получилось, попробуйте ещё раз.",
    uz: "Bo‘lmadi, yana urinib ko‘ring.",
    pl: "Nie wyszło, spróbuj jeszcze raz.",
  },
  ago: {
    ru: (m: number) => (m < 1 ? "только что" : m < 60 ? `${m} мин назад` : m < 1440 ? `${Math.floor(m / 60)} ч назад` : `${Math.floor(m / 1440)} дн. назад`),
    uz: (m: number) => (m < 1 ? "hozirgina" : m < 60 ? `${m} daqiqa oldin` : m < 1440 ? `${Math.floor(m / 60)} soat oldin` : `${Math.floor(m / 1440)} kun oldin`),
    pl: (m: number) => (m < 1 ? "przed chwilą" : m < 60 ? `${m} min temu` : m < 1440 ? `${Math.floor(m / 60)} godz. temu` : `${Math.floor(m / 1440)} dn. temu`),
  },
});
