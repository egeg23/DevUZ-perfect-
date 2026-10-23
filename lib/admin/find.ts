/**
 * Поиск компаний и лидов в «Найти раздел» (Ctrl+K).
 *
 * Владелец, 23.10.2026, на разбор удобства панели: «Делаем все сразу». До
 * этого Ctrl+K искал только названия разделов, а компанию находили
 * листанием по 50 строк или в Telegram. Здесь — чистые правила: как
 * читать строку поиска, что из неё можно подставить в запрос базы и как
 * назвать найденное. Запросы — lib/admin/find-store.ts.
 *
 * Что кому видно — как в разделах: лиды — в круге человека (свободные и
 * свои у менеджера, все у руководителя и владельца); по телефону и @нику
 * менеджер ищет только среди своих лидов — контакт чужого ему не открыт и
 * в карточке; касания и проекты открыты всем, кто видит их разделы.
 */

export const FIND_MIN = 2;
export const FIND_MAX = 60;
/** Сколько строк каждого вида — окно поиска не должно превращаться в список. */
export const FIND_PER_KIND = 6;

export type FindKind = "lead" | "prospect" | "project";

export type FindHit = {
  kind: FindKind;
  href: string;
  label: string;
  /** Вторая строка: статус, чей, сайт — что помогает узнать нужное. */
  meta: string | null;
};

/**
 * Строка из рук человека — в то, что можно подставить в фильтр PostgREST.
 * Запятые, скобки, кавычки, звёздочки и обратный слэш режут условие —
 * выбрасываем; длину режем. Короче двух знаков — не ищем.
 */
export function cleanQuery(raw: string | null | undefined): string | null {
  const q = (raw ?? "")
    .replace(/[,()*%\\"'`:]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, FIND_MAX);
  return q.length >= FIND_MIN ? q : null;
}

/** Похоже на контакт: телефон (5+ цифр), @ник или почта. */
export function looksLikeContact(q: string): boolean {
  return q.startsWith("@") || q.includes("@") || q.replace(/\D/g, "").length >= 5;
}

/** Варианты контакта для поиска: как набрали, без @ и только цифры телефона. */
export function contactNeedles(q: string): string[] {
  const out = new Set<string>([q]);
  if (q.startsWith("@")) out.add(q.slice(1));
  const digits = q.replace(/\D/g, "");
  if (digits.length >= 5) out.add(digits);
  return [...out].filter((n) => n.length >= FIND_MIN);
}

/** Условие «или» по столбцам: company.ilike.*q*,… */
export function ilikeAny(columns: readonly string[], needles: readonly string[]): string {
  return columns.flatMap((c) => needles.map((n) => `${c}.ilike.*${n}*`)).join(",");
}

/** Хост без www и протокола — так компанию узнают в списке касаний. */
export function hostOf(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    return new URL(url.includes("://") ? url : `https://${url}`).host.replace(/^www\./, "") || null;
  } catch {
    return null;
  }
}

/** Порядок в окне: сначала лиды, потом касания, потом проекты; без повторов одного адреса. */
export function mergeHits(groups: readonly (readonly FindHit[])[]): FindHit[] {
  const seen = new Set<string>();
  const out: FindHit[] = [];
  for (const group of groups) {
    for (const hit of group.slice(0, FIND_PER_KIND)) {
      if (seen.has(hit.href)) continue;
      seen.add(hit.href);
      out.push(hit);
    }
  }
  return out;
}
