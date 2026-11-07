import { defineDict } from "@/lib/admin/i18n";

/**
 * «Статьи на площадках» (/admin/outside): черновики для vc.ru, Дзена и
 * Tenchat. Тексты самих статей — русские данные и не переводятся.
 */
export const outsideDict = defineDict({
  title: { ru: "Статьи на площадках", uz: "Platformalardagi maqolalar", pl: "Artykuły na platformach" },
  lead: {
    ru: "Раз в неделю здесь появляется по черновику для vc.ru, Дзена и Tenchat. Публиковать программой эти площадки не дают, поэтому публикует человек: «Скопировать», вставить в редактор площадки, опубликовать и вставить сюда ссылку на статью.",
    uz: "Har hafta bu yerda vc.ru, Dzen va Tenchat uchun bittadan qoralama paydo bo‘ladi. Bu platformalar dastur orqali e’lon qilishga ruxsat bermaydi, shuning uchun odam e’lon qiladi: «Nusxa olish», platforma muharririga qo‘yish, e’lon qilish va maqola havolasini shu yerga qo‘yish.",
    pl: "Raz w tygodniu pojawia się tu po jednym szkicu dla vc.ru, Dzen i Tenchat. Te platformy nie pozwalają publikować programem, więc publikuje człowiek: „Kopiuj”, wkleić do edytora platformy, opublikować i wkleić tu link do artykułu.",
  },
  off: {
    ru: "Раздел ещё не включён: в базе нет таблицы статей. Скажите владельцу.",
    uz: "Bo‘lim hali yoqilmagan: bazada maqolalar jadvali yo‘q. Egasiga ayting.",
    pl: "Dział nie jest jeszcze włączony: w bazie nie ma tabeli artykułów. Powiedz właścicielowi.",
  },
  publisherTitle: { ru: "Кто публикует", uz: "Kim e’lon qiladi", pl: "Kto publikuje" },
  publisherHint: {
    ru: "Ему бот присылает карточку, когда черновики готовы. Не выбран — владельцу и руководителю. В списке — те, кому открыт этот раздел.",
    uz: "Qoralamalar tayyor bo‘lganda bot unga kartochka yuboradi. Tanlanmagan bo‘lsa — egasi va rahbarga. Ro‘yxatda — shu bo‘lim ochiq bo‘lganlar.",
    pl: "To jemu bot wysyła kartę, gdy szkice są gotowe. Nikt nie wybrany — właścicielowi i kierownikowi. Na liście są ci, którzy mają dostęp do tego działu.",
  },
  publisherNone: { ru: "Владелец и руководитель", uz: "Egasi va rahbar", pl: "Właściciel i kierownik" },
  save: { ru: "Сохранить", uz: "Saqlash", pl: "Zapisz" },
  readyTitle: { ru: "Ждут публикации", uz: "E’lon qilinishini kutmoqda", pl: "Czekają na publikację" },
  readyEmpty: {
    ru: "Черновиков нет. Новые появляются раз в неделю, днём по Ташкенту: площадке — когда опубликован или пропущен прошлый.",
    uz: "Qoralamalar yo‘q. Yangilari haftada bir marta, Toshkent vaqti bilan kunduzi chiqadi: platformaga — avvalgisi e’lon qilinganda yoki o‘tkazib yuborilganda.",
    pl: "Brak szkiców. Nowe pojawiają się raz w tygodniu, w dzień czasu Taszkentu: platforma dostaje nowy, gdy poprzedni jest opublikowany albo pominięty.",
  },
  query: {
    ru: (q: string) => `Запрос: «${q}»`,
    uz: (q: string) => `So‘rov: «${q}»`,
    pl: (q: string) => `Zapytanie: «${q}»`,
  },
  made: {
    ru: (date: string) => `Готов ${date}`,
    uz: (date: string) => `Tayyor: ${date}`,
    pl: (date: string) => `Gotowy ${date}`,
  },
  openPlatform: {
    ru: (name: string) => `Открыть ${name}`,
    uz: (name: string) => `${name}ni ochish`,
    pl: (name: string) => `Otwórz ${name}`,
  },
  copy: { ru: "Скопировать", uz: "Nusxa olish", pl: "Kopiuj" },
  copyPlain: { ru: "Скопировать без оформления", uz: "Bezaksiz nusxa olish", pl: "Kopiuj bez formatowania" },
  copyTitle: { ru: "Скопировать заголовок", uz: "Sarlavhadan nusxa olish", pl: "Kopiuj tytuł" },
  copied: { ru: "Скопировано", uz: "Nusxa olindi", pl: "Skopiowano" },
  showText: { ru: "Показать текст", uz: "Matnni ko‘rsatish", pl: "Pokaż tekst" },
  urlLabel: { ru: "Ссылка на опубликованную статью", uz: "E’lon qilingan maqola havolasi", pl: "Link do opublikowanego artykułu" },
  publish: { ru: "Опубликовал", uz: "E’lon qildim", pl: "Opublikowałem" },
  skip: { ru: "Пропустить", uz: "O‘tkazib yuborish", pl: "Pomiń" },
  publishedTitle: { ru: "Опубликованные", uz: "E’lon qilinganlar", pl: "Opublikowane" },
  publishedEmpty: { ru: "Пока ничего не опубликовано.", uz: "Hozircha hech narsa e’lon qilinmagan.", pl: "Na razie nic nie opublikowano." },
  publishedBy: {
    ru: (who: string, date: string) => `${who}, ${date}`,
    uz: (who: string, date: string) => `${who}, ${date}`,
    pl: (who: string, date: string) => `${who}, ${date}`,
  },
  linkFollow: {
    ru: "ссылка на нас на месте и передаёт вес в поиске",
    uz: "bizga havola joyida va qidiruvda vazn beradi",
    pl: "link do nas jest na miejscu i przekazuje moc w wyszukiwarce",
  },
  linkNofollow: {
    ru: "ссылка на месте, но площадка пометила её nofollow: вес в поиске не передаёт, люди по ней переходят",
    uz: "havola joyida, lekin platforma uni nofollow deb belgilagan: qidiruvda vazn bermaydi, odamlar u orqali o‘tadi",
    pl: "link jest na miejscu, ale platforma oznaczyła go nofollow: nie przekazuje mocy w wyszukiwarce, ludzie z niego przechodzą",
  },
  linkMissing: {
    ru: "ссылки на нас на странице не нашли: её убрали или площадка показывает статью только после входа",
    uz: "sahifada bizga havola topilmadi: uni olib tashlashgan yoki platforma maqolani faqat kirgandan keyin ko‘rsatadi",
    pl: "nie znaleźliśmy linku do nas na stronie: usunięto go albo platforma pokazuje artykuł dopiero po zalogowaniu",
  },
  linkUnreachable: {
    ru: "страница не открылась для проверки: статью удалили или площадка не пускает проверку",
    uz: "sahifa tekshiruv uchun ochilmadi: maqola o‘chirilgan yoki platforma tekshiruvni kiritmaydi",
    pl: "strona nie otworzyła się do sprawdzenia: artykuł usunięto albo platforma nie wpuszcza sprawdzania",
  },
  linkUnchecked: {
    ru: "ещё не проверяли: проверка идёт сама через 10 минут после «Опубликовал», потом раз в неделю",
    uz: "hali tekshirilmagan: tekshiruv «E’lon qildim»dan 10 daqiqa o‘tib o‘zi boshlanadi, keyin haftada bir marta",
    pl: "jeszcze nie sprawdzano: sprawdzenie rusza samo 10 minut po „Opublikowałem”, potem raz w tygodniu",
  },
  count30: {
    ru: (n: number) => `Опубликовано за 30 дней: ${n}`,
    uz: (n: number) => `30 kunda e’lon qilingan: ${n}`,
    pl: (n: number) => `Opublikowano w 30 dni: ${n}`,
  },
  skippedCount: {
    ru: (n: number) => `Пропущено всего: ${n}`,
    uz: (n: number) => `Jami o‘tkazib yuborilgan: ${n}`,
    pl: (n: number) => `Pominięto łącznie: ${n}`,
  },
  r_ok: { ru: "Готово.", uz: "Tayyor.", pl: "Gotowe." },
  r_bad: {
    ru: "Ссылка не с этой площадки или не https. Скопируйте адрес статьи из строки браузера.",
    uz: "Havola bu platformadan emas yoki https emas. Maqola manzilini brauzer qatoridan nusxa oling.",
    pl: "Link nie jest z tej platformy albo nie jest https. Skopiuj adres artykułu z paska przeglądarki.",
  },
  r_missing: {
    ru: "Этот черновик уже опубликован или пропущен.",
    uz: "Bu qoralama allaqachon e’lon qilingan yoki o‘tkazib yuborilgan.",
    pl: "Ten szkic jest już opublikowany albo pominięty.",
  },
  r_failed: { ru: "Не получилось. Попробуйте ещё раз.", uz: "Bo‘lmadi. Yana urinib ko‘ring.", pl: "Nie udało się. Spróbuj jeszcze raz." },
  r_forbidden: {
    ru: "Кто публикует, выбирают владелец и руководитель.",
    uz: "Kim e’lon qilishini egasi va rahbar tanlaydi.",
    pl: "Kto publikuje, wybierają właściciel i kierownik.",
  },
});

/** Названия площадок на языке панели. */
export const platformDict = defineDict({
  vcru: { ru: "vc.ru", uz: "vc.ru", pl: "vc.ru" },
  dzen: { ru: "Дзен", uz: "Dzen", pl: "Dzen" },
  tenchat: { ru: "Tenchat", uz: "Tenchat", pl: "Tenchat" },
});
