// Куда ходит суфлёр: облако DevUz или коробка DevUz Box в сети колл-центра.
// Здесь нет ни браузера, ни сети: проверка адреса и строка о доступе. Это
// проверяет тест (tests/callhelper-extension.test.ts).
//
// Безопасность. Ключ оператора уходит в каждом запросе, поэтому адрес — только:
// - облако https://devuz.studio;
// - коробка в локальной сети: имя .local или внутренний адрес (10.x, 172.16-31.x,
//   192.168.x, 169.254.x, 127.x, IPv6 fc00::/7, fe80::/10, ::1). Тут можно и
//   https, и http: трафик не выходит из сети офиса.
// Любой другой адрес в интернете не принимается: иначе ключ можно выманить,
// подсунув оператору чужой сервер.

export const CLOUD_ORIGIN = "https://devuz.studio";
export const API_PATH = "/api/callhelper/v1";

const ERR = {
  empty: "Впишите адрес сервера.",
  bad: "Адрес не разобрать. Пример: https://devuz-1234.local или https://192.168.1.10",
  scheme: "Адрес начинается с https:// (или http:// для коробки в вашей сети).",
  login: "В адресе не должно быть логина и пароля.",
  path: "Только адрес, без пути: например https://192.168.1.10, а не https://192.168.1.10/office.",
  public: "Можно только https://devuz.studio или адрес коробки DevUz в вашей сети (имя .local или адрес вида 192.168…).",
};

function privateV4(host) {
  const m = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(host);
  if (!m) return false;
  const [a, b] = m.slice(1).map(Number);
  if ([a, b, Number(m[3]), Number(m[4])].some((n) => n > 255)) return false;
  return a === 10 || a === 127 || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 169 && b === 254);
}

function privateV6(host) {
  if (!host.startsWith("[") || !host.endsWith("]")) return false;
  const h = host.slice(1, -1).toLowerCase();
  if (h === "::1") return true;
  if (/^f[cd][0-9a-f]{0,2}:/.test(h)) return true; // fc00::/7
  if (/^fe[89ab][0-9a-f]?:/.test(h)) return true; // fe80::/10
  const mapped = /^::ffff:(\d+\.\d+\.\d+\.\d+)$/.exec(h);
  return mapped ? privateV4(mapped[1]) : false;
}

/** Адрес в сети офиса: сюда ключ можно слать и по http. */
export function isLocalHost(hostname) {
  const h = String(hostname || "").toLowerCase();
  if (h.endsWith(".local") && h.length > ".local".length && !h.includes("..")) return true;
  return privateV4(h) || privateV6(h);
}

/**
 * Проверяет адрес, который оператор вписал в «Адрес сервера».
 * → { ok: true, origin, local } или { ok: false, error: текст для экрана }.
 */
export function checkServer(input) {
  let text = String(input ?? "").trim();
  if (!text) return { ok: false, error: ERR.empty };
  if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(text)) text = `https://${text}`;
  let url;
  try {
    url = new URL(text);
  } catch {
    return { ok: false, error: ERR.bad };
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return { ok: false, error: ERR.scheme };
  if (url.username || url.password) return { ok: false, error: ERR.login };
  if ((url.pathname && url.pathname !== "/") || url.search || url.hash) return { ok: false, error: ERR.path };
  if (!url.hostname) return { ok: false, error: ERR.bad };
  if (url.origin === CLOUD_ORIGIN) return { ok: true, origin: CLOUD_ORIGIN, local: false };
  if (!isLocalHost(url.hostname)) return { ok: false, error: url.protocol === "http:" ? ERR.scheme : ERR.public };
  return { ok: true, origin: url.origin, local: true };
}

/** Шаблон права для chrome.permissions: имя без порта (шаблон без порта подходит к любому). */
export function permissionFor(origin) {
  const url = new URL(origin);
  return `${url.protocol}//${url.hostname}/*`;
}

/** Ответ /me пришёл от коробки: у неё нет тарифа, пробного периода и минут. */
export const isBox = (me) => me?.org?.plan === "box" || (me != null && "box_class" in me);

/** Строка о доступе над сценарием. Пустые поля коробки не показываем словами «null». */
export function quotaLine(me) {
  const access = me?.access || {};
  if (!access.ok) return "";
  const num = (v) => typeof v === "number" && Number.isFinite(v);
  if (isBox(me)) return me.box_class ? `Коробка DevUz, класс «${me.box_class}».` : "Коробка DevUz.";
  if (num(access.hours_left) && num(access.minutes_left)) return `Пробный период: осталось ${access.minutes_left} мин и ${access.hours_left} ч.`;
  if (num(access.minutes_included) && num(access.minutes_left)) return `Минут в этом месяце осталось: ${access.minutes_left}.`;
  if (num(access.minutes_left)) return `Пробный период: ${access.minutes_left} минут с первого звонка.`;
  return "";
}
