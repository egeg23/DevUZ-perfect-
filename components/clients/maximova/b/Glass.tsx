import Image from "next/image";
import type { CSSProperties } from "react";

import {
  AGES,
  CUTS,
  DIARY,
  MOMS_COURSE,
  MOMS_DETAILS,
  PHOTOS,
  QUOTES,
  RHYTHM,
  SCHOOL,
  TEACHER,
  TRIAL,
} from "@/content/clients/maximova/facts";

import {
  DiaryList,
  FaqList,
  Later,
  LessonSteps,
  MomsLink,
  PlainList,
  PriceList,
  RequestList,
  ResultList,
  TrialPoints,
  WhereBlock,
} from "../Blocks";
import { Book } from "../Book";
import { Credit } from "../Credit";
import { Motion } from "../Motion";
import { Hello } from "./Hello";
import s from "./glass.module.css";

const at = (i: number) => ({ "--i": i }) as CSSProperties;

/**
 * Прототип B — «Стекло».
 *
 * Светлая страница, панели из матового стекла поверх ярких плоских фигур.
 * Язык занятий выбирается прямо на первом экране — и страница меняет цвет:
 * синий для английского, коралловый для французского.
 *
 * Движение у каждого блока своё: плитки «капают» и упруго встают на место,
 * программы наклоняются к зрителю, ритм собирается из точек, принцип
 * выезжает цветной плоскостью. На телефоне фигуры за стеклом стоят на
 * месте: живое размытие поверх движущегося фона — самое дорогое, что можно
 * попросить у среднего Android.
 */
