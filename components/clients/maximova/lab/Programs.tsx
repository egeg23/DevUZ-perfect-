"use client";

import { useState } from "react";

import { AGES, MOMS_COURSE, MOMS_DETAILS, PRICES, RHYTHM, RULES, TEACHER } from "@/content/clients/maximova/facts";
import { MOMS_TEXT, telegramUrl } from "@/content/clients/maximova/facts";

import { fit } from "./fit";
import s from "./lab.module.css";

/**
 * «Выбери формулу» эталона — здесь «выберите программу»: английский,
 * французский или курс для мам. Цифры на плитках — её: возраст, длительность,
 * размер группы, цена. Ссылка ведёт на посадочную страницу программы.
 *
 * Без скрипта видна первая вкладка; остальные программы всё равно доступны
 * по ссылкам «Подробнее» и в списке программ ниже.
 */
const TABS = [
  {
    id: "en",
    name: "Английский",
    word: "Hello",
    lang: "en",
    intro: `Английский для детей 5–8 и 8–17 лет — две авторские методики, своя для каждого возраста. ${RULES.grouping}`,
    href: "/maximova/angliyskiy-dlya-detey",
  },
  {
    id: "fr",
    name: "Французский",
    word: "Bonjour",
    lang: "fr",
    intro: `Французский для детей 5–8 и 8–17 лет — тоже с нуля, в группах по возрасту и уровню. ${RULES.test}`,
    href: "/maximova/francuzskiy-dlya-detey",
  },
  {
    id: "moms",
    name: "Для мам",
    word: "Bilingue",
    lang: "fr",
    intro: `${MOMS_COURSE.title}: ${MOMS_COURSE.line.charAt(0).toLowerCase()}${MOMS_COURSE.line.slice(1)} Я сама воспитываю двоих детей билингвами.`,
    href: "",
  },
] as const;

export function Programs() {
  const [active, setActive] = useState<(typeof TABS)[number]["id"]>("en");
  const tab = TABS.find((t) => t.id === active)!;
  const moms = tab.id === "moms";

  const tiles: [string, string, string][] = moms
    ? [
        ["Формат", MOMS_DETAILS.format, s.tileViolet],
        ["Занятий", String(MOMS_DETAILS.lessons), s.tilePink],
        ["За занятие", MOMS_DETAILS.price, s.tileSky],
        ["Ведёт", TEACHER.name, s.tileWhite],
      ]
    : [
        ["Возраст", AGES.map((a) => a.range.replace(" лет", "")).join(" и ") + " лет", s.tileViolet],
        ["Занятие", `${RHYTHM.minutes} минут`, s.tilePink],
        ["В неделю", `${RHYTHM.perWeek} раза`, s.tileSky],
        ["В группе", "5–7 детей", s.tileWhite],
      ];

  return (
    <div>
      <div role="tablist" aria-label="Программы" className={s.tabs}>
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            id={`tab-${t.id}`}
            aria-selected={active === t.id}
            aria-controls="programs-panel"
            className={active === t.id ? s.tabOn : s.tab}
            onClick={() => setActive(t.id)}
          >
            {t.name}
          </button>
        ))}
      </div>

      <div key={tab.id} id="programs-panel" role="tabpanel" aria-labelledby={`tab-${tab.id}`} className={s.program}>
        <div className={s.programMain}>
          <p className={s.programWord} lang={tab.lang} aria-hidden="true">
            {tab.word}
          </p>
          <h3 className={s.display3} style={fit(tab.name)}>
            {tab.name}
          </h3>
          <p className={s.programIntro}>{tab.intro}</p>
          {tab.href ? (
            <a className={s.programLink} href={tab.href}>
              Подробнее о программе →
            </a>
          ) : null}
        </div>
        <div className={s.programTiles}>
          {tiles.map(([label, value, tone]) => (
            <div key={label} className={`${s.tile} ${tone}`}>
              <p className={s.tileLabel}>{label}</p>
              <p className={s.tileValue}>{value}</p>
            </div>
          ))}
          <div className={`${s.tile} ${s.tileLime} ${s.tileWide}`}>
            <p className={s.tileLabel}>{moms ? "Запись на курс" : "Стоимость"}</p>
            <p className={s.tileValue}>{moms ? MOMS_DETAILS.line : `${PRICES.group.price} в группе`}</p>
            {moms ? (
              <a className={s.tileBtn} href={telegramUrl(MOMS_TEXT)} target="_blank" rel="noopener noreferrer">
                Записаться на курс для мам
              </a>
            ) : (
              <a className={s.tileBtn} href="#zapis">
                Пробное −30%
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
