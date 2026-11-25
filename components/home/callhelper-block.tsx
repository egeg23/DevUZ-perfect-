import Link from "next/link";

import { company } from "@/content/company";
import { cn } from "@/lib/cn";
import { CALLHELPER_OVER_RUB, CALLHELPER_TARIFFS, CALLHELPER_TRIAL, launchText } from "@/lib/callhelper/tariffs";
import { localeHref } from "@/lib/i18n";

import g from "./glass.module.css";
import s from "./callhelper-block.module.css";

const nb = (n: number) => n.toLocaleString("ru-RU").replace(/\s/g, " ");

const WHO = [
  "Колл-центры на аутсорсе",
  "Отделы продаж с холодными звонками",
  "Клиники и автосалоны с записью по телефону",
  "Входящая линия и поддержка",
  "Новые операторы без опыта",
];

const STEPS = [
  { t: "Сценарий", d: "Вы задаёте этапы звонка, ответы на возражения, обязательные и запрещённые слова." },
  { t: "Звонок", d: "Суфлёр слушает разговор оператора с клиентом прямо в браузере." },
  { t: "Подсказка", d: "Оператор видит на экране, что сказать сейчас, и как ответить на возражение." },
];

/**
 * DevUz CallHelper на главной (владелец, 25.11.2026: «На главной тоже
 * размести информацию что у нас есть такой функционал, напиши что запуск
 * будет 14.12.26 года. И распиши что это, кому надо, тарифы»). Только на
 * русской главной: суфлёр говорит по-русски, цены в рублях. Цены и дата берутся
 * из lib/callhelper/tariffs.ts, своих чисел здесь нет.
 */
export function CallHelperBlock() {
  return (
    <section id="callhelper" className={s.block} aria-labelledby="callhelper-home-title">
      <div className={g.wrap}>
        <div className={s.card}>
          <div className={s.grid}>
            <div>
              <span className={s.tag}>
                <i aria-hidden="true" />
                Запуск {launchText()}
              </span>
              <h2 id="callhelper-home-title" className={cn(g.serif, g.h2, s.title)}>
                DevUz CallHelper: ИИ&#8209;суфлёр для звонков
              </h2>
              <p className={cn(g.lead, s.text)}>
                Слушает разговор оператора с клиентом и прямо во время звонка подсказывает, что сказать дальше: узнаёт
                возражения, ведёт по этапам вашего сценария и предупреждает, если прозвучало запрещённое слово.
              </p>
              <ol className={s.steps}>
                {STEPS.map((step, i) => (
                  <li key={step.t}>
                    <span className={s.num}>{i + 1}</span>
                    <span>
                      <b>{step.t}.</b> {step.d}
                    </span>
                  </li>
                ))}
              </ol>
              <p className={s.small}>
                Голос распознаётся в России. Телефоны и почта вырезаются из разговора до того, как текст уходит ИИ.
              </p>
            </div>

            <div className={s.side}>
              <div>
                <h3 className={s.h3}>Кому нужен</h3>
                <div className={s.who}>
                  {WHO.map((w) => (
                    <span key={w}>{w}</span>
                  ))}
                </div>
              </div>

              <div>
                <h3 className={s.h3}>Тарифы</h3>
                <div className={s.tariffs}>
                  {CALLHELPER_TARIFFS.map((t) => (
                    <div key={t.key} className={s.tariff}>
                      <span className={s.name}>{t.name}</span>
                      <span className={s.price}>{nb(t.rub)}&nbsp;₽</span>
                      <span className={s.per}>за оператора в месяц</span>
                      <span className={s.mins}>{nb(t.minutes)} минут разговора</span>
                    </div>
                  ))}
                </div>
                <p className={s.small}>
                  Сверх пакета {CALLHELPER_OVER_RUB}&nbsp;₽ за минуту. Пробный период: {CALLHELPER_TRIAL.days} дня и{" "}
                  {CALLHELPER_TRIAL.minutes} минут на компанию.
                </p>
              </div>

              <div className={s.actions}>
                <Link href={localeHref("ru", "contact")} className={cn(g.btn, g.primary)}>
                  Подключить первыми
                </Link>
                <a href={company.telegramUrl} target="_blank" rel="noopener noreferrer" className={cn(g.btn, g.ghost)}>
                  Спросить в Telegram
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
