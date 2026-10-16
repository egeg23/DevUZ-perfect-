"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { myContactAction } from "@/app/admin/hq/actions";
import { mockupCodeAction } from "@/app/admin/mockups/actions";
import { CopyMessage } from "@/components/admin/copy-message";
import { usePanelDict } from "@/components/admin/panel-locale";
import { hqDict } from "@/content/admin-panel/hq";
import { hqMyDict } from "@/content/admin-panel/hq-my";
import { mockupsDict } from "@/content/admin-panel/mockups";
import type { CodeResult } from "@/lib/admin/mockups-store";

/**
 * Клиентские кусочки «Главной» менеджера (components/admin/hq-my.tsx):
 * обратный отсчёт предложения, «Связаться» в одно нажатие и пароль к
 * макету. Всё остальное на странице — серверное: формы статуса работают и
 * без скрипта.
 */

/** Сколько осталось — тикает сам, раз в 15 секунд: предложение живёт полчаса. */
export function Countdown({ until, now }: { until: string; now: string }) {
  const t = usePanelDict(hqDict);
  const [at, setAt] = useState(() => new Date(now));
  useEffect(() => {
    setAt(new Date());
    const timer = window.setInterval(() => setAt(new Date()), 15_000);
    return () => window.clearInterval(timer);
  }, []);
  // Своя арифметика, а не untilOf из lib/admin/hq-my: та тянет за собой
  // серверные модули, а здесь браузер.
  const total = Math.max(0, Math.floor((Date.parse(until) - at.getTime()) / 60_000));
  const left = { h: Math.floor(total / 60), m: total % 60 };
  return (
    <span className="font-mono tabular-nums" suppressHydrationWarning>
      {t.left(left.h, left.m)}
    </span>
  );
}

const PILL =
  "inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl px-3.5 text-sm font-medium transition disabled:cursor-progress";

/**
 * «Связаться»: контакт открывается тем же путём, что «Показать контакт» в
 * карточке (с журналом), и сразу ведёт в Telegram, звонок или почту.
 * Ссылки нет (контакт без формата) — показываем сам контакт.
 */
export function ContactButton({ leadId, channel }: { leadId: string; channel: string | null }) {
  const t = usePanelDict(hqMyDict);
  const [busy, setBusy] = useState(false);
  const [shown, setShown] = useState<string | null>(null);
  const label = channel === "phone" ? t.call : channel === "email" ? t.mail : channel === "telegram" ? t.write : t.contact;
  const icon = channel === "phone" ? "📞" : channel === "email" ? "✉️" : "💬";
  return (
    <span className="inline-flex flex-col items-start">
      <button
        type="button"
        disabled={busy}
        aria-busy={busy}
        title={t.contactLogged}
        onClick={async () => {
          setBusy(true);
          try {
            const open = await myContactAction(leadId);
            if (open?.url) window.location.assign(open.url);
            else setShown(open?.label ?? t.contactNoLink);
          } catch {
            setShown(t.contactNoLink);
          } finally {
            setBusy(false);
          }
        }}
        className={`${PILL} ${busy ? "bg-line/60 text-muted" : "bg-green/90 text-ink hover:bg-green"}`}
      >
        <span aria-hidden="true">{icon}</span>
        {busy ? t.opening : label}
      </button>
      {shown ? <span className="mt-1 select-all break-all font-mono text-xs text-green">{shown}</span> : null}
    </span>
  );
}

/** «🔑 Сгенерировать пароль» — тем же mockupCodeAction, что в «Макетах»; пароль показывается один раз. */
export function MockupPassword({ mockupRef, name, open }: { mockupRef: string; name: string; open: boolean }) {
  const t = usePanelDict(mockupsDict);
  const my = usePanelDict(hqMyDict);
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<CodeResult | null>(null);
  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        disabled={busy}
        aria-busy={busy}
        onClick={async () => {
          if (open && !window.confirm(t.confirmClose(name))) return;
          setBusy(true);
          try {
            const r = await mockupCodeAction(mockupRef);
            setResult(r);
            if (r.ok) router.refresh();
          } catch {
            setResult({ ok: false, reason: "offline" });
          } finally {
            setBusy(false);
          }
        }}
        className={`${PILL} border border-line ${busy ? "bg-line/60 text-muted" : "bg-surface-2 text-text hover:border-green/40 hover:text-green"}`}
      >
        <span aria-hidden="true">🔑</span>
        {busy ? t.busy : t.generate}
      </button>
      {result?.ok ? (
        <div className="flex flex-wrap items-center gap-2 rounded-xl bg-green/5 px-3 py-2">
          <span className="font-mono text-xl tracking-[0.3em] text-green">{result.code}</span>
          <span className="text-xs text-muted">{t.validUntil(result.until)}</span>
          <CopyMessage text={result.message} label={t.copyMessage} />
          <CopyMessage text={result.code} label={t.copyCode} />
        </div>
      ) : result ? (
        <p className="text-xs text-gold">{my.passwordFailed}</p>
      ) : null}
    </div>
  );
}
