import Image from "next/image";
import type { CSSProperties } from "react";

import { AGES, FAQ, MISSING, MOMS_COURSE, PHOTOS, QUOTES, RHYTHM, SCHOOL, TEACHER } from "@/content/clients/maximova/facts";

import { Book } from "../Book";
import { Credit } from "../Credit";
import { Missing } from "../Missing";
import { Motion } from "../Motion";
import { Skyline } from "./Skyline";
import s from "./countries.module.css";

const at = (i: number) => ({ "--i": i }) as CSSProperties;

const GREETINGS = [
  { lang: "en", word: "Hello", name: "Английский", note: "Для детей 5–8 и 8–17 лет" },
  { lang: "fr", word: "Bonjour", name: "Французский", note: "Для детей 5–8 и 8–17 лет" },
] as const;

/**
 * Прототип C — «Две страны».
 *
 * Тёплая бумага детской книги и параллакс: Лондон и Париж, нарисованные
 * кодом, едут с разной скоростью, пока страница листается. Скорость слоя
 * задаёт `data-speed`, скролл при этом не перехватывается.
 *
 * Движения блоков: открытка с печатью, страницы-паспорта раскрываются,
 * самолётик перелетает между возрастами, стрелка часов доходит до 45 минут,
 * записка приклеивается, письмо разворачивается.
 */
