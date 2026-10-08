import { AUDIT_ACTIONS, type AuditAction } from "@/lib/admin/audit";
import type { Tr } from "@/lib/admin/i18n";
import { serviceClient } from "@/lib/supabase";

/**
 * Чтение журнала.
 *
 * Писать в audit_events умеет весь код панели, а читать до этого модуля
 * умел только тот, кто откроет SQL-редактор. Журнал, в который нельзя
 * заглянуть из панели, доказывает ровно столько же, сколько его
 * отсутствие: им никто не пользуется, пока не случится разбор, а на
 * разборе выясняется, что читать его некому и нечем.
 */

/**
 * Человеческие подписи — на трёх языках панели. Ключи те же, что и в
 * AUDIT_ACTIONS. Русская строка — `ACTION_LABEL[action].ru`: её берут там,
 * где текст пока только русский.
 */
export const ACTION_LABEL: Record<AuditAction, Tr> = {
  "login.requested": { ru: "запросил ссылку входа", uz: "kirish havolasini so‘radi", pl: "poprosił o link logowania" },
  "login.succeeded": { ru: "вошёл в панель", uz: "panelga kirdi", pl: "zalogował się do panelu" },
  "login.failed": { ru: "неудачный вход", uz: "muvaffaqiyatsiz kirish", pl: "nieudane logowanie" },
  logout: { ru: "вышел", uz: "chiqdi", pl: "wylogował się" },
  "lead.viewed": { ru: "открыл карточку лида", uz: "lid kartochkasini ochdi", pl: "otworzył kartę leada" },
  "lead.taken": { ru: "взял лида", uz: "lidni oldi", pl: "przejął leada" },
  "lead.added": { ru: "добавил лид вручную", uz: "lidni qo‘lda qo‘shdi", pl: "dodał leada ręcznie" },
  "lead.prototype_taken": { ru: "взял прототип по касанию", uz: "aloqa bo‘yicha prototipni oldi", pl: "wziął prototyp z kontaktu" },
  "lead.released": { ru: "отпустил лида", uz: "lidni qo‘yib yubordi", pl: "zwolnił leada" },
  "lead.status_changed": { ru: "сменил статус лида", uz: "lid holatini o‘zgartirdi", pl: "zmienił status leada" },
  "lead.contact_revealed": { ru: "открыл контакт клиента", uz: "mijoz kontaktini ochdi", pl: "odsłonił dane kontaktowe klienta" },
  "lead.transcript_viewed": { ru: "прочитал переписку", uz: "yozishmani o‘qidi", pl: "przeczytał korespondencję" },
  "lead.auto_reminder_toggled": { ru: "переключил автонапоминание", uz: "avtoeslatmani almashtirdi", pl: "przełączył automatyczne przypomnienie" },
  "reminder.created": { ru: "поставил напоминание", uz: "eslatma qo‘ydi", pl: "ustawił przypomnienie" },
  "reminder.done": { ru: "закрыл напоминание", uz: "eslatmani yopdi", pl: "zamknął przypomnienie" },
  "reminder.sent": { ru: "напоминание отправлено", uz: "eslatma yuborildi", pl: "przypomnienie wysłane" },
  "message.posted": { ru: "написал в обсуждение", uz: "muhokamaga yozdi", pl: "napisał w dyskusji" },
  "project.created": { ru: "завёл проект", uz: "loyiha ochdi", pl: "założył projekt" },
  "project.updated": { ru: "поправил проект", uz: "loyihani tuzatdi", pl: "poprawił projekt" },
  "project.stage_changed": { ru: "сменил стадию проекта", uz: "loyiha bosqichini o‘zgartirdi", pl: "zmienił etap projektu" },
  "order.status_changed": { ru: "сменил статус заявки", uz: "buyurtma holatini o‘zgartirdi", pl: "zmienił status zamówienia" },
  "order.invoiced": { ru: "выставил счёт", uz: "hisob-faktura chiqardi", pl: "wystawił fakturę" },
  "order.paid": { ru: "подтвердил оплату", uz: "to‘lovni tasdiqladi", pl: "potwierdził płatność" },
  "order.delivered": { ru: "отметил передачу кода", uz: "kod topshirilganini belgiladi", pl: "oznaczył przekazanie kodu" },
  "order.cancelled": { ru: "отменил заявку", uz: "buyurtmani bekor qildi", pl: "anulował zamówienie" },
  "order.reopened": { ru: "вернул заявку в работу", uz: "buyurtmani ishga qaytardi", pl: "przywrócił zamówienie do realizacji" },
  "order.amount_set": { ru: "проставил сумму сделки", uz: "bitim summasini qo‘ydi", pl: "ustawił kwotę transakcji" },
  "order.link_reissued": { ru: "перевыпустил ссылку покупателя", uz: "xaridor havolasini qayta chiqardi", pl: "wygenerował ponownie link kupującego" },
  "release.published": { ru: "выложил релиз продукта", uz: "mahsulot relizini joyladi", pl: "opublikował wydanie produktu" },
  "download.served": { ru: "покупатель скачал файл", uz: "xaridor faylni yuklab oldi", pl: "kupujący pobrał plik" },
  "download.refused": { ru: "выдача файла отклонена", uz: "fayl berish rad etildi", pl: "odmówiono wydania pliku" },
  "entitlement.revoked": { ru: "отозвал доступ к файлам", uz: "fayllarga kirishni bekor qildi", pl: "odebrał dostęp do plików" },
  "entitlement.restored": { ru: "вернул покупателю доступ к файлам", uz: "xaridorga fayllarga kirishni qaytardi", pl: "przywrócił kupującemu dostęp do plików" },
  "order.nudged": { ru: "свип напомнил о заявке", uz: "tizim buyurtma haqida eslatdi", pl: "system przypomniał o zamówieniu" },
  "staff.touch_plan_set": { ru: "изменил недельный план касаний", uz: "haftalik aloqalar rejasini o‘zgartirdi", pl: "zmienił tygodniowy plan kontaktów" },
  "staff.notices": { ru: "изменил, какие сообщения бота приходят сотруднику", uz: "xodimga botdan qaysi xabarlar kelishini o‘zgartirdi", pl: "zmienił, jakie wiadomości bota dostaje pracownik" },
  "staff.updated": { ru: "изменил данные сотрудника", uz: "xodim ma’lumotlarini o‘zgartirdi", pl: "zmienił dane pracownika" },
  "partner.model_changed": { ru: "партнёр сменил модель дохода", uz: "hamkor daromad modelini o‘zgartirdi", pl: "partner zmienił model przychodu" },
  "partner.agency_requested": { ru: "партнёр подключил агентство", uz: "hamkor agentlikni uladi", pl: "partner podłączył agencję" },
  "partner.agency_decided": { ru: "решил по агентству партнёра", uz: "hamkor agentligi bo‘yicha qaror qildi", pl: "zdecydował w sprawie agencji partnera" },
  "partner.promo_added": { ru: "выложил промо-материал партнёрам", uz: "hamkorlarga promo-material joyladi", pl: "dodał materiał promocyjny dla partnerów" },
  "partner.promo_updated": { ru: "изменил промо-материал партнёров", uz: "hamkorlar promo-materialini o‘zgartirdi", pl: "zmienił materiał promocyjny partnerów" },
  "partner.promo_deleted": { ru: "удалил промо-материал партнёров", uz: "hamkorlar promo-materialini o‘chirdi", pl: "usunął materiał promocyjny partnerów" },
  "prospect.audited": { ru: "проверил сайты для холодного касания", uz: "sovuq aloqa uchun saytlarni tekshirdi", pl: "sprawdził strony pod zimny kontakt" },
  "signal.status_changed": { ru: "разобрал сигнал поиска", uz: "qidiruv signalini ko‘rib chiqdi", pl: "obsłużył sygnał z wyszukiwania" },
  "staff.invited": { ru: "завёл сотрудника", uz: "xodim qo‘shdi", pl: "dodał pracownika" },
  "staff.disabled": { ru: "отключил сотрудника", uz: "xodimni o‘chirdi", pl: "wyłączył pracownika" },
  "staff.role_changed": { ru: "сменил роль сотрудника", uz: "xodim rolini o‘zgartirdi", pl: "zmienił rolę pracownika" },
  "staff.head_changed": { ru: "назначил руководителя сотруднику", uz: "xodimga rahbar tayinladi", pl: "przypisał pracownikowi kierownika" },
  "staff.grade_changed": { ru: "сменил грейд или ставку сотруднику", uz: "xodimning darajasi yoki stavkasini o‘zgartirdi", pl: "zmienił poziom lub stawkę pracownika" },
  "project.money_set": { ru: "проставил деньги по проекту", uz: "loyiha bo‘yicha pul ma’lumotlarini qo‘ydi", pl: "ustawił kwoty w projekcie" },
  "project.quote_set": { ru: "смета проекта изменена", uz: "loyiha smetasi o‘zgartirildi", pl: "zmieniono kosztorys projektu" },
  "plan.set": { ru: "поставил план", uz: "reja qo‘ydi", pl: "ustawił plan" },
  "plan.removed": { ru: "снял план", uz: "rejani olib tashladi", pl: "usunął plan" },
  "candidate.reviewed": { ru: "разобрал резюме кандидата", uz: "nomzod rezyumesini tahlil qildi", pl: "przeanalizował CV kandydata" },
  "candidate.dropped": { ru: "убрал разбор кандидата", uz: "nomzod tahlilini olib tashladi", pl: "usunął analizę kandydata" },
  "prospect.queued": { ru: "отправил первое сообщение по сайту", uz: "sayt bo‘yicha birinchi xabarni yubordi", pl: "wysłał pierwszą wiadomość do strony" },
  "prospect.manual_sent": { ru: "связался сам — со своего аккаунта, звонком или в WhatsApp", uz: "o‘zi bog‘landi — o‘z akkaunti, qo‘ng‘iroq yoki WhatsApp orqali", pl: "skontaktował się sam — ze swojego konta, telefonicznie lub przez WhatsApp" },
  "prospect.manual_reply": { ru: "перенёс ответ клиента из своей переписки", uz: "mijoz javobini o‘z yozishmasidan ko‘chirdi", pl: "przeniósł odpowiedź klienta ze swojej korespondencji" },
  "prospect.taken_over": { ru: "забрал переписку у ИИ", uz: "yozishmani SI’dan olib qo‘ydi", pl: "przejął korespondencję od AI" },
  "prospect.closed": { ru: "закрыл касание: клиент отказался или не отвечает", uz: "aloqani yopdi: mijoz rad etdi yoki javob bermayapti", pl: "zamknął kontakt: klient odmówił lub nie odpowiada" },
  "stream.on": { ru: "включил поток «Получать лиды» в Telegram", uz: "Telegram’da «Получать лиды» oqimini yoqdi", pl: "włączył strumień «Получать лиды» w Telegramie" },
  "stream.off": { ru: "выключил поток «Получать лиды» в Telegram", uz: "Telegram’da «Получать лиды» oqimini o‘chirdi", pl: "wyłączył strumień «Получать лиды» w Telegramie" },
  "autopilot.on": { ru: "включил автопрогон касаний", uz: "avtomatik aloqalarni yoqdi", pl: "włączył automatyczne kontakty" },
  "autopilot.off": { ru: "выключил автопрогон касаний", uz: "avtomatik aloqalarni o‘chirdi", pl: "wyłączył automatyczne kontakty" },
  "invoice.issued": { ru: "выставил счёт по договору", uz: "shartnoma bo‘yicha hisob-faktura chiqardi", pl: "wystawił fakturę do umowy" },
  "invoice.paid": { ru: "отметил счёт оплаченным", uz: "hisob-fakturani to‘langan deb belgiladi", pl: "oznaczył fakturę jako opłaconą" },
  "invoice.payment_confirmed": { ru: "подтвердил оплату счёта — платёж записан в проект", uz: "hisob-faktura to‘lovini tasdiqladi — to‘lov loyihaga yozildi", pl: "potwierdził płatność faktury — płatność zapisana w projekcie" },
  "invoice.unpaid": { ru: "снял отметку об оплате счёта", uz: "hisob-faktura to‘lovi belgisini olib tashladi", pl: "cofnął oznaczenie płatności faktury" },
  "contract.link_issued": { ru: "выпустил ссылку на договор для заказчика", uz: "buyurtmachi uchun shartnoma havolasini chiqardi", pl: "wygenerował link do umowy dla zamawiającego" },
  "razbor.published": { ru: "опубликовал разбор", uz: "tahlilni e’lon qildi", pl: "opublikował analizę" },
  "proto.build": { ru: "собрал прототип", uz: "prototip yig‘di", pl: "zbudował prototyp" },
  "proto.sent": { ru: "отправил прототип клиенту", uz: "prototipni mijozga yubordi", pl: "wysłał prototyp klientowi" },
  "work_account.add": { ru: "подключил рабочий аккаунт Telegram", uz: "Telegram ishchi akkauntini uladi", pl: "podłączył konto robocze Telegrama" },
  "work_account.pause": { ru: "остановил рабочий аккаунт", uz: "ishchi akkauntni to‘xtatdi", pl: "wstrzymał konto robocze" },
  "work_account.resume": { ru: "вернул рабочий аккаунт в работу", uz: "ishchi akkauntni ishga qaytardi", pl: "przywrócił konto robocze do pracy" },
  "work_account.remove": { ru: "отключил рабочий аккаунт", uz: "ishchi akkauntni o‘chirdi", pl: "odłączył konto robocze" },
  "work_account.staff": { ru: "отметил, кто работает на рабочем аккаунте", uz: "ishchi akkauntda kim ishlashini belgiladi", pl: "wskazał, kto pracuje na koncie roboczym" },
  "help_video.saved": { ru: "загрузил видео к инструкции", uz: "yo‘riqnomaga video yukladi", pl: "wgrał wideo do instrukcji" },
  "help_video.removed": { ru: "убрал видео из инструкции", uz: "yo‘riqnomadan videoni olib tashladi", pl: "usunął wideo z instrukcji" },
  "tg_circle.saved": { ru: "загрузил кружок для касаний", uz: "aloqalar uchun dumaloq video yukladi", pl: "wgrał kółko do kontaktów" },
  "razbor.rejected": { ru: "отклонил разбор", uz: "tahlilni rad etdi", pl: "odrzucił analizę" },
  "razbor.unpublished": { ru: "снял разбор с публикации", uz: "tahlilni e’londan olib tashladi", pl: "wycofał analizę z publikacji" },
  "razbor.edited": { ru: "поправил текст разбора", uz: "tahlil matnini tuzatdi", pl: "poprawił tekst analizy" },
  "razbor.deleted": { ru: "удалил разбор", uz: "tahlilni o‘chirdi", pl: "usunął analizę" },
  "project.payment_added": { ru: "подтвердил платёж клиента", uz: "mijoz to‘lovini tasdiqladi", pl: "potwierdził płatność klienta" },
  "project.payment_removed": { ru: "удалил платёж клиента", uz: "mijoz to‘lovini o‘chirdi", pl: "usunął płatność klienta" },
  "payout.recorded": { ru: "записал выплату сотруднику", uz: "xodimga to‘lovni yozdi", pl: "zapisał wypłatę dla pracownika" },
  "payout.removed": { ru: "удалил выплату сотруднику", uz: "xodimga to‘lovni o‘chirdi", pl: "usunął wypłatę dla pracownika" },
  "expense.added": { ru: "записал расход студии", uz: "studiya xarajatini yozdi", pl: "zapisał wydatek studia" },
  "expense.removed": { ru: "удалил расход студии", uz: "studiya xarajatini o‘chirdi", pl: "usunął wydatek studia" },
  "project.share_set": { ru: "задал процент по сделке вручную", uz: "bitim bo‘yicha foizni qo‘lda belgiladi", pl: "ustawił ręcznie procent od transakcji" },
  "partner.created": { ru: "завёл партнёра", uz: "hamkor qo‘shdi", pl: "dodał partnera" },
  "partner.link_created": { ru: "создал партнёрскую ссылку", uz: "hamkorlik havolasini yaratdi", pl: "utworzył link partnerski" },
  "partner.updated": { ru: "изменил партнёра", uz: "hamkorni o‘zgartirdi", pl: "zmienił partnera" },
  "partner.deleted": { ru: "удалил партнёра", uz: "hamkorni o‘chirdi", pl: "usunął partnera" },
  "partner.payout_requested": { ru: "партнёр запросил выплату", uz: "hamkor to‘lov so‘radi", pl: "partner poprosił o wypłatę" },
  "partner.payout_decided": { ru: "решил по выплате партнёру", uz: "hamkorga to‘lov bo‘yicha qaror qildi", pl: "zdecydował w sprawie wypłaty dla partnera" },
  "project.partner_set": { ru: "привязал партнёра к проекту", uz: "loyihaga hamkorni biriktirdi", pl: "przypisał partnera do projektu" },
  "lead.transfer_requested": { ru: "попросил передать лид", uz: "lidni berishni so‘radi", pl: "poprosił o przekazanie leada" },
  "lead.transfer_decided": { ru: "решил по передаче лида", uz: "lidni berish bo‘yicha qaror qildi", pl: "zdecydował w sprawie przekazania leada" },
  "lead.transferred": { ru: "передал лид другому сотруднику", uz: "lidni boshqa xodimga berdi", pl: "przekazał leada innemu pracownikowi" },
  "google.client_saved": { ru: "сохранил Client ID Google для статистики", uz: "statistika uchun Google Client ID’ni saqladi", pl: "zapisał Client ID Google dla statystyk" },
  "google.connected": { ru: "подключил Google Analytics входом через Google", uz: "Google Analytics’ni Google orqali kirib uladi", pl: "podłączył Google Analytics przez logowanie Google" },
  "google.property_set": { ru: "вписал номер ресурса Google Analytics", uz: "Google Analytics resurs raqamini kiritdi", pl: "wpisał numer usługi Google Analytics" },
  "partner.client_claimed": { ru: "партнёр закрепил клиента", uz: "hamkor mijozni biriktirdi", pl: "partner przypisał klienta" },
  "partner.client_lead": { ru: "из закрепления партнёра заведён приоритетный лид", uz: "hamkor biriktirishidan ustuvor lid ochildi", pl: "z przypisania partnera utworzono priorytetowy lead" },
  "lead.inn_set": { ru: "вписал ИНН компании в карточку лида", uz: "lid kartochkasiga kompaniya STIRini yozdi", pl: "wpisał NIP/INN firmy w karcie leada" },
  "partner.client_cancelled": { ru: "отменил закрепление клиента партнёра", uz: "hamkor mijozining biriktirilishini bekor qildi", pl: "anulował przypisanie klienta partnera" },
  "partner.payout_auto": { ru: "завелась выплата партнёру с оборота", uz: "hamkorga aylanmadan to‘lov yaratildi", pl: "utworzono wypłatę dla partnera od obrotu" },
  "partner.accumulate_set": { ru: "партнёр включил или выключил копилку", uz: "hamkor jamg‘armani yoqdi yoki o‘chirdi", pl: "partner włączył lub wyłączył skarbonkę" },
  "task.created": { ru: "поставил задачу", uz: "vazifa qo‘ydi", pl: "utworzył zadanie" },
  "task.taken": { ru: "взял задачу в работу", uz: "vazifani ishga oldi", pl: "przyjął zadanie do realizacji" },
  "task.done": { ru: "отметил задачу сделанной", uz: "vazifani bajarilgan deb belgiladi", pl: "oznaczył zadanie jako wykonane" },
  "task.failed": { ru: "отметил задачу несделанной", uz: "vazifani bajarilmagan deb belgiladi", pl: "oznaczył zadanie jako niewykonane" },
  "task.moved": { ru: "перенёс срок задачи", uz: "vazifa muddatini ko‘chirdi", pl: "przesunął termin zadania" },
  "task.cancelled": { ru: "отменил задачу", uz: "vazifani bekor qildi", pl: "anulował zadanie" },
};

