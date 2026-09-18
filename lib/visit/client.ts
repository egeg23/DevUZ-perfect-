/**
 * Память вкладки о том, откуда человек к нам попал. Только браузер.
 *
 * Нужна ради одной строки в уведомлении менеджеру: «перешёл с google.com»
 * или «прямой заход». Без неё источник у всех лидов один — наш собственный
 * сайт: к моменту, когда человек напишет в чат, он успеет походить по
 * страницам, и document.referrer будет показывать devuz.studio.
 *
 * Поэтому запоминается первое касание и живёт оно во вкладке
 * (sessionStorage): это одно посещение, а не вечная метка. Всё в try/catch
 * — приватное окно и отключённое хранилище не должны ломать чат.
 */

const KEY = "devuz_from";
const HOST = /^[a-z0-9._-]{2,60}$/;

/** utm_source важнее реферера: так источник помечает себя сам. */
const UTM = "utm_source";

function ownHost(host: string): boolean {
  try {
    return host === window.location.hostname.replace(/^www\./, "");
  } catch {
    return false;
  }
}

function clean(raw: string): string | null {
  const host = raw.trim().toLowerCase().replace(/^www\./, "").slice(0, 60);
  return HOST.test(host) && !ownHost(host) ? host : null;
}

/**
 * Запомнить источник, если ещё не помним. Первое касание побеждает: человек
 * пришёл из поиска, потом вернулся по закладке — привёл его поиск.
 */
export function rememberVisit(): void {
  try {
    if (window.sessionStorage.getItem(KEY)) return;

    const utm = new URLSearchParams(window.location.search).get(UTM);
    const referrer = document.referrer ? new URL(document.referrer).hostname : "";
    const from = (utm && clean(utm)) || (referrer && clean(referrer)) || "";

    // Пустая строка тоже запоминается — это и есть ответ «пришёл напрямую».
    // Без неё каждый следующий внутренний переход переписывал бы источник
    // на наш собственный хост.
    window.sessionStorage.setItem(KEY, from);
  } catch {
    // Без хранилища источник будет неизвестен — переживём.
  }
}

/** Откуда пришёл, или null, если напрямую либо хранилище недоступно. */
export function readVisit(): string | null {
  try {
    return window.sessionStorage.getItem(KEY) || null;
  } catch {
    return null;
  }
}

/** Страница, на которой человек сейчас, — без параметров и якоря. */
export function currentPage(): string | null {
  try {
    return window.location.pathname || null;
  } catch {
    return null;
  }
}
