import { defineDict } from "@/lib/admin/i18n";

/**
 * «Реклама» (/admin/ads): ключи приложения Google и планировщик ключевых
 * слов (lib/seo/keyword-planner.ts). Владелец, 07.11.2026: «Подключаем,
 * аккаунт гугл адс у меня есть».
 */
export const adsGoogleDict = defineDict({
  keysTitle: { ru: "Ключи приложения Google", uz: "Google ilovasi kalitlari", pl: "Klucze aplikacji Google" },
  keysHint: {
    ru: "Client ID и секрет OAuth-клиента из Google Cloud. С ними кнопка «Подключить» у кабинета Google ведёт на вход Google. Вставляет владелец; обратно ключи не показываются, только «задано» или «пусто».",
    uz: "Google Cloud’dagi OAuth-mijozning Client ID va siri. Ular bilan Google kabinetidagi «Ulash» tugmasi Google’ga kirishga olib boradi. Egasi kiritadi; kalitlar qaytib ko‘rsatilmaydi, faqat «berilgan» yoki «bo‘sh».",
    pl: "Client ID i sekret klienta OAuth z Google Cloud. Dzięki nim przycisk „Połącz” przy koncie Google prowadzi do logowania Google. Wkleja właściciel; klucze nie są pokazywane z powrotem, tylko „ustawiono” albo „puste”.",
  },
  clientId: { ru: "Client ID", uz: "Client ID", pl: "Client ID" },
  clientSecret: { ru: "Client secret", uz: "Client secret", pl: "Client secret" },
  isSet: { ru: "задано", uz: "berilgan", pl: "ustawiono" },
  isEmpty: { ru: "пусто", uz: "bo‘sh", pl: "puste" },
  save: { ru: "Сохранить", uz: "Saqlash", pl: "Zapisz" },
  redirect: {
    ru: "Адрес возврата для OAuth-клиента (Authorized redirect URI):",
    uz: "OAuth-mijoz uchun qaytish manzili (Authorized redirect URI):",
    pl: "Adres powrotu dla klienta OAuth (Authorized redirect URI):",
  },
  copy: { ru: "Скопировать", uz: "Nusxa olish", pl: "Kopiuj" },
  copied: { ru: "Скопировано", uz: "Nusxa olindi", pl: "Skopiowano" },
  plannerTitle: { ru: "Планировщик ключевых слов", uz: "Kalit so‘zlar rejalashtiruvchisi", pl: "Planer słów kluczowych" },
  plannerHint: {
    ru: "Сколько раз в месяц ищут фразу в Google: для каждой статьи сайта — по Узбекистану, для статей на площадках — по России. Берётся из подключённого кабинета Google Ads. Google открывает его с уровня доступа Basic у проекта Google Cloud.",
    uz: "Iborani Google’da oyiga necha marta qidirishadi: sayt maqolalari uchun — O‘zbekiston bo‘yicha, platformalardagi maqolalar uchun — Rossiya bo‘yicha. Ulangan Google Ads kabinetidan olinadi. Google uni Google Cloud loyihasining Basic kirish darajasidan ochadi.",
    pl: "Ile razy w miesiącu fraza jest wyszukiwana w Google: dla każdego artykułu strony — w Uzbekistanie, dla artykułów na platformach — w Rosji. Dane z podłączonego konta Google Ads. Google udostępnia go od poziomu dostępu Basic w projekcie Google Cloud.",
  },
  account: { ru: "Кабинет", uz: "Kabinet", pl: "Konto" },
  accountAuto: {
    ru: "Не выбран: если подключён один, берётся он",
    uz: "Tanlanmagan: bittasi ulangan bo‘lsa, o‘sha olinadi",
    pl: "Nie wybrano: jeśli podłączone jest jedno, bierze się je",
  },
  noAccounts: {
    ru: "Подключённых кабинетов Google нет. Заведите кабинет (слева), добавьте рекламный кабинет Google с номером из 10 цифр и нажмите у него «Подключить».",
    uz: "Ulangan Google kabinetlari yo‘q. Kabinet yarating (chapda), 10 raqamli raqam bilan Google reklama kabinetini qo‘shing va undagi «Ulash»ni bosing.",
    pl: "Brak podłączonych kont Google. Załóż przestrzeń (po lewej), dodaj konto reklamowe Google z numerem z 10 cyfr i kliknij przy nim „Połącz”.",
  },
  check: { ru: "Проверить", uz: "Tekshirish", pl: "Sprawdź" },
  lastCheck: {
    ru: (at: string) => `Проверка ${at}:`,
    uz: (at: string) => `Tekshiruv ${at}:`,
    pl: (at: string) => `Sprawdzenie ${at}:`,
  },
  top: { ru: "Чаще всего ищут:", uz: "Eng ko‘p qidirilgan:", pl: "Najczęściej wyszukiwane:" },
  r_keys_saved: { ru: "Ключи сохранены.", uz: "Kalitlar saqlandi.", pl: "Klucze zapisane." },
  r_keys_bad: {
    ru: "Не похоже на ключи Google: Client ID кончается на .apps.googleusercontent.com, секрет — строка из букв и цифр. Ничего не сохранено.",
    uz: "Google kalitlariga o‘xshamaydi: Client ID .apps.googleusercontent.com bilan tugaydi, sir — harf va raqamlardan iborat qator. Hech narsa saqlanmadi.",
    pl: "To nie wygląda na klucze Google: Client ID kończy się na .apps.googleusercontent.com, sekret to ciąg liter i cyfr. Nic nie zapisano.",
  },
  r_forbidden: { ru: "Это может только владелец или руководитель.", uz: "Buni faqat egasi yoki rahbar qila oladi.", pl: "To może tylko właściciel albo kierownik." },
  r_planner_set: { ru: "Кабинет для планировщика выбран.", uz: "Rejalashtiruvchi uchun kabinet tanlandi.", pl: "Konto dla planera wybrane." },
  r_planner_bad: { ru: "Такого кабинета Google нет.", uz: "Bunday Google kabineti yo‘q.", pl: "Nie ma takiego konta Google." },
  r_failed: { ru: "Не получилось. Попробуйте ещё раз.", uz: "Bo‘lmadi. Yana urinib ko‘ring.", pl: "Nie udało się. Spróbuj jeszcze raz." },
  r_checked: { ru: "Проверка готова — итог ниже.", uz: "Tekshiruv tayyor — natija pastda.", pl: "Sprawdzenie gotowe — wynik poniżej." },
});
