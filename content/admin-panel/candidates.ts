import { defineDict } from "@/lib/admin/i18n";

/**
 * Раздел «Кандидаты» (/admin/candidates): разбор резюме перед
 * собеседованием.
 *
 * Сам разбор (заголовок, сильные стороны, стопы, вопросы) пишет модель —
 * это данные, они не переводятся. Здесь — подписи блоков, форма и причины
 * отказа.
 */
export const candidatesDict = defineDict({
  title: { ru: "Анализ кандидатов", uz: "Nomzodlar tahlili", pl: "Analiza kandydatów" },
  intro: {
    ru: "Загрузите резюме в PDF и напишите, на какую работу смотрим. Разбор покажет вердикт, сильные стороны, стопы, вопросы на собеседование и способ проверить человека делом.",
    uz: "Rezyumeni PDF formatida yuklang va qaysi ishga qarayotganimizni yozing. Tahlil xulosa, kuchli tomonlar, to‘siqlar, suhbat uchun savollar va odamni ishda tekshirish usulini ko‘rsatadi.",
    pl: "Wgraj CV w PDF i napisz, na jakie stanowisko patrzymy. Analiza pokaże werdykt, mocne strony, przeszkody, pytania na rozmowę i sposób sprawdzenia kandydata w praktyce.",
  },
  roleLabel: { ru: "На какую работу смотрим", uz: "Qaysi ishga qarayapmiz", pl: "Na jakie stanowisko patrzymy" },
  roleDefault: {
    ru: "менеджер по продажам IT-услуг: холодные касания и обработка заявок с рекламы",
    uz: "IT xizmatlari bo‘yicha savdo menejeri: sovuq aloqalar va reklamadan kelgan arizalarga ishlov berish",
    pl: "menedżer sprzedaży usług IT: zimne kontakty i obsługa zgłoszeń z reklamy",
  },
  resumeLabel: { ru: "Резюме в PDF", uz: "PDF formatidagi rezyume", pl: "CV w PDF" },
  reading: {
    ru: "Читаем резюме — это до минуты…",
    uz: "Rezyumeni o‘qiyapmiz — bir daqiqagacha…",
    pl: "Czytamy CV — to potrwa do minuty…",
  },
  review: { ru: "Разобрать", uz: "Tahlil qilish", pl: "Analizuj" },
  sizeNote: {
    ru: (mb: number) => `До ${mb} МБ. Нужен PDF, из которого копируется текст: скан страниц не прочитается.`,
    uz: (mb: number) => `${mb} MB gacha. Matni nusxalanadigan PDF kerak: sahifalar skani o‘qilmaydi.`,
    pl: (mb: number) => `Do ${mb} MB. Potrzebny PDF, z którego da się skopiować tekst: skan stron nie zostanie odczytany.`,
  },
  privacy: {
    ru: "Файл нигде не сохраняется — остаётся только разбор. Возраст, пол, семейное положение и национальность в оценке не участвуют: они ничего не говорят о работе, а решение, принятое по ним, — это не оценка, а предрассудок. Разбор опирается только на опыт и на то, что написано в резюме; последнее слово всё равно за вами.",
    uz: "Fayl hech qayerda saqlanmaydi — faqat tahlil qoladi. Yosh, jins, oilaviy holat va millat baholashda ishtirok etmaydi: ular ish haqida hech narsa demaydi, ularga qarab qabul qilingan qaror esa baho emas, xurofot. Tahlil faqat tajribaga va rezyumeda yozilganlarga tayanadi; oxirgi so‘z baribir sizniki.",
    pl: "Plik nigdzie nie jest zapisywany — zostaje tylko analiza. Wiek, płeć, stan cywilny i narodowość nie biorą udziału w ocenie: nic nie mówią o pracy, a decyzja podjęta na ich podstawie to nie ocena, tylko uprzedzenie. Analiza opiera się wyłącznie na doświadczeniu i na tym, co napisano w CV; ostatnie słowo i tak należy do Ciebie.",
  },
  empty: { ru: "Разобранных резюме пока нет.", uz: "Tahlil qilingan rezyumelar hozircha yo‘q.", pl: "Nie ma jeszcze przeanalizowanych CV." },

  // Карточка разбора
  wants: { ru: "Сам претендует на:", uz: "O‘zi da’vo qilayotgan lavozim:", pl: "Sam aplikuje na:" },
  strengths: { ru: "Сильные стороны", uz: "Kuchli tomonlar", pl: "Mocne strony" },
  stops: { ru: "Стопы", uz: "To‘siqlar", pl: "Przeszkody" },
  facts: { ru: "Что в резюме сказано прямо", uz: "Rezyumeda to‘g‘ridan-to‘g‘ri nima yozilgan", pl: "Co CV mówi wprost" },
  questions: { ru: "Спросить на собеседовании", uz: "Suhbatda so‘rash", pl: "Zapytaj na rozmowie" },
  trial: { ru: "Как проверить делом", uz: "Ishda qanday tekshirish", pl: "Jak sprawdzić w praktyce" },
  removing: { ru: "Убираем…", uz: "Olib tashlanmoqda…", pl: "Usuwanie…" },
  remove: { ru: "Убрать разбор", uz: "Tahlilni olib tashlash", pl: "Usuń analizę" },
});

