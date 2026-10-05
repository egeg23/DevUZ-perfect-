import { LANDINGS, type Landing as LandingPage } from "@/content/clients/maximova/pages";
import { landingGraph } from "@/lib/clients/maximova/schema";
import { jsonLd } from "@/lib/clients/maximova/seo";

import { FaqList, PlainList, PriceList } from "../Blocks";
import { Drip, type Band } from "./Drip";
import { Letters } from "./Letters";
import { BookBlock, Head, Shell } from "./Shell";
import { fit } from "./fit";
import s from "./lab.module.css";

/**
 * Посадочная страница под поисковый запрос — в оформлении «Лаборатории».
 *
 * Главный запрос — в H1 и первом абзаце, хвосты — в H2 (pages.ts). Внизу —
 * ссылки на соседние программы: поисковику они показывают структуру сайта,
 * человеку — куда идти, если эта страница не про него.
 */
export function Landing({ page }: { page: LandingPage }) {
  const others = LANDINGS.filter((l) => l.slug !== page.slug);
  // Полосы чередуются: первый экран тёмный, дальше слива / ультрафиолет.
  const band = (n: number): Band => (n % 2 === 0 ? "plum" : "ink");
  const cls = (n: number) => (band(n) === "plum" ? s.bandPlum : s.bandInk);
  const prev = (n: number): Band => (n === 0 ? "ink" : band(n - 1));
  const after = page.sections.length;
  return (
    <Shell>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(landingGraph(page)) }} />
      <main>
        <section className={`${s.hero} ${s.heroLanding}`} aria-labelledby="lab-h1">
          <Letters className={s.letters} />
          <div className={s.heroInner}>
            <div className={s.heroText}>
              <nav className={s.crumbs} aria-label="Навигация">
                <a href="/maximova">Главная</a> / <span>{page.h1}</span>
              </nav>
              <p className={s.pill}>{page.kicker}</p>
              <h1 id="lab-h1" className={s.display1} style={fit(page.h1)}>
                {page.h1}
              </h1>
              <p className={s.heroLead}>{page.lead}</p>
              <div className={s.actions}>
                <a className={`${s.btn} ${s.btnBig}`} href="#zapis">
                  Пробное занятие −30%
                </a>
                <a className={`${s.btn} ${s.btnGhost} ${s.btnBig}`} href="#ceny">
                  Цены
                </a>
              </div>
            </div>
          </div>
        </section>

        {page.sections.map((section, i) => [
          <Drip key={`d-${i}`} from={prev(i)} to={band(i)} seed={i + 21} />,
          <section key={section.h2} className={`${s.section} ${s.sectionTight} ${cls(i)}`} aria-labelledby={`l-${i}`}>
            <div className={s.textBlock} data-reveal="">
              <p className={s.eyebrow}>{String(i + 1).padStart(2, "0")}</p>
              <h2 id={`l-${i}`} className={s.display3} style={fit(section.h2)}>
                {section.h2}
              </h2>
              {section.body.map((p) => (
                <p key={p} className={s.bodyText}>
                  {p}
                </p>
              ))}
              {section.list ? (
                <ol className={s.numbered}>
                  {section.list.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ol>
              ) : null}
            </div>
          </section>,
        ])}

        <Drip from={prev(after)} to={band(after)} seed={31} />
        <section id="ceny" className={`${s.section} ${cls(after)}`} aria-labelledby="l-prices">
          <Head id="l-prices" kicker="Цены" title="Стоимость занятий" />
          <PriceList s={s} />
          <h3 className={s.subTitle}>Без сюрпризов</h3>
          <PlainList s={s} />
        </section>

        <Drip from={band(after)} to={band(after + 1)} seed={32} />
        <section id="voprosy" className={`${s.section} ${cls(after + 1)}`} aria-labelledby="l-faq">
          <Head id="l-faq" kicker="Вопросы" title="Вопросы родителей" />
          <FaqList s={s} only={page.faq} />
        </section>

        <Drip from={band(after + 1)} to="lime" seed={33} />
        <BookBlock language={page.language} />
        <Drip from="lime" to="ink" seed={34} />

        <section id="programmy" className={s.section} aria-labelledby="l-more">
          <Head id="l-more" kicker="Программы" title="Другие программы" />
          <ul className={s.landingLinks}>
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
    </Shell>
  );
}
