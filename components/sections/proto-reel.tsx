"use client";

import Link from "next/link";
import { useCallback, useRef, useState } from "react";

import type { Case } from "@/content/cases";
import { cn } from "@/lib/cn";
import { localeHref, t, type Locale, type LocalizedText } from "@/lib/i18n";
import { caseProtoHref } from "@/lib/proto/case-link";

/** Кейс, чей ролик стоит на главной; данные кейса передаёт страница. */
const REEL_SLUG = "samauto";

const kicker = {
  ru: "Новый кейс · SamAuto",
  en: "New case · SamAuto",
  uz: "Yangi keys · SamAuto",
  zh: "新案例 · SamAuto",
  uk: "Новий кейс · SamAuto",
  pl: "Nowy projekt · SamAuto",
} satisfies LocalizedText;

const title = {
  ru: "ISUZU D-MAX разбирается на детали прямо в прокрутке",
  en: "An ISUZU D-MAX comes apart as you scroll",
  uz: "ISUZU D-MAX aylantirganda detallarga ajraladi",
  zh: "ISUZU D-MAX 随着滚动拆解成零件",
  uk: "ISUZU D-MAX розбирається на деталі просто під час прокрутки",
  pl: "ISUZU D-MAX rozkłada się na części przy przewijaniu",
} satisfies LocalizedText;

const lead = {
  ru: "Прототип главной для самаркандского завода: покрывало, разлёт деталей, фара, выезд в пустыню и четыре вида техники в живых сценах. Откройте и прокрутите сами.",
  en: "A home page prototype for the Samarkand plant: the cover, the parts flying apart, the headlight, the drive into the desert and four kinds of vehicles in live scenes. Open it and scroll yourself.",
  uz: "Samarqand zavodi uchun bosh sahifa prototipi: parda, detallarning ajralishi, fara, cho‘lga chiqish va jonli sahnalarda to‘rt xil texnika. Oching va o‘zingiz aylantiring.",
  zh: "为撒马尔罕整车厂做的首页原型：揭开罩布、零件飞散、大灯亮起、驶向沙漠，以及四类车型的动态场景。打开它，亲自滚动看看。",
  uk: "Прототип головної для самаркандського заводу: покривало, розліт деталей, фара, виїзд у пустелю та чотири види техніки в живих сценах. Відкрийте й прокрутіть самі.",
  pl: "Prototyp strony głównej dla zakładu w Samarkandzie: pokrowiec, rozkładanie na części, reflektor, wyjazd na pustynię i cztery rodzaje pojazdów w żywych scenach. Otwórz i przewiń sam.",
} satisfies LocalizedText;

const open = {
  ru: "Открыть прототип",
  en: "Open the prototype",
  uz: "Prototipni ochish",
  zh: "打开原型",
  uk: "Відкрити прототип",
  pl: "Otwórz prototyp",
} satisfies LocalizedText;

const about = {
  ru: "Как это сделано",
  en: "How it was made",
  uz: "Qanday qilingan",
  zh: "制作过程",
  uk: "Як це зроблено",
  pl: "Jak to zrobiono",
} satisfies LocalizedText;

const label = {
  ru: "Ролик прототипа SamAuto: оранжевый ISUZU D-MAX в тёмном шоуруме разлетается на детали, собирается и уезжает в пустыню",
  en: "SamAuto prototype reel: an orange ISUZU D-MAX in a dark showroom flies apart into parts, reassembles and drives off into the desert",
  uz: "SamAuto prototipi roligi: qorong‘i shourumdagi to‘q sariq ISUZU D-MAX detallarga ajraladi, yig‘iladi va cho‘lga yo‘l oladi",
  zh: "SamAuto 原型短片：暗色展厅里的橙色 ISUZU D-MAX 拆解成零件、重新组装并驶向沙漠",
  uk: "Ролик прототипу SamAuto: помаранчевий ISUZU D-MAX у темному шоурумі розлітається на деталі, збирається й їде в пустелю",
  pl: "Film prototypu SamAuto: pomarańczowy ISUZU D-MAX w ciemnym salonie rozpada się na części, składa się i odjeżdża na pustynię",
} satisfies LocalizedText;

