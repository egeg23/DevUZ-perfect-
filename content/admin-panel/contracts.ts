import { defineDict, tr, type Msg, type PanelLocale, type Tr } from "@/lib/admin/i18n";

/**
 * Раздел «Договоры»: страница подписи (/admin/contracts), панель над
 * договором (/admin/contracts/[id]) и над счётом
 * (/admin/contracts/[id]/invoice/[invoice]).
 *
 * Переводится только панель вокруг документа. Сам текст договора и счёта —
 * документ для заказчика, он на языке договора (сейчас русский) и
 * рисуется components/docs/*: его здесь нет и не будет.
 *
 * Термины — по content/admin-panel/GLOSSARY.md: договор — «shartnoma» /
 * «umowa», счёт — «hisob-faktura» / «faktura», смета — «smeta» /
 * «kosztorys», владелец — «egasi» / «właściciel».
 */

/** Где договор сейчас — одной фразой (карточка проекта, ссылка на договор). */
export const contractStatusDict = defineDict({
  draft: {
    ru: "черновик: готовится, владельцу ещё не отправлен",
    uz: "qoralama: tayyorlanmoqda, egasiga hali yuborilmagan",
    pl: "szkic: w przygotowaniu, jeszcze nie wysłany właścicielowi",
  },
  pending: {
    ru: "отправлен владельцу на подпись",
    uz: "imzo uchun egasiga yuborilgan",
    pl: "wysłana właścicielowi do podpisu",
  },
  approved: {
    ru: "подтверждён владельцем, ждёт подписи заказчика",
    uz: "egasi tasdiqlagan, buyurtmachi imzosini kutmoqda",
    pl: "zatwierdzona przez właściciela, czeka na podpis zamawiającego",
  },
  signed: {
    ru: "подписан обеими сторонами",
    uz: "ikki tomon imzolagan",
    pl: "podpisana przez obie strony",
  },
});

/** Статус над документом — коротко, с большой буквы. */
export const contractBadgeDict = defineDict({
  draft: { ru: "Черновик — подписи нет", uz: "Qoralama — imzo yo‘q", pl: "Szkic — bez podpisu" },
  pending: { ru: "Отправлен владельцу на подпись", uz: "Imzo uchun egasiga yuborilgan", pl: "Wysłana właścicielowi do podpisu" },
  approved: { ru: "Подтверждён владельцем", uz: "Egasi tasdiqlagan", pl: "Zatwierdzona przez właściciela" },
  signed: { ru: "Подписан обеими сторонами", uz: "Ikki tomon imzolagan", pl: "Podpisana przez obie strony" },
  void: {
    ru: (reason: string) => `Отменён: ${reason}`,
    uz: (reason: string) => `Bekor qilingan: ${reason}`,
    pl: (reason: string) => `Anulowana: ${reason}`,
  },
});

/**
 * Чего не хватает договору — по коду из lib/admin/contracts.ts
 * (`Problem.code`) и lib/admin/contract-store.ts (`below_floor`). В адрес
 * уходят коды (`detail=код,код:число`), текст — отсюда.
 */
