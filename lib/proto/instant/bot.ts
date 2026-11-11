/**
 * «Макет в боте» — поток в личке бота студии.
 *
 * Владелец, 10.11.2026: «пользователь пишет название сайта, дальше
 * включается наш промпт, а в конце показываем стоимость сайта + допы как
 * обычно»; «категорию… выбирают сами, а мы тянем соответствующий макет».
 *
 *   /maket (или /start maket) → адрес сайта или «Сайта нет» → ниша кнопкой →
 *   виджет хода сборки (lib/proto/instant/widget) → «Открыть макет» → цена
 *   сайта и допов → лид в очередь тёплых лидов (routeNewLead), источник
 *   «mockup».
 *
 * Сайта нет — четыре вопроса (название, телефон, адрес, услуги с ценами).
 * Ниша без шаблона — честно «скоро», лид менеджеру.
 *
 * Это ответ на действие клиента, поэтому собирать можно и ночью; карточка
 * лида команде ночью ждёт утра по общему правилу (startQueue, «Ночью бот
 * молчит»). Правило «бот макеты сам не собирает» (AUTO_PROTO) — про касания
 * и здесь не тронуто: макет собирается только по просьбе самого клиента.
 */
import { cases } from "@/content/cases";
import { OFFER_MS, announceText } from "@/lib/admin/mockup-offer";
import { PROTOTYPE_HOURS } from "@/lib/admin/outreach";
import { CIRCLE_NICHES, CIRCLE_NICHE_RU, isCircleNiche, type CircleNiche } from "@/lib/admin/sales-after-reply";
import { buildInstant, type InstantBuild } from "@/lib/proto/instant/build";
import { DAILY_CAP, limitVerdict, mayUseInstant, siteUrlOf } from "@/lib/proto/instant/limits";
import { offerAddons } from "@/lib/proto/instant/offer";
import { readClientSite, siteFromAnswers, type ReadResult } from "@/lib/proto/instant/read";
import type { Flow } from "@/lib/proto/instant/store";
import { instantReady, type InstantLocale, type InstantNiche, type InstantSite } from "@/lib/proto/instant/types";
import { stepCaption, widgetHtml, widgetState, type BuildFail, type BuildStep, type WidgetInfo } from "@/lib/proto/instant/widget";

/** Сколько виден каждый шаг сборки в виджете. */
export const STEP_SHOW_MS = 1200;
import { esc } from "@/lib/proto/instant/safe";

export const INSTANT_CB = "im";
export const INSTANT_START = "maket";

export type Ctx = {
  chatId: number;
  tgId: number;
  username: string | null;
  locale: InstantLocale;
  /** id сотрудника, если пишет сотрудник: без лимита, макет тестовый, без лида. */
  staffId: string | null;
  /** Роль сотрудника по базе: пока поток закрыт, пускаем только admin и head. */
  role: string | null;
};

type Btn = { text: string; callback_data: string } | { text: string; url: string };

/** Всё, что поток делает снаружи: Telegram, база, модель. В тестах — подделка. */
export type Deps = {
  send: (chatId: number, html: string, rows?: Btn[][]) => Promise<number | null>;
  edit: (chatId: number, messageId: number, html: string) => Promise<boolean>;
  /** Открывается ли сайт (наш аудитор, lib/audit/fetch): null — да, иначе почему нет. Нет функции — тест: «да». */
  reachable?: (url: string) => Promise<string | null>;
  sendWidget: (chatId: number, input: { html: string; chatData: string; caption: string }) => Promise<number | null>;
  editWidget: (chatId: number, messageId: number, chatData: string) => Promise<boolean>;
  editCaption: (chatId: number, messageId: number, caption: string) => Promise<boolean>;
  flowOf: (chatId: number) => Promise<Flow | null>;
  saveFlow: (chatId: number, flow: Flow) => Promise<void>;
  dropFlow: (chatId: number) => Promise<void>;
  claimBuild: (chatId: number, flow: Flow) => Promise<boolean>;
  counts: (tgId: number) => Promise<{ mine: number; today: number; link: string | null } | null>;
  read: (url: string, niche: InstantNiche, locale: InstantLocale, onStep: (s: BuildStep, site?: InstantSite) => Promise<void>) => Promise<ReadResult>;
  /** Пауза между шагами виджета: сборка идёт миллисекунды, а человек должен успеть увидеть шаг. */
  pace?: (ms: number) => Promise<void>;
  save: (build: InstantBuild, ctx: Ctx) => Promise<{ id: string; token: string } | null>;
  lead: (input: LeadInput) => Promise<string | null>;
  setLead: (protoId: string, leadId: string) => Promise<void>;
  protoUrl: (token: string) => string;
  now: () => Date;
  /** MOCKUP_BOT_OPEN; в тестах — оба положения. */
  open?: boolean;
};

