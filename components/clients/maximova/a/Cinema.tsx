import Image from "next/image";
import type { CSSProperties } from "react";

import { AGES, FAQ, MISSING, MOMS_COURSE, PHOTOS, QUOTES, RHYTHM, SCHOOL, TEACHER } from "@/content/clients/maximova/facts";

import { Book } from "../Book";
import { Credit } from "../Credit";
import { Missing } from "../Missing";
import { Motion } from "../Motion";
import s from "./cinema.module.css";

/** Номер по порядку — для задержки появления соседей. */
const at = (i: number) => ({ "--i": i }) as CSSProperties;

/**
 * Прототип A — «Кино».
 *
 * Страница как фильм в шести сценах: тёмный зал, крупные планы её
 * фотографий, титры. Каждая сцена появляется своим монтажным приёмом:
 * шторка, слово за словом, наводка фокуса, счётчик плёнки, раздвижка кадра,
 * титры. Всё — transform и opacity, скролл не перехватывается.
 */
export function Cinema() {
  const words = QUOTES.homework.split(" ");

  return (
    <div className={s.page}>
      <Motion />
      <div className={s.progress} data-progress="" aria-hidden="true" />

      <header className={s.hero}>
        <div className={s.heroPhoto}>
          <Image src={PHOTOS.urban.src} alt={PHOTOS.urban.alt} fill priority sizes="(min-width: 900px) 55vw, 100vw" />
        </div>
        <div className={s.letterTop} aria-hidden="true" />
        <div className={s.letterBottom} aria-hidden="true" />
        <div className={s.heroText}>
          <p className={s.kicker}>
            {SCHOOL.languages.join(" · ")} · <span className={s.nowrap}>дети 5–17 лет</span>
          </p>
          <h1 className={s.title}>
            <span className={s.line}>
              <span>Учу детей</span>
            </span>
            <span className={s.line}>
              <em>думать на языке</em>
            </span>
          </h1>
          <p className={s.lead}>
            {TEACHER.name} — действующий преподаватель {TEACHER.universityShort}, {TEACHER.experienceYears} лет
            педагогического стажа. {SCHOOL.title}: 5–8 и 8–17 лет.
          </p>
          <a className={s.cta} href="#zapis">
            Записаться на знакомство
          </a>
        </div>
      </header>

      <main>
        <section className={s.scene} aria-labelledby="a-who">
          <p className={s.sceneNo}>Сцена 01</p>
          <div className={s.whoGrid}>
            <div className={s.shutter} data-reveal="">
              <Image src={PHOTOS.kangol.src} alt={PHOTOS.kangol.alt} fill sizes="(min-width: 900px) 40vw, 100vw" />
              <span className={s.shutterPanel} aria-hidden="true" />
            </div>
            <div>
              <h2 id="a-who" className={s.h2}>
                Кто ведёт занятия
              </h2>
              <p className={s.name}>{TEACHER.fullName}</p>
              <ul className={s.facts}>
                <li data-reveal="" style={at(0)}>
                  {TEACHER.university}
                </li>
                <li data-reveal="" style={at(1)}>
                  {TEACHER.experience}
                </li>
                <li data-reveal="" style={at(2)}>
                  Мама двоих детей, которых воспитывает билингвами
                </li>
              </ul>
            </div>
          </div>
        </section>

        <section className={`${s.scene} ${s.principle}`} aria-labelledby="a-rule">
          <p className={s.sceneNo}>Сцена 02</p>
          <h2 id="a-rule" className={s.h2}>
            Главный принцип
          </h2>
          <blockquote className={s.words} data-reveal="">
            {words.map((word, i) => (
              <span key={i} style={at(i)}>
                {word}{" "}
              </span>
            ))}
          </blockquote>
          <p className={s.sign}>— {TEACHER.firstName}</p>
        </section>

        <section className={s.scene} aria-labelledby="a-ages">
          <p className={s.sceneNo}>Сцена 03</p>
          <h2 id="a-ages" className={s.h2}>
            Две программы — два возраста
          </h2>
          <p className={s.muted}>
            {SCHOOL.method}. Языки на выбор: английский и французский.
          </p>
          <div className={s.ages}>
            {AGES.map((age, i) => (
              <article key={age.id} className={s.age} data-reveal="" style={at(i)}>
                <p className={s.ageRange}>{age.range}</p>
                <h3 className={s.h3}>{age.title}</h3>
                <p className={s.muted}>{age.note}</p>
                <p className={s.muted}>{RHYTHM.line}</p>
              </article>
            ))}
          </div>
        </section>

        <section className={`${s.scene} ${s.rhythm}`} aria-labelledby="a-rhythm">
          <p className={s.sceneNo}>Сцена 04</p>
          <h2 id="a-rhythm" className={s.h2}>
            Ритм занятий
          </h2>
          <div className={s.counters}>
            <div className={s.counter} data-reveal="">
              <span className={s.reel} aria-hidden="true">
                <span>0</span>
                <span>1</span>
                <span>2</span>
              </span>
              <span className={s.srOnly}>2</span>
              <p>занятия в неделю</p>
            </div>
            <div className={s.counter} data-reveal="">
              <span className={s.reel} aria-hidden="true">
                <span>15</span>
                <span>30</span>
                <span>45</span>
              </span>
              <span className={s.srOnly}>45</span>
              <p>минут каждое</p>
            </div>
          </div>
          <p className={s.why}>{RHYTHM.why}</p>
        </section>

        <section className={s.scene} aria-labelledby="a-moms">
          <p className={s.sceneNo}>Сцена 05</p>
          <div className={s.momsGrid}>
            <div className={s.split} data-reveal="">
              <Image src={PHOTOS.bench.src} alt={PHOTOS.bench.alt} fill sizes="(min-width: 900px) 40vw, 100vw" />
              <span className={s.splitLeft} aria-hidden="true" />
              <span className={s.splitRight} aria-hidden="true" />
            </div>
            <div>
              <h2 id="a-moms" className={s.h2}>
                {MOMS_COURSE.title}
              </h2>
              <p className={s.lead}>{MOMS_COURSE.line}</p>
              <blockquote className={s.quote}>«{QUOTES.mother}»</blockquote>
            </div>
          </div>
        </section>

        <section className={`${s.scene} ${s.goal}`} aria-labelledby="a-goal">
          <p className={s.sceneNo}>Сцена 06</p>
          <h2 id="a-goal" className={s.h2}>
            К чему ведёт программа
          </h2>
          <blockquote className={s.credits} data-reveal="">
            «{QUOTES.goal}»
          </blockquote>
        </section>

        <section className={s.scene} aria-labelledby="a-faq">
          <h2 id="a-faq" className={s.h2}>
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

        <section id="zapis" className={`${s.scene} ${s.book}`} aria-labelledby="a-book">
          <h2 id="a-book" className={s.h2}>
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
        </section>
      </main>

      <footer className={s.footer}>
        <p className={s.footerName}>{TEACHER.fullName}</p>
        <p className={s.muted}>{TEACHER.role}</p>
        <Credit className={s.credit} />
      </footer>

      <a className={s.dock} href="#zapis" data-dock="">
        Записаться на знакомство
      </a>
    </div>
  );
}
