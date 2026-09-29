"use client";

import { useState } from "react";

import { AGES, CONTACT, SCHOOL, bookingText, contactUrl } from "@/content/clients/maximova/facts";

/** Классы оформления: у каждого прототипа своя одежда, устройство одно. */
export type BookSkin = {
  root?: string;
  group?: string;
  label?: string;
  options?: string;
  option?: string;
  optionOn?: string;
  message?: string;
  button?: string;
  note?: string;
};

/**
 * Запись на знакомство: язык, возраст — и готовое сообщение Дарье.
 *
 * Главное действие одно и работает по нажатию. Когда контакт Дарьи появится
 * в facts.ts, кнопка откроет её мессенджер с этим текстом. Пока его нет,
 * кнопка честно показывает текст и говорит, что контакт ещё не подключён:
 * форма, которая делает вид, что отправила, — обман.
 */
export function Book({ skin, cta = "Написать Дарье" }: { skin: BookSkin; cta?: string }) {
  const [language, setLanguage] = useState<string>(SCHOOL.languages[0]);
  const [age, setAge] = useState<string>(AGES[0].range);
  const [shown, setShown] = useState(false);
  const [copied, setCopied] = useState(false);

  const text = bookingText(language, age);
  const url = contactUrl(CONTACT, text);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className={skin.root}>
      <fieldset className={skin.group}>
        <legend className={skin.label}>Язык</legend>
        <div className={skin.options}>
          {SCHOOL.languages.map((item) => (
            <button
              key={item}
              type="button"
              aria-pressed={language === item}
              className={`${skin.option ?? ""} ${language === item ? (skin.optionOn ?? "") : ""}`}
              onClick={() => setLanguage(item)}
            >
              {item}
            </button>
          ))}
        </div>
      </fieldset>
      <fieldset className={skin.group}>
        <legend className={skin.label}>Возраст ребёнка</legend>
        <div className={skin.options}>
          {AGES.map((item) => (
            <button
              key={item.id}
              type="button"
              aria-pressed={age === item.range}
              className={`${skin.option ?? ""} ${age === item.range ? (skin.optionOn ?? "") : ""}`}
              onClick={() => setAge(item.range)}
            >
              {item.range}
            </button>
          ))}
        </div>
      </fieldset>

      {url ? (
        <a className={skin.button} href={url} target="_blank" rel="noopener noreferrer">
          {cta}
        </a>
      ) : (
        <button type="button" className={skin.button} onClick={() => setShown(true)} aria-expanded={shown}>
          {cta}
        </button>
      )}

      {shown && !url ? (
        <div className={skin.note} role="status">
          <p>Сообщение, которое уйдёт Дарье:</p>
          <p className={skin.message}>«{text}»</p>
          <p>
            Контакт для записи ещё не подключён — Дарья выберет, куда ей удобнее получать сообщения.{" "}
            <button type="button" onClick={copy}>
              {copied ? "Скопировано" : "Скопировать текст"}
            </button>
          </p>
        </div>
      ) : null}
    </div>
  );
}