export const contractProblemDict = defineDict({
  number: { ru: "Нет номера договора", uz: "Shartnoma raqami yo‘q", pl: "Brak numeru umowy" },
  signed_date: { ru: "Нет даты договора", uz: "Shartnoma sanasi yo‘q", pl: "Brak daty umowy" },
  client_name: { ru: "Не названа сторона заказчика", uz: "Buyurtmachi tomoni ko‘rsatilmagan", pl: "Nie wskazano strony zamawiającej" },
  client_details: {
    ru: "Нет реквизитов заказчика: адрес, идентификатор, контакт",
    uz: "Buyurtmachi rekvizitlari yo‘q: manzil, identifikator, kontakt",
    pl: "Brak danych zamawiającego: adres, identyfikator, kontakt",
  },
  subject: {
    ru: "Предмет договора описан слишком общо — его нельзя проверить на исполнение",
    uz: "Shartnoma predmeti juda umumiy yozilgan — bajarilishini tekshirib bo‘lmaydi",
    pl: "Przedmiot umowy opisano zbyt ogólnie — nie da się sprawdzić jego wykonania",
  },
  amount_usd: { ru: "Сумма не указана", uz: "Summa ko‘rsatilmagan", pl: "Nie podano kwoty" },
  estimate: {
    ru: "Нет сметы: без неё в договоре не из чего собрать перечень работ",
    uz: "Smeta yo‘q: usiz shartnomada ishlar ro‘yxatini tuzib bo‘lmaydi",
    pl: "Brak kosztorysu: bez niego nie ma z czego zbudować w umowie zakresu prac",
  },
  deadline: {
    ru: "Не указан согласованный срок выполнения",
    uz: "Kelishilgan bajarish muddati ko‘rsatilmagan",
    pl: "Nie podano uzgodnionego terminu realizacji",
  },
  seller: {
    ru: "Не заполнены банковские реквизиты студии — договор без счёта исполнителя не подписывают",
    uz: "Studiyaning bank rekvizitlari to‘ldirilmagan — ijrochi hisob raqamisiz shartnoma imzolanmaydi",
    pl: "Nie uzupełniono danych bankowych studia — umowy bez rachunku wykonawcy się nie podpisuje",
  },
  client_tax_id: { ru: "Нет ИНН или ПИНФЛ заказчика", uz: "Buyurtmachining STIR yoki JShShIR yo‘q", pl: "Brak INN lub PINFL zamawiającego" },
  client_bank_name: { ru: "Не указан банк заказчика", uz: "Buyurtmachining banki ko‘rsatilmagan", pl: "Nie podano banku zamawiającego" },
  client_account: {
    ru: "Не указан расчётный счёт заказчика",
    uz: "Buyurtmachining hisob raqami ko‘rsatilmagan",
    pl: "Nie podano rachunku zamawiającego",
  },
  client_account_format: {
    ru: "Расчётный счёт заказчика — двадцать цифр, сейчас там другое",
    uz: "Buyurtmachining hisob raqami — yigirmata raqam, hozir u yerda boshqa narsa",
    pl: "Rachunek zamawiającego to dwadzieścia cyfr, a teraz jest tam coś innego",
  },
  client_mfo: {
    ru: "Не указан МФО — код банка заказчика",
    uz: "MFO — buyurtmachi bankining kodi ko‘rsatilmagan",
    pl: "Nie podano MFO — kodu banku zamawiającego",
  },
  client_mfo_format: {
    ru: "МФО — пять цифр, сейчас там другое",
    uz: "MFO — beshta raqam, hozir u yerda boshqa narsa",
    pl: "MFO to pięć cyfr, a teraz jest tam coś innego",
  },
  stages_none: { ru: "Нет ни одного этапа", uz: "Birorta ham bosqich yo‘q", pl: "Brak etapów" },
  stages_sum: {
    ru: (total: string) => `Доли этапов дают ${total}% вместо 100%`,
    uz: (total: string) => `Bosqichlar ulushi jami 100% emas, ${total}%`,
    pl: (total: string) => `Udziały etapów dają ${total}% zamiast 100%`,
  },
  stages_percent: {
    ru: "У этапа нулевая или отрицательная доля",
    uz: "Bosqich ulushi nol yoki manfiy",
    pl: "Etap ma zerowy lub ujemny udział",
  },
  stages_days: { ru: "У этапа не указан срок", uz: "Bosqich muddati ko‘rsatilmagan", pl: "Etap nie ma terminu" },
  stages_title: { ru: "У этапа нет названия", uz: "Bosqich nomi yo‘q", pl: "Etap nie ma nazwy" },
  below_floor: {
    ru: (floor: string) => `сумма ниже порога сметы — $${floor}`,
    uz: (floor: string) => `summa smeta chegarasidan past — $${floor}`,
    pl: (floor: string) => `kwota poniżej progu kosztorysu — $${floor}`,
  },
});

/**
 * Претензии из адреса (`detail=stages_sum:90,client_mfo`) — текстом на
 * языке панели. Старая ссылка с русским текстом вместо кодов показывается
 * как есть: пустая плашка объяснила бы меньше.
 */
