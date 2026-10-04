import { defineDict } from "@/lib/admin/i18n";

/**
 * Раздел «Аккаунты» (/admin/accounts): рабочие аккаунты Telegram, с которых
 * уходят касания и идёт переписка. Владелец и руководитель.
 */
export const accountsDict = defineDict({
  title: { ru: "Рабочие аккаунты", uz: "Ishchi akkauntlar", pl: "Konta robocze" },
  intro: {
    ru: "С этих аккаунтов Telegram уходят первые письма касаний и идёт переписка с клиентами. Главный подключён на сервере и ещё читает чаты. Здесь подключаются дополнительные: предел «три письма новым людям в час» у каждого свой, поэтому три аккаунта — втрое больше касаний, а ограничение одного не останавливает остальных. Первые письма уходят с 07:30 до 20:30 по Ташкенту; переписка с теми, кто ответил, — в любое время и без предела.",
    uz: "Aloqalarning birinchi xatlari shu Telegram akkauntlaridan ketadi va mijozlar bilan yozishma shu yerda boradi. Asosiysi serverda ulangan va chatlarni ham o‘qiydi. Bu yerda qo‘shimchalari ulanadi: «yangi odamlarga soatiga uchta xat» chegarasi har birida o‘ziniki, shuning uchun uchta akkaunt — uch barobar ko‘p aloqa, bittasining cheklanishi esa qolganlarini to‘xtatmaydi. Birinchi xatlar Toshkent vaqti bilan 07:30 dan 20:30 gacha ketadi; javob berganlar bilan yozishma — istalgan vaqtda va chegarasiz.",
    pl: "Z tych kont Telegrama wychodzą pierwsze wiadomości kontaktów i toczy się korespondencja z klientami. Główne jest podłączone na serwerze i dodatkowo czyta czaty. Tutaj podłącza się dodatkowe: limit „trzy wiadomości do nowych osób na godzinę” każde ma swój, więc trzy konta to trzy razy więcej kontaktów, a ograniczenie jednego nie zatrzymuje pozostałych. Pierwsze wiadomości wychodzą od 07:30 do 20:30 czasu taszkenckiego; korespondencja z tymi, którzy odpisali, — o każdej porze i bez limitu.",
  },
  mainTitle: { ru: "Главный аккаунт", uz: "Asosiy akkaunt", pl: "Konto główne" },
  mainText: {
    ru: (cap: number) => `Подключён на сервере · ${cap} письма в час · читает чаты и пишет`,
    uz: (cap: number) => `Serverda ulangan · soatiga ${cap} ta xat · chatlarni o‘qiydi va yozadi`,
    pl: (cap: number) => `Podłączone na serwerze · ${cap} wiadomości na godzinę · czyta czaty i pisze`,
  },
  sent: {
    ru: (hour: number, cap: number, today: number) => `за час ${hour} из ${cap} · сегодня ${today}`,
    uz: (hour: number, cap: number, today: number) => `oxirgi soatda ${cap} tadan ${hour} ta · bugun ${today} ta`,
    pl: (hour: number, cap: number, today: number) => `w ostatniej godzinie ${hour} z ${cap} · dziś ${today}`,
  },
  capacity: {
    ru: (cap: number) => `Все аккаунты вместе — до ${cap} первых писем в час.`,
    uz: (cap: number) => `Barcha akkauntlar birga — soatiga ${cap} tagacha birinchi xat.`,
    pl: (cap: number) => `Wszystkie konta razem — do ${cap} pierwszych wiadomości na godzinę.`,
  },
  empty: {
    ru: "Дополнительных аккаунтов пока нет.",
    uz: "Hozircha qo‘shimcha akkauntlar yo‘q.",
    pl: "Nie ma jeszcze dodatkowych kont.",
  },
  addTitle: { ru: "Подключить аккаунт", uz: "Akkaunt ulash", pl: "Podłącz konto" },
  fLabel: { ru: "Как назвать", uz: "Nomi", pl: "Nazwa" },
  fLabelHint: { ru: "Например, «Аккаунт Дильнозы»", uz: "Masalan, «Dilnoza akkaunti»", pl: "Na przykład «Konto Dilnozy»" },
  fPhone: { ru: "Номер телефона аккаунта", uz: "Akkaunt telefon raqami", pl: "Numer telefonu konta" },
  addButton: { ru: "Отправить код", uz: "Kod yuborish", pl: "Wyślij kod" },
  adding: { ru: "Отправляем…", uz: "Yuborilmoqda…", pl: "Wysyłanie…" },
  addHint: {
    ru: "Telegram пришлёт код в приложение на телефоне этого аккаунта — обычно не SMS, а сообщение от «Telegram». Код никому не пересылайте и не отправляйте в чат: Telegram отменяет код, который переслали сообщением.",
    uz: "Telegram kodni shu akkaunt telefonidagi ilovaga yuboradi — odatda SMS emas, «Telegram»dan xabar. Kodni hech kimga jo‘natmang va chatga yubormang: xabar bilan jo‘natilgan kodni Telegram bekor qiladi.",
    pl: "Telegram wyśle kod do aplikacji na telefonie tego konta — zwykle nie SMS, tylko wiadomość od «Telegram». Nie przesyłaj nikomu kodu i nie wysyłaj go na czat: Telegram unieważnia kod przesłany wiadomością.",
  },
  status_code_requested: { ru: "отправляем код…", uz: "kod yuborilmoqda…", pl: "wysyłamy kod…" },
  status_awaiting_code: { ru: "ждём код", uz: "kod kutilmoqda", pl: "czekamy na kod" },
  status_code_submitted: { ru: "проверяем код…", uz: "kod tekshirilmoqda…", pl: "sprawdzamy kod…" },
  status_awaiting_password: { ru: "нужен пароль", uz: "parol kerak", pl: "potrzebne hasło" },
  status_password_submitted: { ru: "проверяем пароль…", uz: "parol tekshirilmoqda…", pl: "sprawdzamy hasło…" },
  status_active: { ru: "в работе", uz: "ishlamoqda", pl: "pracuje" },
  status_paused: { ru: "на паузе", uz: "pauzada", pl: "wstrzymane" },
  status_failed: { ru: "не подключён", uz: "ulanmagan", pl: "niepodłączone" },
  status_removed: { ru: "отключён", uz: "o‘chirilgan", pl: "odłączone" },
  fCode: { ru: "Код из Telegram", uz: "Telegramdan kelgan kod", pl: "Kod z Telegrama" },
  fPassword: { ru: "Пароль двухфакторной защиты", uz: "Ikki bosqichli himoya paroli", pl: "Hasło weryfikacji dwuetapowej" },
  signIn: { ru: "Войти", uz: "Kirish", pl: "Zaloguj" },
  signingIn: { ru: "Входим…", uz: "Kirilmoqda…", pl: "Logowanie…" },
  passwordHint: {
    ru: "Пароль нужен один раз — для входа. Мы его не храним: скаут проверяет его и сразу стирает.",
    uz: "Parol bir marta — kirish uchun kerak. Biz uni saqlamaymiz: skaut tekshiradi va darhol o‘chiradi.",
    pl: "Hasło jest potrzebne raz — do logowania. Nie przechowujemy go: skaut sprawdza je i od razu usuwa.",
  },
  restart: { ru: "Начать заново", uz: "Qaytadan boshlash", pl: "Zacznij od nowa" },
  capLabel: { ru: "Писем в час", uz: "Soatiga xat", pl: "Wiadomości na godzinę" },
  save: { ru: "Сохранить", uz: "Saqlash", pl: "Zapisz" },
  capHint: {
    ru: "Свежему номеру на первую неделю лучше 1–2 в час: новый аккаунт Telegram ограничивает быстрее.",
    uz: "Yangi raqamga birinchi haftada soatiga 1–2 ta yaxshiroq: yangi akkauntni Telegram tezroq cheklaydi.",
    pl: "Świeżemu numerowi przez pierwszy tydzień lepiej 1–2 na godzinę: nowe konto Telegram ogranicza szybciej.",
  },
  staffTitle: { ru: "Кто работает на аккаунте", uz: "Akkauntda kim ishlaydi", pl: "Kto pracuje na koncie" },
  staffHint: {
    ru: "Первые письма отмеченных уходят только с их аккаунтов — с того, где раньше освободится место. Один человек может работать на нескольких аккаунтах. Никто не отмечен ни на одном аккаунте — его письма берёт любой.",
    uz: "Belgilanganlarning birinchi xatlari faqat ularning akkauntlaridan ketadi — qaysi birida joy oldinroq bo‘shasa. Bir kishi bir nechta akkauntda ishlashi mumkin. Hech bir akkauntda belgilanmagan kishining xatlarini istalgan akkaunt oladi.",
    pl: "Pierwsze wiadomości zaznaczonych osób wychodzą tylko z ich kont — z tego, na którym wcześniej zwolni się miejsce. Jedna osoba może pracować na kilku kontach. Osoby niezaznaczonej na żadnym koncie wiadomości bierze dowolne konto.",
  },
  staffNone: {
    ru: "Никто не отмечен — аккаунт берёт письма всех, кто не привязан к другим аккаунтам.",
    uz: "Hech kim belgilanmagan — akkaunt boshqa akkauntlarga bog‘lanmagan hammaning xatlarini oladi.",
    pl: "Nikt nie jest zaznaczony — konto bierze wiadomości wszystkich, którzy nie są przypisani do innych kont.",
  },
  pause: { ru: "Пауза", uz: "Pauza", pl: "Wstrzymaj" },
  resume: { ru: "Вернуть в работу", uz: "Ishga qaytarish", pl: "Przywróć do pracy" },
  remove: { ru: "Отключить", uz: "O‘chirish", pl: "Odłącz" },
  online: { ru: "на связи", uz: "aloqada", pl: "połączone" },
  offline: {
    ru: "скаут не на связи этим аккаунтом",
    uz: "skaut bu akkaunt bilan aloqada emas",
    pl: "skaut nie jest połączony tym kontem",
  },
  flood: {
    ru: (until: string) => `Telegram ограничил первые письма до ${until}: переписка идёт, новые письма уходят с других аккаунтов`,
    uz: (until: string) => `Telegram ${until} gacha birinchi xatlarni chekladi: yozishma davom etadi, yangi xatlar boshqa akkauntlardan ketadi`,
    pl: (until: string) => `Telegram ograniczył pierwsze wiadomości do ${until}: korespondencja trwa, nowe wiadomości wychodzą z innych kont`,
  },
});

