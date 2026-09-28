import type { Locale } from "@/lib/i18n";
import { MIN_PAYOUT_USD, MODEL_SWITCH_DAYS, PARTNER_TIERS, REF_TTL_DAYS, type PayoutModel } from "@/lib/partners/rules";
import type { LinkFailure, PayoutFailure } from "@/lib/partners/store";

/**
 * Тексты партнёрской программы в боте.
 *
 * Два языка, а не четыре: партнёр — это переписка, и на языке, на котором
 * студия не ответит на встречный вопрос, программу не вести. Узбекский
 * получает русский, китайский — английский.
 */

export type PartnerStats = {
  earned: number;
  frozen: number;
  paid: number;
  available: number;
  leads: number;
  paidProjects: number;
  /** Персональная ставка, если владелец назначил. Иначе — по сумме проекта. */
  override: number | null;
  /** Модель дохода партнёра сейчас: от прибыли или с оборота. */
  model: PayoutModel;
  links: { code: string; label: string | null; clicks: number; leads: number; url: string }[];
};

export type PartnerCopy = {
  intro: (link: string, botLink: string) => string;
  stats: (s: PartnerStats) => string;
  linkCreated: (code: string, url: string) => string;
  linkFailed: (reason: LinkFailure) => string;
  payoutRequested: (amount: number) => string;
  payoutFailed: (reason: PayoutFailure, ctx: { available: number; opens: string }) => string;
  paid: (amount: number, note: string | null) => string;
  rejected: (amount: number, note: string | null) => string;
  unavailable: string;
  /** Ответ на /cabinet и на «Войти через Telegram» с сайта. */
  cabinet: (minutes: number) => string;
  cabinetButton: string;
  /** Договор с приведённым клиентом подписан. */
  contractSigned: (
    who: string,
    amountUsd: number | null,
    shareUsd: number | null,
    percent: number,
    model: PayoutModel,
  ) => string;
};

const usd = (n: number) => `${n.toLocaleString("ru-RU")} $`;

/**
 * Таблица ставок строками — из той же таблицы, по которой считаются деньги:
 * «до 2 500 $ — 10 % прибыли / 6 % оборота».
 */
function tiers(upTo: (n: string) => string, over: (n: string) => string, profit: string, turnover: string): string[] {
  return PARTNER_TIERS.map((t, i) => {
    const range = t.upTo === null ? over(usd(PARTNER_TIERS[i - 1]?.upTo ?? 0)) : upTo(usd(t.upTo));
    return `• ${range} — <b>${t.profit} %</b> ${profit} / <b>${t.turnover} %</b> ${turnover}`;
  });
}