export function problemsText(detail: string, locale: PanelLocale, separator: string): string {
  const dict = contractProblemDict as Record<string, Tr<Msg> | undefined>;
  const parts = detail.split(",").map((part) => part.trim().split(":"));
  if (!parts.every(([code, arg]) => dict[code] && (arg === undefined || /^-?[\d.]+$/.test(arg)))) return detail;
  return parts
    .map(([code, arg]) => {
      const entry = tr(dict[code]!, locale);
      if (typeof entry === "string") return entry;
      const value = Number(arg);
      // Порог сметы — как в смете: «1,200»; доли этапов — как ввели.
      const shown = code === "below_floor" ? value.toLocaleString("en-US") : String(value);
      return (entry as (value: string) => string)(shown);
    })
    .join(separator);
}

/**
 * Почему смета не разобралась: `?hint=код`. Коды — `why` из
 * lib/admin/estimate.ts и свои из contract-store (`unreadable`, `scan`).
 */
export const estimateHintDict = defineDict({
  unreadable: {
    ru: "Файл не прочитался. Вставьте строки сметы руками ниже — файл всё равно приложен к договору.",
    uz: "Fayl o‘qilmadi. Smeta qatorlarini pastda qo‘lda kiriting — fayl baribir shartnomaga biriktirilgan.",
    pl: "Nie udało się odczytać pliku. Wklej wiersze kosztorysu ręcznie poniżej — plik i tak jest dołączony do umowy.",
  },
  scan: {
    ru: "В PDF нет текста — похоже, это скан. Вставьте строки сметы руками ниже — файл всё равно приложен к договору.",
    uz: "PDF ichida matn yo‘q — skanerga o‘xshaydi. Smeta qatorlarini pastda qo‘lda kiriting — fayl baribir shartnomaga biriktirilgan.",
    pl: "W PDF nie ma tekstu — to chyba skan. Wklej wiersze kosztorysu ręcznie poniżej — plik i tak jest dołączony do umowy.",
  },
  unsupported: {
    ru: "Разбираем Excel (xlsx), CSV, TSV и PDF с текстом. Сохраните смету в одном из них — или вставьте строки руками ниже, файл всё равно приложится к договору.",
    uz: "Excel (xlsx), CSV, TSV va matnli PDF o‘qiladi. Smetani shulardan birida saqlang — yoki qatorlarni pastda qo‘lda kiriting, fayl baribir shartnomaga biriktiriladi.",
    pl: "Odczytujemy Excel (xlsx), CSV, TSV i PDF z tekstem. Zapisz kosztorys w jednym z nich — albo wklej wiersze ręcznie poniżej, plik i tak zostanie dołączony do umowy.",
  },
  empty: { ru: "Файл пустой.", uz: "Fayl bo‘sh.", pl: "Plik jest pusty." },
  shape: {
    ru: "Ни одной строки с ценой. Ожидаем колонки: название, [единица], количество, цена.",
    uz: "Narxli birorta ham qator yo‘q. Kutilgan ustunlar: nomi, [birlik], miqdori, narxi.",
    pl: "Żadnego wiersza z ceną. Oczekujemy kolumn: nazwa, [jednostka], ilość, cena.",
  },
});

/**
 * Отказ действий договора: `?error=код`. Коды — `why` из
 * lib/admin/contract-store.ts, lib/admin/invoice-store.ts,
 * lib/admin/signature.ts и свои коды действий (`nofile`, `link`).
 */
