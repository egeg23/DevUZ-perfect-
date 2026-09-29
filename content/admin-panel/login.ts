import { defineDict } from "@/lib/admin/i18n";

/**
 * Страница входа (/admin/login).
 *
 * Сотрудника здесь ещё нет, и его языка из базы не взять: язык — из
 * куки-зеркала PANEL_LANG_COOKIE (её ставит вход и переключатель языка),
 * без неё — русский. «DevUz Studio», Telegram и /login не переводятся.
 */
export const loginDict = defineDict({
  title: { ru: "Вход в панель", uz: "Panelga kirish", pl: "Logowanie do panelu" },
  /** `?e=3` — лимит попыток. */
  tooMany: {
    ru: "Слишком много попыток. Подождите десять минут.",
    uz: "Urinishlar juda ko‘p. O‘n daqiqa kuting.",
    pl: "Zbyt wiele prób. Odczekaj dziesięć minut.",
  },
  /** `?e=2` — база не ответила. */
  offline: {
    ru: "База недоступна — войти сейчас нельзя. Попробуйте через минуту.",
    uz: "Bazaga ulanib bo‘lmadi — hozir kirib bo‘lmaydi. Bir daqiqadan keyin urinib ko‘ring.",
    pl: "Baza danych jest niedostępna — nie można się teraz zalogować. Spróbuj za minutę.",
  },
  /** `?e=4` — переход по кнопке в Telegram уже использован или просрочен. */
  spent: {
    ru: "Этим переходом уже входили или он просрочен. Нажмите кнопку в Telegram ещё раз — она выдаёт новый.",
    uz: "Bu havola orqali allaqachon kirilgan yoki uning muddati o‘tgan. Telegramdagi tugmani yana bosing — u yangisini beradi.",
    pl: "Ten link został już użyty albo wygasł. Naciśnij przycisk w Telegramie jeszcze raz — wygeneruje nowy.",
  },
  /** `?e=1` и всё прочее — ссылка не сработала. */
  broken: {
    ru: "Ссылка не сработала: она одноразовая и живёт 15 минут. Запросите новую.",
    uz: "Havola ishlamadi: u bir martalik va 15 daqiqa amal qiladi. Yangisini so‘rang.",
    pl: "Link nie zadziałał: jest jednorazowy i ważny 15 minut. Poproś o nowy.",
  },
  signIn: { ru: "Войти", uz: "Kirish", pl: "Zaloguj się" },
  burns: {
    ru: "Ссылка сгорит после нажатия.",
    uz: "Bosilgandan keyin havola yaroqsiz bo‘ladi.",
    pl: "Link wygaśnie po kliknięciu.",
  },
  getLink: { ru: "Получить ссылку в Telegram", uz: "Telegramda havola olish", pl: "Otrzymaj link w Telegramie" },
  hintBefore: {
    ru: "Откроется чат с ботом — он пришлёт ссылку, она живёт 15 минут. Если чат уже открыт, отправьте",
    uz: "Bot bilan chat ochiladi — u havola yuboradi, havola 15 daqiqa amal qiladi. Agar chat allaqachon ochiq bo‘lsa,",
    pl: "Otworzy się czat z botem — wyśle link ważny 15 minut. Jeśli czat jest już otwarty, wyślij",
  },
  hintAfter: { ru: ".", uz: " buyrug‘ini yuboring.", pl: "." },
});
