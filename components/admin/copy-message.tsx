"use client";

import { useState } from "react";

import { usePanelDict } from "@/components/admin/panel-locale";
import { panelButtonsDict } from "@/content/admin-panel/lead-card";

/**
 * Копирование готового текста.
 *
 * Отдельный клиентский компонент ради одной кнопки: список касаний —
 * серверный, и превращать его целиком в клиентский ради буфера обмена
 * значило бы тащить в браузер все находки и контакты всех сайтов.
 */
export function CopyMessage({ text, label }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const t = usePanelDict(panelButtonsDict);

  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard?.writeText(text).then(
          () => setCopied(true),
          () => setCopied(false),
        );
      }}
      className="rounded-lg border border-line px-3 py-1.5 text-xs text-muted transition hover:text-text"
    >
      {copied ? t.copied : (label ?? t.copy)}
    </button>
  );
}
