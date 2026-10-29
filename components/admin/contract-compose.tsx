"use client";

import { useMemo, useState } from "react";

import { usePanelDict, usePanelLocale } from "@/components/admin/panel-locale";
import { contractComposeDict } from "@/content/admin-panel/contract-compose";
import { PANEL_INTL } from "@/lib/admin/i18n";

/**
 * «Состав из макета» — поля внутри формы договора (карточка проекта и
 * черновик). Здесь только выбор и живая сумма; смету, предмет и срок
 * собирает сервер тем же compose() (lib/admin/mockup-plan.ts) по `plan`,
 * `addon` и `extra_*`. Описаний допов здесь нет: в браузер — только то,
 * что нужно для выбора. Отсюда же нельзя импортировать lib/admin/mockup-plan:
 * он тянет весь content/mockup-plans.json в браузер — число своих строк
 * приходит пропсом.
 */
export type PlanChoice = {
  id: string;
  title: string;
  price: number;
  weeks: number | null;
  addons: { id: string; title: string; price: number; star: boolean }[];
};

const FIELD = "rounded-lg border border-line bg-surface-2 px-3 py-2 text-sm text-text";

export function ContractCompose({ plans, rows, light = false }: { plans: PlanChoice[]; rows: number; light?: boolean }) {
  const t = usePanelDict(contractComposeDict);
  const locale = usePanelLocale();
  const [planId, setPlanId] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  const [extras, setExtras] = useState(() => Array.from({ length: rows }, () => ({ title: "", price: "" })));
  const plan = plans.find((p) => p.id === planId) ?? null;
  const field = light ? "rounded-lg border border-black/20 px-2 py-1 text-sm" : FIELD;
  const fmt = (n: number) => n.toLocaleString(PANEL_INTL[locale]);

  const total = useMemo(() => {
    if (!plan) return 0;
    const addons = plan.addons.filter((a) => picked.includes(a.id)).reduce((s, a) => s + a.price, 0);
    const own = extras.reduce((s, e) => {
      const n = Number(e.price.replace(",", "."));
      return e.title.trim() && Number.isFinite(n) && n > 0 ? s + n : s;
    }, 0);
    return Math.round((plan.price + addons + own) * 100) / 100;
  }, [plan, picked, extras]);

  return (
    <div className="flex flex-col gap-2 text-sm">
      <label className={light ? "text-black/70" : "text-xs text-muted"}>
        {t.plan}
        <select
          name="plan"
          value={planId}
          onChange={(e) => {
            const next = plans.find((p) => p.id === e.target.value);
            setPlanId(e.target.value);
            setPicked(next ? next.addons.filter((a) => a.star).map((a) => a.id) : []);
          }}
          className={`mt-1 block w-full ${field}`}
        >
          <option value="">{t.none}</option>
          {plans.map((p) => (
            <option key={p.id} value={p.id}>
              {p.title} — ${fmt(p.price)}
            </option>
          ))}
        </select>
      </label>

      {plan ? (
        <>
          <p className={light ? "text-black/70" : "text-muted"}>
            {t.base}: {plan.title} — ${fmt(plan.price)}
            {plan.weeks ? ` · ${t.weeks(plan.weeks)}` : ""}
          </p>
          <fieldset>
            <legend className={light ? "text-black/70" : "text-xs text-muted"}>{t.addons}</legend>
            <ul className="mt-1 flex flex-col gap-1">
              {plan.addons.map((a) => (
                <li key={a.id}>
                  <label className="flex items-start gap-2">
                    <input
                      type="checkbox"
                      name="addon"
                      value={a.id}
                      checked={picked.includes(a.id)}
                      onChange={(e) =>
                        setPicked((cur) => (e.target.checked ? [...cur, a.id] : cur.filter((x) => x !== a.id)))
                      }
                      className="mt-1"
                    />
                    <span>
                      {a.star ? "★ " : ""}
                      {a.title} — ${fmt(a.price)}
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          </fieldset>
          <fieldset>
            <legend className={light ? "text-black/70" : "text-xs text-muted"}>{t.extras}</legend>
            {extras.map((row, i) => (
              <div key={i} className="mt-1 grid grid-cols-[1fr_7rem] gap-2">
                <input
                  name="extra_title"
                  placeholder={t.extraTitle}
                  value={row.title}
                  onChange={(e) => setExtras((cur) => cur.map((r, j) => (j === i ? { ...r, title: e.target.value } : r)))}
                  className={field}
                />
                <input
                  name="extra_price"
                  inputMode="decimal"
                  placeholder={t.extraPrice}
                  value={row.price}
                  onChange={(e) => setExtras((cur) => cur.map((r, j) => (j === i ? { ...r, price: e.target.value } : r)))}
                  className={field}
                />
              </div>
            ))}
          </fieldset>
          <p className="font-semibold">{t.total(fmt(total))}</p>
        </>
      ) : null}
    </div>
  );
}
