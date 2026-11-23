"use client";

import { useId, useState } from "react";

import { LEADGEN_TARIFFS, QUOTE_MAX, QUOTE_MIN, QUOTE_STEP, quoteFor, rub } from "@/content/leadgen";

import s from "./calc.module.css";

/**
 * Ползунок расчёта (владелец, 23.11.2026: «Сделай интерактивный ползунок с
 * расчетом цены и количеством лидов»). Человек двигает, сколько лидов ему
 * нужно, и видит тариф, цену, «от и до» по договору и цену лида — всё из
 * тарифов `content/leadgen.ts`, своих цен между тарифами нет.
 */
export function LeadgenCalc() {
  const id = useId();
  const [leads, setLeads] = useState(70);
  const { tariff, perLead } = quoteFor(leads);
  const fill = ((leads - QUOTE_MIN) / (QUOTE_MAX - QUOTE_MIN)) * 100;
  const marks = LEADGEN_TARIFFS.filter((t) => t.leads && t.leads[1] <= QUOTE_MAX).map((t) => ({
    key: t.key,
    at: ((t.leads![1] - QUOTE_MIN) / (QUOTE_MAX - QUOTE_MIN)) * 100,
  }));

  function pick() {
    const select = document.querySelector<HTMLSelectElement>('#start select[name="tariff"]');
    if (select) select.value = tariff.name;
  }

  return (
    <div className={`box-glass ${s.calc}`}>
      <div className={s.grid}>
        <div>
          <label htmlFor={id} className={s.label}>
            Сколько квалифицированных лидов нужно
          </label>
          <output htmlFor={id} className={s.count} aria-live="polite">
            {leads >= QUOTE_MAX ? `${QUOTE_MAX}+` : leads}
            <span> лидов</span>
          </output>
          <div className={s.rail}>
            <input
              id={id}
              type="range"
              min={QUOTE_MIN}
              max={QUOTE_MAX}
              step={QUOTE_STEP}
              value={leads}
              onChange={(e) => setLeads(Number(e.target.value))}
              className={s.range}
              style={{ "--fill": `${fill}%` } as React.CSSProperties}
              aria-valuetext={`${leads} лидов, тариф ${tariff.name}`}
            />
            <div className={s.marks} aria-hidden="true">
              {marks.map((m) => (
                <i key={m.key} style={{ left: `${m.at}%` }} />
              ))}
            </div>
          </div>
          <div className={s.scale} aria-hidden="true">
            <span>{QUOTE_MIN}</span>
            <span>{QUOTE_MAX}+</span>
          </div>
        </div>

        <div className={s.result} key={tariff.key}>
          <p className={s.tariff}>Тариф «{tariff.name}»</p>
          <p className={s.price}>{tariff.price === null ? "Договорная" : rub(tariff.price)}</p>
          {tariff.leads ? (
            <p className={s.line}>
              По договору от {tariff.leads[0]} до {tariff.leads[1]} лидов
            </p>
          ) : (
            <p className={s.line}>Объём под вас, на объёме скидки</p>
          )}
          {perLead !== null ? <p className={s.per}>≈ {rub(perLead)} за лида</p> : null}
          <p className={s.term}>Срок: {tariff.term}</p>
          <a href="#start" onClick={pick} className={`box-cta ${s.cta}`}>
            {tariff.price === null ? "Обсудить объём" : "Выбрать этот тариф"}
          </a>
        </div>
      </div>
    </div>
  );
}