const ru: PartnerCopy = {
  intro: (link, botLink) =>
    [
      "🤝 <b>Партнёрская программа DevUz Studio</b>",
      "",
      "Приводите клиентов — получаете процент с каждого их проекта, без ограничений по числу клиентов. Две модели на выбор: от чистой прибыли проекта или с оборота (суммы договора). Чем крупнее проект, тем выше процент:",
      ...tiers((n) => `до ${n}`, (n) => `дороже ${n}`, "прибыли", "оборота"),
      `Модель выбирается в кабинете и меняется не чаще раза в ${MODEL_SWITCH_DAYS} дней; за клиентом закрепляется та, что действовала в день его заявки.`,
      "",
      "<b>Ваша ссылка на сайт:</b>",
      link,
      "",
      "<b>Ссылка в этот бот:</b>",
      botLink,
      "",
      `Клиент приходит по ссылке и в течение ${REF_TTL_DAYS} дней оставляет заявку на сайте или пишет сюда — он ваш. Когда его проект оплачен целиком, начисление появляется здесь — команда /ref. Вывод — с первого рабочего дня месяца, команда /payout.`,
      "",
      "Отдельная ссылка под каждый канал: <code>/ref КОД метка</code> — например, <code>/ref TG-GROUP Телеграм-группа</code>. Так видно, откуда приходят люди.",
    ].join("\n"),

  stats: (s) =>
    [
      "<b>Ваш баланс</b>",
      `Заработано: <b>${usd(s.earned)}</b>`,
      `Заморожено (ждёт полной оплаты): ${usd(s.frozen)}`,
      `Выплачено: ${usd(s.paid)}`,
      `Доступно к выводу: <b>${usd(s.available)}</b>`,
      "",
      `Клиентов по вашим ссылкам: ${s.leads} · оплаченных проектов: ${s.paidProjects} · ставка: ` +
        (s.override !== null
          ? `${s.override} % (персональная)`
          : s.model === "turnover"
            ? `с оборота, ${PARTNER_TIERS[0].turnover}–${PARTNER_TIERS[PARTNER_TIERS.length - 1].turnover} % по сумме проекта`
            : `от чистой прибыли, ${PARTNER_TIERS[0].profit}–${PARTNER_TIERS[PARTNER_TIERS.length - 1].profit} % по сумме проекта`),
      "",
      "<b>Ссылки</b>",
      ...s.links.map(
        (l) => `• <b>${l.code}</b>${l.label ? ` — ${l.label}` : ""} · переходов ${l.clicks} · заявок ${l.leads}\n${l.url}`,
      ),
      "",
      `Вывод: /payout — от ${usd(MIN_PAYOUT_USD)}, с первого рабочего дня месяца. Новая ссылка: <code>/ref КОД метка</code>.`,
      "Удобнее на сайте — ссылки под каждый канал, график и клиенты по этапам: /cabinet.",
    ].join("\n"),

  linkCreated: (code, url) => `Ссылка <b>${code}</b> создана:\n${url}`,

  linkFailed: (reason) =>
    ({
      offline: "База сейчас недоступна — попробуйте через минуту.",
      invalid: "Код: 3–24 символа, латиница, цифры, дефис или подчёркивание.",
      reserved: "Этот код зарезервирован — выберите другой.",
      taken: "Такой код уже занят — придумайте другой.",
      limit: "Ссылок уже много — удалите неиспользуемые через владельца.",
      failed: "Не получилось создать ссылку. Попробуйте ещё раз.",
    })[reason],

  payoutRequested: (amount) =>
    `Заявка на выплату <b>${usd(amount)}</b> принята. Владелец студии отправит деньги и вы получите сообщение здесь.`,

  payoutFailed: (reason, ctx) =>
    ({
      offline: "База сейчас недоступна — попробуйте через минуту.",
      window: `Вывод откроется ${ctx.opens} — с первого рабочего дня месяца, после сверки платежей. Доступно сейчас: ${usd(ctx.available)}.`,
      requisites: `Напишите, куда платить: <code>/payout адрес USDT TRC-20</code> или <code>/payout реквизиты словами</code>. Запомним для следующих выплат.`,
      pending: "Одна заявка уже ждёт решения — вторую поверх неё не подать.",
      min: `Доступно ${usd(ctx.available)}, а минимальная выплата — ${usd(MIN_PAYOUT_USD)}. Подождите следующей оплаты.`,
      failed: "Не получилось подать заявку. Попробуйте ещё раз.",
    })[reason],

  paid: (amount, note) => `✅ Выплата <b>${usd(amount)}</b> отправлена.${note ? `\n${note}` : ""}`,

  rejected: (amount, note) =>
    `Заявка на ${usd(amount)} отклонена, сумма вернулась в доступное.${note ? `\nПричина: ${note}` : ""} Напишите владельцу, если это ошибка.`,

  unavailable: "Партнёрская программа сейчас недоступна — попробуйте через минуту.",

  cabinet: (minutes) =>
    [
      "🔐 <b>Кабинет партнёра</b>",
      "",
      "Там короткие ссылки под каждый канал, переходы по дням, ваши клиенты по этапам — от заявки до оплаты, баланс и заявка на выплату.",
      "",
      `Кнопка ниже входит одним нажатием. Она одноразовая и живёт ${minutes} минут — не пересылайте её. Нужна новая — /cabinet.`,
    ].join("\n"),

  cabinetButton: "Открыть кабинет",

  contractSigned: (who, amount, share, percent, model) =>
    [
      `📝 С клиентом ${who} подписан договор${amount ? ` на <b>${usd(amount)}</b>` : ""}.`,
      share
        ? `Ваша доля — <b>${usd(share)}</b> (${percent} % ${model === "turnover" ? "с оборота" : "от чистой прибыли"}). Она начислится, когда клиент оплатит проект целиком.`
        : `Ваша доля — ${percent} % от чистой прибыли проекта: сумма появится в кабинете, когда студия внесёт себестоимость, и начислится после полной оплаты.`,
      "Этапы и сумма — в кабинете: /cabinet.",
    ].join("\n"),
};