/** Ошибки входа (lib/admin/work-accounts, LoginError). */
export const loginErrorDict = defineDict({
  phone_invalid: {
    ru: "Telegram не знает такого номера — проверьте его",
    uz: "Telegram bunday raqamni bilmaydi — tekshirib ko‘ring",
    pl: "Telegram nie zna takiego numeru — sprawdź go",
  },
  phone_banned: {
    ru: "номер заблокирован в Telegram",
    uz: "raqam Telegramda bloklangan",
    pl: "numer jest zablokowany w Telegramie",
  },
  code_invalid: {
    ru: "код не подошёл — введите ещё раз",
    uz: "kod mos kelmadi — qaytadan kiriting",
    pl: "kod nie pasuje — wpisz ponownie",
  },
  code_expired: {
    ru: "код устарел — начните заново",
    uz: "kodning muddati o‘tgan — qaytadan boshlang",
    pl: "kod wygasł — zacznij od nowa",
  },
  password_invalid: {
    ru: "пароль не подошёл — введите ещё раз",
    uz: "parol mos kelmadi — qaytadan kiriting",
    pl: "hasło nie pasuje — wpisz ponownie",
  },
  flood: {
    ru: "Telegram просит подождать — попробуйте через час",
    uz: "Telegram kutishni so‘rayapti — bir soatdan keyin urinib ko‘ring",
    pl: "Telegram prosi o cierpliwość — spróbuj za godzinę",
  },
  other: {
    ru: "Telegram ответил ошибкой",
    uz: "Telegram xato bilan javob berdi",
    pl: "Telegram odpowiedział błędem",
  },
});

