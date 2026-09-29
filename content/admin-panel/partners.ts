import { PANEL_INTL, defineDict, plural, type PanelLocale, type Tr } from "@/lib/admin/i18n";
import type { PromoFail, PromoReason } from "@/lib/partners/promo-files";
import type { PromoLocale } from "@/lib/partners/promo-rules";
import type { Perk } from "@/lib/partners/rules";

/**
 * Раздел «Партнёры» (/admin/partners) и его «Промо-материалы».
 *
 * Термины — по content/admin-panel/GLOSSARY.md: партнёр — «hamkor» /
 * «partner», выплата — «to‘lov» / «wypłata», кабинет партнёра — «hamkor
 * kabineti» / «panel partnera».
 *
 * Здесь только подписи панели. Сообщения партнёру в Telegram (о выплате, об
 * агентстве, о новом материале) и его кабинет на сайте — другой продукт со
 * своими словарями (content/partner-bot.ts, content/partner-cabinet.ts), и
 * их этот файл не трогает. Имена, реквизиты, заметки, названия агентств и
 * материалов — данные из базы, не переводятся.
 */

/** Сумма в долларах на языке панели: «1 500 $» — в том же виде, что `money`. */
export function usd(value: number | null, locale: PanelLocale): string {
  if (value === null) return "—";
  return `${value.toLocaleString(PANEL_INTL[locale])} $`;
}

/**
 * Ответ действия раздела: `?r=код`. Коды — свои (created, paid, rejected,
 * agency_*) и `reason` из lib/partners/store.ts. Тест panel-i18n-partners
 * сверяет, что каждый код из actions.ts здесь есть.
 */
export const partnersResultDict = defineDict({
  ok: { ru: "Готово.", uz: "Tayyor.", pl: "Gotowe." },
  created: {
    ru: "Партнёр заведён. Ссылка у него в /ref, когда напишет боту, — или отдайте ему код.",
    uz: "Hamkor qo‘shildi. Botga yozganida havolasi /ref da bo‘ladi — yoki unga kodni o‘zingiz bering.",
    pl: "Partner dodany. Link znajdzie w /ref, gdy napisze do bota — albo przekaż mu kod.",
  },
  paid: {
    ru: "Отмечено как выплаченное, партнёр получил сообщение.",
    uz: "To‘langan deb belgilandi, hamkorga xabar yuborildi.",
    pl: "Oznaczono jako wypłacone, partner dostał wiadomość.",
  },
  rejected: {
    ru: "Заявка отклонена, сумма вернулась партнёру в доступное.",
    uz: "So‘rov rad etildi, summa hamkorning mavjud balansiga qaytdi.",
    pl: "Wniosek odrzucony, kwota wróciła do dostępnych środków partnera.",
  },
  invalid: {
    ru: "Не разобрал: код — латиница и цифры от 3 до 24, процент — целое от 0 до 100, Telegram id — число.",
    uz: "Tushunmadim: kod — 3 dan 24 gacha lotin harflari va raqamlar, foiz — 0 dan 100 gacha butun son, Telegram id — son.",
    pl: "Nie rozumiem: kod — od 3 do 24 liter łacińskich i cyfr, procent — liczba całkowita od 0 do 100, Telegram id — liczba.",
  },
  taken: {
    ru: "Такой код или Telegram id уже есть.",
    uz: "Bunday kod yoki Telegram id allaqachon bor.",
    pl: "Taki kod lub Telegram id już istnieje.",
  },
  gone: {
    ru: "Такой записи уже нет — возможно, заявку уже решили.",
    uz: "Bunday yozuv endi yo‘q — ehtimol, so‘rov bo‘yicha qaror qabul qilingan.",
    pl: "Tego wpisu już nie ma — możliwe, że wniosek został już rozpatrzony.",
  },
  forbidden: {
    ru: "Это может только владелец.",
    uz: "Buni faqat egasi qila oladi.",
    pl: "To może zrobić tylko właściciel.",
  },
  failed: {
    ru: "Не получилось. Попробуйте ещё раз.",
    uz: "Bo‘lmadi. Yana bir bor urinib ko‘ring.",
    pl: "Nie udało się. Spróbuj ponownie.",
  },
  agency_active: {
    ru: "Агентство подключено: его заказы засчитываются партнёру. Партнёру ушло сообщение.",
    uz: "Agentlik ulandi: uning buyurtmalari hamkorga hisoblanadi. Hamkorga xabar yuborildi.",
    pl: "Agencja podłączona: jej zamówienia zaliczają się partnerowi. Partner dostał wiadomość.",
  },
  agency_rejected: {
    ru: "Агентство отклонено. Партнёру ушло сообщение с причиной.",
    uz: "Agentlik rad etildi. Hamkorga sababi bilan xabar yuborildi.",
    pl: "Agencja odrzucona. Partner dostał wiadomość z powodem.",
  },
  offline: { ru: "База недоступна.", uz: "Bazaga ulanib bo‘lmadi.", pl: "Baza danych jest niedostępna." },
});

/** Бонус клиенту по ссылке партнёра — подпись в колонке «Ссылки». */
export const perkDict: Record<Perk, Tr<string>> = {
  none: { ru: "без бонуса", uz: "bonussiz", pl: "bez bonusu" },
  disc_5: { ru: "скидка 5 % на первый проект", uz: "birinchi loyihaga 5 % chegirma", pl: "5 % rabatu na pierwszy projekt" },
  disc_10: { ru: "скидка 10 % на первый проект", uz: "birinchi loyihaga 10 % chegirma", pl: "10 % rabatu na pierwszy projekt" },
  disc_15: { ru: "скидка 15 % на первый проект", uz: "birinchi loyihaga 15 % chegirma", pl: "15 % rabatu na pierwszy projekt" },
};

