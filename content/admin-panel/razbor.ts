import { defineDict } from "@/lib/admin/i18n";

/**
 * Раздел «Разборы» (/admin/razbor) и правка разбора (/admin/razbor/[id]).
 *
 * Термины — по content/admin-panel/GLOSSARY.md: разбор — «tahlil» /
 * «analiza», находка — «topilma» / «ustalenie», снимок — «skrinshot» /
 * «zrzut».
 *
 * Сами статьи разбора (заголовок, абзацы, находки, цена, запрос) — контент
 * сайта на русском и узбекском, они показываются как есть и не
 * переводятся. Ниша, город, адрес сайта, заметка смены — данные.
 */

/**
 * Ответ действия: `?r=код&d=данные`. Коды — свои (ok, unpublished, deleted,
 * saved, confirm, thin, missing) и RazborFailure из lib/razbor/store.ts.
 */
export const razborResultDict = defineDict({
  ok: {
    ru: () => "Опубликовано. Страница уже открывается на сайте.",
    uz: () => "E’lon qilindi. Sahifa saytda allaqachon ochiladi.",
    pl: () => "Opublikowano. Strona już otwiera się na witrynie.",
  },
  unpublished: { ru: () => "Снят с публикации.", uz: () => "E’londan olindi.", pl: () => "Zdjęto z publikacji." },
  deleted: { ru: () => "Удалён.", uz: () => "O‘chirildi.", pl: () => "Usunięto." },
  saved: { ru: () => "Правка сохранена.", uz: () => "Tahrir saqlandi.", pl: () => "Zmiany zapisane." },
  confirm: {
    ru: (word: string) => `Чтобы удалить, впишите рядом слово «${word}».`,
    uz: (word: string) => `O‘chirish uchun yoniga «${word}» so‘zini yozing.`,
    pl: (word: string) => `Aby usunąć, wpisz obok słowo „${word}”.`,
  },
  thin: {
    ru: (lang: string) => `Версия «${lang}»: нужен заголовок и хотя бы три находки.`,
    uz: (lang: string) => `«${lang}» versiyasi: sarlavha va kamida uchta topilma kerak.`,
    pl: (lang: string) => `Wersja „${lang}”: potrzebny tytuł i co najmniej trzy ustalenia.`,
  },
  missing: {
    ru: () => "Разбора уже нет или он без статьи.",
    uz: () => "Tahlil endi yo‘q yoki unda maqola yo‘q.",
    pl: () => "Analizy już nie ma albo nie ma w niej artykułu.",
  },
  offline: { ru: () => "База недоступна.", uz: () => "Bazaga ulanib bo‘lmadi.", pl: () => "Baza danych jest niedostępna." },
  gone: { ru: () => "Разбора уже нет.", uz: () => "Tahlil endi yo‘q.", pl: () => "Tej analizy już nie ma." },
  half: {
    ru: () => "Нет статьи на одном из языков — публиковать половину нельзя.",
    uz: () => "Tillardan birida maqola yo‘q — yarmini e’lon qilib bo‘lmaydi.",
    pl: () => "Brak artykułu w jednym z języków — nie można publikować połowy.",
  },
  failed: {
    ru: (error: string) => (error ? `Не записалось: ${error}` : "Не записалось."),
    uz: (error: string) => (error ? `Saqlab bo‘lmadi: ${error}` : "Saqlab bo‘lmadi."),
    pl: (error: string) => (error ? `Nie zapisano: ${error}` : "Nie zapisano."),
  },
});

