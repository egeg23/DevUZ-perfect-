"use client";

import { useState } from "react";

import {
  AGES,
  CONTACTS,
  SCHOOL,
  bookingText,
  phoneUrl,
  telegramUrl,
  whatsappUrl,
} from "@/content/clients/maximova/facts";

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

const FORMATS = ["В группе", "Индивидуально"] as const;

/**
 * Запись на пробное: язык, возраст, формат — и готовое сообщение Дарье.
 *
 * Главное действие одно — Telegram с этим текстом. WhatsApp и звонок —
 * строкой ниже, для тех, у кого Telegram нет: номер у Дарьи один.
 */
export function Book({ skin, cta = "Записаться на пробное" }: { skin: BookSkin; cta?: string }) {
  const [language, setLanguage] = useState<string>(SCHOOL.languages[0]);
  const [age, setAge] = useState<string>(AGES[0].range);
  const [format, setFormat] = useState<string>(FORMATS[0]);

  const text = bookingText(language, age, format);

  const choice = (legend: string, items: readonly string[], value: string, set: (v: string) => void) => (
    <fieldset className={skin.group}>
      <legend className={skin.label}>{legend}</legend>
      <div className={skin.options}>
        {items.map((item) => (
          <button
            key={item}
            type="button"
            aria-pressed={value === item}
            className={`${skin.option ?? ""} ${value === item ? (skin.optionOn ?? "") : ""}`}
            onClick={() => set(item)}
          >
            {item}
          </button>
        ))}
      </div>
    </fieldset>
  );

  return (
    <div className={skin.root}>
      {choice("Язык", SCHOOL.languages, language, setLanguage)}
      {choice(
        "Возраст ребёнка",
        AGES.map((a) => a.range),
        age,
        setAge,
      )}
      {choice("Формат", FORMATS, format, setFormat)}

      <p className={skin.message}>«{text}»</p>

      <a className={skin.button} href={telegramUrl(text)} target="_blank" rel="noopener noreferrer">
        {cta} в Telegram
      </a>

      <p className={skin.note}>
        Нет Telegram?{" "}
        <a href={whatsappUrl(text)} target="_blank" rel="noopener noreferrer">
          WhatsApp
        </a>
        , Max или звонок: <a href={phoneUrl}>{CONTACTS.phoneLabel}</a>
      </p>
    </div>
  );
}