export type LeadInput = {
  ctx: Ctx;
  name: string;
  niche: CircleNiche;
  site: string | null;
  link: string | null;
  phone: string | null;
  why: "built" | "soon" | "failed" | "day";
};

/**
 * Через сколько часов дизайнер пришлёт макет, собранный вручную. Одно число
 * на всё: то же обещание, что в письмах касаний (PROTOTYPE_HOURS).
 */
export const MANUAL_HOURS = PROTOTYPE_HOURS;

/** Лид, которому макет собирают руками: сферы без шаблона, дневной потолок, сборка не прошла. */
export const manualWhy = (why: LeadInput["why"]) => why !== "built";

/** Ниши кружков → ниши кейсов (forNiches в content/cases.ts). */
const CASE_NICHES: Record<CircleNiche, readonly string[]> = {
  general: [],
  medcentr: ["medcentr"],
  stomatologiya: ["stomatologiya"],
  mebel: ["mebel"],
  restoran: ["restoran"],
  "salon-krasoty": [],
  turagentstvo: ["turagentstvo"],
  "uchebnyy-centr": ["uchebnyy-centr"],
  nedvizhimost: ["nedvizhimost", "agentstvo-nedvizhimosti"],
};

/**
 * Кейсы сферы клиента — до трёх ссылок на страницы кейсов; сферы нет или
 * кейсов в ней нет — страница всех кейсов. Адреса — devuz.studio/<язык>/cases,
 * их же пропускает badOurLinks.
 */
export function caseLinks(niche: CircleNiche, locale: InstantLocale): { name: string; url: string }[] {
  const keys = CASE_NICHES[niche];
  const found = cases.filter((c) => c.forNiches.some((n) => keys.includes(n))).slice(0, 3);
  if (found.length) return found.map((c) => ({ name: c.name, url: `https://devuz.studio/${locale}/cases/${c.slug}` }));
  return [{ name: locale === "uz" ? "Barcha keyslar" : "Все кейсы", url: `https://devuz.studio/${locale}/cases` }];
}

/** Ручной путь клиенту: честно про дизайнера и срок, и кейсы его сферы. */
export function manualText(locale: InstantLocale, niche: CircleNiche): string {
  const links = caseLinks(niche, locale).map((c) => `• <a href="${esc(c.url)}">${esc(c.name)}</a>`);
  return [T[locale].manual(MANUAL_HOURS), "", ...links].join("\n");
}

/** Instagram в ответе клиента: ссылка на профиль. Сайта по нему не прочитать — идём вопросами. */
export function instagramOf(text: string): string | null {
  const m = /instagram\.com\/([A-Za-z0-9._]{2,30})/i.exec(text);
  return m && !/^(p|reel|reels|stories|explore)$/i.test(m[1]) ? m[1] : null;
}

