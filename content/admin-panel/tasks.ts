import { defineDict } from "@/lib/admin/i18n";

/**
 * Блок «Задачи» на главной панели и уведомления о задачах в браузере.
 *
 * Названия кнопок — те же, что в инструкции (content/admin-help-*.ts):
 * узбекская инструкция зовёт их отсюда же. Кнопки бота в Telegram — по-
 * русски, они в lib/admin/task-bot.ts.
 */
export const tasksDict = defineDict({
  title: { ru: "Задачи", uz: "Vazifalar", pl: "Zadania" },
  forMe: { ru: "Мне", uz: "Menga", pl: "Dla mnie" },
  iGave: { ru: "Я поставил", uz: "Men qo‘yganlar", pl: "Zleciłem" },
  nothingMine: { ru: "На вас задач нет.", uz: "Sizda vazifa yo‘q.", pl: "Nie masz zadań." },
  nothingGiven: {
    ru: "Вы пока никому не ставили задач.",
    uz: "Siz hali hech kimga vazifa qo‘ymagansiz.",
    pl: "Nikomu jeszcze nie zleciłeś zadań.",
  },
  from: { ru: (name: string) => `от ${name}`, uz: (name: string) => `${name} dan`, pl: (name: string) => `od ${name}` },
  to: { ru: (name: string) => `кому: ${name}`, uz: (name: string) => `kimga: ${name}`, pl: (name: string) => `dla: ${name}` },
  due: { ru: (when: string) => `срок ${when}`, uz: (when: string) => `muddat ${when}`, pl: (when: string) => `termin ${when}` },
  statusNew: { ru: "новая", uz: "yangi", pl: "nowe" },
  statusInWork: { ru: "в работе", uz: "ishda", pl: "w toku" },
  statusDone: { ru: "сделано", uz: "bajarildi", pl: "zrobione" },
  statusFailed: { ru: "не сделано", uz: "bajarilmadi", pl: "niezrobione" },
  overdue: { ru: "просрочена", uz: "muddati o‘tgan", pl: "po terminie" },
  statusCancelled: { ru: "отменена", uz: "bekor qilingan", pl: "anulowane" },
  noDue: { ru: "без срока", uz: "muddatsiz", pl: "bez terminu" },
  project: { ru: (name: string) => `проект: ${name}`, uz: (name: string) => `loyiha: ${name}`, pl: (name: string) => `projekt: ${name}` },
  cancel: { ru: "Отменить задачу", uz: "Vazifani bekor qilish", pl: "Anuluj zadanie" },
  setDue: { ru: "Назначить срок", uz: "Muddat belgilash", pl: "Ustal termin" },

  take: { ru: "Взять в работу", uz: "Ishga olish", pl: "Przyjmij do realizacji" },
  done: { ru: "Сделано", uz: "Bajarildi", pl: "Zrobione" },
  failed: { ru: "Не сделано", uz: "Bajarilmadi", pl: "Niezrobione" },
  move: { ru: "Перенести срок", uz: "Muddatni ko‘chirish", pl: "Przesuń termin" },
  move1h: { ru: "+1 час", uz: "+1 soat", pl: "+1 godz." },
  moveTomorrow: { ru: "Завтра 18:00", uz: "Ertaga 18:00", pl: "Jutro 18:00" },
  move3d: { ru: "+3 дня", uz: "+3 kun", pl: "+3 dni" },
  moveWeek: { ru: "Неделя", uz: "Bir hafta", pl: "Tydzień" },
  moveTo: { ru: "Перенести на", uz: "Shu sanaga", pl: "Przesuń na" },

  newTask: { ru: "Поставить задачу", uz: "Vazifa qo‘yish", pl: "Zleć zadanie" },
  fieldWho: { ru: "Кому", uz: "Kimga", pl: "Komu" },
  whoHint: {
    ru: "Можно отметить нескольких — каждому придёт своя задача.",
    uz: "Bir nechta kishini belgilash mumkin — har biriga o‘z vazifasi keladi.",
    pl: "Możesz zaznaczyć kilka osób — każda dostanie własne zadanie.",
  },
  self: { ru: (name: string) => `${name} (себе)`, uz: (name: string) => `${name} (o‘zimga)`, pl: (name: string) => `${name} (sobie)` },
  fieldTitle: { ru: "Что сделать", uz: "Nima qilish kerak", pl: "Co zrobić" },
  fieldBody: { ru: "Подробнее (необязательно)", uz: "Batafsil (ixtiyoriy)", pl: "Szczegóły (opcjonalnie)" },
  fieldDue: { ru: "Срок", uz: "Muddat", pl: "Termin" },
  fieldProject: { ru: "Проект (необязательно)", uz: "Loyiha (ixtiyoriy)", pl: "Projekt (opcjonalnie)" },
  projectNone: { ru: "— без проекта —", uz: "— loyihasiz —", pl: "— bez projektu —" },
  dueNone: { ru: "без срока", uz: "muddatsiz", pl: "bez terminu" },
  dueToday: { ru: "сегодня до 18:00", uz: "bugun 18:00 gacha", pl: "dziś do 18:00" },
  dueTomorrow: { ru: "завтра", uz: "ertaga", pl: "jutro" },
  due3days: { ru: "через 3 дня", uz: "3 kundan keyin", pl: "za 3 dni" },
  dueCustom: { ru: "своя дата", uz: "boshqa sana", pl: "własna data" },
  dueHint: {
    ru: "Время — ташкентское. «Завтра» и «через 3 дня» — до 18:00. Без срока бот не напоминает о сроке.",
    uz: "Vaqt — Toshkent vaqti. «Ertaga» va «3 kundan keyin» — 18:00 gacha. Muddatsiz vazifa haqida bot muddat bo‘yicha eslatmaydi.",
    pl: "Czas taszkencki. „Jutro” i „za 3 dni” — do 18:00. Bez terminu bot nie przypomina o terminie.",
  },
  noProjects: {
    ru: "Открытых проектов нет — их заводят в разделе «Проекты».",
    uz: "Ochiq loyihalar yo‘q — ular «Loyihalar» bo‘limida qo‘shiladi.",
    pl: "Brak otwartych projektów — dodaje się je w sekcji „Projekty”.",
  },

  groupBy: { ru: "Группировать", uz: "Guruhlash", pl: "Grupuj" },
  groupNone: { ru: "не группировать", uz: "guruhlamaslik", pl: "bez grupowania" },
  groupDue: { ru: "по сроку", uz: "muddat bo‘yicha", pl: "według terminu" },
  groupProject: { ru: "по проекту", uz: "loyiha bo‘yicha", pl: "według projektu" },
  groupPerson: { ru: "по человеку", uz: "odam bo‘yicha", pl: "według osoby" },
  filterProject: { ru: "Проект", uz: "Loyiha", pl: "Projekt" },
  allProjects: { ru: "все проекты", uz: "barcha loyihalar", pl: "wszystkie projekty" },
  apply: { ru: "Показать", uz: "Ko‘rsatish", pl: "Pokaż" },
  bucketOverdue: { ru: "Срок прошёл", uz: "Muddat o‘tgan", pl: "Po terminie" },
  bucketToday: { ru: "Срок сегодня", uz: "Muddat bugun", pl: "Termin dziś" },
  bucketTomorrow: { ru: "Срок завтра", uz: "Muddat ertaga", pl: "Termin jutro" },
  bucketWeek: { ru: "В ближайшие 7 дней", uz: "Yaqin 7 kun ichida", pl: "W ciągu 7 dni" },
  bucketLater: { ru: "Позже", uz: "Keyinroq", pl: "Później" },
  bucketNone: { ru: "Без срока", uz: "Muddatsiz", pl: "Bez terminu" },
  groupNoProject: { ru: "Без проекта", uz: "Loyihasiz", pl: "Bez projektu" },

  projectTasks: { ru: "Задачи по проекту", uz: "Loyiha bo‘yicha vazifalar", pl: "Zadania w projekcie" },
  nothingProject: { ru: "По проекту задач нет.", uz: "Loyiha bo‘yicha vazifa yo‘q.", pl: "Brak zadań w projekcie." },
  assigneeOf: { ru: (name: string) => `исполнитель: ${name}`, uz: (name: string) => `ijrochi: ${name}`, pl: (name: string) => `wykonawca: ${name}` },
  submit: { ru: "Поставить", uz: "Qo‘yish", pl: "Zleć" },
  offline: {
    ru: "База недоступна — задачи сейчас не видны.",
    uz: "Baza ishlamayapti — vazifalar hozir ko‘rinmaydi.",
    pl: "Baza niedostępna — zadania są teraz niewidoczne.",
  },

  edit: { ru: "Изменить", uz: "Tahrirlash", pl: "Edytuj" },
  editSave: { ru: "Сохранить", uz: "Saqlash", pl: "Zapisz" },
  fieldAssignee: { ru: "Исполнитель", uz: "Ijrochi", pl: "Wykonawca" },
  editHint: {
    ru: "Срок меняется кнопкой «Перенести срок». Смените исполнителя — задача у него начнётся заново, а с прежнего снимется.",
    uz: "Muddat «Muddatni ko‘chirish» tugmasi bilan o‘zgaradi. Ijrochini almashtirsangiz, vazifa unda qaytadan boshlanadi, avvalgisidan esa olib tashlanadi.",
    pl: "Termin zmienia się przyciskiem „Przesuń termin”. Zmień wykonawcę — zadanie zacznie się u niego od nowa, a poprzedniemu zostanie zdjęte.",
  },
  movedTimes: {
    ru: (n: number) => `переносов: ${n}`,
    uz: (n: number) => `ko‘chirishlar: ${n}`,
    pl: (n: number) => `przesunięć: ${n}`,
  },
  history: {
    ru: (n: number) => `История · ${n}`,
    uz: (n: number) => `Tarix · ${n}`,
    pl: (n: number) => `Historia · ${n}`,
  },
  historyLink: { ru: "История задач", uz: "Vazifalar tarixi", pl: "Historia zadań" },
  stepCreated: {
    ru: (who: string, due: string) => `${who} поставил(а) задачу, ${due}`,
    uz: (who: string, due: string) => `${who} vazifa qo‘ydi, ${due}`,
    pl: (who: string, due: string) => `${who} zlecił(a) zadanie, ${due}`,
  },
  stepTaken: {
    ru: (who: string) => `${who} взял(а) в работу`,
    uz: (who: string) => `${who} ishga oldi`,
    pl: (who: string) => `${who} przyjął(ęła) do realizacji`,
  },
  stepDone: {
    ru: (who: string) => `${who}: сделано`,
    uz: (who: string) => `${who}: bajarildi`,
    pl: (who: string) => `${who}: zrobione`,
  },
  stepFailed: {
    ru: (who: string) => `${who}: не сделано`,
    uz: (who: string) => `${who}: bajarilmadi`,
    pl: (who: string) => `${who}: niezrobione`,
  },
  stepCancelled: {
    ru: (who: string) => `${who} отменил(а) задачу`,
    uz: (who: string) => `${who} vazifani bekor qildi`,
    pl: (who: string) => `${who} anulował(a) zadanie`,
  },
  stepMoved: {
    ru: (who: string, from: string, to: string) => `${who} перенёс(ла) срок: ${from} → ${to}`,
    uz: (who: string, from: string, to: string) => `${who} muddatni ko‘chirdi: ${from} → ${to}`,
    pl: (who: string, from: string, to: string) => `${who} przesunął(ęła) termin: ${from} → ${to}`,
  },
  stepEdited: {
    ru: (who: string) => `${who} изменил(а) задачу`,
    uz: (who: string) => `${who} vazifani o‘zgartirdi`,
    pl: (who: string) => `${who} zmienił(a) zadanie`,
  },
  changeTitle: {
    ru: (from: string, to: string) => `название: «${from}» → «${to}»`,
    uz: (from: string, to: string) => `nomi: «${from}» → «${to}»`,
    pl: (from: string, to: string) => `nazwa: «${from}» → «${to}»`,
  },
  changeBody: { ru: "описание изменено", uz: "tavsif o‘zgardi", pl: "opis zmieniony" },
  changeProject: {
    ru: (from: string, to: string) => `проект: ${from} → ${to}`,
    uz: (from: string, to: string) => `loyiha: ${from} → ${to}`,
    pl: (from: string, to: string) => `projekt: ${from} → ${to}`,
  },
  changeAssignee: {
    ru: (from: string, to: string) => `исполнитель: ${from} → ${to}`,
    uz: (from: string, to: string) => `ijrochi: ${from} → ${to}`,
    pl: (from: string, to: string) => `wykonawca: ${from} → ${to}`,
  },

  alertsOn: { ru: "Включить уведомления", uz: "Bildirishnomalarni yoqish", pl: "Włącz powiadomienia" },
  alertsGranted: { ru: "Уведомления включены", uz: "Bildirishnomalar yoqilgan", pl: "Powiadomienia włączone" },
  alertsDenied: {
    ru: "Браузер запретил уведомления — разрешите их в настройках сайта. Звук работает.",
    uz: "Brauzer bildirishnomalarni taqiqlagan — ularga sayt sozlamalarida ruxsat bering. Ovoz ishlaydi.",
    pl: "Przeglądarka zablokowała powiadomienia — zezwól na nie w ustawieniach strony. Dźwięk działa.",
  },
  alertsUnsupported: {
    ru: "Этот браузер не показывает уведомления — будет только звук.",
    uz: "Bu brauzer bildirishnoma ko‘rsatmaydi — faqat ovoz bo‘ladi.",
    pl: "Ta przeglądarka nie pokazuje powiadomień — będzie tylko dźwięk.",
  },

  feedAssigned: {
    ru: (name: string, title: string) => `${name} поставил(а) вам задачу: ${title}`,
    uz: (name: string, title: string) => `${name} sizga vazifa qo‘ydi: ${title}`,
    pl: (name: string, title: string) => `${name} zlecił(a) ci zadanie: ${title}`,
  },
  feedTaken: {
    ru: (name: string, title: string) => `${name} взял(а) в работу: ${title}`,
    uz: (name: string, title: string) => `${name} ishga oldi: ${title}`,
    pl: (name: string, title: string) => `${name} przyjął(ęła) zadanie: ${title}`,
  },
  feedDone: {
    ru: (name: string, title: string) => `${name}: сделано — ${title}`,
    uz: (name: string, title: string) => `${name}: bajarildi — ${title}`,
    pl: (name: string, title: string) => `${name}: zrobione — ${title}`,
  },
  feedFailed: {
    ru: (name: string, title: string) => `${name}: не сделано — ${title}`,
    uz: (name: string, title: string) => `${name}: bajarilmadi — ${title}`,
    pl: (name: string, title: string) => `${name}: niezrobione — ${title}`,
  },
  feedCancelled: {
    ru: (name: string, title: string) => `${name} отменил(а) задачу: ${title}`,
    uz: (name: string, title: string) => `${name} vazifani bekor qildi: ${title}`,
    pl: (name: string, title: string) => `${name} anulował(a) zadanie: ${title}`,
  },
  feedMoved: {
    ru: (name: string, title: string) => `${name} перенёс(ла) срок: ${title}`,
    uz: (name: string, title: string) => `${name} muddatni ko‘chirdi: ${title}`,
    pl: (name: string, title: string) => `${name} przesunął(ęła) termin: ${title}`,
  },
  feedEdited: {
    ru: (name: string, title: string) => `${name} изменил(а) задачу: ${title}`,
    uz: (name: string, title: string) => `${name} vazifani o‘zgartirdi: ${title}`,
    pl: (name: string, title: string) => `${name} zmienił(a) zadanie: ${title}`,
  },
  notifTitle: { ru: "Задачи — DevUz", uz: "Vazifalar — DevUz", pl: "Zadania — DevUz" },
  openTasks: { ru: "Открыть задачи", uz: "Vazifalarni ochish", pl: "Otwórz zadania" },
  close: { ru: "Закрыть", uz: "Yopish", pl: "Zamknij" },
});