/** Вердикт разбора. Ключ — `Verdict` из lib/hiring/resume.ts. */
export const verdictDict = defineDict({
  yes: { ru: "брать", uz: "olish", pl: "zatrudnić" },
  conditional: { ru: "брать с условием", uz: "shart bilan olish", pl: "zatrudnić warunkowo" },
  no: { ru: "не брать", uz: "olmaslik", pl: "nie zatrudniać" },
});

/**
 * Почему разбор не получился. Ключ — код из lib/hiring/store.ts или из
 * действия, он же параметр `e`; пояснение (`d`) — ответ модели или файла —
 * показывается как есть.
 */
export const candidateErrorDict = defineDict({
  no_file: { ru: "Выберите файл резюме.", uz: "Rezyume faylini tanlang.", pl: "Wybierz plik z CV." },
  no_role: {
    ru: "Напишите, на какую вакансию смотрим.",
    uz: "Qaysi vakansiyaga qarayotganimizni yozing.",
    pl: "Napisz, na jakie stanowisko patrzymy.",
  },
  no_db: { ru: "База недоступна.", uz: "Baza ishlamayapti.", pl: "Baza danych jest niedostępna." },
  no_key: { ru: "Нет ключа модели — разбирать некому.", uz: "Model kaliti yo‘q — tahlil qiladigan hech kim yo‘q.", pl: "Brak klucza modelu — nie ma kto analizować." },
  unreadable: { ru: "Файл не прочитался.", uz: "Fayl o‘qilmadi.", pl: "Nie udało się odczytać pliku." },
  too_thin: {
    ru: "В файле почти нет текста — похоже, это скан или картинки. Нужен PDF, из которого текст копируется.",
    uz: "Faylda deyarli matn yo‘q — skan yoki rasmlarga o‘xshaydi. Matni nusxalanadigan PDF kerak.",
    pl: "W pliku prawie nie ma tekstu — wygląda na skan albo obrazki. Potrzebny PDF, z którego da się skopiować tekst.",
  },
  model_failed: { ru: "Модель не ответила.", uz: "Model javob bermadi.", pl: "Model nie odpowiedział." },
  empty_report: {
    ru: "Модель вернула разбор, который нечего показать.",
    uz: "Model ko‘rsatadigan hech narsasi yo‘q tahlil qaytardi.",
    pl: "Model zwrócił analizę, w której nie ma czego pokazać.",
  },
  /** `grounds` — что нашлось в разборе, словами модели. */
  forbidden: {
    ru: (grounds: string) =>
      `Разбор опёрся на то, что к работе не относится (${grounds}). Он не сохранён — попробуйте ещё раз.`,
    uz: (grounds: string) =>
      `Tahlil ishga aloqasi yo‘q narsaga tayandi (${grounds}). U saqlanmadi — yana bir bor urinib ko‘ring.`,
    pl: (grounds: string) =>
      `Analiza oparła się na czymś, co nie dotyczy pracy (${grounds}). Nie została zapisana — spróbuj jeszcze raz.`,
  },
  not_saved: { ru: "Разбор не сохранился.", uz: "Tahlil saqlanmadi.", pl: "Nie udało się zapisać analizy." },
  unknown: { ru: "Не получилось.", uz: "Bo‘lmadi.", pl: "Nie udało się." },
});