const T = {
  ru: {
    ask: "Соберу макет вашего сайта прямо здесь, за пару минут.\n\nПришлите адрес сайта вашей компании, например <code>clinic.uz</code>. Сайта нет, только Instagram — нажмите «Сайта нет».",
    nosite: "Сайта нет",
    badUrl: "Не похоже на адрес сайта. Пришлите адрес вида <code>clinic.uz</code> или нажмите «Сайта нет».",
    niche: "Чем занимается ваша компания? Выберите, и я возьму готовый макет под вашу сферу.",
    other: "Другое",
    qName: "Как называется ваша компания?",
    qPhone: "Телефон для записи, например <code>+998 90 123 45 67</code>",
    qAddress: "Адрес, как его ищут клиенты. Нет адреса — напишите «нет».",
    qServices: "Перечислите 3-6 услуг, каждую с новой строки. Цену, если есть, — через тире: <code>Чистка - 300 000 сум</code>",
    badPhone: "Не вижу номера. Пришлите телефон цифрами.",
    has: (link: string) => `Ваш макет уже собран, он один на аккаунт: <a href="${esc(link)}">открыть макет</a>.\n\nХотите доработать или собрать сайт — напишите здесь, менеджер ответит.`,
    busy: "Уже собираю, ещё минутку.",
    later: "Сейчас не получается проверить очередь. Попробуйте через пару минут: /maket",
    open: "Не получилось открыть сайт. Проверьте адрес и пришлите ещё раз или нажмите «Сайта нет».",
    failed: `Собрать сам не смог: макет соберёт наш дизайнер вручную и пришлёт сюда в течение ${PROTOTYPE_HOURS} часов.`,
    ready: (name: string) => `Готово! Макет сайта «${esc(name)}» по вашим данным.\n\nСсылка открыта 24 часа, дальше по паролю: попросите его здесь.`,
    openBtn: "Открыть макет",
    addons: "Что можно добавить к сайту:",
    kpBtn: "📄 Коммерческое предложение",
    kp: "Коммерческое предложение на нашем бланке: выберите основу и допы, итог посчитается сам. Цена закреплена на 48 часов.",
    after: "Хотите такой сайт? Напишите здесь «Да», менеджер свяжется и ответит на вопросы.",
    greet: "Здравствуйте! Соберём макет вашего нового сайта прямо здесь, за 2 минуты и бесплатно. Пришлите адрес вашего сайта или Instagram.",
    greetGo: "Собрать макет",
    greetOther: "У меня другой вопрос",
    manual: (h: number) => `Для вашей сферы макет соберёт наш дизайнер вручную, пришлём сюда в течение ${h} часов. Пока посмотрите, что мы уже делали:`,
  },
  uz: {
    ask: "Saytingiz maketini shu yerning o‘zida, bir-ikki daqiqada yig‘ib beraman.\n\nKompaniyangiz sayti manzilini yuboring, masalan <code>clinic.uz</code>. Sayt yo‘q, faqat Instagram bo‘lsa — «Sayt yo‘q» tugmasini bosing.",
    nosite: "Sayt yo‘q",
    badUrl: "Bu sayt manziliga o‘xshamaydi. <code>clinic.uz</code> ko‘rinishidagi manzilni yuboring yoki «Sayt yo‘q» tugmasini bosing.",
    niche: "Kompaniyangiz nima bilan shug‘ullanadi? Tanlang, sohangizga mos tayyor maketni olaman.",
    other: "Boshqa",
    qName: "Kompaniyangiz nomi qanday?",
    qPhone: "Yozilish uchun telefon, masalan <code>+998 90 123 45 67</code>",
    qAddress: "Mijozlar qidiradigan manzil. Manzil yo‘q bo‘lsa — «yo‘q» deb yozing.",
    qServices: "3-6 ta xizmatni har birini yangi qatordan yozing. Narxi bo‘lsa, tire orqali: <code>Tozalash - 300 000 so‘m</code>",
    badPhone: "Raqamni ko‘rmayapman. Telefonni raqamlar bilan yuboring.",
    has: (link: string) => `Maketingiz allaqachon tayyor, bitta akkauntga bitta: <a href="${esc(link)}">maketni ochish</a>.\n\nSaytni yig‘ish yoki o‘zgartirish kerak bo‘lsa, shu yerda yozing, menejer javob beradi.`,
    busy: "Yig‘yapman, bir daqiqa.",
    later: "Hozir navbatni tekshirib bo‘lmayapti. Bir-ikki daqiqadan keyin urinib ko‘ring: /maket",
    open: "Saytni ochib bo‘lmadi. Manzilni tekshirib, qayta yuboring yoki «Sayt yo‘q» tugmasini bosing.",
    failed: `O‘zim yig‘a olmadim: maketni dizaynerimiz qo‘lda yig‘ib, ${PROTOTYPE_HOURS} soat ichida shu yerga yuboradi.`,
    ready: (name: string) => `Tayyor! «${esc(name)}» sayti maketi sizning ma’lumotlaringiz bo‘yicha.\n\nHavola 24 soat ochiq, keyin parol bilan: uni shu yerda so‘rang.`,
    openBtn: "Maketni ochish",
    addons: "Saytga nimalar qo‘shish mumkin:",
    kpBtn: "📄 Tijorat taklifi",
    kp: "Blankamizdagi tijorat taklifi: asos va qo‘shimchalarni tanlang, jami o‘zi hisoblanadi. Narx 48 soatga qotirildi.",
    after: "Shunday sayt kerakmi? Shu yerda «Ha» deb yozing, menejer bog‘lanadi.",
    greet: "Assalomu alaykum! Yangi saytingiz maketini shu yerning o‘zida, 2 daqiqada va bepul yig‘amiz. Saytingiz yoki Instagram manzilini yuboring.",
    greetGo: "Maketni yig‘ish",
    greetOther: "Boshqa savolim bor",
    manual: (h: number) => `Sohangiz uchun maketni dizaynerimiz qo‘lda yig‘adi, ${h} soat ichida shu yerga yuboramiz. Hozircha qilgan ishlarimizni ko‘ring:`,
  },
} as const;

