"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Ролик в карточке работы на главной (SamAuto: пикап разбирается на детали).
 *
 * Два кадрирования: на компьютере карточка почти квадратная, и в широком
 * ролике у пикапа обрезан нос, поэтому там идёт вертикальная версия (машина
 * во всю ширину); на планшете и телефоне карточка широкая — широкая версия.
 * Обложка выбирается так же, через <picture>, ещё до скриптов.
 *
 * До прокрутки качается только обложка: адрес ролику ставится, когда
 * карточку увидели (видно больше трети), ушла с экрана — пауза. Ролик
 * проявляется поверх обложки с первого кадра. При «меньше движения» и
 * экономии трафика ролик не запускается вовсе. Звука и управления нет: это
 * витрина, а не плеер.
 */
export function CardVideo({
  wide,
  tall,
  posterWide,
  posterTall,
  label,
}: {
  wide: string;
  tall: string;
  posterWide: string;
  posterTall: string;
  label: string;
}) {
  const ref = useRef<HTMLVideoElement | null>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData;
    if (saveData) return;
    const desk = window.matchMedia("(min-width: 1024px)");
    let started = false;
    const watch = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          if (!started) {
            node.src = desk.matches ? tall : wide;
            started = true;
          }
          node.play().catch(() => undefined);
        } else node.pause();
      },
      { threshold: 0.35 },
    );
    watch.observe(node);
    return () => watch.disconnect();
  }, [wide, tall]);

  return (
    <>
      <picture>
        <source media="(min-width: 1024px)" srcSet={posterTall} />
        {/* eslint-disable-next-line @next/next/no-img-element -- обложка ролика с кадрированием */}
        <img src={posterWide} alt={label} loading="lazy" decoding="async" />
      </picture>
      <video
        ref={ref}
        muted
        playsInline
        loop
        preload="none"
        aria-hidden="true"
        disablePictureInPicture
        data-on={playing || undefined}
        onPlaying={() => setPlaying(true)}
      />
    </>
  );
}
