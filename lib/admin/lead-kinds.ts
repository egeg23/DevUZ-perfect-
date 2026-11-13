import type { Tr } from "@/lib/admin/i18n";

/**
 * Какие лиды сотрудник хочет получать — по виду лида.
 *
 * Владелец, 13.11.2026: «Сделай так, чтобы сотрудник мог выбирать, какие
 * уведомления по лидам ему шлет бот: по тендерам, лиды из групп, только
 * партнеры и тд. Для чего: сейчас в куче, те кто занимаются партнеркой не
 * работают в холодку и наоборот. Тендеры не хотят видеть холодные касания и
 * тд. Пусть будет возможность самим настроить это всё.»
 *
 * Хранится там же, где остальные галочки бота, — в `staff.notify_off`,
 * строками `lead:<вид>` (снятые виды). По умолчанию всё, как и у
 * `notify-prefs`: новый вид лида приходит всем, пока его не снимут.
 *
 * Снятый вид — это не только «не присылать карточку», но и «не предлагать
 * этот лид в очереди» (`lead-queue-store`): иначе лид полчаса горел бы у
 * того, кто его не возьмёт. Не осталось ни одного, кто хочет такой вид, —
 * лид идёт всем, как раньше (`withFallback`), и руководителю строка.
 */

export const LEAD_KINDS = ["outreach", "tender", "scout", "partner", "inbound", "mockup"] as const;
export type LeadKind = (typeof LEAD_KINDS)[number];

export const LEAD_KIND_PREFIX = "lead:";

/** Ниша, которую тендер ставит лиду (lib/scout/tender-lead.ts). */
export const TENDER_NICHE = "госзакупки и тендеры";

/** Слова, по которым тендер узнаётся в заметках, если ниша стёрта. */
const TENDER_NOTE = "Лот: http";

export function isLeadKind(value: string): value is LeadKind {
  return (LEAD_KINDS as readonly string[]).includes(value);
}

export type LeadKindInput = {
  source?: string | null;
  niche?: string | null;
  notes?: string | null;
  partnerId?: string | null;
  partnerPin?: boolean | null;
};

/**
 * Вид лида — правилами по самому лиду, без модели.
 *
 * Партнёр первым: лид от партнёра или агентства приходит с любого входа
 * (форма, бот), но ведут его те, кто занимается партнёркой.
 */
export function leadKindOf(lead: LeadKindInput): LeadKind {
  const source = (lead.source ?? "").trim();
  if (source === "partner" || lead.partnerId || lead.partnerPin) return "partner";
  if (source === "scout") {
    const tender =
      (lead.niche ?? "").trim() === TENDER_NICHE || (lead.notes ?? "").includes(TENDER_NOTE);
    return tender ? "tender" : "scout";
  }
  if (source === "outreach" || source === "maps") return "outreach";
  if (source === "mockup" || source === "mockup-manual") return "mockup";
  return "inbound";
}

/** Хочет ли человек этот вид. Пусто — хочет: по умолчанию всё. */
export function wantsLead(off: readonly string[] | null | undefined, kind: LeadKind): boolean {
  return !(off ?? []).includes(LEAD_KIND_PREFIX + kind);
}

/** Снятые виды из формы: форма присылает только отмеченное. */
export function leadOffFromForm(checked: readonly string[]): string[] {
  const on = new Set(checked);
  return LEAD_KINDS.filter((kind) => !on.has(kind)).map((kind) => LEAD_KIND_PREFIX + kind);
}

/** Записанный список: галочки бота как были, виды лидов — новые. */
export function mergeLeadOff(current: readonly string[] | null | undefined, leadOff: readonly string[]): string[] {
  const rest = (current ?? []).filter((v) => !v.startsWith(LEAD_KIND_PREFIX));
  return [...rest, ...leadOff.filter((v) => v.startsWith(LEAD_KIND_PREFIX) && isLeadKind(v.slice(LEAD_KIND_PREFIX.length)))];
}

/** Обратное: галочки бота поменялись, снятые виды лидов остаются. */
export function keepLeadOff(current: readonly string[] | null | undefined, noticeOff: readonly string[]): string[] {
  return [...noticeOff, ...(current ?? []).filter((v) => v.startsWith(LEAD_KIND_PREFIX))];
}

