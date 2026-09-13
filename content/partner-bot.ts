import type { Locale } from "@/lib/i18n";
import {
  MIN_PAYOUT_USD,
  PARTNER_PERCENT,
  PROVEN_MIN_PAID_PROJECTS,
  PROVEN_PERCENT,
} from "@/lib/partners/rules";
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
  proven: boolean;
  percent: number;
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
};

const usd = (n: number) => `${n.toLocaleString("ru-RU")} $`;

const ru: PartnerCopy = {
  intro: (link, botLink) =>
    [
      "🤝 <b>Партнёрская программа DevUz Studio</b>",
      "",
      `Приводите клиентов — получаете <b>${PARTNER_PERCENT} %</b> от чистой прибыли каждого их проекта, без ограничений по числу клиентов. После ${PROVEN_MIN_PAID_PROJECTS} оплаченных проектов ставка — <b>${PROVEN_PERCENT} %</b>.`,
      "",
      "<b>Ваша ссылка на сайт:</b>",
      link,
      "",
      "<b>Ссылка в этот бот:</b>",
      botLink,
      "",
      "Клиент приходит по ссылке, оставляет заявку на сайте или пишет сюда. Когда его проект оплачен целиком, начисление появляется здесь — команда /ref. Вывод — с первого рабочего дня месяца, команда /payout.",
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
      `Клиентов по вашим ссылкам: ${s.leads} · оплаченных проектов: ${s.paidProjects} · ставка: ${s.percent} %` +
        (s.proven ? "" : ` (${PROVEN_PERCENT} % после ${PROVEN_MIN_PAID_PROJECTS} оплаченных)`),
      "",
      "<b>Ссылки</b>",
      ...s.links.map(
        (l) => `• <b>${l.code}</b>${l.label ? ` — ${l.label}` : ""} · переходов ${l.clicks} · заявок ${l.leads}\n${l.url}`,
      ),
      "",
      `Вывод: /payout — от ${usd(MIN_PAYOUT_USD)}, с первого рабочего дня месяца. Новая ссылка: <code>/ref КОД метка</code>.`,
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
};

const en: PartnerCopy = {
  intro: (link, botLink) =>
    [
      "🤝 <b>DevUz Studio partner program</b>",
      "",
      `Bring clients and earn <b>${PARTNER_PERCENT}%</b> of the net profit of every project they order, with no limit on the number of clients. After ${PROVEN_MIN_PAID_PROJECTS} fully paid projects the rate is <b>${PROVEN_PERCENT}%</b>.`,
      "",
      "<b>Your website link:</b>",
      link,
      "",
      "<b>Your link to this bot:</b>",
      botLink,
      "",
      "A client opens your link, leaves a request on the site or writes here. Once their project is paid in full, the accrual shows up here — /ref. Withdrawals open on the first business day of each month — /payout.",
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
      `Clients via your links: ${s.leads} · paid projects: ${s.paidProjects} · rate: ${s.percent}%` +
        (s.proven ? "" : ` (${PROVEN_PERCENT}% after ${PROVEN_MIN_PAID_PROJECTS} paid projects)`),
      "",
      "<b>Links</b>",
      ...s.links.map(
        (l) => `• <b>${l.code}</b>${l.label ? ` — ${l.label}` : ""} · clicks ${l.clicks} · requests ${l.leads}\n${l.url}`,
      ),
      "",
      `Withdraw: /payout — from ${usd(MIN_PAYOUT_USD)}, from the first business day of the month. New link: <code>/ref CODE label</code>.`,
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
};

export function partnerCopy(locale: Locale): PartnerCopy {
  return locale === "en" || locale === "zh" ? en : ru;
}