export function Glass() {
  return (
    <div className={s.page} data-glass="" data-lang="en">
      <Motion />
      <div className={s.shapes} aria-hidden="true">
        <span className={`${s.shape} ${s.shapeA}`} />
        <span className={`${s.shape} ${s.shapeB}`} />
        <span className={`${s.shape} ${s.shapeC}`} />
        <span className={`${s.shape} ${s.shapeD}`} />
      </div>

      <nav className={s.bar} aria-label="Разделы">
        <span className={s.brand}>{TEACHER.name}</span>
        <a className={s.barLink} href="#zapis">
          Запись
        </a>
      </nav>

      <header className={s.hero}>
        <div className={`${s.glass} ${s.heroCard}`}>
          <Hello />
          <h1 className={s.title}>Английский и французский для детей, которые думают на языке</h1>
          <p className={s.lead}>
            {SCHOOL.title}: 5–8 и 8–17 лет, {RHYTHM.line}. Группы у метро Китай-город и онлайн.
          </p>
          <a className={s.cta} href="#zapis">
            Пробное занятие −30%
          </a>
        </div>
        <div className={s.heroPhoto}>
          <Image
            className={s.cut}
            src={PHOTOS.bench.cut}
            alt={PHOTOS.bench.alt}
            width={CUTS.bench.width}
            height={CUTS.bench.height}
            priority
            sizes="(min-width: 900px) 40vw, 90vw"
          />
          <p className={`${s.glass} ${s.badge}`}>
            <strong>{TEACHER.universityShort}</strong> действующий преподаватель
          </p>
        </div>
      </header>

      <main className={s.main}>
        <section aria-labelledby="b-about">
          <h2 id="b-about" className={s.h2}>
            О Дарье
          </h2>
          <div className={s.bento}>
            <article className={`${s.glass} ${s.tile} ${s.tileWide}`} data-reveal="" style={at(0)}>
              <p className={s.tileBig}>{TEACHER.fullName}</p>
              <p>{TEACHER.university}</p>
            </article>
            <article className={`${s.glass} ${s.tile}`} data-reveal="" style={at(1)}>
              <p className={s.tileNum}>{TEACHER.experienceYears}</p>
              <p>лет педагогического стажа</p>
            </article>
            <article className={`${s.glass} ${s.tile}`} data-reveal="" style={at(2)}>
              <p className={s.tileNum}>2</p>
              <p>языка у её собственных детей — она растит их билингвами</p>
            </article>
            <article className={`${s.glass} ${s.tile} ${s.tileWide}`} data-reveal="" style={at(3)}>
              <p className={s.tileBig}>{SCHOOL.method}</p>
              <p>Для детей 5–8 лет и для 8–17 лет — английский и французский.</p>
            </article>
          </div>
        </section>

        <section aria-labelledby="b-asks">
          <h2 id="b-asks" className={s.h2}>
            С чем к Дарье приходят родители
          </h2>
          <RequestList s={s} />
        </section>

        <section aria-labelledby="b-ages">
          <h2 id="b-ages" className={s.h2}>
            Программы
          </h2>
          <div className={s.ages}>
            {AGES.map((age, i) => (
              <article key={age.id} className={`${s.glass} ${s.age}`} data-reveal="" style={at(i)}>
                <p className={s.ageRange}>{age.range}</p>
                <h3 className={s.h3}>{age.title}</h3>
                <p>{age.note}.</p>
                <ul className={s.chips}>
                  {SCHOOL.languages.map((lang) => (
                    <li key={lang}>{lang}</li>
                  ))}
                  <li>{RHYTHM.line}</li>
                </ul>
              </article>
            ))}
          </div>
        </section>

        <section className={s.rhythm} aria-labelledby="b-rhythm">
          <h2 id="b-rhythm" className={s.h2}>
            Как проходят 45 минут
          </h2>
          <div className={s.rhythmRow}>
            <div className={`${s.glass} ${s.dial}`} data-reveal="">
              <span className={s.dialNum}>2</span>
              <span>занятия в неделю</span>
            </div>
            <div className={`${s.glass} ${s.dial}`} data-reveal="">
              <span className={s.dialNum}>45</span>
              <span>минут</span>
              <span className={s.dots} aria-hidden="true">
                {Array.from({ length: 45 }, (_, i) => (
                  <i key={i} style={{ "--a": `${i * 8}deg`, "--i": i } as CSSProperties} />
                ))}
              </span>
            </div>
          </div>
          <p className={s.why}>{RHYTHM.why}</p>
          <LessonSteps s={s} />
        </section>

        <section aria-labelledby="b-prices">
          <h2 id="b-prices" className={s.h2}>
            Стоимость
          </h2>
          <PriceList s={s} />
          <h3 className={s.plainTitle}>Без сюрпризов</h3>
          <PlainList s={s} />
        </section>

        <section className={`${s.glass} ${s.trial}`} aria-labelledby="b-trial" data-reveal="">
          <h2 id="b-trial" className={s.h2}>
            {TRIAL.title}
          </h2>
          <TrialPoints s={s} />
          <a className={s.cta} href="#zapis">
            Записаться на пробное
          </a>
        </section>

        <section className={s.rule} aria-labelledby="b-rule" data-reveal="">
          <h2 id="b-rule" className={s.ruleTitle}>
            Принцип Дарьи
          </h2>
          <blockquote className={s.ruleQuote}>«{QUOTES.homework}»</blockquote>
        </section>

        <section className={s.moms} aria-labelledby="b-moms">
          <div className={s.momsPhoto} data-reveal="">
            <Image
              className={s.cut}
              src={PHOTOS.kangol.cut}
              alt={PHOTOS.kangol.alt}
              width={CUTS.kangol.width}
              height={CUTS.kangol.height}
              sizes="(min-width: 900px) 36vw, 90vw"
            />
          </div>
          <div className={`${s.glass} ${s.momsCard}`} data-reveal="">
            <p className={s.eyebrow}>Для родителей</p>
            <h2 id="b-moms" className={s.h2}>
              {MOMS_COURSE.title}
            </h2>
            <p className={s.lead}>{MOMS_COURSE.line}</p>
            <ul className={s.chips}>
              <li>{MOMS_DETAILS.format}</li>
              <li>{MOMS_DETAILS.line}</li>
            </ul>
            <blockquote className={s.quote}>«{QUOTES.mother}»</blockquote>
            <MomsLink className={s.ghost} />
          </div>
        </section>

        <section className={`${s.glass} ${s.goal}`} aria-labelledby="b-goal" data-reveal="">
          <h2 id="b-goal" className={s.h2}>
            На что рассчитана программа
          </h2>
          <blockquote className={s.goalQuote}>«{QUOTES.goal}»</blockquote>
          <p className={s.sign}>— {TEACHER.name}</p>
        </section>

        <section aria-labelledby="b-results">
          <h2 id="b-results" className={s.h2}>
            Что вы увидите по ходу занятий
          </h2>
          <p className={s.lead}>Без обещаний в сроках — только то, что родитель действительно видит.</p>
          <ResultList s={s} />
        </section>

        <section aria-labelledby="b-diary">
          <h2 id="b-diary" className={s.h2}>
            {DIARY.title}
          </h2>
          <DiaryList s={s} />
        </section>

        <section aria-labelledby="b-faq">
          <h2 id="b-faq" className={s.h2}>
            Вопросы родителей
          </h2>
          <FaqList s={s} />
        </section>

        <section id="zapis" className={`${s.glass} ${s.book}`} aria-labelledby="b-book">
          <h2 id="b-book" className={s.h2}>
            Запись на пробное занятие
          </h2>
          <p>Выберите язык, возраст и формат — сообщение Дарье соберётся само.</p>
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
          />
          <WhereBlock s={s} />
          <Later s={s} />
        </section>
      </main>

      <footer className={s.footer}>
        <p>
          <strong>{TEACHER.fullName}</strong> · {TEACHER.role}
        </p>
        <Credit className={s.credit} />
      </footer>

      <a className={s.dock} href="#zapis" data-dock="">
        Пробное занятие −30%
      </a>
    </div>
  );
}
