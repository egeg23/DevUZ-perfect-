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
import plans from "@/content/mockup-plans.json" with { type: "json" };
import { OFFER_MS, announceText } from "@/lib/admin/mockup-offer";
import { CIRCLE_NICHES, CIRCLE_NICHE_RU, isCircleNiche, type CircleNiche } from "@/lib/admin/sales-after-reply";
import { buildInstant, type InstantBuild } from "@/lib/proto/instant/build";
import { DAILY_CAP, limitVerdict, siteUrlOf } from "@/lib/proto/instant/limits";
import { readClientSite, siteFromAnswers, type ReadResult } from "@/lib/proto/instant/read";
import type { Flow } from "@/lib/proto/instant/store";
import { instantReady, type InstantLocale, type InstantNiche, type InstantSite } from "@/lib/proto/instant/types";
import { stepCaption, widgetHtml, widgetState, type BuildStep } from "@/lib/proto/instant/widget";
import { esc } from "@/lib/proto/instant/safe";

export const INSTANT_CB = "im";
export const INSTANT_START = "maket";

export type Ctx = {
  chatId: number;
  tgId: number;
  username: string | null;
  locale: InstantLocale;
  /** id сотрудника, если пишет сотрудник: без лимита. */
  staffId: string | null;
};

type Btn = { text: string; callback_data: string } | { text: string; url: string };

