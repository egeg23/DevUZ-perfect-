"use client";

/**
 * Кнопка «обсудить покупку».
 *
 * Не форма и не корзина: у нас ручная оплата по счёту, и первый шаг здесь —
 * разговор, а не заказ. Передаёт в чат-виджет название продукта и цену тем же
 * событием, что калькулятор и аудитор, — менеджер сразу видит, о чём речь.
 */
export function ProductInquiry({
  label,
  product,
  price,
}: {
  label: string;
  product: string;
  price: string;
}) {
  return (
    <button
      type="button"
      onClick={() =>
        window.dispatchEvent(
          new CustomEvent("devuz:prefill", { detail: `${product} — ${price}` }),
        )
      }
      className="rounded-xl bg-green px-7 py-4 font-semibold text-ink transition-colors hover:bg-white"
    >
      {label}
    </button>
  );
}