/**
 * Действия, которые видно и без разбора: раскрытие контакта, чтение
 * переписки, всё про сотрудников. Экран подсвечивает их отдельно —
 * не потому, что остальные не важны, а потому, что журнал листают
 * сверху вниз и глазами, и без подсветки чувствительное теряется
 * в потоке входов и просмотров.
 */
export const SENSITIVE: ReadonlySet<string> = new Set([
  "entitlement.revoked",
  "entitlement.restored",
  "order.paid",
  "order.link_reissued",
  "lead.contact_revealed",
  "lead.transcript_viewed",
  "login.failed",
  "staff.invited",
  "staff.disabled",
  "staff.role_changed",
  "staff.head_changed",
  "staff.grade_changed",
  "project.money_set",
  "project.payment_added",
  "project.payment_removed",
  "invoice.payment_confirmed",
  "invoice.unpaid",
  "payout.recorded",
  "payout.removed",
  "expense.added",
  "expense.removed",
  "project.share_set",
  "partner.payout_requested",
  "partner.payout_decided",
  "project.partner_set",
  "lead.transfer_requested",
  "lead.transfer_decided",
  "lead.transferred",
  "google.connected",
]);

export type JournalEntry = {
  id: number;
  created_at: string;
  action: string;
  target_type: string | null;
  target_id: string | null;
  meta: Record<string, unknown>;
  ip: string | null;
  actor_staff_id: string | null;
  /** Имя сотрудника; null — запись сделала система (свип, таймер). */
  actor: string | null;
};

