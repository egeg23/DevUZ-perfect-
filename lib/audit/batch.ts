import { analyze, type AuditReport, type Finding } from "@/lib/audit/checks";
import { pitch } from "@/lib/audit/pitch";
import { probe } from "@/lib/audit/fetch";
// Разбор адреса — из чистого модуля: этот файл импортирует и браузер
// (страница касаний показывает разбор до прогона), а guard тянет node:dns.
import { BlockedAddress, normalizeUrl } from "@/lib/audit/url";

/**
 * Пакетный аудит: тот же аудитор, но по списку.
 *
 * Смысл не в объёме, а в том, чем заканчивается: на выходе не таблица
 * баллов, а конкретная находка по каждому сайту, из которой пишется первое
 * касание. Сообщение с реальной находкой работает в любом канале; сообщение
 * без находки не спасёт никакой канал — поэтому здесь строится находка, а
 * не рассылка.
 *
 * Список приносит человек. Собирать его автоматическим обходом чужих
 * каталогов этот модуль не умеет и не будет: там, где начинается выгрузка
 * чужих баз, начинаются и правила, которые мы не проверяли. Публичный сайт
 * компании мы открываем ровно так же, как его открывает любой посетитель, —
 * это и есть граница.
 */

export type BatchTarget = {
  /** Как ввёл человек — показывается в результатах, чтобы он узнал свою строку. */
  raw: string;
  /** Нормализованный адрес или null, если разобрать не вышло. */
  url: string | null;
  /** Имя компании, если его дали рядом с адресом. */
  label: string | null;
  /** Почему адрес отвергнут. */
  problem: string | null;
};

export type BatchRow = {
  target: BatchTarget;
  report: AuditReport | null;
  /** Причина, по которой отчёта нет. */
  failure: string | null;
};

/** Сколько адресов принимаем за один прогон. */
export const BATCH_CAP = 200;

/**
 * Разбор вставленного списка.
 *
 * Принимаем то, что человек реально копирует: строку с адресом, строку
 * «Название — адрес», выгрузку с табуляцией, список с запятыми. Разделять
 * имя и адрес по первому же пробелу нельзя — в названиях компаний пробелы
 * есть у всех, а в адресах их не бывает. Поэтому ищем в строке то, что
 * похоже на домен, а остальное считаем названием.
 */
export function parseTargets(text: string): BatchTarget[] {
  const seen = new Set<string>();
  const out: BatchTarget[] = [];

  for (const line of text.split(/[\r\n]+/)) {
    const raw = line.trim();
    if (!raw) continue;
    if (out.length >= BATCH_CAP) break;

    // Кандидат в адрес: кусок без пробелов, в котором есть точка.
    const token =
      raw.split(/[\s,;|]+/).find((part) => /\./.test(part) && !/^[.,;|]+$/.test(part)) ?? "";

    const label = raw
      .replace(token, "")
      .replace(/[\s,;|—–-]+$/g, "")
      .replace(/^[\s,;|—–-]+/g, "")
      .trim();

    if (!token) {
      out.push({ raw, url: null, label: label || null, problem: "не нашёл адреса в строке" });
      continue;
    }

    let url: string;
    try {
      url = normalizeUrl(token).href;
    } catch (error) {
      const reason = error instanceof BlockedAddress ? error.reason : "не похоже на адрес сайта";
      out.push({ raw, url: null, label: label || null, problem: String(reason) });
      continue;
    }

    // В домене есть буквы — всегда, хотя бы в зоне. Правило отсекает то, что
    // регулярно попадает в такие списки и внешне похоже на адрес: телефоны с
    // точками («+998.90.1234567») и голые IP. Без него менеджер получил бы
    // строку «сайт не отвечает» по номеру телефона и пошёл бы разбираться,
    // что у клиента с хостингом.
    const host = new URL(url).hostname;
    if (!/[a-z]/i.test(host)) {
      out.push({ raw, url: null, label: label || null, problem: "не похоже на адрес сайта" });
      continue;
    }

    // Дубли: один и тот же сайт в списке дважды — обычное дело в выгрузках, и
    // проверять его дважды значит два раза постучаться к человеку, который ни
    // о чём не просил.
    //
    // Ключ сравнения — хост без `www.`: в списках соседствуют «romashka.uz» и
    // «www.romashka.uz», и для нас это один бизнес. Стучаться мы при этом
    // будем по тому адресу, который дали, — www и апекс настроены по-разному
    // чаще, чем кажется, и подменять одно другим мы не вправе.
    const key = host.replace(/^www\./, "");
    if (seen.has(key)) continue;
    seen.add(key);

    out.push({ raw, url, label: label || null, problem: null });
  }

  return out;
}

