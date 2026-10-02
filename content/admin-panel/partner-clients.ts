import { defineDict } from "@/lib/admin/i18n";

/**
 * Клиенты, закреплённые партнёрами вручную по ИНН, и выплаты с оборота.
 *
 * Блок в «Партнёрах» (только владелец) и строки в карточке лида: «Клиент
 * партнёра …» и поле ИНН. Как это работает — lib/partners/rules.ts, раздел
 * «Клиенты партнёра», и инструкция content/admin-help-*.ts.
 */
export const partnerClientsDict = defineDict({
  title: {
    ru: "Клиенты, закреплённые партнёрами",
    uz: "Hamkorlar biriktirgan mijozlar",
    pl: "Klienci przypisani przez partnerów",
  },
  lead: {
    ru: "Партнёр приводит компанию сам, без ссылки, и закрепляет её в кабинете: название, контакт и ИНН, если знает. Закрепление действует сразу: база уже проверила, что компании нет среди лидов, проектов, договоров и «Касаний» и её не закрепил другой партнёр. Сверка — по названию; если такое название уже есть, решает ИНН: разный ИНН — разные компании, без ИНН партнёра просят его указать. Совпавший телефон, Telegram или сайт — та же компания при любом ИНН. 90 дней ждём первой заявки от клиента — заявка узнаётся по ИНН, названию, телефону, Telegram или сайту. Пришла — заказы клиента 12 месяцев засчитываются партнёру. Не пришла — закрепление истекает само. Видите, что компания на самом деле наша, — отмените с причиной: партнёр получит её в боте.",
    uz: "Hamkor kompaniyani havolasiz, o‘zi olib keladi va kabinetda biriktiradi: nomi, kontakt va bilsa — STIR. Biriktirish darhol kuchga kiradi: baza kompaniya lidlar, loyihalar, shartnomalar va «Aloqalar» orasida yo‘qligini va uni boshqa hamkor biriktirmaganini tekshirgan. Solishtirish — nom bo‘yicha; bunday nom allaqachon bo‘lsa, STIR hal qiladi: STIR boshqa — kompaniyalar boshqa, STIRsiz hamkordan uni kiritish so‘raladi. Telefon, Telegram yoki sayt mos kelsa — STIR qanday bo‘lmasin, o‘sha kompaniya. Mijozdan birinchi so‘rovni 90 kun kutamiz — so‘rov STIR, nom, telefon, Telegram yoki sayt bo‘yicha taniladi. Kelsa — mijozning buyurtmalari 12 oy hamkorga hisoblanadi. Kelmasa — biriktirish o‘zi tugaydi. Kompaniya aslida bizniki ekanini ko‘rsangiz — sababini yozib bekor qiling: hamkor uni botda oladi.",
    pl: "Partner sam przyprowadza firmę, bez linku, i przypisuje ją w panelu partnera: nazwa, kontakt i NIP/INN, jeśli go zna. Przypisanie działa od razu: baza sprawdziła już, że firmy nie ma wśród leadów, projektów, umów i «Kontakty» i nie przypisał jej inny partner. Porównujemy po nazwie; jeśli taka nazwa już jest, decyduje NIP/INN: inny NIP/INN — różne firmy, bez niego prosimy partnera o jego podanie. Zgodny telefon, Telegram lub strona — ta sama firma przy dowolnym NIP/INN. Przez 90 dni czekamy na pierwsze zapytanie klienta — rozpoznajemy je po NIP/INN, nazwie, telefonie, Telegramie lub stronie. Przyszło — zamówienia klienta przez 12 miesięcy zaliczają się partnerowi. Nie przyszło — przypisanie wygasa samo. Jeśli widzisz, że firma jest w rzeczywistości nasza, anuluj z podaniem powodu: partner dostanie go w bocie.",
  },
  colClient: { ru: "Компания", uz: "Kompaniya", pl: "Firma" },
  colContact: { ru: "Связь", uz: "Aloqa", pl: "Kontakt" },
  colPartner: { ru: "Кто закрепил", uz: "Kim biriktirgan", pl: "Kto przypisał" },
  colStatus: { ru: "Срок закрепления", uz: "Biriktirish muddati", pl: "Termin przypisania" },
  colAction: { ru: "Отмена", uz: "Bekor qilish", pl: "Anulowanie" },
  inn: { ru: "ИНН", uz: "STIR", pl: "NIP/INN" },
  since: {
    ru: (date: string) => `закреплён ${date}`,
    uz: (date: string) => `${date} biriktirilgan`,
    pl: (date: string) => `przypisany ${date}`,
  },
  waiting: {
    ru: (date: string) => `ждёт первой заявки до ${date}`,
    uz: (date: string) => `birinchi so‘rovni ${date} gacha kutmoqda`,
    pl: (date: string) => `czeka na pierwsze zapytanie do ${date}`,
  },
  active: {
    ru: (date: string) => `заявка пришла · заказы партнёру до ${date}`,
    uz: (date: string) => `so‘rov keldi · buyurtmalar ${date} gacha hamkorga`,
    pl: (date: string) => `zapytanie przyszło · zamówienia dla partnera do ${date}`,
  },
  expired: {
    ru: "срок вышел — новые заказы не засчитываются",
    uz: "muddat tugadi — yangi buyurtmalar hisoblanmaydi",
    pl: "termin minął — nowe zamówienia nie są zaliczane",
  },
  cancelled: {
    ru: (note: string) => `отменено: ${note}`,
    uz: (note: string) => `bekor qilindi: ${note}`,
    pl: (note: string) => `anulowano: ${note}`,
  },
  cancelNote: { ru: "причина — партнёру", uz: "sabab — hamkorga", pl: "powód — dla partnera" },
  cancel: { ru: "отменить закрепление", uz: "biriktirishni bekor qilish", pl: "anuluj przypisanie" },
  empty: {
    ru: "Закреплённых клиентов пока нет. Партнёр закрепляет их в кабинете на сайте, раздел «Мои клиенты».",
    uz: "Hozircha biriktirilgan mijozlar yo‘q. Hamkor ularni saytdagi kabinetda, «Mening mijozlarim» bo‘limida biriktiradi.",
    pl: "Nie ma jeszcze przypisanych klientów. Partner przypisuje ich w swoim panelu na stronie, sekcja «Moi klienci».",
  },
  resultCancelled: {
    ru: "Закрепление отменено. Партнёру ушло сообщение с причиной.",
    uz: "Biriktirish bekor qilindi. Hamkorga sababi bilan xabar ketdi.",
    pl: "Przypisanie anulowane. Partner dostał wiadomość z powodem.",
  },
  resultNeedNote: {
    ru: "Напишите причину отмены — её получит партнёр.",
    uz: "Bekor qilish sababini yozing — uni hamkor oladi.",
    pl: "Wpisz powód anulowania — dostanie go partner.",
  },
  autoPayout: {
    ru: (project: string) => `с оборота за «${project}» — завелась сама, когда проект оплатили целиком`,
    uz: (project: string) => `aylanmadan, «${project}» uchun — loyiha to‘liq to‘langanda o‘zi yaratildi`,
    pl: (project: string) => `od obrotu za «${project}» — utworzona automatycznie po pełnej opłacie projektu`,
  },
  noRequisites: {
    ru: "реквизитов нет — партнёра попросили внести",
    uz: "rekvizitlar yo‘q — hamkordan kiritish so‘raldi",
    pl: "brak danych do wypłaty — poprosiliśmy partnera o ich podanie",
  },
  accumulating: {
    ru: (amount: string, percent: number) => `копилка: ${amount} · ставка ${percent} %`,
    uz: (amount: string, percent: number) => `jamg‘arma: ${amount} · stavka ${percent} %`,
    pl: (amount: string, percent: number) => `skarbonka: ${amount} · stawka ${percent}%`,
  },
  leadClient: {
    ru: (name: string, date: string) => `Клиент партнёра ${name} (закреплён ${date})`,
    uz: (name: string, date: string) => `${name} hamkorining mijozi (${date} biriktirilgan)`,
    pl: (name: string, date: string) => `Klient partnera ${name} (przypisany ${date})`,
  },
  innLabel: { ru: "ИНН компании", uz: "Kompaniya STIRi", pl: "NIP/INN firmy" },
  innSave: { ru: "Сохранить ИНН", uz: "STIRni saqlash", pl: "Zapisz NIP/INN" },
  innHint: {
    ru: "9–12 цифр. Если компанию закрепил партнёр, лид по ИНН станет его клиентом, и партнёру уйдёт сообщение.",
    uz: "9–12 raqam. Kompaniyani hamkor biriktirgan bo‘lsa, lid STIR bo‘yicha uning mijoziga aylanadi va hamkorga xabar ketadi.",
    pl: "9–12 cyfr. Jeśli firmę przypisał partner, lead po NIP/INN stanie się jego klientem, a partner dostanie wiadomość.",
  },
  innSaving: { ru: "Сохраняем…", uz: "Saqlanmoqda…", pl: "Zapisujemy…" },
  innSaved: { ru: "ИНН сохранён.", uz: "STIR saqlandi.", pl: "NIP/INN zapisany." },
  innSavedClient: {
    ru: "ИНН сохранён — это клиент партнёра, лид закреплён за ним.",
    uz: "STIR saqlandi — bu hamkorning mijozi, lid unga biriktirildi.",
    pl: "NIP/INN zapisany — to klient partnera, lead został mu przypisany.",
  },
  innBad: {
    ru: "ИНН — только цифры, от 9 до 12.",
    uz: "STIR — faqat raqamlar, 9 tadan 12 tagacha.",
    pl: "NIP/INN — tylko cyfry, od 9 do 12.",
  },
  innForbidden: {
    ru: "ИНН вписывает тот, у кого лид, руководитель или владелец.",
    uz: "STIRni lid kimda bo‘lsa o‘sha, rahbar yoki egasi kiritadi.",
    pl: "NIP/INN wpisuje osoba prowadząca leada, kierownik lub właściciel.",
  },
});
