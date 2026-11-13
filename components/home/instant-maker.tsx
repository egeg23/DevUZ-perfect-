"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";

import type { SiteInstantCopy } from "@/content/site-instant-copy";
import type { CircleNiche } from "@/lib/admin/sales-after-reply";
import type { SiteEvent, SiteInfo } from "@/lib/proto/instant/site";
import type { BuildStep } from "@/lib/proto/instant/widget";
import { cn } from "@/lib/cn";
import type { Locale } from "@/lib/i18n";
import { goal } from "@/lib/visit/goal";

import g from "./glass.module.css";
import s from "./instant-maker.module.css";

/**
 * «Собрать макет» на главной (владелец, 13.11.2026): кнопка раскрывает окно —
 * адрес сайта или Instagram, или «Сайта нет» и пара вопросов, сфера
 * карточками, и сборка на глазах. Шаги приходят с сервера по мере того, как
 * он их делает (/api/instant, поток событий), а в конце окно показывает не
 * схему, а сам макет, который человек получил: он грузится в рамку браузера
 * и проявляется блоками сверху вниз, прокручивается к форме и подвалу и
 * переходит в телефон. Движение — transform и opacity; при
 * prefers-reduced-motion сразу готовое.
 */

const STEPS: BuildStep[] = ["read", "brand", "services", "build", "check", "done"];
const DESK = { w: 1280, h: 800 };
const PHONE = { w: 390, h: 780 };
/** Полос «проявления» поверх макета. */
const BANDS = 7;

type Phase = "closed" | "address" | "answers" | "niche" | "building" | "done" | "manual" | "error";
type Done = { token: string; name: string; admin: boolean; color: string | null; expires: string | null; addons: { name: string; price: number }[] };
type Manual = { why: "failed" | "limit"; cases: { name: string; href: string }[] };

function money(locale: Locale, usd: number): string {
  if (locale === "en") return `$${usd.toLocaleString("en-US")}`;
  if (locale === "zh") return `${usd.toLocaleString("en-US")} 美元`;
  return `${usd.toLocaleString("en-US").replaceAll(",", " ")} $`;
}
const fill = (text: string, vars: Record<string, string | number>) => text.replace(/\{(\w+)\}/g, (all, k: string) => (k in vars ? String(vars[k]) : all));
const UNITS: Record<Locale, [string, string]> = { ru: ["ч", "мин"], uz: ["soat", "daq"], en: ["h", "min"], zh: ["小时", "分"], uk: ["год", "хв"], pl: ["godz.", "min"] };
const reduced = () => typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
const narrow = () => typeof window !== "undefined" && window.matchMedia?.("(max-width: 767px)").matches;
const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
/**
 * Видео DevUz — для того, кто открыл макет, а не для показа в рамке: рамка
 * той же вкладки видит ту же память сессии и пропускает его. «На весь экран»
 * открывается без общей памяти (noopener) — там видео играет, как положено.
 */
function introSeen() {
  try {
    sessionStorage.setItem("dz-intro", "1");
  } catch {
    /* приватное окно: видео просто сыграет в рамке */
  }
}

/** Плавная прокрутка макета в рамке: сами двигаем scrollTop, у длинного пролёта браузерная слишком резкая. */
function glide(win: Window, to: number, ms: number): Promise<void> {
  return new Promise((done) => {
    const from = win.scrollY;
    const start = performance.now();
    const tick = (t: number) => {
      const k = Math.min(1, (t - start) / ms);
      const e = k < 0.5 ? 2 * k * k : 1 - (-2 * k + 2) ** 2 / 2;
      win.scrollTo(0, from + (to - from) * e);
      if (k < 1) requestAnimationFrame(tick);
      else done();
    };
    requestAnimationFrame(tick);
  });
}