/** Ответ на нажатие (?r=). */
export const accountsResultDict = defineDict({
  bad_phone: {
    ru: "Номер не похож на телефон: нужен +998… или 9 цифр без кода страны.",
    uz: "Raqam telefonga o‘xshamaydi: +998… yoki mamlakat kodisiz 9 ta raqam kerak.",
    pl: "Numer nie wygląda na telefon: potrzebny +998… albo 9 cyfr bez kodu kraju.",
  },
  bad_code: {
    ru: "Код — это 5 или 6 цифр из сообщения Telegram.",
    uz: "Kod — Telegram xabaridagi 5 yoki 6 ta raqam.",
    pl: "Kod to 5 lub 6 cyfr z wiadomości od Telegrama.",
  },
  added: {
    ru: "Скаут просит код у Telegram — через несколько секунд здесь появится поле для кода.",
    uz: "Skaut Telegramdan kod so‘rayapti — bir necha soniyadan keyin bu yerda kod maydoni paydo bo‘ladi.",
    pl: "Skaut prosi Telegram o kod — za kilka sekund pojawi się tu pole na kod.",
  },
  stale: {
    ru: "Этот шаг уже прошёл — обновите страницу.",
    uz: "Bu qadam allaqachon o‘tdi — sahifani yangilang.",
    pl: "Ten krok już minął — odśwież stronę.",
  },
  failed: {
    ru: "Не получилось записать — попробуйте ещё раз.",
    uz: "Yozib bo‘lmadi — qaytadan urinib ko‘ring.",
    pl: "Nie udało się zapisać — spróbuj ponownie.",
  },
  ok: { ru: "Готово.", uz: "Tayyor.", pl: "Gotowe." },
});
