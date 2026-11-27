// Два КП для ASAPHARM Academy (asapharmacademy.uz) на одних цифрах:
// разовая оплата и подписка. Владелец, 27.11.2026: «2 коммерческих
// предложения для проекта asapharm… Вариант с разовой оплатой… Вариант с
// оплатой по подписке… По сайту думаю ценник со всеми допами для онлайн
// курсов, защитой от записи экрана и скачивания должна быть до 2500$,
// остальное посчитай исходя из нашего прайса по маркетингу и средней
// стоимости разработки по проектам».
//
// Откуда числа:
//   вся разработка 3 600 $ одной суммой — слово владельца, 27.11.2026:
//     «давай 3600$ цену за сайт со всеми допами для школы курсов,
//     личными кабинетами курсантов, онлайн трансляций» (до этого — 2 500 $;
//     оплаты, ИИ-ассистент, интеграции, защита видео — тоже внутри);
//   ИИ-ассистент в месяц — тариф «Про» ИИ-сотрудника, 2 490 000 сум
//     (lib/ai-staff/plans.ts);
//   маркетинг — content/marketing.ts (прайс крупного агентства минус 10%),
//     по курсу USD_RATE = 11 850 (content/company.ts);
//   −5% при оплате трёх месяцев вперёд — PREPAY_DISCOUNT, комиссия 10% с
//     бюджета и НДС 12% систем — AD_COMMISSION, AD_VAT.
//
// Пересобрать:
//   node kp/asapharm/build.mjs
//   node scripts/kp-pdf.mjs kp/asapharm-razovo.html kp/asapharm-razovo.pdf
//   node scripts/kp-pdf.mjs kp/asapharm-podpiska.html kp/asapharm-podpiska.pdf

import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";

const RATE = 11_850;
const usd = (uzs) => Math.round(uzs / RATE);

const DEV = [
  { t: "Сайт школы курсов", d: "На русском и узбекском по макету со всеми допами: запись на поток, подбор курса, «Путь досье», вебинары, сертификаты с проверкой по номеру, отзывы. Панель: заявки, курсанты, курсы, потоки, роли и история действий" },
  { t: "Личный кабинет курсанта", d: "Свои курсы, расписание потока, видеоуроки, материалы и тесты, прогресс по модулям, записи прошедших занятий, сертификат после окончания. Вход по телефону, без паролей" },
  { t: "Онлайн-трансляции", d: "Живые занятия прямо в кабинете: видео преподавателя, чат и вопросы курсантов. Смотрят только оплатившие, запись сама ложится в кабинет. Офлайн-потоки — с расписанием и отметкой посещения" },
  { t: "Оплата всеми способами", d: "Payme, Click, Uzum Bank, карты Uzcard, Humo и Visa через них. Оплата сразу или частями, промокоды. Оплатил — доступ к курсу открывается сам, вам приходит уведомление" },
  { t: "ИИ-ассистент продаж", d: "Знает ваши курсы, цены и даты. Отвечает круглосуточно в Telegram, Instagram Direct и на сайте на русском и узбекском, подбирает курс, отвечает на возражения, присылает ссылку на оплату и видит, что оплата прошла. Сложный вопрос передаёт менеджеру с перепиской" },
  { t: "Интеграции", d: "CRM (amoCRM или Bitrix24), заявки и оплаты в Telegram, Яндекс Метрика и Google Analytics, пиксели Meta и TikTok, цели для рекламы, Zoom или Google Meet запасным путём для занятий" },
];
const DEV_SUM = 3600; // всё вместе, по слову владельца

const TECH = [
  { t: "Работа ИИ-ассистента", d: "до 1 500 диалогов в месяц, три канала, старшая модель", p: usd(2_490_000) },
  { t: "Техподдержка платформы", d: "сервер, резервные копии, обновления, правки, до 12 часов работ в месяц", p: 250 },
];
const TECH_SUM = TECH.reduce((s, x) => s + x.p, 0);

