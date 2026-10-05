"use client";

import { useState } from "react";

import { telegramUrl } from "@/content/clients/maximova/facts";

import s from "./lab.module.css";

/**
 * Разминка «5 слов» — то, что у эталона было экспресс-тестом.
 *
 * Не вступительный тест и не оценка: уровень Дарья определяет на
 * тестировании перед договором. Это игра для ребёнка на минуту — проверить
 * пару слов на двух языках вместе с родителем. Ответ виден сразу, в конце —
 * счёт и предложение прийти на пробное.
 */
const WORDS = [
  { q: "Как по-английски «кошка»?", options: ["Dog", "Cat", "Cow"], a: 1, lang: "English" },
  { q: "Как по-французски «привет»?", options: ["Bonjour", "Merci", "Au revoir"], a: 0, lang: "Français" },
  { q: "Какого цвета «yellow»?", options: ["Синий", "Красный", "Жёлтый"], a: 2, lang: "English" },
  { q: "Что значит «merci»?", options: ["Спасибо", "Пожалуйста", "Пока"], a: 0, lang: "Français" },
  { q: "Сколько будет «two + three»?", options: ["Four", "Five", "Six"], a: 1, lang: "English" },
] as const;

export function Quiz() {
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const done = index >= WORDS.length;
  const item = WORDS[Math.min(index, WORDS.length - 1)];

  const choose = (option: number) => {
    if (picked !== null) return;
    setPicked(option);
    if (option === item.a) setScore((v) => v + 1);
  };

  if (done) {
    return (
      <div className={s.quizDone} aria-live="polite">
        <p className={s.quizScore}>
          {score} / {WORDS.length}
        </p>
        <p className={s.quizVerdict}>
          {score >= 4 ? "Отлично! На пробном проверим, что ещё знает ребёнок." : "Ничего страшного — с нуля начинать можно."}
        </p>
        <p className={s.muted}>Это игра, а не тест: уровень я определяю на тестировании перед договором.</p>
        <div className={s.actions}>
          <a className={s.btn} href="#zapis">
            Записаться на пробное
          </a>
          <button
            type="button"
            className={`${s.btn} ${s.btnGhost}`}
            onClick={() => {
              setIndex(0);
              setScore(0);
              setPicked(null);
            }}
          >
            Ещё раз
          </button>
        </div>
        <a
          className={s.quizShare}
          href={telegramUrl(`Здравствуйте, Дарья! Мы сыграли в «5 слов» на сайте: ${score} из ${WORDS.length}. Хотим на пробное занятие.`)}
          target="_blank"
          rel="noopener noreferrer"
        >
          Отправить результат мне в Telegram
        </a>
      </div>
    );
  }

  return (
    <div key={index} className={s.quizCard}>
      <div className={s.quizTop}>
        <span className={s.quizLang} lang={item.lang === "English" ? "en" : "fr"}>
          {item.lang}
        </span>
        <span className={s.muted}>
          {index + 1} / {WORDS.length}
        </span>
      </div>
      <p className={s.quizQ}>{item.q}</p>
      <div className={s.quizOptions}>
        {item.options.map((option, i) => {
          const state = picked === null ? "" : i === item.a ? s.right : i === picked ? s.wrong : "";
          return (
            <button key={option} type="button" className={`${s.chip} ${state}`} onClick={() => choose(i)} aria-disabled={picked !== null}>
              {option}
            </button>
          );
        })}
      </div>
      <div className={s.quizFoot} aria-live="polite">
        <p>{picked === null ? "" : picked === item.a ? "Верно!" : `Правильно: ${item.options[item.a]}`}</p>
        {picked !== null ? (
          <button
            type="button"
            className={s.btn}
            onClick={() => {
              setIndex(index + 1);
              setPicked(null);
            }}
          >
            {index + 1 < WORDS.length ? "Дальше" : "Результат"}
          </button>
        ) : null}
      </div>
    </div>
  );
}
