/**
 * Макет «как сделали бы мы».
 *
 * Вторая половина картинки в разборе. Не рисунок из головы: это настоящая
 * страница, которую снимает тот же браузер и тот же скрипт, что и оригинал.
 * Поэтому сравнение честное — два скриншота сделаны одинаково.
 *
 * Три правила, из которых всё остальное следует.
 *
 * Первое: имени разобранной компании здесь нет. Ни в шапке, ни в подвале.
 * Вместо имени — род занятий: «Стоматология», «Автосервис». Рисовать чужой
 * логотип нашими руками — отдельный риск поверх того, которого мы и так
 * избегаем анонимностью.
 *
 * Второе: выдуманных цифр нет. Ни «5000 довольных клиентов», ни «15 лет на
 * рынке». Это утверждения о живой компании, пусть и неназванной, и
 * подтвердить их нечем. Вместо них — устройство страницы: видно цену,
 * видно кнопку, видно телефон.
 *
 * Третье: макет отвечает находкам. Если в разборе сказано «на телефоне не
 * читается» — мобильный снимок макета обязан читаться; если «нет способа
 * записаться» — кнопка записи стоит на первом экране. Макет, который
 * красивее, но не чинит названное, обесценивает весь разбор.
 */
import type { Finding } from "@/lib/audit/checks";
import type { City, Niche } from "@/content/razbor/catalog";
import type { RazborLocale } from "@/lib/razbor/model";

/*
 * В макете нет обещаний, которых разобранная компания не давала. «Перезвоним
 * за 15 минут» звучит бодро, но это срок, который мы придумали за неё. Тексты
 * здесь говорят об устройстве страницы — «запись онлайн», «цены на сайте», —
 * а не о том, как быстро кто-то ответит.
 */

/** Цвета сайта. Держатся здесь копией намеренно: макет — отдельная
 *  страница, у неё нет доступа к нашему CSS, а расходиться палитре нельзя. */
const INK = "#05070b";
const SURFACE = "#0b0f16";
const SURFACE2 = "#111823";
const LINE = "#1e2836";
const TEXT = "#eaf0f7";
const MUTED = "#8b97a8";
const GREEN = "#22f0a0";
const BLUE = "#5b9bff";
const GOLD = "#e8b14c";

export type MockupInput = {
  niche: Niche;
  city: City;
  locale: RazborLocale;
  /** Находки, которые макет должен закрыть собой. */
  findings: readonly Finding[];
};

const COPY = {
  ru: {
    call: "Позвонить",
    book: "Записаться",
    prices: "Цены",
    priceFrom: "от",
    priceNote: "Точную сумму называет специалист после осмотра",
    services: "Что делаем",
    why: "Почему к нам",
    hours: "Пн–Сб, 9:00–19:00",
    address: "Ташкент",
    heroSub: "Запись онлайн — без звонков и ожидания на линии",
    cta: "Оставьте номер — мы перезвоним",
    ctaButton: "Жду звонка",
    phone: "+998 __ ___ __ __",
    trust: ["Запись онлайн", "Цены на сайте", "Адрес и карта"],
  },
  uz: {
    call: "Qo‘ng‘iroq",
    book: "Yozilish",
    prices: "Narxlar",
    priceFrom: "dan",
    priceNote: "Aniq summani mutaxassis ko‘rikdan keyin aytadi",
    services: "Nima qilamiz",
    why: "Nega biz",
    hours: "Du–Sha, 9:00–19:00",
    address: "Toshkent",
    heroSub: "Onlayn yozilish — qo‘ng‘iroqsiz va navbatsiz",
    cta: "Raqamingizni qoldiring — qo‘ng‘iroq qilamiz",
    ctaButton: "Qo‘ng‘iroqni kutaman",
    phone: "+998 __ ___ __ __",
    trust: ["Onlayn yozilish", "Saytda narxlar", "Manzil va xarita"],
  },
} as const;