const MKT = [
  { t: "Контент и соцсети", d: "контент-стратегия, Instagram, TikTok и YouTube: 4 съёмки преподавателей, 8 роликов, 4 поста и 30 сторис в месяц, ролики и картинки нейросетями, тексты на русском и узбекском", m: usd(23_256_000), f: usd(35_856_000) },
  { t: "Таргет в Instagram и Facebook", d: "медиаплан, 4 креатива в месяц, ретаргетинг, заявки сразу в CRM", m: usd(7_200_000), f: usd(9_000_000), ads: true },
  { t: "iMe Ads и реклама в Telegram", d: "фармацевтические и медицинские каналы, креативы, ведение", m: usd(2_970_000), f: usd(4_410_000), ads: true },
  { t: "Google Ads и Яндекс Директ", d: "контекстная реклама по запросам «курсы регистрации лекарств», «фармаконадзор» и похожим, ведение и оптимизация", m: usd(9_315_000), f: usd(12_195_000), ads: true },
  { t: "Маркетинг-сопровождение", d: "все каналы одним планом, планёрка раз в неделю, отчёт: заявки, цена заявки, записи на курс", m: usd(9_000_000), f: usd(9_000_000) },
];
const MKT_M = MKT.reduce((s, x) => s + x.m, 0);
const MKT_F = MKT.reduce((s, x) => s + x.f, 0);

const PREPAY = 0.05;
const AD_START = 500; // на канал
const AD_CH = MKT.filter((x) => x.ads).length;
const AD_BUDGET = AD_START * AD_CH;
const AD_VAT = Math.round(AD_BUDGET * 0.12);
const AD_FEE = Math.round(AD_BUDGET * 0.1);

// Разработка и маркетинг — отдельными счетами (владелец, 27.11.2026:
// «Раздели маркетинг и разработку»): у каждой части своя сумма и свои
// условия, клиент может взять одну без другой.
// Разово: разработка одним платежом; маркетинг — три месяца вперёд минус 5%.
const MKT_Q = MKT_F + MKT_M * 2;
const MKT_DISC = Math.round(MKT_Q * PREPAY);
const MKT_ONE = MKT_Q - MKT_DISC;

// Подписка: разработка частями за 12 месяцев +15%, маркетинг помесячно.
const MONTHS = 12;
const DEV_SUB = Math.ceil((DEV_SUM * 1.15) / MONTHS);
const DEV_SAVE = DEV_SUB * MONTHS - DEV_SUM;

const n = (x) => x.toLocaleString("ru-RU").replace(/ /g, " ");
const $ = (x) => `${n(x)} $`;

const HEAD = (title) => `<!doctype html>
<html lang="ru">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>${title} · DevUz Studio</title>
<link rel="stylesheet" href="letterhead.css">
<!-- Собрано kp/asapharm/build.mjs: правка цифр — там, не здесь. -->
<style>
  td.grp { background: #f6f7f8; font-weight: 600; }
  td small { display: block; color: rgba(0,0,0,.7); font-size: 8.5pt; }
  .who { display: grid; grid-template-columns: 1fr 1fr; gap: 3mm; margin: 2mm 0 3mm; }
  .who div { border: 1px solid rgba(0,0,0,.25); border-radius: 2mm; padding: 2.5mm 3mm; font-size: 9pt; }
  .who b { display: block; font-size: 10pt; }
  .big { margin: 2mm 0 3mm; padding: 3.5mm 4mm; border: 2px solid #000; border-radius: 2mm; }
  .big p { margin: 0 0 1.5mm; } .big p:last-child { margin: 0; }
  .big .sum { font-size: 18pt; font-weight: 600; }
  .soft { margin: 2mm 0 3mm; padding: 3mm 4mm; background: #f4f6f9; border-radius: 2mm; }
  .soft p { margin: 0 0 1.5mm; } .soft p:last-child { margin: 0; }
</style>
</head>
<body>
`;

