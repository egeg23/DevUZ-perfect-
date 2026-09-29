"use client";

import { useState, type FormEvent } from "react";

import { AGES, CONTACTS, SCHOOL, bookingText, phoneUrl, telegramUrl, whatsappUrl } from "@/content/clients/maximova/facts";

/** Классы оформления — у сайта свои, устройство формы одно. */
export type FormSkin = Record<string, string | undefined>;

const FORMATS = ["В группе", "Индивидуально"] as const;

type Errors = Record<string, string>;
type Done = { id: number; notified: boolean };

/**
 * Онлайн-запись на пробное занятие.
 *
 * Что проверено по ui-ux-pro-max и marketing-cro:
 * - у каждого поля видимая подпись, а не только подсказка внутри;
 * - ошибка — под своим полем, а не списком сверху;
 * - полей минимум: язык, возраст, формат, как обращаться, контакт. Время и
 *   комментарий — по желанию и свёрнуты;
 * - кнопки выбора крупные (от 48 px), с промежутком — под палец;
 * - после отправки — понятный итог: номер заявки и что будет дальше.
 */
export function BookingForm({ s }: { s: FormSkin }) {
  const [language, setLanguage] = useState<string>(SCHOOL.languages[0]);
  const [age, setAge] = useState<string>(AGES[0].range);
  const [format, setFormat] = useState<string>(FORMATS[0]);
  const [errors, setErrors] = useState<Errors>({});
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState<Done | null>(null);

  const message = bookingText(language, age, format);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setSending(true);
    setErrors({});
    try {
      const response = await fetch("/api/maximova/booking", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          language,
          age,
          format,
          parentName: data.get("parentName"),
          contact: data.get("contact"),
          preferredTime: data.get("preferredTime"),
          comment: data.get("comment"),
          consent: data.get("consent") === "on",
          website: data.get("website"),
        }),
      });
      const result = (await response.json().catch(() => ({}))) as {
        ok?: boolean;
        id?: number;
        notified?: boolean;
        errors?: Errors;
      };
      if (result.ok && result.id) setDone({ id: result.id, notified: Boolean(result.notified) });
      else setErrors(result.errors ?? { form: "Не получилось отправить. Напишите Дарье в Telegram — ссылка ниже." });
    } catch {
      setErrors({ form: "Нет связи. Проверьте интернет или напишите Дарье в Telegram — ссылка ниже." });
    } finally {
      setSending(false);
    }
  };

  const choice = (name: string, legend: string, items: readonly string[], value: string, set: (v: string) => void) => (
    <fieldset className={s.group}>
      <legend className={s.label}>{legend}</legend>
      <div className={s.options} role="radiogroup" aria-label={legend}>
        {items.map((item) => (
          <label key={item} className={`${s.option ?? ""} ${value === item ? (s.optionOn ?? "") : ""}`}>
            <input
              type="radio"
              name={name}
              value={item}
              checked={value === item}
              onChange={() => set(item)}
              className={s.radio}
            />
            {item}
          </label>
        ))}
      </div>
    </fieldset>
  );

  if (done) {
    return (
      <div className={s.done} role="status">
        <p className={s.doneTitle}>Заявка № {done.id} у Дарьи</p>
        {done.notified ? (
          <p>Дарья получила её в Telegram и свяжется с вами по указанному контакту, чтобы договориться о пробном.</p>
        ) : (
          <p>
            Заявка сохранена, Дарья увидит её в кабинете. Чтобы быстрее —{" "}
            <a href={telegramUrl(message)} target="_blank" rel="noopener noreferrer">
              напишите ей в Telegram
            </a>
            .
          </p>
        )}
        <p>
          Хотите видеть заявку и дневник ребёнка? <a href="/maximova/kabinet">Войдите в кабинет через Telegram</a>.
        </p>
      </div>
    );
  }

  return (
    <form
      className={s.form}
      onSubmit={submit}
      noValidate
      onInput={(event) => {
        // Исправил поле — его ошибка уходит сразу, а не после следующей отправки.
        const name = (event.target as HTMLInputElement).name;
        if (name && errors[name]) setErrors(({ [name]: _gone, ...rest }) => rest);
      }}
    >
      {choice("language", "Язык", SCHOOL.languages, language, setLanguage)}
      {choice(
        "age",
        "Возраст ребёнка",
        AGES.map((a) => a.range),
        age,
        setAge,
      )}
      {choice("format", "Формат", FORMATS, format, setFormat)}

      <div className={s.field}>
        <label className={s.label} htmlFor="mx-name">
          Как к вам обращаться
        </label>
        <input
          id="mx-name"
          name="parentName"
          className={s.input}
          autoComplete="name"
          required
          aria-invalid={Boolean(errors.parentName)}
          aria-describedby={errors.parentName ? "mx-name-err" : undefined}
        />
        {errors.parentName ? (
          <p id="mx-name-err" className={s.error}>
            {errors.parentName}
          </p>
        ) : null}
      </div>

      <div className={s.field}>
        <label className={s.label} htmlFor="mx-contact">
          Телефон или ник в Telegram
        </label>
        <input
          id="mx-contact"
          name="contact"
          className={s.input}
          autoComplete="tel"
          inputMode="tel"
          required
          aria-invalid={Boolean(errors.contact)}
          aria-describedby={errors.contact ? "mx-contact-err" : "mx-contact-hint"}
        />
        {errors.contact ? (
          <p id="mx-contact-err" className={s.error}>
            {errors.contact}
          </p>
        ) : (
          <p id="mx-contact-hint" className={s.hint}>
            Например, +7 999 123-45-67 или @nickname
          </p>
        )}
      </div>

      <details className={s.more}>
        <summary>Удобное время и комментарий — по желанию</summary>
        <div className={s.field}>
          <label className={s.label} htmlFor="mx-time">
            Когда удобно заниматься
          </label>
          <input id="mx-time" name="preferredTime" className={s.input} maxLength={120} />
          <p className={s.hint}>Расписание подбирается по итогам вступительного теста.</p>
        </div>
        <div className={s.field}>
          <label className={s.label} htmlFor="mx-comment">
            Комментарий
          </label>
          <textarea id="mx-comment" name="comment" className={s.input} rows={3} maxLength={500} />
        </div>
      </details>

      {/* Ловушка для ботов: людям не видна и не читается вслух. */}
      <div className={s.trap} aria-hidden="true">
        <label htmlFor="mx-website">Сайт</label>
        <input id="mx-website" name="website" tabIndex={-1} autoComplete="off" />
      </div>

      <div className={s.field}>
        <label className={s.consent}>
          <input type="checkbox" name="consent" required aria-invalid={Boolean(errors.consent)} />
          <span>
            Согласен(на) на обработку персональных данных по{" "}
            <a href="/maximova/privacy" target="_blank">
              политике
            </a>
            .
          </span>
        </label>
        {errors.consent ? <p className={s.error}>{errors.consent}</p> : null}
      </div>

      {errors.form ? (
        <p className={s.error} role="alert">
          {errors.form}
        </p>
      ) : null}

      <button type="submit" className={s.submit} disabled={sending}>
        {sending ? "Отправляем…" : "Записаться на пробное −30%"}
      </button>

      <p className={s.hint}>
        Или напишите Дарье сами:{" "}
        <a href={telegramUrl(message)} target="_blank" rel="noopener noreferrer">
          Telegram
        </a>
        ,{" "}
        <a href={whatsappUrl(message)} target="_blank" rel="noopener noreferrer">
          WhatsApp
        </a>
        , Max или звонок <a href={phoneUrl}>{CONTACTS.phoneLabel}</a>
      </p>
    </form>
  );
}
