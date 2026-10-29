"use client";

import { useRef, useState } from "react";

import { usePanelDict } from "@/components/admin/panel-locale";
import { contractComposeDict } from "@/content/admin-panel/contract-compose";
import { FIELD_OF, detailsOf, missingOf, parseRequisites } from "@/lib/admin/requisites-parse";

/**
 * «Вставить реквизиты»: текст клиента → поля этой же формы. Разбор —
 * регулярными выражениями (lib/admin/requisites-parse.ts), без модели.
 * Найденное перезаписывает поле, ненайденное не трогается и называется
 * строкой ниже: человек его дописывает. Текст уходит и на сервер
 * (`requisites`): пустые поля сервер заполнит тем же разбором.
 */
export function RequisitesPaste({ light = false }: { light?: boolean }) {
  const t = usePanelDict(contractComposeDict);
  const box = useRef<HTMLTextAreaElement>(null);
  const [said, setSaid] = useState("");

  function spread() {
    const form = box.current?.form;
    if (!form || !box.current) return;
    const got = parseRequisites(box.current.value);
    const set = (name: string, value: string) => {
      const input = form.elements.namedItem(name);
      if (value && input instanceof HTMLInputElement) input.value = value;
      return value ? 1 : 0;
    };
    let found = 0;
    for (const [key, name] of Object.entries(FIELD_OF)) found += set(name, got[key as keyof typeof FIELD_OF]);
    found += set("client_details", detailsOf(got));
    const missing = missingOf(got).map((k) => t[`f_${k}`]);
    setSaid(`${t.pasteFound(found)} ${missing.length ? t.pasteMissing(missing.join(", ")) : t.pasteAll}`);
  }

  return (
    <div className="flex flex-col gap-2">
      <label className={light ? "text-sm text-black/70" : "text-xs text-muted"}>
        {t.pasteTitle}
        <textarea
          ref={box}
          name="requisites"
          rows={5}
          placeholder={t.pastePh}
          className={
            light
              ? "mt-1 w-full rounded-lg border border-black/20 px-2 py-1 text-sm"
              : "mt-1 w-full rounded-lg border border-line bg-surface-2 px-3 py-2 text-sm text-text"
          }
        />
      </label>
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={spread}
          className={
            light
              ? "rounded-lg border border-black/30 px-3 py-1.5 text-sm"
              : "rounded-lg border border-line bg-surface-2 px-3 py-1.5 text-xs transition hover:border-green/40 hover:text-green"
          }
        >
          {t.pasteBtn}
        </button>
        {said ? <span aria-live="polite" className={light ? "text-xs text-black/60" : "text-xs text-muted"}>{said}</span> : null}
      </div>
    </div>
  );
}
