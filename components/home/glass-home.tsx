import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";

import { homeSans, homeSerif, homeSerifPl } from "@/app/fonts-home";
import { LogoMark } from "@/components/brand/logo";
import { ClientsSection } from "@/components/sections/clients";
import { Reveal } from "@/components/ui/reveal";
import { BOX_NAME, BOX_PATH, named } from "@/content/box";
import { cases } from "@/content/cases";
import { company, proof } from "@/content/company";
import type { Dictionary } from "@/content/dictionaries";
import { homeCopy } from "@/content/home-copy";
import { PROMO } from "@/lib/admin/mockup-offer";
import { cn } from "@/lib/cn";
import { localeHref, t, type Locale } from "@/lib/i18n";

import { CardVideo } from "./card-video";
import { ProtoForm } from "./proto-form";
import s from "./glass.module.css";

/**
 * Главная «Стекло» — утверждённый владельцем макет (06.11.2026): первый
 * экран с перепиской ИИ-сотрудника поверх ночного города, «Делали для»,
 * «Работы студии», «Продукты студии», «Прототип за 12 часов» с заявкой и
 * вопросы.
 *
 * Картинки не обрезаны: фон города и коробки дорисован за краями кадра, и
 * гаснет только дорисованное (владелец: «не надо урезать изображения…
 * нарисуй на фоне продолжение с медленным затуханием»).
 *
 * Тексты — content/home-copy.ts, числа студии — `proof`, цены акции —
 * `PROMO`: на главной своих чисел нет.
 */

/** Работы на главной: какой кейс, какой кадр и как его кадрировать. */
const WORKS = [
  // SamAuto — с роликом прототипа (раньше стоял на главной отдельным блоком):
  // пикап разбирается на детали. Кадрирование — в .vid (glass.module.css):
  // лампа шоурума сверху уходит за край, машина остаётся целиком.
  { slug: "samauto", img: "/cases/samauto/poster-16.webp", video: "/cases/samauto/teaser-16.mp4", kind: "big", style: {} },
  { slug: "engelberg", img: "/cases/engelberg/poster-16.webp", kind: "", style: {} },
  { slug: "jiguli", img: "/cases/jiguli/poster-9.webp", kind: "", style: { objectPosition: "50% 40%" } },
  { slug: "karomat", img: "/cases/karomat/poster-16.webp", kind: "wide", style: { objectPosition: "50% 45%" } },
] as const;

/** Прототип на первом экране — настоящий кейс клиники. */
const READY_CASE = "asmo-clinic";
/** Телефон рядом с заявкой — прототип Cargo Pro Group. */
const PHONE_SHOT = "/cases/cargo-pro/shot-1-mobile.webp";

function money(locale: Locale, usd: number): string {
  if (locale === "en") return `$${usd.toLocaleString("en-US")}`;
  if (locale === "zh") return `${usd.toLocaleString("en-US")} 美元`;
  return `${usd.toLocaleString("en-US").replaceAll(",", " ")} $`;
}

function fill(text: string, vars: Record<string, string | number>): string {
  return text.replace(/\{(\w+)\}/g, (all, key: string) => (key in vars ? String(vars[key]) : all));
}

function lines(text: string): ReactNode {
  const parts = text.split("\n");
  return parts.map((part, i) => (
    <span key={i}>
      {part}
      {i < parts.length - 1 ? <br /> : null}
    </span>
  ));
}