/** Чем кончилось действие в блоке — параметром `?t=` в адресе. */
export const taskNoticeDict = defineDict({
  created: { ru: "Задача поставлена.", uz: "Vazifa qo‘yildi.", pl: "Zadanie zlecone." },
  createdLater: {
    ru: "Задача поставлена. Сейчас ночь — бот напишет исполнителю в 07:00.",
    uz: "Vazifa qo‘yildi. Hozir tun — bot ijrochiga soat 07:00 da yozadi.",
    pl: "Zadanie zlecone. Jest noc — bot napisze do wykonawcy o 07:00.",
  },
  createdMany: {
    ru: "Задачи поставлены — каждому своя.",
    uz: "Vazifalar qo‘yildi — har biriga o‘ziniki.",
    pl: "Zadania zlecone — każdy ma własne.",
  },
  createdManyLater: {
    ru: "Задачи поставлены — каждому своя. Сейчас ночь — бот напишет исполнителям в 07:00.",
    uz: "Vazifalar qo‘yildi — har biriga o‘ziniki. Hozir tun — bot ijrochilarga soat 07:00 da yozadi.",
    pl: "Zadania zlecone — każdy ma własne. Jest noc — bot napisze do wykonawców o 07:00.",
  },
  createdPartly: {
    ru: "Поставлено не всем: база не ответила. Проверьте «Я поставил» и поставьте остальным ещё раз.",
    uz: "Hammaga qo‘yilmadi: baza javob bermadi. «Men qo‘yganlar» ni tekshiring va qolganlarga yana qo‘ying.",
    pl: "Nie wszystkim zlecono: baza nie odpowiedziała. Sprawdź «Zleciłem» i zleć pozostałym jeszcze raz.",
  },
  noAssignee: {
    ru: "Отметьте, кому поставить задачу.",
    uz: "Vazifa kimga qo‘yilishini belgilang.",
    pl: "Zaznacz, komu zlecić zadanie.",
  },
  taken: { ru: "Задача в работе.", uz: "Vazifa ishda.", pl: "Zadanie w toku." },
  done: { ru: "Отмечено: сделано.", uz: "Belgilandi: bajarildi.", pl: "Oznaczono: zrobione." },
  failed: { ru: "Отмечено: не сделано.", uz: "Belgilandi: bajarilmadi.", pl: "Oznaczono: niezrobione." },
  moved: { ru: "Срок перенесён.", uz: "Muddat ko‘chirildi.", pl: "Termin przesunięty." },
  cancelled: { ru: "Задача отменена.", uz: "Vazifa bekor qilindi.", pl: "Zadanie anulowane." },
  edited: { ru: "Задача изменена.", uz: "Vazifa o‘zgartirildi.", pl: "Zadanie zmienione." },
  editedNew: {
    ru: "Задача передана — новому исполнителю бот напишет сам.",
    uz: "Vazifa topshirildi — yangi ijrochiga bot o‘zi yozadi.",
    pl: "Zadanie przekazane — bot sam napisze do nowego wykonawcy.",
  },
  editedNewLater: {
    ru: "Задача передана. Сейчас ночь — бот напишет новому исполнителю в 07:00.",
    uz: "Vazifa topshirildi. Hozir tun — bot yangi ijrochiga soat 07:00 da yozadi.",
    pl: "Zadanie przekazane. Jest noc — bot napisze do nowego wykonawcy o 07:00.",
  },
  unchanged: {
    ru: "Ничего не поменялось — задача осталась как была.",
    uz: "Hech narsa o‘zgarmadi — vazifa avvalgidek qoldi.",
    pl: "Nic się nie zmieniło — zadanie zostało bez zmian.",
  },
  project: {
    ru: "Такого проекта нет — выберите из списка.",
    uz: "Bunday loyiha yo‘q — ro‘yxatdan tanlang.",
    pl: "Nie ma takiego projektu — wybierz z listy.",
  },
  title: {
    ru: "Напишите, что сделать, — до 200 знаков.",
    uz: "Nima qilish kerakligini yozing — 200 belgigacha.",
    pl: "Wpisz, co zrobić — do 200 znaków.",
  },
  body: {
    ru: "Описание длиннее 2000 знаков — сократите.",
    uz: "Tavsif 2000 belgidan uzun — qisqartiring.",
    pl: "Opis ma ponad 2000 znaków — skróć go.",
  },
  assignee: {
    ru: "Такого сотрудника нет или он отключён.",
    uz: "Bunday xodim yo‘q yoki u o‘chirilgan.",
    pl: "Nie ma takiego pracownika albo jest wyłączony.",
  },
  past: {
    ru: "Этот срок уже прошёл — выберите другой.",
    uz: "Bu muddat o‘tib ketgan — boshqasini tanlang.",
    pl: "Ten termin już minął — wybierz inny.",
  },
  far: {
    ru: "Срок дальше чем через год — проверьте год.",
    uz: "Muddat bir yildan uzoq — yilni tekshiring.",
    pl: "Termin jest dalej niż za rok — sprawdź rok.",
  },
  notYours: { ru: "Это не ваша задача.", uz: "Bu sizning vazifangiz emas.", pl: "To nie twoje zadanie." },
  closed: { ru: "Задача уже закрыта.", uz: "Vazifa allaqachon yopilgan.", pl: "Zadanie jest już zamknięte." },
  alreadyTaken: { ru: "Задача уже в работе.", uz: "Vazifa allaqachon ishda.", pl: "Zadanie jest już w toku." },
  changed: {
    ru: "Задачу только что изменили — посмотрите, что с ней сейчас.",
    uz: "Vazifa hozirgina o‘zgardi — hozirgi holatini ko‘ring.",
    pl: "Zadanie właśnie się zmieniło — sprawdź jego stan.",
  },
  offline: { ru: "База недоступна.", uz: "Baza ishlamayapti.", pl: "Baza niedostępna." },
  failedTry: {
    ru: "Не получилось — попробуйте ещё раз.",
    uz: "Bo‘lmadi — yana urinib ko‘ring.",
    pl: "Nie udało się — spróbuj ponownie.",
  },
});

