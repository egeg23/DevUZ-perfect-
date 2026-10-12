import { defineDict } from "@/lib/admin/i18n";

/**
 * Раздел «Обучение» (app/admin/learn): подписи страницы, теста и
 * материалов. Текст курсов — не здесь, а в content/learn/: он длинный, и
 * у него своя проверка трёх языков (tests/learn.test.ts).
 */
export const learnDict = defineDict({
  title: { ru: "Обучение", uz: "Ta’lim", pl: "Szkolenia" },
  intro: {
    ru: "Курсы по продажам — про то, как мы на самом деле пишем компаниям: «Здравствуйте», кружок, «+», возражения, заходы писем и тёплые лиды. В конце каждого курса — короткий тест. Тест по панели проверяет, как вы знаете разделы, которые вам открыты.",
    uz: "Sotuv kurslari — kompaniyalarga aslida qanday yozishimiz haqida: salom, dumaloq video, «+», e’tirozlar, xat yondashuvlari va iliq lidlar. Har bir kurs oxirida — qisqa test. Panel bo‘yicha test sizga ochiq bo‘limlarni qanchalik bilishingizni tekshiradi.",
    pl: "Kursy sprzedaży — o tym, jak naprawdę piszemy do firm: powitanie, kółko, «+», obiekcje, podejścia w wiadomościach i ciepłe leady. Na końcu każdego kursu jest krótki test. Test z panelu sprawdza, jak znasz działy, które masz otwarte.",
  },
  offBanner: {
    ru: "Обучение выключено: раздел видите только вы. Команда не видит его ни в меню, ни в боте, а обязательность и проходной балл пока ни на кого не действуют.",
    uz: "Ta’lim o‘chirilgan: bo‘limni faqat siz ko‘rasiz. Jamoa uni na menyuda, na botda ko‘radi, majburiylik va o‘tish bali hozircha hech kimga ta’sir qilmaydi.",
    pl: "Szkolenia są wyłączone: dział widzisz tylko ty. Zespół nie widzi go ani w menu, ani w bocie, a obowiązek i próg zaliczenia na razie nikogo nie dotyczą.",
  },
  onBanner: {
    ru: "Обучение включено для команды: раздел есть в меню у всех, тесты можно пройти и в боте.",
    uz: "Ta’lim jamoa uchun yoqilgan: bo‘lim hammaning menyusida bor, testlarni botda ham topshirish mumkin.",
    pl: "Szkolenia są włączone dla zespołu: dział jest w menu u wszystkich, testy można zdać także w bocie.",
  },
  switchOn: { ru: "Включить обучение для команды", uz: "Jamoa uchun ta’limni yoqish", pl: "Włącz szkolenia dla zespołu" },
  switchOff: { ru: "Выключить обучение", uz: "Ta’limni o‘chirish", pl: "Wyłącz szkolenia" },
  switchFailed: {
    ru: "Не получилось переключить — база не ответила. Попробуйте ещё раз.",
    uz: "O‘zgartirib bo‘lmadi — baza javob bermadi. Yana urinib ko‘ring.",
    pl: "Nie udało się przełączyć — baza nie odpowiedziała. Spróbuj ponownie.",
  },
  coursesTitle: { ru: "Курсы по продажам", uz: "Sotuv kurslari", pl: "Kursy sprzedaży" },
  panelTitle: { ru: "Тест по панели", uz: "Panel bo‘yicha test", pl: "Test z panelu" },
  openCourse: { ru: "Открыть курс", uz: "Kursni ochish", pl: "Otwórz kurs" },
  openPanelQuiz: { ru: "Пройти тест", uz: "Testni topshirish", pl: "Rozwiąż test" },
  lessons: {
    ru: (n: number) => `уроков: ${n}`,
    uz: (n: number) => `darslar: ${n}`,
    pl: (n: number) => `lekcji: ${n}`,
  },
  questions: {
    ru: (n: number) => `вопросов: ${n}`,
    uz: (n: number) => `savollar: ${n}`,
    pl: (n: number) => `pytań: ${n}`,
  },
  passed: {
    ru: (score: number, total: number) => `сдан: ${score} из ${total}`,
    uz: (score: number, total: number) => `topshirildi: ${total} tadan ${score}`,
    pl: (score: number, total: number) => `zaliczony: ${score} z ${total}`,
  },
  notPassed: {
    ru: (score: number, total: number) => `не сдан: лучший результат ${score} из ${total}`,
    uz: (score: number, total: number) => `topshirilmadi: eng yaxshi natija ${total} tadan ${score}`,
    pl: (score: number, total: number) => `niezaliczony: najlepszy wynik ${score} z ${total}`,
  },
  notTried: { ru: "ещё не пройден", uz: "hali topshirilmagan", pl: "jeszcze nierozwiązany" },
  passRule: {
    ru: (p: number) => `Сдано — от ${p}% верных ответов. Пересдавать можно сколько угодно, засчитывается лучший результат.`,
    uz: (p: number) => `Topshirildi — kamida ${p}% to‘g‘ri javob. Qayta topshirish cheklanmagan, eng yaxshi natija hisoblanadi.`,
    pl: (p: number) => `Zaliczone — od ${p}% poprawnych odpowiedzi. Można podchodzić dowolnie wiele razy, liczy się najlepszy wynik.`,
  },
  requiredTitle: { ru: "Осталось пройти", uz: "Topshirish qoldi", pl: "Zostało do zaliczenia" },
  requiredHint: {
    ru: (p: number) => `Обучение обязательно для менеджеров: каждый курс и тест по панели, от ${p}% верных ответов. Работу это не закрывает — карточки, порция и лиды приходят как обычно.`,
    uz: (p: number) => `Ta’lim menejerlar uchun majburiy: har bir kurs va panel bo‘yicha test, kamida ${p}% to‘g‘ri javob. Bu ishni yopmaydi — kartochkalar, to‘plam va lidlar odatdagidek keladi.`,
    pl: (p: number) => `Szkolenia są obowiązkowe dla menedżerów: każdy kurs i test z panelu, od ${p}% poprawnych odpowiedzi. Nie blokuje to pracy — karty, porcja i leady przychodzą jak zwykle.`,
  },
  requiredDone: { ru: "Всё обязательное сдано.", uz: "Barcha majburiy testlar topshirildi.", pl: "Wszystko obowiązkowe zaliczone." },
  botHint: {
    ru: "Те же тесты можно пройти в Telegram-боте студии: команда /learn.",
    uz: "Xuddi shu testlarni studiyaning Telegram botida ham topshirish mumkin: /learn buyrug‘i.",
    pl: "Te same testy można zdać w bocie studia w Telegramie: komenda /learn.",
  },
  teamTitle: { ru: "Результаты команды", uz: "Jamoa natijalari", pl: "Wyniki zespołu" },
  teamHint: {
    ru: "Лучший результат каждого по каждому курсу. «новый» — заведён после запуска раздела. Курсы обязательны менеджерам; руководитель и владелец проходят по желанию.",
    uz: "Har kimning har bir kurs bo‘yicha eng yaxshi natijasi. «yangi» — bo‘lim ishga tushgandan keyin qo‘shilgan. Kurslar menejerlar uchun majburiy; rahbar va egasi xohishga ko‘ra topshiradi.",
    pl: "Najlepszy wynik każdej osoby z każdego kursu. «nowy» — dodany po uruchomieniu działu. Kursy są obowiązkowe dla menedżerów; kierownik i właściciel zdają je według uznania.",
  },
  colPerson: { ru: "Сотрудник", uz: "Xodim", pl: "Pracownik" },
  colLeft: { ru: "Не сдано", uz: "Topshirilmagan", pl: "Niezaliczone" },
  newBadge: { ru: "новый", uz: "yangi", pl: "nowy" },
  allPassed: { ru: "всё сдано", uz: "hammasi topshirilgan", pl: "wszystko zaliczone" },
  optional: { ru: "по желанию", uz: "xohishga ko‘ra", pl: "dobrowolnie" },
  teamEmpty: { ru: "Пока никто ничего не проходил.", uz: "Hozircha hech kim hech narsa topshirmagan.", pl: "Na razie nikt niczego nie zdawał." },
  /* Страница курса */
  back: { ru: "← Все курсы", uz: "← Barcha kurslar", pl: "← Wszystkie kursy" },
  lessonsTitle: { ru: "Уроки", uz: "Darslar", pl: "Lekcje" },
  armLabel: {
    ru: "Настоящий текст захода в автопрогоне — так его видит менеджер в «Текстах писем и A/B»:",
    uz: "Avtoaloqadagi yondashuvning haqiqiy matni — menejer uni xat matnlari bo‘limida shunday ko‘radi:",
    pl: "Prawdziwy tekst podejścia w autoprzebiegu — tak widzi go menedżer w tekstach wiadomości:",
  },
  materialsTitle: { ru: "Материалы", uz: "Materiallar", pl: "Materiały" },
  materialsEmpty: { ru: "Материалов к курсу пока нет.", uz: "Kursga hozircha material yo‘q.", pl: "Do kursu nie ma jeszcze materiałów." },
  materialName: { ru: "Название", uz: "Nomi", pl: "Nazwa" },
  materialLink: { ru: "Ссылка", uz: "Havola", pl: "Link" },
  materialAdd: { ru: "Добавить материал", uz: "Material qo‘shish", pl: "Dodaj materiał" },
  materialRemove: { ru: "Убрать материал", uz: "Materialni olib tashlash", pl: "Usuń materiał" },
  materialBad: {
    ru: "Нужны название и ссылка, которая начинается с https://",
    uz: "Nom va https:// bilan boshlanadigan havola kerak",
    pl: "Potrzebna jest nazwa i link zaczynający się od https://",
  },
  quizTitle: { ru: "Тест", uz: "Test", pl: "Test" },
  /* Тест */
  start: { ru: "Начать тест", uz: "Testni boshlash", pl: "Rozpocznij test" },
  questionOf: {
    ru: (i: number, n: number) => `Вопрос ${i} из ${n}`,
    uz: (i: number, n: number) => `${n} tadan ${i}-savol`,
    pl: (i: number, n: number) => `Pytanie ${i} z ${n}`,
  },
  right: { ru: "Верно", uz: "To‘g‘ri", pl: "Dobrze" },
  wrong: { ru: "Неверно", uz: "Noto‘g‘ri", pl: "Źle" },
  correctIs: { ru: "Верный ответ:", uz: "To‘g‘ri javob:", pl: "Poprawna odpowiedź:" },
  readLesson: { ru: "Перечитать урок", uz: "Darsni qayta o‘qish", pl: "Przeczytaj lekcję jeszcze raz" },
  readHelp: { ru: "Открыть пункт инструкции", uz: "Yo‘riqnoma bandini ochish", pl: "Otwórz punkt instrukcji" },
  next: { ru: "Следующий вопрос", uz: "Keyingi savol", pl: "Następne pytanie" },
  finish: { ru: "Завершить тест", uz: "Testni yakunlash", pl: "Zakończ test" },
  result: {
    ru: (score: number, total: number) => `Результат: ${score} из ${total}`,
    uz: (score: number, total: number) => `Natija: ${total} tadan ${score}`,
    pl: (score: number, total: number) => `Wynik: ${score} z ${total}`,
  },
  passedMsg: { ru: "Тест сдан.", uz: "Test topshirildi.", pl: "Test zaliczony." },
  failedMsg: {
    ru: (p: number) => `Тест не сдан: нужно от ${p}% верных ответов. Перечитайте уроки и пройдите ещё раз.`,
    uz: (p: number) => `Test topshirilmadi: kamida ${p}% to‘g‘ri javob kerak. Darslarni qayta o‘qing va yana topshiring.`,
    pl: (p: number) => `Test niezaliczony: potrzeba od ${p}% poprawnych odpowiedzi. Przeczytaj lekcje i spróbuj ponownie.`,
  },
  again: { ru: "Пройти ещё раз", uz: "Yana topshirish", pl: "Spróbuj ponownie" },
  saving: { ru: "Сохраняю результат…", uz: "Natija saqlanmoqda…", pl: "Zapisuję wynik…" },
  saveFailed: {
    ru: "Результат не сохранился — проверьте связь и пройдите тест ещё раз.",
    uz: "Natija saqlanmadi — aloqani tekshiring va testni yana topshiring.",
    pl: "Wynik się nie zapisał — sprawdź połączenie i rozwiąż test jeszcze raz.",
  },
  noQuestions: {
    ru: "Для вас здесь пока нет вопросов: вам не открыт ни один раздел из теста.",
    uz: "Siz uchun hozircha savol yo‘q: testdagi bo‘limlarning birortasi sizga ochiq emas.",
    pl: "Na razie nie ma tu pytań dla ciebie: nie masz otwartego żadnego działu z testu.",
  },
});