export const partnersDict = defineDict({
  title: { ru: "Партнёры", uz: "Hamkorlar", pl: "Partnerzy" },
  intro: {
    ru: (tiers: string) =>
      `Приводят клиентов — получают процент по модели, которую выбрали сами: от чистой прибыли проекта или с оборота. Ступень — по сумме проекта: ${tiers}. Модель меняется не чаще раза в неделю и закрепляется за клиентом в день заявки. Клиент засчитывается партнёру, если оставил заявку в течение 30 дней после перехода по ссылке; заказы подключённого агентства — всегда. Начисление ждёт полной оплаты проекта. Заявку на выплату партнёр подаёт в кабинете или в боте (/payout), решаете вы здесь.`,
    uz: (tiers: string) =>
      `Mijoz olib keladi — o‘zi tanlagan model bo‘yicha foiz oladi: loyihaning sof foydasidan yoki aylanmadan. Pog‘ona loyiha summasiga qarab: ${tiers}. Modelni haftasiga bir martadan ko‘p o‘zgartirib bo‘lmaydi, mijozga esa u so‘rov qoldirgan kuni biriktiriladi. Mijoz hamkorga hisoblanadi, agar havola orqali o‘tgandan keyin 30 kun ichida so‘rov qoldirgan bo‘lsa; ulangan agentlik buyurtmalari — har doim. Hisoblanma loyiha to‘liq to‘languncha kutadi. To‘lov so‘rovini hamkor kabinetda yoki botda (/payout) yuboradi, qarorni siz shu yerda qabul qilasiz.`,
    pl: (tiers: string) =>
      `Przyprowadzają klientów — dostają procent według modelu, który sami wybrali: od czystego zysku projektu albo od obrotu. Próg zależy od kwoty projektu: ${tiers}. Model można zmienić najwyżej raz w tygodniu, a przy kliencie utrwala się w dniu zgłoszenia. Klient zalicza się partnerowi, jeśli zostawił zgłoszenie w ciągu 30 dni od wejścia z linku; zamówienia podłączonej agencji — zawsze. Naliczenie czeka na pełną płatność za projekt. Wniosek o wypłatę partner składa w panelu partnera lub w bocie (/payout), a decyzję podejmujesz tutaj.`,
  },
  tierUpTo: {
    ru: (sum: string, profit: number, turnover: number) => `до ${sum} — ${profit} / ${turnover} %`,
    uz: (sum: string, profit: number, turnover: number) => `${sum} gacha — ${profit} / ${turnover} %`,
    pl: (sum: string, profit: number, turnover: number) => `do ${sum} — ${profit} / ${turnover} %`,
  },
  tierAbove: {
    ru: (sum: string, profit: number, turnover: number) => `дороже ${sum} — ${profit} / ${turnover} %`,
    uz: (sum: string, profit: number, turnover: number) => `${sum} dan qimmat — ${profit} / ${turnover} %`,
    pl: (sum: string, profit: number, turnover: number) => `powyżej ${sum} — ${profit} / ${turnover} %`,
  },

  cardPartners: { ru: "Партнёров", uz: "Hamkorlar", pl: "Partnerzy" },
  withPaid: {
    ru: (n: number) => `${n} с оплаченными проектами`,
    uz: (n: number) => `${n} tasida to‘langan loyihalar bor`,
    pl: (n: number) => `${n} z opłaconymi projektami`,
  },
  frozen: { ru: "Заморожено", uz: "Muzlatilgan", pl: "Zamrożone" },
  frozenNote: {
    ru: "ждёт полной оплаты проектов",
    uz: "loyihalar to‘liq to‘lanishini kutmoqda",
    pl: "czeka na pełną płatność za projekty",
  },
  earned: { ru: "Заработано", uz: "Ishlab topilgan", pl: "Zarobione" },
  paidNote: {
    ru: (sum: string) => `выплачено ${sum}`,
    uz: (sum: string) => `to‘langan: ${sum}`,
    pl: (sum: string) => `wypłacono ${sum}`,
  },
  due: { ru: "К выплате", uz: "To‘lanadi", pl: "Do wypłaty" },
  inRequests: {
    ru: (sum: string) => `в заявках ${sum}`,
    uz: (sum: string) => `so‘rovlarda: ${sum}`,
    pl: (sum: string) => `we wnioskach ${sum}`,
  },

  promoTitle: { ru: "Промо-материалы", uz: "Promo-materiallar", pl: "Materiały promocyjne" },
  promoCount: {
    ru: (n: number) => `в кабинете партнёров: ${n} — ролики и картинки, которые они выкладывают со своей ссылкой`,
    uz: (n: number) => `hamkorlar kabinetida: ${n} ta — ular o‘z havolasi bilan joylaydigan roliklar va rasmlar`,
    pl: (n: number) => `w panelu partnerów: ${n} — filmy i grafiki, które publikują ze swoim linkiem`,
  },
  promoEmpty: {
    ru: "пока пусто — загрузите ролики и картинки, которые партнёры будут выкладывать со своей ссылкой",
    uz: "hozircha bo‘sh — hamkorlar o‘z havolasi bilan joylaydigan roliklar va rasmlarni yuklang",
    pl: "na razie pusto — wgraj filmy i grafiki, które partnerzy będą publikować ze swoim linkiem",
  },
  open: { ru: "открыть →", uz: "ochish →", pl: "otwórz →" },

  payoutsTitle: { ru: "Заявки на выплату", uz: "To‘lov so‘rovlari", pl: "Wnioski o wypłatę" },
  colWhen: { ru: "Когда", uz: "Qachon", pl: "Kiedy" },
  colWho: { ru: "Кто", uz: "Kim", pl: "Kto" },
  colAmount: { ru: "Сумма", uz: "Summa", pl: "Kwota" },
  colWhere: { ru: "Куда", uz: "Qayerga", pl: "Dokąd" },
  colDecision: { ru: "Решение", uz: "Qaror", pl: "Decyzja" },
  notePartnerPh: { ru: "заметка партнёру", uz: "hamkorga izoh", pl: "notatka dla partnera" },
  markPaid: { ru: "Выплачено", uz: "To‘landi", pl: "Wypłacono" },
  reject: { ru: "отклонить", uz: "rad etish", pl: "odrzuć" },
  noRequests: {
    ru: (min: string) => `Открытых заявок нет. Партнёр подаёт её командой /payout, когда доступно от ${min}.`,
    uz: (min: string) => `Ochiq so‘rovlar yo‘q. Mavjud summa ${min} ga yetganda hamkor /payout buyrug‘i bilan so‘rov yuboradi.`,
    pl: (min: string) => `Brak otwartych wniosków. Partner składa wniosek komendą /payout, gdy ma dostępne co najmniej ${min}.`,
  },

  agenciesTitle: { ru: "Агентства партнёров", uz: "Hamkorlar agentliklari", pl: "Agencje partnerów" },
  agenciesWaiting: {
    ru: (n: number) => `· ждут решения: ${n}`,
    uz: (n: number) => `· qaror kutmoqda: ${n}`,
    pl: (n: number) => `· czekają na decyzję: ${n}`,
  },
  agenciesAbout: {
    ru: "Партнёр подключает агентство или компанию, откуда регулярно идут заказы на разработку: IT-компанию, веб-студию, маркетинговое агентство, интегратора, генподрядчика тендеров. Подтвердите — и 12 месяцев все её заказы засчитываются партнёру, без ограничения в 30 дней: заявки узнаются по контакту и названию компании, а проект, заведённый руками, привязывается в карточке проекта, блок «Партнёр». Отклоняйте, если компания уже работает с нами. Срок вышел — новые заказы идут как обычные; «Продлить на 12 месяцев» начинает новый срок с сегодняшнего дня.",
    uz: "Hamkor ishlab chiqishga muntazam buyurtma keladigan agentlik yoki kompaniyani ulaydi: IT-kompaniya, veb-studiya, marketing agentligi, integrator, tenderlar bosh pudratchisi. Tasdiqlang — 12 oy davomida uning barcha buyurtmalari 30 kunlik cheklovsiz hamkorga hisoblanadi: so‘rovlar kontakt va kompaniya nomi bo‘yicha aniqlanadi, qo‘lda ochilgan loyiha esa loyiha kartochkasidagi «Hamkor» blokida bog‘lanadi. Agar kompaniya biz bilan allaqachon ishlayotgan bo‘lsa, rad eting. Muddat tugasa — yangi buyurtmalar oddiy tartibda o‘tadi; «12 oyga uzaytirish» yangi muddatni bugundan boshlaydi.",
    pl: "Partner podłącza agencję lub firmę, z której regularnie przychodzą zamówienia na development: firmę IT, studio webowe, agencję marketingową, integratora, generalnego wykonawcę przetargów. Zatwierdź — i przez 12 miesięcy wszystkie jej zamówienia zaliczają się partnerowi, bez limitu 30 dni: zgłoszenia są rozpoznawane po danych kontaktowych i nazwie firmy, a projekt dodany ręcznie wiąże się w karcie projektu, blok „Partner”. Odrzuć, jeśli firma już z nami współpracuje. Gdy termin minie, nowe zamówienia idą jak zwykłe; „Przedłuż o 12 miesięcy” zaczyna nowy termin od dziś.",
  },
  colAgency: { ru: "Агентство", uz: "Agentlik", pl: "Agencja" },
  colContact: { ru: "Контакт", uz: "Kontakt", pl: "Dane kontaktowe" },
  colPartner: { ru: "Партнёр", uz: "Hamkor", pl: "Partner" },
  colStatus: { ru: "Статус", uz: "Holat", pl: "Status" },
  agencyActive: {
    ru: (since: string, until: string) => `подключено ${since} · заказы партнёру до ${until}`,
    uz: (since: string, until: string) => `ulangan ${since} · buyurtmalar hamkorga ${until} gacha`,
    pl: (since: string, until: string) => `podłączona ${since} · zamówienia dla partnera do ${until}`,
  },
  agencyExpired: {
    ru: (until: string) => `срок вышел ${until} — новые заказы не засчитываются`,
    uz: (until: string) => `muddat ${until} da tugagan — yangi buyurtmalar hisoblanmaydi`,
    pl: (until: string) => `termin minął ${until} — nowe zamówienia się nie liczą`,
  },
  agencyRejected: {
    ru: (note: string) => `отклонено${note ? `: ${note}` : ""}`,
    uz: (note: string) => `rad etilgan${note ? `: ${note}` : ""}`,
    pl: (note: string) => `odrzucona${note ? `: ${note}` : ""}`,
  },
  agencyPending: {
    ru: (date: string) => `ждёт решения · ${date}`,
    uz: (date: string) => `qaror kutmoqda · ${date}`,
    pl: (date: string) => `czeka na decyzję · ${date}`,
  },
  confirm: { ru: "Подтвердить", uz: "Tasdiqlash", pl: "Zatwierdź" },
  extend: { ru: "Продлить на 12 месяцев", uz: "12 oyga uzaytirish", pl: "Przedłuż o 12 miesięcy" },
  reasonPh: { ru: "причина — партнёру", uz: "sabab — hamkorga", pl: "powód — dla partnera" },
  disconnect: { ru: "отключить", uz: "o‘chirish", pl: "odłącz" },
  noAgencies: {
    ru: "Агентств пока нет. Партнёр подключает их в кабинете на сайте.",
    uz: "Hozircha agentliklar yo‘q. Hamkor ularni saytdagi kabinetida ulaydi.",
    pl: "Na razie brak agencji. Partner podłącza je w swoim panelu na stronie.",
  },

  allTitle: { ru: "Все партнёры", uz: "Barcha hamkorlar", pl: "Wszyscy partnerzy" },
  colLinks: { ru: "Ссылки", uz: "Havolalar", pl: "Linki" },
  colRate: { ru: "Ставка", uz: "Stavka", pl: "Stawka" },
  colClients: { ru: "Клиентов", uz: "Mijozlar", pl: "Klienci" },
  colProjects: { ru: "Проектов", uz: "Loyihalar", pl: "Projekty" },
  colPaid: { ru: "Выплачено", uz: "To‘langan", pl: "Wypłacone" },
  colAvailable: { ru: "Доступно", uz: "Mavjud", pl: "Dostępne" },
  colEdit: { ru: "Правки", uz: "Tahrirlash", pl: "Edycja" },
  blocked: { ru: "заблокирован", uz: "bloklangan", pl: "zablokowany" },
  active: { ru: "активен", uz: "faol", pl: "aktywny" },
  noTelegram: { ru: "без Telegram", uz: "Telegramsiz", pl: "bez Telegrama" },
  since: {
    ru: (date: string) => `с ${date}`,
    uz: (date: string) => `${date} dan beri`,
    pl: (date: string) => `od ${date}`,
  },
  turnover: { ru: "с оборота", uz: "aylanmadan", pl: "od obrotu" },
  profit: { ru: "от прибыли", uz: "foydadan", pl: "od zysku" },
  personal: { ru: "персональная", uz: "shaxsiy", pl: "indywidualna" },
  modelChanged: {
    ru: (date: string) => ` · сменил ${date}`,
    uz: (date: string) => ` · ${date} da o‘zgartirgan`,
    pl: (date: string) => ` · zmienił ${date}`,
  },
  paidOfAll: { ru: "оплачено / всего", uz: "to‘langan / jami", pl: "opłacone / łącznie" },
  inRequest: {
    ru: (sum: string) => `в заявке ${sum}`,
    uz: (sum: string) => `so‘rovda: ${sum}`,
    pl: (sum: string) => `we wniosku ${sum}`,
  },
  byTierPh: { ru: "по ступени", uz: "pog‘ona bo‘yicha", pl: "wg progu" },
  personalRate: { ru: "Персональная ставка, %", uz: "Shaxsiy stavka, %", pl: "Indywidualna stawka, %" },
  requisitesPh: { ru: "реквизиты", uz: "rekvizitlar", pl: "dane do przelewu" },
  noteTermsPh: { ru: "заметка: условия, откуда", uz: "izoh: shartlar, qayerdan", pl: "notatka: warunki, skąd" },
  save: { ru: "сохранить", uz: "saqlash", pl: "zapisz" },
  noPartners: {
    ru: "Партнёров пока нет. Любой, кто напишет боту /ref, станет партнёром сам — или заведите руками ниже.",
    uz: "Hozircha hamkorlar yo‘q. Botga /ref deb yozgan har kim o‘zi hamkor bo‘ladi — yoki quyida qo‘lda qo‘shing.",
    pl: "Na razie brak partnerów. Każdy, kto napisze do bota /ref, sam zostanie partnerem — albo dodaj go ręcznie poniżej.",
  },

  addTitle: { ru: "Завести партнёра руками", uz: "Hamkorni qo‘lda qo‘shish", pl: "Dodaj partnera ręcznie" },
  addAbout: {
    ru: "Для блогера или агентства, с кем договорились до того, как они написали боту. Telegram id необязателен: без него человек не получит уведомлений и не подаст заявку сам, но код и ссылка будут работать.",
    uz: "Botga yozishidan oldin kelishib olingan bloger yoki agentlik uchun. Telegram id majburiy emas: usiz odam bildirishnomalar olmaydi va so‘rovni o‘zi yubora olmaydi, lekin kod va havola ishlaydi.",
    pl: "Dla blogera lub agencji, z którymi umówiliśmy się, zanim napisali do bota. Telegram id jest opcjonalny: bez niego osoba nie dostanie powiadomień i nie złoży wniosku sama, ale kod i link będą działać.",
  },
  name: { ru: "Имя", uz: "Ism", pl: "Imię" },
  code: { ru: "Код (пусто — придумаем)", uz: "Kod (bo‘sh bo‘lsa — o‘zimiz o‘ylab topamiz)", pl: "Kod (puste — wymyślimy)" },
  optional: { ru: "необязательно", uz: "ixtiyoriy", pl: "opcjonalnie" },
  note: { ru: "Заметка", uz: "Izoh", pl: "Notatka" },
  termsPh: { ru: "условия, откуда", uz: "shartlar, qayerdan", pl: "warunki, skąd" },
  add: { ru: "Завести", uz: "Qo‘shish", pl: "Dodaj" },

  howTitle: { ru: "Как считается.", uz: "Qanday hisoblanadi.", pl: "Jak to się liczy." },
  howBody: {
    ru: "Процент — от чистой прибыли проекта (сумма − налог − себестоимость), по проектам клиентов, пришедших по ссылке партнёра. Процент по конкретному проекту можно задать на странице проекта. Не засчитывается, если партнёр привёл сам себя или клиент уже был у студии до ссылки — причина видна на проекте.",
    uz: "Foiz — hamkor havolasi orqali kelgan mijozlar loyihalarining sof foydasidan (summa − soliq − tannarx). Muayyan loyiha bo‘yicha foizni loyiha sahifasida belgilash mumkin. Agar hamkor o‘zini o‘zi olib kelgan bo‘lsa yoki mijoz havoladan oldin studiyada bo‘lgan bo‘lsa, hisoblanmaydi — sababi loyihada ko‘rinadi.",
    pl: "Procent — od czystego zysku projektu (kwota − podatek − koszt własny), od projektów klientów, którzy przyszli z linku partnera. Procent dla konkretnego projektu można ustawić na stronie projektu. Nie zalicza się, jeśli partner przyprowadził sam siebie albo klient był już w studiu przed linkiem — powód widać na projekcie.",
  },
  payoutsHowTitle: { ru: "Выплаты.", uz: "To‘lovlar.", pl: "Wypłaty." },
  payoutsHow: {
    ru: (min: string) =>
      `Партнёр подаёт заявку в боте с первого рабочего дня месяца, минимум ${min}. Вы переводите деньги и нажимаете «Выплачено» — партнёр получает сообщение. Публичная страница программы:`,
    uz: (min: string) =>
      `Hamkor so‘rovni oyning birinchi ish kunidan boshlab botda yuboradi, kamida ${min}. Siz pulni o‘tkazasiz va «To‘landi» tugmasini bosasiz — hamkor xabar oladi. Dasturning ochiq sahifasi:`,
    pl: (min: string) =>
      `Partner składa wniosek w bocie od pierwszego dnia roboczego miesiąca, minimum ${min}. Przelewasz pieniądze i klikasz „Wypłacono” — partner dostaje wiadomość. Publiczna strona programu:`,
  },
});

