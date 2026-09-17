import { services } from "@/content/services";
import { CITIES, NICHES, type City, type Niche } from "@/content/razbor/catalog";
import { TASHKENT_OFFSET_MS, todayInTashkent } from "@/lib/admin/pulse";
import { redactions } from "@/lib/razbor/anonymize";
import type { AuditReport } from "@/lib/audit/checks";
import type { RazborArticle } from "@/lib/razbor/store";

/**
 * Ночная смена разборов — та часть, которая считается без базы и без модели.
 *
 * Смена переехала с плановой сессии на сервер. Причина не в удобстве:
 * плановая сессия стартует без единого внешнего инструмента — ни базы, ни
 * GitHub, ни доступа к репозиторию, — и три ночи подряд отрабатывала по
 * полчаса, не оставляя следа. Здесь же рядом и ключ модели, и база, и
 * аудитор, которым пользуется публичная страница.
 *
 * Разбор выходит не сразу: смена кладёт его на проверку, а публикует
 * человек. Текст называет чужую работу плохой под именем студии, и отозвать
 * это нельзя.
 */

/** Во сколько по Ташкенту начинается смена. Совпадает с расписанием сторожа. */
export const SHIFT_AT = "08:03";

/** Сколько разборов за ночь. Три — потолок, а не норма. */
export const PER_SHIFT = 3;

/** Сколько сайтов смотрим, чтобы набрать эти три. */
export const LOOK_AT = 12;

/**
 * Пора ли начинать.
 *
 * Свип ходит каждые пять минут, и без этой проверки смена запускалась бы
 * триста раз в сутки. Один раз в календарный день по Ташкенту, не раньше
 * назначенного часа: «раз в двадцать четыре часа» уползало бы по кругу и
 * через неделю пришлось бы на ночь.
 */
export function shiftDue(now: Date, lastRunAt: string | null): boolean {
  const today = todayInTashkent(now);
  if (lastRunAt && todayInTashkent(new Date(lastRunAt)) === today) return false;

  const shifted = new Date(now.getTime() + TASHKENT_OFFSET_MS);
  const [h, m] = SHIFT_AT.split(":").map(Number);
  return shifted.getUTCHours() * 60 + shifted.getUTCMinutes() >= h * 60 + m;
}

/**
 * Город по тексту страницы.
 *
 * Без города разбор написать нельзя: запрос «сайт для стоматологии» без
 * города не ищет никто, а поставить город наугад — значит соврать в
 * заголовке. Не нашли — сайт пропускаем, и это честный исход.
 *
 * Ищем и русское, и узбекское написание, и предложный падеж: на сайте
 * пишут «в Ташкенте», а не «Ташкент».
 */
export function cityFrom(text: string): City | null {
  const haystack = text.toLowerCase();
  for (const city of CITIES) {
    for (const form of [city.ru, city.ruIn, city.uz, city.uzIn]) {
      if (haystack.includes(form.toLowerCase())) return city;
    }
  }
  return null;
}

export function nicheByKey(key: string | null): Niche | null {
  return key ? (NICHES.find((n) => n.key === key) ?? null) : null;
}

/**
 * Ниши, которые мы не разбираем.
 *
 * Медицина — не про вкусовщину: публичный разбор сайта клиники задевает не
 * маркетинг, а лечение, и спор об этом мы вести не готовы. Остальные запреты
 * (госсайты, банки, аптеки) до этого места не доходят: их не распознаёт
 * классификатор, и ниши у них не будет вовсе.
 */
export const OFF_LIMITS = new Set(["stomatologiya", "medcentr"]);

/**
 * Что даёт модели право назвать число.
 *
 * Всё, что она видела: находки аудита, факты о сайте и прайс студии. Число,
 * которого нет ни в одном из этих мест, она не измерила, а придумала — и
 * статья разойдётся с отчётом, который лежит в той же строке базы.
 */
export function factPool(report: AuditReport): string {
  const findings = report.findings.map((f) => `${f.title} ${f.impact} ${f.fix}`).join(" ");
  const facts = `ttfb ${report.facts.ttfbMs} балл ${report.score} сертификат ${report.facts.certDaysLeft ?? ""}`;
  const price = services.map((s) => `${s.priceFromUsd} ${s.weeksFrom} ${s.weeksTo}`).join(" ");
  return `${findings} ${facts} ${price}`;
}

