"use client";

/**
 * Кнопка печати.
 *
 * Единственная причина, по которой на странице заказа вообще есть клиентский
 * код: window.print() из серверного компонента не вызвать. Всё остальное на
 * странице — разметка, и это правильно: покупатель открывает её один раз, с
 * телефона, часто по плохой связи.
 */
export function PrintButton({ label }: { label: string }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="no-print rounded-xl border border-line bg-surface-2 px-4 py-2 text-sm text-muted transition hover:border-green/40 hover:text-text"
    >
      {label}
    </button>
  );
}