/** Узбекские названия ниш для кнопок; русские — CIRCLE_NICHE_RU. */
const NICHE_UZ: Record<CircleNiche, string> = {
  general: "Boshqa",
  medcentr: "Tibbiyot markazi",
  stomatologiya: "Stomatologiya",
  mebel: "Mebel",
  restoran: "Restoran",
  "salon-krasoty": "Go‘zallik saloni",
  turagentstvo: "Turagentlik",
  "uchebnyy-centr": "O‘quv markazi",
  nedvizhimost: "Ko‘chmas mulk",
};

/** Допы ниши — те же, что в КП (lib/proto/instant/offer): цены из планов наших макетов. */
export function addonLines(locale: InstantLocale, niche: InstantNiche = "stomatologiya"): string[] {
  return offerAddons(niche).map((a) => `• ${esc(a[locale])}: ${a.price} $`);
}

/** Цена: те же спецусловия 48 часов, что после любого макета, и допы из плана. */
export function priceText(locale: InstantLocale, now: Date, niche: InstantNiche = "stomatologiya"): string {
  const expires = new Date(now.getTime() + OFFER_MS).toISOString();
  return [esc(announceText(locale, expires)), "", T[locale].addons, ...addonLines(locale, niche), "", T[locale].after].join("\n");
}

export function nicheRows(locale: InstantLocale): Btn[][] {
  const label = (n: CircleNiche) => (n === "general" ? T[locale].other : locale === "uz" ? NICHE_UZ[n] : CIRCLE_NICHE_RU[n]);
  const order = [...CIRCLE_NICHES.filter((n) => n !== "general"), "general" as const];
  const rows: Btn[][] = [];
  for (let i = 0; i < order.length; i += 2) {
    rows.push(order.slice(i, i + 2).map((n) => ({ text: label(n), callback_data: `${INSTANT_CB}:n:${n}` })));
  }
  return rows;
}

const fresh = (ctx: Ctx, stage: Flow["stage"]): Flow => ({
  stage,
  locale: ctx.locale,
  url: null,
  nosite: false,
  niche: null,
  answers: {},
  at: new Date().toISOString(),
});

/** Проверка лимита. Отказ — сообщение клиенту; «day» — ещё и лид менеджеру. */
async function allowed(ctx: Ctx, deps: Deps): Promise<boolean> {
  const counts = await deps.counts(ctx.tgId);
  // База не ответила — лимит не проверить: не собираем, говорим честно.
  if (!counts) {
    await deps.send(ctx.chatId, T[ctx.locale].later);
    return false;
  }
  const verdict = limitVerdict({ staff: Boolean(ctx.staffId), mine: counts.mine, today: counts.today, cap: DAILY_CAP });
  if (verdict === "has") {
    await deps.send(ctx.chatId, T[ctx.locale].has(counts.link ? deps.protoUrl(counts.link) : ""));
    return false;
  }
  if (verdict === "day") {
    await deps.send(ctx.chatId, manualText(ctx.locale, "general"));
    await deps.lead({ ctx, name: ctx.username ? `@${ctx.username}` : "", niche: "general", site: null, link: null, phone: null, why: "day" });
    return false;
  }
  return true;
}

/** Поток открыт этому человеку? Нет — вызывающий ведёт себя как раньше. */
export const instantOpenFor = (ctx: Pick<Ctx, "role">, open?: boolean) => mayUseInstant(ctx.role, open);

