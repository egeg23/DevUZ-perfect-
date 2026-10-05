import Image from "next/image";
import type { CSSProperties } from "react";

import { CUTS, DIARY, MOMS_COURSE, MOMS_DETAILS, PHOTOS, QUOTES, RHYTHM, TEACHER, TRIAL } from "@/content/clients/maximova/facts";
import { LANDINGS } from "@/content/clients/maximova/pages";
import { homeGraph } from "@/lib/clients/maximova/schema";
import { jsonLd } from "@/lib/clients/maximova/seo";

import { FaqList, LessonSteps, MomsLink, PlainList, PriceList, RequestList, ResultList, TrialPoints, Later } from "../Blocks";
import { Letters } from "./Letters";
import { Programs } from "./Programs";
import { Quiz } from "./Quiz";
import { BookBlock, Head, Shell } from "./Shell";
import s from "./lab.module.css";

const at = (i: number) => ({ "--i": i }) as CSSProperties;

/** Плитки первого экрана — «таблица элементов» эталона, только про языки. */
const ELEMENTS = [
  { sym: "En", name: "English", note: "5–8 и 8–17 лет", num: "01", tone: s.elViolet, lang: "en" },
  { sym: "Fr", name: "Français", note: "5–8 и 8–17 лет", num: "02", tone: s.elPink, lang: "fr" },
  { sym: "45", name: "минут", note: "2 раза в неделю", num: "03", tone: s.elLime, lang: undefined },
] as const;

const TICKER = [
  "Преподаватель РУДН",
  "10 лет стажа",
  "Английский и французский",
  "Дети 5–8 и 8–17 лет",
  "Группы 5–7 человек",
  "45 минут · 2 раза в неделю",
  "Китай-город и онлайн",
  "Все занятия веду сама",
  "Пробное −30%",
];

/** Кто что видит в кабинете — ровно то, что кабинет показывает. */
const ROLES = [
  {
    who: "Родитель",
    tone: s.tileViolet,
    points: ["Заявки на пробное", "Группа, расписание и уровень по тесту", "Задания на дом и замечания", "Оплата и напоминания"],
  },
  {
    who: "Ученик",
    tone: s.tilePink,
    points: ["Своя группа и расписание", "Уровень по тесту", "Задания на дом — и в Telegram", "Похвала"],
  },
  {
    who: "Преподаватель",
    tone: s.tileSky,
    points: ["Заявки с сайта", "Ученики, группы и приглашения", "Задания группе или одному", "Оплата и напоминания"],
  },
] as const;

/**
 * Сайт Дарьи — «Лаборатория».
 *
 * Дизайн взят с эталона владельца — MedAcademy, вариант «Лаборатория»:
 * ультрафиолет #191337, кислотный лайм #cff846, лиловый, розовый и голубой
 * для плиток, Dela Gothic One капслоком и Commissioner для текста, крупные
 * скругления и таблетки. Первый экран — «таблица элементов» (En, Fr, 45),
 * за ней плывут буквы двух языков; бегущая лаймовая строка; разминка «5
 * слов» вместо экспресс-теста; вкладки программ вместо «Выбери формулу».
 *
 * Тексты — только её слова (facts.ts) и от первого лица. Запись — в базу на
 * нашем сервере и ей в Telegram. Кабинет — для неё, родителя и ученика.
 */
