import { analyze, type Finding } from "@/lib/audit/checks";
import { broken, type PageProbe } from "@/lib/audit/fetch";

/**
 * Проверка сайта по факту — обязательная, перед тем как писать письмо.
 *
 * Правило владельца, 05.10.2026: «прикрути обязательное правило — проверка
 * сайта по факту перед составлением текста касания». Повод — два письма
 * подряд, которые говорили владельцу о его сайте неправду: it-academy.uz
 * («контента нет», а он был) и cherrystore.uz («несуществующие страницы»,
 * а на деле лёг каталог).
 *
 * Как устроено. Обход сайта — это один взгляд, и он может ошибиться:
 * случайный сбой, страница, которую сайт отдаёт роботу иначе, чем человеку,
 * охрана, принявшая нас за налёт. Поэтому до обхода сайт открывается ещё раз,
 * отдельно и так, как его открывает покупатель, — телефонным браузером
 * (lib/audit/fetch.ts, BROWSER_UA). В письмо идёт только то, что повторилось
 * на этой второй загрузке:
 *
 * — «сайт не открывается» — только если не открылся и второй раз;
 * — всё, что видно на главной (нет телефона, нет цен, заглушка, старый год),
 *   — только если то же правило нашло это и во второй странице;
 * — битые разделы и картинки — перезапрашиваются по своим адресам, и если
 *   все открылись, находки нет.
 *
 * То, что второй загрузкой не проверить (карта сайта, вес, обход нескольких
 * страниц), остаётся как есть: оно снято явным запросом, а не догадкой.
 *
 * Посмотреть сайт второй раз не вышло совсем — письма нет: писать о сайте,
 * который мы не смогли перепроверить, правило запрещает.
 */

export type DroppedFinding = { code: string; title: string; why: "not_repeated" | "opened_again" };

export type FactCheck =
  | { ok: true; findings: Finding[]; dropped: DroppedFinding[]; at: string }
  | { ok: false; why: "no_second_look" };

/** Сколько адресов битых ссылок и картинок перезапрашиваем — не больше. */
const RECHECK_LIMIT = 3;

const NETWORK = new Set(["unreachable", "http_error"]);

export async function factCheck(input: {
  /** Итоговые находки обхода. */
  findings: readonly Finding[];
  /** Главная из обхода — со стилями, ссылками и картинками. null — обход не открыл сайт. */
  home: PageProbe | null;
  /** Вторая, независимая загрузка главной браузером. null — не открылась. */
  second: PageProbe | null;
  /** Перезапрос адресов браузером (lib/audit/fetch.ts → recheck). */
  recheck: (urls: readonly string[]) => Promise<(number | null)[]>;
  now?: Date;
}): Promise<FactCheck> {
  const now = input.now ?? new Date();
  const at = now.toISOString();
  const findings = [...input.findings];
  const dropped: DroppedFinding[] = [];
  const drop = (f: Finding, why: DroppedFinding["why"]) => dropped.push({ code: f.code, title: f.title, why });

  const secondOpened = input.second !== null && input.second.status < 400;
  const network = findings.filter((f) => NETWORK.has(f.code));

  // Второй загрузки нет вовсе. Подтвердить можно ровно одно: что сайт не
  // открывается, — если обход сказал то же самое. Всё остальное писать нельзя.
  if (input.second === null) {
    return network.length ? { ok: true, findings: network, dropped, at } : { ok: false, why: "no_second_look" };
  }

  // Второй раз сайт открылся — «не открывается» в письмо не идёт.
  if (secondOpened) {
    for (const f of network) drop(f, "not_repeated");
  } else {
    // Второй раз — ошибка. Тогда подтверждено только это: о содержимом
    // страницы, которую мы не видели, говорить нечего.
    if (network.length) return { ok: true, findings: network, dropped, at };
    return { ok: false, why: "no_second_look" };
  }

  // То, что видно на главной: правило, нашедшее находку в первый раз, должно
  // найти её и во второй странице. Стили, ссылки и картинки — из обхода: их
  // проверяем отдельно, по адресам.
  // Главной из обхода нет (обход упал и разбор шёл запасным путём, только
  // по главной) — тогда все находки с главной, и сверяем все: строже, зато
  // в письмо не уходит ничего непроверенного.
  const fromHome = new Set((input.home ? analyze(input.home, now).findings : findings).map((f) => f.code));
  const again = new Set(
    analyze({ ...(input.second as PageProbe), assets: input.home?.assets ?? input.second.assets }, now).findings.map((f) => f.code),
  );

  const kept: Finding[] = [];
  for (const f of findings) {
    if (NETWORK.has(f.code)) continue;
    if (f.code === "broken_links" || f.code === "broken_images") {
      const urls = (f.code === "broken_links" ? input.home?.assets?.brokenLinks : input.home?.assets?.brokenImages) ?? [];
      const sample = urls.slice(0, RECHECK_LIMIT);
      if (sample.length) {
        const statuses = await input.recheck(sample);
        // Открылись все — находки нет. Хоть один снова сломан или не дошли
        // («не знаем») — остаётся.
        if (statuses.every((s) => s !== null && !broken(s) && s < 400)) {
          drop(f, "opened_again");
          continue;
        }
      }
      kept.push(f);
      continue;
    }
    // Находка с главной, которой во второй раз нет, — не подтвердилась.
    if (fromHome.has(f.code) && !again.has(f.code)) {
      drop(f, "not_repeated");
      continue;
    }
    kept.push(f);
  }
  return { ok: true, findings: kept, dropped, at };
}
