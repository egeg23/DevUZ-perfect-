import { teamDict } from "@/content/admin-panel/team";
import type { PanelLocale, Tr } from "@/lib/admin/i18n";
import type { Staff } from "@/lib/admin/session";
import { record } from "@/lib/admin/audit";
import type { Role } from "@/lib/admin/roles";
import { serviceClient } from "@/lib/supabase";

/**
 * Какие сообщения бота кому приходят.
 *
 * Владелец, 28.09: «чтобы он [Александр] и я могли выбирать, что приходит
 * менеджерам. По умолчанию приходит всё. Но мы можем через галочки выбрать,
 * что идёт, а что нет».
 *
 * Хранится список выключенного, а не включённого. Так «по умолчанию всё»
 * держится само: новый сотрудник получает всё, и новый вид сообщений,
 * добавленный позже, тоже приходит всем, пока его кто-то не выключит.
 * Список включённого пришлось бы дописывать каждому при каждом новом виде
 * — и забытая строка молча лишала бы человека уведомлений.
 *
 * Служебное — приглашение, смена роли и руководителя, просьба подтвердить
 * передачу — здесь не выключается: это не рассылка, а действие, которое
 * без сообщения не состоится.
 */

export const NOTICE_KINDS = [
  "queue",
  "open",
  "watch",
  "reminders",
  "messages",
  "transfers",
  "talks",
  "portion",
  "coach",
  "reports",
  "tasks",
] as const;
export type NoticeKind = (typeof NOTICE_KINDS)[number];

export function isNoticeKind(value: string): value is NoticeKind {
  return (NOTICE_KINDS as readonly string[]).includes(value);
}

const EVERYONE: readonly Role[] = ["admin", "head", "manager"];
const IN_QUEUE: readonly Role[] = ["head", "manager"];

/**
 * Названия — ровно как на странице «Команда», пояснение — что будет, если
 * выключить. Второе важнее первого: галочку «Новые заявки по очереди»
 * снимают, не думая, что человек тем самым выходит из очереди.
 *
 * На трёх языках панели: галочки ставит владелец или руководитель на своём
 * языке. Бот этих строк не шлёт.
 */