const INTRO = (title, sub) => `<section class="sheet">
  <h1>${title}</h1>
  <p class="subtitle">${sub}</p>
  <div class="place"><span>г. Ташкент</span><span>27 ноября 2026 г.</span></div>

  <h2>Что делаем</h2>
  <p>Своя платформа академии, где люди узнают о курсе, записываются, платят и учатся офлайн или онлайн, и маркетинг, который приводит на неё слушателей. Две части, у каждой свой ответственный и свой счёт: можно взять обе или одну.</p>
  <div class="who">
    <div><b>Техническая часть · Егор</b>Платформа курсов, видеоуроки и материалы, оплата, ИИ-ассистент продаж, интеграции и работа сервиса.</div>
    <div><b>Маркетинг · Александр</b>Контент-стратегия, Instagram, TikTok и YouTube, реклама в Instagram, iMe Ads, Google Ads и Яндекс Директ, заявки на обучение.</div>
  </div>

  <h2>Техническая часть: разработка</h2>
  <table>
    <tr><th>Что</th><th class="num" style="width:22mm">Цена</th></tr>
    ${DEV.map((x) => `<tr><td><b>${x.t}</b><small>${x.d}</small></td><td class="num">входит</td></tr>`).join("\n    ")}
    <tr><td><b>Вся разработка одной суммой</b>, 6-7 недель</td><td class="num"><b>${$(DEV_SUM)}</b></td></tr>
  </table>

</section>
`;

const MONTHLY = `<section class="sheet">
  <h2 style="margin-top:6mm">Видео нельзя скачать</h2>
  <div class="soft">
    <p>Урок не лежит на сайте файлом: он порезан на короткие куски, каждый зашифрован, ключ выдаётся только слушателю, который вошёл в кабинет, и только на время просмотра. Кнопки «Скачать» нет, программы-загрузчики получают набор зашифрованных кусков.</p>
    <p>Поверх видео идёт водяной знак с именем и телефоном слушателя, он двигается по кадру. Один аккаунт — одно устройство за раз: делиться доступом не выйдет.</p>
    <p>Честно: запись экрана на телефоне не остановит никто. Но на такой записи будет видно, чей это аккаунт, и доступ ему закрывается одной кнопкой.</p>
  </div>

  <h2>Техническая часть: каждый месяц</h2>
  <table>
    <tr><th>Что</th><th class="num" style="width:22mm">В месяц</th></tr>
    ${TECH.map((x) => `<tr><td><b>${x.t}</b><small>${x.d}</small></td><td class="num">${$(x.p)}</td></tr>`).join("\n    ")}
    <tr><td><b>Итого</b></td><td class="num"><b>${$(TECH_SUM)}</b></td></tr>
  </table>

  <h2>Ваши расходы, в цену не входят</h2>
  <table>
    <tr><td>Сервер и хранение видео</td><td class="num">от 30 $ в месяц, зависит от объёма видео</td></tr>
    <tr><td>Домен asapharmacademy.uz</td><td class="num">у вас уже есть</td></tr>
    <tr><td>Payme, Click, Uzum</td><td class="num">комиссия по договору</td></tr>
  </table>
</section>

<section class="sheet">
  <h2 style="margin-top:6mm">Маркетинг</h2>
  <p>Первый месяц дороже: в него входят контент-стратегия, оформление страниц, медиаплан и настройка рекламных кабинетов.</p>
  <table>
    <tr><th>Что</th><th class="num" style="width:22mm">1-й месяц</th><th class="num" style="width:22mm">Дальше</th></tr>
    ${MKT.map((x) => `<tr><td><b>${x.t}</b><small>${x.d}</small></td><td class="num">${$(x.f)}</td><td class="num">${$(x.m)}</td></tr>`).join("\n    ")}
    <tr><td><b>Итого маркетинг</b></td><td class="num"><b>${$(MKT_F)}</b></td><td class="num"><b>${$(MKT_M)}</b></td></tr>
  </table>

  <h2>Рекламный бюджет: отдельно, платите площадкам</h2>
  <table>
    <tr><td>Советуем на старт: ${n(AD_START)} $ на каждый рекламный канал (${AD_CH} канала)</td><td class="num">${$(AD_BUDGET)}</td></tr>
    <tr><td>НДС 12%, который начисляют рекламные системы</td><td class="num">${$(AD_VAT)}</td></tr>
    <tr><td>Наша комиссия 10% от бюджета</td><td class="num">${$(AD_FEE)}</td></tr>
  </table>
  <p>Бюджет можно менять каждый месяц: увеличиваем там, где заявка дешевле.</p>

  <div class="soft"><p><b>Платформа и маркетинг у одной команды:</b> пока идёт договор на маркетинг, исправления платформы и доработки для поиска делаем без доплаты. Все заявки с рекламы, соцсетей и ассистента приходят в одну CRM с пометкой канала: видно, что приносит записи на курс.</p></div>
</section>
`;

