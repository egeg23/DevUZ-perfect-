import type { ReactNode } from "react";

import { CONTACTS, FORMAT, TEACHER, phoneUrl, telegramUrl, whatsappUrl } from "@/content/clients/maximova/facts";

import { BookingForm } from "../BookingForm";
import { Credit } from "../Credit";
import { Motion } from "../Motion";
import s from "./lab.module.css";

/**
 * Каркас «Лаборатории»: шапка-таблетка, подвал, кнопка записи внизу
 * телефона. Общий у главной и у посадочных страниц — чтобы человек,
 * пришедший из поиска на «французский для детей», видел тот же сайт.
 */
export function Shell({ children, home = false }: { children: ReactNode; home?: boolean }) {
  const at = home ? "" : "/maximova";
  return (
    <div className={s.page}>
      <Motion />
      <header className={s.bar}>
        <div className={s.barInner}>
          <a className={s.brand} href={home ? "#top" : "/maximova"} aria-label={`${TEACHER.name} — на главную`}>
            <span className={s.brandMark} aria-hidden="true">
              DM
            </span>
            <span className={s.brandName}>{TEACHER.name}</span>
          </a>
          <nav className={s.nav} aria-label="Разделы">
            <a href={`${at}#programmy`}>Программы</a>
            <a href={`${at}#ceny`}>Цены</a>
            <a href={`${at}#voprosy`}>Вопросы</a>
            <a href="/maximova/kabinet">Кабинет</a>
          </nav>
          <a className={`${s.btn} ${s.barCta}`} href="#zapis">
            Пробное −30%
          </a>
        </div>
      </header>

      {children}

      <footer className={s.footer}>
        <div className={s.footerInner}>
          <p className={s.footerName}>{TEACHER.fullName}</p>
          <p className={s.muted}>{TEACHER.role}. {FORMAT.where}, можно онлайн.</p>
          <p className={s.footerLinks}>
            <a href="/maximova/kabinet">Личный кабинет</a>
            <a href="/maximova/privacy">Политика обработки данных</a>
            <a href={`https://t.me/${CONTACTS.telegram}`}>Telegram @{CONTACTS.telegram}</a>
            <a href={phoneUrl}>{CONTACTS.phoneLabel}</a>
          </p>
          <Credit className={s.credit} />
        </div>
      </footer>

      <a className={s.dock} href="#zapis" data-dock="">
        Пробное занятие −30%
      </a>
    </div>
  );
}

/** Запись: форма и контакты на лаймовой плашке — как «Контакты» эталона. */
export function BookBlock({ language, children }: { language?: string; children?: ReactNode }) {
  return (
    <section id="zapis" className={s.bookWrap} aria-labelledby="lab-book" data-dock-hide="">
      <div className={s.book}>
        <div className={s.bookText}>
          <p className={s.eyebrowInk}>Запись</p>
          <h2 id="lab-book" className={s.display2}>
            Пробное занятие −30%
          </h2>
          <p className={s.bookLead}>Заполните за минуту — я получу заявку в Telegram и свяжусь с вами.</p>
          <ul className={s.contactTiles}>
            <li>
              <span className={s.tileLabel}>Telegram</span>
              <a href={telegramUrl("Здравствуйте, Дарья! Хочу записать ребёнка на пробное занятие.")} target="_blank" rel="noopener noreferrer">
                @{CONTACTS.telegram}
              </a>
            </li>
            <li>
              <span className={s.tileLabel}>Телефон, WhatsApp, Max</span>
              <a href={phoneUrl}>{CONTACTS.phoneLabel}</a>
              <a className={s.tileSmall} href={whatsappUrl("Здравствуйте, Дарья! Хочу записать ребёнка на пробное занятие.")} target="_blank" rel="noopener noreferrer">
                Написать в WhatsApp
              </a>
            </li>
            <li>
              <span className={s.tileLabel}>Где</span>
              <span>
                <span className={s.metro} aria-hidden="true">
                  М
                </span>{" "}
                {FORMAT.metro}
              </span>
              <span className={s.tileSmall}>{FORMAT.online}</span>
            </li>
          </ul>
          {children}
        </div>
        <div className={s.formCard}>
          <BookingForm
            language={language}
            s={{
              form: s.form,
              group: s.bookGroup,
              label: s.label,
              options: s.options,
              option: s.option,
              optionOn: s.optionOn,
              radio: s.radio,
              field: s.field,
              input: s.input,
              hint: s.hint,
              error: s.error,
              more: s.more,
              trap: s.trap,
              consent: s.consent,
              submit: s.submit,
              done: s.done,
              doneTitle: s.doneTitle,
            }}
          />
        </div>
      </div>
    </section>
  );
}

/** Заголовок блока: надзаголовок лаймом и слово поперёк экрана. */
export function Head({ id, kicker, title, note }: { id: string; kicker: string; title: ReactNode; note?: ReactNode }) {
  return (
    <div className={s.head} data-reveal="">
      <p className={s.eyebrow}>{kicker}</p>
      <h2 id={id} className={s.display2}>
        {title}
      </h2>
      {note ? <p className={s.headNote}>{note}</p> : null}
    </div>
  );
}
