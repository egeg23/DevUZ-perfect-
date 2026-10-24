"use client";

import { useEffect, useRef } from "react";

/**
 * Ролик сцены в карточке кейса. Роликов в сетке двенадцать, по 1-2,5 МБ:
 * с autoPlay страница кейсов качала бы их все сразу. Файл подключается,
 * когда карточка подходит к экрану, и ролик стоит, пока она за экраном.
 * При «меньше движения» видео скрыто классом — остаётся постер.
 */
export function CaseTeaser({ src, poster, className }: { src: string; poster: string; className?: string }) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (!node.src) node.src = src;
          node.play().catch(() => {});
        } else if (node.src) {
          node.pause();
        }
      },
      { rootMargin: "200px 0px" },
    );
    io.observe(node);
    return () => io.disconnect();
  }, [src]);

  return (
    <video
      ref={ref}
      muted
      loop
      playsInline
      preload="none"
      poster={poster}
      disablePictureInPicture
      aria-hidden="true"
      className={className}
    />
  );
}
