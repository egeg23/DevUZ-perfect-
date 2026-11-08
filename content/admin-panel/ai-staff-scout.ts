import { defineDict } from "@/lib/admin/i18n";

/**
 * Вкладка «Скаут» раздела «ИИ-сотрудники» (/admin/ai-staff/scout): группы,
 * которые читает скаут, и режим отбора — «автоматически» или «по словам».
 * Владелец, 08.11.2026: «Выведи настройки скаута в ИИ сотрудника. Чтобы
 * можно было добавлять, убирать прям там. Поставь отслеживание в
 * автоматическом режиме или по заданным словам».
 */
export const scoutTabDict = defineDict({
  tab: { ru: "Скаут", uz: "Skaut", pl: "Skaut" },
  intro: {
    ru: "Скаут читает группы в Telegram и ловит сообщения, где ищут исполнителя: сайт, магазин, приложение, бота. Подходящее становится сигналом в «Сигналах скаута», сильный сигнал — лидом.",
    uz: "Skaut Telegram guruhlarini o‘qiydi va ijrochi qidirilayotgan xabarlarni ushlaydi: sayt, do‘kon, ilova, bot. Mosi «Skaut signallari»da signal bo‘ladi, kuchli signal lidga aylanadi.",
    pl: "Skaut czyta grupy w Telegramie i wyłapuje wiadomości, w których ktoś szuka wykonawcy: strony, sklepu, aplikacji, bota. Pasujące trafiają jako sygnał do „Sygnałów skauta”, mocny sygnał staje się leadem.",
  },
  modeTitle: { ru: "Как отбирать сообщения", uz: "Xabarlarni qanday saralash", pl: "Jak wybierać wiadomości" },
  modeAuto: { ru: "Автоматически", uz: "Avtomatik", pl: "Automatycznie" },
  modeAutoHint: {
    ru: "Скаут сам видит тему (сайт, магазин, приложение, бот, автоматизация) и просьбу «нужен, ищу, кто сделает» на русском, узбекском и английском. Рекламу исполнителей отбрасывает.",
    uz: "Skaut mavzuni (sayt, do‘kon, ilova, bot, avtomatlashtirish) va «kerak, qidiryapman, kim qiladi» iltimosini rus, o‘zbek va ingliz tillarida o‘zi ko‘radi. Ijrochilar reklamasini tashlab yuboradi.",
    pl: "Skaut sam rozpoznaje temat (strona, sklep, aplikacja, bot, automatyzacja) i prośbę „potrzebuję, szukam, kto zrobi” po rosyjsku, uzbecku i angielsku. Reklamy wykonawców odrzuca.",
  },
  modeWords: { ru: "По словам", uz: "So‘zlar bo‘yicha", pl: "Według słów" },
  modeWordsHint: {
    ru: "Дальше идут только сообщения, где есть хотя бы одно слово из списка. Слово ловится с начала: «сайт» найдёт и «сайта», и «сайтом». Модель всё равно отличает заказ от рекламы.",
    uz: "Faqat ro‘yxatdagi kamida bitta so‘z bor xabarlar o‘tadi. So‘z boshidan ushlanadi: «sayt» «saytga» va «saytni»ni ham topadi. Model baribir buyurtmani reklamadan ajratadi.",
    pl: "Dalej trafiają tylko wiadomości z co najmniej jednym słowem z listy. Słowo łapie się od początku: „stron” znajdzie „strona” i „stronę”. Model i tak odróżnia zlecenie od reklamy.",
  },
  words: { ru: "Слова и фразы — по одной на строку или через запятую", uz: "So‘z va iboralar — har birini alohida qatorda yoki vergul bilan", pl: "Słowa i frazy — każde w osobnej linii lub po przecinku" },
  wordsCount: {
    ru: (n: number) => `Сейчас слов: ${n}`,
    uz: (n: number) => `Hozir so‘zlar: ${n}`,
    pl: (n: number) => `Słów teraz: ${n}`,
  },
  save: { ru: "Сохранить", uz: "Saqlash", pl: "Zapisz" },
  current: { ru: "Сейчас:", uz: "Hozir:", pl: "Teraz:" },
  onlyHeads: {
    ru: "Режим и слова меняют владелец и руководитель. Группы добавлять может каждый.",
    uz: "Rejim va so‘zlarni egasi va rahbar o‘zgartiradi. Guruh qo‘shish hammaga mumkin.",
    pl: "Tryb i słowa zmienia właściciel i kierownik. Grupy może dodawać każdy.",
  },
  signals: { ru: "Открыть «Сигналы скаута»", uz: "«Skaut signallari»ni ochish", pl: "Otwórz „Sygnały skauta”" },
  r_ok: { ru: "Сохранено. Скаут перейдёт на новый режим в течение 5 минут.", uz: "Saqlandi. Skaut 5 daqiqa ichida yangi rejimga o‘tadi.", pl: "Zapisano. Skaut przejdzie na nowy tryb w ciągu 5 minut." },
  r_empty: { ru: "Для режима «По словам» впишите хотя бы одно слово.", uz: "«So‘zlar bo‘yicha» rejimi uchun kamida bitta so‘z yozing.", pl: "Dla trybu „Według słów” wpisz co najmniej jedno słowo." },
  r_forbidden: { ru: "Режим меняют только владелец и руководитель.", uz: "Rejimni faqat egasi va rahbar o‘zgartiradi.", pl: "Tryb zmienia tylko właściciel i kierownik." },
  r_failed: { ru: "Не получилось. Попробуйте ещё раз.", uz: "Bo‘lmadi. Yana urinib ko‘ring.", pl: "Nie udało się. Spróbuj jeszcze raz." },
});