const CONTACTS = `<div class="note">Telegram: <b>t.me/Devuz_studio_bot</b> · <b>+998 90 912-05-78</b> (Александр) · <b>+7 923 233-00-37</b> (Егор)</div>`;

const PARTS_CSS = `<style>
  .parts { display: grid; grid-template-columns: 1fr 1fr; gap: 3mm; margin: 2mm 0 3mm; }
  .parts > div { border: 2px solid #000; border-radius: 2mm; padding: 3mm 3.5mm; font-size: 9pt; }
  .parts h3 { margin: 0 0 1.5mm; font-size: 11pt; }
  .parts .sum { display: block; margin: 1mm 0 1.5mm; font-size: 17pt; font-weight: 600; }
  .parts p { margin: 0 0 1.5mm; } .parts p:last-child { margin: 0; }
  .parts table { font-size: 8.5pt; margin: 0 0 2mm; }
</style>`;

const STEPS = `<h2>Как идём</h2>
  <ul>
    <li><b>Разработка:</b> недели 1-7 — сайт, кабинет курсанта, трансляции, оплаты, ассистент, интеграции. Принимаете по частям на тестовом адресе, на 7-8 неделе запуск.</li>
    <li><b>Маркетинг:</b> неделя 1 — бриф, доступы, контент-стратегия, медиаплан, контент с первой недели. Реклама ведёт на платформу с её запуска, до него — на ваш нынешний сайт и в Telegram. Раз в месяц — отчёт по заявкам и записям.</li>
  </ul>`;

const ONE_SHEET = `<section class="sheet">
  ${PARTS_CSS}
  <h2 style="margin-top:6mm">Стоимость при разовой оплате</h2>
  <p>Разработка и маркетинг — отдельными счетами: можно заказать вместе или только одну часть.</p>
  <div class="parts">
    <div>
      <h3>Разработка · Егор</h3>
      <span class="sum">${$(DEV_SUM)}</span>
      <p>Одним платежом: сайт школы со всеми допами, кабинет курсанта, онлайн-трансляции, оплаты, ИИ-ассистент, интеграции. Срок 6-7 недель.</p>
      <p>После запуска — <b>${$(TECH_SUM)} в месяц</b>: ИИ-ассистент ${$(TECH[0].p)} и техподдержка ${$(TECH[1].p)}.</p>
      <p>Без рассрочки дешевле подписки на ${$(DEV_SAVE)}.</p>
    </div>
    <div>
      <h3>Маркетинг · Александр</h3>
      <span class="sum">${$(MKT_ONE)}</span>
      <table>
        <tr><td>Первый месяц</td><td class="num">${$(MKT_F)}</td></tr>
        <tr><td>Второй и третий</td><td class="num">${$(MKT_M * 2)}</td></tr>
        <tr><td>Скидка 5% за три месяца вперёд</td><td class="num">−${$(MKT_DISC)}</td></tr>
      </table>
      <p>С четвёртого месяца — <b>${$(MKT_M)} в месяц</b>. Рекламный бюджет площадкам — отдельно.</p>
    </div>
  </div>

  ${STEPS}

  <h2>Оплата и гарантия</h2>
  <ul>
    <li>Разработка — одним платежом до начала работ, маркетинг — за три месяца вперёд. Счёт в сумах по курсу ЦБ, по оферте <b>devuz.studio/ru/offer</b>. Исполнитель: ИП MAKSIMOV EGOR ANDREEVICH (DevUz Studio).</li>
    <li>30 дней после запуска ошибки исправляем бесплатно, дальше — в рамках техподдержки. Платформа и код ваши с первого дня запуска.</li>
    <li>Рекламные кабинеты, страницы в соцсетях и данные курсантов оформлены на вас.</li>
  </ul>
  ${CONTACTS}
</section>
`;