export function TwoCountries() {
  return (
    <div className={s.page}>
      <Motion />

      <header className={s.hero}>
        <div className={s.heroText}>
          <p className={s.kicker}>{SCHOOL.title}</p>
          <h1 className={s.title}>
            Два языка, <em>две страны</em>
          </h1>
          <p className={s.lead}>
            {TEACHER.name}, преподаватель {TEACHER.universityShort}, сама растит двоих детей билингвами. Английский и
            французский для детей 5–8 и 8–17 лет.
          </p>
          <a className={s.cta} href="#zapis">
            Записаться на знакомство
          </a>
        </div>
        <Skyline className={s.scene} layer={{ sky: s.layer, city: s.layer, front: s.layer }} />
      </header>

      <main>
        <section className={s.section} aria-labelledby="c-meet">
          <div className={s.meet}>
            <figure className={s.postcard} data-reveal="">
              <div className={s.postcardPhoto}>
                <Image src={PHOTOS.urban.src} alt={PHOTOS.urban.alt} fill sizes="(min-width: 900px) 36vw, 80vw" />
              </div>
              <span className={s.stamp} aria-hidden="true">
                {TEACHER.universityShort}
              </span>
            </figure>
            <div>
              <h2 id="c-meet" className={s.h2}>
                Знакомьтесь: {TEACHER.firstName}
              </h2>
              <p className={s.name}>{TEACHER.fullName}</p>
              <ul className={s.list}>
                <li>{TEACHER.university}</li>
                <li>{TEACHER.experience}</li>
                <li>«{QUOTES.mother}»</li>
              </ul>
            </div>
          </div>
        </section>

        <section className={s.section} aria-labelledby="c-langs">
          <h2 id="c-langs" className={s.h2}>
            Два языка на выбор
          </h2>
          <div className={s.passports}>
            {GREETINGS.map((item, i) => (
              <article key={item.lang} className={s.passport} data-reveal="" style={at(i)}>
                <p className={s.greeting} lang={item.lang}>
                  {item.word}
                </p>
                <h3 className={s.h3}>{item.name}</h3>
                <p className={s.muted}>{item.note}</p>
              </article>
            ))}
          </div>
        </section>

        <section className={s.section} aria-labelledby="c-ages">
          <h2 id="c-ages" className={s.h2}>
            Две программы
          </h2>
          <p className={s.muted}>{SCHOOL.method} — у каждой своя.</p>
          <div className={s.route} data-reveal="">
            <svg className={s.plane} viewBox="0 0 48 48" aria-hidden="true">
              <path d="M4 26 L44 8 L30 44 L24 30 Z" fill="currentColor" />
            </svg>
            <span className={s.routeLine} aria-hidden="true" />
            {AGES.map((age, i) => (
              <article key={age.id} className={s.stop} style={at(i)}>
                <p className={s.stopRange}>{age.range}</p>
                <h3 className={s.h3}>{age.title}</h3>
                <p className={s.muted}>{age.note}</p>
              </article>
            ))}
          </div>
        </section>

        <section className={s.section} aria-labelledby="c-time">
          <div className={s.time}>
            <div className={s.clock} data-reveal="">
              <svg viewBox="0 0 200 200" aria-hidden="true">
                <circle cx="100" cy="100" r="92" fill="hsl(40 60% 99%)" stroke="currentColor" strokeWidth="4" />
                {Array.from({ length: 12 }, (_, i) => (
                  <line
                    key={i}
                    x1="100"
                    y1="16"
                    x2="100"
                    y2={i % 3 === 0 ? 32 : 26}
                    stroke="currentColor"
                    strokeWidth="4"
                    strokeLinecap="round"
                    transform={`rotate(${i * 30} 100 100)`}
                  />
                ))}
              </svg>
              <span className={s.hand} aria-hidden="true" />
              <span className={s.hub} aria-hidden="true" />
            </div>
            <div>
              <h2 id="c-time" className={s.h2}>
                {RHYTHM.line}
              </h2>
              <p className={s.lead}>{RHYTHM.why}</p>
            </div>
          </div>
        </section>

        <section className={s.section} aria-labelledby="c-rule">
          <div className={s.note} data-reveal="">
            <h2 id="c-rule" className={s.noteTitle}>
              Про домашние задания
            </h2>
            <blockquote className={s.noteQuote}>«{QUOTES.homework}»</blockquote>
          </div>
        </section>

        <section className={s.section} aria-labelledby="c-moms">
          <div className={s.moms}>
            <div className={s.arch}>
              <div className={s.archInner} data-speed="-0.08">
                <Image src={PHOTOS.bench.src} alt={PHOTOS.bench.alt} fill sizes="(min-width: 900px) 32vw, 80vw" />
              </div>
            </div>
            <div className={s.momsText} data-reveal="">
              <p className={s.kicker}>Для мам</p>
              <h2 id="c-moms" className={s.h2}>
                {MOMS_COURSE.title}
              </h2>
              <p className={s.lead}>{MOMS_COURSE.line}</p>
            </div>
          </div>
        </section>

        <section className={s.section} aria-labelledby="c-goal">
          <div className={s.letter} data-reveal="">
            <h2 id="c-goal" className={s.h2}>
              На что рассчитана программа
            </h2>
            <blockquote className={s.letterQuote}>«{QUOTES.goal}»</blockquote>
            <p className={s.sign}>— {TEACHER.firstName}</p>
          </div>
        </section>

        <section className={s.section} aria-labelledby="c-faq">
          <h2 id="c-faq" className={s.h2}>
            Вопросы родителей
          </h2>
          <div className={s.faq}>
            {FAQ.map((item) => (
              <details key={item.q} className={s.faqItem}>
                <summary>{item.q}</summary>
                {item.a ? (
                  <p>{item.a}</p>
                ) : (
                  <Missing className={s.missing} what={`${MISSING.prices}, ${MISSING.format.toLowerCase()}`} />
                )}
              </details>
            ))}
          </div>
        </section>

        <section id="zapis" className={s.section} aria-labelledby="c-book">
          <div className={s.envelope}>
            <h2 id="c-book" className={s.h2}>
              Запись на знакомство
            </h2>
            <p className={s.muted}>Выберите язык и возраст — сообщение Дарье соберётся само.</p>
            <Book
              skin={{
                root: s.bookRoot,
                group: s.bookGroup,
                label: s.bookLabel,
                options: s.bookOptions,
                option: s.bookOption,
                optionOn: s.bookOptionOn,
                button: s.cta,
                note: s.bookNote,
                message: s.bookMessage,
              }}
              cta="Записаться на знакомство"
            />
            <div className={s.missingRow}>
              <Missing className={s.missing} what={MISSING.prices} />
              <Missing className={s.missing} what={MISSING.format} />
              <Missing className={s.missing} what={MISSING.reviews} />
            </div>
          </div>
        </section>
      </main>

      <footer className={s.footer}>
        <p>
          <strong>{TEACHER.fullName}</strong>
        </p>
        <p>{TEACHER.role}</p>
        <Credit className={s.credit} />
      </footer>

      <a className={s.dock} href="#zapis" data-dock="">
        Записаться на знакомство
      </a>
    </div>
  );
}
