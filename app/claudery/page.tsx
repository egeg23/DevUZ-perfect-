import type { Metadata } from "next";

import { buyStart } from "@/lib/claudery/flow";
import { PRICE_MARK, rub } from "@/lib/claudery/scenario";
import { OFFER_PATH } from "@/lib/claudery/store";

import { Footer, PRIVACY_PATH, TERMS_PATH, sellerData } from "./docs";
import css from "./shop.module.css";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Claudery — подписки на нейросети" };

/** Цвет и знак карточки по названию подписки: свой у Claude и ChatGPT, общий у остальных. */
function look(title: string): { acc: string; mark: string } {
  if (/deepseek/i.test(title)) return { acc: "#4d6bfe", mark: "D" };
  if (/claude/i.test(title)) return { acc: "#d97757", mark: "C" };
  if (/gpt|openai/i.test(title)) return { acc: "#10a37f", mark: "G" };
  if (/gemini/i.test(title)) return { acc: "#4f7cf7", mark: "G" };
  if (/midjourney/i.test(title)) return { acc: "#3a3a46", mark: "M" };
  return { acc: "#6e56cf", mark: "AI" };
}

/**
 * Витрина Claudery. Владелец, 18.11.2026: Platega согласует оплату, «если это
 * просто продажа подписок на нейросети… главное чтобы там не было ваших
 * услуг», и смотрит сайт. 19.11.2026: «Надо добавить кнопки оплаты на
 * https://devuz.studio/claudery для каждой нейронки. Оформи красиво
 * страницу». Кнопка «Купить» ведёт в бот (`?start=buy<номер>`): бот сразу
 * заводит заказ на эту подписку и даёт ссылку на страницу заказа, где оплата.
 * Так заказ привязан к Telegram, и доступ после оплаты бот пришлёт сам.
 * Товары, цены и все слова страницы — из конструктора бота («7. Витрина на
 * сайте», `Setup.shop`), продавец — из хранилища.
 */
export default async function ClauderyShop() {
  const seller = await sellerData();
  const products = seller.setup.products;
  const bot = seller.bot ? `https://t.me/${seller.bot}` : null;
  const cheapest = Math.min(...products.map((p) => p.price));
  const t = seller.setup.shop;

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
            {t.kicker ? <p className={css.kicker}>{t.kicker}</p> : null}
            <h1 className={css.title}>
              {t.title} {t.accent ? <span>{t.accent}</span> : null}
            </h1>
            {t.lead ? <p className={css.lead}>{t.lead}</p> : null}
            {t.pills.length ? (
              <ul className={css.pills}>
                {t.pills.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            ) : null}
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
                  {t.perks.length ? (
                    <ul className={css.perks}>
                      {t.perks.map((k) => (
                        <li key={k}>{k}</li>
                      ))}
                    </ul>
                  ) : null}
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

        {t.steps.length ? (
          <section className={css.section}>
            <h2 className={css.h2}>Как купить</h2>
            <ol className={css.steps}>
              {t.steps.map((c) => (
                <li key={c.t}>
                  <b>{c.t}</b>
                  <span>{c.d}</span>
                </li>
              ))}
            </ol>
          </section>
        ) : null}

        <section className={css.section}>
          <h2 className={css.h2}>Почему с нами спокойно</h2>
          {t.trust.length ? (
            <div className={css.trust}>
              {t.trust.map((c) => (
                <div key={c.t}>
                  <b>{c.t}</b>
                  <span>{c.d}</span>
                </div>
              ))}
            </div>
          ) : null}
          <p className={css.docs}>
            <a href={OFFER_PATH}>Оферта</a> · <a href={TERMS_PATH}>Пользовательское соглашение</a> ·{" "}
            <a href={PRIVACY_PATH}>Политика конфиденциальности</a>
          </p>
        </section>

        {t.faq.length ? (
          <section className={`${css.section} ${css.faq}`}>
            <h2 className={css.h2}>Вопросы</h2>
            {t.faq.map((f) => (
              <details key={f.q}>
                <summary>{f.q}</summary>
                <p>{f.a}</p>
              </details>
            ))}
          </section>
        ) : null}

        {bot ? (
          <section className={css.section}>
            <div className={css.cta}>
              <h2 className={css.h2} style={{ margin: 0 }}>
                {t.ctaTitle.replaceAll(PRICE_MARK, rub(cheapest))}
              </h2>
              {t.ctaText ? <p>{t.ctaText}</p> : null}
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
