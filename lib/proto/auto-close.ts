/**
 * Макет открыт 24 часа, потом — только по паролю.
 *
 * Владелец, 14.10.2026: «Убедись, что все макеты, которые мы делаем,
 * доступны 24 часа, после автоматически переходят на пароль. Не завязывай
 * это правило на ИИ, сделай сценарием».
 *
 * Правило для каждого прототипа из «Макетов» (protos, кроме собранных ботом
 * для касаний — auto):
 * - 24 часа считаются с момента, когда ссылка впервые ушла клиенту
 *   (mockup_offers.sent_at); не знаем об отправке — с первого открытия не
 *   нами (protos.opened_at: наши открытия из панели и превью мессенджеров
 *   туда не идут); не открывали — с публикации (protos.created_at);
 * - через 24 часа свип закрывает макет так же, как первый пароль из
 *   «Сгенерировать пароль»: protos.closed_at. Дальше — пароли на сутки;
 * - уже закрытый не трогаем; постоянный пароль владельца (facts.lock) —
 *   главнее: с lockAt макет закрывается в свой час, без него он и так закрыт;
 * - facts.open — владелец велел держать макет открытым без пароля (SamAuto,
 *   21.10.2026: «сделаем в виде макета без пароля»). Ручная настройка главнее
 *   правила: свип его не закрывает. «Сгенерировать пароль» закроет и его.
 *
 * Витрина cases.devuz.studio сюда не входит: это наши работы для сайта
 * студии, открытые нарочно (SHOWCASE_LOCK — только по решению владельца).
 *
 * Здесь чистая арифметика: «сейчас» приходит аргументом. База —
 * lib/proto/auto-close-store.ts.
 */

export const OPEN_HOURS = 24;
export const OPEN_MS = OPEN_HOURS * 3600_000;

/** Закрылся позже своего часа больше чем на это — старый хвост: одной сводкой, без кнопки на каждый. */
export const LATE_MS = 60 * 60_000;

export type OpenFrom = "sent" | "opened" | "published";

export type AutoCloseInput = {
  auto: boolean | null;
  closedAt: string | null;
  /** facts.lock — постоянный пароль владельца (хеш). */
  lock: string | null;
  /** facts.lockAt — с какой минуты он действует. */
  lockAt: string | null;
  /** Первая отправка ссылки клиенту (mockup_offers). */
  sentAt: string | null;
  /** Первое открытие не нами. */
  openedAt: string | null;
  createdAt: string;
  /** facts.open — открыт без пароля по слову владельца. */
  open?: boolean;
};

const time = (iso: string | null | undefined): number | null => {
  if (!iso) return null;
  const t = Date.parse(iso);
  return Number.isFinite(t) ? t : null;
};

/** С какой минуты идут 24 часа и почему. */
export function openFrom(i: Pick<AutoCloseInput, "sentAt" | "openedAt" | "createdAt">): { at: number; by: OpenFrom } {
  const sent = time(i.sentAt);
  if (sent !== null) return { at: sent, by: "sent" };
  const opened = time(i.openedAt);
  if (opened !== null) return { at: opened, by: "opened" };
  return { at: time(i.createdAt) ?? 0, by: "published" };
}

/**
 * Когда правило закроет макет. null — правило его не касается: собран ботом,
 * уже закрыт, на нём постоянный пароль владельца или владелец велел держать
 * его открытым.
 */
export function autoCloseAt(i: AutoCloseInput): number | null {
  if (i.auto === true || i.closedAt || i.lock || i.open) return null;
  return openFrom(i).at + OPEN_MS;
}

/** Пора закрывать. */
export function closeDue(i: AutoCloseInput, now: Date): boolean {
  const at = autoCloseAt(i);
  return at !== null && now.getTime() >= at;
}

/**
 * Когда макет перестанет открываться без пароля — для «открыт ещё N ч» в
 * «Макетах». Ручной lockAt — его час; иначе — правило. null — уже закрыт
 * или не закрывается.
 */
export function closesAt(i: AutoCloseInput, now: Date): number | null {
  if (i.closedAt) return null;
  if (i.lock) {
    const at = time(i.lockAt);
    return at !== null && at > now.getTime() ? at : null;
  }
  return autoCloseAt(i);
}

/** «открыт ещё N ч»: целые часы вверх, не меньше 1, пока не закрыт. */
export function hoursLeft(at: number, now: Date): number {
  return Math.max(1, Math.ceil((at - now.getTime()) / 3600_000));
}

/** Строка в бот тому, кто отправлял макет. */
export function closedText(name: string): string {
  return `🔒 Макет «${name}» закрылся паролем: прошло 24 часа. Нужен клиенту — нажмите «Сгенерировать пароль».`;
}

/** Сводка старых: макеты, которые закрылись разом при первом проходе правила. */
export function closedDigest(names: readonly string[]): string | null {
  if (!names.length) return null;
  const list = names.slice(0, 20).map((n) => `• ${n}`);
  const more = names.length > 20 ? [`…и ещё ${names.length - 20}`] : [];
  return [
    `🔒 Макеты открыты 24 часа, потом — по паролю. Закрылись паролем: ${names.length}`,
    ...list,
    ...more,
    "Нужен клиенту — «Сгенерировать пароль» в разделе «Макеты» или «🔒 Закрыть паролем» в «Макетах клиентов».",
  ].join("\n");
}

/** Кнопка «Сгенерировать пароль» под строкой: mc:<id прототипа>. */
export const CODE_CALLBACK = "mc";

export function parseCodeCallback(parts: readonly string[]): { protoId: string } | null {
  if (parts[0] !== CODE_CALLBACK || parts.length !== 2) return null;
  return /^[0-9a-f-]{36}$/.test(parts[1]) ? { protoId: parts[1] } : null;
}
