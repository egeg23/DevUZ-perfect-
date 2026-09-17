"use client";

import { useState } from "react";

/**
 * Копирование готового текста.
 *
 * Отдельный клиентский компонент ради одной кнопки: список касаний —
 * серверный, и превращать его целиком в клиентский ради буфера обмена
 * значило бы тащить в браузер все находки и контакты всех сайтов.
 */
export function CopyMessage({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

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
      {copied ? "Скопировано" : "Скопировать текст"}
    </button>
  );
}