export const contractErrorDict = defineDict({
  forbidden: {
    ru: "Подтвердить договор может только владелец.",
    uz: "Shartnomani faqat egasi tasdiqlay oladi.",
    pl: "Umowę może zatwierdzić tylko właściciel.",
  },
  locked: {
    ru: "Договор уже подтверждён или отменён.",
    uz: "Shartnoma allaqachon tasdiqlangan yoki bekor qilingan.",
    pl: "Umowa jest już zatwierdzona lub anulowana.",
  },
  missing: {
    ru: (list: string) => `Не хватает: ${list}`,
    uz: (list: string) => `Yetishmayapti: ${list}`,
    pl: (list: string) => `Brakuje: ${list}`,
  },
  failed: {
    ru: "Не получилось. Попробуйте ещё раз.",
    uz: "Bo‘lmadi. Yana bir bor urinib ko‘ring.",
    pl: "Nie udało się. Spróbuj ponownie.",
  },
  invalid: {
    ru: "Не получилось. Попробуйте ещё раз.",
    uz: "Bo‘lmadi. Yana bir bor urinib ko‘ring.",
    pl: "Nie udało się. Spróbuj ponownie.",
  },
  notfound: { ru: "Договора уже нет.", uz: "Shartnoma endi yo‘q.", pl: "Tej umowy już nie ma." },
  offline: { ru: "База недоступна.", uz: "Bazaga ulanib bo‘lmadi.", pl: "Baza danych jest niedostępna." },
  nofile: {
    ru: "Файл не выбран или слишком большой.",
    uz: "Fayl tanlanmagan yoki juda katta.",
    pl: "Nie wybrano pliku albo jest za duży.",
  },
  // Счета (lib/admin/invoice-store.ts)
  contract_gone: { ru: "Договора уже нет.", uz: "Shartnoma endi yo‘q.", pl: "Tej umowy już nie ma." },
  invoice_gone: { ru: "Счёта уже нет.", uz: "Hisob-faktura endi yo‘q.", pl: "Tej faktury już nie ma." },
  not_approved: {
    ru: "Счёт выставляется к подтверждённому договору: до подписи платить не за что.",
    uz: "Hisob-faktura tasdiqlangan shartnomaga beriladi: imzodan oldin to‘lanadigan narsa yo‘q.",
    pl: "Fakturę wystawia się do zatwierdzonej umowy: przed podpisem nie ma za co płacić.",
  },
  no_such_stage: { ru: "У договора нет такого этапа.", uz: "Shartnomada bunday bosqich yo‘q.", pl: "Umowa nie ma takiego etapu." },
  already: {
    ru: "Счёт на этот этап уже выставлен.",
    uz: "Bu bosqich uchun hisob-faktura allaqachon berilgan.",
    pl: "Faktura za ten etap jest już wystawiona.",
  },
  no_bank: {
    ru: "Не заполнены банковские реквизиты студии — счёт без счёта не документ.",
    uz: "Studiyaning bank rekvizitlari to‘ldirilmagan — hisob raqamisiz hisob-faktura hujjat emas.",
    pl: "Nie uzupełniono danych bankowych studia — faktura bez numeru rachunku nie jest dokumentem.",
  },
  zero_amount: {
    ru: "Сумма этапа вышла нулевой — проверьте доли.",
    uz: "Bosqich summasi nolga teng chiqdi — ulushlarni tekshiring.",
    pl: "Kwota etapu wyszła zerowa — sprawdź udziały.",
  },
  not_written: {
    ru: "Счёт не записался — возможно, он уже есть.",
    uz: "Hisob-faktura yozilmadi — ehtimol, u allaqachon bor.",
    pl: "Faktura się nie zapisała — możliwe, że już istnieje.",
  },
  already_paid: {
    ru: "Счёт уже отмечен оплаченным или его нет.",
    uz: "Hisob-faktura allaqachon to‘langan deb belgilangan yoki u yo‘q.",
    pl: "Faktura jest już oznaczona jako opłacona albo jej nie ma.",
  },
  owner_confirms: {
    ru: "Платёж подтверждает владелец.",
    uz: "To‘lovni egasi tasdiqlaydi.",
    pl: "Płatność potwierdza właściciel.",
  },
  not_marked: {
    ru: "Счёт не отмечен оплаченным.",
    uz: "Hisob-faktura to‘langan deb belgilanmagan.",
    pl: "Faktura nie jest oznaczona jako opłacona.",
  },
  payment_failed: {
    ru: "Платёж в проект не записался. Попробуйте ещё раз.",
    uz: "To‘lov loyihaga yozilmadi. Yana bir bor urinib ko‘ring.",
    pl: "Płatność nie zapisała się w projekcie. Spróbuj ponownie.",
  },
  owner_unmarks: {
    ru: "Снять отметку может владелец.",
    uz: "Belgini egasi olib tashlay oladi.",
    pl: "Oznaczenie może zdjąć właściciel.",
  },
  payment_confirmed: {
    ru: "Платёж по счёту уже подтверждён — удалите его в карточке проекта.",
    uz: "Hisob-faktura bo‘yicha to‘lov allaqachon tasdiqlangan — uni loyiha kartochkasida o‘chiring.",
    pl: "Płatność za fakturę jest już potwierdzona — usuń ją w karcie projektu.",
  },
  link: {
    ru: "Ссылка не выпустилась. Попробуйте ещё раз.",
    uz: "Havola yaratilmadi. Yana bir bor urinib ko‘ring.",
    pl: "Nie udało się wygenerować linku. Spróbuj ponownie.",
  },
  // Подпись (lib/admin/signature.ts)
  not_png: { ru: "Нужен файл PNG", uz: "PNG fayl kerak", pl: "Potrzebny jest plik PNG" },
  too_big: { ru: "Файл больше 2 МБ", uz: "Fayl 2 MB dan katta", pl: "Plik jest większy niż 2 MB" },
  storage: { ru: "Хранилище недоступно", uz: "Xotiraga ulanib bo‘lmadi", pl: "Magazyn plików jest niedostępny" },
});

