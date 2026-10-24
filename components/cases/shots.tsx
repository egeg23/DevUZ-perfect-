/**
 * «Как это выглядит» — снимки экранов макета на странице кейса: компьютер
 * лентой с прокруткой вбок, под ним те же экраны на телефоне. Только
 * картинки, без скрипта: лента крутится пальцем или колесом сама.
 */
export function CaseShots({
  slug,
  count,
  alt,
  labels,
}: {
  slug: string;
  count: number;
  /** Подпись снимка, «{n}» — номер экрана. */
  alt: string;
  labels: { desktop: string; mobile: string };
}) {
  const nums = Array.from({ length: count }, (_, i) => i + 1);
  const src = (n: number, kind: "desktop" | "mobile") => `/cases/${slug}/shot-${n}-${kind}.webp`;

  return (
    <div className="space-y-8">
      <div>
        <p className="font-mono text-[0.68rem] uppercase tracking-[0.18em] text-faint">{labels.desktop}</p>
        <div className="-mx-4 mt-3 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-3 sm:mx-0 sm:px-0">
          {nums.map((n) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={n}
              src={src(n, "desktop")}
              alt={alt.replace("{n}", String(n))}
              width={1440}
              height={900}
              loading="lazy"
              decoding="async"
              className="aspect-[16/10] w-[88%] max-w-[880px] shrink-0 snap-start rounded-xl border border-line bg-surface object-cover sm:w-[72%]"
            />
          ))}
        </div>
      </div>
      <div>
        <p className="font-mono text-[0.68rem] uppercase tracking-[0.18em] text-faint">{labels.mobile}</p>
        <div className="-mx-4 mt-3 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-3 sm:mx-0 sm:px-0">
          {nums.map((n) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={n}
              src={src(n, "mobile")}
              alt={alt.replace("{n}", String(n))}
              width={390}
              height={844}
              loading="lazy"
              decoding="async"
              className="aspect-[390/844] w-[46%] max-w-[240px] shrink-0 snap-start rounded-[1.6rem] border border-line bg-surface object-cover sm:w-[200px]"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