export async function startInstant(ctx: Ctx, deps: Deps): Promise<void> {
  if (!instantOpenFor(ctx, deps.open)) return;
  if (!(await allowed(ctx, deps))) return;
  await deps.saveFlow(ctx.chatId, fresh(ctx, "url"));
  await deps.send(ctx.chatId, T[ctx.locale].ask, [[{ text: T[ctx.locale].nosite, callback_data: `${INSTANT_CB}:nosite` }]]);
}

/**
 * Первое сообщение нового клиента (владелец, 11.11.2026: «фишка с макетом
 * прямо в боте… стала прям основой при первом обращении клиента»). Адрес
 * сайта или Instagram сразу ведёт в сборку, «У меня другой вопрос» и любой
 * другой текст — в прежний разговор. Пока поток закрыт — false, приветствие
 * прежнее.
 */
export async function greetInstant(ctx: Ctx, deps: Deps): Promise<boolean> {
  if (!instantOpenFor(ctx, deps.open)) return false;
  const t = T[ctx.locale];
  await deps.saveFlow(ctx.chatId, fresh(ctx, "greet"));
  await deps.send(ctx.chatId, t.greet, [
    [{ text: t.greetGo, callback_data: `${INSTANT_CB}:go` }],
    [{ text: t.greetOther, callback_data: `${INSTANT_CB}:other` }],
  ]);
  return true;
}

/** Адрес сайта или Instagram — дальше выбор сферы; иначе null. */
async function takeAddress(ctx: Ctx, flow: Flow, value: string, deps: Deps): Promise<boolean> {
  const insta = instagramOf(value);
  const url = insta ? null : siteUrlOf(value);
  if (!insta && !url) return false;
  if (!(await allowed(ctx, deps))) {
    await deps.dropFlow(ctx.chatId);
    return true;
  }
  // Сайт не открылся — говорим сразу, до сферы и виджета (владелец, 11.11.2026,
  // на «Dental.uz»: бот спросил сферу, начал сборку и только потом сдался).
  const fail = url && deps.reachable ? await deps.reachable(url) : null;
  if (fail) {
    console.error("макет в боте: сайт не открылся до сферы:", fail);
    await deps.saveFlow(ctx.chatId, { ...flow, stage: "url", url: null, fail });
    await deps.send(ctx.chatId, T[flow.locale].open, [[{ text: T[flow.locale].nosite, callback_data: `${INSTANT_CB}:nosite` }]]);
    return true;
  }
  const next: Flow = insta
    ? { ...flow, stage: "niche", nosite: true, url: null, answers: { ...flow.answers, instagram: insta } }
    : { ...flow, stage: "niche", url };
  await deps.saveFlow(ctx.chatId, next);
  await deps.send(ctx.chatId, T[flow.locale].niche, nicheRows(flow.locale));
  return true;
}

/**
 * Новый человек без /start сразу прислал адрес сайта или Instagram — это и
 * есть просьба о макете. Пока поток закрыт или это не адрес — false.
 */
export const looksLikeAddress = (text: string) => Boolean(instagramOf(text) || siteUrlOf(text.trim()));

export async function instantFromAddress(ctx: Ctx, text: string, deps: Deps): Promise<boolean> {
  if (!instantOpenFor(ctx, deps.open)) return false;
  if (!looksLikeAddress(text)) return false;
  return takeAddress(ctx, fresh(ctx, "greet"), text.trim().slice(0, 1500), deps);
}

