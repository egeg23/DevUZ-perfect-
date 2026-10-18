"use client";

import { useCallback, useRef, useState } from "react";

import { cn } from "@/lib/cn";
import { t, type Locale, type LocalizedText } from "@/lib/i18n";

const FILM = "/film/devuz-studio.mp4";
const POSTER = "/film/devuz-studio.webp";

const label = {
  ru: "Фильм о студии DevUz: команда пишет код, на экранах сайты клиентов, вид на Ташкент, окна здания складываются в надпись DEVUZ",
  en: "DevUz studio film: the team writing code, client websites on the screens, a view of Tashkent, building windows lighting up as DEVUZ",
  uz: "DevUz studiyasi haqida film: jamoa kod yozmoqda, ekranlarda mijozlar saytlari, Toshkent manzarasi, bino derazalarida DEVUZ yozuvi",
  zh: "DevUz 工作室影片：团队在写代码，屏幕上是客户的网站，塔什干的景色，大楼的窗户亮起拼出 DEVUZ",
  uk: "Фільм про студію DevUz: команда пише код, на екранах сайти клієнтів, вид на Ташкент, вікна будівлі складаються в напис DEVUZ",
  pl: "Film o studiu DevUz: zespół pisze kod, na ekranach strony klientów, widok na Taszkent, okna budynku układają się w napis DEVUZ",
} satisfies LocalizedText;

const watch = {
  ru: "Смотреть фильм",
  en: "Watch the film",
  uz: "Filmni ko‘rish",
  zh: "观看影片",
  uk: "Дивитися фільм",
  pl: "Obejrzyj film",
} satisfies LocalizedText;

/**
 * Фильм о студии под числами штата.
 *
 * Стоит сразу под «65 разработчиков в штате»: число и картинка одной
 * мысли — сначала сказали, сколько нас, потом показали. Кадр 2.39:1, чёрная
 * полоса секции сверху и снизу — рамка кино; в самом файле полос нет, их
 * рисует страница, поэтому на телефоне фильм занимает всю ширину.
 *
 * Файл (2,2 МБ) не грузится, пока секция не показалась: до этого стоит
 * обложка — последний кадр с горящей надписью, сам по себе законченный.
 * В кадре фильм играет без звука по кругу, вне кадра стоит на паузе.
 * При prefers-reduced-motion, экономии трафика и запрете автозапуска —
 * обложка и кнопка «Смотреть фильм»: движение по желанию, а не силой.
 *
 * Как собран фильм — `scripts/film/README.md`.
 */
export function StudioFilm({ locale }: { locale: Locale }) {
  const video = useRef<HTMLVideoElement | null>(null);
  const [src, setSrc] = useState<string | undefined>(undefined);
  const [playing, setPlaying] = useState(false);
  const [manual, setManual] = useState(false);

  const start = useCallback(() => {
    const node = video.current;
    if (!node) return;
    if (!node.getAttribute("src")) {
      node.src = FILM;
      setSrc(FILM);
    }
    const p = node.play();
    if (p) p.catch(() => setManual(true));
  }, []);

  const attach = useCallback(
    (node: HTMLElement | null) => {
      if (!node) return;

      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const saveData = Boolean(
        (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData,
      );
      if (reduced || saveData || typeof IntersectionObserver === "undefined") {
        setManual(true);
        return;
      }

      const observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) start();
            else video.current?.pause();
          }
        },
        { threshold: 0.35 },
      );

      observer.observe(node);
      return () => observer.disconnect();
    },
    [start],
  );

  return (
    <section ref={attach} className="border-t border-line bg-black py-5 md:py-10">
      <div className="relative mx-auto aspect-[1280/536] w-full max-w-[1600px] overflow-hidden">
        <div role="img" aria-label={t(label, locale)} className="absolute inset-0">
          <video
            ref={video}
            src={src}
            muted
            loop
            playsInline
            preload="none"
            disablePictureInPicture
            aria-hidden="true"
            onPlaying={() => {
              setPlaying(true);
              setManual(false);
            }}
            className="absolute inset-0 h-full w-full object-cover"
          />
          {/* Обложка — готовый webp из сборки фильма: оптимизатор картинок
              на сервере ей не нужен. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={POSTER}
            alt=""
            width={1280}
            height={536}
            loading="lazy"
            decoding="async"
            className={cn(
              "absolute inset-0 h-full w-full object-cover transition-opacity duration-700",
              playing && "opacity-0",
            )}
          />
        </div>
        {manual && !playing ? (
          <button
            type="button"
            onClick={start}
            className="absolute bottom-2.5 left-2.5 inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-black/55 px-3 py-1.5 text-[0.75rem] font-semibold text-white backdrop-blur-sm transition hover:bg-black/75 md:bottom-6 md:left-6 md:gap-2 md:px-4 md:py-2 md:text-[0.85rem]"
          >
            <svg viewBox="0 0 16 16" aria-hidden="true" className="h-3 w-3 fill-current md:h-3.5 md:w-3.5">
              <path d="M4 2.5v11l9-5.5z" />
            </svg>
            {t(watch, locale)}
          </button>
        ) : null}
      </div>
    </section>
  );
}