/** Страница «История задач» (/admin/tasks). */
export const taskHistoryDict = defineDict({
  title: { ru: "История задач", uz: "Vazifalar tarixi", pl: "Historia zadań" },
  back: { ru: "← Задачи", uz: "← Vazifalar", pl: "← Zadania" },
  leadMine: {
    ru: "Что случилось с вашими задачами — теми, что поставили вы, и теми, что поставили вам: сделано, не сделано, отменено, перенесён срок, изменено.",
    uz: "Vazifalaringiz bilan nima bo‘ldi — siz qo‘yganlar va sizga qo‘yilganlar: bajarildi, bajarilmadi, bekor qilindi, muddat ko‘chirildi, o‘zgartirildi.",
    pl: "Co się stało z twoimi zadaniami — zleconymi przez ciebie i dla ciebie: zrobione, niezrobione, anulowane, przesunięty termin, zmienione.",
  },
  leadTeam: {
    ru: "Что случилось с задачами команды: сделано, не сделано, отменено, перенесён срок, изменено. Ниже — по людям и каждая задача со своей историей.",
    uz: "Jamoa vazifalari bilan nima bo‘ldi: bajarildi, bajarilmadi, bekor qilindi, muddat ko‘chirildi, o‘zgartirildi. Pastda — odamlar bo‘yicha va har bir vazifa o‘z tarixi bilan.",
    pl: "Co się stało z zadaniami zespołu: zrobione, niezrobione, anulowane, przesunięty termin, zmienione. Niżej — według osób i każde zadanie z własną historią.",
  },
  filterKind: { ru: "Что", uz: "Nima", pl: "Co" },
  kindAll: { ru: "всё", uz: "hammasi", pl: "wszystko" },
  kindDone: { ru: "сделано", uz: "bajarildi", pl: "zrobione" },
  kindFailed: { ru: "не сделано", uz: "bajarilmadi", pl: "niezrobione" },
  kindCancelled: { ru: "отменено", uz: "bekor qilingan", pl: "anulowane" },
  kindMoved: { ru: "переносы срока", uz: "muddat ko‘chirishlari", pl: "przesunięcia terminu" },
  kindEdited: { ru: "изменения", uz: "o‘zgarishlar", pl: "zmiany" },
  filterWho: { ru: "Чьи", uz: "Kimniki", pl: "Czyje" },
  whoAll: { ru: "все", uz: "hammasi", pl: "wszystkich" },
  filterDays: { ru: "За", uz: "Davr", pl: "Za" },
  days: {
    ru: (n: number) => `${n} дней`,
    uz: (n: number) => `${n} kun`,
    pl: (n: number) => `${n} dni`,
  },
  show: { ru: "Показать", uz: "Ko‘rsatish", pl: "Pokaż" },
  countDone: { ru: (n: number) => `сделано: ${n}`, uz: (n: number) => `bajarildi: ${n}`, pl: (n: number) => `zrobione: ${n}` },
  countFailed: { ru: (n: number) => `не сделано: ${n}`, uz: (n: number) => `bajarilmadi: ${n}`, pl: (n: number) => `niezrobione: ${n}` },
  countCancelled: { ru: (n: number) => `отменено: ${n}`, uz: (n: number) => `bekor qilingan: ${n}`, pl: (n: number) => `anulowane: ${n}` },
  countMoved: {
    ru: (n: number) => `переносов срока: ${n}`,
    uz: (n: number) => `muddat ko‘chirishlari: ${n}`,
    pl: (n: number) => `przesunięć terminu: ${n}`,
  },
  countEdited: { ru: (n: number) => `изменений: ${n}`, uz: (n: number) => `o‘zgarishlar: ${n}`, pl: (n: number) => `zmian: ${n}` },
  byPerson: { ru: "По людям", uz: "Odamlar bo‘yicha", pl: "Według osób" },
  byPersonHint: {
    ru: "Считается по исполнителю: сколько его задач сделано, не сделано, отменено и сколько раз переносили их срок — он сам или тот, кто поставил.",
    uz: "Ijrochi bo‘yicha hisoblanadi: uning nechta vazifasi bajarildi, bajarilmadi, bekor qilindi va ularning muddati necha marta ko‘chirildi — o‘zi yoki qo‘ygan odam.",
    pl: "Liczone według wykonawcy: ile jego zadań zrobiono, nie zrobiono, anulowano i ile razy przesuwano ich termin — on sam albo zlecający.",
  },
  colPerson: { ru: "Исполнитель", uz: "Ijrochi", pl: "Wykonawca" },
  colDone: { ru: "Сделано", uz: "Bajarildi", pl: "Zrobione" },
  colFailed: { ru: "Не сделано", uz: "Bajarilmadi", pl: "Niezrobione" },
  colCancelled: { ru: "Отменено", uz: "Bekor qilingan", pl: "Anulowane" },
  colMoved: { ru: "Переносов", uz: "Ko‘chirishlar", pl: "Przesunięć" },
  empty: {
    ru: "За этот период с задачами ничего не происходило.",
    uz: "Bu davrda vazifalar bilan hech narsa bo‘lmadi.",
    pl: "W tym okresie nic się nie działo z zadaniami.",
  },
  more: {
    ru: (n: number) => `Показаны последние ${n} задач — сузьте период или выберите человека.`,
    uz: (n: number) => `Oxirgi ${n} ta vazifa ko‘rsatilgan — davrni qisqartiring yoki odamni tanlang.`,
    pl: (n: number) => `Pokazano ostatnie ${n} zadań — zawęź okres albo wybierz osobę.`,
  },
  offline: { ru: "База недоступна — история сейчас не видна.", uz: "Baza ishlamayapti — tarix hozir ko‘rinmaydi.", pl: "Baza niedostępna — historia jest teraz niewidoczna." },
});
