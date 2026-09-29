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
import s from "./cinema.module.css";

/** Номер по порядку — для задержки появления соседей. */
const at = (i: number) => ({ "--i": i }) as CSSProperties;

/**
 * Прототип A — «Кино».
 *
 * Страница как фильм в сценах: тёмный зал, Дарья на фоне «экрана» —
 * вырезанная из снимка, без двора и машин за спиной, — и титры. Каждая сцена
 * появляется своим монтажным приёмом: шторка, слово за словом, наводка
 * фокуса, кадры плёнки, переворот афиши, билет, раздвижка кадра, титры.
 * Всё — transform и opacity, скролл не перехватывается.
 */
export function Cinema() {
  const words = QUOTES.homework.split(" ");

  return (
    <div className={s.page}>
      <Motion />
      <div className={s.progress} data-progress="" aria-hidden="true" />

      <header className={s.hero}>
        <div className={s.heroStage}>
          <span className={s.screen} aria-hidden="true" />
          <Image
            className={s.heroCut}
            src={PHOTOS.urban.cut}
            alt={PHOTOS.urban.alt}
            width={CUTS.urban.width}
            height={CUTS.urban.height}
            priority
            sizes="(min-width: 900px) 44vw, 90vw"
          />
        </div>
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
            педагогического стажа. Группы у метро Китай-город и онлайн.
          </p>
          <a className={s.cta} href="#zapis">
            Записаться на пробное −30%
          </a>
        </div>
      </header>

      <main>
        <section className={s.scene} aria-labelledby="a-who">
          <p className={s.sceneNo}>Сцена 01</p>
          <div className={s.whoGrid}>
            <div className={s.shutter} data-reveal="">
              <Image
                src={PHOTOS.kangol.cut}
                alt={PHOTOS.kangol.alt}
                width={CUTS.kangol.width}
                height={CUTS.kangol.height}
                sizes="(min-width: 900px) 40vw, 90vw"
              />
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

        <section className={s.scene} aria-labelledby="a-asks">
          <p className={s.sceneNo}>С чем приходят</p>
          <h2 id="a-asks" className={s.h2}>
            С чем к Дарье приходят родители
          </h2>
          <RequestList s={s} />
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
          <p className={s.muted}>{SCHOOL.method}. Языки на выбор: английский и французский.</p>
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

        <section className={s.scene} aria-labelledby="a-lesson">
          <p className={s.sceneNo}>Сцена 04</p>
          <h2 id="a-lesson" className={s.h2}>
            45 минут по кадрам
          </h2>
          <p className={s.muted}>
            {RHYTHM.line}. {RHYTHM.why}
          </p>
          <LessonSteps s={s} />
        </section>

        <section className={s.scene} aria-labelledby="a-prices">
          <p className={s.sceneNo}>Сцена 05</p>
          <h2 id="a-prices" className={s.h2}>
            Стоимость
          </h2>
          <PriceList s={s} />
          <h3 className={s.plainTitle}>Без сюрпризов</h3>
          <PlainList s={s} />
        </section>

        <section className={s.scene} aria-labelledby="a-trial">
          <p className={s.sceneNo}>Сцена 06</p>
          <div className={s.ticket} data-reveal="">
            <h2 id="a-trial" className={s.h2}>
              {TRIAL.title}
            </h2>
            <TrialPoints s={s} />
            <a className={s.cta} href="#zapis">
              Записаться на пробное
            </a>
          </div>
        </section>

        <section className={s.scene} aria-labelledby="a-moms">
          <p className={s.sceneNo}>Сцена 07</p>
          <div className={s.momsGrid}>
            <div className={s.split} data-reveal="">
              <Image
                src={PHOTOS.bench.cut}
                alt={PHOTOS.bench.alt}
                width={CUTS.bench.width}
                height={CUTS.bench.height}
                sizes="(min-width: 900px) 40vw, 90vw"
              />
              <span className={s.splitLeft} aria-hidden="true" />
              <span className={s.splitRight} aria-hidden="true" />
            </div>
            <div>
              <h2 id="a-moms" className={s.h2}>
                {MOMS_COURSE.title}
              </h2>
              <p className={s.lead}>{MOMS_COURSE.line}</p>
              <p className={s.momsFacts}>
                {MOMS_DETAILS.format} · {MOMS_DETAILS.line}
              </p>
              <blockquote className={s.quote}>«{QUOTES.mother}»</blockquote>
              <MomsLink className={s.ghost} />
            </div>
          </div>
        </section>

        <section className={`${s.scene} ${s.goal}`} aria-labelledby="a-goal">
          <p className={s.sceneNo}>Сцена 08</p>
          <h2 id="a-goal" className={s.h2}>
            К чему ведёт программа
          </h2>
          <blockquote className={s.credits} data-reveal="">
            «{QUOTES.goal}»
          </blockquote>
        </section>

        <section className={s.scene} aria-labelledby="a-results">
          <h2 id="a-results" className={s.h2}>
            Что вы увидите по ходу занятий
          </h2>
          <p className={s.muted}>Без обещаний в сроках — только то, что родитель действительно видит.</p>
          <ResultList s={s} />
        </section>

        <section className={s.scene} aria-labelledby="a-diary">
          <h2 id="a-diary" className={s.h2}>
            {DIARY.title}
          </h2>
          <DiaryList s={s} />
        </section>

        <section className={s.scene} aria-labelledby="a-faq">
          <h2 id="a-faq" className={s.h2}>
            Вопросы родителей
          </h2>
          <FaqList s={s} />
        </section>

        <section id="zapis" className={`${s.scene} ${s.book}`} aria-labelledby="a-book">
          <h2 id="a-book" className={s.h2}>
            Запись на пробное занятие
          </h2>
          <p className={s.muted}>Выберите язык, возраст и формат — сообщение Дарье соберётся само.</p>
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
        <p className={s.footerName}>{TEACHER.fullName}</p>
        <p className={s.muted}>{TEACHER.role}</p>
        <Credit className={s.credit} />
      </footer>

      <a className={s.dock} href="#zapis" data-dock="">
        Записаться на пробное −30%
      </a>
    </div>
  );
}
