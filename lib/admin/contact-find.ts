import { cleanQuery } from "@/lib/admin/find";
import type { Role } from "@/lib/admin/roles";

/**
 * Контакт клиента в боте — владельцу и руководителю.
 *
 * Владелец, 24.10.2026: написал боту «Напомни контакт Adar» и не получил
 * ничего, а помощник в базу не ходит и данных клиентов не выдаёт. «Делаем
 * оба»: помощник отвечает и в чате владельца (он же чат брифов), а
 * владельцу и руководителю бот ищет контакт по имени, компании, сайту или
 * номеру заявки — в лидах, касаниях и проектах, каждый показ в журнал.
 * Менеджеру — как было: его вопрос идёт помощнику, контакт чужого лида ему
 * не открыт и в панели. Здесь — правила: что считать вопросом о контакте и
 * как написать ответ; запросы — lib/admin/contact-find-store.ts.
 */

export const CONTACT_ROLES: readonly Role[] = ["admin", "head"];

/** Сколько строк каждого вида: ответ в Telegram, а не выгрузка базы. */
export const CONTACT_PER_KIND = 4;

/** Длиннее — это уже вопрос помощнику, а не имя клиента. */
export const CONTACT_MAX_WORDS = 5;

export function seesContacts(role: Role): boolean {
  return CONTACT_ROLES.includes(role);
}

/**
 * «Напомни контакт Adar», «контакт Дилмурод», «телефон adar.uz», «найди
 * контакт DZ-1016-KCDE», «kontakt Adar», «/contact Adar» — строка поиска.
 * Начинается не с этого («как открыть контакт клиента?») — не вопрос о
 * контакте: его разбирает помощник.
 */
const ASK =
  /^\s*(?:\/(?:contact|kontakt)(?:@\w+)?\s+|(?:(?:напомни|найди|подскажи|дай|скинь|покажи|пришли|topib\s+ber|eslat)\s+)?(?:мне\s+)?(?:контакт\p{L}*|телефон\p{L}*|номер\s+телефона|kontakt\p{L}*|telefon\p{L}*)\s+(?:у\s+|клиента\s+|компании\s+|от\s+|для\s+)?)/iu;

export function contactAsk(text: string | null | undefined): string | null {
  const raw = text ?? "";
  const match = ASK.exec(raw);
  if (!match) return null;
  const rest = raw.slice(match[0].length).replace(/[?!.]+\s*$/u, "");
  const q = cleanQuery(rest);
  if (!q || q.split(" ").length > CONTACT_MAX_WORDS) return null;
  return q;
}

export type ContactHit = {
  kind: "lead" | "prospect" | "project";
  /** Компания, имя, сайт или название проекта. */
  title: string;
  /** Телефон, @ник или почта — как в базе; null — контакта нет. */
  contact: string | null;
  contactKind: string | null;
  /** Номер заявки, сайт, клиент проекта. */
  ref: string | null;
  /** Статус словами и кто ведёт. */
  state: string | null;
  /** Путь в панели. */
  href: string;
  /** У проекта — откуда контакт («из лида DZ-…»). */
  via?: string | null;
};

const LEAD_STATUS: Record<string, string> = {
  new: "новый",
  taken: "в работе",
  dropped: "отложен",
  won: "выигран",
  lost: "проигран",
};

export function leadState(status: string | null, owner: string | null): string | null {
  const word = status ? (LEAD_STATUS[status] ?? status) : null;
  return [word, owner ? `ведёт ${owner}` : null].filter(Boolean).join(" · ") || null;
}

/** Статусы касаний, какие есть в базе. */
const PROSPECT_STATUS: Record<string, string> = {
  new: "ещё не писали",
  contacting: "пишем",
  sent: "написали",
  manual: "вручную",
  skipped: "пропущено",
  failed: "не ушло",
};

export function prospectState(status: string | null, owner: string | null): string | null {
  const word = status ? (PROSPECT_STATUS[status] ?? status) : null;
  return [word, owner ? `пишет ${owner}` : null].filter(Boolean).join(" · ") || null;
}

/** «+998 71 277-00-00» — как набирать; ник — с @. */
export function contactLine(contact: string | null, kind: string | null): string {
  const value = (contact ?? "").trim();
  if (!value || kind === "none") return "контакта нет";
  if (kind === "telegram" || kind === "handle" || value.startsWith("@")) {
    return `✈️ ${value.startsWith("@") ? value : `@${value}`}`;
  }
  if (value.includes("@")) return `✉️ ${value}`;
  return `📞 ${value}`;
}

const ICON: Record<ContactHit["kind"], string> = { lead: "👤", prospect: "🌐", project: "📁" };
const KIND_WORD: Record<ContactHit["kind"], string> = { lead: "лид", prospect: "касание", project: "проект" };

/**
 * Ответ в Telegram. `esc` — экранирование HTML бота: имена и контакты
 * пришли из базы, а туда — от клиентов и из карт.
 */
export function contactReply(query: string, hits: readonly ContactHit[], base: string, esc: (s: string) => string): string {
  if (!hits.length) {
    return `🔎 По «${esc(query)}» ничего не нашёл: ни в лидах, ни в касаниях, ни в проектах. Попробуйте имя клиента, название компании, сайт или номер заявки.`;
  }
  const blocks = hits.map((h) => {
    const head = [`${ICON[h.kind]} <b>${esc(h.title)}</b>`, [KIND_WORD[h.kind], h.ref].filter(Boolean).map((s) => esc(String(s))).join(" ")].join(" · ");
    const tail = [contactLine(h.contact, h.contactKind), h.via, h.state].filter(Boolean).map((s) => esc(String(s))).join(" · ");
    return [head, tail, `${base}${h.href}`].join("\n");
  });
  return [`🔎 Контакт: «${esc(query)}»`, "", blocks.join("\n\n"), "", "Показ контакта записан в журнал."].join("\n");
}