/** Текст клиента во время потока. false — потока нет, пусть разбирает первичка. */
export async function handleInstantText(
  chatId: number,
  makeCtx: () => Promise<Ctx>,
  text: string,
  deps: Deps,
): Promise<boolean> {
  // Поток есть не у всех: кто его не начинал, тому — ни одного лишнего запроса, кроме этого.
  const flow = await deps.flowOf(chatId);
  if (!flow) return false;
  const ctx = await makeCtx();
  if (!instantOpenFor(ctx, deps.open)) {
    await deps.dropFlow(chatId);
    return false;
  }
  const t = T[flow.locale];
  const value = text.trim().slice(0, 1500);
  switch (flow.stage) {
    case "greet": {
      // Не адрес — человек пришёл с другим вопросом: приветствие отступает, отвечает первичка.
      if (await takeAddress(ctx, flow, value, deps)) return true;
      await deps.dropFlow(chatId);
      return false;
    }
    case "url": {
      if (await takeAddress(ctx, flow, value, deps)) return true;
      await deps.send(ctx.chatId, t.badUrl, [[{ text: t.nosite, callback_data: `${INSTANT_CB}:nosite` }]]);
      return true;
    }
    case "niche":
      await deps.send(ctx.chatId, t.niche, nicheRows(flow.locale));
      return true;
    case "q_name":
      await deps.saveFlow(ctx.chatId, { ...flow, stage: "q_phone", answers: { ...flow.answers, name: value.slice(0, 60) } });
      await deps.send(ctx.chatId, t.qPhone);
      return true;
    case "q_phone":
      if (value.replace(/\D/g, "").length < 9) {
        await deps.send(ctx.chatId, t.badPhone);
        return true;
      }
      await deps.saveFlow(ctx.chatId, { ...flow, stage: "q_address", answers: { ...flow.answers, phone: value.slice(0, 30) } });
      await deps.send(ctx.chatId, t.qAddress);
      return true;
    case "q_address": {
      const none = /^(нет|yo['‘’`]?q|-|no)$/i.test(value);
      await deps.saveFlow(ctx.chatId, { ...flow, stage: "q_services", answers: { ...flow.answers, address: none ? "" : value.slice(0, 140) } });
      await deps.send(ctx.chatId, t.qServices);
      return true;
    }
    case "q_services": {
      const next = { ...flow, answers: { ...flow.answers, services: value } };
      await deps.saveFlow(ctx.chatId, next);
      await runBuild(ctx, next, deps);
      return true;
    }
    case "building":
      await deps.send(ctx.chatId, t.busy);
      return true;
  }
}

/**
 * Кнопка потока: «Собрать макет», «У меня другой вопрос», «Сайта нет» или
 * ниша. "other" — вызывающий отвечает прежним приветствием первички.
 */
export async function handleInstantButton(ctx: Ctx, parts: readonly string[], deps: Deps): Promise<"other" | void> {
  if (!instantOpenFor(ctx, deps.open)) return;
  if (parts[1] === "other") {
    await deps.dropFlow(ctx.chatId);
    return "other";
  }
  if (parts[1] === "go") {
    await startInstant(ctx, deps);
    return;
  }
  const flow = (await deps.flowOf(ctx.chatId)) ?? null;
  if (!flow) {
    await startInstant(ctx, deps);
    return;
  }
  const t = T[flow.locale];
  if (parts[1] === "nosite") {
    await deps.saveFlow(ctx.chatId, { ...flow, stage: "niche", nosite: true, url: null });
    await deps.send(ctx.chatId, t.niche, nicheRows(flow.locale));
    return;
  }
  if (parts[1] !== "n" || !isCircleNiche(parts[2]) || flow.stage === "building") return;
  const niche = parts[2];
  if (!instantReady(niche)) {
    await deps.dropFlow(ctx.chatId);
    await deps.send(ctx.chatId, manualText(flow.locale, niche));
    if (!ctx.staffId) await deps.lead({ ctx, name: ctx.username ? `@${ctx.username}` : "", niche, site: flow.url, link: null, phone: null, why: "soon" });
    return;
  }
  const next: Flow = { ...flow, niche };
  if (flow.nosite) {
    await deps.saveFlow(ctx.chatId, { ...next, stage: "q_name" });
    await deps.send(ctx.chatId, t.qName);
    return;
  }
  await deps.saveFlow(ctx.chatId, next);
  await runBuild(ctx, next, deps);
}

/**
 * Сборка с виджетом. Каждый шаг виджета — после настоящего шага:
 * сайт прочитан, логотип и цвета взяты, услуги разобраны, страница собрана,
 * проверка прошла, макет записан.
 */
export async function runBuild(ctx: Ctx, flow: Flow, deps: Deps): Promise<void> {
  const locale = flow.locale;
  const niche = flow.niche;
  if (!niche || !instantReady(niche)) return;
  if (!(await deps.claimBuild(ctx.chatId, flow))) {
    await deps.send(ctx.chatId, T[locale].busy);
    return;
  }
  // Лимит — ещё раз перед сборкой: между /maket и нишей мог собраться второй.
  if (!(await allowed(ctx, deps))) {
    await deps.dropFlow(ctx.chatId);
    return;
  }

  const widget = await deps.sendWidget(ctx.chatId, { html: widgetHtml(locale), chatData: widgetState("read"), caption: stepCaption(locale, "read") });
  // Приложение без виджетов (или метод не принят) — тот же ход обычным сообщением.
  const status = widget === null ? await deps.send(ctx.chatId, stepCaption(locale, "read")) : null;
  let info: WidgetInfo = {};
  const learn = (x: InstantSite) => {
    info = { name: x.name, color: x.color, services: x.services.map((v) => v.name) };
  };
  const pace = deps.pace ?? ((ms: number) => new Promise<void>((r) => setTimeout(r, ms)));
  const step = async (s: BuildStep, failed: BuildFail | false = false) => {
    // Постановка поверх настоящих шагов (владелец, 10.11.2026: «показывай
    // прям интерактивно… как ты собираешь»): каждый шаг виден не меньше секунды.
    if (!failed && s !== "read") await pace(STEP_SHOW_MS);
    if (widget) {
      await deps.editWidget(ctx.chatId, widget, widgetState(s, failed, info));
      await deps.editCaption(ctx.chatId, widget, stepCaption(locale, s, failed));
    } else if (status) {
      await deps.edit(ctx.chatId, status, stepCaption(locale, s, failed));
    }
  };

  let site: InstantSite | null = null;
  if (flow.nosite) {
    const a = flow.answers;
    site = siteFromAnswers({ niche, locale, name: a.name ?? "", phone: a.phone ?? "", address: a.address ?? "", services: a.services ?? "", instagram: a.instagram ?? null });
    learn(site);
    await step("brand");
    await step("services");
  } else if (flow.url) {
    const res = await deps.read(flow.url, niche, locale, (s, partial) => {
      if (partial) learn(partial);
      return step(s);
    });
    if (!res.ok) {
      await step("read", "site");
      const fail = `${res.why}: ${res.detail ?? ""}`.trim();
      console.error("макет в боте: сайт не прочитан:", fail);
      await deps.saveFlow(ctx.chatId, { ...flow, stage: "url", url: null, fail });
      await deps.send(ctx.chatId, T[locale].open, [[{ text: T[locale].nosite, callback_data: `${INSTANT_CB}:nosite` }]]);
      return;
    }
    site = res.site;
  }
  if (!site) return;

  await step("build");
  const build = buildInstant(site, undefined, deps.now());
  await step("check");
  const name = build.site.name || (ctx.username ? `@${ctx.username}` : "");
  if (build.problems.length) {
    console.error("макет в боте: проверка не прошла", build.problems.map((p) => p.code).join(","));
    await deps.save(build, ctx); // черновиком: в «Макетах» видно, что не так
    await step("check", "build");
    await deps.dropFlow(ctx.chatId);
    await deps.send(ctx.chatId, T[locale].failed);
    if (!ctx.staffId) await deps.lead({ ctx, name, niche, site: flow.url, link: null, phone: build.site.phone, why: "failed" });
    return;
  }
  const saved = await deps.save(build, ctx);
  if (!saved) {
    await step("check", "build");
    await deps.dropFlow(ctx.chatId);
    await deps.send(ctx.chatId, T[locale].failed);
    if (!ctx.staffId) await deps.lead({ ctx, name, niche, site: flow.url, link: null, phone: build.site.phone, why: "failed" });
    return;
  }
  await step("done");
  await deps.dropFlow(ctx.chatId);
  const link = deps.protoUrl(saved.token);
  await deps.send(ctx.chatId, T[locale].ready(build.site.name), [[{ text: T[locale].openBtn, url: link }]]);
  // КП на бланке рядом с макетом: та же цена и те же допы, выбрать и посчитать.
  await deps.send(ctx.chatId, `${priceText(locale, deps.now(), build.site.niche)}\n\n${T[locale].kp}`, [[{ text: T[locale].kpBtn, url: `${link}/kp` }]]);
  // Сборка сотрудника — тестовая: лида в очередь менеджерам нет.
  if (ctx.staffId) return;
  const leadId = await deps.lead({ ctx, name, niche, site: flow.url, link, phone: build.site.phone, why: "built" });
  if (leadId) await deps.setLead(saved.id, leadId);
}