/** Страница «Договоры» (/admin/contracts). */
export const contractsPageDict = defineDict({
  title: { ru: "Договоры", uz: "Shartnomalar", pl: "Umowy" },
  intro: {
    ru: "Договор готовится в карточке проекта — блок «Договор». Подготовить и проверить может любой из команды. Подтвердить может только владелец — подтверждение и есть момент, когда под документом появляется подпись.",
    uz: "Shartnoma loyiha kartochkasida — «Shartnoma» blokida tayyorlanadi. Tayyorlash va tekshirishni jamoadagi istalgan xodim qila oladi. Tasdiqlashni faqat egasi qila oladi — tasdiqlash hujjat ostida imzo paydo bo‘ladigan payt.",
    pl: "Umowę przygotowuje się w karcie projektu — w bloku „Umowa”. Przygotować i sprawdzić może każdy z zespołu. Zatwierdzić może tylko właściciel — zatwierdzenie to moment, w którym pod dokumentem pojawia się podpis.",
  },
  signature: { ru: "Подпись", uz: "Imzo", pl: "Podpis" },
  signatureNote: {
    ru: "PNG с прозрачным фоном. Накладывается поверх линии подписи и показывается только в подтверждённых договорах — у черновика её нет в документе физически, а не спрятана стилями.",
    uz: "Shaffof fonli PNG. Imzo chizig‘i ustiga qo‘yiladi va faqat tasdiqlangan shartnomalarda ko‘rinadi — qoralamada u hujjatda umuman yo‘q, uslublar bilan yashirilmagan.",
    pl: "PNG z przezroczystym tłem. Nakłada się na linię podpisu i pokazuje tylko w zatwierdzonych umowach — w szkicu fizycznie go nie ma, a nie jest ukryty stylami.",
  },
  signatureLoaded: { ru: "Подпись загружена", uz: "Imzo yuklangan", pl: "Podpis wgrany" },
  noSignature: {
    ru: "Подписи нет. Подтверждённый договор напечатается без неё.",
    uz: "Imzo yo‘q. Tasdiqlangan shartnoma imzosiz chop etiladi.",
    pl: "Brak podpisu. Zatwierdzona umowa wydrukuje się bez niego.",
  },
  replace: { ru: "Заменить", uz: "Almashtirish", pl: "Zamień" },
  upload: { ru: "Загрузить", uz: "Yuklash", pl: "Wgraj" },
  saved: { ru: "Сохранено.", uz: "Saqlandi.", pl: "Zapisano." },
  protectsTitle: { ru: "Что защищает этот договор", uz: "Bu shartnoma nimani himoya qiladi", pl: "Przed czym chroni ta umowa" },
  arbitrationHead: {
    ru: "Споры идут в арбитраж, а не в суд.",
    uz: "Nizolar sudga emas, arbitrajga boradi.",
    pl: "Spory trafiają do arbitrażu, a nie do sądu.",
  },
  arbitrationBody: {
    ru: "Это главное условие: оно меняет не аргументы, а того, кто их слушает.",
    uz: "Bu asosiy shart: u dalillarni emas, ularni kim tinglashini o‘zgartiradi.",
    pl: "To najważniejszy warunek: zmienia nie argumenty, a tego, kto ich słucha.",
  },
  liabilityHead: {
    ru: "Ответственность ограничена полученным.",
    uz: "Javobgarlik olingan summa bilan cheklangan.",
    pl: "Odpowiedzialność jest ograniczona do otrzymanej kwoty.",
  },
  liabilityBody: {
    ru: "Даже проигранный спор не может стоить больше, чем пришло по договору.",
    uz: "Hatto yutqazilgan nizo ham shartnoma bo‘yicha kelgan puldan qimmatga tushmaydi.",
    pl: "Nawet przegrany spór nie może kosztować więcej, niż wpłynęło z umowy.",
  },
  lostProfitHead: {
    ru: "Упущенная выгода исключена.",
    uz: "Boy berilgan foyda istisno qilingan.",
    pl: "Utracone korzyści są wyłączone.",
  },
  lostProfitBody: {
    ru: "Именно ею раздувают иск до сумм, которых никто не видел.",
    uz: "Aynan u bilan da’voni hech kim ko‘rmagan summalargacha shishirishadi.",
    pl: "To właśnie nimi pompuje się pozew do kwot, których nikt nie widział.",
  },
  silenceHead: {
    ru: "Молчание заказчика — это приёмка.",
    uz: "Buyurtmachining jim turishi — qabul qilish demakdir.",
    pl: "Milczenie zamawiającego oznacza odbiór.",
  },
  silenceBody: {
    ru: "Пять рабочих дней без ответа, и этап принят.",
    uz: "Besh ish kuni javob bo‘lmasa, bosqich qabul qilingan hisoblanadi.",
    pl: "Pięć dni roboczych bez odpowiedzi i etap jest odebrany.",
  },
  rightsHead: {
    ru: "Права на код — после полной оплаты.",
    uz: "Kodga huquqlar — to‘liq to‘lovdan keyin.",
    pl: "Prawa do kodu — po pełnej zapłacie.",
  },
  rightsBody: {
    ru: "До неё использование результата нарушает наши права.",
    uz: "Undan oldin natijadan foydalanish bizning huquqlarimizni buzadi.",
    pl: "Wcześniej korzystanie z rezultatu narusza nasze prawa.",
  },
  lawyerNote: {
    ru: "Документ не проверен юристом. До проверки его стоит показывать заказчику как есть, но арбитражную оговорку нужно согласовать отдельно: у неё есть формальные требования, и ошибка в формулировке делает её недействительной — то есть возвращает спор в суд.",
    uz: "Hujjat yurist tomonidan tekshirilmagan. Tekshiruvgacha uni buyurtmachiga shundayligicha ko‘rsatsa bo‘ladi, lekin arbitraj bandini alohida kelishish kerak: uning rasmiy talablari bor va ifodadagi xato uni haqiqiy emas qiladi — ya’ni nizoni yana sudga qaytaradi.",
    pl: "Dokument nie był sprawdzony przez prawnika. Do tego czasu można go pokazywać zamawiającemu w obecnej formie, ale klauzulę arbitrażową trzeba uzgodnić osobno: ma wymogi formalne, a błąd w sformułowaniu czyni ją nieważną — czyli przenosi spór z powrotem do sądu.",
  },
  toProjects: { ru: "← К проектам", uz: "← Loyihalarga", pl: "← Do projektów" },
});

