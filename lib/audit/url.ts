/**
 * Разбор адреса — та часть защиты, где нет сети.
 *
 * Вынесена из guard.ts не ради красоты: страница холодных касаний разбирает
 * вставленный список прямо в браузере, чтобы показать человеку, что именно
 * распозналось, ДО того как мы пойдём стучаться к полусотне чужих сайтов. А
 * guard.ts начинается с `node:dns/promises`, и импорт из него утаскивает в
 * браузерный бандл весь серверный хвост — сборка на этом и падает.
 *
 * Здесь только проверки формы: схема, порт, учётные данные. Всё, что требует
 * резолва имени и знания о приватных сетях, осталось в guard.ts и выполняется
 * на сервере. Браузерному разбору сервер не верит и проверяет адрес заново.
 */

export type GuardFailure =
  | "scheme"      // не http и не https
  | "shape"       // не разбирается как адрес
  | "port"        // нестандартный порт
  | "dns"         // имя не резолвится
  | "private";    // резолвится во внутреннюю сеть

export class BlockedAddress extends Error {
  readonly reason: GuardFailure;
  readonly detail: string;

  // Поля объявлены явно, а не сокращением `constructor(readonly reason)`:
  // сокращение порождает код, а не только типы, и node в режиме strip-only
  // его не исполняет — то есть модуль перестал бы быть покрываемым тестами.
  constructor(reason: GuardFailure, detail: string) {
    super(`${reason}: ${detail}`);
    this.name = "BlockedAddress";
    this.reason = reason;
    this.detail = detail;
  }
}

/** Порты, кроме которых у публичного сайта делать нечего. */
const ALLOWED_PORTS = new Set(["", "80", "443", "8080", "8443"]);

/**
 * Приводит то, что ввёл человек, к адресу.
 *
 * Люди пишут «mysite.uz», «www.mysite.uz/», «MYSITE.UZ» и «https://mysite.uz».
 * Требовать схему — значит терять половину обращений на форме.
 */
export function normalizeUrl(raw: string): URL {
  const trimmed = raw.trim();
  if (!trimmed) throw new BlockedAddress("shape", "пусто");

  // Схему ищем любую, а не только веб-овую. Наивная проверка на `http`
  // приводит к дыре: `file:///etc/passwd` её не проходит, получает спереди
  // `https://` и превращается в разбираемый `https://file:///etc/passwd`
  // с хостом `file` — то есть проверка протокола ниже уже ничего не ловит.
  // Двоеточие в строке — это либо схема, либо порт, и различать их
  // обязательно: иначе `mysite.uz:8443` разбирается как схема «mysite.uz»
  // и легитимный адрес отвергается. Порт — это только цифры до конца
  // строки или до слэша.
  const colon = trimmed.match(/^([a-z][a-z0-9+.-]*):(.*)$/i);
  const isPort = colon ? /^\d+([/?#].*)?$/.test(colon[2]) : false;
  if (colon && !isPort && !/^https?$/i.test(colon[1])) {
    throw new BlockedAddress("scheme", `${colon[1]}:`);
  }
  const hasScheme = Boolean(colon) && !isPort;
  const withScheme = hasScheme ? trimmed : `https://${trimmed}`;

  let url: URL;
  try {
    url = new URL(withScheme);
  } catch {
    throw new BlockedAddress("shape", trimmed.slice(0, 80));
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new BlockedAddress("scheme", url.protocol);
  }
  if (!ALLOWED_PORTS.has(url.port)) {
    throw new BlockedAddress("port", url.port);
  }
  // Учётные данные в адресе — признак попытки запутать разбор, а не сайта.
  url.username = "";
  url.password = "";
  url.hash = "";
  return url;
}
