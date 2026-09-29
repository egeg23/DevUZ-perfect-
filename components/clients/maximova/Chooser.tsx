import Image from "next/image";

import { TEACHER } from "@/content/clients/maximova/facts";

import { Credit } from "./Credit";
import s from "./chooser.module.css";

const VARIANTS = [
  {
    href: "/maximova/a",
    letter: "A",
    name: "Кино",
    shot: "/clients/maximova/previews/a.webp",
    what: "Тёмный зал и крупные планы её фотографий. Шесть «сцен», у каждой свой монтажный приём: шторка, слово за словом, наводка фокуса, счётчик плёнки, раздвижка кадра, титры.",
    for: "Строгий, «взрослый» тон: доверие через РУДН и стаж, принцип про домашку — крупно.",
  },
  {
    href: "/maximova/b",
    letter: "B",
    name: "Стекло",
    shot: "/clients/maximova/previews/b.webp",
    what: "Светлая страница, матовое стекло поверх ярких фигур. Язык выбирается на первом экране — и страница меняет цвет: синий для английского, коралловый для французского.",
    for: "Современно и легко, как приложение: плитки с фактами, циферблат из 45 точек, упругие движения.",
  },
  {
    href: "/maximova/c",
    letter: "C",
    name: "Две страны",
    shot: "/clients/maximova/previews/c.webp",
    what: "Бумага детской книги и параллакс: Лондон и Париж, нарисованные кодом, едут с разной скоростью. Открытка с печатью РУДН, паспорта языков, самолётик между возрастами, часы до 45 минут.",
    for: "Тепло и по-детски, но без сюсюканья: про два языка и две культуры — как в её семье.",
  },
] as const;

/** Страница выбора: три прототипа рядом, чтобы владелец и Дарья выбрали один. */
export function Chooser() {
  return (
    <div className={s.page}>
      <header className={s.head}>
        <p className={s.kicker}>Сайт школы · этап 1</p>
        <h1 className={s.title}>{TEACHER.name}: три варианта сайта</h1>
        <p className={s.lead}>
          Один и тот же текст — только её собственные слова — в трёх разных подачах. Фото — без фона. Откройте каждый с телефона и
          выберите один: его и будем достраивать до полного сайта.
        </p>
      </header>
      <main className={s.grid}>
        {VARIANTS.map((v) => (
          <a key={v.href} href={v.href} className={s.card}>
            <span className={s.shot}>
              <Image src={v.shot} alt={`Вариант ${v.letter} «${v.name}» — первый экран на телефоне`} fill sizes="(min-width: 900px) 30vw, 90vw" />
            </span>
            <span className={s.body}>
              <span className={s.letter}>{v.letter}</span>
              <span className={s.name}>{v.name}</span>
              <span className={s.text}>{v.what}</span>
              <span className={s.for}>{v.for}</span>
              <span className={s.open}>Открыть вариант {v.letter}</span>
            </span>
          </a>
        ))}
      </main>
      <footer className={s.footer}>
        <p>
          Цены, формат, пробное занятие и контакты — из ответов Дарьи. Кнопка записи открывает её Telegram с готовым
          сообщением. Дипломы и отзывы родителей появятся в конце страницы, когда Дарья их пришлёт.
        </p>
        <Credit />
      </footer>
    </div>
  );
}
