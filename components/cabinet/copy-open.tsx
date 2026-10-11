"use client";

import { useState } from "react";

/**
 * «Скопировать и открыть Direct» в кабинете клиента: текст — в буфер,
 * следом открывается переписка с блогером в Instagram (ig.me/m/<ник>).
 * Подписи приходят из словаря кабинета (content/ai-staff/cabinet.ts).
 */
export function CopyOpen({ text, url, label, done }: { text: string; url: string; label: string; done: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        const open = () => window.open(url, "_blank", "noopener");
        navigator.clipboard?.writeText(text).then(() => {
          setCopied(true);
          open();
        }, open);
      }}
      className="rounded-md bg-green-dim px-3 py-1.5 text-sm font-medium text-ink hover:bg-green"
    >
      {copied ? done : label}
    </button>
  );
}