/**
 * Ролик SamAuto сразу под первым экраном (владелец, 21.10.2026: «добавь на
 * главную прям гиф в 60 fps, чтобы сразу в шоке были клиенты»).
 *
 * Не GIF, а видео 60 к/с: GIF такого качества весил бы десятки мегабайт, ролик
 * — около 2 МБ. Горизонтальный на компьютере, вертикальный на телефоне;
 * грузится, когда секция показалась, вне кадра стоит на паузе. При «меньше
 * движения» и экономии трафика — постер и кнопка. Кнопка ведёт в сам
 * прототип, в новой вкладке.
 */
export function ProtoReel({ locale, proto }: { locale: Locale; proto: NonNullable<Case["prototype"]> | undefined }) {
  const video = useRef<HTMLVideoElement | null>(null);
  const [playing, setPlaying] = useState(false);

  const start = useCallback(() => {
    const node = video.current;
    if (!node || !proto) return;
    if (!node.getAttribute("src")) {
      const tall = window.matchMedia("(max-aspect-ratio: 4/5)").matches;
      node.src = `${proto.teaser}-${tall ? 9 : 16}.mp4`;
    }
    const p = node.play();
    if (p) p.catch(() => undefined);
  }, [proto]);

  const attach = useCallback(
    (node: HTMLElement | null) => {
      if (!node) return;
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const saveData = Boolean(
        (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData,
      );
      if (reduced || saveData || typeof IntersectionObserver === "undefined") return;
      const observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) start();
            else video.current?.pause();
          }
        },
        { threshold: 0.2 },
      );
      observer.observe(node);
      return () => observer.disconnect();
    },
    [start],
  );

  if (!proto) return null;
  const poster = proto.teaser.replace(/teaser$/, "poster");

  return (
    <section ref={attach} className="relative overflow-hidden border-t border-line bg-black">
      <div className="relative mx-auto aspect-[4/5] w-full max-w-[1600px] sm:aspect-video">
        <video
          ref={video}
          muted
          loop
          playsInline
          preload="none"
          disablePictureInPicture
          aria-hidden="true"
          onPlaying={() => setPlaying(true)}
          className="absolute inset-0 h-full w-full object-cover"
        />
        <picture>
          <source media="(max-aspect-ratio: 4/5)" srcSet={`${poster}-9.webp`} />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`${poster}-16.webp`}
            alt={t(label, locale)}
            width={1280}
            height={720}
            loading="lazy"
            decoding="async"
            className={cn(
              "absolute inset-0 h-full w-full object-cover transition-opacity duration-700",
              playing && "opacity-0",
            )}
          />
        </picture>
        <span aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent sm:bg-gradient-to-r sm:from-black/85 sm:via-black/25" />

        <div className="absolute inset-x-0 bottom-0 p-5 sm:inset-y-0 sm:left-0 sm:right-auto sm:flex sm:max-w-xl sm:flex-col sm:justify-center sm:p-12">
          <p className="font-mono text-[0.68rem] uppercase tracking-[0.2em] text-[#ff9a4d]">{t(kicker, locale)}</p>
          <h2 className="mt-3 font-display text-[1.7rem] font-extrabold leading-[1.1] tracking-tight text-white sm:text-[2.6rem]">
            {t(title, locale)}
          </h2>
          <p className="mt-4 max-w-md text-[0.92rem] leading-relaxed text-white/75">{t(lead, locale)}</p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <a
              href={caseProtoHref(proto)}
              target="_blank"
              rel="noopener"
              className="proto-glow inline-flex rounded-full p-[1.5px] transition active:scale-[0.98]"
            >
              <span className="inline-flex items-center gap-2 rounded-full bg-[#ff7a1a] px-5 py-2.5 text-[0.9rem] font-semibold text-black">
                {t(open, locale)} ↗
              </span>
            </a>
            <Link
              href={localeHref(locale, `cases/${REEL_SLUG}`)}
              className="link-underline text-[0.88rem] text-white/80"
            >
              {t(about, locale)} →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
