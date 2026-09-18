import { Container } from "@/components/ui/container";
import { Reveal } from "@/components/ui/reveal";
import { headline } from "@/content/company";
import { cn } from "@/lib/cn";
import { t, type Locale } from "@/lib/i18n";

/**
 * Штат и число завершённых проектов — крупно и выше всего остального.
 *
 * Эти два числа называет первое письмо: «нас 65 в штате, 550+ проектов».
 * Адресат, которого они зацепили, идёт по ссылке проверять — и попадает на
 * главную, а не на «о студии». Не найдя их там, где смотрят первым делом,
 * он решит, что числа взяты с потолка; и будет прав ровно настолько,
 * насколько мы их спрятали.
 *
 * Поэтому здесь они стоят сразу под первым экраном, до услуг и до
 * калькулятора, и набраны крупнее всех остальных цифр на сайте. Остальные
 * числа студии — четыре языка, микросервисы, скорость первого ответа —
 * никуда не делись, но они про то, как мы работаем, и их читает тот, кто
 * уже решил читать.
 */
export function HeadlineStats({ locale, className }: { locale: Locale; className?: string }) {
  return (
    <dl className={cn("grid gap-4 sm:grid-cols-2", className)}>
      {headline.map((item, i) => (
        <Reveal key={t(item.label, locale)} delay={i * 80}>
          <div className="rounded-2xl border border-line bg-surface px-7 py-7">
            <dd className="font-display text-[clamp(2.4rem,6vw,3.1rem)] font-extrabold leading-none text-green">
              {item.value}
              <span className="text-[0.55em] text-gold">{item.suffix}</span>
            </dd>
            <dt className="mt-3 text-[0.95rem] leading-snug text-muted">
              {t(item.label, locale)}
            </dt>
          </div>
        </Reveal>
      ))}
    </dl>
  );
}

/**
 * Полоса на главной.
 *
 * Без заголовка и подводки: две подписи под числами говорят всё, что нужно,
 * а лишняя строка между первым экраном и первым числом — это ровно то
 * место, где закрывают вкладку.
 */
export function ScaleSection({ locale }: { locale: Locale }) {
  return (
    <section className="border-t border-line py-14 md:py-16">
      <Container>
        <HeadlineStats locale={locale} className="max-w-3xl" />
      </Container>
    </section>
  );
}
