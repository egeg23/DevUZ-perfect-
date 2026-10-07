import type { Locale } from "@/lib/i18n";
import { MIN_PAYOUT_USD, MODEL_SWITCH_DAYS, PARTNER_TIERS, REF_TTL_DAYS, type PayoutModel } from "@/lib/partners/rules";
import type { LinkFailure, PayoutFailure } from "@/lib/partners/store";

/**
 * Тексты партнёрской программы в боте.
 *
 * Четыре языка, а не шесть: партнёр — это переписка, и на языке, на котором
 * студия не ответит на встречный вопрос, программу не вести. Узбекский
 * получает русский, китайский — английский. Украинский и польский — свои
 * (владелец, 29.09): человек с Telegram на этих языках получает программу
 * на своём языке, а встречные вопросы берёт AI-менеджер, который на них
 * говорит.
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
  /** Пишет сотрудник студии: программа не для него (владелец, 07.10.2026). */
  staffOnly: string;
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
  staffOnly:
    "Вы в команде DevUz — партнёрская программа для сотрудников закрыта. Клиенты, которых вы приводите, и ваши проекты считаются в панели, а не здесь.",

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
  staffOnly:
    "You are on the DevUz team — the partner program is not open to staff. The clients you bring and your projects count in the panel, not here.",

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

const uk: PartnerCopy = {
  intro: (link, botLink) =>
    [
      "🤝 <b>Партнерська програма DevUz Studio</b>",
      "",
      "Приводьте клієнтів — отримуйте відсоток із кожного їхнього проєкту, без обмежень за кількістю клієнтів. Дві моделі на вибір: від чистого прибутку проєкту або з обороту (суми договору). Що більший проєкт, то вищий відсоток:",
      ...tiers((n) => `до ${n}`, (n) => `понад ${n}`, "прибутку", "обороту"),
      `Модель обирають у кабінеті, змінити її можна не частіше ніж раз на ${MODEL_SWITCH_DAYS} днів; за клієнтом закріплюється та, що діяла в день його заявки.`,
      "",
      "<b>Ваше посилання на сайт:</b>",
      link,
      "",
      "<b>Посилання на цей бот:</b>",
      botLink,
      "",
      `Клієнт приходить за посиланням і протягом ${REF_TTL_DAYS} днів залишає заявку на сайті або пише сюди — він ваш. Коли його проєкт оплачено повністю, нарахування з'явиться тут — команда /ref. Виведення — з першого робочого дня місяця, команда /payout.`,
      "",
      "Окреме посилання під кожен канал: <code>/ref КОД мітка</code> — наприклад, <code>/ref TG-GROUP Телеграм-група</code>. Так видно, звідки приходять люди.",
    ].join("\n"),

  stats: (s) =>
    [
      "<b>Ваш баланс</b>",
      `Зароблено: <b>${usd(s.earned)}</b>`,
      `Заморожено (чекає на повну оплату): ${usd(s.frozen)}`,
      `Виплачено: ${usd(s.paid)}`,
      `Доступно до виведення: <b>${usd(s.available)}</b>`,
      "",
      `Клієнтів за вашими посиланнями: ${s.leads} · оплачених проєктів: ${s.paidProjects} · ставка: ` +
        (s.override !== null
          ? `${s.override} % (персональна)`
          : s.model === "turnover"
            ? `з обороту, ${PARTNER_TIERS[0].turnover}–${PARTNER_TIERS[PARTNER_TIERS.length - 1].turnover} % залежно від суми проєкту`
            : `від чистого прибутку, ${PARTNER_TIERS[0].profit}–${PARTNER_TIERS[PARTNER_TIERS.length - 1].profit} % залежно від суми проєкту`),
      "",
      "<b>Посилання</b>",
      ...s.links.map(
        (l) => `• <b>${l.code}</b>${l.label ? ` — ${l.label}` : ""} · переходів ${l.clicks} · заявок ${l.leads}\n${l.url}`,
      ),
      "",
      `Виведення: /payout — від ${usd(MIN_PAYOUT_USD)}, з першого робочого дня місяця. Нове посилання: <code>/ref КОД мітка</code>.`,
      "Зручніше на сайті — посилання під кожен канал, графік і клієнти за етапами: /cabinet.",
    ].join("\n"),

  linkCreated: (code, url) => `Посилання <b>${code}</b> створено:\n${url}`,

  linkFailed: (reason) =>
    ({
      offline: "База зараз недоступна — спробуйте за хвилину.",
      invalid: "Код: 3–24 символи, латиниця, цифри, дефіс або підкреслення.",
      reserved: "Цей код зарезервовано — оберіть інший.",
      taken: "Такий код уже зайнятий — придумайте інший.",
      limit: "Посилань уже забагато — видаліть невикористовувані через власника.",
      failed: "Не вдалося створити посилання. Спробуйте ще раз.",
    })[reason],

  payoutRequested: (amount) =>
    `Заявку на виплату <b>${usd(amount)}</b> прийнято. Власник студії надішле гроші, і ви отримаєте повідомлення тут.`,

  payoutFailed: (reason, ctx) =>
    ({
      offline: "База зараз недоступна — спробуйте за хвилину.",
      window: `Виведення відкриється ${ctx.opens} — з першого робочого дня місяця, після звірки платежів. Доступно зараз: ${usd(ctx.available)}.`,
      requisites: `Напишіть, куди платити: <code>/payout адреса USDT TRC-20</code> або <code>/payout реквізити словами</code>. Запам'ятаємо для наступних виплат.`,
      pending: "Одна заявка вже чекає на рішення — другу поверх неї подати не можна.",
      min: `Доступно ${usd(ctx.available)}, а мінімальна виплата — ${usd(MIN_PAYOUT_USD)}. Зачекайте на наступну оплату.`,
      failed: "Не вдалося подати заявку. Спробуйте ще раз.",
    })[reason],

  paid: (amount, note) => `✅ Виплату <b>${usd(amount)}</b> надіслано.${note ? `\n${note}` : ""}`,

  rejected: (amount, note) =>
    `Заявку на ${usd(amount)} відхилено, сума повернулася в доступне.${note ? `\nПричина: ${note}` : ""} Напишіть власникові, якщо це помилка.`,

  unavailable: "Партнерська програма зараз недоступна — спробуйте за хвилину.",
  staffOnly:
    "Ви в команді DevUz — партнерська програма для співробітників закрита. Клієнти, яких ви приводите, і ваші проєкти рахуються в панелі, а не тут.",

  cabinet: (minutes) =>
    [
      "🔐 <b>Кабінет партнера</b>",
      "",
      "Там короткі посилання під кожен канал, переходи за днями, ваші клієнти за етапами — від заявки до оплати, баланс і заявка на виплату.",
      "",
      `Кнопка нижче відкриває кабінет одним натисканням. Вона одноразова й діє ${minutes} хв — не пересилайте її. Потрібна нова — /cabinet.`,
    ].join("\n"),

  cabinetButton: "Відкрити кабінет",

  contractSigned: (who, amount, share, percent, model) =>
    [
      `📝 З клієнтом ${who} підписано договір${amount ? ` на <b>${usd(amount)}</b>` : ""}.`,
      share
        ? `Ваша частка — <b>${usd(share)}</b> (${percent} % ${model === "turnover" ? "з обороту" : "від чистого прибутку"}). Її буде нараховано, коли клієнт оплатить проєкт повністю.`
        : `Ваша частка — ${percent} % від чистого прибутку проєкту: сума з'явиться в кабінеті, коли студія внесе собівартість, і нарахується після повної оплати.`,
      "Етапи й сума — у кабінеті: /cabinet.",
    ].join("\n"),
};

