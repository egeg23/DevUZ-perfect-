"use client";

/** «Скачать PDF» — печать браузера: там есть «Сохранить как PDF», и файл собирает сам браузер. */
export function PrintButton({ label }: { label: string }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="rounded-xl bg-green px-5 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-white"
    >
      {label}
    </button>
  );
}