const esc = (text: string) =>
  text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/**
 * Что именно макет чинит — списком, который потом идёт в подпись под
 * картинкой. Берётся из кодов находок, а не пишется руками: подпись,
 * разъехавшаяся с разбором, хуже отсутствующей.
 */
const FIXES: Record<string, { ru: string; uz: string }> = {
  no_viewport: { ru: "читается на телефоне", uz: "telefonda o‘qiladi" },
  slow: { ru: "первый экран сразу", uz: "birinchi ekran darrov" },
  no_https: { ru: "защищённое соединение", uz: "himoyalangan ulanish" },
  cert_expiring: { ru: "сертификат продлевается сам", uz: "sertifikat o‘zi yangilanadi" },
  no_title: { ru: "понятный заголовок", uz: "tushunarli sarlavha" },
  no_h1: { ru: "видно, куда попал", uz: "qayerga kelgani ko‘rinadi" },
  no_description: { ru: "описание для поиска", uz: "qidiruv uchun tavsif" },
};

export function fixesFor(findings: readonly Finding[], locale: RazborLocale): string[] {
  const out: string[] = [];
  for (const finding of findings) {
    const fix = FIXES[finding.code];
    if (fix && !out.includes(fix[locale])) out.push(fix[locale]);
  }
  return out;
}

