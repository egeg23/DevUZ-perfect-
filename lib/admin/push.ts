/**
 * Панель — приложение на телефоне: что уходит пушем и куда ведёт нажатие.
 *
 * Владелец, 17.10.2026: «если вынести её иконкой на телефоне на рабочий
 * стол, то уведомления приходят и оно как приложение становится. Если
 * менеджеры заходят с телефона, уведомления по лидам и тд чтобы приходили +
 * я могу делать рассылки». На план ответил: «Делаем».
 *
 * Пуш — зеркало сообщения бота сотруднику, а не свой текст: те же слова,
 * которые человек получил в Telegram, и только тому, кому бот их отправил.
 * Галочки «что приходит» применяются до отправки в Telegram — поэтому в
 * пуше совпадают сами. Здесь только правила, без базы и сети: их держит
 * tests/web-push.test.ts.
 */

/** Куда ведёт нажатие, если в сообщении нет кнопки в панель. */
export const PUSH_HOME = "/admin/hq";

/** Заголовок пуша — короткий: на экране блокировки больше не видно. */
export const PUSH_TITLE_MAX = 80;

/** Тело пуша: телефон всё равно показывает две-три строки. */
export const PUSH_BODY_MAX = 180;

/** Сколько ждём службу пуша, прежде чем бросить: Telegram это не задерживает. */
export const PUSH_TIMEOUT_MS = 5_000;

/** Сколько служба пуша держит сообщение, если телефон выключен. */
export const PUSH_TTL_SECONDS = 24 * 3600;

/**
 * Личный ли это чат человека. У групп и каналов номер отрицательный, а
 * «@имя» — это канал: пушем уходит только то, что бот написал человеку в
 * личку (личный чат = staff.telegram_user_id).
 */
export function privateChatId(chatId: number | string): number | null {
  const id = typeof chatId === "number" ? chatId : /^\d+$/.test(chatId) ? Number(chatId) : NaN;
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

const ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };

/** Текст сообщения бота (HTML Telegram) — в чистый текст. */
export function plainText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]*>/g, "")
    .replace(/&(#\d+|#x[0-9a-f]+|[a-z]+);/gi, (whole, name: string) => {
      if (name[0] === "#") {
        const code = name[1] === "x" || name[1] === "X" ? parseInt(name.slice(2), 16) : parseInt(name.slice(1), 10);
        return Number.isFinite(code) ? String.fromCodePoint(code) : whole;
      }
      return ENTITIES[name.toLowerCase()] ?? whole;
    });
}

function clip(text: string, max: number): string {
  return text.length <= max ? text : `${text.slice(0, max - 1).trimEnd()}…`;
}

/**
 * Заголовок — первая непустая строка без разметки, тело — остальное одной
 * строкой. Пустые строки и лишние пробелы съедаются: на экране блокировки
 * абзацы не видны, видна только длина.
 */
export function pushText(html: string): { title: string; body: string } {
  const lines = plainText(html)
    .split("\n")
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean);
  const title = clip(lines[0] ?? "DevUz", PUSH_TITLE_MAX);
  const body = clip(lines.slice(1).join(" · "), PUSH_BODY_MAX);
  return { title, body };
}

/** Кнопка сообщения бота — как её получает lib/qualify/telegram.ts. */
export type PushButton = { text: string } & ({ url: string } | { callback_data: string } | { panel: string });

/**
 * Адрес на нашем сайте → путь в панели или null.
 *
 * Вход по кнопке (`/admin/enter/…`, его строит enterUrl) ведёт туда же, куда
 * и кнопка: в приложении человек уже вошёл, и подпись Telegram ему не нужна.
 * Ссылка входа (`/admin/login?t=…`) — не адрес назначения: одноразовый
 * токен в пуше ни к чему, нажатие ведёт на «Главную».
 */
export function panelPath(href: string, site: string): string | null {
  let url: URL;
  try {
    url = new URL(href, site);
  } catch {
    return null;
  }
  const home = new URL(site);
  if (url.host !== home.host) return null;
  const path = url.pathname.replace(/\/+$/, "") || "/";
  if (path !== "/admin" && !path.startsWith("/admin/")) return null;
  if (path === "/admin/login" || path.startsWith("/admin/login/")) return PUSH_HOME;
  if (path === "/admin/enter" || path.startsWith("/admin/enter/")) {
    const rest = path.slice("/admin/enter".length);
    return `/admin${rest}${url.search}`;
  }
  return `${path}${url.search}${url.hash}`;
}

