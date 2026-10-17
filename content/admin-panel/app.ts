import { defineDict, plural } from "@/lib/admin/i18n";

/**
 * Панель — приложение на телефоне и пуш: карточка на «Главной», строка
 * «Это устройство» в «Команде» (components/admin/app-push.tsx) и тестовый
 * пуш (app/admin/push/route.ts). «DevUz», «Safari», «Chrome», «Android»,
 * «iPhone» не переводятся.
 */
export const appDict = defineDict({
  cardTitle: { ru: "DevUz — приложение на телефоне", uz: "DevUz — telefondagi ilova", pl: "DevUz — aplikacja na telefonie" },
  cardWhy: {
    ru: "Иконка на экране, панель на весь экран и уведомления — те же, что присылает бот: тёплый лид, ответ клиента, задачи.",
    uz: "Ekranda belgi, panel butun ekranda va bildirishnomalar — bot yuboradiganlari bilan bir xil: iliq lid, mijoz javobi, vazifalar.",
    pl: "Ikona na ekranie, panel na pełnym ekranie i powiadomienia — te same, które wysyła bot: ciepły lead, odpowiedź klienta, zadania.",
  },
  install: { ru: "Установить приложение", uz: "Ilovani o‘rnatish", pl: "Zainstaluj aplikację" },
  iosHow: {
    ru: "В Safari нажмите «Поделиться» (квадрат со стрелкой) → «На экран „Домой“» → «Добавить». Потом откройте DevUz с иконки и включите уведомления.",
    uz: "Safari’da «Ulashish» (strelkali kvadrat) → «Asosiy ekranga» → «Qo‘shish» tugmalarini bosing. Keyin DevUz’ni belgidan oching va bildirishnomalarni yoqing.",
    pl: "W Safari naciśnij «Udostępnij» (kwadrat ze strzałką) → «Do ekranu początkowego» → «Dodaj». Potem otwórz DevUz z ikony i włącz powiadomienia.",
  },
  iosSafari: {
    ru: "На iPhone приложение ставится только из Safari. Откройте devuz.studio/admin в Safari — там будет «На экран „Домой“».",
    uz: "iPhone’da ilova faqat Safari’dan o‘rnatiladi. devuz.studio/admin’ni Safari’da oching — u yerda «Asosiy ekranga» bo‘ladi.",
    pl: "Na iPhonie aplikację instaluje się tylko z Safari. Otwórz devuz.studio/admin w Safari — tam będzie «Do ekranu początkowego».",
  },
  iosOld: {
    ru: "Уведомления на iPhone работают с iOS 16.4 и только в приложении с иконки. Обновите iPhone, чтобы они приходили.",
    uz: "iPhone’da bildirishnomalar iOS 16.4 dan boshlab va faqat belgidagi ilovada ishlaydi. Ular kelishi uchun iPhone’ni yangilang.",
    pl: "Powiadomienia na iPhonie działają od iOS 16.4 i tylko w aplikacji z ikony. Zaktualizuj iPhone’a, żeby przychodziły.",
  },
  androidHow: {
    ru: "Если кнопки нет: меню Chrome (три точки) → «Установить приложение» или «Добавить на главный экран».",
    uz: "Agar tugma bo‘lmasa: Chrome menyusi (uchta nuqta) → «Ilovani o‘rnatish» yoki «Bosh ekranga qo‘shish».",
    pl: "Jeśli nie ma przycisku: menu Chrome (trzy kropki) → «Zainstaluj aplikację» albo «Dodaj do ekranu głównego».",
  },
  enable: { ru: "Включить уведомления", uz: "Bildirishnomalarni yoqish", pl: "Włącz powiadomienia" },
  enableDesktop: {
    ru: "Уведомления на этом компьютере — включить",
    uz: "Shu kompyuterda bildirishnomalar — yoqish",
    pl: "Powiadomienia na tym komputerze — włącz",
  },
  enabling: { ru: "Включаю…", uz: "Yoqilmoqda…", pl: "Włączam…" },
  on: {
    ru: "Это устройство: уведомления включены",
    uz: "Shu qurilma: bildirishnomalar yoqilgan",
    pl: "To urządzenie: powiadomienia włączone",
  },
  off: {
    ru: "Это устройство: уведомления выключены",
    uz: "Shu qurilma: bildirishnomalar o‘chirilgan",
    pl: "To urządzenie: powiadomienia wyłączone",
  },
  turnOff: { ru: "Выключить", uz: "O‘chirish", pl: "Wyłącz" },
  test: { ru: "Проверить", uz: "Tekshirish", pl: "Sprawdź" },
  testSent: {
    ru: "Отправил — уведомление придёт через пару секунд.",
    uz: "Yuborildi — bildirishnoma bir necha soniyada keladi.",
    pl: "Wysłane — powiadomienie przyjdzie za kilka sekund.",
  },
  testFailed: {
    ru: "Не дошло. Выключите и включите уведомления заново.",
    uz: "Yetib bormadi. Bildirishnomalarni o‘chirib, qaytadan yoqing.",
    pl: "Nie dotarło. Wyłącz i ponownie włącz powiadomienia.",
  },
  denied: {
    ru: "Уведомления запрещены в настройках телефона. Разрешите их для DevUz: Настройки → Уведомления → DevUz.",
    uz: "Bildirishnomalar telefon sozlamalarida taqiqlangan. DevUz uchun ruxsat bering: Sozlamalar → Bildirishnomalar → DevUz.",
    pl: "Powiadomienia są zablokowane w ustawieniach telefonu. Zezwól na nie dla DevUz: Ustawienia → Powiadomienia → DevUz.",
  },
  failed: {
    ru: "Не получилось включить. Попробуйте ещё раз через минуту.",
    uz: "Yoqib bo‘lmadi. Bir daqiqadan keyin yana urinib ko‘ring.",
    pl: "Nie udało się włączyć. Spróbuj ponownie za minutę.",
  },
  unsupported: {
    ru: "Этот браузер уведомления не умеет.",
    uz: "Bu brauzer bildirishnomalarni qo‘llab-quvvatlamaydi.",
    pl: "Ta przeglądarka nie obsługuje powiadomień.",
  },
  sameAsBot: {
    ru: "Приходит то же, что от бота, и по тем же галочкам. Бот остаётся как был.",
    uz: "Botdan keladigan narsa xuddi shu belgilar bo‘yicha keladi. Bot avvalgidek qoladi.",
    pl: "Przychodzi to samo co od bota i według tych samych zaznaczeń. Bot zostaje bez zmian.",
  },
  hide: { ru: "Скрыть", uz: "Yashirish", pl: "Ukryj" },
  /** «Команда»: у кого включено. */
  devices: {
    ru: (n: number) => `📱 Приложение: ${n} ${plural("ru", n, "устройство", "устройства", "устройств")}`,
    uz: (n: number) => `📱 Ilova: ${n} ta qurilma`,
    pl: (n: number) => `📱 Aplikacja: ${n} ${plural("pl", n, "urządzenie", "urządzenia", "urządzeń")}`,
  },
  noDevices: { ru: "📱 Приложение: не включено", uz: "📱 Ilova: yoqilmagan", pl: "📱 Aplikacja: niewłączona" },
  /** Тестовый пуш себе. */
  testTitle: { ru: "DevUz: проверка уведомлений", uz: "DevUz: bildirishnomalarni tekshirish", pl: "DevUz: test powiadomień" },
  testBody: {
    ru: "Всё работает: сообщения бота будут приходить сюда.",
    uz: "Hammasi ishlayapti: bot xabarlari shu yerga keladi.",
    pl: "Wszystko działa: wiadomości od bota będą przychodzić tutaj.",
  },
});