const SUB_SHEET = `<section class="sheet">
  ${PARTS_CSS}
  <h2 style="margin-top:6mm">Стоимость по подписке</h2>
  <p>Без крупного платежа в начале. Разработка и маркетинг — отдельными счетами: можно заказать вместе или только одну часть.</p>
  <div class="parts">
    <div>
      <h3>Разработка · Егор</h3>
      <span class="sum">${$(DEV_SUB)} в месяц</span>
      <p>12 месяцев: ${$(DEV_SUM)} + 15% за рассрочку. Сайт школы со всеми допами, кабинет курсанта, онлайн-трансляции, оплаты, ИИ-ассистент, интеграции. Срок 6-7 недель.</p>
      <p>С запуска платформы добавляется <b>${$(TECH_SUM)} в месяц</b>: ИИ-ассистент ${$(TECH[0].p)} и техподдержка ${$(TECH[1].p)}.</p>
    </div>
    <div>
      <h3>Маркетинг · Александр</h3>
      <span class="sum">${$(MKT_M)} в месяц</span>
      <p>Первый месяц — ${$(MKT_F)}: в нём стратегия, оформление и настройка рекламы. Платёж в начале каждого месяца, договор от трёх месяцев.</p>
      <p>Рекламный бюджет площадкам — отдельно.</p>
    </div>
  </div>

  ${STEPS}

  <h2>Условия подписки</h2>
  <ul>
    <li>Счёт в сумах по курсу ЦБ, по оферте <b>devuz.studio/ru/offer</b>. Исполнитель: ИП MAKSIMOV EGOR ANDREEVICH (DevUz Studio).</li>
    <li>Разработка: договор на 12 месяцев. Платформа и код переходят вам, когда оплачена вся разработка. Захотите закончить раньше — доплачиваете остаток, и платформа ваша.</li>
    <li>Маркетинг: каналы можно менять раз в месяц, убрать или добавить, сумма пересчитывается.</li>
    <li>Пока идёт подписка, ошибки платформы исправляем бесплатно. Рекламные кабинеты, страницы в соцсетях и данные курсантов оформлены на вас.</li>
  </ul>
  ${CONTACTS}
</section>
`;

const END = `<script src="letterhead.js"></script>
</body>
</html>
`;

const kp = fileURLToPath(new URL("..", import.meta.url));
writeFileSync(join(kp, "asapharm-razovo.html"),
  HEAD("ASAPHARM Academy: разовая оплата") +
  INTRO("Платформа и маркетинг для ASAPHARM Academy", "коммерческое предложение DevUz Studio · вариант 1: разовая оплата") +
  MONTHLY + ONE_SHEET + END);
writeFileSync(join(kp, "asapharm-podpiska.html"),
  HEAD("ASAPHARM Academy: подписка") +
  INTRO("Платформа и маркетинг для ASAPHARM Academy", "коммерческое предложение DevUz Studio · вариант 2: подписка") +
  MONTHLY + SUB_SHEET + END);

console.log({ DEV_SUM, TECH_SUM, MKT_F, MKT_M, AD_BUDGET, AD_VAT, AD_FEE, MKT_ONE, MKT_DISC, DEV_SUB, DEV_SAVE });
