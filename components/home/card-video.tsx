"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Ролик в карточке работы на главной — тизер кейса, 60 к/с.
 *
 * Два ролика: `desk` — на компьютере (почти квадратной карточке, как у
 * SamAuto, лучше вертикальный, иначе у пикапа обрезан нос), `wide` — на
 * планшете и телефоне, где карточки широкие. Обложка выбирается так же,
 * через <picture>, ещё до скриптов.
 *
 * До прокрутки качается только обложка: адрес ролику ставится, когда
 * карточку увидели (видно больше трети), ушла с экрана — пауза. Ролик
 * проявляется поверх обложки с первого кадра. При «меньше движения» и
 * экономии трафика ролик не запускается вовсе. Звука и управления нет: это
 * витрина, а не плеер.
 */
export function CardVideo({
  wide,
  desk,
  posterWide,
  posterDesk,
  label,
}: {
  wide: string;
  desk: string;
  posterWide: string;
  posterDesk: string;
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
    const big = window.matchMedia("(min-width: 1024px)");
    let started = false;
    const watch = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          if (!started) {
            node.src = big.matches ? desk : wide;
            started = true;
          }
          node.play().catch(() => undefined);
        } else node.pause();
      },
      { threshold: 0.35 },
    );
    watch.observe(node);
    return () => watch.disconnect();
  }, [wide, desk]);

  return (
    <>
      <picture>
        <source media="(min-width: 1024px)" srcSet={posterDesk} />
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