export type JournalFilter = {
  actor?: string;
  action?: string;
  limit?: number;
  offset?: number;
};

export type JournalPage = {
  rows: JournalEntry[];
  total: number;
  /** База не настроена — это не «журнал пуст», и путать их нельзя. */
  offline: boolean;
};

export async function readJournal(filter: JournalFilter = {}): Promise<JournalPage> {
  const db = serviceClient();
  if (!db) return { rows: [], total: 0, offline: true };

  const limit = Math.min(Math.max(filter.limit ?? 100, 1), 200);
  const offset = Math.max(filter.offset ?? 0, 0);

  let query = db
    .from("audit_events")
    .select(
      "id, created_at, actor_staff_id, action, target_type, target_id, meta, ip, staff:actor_staff_id (display_name, username)",
      { count: "exact" },
    )
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  // Значения фильтров приходят из строки запроса, то есть из рук кого
  // угодно, и сверяются со списком, а не подставляются как есть.
  if (filter.action && (AUDIT_ACTIONS as readonly string[]).includes(filter.action)) {
    query = query.eq("action", filter.action);
  }
  if (filter.actor) {
    query = filter.actor === "system"
      // Часть событий совершает не человек, а свип напоминаний. Отдельный
      // фильтр нужен ровно затем, чтобы отличить «сделала система» от
      // «сделал кто-то, и мы не знаем кто» — второго быть не должно.
      ? query.is("actor_staff_id", null)
      : query.eq("actor_staff_id", filter.actor);
  }

  const { data, error, count } = await query;
  if (error) {
    console.error("admin: не прочитал журнал", error.message);
    return { rows: [], total: 0, offline: false };
  }

  const rows = ((data ?? []) as Record<string, unknown>[]).map((row) => {
    const staff = row.staff as { display_name?: string; username?: string | null } | null;
    return {
      id: row.id as number,
      created_at: row.created_at as string,
      action: row.action as string,
      target_type: (row.target_type as string | null) ?? null,
      target_id: (row.target_id as string | null) ?? null,
      meta: (row.meta as Record<string, unknown>) ?? {},
      ip: (row.ip as string | null) ?? null,
      actor_staff_id: (row.actor_staff_id as string | null) ?? null,
      actor: staff?.display_name ?? null,
    };
  });

  return { rows, total: count ?? rows.length, offline: false };
}