const pl: PartnerCopy = {
  intro: (link, botLink) =>
    [
      "🤝 <b>Program partnerski DevUz Studio</b>",
      "",
      "Polecasz klientów — dostajesz procent od każdego ich projektu, bez limitu liczby klientów. Dwa modele do wyboru: od zysku netto z projektu lub od obrotu (wartości umowy). Im większy projekt, tym wyższy procent:",
      ...tiers((n) => `do ${n}`, (n) => `powyżej ${n}`, "zysku", "obrotu"),
      `Model wybierasz w panelu i możesz go zmieniać nie częściej niż raz na ${MODEL_SWITCH_DAYS} dni; do klienta przypisany jest ten, który obowiązywał w dniu jego zapytania.`,
      "",
      "<b>Twój link do strony:</b>",
      link,
      "",
      "<b>Link do tego bota:</b>",
      botLink,
      "",
      `Klient przychodzi z linku i w ciągu ${REF_TTL_DAYS} dni zostawia zapytanie na stronie lub pisze tutaj — jest Twój. Gdy jego projekt zostanie opłacony w całości, naliczenie pojawi się tutaj — komenda /ref. Wypłata — od pierwszego dnia roboczego miesiąca, komenda /payout.`,
      "",
      "Osobny link dla każdego kanału: <code>/ref KOD etykieta</code> — na przykład <code>/ref TG-GROUP Grupa na Telegramie</code>. Dzięki temu widać, skąd przychodzą ludzie.",
    ].join("\n"),

  stats: (s) =>
    [
      "<b>Twoje saldo</b>",
      `Zarobiono: <b>${usd(s.earned)}</b>`,
      `Zamrożone (czeka na pełną płatność): ${usd(s.frozen)}`,
      `Wypłacono: ${usd(s.paid)}`,
      `Dostępne do wypłaty: <b>${usd(s.available)}</b>`,
      "",
      `Klienci z Twoich linków: ${s.leads} · opłacone projekty: ${s.paidProjects} · stawka: ` +
        (s.override !== null
          ? `${s.override} % (indywidualna)`
          : s.model === "turnover"
            ? `od obrotu, ${PARTNER_TIERS[0].turnover}–${PARTNER_TIERS[PARTNER_TIERS.length - 1].turnover} % zależnie od wartości projektu`
            : `od zysku netto, ${PARTNER_TIERS[0].profit}–${PARTNER_TIERS[PARTNER_TIERS.length - 1].profit} % zależnie od wartości projektu`),
      "",
      "<b>Linki</b>",
      ...s.links.map(
        (l) => `• <b>${l.code}</b>${l.label ? ` — ${l.label}` : ""} · wejścia ${l.clicks} · zapytania ${l.leads}\n${l.url}`,
      ),
      "",
      `Wypłata: /payout — od ${usd(MIN_PAYOUT_USD)}, od pierwszego dnia roboczego miesiąca. Nowy link: <code>/ref KOD etykieta</code>.`,
      "Wygodniej na stronie — linki dla każdego kanału, wykres i klienci według etapów: /cabinet.",
    ].join("\n"),

  linkCreated: (code, url) => `Link <b>${code}</b> utworzony:\n${url}`,

  linkFailed: (reason) =>
    ({
      offline: "Baza jest chwilowo niedostępna — spróbuj za minutę.",
      invalid: "Kod: 3–24 znaki, litery łacińskie, cyfry, myślnik lub podkreślnik.",
      reserved: "Ten kod jest zarezerwowany — wybierz inny.",
      taken: "Ten kod jest już zajęty — wymyśl inny.",
      limit: "Masz już dużo linków — nieużywane usuniesz przez właściciela.",
      failed: "Nie udało się utworzyć linku. Spróbuj jeszcze raz.",
    })[reason],

  payoutRequested: (amount) =>
    `Zlecenie wypłaty <b>${usd(amount)}</b> przyjęte. Właściciel studia wyśle pieniądze, a Ty dostaniesz tutaj wiadomość.`,

  payoutFailed: (reason, ctx) =>
    ({
      offline: "Baza jest chwilowo niedostępna — spróbuj za minutę.",
      window: `Wypłata będzie dostępna ${ctx.opens} — od pierwszego dnia roboczego miesiąca, po uzgodnieniu płatności. Dostępne teraz: ${usd(ctx.available)}.`,
      requisites: `Napisz, gdzie wypłacić: <code>/payout adres USDT TRC-20</code> lub <code>/payout dane do przelewu słowami</code>. Zapamiętamy je na kolejne wypłaty.`,
      pending: "Jedno zlecenie już czeka na decyzję — drugiego nie można złożyć, dopóki ono trwa.",
      min: `Dostępne ${usd(ctx.available)}, a minimalna wypłata to ${usd(MIN_PAYOUT_USD)}. Poczekaj na kolejną płatność.`,
      failed: "Nie udało się złożyć zlecenia. Spróbuj jeszcze raz.",
    })[reason],

  paid: (amount, note) => `✅ Wypłata <b>${usd(amount)}</b> wysłana.${note ? `\n${note}` : ""}`,

  rejected: (amount, note) =>
    `Zlecenie na ${usd(amount)} odrzucone, kwota wróciła do dostępnych środków.${note ? `\nPowód: ${note}` : ""} Napisz do właściciela, jeśli to pomyłka.`,

  unavailable: "Program partnerski jest chwilowo niedostępny — spróbuj za minutę.",
  staffOnly:
    "Jesteś w zespole DevUz — program partnerski nie jest dostępny dla pracowników. Klienci, których przyprowadzasz, i twoje projekty liczą się w panelu, nie tutaj.",

  cabinet: (minutes) =>
    [
      "🔐 <b>Panel partnera</b>",
      "",
      "Znajdziesz tam krótkie linki dla każdego kanału, wejścia dzień po dniu, swoich klientów według etapów — od zapytania do płatności, saldo i zlecenie wypłaty.",
      "",
      `Przycisk poniżej loguje jednym kliknięciem. Jest jednorazowy i ważny przez ${minutes} minut — nie przekazuj go dalej. Potrzebujesz nowego? /cabinet.`,
    ].join("\n"),

  cabinetButton: "Otwórz panel",

  contractSigned: (who, amount, share, percent, model) =>
    [
      `📝 Umowa z klientem ${who} podpisana${amount ? ` na <b>${usd(amount)}</b>` : ""}.`,
      share
        ? `Twój udział — <b>${usd(share)}</b> (${percent} % ${model === "turnover" ? "od obrotu" : "od zysku netto"}). Zostanie naliczony, gdy klient opłaci cały projekt.`
        : `Twój udział — ${percent} % od zysku netto z projektu: kwota pojawi się w panelu, gdy studio wprowadzi koszty własne, i zostanie naliczona po pełnej płatności.`,
      "Etapy i kwota — w panelu: /cabinet.",
    ].join("\n"),
};

export function partnerCopy(locale: Locale): PartnerCopy {
  if (locale === "uk") return uk;
  if (locale === "pl") return pl;
  return locale === "en" || locale === "zh" ? en : ru;
}
