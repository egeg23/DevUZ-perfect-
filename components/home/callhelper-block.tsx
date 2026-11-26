import { CALLHELPER_ANCHOR, CALLHELPER_COPY as C } from "@/content/callhelper";
import { company } from "@/content/company";
import { cn } from "@/lib/cn";
import { CALLHELPER_OVER_RUB, CALLHELPER_TARIFFS, CALLHELPER_TRIAL, launchText } from "@/lib/callhelper/tariffs";
import { localeHref } from "@/lib/i18n";

import { CallHelperWait } from "./callhelper-wait";
import g from "./glass.module.css";
import s from "./callhelper-block.module.css";

const nb = (n: number) => n.toLocaleString("ru-RU").replace(/\s/g, " ");

/**
 * DevUz CallHelper на главной (владелец, 25.11.2026: «На главной тоже
 * размести информацию что у нас есть такой функционал, напиши что запуск
 * будет 14.12.26 года. И распиши что это, кому надо, тарифы»). Только на
 * русской главной: суфлёр говорит по-русски, цены в рублях. Цены и дата берутся
 * из lib/callhelper/tariffs.ts, своих чисел здесь нет.
 */
export function CallHelperBlock() {
  return (
    <section id={CALLHELPER_ANCHOR} className={s.block} aria-labelledby="callhelper-home-title">
      <div className={g.wrap}>
        <div className={s.card}>
          <div className={s.grid}>
            <div>
              <span className={s.tag}>
                <i aria-hidden="true" />
                Запуск {launchText()}
              </span>
              <h2 id="callhelper-home-title" className={cn(g.serif, g.h2, s.title)}>
                {C.title}
              </h2>
              <p className={cn(g.lead, s.text)}>
                {C.lead}
              </p>
              <ol className={s.steps}>
                {C.steps.map((step, i) => (
                  <li key={step.t}>
                    <span className={s.num}>{i + 1}</span>
                    <span>
                      <b>{step.t}.</b> {step.d}
                    </span>
                  </li>
                ))}
              </ol>
              <p className={s.small}>
                {C.privacy}
              </p>
            </div>

            <div className={s.side}>
              <div>
                <h3 className={s.h3}>Кому нужен</h3>
                <div className={s.who}>
                  {C.who.map((w) => (
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
                      <span className={s.per}>{C.per}</span>
                      <span className={s.mins}>{nb(t.minutes)} {C.minutes}</span>
                    </div>
                  ))}
                </div>
                <p className={s.small}>
                  Сверх пакета {CALLHELPER_OVER_RUB}&nbsp;₽ за минуту. Пробный период: {CALLHELPER_TRIAL.days} дня и{" "}
                  {CALLHELPER_TRIAL.minutes} минут на компанию.
                </p>
              </div>

              <CallHelperWait privacyHref={localeHref("ru", "privacy")} />
              <div className={s.actions}>
                <a href="/ru/callhelper" className={cn(g.btn, g.ghost)}>
                  Подробнее о CallHelper
                </a>
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