/** Числа из текста, в том виде, в каком их читает человек. */
export function numbersIn(text: string): string[] {
  return [...new Set(text.match(/\d+(?:[.,]\d+)?/g) ?? [])];
}

const asNumber = (raw: string) => Number(raw.replace(",", "."));

const round = (value: number, digits: number) => {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
};

/**
 * Можно ли получить это число из того, что модель видела.
 *
 * Не «есть ли оно в брифе дословно»: `razbor-master` прямо разрешает
 * округлять — «1261 мс это примерно 1,3 секунды». Проверка, запрещающая
 * такое округление, заворачивала бы каждую честную статью, и смена
 * выдавала бы ноль разборов, не понимая почему.
 *
 * Разрешено ровно одно преобразование — миллисекунды в секунды — и
 * округление до целого, десятых и сотых. «1261 мс» превращается в 1,3 и в
 * 1,26, но не в 1,2: врать при округлении нельзя.
 */
export function derivable(value: number, pool: readonly number[]): boolean {
  return pool.some((p) => {
    if (p === value) return true;
    for (const digits of [0, 1, 2]) {
      if (round(p, digits) === value) return true;
      if (round(p / 1000, digits) === value) return true;
    }
    return false;
  });
}

/** Числа, которых модель не могла узнать: ни из аудита, ни из прайса. */
export function unsupportedNumbers(text: string, pool: string): string[] {
  const allowed = numbersIn(pool).map(asNumber);
  return numbersIn(text).filter((raw) => !derivable(asNumber(raw), allowed));
}

export type ArticleProblem = { code: string; text: string };

/**
 * Проверка статьи машиной, а не совестью.
 *
 * Правило из `razbor-master`, и появилось оно после смоук-теста, где две
 * модели по одному аудиту сдали брак: одна перезамерила время ответа и
 * разошлась с отчётом, другая собрала весь раздел находок из дословных
 * строк аудита — на второй такой статье раздел превращается в набор
 * одинаковых страниц.
 */
export function articleProblems(input: {
  article: RazborArticle;
  report: AuditReport;
  title: string | null;
}): ArticleProblem[] {
  const out: ArticleProblem[] = [];
  const text = [
    input.article.title,
    input.article.description,
    input.article.label,
    ...input.article.intro,
    ...input.article.findings.flatMap((f) => [f.title, f.impact, f.fix]),
    ...input.article.outcome,
    input.article.price,
  ].join("\n");

  if (input.article.findings.length < 3) {
    out.push({ code: "thin", text: "Меньше трёх находок — это заметка, а не разбор." });
  }

  const invented = unsupportedNumbers(text, factPool(input.report));
  if (invented.length) {
    out.push({ code: "invented", text: `Числа, которых нет в аудите: ${invented.join(", ")}.` });
  }

  // Проценты прироста не называются никогда: замеров «до» у чужого сайта
  // нет, и первая же такая цифра — это то, за чем придут с вопросом
  // «покажите отчёт».
  if (/\d+\s*%/.test(text)) {
    out.push({ code: "percent", text: "В тексте есть процент. Процентов прироста разбор не называет." });
  }

  // Имя компании: разбор публикуется анонимно, и это не вежливость, а
  // снятый юридический риск.
  const named = redactions(input.report.url, input.title).filter(
    (token) => token.length >= 4 && text.toLowerCase().includes(token.toLowerCase()),
  );
  if (named.length) {
    out.push({ code: "named", text: `В тексте названа компания: ${named.join(", ")}.` });
  }

  // Дословно скопированные строки аудита одинаковы для всех сайтов: на
  // одной статье незаметно, на второй раздел выглядит шаблоном.
  const copied = input.article.findings.filter((f) =>
    input.report.findings.some((src) => src.title.trim() === f.title.trim()),
  );
  if (copied.length) {
    out.push({
      code: "copied",
      text: `Заголовки находок скопированы из аудита дословно: ${copied.map((f) => f.title).join("; ")}.`,
    });
  }

  return out;
}