/* ── Промо-материалы ────────────────────────────────────────────────────── */

export const promoResultDict = defineDict({
  saved: {
    ru: "Сохранено. Партнёры видят новое название и подпись.",
    uz: "Saqlandi. Hamkorlar yangi nom va izohni ko‘radi.",
    pl: "Zapisano. Partnerzy widzą nową nazwę i podpis.",
  },
  hidden: {
    ru: "Скрыто: партнёры материал больше не видят и не скачают. Вернуть — «Показать партнёрам».",
    uz: "Yashirildi: hamkorlar materialni endi ko‘rmaydi va yuklab ololmaydi. Qaytarish — «Hamkorlarga ko‘rsatish».",
    pl: "Ukryto: partnerzy nie widzą już materiału i go nie pobiorą. Przywrócić — „Pokaż partnerom”.",
  },
  shown: {
    ru: "Материал снова в кабинете партнёров.",
    uz: "Material yana hamkorlar kabinetida.",
    pl: "Materiał znów jest w panelu partnerów.",
  },
  deleted: {
    ru: "Удалено вместе с файлом. Уже скачанные партнёрами копии остаются у них.",
    uz: "Fayli bilan birga o‘chirildi. Hamkorlar yuklab olgan nusxalar ularda qoladi.",
    pl: "Usunięto razem z plikiem. Kopie już pobrane przez partnerów zostają u nich.",
  },
  invalid: { ru: "Название — от двух знаков.", uz: "Nomi — kamida ikki belgi.", pl: "Nazwa — co najmniej dwa znaki." },
  gone: { ru: "Такого материала уже нет.", uz: "Bunday material endi yo‘q.", pl: "Tego materiału już nie ma." },
  offline: { ru: "База недоступна.", uz: "Bazaga ulanib bo‘lmadi.", pl: "Baza danych jest niedostępna." },
  failed: {
    ru: "Не получилось. Попробуйте ещё раз.",
    uz: "Bo‘lmadi. Yana bir bor urinib ko‘ring.",
    pl: "Nie udało się. Spróbuj ponownie.",
  },
});

