import type { Metadata } from "next";

import { buyStart } from "@/lib/claudery/flow";
import { rub } from "@/lib/claudery/scenario";
import { OFFER_PATH } from "@/lib/claudery/store";

import { Footer, PRIVACY_PATH, TERMS_PATH, sellerData } from "./docs";
import css from "./shop.module.css";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Claudery — подписки на нейросети" };

/** Цвет и знак карточки по названию подписки: свой у Claude и ChatGPT, общий у остальных. */
function look(title: string): { acc: string; mark: string } {
  if (/claude/i.test(title)) return { acc: "#d97757", mark: "C" };
  if (/gpt|openai/i.test(title)) return { acc: "#10a37f", mark: "G" };
  if (/gemini/i.test(title)) return { acc: "#4f7cf7", mark: "G" };
  if (/midjourney/i.test(title)) return { acc: "#3a3a46", mark: "M" };
  return { acc: "#6e56cf", mark: "AI" };
}

const FAQ: { q: string; a: string }[] = [
  {
    q: "Как я получу доступ?",
    a: "После того как платёжная система подтвердит оплату, бот Claudery пришлёт вам данные доступа и поможет подключиться. Подключение и ответы на вопросы по подписке бесплатно.",
  },
  { q: "Сколько ждать?", a: "Доступ передаём с 06:00 до 19:00 по московскому времени. Обычно в течение часа после оплаты." },
  { q: "Что если доступ не передали?", a: "Вернём оплату полностью. Напишите в поддержку, контакты внизу страницы." },
  { q: "Как оплатить?", a: "По СБП через платёжный сервис Platega, на странице заказа. Данные карты мы не видим и не храним." },
];

/**
 * Витрина Claudery. Владелец, 18.11.2026: Platega согласует оплату, «если это
 * просто продажа подписок на нейросети… главное чтобы там не было ваших
 * услуг», и смотрит сайт. 19.11.2026: «Надо добавить кнопки оплаты на
 * https://devuz.studio/claudery для каждой нейронки. Оформи красиво
 * страницу». Кнопка «Купить» ведёт в бот (`?start=buy<номер>`): бот сразу
 * заводит заказ на эту подписку и даёт ссылку на страницу заказа, где оплата.
 * Так заказ привязан к Telegram, и доступ после оплаты бот пришлёт сам.
 * Товары и цены — из настроек бота, продавец — из хранилища.
 */
export default async function ClauderyShop() {
  const seller = await sellerData();
  const products = seller.setup.products;
  const bot = seller.bot ? `https://t.me/${seller.bot}` : null;
  const cheapest = Math.min(...products.map((p) => p.price));

  return (
    <div className={css.page}>
      <header className={css.hero}>
        <div className={css.wrap}>
          <div className={css.top}>
            <div className={css.brand}>
              <span className={css.mark} aria-hidden>
                ✦
              </span>
              Claudery
            </div>
            {bot ? (
              <a className={css.topLink} href={bot}>
                Бот в Telegram
              </a>
            ) : null}
          </div>
          <div className={css.heroText}>
            <p className={css.kicker}>Подписки на нейросети</p>
            <h1 className={css.title}>
              Нужная нейросеть, <span>с готовым доступом</span>
            </h1>
            <p className={css.lead}>
              Выберите подписку, оплатите по СБП и получите доступ в Telegram. Подключение и ответы на вопросы бесплатно.
            </p>
            <ul className={css.pills}>
              <li>Оплата по СБП</li>
              <li>Доступ в Telegram</li>
              <li>Возврат, если доступ не передан</li>
            </ul>
          </div>
        </div>
      </header>

      <main>
        <section className={css.catalog} aria-label="Каталог">
          <div className={css.grid}>
            {products.map((p, i) => {
              const l = look(p.title);
              return (
                <article key={i} className={css.card} style={{ ["--acc" as string]: l.acc }}>
                  <div className={css.cardHead}>
                    <span className={css.logo} aria-hidden>
                      {l.mark}
                    </span>
                    <h2 className={css.name}>{p.title}</h2>
                  </div>
                  {p.note ? <p className={css.note}>{p.note}</p> : <p className={css.note} />}
                  <ul className={css.perks}>
                    <li>Доступ в Telegram после оплаты</li>
                    <li>Подключение бесплатно</li>
                  </ul>
                  <p className={css.price}>{rub(p.price)}</p>
                  <a
                    className={css.buy}
                    href={bot ? `${bot}?start=${buyStart(i)}` : undefined}
                    aria-disabled={bot ? undefined : true}
                    aria-label={`Купить: ${p.title}, ${rub(p.price)}`}
                  >
                    Купить
                  </a>
                </article>
              );
            })}
          </div>
        </section>

        <section className={css.section}>
          <h2 className={css.h2}>Как купить</h2>
          <ol className={css.steps}>
            <li>
              <b>Нажмите «Купить»</b>
              <span>Откроется бот Claudery в Telegram, он сразу соберёт заказ на выбранную подписку.</span>
            </li>
            <li>
              <b>Оплатите по СБП</b>
              <span>Бот пришлёт ссылку на страницу заказа. Оплата через Platega, в пару нажатий.</span>
            </li>
            <li>
              <b>Получите доступ</b>
              <span>Как только оплата подтвердится, бот пришлёт данные доступа и поможет подключиться.</span>
            </li>
          </ol>
        </section>

        <section className={css.section}>
          <h2 className={css.h2}>Почему с нами спокойно</h2>
          <div className={css.trust}>
            <div>
              <b>Оплата через Platega</b>
              <span>По СБП, без ввода данных карты на нашем сайте.</span>
            </div>
            <div>
              <b>Возврат полностью</b>
              <span>
                Если доступ не передан. Подробности в <a href={OFFER_PATH}>оферте</a>.
              </span>
            </div>
            <div>
              <b>Документы открыто</b>
              <span>
                <a href={TERMS_PATH}>Пользовательское соглашение</a> и <a href={PRIVACY_PATH}>политика конфиденциальности</a>.
              </span>
            </div>
          </div>
        </section>

        <section className={`${css.section} ${css.faq}`}>
          <h2 className={css.h2}>Вопросы</h2>
          {FAQ.map((f) => (
            <details key={f.q}>
              <summary>{f.q}</summary>
              <p>{f.a}</p>
            </details>
          ))}
        </section>

        {bot ? (
          <section className={css.section}>
            <div className={css.cta}>
              <h2 className={css.h2} style={{ margin: 0 }}>
                Подписка от {rub(cheapest)}
              </h2>
              <p>Откройте бота и выберите нейросеть: заказ соберётся за минуту.</p>
              <a className={css.buy} href={bot}>
                Открыть бота
              </a>
            </div>
          </section>
        ) : null}
      </main>

      <div className={css.foot}>
        <Footer s={seller} />
      </div>
    </div>
  );
}
