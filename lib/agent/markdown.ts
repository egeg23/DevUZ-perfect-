import { agentCopy } from "@/content/agent-copy";
import { BOX_NAME, BOX_PATH, named } from "@/content/box";
import { CALLHELPER_ANCHOR, CALLHELPER_COPY, CALLHELPER_WAIT } from "@/content/callhelper";
import { CALLHELPER_API_PATH } from "@/content/callhelper-api";
import { CALLHELPER_EXT_PATH } from "@/content/callhelper-extension";
import { caseBySlug, caseDate, casesOnSite, type Case } from "@/content/cases";
import { company, proof } from "@/content/company";
import { getDictionary } from "@/content/dictionaries";
import { homeCopy } from "@/content/home-copy";
import { LEADGEN_COUNTRIES, LEADGEN_PATH, LEADGEN_TARIFFS, rub } from "@/content/leadgen";
import { MARKETING_PATH } from "@/content/marketing";
import { LANDINGS, LANDING_TEXT, landingBySlug, type LandingMeta } from "@/content/service-landings";
import { calcPrice, landingMoney, landingText, weeksRange } from "@/content/service-landings/fill";
import { serviceBySlug, services, type Service } from "@/content/services";
import { QUIET_FROM_HOUR, QUIET_TO_HOUR } from "@/lib/admin/tasks";
import { CALLHELPER_OVER_RUB, CALLHELPER_TARIFFS, CALLHELPER_TRIAL, launchText } from "@/lib/callhelper/tariffs";
import {
  AGENT_LEAD_PATH,
  AGENT_LOCALES,
  FULL_SEGMENT,
  agentHtmlHref,
  agentMdHref,
} from "@/lib/agent/paths";
import { localeLabel, t, tList, type Locale } from "@/lib/i18n";
import { absoluteUrl } from "@/lib/seo";

/**
 * Страницы сайта простым текстом — для ИИ-агентов (lib/agent/paths.ts).
 *
 * Тексты, цены и сроки — из тех же мест, что у страницы для людей:
 * content/service-landings (и калькулятор через `calcPrice`), content/services,
 * content/cases, словарь сайта, `company` и `proof`. Своих чисел и обещаний
 * здесь нет: двойник не должен расходиться со страницей.
 */

export type AgentDoc = { title: string; body: string };