export const razborDict = defineDict({
  title: { ru: "Разборы", uz: "Tahlillar", pl: "Analizy" },
  intro: {
    ru: "Ночная смена разбирает сайты из касаний, до которых не дошли руки, и кладёт статьи сюда. Опубликованное уходит в раздел на сайте и в карту сайта сразу, без выкатки. Компания в тексте не называется — ни именем, ни адресом.",
    uz: "Tungi smena aloqalardan qo‘l yetmagan saytlarni tahlil qiladi va maqolalarni shu yerga qo‘yadi. E’lon qilingani darhol saytdagi bo‘limga va sayt xaritasiga tushadi, deploysiz. Matnda kompaniya nomi ham, manzili ham aytilmaydi.",
    pl: "Nocna zmiana analizuje strony z kontaktów, do których nie dotarliśmy, i odkłada tu artykuły. Opublikowane od razu trafia do działu na stronie i do mapy strony, bez wdrożenia. Firma nie jest w tekście nazwana — ani nazwą, ani adresem.",
  },
  onReview: {
    ru: (n: number) => `На проверке · ${n}`,
    uz: (n: number) => `Tekshiruvda · ${n}`,
    pl: (n: number) => `Do sprawdzenia · ${n}`,
  },
  reviewEmpty: {
    ru: "Пусто. Смена ещё не приносила разборов — или все уже разобраны.",
    uz: "Bo‘sh. Smena hali tahlil keltirmagan — yoki hammasi ko‘rib chiqilgan.",
    pl: "Pusto. Zmiana nie przyniosła jeszcze analiz — albo wszystkie są już przejrzane.",
  },
  tenderNote: {
    ru: "тендерный разбор недели: типовое ТЗ, а не чей-то сайт — снимков у него нет",
    uz: "haftaning tender tahlili: birovning sayti emas, tipik texnik topshiriq — skrinshotlari yo‘q",
    pl: "przetargowa analiza tygodnia: typowa specyfikacja, a nie czyjaś strona — nie ma zrzutów",
  },
  sourceNote: {
    ru: (url: string) => `${url} · только для проверки, на сайте адреса нет`,
    uz: (url: string) => `${url} · faqat tekshirish uchun, saytda manzil yo‘q`,
    pl: (url: string) => `${url} · tylko do sprawdzenia, na stronie adresu nie ma`,
  },
  noArticle: {
    ru: (lang: string) => `Нет статьи на «${lang}» — публиковать половину нельзя.`,
    uz: (lang: string) => `«${lang}» tilida maqola yo‘q — yarmini e’lon qilib bo‘lmaydi.`,
    pl: (lang: string) => `Brak artykułu w języku „${lang}” — nie można publikować połowy.`,
  },
  inRu: { ru: "по-русски", uz: "ruscha", pl: "po rosyjsku" },
  inUz: { ru: "по-узбекски", uz: "o‘zbekcha", pl: "po uzbecku" },
  sideRu: { ru: "По-русски", uz: "Ruscha", pl: "Po rosyjsku" },
  sideUz: { ru: "По-узбекски", uz: "O‘zbekcha", pl: "Po uzbecku" },
  query: { ru: "запрос:", uz: "so‘rov:", pl: "zapytanie:" },
  whatWeDo: {
    ru: (fix: string) => `Что делаем: ${fix}`,
    uz: (fix: string) => `Nima qilamiz: ${fix}`,
    pl: (fix: string) => `Co robimy: ${fix}`,
  },
  shiftSays: {
    ru: (note: string) => `Смена пишет: ${note}`,
    uz: (note: string) => `Smena yozadi: ${note}`,
    pl: (note: string) => `Zmiana pisze: ${note}`,
  },
  publish: { ru: "Опубликовать", uz: "E’lon qilish", pl: "Opublikuj" },
  edit: { ru: "Править", uz: "Tahrirlash", pl: "Edytuj" },
  rejectPh: { ru: "почему не публикуем", uz: "nega e’lon qilmaymiz", pl: "dlaczego nie publikujemy" },
  reject: { ru: "Не публикуем", uz: "E’lon qilmaymiz", pl: "Nie publikujemy" },
  published: {
    ru: (n: number) => `Опубликованы · ${n}`,
    uz: (n: number) => `E’lon qilingan · ${n}`,
    pl: (n: number) => `Opublikowane · ${n}`,
  },
  publishedEmpty: {
    ru: "На сайте пока ни одного разбора.",
    uz: "Saytda hozircha birorta ham tahlil yo‘q.",
    pl: "Na stronie nie ma jeszcze żadnej analizy.",
  },
  publishedOn: {
    ru: (day: string) => `вышел ${day}`,
    uz: (day: string) => `${day} da chiqqan`,
    pl: (day: string) => `opublikowano ${day}`,
  },
  noDate: {
    ru: "дата публикации не записана",
    uz: "e’lon qilingan sana yozilmagan",
    pl: "data publikacji nie jest zapisana",
  },
  unpublish: { ru: "Снять с публикации", uz: "E’londan olish", pl: "Zdejmij z publikacji" },
  rejected: {
    ru: (n: number) => `Не публикуем · ${n}`,
    uz: (n: number) => `E’lon qilmaymiz · ${n}`,
    pl: (n: number) => `Nie publikujemy · ${n}`,
  },
  rejectedAbout: {
    ru: "Строки остаются здесь нарочно: пока сайт числится разобранным, ночная смена к нему не вернётся. Удалить — значит вернуть его в очередь.",
    uz: "Qatorlar bu yerda ataylab qoladi: sayt tahlil qilingan deb hisoblanar ekan, tungi smena unga qaytmaydi. O‘chirish — uni navbatga qaytarish degani.",
    pl: "Wiersze zostają tu celowo: dopóki strona jest oznaczona jako przeanalizowana, nocna zmiana do niej nie wróci. Usunąć — znaczy wrócić ją do kolejki.",
  },
  noTitle: { ru: "без заголовка", uz: "sarlavhasiz", pl: "bez tytułu" },
  tenders: { ru: "тендеры и госконтракты", uz: "tenderlar va davlat shartnomalari", pl: "przetargi i zamówienia publiczne" },
  loses: {
    ru: (from: number, to: number) => `теряет ${from}–${to} из 100`,
    uz: (from: number, to: number) => `100 tadan ${from}–${to} tasini yo‘qotadi`,
    pl: (from: number, to: number) => `traci ${from}–${to} na 100`,
  },
  /** Слово, которое вписывают рядом с «Удалить». Действие принимает слово на любом из трёх языков. */
  deleteWord: { ru: "удалить", uz: "o‘chirish", pl: "usuń" },
  delete: { ru: "Удалить", uz: "O‘chirish", pl: "Usuń" },

  /* Снимки — components/admin/razbor-shots.tsx. */
  shotsOk: {
    ru: (findings: number) => `снимки: есть${findings ? `, по находкам ${findings}` : ""}`,
    uz: (findings: number) => `skrinshotlar: bor${findings ? `, topilmalar bo‘yicha ${findings}` : ""}`,
    pl: (findings: number) => `zrzuty: są${findings ? `, do ustaleń ${findings}` : ""}`,
  },
  shotBefore: { ru: "«как есть»", uz: "«hozirgi holat»", pl: "„jak jest”" },
  shotAfter: { ru: "макета", uz: "maket", pl: "makiety" },
  shotAnd: { ru: " и ", uz: " va ", pl: " i " },
  noShot: {
    ru: (what: string) => `нет снимка ${what}`,
    uz: (what: string) => `${what} skrinshoti yo‘q`,
    pl: (what: string) => `brak zrzutu ${what}`,
  },

  /* Правка — /admin/razbor/[id]. */
  back: { ru: "← к разборам", uz: "← tahlillarga", pl: "← do analiz" },
  statusPublished: { ru: "опубликован", uz: "e’lon qilingan", pl: "opublikowana" },
  statusReview: { ru: "на проверке", uz: "tekshiruvda", pl: "do sprawdzenia" },
  onlyText: {
    ru: "Меняется только текст. Адрес страницы, запрос и цена собираются кодом: адрес опубликованного разбора уже стоит в поиске, и переименовать его тихо — значит потерять позицию и оставить битую ссылку.",
    uz: "Faqat matn o‘zgaradi. Sahifa manzili, so‘rov va narx kod orqali yig‘iladi: e’lon qilingan tahlil manzili allaqachon qidiruvda turibdi va uni jimgina o‘zgartirish — o‘rinni yo‘qotish va buzilgan havola qoldirish degani.",
    pl: "Zmienia się tylko tekst. Adres strony, zapytanie i cenę składa kod: adres opublikowanej analizy jest już w wyszukiwarce, a cicha zmiana nazwy to utrata pozycji i martwy link.",
  },
  save: { ru: "Сохранить", uz: "Saqlash", pl: "Zapisz" },
  savePublished: {
    ru: "Страница на сайте обновится сразу после сохранения.",
    uz: "Saytdagi sahifa saqlangandan so‘ng darhol yangilanadi.",
    pl: "Strona na witrynie zaktualizuje się od razu po zapisaniu.",
  },
  saveReview: {
    ru: "Разбор останется на проверке — опубликовать можно будет со списка.",
    uz: "Tahlil tekshiruvda qoladi — uni ro‘yxatdan e’lon qilish mumkin bo‘ladi.",
    pl: "Analiza pozostanie do sprawdzenia — opublikować ją można z listy.",
  },
  pageTitle: { ru: "Заголовок страницы", uz: "Sahifa sarlavhasi", pl: "Tytuł strony" },
  description: { ru: "Описание для выдачи", uz: "Qidiruv natijalari uchun tavsif", pl: "Opis do wyników wyszukiwania" },
  introLabel: {
    ru: "Преамбула — абзацы через пустую строку",
    uz: "Kirish — xatboshilar bo‘sh qator bilan ajratiladi",
    pl: "Wstęp — akapity oddzielone pustą linią",
  },
  findingsNote: {
    ru: "Находки. Пустой заголовок — находка удаляется; в пустых полях внизу добавляется новая.",
    uz: "Topilmalar. Sarlavha bo‘sh bo‘lsa — topilma o‘chiriladi; pastdagi bo‘sh maydonlarda yangisi qo‘shiladi.",
    pl: "Ustalenia. Pusty tytuł — ustalenie jest usuwane; w pustych polach na dole dodaje się nowe.",
  },
  findingTitlePh: { ru: "Что видит посетитель", uz: "Tashrif buyuruvchi nimani ko‘radi", pl: "Co widzi odwiedzający" },
  findingImpactPh: { ru: "Чем оборачивается", uz: "Bu nimaga olib keladi", pl: "Czym to się kończy" },
  findingFixPh: { ru: "Что делаем", uz: "Nima qilamiz", pl: "Co robimy" },
  shot: { ru: "снимок:", uz: "skrinshot:", pl: "zrzut:" },
  withoutShot: { ru: "без снимка", uz: "skrinshotsiz", pl: "bez zrzutu" },
  unshootable: { ru: "такой снимок не снимается", uz: "bunday skrinshot olinmaydi", pl: "takiego zrzutu się nie robi" },
  outcomeLabel: {
    ru: "Что это даёт — абзацы через пустую строку",
    uz: "Bu nima beradi — xatboshilar bo‘sh qator bilan ajratiladi",
    pl: "Co to daje — akapity oddzielone pustą linią",
  },
  price: {
    ru: (price: string) => `Цена: ${price} — из прайса, руками не меняется.`,
    uz: (price: string) => `Narx: ${price} — prays-varaqdan, qo‘lda o‘zgartirilmaydi.`,
    pl: (price: string) => `Cena: ${price} — z cennika, nie zmienia się ręcznie.`,
  },
});

/** Слово подтверждения удаления: как ни набери апостроф в «o‘chirish», оно засчитается. */
export function isDeleteWord(value: string): boolean {
  const norm = (text: string) => text.trim().toLowerCase().replace(/[‘’'`ʻʼ]/g, "‘");
  return Object.values(razborDict.deleteWord).some((word) => norm(word) === norm(value));
}
