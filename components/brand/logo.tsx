import { cn } from "@/lib/cn";

/**
 * Знак DevUz — восьмиконечная звезда «Руб-эль-Хизб».
 *
 * Геометрия — объединение двух квадратов, повёрнутых друг относительно друга
 * на 45°: тимуридский орнаментальный мотив, который в Узбекистане читается
 * мгновенно. Из звезды в негативе вырезаны `<` и `>`, а вертикальный зазор
 * между ними держит золотой курсор.
 *
 * Маска даёт чистые края на любом фоне, но на 16 px прорези схлопываются в
 * кашу — поэтому у фавиконки отдельная упрощённая геометрия (app/icon.svg).
 */
const STAR_PATH =
  "M0 -100 L29.29 -70.71 L70.71 -70.71 L70.71 -29.29 L100 0 L70.71 29.29 " +
  "L70.71 70.71 L29.29 70.71 L0 100 L-29.29 70.71 L-70.71 70.71 L-70.71 29.29 " +
  "L-100 0 L-70.71 -29.29 L-70.71 -70.71 L-29.29 -70.71 Z";

export function LogoMark({
  size = 36,
  className,
  /** Курсор в центре мигает — включаем только там, где это уместно. */
  animated = false,
}: {
  size?: number;
  className?: string;
  animated?: boolean;
}) {
  // Градиент и маска живут в <defs> с уникальными id: на странице знак
  // встречается несколько раз, и общий id сломал бы вторую копию.
  const uid = `logo-${size}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="-112 -112 224 224"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id={`${uid}-grad`} x1="0" y1="-1" x2="1" y2="1">
          <stop offset="0" stopColor="#5B9BFF" />
          <stop offset="55%" stopColor="#3B82F6" />
          <stop offset="100%" stopColor="#22F0A0" />
        </linearGradient>
        <mask id={`${uid}-cut`}>
          <rect x="-112" y="-112" width="224" height="224" fill="#fff" />
          <path
            d="M-22 -34 L-58 0 L-22 34"
            stroke="#000"
            strokeWidth="15"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M22 -34 L58 0 L22 34"
            stroke="#000"
            strokeWidth="15"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </mask>
      </defs>
      <path d={STAR_PATH} fill={`url(#${uid}-grad)`} mask={`url(#${uid}-cut)`} />
      <rect
        x="-5"
        y="-27"
        width="10"
        height="54"
        rx="5"
        fill="var(--color-gold)"
        className={animated ? "logo-cursor" : undefined}
      />
    </svg>
  );
}

export function Logo({
  size = 36,
  className,
  withWordmark = true,
  animated = false,
}: {
  size?: number;
  className?: string;
  withWordmark?: boolean;
  animated?: boolean;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark size={size} animated={animated} />
      {withWordmark ? (
        <span className="font-display text-[1.35rem] font-extrabold leading-none tracking-[-0.03em]">
          Dev<span className="text-green">Uz</span>
        </span>
      ) : null}
      <span className="sr-only">DevUz Studio</span>
    </span>
  );
}
