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
import { BookingForm } from "../BookingForm";
import { Credit } from "../Credit";
import { Motion } from "../Motion";
import { Skyline } from "./Skyline";
import s from "./countries.module.css";

const at = (i: number) => ({ "--i": i }) as CSSProperties;

const GREETINGS = [
  { lang: "en", word: "Hello", name: "Английский" },
  { lang: "fr", word: "Bonjour", name: "Французский" },
] as const;

/**
 * Прототип C — «Две страны».
 *
 * Тёплая бумага детской книги и параллакс: Лондон и Париж, нарисованные
 * кодом, едут с разной скоростью, пока страница листается. Скорость слоя
 * задаёт `data-speed`, скролл при этом не перехватывается.
 *
 * Выбран владельцем и Дарьей как основной сайт (/maximova). Фото — без фона:
 * Дарья стоит прямо на странице. Запись — настоящая форма: заявка уходит в
 * базу и Дарье в Telegram. Кабинет — вход через её бота.
 *
 * Движения блоков: портрет с печатью, страницы-паспорта раскрываются,
 * самолётик перелетает между возрастами, стрелка часов доходит до 45 минут,
 * записка приклеивается, письмо разворачивается.
 */
export function TwoCountries() {
  return (
    <div className={s.page}>
      <Motion />

      <nav className={s.bar} aria-label="Разделы">
        <a className={s.brand} href="#top">
          {TEACHER.name}
        </a>
        <div className={s.chips}>
          <a href="#zapis">Запись</a>
          <a href="#ceny">Цены</a>
          <a href="#probnoe">Пробное</a>
          <a href="#voprosy">Вопросы</a>
        </div>
        <a className={s.cabinetLink} href="/maximova/kabinet">
          Кабинет
        </a>
      </nav>

      <header className={s.hero} id="top">
        <div className={s.heroText}>
          <p className={s.kicker}>{SCHOOL.title}</p>
          <h1 className={s.title}>
            Два языка, <em>две страны</em>
          </h1>
          <p className={s.lead}>
            {TEACHER.name}, преподаватель {TEACHER.universityShort}, сама растит двоих детей билингвами. Английский и
            французский для детей 5–8 и 8–17 лет — у метро Китай-город и онлайн.
          </p>
          <a className={s.cta} href="#zapis">
            Пробное занятие −30%
          </a>
        </div>
        <Skyline className={s.scene} layer={{ sky: s.layer, city: s.layer, front: s.layer }}>
          <Image
            className={s.heroCut}
            src={PHOTOS.kangol.cut}
            alt=""
            width={CUTS.kangol.width}
            height={CUTS.kangol.height}
            priority
            sizes="(min-width: 900px) 24vw, 40vw"
          />
        </Skyline>
      </header>

      <main>
        <section className={s.section} aria-labelledby="c-meet">
          <div className={s.meet}>
            <figure className={s.portrait} data-reveal="">
              <Image
                src={PHOTOS.urban.cut}
                alt={PHOTOS.urban.alt}
                width={CUTS.urban.width}
                height={CUTS.urban.height}
                sizes="(min-width: 900px) 36vw, 80vw"
              />
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

        <section className={s.section} aria-labelledby="c-asks">
          <h2 id="c-asks" className={s.h2}>
            С чем к Дарье приходят родители
          </h2>
          <RequestList s={s} />
        </section>

        <section className={s.section} aria-labelledby="c-langs">
          <h2 id="c-langs" className={s.h2}>
            Два языка, две программы
          </h2>
          <p className={s.muted}>{SCHOOL.method} — для каждого возраста своя.</p>
          <div className={s.passports}>
            {GREETINGS.map((item, i) => (
              <article key={item.lang} className={s.passport} data-reveal="" style={at(i)}>
                <p className={s.greeting} lang={item.lang}>
                  {item.word}
                </p>
                <h3 className={s.h3}>{item.name}</h3>
              </article>
            ))}
          </div>
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

        <section className={s.section} aria-labelledby="c-lesson">
          <h2 id="c-lesson" className={s.h2}>
            Что происходит за 45 минут
          </h2>
          <LessonSteps s={s} />
        </section>

        <section id="ceny" className={s.section} aria-labelledby="c-prices">
          <h2 id="c-prices" className={s.h2}>
            Стоимость
          </h2>
          <PriceList s={s} />
          <h3 className={s.plainTitle}>Без сюрпризов</h3>
          <PlainList s={s} />
        </section>

        <section id="probnoe" className={s.section} aria-labelledby="c-trial">
          <div className={s.trial} data-reveal="">
            <span className={s.trialStamp} aria-hidden="true">
              −30%
            </span>
            <h2 id="c-trial" className={s.h2}>
              {TRIAL.title}
            </h2>
            <TrialPoints s={s} />
            <a className={s.cta} href="#zapis">
              Записаться на пробное
            </a>
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
            <figure className={s.portrait}>
              <Image
                src={PHOTOS.bench.cut}
                alt={PHOTOS.bench.alt}
                width={CUTS.bench.width}
                height={CUTS.bench.height}
                sizes="(min-width: 900px) 32vw, 80vw"
              />
            </figure>
            <div className={s.momsText} data-reveal="">
              <p className={s.kicker}>Для мам</p>
              <h2 id="c-moms" className={s.h2}>
                {MOMS_COURSE.title}
              </h2>
              <p className={s.lead}>{MOMS_COURSE.line}</p>
              <p className={s.momsFacts}>
                {MOMS_DETAILS.format} · {MOMS_DETAILS.line}
              </p>
              <MomsLink className={s.ghost} />
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

        <section className={s.section} aria-labelledby="c-results">
          <h2 id="c-results" className={s.h2}>
            Что вы увидите по ходу занятий
          </h2>
          <p className={s.muted}>Без обещаний в сроках — только то, что родитель действительно видит.</p>
          <ResultList s={s} />
          <h3 className={s.plainTitle}>{DIARY.title}</h3>
          <DiaryList s={s} />
          <a className={s.ghost} href="/maximova/kabinet">
            Войти в кабинет через Telegram
          </a>
        </section>

        <section id="voprosy" className={s.section} aria-labelledby="c-faq">
          <h2 id="c-faq" className={s.h2}>
            Вопросы родителей
          </h2>
          <FaqList s={s} />
        </section>

        <section id="zapis" className={s.section} aria-labelledby="c-book" data-dock-hide="">
          <div className={s.envelope}>
            <h2 id="c-book" className={s.h2}>
              Запись на пробное занятие
            </h2>
            <p className={s.muted}>Заполните за минуту — Дарья получит заявку в Telegram и свяжется с вами.</p>
            <BookingForm
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
            <Later s={s} />
          </div>
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
