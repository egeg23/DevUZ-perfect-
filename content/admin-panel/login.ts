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

  // ── Вход кодом в установленном приложении (components/admin/app-login.tsx) ──
  appTitle: { ru: "Вход в приложение", uz: "Ilovaga kirish", pl: "Logowanie do aplikacji" },
  appIntro: {
    ru: "У приложения на экране свой вход: ссылка из бота откроется в браузере, а не здесь. Поэтому сюда входят кодом.",
    uz: "Ekrandagi ilovaning o‘z kirishi bor: botdagi havola bu yerda emas, brauzerda ochiladi. Shuning uchun bu yerga kod bilan kiriladi.",
    pl: "Aplikacja na ekranie ma własne logowanie: link od bota otworzy się w przeglądarce, a nie tutaj. Dlatego tu logujesz się kodem.",
  },
  appGetCode: { ru: "Получить код в боте", uz: "Botdan kod olish", pl: "Odbierz kod w bocie" },
  appGetCodeAgain: { ru: "Получить новый код", uz: "Yangi kod olish", pl: "Odbierz nowy kod" },
  appOpening: { ru: "Открываю бота…", uz: "Bot ochilmoqda…", pl: "Otwieram bota…" },
  appStep: {
    ru: "Бот пришлёт 6 цифр. Вернитесь сюда и введите их — код живёт 5 минут и подходит один раз.",
    uz: "Bot 6 ta raqam yuboradi. Bu yerga qayting va ularni kiriting — kod 5 daqiqa amal qiladi va bir marta ishlaydi.",
    pl: "Bot wyśle 6 cyfr. Wróć tutaj i wpisz je — kod jest ważny 5 minut i działa jeden raz.",
  },
  appCodeLabel: { ru: "Код из бота", uz: "Botdan kelgan kod", pl: "Kod od bota" },
  appSignIn: { ru: "Войти", uz: "Kirish", pl: "Zaloguj się" },
  appErrFormat: {
    ru: "Нужно 6 цифр — как в сообщении бота.",
    uz: "6 ta raqam kerak — bot xabaridagidek.",
    pl: "Potrzeba 6 cyfr — jak w wiadomości od bota.",
  },
  appErrWrong: {
    ru: (left: number) => `Код не тот. Осталось попыток: ${left}.`,
    uz: (left: number) => `Kod noto‘g‘ri. Qolgan urinishlar: ${left}.`,
    pl: (left: number) => `Kod jest błędny. Pozostało prób: ${left}.`,
  },
  appErrSpent: {
    ru: "Пять неверных попыток — этот код больше не подходит. Получите новый.",
    uz: "Beshta noto‘g‘ri urinish — bu kod endi ishlamaydi. Yangisini oling.",
    pl: "Pięć błędnych prób — ten kod już nie zadziała. Odbierz nowy.",
  },
  appErrExpired: {
    ru: "Код просрочен: он живёт 5 минут. Получите новый.",
    uz: "Kodning muddati o‘tgan: u 5 daqiqa amal qiladi. Yangisini oling.",
    pl: "Kod wygasł: jest ważny 5 minut. Odbierz nowy.",
  },
  appErrUsed: {
    ru: "Этим кодом уже вошли. Получите новый.",
    uz: "Bu kod bilan allaqachon kirilgan. Yangisini oling.",
    pl: "Ten kod został już użyty. Odbierz nowy.",
  },
  appErrNone: {
    ru: "Бот ещё не присылал код для этого входа. Нажмите «Получить код в боте» и откройте бота.",
    uz: "Bot bu kirish uchun hali kod yubormagan. «Botdan kod olish» tugmasini bosing va botni oching.",
    pl: "Bot nie wysłał jeszcze kodu dla tego logowania. Naciśnij «Odbierz kod w bocie» i otwórz bota.",
  },
  appErrNoRequest: {
    ru: "Сначала нажмите «Получить код в боте» — код подходит только к входу, начатому здесь.",
    uz: "Avval «Botdan kod olish» tugmasini bosing — kod faqat shu yerda boshlangan kirishga mos keladi.",
    pl: "Najpierw naciśnij «Odbierz kod w bocie» — kod pasuje tylko do logowania rozpoczętego tutaj.",
  },
  appUseCode: { ru: "Войти кодом из бота", uz: "Botdagi kod bilan kirish", pl: "Zaloguj się kodem od bota" },
});