/**
 * Почему сайт не открылся — словами, а не кодом ошибки.
 *
 * Недоступный сайт здесь, как и в одиночном аудите, не сбой, а находка:
 * перед нами бизнес, у которого сайт не работает. Разница только в том, что
 * в пакете это надо отличать от нашей собственной ошибки.
 */
function unreachableWhy(error: unknown): string {
  const code = (error as NodeJS.ErrnoException)?.code ?? "";
  if (code === "ENOTFOUND") return "домен не найден";
  if (code === "ECONNREFUSED") return "сервер отклонил соединение";
  if (code === "ETIMEDOUT" || /timeout/i.test(String(error))) return "не дождались ответа";
  if (/certificate|CERT_/i.test(String(error))) return "проблема с сертификатом";
  return "нет соединения";
}

function unreachableReport(url: string, why: string): AuditReport {
  return {
    url,
    score: 0,
    findings: [
      {
        code: "unreachable",
        severity: "critical",
        title: "Сайт не отвечает",
        impact: `Не открылся: ${why}. Клиент, набравший адрес, видит ровно то же самое.`,
      },
    ],
    facts: { https: false, ttfbMs: 0, platform: null, isShop: false, certDaysLeft: null },
  };
}

/**
 * Проверить один адрес.
 *
 * Отдельной функцией, потому что вызывающий сам решает, сколько их запускать
 * разом: страница панели идёт короткими пачками, чтобы человек видел
 * движение, а не ждал пять минут в тишине.
 */
export async function auditOne(target: BatchTarget): Promise<BatchRow> {
  if (!target.url) return { target, report: null, failure: target.problem ?? "адрес не разобран" };

  try {
    return { target, report: analyze(await probe(target.url)), failure: null };
  } catch (error) {
    // Адрес, уводящий во внутреннюю сеть, — это не находка о клиенте, а
    // попытка использовать нас сканером. Отчёта не будет.
    if (error instanceof BlockedAddress) {
      return { target, report: null, failure: `адрес отклонён: ${error.reason}` };
    }
    return { target, report: unreachableReport(target.url, unreachableWhy(error)), failure: null };
  }
}

/**
 * Сколько адресов в одной пачке.
 *
 * Живёт здесь, а не рядом с действием сервера: файл с «use server» может
 * экспортировать только асинхронные функции, и константа оттуда не выходит
 * вовсе. Восемь секунд на сайт — значит потолок ответа около сорока секунд.
 */
export const CHUNK = 5;

/** Строка результата — то, что видит менеджер и что уходит в выгрузку. */
export type ProspectRow = {
  raw: string;
  url: string | null;
  label: string | null;
  score: number | null;
  findings: Finding[];
  /** Черновик письма либо null, если писать не о чем. */
  draft: string | null;
  note: string | null;
};

export function toProspectRow(row: BatchRow): ProspectRow {
  const { target, report, failure } = row;

  if (!report) {
    return {
      raw: target.raw,
      url: target.url,
      label: target.label,
      score: null,
      findings: [],
      draft: null,
      note: failure,
    };
  }

  const draft = pitch(report, target.label);

  return {
    raw: target.raw,
    url: target.url,
    label: target.label,
    score: report.score,
    findings: report.findings,
    draft: draft.ok ? draft.text : null,
    note: draft.ok ? null : draft.why,
  };
}
