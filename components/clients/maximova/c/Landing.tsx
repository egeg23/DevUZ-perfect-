import { TEACHER } from "@/content/clients/maximova/facts";
import { LANDINGS, type Landing as LandingPage } from "@/content/clients/maximova/pages";
import { landingGraph } from "@/lib/clients/maximova/schema";
import { jsonLd } from "@/lib/clients/maximova/seo";

import { FaqList, PlainList, PriceList, WhereBlock } from "../Blocks";
import { BookingForm } from "../BookingForm";
import { Credit } from "../Credit";
import { Motion } from "../Motion";
import s from "./countries.module.css";

/**
 * Посадочная страница под поисковый запрос — в оформлении «Двух стран».
 *
 * Та же бумага, шрифты и форма записи, что на главной, но свой текст:
 * главный запрос в H1 и первом абзаце, хвосты — в H2. Внизу — ссылки на
 * соседние программы: поисковику они показывают структуру сайта, человеку —
 * куда идти, если эта страница не про него.
 */
export function Landing({ page }: { page: LandingPage }) {
  const others = LANDINGS.filter((l) => l.slug !== page.slug);
  return (
    <div className={s.page}>
      <Motion />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(landingGraph(page)) }} />

      <nav className={s.bar} aria-label="Разделы">
        <a className={s.brand} href="/maximova">
          {TEACHER.name}
        </a>
        <div className={s.chips}>
          <a href="#zapis">Запись</a>
          <a href="#ceny">Цены</a>
          <a href="/maximova">Главная</a>
        </div>
        <a className={s.cabinetLink} href="/maximova/kabinet">
          Кабинет
        </a>
      </nav>

      <header className={s.landingHero}>
        <nav className={s.crumbs} aria-label="Навигация">
          <a href="/maximova">Главная</a> / <span>{page.h1}</span>
        </nav>
        <p className={s.kicker}>{page.kicker}</p>
        <h1 className={s.landingTitle}>{page.h1}</h1>
        <p className={s.lead}>{page.lead}</p>
        <a className={s.cta} href="#zapis">
          Пробное занятие −30%
        </a>
      </header>

      <main>
        {page.sections.map((section, i) => (
          <section key={section.h2} className={s.section} aria-labelledby={`l-${i}`}>
            <h2 id={`l-${i}`} className={s.h2}>
              {section.h2}
            </h2>
            {section.body.map((p) => (
              <p key={p} className={s.lead}>
                {p}
              </p>
            ))}
            {section.list ? (
              <ol className={s.landingList}>
                {section.list.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ol>
            ) : null}
          </section>
        ))}

        <section id="ceny" className={s.section} aria-labelledby="l-prices">
          <h2 id="l-prices" className={s.h2}>
            Стоимость занятий
          </h2>
          <PriceList s={s} />
          <h3 className={s.plainTitle}>Без сюрпризов</h3>
          <PlainList s={s} />
        </section>

        <section className={s.section} aria-labelledby="l-faq">
          <h2 id="l-faq" className={s.h2}>
            Вопросы родителей
          </h2>
          <FaqList s={s} only={page.faq} />
        </section>

        <section id="zapis" className={s.section} aria-labelledby="l-book" data-dock-hide="">
          <div className={s.envelope}>
            <h2 id="l-book" className={s.h2}>
              Запись на пробное занятие
            </h2>
            <p className={s.muted}>Заполните за минуту — я получу заявку в Telegram и свяжусь с вами.</p>
            <BookingForm
              language={page.language}
              s={{
                form: s.form,
                group: s.bookGroup,
                label: s.bookLabel,
                options: s.bookOptions,
                option: s.bookOption,
                optionOn: s.bookOptionOn,
                radio: s.radio,
                field: s.field,
                input: s.input,
                hint: s.hint,
                error: s.error,
                more: s.more,
                trap: s.trap,
                consent: s.consent,
                submit: s.cta,
                done: s.done,
                doneTitle: s.doneTitle,
              }}
            />
            <WhereBlock s={s} />
          </div>
        </section>

        <section className={s.section} aria-labelledby="l-more">
          <h2 id="l-more" className={s.h2}>
            Другие программы
          </h2>
          <ul className={s.linkList}>
            <li>
              <a href="/maximova">Английский и французский для детей в Москве</a>
            </li>
            {others.map((l) => (
              <li key={l.slug}>
                <a href={`/maximova/${l.slug}`}>{l.h1}</a>
              </li>
            ))}
          </ul>
        </section>
      </main>

      <footer className={s.footer}>
        <p>
          <strong>{TEACHER.fullName}</strong>
        </p>
        <p>{TEACHER.role}</p>
        <p className={s.footerLinks}>
          <a href="/maximova/kabinet">Личный кабинет</a> · <a href="/maximova/privacy">Политика обработки данных</a>
        </p>
        <Credit className={s.credit} />
      </footer>

      <a className={s.dock} href="#zapis" data-dock="">
        Пробное занятие −30%
      </a>
    </div>
  );
}