/** Панель над договором (/admin/contracts/[id]). */
export const contractCardDict = defineDict({
  print: { ru: "Печать", uz: "Chop etish", pl: "Drukuj" },
  howTo: { ru: "Как пользоваться", uz: "Qanday foydalanish", pl: "Jak korzystać" },
  howToLabel: { ru: "Как пользоваться разделом", uz: "Bo‘limdan qanday foydalanish", pl: "Jak korzystać z sekcji" },
  noSignatureFile: {
    ru: "Договор подтверждён, но файл подписи не загружен",
    uz: "Shartnoma tasdiqlangan, lekin imzo fayli yuklanmagan",
    pl: "Umowa jest zatwierdzona, ale plik podpisu nie został wgrany",
  },
  sendToOwner: { ru: "Отправить на подпись", uz: "Imzoga yuborish", pl: "Wyślij do podpisu" },
  approve: { ru: "Подтвердить и подписать", uz: "Tasdiqlash va imzolash", pl: "Zatwierdź i podpisz" },
  returnBack: { ru: "Вернуть на доработку", uz: "Qayta ishlashga qaytarish", pl: "Zwróć do poprawy" },
  uploadSigned: { ru: "Загрузить подписанный", uz: "Imzolanganini yuklash", pl: "Wgraj podpisaną" },
  estimateFile: {
    ru: (name: string) => `Смета: ${name}`,
    uz: (name: string) => `Smeta: ${name}`,
    pl: (name: string) => `Kosztorys: ${name}`,
  },
  signedScan: { ru: "Скан с подписями", uz: "Imzolar bilan skaner nusxa", pl: "Skan z podpisami" },
  cancelReason: { ru: "Причина отмены", uz: "Bekor qilish sababi", pl: "Powód anulowania" },
  cancel: { ru: "Отменить", uz: "Bekor qilish", pl: "Anuluj" },

  invoices: { ru: "Счета на оплату", uz: "To‘lov uchun hisob-fakturalar", pl: "Faktury do zapłaty" },
  invoicesHelp: { ru: "Как работают счета", uz: "Hisob-fakturalar qanday ishlaydi", pl: "Jak działają faktury" },
  invoicesNote: {
    ru: "По договору каждый этап оплачивается авансом в 100% его стоимости, поэтому счёт выставляется на этап, а не на всю сумму. Счёт на первый этап выставлен вместе с подтверждением.",
    uz: "Shartnoma bo‘yicha har bir bosqich qiymatining 100% avans sifatida to‘lanadi, shuning uchun hisob-faktura butun summaga emas, bosqichga beriladi. Birinchi bosqich hisob-fakturasi tasdiqlash bilan birga berilgan.",
    pl: "Zgodnie z umową każdy etap opłaca się zaliczką w 100% jego wartości, dlatego faktura jest wystawiana na etap, a nie na całą kwotę. Faktura za pierwszy etap została wystawiona razem z zatwierdzeniem.",
  },
  stage: {
    ru: (n: number, title: string) => `Этап ${n}. ${title}`,
    uz: (n: number, title: string) => `${n}-bosqich. ${title}`,
    pl: (n: number, title: string) => `Etap ${n}. ${title}`,
  },
  invoiceNo: {
    ru: (no: string) => `Счёт № ${no}`,
    uz: (no: string) => `Hisob-faktura № ${no}`,
    pl: (no: string) => `Faktura nr ${no}`,
  },
  paidConfirmed: { ru: "оплачен · платёж в проекте", uz: "to‘langan · to‘lov loyihada", pl: "opłacona · płatność w projekcie" },
  paidAwaiting: {
    ru: "оплачен · ждёт подтверждения владельца",
    uz: "to‘langan · egasining tasdig‘ini kutmoqda",
    pl: "opłacona · czeka na potwierdzenie właściciela",
  },
  confirmPayment: { ru: "Подтвердить платёж", uz: "To‘lovni tasdiqlash", pl: "Potwierdź płatność" },
  notPaid: { ru: "Оплаты не было", uz: "To‘lov bo‘lmagan", pl: "Nie było wpłaty" },
  dueUntil: {
    ru: (date: string) => `до ${date}`,
    uz: (date: string) => `${date} gacha`,
    pl: (date: string) => `do ${date}`,
  },
  markPaid: { ru: "Оплачен", uz: "To‘landi", pl: "Opłacona" },
  issue: { ru: "Выставить счёт", uz: "Hisob-faktura berish", pl: "Wystaw fakturę" },
  newLink: { ru: "Выпустить новую ссылку", uz: "Yangi havola yaratish", pl: "Wygeneruj nowy link" },
  clientLink: { ru: "Ссылка для заказчика", uz: "Buyurtmachi uchun havola", pl: "Link dla zamawiającego" },
  linkExists: {
    ru: "ссылка уже выпущена; новая отменит прежнюю",
    uz: "havola allaqachon yaratilgan; yangisi eskisini bekor qiladi",
    pl: "link jest już wygenerowany; nowy unieważni poprzedni",
  },
  linkAbout: {
    ru: "по ней заказчик откроет договор и счета, без пароля",
    uz: "buyurtmachi u orqali shartnoma va hisob-fakturalarni parolsiz ochadi",
    pl: "przez niego zamawiający otworzy umowę i faktury, bez hasła",
  },
  copyNow: {
    ru: "Скопируйте сейчас — второй раз эта ссылка не покажется.",
    uz: "Hozir nusxalab oling — bu havola ikkinchi marta ko‘rsatilmaydi.",
    pl: "Skopiuj teraz — drugi raz ten link się nie pokaże.",
  },

  uploadEstimate: { ru: "Загрузить смету", uz: "Smetani yuklash", pl: "Wgraj kosztorys" },
  estimateFormats: {
    ru: "Excel, CSV и PDF с текстом разбираются построчно; скан прикладывается файлом",
    uz: "Excel, CSV va matnli PDF qatorma-qator o‘qiladi; skaner fayl sifatida biriktiriladi",
    pl: "Excel, CSV i PDF z tekstem są odczytywane wiersz po wierszu; skan dołącza się jako plik",
  },
  pasteRows: { ru: "Вставить строки сметы руками", uz: "Smeta qatorlarini qo‘lda kiritish", pl: "Wklej wiersze kosztorysu ręcznie" },
  pasteHowTo: {
    ru: "Скопируйте строки из Excel или впишите по строке на позицию: название, количество, цена — через табуляцию или «;». Строка «Итого» не нужна: сумму посчитаем сами.",
    uz: "Qatorlarni Excel’dan nusxalang yoki har bir pozitsiyaga bitta qator yozing: nomi, miqdori, narxi — tabulyatsiya yoki «;» orqali. «Jami» qatori kerak emas: summani o‘zimiz hisoblaymiz.",
    pl: "Skopiuj wiersze z Excela albo wpisz po jednym wierszu na pozycję: nazwa, ilość, cena — oddzielone tabulatorem lub „;”. Wiersz „Razem” nie jest potrzebny: sumę policzymy sami.",
  },
  saveRows: { ru: "Сохранить строки", uz: "Qatorlarni saqlash", pl: "Zapisz wiersze" },
  deadline: { ru: "Срок", uz: "Muddat", pl: "Termin" },

  sent: {
    ru: "Отправлено. Владельцу ушло уведомление в Telegram.",
    uz: "Yuborildi. Egasiga Telegram’da bildirishnoma ketdi.",
    pl: "Wysłano. Właściciel dostał powiadomienie w Telegramie.",
  },
  sentSilent: {
    ru: "Договор отправлен, но уведомление в Telegram не ушло — скажите владельцу голосом.",
    uz: "Shartnoma yuborildi, lekin Telegram’dagi bildirishnoma ketmadi — egasiga og‘zaki ayting.",
    pl: "Umowa została wysłana, ale powiadomienie w Telegramie nie dotarło — powiedz właścicielowi osobiście.",
  },
  signedSaved: {
    ru: "Подписанный договор сохранён.",
    uz: "Imzolangan shartnoma saqlandi.",
    pl: "Podpisana umowa została zapisana.",
  },
  paidConfirmedText: {
    ru: "Оплата записана платежом в проект — она в «Деньгах», начисления команде по ней открыты.",
    uz: "To‘lov loyihaga to‘lov sifatida yozildi — u «Pul» blokida, jamoaga bu bo‘yicha hisoblanmalar ochildi.",
    pl: "Wpłata zapisana jako płatność w projekcie — jest w „Pieniądzach”, naliczenia zespołu z niej są odblokowane.",
  },
  paidAwaitingText: {
    ru: "Оплата отмечена. Владельцу ушло сообщение: платёж попадёт в проект, когда он его подтвердит.",
    uz: "To‘lov belgilandi. Egasiga xabar ketdi: u tasdiqlaganda to‘lov loyihaga tushadi.",
    pl: "Wpłata oznaczona. Właściciel dostał wiadomość: płatność trafi do projektu, gdy ją potwierdzi.",
  },
  unmarkedText: { ru: "Отметка об оплате снята.", uz: "To‘lov belgisi olib tashlandi.", pl: "Oznaczenie wpłaty zostało zdjęte." },
});


/** Панель над счётом (/admin/contracts/[id]/invoice/[invoice]). */
export const invoicePageDict = defineDict({
  backToContract: { ru: "← к договору", uz: "← shartnomaga", pl: "← do umowy" },
  paid: { ru: "оплачен", uz: "to‘langan", pl: "opłacona" },
  payUntil: {
    ru: (date: string) => `оплатить до ${date}`,
    uz: (date: string) => `${date} gacha to‘lash kerak`,
    pl: (date: string) => `zapłacić do ${date}`,
  },
  openedBy: {
    ru: (name: string) => ` · открыл ${name}`,
    uz: (name: string) => ` · ochgan: ${name}`,
    pl: (name: string) => ` · otworzył(a) ${name}`,
  },
});