/** Всё, что поток делает снаружи: Telegram, база, модель. В тестах — подделка. */
export type Deps = {
  send: (chatId: number, html: string, rows?: Btn[][]) => Promise<number | null>;
  edit: (chatId: number, messageId: number, html: string) => Promise<boolean>;
  sendWidget: (chatId: number, input: { html: string; chatData: string; caption: string }) => Promise<number | null>;
  editWidget: (chatId: number, messageId: number, chatData: string) => Promise<boolean>;
  editCaption: (chatId: number, messageId: number, caption: string) => Promise<boolean>;
  flowOf: (chatId: number) => Promise<Flow | null>;
  saveFlow: (chatId: number, flow: Flow) => Promise<void>;
  dropFlow: (chatId: number) => Promise<void>;
  claimBuild: (chatId: number, flow: Flow) => Promise<boolean>;
  counts: (tgId: number) => Promise<{ mine: number; today: number; link: string | null } | null>;
  read: (url: string, niche: InstantNiche, locale: InstantLocale, onStep: (s: BuildStep) => Promise<void>) => Promise<ReadResult>;
  save: (build: InstantBuild, ctx: Ctx) => Promise<{ id: string; token: string } | null>;
  lead: (input: LeadInput) => Promise<string | null>;
  setLead: (protoId: string, leadId: string) => Promise<void>;
  protoUrl: (token: string) => string;
  now: () => Date;
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

const T = {
  ru: {
    ask: "Соберу макет вашего сайта прямо здесь, за пару минут.\n\nПришлите адрес сайта вашей компании, например <code>clinic.uz</code>. Сайта нет, только Instagram — нажмите «Сайта нет».",
    nosite: "Сайта нет",
    badUrl: "Не похоже на адрес сайта. Пришлите адрес вида <code>clinic.uz</code> или нажмите «Сайта нет».",
    niche: "Чем занимается ваша компания? Выберите, и я возьму готовый макет под вашу сферу.",
    other: "Другое",
    soon: "Макет для этой сферы ещё готовим. Передал менеджеру: он напишет вам и покажет похожие работы.",
    qName: "Как называется ваша компания?",
    qPhone: "Телефон для записи, например <code>+998 90 123 45 67</code>",
    qAddress: "Адрес, как его ищут клиенты. Нет адреса — напишите «нет».",
    qServices: "Перечислите 3-6 услуг, каждую с новой строки. Цену, если есть, — через тире: <code>Чистка - 300 000 сум</code>",
    badPhone: "Не вижу номера. Пришлите телефон цифрами.",
    has: (link: string) => `Ваш макет уже собран, он один на аккаунт: <a href="${esc(link)}">открыть макет</a>.\n\nХотите доработать или собрать сайт — напишите здесь, менеджер ответит.`,
    day: "Сегодня собрали уже много макетов, очередь на завтра. Передал вашу заявку менеджеру, он напишет вам сам.",
    busy: "Уже собираю, ещё минутку.",
    later: "Сейчас не получается проверить очередь. Попробуйте через пару минут: /maket",
    open: "Не получилось открыть сайт. Проверьте адрес и пришлите ещё раз или нажмите «Сайта нет».",
    failed: "Собрать сам не смог, передал менеджеру: он сделает макет руками и пришлёт сюда.",
    ready: (name: string) => `Готово! Макет сайта «${esc(name)}» по вашим данным.\n\nСсылка открыта 24 часа, дальше по паролю: попросите его здесь.`,
    openBtn: "Открыть макет",
    addons: "Что можно добавить к сайту:",
    after: "Хотите такой сайт? Напишите здесь «Да», менеджер свяжется и ответит на вопросы.",
  },
  uz: {
    ask: "Saytingiz maketini shu yerning o‘zida, bir-ikki daqiqada yig‘ib beraman.\n\nKompaniyangiz sayti manzilini yuboring, masalan <code>clinic.uz</code>. Sayt yo‘q, faqat Instagram bo‘lsa — «Sayt yo‘q» tugmasini bosing.",
    nosite: "Sayt yo‘q",
    badUrl: "Bu sayt manziliga o‘xshamaydi. <code>clinic.uz</code> ko‘rinishidagi manzilni yuboring yoki «Sayt yo‘q» tugmasini bosing.",
    niche: "Kompaniyangiz nima bilan shug‘ullanadi? Tanlang, sohangizga mos tayyor maketni olaman.",
    other: "Boshqa",
    soon: "Bu soha uchun maket hali tayyorlanmoqda. Menejerga topshirdim: u sizga yozadi va o‘xshash ishlarni ko‘rsatadi.",
    qName: "Kompaniyangiz nomi qanday?",
    qPhone: "Yozilish uchun telefon, masalan <code>+998 90 123 45 67</code>",
    qAddress: "Mijozlar qidiradigan manzil. Manzil yo‘q bo‘lsa — «yo‘q» deb yozing.",
    qServices: "3-6 ta xizmatni har birini yangi qatordan yozing. Narxi bo‘lsa, tire orqali: <code>Tozalash - 300 000 so‘m</code>",
    badPhone: "Raqamni ko‘rmayapman. Telefonni raqamlar bilan yuboring.",
    has: (link: string) => `Maketingiz allaqachon tayyor, bitta akkauntga bitta: <a href="${esc(link)}">maketni ochish</a>.\n\nSaytni yig‘ish yoki o‘zgartirish kerak bo‘lsa, shu yerda yozing, menejer javob beradi.`,
    day: "Bugun ko‘p maket yig‘dik, navbat ertaga. Arizangizni menejerga topshirdim, u o‘zi yozadi.",
    busy: "Yig‘yapman, bir daqiqa.",
    later: "Hozir navbatni tekshirib bo‘lmayapti. Bir-ikki daqiqadan keyin urinib ko‘ring: /maket",
    open: "Saytni ochib bo‘lmadi. Manzilni tekshirib, qayta yuboring yoki «Sayt yo‘q» tugmasini bosing.",
    failed: "O‘zim yig‘a olmadim, menejerga topshirdim: u maketni qo‘lda yig‘ib, shu yerga yuboradi.",
    ready: (name: string) => `Tayyor! «${esc(name)}» sayti maketi sizning ma’lumotlaringiz bo‘yicha.\n\nHavola 24 soat ochiq, keyin parol bilan: uni shu yerda so‘rang.`,
    openBtn: "Maketni ochish",
    addons: "Saytga nimalar qo‘shish mumkin:",
    after: "Shunday sayt kerakmi? Shu yerda «Ha» deb yozing, menejer bog‘lanadi.",
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

/**
 * Допы стоматологии — из плана нашего макета Nek Dental Studio
 * (content/mockup-plans.json): цены и описания оттуда, своих не придумываем.
 * Пролёт по кадрам и раздел для приезжих в Тбилиси — про Nek, не про всех.
 */
const DENTAL_ADDONS = ["admin", "chat", "quiz", "remind", "reviews"] as const;
const ADDON_UZ: Record<(typeof DENTAL_ADDONS)[number], string> = {
  admin: "Klinika paneli: yozuv, jadval, holatlar",
  chat: "Saytdagi chat: javoblar yoki administrator",
  quiz: "4 qadamli «Tabassumingiz» kvizi",
  remind: "Bemorga tashrif eslatmasi",
  reviews: "Saytda Google sharhlari",
};

type Plan = { id: string; addons: { id: string; title: string; price: number }[] };

export function addonLines(locale: InstantLocale): string[] {
  const plan = (plans as Plan[]).find((p) => p.id === "nek");
  if (!plan) return [];
  return DENTAL_ADDONS.flatMap((id) => {
    const a = plan.addons.find((x) => x.id === id);
    if (!a) return [];
    return [`• ${esc(locale === "uz" ? ADDON_UZ[id] : a.title)}: ${a.price} $`];
  });
}

/** Цена: те же спецусловия 48 часов, что после любого макета, и допы из плана. */
export function priceText(locale: InstantLocale, now: Date): string {
  const expires = new Date(now.getTime() + OFFER_MS).toISOString();
  return [esc(announceText(locale, expires)), "", T[locale].addons, ...addonLines(locale), "", T[locale].after].join("\n");
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
    await deps.send(ctx.chatId, T[ctx.locale].day);
    await deps.lead({ ctx, name: ctx.username ? `@${ctx.username}` : "", niche: "general", site: null, link: null, phone: null, why: "day" });
    return false;
  }
  return true;
}

export async function startInstant(ctx: Ctx, deps: Deps): Promise<void> {
  if (!(await allowed(ctx, deps))) return;
  await deps.saveFlow(ctx.chatId, fresh(ctx, "url"));
  await deps.send(ctx.chatId, T[ctx.locale].ask, [[{ text: T[ctx.locale].nosite, callback_data: `${INSTANT_CB}:nosite` }]]);
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
  const t = T[flow.locale];
  const value = text.trim().slice(0, 1500);
  switch (flow.stage) {
    case "url": {
      const url = siteUrlOf(value);
      if (!url) {
        await deps.send(ctx.chatId, t.badUrl, [[{ text: t.nosite, callback_data: `${INSTANT_CB}:nosite` }]]);
        return true;
      }
      await deps.saveFlow(ctx.chatId, { ...flow, stage: "niche", url });
      await deps.send(ctx.chatId, t.niche, nicheRows(flow.locale));
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

/** Кнопка потока: «Сайта нет» или ниша. */
export async function handleInstantButton(ctx: Ctx, parts: readonly string[], deps: Deps): Promise<void> {
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
    await deps.send(ctx.chatId, t.soon);
    await deps.lead({ ctx, name: ctx.username ? `@${ctx.username}` : "", niche, site: flow.url, link: null, phone: null, why: "soon" });
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
  const step = async (s: BuildStep, failed = false) => {
    if (widget) {
      await deps.editWidget(ctx.chatId, widget, widgetState(s, failed));
      await deps.editCaption(ctx.chatId, widget, stepCaption(locale, s, failed));
    } else if (status) {
      await deps.edit(ctx.chatId, status, stepCaption(locale, s, failed));
    }
  };

  let site: InstantSite | null = null;
  if (flow.nosite) {
    const a = flow.answers;
    site = siteFromAnswers({ niche, locale, name: a.name ?? "", phone: a.phone ?? "", address: a.address ?? "", services: a.services ?? "" });
    await step("brand");
    await step("services");
  } else if (flow.url) {
    const res = await deps.read(flow.url, niche, locale, (s) => step(s));
    if (!res.ok) {
      await step("read", true);
      await deps.saveFlow(ctx.chatId, { ...flow, stage: "url", url: null });
      await deps.send(ctx.chatId, T[locale].open, [[{ text: T[locale].nosite, callback_data: `${INSTANT_CB}:nosite` }]]);
      return;
    }
    site = res.site;
  }
  if (!site) return;

  await step("build");
  const build = buildInstant(site);
  await step("check");
  const name = build.site.name || (ctx.username ? `@${ctx.username}` : "");
  if (build.problems.length) {
    console.error("макет в боте: проверка не прошла", build.problems.map((p) => p.code).join(","));
    await deps.save(build, ctx); // черновиком: в «Макетах» видно, что не так
    await step("check", true);
    await deps.dropFlow(ctx.chatId);
    await deps.send(ctx.chatId, T[locale].failed);
    await deps.lead({ ctx, name, niche, site: flow.url, link: null, phone: build.site.phone, why: "failed" });
    return;
  }
  const saved = await deps.save(build, ctx);
  if (!saved) {
    await step("check", true);
    await deps.dropFlow(ctx.chatId);
    await deps.send(ctx.chatId, T[locale].failed);
    await deps.lead({ ctx, name, niche, site: flow.url, link: null, phone: build.site.phone, why: "failed" });
    return;
  }
  await step("done");
  await deps.dropFlow(ctx.chatId);
  const link = deps.protoUrl(saved.token);
  await deps.send(ctx.chatId, T[locale].ready(build.site.name), [[{ text: T[locale].openBtn, url: link }]]);
  await deps.send(ctx.chatId, priceText(locale, deps.now()));
  const leadId = await deps.lead({ ctx, name, niche, site: flow.url, link, phone: build.site.phone, why: "built" });
  if (leadId) await deps.setLead(saved.id, leadId);
}
