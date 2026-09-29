import type { CSSProperties } from "react";

import {
  CONTACTS,
  FAQ,
  FORMAT,
  LESSON,
  MISSING,
  MOMS_TEXT,
  PRICES,
  TRIAL,
  phoneUrl,
  telegramUrl,
} from "@/content/clients/maximova/facts";

/**
 * Блоки, у которых устройство общее, а одежда и движение — свои у каждого
 * прототипа. Классы приходят снаружи; `data-reveal` и `--i` ставятся здесь,
 * а как именно блок появляется, решает css прототипа.
 */
type Skin = Record<string, string | undefined>;
const at = (i: number) => ({ "--i": i }) as CSSProperties;

/** Занятие по шагам: пять шагов в её порядке. */
export function LessonSteps({ s }: { s: Skin }) {
  return (
    <>
      <ol className={s.steps}>
        {LESSON.steps.map((step, i) => (
          <li key={step.title} className={s.step} data-reveal="" style={at(i)}>
            <span className={s.stepNo} aria-hidden="true">
              {String(i + 1).padStart(2, "0")}
            </span>
            <span className={s.stepTitle}>{step.title}</span>
            <span className={s.stepNote}>{step.note}</span>
          </li>
        ))}
      </ol>
      <p className={s.stepsPlan}>{LESSON.plan}</p>
    </>
  );
}

/** Цены: четыре карточки, числа — её. */
export function PriceList({ s }: { s: Skin }) {
  const items = [PRICES.group, PRICES.season, PRICES.individual, PRICES.trial];
  return (
    <ul className={s.prices}>
      {items.map((item, i) => (
        <li key={item.title} className={s.price} data-reveal="" style={at(i)}>
          <span className={s.priceTitle}>{item.title}</span>
          <span className={s.priceValue}>{item.price}</span>
          <span className={s.priceUnit}>{item.unit}</span>
        </li>
      ))}
    </ul>
  );
}

/** Пробное: три пункта — что на нём происходит. */
export function TrialPoints({ s }: { s: Skin }) {
  return (
    <ul className={s.trialList}>
      {TRIAL.points.map((point, i) => (
        <li key={point} className={s.trialItem} data-reveal="" style={at(i)}>
          {point}
        </li>
      ))}
    </ul>
  );
}

/** Где: метро и онлайн, контакты строкой. */
export function WhereBlock({ s }: { s: Skin }) {
  return (
    <div className={s.where}>
      <p className={s.whereMain}>
        <span className={s.metro} aria-hidden="true">
          М
        </span>
        {FORMAT.where}
      </p>
      <p className={s.whereNote}>
        {FORMAT.online}. {FORMAT.groups}; {FORMAT.individual.toLowerCase()}.
      </p>
      <p className={s.whereNote}>
        Telegram <a href={`https://t.me/${CONTACTS.telegram}`}>@{CONTACTS.telegram}</a> · WhatsApp, Max и телефон{" "}
        <a href={phoneUrl}>{CONTACTS.phoneLabel}</a>
      </p>
    </div>
  );
}

/** Запись на курс для мам — отдельным текстом, не тем, что про ребёнка. */
export function MomsLink({ className }: { className?: string }) {
  return (
    <a className={className} href={telegramUrl(MOMS_TEXT)} target="_blank" rel="noopener noreferrer">
      Записаться на курс для мам
    </a>
  );
}

/** Вопросы родителей — `details`, чтобы работало и без скрипта. */
export function FaqList({ s }: { s: Skin }) {
  return (
    <div className={s.faq}>
      {FAQ.map((item, i) => (
        <details key={item.q} className={s.faqItem} data-reveal="" style={at(i)}>
          <summary>{item.q}</summary>
          <p>{item.a}</p>
        </details>
      ))}
    </div>
  );
}

/** В конце страницы — то, что Дарья пришлёт позже. */
export function Later({ s }: { s: Skin }) {
  return (
    <div className={s.later}>
      <p className={s.missing} data-missing="">
        {MISSING.diplomas}
      </p>
      <p className={s.missing} data-missing="">
        {MISSING.reviews}
      </p>
    </div>
  );
}
