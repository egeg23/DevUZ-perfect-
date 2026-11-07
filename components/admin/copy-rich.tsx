"use client";

import { useState } from "react";

/**
 * Копирование статьи для редактора площадки.
 *
 * С `html` в буфер уходят обе версии: редакторы vc.ru и Дзена берут HTML и
 * сохраняют подзаголовки, списки и ссылки, как при копировании со страницы;
 * поле, которое HTML не понимает, возьмёт простой текст. Без `html` — только
 * текст. Браузер без ClipboardItem (старый Safari) получает простой текст.
 */
export function CopyRich({
  text,
  html,
  label,
  done,
  primary = false,
}: {
  text: string;
  html?: string;
  label: string;
  done: string;
  primary?: boolean;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      if (html && typeof ClipboardItem !== "undefined" && navigator.clipboard?.write) {
        await navigator.clipboard.write([
          new ClipboardItem({
            "text/html": new Blob([html], { type: "text/html" }),
            "text/plain": new Blob([text], { type: "text/plain" }),
          }),
        ]);
      } else {
        await navigator.clipboard.writeText(text);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      className={
        primary
          ? "rounded-lg bg-green px-3 py-1.5 text-xs font-semibold text-ink transition hover:opacity-90"
          : "rounded-lg border border-line px-3 py-1.5 text-xs text-muted transition hover:text-text"
      }
    >
      {copied ? done : label}
    </button>
  );
}