/**
 * Куда ведёт нажатие: первая кнопка-ссылка в панель, затем первая ссылка в
 * панель в самом тексте, иначе — «Главная».
 */
export function pushHref(html: string, rows: readonly (readonly PushButton[])[], site: string): string {
  for (const row of rows) {
    for (const button of row) {
      const href = "panel" in button ? button.panel : "url" in button ? button.url : null;
      const path = href ? panelPath(href, site) : null;
      if (path) return path;
    }
  }
  for (const match of html.matchAll(/href="([^"]+)"|(https?:\/\/[^\s<>"]+)/g)) {
    const path = panelPath(match[1] ?? match[2], site);
    if (path) return path;
  }
  return PUSH_HOME;
}

/** Что уходит в службу пуша — сервис-воркер (app/admin/sw.js) это и показывает. */
export type PushPayload = {
  title: string;
  body: string;
  url: string;
  /** Беззвучно — как `disable_notification` у Telegram (архивные лиды). */
  silent?: boolean;
};

export function pushPayload(
  html: string,
  rows: readonly (readonly PushButton[])[],
  site: string,
  silent = false,
): PushPayload {
  const { title, body } = pushText(html);
  return { title, body, url: pushHref(html, rows, site), ...(silent ? { silent: true } : {}) };
}

/**
 * Подпись устройства для «Команды» — по строке браузера. Точная модель не
 * нужна: владельцу важно «телефон или компьютер» и «приложение или вкладка».
 */
export function deviceLabel(userAgent: string | null, standalone: boolean): string {
  const ua = userAgent ?? "";
  const kind = /iPhone|iPod/.test(ua)
    ? "iPhone"
    : /iPad/.test(ua)
      ? "iPad"
      : /Android/.test(ua)
        ? "Android"
        : /Macintosh/.test(ua)
          ? "Mac"
          : /Windows/.test(ua)
            ? "Windows"
            : "—";
  const how = standalone
    ? "app"
    : /Edg\//.test(ua)
      ? "Edge"
      : /Firefox\//.test(ua)
        ? "Firefox"
        : /Chrome\//.test(ua)
          ? "Chrome"
          : /Safari\//.test(ua)
            ? "Safari"
            : "browser";
  return `${kind} · ${how}`;
}

/**
 * Ответ службы пуша: 404 и 410 — подписки больше нет (человек выключил
 * уведомления, удалил приложение, сбросил браузер). Такую строку удаляем,
 * а не пробуем снова — служба ответит тем же.
 */
export function subscriptionGone(status: number): boolean {
  return status === 404 || status === 410;
}

/** Подписка от браузера — то, что приходит из `PushSubscription.toJSON()`. */
export type BrowserSubscription = { endpoint: string; keys: { p256dh: string; auth: string } };

/**
 * Службы пуша браузеров: Chrome и Edge на Android — Google, Firefox — Mozilla,
 * Safari и iPhone — Apple, Edge на Windows — Microsoft. Адрес подписки
 * присылает браузер, и сервер потом сам шлёт на него POST: без этого списка
 * подписка с адресом внутренней службы превращала бы отправку пуша в запрос
 * туда, куда нам ходить нельзя.
 */
const PUSH_HOSTS = ["fcm.googleapis.com", "push.services.mozilla.com", "push.apple.com", "notify.windows.com"];

export function pushHostAllowed(endpoint: string): boolean {
  let url: URL;
  try {
    url = new URL(endpoint);
  } catch {
    return false;
  }
  if (url.protocol !== "https:" || url.port || url.username || url.password) return false;
  const host = url.hostname.toLowerCase();
  return PUSH_HOSTS.some((h) => host === h || host.endsWith(`.${h}`));
}

/** Проверка того, что прислал браузер: адрес службы — только https и только служба пуша. */
export function parseSubscription(raw: unknown): BrowserSubscription | null {
  if (!raw || typeof raw !== "object") return null;
  const { endpoint, keys } = raw as { endpoint?: unknown; keys?: { p256dh?: unknown; auth?: unknown } };
  if (typeof endpoint !== "string" || endpoint.length > 1000 || !pushHostAllowed(endpoint)) return null;
  const p256dh = keys?.p256dh;
  const auth = keys?.auth;
  if (typeof p256dh !== "string" || typeof auth !== "string") return null;
  if (!/^[A-Za-z0-9_-]{20,200}=*$/.test(p256dh) || !/^[A-Za-z0-9_-]{8,100}=*$/.test(auth)) return null;
  return { endpoint, keys: { p256dh, auth } };
}