export const NOTICES: Record<NoticeKind, { title: Tr; off: Tr; roles: readonly Role[] }> = {
  queue: {
    title: { ru: "Новые заявки по очереди", uz: "Navbat bo‘yicha yangi buyurtmalar", pl: "Nowe zgłoszenia z kolejki" },
    off: {
      ru: "человек выходит из очереди: лиды ему не предлагаются и идут следующему",
      uz: "xodim navbatdan chiqadi: unga lidlar taklif qilinmaydi va keyingisiga o‘tadi",
      pl: "osoba wypada z kolejki: leady nie są jej proponowane i trafiają do następnej",
    },
    roles: IN_QUEUE,
  },
  open: {
    title: { ru: "Заявки для всех", uz: "Hamma uchun buyurtmalar", pl: "Zgłoszenia dla wszystkich" },
    off: {
      ru: "ночные заявки, те, что очередь не разобрала, и «нужен прототип» по касаниям ему не приходят — только в панели",
      uz: "tungi buyurtmalar, navbat taqsimlamaganlari va aloqalar bo‘yicha «prototip kerak» unga kelmaydi — faqat panelda",
      pl: "nocne zgłoszenia, te, których kolejka nie rozdzieliła, i «chcą prototyp» z kontaktów do niej nie trafiają — tylko w panelu",
    },
    roles: EVERYONE,
  },
  watch: {
    title: { ru: "Копии предложений очереди", uz: "Navbat takliflari nusxalari", pl: "Kopie propozycji z kolejki" },
    off: {
      ru: "не приходит, кому и когда очередь предложила лид",
      uz: "navbat lidni kimga va qachon taklif qilgani kelmaydi",
      pl: "nie przychodzi informacja, komu i kiedy kolejka zaproponowała leada",
    },
    roles: ["admin"],
  },
  reminders: {
    title: { ru: "Напоминания по лидам", uz: "Lidlar bo‘yicha eslatmalar", pl: "Przypomnienia o leadach" },
    off: {
      ru: "напоминания не приходят в Telegram, видны только в панели",
      uz: "eslatmalar Telegram’ga kelmaydi, faqat panelda ko‘rinadi",
      pl: "przypomnienia nie przychodzą w Telegramie, są widoczne tylko w panelu",
    },
    roles: EVERYONE,
  },
  messages: {
    title: { ru: "Сообщения в чате лида", uz: "Lid chatidagi xabarlar", pl: "Wiadomości w czacie leada" },
    off: {
      ru: "о новом сообщении коллеги в карточке его лида бот не пишет",
      uz: "hamkasb uning lid kartochkasida yangi xabar yozsa, bot xabar bermaydi",
      pl: "bot nie informuje o nowej wiadomości współpracownika w karcie jej leada",
    },
    roles: EVERYONE,
  },
  transfers: {
    title: { ru: "Передачи лидов", uz: "Lidlarni berish", pl: "Przekazania leadów" },
    off: {
      ru: "не приходит «вам передали лид» и ответ на его просьбу о передаче",
      uz: "«sizga lid berildi» xabari va uning lidni berish so‘roviga javob kelmaydi",
      pl: "nie przychodzi «przekazano Ci leada» ani odpowiedź na jej prośbę o przekazanie",
    },
    roles: EVERYONE,
  },
  talks: {
    title: { ru: "Ответы клиентов на касания", uz: "Mijozlarning aloqalarga javoblari", pl: "Odpowiedzi klientów na kontakty" },
    off: {
      ru: "ответ клиента на касание и то, что он открыл прототип из письма, видны только в «Касаниях» — бот не позовёт",
      uz: "mijozning aloqaga javobi va xatdagi prototipni ochgani faqat «Aloqalar»da ko‘rinadi — bot chaqirmaydi",
      pl: "odpowiedź klienta na kontakt i to, że otworzył prototyp z wiadomości, widać tylko w «Kontaktach» — bot nie zawoła",
    },
    roles: EVERYONE,
  },
  portion: {
    title: { ru: "Порция касаний на день", uz: "Aloqalarning kunlik to‘plami", pl: "Porcja kontaktów na dzień" },
    off: {
      ru: "порция утром не приходит в Telegram, но остаётся в «Касаниях»",
      uz: "kunlik to‘plam ertalab Telegram’ga kelmaydi, lekin «Aloqalar»da qoladi",
      pl: "porcja nie przychodzi rano w Telegramie, ale zostaje w «Kontaktach»",
    },
    roles: IN_QUEUE,
  },
  coach: {
    title: { ru: "Рекомендации на неделю", uz: "Haftalik tavsiyalar", pl: "Rekomendacje na tydzień" },
    off: {
      ru: "недельный разбор не приходит, но есть на главной панели",
      uz: "haftalik tahlil kelmaydi, lekin panelning bosh sahifasida bor",
      pl: "tygodniowe podsumowanie nie przychodzi, ale jest na stronie głównej panelu",
    },
    roles: IN_QUEUE,
  },
  reports: {
    title: {
      ru: "Отчёты: порция дня и сводка на сегодня",
      uz: "Hisobotlar: kunlik to‘plam va bugungi qisqacha xulosa",
      pl: "Raporty: porcja dnia i podsumowanie na dziś",
    },
    off: {
      ru: "вечерний отчёт по порциям и утренняя сводка не приходят",
      uz: "kunlik to‘plamlar bo‘yicha kechki hisobot va ertalabki xulosa kelmaydi",
      pl: "wieczorny raport z porcji i poranne podsumowanie nie przychodzą",
    },
    roles: ["admin", "head"],
  },
  // Владелец, 01.10: задачи команды. Выключение глушит только Telegram:
  // задача остаётся на главной панели, и открытая панель всё так же
  // позовёт звуком.
  tasks: {
    title: { ru: "Задачи", uz: "Vazifalar", pl: "Zadania" },
    off: {
      ru: "новые задачи, напоминания о сроках и ответы по поставленным задачам не приходят в Telegram — только на главной панели",
      uz: "yangi vazifalar, muddat eslatmalari va qo‘yilgan vazifalar bo‘yicha javoblar Telegramga kelmaydi — faqat panelning bosh sahifasida",
      pl: "nowe zadania, przypomnienia o terminach i odpowiedzi do zleconych zadań nie przychodzą na Telegram — tylko na stronie głównej panelu",
    },
    roles: EVERYONE,
  },
};