/** Язык слов в ролике. */
export const promoLocaleDict: Record<PromoLocale, Tr<string>> = {
  all: { ru: "без слов", uz: "so‘zsiz", pl: "bez słów" },
  ru: { ru: "русский", uz: "rus tili", pl: "rosyjski" },
  uz: { ru: "узбекский", uz: "o‘zbek tili", pl: "uzbecki" },
  en: { ru: "английский", uz: "ingliz tili", pl: "angielski" },
  zh: { ru: "китайский", uz: "xitoy tili", pl: "chiński" },
};

export const promoDict = defineDict({
  back: { ru: "← Партнёры", uz: "← Hamkorlar", pl: "← Partnerzy" },
  intro: {
    ru: "Ролики и картинки студии, которые партнёры берут в кабинете и выкладывают у себя: в Reels, Shorts, TikTok, сторис, каналы. Под каждым материалом у партнёра — «Скачать» и подпись к посту, в которую уже вставлена его короткая ссылка. Клиенты, пришедшие по ней, засчитываются партнёру, как по любой его ссылке. Файлы лежат на нашем сервере, до 500 МБ каждый.",
    uz: "Studiyaning roliklari va rasmlari: hamkorlar ularni kabinetdan olib, o‘zlarida joylaydi — Reels, Shorts, TikTok, stories, kanallarda. Har bir material ostida hamkorda «Yuklab olish» tugmasi va uning qisqa havolasi qo‘yilgan post izohi bor. Shu havola orqali kelgan mijozlar hamkorga uning boshqa havolalari kabi hisoblanadi. Fayllar bizning serverda, har biri 500 MB gacha.",
    pl: "Filmy i grafiki studia, które partnerzy biorą ze swojego panelu i publikują u siebie: w Reels, Shorts, TikToku, relacjach, kanałach. Pod każdym materiałem partner ma „Pobierz” i podpis do posta z już wstawionym jego krótkim linkiem. Klienci, którzy przyjdą z tego linku, zaliczają się partnerowi jak z każdego jego linku. Pliki leżą na naszym serwerze, do 500 MB każdy.",
  },
  upload: { ru: "Загрузить", uz: "Yuklash", pl: "Wgraj" },
  inCabinet: {
    ru: (n: number) => `В кабинете партнёров · ${n}`,
    uz: (n: number) => `Hamkorlar kabinetida · ${n}`,
    pl: (n: number) => `W panelu partnerów · ${n}`,
  },
  hiddenCount: {
    ru: (n: number) => ` · скрыто ${n}`,
    uz: (n: number) => ` · yashirilgan: ${n}`,
    pl: (n: number) => ` · ukryte: ${n}`,
  },
  vertical: { ru: "вертикальное 9:16", uz: "vertikal 9:16", pl: "pionowy 9:16" },
  square: { ru: "квадрат", uz: "kvadrat", pl: "kwadrat" },
  horizontal: { ru: "горизонтальное 16:9", uz: "gorizontal 16:9", pl: "poziomy 16:9" },
  seconds: {
    ru: (n: number) => `${n} с`,
    uz: (n: number) => `${n} s`,
    pl: (n: number) => `${n} s`,
  },
  mb: { ru: "МБ", uz: "MB", pl: "MB" },
  hiddenFromPartners: { ru: "скрыто от партнёров · ", uz: "hamkorlardan yashirilgan · ", pl: "ukryte przed partnerami · " },
  downloaded: {
    ru: (times: number, partners: number) => `скачали ${times} раз · партнёров: ${partners}`,
    uz: (times: number, partners: number) => `${times} marta yuklab olingan · hamkorlar: ${partners}`,
    pl: (times: number, partners: number) =>
      `pobrano ${times} ${plural("pl", times, "raz", "razy", "razy")} · partnerów: ${partners}`,
  },
  notDownloaded: { ru: "ещё не скачивали", uz: "hali yuklab olinmagan", pl: "jeszcze nie pobierano" },
  posted: {
    ru: (date: string) => ` · выложено ${date}`,
    uz: (date: string) => ` · joylangan: ${date}`,
    pl: (date: string) => ` · dodano ${date}`,
  },
  titleLabel: { ru: "Название", uz: "Nomi", pl: "Nazwa" },
  langLabel: { ru: "Язык", uz: "Til", pl: "Język" },
  captionPh: {
    ru: (example: string) => `Пусто — подпись по умолчанию: ${example}`,
    uz: (example: string) => `Bo‘sh bo‘lsa — standart izoh: ${example}`,
    pl: (example: string) => `Puste — domyślny podpis: ${example}`,
  },
  captionLabel: { ru: "Подпись к посту", uz: "Post uchun izoh", pl: "Podpis do posta" },
  save: { ru: "сохранить", uz: "saqlash", pl: "zapisz" },
  show: { ru: "Показать партнёрам", uz: "Hamkorlarga ko‘rsatish", pl: "Pokaż partnerom" },
  hide: { ru: "Скрыть от партнёров", uz: "Hamkorlardan yashirish", pl: "Ukryj przed partnerami" },
  remove: { ru: "удалить", uz: "o‘chirish", pl: "usuń" },
  removeForever: { ru: "Удалить насовсем", uz: "Butunlay o‘chirish", pl: "Usuń na stałe" },
  empty: {
    ru: "Материалов пока нет — партнёры не видят этот блок в кабинете вовсе. Загрузите первый ролик выше.",
    uz: "Hozircha materiallar yo‘q — hamkorlar kabinetda bu blokni umuman ko‘rmaydi. Birinchi rolikni yuqorida yuklang.",
    pl: "Na razie brak materiałów — partnerzy w ogóle nie widzą tego bloku w panelu. Wgraj pierwszy film powyżej.",
  },
});

