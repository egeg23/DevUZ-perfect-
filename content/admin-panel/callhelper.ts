import { defineDict } from "@/lib/admin/i18n";

/**
 * DevUz CallHelper (/admin/callhelper) — суфлёр оператора колл-центра.
 * Сам сценарий звонка и подсказки — по-русски: разговоры пока только
 * по-русски (решение владельца, 25.11.2026), переводится только панель.
 */
export const callhelperDict = defineDict({
  title: { ru: "DevUz CallHelper", uz: "DevUz CallHelper", pl: "DevUz CallHelper" },
  lead: {
    ru: "Суфлёр для звонков: вы вводите, что сказал клиент и что ответил оператор, а суфлёр сразу показывает, что сказать дальше, узнаёт возражения и следит за запрещёнными словами. Пока реплики вводятся руками, распознавание голоса подключим следующим шагом.",
    uz: "Qo‘ng‘iroqlar uchun suflyor: mijoz nima deganini va operator nima javob berganini kiritasiz, suflyor esa darhol keyin nima deyishni ko‘rsatadi, e’tirozlarni taniydi va taqiqlangan so‘zlarni kuzatadi. Hozircha replikalar qo‘lda kiritiladi, ovozni tanishni keyingi bosqichda ulaymiz.",
    pl: "Suflerka do rozmów: wpisujesz, co powiedział klient i co odpowiedział operator, a suflerka od razu pokazuje, co powiedzieć dalej, rozpoznaje zastrzeżenia i pilnuje zakazanych słów. Na razie wypowiedzi wpisuje się ręcznie, rozpoznawanie głosu podłączymy w następnym kroku.",
  },
  sayNow: { ru: "Скажите сейчас", uz: "Hozir ayting", pl: "Powiedz teraz" },
  thinking: { ru: "Суфлёр подбирает фразу…", uz: "Suflyor ibora tanlayapti…", pl: "Suflerka dobiera zdanie…" },
  srcModel: { ru: "живая фраза от ИИ", uz: "sun’iy intellektdan jonli ibora", pl: "żywe zdanie od AI" },
  srcCode: { ru: "из вашего сценария", uz: "sizning ssenariyingizdan", pl: "z twojego scenariusza" },
  objection: {
    ru: (name: string) => `Возражение: «${name}»`,
    uz: (name: string) => `E’tiroz: «${name}»`,
    pl: (name: string) => `Zastrzeżenie: «${name}»`,
  },
  objectionBase: { ru: "ответ общий, впишите свой в сценарий", uz: "javob umumiy, ssenariyga o‘zingiznikini yozing", pl: "odpowiedź ogólna, wpisz własną w scenariusz" },
  banned: {
    ru: (words: string) => `Оператор сказал запрещённое: ${words}`,
    uz: (words: string) => `Operator taqiqlangan so‘zni aytdi: ${words}`,
    pl: (words: string) => `Operator powiedział zakazane słowo: ${words}`,
  },
  record: {
    ru: "Не предупредили, что разговор записывается: без этого запись звонка нарушает закон о персональных данных.",
    uz: "Suhbat yozib olinayotgani haqida ogohlantirilmadi: busiz qo‘ng‘iroqni yozib olish shaxsiy ma’lumotlar haqidagi qonunni buzadi.",
    pl: "Nie uprzedzono, że rozmowa jest nagrywana: bez tego nagrywanie rozmowy narusza ustawę o danych osobowych.",
  },
  must: {
    ru: (list: string) => `Ещё не сказали: ${list}`,
    uz: (list: string) => `Hali aytilmadi: ${list}`,
    pl: (list: string) => `Jeszcze nie padło: ${list}`,
  },
  stagesTitle: { ru: "Этапы звонка", uz: "Qo‘ng‘iroq bosqichlari", pl: "Etapy rozmowy" },
  allDone: { ru: "Все этапы пройдены", uz: "Barcha bosqichlar o‘tildi", pl: "Wszystkie etapy zaliczone" },
  talkTitle: { ru: "Разговор", uz: "Suhbat", pl: "Rozmowa" },
  talkEmpty: {
    ru: "Разговора ещё нет. Начните с первой фразы оператора или впишите, что сказал клиент.",
    uz: "Hali suhbat yo‘q. Operatorning birinchi iborasidan boshlang yoki mijoz nima deganini yozing.",
    pl: "Rozmowy jeszcze nie ma. Zacznij od pierwszego zdania operatora albo wpisz, co powiedział klient.",
  },
  whoClient: { ru: "Клиент", uz: "Mijoz", pl: "Klient" },
  whoOperator: { ru: "Оператор", uz: "Operator", pl: "Operator" },
  linePlaceholder: { ru: "Что прозвучало в разговоре", uz: "Suhbatda nima aytildi", pl: "Co padło w rozmowie" },
  addClient: { ru: "Сказал клиент", uz: "Mijoz aytdi", pl: "Powiedział klient" },
  addOperator: { ru: "Сказал оператор", uz: "Operator aytdi", pl: "Powiedział operator" },
  useHint: { ru: "Оператор сказал это", uz: "Operator buni aytdi", pl: "Operator to powiedział" },
  newCall: { ru: "Новый звонок", uz: "Yangi qo‘ng‘iroq", pl: "Nowa rozmowa" },
  scriptTitle: { ru: "Сценарий звонка", uz: "Qo‘ng‘iroq ssenariysi", pl: "Scenariusz rozmowy" },
  scriptLead: {
    ru: "Это и есть параметры суфлёра. Сценарий хранится в этом браузере, пока не появится кабинет колл-центра.",
    uz: "Bu suflyor parametrlarining o‘zi. Ssenariy qo‘ng‘iroq markazi kabineti paydo bo‘lguncha shu brauzerda saqlanadi.",
    pl: "To są właśnie parametry suflerki. Scenariusz jest zapisany w tej przeglądarce, dopóki nie powstanie panel call center.",
  },
  fProduct: { ru: "Продукт", uz: "Mahsulot", pl: "Produkt" },
  fGoal: { ru: "Цель звонка", uz: "Qo‘ng‘iroq maqsadi", pl: "Cel rozmowy" },
  fStages: { ru: "Этапы", uz: "Bosqichlar", pl: "Etapy" },
  fStagesHint: {
    ru: "По строке на этап: название | что сказать | слова оператора через запятую, по которым этап пройден",
    uz: "Har bir bosqichga bitta qator: nomi | nima deyish | bosqich o‘tilganini bildiruvchi operator so‘zlari vergul bilan",
    pl: "Jedna linia na etap: nazwa | co powiedzieć | słowa operatora po przecinku, po których etap jest zaliczony",
  },
  fObjections: { ru: "Возражения", uz: "E’tirozlar", pl: "Zastrzeżenia" },
  fObjectionsHint: {
    ru: "По строке: название | слова клиента через запятую | ваш ответ",
    uz: "Har qatorda: nomi | mijoz so‘zlari vergul bilan | sizning javobingiz",
    pl: "Jedna linia: nazwa | słowa klienta po przecinku | twoja odpowiedź",
  },
  fMust: { ru: "Обязательные фразы", uz: "Majburiy iboralar", pl: "Obowiązkowe zwroty" },
  fMustHint: { ru: "По фразе на строку", uz: "Har qatorga bitta ibora", pl: "Jeden zwrot na linię" },
  fBanned: { ru: "Запрещённые слова", uz: "Taqiqlangan so‘zlar", pl: "Zakazane słowa" },
  fBannedHint: { ru: "Через запятую", uz: "Vergul bilan", pl: "Po przecinku" },
  save: { ru: "Сохранить сценарий", uz: "Ssenariyni saqlash", pl: "Zapisz scenariusz" },
  saved: { ru: "Сценарий сохранён", uz: "Ssenariy saqlandi", pl: "Scenariusz zapisany" },
  example: { ru: "Вернуть пример", uz: "Namunani qaytarish", pl: "Przywróć przykład" },
  pProduct: { ru: "Впишите продукт", uz: "Mahsulotni yozing", pl: "Wpisz produkt" },
  pGoal: { ru: "Впишите цель звонка", uz: "Qo‘ng‘iroq maqsadini yozing", pl: "Wpisz cel rozmowy" },
  pStages: { ru: "Нужен хотя бы один этап", uz: "Kamida bitta bosqich kerak", pl: "Potrzebny jest co najmniej jeden etap" },
  pStageWords: {
    ru: "У каждого этапа нужны слова, по которым он пройден",
    uz: "Har bir bosqichda u o‘tilganini bildiruvchi so‘zlar bo‘lishi kerak",
    pl: "Każdy etap potrzebuje słów, po których jest zaliczony",
  },
  errRate: { ru: "Слишком часто, подождите минуту", uz: "Juda tez-tez, bir daqiqa kuting", pl: "Za często, poczekaj minutę" },
  errFail: {
    ru: "ИИ сейчас не ответил, показана фраза из сценария",
    uz: "Sun’iy intellekt hozir javob bermadi, ssenariydagi ibora ko‘rsatildi",
    pl: "AI teraz nie odpowiedziało, pokazano zdanie ze scenariusza",
  },
  privacy: {
    ru: "Телефоны, почта и номера документов вырезаются из разговора до того, как он уходит ИИ.",
    uz: "Telefonlar, pochta va hujjat raqamlari suhbat sun’iy intellektga yuborilishidan oldin olib tashlanadi.",
    pl: "Telefony, e-maile i numery dokumentów są usuwane z rozmowy, zanim trafi ona do AI.",
  },
});