/** Какие галочки у этой роли вообще есть. Остальное ей и так не приходит. */
export function kindsFor(role: Role): NoticeKind[] {
  return NOTICE_KINDS.filter((kind) => NOTICES[kind].roles.includes(role));
}

/** Хочет ли человек получать это. Пусто или непонятно — хочет: по умолчанию всё. */
export function wants(off: readonly string[] | null | undefined, kind: NoticeKind): boolean {
  return !(off ?? []).includes(kind);
}

/**
 * Из формы с галочками — список выключенного.
 *
 * Форма присылает только отмеченное, поэтому выключено всё, что положено
 * роли и не пришло. Лишнее и чужое отбрасывается: галочку, которой у роли
 * нет, прислать можно, а записать — нет.
 */
export function offFromForm(checked: readonly string[], role: Role): NoticeKind[] {
  const on = new Set(checked);
  return kindsFor(role).filter((kind) => !on.has(kind));
}

/** Что выключено — строкой для страницы: «приходит всё» или сколько выключено. */
export function offSummary(
  off: readonly string[] | null | undefined,
  role: Role,
  locale: PanelLocale = "ru",
): string {
  const muted = kindsFor(role).filter((kind) => !wants(off, kind));
  if (!muted.length) return teamDict.offAllOn[locale];
  if (muted.length === kindsFor(role).length) return teamDict.offAllOff[locale];
  return teamDict.offSome[locale](muted.length, kindsFor(role).length);
}

/* ── База ───────────────────────────────────────────────────────────────── */

type Row = { id: string; telegram_user_id: number | null; notify_off: string[] | null };

async function activeRows(): Promise<Row[] | null> {
  const db = serviceClient();
  if (!db) return null;
  const { data, error } = await db
    .from("staff")
    .select("id, telegram_user_id, notify_off")
    .eq("is_active", true);
  if (error) return null;
  return (data as Row[] | null) ?? [];
}

/**
 * Чаты сотрудников, выключивших этот вид сообщений.
 *
 * При сбое базы — пусто, то есть сообщение уходит всем. Лишнее сообщение
 * хуже тишины только для того, кто сам его выключил; потерянная заявка —
 * для всех.
 */
export async function mutedChats(kind: NoticeKind): Promise<Set<string>> {
  const rows = await activeRows();
  const out = new Set<string>();
  for (const row of rows ?? []) {
    if (row.telegram_user_id !== null && !wants(row.notify_off, kind)) out.add(String(row.telegram_user_id));
  }
  return out;
}

/** Писать ли в этот чат. Чат не сотрудника (группа продаж) — писать. */
export async function allowsChat(kind: NoticeKind, chat: number | string | null | undefined): Promise<boolean> {
  if (chat === null || chat === undefined || chat === "") return true;
  return !(await mutedChats(kind)).has(String(chat));
}

export type NoticesResult = { ok: true } | { ok: false; reason: "offline" | "gone" | "failed" };

/** Записать галочки. Кто вправе — решает `tunesNotices` в действии страницы. */
export async function setNotices(
  staffId: string,
  off: readonly NoticeKind[],
  actor: Staff,
  ip: string,
): Promise<NoticesResult> {
  const db = serviceClient();
  if (!db) return { ok: false, reason: "offline" };

  const { data, error } = await db
    .from("staff")
    .update({ notify_off: [...off] })
    .eq("id", staffId)
    .select("id")
    .maybeSingle();
  if (error) return { ok: false, reason: "failed" };
  if (!data) return { ok: false, reason: "gone" };

  await record("staff.notices", {
    actorStaffId: actor.id,
    targetType: "staff",
    targetId: staffId,
    ip,
    meta: { off: [...off] },
  });
  return { ok: true };
}
