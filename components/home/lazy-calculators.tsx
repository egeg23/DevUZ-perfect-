"use client";

import dynamic from "next/dynamic";
import { useCallback, useState, type ReactNode } from "react";

import type { Dictionary } from "@/content/dictionaries";
import type { MarketingCopy } from "@/content/marketing";
import { cn } from "@/lib/cn";
import type { Locale } from "@/lib/i18n";

/**
 * Калькуляторы на главной — код грузится, когда блок подходит к экрану.
 *
 * Владелец, 13.11.2026, вернул калькуляторы на главную («Калькулятор с
 * главной почему-то ушел»), и главная на телефоне потяжелела: два
 * калькулятора — это треть скриптов страницы, а на первом экране их нет.
 * Поэтому на главной они собираются за ~1 200 px до экрана, а до того стоит
 * место той же высоты: вёрстка ниже не прыгает (высоты замерены на 360–1440
 * px, `min-h-*`). У своих страниц (/calculator, /marketing) калькуляторы —
 * как были, сразу в разметке.
 */
const PriceCalculator = dynamic(() => import("@/components/calculator/price-calculator").then((m) => m.PriceCalculator), {
  ssr: false,
});
const MarketingCalculator = dynamic(
  () => import("@/components/marketing/marketing-calculator").then((m) => m.MarketingCalculator),
  { ssr: false },
);

function Near({ children, reserve }: { children: ReactNode; reserve: string }) {
  const [near, setNear] = useState(false);

  const attach = useCallback((node: HTMLDivElement | null) => {
    if (!node) return;
    if (typeof IntersectionObserver === "undefined") {
      setNear(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setNear(true);
          observer.disconnect();
        }
      },
      { rootMargin: "1200px 0px 1200px 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={attach} className={cn(!near && reserve)}>
      {near ? children : null}
    </div>
  );
}

export function LazyPriceCalculator({ locale, dict }: { locale: Locale; dict: Pick<Dictionary, "calculator"> }) {
  return (
    <Near reserve="min-h-[3230px] md:min-h-[2290px] lg:min-h-[1600px] xl:min-h-[1210px]">
      <PriceCalculator locale={locale} dict={dict} />
    </Near>
  );
}

export function LazyMarketingCalculator({ locale, copy }: { locale: Locale; copy: MarketingCopy }) {
  return (
    <Near reserve="min-h-[1880px] md:min-h-[1380px] lg:min-h-[880px] xl:min-h-[820px]">
      <MarketingCalculator locale={locale} copy={copy} />
    </Near>
  );
}