export function Site() {
  return (
    <Shell home>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(homeGraph()) }} />
      <main>
        <section id="top" className={s.hero} aria-labelledby="lab-h1">
          <Letters className={s.letters} />
          <div className={s.heroInner}>
            <div className={s.heroText}>
              <p className={s.pill}>
                <span className={s.metro} aria-hidden="true">
                  М
                </span>
                Китай-город · и онлайн
              </p>
              <h1 id="lab-h1" className={s.display1}>
                Английский <span className={s.plus}>и</span> французский <span className={s.lime}>для детей в Москве</span>
              </h1>
              <p className={s.heroLead}>
                Я — {TEACHER.name}, преподаватель {TEACHER.universityShort} со стажем {TEACHER.experienceYears} лет. Учу
                детей 5–8 и 8–17 лет в группах по 5–7 человек — очно и онлайн.
              </p>
              <div className={s.actions}>
                <a className={`${s.btn} ${s.btnBig}`} href="#zapis">
                  Пробное занятие −30%
                </a>
                <a className={`${s.btn} ${s.btnGhost} ${s.btnBig}`} href="#razminka">
                  Разминка «5 слов»
                </a>
              </div>
              <ul className={s.elements}>
                {ELEMENTS.map((el, i) => (
                  <li key={el.sym} className={`${s.element} ${el.tone}`} data-reveal="" style={at(i)}>
                    <span className={s.elNum}>{el.num}</span>
                    <span className={s.elSym} lang={el.lang}>
                      {el.sym}
                    </span>
                    <span className={s.elName}>
                      <span lang={el.lang}>{el.name}</span>
                      <span className={s.elNote}>{el.note}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <div className={s.heroPhoto}>
              <div className={s.photoCard}>
                <Image
                  src={PHOTOS.kangol.cut}
                  alt={PHOTOS.kangol.alt}
                  width={CUTS.kangol.width}
                  height={CUTS.kangol.height}
                  priority
                  sizes="(min-width: 1024px) 34vw, 80vw"
                />
              </div>
              <span className={`${s.sticker} ${s.stickerLime}`}>{TEACHER.universityShort}</span>
              <span className={`${s.sticker} ${s.stickerPink}`}>{TEACHER.experienceYears} лет стажа</span>
            </div>
          </div>
        </section>

        <div className={s.ticker} aria-label="Коротко обо мне">
          <ul className={s.marquee}>
            {[...TICKER, ...TICKER].map((item, i) => (
              <li key={i} aria-hidden={i >= TICKER.length || undefined}>
                {item}
                <span className={s.tickerDot} aria-hidden="true">
                  ✦
                </span>
              </li>
            ))}
          </ul>
        </div>

        <section className={s.section} aria-labelledby="lab-meet">
          <div className={s.meet}>
            <figure className={s.meetPhoto} data-reveal="">
              <Image src={PHOTOS.urban.cut} alt={PHOTOS.urban.alt} width={CUTS.urban.width} height={CUTS.urban.height} sizes="(min-width: 1024px) 36vw, 86vw" />
            </figure>
            <div>
              <p className={s.eyebrow}>Знакомство</p>
              <h2 id="lab-meet" className={s.display2}>
                Здравствуйте, я {TEACHER.firstName}
              </h2>
              <p className={s.meetName}>{TEACHER.fullName}</p>
              <ul className={s.checks}>
                <li>{TEACHER.university}.</li>
                <li>Мой педагогический стаж — {TEACHER.experienceYears} лет.</li>
                <li>Мои авторские методики — для каждого возраста своя.</li>
              </ul>
              <blockquote className={s.quote}>{QUOTES.mother}</blockquote>
            </div>
          </div>
        </section>

        <section className={s.section} aria-labelledby="lab-asks">
          <Head id="lab-asks" kicker="Запросы" title="С чем ко мне приходят родители" />
          <RequestList s={s} />
        </section>

        <section id="programmy" className={s.light} aria-labelledby="lab-programs">
          <div className={s.lightInner}>
            <p className={s.eyebrowDeep}>Программы</p>
            <h2 id="lab-programs" className={s.display2}>
              Выберите программу
            </h2>
            <Programs />
            <ul className={s.landingLinks}>
              {LANDINGS.map((l) => (
                <li key={l.slug}>
                  <a href={`/maximova/${l.slug}`}>{l.h1}</a>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className={s.section} aria-labelledby="lab-lesson">
          <Head id="lab-lesson" kicker={RHYTHM.line} title="Что происходит за 45 минут" note={RHYTHM.why} />
          <LessonSteps s={s} />
        </section>

        <section id="razminka" className={s.section} aria-labelledby="lab-quiz">
          <div className={s.split}>
            <div>
              <p className={s.eyebrow}>Разминка</p>
              <h2 id="lab-quiz" className={s.display2}>
                5 слов. Минута. Без регистрации.
              </h2>
              <p className={s.headNote}>Сыграйте вместе с ребёнком: английский и французский вперемешку.</p>
            </div>
            <div className={s.card}>
              <Quiz />
            </div>
          </div>
        </section>

        <section id="ceny" className={s.section} aria-labelledby="lab-prices">
          <Head id="lab-prices" kicker="Цены" title="Стоимость — открыто" note="Цены на сайте — те же, что при записи." />
          <PriceList s={s} />
          <h3 className={s.subTitle}>Без сюрпризов</h3>
          <PlainList s={s} />
        </section>

        <section className={s.section} aria-labelledby="lab-trial">
          <div className={s.trial} data-reveal="">
            <span className={s.trialStamp} aria-hidden="true">
              −30%
            </span>
            <p className={s.eyebrowInk}>Пробное</p>
            <h2 id="lab-trial" className={s.display2}>
              {TRIAL.title}
            </h2>
            <TrialPoints s={s} />
            <a className={s.btnInk} href="#zapis">
              Записаться на пробное
            </a>
          </div>
        </section>

        <section className={s.section} aria-labelledby="lab-rule">
          <div className={s.note} data-reveal="">
            <h2 id="lab-rule" className={s.noteTitle}>
              Про домашние задания
            </h2>
            <p className={s.noteQuote}>{QUOTES.homework}</p>
          </div>
        </section>

        <section className={s.section} aria-labelledby="lab-cabinet">
          <Head
            id="lab-cabinet"
            kicker="Кабинет"
            title={DIARY.title}
            note="Вход — через Telegram, без паролей. Каждый видит своё: родитель — дневник ребёнка, ученик — свои задания."
          />
          <ul className={s.roles}>
            {ROLES.map((role, i) => (
              <li key={role.who} className={`${s.role} ${role.tone}`} data-reveal="" style={at(i)}>
                <p className={s.roleWho}>{role.who}</p>
                <ul>
                  {role.points.map((p) => (
                    <li key={p}>{p}</li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
          <a className={`${s.btn} ${s.btnGhost}`} href="/maximova/kabinet">
            Войти в кабинет через Telegram
          </a>
        </section>

        <section className={s.section} aria-labelledby="lab-moms">
          <div className={s.moms}>
            <figure className={s.momsPhoto}>
              <Image src={PHOTOS.bench.cut} alt={PHOTOS.bench.alt} width={CUTS.bench.width} height={CUTS.bench.height} sizes="(min-width: 1024px) 30vw, 80vw" />
            </figure>
            <div data-reveal="">
              <p className={s.eyebrow}>Для мам</p>
              <h2 id="lab-moms" className={s.display2}>
                {MOMS_COURSE.title}
              </h2>
              <p className={s.headNote}>Научу, как воспитать билингва в русскоязычной семье с нуля, сохраняя культуру и культурный код.</p>
              <p className={s.momsFacts}>
                {MOMS_DETAILS.format} · {MOMS_DETAILS.line}
              </p>
              <MomsLink className={s.btn} />
            </div>
          </div>
        </section>

        <section className={s.section} aria-labelledby="lab-goal">
          <div className={s.goal} data-reveal="">
            <h2 id="lab-goal" className={s.eyebrow}>
              На что рассчитана моя программа
            </h2>
            <p className={s.goalQuote}>{QUOTES.goal}</p>
            <p className={s.sign}>— {TEACHER.firstName}</p>
          </div>
          <h3 className={s.subTitle}>Что вы увидите по ходу занятий</h3>
          <ResultList s={s} />
        </section>

        <section id="voprosy" className={s.section} aria-labelledby="lab-faq">
          <Head id="lab-faq" kicker="Вопросы" title="Вопросы родителей" note="Не нашли ответ — напишите мне, контакты внизу страницы." />
          <FaqList s={s} />
        </section>

        <BookBlock>
          <Later s={s} />
        </BookBlock>
      </main>
    </Shell>
  );
}
