"use client";

import { useState } from "react";

import s from "./glass.module.css";

const LANGS = [
  { id: "en", label: "Английский", hello: "Hello!" },
  { id: "fr", label: "Французский", hello: "Bonjour !" },
] as const;

/**
 * Переключатель языка на первом экране: капля стекла переезжает к выбранному
 * языку, приветствие сменяется, и вся страница меняет акцентный цвет.
 *
 * Капля едет transform'ом, приветствия меняются opacity — ни одного свойства,
 * которое заставило бы браузер пересчитать вёрстку.
 */
export function Hello() {
  const [lang, setLang] = useState<(typeof LANGS)[number]["id"]>("en");

  const pick = (id: (typeof LANGS)[number]["id"]) => {
    setLang(id);
    document.querySelector<HTMLElement>("[data-glass]")?.setAttribute("data-lang", id);
  };

  return (
    <div className={s.hello}>
      <p className={s.helloWords} aria-live="polite">
        {LANGS.map((item) => (
          <span key={item.id} lang={item.id} className={s.helloWord} data-on={lang === item.id ? "" : undefined}>
            {item.hello}
          </span>
        ))}
      </p>
      <div className={s.switch} role="group" aria-label="Язык занятий">
        <span className={s.drop} data-at={lang} aria-hidden="true" />
        {LANGS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={s.switchOption}
            aria-pressed={lang === item.id}
            onClick={() => pick(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}