const en: PartnerCopy = {
  intro: (link, botLink) =>
    [
      "🤝 <b>DevUz Studio partner program</b>",
      "",
      "Bring clients and earn a percentage of every project they order, with no limit on the number of clients. Two models to choose from: of the project's net profit or of turnover (the contract amount). The bigger the project, the higher the rate:",
      ...tiers((n) => `up to ${n}`, (n) => `over ${n}`, "of profit", "of turnover"),
      `You choose the model in your dashboard and can change it once every ${MODEL_SWITCH_DAYS} days; a client keeps the model that was active on the day of their request.`,
      "",
      "<b>Your website link:</b>",
      link,
      "",
      "<b>Your link to this bot:</b>",
      botLink,
      "",
      `A client who opens your link and leaves a request on the site or writes here within ${REF_TTL_DAYS} days is yours. Once their project is paid in full, the accrual shows up here — /ref. Withdrawals open on the first business day of each month — /payout.`,
      "",
      "A separate link per channel: <code>/ref CODE label</code> — e.g. <code>/ref TG-GROUP Telegram group</code>. That way you see where people come from.",
    ].join("\n"),

  stats: (s) =>
    [
      "<b>Your balance</b>",
      `Earned: <b>${usd(s.earned)}</b>`,
      `Frozen (waiting for full payment): ${usd(s.frozen)}`,
      `Paid out: ${usd(s.paid)}`,
      `Available: <b>${usd(s.available)}</b>`,
      "",
      `Clients via your links: ${s.leads} · paid projects: ${s.paidProjects} · rate: ` +
        (s.override !== null
          ? `${s.override}% (personal)`
          : s.model === "turnover"
            ? `of turnover, ${PARTNER_TIERS[0].turnover}–${PARTNER_TIERS[PARTNER_TIERS.length - 1].turnover}% by project amount`
            : `of net profit, ${PARTNER_TIERS[0].profit}–${PARTNER_TIERS[PARTNER_TIERS.length - 1].profit}% by project amount`),
      "",
      "<b>Links</b>",
      ...s.links.map(
        (l) => `• <b>${l.code}</b>${l.label ? ` — ${l.label}` : ""} · clicks ${l.clicks} · requests ${l.leads}\n${l.url}`,
      ),
      "",
      `Withdraw: /payout — from ${usd(MIN_PAYOUT_USD)}, from the first business day of the month. New link: <code>/ref CODE label</code>.`,
      "It's easier on the website — links per channel, a chart and clients by stage: /cabinet.",
    ].join("\n"),

  linkCreated: (code, url) => `Link <b>${code}</b> created:\n${url}`,

  linkFailed: (reason) =>
    ({
      offline: "The database is unavailable right now — try again in a minute.",
      invalid: "Code: 3–24 characters, Latin letters, digits, dash or underscore.",
      reserved: "This code is reserved — pick another one.",
      taken: "This code is already taken — pick another one.",
      limit: "You have a lot of links already — ask the owner to remove unused ones.",
      failed: "Couldn't create the link. Try again.",
    })[reason],

  payoutRequested: (amount) =>
    `Payout request for <b>${usd(amount)}</b> accepted. The studio owner will send the money and you'll get a message here.`,

  payoutFailed: (reason, ctx) =>
    ({
      offline: "The database is unavailable right now — try again in a minute.",
      window: `Withdrawals open on ${ctx.opens} — the first business day of the month, after payments are reconciled. Available now: ${usd(ctx.available)}.`,
      requisites: `Tell us where to pay: <code>/payout USDT TRC-20 address</code> or <code>/payout bank details in words</code>. We'll remember it for next time.`,
      pending: "One request is already waiting for a decision — a second one can't be filed on top of it.",
      min: `Available ${usd(ctx.available)}, the minimum payout is ${usd(MIN_PAYOUT_USD)}. Wait for the next payment.`,
      failed: "Couldn't file the request. Try again.",
    })[reason],

  paid: (amount, note) => `✅ Payout of <b>${usd(amount)}</b> sent.${note ? `\n${note}` : ""}`,

  rejected: (amount, note) =>
    `The request for ${usd(amount)} was declined and the amount is back in your available balance.${note ? `\nReason: ${note}` : ""} Write to the owner if this is a mistake.`,

  unavailable: "The partner program is unavailable right now — try again in a minute.",

  cabinet: (minutes) =>
    [
      "🔐 <b>Partner dashboard</b>",
      "",
      "Short links for every channel, clicks by day, your clients by stage — from request to payment, your balance and payout requests.",
      "",
      `The button below signs you in with one tap. It works once and expires in ${minutes} minutes — don't forward it. Need a new one — /cabinet.`,
    ].join("\n"),

  cabinetButton: "Open dashboard",

  contractSigned: (who, amount, share, percent, model) =>
    [
      `📝 The contract with your client ${who} is signed${amount ? ` for <b>${usd(amount)}</b>` : ""}.`,
      share
        ? `Your share is <b>${usd(share)}</b> (${percent}% of ${model === "turnover" ? "turnover" : "net profit"}). It is credited once the client pays the project in full.`
        : `Your share is ${percent}% of the project's net profit: the amount appears in your dashboard once the studio enters its costs, and is credited after full payment.`,
      "Stages and amounts are in your dashboard: /cabinet.",
    ].join("\n"),
};

export function partnerCopy(locale: Locale): PartnerCopy {
  return locale === "en" || locale === "zh" ? en : ru;
}