/** Макет в рамке нужного размера, уменьшенный трансформом под ширину окна. */
function Frame({ src, size, scale, onLoad, frameRef, title }: { src: string; size: { w: number; h: number }; scale: number; onLoad?: () => void; frameRef?: React.Ref<HTMLIFrameElement>; title: string }) {
  return (
    <div className={s.viewport} style={{ height: size.h * scale }}>
      <iframe
        ref={frameRef}
        src={src}
        title={title}
        className={s.iframe}
        style={{ width: size.w, height: size.h, transform: `scale(${scale})` }}
        onLoad={onLoad}
      />
    </div>
  );
}

export function InstantMaker({ locale, copy, termsHref, botUrl, manualHours, prices }: {
  locale: Locale;
  copy: SiteInstantCopy;
  termsHref: string;
  botUrl: string;
  manualHours: number;
  prices: { landing: number; landingOld: number; corp: number; corpOld: number };
}) {
  const [phase, setPhase] = useState<Phase>("closed");
  const [address, setAddress] = useState("");
  const [addrError, setAddrError] = useState<string | null>(null);
  const [insta, setInsta] = useState(false);
  const [answers, setAnswers] = useState({ name: "", phone: "", address: "", services: "" });
  const [nosite, setNosite] = useState(false);
  const [niche, setNiche] = useState<CircleNiche | null>(null);
  const [what, setWhat] = useState("");
  const [step, setStep] = useState<BuildStep | null>(null);
  const [info, setInfo] = useState<SiteInfo>({});
  const [typed, setTyped] = useState("");
  const [done, setDone] = useState<Done | null>(null);
  const [manual, setManual] = useState<Manual | null>(null);
  const [has, setHas] = useState(false);
  const hp = useRef<HTMLInputElement>(null);
  const box = useRef<HTMLDivElement>(null);

  const niches: CircleNiche[] = ["medcentr", "stomatologiya", "mebel", "restoran", "salon-krasoty", "turagentstvo", "uchebnyy-centr", "nedvizhimost", "avtoservis", "avtosalon", "magazin", "stroitelstvo", "logistika", "uslugi", "general"];

  // Строка браузера печатается по букве: адрес клиента, потом адрес макета.
  const typeHost = useCallback((host: string) => {
    if (reduced()) {
      setTyped(host);
      return;
    }
    let i = 0;
    const id = setInterval(() => {
      i += 1;
      setTyped(host.slice(0, i));
      if (i >= host.length) clearInterval(id);
    }, 38);
  }, []);

  // Свой макет уже есть — окно сразу показывает его (один на браузер).
  const open = useCallback(async () => {
    introSeen();
    setPhase("address");
    goal("maket_open");
    requestAnimationFrame(() => box.current?.scrollIntoView({ behavior: reduced() ? "auto" : "smooth", block: "start" }));
    try {
      const r = await fetch("/api/instant", { method: "GET", cache: "no-store" });
      const j = (await r.json()) as { has?: { token: string; name: string; admin: boolean } };
      if (j.has) {
        setHas(true);
        setDone({ token: j.has.token, name: j.has.name, admin: j.has.admin, color: null, expires: null, addons: [] });
        setPhase("done");
      }
    } catch {
      /* проверка не ответила: соберём, сервер сам скажет, если макет есть */
    }
  }, []);

  function submitAddress(e: React.FormEvent) {
    e.preventDefault();
    const v = address.trim();
    const instagram = /instagram\.com\/[A-Za-z0-9._]{2,}/i.test(v) || /^@[A-Za-z0-9._]{2,}$/.test(v);
    const site = /^(https?:\/\/)?[a-z0-9.-]+\.[a-z]{2,}(\/\S*)?$/i.test(v) && !instagram;
    if (!site && !instagram) {
      setAddrError(copy.address.bad);
      return;
    }
    setAddrError(null);
    setInsta(instagram);
    setNosite(instagram);
    setPhase(instagram ? "answers" : "niche");
  }

  function submitAnswers(e: React.FormEvent) {
    e.preventDefault();
    if (!answers.name.trim() || answers.phone.replace(/\D/g, "").length < 9) {
      setAddrError(copy.answers.bad);
      return;
    }
    setAddrError(null);
    setPhase("niche");
  }

  async function build(chosen: CircleNiche) {
    if (chosen === "general" && what.trim().length < 2) return;
    setNiche(chosen);
    introSeen();
    setPhase("building");
    setStep(null);
    setInfo({});
    setTyped("");
    goal("maket_build");
    const host = !nosite ? address.trim().replace(/^https?:\/\//i, "").replace(/^www\./i, "").split("/")[0] : "";
    if (host) typeHost(host);
    try {
      // Ловушка для ботов в теле, как `website` у /api/lead.
      const body = { locale, niche: chosen, what: what.trim(), url: nosite ? (insta ? address.trim() : "") : address.trim(), answers: nosite ? answers : null, hp: hp.current?.value ?? "" };
      const res = await fetch("/api/instant", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (!res.ok || !res.body) throw new Error(String(res.status));
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = "";
      let last: SiteEvent | null = null;
      for (;;) {
        const { value, done: end } = await reader.read();
        if (end) break;
        buf += dec.decode(value, { stream: true });
        let cut = buf.indexOf("\n\n");
        while (cut >= 0) {
          const line = buf.slice(0, cut).replace(/^data: /, "");
          buf = buf.slice(cut + 2);
          cut = buf.indexOf("\n\n");
          try {
            const ev = JSON.parse(line) as SiteEvent;
            last = ev;
            if (ev.t === "step") {
              setStep(ev.step);
              if (ev.info) setInfo(ev.info);
            }
          } catch {
            /* обрывок строки — ждём следующую */
          }
        }
      }
      if (!last) throw new Error("empty");
      if (last.t === "done") {
        setDone({ token: last.token, name: last.name, admin: last.admin, color: last.color, expires: last.expires, addons: last.addons });
        setPhase("done");
        goal("maket_done");
      } else if (last.t === "has") {
        setHas(true);
        setDone({ token: last.token, name: last.name, admin: last.admin, color: null, expires: null, addons: [] });
        setPhase("done");
      } else if (last.t === "manual") {
        setManual({ why: last.why, cases: last.cases });
        setPhase("manual");
      } else if (last.t === "open") {
        setAddrError(copy.open_fail);
        setPhase("address");
      } else {
        setPhase("error");
      }
    } catch {
      setPhase("error");
    }
  }

  return (
    <section id="maket" className={s.section} aria-labelledby="maket-title">
      <div className={g.wrap}>
        <div className={cn(s.panel, g.glass)} ref={box} data-phase={phase}>
          <div className={s.head}>
            <div>
              <span className={s.kicker}>{copy.kicker}</span>
              <h2 id="maket-title" className={cn(g.serif, g.h2, s.title)}>
                {copy.title}
              </h2>
              <p className={cn(g.lead, s.lead)}>{copy.lead}</p>
            </div>
            {phase === "closed" ? (
              <button type="button" className={cn(g.btn, g.primary, s.cta)} onClick={open} data-goal="maket_open">
                {copy.open} <span aria-hidden="true">→</span>
              </button>
            ) : (
              <button type="button" className={cn(g.btn, g.ghost, g.small)} onClick={() => setPhase("closed")}>
                {copy.close}
              </button>
            )}
          </div>

          {phase !== "closed" ? (
            <div className={s.body}>
              <input ref={hp} className={g.trap} name="company_site" tabIndex={-1} autoComplete="off" aria-hidden="true" />
              {copy.langNote && (phase === "address" || phase === "niche") ? <p className={s.hint}>{copy.langNote}</p> : null}

              {phase === "address" ? (
                <form className={s.step} onSubmit={submitAddress}>
                  <label className={s.label} htmlFor="maket-url">
                    {copy.address.title}
                  </label>
                  <div className={s.row}>
                    <input
                      id="maket-url"
                      className={cn(g.field, s.field)}
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder={copy.address.placeholder}
                      inputMode="url"
                      autoComplete="url"
                      maxLength={300}
                      autoFocus
                    />
                    <button type="submit" className={cn(g.btn, g.primary)}>
                      {copy.address.next}
                    </button>
                  </div>
                  {addrError ? (
                    <p className={g.fail} role="alert">
                      {addrError}
                    </p>
                  ) : null}
                  <button
                    type="button"
                    className={s.link}
                    onClick={() => {
                      setNosite(true);
                      setInsta(false);
                      setAddrError(null);
                      setPhase("answers");
                    }}
                  >
                    {copy.address.nosite}
                  </button>
                </form>
              ) : null}

              {phase === "answers" ? (
                <form className={s.step} onSubmit={submitAnswers}>
                  <p className={s.label}>{copy.answers.title}</p>
                  {insta ? <p className={s.hint}>{copy.address.insta}</p> : null}
                  <div className={s.two}>
                    <input className={g.field} required maxLength={60} placeholder={copy.answers.name} aria-label={copy.answers.name} value={answers.name} onChange={(e) => setAnswers({ ...answers, name: e.target.value })} />
                    <input className={g.field} required maxLength={30} inputMode="tel" autoComplete="tel" placeholder={copy.answers.phone} aria-label={copy.answers.phone} value={answers.phone} onChange={(e) => setAnswers({ ...answers, phone: e.target.value })} />
                  </div>
                  <input className={g.field} maxLength={140} placeholder={copy.answers.address} aria-label={copy.answers.address} value={answers.address} onChange={(e) => setAnswers({ ...answers, address: e.target.value })} />
                  <textarea className={cn(g.field, s.area)} rows={4} maxLength={1500} placeholder={copy.answers.services} aria-label={copy.answers.services} value={answers.services} onChange={(e) => setAnswers({ ...answers, services: e.target.value })} />
                  {addrError ? (
                    <p className={g.fail} role="alert">
                      {addrError}
                    </p>
                  ) : null}
                  <div className={s.row}>
                    <button type="button" className={cn(g.btn, g.ghost)} onClick={() => setPhase("address")}>
                      {copy.niche.back}
                    </button>
                    <button type="submit" className={cn(g.btn, g.primary)}>
                      {copy.address.next}
                    </button>
                  </div>
                </form>
              ) : null}

              {phase === "niche" ? (
                <div className={s.step}>
                  <p className={s.label}>{copy.niche.title}</p>
                  <div className={s.cards} role="list">
                    {niches.map((n, i) => (
                      <button
                        key={n}
                        type="button"
                        role="listitem"
                        className={cn(s.card, niche === n && s.on)}
                        style={{ "--i": i } as CSSProperties}
                        onClick={() => (n === "general" ? setNiche("general") : build(n))}
                        data-niche={n}
                      >
                        {copy.niches[n]}
                      </button>
                    ))}
                  </div>
                  {niche === "general" ? (
                    <form
                      className={s.row}
                      onSubmit={(e) => {
                        e.preventDefault();
                        build("general");
                      }}
                    >
                      <input className={cn(g.field, s.field)} value={what} onChange={(e) => setWhat(e.target.value)} placeholder={copy.niche.what} aria-label={copy.niche.whatHint} maxLength={120} autoFocus />
                      <button type="submit" className={cn(g.btn, g.primary)} disabled={what.trim().length < 2}>
                        {copy.niche.build}
                      </button>
                    </form>
                  ) : null}
                  {niche === "general" ? <p className={s.hint}>{copy.niche.whatHint}</p> : null}
                  <button type="button" className={s.link} onClick={() => setPhase(nosite ? "answers" : "address")}>
                    {copy.niche.back}
                  </button>
                </div>
              ) : null}

              {phase === "building" ? <Building copy={copy} step={step} info={info} typed={typed} /> : null}

              {phase === "done" && done ? (
                <Result
                  locale={locale}
                  copy={copy}
                  done={done}
                  has={has}
                  prices={prices}
                  botUrl={botUrl}
                  niche={niche}
                  site={nosite ? "" : address}
                />
              ) : null}

              {phase === "manual" && manual ? (
                <div className={s.step}>
                  <p className={s.say}>{fill(manual.why === "limit" ? copy.manual.limit : copy.manual.failed, { hours: manualHours })}</p>
                  <div className={s.caseRow}>
                    {manual.cases.map((c) => (
                      <Link key={c.href} href={c.href} className={cn(g.btn, g.ghost, g.small)}>
                        {c.name}
                      </Link>
                    ))}
                    <Link href={`/${locale}/cases`} className={cn(g.btn, g.ghost, g.small)}>
                      {copy.manual.all} <span aria-hidden="true">→</span>
                    </Link>
                  </div>
                  <Contact locale={locale} copy={copy} token={null} niche={niche} site={nosite ? "" : address} name={answers.name} botUrl={botUrl} />
                </div>
              ) : null}

              {phase === "error" ? (
                <div className={s.step}>
                  <p className={g.fail} role="alert">
                    {copy.error}
                  </p>
                  <button type="button" className={cn(g.btn, g.ghost, g.small)} onClick={() => setPhase("address")}>
                    {copy.niche.back}
                  </button>
                </div>
              ) : null}

              <p className={s.terms}>
                {copy.terms} <Link href={termsHref}>{copy.termsLink}</Link>.
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

/** Ход сборки: строка браузера, шаги сервера и то, что уже нашли на сайте. */
function Building({ copy, step, info, typed }: { copy: SiteInstantCopy; step: BuildStep | null; info: SiteInfo; typed: string }) {
  const at = step ? STEPS.indexOf(step) : -1;
  return (
    <div className={s.build} aria-live="polite">
      <div className={s.chrome}>
        <span className={s.dots} aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
        <span className={s.bar}>
          {typed || "devuz.studio"}
          <span className={s.caret} aria-hidden="true" />
        </span>
      </div>
      <div className={s.buildBody} style={{ "--c": info.color ?? "var(--green)" } as CSSProperties}>
        <div className={s.progress} aria-hidden="true">
          <span style={{ transform: `scaleX(${Math.max(0.04, (at + 1) / STEPS.length)})` }} />
        </div>
        <p className={s.buildTitle}>{copy.steps.title}</p>
        <ol className={s.steps}>
          {STEPS.map((k, i) => (
            <li key={k} className={cn(i < at && s.ok, i === at && s.now, i > at && s.wait)}>
              <span className={s.mark} aria-hidden="true" />
              {copy.steps[k]}
            </li>
          ))}
        </ol>
        {info.name ? (
          <div className={s.found}>
            <span className={s.swatch} aria-hidden="true" />
            <span>
              <small>{copy.steps.found}</small>
              <b>{info.name}</b>
            </span>
          </div>
        ) : null}
        {info.services?.length ? (
          <ul className={s.chips}>
            {info.services.map((v, i) => (
              <li key={v} style={{ "--i": i } as CSSProperties}>
                {v}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </div>
  );
}

/**
 * Готовый макет в окне. Показ: полосы цвета клиента уходят сверху вниз и
 * открывают страницу, она прокручивается к форме и подвалу, потом переход в
 * телефон. Видео DevUz в рамке не играет (сессионная отметка «видел»), а на
 * весь экран — играет: новая вкладка открывается без общей памяти сессии.
 */
function Result({ locale, copy, done, has, prices, botUrl, niche, site }: {
  locale: Locale;
  copy: SiteInstantCopy;
  done: Done;
  has: boolean;
  prices: { landing: number; landingOld: number; corp: number; corpOld: number };
  botUrl: string;
  niche: CircleNiche | null;
  site: string;
}) {
  const src = `/proto/${done.token}`;
  const wrap = useRef<HTMLDivElement>(null);
  const desk = useRef<HTMLIFrameElement>(null);
  const phone = useRef<HTMLIFrameElement>(null);
  const [width, setWidth] = useState(0);
  const [view, setView] = useState<"desk" | "phone">(() => (narrow() ? "phone" : "desk"));
  const [show, setShow] = useState<"cover" | "open">(() => (reduced() ? "open" : "cover"));
  const [run, setRun] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [left, setLeft] = useState("");

  // Рамка грузит только тот вид, который видно: второй открывается, когда до него дошли.
  const [mounted, setMounted] = useState(() => ({ desk: !narrow(), phone: narrow() }));
  useEffect(() => setMounted((m) => (m[view] ? m : { ...m, [view]: true })), [view]);

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setWidth(el.clientWidth));
    ro.observe(el);
    setWidth(el.clientWidth);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (!done.expires) return;
    const tick = () => {
      const ms = Math.max(0, Date.parse(done.expires as string) - Date.now());
      const [h, m] = UNITS[locale];
      setLeft(`${Math.floor(ms / 3600_000)} ${h} ${Math.floor((ms % 3600_000) / 60_000)} ${m}`);
    };
    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, [done.expires, locale]);

  // Постановка: ждём загрузку, открываем полосами, прокручиваем, переходим в телефон.
  useEffect(() => {
    if (!loaded || reduced()) {
      if (loaded) setShow("open");
      return;
    }
    let stop = false;
    (async () => {
      setShow("cover");
      await wait(250);
      if (stop) return;
      setShow("open");
      await wait(BANDS * 110 + 700);
      const frame = (view === "desk" ? desk : phone).current;
      const win = frame?.contentWindow;
      try {
        if (win && !stop) {
          const doc = win.document.documentElement;
          const bottom = Math.max(0, doc.scrollHeight - win.innerHeight);
          await glide(win, bottom * 0.55, 2600);
          await wait(500);
          if (!stop) await glide(win, bottom, 1800);
          await wait(900);
          if (!stop) await glide(win, 0, 1400);
        }
      } catch {
        /* чужой адрес в рамке — прокрутку пропускаем */
      }
      if (!stop && !narrow() && run === 0) {
        await wait(400);
        setView("phone");
      }
    })();
    return () => {
      stop = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- постановка запускается загрузкой и «ещё раз»
  }, [loaded, run]);

  const inner = Math.max(0, width - 2);
  const deskScale = inner ? inner / DESK.w : 0.5;
  const phoneScale = Math.min(1, (narrow() ? inner - 24 : Math.min(DESK.h * deskScale, 640)) / (narrow() ? PHONE.w : PHONE.h)) || 0.7;
  const vars = { landing: money(locale, prices.landing), landingOld: money(locale, prices.landingOld), corp: money(locale, prices.corp), corpOld: money(locale, prices.corpOld) };

  return (
    <div className={s.step}>
      {has ? <p className={s.say}>{copy.has}</p> : <p className={cn(g.serif, s.doneTitle)}>{fill(copy.done.title, { name: done.name })}</p>}
      <div className={s.chrome}>
        <span className={s.dots} aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
        <span className={s.bar}>devuz.studio/proto/…</span>
        <span className={s.tabs} role="tablist">
          <button type="button" role="tab" aria-selected={view === "desk"} className={cn(view === "desk" && s.tabOn)} onClick={() => setView("desk")}>
            {copy.done.desktop}
          </button>
          <button type="button" role="tab" aria-selected={view === "phone"} className={cn(view === "phone" && s.tabOn)} onClick={() => setView("phone")}>
            {copy.done.phone}
          </button>
        </span>
      </div>
      <div ref={wrap} className={s.stage} style={{ "--c": done.color ?? "var(--green)" } as CSSProperties} data-show={show} data-view={view}>
        <div className={s.deskView} aria-hidden={view !== "desk"}>
          {mounted.desk ? <Frame src={src} size={DESK} scale={deskScale} frameRef={desk} title={done.name} onLoad={() => !narrow() && setLoaded(true)} /> : null}
        </div>
        <div className={s.phoneView} aria-hidden={view !== "phone"}>
          <div className={s.phoneBody} style={{ width: PHONE.w * phoneScale + 16 }}>
            {mounted.phone ? <Frame src={src} size={PHONE} scale={phoneScale} frameRef={phone} title={done.name} onLoad={() => narrow() && setLoaded(true)} /> : null}
          </div>
        </div>
        <div className={s.cover} aria-hidden="true">
          {Array.from({ length: BANDS }, (_, i) => (
            <span key={i} style={{ "--i": i } as CSSProperties} />
          ))}
        </div>
      </div>

      <div className={s.actions}>
        <a href={src} target="_blank" rel="noopener noreferrer" className={cn(g.btn, g.primary, g.small)} data-goal="maket_full">
          {copy.done.full} <span aria-hidden="true">↗</span>
        </a>
        <a href={`${src}/kp`} target="_blank" rel="noopener noreferrer" className={cn(g.btn, g.ghost, g.small)}>
          {copy.done.kp}
        </a>
        {done.admin ? (
          <a href={`${src}/admin`} target="_blank" rel="noopener noreferrer" className={cn(g.btn, g.ghost, g.small)}>
            {copy.done.admin}
          </a>
        ) : null}
        {!reduced() ? (
          <button
            type="button"
            className={s.link}
            onClick={() => {
              setView(narrow() ? "phone" : "desk");
              setRun((x) => x + 1);
            }}
          >
            {copy.done.again}
          </button>
        ) : null}
      </div>
      <p className={s.hint}>{copy.done.note}</p>

      {done.expires ? (
        <div className={s.offer}>
          <p>
            {fill(copy.offer.text, vars)} <b className={s.left}>{fill(copy.offer.left, { time: left })}</b>
          </p>
          {done.addons.length ? (
            <>
              <p className={s.label}>{copy.offer.addons}</p>
              <ul className={s.addons}>
                {done.addons.map((a) => (
                  <li key={a.name}>
                    <span>{a.name}</span>
                    <b>{money(locale, a.price)}</b>
                  </li>
                ))}
              </ul>
            </>
          ) : null}
        </div>
      ) : null}

      <Contact locale={locale} copy={copy} token={done.token} niche={niche} site={site} name={done.name} botUrl={botUrl} />
    </div>
  );
}

/** «Связаться»: Telegram или телефон — лид тем же путём, что у бота (/api/instant/contact). */
function Contact({ locale, copy, token, niche, site, name, botUrl }: { locale: Locale; copy: SiteInstantCopy; token: string | null; niche: CircleNiche | null; site: string; name: string; botUrl: string }) {
  const [value, setValue] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "failed" | "bad">("idle");
  const trap = useRef<HTMLInputElement>(null);
  async function send(e: React.FormEvent) {
    e.preventDefault();
    const v = value.trim();
    if (!/^@?[A-Za-z][A-Za-z0-9_]{4,31}$/.test(v) && !/t\.me\//i.test(v) && v.replace(/\D/g, "").length < 9) {
      setState("bad");
      return;
    }
    setState("sending");
    try {
      const r = await fetch("/api/instant/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, contact: v, niche, site, name, locale, hp: trap.current?.value ?? "" }),
      });
      if (!r.ok) throw new Error(String(r.status));
      goal("lead_form");
      setState("sent");
    } catch {
      setState("failed");
    }
  }
  return (
    <form className={s.contact} onSubmit={send}>
      <p className={cn(g.serif, s.contactTitle)}>{copy.contact.title}</p>
      <p className={s.hint}>{copy.contact.text}</p>
      <input ref={trap} className={g.trap} name="url" tabIndex={-1} autoComplete="off" aria-hidden="true" />
      {state === "sent" ? (
        <p className={g.done} role="status">
          {copy.contact.sent}
        </p>
      ) : (
        <div className={s.row}>
          <input className={cn(g.field, s.field)} value={value} onChange={(e) => setValue(e.target.value)} placeholder={copy.contact.placeholder} aria-label={copy.contact.placeholder} maxLength={120} autoComplete="tel" />
          <button type="submit" className={cn(g.btn, g.primary)} disabled={state === "sending"}>
            {state === "sending" ? copy.contact.sending : copy.contact.send}
          </button>
        </div>
      )}
      {state === "bad" ? (
        <p className={g.fail} role="alert">
          {copy.contact.bad}
        </p>
      ) : null}
      {state === "failed" ? (
        <p className={g.fail} role="alert">
          <a href={botUrl} target="_blank" rel="noopener noreferrer">
            {copy.contact.failed}
          </a>
        </p>
      ) : null}
    </form>
  );
}