export function GlassHome({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const copy = homeCopy[locale];
  const vars = {
    staff: proof.staff,
    projects: proof.projects,
    countries: proof.countries,
    landing: money(locale, PROMO.landing.price),
    landingOld: money(locale, PROMO.landing.regular),
    corp: money(locale, PROMO.corporate.price),
    corpOld: money(locale, PROMO.corporate.regular),
  };
  const byslug = (slug: string) => cases.find((c) => c.slug === slug);
  const ready = byslug(READY_CASE);

  return (
    <div className={cn(s.home, homeSerif.variable, homeSans.variable, homeSerifPl.variable)}>
      {/* ── 1. Первый экран ── */}
      <section className={s.hero} aria-labelledby="home-title">
        <div className={s.photo} aria-hidden="true">
          <picture>
            <source media="(max-width: 767px)" srcSet="/home/city-m.webp" />
            {/* eslint-disable-next-line @next/next/no-img-element -- фон с масками и своим кадрированием, оптимизатор картинок тут не нужен */}
            <img src="/home/city.webp" alt="" width={2400} height={1340} fetchPriority="high" decoding="async" />
          </picture>
        </div>

        <div className={cn(s.wrap, s.heroGrid)}>
          <div className={s.heroText}>
            <h1 id="home-title" className={cn(s.serif, s.h1)}>
              {copy.hero.title.map((line, i) => (
                <span key={i} className={s.line}>
                  {line}
                  {i < copy.hero.title.length - 1 ? " " : ""}
                </span>
              ))}
            </h1>
            <p className={s.lead}>
              {copy.hero.lead} <b>{fill(copy.hero.proof, vars)}</b> {fill(copy.hero.proofTail, vars)}
            </p>
            <div className={s.actions}>
              <a href="#process" className={cn(s.btn, s.primary)} data-goal="cta_contact">
                {copy.hero.order}
              </a>
              <a href="#works" className={cn(s.btn, s.ghost)} data-goal="cta_cases">
                {copy.hero.works}
              </a>
            </div>
          </div>

          <div className={s.chatCol}>
            <figure className={cn(s.chat, s.glass)} aria-label={copy.hero.chat.label} style={{ margin: 0 }}>
              <div className={s.chatHead}>
                <span className={s.ava} aria-hidden="true">
                  <LogoMark size={24} />
                </span>
                <span className={s.who}>
                  <b>{copy.hero.chat.name}</b>
                  <span>{copy.hero.chat.status}</span>
                </span>
                <span className={s.tag}>{copy.hero.chat.channel}</span>
              </div>
              <div className={s.msgs}>
                {copy.hero.chat.messages.map((m, i) => (
                  <p
                    key={i}
                    className={cn(s.m, m.from === "in" ? s.in : s.out, s.appear)}
                    style={{ "--d": `${0.5 + i * 0.85}s` } as CSSProperties}
                  >
                    {fill(m.text, vars)}
                    <time>{m.time}</time>
                  </p>
                ))}
                <p className={cn(s.sys, s.appear)} style={{ "--d": "4s" } as CSSProperties}>
                  {copy.hero.chat.handoff}
                </p>
              </div>
            </figure>

            {ready ? (
              <Link
                href={localeHref(locale, `cases/${ready.slug}`)}
                className={cn(s.ready, s.glass, s.appear)}
                style={{ "--d": "4.6s" } as CSSProperties}
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- маленькая обложка кейса */}
                <img src={`/cases/${ready.slug}/poster-16.webp`} alt="" width={112} height={70} loading="lazy" />
                <span>
                  <b>
                    <span className={s.ok} aria-hidden="true" />
                    {copy.hero.ready.title}
                  </b>
                  <span>{copy.hero.ready.text}</span>
                </span>
                <span className={cn(s.btn, s.ghost)}>{copy.hero.ready.open}</span>
              </Link>
            ) : null}
          </div>
        </div>
      </section>

      {/* «Делали для» — сразу под первым экраном (владелец, 29.10.2026). */}
      <div className={s.clients}>
        <ClientsSection dict={dict} bare />
      </div>

      {/* ── 2. Работы ── */}
      <section id="works" className={s.works} aria-labelledby="works-title">
        <div className={s.wrap}>
          <div className={s.top}>
            <h2 id="works-title" className={cn(s.serif, s.h2)}>
              {copy.works.title}
            </h2>
            <p className={s.lead}>{copy.works.lead}</p>
          </div>
          <div className={s.grid}>
            {WORKS.map((w, i) => {
              const item = byslug(w.slug);
              if (!item) return null;
              return (
                <Reveal key={w.slug} delay={i * 80} className={cn(s.cell, w.kind === "big" && s.big, w.kind === "wide" && s.wide)}>
                  <Link href={localeHref(locale, `cases/${item.slug}`)} className={cn(s.w, "video" in w && s.vid)}>
                    {"video" in w ? (
                      <CardVideo
                        wide={w.video}
                        tall={w.video.replace("-16.", "-9.")}
                        posterWide={w.img}
                        posterTall={w.img.replace("-16.", "-9.")}
                        label={item.name}
                      />
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element -- обложка кейса с кадрированием
                      <img src={w.img} alt={item.name} loading="lazy" decoding="async" style={w.style as CSSProperties} />
                    )}
                    <span className={cn(s.cap, s.glass)}>
                      <b className={s.serif}>{item.name}</b>
                      <span>{t(item.category, locale)}</span>
                    </span>
                  </Link>
                </Reveal>
              );
            })}
          </div>
          <div className={s.more}>
            <Link href={localeHref(locale, "cases")} className={cn(s.btn, s.ghost, s.small)} data-goal="cta_cases">
              {copy.works.all} <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ── 3. Продукты ── */}
      <section className={s.products} aria-labelledby="products-title">
        <div className={s.wrap}>
          <div className={s.top}>
            <h2 id="products-title" className={cn(s.serif, s.h2)}>
              {copy.products.title}
            </h2>
            <p className={s.lead}>{copy.products.lead}</p>
          </div>

          <div className={s.prodGrid}>
            <div className={s.boxCol}>
              <div className={s.boxText}>
                <h3 className={s.serif}>{BOX_NAME}</h3>
                <p>{named(dict.box.hero.tagline)}</p>
                <div className={s.boxRow}>
                  <Link href={localeHref(locale, BOX_PATH)} className={cn(s.btn, s.ghost, s.small)}>
                    {dict.box.hero.button}
                  </Link>
                  <span className={cn(s.chip, s.glass)}>{dict.box.hero.badge}</span>
                </div>
              </div>
              <div className={s.boxArt}>
                <picture>
                  <source media="(max-width: 1023px)" srcSet="/home/box-pro-m.webp" />
                  {/* eslint-disable-next-line @next/next/no-img-element -- кадр с масками по краям */}
                  <img src="/home/box-pro.webp" alt={named(dict.box.hero.alt)} width={2000} height={1493} loading="lazy" decoding="async" />
                </picture>
              </div>
            </div>

            <div className={s.side}>
              <Reveal className={cn(s.card, s.glass)}>
                <div className={s.cardText}>
                  <h3 className={s.serif}>{copy.products.ai.title}</h3>
                  <p>{copy.products.ai.text}</p>
                  <p className={s.price}>
                    {copy.products.ai.price} <em>{copy.products.ai.trial}</em>
                  </p>
                </div>
                <div className={s.aside} aria-hidden="true">
                  <span className={cn(s.m, s.in)}>{copy.products.ai.chat[0]}</span>
                  <span className={cn(s.m, s.out)}>{copy.products.ai.chat[1]}</span>
                </div>
                {/* Свой ИИ-сотрудник студии — бот в Telegram: на нём и видно, как это работает. */}
                <a href={company.telegramUrl} target="_blank" rel="noopener noreferrer" className={cn(s.btn, s.ghost, s.small)}>
                  {copy.products.ai.button}
                </a>
              </Reveal>

              <Reveal delay={80} className={cn(s.card, s.glass)}>
                <div className={s.cardText}>
                  <h3 className={s.serif}>{copy.products.audit.title}</h3>
                  <p>{copy.products.audit.text}</p>
                  <p className={s.price}>
                    <em>{copy.products.audit.free}</em>
                    {copy.products.audit.tail}
                  </p>
                </div>
                <div className={s.aside} aria-hidden="true">
                  <span className={s.example}>{copy.products.audit.example}</span>
                  <span className={cn(s.serif, s.score)}>
                    64<small> {copy.products.audit.outOf}</small>
                  </span>
                  <span>
                    {copy.products.audit.rows.map((r) => (
                      <span key={r.k} className={s.r}>
                        <span>{r.k}</span>
                        <i className={r.ok ? s.good : s.bad}>{r.v}</i>
                      </span>
                    ))}
                  </span>
                </div>
                <Link href={localeHref(locale, "audit")} className={cn(s.btn, s.ghost, s.small)}>
                  {copy.products.audit.button}
                </Link>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* ── 4. Прототип за 12 часов ── */}
      <section id="process" className={s.proto} aria-labelledby="proto-title">
        <div className={cn(s.wrap, s.protoGrid)}>
          <div className={s.protoText}>
            <h2 id="proto-title" className={cn(s.serif, s.h2)}>
              {copy.proto.title}
            </h2>
            <p className={s.lead}>{copy.proto.lead}</p>
            <ol className={s.steps}>
              {copy.proto.steps.map((step) => (
                <li key={step.when} className={s.glass}>
                  <span className={s.when}>{step.when}</span>
                  <span className={s.what}>
                    <b>{step.title}</b>
                    {lines(fill(step.text, vars))}
                  </span>
                </li>
              ))}
            </ol>
          </div>

          <ProtoForm
            locale={locale}
            copy={copy.proto.form}
            termsHref={localeHref(locale, "mockup-terms")}
            bot={company.telegram}
            botUrl={company.telegramUrl}
          />

          <div className={s.phone} style={{ "--shot": `url(${PHONE_SHOT})` } as CSSProperties}>
            <figure>
              {/* eslint-disable-next-line @next/next/no-img-element -- снимок прототипа в рамке телефона */}
              <img src={PHONE_SHOT} alt={copy.proto.phoneAlt} width={780} height={1688} loading="lazy" decoding="async" />
            </figure>
          </div>
        </div>
      </section>

      {/* ── 5. Вопросы ── */}
      <section id="faq" className={s.faq} aria-labelledby="faq-title">
        <div className={cn(s.wrap, s.faqGrid)}>
          <h2 id="faq-title" className={cn(s.serif, s.h2)}>
            {dict.faq.title}
          </h2>
          <div className={cn(s.faqList, s.glass)}>
            {dict.faq.items.map((item) => (
              // Нативный details: работает без скриптов, с клавиатуры, и
              // свёрнутый ответ поисковик всё равно читает.
              <details key={item.q}>
                <summary>
                  <span>{item.q}</span>
                  <span className={s.plus} aria-hidden="true">
                    +
                  </span>
                </summary>
                <p>{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
