import type { Quote } from "@/lib/admin/quote";

/**
 * Смета глазами менеджера.
 *
 * Два числа крупно — порог и потолок — потому что ради них карточка и
 * открывается. Всё остальное — что входит, что предложить, что говорить —
 * ниже и мельче: это читают один раз перед звонком, а порог смотрят
 * каждый раз, когда клиент просит скидку.
 */

const money = (usd: number) => `$${usd.toLocaleString("en-US")}`;

export function QuoteCard({ quote }: { quote: Quote }) {
  const weeks =
    quote.promisedWeeks !== null
      ? `${quote.promisedWeeks} нед.`
      : quote.weeksLow !== null
        ? `${quote.weeksLow}–${quote.weeksHigh} нед.`
        : "после созвона";

  return (
    <div className="mt-3">
      <p className="text-sm">
        <span className="font-medium">{quote.categoryTitle}</span>
        <span className="ml-2 text-xs text-faint">
          {quote.kind === "brief" ? "цена с витрины, клиент её видел" : "по калькулятору сайта"}
        </span>
      </p>

      <div className="mt-3 grid grid-cols-3 gap-3 sm:max-w-lg">
        <div className="rounded-xl border border-green/30 bg-green/5 px-4 py-3">
          <p className="font-mono text-xl text-green">{money(quote.floorUsd)}</p>
          <p className="mt-1 text-xs uppercase tracking-wider text-faint">не ниже</p>
        </div>
        <div className="rounded-xl border border-line bg-surface-2 px-4 py-3">
          <p className="font-mono text-xl">{money(quote.ceilingUsd)}</p>
          <p className="mt-1 text-xs uppercase tracking-wider text-faint">до</p>
        </div>
        <div className={`rounded-xl border px-4 py-3 ${quote.rush ? "border-gold/40 bg-gold/5" : "border-line bg-surface-2"}`}>
          <p className={`font-mono text-xl ${quote.rush ? "text-gold" : ""}`}>{weeks}</p>
          <p className="mt-1 text-xs uppercase tracking-wider text-faint">{quote.rush ? "ускорение" : "срок"}</p>
        </div>
      </div>

      {quote.work.length ? (
        <div className="mt-4">
          <p className="text-xs uppercase tracking-wider text-faint">Что входит</p>
          <ul className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted">
            {quote.work.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {quote.breakdown.length ? (
        <div className="mt-4">
          <p className="text-xs uppercase tracking-wider text-faint">Выбрано</p>
          <ul className="mt-1 space-y-1 text-sm">
            {quote.breakdown.map((line) => (
              <li key={line.label} className="flex justify-between gap-4 sm:max-w-lg">
                <span>{line.label}</span>
                <span className="font-mono text-muted">{line.value}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {quote.extras.length ? (
        <div className="mt-4">
          <p className="text-xs uppercase tracking-wider text-faint">Что предложить дополнительно</p>
          <ul className="mt-1 space-y-1 text-sm">
            {quote.extras.map((extra) => (
              <li key={extra.id} className="flex justify-between gap-4 sm:max-w-lg">
                <span>{extra.label}</span>
                <span className="font-mono text-muted">{extra.price}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="mt-4 rounded-xl border border-line bg-surface-2 px-4 py-3">
        <p className="text-xs uppercase tracking-wider text-faint">Что говорить</p>
        <ul className="mt-2 space-y-2 text-sm leading-relaxed">
          {quote.talk.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