/** Форма загрузки (components/admin/promo-upload.tsx). */
export const promoUploadDict = defineDict({
  chooseFile: { ru: "Выберите файл.", uz: "Faylni tanlang.", pl: "Wybierz plik." },
  wrongType: {
    ru: "Нужен ролик MP4, MOV или WebM или картинка PNG, JPG, WebP, GIF.",
    uz: "MP4, MOV yoki WebM rolik yoxud PNG, JPG, WebP, GIF rasm kerak.",
    pl: "Potrzebny jest film MP4, MOV lub WebM albo grafika PNG, JPG, WebP, GIF.",
  },
  tooBig: {
    ru: "Файл больше 500 МБ. Сожмите ролик и попробуйте снова.",
    uz: "Fayl 500 MB dan katta. Rolikni siqib, qaytadan urinib ko‘ring.",
    pl: "Plik jest większy niż 500 MB. Skompresuj film i spróbuj ponownie.",
  },
  reading: { ru: "Читаю файл…", uz: "Fayl o‘qilmoqda…", pl: "Odczytuję plik…" },
  preparing: { ru: "Готовлю место на сервере…", uz: "Serverda joy tayyorlanmoqda…", pl: "Przygotowuję miejsce na serwerze…" },
  uploading: { ru: "Загружаю…", uz: "Yuklanmoqda…", pl: "Wysyłam…" },
  notUploaded: {
    ru: (reason: string) => `Файл не загрузился: ${reason} Попробуйте ещё раз.`,
    uz: (reason: string) => `Fayl yuklanmadi: ${reason} Yana bir bor urinib ko‘ring.`,
    pl: (reason: string) => `Plik się nie wgrał: ${reason} Spróbuj ponownie.`,
  },
  writing: { ru: "Записываю…", uz: "Saqlanmoqda…", pl: "Zapisuję…" },
  doneNotify: {
    ru: "Готово: материал в кабинете партнёров, бот рассылает им сообщение.",
    uz: "Tayyor: material hamkorlar kabinetida, bot ularga xabar yubormoqda.",
    pl: "Gotowe: materiał jest w panelu partnerów, bot wysyła im wiadomość.",
  },
  done: {
    ru: "Готово: материал в кабинете партнёров.",
    uz: "Tayyor: material hamkorlar kabinetida.",
    pl: "Gotowe: materiał jest w panelu partnerów.",
  },
  fileLabel: {
    ru: "Файл — ролик MP4, MOV, WebM или картинка, до 500 МБ",
    uz: "Fayl — MP4, MOV, WebM rolik yoki rasm, 500 MB gacha",
    pl: "Plik — film MP4, MOV, WebM lub grafika, do 500 MB",
  },
  titleLabel: { ru: "Название — его видят партнёры", uz: "Nomi — uni hamkorlar ko‘radi", pl: "Nazwa — widzą ją partnerzy" },
  titlePh: { ru: "Ролик «Кто мы» за 28 секунд", uz: "«Biz kimmiz» roligi, 28 soniya", pl: "Film „Kim jesteśmy” w 28 sekund" },
  langLabel: { ru: "Язык слов в ролике", uz: "Rolikdagi so‘zlar tili", pl: "Język słów w filmie" },
  captionLabel: {
    ru: "Подпись к посту — {link} станет короткой ссылкой партнёра. Пусто — подпись по умолчанию на языке партнёра",
    uz: "Post uchun izoh — {link} hamkorning qisqa havolasiga aylanadi. Bo‘sh bo‘lsa — hamkor tilidagi standart izoh",
    pl: "Podpis do posta — {link} zamieni się w krótki link partnera. Puste — domyślny podpis w języku partnera",
  },
  notify: {
    ru: "Сообщить партнёрам в Telegram, что появился новый материал",
    uz: "Hamkorlarga Telegramda yangi material paydo bo‘lgani haqida xabar berish",
    pl: "Powiadom partnerów w Telegramie, że pojawił się nowy materiał",
  },
  busy: { ru: "Идёт загрузка…", uz: "Yuklanmoqda…", pl: "Trwa wysyłanie…" },
  upload: { ru: "Загрузить", uz: "Yuklash", pl: "Wgraj" },
});

