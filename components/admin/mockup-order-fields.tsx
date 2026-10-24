"use client";

import { useEffect, useRef, useState } from "react";

import { usePanelDict } from "@/components/admin/panel-locale";
import { useFindHits } from "@/components/admin/use-find-hits";
import { tasksDict } from "@/content/admin-panel/tasks";
import type { FindHit } from "@/lib/admin/find";
import { pick, type PanelLocale, type Picked } from "@/lib/admin/i18n";

/**
 * «Заказ макета» в форме «Поставить задачу» (lib/admin/mockup-order.ts).
 *
 * Владелец, 23.10.2026: «может сделать обязательное поле: МАКЕТ (да/нет)?…
 * Если нажимает — да, значит он ответственный за работу по этому макету с
 * клиентом». Обязателен, когда отмечен тот, кто собирает макеты
 * (`makerIds`): галочки «Кому» слушаем у формы и ставим `required` у «Да» /
 * «Нет». Сервер проверяет то же самое (orderProblem) — без скрипта форма не
 * обходит правило.
 *
 * «Да» — клиент поиском, тем же, что Ctrl+K (лиды в круге человека,
 * касания тем, кому открыт раздел), и сайт: у касания он подставляется сам.
 */
export function MockupOrderFields({ makerIds, locale }: { makerIds: string[]; locale?: PanelLocale }) {
  // Язык — из каркаса панели; серверная страница может передать его сама.
  const fromShell = usePanelDict(tasksDict);
  const t = locale ? pick(tasksDict, locale) : fromShell;
  const box = useRef<HTMLFieldSetElement>(null);
  const [required, setRequired] = useState(false);
  const [answer, setAnswer] = useState<"" | "yes" | "no">("");

  // Отмечен ли среди «Кому» тот, кто собирает макеты.
  useEffect(() => {
    const form = box.current?.form;
    if (!form) return;
    const makers = new Set(makerIds);
    const check = () => {
      const picked = [...form.querySelectorAll<HTMLInputElement>('input[name="assignee"]:checked')].map((i) => i.value);
      setRequired(picked.some((id) => makers.has(id)));
    };
    check();
    form.addEventListener("change", check);
    return () => form.removeEventListener("change", check);
  }, [makerIds]);

  return (
    <fieldset ref={box} className="grid min-w-0 gap-2 text-xs text-muted" data-mockup-order>
      <legend className="mb-1">
        {t.mockupQ} <span className={required ? "text-gold" : "text-faint"}>({required ? t.mockupRequired : t.mockupOptional})</span>
      </legend>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-text">
        {(
          [
            ["yes", t.mockupYes],
            ["no", t.mockupNo],
          ] as const
        ).map(([value, label]) => (
          <label key={value} className="flex items-center gap-1.5">
            <input
              type="radio"
              name="mockup"
              value={value}
              required={required}
              checked={answer === value}
              onChange={() => setAnswer(value)}
            />
            {label}
          </label>
        ))}
      </div>
      <span className="text-faint">{t.mockupHint}</span>
      {answer === "yes" ? <OrderClient t={t} /> : null}
    </fieldset>
  );
}

/** Клиент заказа поиском и сайт. Выбранный — в скрытых полях формы. */
function OrderClient({ t }: { t: Picked<typeof tasksDict> }) {
  const [query, setQuery] = useState("");
  const [picked, setPicked] = useState<FindHit | null>(null);
  const [site, setSite] = useState("");
  const hits = useFindHits(picked ? "" : query);
  const options = hits.list.filter((hit) => (hit.kind === "lead" || hit.kind === "prospect") && hit.id);

  const pick = (hit: FindHit) => {
    setPicked(hit);
    if (hit.site && !site) setSite(hit.site);
  };

  return (
    <div className="grid min-w-0 gap-2">
      <label className="grid min-w-0 gap-1">
        {t.mockupClient}
        {picked ? (
          <span className="flex min-w-0 flex-wrap items-center gap-2 rounded-lg border border-green/40 bg-green/5 px-3 py-2 text-sm text-text">
            <span className="truncate">{picked.label}</span>
            <span className="text-xs text-faint">{picked.kind === "lead" ? t.mockupKindLead : t.mockupKindProspect}</span>
            <button type="button" onClick={() => setPicked(null)} className="ml-auto text-xs text-green hover:underline">
              {t.mockupChange}
            </button>
          </span>
        ) : (
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t.mockupClientPh}
            autoComplete="off"
            required
            className="w-full min-w-0 rounded-lg border border-line bg-ink px-3 py-2 text-sm text-text"
          />
        )}
      </label>
      {picked ? (
        <input type="hidden" name={picked.kind === "lead" ? "mockup_lead" : "mockup_prospect"} value={picked.id} />
      ) : query.trim().length >= 2 ? (
        <ul className="grid gap-1" data-mockup-hits>
          {hits.loading ? <li className="text-faint">{t.mockupSearching}</li> : null}
          {!hits.loading && !options.length ? <li className="text-faint">{t.mockupNothing}</li> : null}
          {options.map((hit) => (
            <li key={`${hit.kind}:${hit.id}`}>
              <button
                type="button"
                onClick={() => pick(hit)}
                className="block w-full min-w-0 rounded-lg border border-line bg-ink px-3 py-1.5 text-left text-sm text-text hover:border-green/40"
              >
                <span className="block truncate">{hit.label}</span>
                <span className="block truncate text-xs text-faint">
                  {hit.kind === "lead" ? t.mockupKindLead : t.mockupKindProspect}
                  {hit.meta ? ` · ${hit.meta}` : ""}
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      <label className="grid min-w-0 gap-1">
        {t.mockupSite}
        <input
          name="mockup_site"
          value={site}
          onChange={(event) => setSite(event.target.value)}
          required
          maxLength={200}
          placeholder="tirex.uz"
          className="w-full min-w-0 rounded-lg border border-line bg-ink px-3 py-2 text-sm text-text"
        />
      </label>
    </div>
  );
}