export function mockupHtml(input: MockupInput): string {
  const { niche, city, locale } = input;
  const c = COPY[locale];
  const name = locale === "ru" ? niche.ruMock : niche.uzMock;
  const where = locale === "ru" ? city.ruIn : city.uzIn;
  const services = locale === "ru" ? niche.ruServices : niche.uzServices;
  const title = locale === "ru" ? `${name} в ${where}` : `${where} ${name}`;

  const cards = services
    .map(
      (service, i) => `
        <li class="card">
          <span class="num">${String(i + 1).padStart(2, "0")}</span>
          <span class="svc">${esc(service)}</span>
          <span class="price">${esc(c.priceFrom)} <b>—</b></span>
        </li>`,
    )
    .join("");

  const trust = c.trust.map((item) => `<li>${esc(item)}</li>`).join("");

  return `<!doctype html>
<html lang="${locale}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<style>
  *, *::before, *::after { box-sizing: border-box; }
  body {
    margin: 0;
    background: ${INK};
    color: ${TEXT};
    font: 16px/1.5 system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
    -webkit-font-smoothing: antialiased;
  }
  /*
   * Боковые отступы живут здесь и только здесь. Всё, что внутри, задаёт
   * вертикальные через padding-block: сокращённая запись «padding: 64px 0»
   * обнуляет боковые, и на телефоне заголовок упирается в край экрана. На
   * десктопе этого не видно — там поля даёт центрирование по max-width, а не
   * padding, поэтому ошибка доживает до первого мобильного снимка.
   */
  .wrap { max-width: 1120px; margin: 0 auto; padding-inline: 24px; }

  header {
    position: sticky; top: 0; z-index: 10;
    background: rgba(5, 7, 11, .9);
    backdrop-filter: blur(8px);
    border-bottom: 1px solid ${LINE};
  }
  .bar { display: flex; align-items: center; gap: 16px; padding-block: 14px; }
  .logo { display: flex; align-items: center; gap: 10px; font-weight: 700; letter-spacing: -.01em; }
  .mark {
    width: 26px; height: 26px; border-radius: 8px;
    background: linear-gradient(135deg, ${BLUE}, ${GREEN});
  }
  .bar .tel { margin-left: auto; color: ${TEXT}; text-decoration: none; font-variant-numeric: tabular-nums; }
  .btn {
    display: inline-block; padding: 10px 18px; border-radius: 10px;
    background: ${GREEN}; color: ${INK}; font-weight: 600; text-decoration: none;
    border: none; cursor: pointer;
  }
  .btn.ghost { background: transparent; color: ${TEXT}; border: 1px solid ${LINE}; }

  .hero { padding-block: 64px 40px; }
  h1 { margin: 0 0 14px; font-size: 44px; line-height: 1.1; letter-spacing: -.02em; }
  .sub { margin: 0 0 26px; max-width: 46ch; color: ${MUTED}; font-size: 18px; }
  .row { display: flex; flex-wrap: wrap; gap: 12px; }

  .trust { display: flex; flex-wrap: wrap; gap: 10px; margin: 28px 0 0; padding: 0; list-style: none; }
  .trust li {
    padding: 7px 14px; border: 1px solid ${LINE}; border-radius: 999px;
    color: ${MUTED}; font-size: 14px;
  }

  section { padding-block: 34px; }
  h2 { margin: 0 0 18px; font-size: 13px; text-transform: uppercase; letter-spacing: .12em; color: ${MUTED}; font-weight: 500; }
  ul.cards { display: grid; gap: 12px; grid-template-columns: repeat(2, 1fr); margin: 0; padding: 0; list-style: none; }
  .card {
    display: flex; align-items: baseline; gap: 12px;
    padding: 18px; border: 1px solid ${LINE}; border-radius: 14px; background: ${SURFACE};
  }
  .num { color: ${GOLD}; font-variant-numeric: tabular-nums; font-size: 13px; }
  .svc { font-weight: 600; }
  .price { margin-left: auto; color: ${MUTED}; font-size: 14px; white-space: nowrap; }
  .note { margin: 12px 0 0; color: ${MUTED}; font-size: 13px; }

  .cta {
    margin: 10px 0 40px; padding: 26px; border-radius: 18px;
    background: ${SURFACE2}; border: 1px solid ${LINE};
    display: flex; flex-wrap: wrap; align-items: center; gap: 14px;
  }
  .cta p { margin: 0; flex: 1 1 18rem; font-size: 19px; font-weight: 600; }
  .cta input {
    flex: 1 1 12rem; padding: 11px 14px; border-radius: 10px;
    border: 1px solid ${LINE}; background: ${INK}; color: ${TEXT}; font-size: 16px;
  }

  footer { border-top: 1px solid ${LINE}; padding-block: 22px 34px; color: ${MUTED}; font-size: 14px; }
  .foot { display: flex; flex-wrap: wrap; gap: 8px 24px; }

  @media (width < 40rem) {
    h1 { font-size: 30px; }
    .sub { font-size: 16px; }
    .hero { padding-block: 34px 26px; }
    ul.cards { grid-template-columns: 1fr; }
    .bar .tel { display: none; }
    .bar .btn { margin-left: auto; }
  }
</style>
</head>
<body>
  <header>
    <div class="wrap bar">
      <span class="logo"><span class="mark"></span>${esc(name)}</span>
      <a class="tel" href="tel:">${esc(c.phone)}</a>
      <a class="btn" href="#">${esc(c.book)}</a>
    </div>
  </header>

  <main>
    <div class="wrap hero">
      <h1>${esc(title)}</h1>
      <p class="sub">${esc(c.heroSub)}</p>
      <div class="row">
        <a class="btn" href="#">${esc(c.book)}</a>
        <a class="btn ghost" href="#">${esc(c.prices)}</a>
      </div>
      <ul class="trust">${trust}</ul>
    </div>

    <section class="wrap">
      <h2>${esc(c.services)}</h2>
      <ul class="cards">${cards}</ul>
      <p class="note">${esc(c.priceNote)}</p>
    </section>

    <div class="wrap">
      <div class="cta">
        <p>${esc(c.cta)}</p>
        <input placeholder="${esc(c.phone)}" readonly>
        <button class="btn" type="button">${esc(c.ctaButton)}</button>
      </div>
    </div>
  </main>

  <footer>
    <div class="wrap foot">
      <span>${esc(c.address)}</span>
      <span>${esc(c.hours)}</span>
      <span>${esc(c.phone)}</span>
    </div>
  </footer>
</body>
</html>`;
}
