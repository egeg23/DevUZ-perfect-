"use client";

/**
 * Кнопка, которая открывает чат-виджет с готовым текстом — тем же событием
 * `devuz:prefill`, что калькулятор, аудитор и «обсудить покупку»
 * (components/chat/chat-widget.tsx). Текст не уходит сам: человек дописывает,
 * что ему нужно, и отправляет.
 */
export function PrefillButton({ label, message, className }: { label: string; message: string; className?: string }) {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new CustomEvent("devuz:prefill", { detail: message }))}
      className={className}
    >
      {label}
    </button>
  );
}
