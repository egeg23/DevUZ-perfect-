/**
 * Разбор страницы в находки.
 *
 * Главное правило здесь не техническое. Находка формулируется на языке
 * владельца бизнеса, а не разработчика: не «отсутствует meta viewport», а
 * «на телефоне сайт открывается в масштабе рабочего стола — посетителю
 * приходится растягивать пальцами». Первое ему нечего делать, второе он
 * узнаёт и хочет исправить.
 *
 * Функция чистая: на входе HTML и замеры, на выходе список. Никаких запросов,
 * поэтому её целиком закрывают тесты.
 */
import type { PageProbe } from "@/lib/audit/fetch";

export type Severity = "critical" | "major" | "minor";

export type Finding = {
  code: string;
  severity: Severity;
  /** Что увидит владелец сайта. */
  title: string;
  /** Чем это оборачивается для него в деньгах или клиентах. */
  impact: string;
};

export type AuditReport = {
  url: string;
  score: number;
  findings: Finding[];
  facts: {
    https: boolean;
    ttfbMs: number;
    platform: string | null;
    isShop: boolean;
    certDaysLeft: number | null;
  };
};

const has = (html: string, re: RegExp) => re.test(html);

/** Определяет движок по следам в разметке — нужно, чтобы говорить предметно. */
export function detectPlatform(html: string, headers: Record<string, string>): string | null {
  const h = html.toLowerCase();
  if (h.includes("wp-content") || h.includes("wp-includes")) return "WordPress";
  if (h.includes("tilda") || h.includes("tildacdn")) return "Tilda";
  if (h.includes("bitrix")) return "1С-Битрикс";
  if (h.includes("wix.com") || h.includes("_wixCssImports".toLowerCase())) return "Wix";
  if (h.includes("shopify")) return "Shopify";
  if (h.includes("insales")) return "InSales";
  const powered = (headers["x-powered-by"] ?? "").toLowerCase();
  if (powered.includes("next")) return "Next.js";
  return null;
}

/** Признаки того, что это магазин, а не визитка. */
export function looksLikeShop(html: string): boolean {
  const h = html.toLowerCase();
  return (
    has(h, /корзин|savat|cart|basket/) &&
    has(h, /в корзину|добавить|buy|купить|savatga/)
  );
}

function textBetween(html: string, tag: string): string | null {
  const m = html.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i"));
  return m ? m[1].replace(/<[^>]+>/g, "").trim() : null;
}

function metaContent(html: string, name: string): string | null {
  const m = html.match(
    new RegExp(`<meta[^>]+(?:name|property)=["']${name}["'][^>]*>`, "i"),
  );
  if (!m) return null;
  const c = m[0].match(/content=["']([^"']*)["']/i);
  return c ? c[1].trim() : null;
}

export function analyze(probe: PageProbe): AuditReport {
  const html = probe.html;
  const findings: Finding[] = [];
  const add = (f: Finding) => findings.push(f);

  if (probe.status >= 400) {
    add({
      code: "http_error",
      severity: "critical",
      title: `Сайт отвечает ошибкой ${probe.status}`,
      impact:
        "Посетитель, пришедший из поиска или по визитке, видит страницу ошибки и уходит к конкуренту. Поисковики со временем убирают такой сайт из выдачи.",
    });
  }

  if (!probe.https) {
    add({
      code: "no_https",
      severity: "critical",
      title: "Сайт работает без шифрования (HTTP)",
      impact:
        "Браузер помечает такой сайт как «Не защищено». Оплату на нём не примешь, а часть посетителей закрывает страницу, не читая.",
    });
  } else if (probe.certDaysLeft !== null && probe.certDaysLeft < 14) {
    add({
      code: "cert_expiring",
      severity: probe.certDaysLeft < 0 ? "critical" : "major",
      title:
        probe.certDaysLeft < 0
          ? "Сертификат безопасности истёк"
          : `Сертификат безопасности истекает через ${probe.certDaysLeft} дн.`,
      impact:
        "Когда он истечёт, браузер закроет сайт красным предупреждением на весь экран. Посетители решат, что вас взломали.",
    });
  }

  if (!has(html, /<meta[^>]+name=["']viewport["']/i)) {
    add({
      code: "no_viewport",
      severity: "critical",
      title: "Сайт не приспособлен к телефонам",
      impact:
        "На телефоне страница открывается в масштабе рабочего стола: текст мелкий, кнопки не нажимаются. В Узбекистане с телефонов заходит большинство.",
    });
  }

  if (probe.ttfbMs > 1500) {
    add({
      code: "slow",
      severity: probe.ttfbMs > 3000 ? "major" : "minor",
      title: `Сервер отвечает за ${(probe.ttfbMs / 1000).toFixed(1)} сек`,
      impact:
        "Это время до первого байта — посетитель всё ещё смотрит на белый экран. После трёх секунд ожидания уходит примерно каждый второй.",
    });
  }

  const title = textBetween(html, "title");
  if (!title) {
    add({
      code: "no_title",
      severity: "major",
      title: "У страницы нет заголовка",
      impact:
        "Заголовок — это строка, которой сайт представлен в Google. Без неё поисковик подставляет что придётся, и по названию компании вас не находят.",
    });
  }

  if (!metaContent(html, "description")) {
    add({
      code: "no_description",
      severity: "minor",
      title: "Нет описания для поисковиков",
      impact:
        "Под ссылкой в выдаче Google показывает случайный кусок текста со страницы вместо того, чем вы занимаетесь.",
    });
  }

  if (!metaContent(html, "og:image")) {
    add({
      code: "no_og",
      severity: "major",
      title: "Ссылка на сайт выглядит пусто при пересылке",
      impact:
        "Когда клиент отправляет ссылку в Telegram или WhatsApp, вместо карточки с картинкой уходит голый адрес. Это заметно снижает переходы.",
    });
  }

  if (!textBetween(html, "h1")) {
    add({
      code: "no_h1",
      severity: "minor",
      title: "На странице нет главного заголовка",
      impact: "Поисковику не за что зацепиться, чтобы понять, о чём страница.",
    });
  }

  const score = Math.max(
    0,
    100 -
      findings.reduce(
        (sum, f) =>
          sum + (f.severity === "critical" ? 25 : f.severity === "major" ? 12 : 5),
        0,
      ),
  );

  return {
    url: probe.finalUrl,
    score,
    findings,
    facts: {
      https: probe.https,
      ttfbMs: probe.ttfbMs,
      platform: detectPlatform(html, probe.headers),
      isShop: looksLikeShop(html),
      certDaysLeft: probe.certDaysLeft,
    },
  };
}