const abs = (path: string) => absoluteUrl(path.replace(/^\//, ""));
const mdUrl = (locale: Locale, segments: readonly string[] = []) => abs(agentMdHref(locale, segments));
const htmlUrl = (locale: Locale, segments: readonly string[] = []) => abs(agentHtmlHref(locale, segments));

/** Текст в ячейку таблицы и в строку списка: без переносов и вертикальной черты. */
function cell(text: string): string {
  return text.replace(/\s*\n+\s*/g, " ").replace(/\|/g, "/").trim();
}

function table(head: readonly string[], rows: readonly (readonly string[])[]): string {
  const line = (cells: readonly string[]) => `| ${cells.map(cell).join(" | ")} |`;
  return [line(head), line(head.map(() => "---")), ...rows.map(line)].join("\n");
}

function join(parts: readonly (string | null | undefined | false)[]): string {
  return parts.filter(Boolean).join("\n\n");
}

/** Все адреса услуг: страницы под запросы и остальные направления, без повторов. */
export function agentServiceSlugs(): string[] {
  return [...new Set([...LANDINGS.map((l) => l.slug as string), ...services.map((s) => s.slug)])];
}

function otherServices(): Service[] {
  return services.filter((s) => !landingBySlug(s.slug));
}

function servicePrice(service: Service, locale: Locale): string {
  const dict = getDictionary(locale);
  return `${dict.services.from} $${service.priceFromUsd.toLocaleString("en-US")}, ${service.weeksFrom}–${service.weeksTo} ${dict.services.weeks}`;
}

function landingPrice(meta: LandingMeta, locale: Locale): string {
  const ui = LANDING_TEXT[locale].ui;
  const price = calcPrice(meta.calc);
  const money = landingMoney(price.uzs, locale);
  return `${ui.from} ${money.main}${money.sub ? ` (≈ ${money.sub})` : ""}, ${ui.weeks.toLowerCase()} ${weeksRange(price)} ${ui.weeksUnit}`;
}

function contactsBlock(locale: Locale): string {
  const copy = agentCopy[locale];
  const phones = company.phones.map((phone) => {
    const who = "person" in phone ? `, ${t(phone.person, locale)}` : "";
    return `- ${phone.display} (${t(phone.country, locale)}${who})${phone.whatsapp ? ", WhatsApp" : ""}`;
  });
  return join([
    `## ${copy.contacts}`,
    [
      `- ${copy.telegramBot}: ${company.telegramUrl}`,
      ...phones,
      `- ${copy.address}: ${t(company.address.street, locale)}, ${t(company.address.city, locale)}, ${t(company.address.countryName, locale)}`,
      `- ${htmlUrl(locale, ["contact"])}`,
    ].join("\n"),
  ]);
}

function orderBlock(locale: Locale): string {
  const copy = agentCopy[locale];
  const ui = LANDING_TEXT[locale].ui;
  const dict = getDictionary(locale);
  return join([
    `## ${copy.order}`,
    [
      `1. ${ui.mockupTitle}: ${htmlUrl(locale)}#maket`,
      `2. ${copy.orderWrite}: ${company.telegramUrl}`,
      `3. ${dict.contact.phonesTitle}: ${company.phones.map((p) => p.display).join(", ")}`,
    ].join("\n"),
  ]);
}

/** Как агенту оставить заявку за клиента — одним блоком на каждой странице. */
export function agentLeadBlock(locale: Locale): string {
  const copy = agentCopy[locale];
  const values: Record<string, string> = {
    endpoint: abs(AGENT_LEAD_PATH),
    locales: AGENT_LOCALES.join(", "),
    from: String(QUIET_FROM_HOUR),
    to: String(QUIET_TO_HOUR).padStart(2, "0"),
    bot: company.telegramUrl,
  };
  const fill = (s: string) => s.replace(/\{(\w+)\}/g, (all, key: string) => values[key] ?? all);
  return join([`## ${copy.agentTitle}`, copy.agentSteps.map((step, i) => `${i + 1}. ${fill(step)}`).join("\n")]);
}

function footer(locale: Locale): string {
  return join([orderBlock(locale), contactsBlock(locale), agentLeadBlock(locale)]);
}

function note(locale: Locale, segments: readonly string[]): string {
  return `> ${agentCopy[locale].note.replace("{url}", htmlUrl(locale, segments))}`;
}

function caseLine(item: Case, locale: Locale): string {
  return `- [${item.name}](${mdUrl(locale, ["cases", item.slug])}): ${cell(t(item.category, locale))}. ${cell(t(item.summary, locale))}`;
}

function servicesList(locale: Locale): string {
  const copy = agentCopy[locale];
  const landings = LANDINGS.map((meta) => {
    const text = landingText(meta, locale);
    return `- [${text.title}](${mdUrl(locale, ["services", meta.slug])}): ${landingPrice(meta, locale)}`;
  });
  const rest = otherServices().map(
    (s) => `- [${t(s.title, locale)}](${mdUrl(locale, ["services", s.slug])}): ${servicePrice(s, locale)}. ${cell(t(s.tagline, locale))}`,
  );
  return join([`## ${copy.services}`, landings.join("\n"), rest.length ? `### ${copy.otherServices}` : null, rest.join("\n")]);
}

function factsLine(locale: Locale): string {
  const facts = LANDING_TEXT[locale].ui.facts;
  return [
    `- ${proof.staff} ${facts.staff}`,
    `- ${proof.projects}+ ${facts.projects}`,
    `- ${proof.countries} ${facts.countries}`,
  ].join("\n");
}

/**
 * «Продукты студии»: те же продукты, что на главной для людей. Новый продукт
 * или страница на сайте — строкой здесь (правило владельца, 25.11.2026: «Не
 * забудь добавлять каждую новую страницу или продукт в версию для Ии
 * агентов»). Ссылки — на страницы для людей простым адресом, не markdown-ссылкой:
 * у этих страниц нет текстового двойника. Лидогенерация и CallHelper — только на русском, как на сайте:
 * другим языкам — ссылка на русскую версию.
 */
export function productsBlock(locale: Locale): string {
  const box = getDictionary(locale).box.hero;
  const lines = [`- ${BOX_NAME}: ${named(box.tagline)} ${named(box.badge)}. ${htmlUrl(locale, [BOX_PATH])}`];
  if (locale === "ru") {
    const test = LEADGEN_TARIFFS[0];
    lines.push(
      `- Лидогенерация со звонком (${htmlUrl("ru", [LEADGEN_PATH])}): находим клиентов и прозваниваем каждого, вы получаете запись разговора или звонок сразу на своего менеджера. ${LEADGEN_COUNTRIES.join(", ")}, по договору. Тестовый прогон ${rub(test.price ?? 0)}: ${test.leads?.[0]}-${test.leads?.[1]} лидов за ${test.term}.`,
    );
    const tariffs = CALLHELPER_TARIFFS.map((x) => `«${x.name}» ${rub(x.rub)} ${CALLHELPER_COPY.per}, ${x.minutes.toLocaleString("ru-RU").replace(/\s/g, " ")} ${CALLHELPER_COPY.minutes}`).join("; ");
    lines.push(
      `- ${CALLHELPER_COPY.title.replace("\u2011", "-")} (${htmlUrl("ru")}#${CALLHELPER_ANCHOR}), запуск ${launchText().replace("\u00a0", " ")}: ${CALLHELPER_COPY.lead.charAt(0).toLowerCase()}${CALLHELPER_COPY.lead.slice(1)} Кому: ${CALLHELPER_COPY.who.join(", ").toLowerCase()}. Тарифы: ${tariffs}; сверх пакета ${CALLHELPER_OVER_RUB} ₽ за минуту; пробный период ${CALLHELPER_TRIAL.days} дня и ${CALLHELPER_TRIAL.minutes} минут на компанию. ${CALLHELPER_COPY.privacy} До запуска открыт ${CALLHELPER_WAIT.title.toLowerCase()}: форма в этом блоке на главной, контакт клиент оставляет сам, первыми напишем тем, кто в листе. Для сервисов набора, телефонии и CRM есть API: ${absoluteUrl(`ru/${CALLHELPER_API_PATH}`)}. Оператору суфлёр ставится расширением для Chrome: ${absoluteUrl(`ru/${CALLHELPER_EXT_PATH}`)}`,
    );
  } else {
    lines.push(`- ${agentCopy[locale].ruProducts}: ${mdUrl("ru")}`);
  }
  return join([`## ${homeCopy[locale].products.title}`, lines.join("\n")]);
}

function homeDoc(locale: Locale): AgentDoc {
  const copy = agentCopy[locale];
  const dict = getDictionary(locale);
  const ui = LANDING_TEXT[locale].ui;
  const title = `${company.name}: ${t(company.tagline, locale)}`;
  const others = AGENT_LOCALES.filter((l) => l !== locale).map((l) => `- [${localeLabel[l]}](${mdUrl(l)})`);
  return {
    title,
    body: join([
      `# ${title}`,
      note(locale, []),
      t(company.description, locale),
      factsLine(locale),
      servicesList(locale),
      productsBlock(locale),
      `## ${ui.mockupTitle}`,
      `${ui.mockupText}\n\n${htmlUrl(locale)}#maket`,
      `## ${ui.casesTitle}`,
      casesOnSite.slice(0, 12).map((item) => caseLine(item, locale)).join("\n"),
      `[${ui.casesAll}](${mdUrl(locale, ["cases"])})`,
      `## ${dict.faq.title}`,
      dict.faq.items.map((item) => `### ${item.q}\n\n${item.a}`).join("\n\n"),
      `## ${copy.pages}`,
      [
        `- ${mdUrl(locale, ["services"])}`,
        `- ${mdUrl(locale, ["cases"])}`,
        `- ${mdUrl(locale, ["contact"])}`,
        `- ${copy.fullFile}: ${mdUrl(locale, [FULL_SEGMENT])}`,
        `- ${copy.articles}: ${htmlUrl(locale, [MARKETING_PATH])}, ${htmlUrl(locale, ["razbor"])}`,
      ].join("\n"),
      `## ${copy.languages}`,
      others.join("\n"),
      footer(locale),
    ]),
  };
}

function servicesDoc(locale: Locale): AgentDoc {
  const dict = getDictionary(locale);
  const title = dict.services.title;
  return {
    title,
    body: join([`# ${title}`, note(locale, ["services"]), dict.services.description, servicesList(locale), footer(locale)]),
  };
}

function landingDoc(meta: LandingMeta, locale: Locale): AgentDoc {
  const ui = LANDING_TEXT[locale].ui;
  const text = landingText(meta, locale);
  const priceOf = (calc: string) => {
    const p = calcPrice(calc);
    const money = landingMoney(p.uzs, locale);
    return { money: `${money.main}${money.sub ? ` (≈ ${money.sub})` : ""}`, weeks: `${weeksRange(p)} ${ui.weeksUnit}` };
  };
  const head = priceOf(meta.calc);
  const caseItems = meta.cases.map(caseBySlug).filter((c): c is Case => c !== undefined);
  const related = meta.related
    .map((slug) => landingBySlug(slug))
    .filter((m): m is LandingMeta => m !== undefined)
    .map((m) => `- [${landingText(m, locale).title}](${mdUrl(locale, ["services", m.slug])})`);

  return {
    title: text.h1,
    body: join([
      `# ${text.h1}`,
      note(locale, ["services", meta.slug]),
      text.lead,
      `- ${ui.from}: ${head.money}\n- ${ui.weeks}: ${head.weeks}`,
      factsLine(locale),
      `## ${ui.kindsTitle}`,
      text.kinds
        .map((kind, i) => {
          const p = priceOf(meta.kinds[i]?.calc ?? meta.calc);
          return `### ${kind.title}\n\n${kind.text}\n\n- ${ui.colPrice}: ${p.money}\n- ${ui.colTerm}: ${p.weeks}`;
        })
        .join("\n\n"),
      `## ${ui.includedTitle}`,
      text.included.map((line) => `- ${cell(line)}`).join("\n"),
      `## ${ui.stepsTitle}`,
      text.steps.map((step, i) => `${i + 1}. ${step.title} (${step.days}). ${cell(step.text)}`).join("\n"),
      `## ${ui.pricesTitle}`,
      table(
        [ui.colType, ui.colPrice, ui.colTerm],
        text.kinds.map((kind, i) => {
          const p = priceOf(meta.kinds[i]?.calc ?? meta.calc);
          return [kind.title, p.money, p.weeks];
        }),
      ),
      ui.pricesNote,
      `## ${ui.localTitle}`,
      text.local.map((item) => `### ${item.title}\n\n${item.text}`).join("\n\n"),
      `## ${ui.compareTitle}`,
      table(
        ui.compareCols.map((col, i) => (i === 0 && !col ? " " : col)),
        ui.compareRows,
      ),
      caseItems.length ? `## ${ui.casesTitle}` : null,
      caseItems.map((item) => caseLine(item, locale)).join("\n"),
      `## ${ui.faqTitle}`,
      text.faq.map((item) => `### ${item.q}\n\n${item.a}`).join("\n\n"),
      `## ${ui.mockupTitle}`,
      `${ui.mockupText}\n\n${htmlUrl(locale)}#maket`,
      `## ${ui.officeTitle}`,
      ui.officeText,
      related.length ? `## ${ui.relatedTitle}` : null,
      related.join("\n"),
      footer(locale),
    ]),
  };
}

function serviceDoc(service: Service, locale: Locale): AgentDoc {
  const dict = getDictionary(locale);
  const title = t(service.title, locale);
  const factors = service.priceFactors ? tList(service.priceFactors, locale) : [];
  return {
    title,
    body: join([
      `# ${title}`,
      note(locale, ["services", service.slug]),
      t(service.tagline, locale),
      t(service.description, locale),
      `- ${servicePrice(service, locale)}`,
      `## ${dict.services.included}`,
      tList(service.bullets, locale)
        .map((line) => `- ${cell(line)}`)
        .join("\n"),
      factors.length ? `## ${dict.services.priceFactors}` : null,
      factors.map((line) => `- ${cell(line)}`).join("\n"),
      `## ${dict.services.stack}`,
      service.tech.join(", "),
      footer(locale),
    ]),
  };
}

function casesDoc(locale: Locale): AgentDoc {
  const ui = LANDING_TEXT[locale].ui;
  const dict = getDictionary(locale);
  const title = dict.cases.title.replace("{n}", String(proof.projects));
  return {
    title,
    body: join([
      `# ${title}`,
      note(locale, ["cases"]),
      dict.cases.description,
      `## ${ui.casesTitle}`,
      casesOnSite.map((item) => caseLine(item, locale)).join("\n"),
      footer(locale),
    ]),
  };
}

function caseDoc(item: Case, locale: Locale): AgentDoc {
  const copy = agentCopy[locale];
  const dict = getDictionary(locale);
  const title = `${item.name}: ${t(item.category, locale)}`;
  return {
    title,
    body: join([
      `# ${title}`,
      note(locale, ["cases", item.slug]),
      t(item.summary, locale),
      [
        `- ${dict.cases.date}: ${caseDate(item, locale)}`,
        item.url ? `- ${dict.cases.liveSite}: ${item.url}` : null,
        item.tech.length ? `- ${dict.cases.tech}: ${item.tech.join(", ")}` : null,
      ]
        .filter(Boolean)
        .join("\n"),
      `## ${dict.cases.challenge}`,
      t(item.description, locale),
      item.metrics.length ? `## ${copy.result}` : null,
      item.metrics.map((metric) => `- ${metric.value}: ${cell(t(metric.label, locale))}`).join("\n"),
      `## ${dict.cases.sameTitle}`,
      dict.cases.sameText,
      footer(locale),
    ]),
  };
}

function contactDoc(locale: Locale): AgentDoc {
  const copy = agentCopy[locale];
  return {
    title: `${company.name}: ${copy.contacts}`,
    body: join([`# ${company.name}: ${copy.contacts}`, note(locale, ["contact"]), t(company.description, locale), footer(locale)]),
  };
}

/** Все двойники языка по порядку: главная, услуги, кейсы, контакты. */
export function agentSegments(): string[][] {
  return [
    [],
    ["services"],
    ...agentServiceSlugs().map((slug) => ["services", slug]),
    ["cases"],
    ...casesOnSite.map((item) => ["cases", item.slug]),
    ["contact"],
  ];
}

/** Срезает общий хвост (заказ, контакты, заявка агента): в общем файле он один. */
function withoutFooter(body: string, locale: Locale): string {
  const tail = footer(locale);
  return body.endsWith(tail) ? body.slice(0, -tail.length).trimEnd() : body;
}

function fullDoc(locale: Locale): AgentDoc {
  const copy = agentCopy[locale];
  const parts = agentSegments()
    .map((segments) => pageDoc(locale, segments))
    .filter((doc): doc is AgentDoc => doc !== null)
    .map((doc) => withoutFooter(doc.body, locale));
  return {
    title: `${company.name}: ${copy.fullFile}`,
    body: [...parts, footer(locale)].join("\n\n---\n\n"),
  };
}

function pageDoc(locale: Locale, segments: readonly string[]): AgentDoc | null {
  const [head, slug] = segments;
  if (head === undefined) return homeDoc(locale);
  if (head === "contact" && slug === undefined) return contactDoc(locale);
  if (head === "services") {
    if (slug === undefined) return servicesDoc(locale);
    const landing = landingBySlug(slug);
    if (landing) return landingDoc(landing, locale);
    const service = serviceBySlug(slug);
    return service ? serviceDoc(service, locale) : null;
  }
  if (head === "cases") {
    if (slug === undefined) return casesDoc(locale);
    const item = caseBySlug(slug);
    return item ? caseDoc(item, locale) : null;
  }
  return null;
}

/** Двойник страницы. Страницы нет — null (маршрут ответит 404). */
export function agentPage(locale: Locale, segments: readonly string[]): AgentDoc | null {
  if (segments.length === 1 && segments[0] === FULL_SEGMENT) return fullDoc(locale);
  return pageDoc(locale, segments);
}

/**
 * Указатель в корне сайта, `/llms.txt` (формат llmstxt.org): заголовок,
 * короткое описание и ссылки на двойники. По-английски: это общий вход, у
 * каждого языка свой указатель — его главная (`/ru.md`).
 */
export function llmsIndex(): string {
  const locale: Locale = "en";
  const copy = agentCopy[locale];
  const ui = LANDING_TEXT[locale].ui;
  const landings = LANDINGS.map((meta) => {
    const text = landingText(meta, locale);
    return `- [${text.title}](${mdUrl(locale, ["services", meta.slug])}): ${landingPrice(meta, locale)}`;
  });
  const rest = otherServices().map(
    (s) => `- [${t(s.title, locale)}](${mdUrl(locale, ["services", s.slug])}): ${servicePrice(s, locale)}`,
  );
  return (
    join([
      `# ${company.name}`,
      `> ${t(company.description, locale)}`,
      factsLine(locale),
      `## ${copy.languages}`,
      AGENT_LOCALES.map((l) => `- [${localeLabel[l]}](${mdUrl(l)}): ${t(company.tagline, l)}`).join("\n"),
      `## ${copy.services}`,
      [...landings, ...rest].join("\n"),
      productsBlock(locale),
      `## ${ui.casesTitle}`,
      [`- [${ui.casesAll}](${mdUrl(locale, ["cases"])})`, ...casesOnSite.slice(0, 8).map((item) => caseLine(item, locale))].join("\n"),
      `## ${copy.contacts}`,
      `- [${copy.contacts}](${mdUrl(locale, ["contact"])})\n- ${copy.telegramBot}: ${company.telegramUrl}`,
      agentLeadBlock(locale),
      "## Optional",
      [
        `- [${copy.fullFile}](${abs("/llms-full.txt")})`,
        ...AGENT_LOCALES.filter((l) => l !== locale).map((l) => `- [${copy.fullFile}: ${localeLabel[l]}](${mdUrl(l, [FULL_SEGMENT])})`),
      ].join("\n"),
    ]) + "\n"
  );
}

/** `/llms-full.txt` — весь сайт по-английски одним файлом. */
export function llmsFull(): string {
  return fullDoc("en").body + "\n";
}
