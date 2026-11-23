import Link from "next/link";

import { LeadFlow } from "@/components/leadgen/flow";
import { LEADGEN_COUNTRIES, LEADGEN_NICHES, LEADGEN_PATH, LEADGEN_TARIFFS, rub } from "@/content/leadgen";
import { cn } from "@/lib/cn";
import { localeHref } from "@/lib/i18n";

import g from "./glass.module.css";
import s from "./leadgen-block.module.css";

/**
 * «Лидогенерация» на главной (владелец, 23.11.2026: «Сделай новый раздел на
 * сайте и вынеси блоком анимированным на главной»). Только на русской
 * главной: направление работает в России, Беларуси и Казахстане.
 */
export function LeadgenBlock() {
  const test = LEADGEN_TARIFFS[0];
  return (
    <section id="leadgen" className={s.block} aria-labelledby="leadgen-home-title">
      <div className={g.wrap}>
        <div className={s.card}>
          <div className={s.grid}>
            <div>
              <span className={s.tag}>
                <i aria-hidden="true" />
                Новое направление
              </span>
              <h2 id="leadgen-home-title" className={cn(g.serif, g.h2, s.title)}>
                Лидогенерация со звонком
              </h2>
              <p className={cn(g.lead, s.text)}>
                Находим клиентов и прозваниваем каждого. Вы получаете запись разговора или звонок сразу на своего
                менеджера. {LEADGEN_COUNTRIES.join(", ")}, по договору.
              </p>
              <div className={s.niches}>
                {LEADGEN_NICHES.map((n) => (
                  <span key={n.key}>{n.title}</span>
                ))}
              </div>
              <div className={s.actions}>
                <Link href={localeHref("ru", LEADGEN_PATH)} className={cn(g.btn, g.primary)}>
                  Смотреть тарифы
                </Link>
                <Link href={`${localeHref("ru", LEADGEN_PATH)}#start`} className={cn(g.btn, g.ghost)}>
                  Тестовый прогон
                </Link>
              </div>
            </div>
            <div className={s.side}>
              <div className={s.stat}>
                <span className={s.big}>
                  {test.leads?.[0]}–{test.leads?.[1]}
                </span>
                <span className={s.statText}>квалифицированных лидов за {test.term} теста</span>
              </div>
              <LeadFlow className={s.flow} />
              <p className={s.price}>
                Тестовый прогон <b>{rub(test.price ?? 0)}</b>, дальше тариф по цифрам теста
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
