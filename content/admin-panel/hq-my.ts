import { defineDict, plural } from "@/lib/admin/i18n";

/**
 * «Главная» менеджера (/admin/hq): что горит, что просрочено, с кем
 * связаться, мои макеты, моя работа. Общие подписи (приветствие, «к прошлым
 * 7 дням», «осталось») — в content/admin-panel/hq.ts.
 *
 * Термины — по content/admin-panel/GLOSSARY.md. Кнопки статуса — те же
 * слова, что у бота в «Порядке в лидах»: 🏆 / ❌ / ⏳.
 */

const ru = (n: number, one: string, few: string, many: string) => `${n} ${plural("ru", n, one, few, many)}`;
const pl = (n: number, one: string, few: string, many: string) => `${n} ${plural("pl", n, one, few, many)}`;

export const hqMyDict = defineDict({
  lead: {
    ru: "Ваш день: что горит, кому ответить, с кем связаться и ваши макеты. Всё нажимается.",
    uz: "Sizning kuningiz: nima yonmoqda, kimga javob berish, kim bilan bog‘lanish va maketlaringiz. Hammasi bosiladi.",
    pl: "Twój dzień: co się pali, komu odpisać, z kim się skontaktować i Twoje makiety. Wszystko jest klikalne.",
  },

  // «Горит сейчас».
  hotTitle: { ru: "Горит сейчас", uz: "Hozir yonmoqda", pl: "Pali się teraz" },
  hotCalm: {
    ru: "Сейчас ничего не горит. Хорошее время для порции касаний.",
    uz: "Hozir hech narsa yonmayapti. Aloqalar ulushi uchun yaxshi vaqt.",
    pl: "Teraz nic się nie pali. Dobry moment na porcję kontaktów.",
  },
  hotOffer: {
    ru: (label: string) => `Тёплый лид «${label}» предложен вам`,
    uz: (label: string) => `Iliq lid «${label}» sizga taklif qilindi`,
    pl: (label: string) => `Ciepły lead „${label}” zaproponowany Tobie`,
  },
  burnsIn: { ru: "сгорит через", uz: "yonib ketishiga qoldi:", pl: "przepadnie za" },
  take: { ru: "Взять", uz: "Olish", pl: "Weź" },
  taking: { ru: "Беру…", uz: "Olinmoqda…", pl: "Biorę…" },
  hotReply: {
    ru: (label: string) => `${label} ответил и ждёт вас`,
    uz: (label: string) => `${label} javob berdi va sizni kutmoqda`,
    pl: (label: string) => `${label} odpisał i czeka na Ciebie`,
  },
  waiting: {
    ru: (t: string) => `ждёт ${t}`,
    uz: (t: string) => `${t} kutmoqda`,
    pl: (t: string) => `czeka ${t}`,
  },
  hotOpened: {
    ru: (label: string) => `${label} открыл прототип — напишите сейчас`,
    uz: (label: string) => `${label} prototipni ochdi — hozir yozing`,
    pl: (label: string) => `${label} otworzył prototyp — napisz teraz`,
  },
  ago: {
    ru: (t: string) => `${t} назад`,
    uz: (t: string) => `${t} oldin`,
    pl: (t: string) => `${t} temu`,
  },
  hotPromo: {
    ru: (label: string) => `Акция 48 часов у «${label}» кончается сегодня`,
    uz: (label: string) => `«${label}» uchun 48 soatlik aksiya bugun tugaydi`,
    pl: (label: string) => `Promocja 48 godzin dla „${label}” kończy się dziś`,
  },
  leftShort: {
    ru: (t: string) => `осталось ${t}`,
    uz: (t: string) => `${t} qoldi`,
    pl: (t: string) => `zostało ${t}`,
  },
  hotTask: {
    ru: (label: string) => `Задача на сегодня: ${label}`,
    uz: (label: string) => `Bugungi vazifa: ${label}`,
    pl: (label: string) => `Zadanie na dziś: ${label}`,
  },
  dueAt: {
    ru: (at: string) => `срок ${at}`,
    uz: (at: string) => `muddat ${at}`,
    pl: (at: string) => `termin ${at}`,
  },

  // «Просрочено».
  lateTitle: { ru: "Просрочено", uz: "Muddati o‘tgan", pl: "Zaległe" },
  lateCalm: {
    ru: "Просрочек нет — так и держим.",
    uz: "Muddati o‘tganlar yo‘q — shunday davom etamiz.",
    pl: "Brak zaległości — tak trzymaj.",
  },
  lateTask: {
    ru: (label: string) => `Задача после срока: ${label}`,
    uz: (label: string) => `Muddati o‘tgan vazifa: ${label}`,
    pl: (label: string) => `Zadanie po terminie: ${label}`,
  },
  lateStep: {
    ru: (label: string) => `«${label}»: настал день следующего шага`,
    uz: (label: string) => `«${label}»: keyingi qadam kuni keldi`,
    pl: (label: string) => `„${label}”: nadszedł dzień kolejnego kroku`,
  },
  lateStale: {
    ru: (label: string, days: number) => `«${label}» без движения ${ru(days, "день", "дня", "дней")}`,
    uz: (label: string, days: number) => `«${label}» ${days} kundan beri harakatsiz`,
    pl: (label: string, days: number) => `„${label}” bez ruchu od ${pl(days, "dnia", "dni", "dni")}`,
  },
  since: {
    ru: (at: string) => `с ${at}`,
    uz: (at: string) => `${at} dan beri`,
    pl: (at: string) => `od ${at}`,
  },

  // Быстрая смена статуса — как у бота в «Порядке в лидах».
  won: { ru: "🏆 Выиграли", uz: "🏆 Yutdik", pl: "🏆 Wygrana" },
  lost: { ru: "❌ Проиграли", uz: "❌ Yutqazdik", pl: "❌ Przegrana" },
  wait: { ru: "⏳ Ждём", uz: "⏳ Kutamiz", pl: "⏳ Czekamy" },
  whenNext: {
    ru: "Когда следующий шаг? Поставлю задачу «Связаться» на этот день.",
    uz: "Keyingi qadam qachon? O‘sha kunga «Bog‘lanish» vazifasini qo‘yaman.",
    pl: "Kiedy kolejny krok? Ustawię zadanie „Kontakt” na ten dzień.",
  },
  w1: { ru: "Завтра", uz: "Ertaga", pl: "Jutro" },
  w3: { ru: "Через 3 дня", uz: "3 kundan keyin", pl: "Za 3 dni" },
  w7: { ru: "Через неделю", uz: "Bir haftadan keyin", pl: "Za tydzień" },
  noMoreWait: {
    ru: "Откладывали трижды — только 🏆 или ❌",
    uz: "Uch marta qoldirildi — faqat 🏆 yoki ❌",
    pl: "Odkładano trzy razy — tylko 🏆 albo ❌",
  },
  saving: { ru: "Сохраняю…", uz: "Saqlanmoqda…", pl: "Zapisuję…" },
  rLost: {
    ru: "❌ Записано: проиграли. Лид ушёл из «в работе».",
    uz: "❌ Yozildi: yutqazdik. Lid «ishda»dan chiqdi.",
    pl: "❌ Zapisano: przegrana. Lead zniknął z „w pracy”.",
  },
  rTerm: {
    ru: (when: string) => `⏳ Задача «Связаться» — на ${when}, 10:00. До неё бот про этот лид не спросит.`,
    uz: (when: string) => `⏳ «Bog‘lanish» vazifasi — ${when}, 10:00 ga. Ungacha bot bu lid haqida so‘ramaydi.`,
    pl: (when: string) => `⏳ Zadanie „Kontakt” — na ${when}, 10:00. Do tego czasu bot nie zapyta o ten lead.`,
  },
  rForbidden: {
    ru: "Это не ваш лид — статус меняет тот, за кем он.",
    uz: "Bu sizning lidingiz emas — holatni u kimga biriktirilgan bo‘lsa, o‘sha o‘zgartiradi.",
    pl: "To nie Twój lead — status zmienia osoba, która go prowadzi.",
  },
  rGone: {
    ru: "Лид уже не «в работе» — статус поменяли раньше.",
    uz: "Lid endi «ishda» emas — holat oldinroq o‘zgartirilgan.",
    pl: "Lead nie jest już „w pracy” — status zmieniono wcześniej.",
  },
  rNowait: {
    ru: "Этот лид откладывали трижды — теперь только «🏆 Выиграли» или «❌ Проиграли».",
    uz: "Bu lid uch marta qoldirilgan — endi faqat «🏆 Yutdik» yoki «❌ Yutqazdik».",
    pl: "Ten lead odkładano trzy razy — teraz tylko „🏆 Wygrana” albo „❌ Przegrana”.",
  },
  rFailed: {
    ru: "Не сохранилось — попробуйте ещё раз через минуту.",
    uz: "Saqlanmadi — bir daqiqadan keyin yana urinib ko‘ring.",
    pl: "Nie zapisano — spróbuj ponownie za minutę.",
  },

  // «С кем связаться сегодня».
  contactTitle: { ru: "С кем связаться сегодня", uz: "Bugun kim bilan bog‘lanish kerak", pl: "Z kim skontaktować się dziś" },
  contactNone: {
    ru: "На сегодня никого: задач «Связаться» нет, клиенты не ждут.",
    uz: "Bugunga hech kim yo‘q: «Bog‘lanish» vazifalari yo‘q, mijozlar kutmayapti.",
    pl: "Na dziś nikogo: brak zadań „Kontakt”, klienci nie czekają.",
  },
  whyTask: { ru: "задача «Связаться»", uz: "«Bog‘lanish» vazifasi", pl: "zadanie „Kontakt”" },
  whyStep: { ru: "сегодня следующий шаг", uz: "bugun keyingi qadam", pl: "dziś kolejny krok" },
  whyReply: { ru: "ответил вам", uz: "sizga javob berdi", pl: "odpisał Tobie" },
  call: { ru: "Позвонить", uz: "Qo‘ng‘iroq qilish", pl: "Zadzwoń" },
  write: { ru: "Написать", uz: "Yozish", pl: "Napisz" },
  mail: { ru: "Письмо", uz: "Xat", pl: "E-mail" },
  contact: { ru: "Связаться", uz: "Bog‘lanish", pl: "Skontaktuj się" },
  opening: { ru: "Открываю…", uz: "Ochilmoqda…", pl: "Otwieram…" },
  contactLogged: {
    ru: "контакт откроется и запишется в журнал",
    uz: "kontakt ochiladi va jurnalga yoziladi",
    pl: "kontakt się otworzy i zapisze w dzienniku",
  },
  contactNoLink: {
    ru: "Контакт без ссылки — откройте карточку лида.",
    uz: "Kontaktda havola yo‘q — lid kartasini oching.",
    pl: "Kontakt bez linku — otwórz kartę leada.",
  },
  card: { ru: "Карточка", uz: "Karta", pl: "Karta" },

  // «Мои макеты».
  mockTitle: { ru: "Мои макеты", uz: "Mening maketlarim", pl: "Moje makiety" },
  mockNone: {
    ru: "За 14 дней вы не отправили клиентам ни одного макета.",
    uz: "14 kun ichida mijozlarga birorta ham maket yubormadingiz.",
    pl: "Przez 14 dni nie wysłałeś klientom żadnej makiety.",
  },
  mockSent: {
    ru: (at: string) => `отправлен ${at}`,
    uz: (at: string) => `${at} da yuborilgan`,
    pl: (at: string) => `wysłano ${at}`,
  },
  mockOpened: {
    ru: (at: string, n: number) => `открыт ${at} · ${ru(n, "раз", "раза", "раз")}`,
    uz: (at: string, n: number) => `${at} da ochilgan · ${n} marta`,
    pl: (at: string, n: number) => `otwarta ${at} · ${pl(n, "raz", "razy", "razy")}`,
  },
  mockOpenedNow: { ru: "смотрит прямо сейчас", uz: "hozir ko‘rmoqda", pl: "ogląda w tej chwili" },
  mockNotOpened: { ru: "клиент ещё не открывал", uz: "mijoz hali ochmagan", pl: "klient jeszcze nie otworzył" },
  mockPromo: {
    ru: (left: string) => `акция 48 часов: осталось ${left}`,
    uz: (left: string) => `48 soatlik aksiya: ${left} qoldi`,
    pl: (left: string) => `promocja 48 godzin: zostało ${left}`,
  },
  mockPromoOver: { ru: "акция кончилась", uz: "aksiya tugadi", pl: "promocja się skończyła" },
  mockApproved: { ru: "макет утверждён", uz: "maket tasdiqlangan", pl: "makieta zatwierdzona" },
  mockOpenFor: {
    ru: (h: number) => `открыт по ссылке ещё ${ru(h, "час", "часа", "часов")}`,
    uz: (h: number) => `havola orqali yana ${h} soat ochiq`,
    pl: (h: number) => `otwarta przez link jeszcze ${pl(h, "godzinę", "godziny", "godzin")}`,
  },
  mockClosed: {
    ru: (at: string) => `закрыт паролем с ${at}`,
    uz: (at: string) => `${at} dan beri parol bilan yopiq`,
    pl: (at: string) => `zamknięta hasłem od ${at}`,
  },
  mockPublic: { ru: "витрина", uz: "vitrina", pl: "witryna" },
  passwordFailed: {
    ru: "Пароль не создался — попробуйте ещё раз.",
    uz: "Parol yaratilmadi — yana urinib ko‘ring.",
    pl: "Hasło się nie utworzyło — spróbuj ponownie.",
  },
  allMockups: { ru: "Все макеты", uz: "Barcha maketlar", pl: "Wszystkie makiety" },

  // «Моя работа».
  workTitle: { ru: "Моя работа", uz: "Mening ishim", pl: "Moja praca" },
  todayCol: { ru: "Сегодня", uz: "Bugun", pl: "Dziś" },
  weekCol: { ru: "7 дней", uz: "7 kun", pl: "7 dni" },
  workPortion: {
    ru: (done: number, target: number) => `Порция дня: ${done} из ${target}`,
    uz: (done: number, target: number) => `Kunlik ulush: ${target} dan ${done}`,
    pl: (done: number, target: number) => `Porcja dnia: ${done} z ${target}`,
  },
  workNoPortion: {
    ru: "Порцию дня ещё не брали — откройте «Холодные касания»",
    uz: "Kunlik ulush hali olinmagan — «Sovuq aloqalar»ni oching",
    pl: "Porcja dnia jeszcze nie pobrana — otwórz „Zimne kontakty”",
  },
  workTouches: { ru: "Касания", uz: "Aloqalar", pl: "Kontakty" },
  workReplies: { ru: "Ответили", uz: "Javob berdi", pl: "Odpowiedzi" },
  workWarmTaken: { ru: "Тёплые взяты", uz: "Iliq lidlar olindi", pl: "Ciepłe wzięte" },
  workWarmBurned: { ru: "Тёплые сгорели", uz: "Iliq lidlar yonib ketdi", pl: "Ciepłe przepadły" },
  workMockups: { ru: "Макеты отправлены", uz: "Maketlar yuborildi", pl: "Makiety wysłane" },
  workWon: { ru: "Выиграли", uz: "Yutdik", pl: "Wygrane" },
  workInWork: { ru: "Лиды «в работе»", uz: "«Ishda»gi lidlar", pl: "Leady „w pracy”" },

  more: {
    ru: (n: number) => `ещё ${n}`,
    uz: (n: number) => `yana ${n}`,
    pl: (n: number) => `jeszcze ${n}`,
  },
  openAll: { ru: "Открыть все", uz: "Hammasini ochish", pl: "Otwórz wszystkie" },
});