/**
 * Почему файл не принят: коды из lib/partners/promo-files.ts. В `detail` —
 * только данные (числа, ответ сервера), они подставляются как есть.
 */
export const promoFailDict: Record<PromoReason, Tr<(detail: string) => string>> = {
  bad_type: {
    ru: () => "Такой файл не примем: нужен ролик MP4, MOV или WebM или картинка PNG, JPG, WebP, GIF.",
    uz: () => "Bunday faylni qabul qilmaymiz: MP4, MOV yoki WebM rolik yoxud PNG, JPG, WebP, GIF rasm kerak.",
    pl: () => "Takiego pliku nie przyjmiemy: potrzebny jest film MP4, MOV lub WebM albo grafika PNG, JPG, WebP, GIF.",
  },
  empty: { ru: () => "Файл пустой.", uz: () => "Fayl bo‘sh.", pl: () => "Plik jest pusty." },
  too_big: {
    ru: () => "Файл больше 500 МБ. Сожмите ролик: 1080×1920, H.264, 8–10 Мбит/с — минута займёт около 70 МБ.",
    uz: () => "Fayl 500 MB dan katta. Rolikni siqing: 1080×1920, H.264, 8–10 Mbit/s — bir daqiqa taxminan 70 MB bo‘ladi.",
    pl: () => "Plik jest większy niż 500 MB. Skompresuj film: 1080×1920, H.264, 8–10 Mb/s — minuta zajmie około 70 MB.",
  },
  no_path: {
    ru: () => "Не получилось придумать путь файла.",
    uz: () => "Fayl uchun yo‘l tuzib bo‘lmadi.",
    pl: () => "Nie udało się utworzyć ścieżki pliku.",
  },
  bad_upload: { ru: () => "Не разобрал загрузку.", uz: () => "Yuklashni tushunmadim.", pl: () => "Nie rozpoznano wysyłki." },
  bad_size: {
    ru: () => "Файл больше 500 МБ или пустой.",
    uz: () => "Fayl 500 MB dan katta yoki bo‘sh.",
    pl: () => "Plik jest większy niż 500 MB albo pusty.",
  },
  no_space: {
    ru: (free) => `На сервере мало места: свободно ${free} ГБ, а после загрузки должно остаться не меньше 2 ГБ.`,
    uz: (free) => `Serverda joy kam: ${free} GB bo‘sh, yuklashdan keyin esa kamida 2 GB qolishi kerak.`,
    pl: (free) => `Na serwerze jest mało miejsca: wolne ${free} GB, a po wysłaniu musi zostać co najmniej 2 GB.`,
  },
  server_start: {
    ru: (error) => `Сервер не смог завести файл: ${error}`,
    uz: (error) => `Server faylni ocha olmadi: ${error}`,
    pl: (error) => `Serwer nie mógł utworzyć pliku: ${error}`,
  },
  server_chunk: {
    ru: (error) => `Сервер не записал кусок: ${error}`,
    uz: (error) => `Server bo‘lakni yoza olmadi: ${error}`,
    pl: (error) => `Serwer nie zapisał fragmentu: ${error}`,
  },
  server_move: {
    ru: (error) => `Сервер не переложил файл: ${error}`,
    uz: (error) => `Server faylni ko‘chira olmadi: ${error}`,
    pl: (error) => `Serwer nie przeniósł pliku: ${error}`,
  },
  lost: {
    ru: () => "Загрузка не найдена — начните заново.",
    uz: () => "Yuklash topilmadi — qaytadan boshlang.",
    pl: () => "Nie znaleziono wysyłki — zacznij od nowa.",
  },
  chunk_size: { ru: () => "Кусок файла не того размера.", uz: () => "Fayl bo‘lagi hajmi noto‘g‘ri.", pl: () => "Fragment pliku ma zły rozmiar." },
  chunk_order: {
    ru: (bytes) => `Кусок пришёл не по порядку (байт ${bytes}).`,
    uz: (bytes) => `Bo‘lak navbatsiz keldi (bayt ${bytes}).`,
    pl: (bytes) => `Fragment przyszedł nie po kolei (bajt ${bytes}).`,
  },
  overflow: {
    ru: () => "Файл вышел больше заявленного размера.",
    uz: () => "Fayl e’lon qilingan hajmdan katta chiqdi.",
    pl: () => "Plik okazał się większy niż zadeklarowany rozmiar.",
  },
  incomplete: {
    ru: (bytes) => `Файл дошёл не целиком: ${bytes} байт.`,
    uz: (bytes) => `Fayl to‘liq yetib kelmadi: ${bytes} bayt.`,
    pl: (bytes) => `Plik nie dotarł w całości: ${bytes} bajtów.`,
  },
  signature: {
    ru: () => "Внутри файла не то, что в его названии: ни ролик, ни картинка.",
    uz: () => "Fayl ichida nomidagi narsa emas: na rolik, na rasm.",
    pl: () => "W środku pliku jest coś innego niż w nazwie: ani film, ani grafika.",
  },
  foreign_path: { ru: () => "Путь файла не наш.", uz: () => "Fayl yo‘li bizniki emas.", pl: () => "Ścieżka pliku nie jest nasza." },
  title: {
    ru: () => "Назовите материал — хотя бы два знака.",
    uz: () => "Materialga nom bering — kamida ikki belgi.",
    pl: () => "Nazwij materiał — co najmniej dwa znaki.",
  },
  offline: { ru: () => "База недоступна.", uz: () => "Bazaga ulanib bo‘lmadi.", pl: () => "Baza danych jest niedostępna." },
  failed: {
    ru: (error) => `Не записал материал${error ? `: ${error}` : "."}`,
    uz: (error) => `Materialni saqlab bo‘lmadi${error ? `: ${error}` : "."}`,
    pl: (error) => `Nie zapisano materiału${error ? `: ${error}` : "."}`,
  },
  chunk_missing: { ru: () => "Кусок файла не дошёл.", uz: () => "Fayl bo‘lagi yetib kelmadi.", pl: () => "Fragment pliku nie dotarł." },
  network: {
    ru: (error) => `связь оборвалась${error ? ` (${error})` : ""}.`,
    uz: (error) => `aloqa uzildi${error ? ` (${error})` : ""}.`,
    pl: (error) => `połączenie zostało przerwane${error ? ` (${error})` : ""}.`,
  },
};

/** Причина отказа на языке панели. Незнакомый код — общее «не получилось». */
export function promoFailText(fail: Pick<PromoFail, "reason" | "detail">, locale: PanelLocale): string {
  const entry = promoFailDict[fail.reason] ?? promoFailDict.failed;
  return entry[locale](fail.detail ?? "");
}