/**
 * Оставить тех, кто хочет этот вид. Никого — все (`fallback: true`): лид
 * без получателя хуже лида не по профилю.
 */
export function withFallback<T>(
  people: readonly T[],
  offOf: (person: T) => readonly string[] | null | undefined,
  kind: LeadKind | null | undefined,
): { people: T[]; fallback: boolean } {
  if (!kind) return { people: [...people], fallback: false };
  const want = people.filter((p) => wantsLead(offOf(p), kind));
  if (want.length || !people.length) return { people: want, fallback: false };
  return { people: [...people], fallback: true };
}

/** Сколько видов снято — для строки в «Команде» и «Настройках». */
export function leadOffCount(off: readonly string[] | null | undefined): number {
  return LEAD_KINDS.filter((kind) => !wantsLead(off, kind)).length;
}

/** Названия — словами сотрудника, на трёх языках панели. */
export const LEAD_KIND_TITLE: Record<LeadKind, { title: Tr; note: Tr }> = {
  outreach: {
    title: { ru: "Холодные касания", uz: "Sovuq aloqalar", pl: "Zimne kontakty" },
    note: {
      ru: "клиент ответил на «Здравствуйте» с рабочего аккаунта и согласился на макет",
      uz: "mijoz ishchi akkauntdan yuborilgan salomga javob berdi va maketga rozi bo‘ldi",
      pl: "klient odpowiedział na «Dzień dobry» z konta roboczego i zgodził się na makietę",
    },
  },
  tender: {
    title: { ru: "Тендеры", uz: "Tenderlar", pl: "Przetargi" },
    note: {
      ru: "лоты с площадок госзакупок, которые скаут нашёл под работу студии",
      uz: "skaut studiya ishiga mos topgan davlat xaridlari maydonlaridagi lotlar",
      pl: "loty z platform zamówień publicznych, które skaut znalazł pod pracę studia",
    },
  },
  scout: {
    title: { ru: "Сигналы из групп (скаут)", uz: "Guruhlardan signallar (skaut)", pl: "Sygnały z grup (skaut)" },
    note: {
      ru: "человек в Telegram-группе ищет исполнителя",
      uz: "Telegram guruhida odam ijrochi qidirmoqda",
      pl: "ktoś w grupie Telegram szuka wykonawcy",
    },
  },
  partner: {
    title: { ru: "Партнёры и агентства", uz: "Hamkorlar va agentliklar", pl: "Partnerzy i agencje" },
    note: {
      ru: "клиент пришёл по ссылке или промокоду партнёра, от блогера или агентства",
      uz: "mijoz hamkor havolasi yoki promokodi orqali, blogger yoki agentlikdan keldi",
      pl: "klient przyszedł z linku lub kodu partnera, od blogera albo agencji",
    },
  },
  inbound: {
    title: { ru: "Заявки с сайта и из бота", uz: "Sayt va botdan buyurtmalar", pl: "Zgłoszenia ze strony i z bota" },
    note: {
      ru: "форма и чат на сайте, разговор с ботом студии, витрина, лист ожидания DevUz Box",
      uz: "saytdagi forma va chat, studiya boti bilan suhbat, vitrina, DevUz Box kutish ro‘yxati",
      pl: "formularz i czat na stronie, rozmowa z botem studia, witryna, lista oczekujących DevUz Box",
    },
  },
  mockup: {
    title: { ru: "Макет из бота", uz: "Botdan maket", pl: "Makieta z bota" },
    note: {
      ru: "клиент сам собрал макет в боте или ждёт макет вручную",
      uz: "mijoz botda o‘zi maket yig‘di yoki qo‘lda maket kutmoqda",
      pl: "klient sam złożył makietę w bocie albo czeka na makietę ręczną",
    },
  },
};

/** Строка руководителю: вид никто не выбрал, лид ушёл всем. */
export function nobodyWantsNotice(kindTitle: string, label: string): string {
  return `🧭 Лид «${label}» — вид «${kindTitle}» не выбрал никто в очереди, поэтому он ушёл всем. Проверьте галочки «Какие лиды присылать» в «Команде».`;
}
